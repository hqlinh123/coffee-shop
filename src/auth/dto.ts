import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Tên đăng nhập của nhân viên',
    example: 'manager',
  })
  @IsString()
  username!: string;

  @ApiProperty({
    description: 'Mật khẩu đăng nhập',
    example: 'Admin@123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password!: string;
}

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Mật khẩu hiện tại',
    example: 'Admin@123',
  })
  @IsString()
  oldPassword!: string;

  @ApiProperty({
    description: 'Mật khẩu mới',
    example: 'NewPassword@123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}