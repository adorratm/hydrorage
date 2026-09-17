import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from '@/auth/auth.service';
import { AppleAuthDto, GoogleAuthDto, RefreshDto } from '@/auth/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('google')
  google(@Body() dto: GoogleAuthDto) {
    return this.auth.google(dto);
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
