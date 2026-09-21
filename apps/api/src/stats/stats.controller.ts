import { Controller, Get, UseGuards } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager, MoreThanOrEqual } from 'typeorm';
import {
  fillTemplate,
  t,
  type AppLocale,
} from '@hydrorage/shared';
import { Intake, ThreatEvent, User } from '@/database/entities';
import { DrinkType, ThreatStatus } from '@/database/enums';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { CurrentUser } from '@/auth/current-user.decorator';
import { Locale } from '@/common/locale';

@Controller('stats')
@UseGuards(JwtAuthGuard)
export class StatsController {
  constructor(@InjectEntityManager() private readonly em: EntityManager) {}

  @Get('weekly')
  async weekly(
    @CurrentUser() user: { userId: string },
    @Locale() locale: AppLocale,
  ) {
    const me = await this.em.findOneByOrFail(User, { id: user.userId });
    const start = startOfWeek(new Date());
    const intakes = await this.em.find(Intake, {
      where: { userId: user.userId, createdAt: MoreThanOrEqual(start) },
    });
    const threats = await this.em.find(ThreatEvent, {
      where: { userId: user.userId, createdAt: MoreThanOrEqual(start) },
      relations: { character: true, template: true },
    });

    const days = [
      t(locale, 'web.day.mon'),
      t(locale, 'web.day.tue'),
      t(locale, 'web.day.wed'),
      t(locale, 'web.day.thu'),
      t(locale, 'web.day.fri'),
      t(locale, 'web.day.sat'),
      t(locale, 'web.day.sun'),
    ];
    const daily = days.map((label, i) => {
      const dayStart = new Date(start);
      dayStart.setDate(start.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayStart.getDate() + 1);
      const dayIntakes = intakes.filter(
        (x) => x.createdAt >= dayStart && x.createdAt < dayEnd,
      );
      const liters =
        dayIntakes.reduce((s, x) => s + Math.max(0, x.netMl), 0) / 1000;
      const goal = me.dailyGoalMl / 1000;
      let tone: 'met' | 'close' | 'fail' = 'fail';
      if (liters >= goal) tone = 'met';
      else if (liters >= goal * 0.7) tone = 'close';
      return {
        label,
        liters: Math.round(liters * 10) / 10,
        tone,
        callout:
          tone === 'fail' && liters > 0
            ? fillTemplate(t(locale, 'api.stats.callout'), {
                liters: liters.toFixed(1),
              })
            : null,
      };
    });

    const scoldCount = threats.length;
    const missedGlasses = threats.filter(
      (t) => t.status === ThreatStatus.MISSED,
    ).length;
    const totalLiters =
      Math.round(
        (intakes.reduce((s, x) => s + Math.max(0, x.netMl), 0) / 1000) * 10,
      ) / 10;

    const caffeineMl = intakes
      .filter((i) =>
        [
          DrinkType.COFFEE,
          DrinkType.ESPRESSO,
          DrinkType.FILTER_COFFEE,
          DrinkType.ENERGY,
          DrinkType.TEA,
        ].includes(i.type),
      )
      .reduce((s, i) => s + i.amountMl, 0);
    const waterMl = intakes
      .filter((i) =>
        [
          DrinkType.WATER,
          DrinkType.BOTTLE,
          DrinkType.MINERAL,
          DrinkType.ELECTROLYTE,
        ].includes(i.type),
      )
      .reduce((s, i) => s + i.amountMl, 0);
    const ratio =
      caffeineMl === 0 ? waterMl : Math.round((waterMl / caffeineMl) * 10) / 10;

    const completed = threats.filter(
      (t) => t.status === ThreatStatus.COMPLETED,
    ).length;
    const savedRate =
      threats.length === 0
        ? 100
        : Math.round((completed / threats.length) * 100);

    const kidneyIndex = Math.max(
      20,
      Math.min(
        100,
        Math.round(
          (totalLiters / ((me.dailyGoalMl / 1000) * 7)) * 70 +
            savedRate * 0.3,
        ),
      ),
    );

    const rageLevel = Math.min(
      5,
      Math.max(1, Math.ceil(scoldCount / 5) || 1),
    );

    const topTemplates = new Map<
      string,
      { text: string; count: number; characterName: string; maxDb: number }
    >();
    for (const th of threats) {
      const key = th.templateId ?? th.message.slice(0, 40);
      const prev = topTemplates.get(key);
      if (prev) prev.count += 1;
      else
        topTemplates.set(key, {
          text: th.message,
          count: 1,
          characterName:
            th.character?.name ?? t(locale, 'api.stats.system'),
          maxDb: th.character?.maxDb ?? 96,
        });
    }
    const topScolds = [...topTemplates.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    let grade = t(locale, 'api.stats.grade.hopeless');
    if (kidneyIndex >= 85) grade = t(locale, 'api.stats.grade.ok');
    else if (kidneyIndex >= 70) grade = t(locale, 'api.stats.grade.edge');
    else if (kidneyIndex >= 50) grade = t(locale, 'api.stats.grade.risk');

    return {
      rageLevel,
      grade,
      flavorText:
        kidneyIndex < 70
          ? t(locale, 'api.stats.flavor.low')
          : t(locale, 'api.stats.flavor.ok'),
      scoldCount,
      missedGlasses,
      totalLiters,
      daily,
      topScolds,
      kidneyIndex,
      risk:
        kidneyIndex < 70
          ? t(locale, 'api.stats.risk.high')
          : kidneyIndex < 85
            ? t(locale, 'api.stats.risk.mid')
            : t(locale, 'api.stats.risk.low'),
      caffeineWaterRatio: `1:${ratio || 0}`,
      savedGlasses: `${completed}/${threats.length || 1}`,
      savedRate,
      shareQuote: fillTemplate(t(locale, 'api.stats.share'), {
        count: scoldCount,
      }),
      dailyGoalMl: me.dailyGoalMl,
    };
  }
}

function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}
