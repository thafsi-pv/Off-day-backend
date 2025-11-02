import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// FIX: Module '"@prisma/client"' has no exported member 'LeaveStatus'. Import LeaveStatus from shared types instead.
import { Leave, LeaveSlotInfo, LeaveStatus } from '../shared/types';
import { CreateLeaveDto } from './dto/create-leave.dto';

@Injectable()
export class LeavesService {
  constructor(private prisma: PrismaService) {}

  async create(leaveData: CreateLeaveDto): Promise<Leave> {
    // FIX: Property 'user' does not exist on type 'PrismaService'. Cast to any to fix type issue.
    const user = await (this.prisma as any).user.findUnique({
      where: { id: leaveData.userId },
    });
    // FIX: Property 'shift' does not exist on type 'PrismaService'. Cast to any to fix type issue.
    const shift = await (this.prisma as any).shift.findUnique({
      where: { id: leaveData.shiftId },
    });
    if (!user || !shift) {
      throw new HttpException('Invalid user or shift', HttpStatus.BAD_REQUEST);
    }

    const date = new Date(leaveData.date + 'T00:00:00Z');

    // FIX: Property 'leave' does not exist on type 'PrismaService'. Cast to any to fix type issue.
    const newLeave = await (this.prisma as any).leave.create({
      data: {
        date,
        userId: leaveData.userId,
        shiftId: leaveData.shiftId,
        status: 'PENDING',
      },
    });

    return {
      ...newLeave,
      date: newLeave.date.toISOString().split('T')[0],
      userName: user.name,
      shiftName: shift.name,
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
    }));
  }

  async updateStatus(
    leaveId: string,
    status: LeaveStatus.APPROVED | LeaveStatus.REJECTED,
  ): Promise<Leave> {
    try {
      // FIX: Property 'leave' does not exist on type 'PrismaService'. Cast to any to fix type issue.
      const updatedLeave = await (this.prisma as any).leave.update({
        where: { id: leaveId },
        data: { status },
        include: { user: true, shift: true },
      });
      return {
        ...updatedLeave,
        date: updatedLeave.date.toISOString().split('T')[0],
        createdAt: updatedLeave.createdAt.toISOString(),
        userName: updatedLeave.user.name,
        shiftName: updatedLeave.shift.name,
      };
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

    return updatedLeaves.map((l) => ({
      ...l,
      date: l.date.toISOString().split('T')[0],
      createdAt: l.createdAt.toISOString(),
      userName: l.user.name,
      shiftName: l.shift.name,
    }));
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
        shiftName: leave.shift.name,
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

    let current = new Date(start);
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
