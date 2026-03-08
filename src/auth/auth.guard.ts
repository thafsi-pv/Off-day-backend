import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import {
    IS_PUBLIC_KEY,
} from './decorators';


@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private prisma: PrismaService,
        private reflector: Reflector,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // 1. Skip public routes (login, register)
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) return true;

        const request = context.switchToHttp().getRequest();

        // 2. Extract token from cookie
        const token = this.extractToken(request);

        if (!token) {
            throw new UnauthorizedException('Access token is required');
        }

        // 3. Verify JWT
        let payload: { sub: string; role: string } | null = null;
        try {
            payload = await this.jwtService.verifyAsync(token, {
                secret: process.env.JWT_SECRET || 'offday_jwt_secret_change_in_production',
            });
        } catch (err) {
            throw new UnauthorizedException('Invalid or expired token');
        }

        // 4. Load full user from DB to get latest status
        const user = await (this.prisma as any).user.findUnique({
            where: { id: payload.sub },
        });
        if (!user) {
            throw new UnauthorizedException('User not found');
        }
        if (user.status !== 'ACTIVE') {
            throw new ForbiddenException('User account is not active');
        }

        // Attach user to request for downstream use
        request.user = user;

        // Any authenticated active user can access all routes
        return true;
    }



    private extractToken(request: any): string | null {
        // 1. Try from cookie (Preferred)
        if (request.cookies && request.cookies['access_token']) {
            console.log('[AuthGuard] Token found in cookie');
            return request.cookies['access_token'];
        }

        // 2. Try from Authorization Header (Fallback for cross-site mobile issues)
        const authHeader = request.headers.authorization || request.headers.Authorization;
        if (authHeader) {
            console.log('[AuthGuard] Token found in Authorization header');
            const [type, token] = authHeader.split(' ');
            return type === 'Bearer' ? token : null;
        }

        console.log('[AuthGuard] No token found in cookie or header');
        console.log('[AuthGuard] Headers keys:', Object.keys(request.headers));
        return null;
    }
}

