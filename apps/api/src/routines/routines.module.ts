import { Module } from '@nestjs/common';
import { RoutinesService } from '@/routines/routines.service';
import { RoutinesController } from '@/routines/routines.controller';
import { AuthModule } from '@/auth/auth.module';
import { TemplatesModule } from '@/templates/templates.module';
import { RealtimeModule } from '@/realtime/realtime.module';

@Module({
  imports: [AuthModule, TemplatesModule, RealtimeModule],
  providers: [RoutinesService],
  controllers: [RoutinesController],
  exports: [RoutinesService],
})
export class RoutinesModule {}
