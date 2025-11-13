import {
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserStatus } from '../shared/types';
import * as bcrypt from 'bcryptjs';
import { UpdateUserDto } from './dto/update-user-status.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    // FIX: Property 'user' does not exist on type 'PrismaService'. Cast to any to fix type issue.
    return (this.prisma as any).user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        role: true,
        status: true,
      },
    });
  }

  async updateStatus(id: string, status: UserStatus) {
    try {
      // FIX: Property 'user' does not exist on type 'PrismaService'. Cast to any to fix type issue.
      const user = await (this.prisma as any).user.update({
        where: { id },
        data: { status },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
        },
      });
      return user;
    } catch (error) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
  }

  async resetPassword(id: string, newPassword?: string) {
    try {
      // Generate a random password if none provided
      const password = newPassword || this.generateRandomPassword();
      const hashedPassword = await bcrypt.hash(password, 10);

      // FIX: Property 'user' does not exist on type 'PrismaService'. Cast to any to fix type issue.
      await (this.prisma as any).user.update({
        where: { id },
        data: { password: hashedPassword },
      });

      return {
        success: true,
        newPassword: newPassword ? undefined : password, // Only return password if auto-generated
        message: newPassword
          ? 'Password has been reset successfully.'
          : 'Password has been reset. Please share the new password with the user.',
      };
    } catch (error) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    const existing = await (this.prisma as any).user.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('User not found');

    if (updateUserDto.mobile && updateUserDto.mobile !== existing.mobile) {
      const duplicate = await (this.prisma as any).user.findUnique({
        where: { mobile: updateUserDto.mobile },
      });
      if (duplicate)
        throw new ConflictException('Mobile number already exists');
    }

    const updatedUser = await (this.prisma as any).user.update({
      where: { id },
      data: updateUserDto,
    });

    const { password, ...safeUser } = updatedUser;
    return safeUser;
  }

  private generateRandomPassword(): string {
    // Generate a random 8-character password
    const length = 8;
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }
}
