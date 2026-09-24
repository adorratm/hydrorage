import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';
import { UsersService } from '@/users/users.service';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { CurrentUser } from '@/auth/current-user.decorator';

class UpdateProfileDto {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsInt()
  @Min(500)
  dailyGoalMl?: number;
}

class PushTokenDto {
  /** null = token temizle */
  @ValidateIf((_, v) => v !== null)
  @IsString()
  token!: string | null;
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: { userId: string }) {
    return this.users.findById(user.userId);
  }

  @Get('me/export')
  export(@CurrentUser() user: { userId: string }) {
    return this.users.exportData(user.userId);
  }

  @Patch('me')
  update(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.users.update(user.userId, dto);
  }

  @Post('me/seen')
  seen(@CurrentUser() user: { userId: string }) {
    return this.users.markOpened(user.userId);
  }

  @Post('me/push-token')
  pushToken(
    @CurrentUser() user: { userId: string },
    @Body() dto: PushTokenDto,
  ) {
    return this.users.setPushToken(user.userId, dto.token);
  }

  @Delete('me')
  remove(@CurrentUser() user: { userId: string }) {
    return this.users.deleteAccount(user.userId);
  }
}
