import { Controller, Get, UseGuards } from '@nestjs/common';
import type { AppLocale } from '@hydrorage/shared';
import { DashboardService } from '@/dashboard/dashboard.service';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { CurrentUser } from '@/auth/current-user.decorator';
import { Locale } from '@/common/locale';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('today')
  today(
    @CurrentUser() user: { userId: string },
    @Locale() locale: AppLocale,
  ) {
    return this.dashboard.today(user.userId, locale);
  }

  @Get('streak')
  streak(@CurrentUser() user: { userId: string }) {
    return this.dashboard.streak(user.userId);
  }
}
