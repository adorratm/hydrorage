import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DrinkType } from '@/database/enums';
import { IntakeService } from '@/intake/intake.service';
import { CreateIntakeDto, UpdateIntakeDto } from '@/intake/intake.dto';
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

  @Patch(':id')
  update(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: UpdateIntakeDto,
  ) {
    return this.intake.update(user.userId, id, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ) {
    return this.intake.remove(user.userId, id);
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
