import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { EmployeesModule } from './employees/employees.module';
import { InvoicesModule } from './invoices/invoices.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { ProductsModule } from './products/products.module';
import { TablesModule } from './tables/tables.module';
import { APP_GUARD } from '@nestjs/core/constants';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    AuthModule,
    EmployeesModule,
    CategoriesModule,
    ProductsModule,
    TablesModule,
    OrdersModule,
    PaymentsModule,
    InvoicesModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    AppService
  ],
})
export class AppModule {}
