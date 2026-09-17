import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from '@/dashboard/dashboard.service';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { CurrentUser } from '@/auth/current-user.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('today')
  today(@CurrentUser() user: { userId: string }) {
    return this.dashboard.today(user.userId);
  }
}
