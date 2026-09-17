import {
  Global,
  Inject,
  Module,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Queue } from 'bullmq';
import type Redis from 'ioredis';
import { RedisModule } from '@/redis/redis.module';
import {
  QUEUE_TOKENS,
  REDIS,
  ROUTINES_QUEUE,
  THREATS_QUEUE,
} from '@/redis/redis.tokens';
import { RealtimeModule } from '@/realtime/realtime.module';
import { TemplatesModule } from '@/templates/templates.module';
import { ThreatsQueueService } from '@/queue/threats-queue.service';
import { RoutinesQueueService } from '@/queue/routines-queue.service';
import { BullBoardService } from '@/queue/bull-board.service';
import { ThreatDueJob, RoutineSweepJob } from '@/queue/queue.types';

@Global()
@Module({
  imports: [RedisModule, RealtimeModule, TemplatesModule],
  providers: [
    {
      provide: QUEUE_TOKENS.THREATS,
      inject: [REDIS],
      useFactory: (redis: Redis) =>
        new Queue<ThreatDueJob>(THREATS_QUEUE, {
          connection: redis.duplicate(),
        }),
    },
    {
      provide: QUEUE_TOKENS.ROUTINES,
      inject: [REDIS],
      useFactory: (redis: Redis) =>
        new Queue<RoutineSweepJob>(ROUTINES_QUEUE, {
          connection: redis.duplicate(),
        }),
    },
    ThreatsQueueService,
    RoutinesQueueService,
    BullBoardService,
  ],
  exports: [ThreatsQueueService, RoutinesQueueService, QUEUE_TOKENS.THREATS, QUEUE_TOKENS.ROUTINES],
})
export class QueueModule implements OnModuleInit, OnModuleDestroy {
  constructor(
    private readonly threats: ThreatsQueueService,
    private readonly routines: RoutinesQueueService,
    @Inject(QUEUE_TOKENS.THREATS) private readonly threatsQueue: Queue,
    @Inject(QUEUE_TOKENS.ROUTINES) private readonly routinesQueue: Queue,
  ) {}

  async onModuleInit() {
    this.threats.startWorker();
    await this.routines.startWorker();
  }

  async onModuleDestroy() {
    await this.threatsQueue.close();
    await this.routinesQueue.close();
  }
}
