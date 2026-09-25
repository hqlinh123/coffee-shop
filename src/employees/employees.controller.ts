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
import { AuthUser, CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { CreateEmployeeDto, UpdateEmployeeDto } from './employees.dto';
import { EmployeesService } from './employees.service';
import { Role } from '../../generated/prisma/enums';
@Roles(Role.MANAGER)
@Controller('employees')
export class EmployeesController {
  constructor(private readonly service: EmployeesService) {}
  @Get() all(@Query('search') search?: string) {
    return this.service.findAll(search);
  }
  @Get(':id') one(@Param('id') id: string) {
    return this.service.findOne(id);
  }
  @Post() create(@Body() dto: CreateEmployeeDto) {
    return this.service.create(dto);
  }
  @Patch(':id') update(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.service.update(id, dto);
  }
  @Delete(':id') remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.remove(id, user.employeeId);
  }
}
