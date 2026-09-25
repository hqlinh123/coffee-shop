import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { PaymentMethod, Prisma } from '../generated/prisma/client';
@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}
  private include = {
    payment: true,
    issuedBy: { select: { id: true, employeeCode: true, fullName: true } },
    order: { include: { table: true, items: true } },
  } as const;
  findAll(from?: string, to?: string, method?: PaymentMethod, code?: string) {
    return this.prisma.invoice.findMany({
      where: {
        ...(code ? { code: { contains: code, mode: 'insensitive' } } : {}),
        issuedAt: {
          ...(from ? { gte: new Date(from) } : {}),
          ...(to ? { lte: new Date(to) } : {}),
        },
        ...(method ? { payment: { method } } : {}),
      },
      include: this.include,
      orderBy: { issuedAt: 'desc' },
    });
  }
  findOne(id: string) {
    return this.prisma.invoice
      .findUniqueOrThrow({ where: { id }, include: this.include })
      .catch(() => {
        throw new NotFoundException('Không tìm thấy hóa đơn');
      });
  }
  async revenue(from: string, to: string) {
    const where: Prisma.PaymentWhereInput = {
      paidAt: { gte: new Date(from), lte: new Date(to) },
    };
    const [total, byMethod, byDay] = await Promise.all([
      this.prisma.payment.aggregate({
        where,
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.payment.groupBy({
        by: ['method'],
        where,
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.$queryRaw<
        Array<{ day: Date; revenue: Prisma.Decimal; invoice_count: bigint }>
      >`SELECT DATE(paid_at) AS day, SUM(amount) AS revenue, COUNT(*) AS invoice_count FROM payments WHERE paid_at >= ${new Date(from)} AND paid_at <= ${new Date(to)} GROUP BY DATE(paid_at) ORDER BY day`,
    ]);
    return {
      totalRevenue: total._sum.amount ?? new Prisma.Decimal(0),
      invoiceCount: total._count,
      byMethod,
      byDay: byDay.map((x) => ({
        ...x,
        invoice_count: Number(x.invoice_count),
      })),
    };
  }
}
