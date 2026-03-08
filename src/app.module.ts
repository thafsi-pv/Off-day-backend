import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { LeavesModule } from './leaves/leaves.module';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { UserShiftsModule } from './user-shifts/user-shifts.module';
import { AuthGuard } from './auth/auth.guard';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    LeavesModule,
    ConfigModule,
    UsersModule,
    UserShiftsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule { }
