import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Config } from '../shared/types';

// FIX: Module '"@prisma/client"' has no exported member 'Prisma'. Replaced Prisma.WeekRange with a local type.
type DbWeekRange = 'ONE_WEEK' | 'TWO_WEEKS' | 'ONE_MONTH';

const toApiWeekRange = (dbValue: DbWeekRange): Config['weekRange'] => {
  const map: Record<DbWeekRange, Config['weekRange']> = {
    ONE_WEEK: '1_WEEK',
    TWO_WEEKS: '2_WEEKS',
    ONE_MONTH: '1_MONTH',
  };
  return map[dbValue];
};

const toDbWeekRange = (apiValue: Config['weekRange']): DbWeekRange => {
  const map: Record<Config['weekRange'], DbWeekRange> = {
    '1_WEEK': 'ONE_WEEK',
    '2_WEEKS': 'TWO_WEEKS',
    '1_MONTH': 'ONE_MONTH',
  };
  return map[apiValue];
};

@Injectable()
export class ConfigService {
  constructor(private prisma: PrismaService) {}

  async getConfig(): Promise<Config> {
    const [configData, shifts] = await Promise.all([
      // FIX: Property 'config' does not exist on type 'PrismaService'. Cast to any to fix type issue.
      (this.prisma as any).config.findFirstOrThrow(),
      // FIX: Property 'shift' does not exist on type 'PrismaService'. Cast to any to fix type issue.
      (this.prisma as any).shift.findMany({ orderBy: { name: 'asc' } }),
    ]);

    // Map shifts to only include id, name, and slots (exclude createdAt, updatedAt)
    const mappedShifts = shifts.map((shift: any) => ({
      id: shift.id,
      name: shift.name,
      slots: shift.slots,
    }));

    return {
      disabledDays: configData.disabledDays || [],
      weekRange: toApiWeekRange(configData.weekRange),
      shifts: mappedShifts,
    };
  }

  async updateConfig(newConfig: Partial<Config>): Promise<Config> {
    const { shifts, ...configValues } = newConfig;

    const transactionOps: any[] = [];

    if (configValues.weekRange || configValues.disabledDays) {
      // FIX: Property 'config' does not exist on type 'PrismaService'. Cast to any to fix type issue.
      const currentConfig = await (
        this.prisma as any
      ).config.findFirstOrThrow();
      transactionOps.push(
        // FIX: Property 'config' does not exist on type 'PrismaService'. Cast to any to fix type issue.
        (this.prisma as any).config.update({
          where: { id: currentConfig.id },
          data: {
            weekRange: configValues.weekRange
              ? toDbWeekRange(configValues.weekRange)
              : undefined,
            disabledDays: configValues.disabledDays,
          },
        }),
      );
    }

    if (shifts) {
      // FIX: Property 'shift' does not exist on type 'PrismaService'. Cast to any to fix type issue.
      const currentShifts = await (this.prisma as any).shift.findMany();
      const currentShiftIds = currentShifts.map((s) => s.id);
      const newShiftIds = shifts.map((s) => s.id);

      const shiftsToDelete = currentShiftIds.filter(
        (id) => !newShiftIds.includes(id),
      );
      if (shiftsToDelete.length > 0) {
        // FIX: Property 'leave' does not exist on type 'PrismaService'. Cast to any to fix type issue.
        const leavesOnDeletedShifts = await (this.prisma as any).leave.count({
          where: { shiftId: { in: shiftsToDelete } },
        });
        if (leavesOnDeletedShifts > 0) {
          throw new HttpException(
            'Cannot delete shifts that have existing leave requests.',
            HttpStatus.BAD_REQUEST,
          );
        }
        // FIX: Property 'shift' does not exist on type 'PrismaService'. Cast to any to fix type issue.
        transactionOps.push(
          (this.prisma as any).shift.deleteMany({
            where: { id: { in: shiftsToDelete } },
          }),
        );
      }

      for (const shift of shifts) {
        transactionOps.push(
          // FIX: Property 'shift' does not exist on type 'PrismaService'. Cast to any to fix type issue.
          (this.prisma as any).shift.upsert({
            where: { id: shift.id },
            update: { name: shift.name, slots: shift.slots },
            create: { id: shift.id, name: shift.name, slots: shift.slots },
          }),
        );
      }
    }

    // FIX: Property '$transaction' does not exist on type 'PrismaService'. Cast to any to fix type issue.
    await (this.prisma as any).$transaction(transactionOps);

    return this.getConfig();
  }
}
