import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { LeavesModule } from './leaves/leaves.module';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { UserShiftsModule } from './user-shifts/user-shifts.module';


@Module({
  imports: [
    AuthModule,
    LeavesModule,
    ConfigModule,
    PrismaModule,
    UsersModule,
    UserShiftsModule,

  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
