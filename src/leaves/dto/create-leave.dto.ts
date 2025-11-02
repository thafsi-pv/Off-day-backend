import { IsString, IsNotEmpty, IsDateString } from 'class-validator';

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
}
