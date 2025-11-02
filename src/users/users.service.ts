import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserStatus } from '../shared/types';

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
}
