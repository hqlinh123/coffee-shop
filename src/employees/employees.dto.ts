import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { EmploymentStatus, Role } from '../generated/prisma/client';

export class CreateEmployeeDto {
  @ApiProperty({
    description: 'Họ và tên nhân viên',
    example: 'Nguyễn Văn An',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  fullName!: string;

  @ApiProperty({
    description: 'Ngày sinh, nhân viên phải đủ 18 tuổi',
    example: '2000-05-20',
    type: String,
    format: 'date',
  })
  @IsDateString()
  dateOfBirth!: string;

  @ApiProperty({
    description: 'CCCD gồm đúng 12 chữ số',
    example: '079200001234',
    minLength: 12,
    maxLength: 12,
  })
  @Matches(/^\d{12}$/)
  citizenId!: string;

  @ApiProperty({
    description: 'Số điện thoại gồm 10 chữ số, bắt đầu bằng 0',
    example: '0901234567',
    minLength: 10,
    maxLength: 10,
  })
  @Matches(/^0\d{9}$/)
  phone!: string;

  @ApiProperty({
    description: 'Vai trò tài khoản',
    enum: Role,
    enumName: 'Role',
    example: Role.EMPLOYEE,
  })
  @IsEnum(Role)
  role!: Role;

  @ApiProperty({
    description: 'Tên đăng nhập',
    example: 'nguyenvanan',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50)
  username!: string;

  @ApiProperty({
    description: 'Mật khẩu ban đầu, tối thiểu 8 ký tự',
    example: 'Employee@123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password!: string;
}

export class UpdateEmployeeDto {
  @ApiPropertyOptional({
    description: 'Họ và tên nhân viên',
    example: 'Nguyễn Văn An',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullName?: string;

  @ApiPropertyOptional({
    description: 'Ngày sinh',
    example: '2000-05-20',
    type: String,
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({
    description: 'CCCD gồm đúng 12 chữ số',
    example: '079200001234',
    minLength: 12,
    maxLength: 12,
  })
  @IsOptional()
  @Length(12, 12)
  @Matches(/^\d{12}$/)
  citizenId?: string;

  @ApiPropertyOptional({
    description: 'Số điện thoại',
    example: '0901234567',
    minLength: 10,
    maxLength: 10,
  })
  @IsOptional()
  @Matches(/^0\d{9}$/)
  phone?: string;

  @ApiPropertyOptional({
    description: 'Vai trò mới',
    enum: Role,
    enumName: 'Role',
    example: Role.MANAGER,
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({
    description: 'Trạng thái làm việc',
    enum: EmploymentStatus,
    enumName: 'EmploymentStatus',
    example: EmploymentStatus.WORKING,
  })
  @IsOptional()
  @IsEnum(EmploymentStatus)
  employmentStatus?: EmploymentStatus;
}