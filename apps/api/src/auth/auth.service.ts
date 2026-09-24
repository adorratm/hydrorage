import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
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

type GoogleOAuthState = {
  nonce: string;
  returnTo: string;
};

@Injectable()
export class AuthService {
  private readonly googleVerifyClient: OAuth2Client;

  constructor(
    @InjectEntityManager() private readonly em: EntityManager,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {
    this.googleVerifyClient = new OAuth2Client();
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
      const ticket = await this.googleVerifyClient.verifyIdToken({
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

  async getGoogleAuthUrl(returnTo?: string) {
    const client = this.googleOAuthClient();
    const state = await this.jwt.signAsync(
      {
        nonce: randomUUID(),
        returnTo: this.resolveReturnTo(returnTo),
      } satisfies GoogleOAuthState,
      {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: '10m',
      },
    );

    return client.generateAuthUrl({
      access_type: 'online',
      prompt: 'select_account',
      scope: ['openid', 'email', 'profile'],
      state,
      include_granted_scopes: true,
    });
  }

  async handleGoogleCallback(code?: string, state?: string) {
    if (!code || !state) {
      throw new BadRequestException('Google callback code/state eksik');
    }

    let parsed: GoogleOAuthState;
    try {
      parsed = await this.jwt.verifyAsync<GoogleOAuthState>(state, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Google OAuth state geçersiz');
    }

    const client = this.googleOAuthClient();
    let idToken: string | undefined | null;
    try {
      const { tokens } = await client.getToken(code);
      idToken = tokens.id_token;
    } catch {
      throw new UnauthorizedException('Google authorization code geçersiz');
    }

    if (!idToken) {
      throw new UnauthorizedException('Google idToken alınamadı');
    }

    const session = await this.google({ idToken });
    return {
      ...session,
      returnTo: parsed.returnTo,
    };
  }

  buildAdminRedirectUrl(
    returnTo: string,
    tokens: { accessToken: string; refreshToken: string },
  ) {
    const url = new URL('/auth/callback', returnTo);
    url.searchParams.set('accessToken', tokens.accessToken);
    url.searchParams.set('refreshToken', tokens.refreshToken);
    return url.toString();
  }

  isAdminEmail(email: string) {
    const raw = this.config.get<string>('ADMIN_EMAILS') || '';
    const allow = raw
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    if (!allow.length) return true;
    return allow.includes(email.toLowerCase());
  }

  private googleOAuthClient() {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID_WEB');
    const clientSecret = this.config.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri =
      this.config.get<string>('GOOGLE_REDIRECT_URI') ||
      'http://localhost:3000/api/auth/google/callback';

    if (!clientId || !clientSecret) {
      throw new BadRequestException(
        'GOOGLE_CLIENT_ID_WEB ve GOOGLE_CLIENT_SECRET gerekli',
      );
    }

    return new OAuth2Client(clientId, clientSecret, redirectUri);
  }

  private resolveReturnTo(returnTo?: string) {
    const adminAppUrl =
      this.config.get<string>('ADMIN_APP_URL') || 'http://localhost:5174';
    if (!returnTo) return adminAppUrl;

    try {
      const target = new URL(returnTo);
      const allowed = new URL(adminAppUrl);
      if (target.origin !== allowed.origin) {
        return adminAppUrl;
      }
      return target.origin;
    } catch {
      return adminAppUrl;
    }
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
    if (!stored) {
      throw new UnauthorizedException('Refresh token geçersiz');
    }
    stored.expiresAt = this.refreshExpiresAt();
    await this.em.save(stored);
    const accessToken = await this.signAccess(stored.user.id, stored.user.email);
    return {
      accessToken,
      refreshToken,
      user: {
        id: stored.user.id,
        email: stored.user.email,
        displayName: stored.user.displayName,
      },
    };
  }

  async logout(refreshToken: string) {
    await this.em.delete(RefreshToken, { token: refreshToken });
    return { ok: true };
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
    const accessToken = await this.signAccess(userId, email);
    const refreshToken = randomUUID();
    const expiresAt = this.refreshExpiresAt();
    await this.em.save(
      this.em.create(RefreshToken, { token: refreshToken, userId, expiresAt }),
    );
    return {
      accessToken,
      refreshToken,
      user: { id: userId, email, displayName },
    };
  }

  private async signAccess(userId: string, email: string) {
    return this.jwt.signAsync(
      { sub: userId, email },
      {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: (this.config.get<string>('JWT_ACCESS_EXPIRES') ||
          '15m') as `${number}m`,
      },
    );
  }

  /** Çıkışa kadar geçerli. Süre yalnızca kayıp token için üst sınırdır. */
  private refreshExpiresAt() {
    const raw = (this.config.get<string>('JWT_REFRESH_EXPIRES') || '3650d').trim();
    const match = /^(\d+)([dhms])$/.exec(raw);
    const at = new Date();
    if (!match) {
      at.setDate(at.getDate() + 3650);
      return at;
    }
    const amount = Number(match[1]);
    const unit = match[2];
    if (unit === 'd') at.setDate(at.getDate() + amount);
    else if (unit === 'h') at.setHours(at.getHours() + amount);
    else if (unit === 'm') at.setMinutes(at.getMinutes() + amount);
    else at.setSeconds(at.getSeconds() + amount);
    return at;
  }
}
