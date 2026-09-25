import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AuthUser, CurrentUser } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';
import {
  AddItemsDto,
  ChangeOrderStatusDto,
  CreateOrderDto,
  MoveTableDto,
} from './orders.dto';
import { OrdersService } from './orders.service';
import { OrderStatus } from '../generated/prisma/client';
@Controller('orders')
export class OrdersController {
  constructor(private readonly service: OrdersService) {}
  @Get() all(@Query('status') status?: OrderStatus) {
    return this.service.findAll(status);
  }
  @Get(':id') one(@Param('id') id: string) {
    return this.service.findOne(id);
  }
  @Public() @Get('public/code/:code') byCode(@Param('code') code: string) {
    return this.service.findByCode(code);
  }
  @Public() @Post('public') guest(@Body() dto: CreateOrderDto) {
    return this.service.create(dto);
  }
  @Post() staff(@Body() dto: CreateOrderDto, @CurrentUser() u: AuthUser) {
    return this.service.create(dto, u.employeeId);
  }
  @Post(':id/items') add(@Param('id') id: string, @Body() dto: AddItemsDto) {
    return this.service.addItems(id, dto);
  }
  @Patch(':id/status') status(
    @Param('id') id: string,
    @Body() dto: ChangeOrderStatusDto,
    @CurrentUser() u: AuthUser,
  ) {
    return this.service.changeStatus(id, dto.status, u.employeeId);
  }
  @Patch(':id/move-table') move(
    @Param('id') id: string,
    @Body() dto: MoveTableDto,
  ) {
    return this.service.moveTable(id, dto.tableId);
  }
}
