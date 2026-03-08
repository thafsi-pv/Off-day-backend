import { Controller, Post, Body, Get, Query, Param, Delete } from '@nestjs/common';
import { UserShiftsService } from './user-shifts.service';
import { AssignShiftDto } from './dto/assign-shift.dto';
import { BulkAssignShiftDto } from './dto/bulk-assign-shift.dto';
import { } from '../auth/decorators';

@Controller('user-shifts')
export class UserShiftsController {
    constructor(private readonly userShiftsService: UserShiftsService) { }

    /** Assign shift */
    @Post()
    assignShift(@Body() dto: AssignShiftDto) {
        return this.userShiftsService.assignShift(dto);
    }

    /** Bulk assign shifts */
    @Post('bulk')
    bulkAssignShifts(@Body() dto: BulkAssignShiftDto) {
        return this.userShiftsService.bulkAssignShifts(dto);
    }

    /** Get shifts for week */
    @Get('week')
    getShiftsForWeek(@Query('date') date: string) {
        return this.userShiftsService.getShiftsForWeek(date);
    }

    /** Check own shift */
    @Get('check')
    checkShift(@Query('userId') userId: string, @Query('date') date: string) {
        return this.userShiftsService.getUserShift(userId, date);
    }

    /** Get user shifts */
    @Get(':userId')
    getUserShifts(@Param('userId') userId: string) {
        return this.userShiftsService.getUserShifts(userId);
    }

    /** Copy previous week */
    @Post('copy-previous-week')
    copyPreviousWeek(@Body() body: { date: string }) {
        return this.userShiftsService.copyPreviousWeek(body.date);
    }

    /** Remove user shift */
    @Delete()
    removeUserShift(@Query('userId') userId: string, @Query('date') date: string) {
        return this.userShiftsService.removeUserShift(userId, date);
    }

    /** Swap user shifts */
    @Post('swap')
    swapUserShifts(@Body() dto: import('./dto/swap-shift.dto').SwapShiftDto) {
        return this.userShiftsService.swapUserShifts(dto);
    }
}

