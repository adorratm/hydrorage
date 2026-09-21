import { Module } from '@nestjs/common';
import { SettingsController } from '@/settings/settings.controller';
import { AuthModule } from '@/auth/auth.module';
import { UsersModule } from '@/users/users.module';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [SettingsController],
})
export class SettingsModule {}
