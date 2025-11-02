import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  Delete,
} from '@nestjs/common';
import { LeavesService } from './leaves.service';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveStatusDto } from './dto/update-leave-status.dto';
import { UpdateMultipleLeavesDto } from './dto/update-multiple-leaves.dto';

@Controller('leaves')
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) {}

  @Post()
  async create(@Body() createLeaveDto: CreateLeaveDto) {
    return this.leavesService.create(createLeaveDto);
  }

  @Get()
  async findAll() {
    return this.leavesService.findAll();
  }

  @Get('user/:userId')
  async findForUser(@Param('userId') userId: string) {
    return this.leavesService.findForUser(userId);
  }

  @Patch('status/bulk')
  async updateMultipleStatuses(
    @Body() updateMultipleLeavesDto: UpdateMultipleLeavesDto,
  ) {
    return this.leavesService.updateMultipleStatuses(
      updateMultipleLeavesDto.leaveIds,
      updateMultipleLeavesDto.status,
    );
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateLeaveStatusDto: UpdateLeaveStatusDto,
  ) {
    return this.leavesService.updateStatus(id, updateLeaveStatusDto.status);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.leavesService.remove(id);
  }

  @Get('slots/date/:date')
  async getSlotInfoForDate(@Param('date') date: string) {
    return this.leavesService.getSlotInfoForDate(date);
  }

  @Get('slots/range')
  async getSlotInfoForDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.leavesService.getSlotInfoForDateRange(startDate, endDate);
  }
}
