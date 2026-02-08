import { Module } from '@nestjs/common';
import { UserShiftsService } from './user-shifts.service';
import { UserShiftsController } from './user-shifts.controller';

@Module({
  providers: [UserShiftsService],
  controllers: [UserShiftsController]
})
export class UserShiftsModule {}
