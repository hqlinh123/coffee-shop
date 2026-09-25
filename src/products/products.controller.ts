import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { CreateProductDto, UpdateProductDto } from './products.dto';
import { ProductsService } from './products.service';
import { Role } from '../../generated/prisma/enums';
@Controller('products')
export class ProductsController {
  constructor(private readonly service: ProductsService) {}
  @Public() @Get('menu') menu(
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.service.findAll(true, search, categoryId);
  }
  @Get() all(
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.service.findAll(false, search, categoryId);
  }
  @Get(':id') one(@Param('id') id: string) {
    return this.service.findOne(id);
  }
  @Roles(Role.MANAGER) @Post() create(@Body() dto: CreateProductDto) {
    return this.service.create(dto);
  }
  @Roles(Role.MANAGER) @Patch(':id') update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.service.update(id, dto);
  }
  @Roles(Role.MANAGER) @Delete(':id') remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
