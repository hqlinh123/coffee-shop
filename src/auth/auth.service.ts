import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthUser } from './current-user.decorator';
import { ChangePasswordDto, LoginDto } from './dto';
import { UserStatus } from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
      include: { employee: true },
    });
    if (
      !user ||
      user.status !== UserStatus.ACTIVE ||
      !user.employee ||
      !(await bcrypt.compare(dto.password, user.passwordHash))
    )
      throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không đúng');
    const payload: AuthUser = {
      sub: user.id,
      employeeId: user.employee.id,
      username: user.username,
      role: user.role,
    };
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    return { accessToken: await this.jwt.signAsync(payload), user: payload };
  }
  async changePassword(user: AuthUser, dto: ChangePasswordDto) {
    const account = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.sub },
    });
    if (!(await bcrypt.compare(dto.oldPassword, account.passwordHash)))
      throw new UnauthorizedException('Mật khẩu hiện tại không đúng');
    await this.prisma.user.update({
      where: { id: user.sub },
      data: { passwordHash: await bcrypt.hash(dto.newPassword, 12) },
    });
    return { message: 'Đổi mật khẩu thành công' };
  }
}
