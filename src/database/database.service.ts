import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  Role,
  LeaveStatus,
  User,
  Shift,
  Leave,
  Config,
  UserStatus,
} from '../shared/types';

@Injectable()
export class DatabaseService implements OnModuleInit {
  public users: User[] = [];
  public shifts: Shift[] = [];
  public leaves: Leave[] = [];
  public config: Config = {} as Config;

  onModuleInit() {
    this.seedData();
  }

  private getFutureDate(daysToAdd: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysToAdd);
    return date.toISOString().split('T')[0];
  }

  private seedData() {
    this.users = [
      {
        id: '1',
        name: 'Alice Johnson',
        email: 'user@test.com',
        role: Role.USER,
        password: 'password',
        status: UserStatus.ACTIVE,
      },
      {
        id: '2',
        name: 'Bob Williams',
        email: 'admin@test.com',
        role: Role.ADMIN,
        password: 'password',
        status: UserStatus.ACTIVE,
      },
      {
        id: '3',
        name: 'Charlie Brown',
        email: 'user2@test.com',
        role: Role.USER,
        password: 'password',
        status: UserStatus.ACTIVE,
      },
    ];

    this.shifts = [
      { id: 's1', name: 'Shift 1 (9AM-5PM)', slots: 2 },
      { id: 's2', name: 'Shift 2 (5PM-1AM)', slots: 1 },
      { id: 's3', name: 'Night Shift (1AM-9AM)', slots: 1 },
    ];

    this.leaves = [
      {
        id: 'l1',
        userId: '1',
        userName: 'Alice Johnson',
        date: this.getFutureDate(1),
        shiftId: 's1',
        shiftName: 'Shift 1 (9AM-5PM)',
        status: LeaveStatus.PENDING,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'l2',
        userId: '3',
        userName: 'Charlie Brown',
        date: this.getFutureDate(2),
        shiftId: 's1',
        shiftName: 'Shift 1 (9AM-5PM)',
        status: LeaveStatus.APPROVED,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'l3',
        userId: '1',
        userName: 'Alice Johnson',
        date: this.getFutureDate(3),
        shiftId: 's2',
        shiftName: 'Shift 2 (5PM-1AM)',
        status: LeaveStatus.REJECTED,
        createdAt: new Date().toISOString(),
      },
    ];

    this.config = {
      disabledDays: [0, 6], // Sunday, Saturday
      weekRange: '2_WEEKS',
      shifts: this.shifts,
    };
  }
}
