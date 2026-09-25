import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';
import { TableStatus } from '../../generated/prisma/client';

export class CreateTableDto {
  @ApiProperty({
    description: 'Số bàn',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  tableNumber!: number;

  @ApiProperty({
    description: 'Số chỗ ngồi',
    example: 4,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  capacity!: number;
}

export class UpdateTableDto {
  @ApiPropertyOptional({
    description: 'Số bàn mới',
    example: 2,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  tableNumber?: number;

  @ApiPropertyOptional({
    description: 'Số chỗ ngồi mới',
    example: 6,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional({
    description:
      'Trạng thái bàn. OCCUPIED chỉ do hệ thống tự cập nhật',
    enum: TableStatus,
    enumName: 'TableStatus',
    example: TableStatus.OUT_OF_SERVICE,
  })
  @IsOptional()
  @IsEnum(TableStatus)
  status?: TableStatus;
}