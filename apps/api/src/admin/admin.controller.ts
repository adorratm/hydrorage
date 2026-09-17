import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminGuard } from '@/admin/admin.guard';
import { AdminService } from '@/admin/admin.service';
import { CurrentUser } from '@/auth/current-user.decorator';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('me')
  me(@CurrentUser() user: { userId: string; email: string }) {
    return user;
  }

  @Get('overview')
  overview() {
    return this.admin.overview();
  }

  @Get('users')
  users(@Query('limit') limit?: string) {
    const n = limit ? Number(limit) : 50;
    return this.admin.listUsers(Number.isFinite(n) ? n : 50);
  }
}
