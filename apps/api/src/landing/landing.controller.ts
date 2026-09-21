import { Body, Controller, Get, Put, Query, UseGuards } from '@nestjs/common';
import type { LandingContent, LandingContentByLocale } from '@hydrorage/shared';
import { LandingService } from '@/landing/landing.service';
import { AdminGuard } from '@/admin/admin.guard';

@Controller('landing')
export class LandingController {
  constructor(private readonly landing: LandingService) {}

  /** Public — hydrorage.com.tr */
  @Get()
  get(@Query('lang') lang?: string) {
    return this.landing.getContent(lang);
  }
}

@Controller('admin/landing')
@UseGuards(AdminGuard)
export class AdminLandingController {
  constructor(private readonly landing: LandingService) {}

  @Get()
  get(@Query('lang') lang?: string) {
    if (lang === 'all') return this.landing.getByLocale();
    return this.landing.getContent(lang);
  }

  @Put()
  put(
    @Body() body: LandingContent | LandingContentByLocale,
    @Query('lang') lang?: string,
  ) {
    return this.landing.upsertContent(body, lang);
  }
}
