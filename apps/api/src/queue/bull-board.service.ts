import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { Queue } from 'bullmq';
import { QUEUE_TOKENS } from '@/redis/redis.tokens';

@Injectable()
export class BullBoardService implements OnModuleInit {
  private readonly logger = new Logger(BullBoardService.name);

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    @Inject(QUEUE_TOKENS.THREATS) private readonly threatsQueue: Queue,
    @Inject(QUEUE_TOKENS.ROUTINES) private readonly routinesQueue: Queue,
  ) {}

  onModuleInit() {
    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/api/admin/queues');

    createBullBoard({
      queues: [
        new BullMQAdapter(this.threatsQueue),
        new BullMQAdapter(this.routinesQueue),
      ],
      serverAdapter,
    });

    const http = this.httpAdapterHost.httpAdapter.getInstance();
    http.use('/api/admin/queues', serverAdapter.getRouter());
    this.logger.log('Bull Board → /api/admin/queues');
  }
}
