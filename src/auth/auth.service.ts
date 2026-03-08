import {
  Injectable,
  HttpException,
  HttpStatus,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterUserDto } from './dto/register-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) { }

  async login(mobile: string, pass: string, response: any) {
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

    // Issue JWT
    const payload = { sub: user.id, role: user.role };
    const token = await this.jwtService.signAsync(payload);

    // Set HTTP-only cookie
    response.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return user info + token (token also in cookie for convenience)
    const { password, ...result } = user;
    return { ...result, access_token: token };
  }

  async logout(response: any) {
    response.clearCookie('access_token');
    return { message: 'Logged out successfully' };
  }

  async register(registerUserDto: RegisterUserDto) {
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
