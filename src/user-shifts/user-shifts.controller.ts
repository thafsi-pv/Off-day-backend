import { Controller, Post, Body, Get, Query, Param, Delete } from '@nestjs/common';
import { UserShiftsService } from './user-shifts.service';
import { AssignShiftDto } from './dto/assign-shift.dto';

import { BulkAssignShiftDto } from './dto/bulk-assign-shift.dto';

@Controller('user-shifts')
export class UserShiftsController {
    constructor(private readonly userShiftsService: UserShiftsService) { }

    @Post()
    assignShift(@Body() dto: AssignShiftDto) {
        return this.userShiftsService.assignShift(dto);
    }

    @Post('bulk')
    bulkAssignShifts(@Body() dto: BulkAssignShiftDto) {
        return this.userShiftsService.bulkAssignShifts(dto);
    }

    @Get('week')
    getShiftsForWeek(@Query('date') date: string) {
        return this.userShiftsService.getShiftsForWeek(date);
    }

    @Get('check')
    checkShift(@Query('userId') userId: string, @Query('date') date: string) {
        return this.userShiftsService.getUserShift(userId, date);
    }

    @Get(':userId')
    getUserShifts(@Param('userId') userId: string) {
        return this.userShiftsService.getUserShifts(userId);
    }

    @Post('copy-previous-week')
    copyPreviousWeek(@Body() body: { date: string }) {
        return this.userShiftsService.copyPreviousWeek(body.date);
    }

    @Delete()
    removeUserShift(@Query('userId') userId: string, @Query('date') date: string) {
        return this.userShiftsService.removeUserShift(userId, date);
    }

    @Post('swap')
    swapUserShifts(@Body() dto: import('./dto/swap-shift.dto').SwapShiftDto) {
        return this.userShiftsService.swapUserShifts(dto);
    }
}
