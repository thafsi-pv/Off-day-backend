import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserStatus } from '../../shared/types';

export class UpdateUserStatusDto {
  @IsEnum(UserStatus)
  @IsNotEmpty()
  status: UserStatus;
}
