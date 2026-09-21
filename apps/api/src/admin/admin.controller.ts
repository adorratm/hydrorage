import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
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

  @Get('users/:id')
  user(@Param('id') id: string) {
    return this.admin.getUser(id);
  }

  @Get('users/:id/activity')
  activity(
    @Param('id') id: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('type') type?: string,
  ) {
    return this.admin.userActivity(id, {
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
      type,
    });
  }
}
