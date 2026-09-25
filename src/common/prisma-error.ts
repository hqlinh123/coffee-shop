import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';

export function throwPrismaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002')
      throw new ConflictException(
        `Dữ liệu bị trùng: ${String(error.meta?.target ?? '')}`,
      );
    if (error.code === 'P2003')
      throw new ConflictException('Không thể xóa vì dữ liệu đang được sử dụng');
    if (error.code === 'P2025')
      throw new NotFoundException('Không tìm thấy dữ liệu');
  }
  throw error;
}
