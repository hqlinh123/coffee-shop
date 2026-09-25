import { Injectable } from '@nestjs/common';
import { makeCode } from '../common/code';
import { throwPrismaError } from '../common/prisma-error';
import { CreateProductDto, UpdateProductDto } from './products.dto';
import { ProductStatus } from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma.service';
@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}
  findAll(publicOnly = false, search?: string, categoryId?: string) {
    return this.prisma.product.findMany({
      where: {
        ...(publicOnly ? { status: ProductStatus.AVAILABLE } : {}),
        ...(categoryId ? { categoryId } : {}),
        ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      },
      include: { category: true },
      orderBy: { name: 'asc' },
    });
  }
  findOne(id: string) {
    return this.prisma.product
      .findUniqueOrThrow({ where: { id }, include: { category: true } })
      .catch(throwPrismaError);
  }
  create(dto: CreateProductDto) {
    return this.prisma.product
      .create({
        data: { ...dto, code: makeCode('SP') },
        include: { category: true },
      })
      .catch(throwPrismaError);
  }
  update(id: string, dto: UpdateProductDto) {
    return this.prisma.product
      .update({ where: { id }, data: dto, include: { category: true } })
      .catch(throwPrismaError);
  }
  remove(id: string) {
    return this.prisma.product
      .delete({ where: { id } })
      .catch(throwPrismaError);
  }
}
