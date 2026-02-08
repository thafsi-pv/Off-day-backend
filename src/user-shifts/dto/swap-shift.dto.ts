import { IsString, IsDateString } from 'class-validator';

export class SwapShiftDto {
    @IsString()
    user1Id: string;

    @IsString()
    user2Id: string;

    @IsDateString()
    startDate: string; // YYYY-MM-DD
}
