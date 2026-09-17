import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import {
  DEFAULT_LANDING_CONTENT,
  type LandingContent,
} from '@hydrorage/shared';
import { LandingPage } from '@/database/entities';

export const LANDING_PAGE_ID = 'home';

@Injectable()
export class LandingService {
  constructor(@InjectEntityManager() private readonly em: EntityManager) {}

  async getContent(): Promise<LandingContent> {
    const row = await this.em.findOneBy(LandingPage, { id: LANDING_PAGE_ID });
    if (!row) return structuredClone(DEFAULT_LANDING_CONTENT);
    return row.content as unknown as LandingContent;
  }

  async upsertContent(content: LandingContent): Promise<LandingContent> {
    const normalized = this.normalize(content);
    let row = await this.em.findOneBy(LandingPage, { id: LANDING_PAGE_ID });
    if (!row) {
      row = this.em.create(LandingPage, {
        id: LANDING_PAGE_ID,
        content: normalized as unknown as Record<string, unknown>,
      });
    } else {
      row.content = normalized as unknown as Record<string, unknown>;
    }
    await this.em.save(row);
    return normalized;
  }

  private normalize(input: LandingContent): LandingContent {
    const base = structuredClone(DEFAULT_LANDING_CONTENT);
    return {
      meta: {
        title: String(input.meta?.title ?? base.meta.title),
        description: String(input.meta?.description ?? base.meta.description),
      },
      nav: {
        brand: String(input.nav?.brand ?? base.nav.brand),
        linkLabel: String(input.nav?.linkLabel ?? base.nav.linkLabel),
        linkHref: String(input.nav?.linkHref ?? base.nav.linkHref),
      },
      hero: {
        brand: String(input.hero?.brand ?? base.hero.brand),
        headline: String(input.hero?.headline ?? base.hero.headline),
        sub: String(input.hero?.sub ?? base.hero.sub),
        primaryCta: {
          label: String(
            input.hero?.primaryCta?.label ?? base.hero.primaryCta.label,
          ),
          href: String(
            input.hero?.primaryCta?.href ?? base.hero.primaryCta.href,
          ),
        },
        secondaryCta: {
          label: String(
            input.hero?.secondaryCta?.label ?? base.hero.secondaryCta.label,
          ),
          href: String(
            input.hero?.secondaryCta?.href ?? base.hero.secondaryCta.href,
          ),
        },
      },
      howItWorks: {
        title: String(input.howItWorks?.title ?? base.howItWorks.title),
        subtitle: String(
          input.howItWorks?.subtitle ?? base.howItWorks.subtitle,
        ),
        steps: Array.isArray(input.howItWorks?.steps)
          ? input.howItWorks.steps.map((s) => ({
              title: String(s?.title ?? ''),
              body: String(s?.body ?? ''),
            }))
          : base.howItWorks.steps,
      },
      characters: {
        title: String(input.characters?.title ?? base.characters.title),
        subtitle: String(
          input.characters?.subtitle ?? base.characters.subtitle,
        ),
        items: Array.isArray(input.characters?.items)
          ? input.characters.items.map((i) => ({
              name: String(i?.name ?? ''),
              blurb: String(i?.blurb ?? ''),
            }))
          : base.characters.items,
      },
      download: {
        title: String(input.download?.title ?? base.download.title),
        body: String(input.download?.body ?? base.download.body),
        primaryCta: {
          label: String(
            input.download?.primaryCta?.label ??
              base.download.primaryCta.label,
          ),
          href: String(
            input.download?.primaryCta?.href ?? base.download.primaryCta.href,
          ),
        },
        secondaryCta: {
          label: String(
            input.download?.secondaryCta?.label ??
              base.download.secondaryCta.label,
          ),
          href: String(
            input.download?.secondaryCta?.href ??
              base.download.secondaryCta.href,
          ),
        },
      },
      footer: {
        left: String(input.footer?.left ?? base.footer.left),
        right: String(input.footer?.right ?? base.footer.right),
      },
    };
  }
}
