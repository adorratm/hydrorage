import { Module } from '@nestjs/common';
import { AuthModule } from '@/auth/auth.module';
import { RealtimeGateway } from '@/realtime/realtime.gateway';
import { RealtimeService } from '@/realtime/realtime.service';

@Module({
  imports: [AuthModule],
  providers: [RealtimeGateway, RealtimeService],
  exports: [RealtimeService, RealtimeGateway],
})
export class RealtimeModule {}
