import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import type { LandingContent } from '@hydrorage/shared';
import { LandingService } from '@/landing/landing.service';
import { AdminGuard } from '@/admin/admin.guard';

@Controller('landing')
export class LandingController {
  constructor(private readonly landing: LandingService) {}

  /** Public — hydrorage.com */
  @Get()
  get() {
    return this.landing.getContent();
  }
}

@Controller('admin/landing')
@UseGuards(AdminGuard)
export class AdminLandingController {
  constructor(private readonly landing: LandingService) {}

  @Get()
  get() {
    return this.landing.getContent();
  }

  @Put()
  put(@Body() body: LandingContent) {
    return this.landing.upsertContent(body);
  }
}
