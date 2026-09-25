import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { makeCode } from '../common/code';
import { PayOrderDto } from './payments.dto';
import { PrismaService } from '../../prisma.service';
import { Prisma } from '../../generated/prisma/client';
import {
  PaymentStatus,
  OrderStatus,
  PaymentMethod,
  OrderType,
  TableStatus,
} from '../../generated/prisma/enums';
@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}
  async pay(orderId: string, dto: PayOrderDto, employeeId: string) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUniqueOrThrow({
        where: { id: orderId },
        include: { payment: true },
      });
      if (order.payment || order.paymentStatus === PaymentStatus.PAID)
        throw new ConflictException('Đơn hàng đã thanh toán');
      if (order.status !== OrderStatus.SERVED)
        throw new ConflictException(
          'Chỉ thanh toán đơn ở trạng thái Đã phục vụ',
        );
      const amount = new Prisma.Decimal(order.totalAmount);
      let cash: Prisma.Decimal | null = null;
      let change: Prisma.Decimal | null = null;
      if (dto.method === PaymentMethod.CASH) {
        if (dto.cashReceived === undefined)
          throw new BadRequestException('Phải nhập tiền khách đưa');
        cash = new Prisma.Decimal(dto.cashReceived);
        if (cash.lessThan(amount))
          throw new BadRequestException('Tiền khách đưa nhỏ hơn tổng tiền');
        change = cash.sub(amount);
      }
      const payment = await tx.payment.create({
        data: {
          code: makeCode('TT'),
          orderId,
          receivedByEmployeeId: employeeId,
          method: dto.method,
          amount,
          cashReceived: cash,
          changeAmount: change,
        },
      });
      const invoice = await tx.invoice.create({
        data: {
          code: makeCode('HD'),
          orderId,
          paymentId: payment.id,
          issuedByEmployeeId: employeeId,
          totalAmount: amount,
        },
      });
      await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: PaymentStatus.PAID,
          status: OrderStatus.COMPLETED,
          completedAt: new Date(),
        },
      });
      if (order.orderType === OrderType.DINE_IN && order.tableId)
        await tx.cafeTable.update({
          where: { id: order.tableId },
          data: { status: TableStatus.EMPTY },
        });
      return tx.invoice.findUnique({
        where: { id: invoice.id },
        include: {
          payment: true,
          order: { include: { items: true, table: true } },
          issuedBy: { select: { id: true, fullName: true } },
        },
      });
    });
  }
  findAll(from?: string, to?: string) {
    return this.prisma.payment.findMany({
      where: {
        paidAt: {
          ...(from ? { gte: new Date(from) } : {}),
          ...(to ? { lte: new Date(to) } : {}),
        },
      },
      include: {
        order: true,
        receivedBy: { select: { id: true, fullName: true } },
        invoice: true,
      },
      orderBy: { paidAt: 'desc' },
    });
  }
}
