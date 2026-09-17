import { Module } from '@nestjs/common';
import { ThreatsController } from '@/threats/threats.controller';
import { AuthModule } from '@/auth/auth.module';
import { TemplatesModule } from '@/templates/templates.module';

@Module({
  imports: [AuthModule, TemplatesModule],
  controllers: [ThreatsController],
})
export class ThreatsModule {}
