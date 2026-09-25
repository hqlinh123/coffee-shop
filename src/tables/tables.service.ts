import { ConflictException, Injectable } from '@nestjs/common';
import { throwPrismaError } from '../common/prisma-error';
import { CreateTableDto, UpdateTableDto } from './tables.dto';
import { TableStatus } from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma.service';
@Injectable()
export class TablesService {
  constructor(private readonly prisma: PrismaService) {}
  findAll() {
    return this.prisma.cafeTable.findMany({ orderBy: { tableNumber: 'asc' } });
  }
  create(dto: CreateTableDto) {
    return this.prisma.cafeTable.create({ data: dto }).catch(throwPrismaError);
  }
  async update(id: string, dto: UpdateTableDto) {
    const table = await this.prisma.cafeTable
      .findUniqueOrThrow({ where: { id } })
      .catch(throwPrismaError);
    if (table.status === TableStatus.OCCUPIED)
      throw new ConflictException('Không thể sửa bàn đang có khách');
    if (dto.status === TableStatus.OCCUPIED)
      throw new ConflictException(
        'Trạng thái Có khách chỉ do hệ thống cập nhật',
      );
    return this.prisma.cafeTable
      .update({ where: { id }, data: dto })
      .catch(throwPrismaError);
  }
  async remove(id: string) {
    const table = await this.prisma.cafeTable
      .findUniqueOrThrow({
        where: { id },
        include: { _count: { select: { orders: true } } },
      })
      .catch(throwPrismaError);
    if (table.status !== TableStatus.EMPTY || table._count.orders > 0)
      throw new ConflictException(
        'Bàn đã có đơn hoặc không trống; hãy chuyển sang Ngừng sử dụng',
      );
    return this.prisma.cafeTable
      .delete({ where: { id } })
      .catch(throwPrismaError);
  }
}
