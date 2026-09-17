import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager, MoreThanOrEqual } from 'typeorm';
import {
  Routine,
  RoutineLog,
  ThreatEvent,
  User,
} from '@/database/entities';
import { RoutineKind, ThreatStatus } from '@/database/enums';
import { CreateRoutineDto, UpdateRoutineDto } from '@/routines/routines.dto';
import { TemplatesService } from '@/templates/templates.service';
import { fillTemplate } from '@/common/hydration';
import { RealtimeService } from '@/realtime/realtime.service';

@Injectable()
export class RoutinesService {
  constructor(
    @InjectEntityManager() private readonly em: EntityManager,
    private readonly templates: TemplatesService,
    private readonly realtime: RealtimeService,
  ) {}

  list(userId: string) {
    return this.em.find(Routine, {
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  create(userId: string, dto: CreateRoutineDto) {
    return this.em.save(
      this.em.create(Routine, {
        userId,
        title: dto.title,
        description: dto.description ?? null,
        drinkType: dto.drinkType,
        amountMl: dto.amountMl,
        kind: dto.kind,
        intervalMinutes: dto.intervalMinutes ?? null,
        specificTimes: dto.specificTimes ?? [],
        intensity: dto.intensity,
        isActive: dto.isActive ?? true,
      }),
    );
  }

  async update(userId: string, id: string, dto: UpdateRoutineDto) {
    const r = await this.assertOwner(userId, id);
    Object.assign(r, dto);
    return this.em.save(r);
  }

  async remove(userId: string, id: string) {
    const r = await this.assertOwner(userId, id);
    await this.em.remove(r);
    return { ok: true };
  }

  async timelineToday(userId: string) {
    const routines = await this.em.find(Routine, {
      where: { userId, isActive: true },
    });
    const start = startOfDay(new Date());
    let logs = await this.em.find(RoutineLog, {
      where: { userId, plannedAt: MoreThanOrEqual(start) },
      relations: { routine: true },
      order: { plannedAt: 'ASC' },
    });

    if (!logs.length && routines.length) {
      const created: RoutineLog[] = [];
      for (const r of routines) {
        const times =
          r.kind === RoutineKind.SPECIFIC_TIMES
            ? r.specificTimes
            : generateIntervalTimes(r.intervalMinutes ?? 60);
        for (const t of times) {
          const plannedAt = parseTodayTime(t);
          if (!plannedAt) continue;
          const row = await this.em.save(
            this.em.create(RoutineLog, {
              userId,
              routineId: r.id,
              plannedAt,
              status:
                plannedAt < new Date()
                  ? ThreatStatus.MISSED
                  : ThreatStatus.PENDING,
              routine: r,
            }),
          );
          row.routine = r;
          created.push(row);
        }
      }
      return created.sort(
        (a, b) => a.plannedAt.getTime() - b.plannedAt.getTime(),
      );
    }

    for (const log of logs) {
      if (log.status === ThreatStatus.PENDING && log.plannedAt < new Date()) {
        log.status = ThreatStatus.MISSED;
        await this.em.save(log);
        const picked = await this.templates.pickForUser(userId);
        const user = await this.em.findOneByOrFail(User, { id: userId });
        await this.em.save(
          this.em.create(ThreatEvent, {
            userId,
            templateId: picked.templateId,
            characterId: picked.characterId,
            message: fillTemplate(picked.text, {
              name: user.displayName,
              debtMl: log.routine.amountMl,
            }),
            status: ThreatStatus.MISSED,
            scheduledAt: log.plannedAt,
            playedAt: new Date(),
          }),
        );
        this.realtime.routineMissed(userId, { logId: log.id });
      }
    }

    return logs;
  }

  async completeLog(userId: string, logId: string) {
    const log = await this.em.findOne(RoutineLog, {
      where: { id: logId },
      relations: { routine: true },
    });
    if (!log || log.userId !== userId) throw new NotFoundException();
    log.status = ThreatStatus.COMPLETED;
    log.completedAt = new Date();
    const saved = await this.em.save(log);
    this.realtime.routineCompleted(userId, saved);
    return saved;
  }

  private async assertOwner(userId: string, id: string) {
    const r = await this.em.findOneBy(Routine, { id });
    if (!r) throw new NotFoundException();
    if (r.userId !== userId) throw new ForbiddenException();
    return r;
  }
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function parseTodayTime(hhmm: string) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const d = new Date();
  d.setHours(Number(m[1]), Number(m[2]), 0, 0);
  return d;
}

function generateIntervalTimes(intervalMinutes: number) {
  const times: string[] = [];
  for (let h = 8; h <= 22; h++) {
    for (let m = 0; m < 60; m += intervalMinutes) {
      if (h === 22 && m > 0) break;
      times.push(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
      );
    }
  }
  return times.slice(0, 12);
}
