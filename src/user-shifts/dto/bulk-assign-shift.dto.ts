import { IsString, IsDateString, IsArray } from 'class-validator';

export class BulkAssignShiftDto {
    @IsArray()
    @IsString({ each: true })
    userIds: string[];

    @IsString()
    shiftId: string;

    @IsDateString()
    startDate: string; // YYYY-MM-DD
}
