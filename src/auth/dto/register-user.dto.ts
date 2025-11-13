// import { IsEmail, IsString, IsNotEmpty, MinLength } from 'class-validator';

// export class RegisterUserDto {
//   @IsString()
//   @IsNotEmpty()
//   name: string;

//   @IsEmail()
//   @IsNotEmpty()
//   email: string;

//   @IsString()
//   @IsNotEmpty()
//   @MinLength(6)
//   password: string;
// }

import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class RegisterUserDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  mobile: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsNotEmpty()
  password: string;
}
