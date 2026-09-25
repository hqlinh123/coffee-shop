import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { ProductStatus } from '../../generated/prisma/enums';

export class CreateProductDto {
  @ApiProperty({
    description: 'ID danh mục của món',
    example: '9b2e94b8-569e-49cc-bc31-cd47740f663a',
    format: 'uuid',
  })
  @IsUUID()
  categoryId!: string;

  @ApiProperty({
    description: 'Tên món',
    example: 'Cà phê sữa đá',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({
    description: 'Mô tả món',
    example: 'Cà phê pha phin với sữa đặc và đá',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Đơn giá của món, tính bằng VNĐ',
    example: 30000,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  price!: number;

  @ApiPropertyOptional({
    description: 'Đường dẫn hình ảnh món',
    example: 'https://example.com/images/ca-phe-sua-da.png',
  })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Trạng thái kinh doanh của món',
    enum: ProductStatus,
    enumName: 'ProductStatus',
    default: ProductStatus.AVAILABLE,
    example: ProductStatus.AVAILABLE,
  })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}

export class UpdateProductDto {
  @ApiPropertyOptional({
    description: 'ID danh mục mới',
    example: '9b2e94b8-569e-49cc-bc31-cd47740f663a',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Tên món mới',
    example: 'Cà phê sữa đá đặc biệt',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Mô tả món',
    example: 'Cà phê sữa đá ít ngọt',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Đơn giá mới, tính bằng VNĐ',
    example: 35000,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  price?: number;

  @ApiPropertyOptional({
    description: 'Đường dẫn hình ảnh mới',
    example: 'https://example.com/images/ca-phe-sua-da-moi.png',
  })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Trạng thái kinh doanh',
    enum: ProductStatus,
    enumName: 'ProductStatus',
    example: ProductStatus.UNAVAILABLE,
  })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}