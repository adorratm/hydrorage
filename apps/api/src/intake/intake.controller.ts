import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DrinkType } from '@/database/enums';
import { IntakeService } from '@/intake/intake.service';
import { CreateIntakeDto } from '@/intake/intake.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { CurrentUser } from '@/auth/current-user.decorator';

@Controller('intake')
@UseGuards(JwtAuthGuard)
export class IntakeController {
  constructor(private readonly intake: IntakeService) {}

  @Post()
  create(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateIntakeDto,
  ) {
    return this.intake.create(user.userId, dto);
  }

  @Get()
  list(
    @CurrentUser() user: { userId: string },
    @Query('type') type?: DrinkType,
  ) {
    return this.intake.listToday(user.userId, type);
  }

  @Get('summary')
  summary(@CurrentUser() user: { userId: string }) {
    return this.intake.summaryToday(user.userId);
  }
}
