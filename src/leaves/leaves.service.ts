import { Injectable, HttpException, HttpStatus, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Leave, LeaveSlotInfo, LeaveStatus } from '../shared/types';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { startOfWeek, parseISO } from 'date-fns';
import { BOOKING_CONSTANTS } from '../shared/constants';

@Injectable()
export class LeavesService {
  constructor(
    private prisma: PrismaService,
  ) { }

  async create(leaveData: CreateLeaveDto, requestingUser?: any): Promise<Leave> {
    // Load user from DB (or use the one passed from the guard)
    const user = requestingUser ?? await (this.prisma as any).user.findUnique({
      where: { id: leaveData.userId },
    });

    if (!user) {
      throw new HttpException('Invalid user', HttpStatus.BAD_REQUEST);
    }

    // === VALIDATION 1: User must be ACTIVE ===
    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException('Your account is not active. Please contact an administrator.');
    }

    const date = new Date(leaveData.date + 'T00:00:00Z');

    // === VALIDATION 2: Date must not be a disabled day or a blocked date ===
    const configData = await (this.prisma as any).config.findFirstOrThrow();
    const disabledDays: number[] = configData.disabledDays || [];
    const blockedDates: string[] = configData.blockedDates || [];
    const dateStr = date.toISOString().split('T')[0];

    if (blockedDates.includes(dateStr)) {
      throw new HttpException(
        'This specific date is blocked for leave applications',
        HttpStatus.BAD_REQUEST,
      );
    }

    const dayOfWeek = date.getUTCDay(); // 0=Sunday, 6=Saturday
    if (disabledDays.includes(dayOfWeek)) {
      throw new HttpException(
        'Leave applications are not allowed on this day of the week',
        HttpStatus.BAD_REQUEST,
      );
    }

    // === VALIDATION 3: Date must be within allowed booking window ===
    const now = new Date();
    const istNow = new Date(now.getTime() + BOOKING_CONSTANTS.IST_OFFSET_MS);

    const day = istNow.getUTCDay(); // 0=Sunday (in IST)
    const hour = istNow.getUTCHours(); // (in IST)
    const minute = istNow.getUTCMinutes(); // (in IST)

    const openingDay = configData.openingDay ?? BOOKING_CONSTANTS.WEEKLY_RESET_DAY;
    const openingTime = configData.openingTime ?? BOOKING_CONSTANTS.WEEKLY_RESET_TIME;
    const [resetHour, resetMinute] = openingTime.split(':').map(Number);

    let virtualToday = new Date(istNow);
    if (day === openingDay && (hour < resetHour || (hour === resetHour && minute < resetMinute))) {
      // It's the opening day before the opening time, stay on previous day's schedule
      virtualToday.setUTCDate(virtualToday.getUTCDate() - 1);
    }

    // Normalize to start of day (using the virtual IST date)
    const today = new Date(Date.UTC(virtualToday.getUTCFullYear(), virtualToday.getUTCMonth(), virtualToday.getUTCDate()));

    if (date < today) {
      throw new HttpException('Cannot apply for leave on a past date', HttpStatus.BAD_REQUEST);
    }

    // === VALIDATION 3.1: Configurable notice period (unless Admin) ===
    const isAdmin = requestingUser?.role === 'ADMIN';
    const minNoticeDays = configData.minNoticeDays ?? BOOKING_CONSTANTS.MIN_NOTICE_DAYS;
    if (!isAdmin) {
      const minDate = new Date(today.getTime());
      minDate.setUTCDate(minDate.getUTCDate() + minNoticeDays);
      if (date < minDate) {
         throw new HttpException(`Leave must be applied with at least ${minNoticeDays} days notice.`, HttpStatus.BAD_REQUEST);
      }
    }

    const currentDayOfWeek = today.getUTCDay();
    const maxDate = new Date(today.getTime());

    const daysToNextSunday = (7 - currentDayOfWeek) % 7;

