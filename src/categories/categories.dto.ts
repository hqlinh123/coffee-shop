import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class CategoryDto {
  @ApiProperty({
    description: 'Tên danh mục',
    example: 'Cà phê',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  name!: string;
}