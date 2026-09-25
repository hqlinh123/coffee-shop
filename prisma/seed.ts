import * as bcrypt from 'bcrypt';
import { ProductStatus, Role } from '../src/generated/prisma/client';
import { PrismaService } from '../prisma.service';
const prisma = new PrismaService();
async function main() {
  const passwordHash = await bcrypt.hash('Admin@123', 12);
  await prisma.user.upsert({
    where: { username: 'manager' },
    update: {},
    create: {
      username: 'manager',
      passwordHash,
      role: Role.MANAGER,
      employee: {
        create: {
          employeeCode: 'NV0001',
          fullName: 'Quản lý hệ thống',
          dateOfBirth: new Date('1990-01-01'),
          citizenId: '000000000001',
          phone: '0900000001',
        },
      },
    },
  });
  const coffee = await prisma.category.upsert({
    where: { name: 'Cà phê' },
    update: {},
    create: { name: 'Cà phê' },
  });
  await prisma.product.upsert({
    where: { code: 'SP0001' },
    update: {},
    create: {
      code: 'SP0001',
      categoryId: coffee.id,
      name: 'Cà phê sữa đá',
      price: 30000,
      status: ProductStatus.AVAILABLE,
    },
  });
  await prisma.cafeTable.upsert({
    where: { tableNumber: 1 },
    update: {},
    create: { tableNumber: 1, capacity: 4 },
  });
  console.log('Seeded manager / Admin@123');
}
main().finally(() => prisma.$disconnect());
