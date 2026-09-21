import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { TemplatesService } from '@/templates/templates.service';
import { CreateTemplateDto, UpdateTemplateDto } from '@/templates/templates.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { CurrentUser } from '@/auth/current-user.decorator';
import { Locale } from '@/common/locale';
import type { AppLocale } from '@hydrorage/shared';

@Controller('templates')
@UseGuards(JwtAuthGuard)
export class TemplatesController {
  constructor(private readonly templates: TemplatesService) {}

  @Get()
  list(
    @CurrentUser() user: { userId: string },
    @Locale() locale: AppLocale,
  ) {
    return this.templates.list(user.userId, locale);
  }

  @Post()
  create(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateTemplateDto,
  ) {
    return this.templates.create(user.userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    return this.templates.update(user.userId, id, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ) {
    return this.templates.remove(user.userId, id);
  }
}
