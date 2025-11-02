import { IsArray, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { LeaveStatus } from '../../shared/types';

export class UpdateMultipleLeavesDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  leaveIds: string[];

  @IsEnum([LeaveStatus.APPROVED, LeaveStatus.REJECTED])
  @IsNotEmpty()
  status: LeaveStatus.APPROVED | LeaveStatus.REJECTED;
}
