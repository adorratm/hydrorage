import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { User } from '@/database/entities';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @InjectEntityManager() private readonly em: EntityManager,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: { userId: string; email: string };
    }>();
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Yetkilendirme gerekli');
    }

    let payload: { sub: string; email: string };
    try {
      payload = await this.jwt.verifyAsync(header.slice(7), {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Token geçersiz');
    }

    if (!this.isAdminEmail(payload.email)) {
      throw new ForbiddenException('Admin yetkisi yok');
    }

    const user = await this.em.findOneBy(User, { id: payload.sub });
    if (!user) throw new UnauthorizedException('Kullanıcı bulunamadı');

    req.user = { userId: user.id, email: user.email };
    return true;
  }

  private isAdminEmail(email: string) {
    const raw = this.config.get<string>('ADMIN_EMAILS') || '';
    const allow = raw
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    if (!allow.length) return true;
    return allow.includes(email.toLowerCase());
  }
}
