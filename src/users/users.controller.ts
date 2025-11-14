import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Post,
  Delete,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  UpdateUserDto,
  UpdateUserStatusDto,
} from './dto/update-user-status.dto';
import { ResetUserPasswordDto } from './dto/reset-user-password.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateUserStatusDto: UpdateUserStatusDto,
  ) {
    return this.usersService.updateStatus(id, updateUserStatusDto.status);
  }

  @Post(':id/reset-password')
  async resetPassword(
    @Param('id') id: string,
    @Body() resetPasswordDto: ResetUserPasswordDto,
  ) {
    return this.usersService.resetPassword(id, resetPasswordDto.newPassword);
  }

  @Patch(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  async deleteUserById(@Param('id') id: string) {
    return this.usersService.deleteUserById(id);
  }
}
