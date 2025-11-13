import {
  Injectable,
  HttpException,
  HttpStatus,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterUserDto } from './dto/register-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async login(mobile: string, pass: string) {
    // FIX: Property 'user' does not exist on type 'PrismaService'. Cast to any to fix type issue.
    const user = await (this.prisma as any).user.findUnique({
      where: { mobile },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordMatching = await bcrypt.compare(pass, user.password);

    if (!isPasswordMatching) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException(
        'User account is not active. Please contact an administrator.',
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }

  async register(registerUserDto: RegisterUserDto) {
    // FIX: Property 'user' does not exist on type 'PrismaService'. Cast to any to fix type issue.
    const existingUser = await (this.prisma as any).user.findUnique({
      where: { mobile: registerUserDto.mobile },
    });
    if (existingUser) {
      throw new HttpException(
        'User with this mobile already exists',
        HttpStatus.CONFLICT,
      );
    }

    const hashedPassword = await bcrypt.hash(registerUserDto.password, 10);

    // FIX: Property 'user' does not exist on type 'PrismaService'. Cast to any to fix type issue.
    const newUser = await (this.prisma as any).user.create({
      data: {
        name: registerUserDto.name,
        email: registerUserDto.email,
        mobile: registerUserDto.mobile,
        password: hashedPassword,
        role: 'USER',
        status: 'PENDING',
      },
    });

    const { password, ...result } = newUser;
    return result;
  }
}
