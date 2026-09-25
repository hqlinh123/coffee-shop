import { Controller, Get, Param, Query } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { InvoicesService } from './invoices.service';
import { PaymentMethod, Role } from '../../generated/prisma/enums';
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly service: InvoicesService) {}
  @Get() all(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('method') method?: PaymentMethod,
    @Query('code') code?: string,
  ) {
    return this.service.findAll(from, to, method, code);
  }
  @Get(':id') one(@Param('id') id: string) {
    return this.service.findOne(id);
  }
  @Roles(Role.MANAGER) @Get('reports/revenue') revenue(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.service.revenue(from, to);
  }
}
