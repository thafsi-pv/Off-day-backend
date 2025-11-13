// import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

// export class LoginDto {
//   @IsEmail()
//   @IsNotEmpty()
//   email: string;

//   @IsString()
//   @IsNotEmpty()
//   password: string;
// }

import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  mobile: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
