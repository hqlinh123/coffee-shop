import { Injectable } from '@nestjs/common';
import { throwPrismaError } from '../common/prisma-error';
import { CategoryDto } from './categories.dto';
import { PrismaService } from '../../prisma.service';
@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}
  findAll() {
    return this.prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    });
  }
  create(dto: CategoryDto) {
    return this.prisma.category.create({ data: dto }).catch(throwPrismaError);
  }
  update(id: string, dto: CategoryDto) {
    return this.prisma.category
      .update({ where: { id }, data: dto })
      .catch(throwPrismaError);
  }
  remove(id: string) {
    return this.prisma.category
      .delete({ where: { id } })
      .catch(throwPrismaError);
  }
}
