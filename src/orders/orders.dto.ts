import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { OrderType, OrderStatus } from '../../generated/prisma/enums';

export class OrderItemDto {
  @ApiProperty({
    description: 'ID món được đặt',
    example: '5d62395f-2a9c-4fd3-adfe-e4075724d628',
    format: 'uuid',
  })
  @IsUUID()
  productId!: string;

  @ApiProperty({
    description: 'Số lượng món, từ 1 đến 20',
    example: 2,
    minimum: 1,
    maximum: 20,
  })
  @IsInt()
  @Min(1)
  @Max(20)
  quantity!: number;

  @ApiPropertyOptional({
    description: 'Ghi chú dành cho món',
    example: 'Ít đường, ít đá',
  })
  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateOrderDto {
  @ApiProperty({
    description: 'Hình thức phục vụ',
    enum: OrderType,
    enumName: 'OrderType',
    example: OrderType.DINE_IN,
  })
  @IsEnum(OrderType)
  orderType!: OrderType;

  @ApiPropertyOptional({
    description:
      'ID bàn. Bắt buộc với DINE_IN và không được gửi với TAKEAWAY',
    example: '28b1ab17-2770-4903-a51a-50a6a8c97781',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  tableId?: string;

  @ApiPropertyOptional({
    description: 'Ghi chú chung của khách hàng',
    example: 'Mang món ra cùng lúc',
  })
  @IsOptional()
  @IsString()
  customerNote?: string;

  @ApiProperty({
    description: 'Danh sách món được đặt',
    type: [OrderItemDto],
    minItems: 1,
    example: [
      {
        productId: '5d62395f-2a9c-4fd3-adfe-e4075724d628',
        quantity: 2,
        note: 'Ít đường',
      },
      {
        productId: '29e4cd08-1700-49dc-8eec-81fdbab636fa',
        quantity: 1,
        note: 'Không đá',
      },
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];
}

export class AddItemsDto {
  @ApiProperty({
    description: 'Danh sách món gọi thêm',
    type: [OrderItemDto],
    minItems: 1,
    example: [
      {
        productId: '5d62395f-2a9c-4fd3-adfe-e4075724d628',
        quantity: 1,
        note: 'Ít đá',
      },
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];
}

export class ChangeOrderStatusDto {
  @ApiProperty({
    description: 'Trạng thái mới của đơn hàng',
    enum: OrderStatus,
    enumName: 'OrderStatus',
    example: OrderStatus.PREPARING,
  })
  @IsEnum(OrderStatus)
  status!: OrderStatus;
}

export class MoveTableDto {
  @ApiProperty({
    description: 'ID bàn mới phải đang ở trạng thái EMPTY',
    example: '754113be-72a3-4ebf-8f98-b6478fbe17e7',
    format: 'uuid',
  })
  @IsUUID()
  tableId!: string;
}