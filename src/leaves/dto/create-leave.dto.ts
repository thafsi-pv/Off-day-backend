import { IsString, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';

export class CreateLeaveDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  shiftId: string;

  @IsString()
  @IsOptional()
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';

  @IsString()
  @IsOptional()
  creatorId?: string;
}
