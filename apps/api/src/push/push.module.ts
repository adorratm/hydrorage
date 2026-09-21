import { Module } from '@nestjs/common';
import { PushService } from '@/push/push.service';

@Module({
  providers: [PushService],
  exports: [PushService],
})
export class PushModule {}
