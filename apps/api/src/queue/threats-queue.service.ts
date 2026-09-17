import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { Queue, Worker, Job } from 'bullmq';
import { EntityManager } from 'typeorm';
import type Redis from 'ioredis';
import { ThreatEvent } from '@/database/entities';
import { ThreatStatus } from '@/database/enums';
import { RealtimeService } from '@/realtime/realtime.service';
import { QUEUE_TOKENS, REDIS, THREATS_QUEUE } from '@/redis/redis.tokens';
import { ThreatDueJob } from '@/queue/queue.types';

@Injectable()
export class ThreatsQueueService implements OnModuleDestroy {
  private readonly logger = new Logger(ThreatsQueueService.name);
  private worker: Worker<ThreatDueJob> | null = null;

  constructor(
    @Inject(QUEUE_TOKENS.THREATS) private readonly queue: Queue<ThreatDueJob>,
    @Inject(REDIS) private readonly redis: Redis,
    @InjectEntityManager() private readonly em: EntityManager,
    private readonly realtime: RealtimeService,
  ) {}

  startWorker() {
    if (this.worker) return;
    this.worker = new Worker<ThreatDueJob>(
      THREATS_QUEUE,
      async (job) => this.handleDue(job),
      { connection: this.redis.duplicate() },
    );
    this.worker.on('failed', (job, err) => {
      this.logger.error(`threat job ${job?.id} failed: ${err.message}`);
    });
  }

  async scheduleDue(threat: { id: string; userId: string; scheduledAt: Date }) {
    const delay = Math.max(0, threat.scheduledAt.getTime() - Date.now());
    await this.queue.add(
      'threat-due',
      { threatId: threat.id, userId: threat.userId },
      {
        jobId: `threat-due-${threat.id}`,
        delay,
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    );
  }

  async cancelDue(threatId: string) {
    const job = await this.queue.getJob(`threat-due-${threatId}`);
    if (job) await job.remove();
  }

  private async handleDue(job: Job<ThreatDueJob>) {
    const threat = await this.em.findOne(ThreatEvent, {
      where: { id: job.data.threatId },
      relations: { character: true, template: true },
    });
    if (!threat || threat.status !== ThreatStatus.PENDING) return;
    this.realtime.threatDue(threat.userId, threat);
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }
}
