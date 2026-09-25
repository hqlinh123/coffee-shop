import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { CreateTableDto, UpdateTableDto } from './tables.dto';
import { TablesService } from './tables.service';
import { Role } from '../../generated/prisma/enums';
@Controller('tables')
export class TablesController {
  constructor(private readonly service: TablesService) {}
  @Get() all() {
    return this.service.findAll();
  }
  @Roles(Role.MANAGER) @Post() create(@Body() dto: CreateTableDto) {
    return this.service.create(dto);
  }
  @Roles(Role.MANAGER) @Patch(':id') update(
    @Param('id') id: string,
    @Body() dto: UpdateTableDto,
  ) {
    return this.service.update(id, dto);
  }
  @Roles(Role.MANAGER) @Delete(':id') remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
