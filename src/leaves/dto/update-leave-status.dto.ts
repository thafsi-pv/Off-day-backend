import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { LeaveStatus } from '../../shared/types';

export class UpdateLeaveStatusDto {
  @IsEnum([LeaveStatus.APPROVED, LeaveStatus.REJECTED])
  @IsNotEmpty()
  status: LeaveStatus.APPROVED | LeaveStatus.REJECTED;

  @IsOptional()
  @IsString()
  reason?: string;
}