    switch (configData.weekRange) {
      case '1_WEEK':
        maxDate.setUTCDate(today.getUTCDate() + daysToNextSunday);
        break;
      case '2_WEEKS':
        maxDate.setUTCDate(today.getUTCDate() + daysToNextSunday + 7);
        break;
      case '1_MONTH':
        // Calendar-wise end of month
        const nextMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0));
        maxDate.setTime(nextMonth.getTime());
        break;
      default:
        maxDate.setUTCDate(today.getUTCDate() + daysToNextSunday);
    }

    if (date > maxDate) {
      throw new HttpException(
        'Leave can only be applied within the allowed booking window based on the configuration.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // === VALIDATION 4: User must have an assigned shift for the week of the leave date ===
    const weekStart = startOfWeek(parseISO(leaveData.date), { weekStartsOn: 1 });
    const userShift = await (this.prisma as any).userShift.findUnique({
      where: {
        userId_startDate: {
          userId: leaveData.userId,
          startDate: weekStart,
        },
      },
      include: { shift: true },
    });

    if (!userShift) {
      throw new HttpException(
        'You do not have an assigned shift for this week. Please contact your manager.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // === VALIDATION 5: Requested shiftId must match user's assigned shift ===
    if (userShift.shiftId !== leaveData.shiftId) {
      throw new HttpException(
        `Your assigned shift for this week is "${userShift.shift.name}". Please apply for leave under the correct shift.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const shift = userShift.shift;

    // === Check: user must not already have a leave on this date ===
    const existingLeave = await (this.prisma as any).leave.findFirst({
      where: {
        userId: leaveData.userId,
        date: date,
        status: { in: ['PENDING', 'APPROVED'] },
      },
    });

    if (existingLeave) {
      throw new HttpException(
        'You already have a leave request for this date',
        HttpStatus.BAD_REQUEST,
      );
    }

    // === Check available slots for the date and shift ===
    const approvedLeavesCount = await (this.prisma as any).leave.count({
      where: {
        date: date,
        shiftId: leaveData.shiftId,
        status: { in: ['PENDING', 'APPROVED'] },
      },
    });

    const availableSlots = shift.slots - approvedLeavesCount;
    if (availableSlots <= 0) {
      throw new HttpException(
        'No available slots for this date and shift',
        HttpStatus.BAD_REQUEST,
      );
    }

    // === Create the leave request ===
    const newLeave = await (this.prisma as any).leave.create({
      data: {
        date,
        userId: leaveData.userId,
        shiftId: leaveData.shiftId,
        status: (leaveData.status as any) || 'PENDING',
        creatorId: leaveData.creatorId,
      },
    });

    return {
      ...newLeave,
      date: newLeave.date.toISOString().split('T')[0],
      userName: user.name,
      userMobile: user.mobile,
      shiftName: shift.name,
      creatorId: newLeave.creatorId,
    };
  }



  async findAll(): Promise<Leave[]> {
    // FIX: Property 'leave' does not exist on type 'PrismaService'. Cast to any to fix type issue.
    const leaves = await (this.prisma as any).leave.findMany({
      include: { user: true, shift: true },
      orderBy: { createdAt: 'desc' },
    });

    return leaves.map((l) => ({
      ...l,
      date: l.date.toISOString().split('T')[0],
      createdAt: l.createdAt.toISOString(),
      userName: l.user.name,
      shiftName: l.shift.name,
    }));
  }

  async findForUser(userId: string): Promise<Leave[]> {
    // FIX: Property 'leave' does not exist on type 'PrismaService'. Cast to any to fix type issue.
    const leaves = await (this.prisma as any).leave.findMany({
      where: { userId },
      include: { shift: true, user: true },
      orderBy: { createdAt: 'desc' },
    });

    return leaves.map((l) => ({
      ...l,
      date: l.date.toISOString().split('T')[0],
      createdAt: l.createdAt.toISOString(),
      userName: l.user.name,
      shiftName: l.shift.name,
      creatorId: l.creatorId,
    }));
  }

  async updateStatus(
    leaveId: string,
    status: LeaveStatus.APPROVED | LeaveStatus.REJECTED,
    reason?: string,
  ): Promise<Leave> {
    try {
      // FIX: Property 'leave' does not exist on type 'PrismaService'. Cast to any to fix type issue.
      const updatedLeave = await (this.prisma as any).leave.update({
        where: { id: leaveId },
        data: { status, reason },
        include: { user: true, shift: true },
      });
      const formattedLeave = {
        ...updatedLeave,
        date: updatedLeave.date.toISOString().split('T')[0],
        createdAt: updatedLeave.createdAt.toISOString(),
        userName: updatedLeave.user.name,
        userMobile: updatedLeave.user.mobile,
        shiftName: updatedLeave.shift.name,
      };



      return formattedLeave;
    } catch (e) {
      throw new HttpException('Leave not found', HttpStatus.NOT_FOUND);
    }
  }

  async updateMultipleStatuses(
    leaveIds: string[],
    status: LeaveStatus.APPROVED | LeaveStatus.REJECTED,
  ): Promise<Leave[]> {
    // FIX: Property 'leave' does not exist on type 'PrismaService'. Cast to any to fix type issue.
    const result = await (this.prisma as any).leave.updateMany({
      where: {
        id: { in: leaveIds },
        status: 'PENDING',
      },
      data: { status },
    });

    if (result.count === 0) {
      throw new HttpException(
        'No pending leaves found for the provided IDs to update.',
        HttpStatus.NOT_FOUND,
      );
    }

    // FIX: Property 'leave' does not exist on type 'PrismaService'. Cast to any to fix type issue.
    const updatedLeaves = await (this.prisma as any).leave.findMany({
      where: { id: { in: leaveIds } },
      include: { user: true, shift: true },
    });

    const formattedLeaves = updatedLeaves.map((l) => ({
      ...l,
      date: l.date.toISOString().split('T')[0],
      createdAt: l.createdAt.toISOString(),
      userName: l.user.name,
      shiftName: l.shift.name,
    }));



    return formattedLeaves;
  }

  async remove(leaveId: string): Promise<Leave> {
    try {
      // FIX: Property 'leave' does not exist on type 'PrismaService'. Cast to any to fix type issue.
      const leave = await (this.prisma as any).leave.findUnique({
        where: { id: leaveId },
        include: { user: true, shift: true },
      });

      if (!leave) {
        throw new HttpException('Leave not found.', HttpStatus.NOT_FOUND);
      }

      if (leave.status !== LeaveStatus.PENDING) {
        throw new HttpException(
          'Only pending leaves can be cancelled.',
          HttpStatus.BAD_REQUEST,
        );
      }

      // FIX: Property 'leave' does not exist on type 'PrismaService'. Cast to any to fix type issue.
      await (this.prisma as any).leave.delete({ where: { id: leaveId } });

      return {
        ...leave,
        date: leave.date.toISOString().split('T')[0],
        createdAt: leave.createdAt.toISOString(),
        userName: leave.user.name,
        userMobile: leave.user.mobile,
        shiftName: leave.shift.name,
        creatorId: leave.creatorId,
      };
    } catch (e) {
      if (e instanceof HttpException) {
        throw e;
      }
      throw new HttpException('Leave not found', HttpStatus.NOT_FOUND);
    }
  }

  async getSlotInfoForDate(dateStr: string): Promise<LeaveSlotInfo[]> {
    const date = new Date(dateStr + 'T00:00:00Z');
    const [shifts, leavesOnDate] = await Promise.all([
      // FIX: Property 'shift' does not exist on type 'PrismaService'. Cast to any to fix type issue.
      (this.prisma as any).shift.findMany(),
      // FIX: Property 'leave' does not exist on type 'PrismaService'. Cast to any to fix type issue.
      (this.prisma as any).leave.groupBy({
        by: ['shiftId'],
        where: { date, NOT: { status: 'REJECTED' } },
        _count: { shiftId: true },
      }),
    ]);

    const leavesCountMap = new Map(
      leavesOnDate.map((l) => [l.shiftId, (l._count as any).shiftId]),
    );

    return shifts.map((shift) => {
      const filledSlots = Number(leavesCountMap.get(shift.id)) || 0;
      return {
        date: dateStr,
        shiftId: shift.id,
        totalSlots: shift.slots,
        filledSlots,
        // FIX: The right-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type. Cast to Number to ensure type safety.
        availableSlots: Number(shift.slots) - filledSlots,
      };
    });
  }

  async getSlotInfoForDateRange(
    startDateStr: string,
    endDateStr: string,
  ): Promise<{
    [date: string]: { availableSlots: number; totalSlots: number };
  }> {
    const start = new Date(startDateStr + 'T00:00:00Z');
    const end = new Date(endDateStr + 'T00:00:00Z');

    const [totalSlotsPerDay, leavesInRange] = await Promise.all([
      // FIX: Property 'shift' does not exist on type 'PrismaService'. Cast to any to fix type issue.
      (this.prisma as any).shift
        .aggregate({ _sum: { slots: true } })
        .then((res) => res._sum.slots || 0),
      // FIX: Property 'leave' does not exist on type 'PrismaService'. Cast to any to fix type issue.
      (this.prisma as any).leave.groupBy({
        by: ['date'],
        where: {
          date: { gte: start, lte: end },
          NOT: { status: 'REJECTED' },
        },
        _count: { _all: true },
      }),
    ]);

    const dateMap: {
      [date: string]: { availableSlots: number; totalSlots: number };
    } = {};
    const leavesCountMap = new Map(
      leavesInRange.map((l) => [
        l.date.toISOString().split('T')[0],
        (l._count as any)._all,
      ]),
    );

    const current = new Date(start);
    while (current <= end) {
      const dateString = current.toISOString().split('T')[0];
      const filledSlots = Number(leavesCountMap.get(dateString)) || 0;
      dateMap[dateString] = {
        // FIX: The right-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type. Cast to Number to ensure type safety.
        availableSlots: Number(totalSlotsPerDay) - filledSlots,
        totalSlots: totalSlotsPerDay,
      };
      current.setUTCDate(current.getUTCDate() + 1);
    }

    return dateMap;
  }
}
