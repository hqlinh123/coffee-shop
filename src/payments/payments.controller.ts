import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AuthUser, CurrentUser } from '../auth/current-user.decorator';
import { PayOrderDto } from './payments.dto';
import { PaymentsService } from './payments.service';
@Controller('payments')
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}
  @Post('orders/:orderId') pay(
    @Param('orderId') id: string,
    @Body() dto: PayOrderDto,
    @CurrentUser() u: AuthUser,
  ) {
    return this.service.pay(id, dto, u.employeeId);
  }
  @Get() all(@Query('from') from?: string, @Query('to') to?: string) {
    return this.service.findAll(from, to);
  }
}
