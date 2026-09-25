import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { makeCode } from '../common/code';
import { throwPrismaError } from '../common/prisma-error';
import { CreateEmployeeDto, UpdateEmployeeDto } from './employees.dto';
import { PrismaService } from '../../prisma.service';
import { EmploymentStatus, UserStatus } from '../generated/prisma/client';
@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}
  private assertAdult(value: string) {
    const d = new Date(value);
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - 18);
    if (Number.isNaN(d.valueOf()) || d > cutoff)
      throw new BadRequestException('Nhân viên phải đủ 18 tuổi');
    return d;
  }
  findAll(search?: string) {
    return this.prisma.employee.findMany({
      where: search
        ? {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search } },
            ],
          }
        : {},
      include: {
        user: {
          select: { id: true, username: true, role: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
  findOne(id: string) {
    return this.prisma.employee
      .findUniqueOrThrow({
        where: { id },
        include: {
          user: {
            select: { id: true, username: true, role: true, status: true },
          },
        },
      })
      .catch(throwPrismaError);
  }
  async create(dto: CreateEmployeeDto) {
    const { username, password, role, dateOfBirth, ...employee } = dto;
    return this.prisma
      .$transaction(async (tx) =>
        tx.employee.create({
          data: {
            ...employee,
            dateOfBirth: this.assertAdult(dateOfBirth),
            employeeCode: makeCode('NV'),
            user: {
              create: {
                username,
                passwordHash: await bcrypt.hash(password, 12),
                role,
              },
            },
          },
          include: {
            user: {
              select: { id: true, username: true, role: true, status: true },
            },
          },
        }),
      )
      .catch(throwPrismaError);
  }
  async update(id: string, dto: UpdateEmployeeDto) {
    const { role, dateOfBirth, employmentStatus, ...data } = dto;
    return this.prisma
      .$transaction(async (tx) => {
        const employee = await tx.employee.update({
          where: { id },
          data: {
            ...data,
            ...(dateOfBirth
              ? { dateOfBirth: this.assertAdult(dateOfBirth) }
              : {}),
            ...(employmentStatus ? { employmentStatus } : {}),
          },
        });
        if (role || employmentStatus)
          await tx.user.update({
            where: { id: employee.userId },
            data: {
              ...(role ? { role } : {}),
              ...(employmentStatus
                ? {
                    status:
                      employmentStatus === EmploymentStatus.WORKING
                        ? UserStatus.ACTIVE
                        : UserStatus.LOCKED,
                  }
                : {}),
            },
          });
        return tx.employee.findUnique({
          where: { id },
          include: {
            user: {
              select: { id: true, username: true, role: true, status: true },
            },
          },
        });
      })
      .catch(throwPrismaError);
  }
  async remove(id: string, currentEmployeeId: string) {
    if (id === currentEmployeeId)
      throw new ConflictException('Quản lý không thể tự xóa chính mình');
    const employee = await this.prisma.employee
      .findUniqueOrThrow({
        where: { id },
        include: {
          _count: {
            select: {
              createdOrders: true,
              confirmedOrders: true,
              servedOrders: true,
              payments: true,
              invoices: true,
            },
          },
        },
      })
      .catch(throwPrismaError);
    const used = Object.values(employee._count).some(Number);
    if (used)
      throw new ConflictException(
        'Nhân viên đã phát sinh nghiệp vụ; hãy chuyển trạng thái sang Nghỉ việc',
      );
    return this.prisma.$transaction([
      this.prisma.employee.delete({ where: { id } }),
      this.prisma.user.delete({ where: { id: employee.userId } }),
    ]);
  }
}
