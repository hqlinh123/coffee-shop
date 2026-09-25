import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { CategoryDto } from './categories.dto';
import { CategoriesService } from './categories.service';
import { Role } from '../../generated/prisma/client';
@Controller('categories')
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}
  @Public() @Get() all() {
    return this.service.findAll();
  }
  @Roles(Role.MANAGER) @Post() create(@Body() dto: CategoryDto) {
    return this.service.create(dto);
  }
  @Roles(Role.MANAGER) @Patch(':id') update(
    @Param('id') id: string,
    @Body() dto: CategoryDto,
  ) {
    return this.service.update(id, dto);
  }
  @Roles(Role.MANAGER) @Delete(':id') remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
