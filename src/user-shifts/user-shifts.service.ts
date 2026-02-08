import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AssignShiftDto } from './dto/assign-shift.dto';
import { startOfWeek, parseISO, format } from 'date-fns';

@Injectable()
export class UserShiftsService {
    constructor(private prisma: PrismaService) { }

    async assignShift(dto: AssignShiftDto) {
        const date = parseISO(dto.startDate);
        // Normalize to start of week (Monday)
        const startDate = startOfWeek(date, { weekStartsOn: 1 });

        return (this.prisma as any).userShift.upsert({
            where: {
                userId_startDate: {
                    userId: dto.userId,
                    startDate: startDate,
                },
            },
            update: {
                shiftId: dto.shiftId,
            },
            create: {
                userId: dto.userId,
                shiftId: dto.shiftId,
                startDate: startDate,
            },
            include: {
                shift: true,
            },
        });
    }

    async bulkAssignShifts(dto: import('./dto/bulk-assign-shift.dto').BulkAssignShiftDto) {
        const date = parseISO(dto.startDate);
        const startDate = startOfWeek(date, { weekStartsOn: 1 });

        // Use transaction to ensure all assignments succeed
        return this.prisma.$transaction(
            dto.userIds.map((userId) =>
                (this.prisma as any).userShift.upsert({
                    where: {
                        userId_startDate: {
                            userId: userId,
                            startDate: startDate,
                        },
                    },
                    update: {
                        shiftId: dto.shiftId,
                    },
                    create: {
                        userId: userId,
                        shiftId: dto.shiftId,
                        startDate: startDate,
                    },
                })
            )
        );
    }

    async getUserShift(userId: string, dateStr: string) {
        const date = parseISO(dateStr);
        const startDate = startOfWeek(date, { weekStartsOn: 1 });

        const userShift = await (this.prisma as any).userShift.findUnique({
            where: {
                userId_startDate: {
                    userId,
                    startDate,
                },
            },
            include: {
                shift: true,
            },
        });

        return userShift ? userShift.shift : null;
    }

    async getUserShifts(userId: string) {
        return (this.prisma as any).userShift.findMany({
            where: { userId },
            include: { shift: true },
            orderBy: { startDate: 'desc' },
        });
    }

    async getShiftsForWeek(dateStr: string) {
        const date = parseISO(dateStr);
        const startDate = startOfWeek(date, { weekStartsOn: 1 });

        return (this.prisma as any).userShift.findMany({
            where: {
                startDate: startDate,
            },
            include: {
                shift: true,
                user: true, // Include user details for frontend display
            },
        });
    }

    async removeUserShift(userId: string, dateStr: string) {
        const date = parseISO(dateStr);
        const startDate = startOfWeek(date, { weekStartsOn: 1 });

        return (this.prisma as any).userShift.delete({
            where: {
                userId_startDate: {
                    userId,
                    startDate,
                },
            },
        });
    }

    async copyPreviousWeek(dateStr: string) {
        const date = parseISO(dateStr);
        const targetWeekStart = startOfWeek(date, { weekStartsOn: 1 });
        const previousWeekStart = startOfWeek(
            new Date(targetWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000),
            { weekStartsOn: 1 }
        );

        // Get all shifts from previous week
        const previousWeekShifts = await (this.prisma as any).userShift.findMany({
            where: {
                startDate: previousWeekStart,
            },
        });

        if (previousWeekShifts.length === 0) {
            return { message: 'No shifts found in previous week', count: 0 };
        }

        // Delete existing shifts for target week
        await (this.prisma as any).userShift.deleteMany({
            where: {
                startDate: targetWeekStart,
            },
        });

        // Copy shifts to target week
        const newShifts = await this.prisma.$transaction(
            previousWeekShifts.map((shift: any) =>
                (this.prisma as any).userShift.create({
                    data: {
                        userId: shift.userId,
                        shiftId: shift.shiftId,
                        startDate: targetWeekStart,
                    },
                })
            )
        );

        return { message: 'Shifts copied successfully', count: newShifts.length };
    }

    async swapUserShifts(dto: import('./dto/swap-shift.dto').SwapShiftDto) {
        const date = parseISO(dto.startDate);
        const startDate = startOfWeek(date, { weekStartsOn: 1 });

        // Get both users' current shifts for this week
        const [user1Shift, user2Shift] = await Promise.all([
            (this.prisma as any).userShift.findUnique({
                where: {
                    userId_startDate: {
                        userId: dto.user1Id,
                        startDate: startDate,
                    },
                },
                include: { shift: true },
            }),
            (this.prisma as any).userShift.findUnique({
                where: {
                    userId_startDate: {
                        userId: dto.user2Id,
                        startDate: startDate,
                    },
                },
                include: { shift: true },
            }),
        ]);

        // Validation: Both users must have shifts assigned
        if (!user1Shift || !user2Shift) {
            const missingUser = !user1Shift ? 'user1' : 'user2';
            throw new Error(`Cannot swap: ${missingUser} does not have a shift assigned for this week`);
        }

        // Validation: Users must have different shifts
        if (user1Shift.shiftId === user2Shift.shiftId) {
            throw new Error('Cannot swap: both users are already on the same shift');
        }

        // Perform atomic swap using transaction
        return this.prisma.$transaction(async (tx) => {
            // Update user1's shift to user2's shift
            const updatedUser1 = await (tx as any).userShift.update({
                where: {
                    userId_startDate: {
                        userId: dto.user1Id,
                        startDate: startDate,
                    },
                },
                data: {
                    shiftId: user2Shift.shiftId,
                },
                include: { shift: true, user: true },
            });

            // Update user2's shift to user1's shift
            const updatedUser2 = await (tx as any).userShift.update({
                where: {
                    userId_startDate: {
                        userId: dto.user2Id,
                        startDate: startDate,
                    },
                },
                data: {
                    shiftId: user1Shift.shiftId,
                },
                include: { shift: true, user: true },
            });

            return {
                message: 'Shifts swapped successfully',
                user1: updatedUser1,
                user2: updatedUser2,
            };
        });
    }
}
