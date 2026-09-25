import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthUser, CurrentUser } from './current-user.decorator';
import { ChangePasswordDto, LoginDto } from './dto';
import { Public } from './public.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}
  @Public() @Post('login') login(@Body() dto: LoginDto) {
    return this.service.login(dto);
  }
  @ApiBearerAuth() @Get('me') me(@CurrentUser() user: AuthUser) {
    return user;
  }
  @ApiBearerAuth() @Patch('change-password') change(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.service.changePassword(user, dto);
  }
}
