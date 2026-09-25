import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  Min,
  ValidateIf,
} from 'class-validator';
import { PaymentMethod } from '../../generated/prisma/client';

export class PayOrderDto {
  @ApiProperty({
    description: 'Phương thức thanh toán',
    enum: PaymentMethod,
    enumName: 'PaymentMethod',
    example: PaymentMethod.CASH,
  })
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @ApiPropertyOptional({
    description:
      'Tiền khách đưa. Bắt buộc khi phương thức là CASH',
    example: 100000,
    minimum: 0,
  })
  @ValidateIf(
    (object: PayOrderDto) =>
      object.method === PaymentMethod.CASH,
  )
  @IsInt()
  @Min(0)
  cashReceived?: number;
}