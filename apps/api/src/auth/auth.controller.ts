import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from '@/auth/auth.service';
import { AppleAuthDto, GoogleAuthDto, RefreshDto } from '@/auth/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('google')
  google(@Body() dto: GoogleAuthDto) {
    return this.auth.google(dto);
  }

  /** Web admin: Google OAuth başlat → Google’a redirect */
  @Get('google/start')
  async googleStart(
    @Query('returnTo') returnTo: string | undefined,
    @Res() res: Response,
  ) {
    const url = await this.auth.getGoogleAuthUrl(returnTo);
    return res.redirect(url);
  }

  /** Web admin: Google callback → token üret → admin’e redirect */
  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Res() res: Response,
  ) {
    if (error) {
      const admin =
        process.env.ADMIN_APP_URL || 'http://localhost:5174';
      return res.redirect(
        `${admin}/login?error=${encodeURIComponent(error)}`,
      );
    }

    const session = await this.auth.handleGoogleCallback(code, state);
    if (!this.auth.isAdminEmail(session.user.email)) {
      throw new UnauthorizedException('Bu hesap admin paneline erişemez');
    }

    const redirectUrl = this.auth.buildAdminRedirectUrl(session.returnTo, {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    });
    return res.redirect(redirectUrl);
  }

  @Post('apple')
  apple(@Body() dto: AppleAuthDto) {
    return this.auth.apple(dto);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }
}
