import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { OAuth2Client } from 'google-auth-library';
import appleSignin from 'apple-signin-auth';
import { randomUUID } from 'crypto';
import {
  Character,
  RefreshToken,
  User,
  UserSettings,
} from '@/database/entities';
import { AuthProvider } from '@/database/enums';
import { AppleAuthDto, GoogleAuthDto } from '@/auth/auth.dto';

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;

  constructor(
    @InjectEntityManager() private readonly em: EntityManager,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {
    this.googleClient = new OAuth2Client();
  }

  async google(dto: GoogleAuthDto) {
    const audiences = this.googleAudiences();
    if (!audiences.length) {
      throw new UnauthorizedException(
        'Google Client ID yapılandırılmamış (GOOGLE_CLIENT_ID_*)',
      );
    }
    let payload;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: dto.idToken,
        audience: audiences,
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Google token doğrulanamadı');
    }

    if (!payload?.sub || !payload.email) {
      throw new UnauthorizedException('Google hesabından e-posta alınamadı');
    }

    return this.upsertSocialUser({
      provider: AuthProvider.GOOGLE,
      providerId: payload.sub,
      email: payload.email,
      displayName: payload.name || payload.email.split('@')[0],
      avatarUrl: payload.picture,
    });
  }

  async apple(dto: AppleAuthDto) {
    const clientId =
      this.config.get<string>('APPLE_CLIENT_ID') || 'com.hydrorage.app';

    let claims: { sub: string; email?: string };
    try {
      claims = await appleSignin.verifyIdToken(dto.identityToken, {
        audience: clientId,
        ignoreExpiration: false,
      });
    } catch {
      throw new UnauthorizedException('Apple token doğrulanamadı');
    }

    const email =
      claims.email ||
      dto.email ||
      `${claims.sub}@privaterelay.appleid.com`;

    const displayName =
      dto.fullName?.trim() || email.split('@')[0] || 'Apple Kullanıcı';

    return this.upsertSocialUser({
      provider: AuthProvider.APPLE,
      providerId: claims.sub,
      email,
      displayName,
    });
  }

  async refresh(refreshToken: string) {
    const stored = await this.em.findOne(RefreshToken, {
      where: { token: refreshToken },
      relations: { user: true },
    });
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token geçersiz');
    }
    await this.em.remove(stored);
    return this.issueTokens(
      stored.user.id,
      stored.user.email,
      stored.user.displayName,
    );
  }

  private googleAudiences() {
    return [
      this.config.get<string>('GOOGLE_CLIENT_ID_IOS'),
      this.config.get<string>('GOOGLE_CLIENT_ID_ANDROID'),
      this.config.get<string>('GOOGLE_CLIENT_ID_WEB'),
      this.config.get<string>('GOOGLE_CLIENT_ID'),
    ].filter((v): v is string => !!v && v.length > 0);
  }

  private async upsertSocialUser(input: {
    provider: AuthProvider;
    providerId: string;
    email: string;
    displayName: string;
    avatarUrl?: string | null;
  }) {
    const email = input.email.toLowerCase();
    const defaultCharacter = await this.em.findOne(Character, {
      where: { slug: 'ofkeli-mahalle-abisi' },
    });

    const existingByProvider = await this.em.findOne(User, {
      where: { provider: input.provider, providerId: input.providerId },
    });

    if (existingByProvider) {
      existingByProvider.displayName =
        input.displayName || existingByProvider.displayName;
      existingByProvider.avatarUrl =
        input.avatarUrl ?? existingByProvider.avatarUrl;
      existingByProvider.email = email;
      const user = await this.em.save(existingByProvider);
      return this.issueTokens(user.id, user.email, user.displayName);
    }

    const existingByEmail = await this.em.findOne(User, { where: { email } });
    if (existingByEmail) {
      existingByEmail.provider = input.provider;
      existingByEmail.providerId = input.providerId;
      existingByEmail.displayName =
        input.displayName || existingByEmail.displayName;
      existingByEmail.avatarUrl =
        input.avatarUrl ?? existingByEmail.avatarUrl;
      existingByEmail.passwordHash = null;
      const user = await this.em.save(existingByEmail);
      return this.issueTokens(user.id, user.email, user.displayName);
    }

    const user = await this.em.save(
      this.em.create(User, {
        email,
        displayName: input.displayName,
        provider: input.provider,
        providerId: input.providerId,
        avatarUrl: input.avatarUrl ?? null,
      }),
    );

    await this.em.save(
      this.em.create(UserSettings, {
        userId: user.id,
        activeCharacterId: defaultCharacter?.id ?? null,
      }),
    );

    return this.issueTokens(user.id, user.email, user.displayName);
  }

  private async issueTokens(
    userId: string,
    email: string,
    displayName: string,
  ) {
    const accessToken = await this.jwt.signAsync(
      { sub: userId, email },
      {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: (this.config.get<string>('JWT_ACCESS_EXPIRES') ||
          '15m') as `${number}m`,
      },
    );
    const refreshToken = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await this.em.save(
      this.em.create(RefreshToken, { token: refreshToken, userId, expiresAt }),
    );
    return {
      accessToken,
      refreshToken,
      user: { id: userId, email, displayName },
    };
  }
}
