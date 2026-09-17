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
import { RoutinesService } from '@/routines/routines.service';
import { CreateRoutineDto, UpdateRoutineDto } from '@/routines/routines.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { CurrentUser } from '@/auth/current-user.decorator';

@Controller('routines')
@UseGuards(JwtAuthGuard)
export class RoutinesController {
  constructor(private readonly routines: RoutinesService) {}

  @Get()
  list(@CurrentUser() user: { userId: string }) {
    return this.routines.list(user.userId);
  }

  @Get('timeline')
  timeline(@CurrentUser() user: { userId: string }) {
    return this.routines.timelineToday(user.userId);
  }

  @Post('logs/:id/complete')
  complete(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ) {
    return this.routines.completeLog(user.userId, id);
  }

  @Post()
  create(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateRoutineDto,
  ) {
    return this.routines.create(user.userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: UpdateRoutineDto,
  ) {
    return this.routines.update(user.userId, id, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ) {
    return this.routines.remove(user.userId, id);
  }
}
