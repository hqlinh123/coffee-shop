import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthUser } from './current-user.decorator';
import { UserStatus } from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }
  async validate(payload: AuthUser): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { employee: true },
    });
    if (
      !user ||
      user.status !== UserStatus.ACTIVE ||
      !user.employee ||
      user.employee.employmentStatus !== 'WORKING'
    )
      throw new UnauthorizedException('Tài khoản không còn hoạt động');
    return {
      sub: user.id,
      employeeId: user.employee.id,
      username: user.username,
      role: user.role,
    };
  }
}
