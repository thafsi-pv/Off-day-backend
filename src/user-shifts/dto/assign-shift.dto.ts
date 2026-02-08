import { IsString, IsDateString } from 'class-validator';

export class AssignShiftDto {
    @IsString()
    userId: string;

    @IsString()
    shiftId: string;

    @IsDateString()
    startDate: string; // YYYY-MM-DD
}
