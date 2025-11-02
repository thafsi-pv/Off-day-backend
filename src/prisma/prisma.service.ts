import { Injectable, OnModuleInit } from '@nestjs/common';
// FIX: Use `require` to load PrismaClient to bypass static analysis, which fails when types are not generated pre-build.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient } = require('@prisma/client');
import * as bcrypt from 'bcryptjs';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    // FIX: Property '$connect' does not exist on type 'PrismaService'. Cast to any to fix type issue.
    await (this as any).$connect();
    await this.seedData();
  }

  private getFutureDate(daysToAdd: number): Date {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    date.setDate(date.getDate() + daysToAdd);
    return date;
  }

  private async seedData() {
    // FIX: Property 'user' does not exist on type 'PrismaService'. Cast to any to fix type issue.
    const userCount = await (this as any).user.count();
    if (userCount === 0) {
      console.log('Database is empty, seeding data...');

      const hashedPassword = await bcrypt.hash('password', 10);

      // FIX: Property 'user' does not exist on type 'PrismaService'. Cast to any to fix type issue.
      await (this as any).user.createMany({
        data: [
          { name: 'Alice Johnson', email: 'user@test.com', password: hashedPassword, role: 'USER', status: 'ACTIVE' },
          { name: 'Bob Williams', email: 'admin@test.com', password: hashedPassword, role: 'ADMIN', status: 'ACTIVE' },
          { name: 'Charlie Brown', email: 'user2@test.com', password: hashedPassword, role: 'USER', status: 'ACTIVE' },
        ],
      });

      // FIX: Property 'shift' does not exist on type 'PrismaService'. Cast to any to fix type issue.
      await (this as any).shift.createMany({
        data: [
          { name: 'Shift 1 (9AM-5PM)', slots: 2 },
          { name: 'Shift 2 (5PM-1AM)', slots: 1 },
          { name: 'Night Shift (1AM-9AM)', slots: 1 },
        ],
      });

      // FIX: Property 'config' does not exist on type 'PrismaService'. Cast to any to fix type issue.
      await (this as any).config.create({
        data: {
          disabledDays: [0, 6],
          weekRange: 'TWO_WEEKS',
        },
      });

      // FIX: Property 'user' does not exist on type 'PrismaService'. Cast to any to fix type issue.
      const alice = await (this as any).user.findUnique({ where: { email: 'user@test.com' } });
      // FIX: Property 'user' does not exist on type 'PrismaService'. Cast to any to fix type issue.
      const charlie = await (this as any).user.findUnique({ where: { email: 'user2@test.com' } });
      // FIX: Property 'shift' does not exist on type 'PrismaService'. Cast to any to fix type issue.
      const shift1 = await (this as any).shift.findFirst({ where: { name: 'Shift 1 (9AM-5PM)' } });
      // FIX: Property 'shift' does not exist on type 'PrismaService'. Cast to any to fix type issue.
      const shift2 = await (this as any).shift.findFirst({ where: { name: 'Shift 2 (5PM-1AM)' } });

      if (alice && charlie && shift1 && shift2) {
          // FIX: Property 'leave' does not exist on type 'PrismaService'. Cast to any to fix type issue.
          await (this as any).leave.createMany({
            data: [
              { userId: alice.id, date: this.getFutureDate(1), shiftId: shift1.id, status: 'PENDING' },
              { userId: charlie.id, date: this.getFutureDate(2), shiftId: shift1.id, status: 'APPROVED' },
              { userId: alice.id, date: this.getFutureDate(3), shiftId: shift2.id, status: 'REJECTED' },
            ],
          });
      }
      console.log('Seeding complete.');
    }
  }
}