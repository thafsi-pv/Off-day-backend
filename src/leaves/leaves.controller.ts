import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  Delete,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { LeavesService } from './leaves.service';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveStatusDto } from './dto/update-leave-status.dto';
import { UpdateMultipleLeavesDto } from './dto/update-multiple-leaves.dto';
import {
} from '../auth/decorators';

@Controller('leaves')
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) { }

  /** Create a leave */
  @Post()
  async create(@Body() createLeaveDto: CreateLeaveDto, @Request() req: any) {
    return this.leavesService.create(createLeaveDto, req.user);
  }

  /** See all leaves or users */
  @Get()
  async findAll() {
    return this.leavesService.findAll();
  }

  /** View own leaves only */
  @Get('user/:userId')
  async findForUser(
    @Param('userId') userId: string,
    @Request() req: any,
  ) {
    // If user role, they can only view their own leaves
    if (req.user.role === 'USER' && req.user.id !== userId) {
      throw new ForbiddenException('You can only view your own leave applications');
    }
    return this.leavesService.findForUser(userId);
  }

  /** ADMIN only */
  @Patch('status/bulk')
  async updateMultipleStatuses(
    @Body() updateMultipleLeavesDto: UpdateMultipleLeavesDto,
  ) {
    return this.leavesService.updateMultipleStatuses(
      updateMultipleLeavesDto.leaveIds,
      updateMultipleLeavesDto.status,
    );
  }

  /** ADMIN only */
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateLeaveStatusDto: UpdateLeaveStatusDto,
  ) {
    return this.leavesService.updateStatus(
      id,
      updateLeaveStatusDto.status,
      updateLeaveStatusDto.reason,
    );
  }

  /** ADMIN only */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.leavesService.remove(id);
  }

  /** ADMIN only */
  @Get('slots/date/:date')
  async getSlotInfoForDate(@Param('date') date: string) {
    return this.leavesService.getSlotInfoForDate(date);
  }

  /** ADMIN only */
  @Get('slots/range')
  async getSlotInfoForDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.leavesService.getSlotInfoForDateRange(startDate, endDate);
  }
}

