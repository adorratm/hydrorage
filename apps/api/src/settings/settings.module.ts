import { Module } from '@nestjs/common';
import { SettingsController } from '@/settings/settings.controller';
import { AuthModule } from '@/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [SettingsController],
})
export class SettingsModule {}
