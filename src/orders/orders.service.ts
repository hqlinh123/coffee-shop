import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { makeCode } from '../common/code';
import { AddItemsDto, CreateOrderDto } from './orders.dto';
import { Prisma } from '../../generated/prisma/client';
import {
  OrderStatus,
  ProductStatus,
  OrderType,
  TableStatus,
  PaymentStatus,
} from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma.service';
@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}
  private include = {
    items: { include: { product: true } },
    table: true,
    createdBy: { select: { id: true, fullName: true } },
    confirmedBy: { select: { id: true, fullName: true } },
    servedBy: { select: { id: true, fullName: true } },
    payment: true,
    invoice: true,
  } as const;
  findAll(status?: OrderStatus) {
    return this.prisma.order.findMany({
      where: status ? { status } : {},
      include: this.include,
      orderBy: { orderedAt: 'desc' },
    });
  }
  findOne(id: string) {
    return this.prisma.order
      .findUniqueOrThrow({ where: { id }, include: this.include })
      .catch(() => {
        throw new NotFoundException('Không tìm thấy đơn hàng');
      });
  }
  findByCode(code: string) {
    return this.prisma.order
      .findUniqueOrThrow({ where: { code }, include: this.include })
      .catch(() => {
        throw new NotFoundException('Không tìm thấy đơn hàng');
      });
  }
  private async itemData(
    tx: Prisma.TransactionClient,
    items: AddItemsDto['items'],
  ) {
    const ids = [...new Set(items.map((i) => i.productId))];
    const products = await tx.product.findMany({
      where: { id: { in: ids }, status: ProductStatus.AVAILABLE },
    });
    if (products.length !== ids.length)
      throw new BadRequestException('Có món không tồn tại hoặc đang tạm ngưng');
    return items.map((item) => {
      const p = products.find((x) => x.id === item.productId)!;
      const lineTotal = new Prisma.Decimal(p.price).mul(item.quantity);
      return {
        productId: p.id,
        productName: p.name,
        quantity: item.quantity,
        unitPrice: p.price,
        lineTotal,
        note: item.note,
      };
    });
  }
  async create(dto: CreateOrderDto, employeeId?: string) {
    if (dto.orderType === OrderType.DINE_IN && !dto.tableId)
      throw new BadRequestException('Đơn uống tại chỗ phải chọn bàn');
    if (dto.orderType === OrderType.TAKEAWAY && dto.tableId)
      throw new BadRequestException('Đơn mang đi không được chọn bàn');
    return this.prisma.$transaction(async (tx) => {
      let existing = null;
      if (dto.tableId) {
        const table = await tx.cafeTable.findUnique({
          where: { id: dto.tableId },
        });
        if (!table || table.status === TableStatus.OUT_OF_SERVICE)
          throw new BadRequestException('Bàn không tồn tại hoặc ngừng sử dụng');
        existing = await tx.order.findFirst({
          where: {
            tableId: dto.tableId,
            paymentStatus: PaymentStatus.UNPAID,
            status: { not: OrderStatus.CANCELLED },
          },
        });
      }
      const rows = await this.itemData(tx, dto.items);
      if (existing) {
        await tx.orderItem.createMany({
          data: rows.map((x) => ({ ...x, orderId: existing!.id })),
        });
        const sum = rows.reduce(
          (s, x) => s.add(x.lineTotal),
          new Prisma.Decimal(existing.totalAmount),
        );
        return tx.order.update({
          where: { id: existing.id },
          data: { totalAmount: sum },
          include: this.include,
        });
      }
      const total = rows.reduce(
        (s, x) => s.add(x.lineTotal),
        new Prisma.Decimal(0),
      );
      const order = await tx.order.create({
        data: {
          code: makeCode('DH'),
          orderType: dto.orderType,
          tableId: dto.tableId,
          customerNote: dto.customerNote,
          totalAmount: total,
          createdByEmployeeId: employeeId,
          status: employeeId ? OrderStatus.PREPARING : OrderStatus.PENDING,
          confirmedByEmployeeId: employeeId,
          confirmedAt: employeeId ? new Date() : undefined,
          items: { create: rows },
        },
        include: this.include,
      });
      if (dto.tableId)
        await tx.cafeTable.update({
          where: { id: dto.tableId },
          data: { status: TableStatus.OCCUPIED },
        });
      return order;
    });
  }
  async addItems(id: string, dto: AddItemsDto) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUniqueOrThrow({ where: { id } });
      if (
        order.status === OrderStatus.COMPLETED ||
        order.status === OrderStatus.CANCELLED
      )
        throw new ConflictException('Không thể thêm món vào đơn đã đóng');
      const rows = await this.itemData(tx, dto.items);
      await tx.orderItem.createMany({
        data: rows.map((x) => ({ ...x, orderId: id })),
      });
      return tx.order.update({
        where: { id },
        data: {
          totalAmount: rows.reduce(
            (s, x) => s.add(x.lineTotal),
            new Prisma.Decimal(order.totalAmount),
          ),
        },
        include: this.include,
      });
    });
  }
  async changeStatus(id: string, next: OrderStatus, employeeId: string) {
    return this.prisma.$transaction(async (tx) => {
      const o = await tx.order.findUniqueOrThrow({ where: { id } });
      const allowed: Record<OrderStatus, OrderStatus[]> = {
        [OrderStatus.PENDING]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
        [OrderStatus.PREPARING]: [OrderStatus.SERVED],
        [OrderStatus.SERVED]: [],
        [OrderStatus.COMPLETED]: [],
        [OrderStatus.CANCELLED]: [],
      };
      if (!allowed[o.status].includes(next))
        throw new ConflictException(`Không thể chuyển ${o.status} → ${next}`);
      const data: Prisma.OrderUpdateInput = { status: next };
      if (next === OrderStatus.PREPARING) {
        data.confirmedBy = { connect: { id: employeeId } };
        data.confirmedAt = new Date();
      }
      if (next === OrderStatus.SERVED) {
        data.servedBy = { connect: { id: employeeId } };
        data.servedAt = new Date();
      }
      if (next === OrderStatus.CANCELLED) {
        data.cancelledAt = new Date();
        if (o.tableId)
          await tx.cafeTable.update({
            where: { id: o.tableId },
            data: { status: TableStatus.EMPTY },
          });
      }
      return tx.order.update({ where: { id }, data, include: this.include });
    });
  }
  async moveTable(id: string, newTableId: string) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUniqueOrThrow({ where: { id } });
      if (
        order.orderType !== OrderType.DINE_IN ||
        !order.tableId ||
        order.paymentStatus === PaymentStatus.PAID
      )
        throw new ConflictException(
          'Chỉ chuyển bàn cho đơn tại chỗ chưa thanh toán',
        );
      const target = await tx.cafeTable.findUniqueOrThrow({
        where: { id: newTableId },
      });
      if (target.status !== TableStatus.EMPTY)
        throw new ConflictException('Bàn mới không trống');
      await tx.cafeTable.update({
        where: { id: order.tableId },
        data: { status: TableStatus.EMPTY },
      });
      await tx.cafeTable.update({
        where: { id: newTableId },
        data: { status: TableStatus.OCCUPIED },
      });
      return tx.order.update({
        where: { id },
        data: { tableId: newTableId },
        include: this.include,
      });
    });
  }
}
