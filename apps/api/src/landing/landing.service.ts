import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import {
  DEFAULT_LANDING_BY_LOCALE,
  DEFAULT_LANDING_CONTENT,
  DEFAULT_LANDING_CONTENT_EN,
  isAppLocale,
  parseLocale,
  type AppLocale,
  type LandingContent,
  type LandingContentByLocale,
  type LandingFaqItem,
  type LandingLink,
} from '@hydrorage/shared';
import { LandingPage } from '@/database/entities';

export const LANDING_PAGE_ID = 'home';

function link(
  input: Partial<LandingLink> | undefined,
  fallback: LandingLink,
): LandingLink {
  return {
    label: String(input?.label ?? fallback.label),
    href: String(input?.href ?? fallback.href),
  };
}

function isLegacyLanding(raw: unknown): raw is LandingContent {
  if (!raw || typeof raw !== 'object') return false;
  const o = raw as Record<string, unknown>;
  return Boolean(o.hero && o.meta && !('tr' in o && 'en' in o));
}

function isByLocale(raw: unknown): raw is LandingContentByLocale {
  if (!raw || typeof raw !== 'object') return false;
  const o = raw as Record<string, unknown>;
  return Boolean(o.tr && o.en);
}

@Injectable()
export class LandingService {
  constructor(@InjectEntityManager() private readonly em: EntityManager) {}

  async getContent(lang?: string): Promise<LandingContent> {
    const locale = parseLocale(lang, 'tr');
    const byLocale = await this.getByLocale();
    return structuredClone(byLocale[locale]);
  }

  async getByLocale(): Promise<LandingContentByLocale> {
    const row = await this.em.findOneBy(LandingPage, { id: LANDING_PAGE_ID });
    if (!row) return structuredClone(DEFAULT_LANDING_BY_LOCALE);
    return this.normalizeStore(row.content);
  }

  async upsertContent(
    content: LandingContent | LandingContentByLocale,
    lang?: string,
  ): Promise<LandingContent | LandingContentByLocale> {
    const existing = await this.getByLocale();

    if (isByLocale(content)) {
      const normalized: LandingContentByLocale = {
        tr: this.normalize(content.tr, 'tr'),
        en: this.normalize(content.en, 'en'),
      };
      await this.saveStore(normalized);
      return normalized;
    }

    const locale: AppLocale = isAppLocale(lang) ? lang : 'tr';
    const next: LandingContentByLocale = {
      ...existing,
      [locale]: this.normalize(content, locale),
    };
    await this.saveStore(next);
    return next[locale];
  }

  private async saveStore(content: LandingContentByLocale) {
    let row = await this.em.findOneBy(LandingPage, { id: LANDING_PAGE_ID });
    if (!row) {
      row = this.em.create(LandingPage, {
        id: LANDING_PAGE_ID,
        content: content as unknown as Record<string, unknown>,
      });
    } else {
      row.content = content as unknown as Record<string, unknown>;
    }
    await this.em.save(row);
  }

  private normalizeStore(raw: unknown): LandingContentByLocale {
    if (isByLocale(raw)) {
      return {
        tr: this.normalize(raw.tr, 'tr'),
        en: this.normalize(raw.en, 'en'),
      };
    }
    if (isLegacyLanding(raw)) {
      return {
        tr: this.normalize(raw, 'tr'),
        en: structuredClone(DEFAULT_LANDING_CONTENT_EN),
      };
    }
    return structuredClone(DEFAULT_LANDING_BY_LOCALE);
  }

  private normalize(input: LandingContent, locale: AppLocale): LandingContent {
    const base = structuredClone(
      locale === 'en' ? DEFAULT_LANDING_CONTENT_EN : DEFAULT_LANDING_CONTENT,
    );
    const faqItems: LandingFaqItem[] = Array.isArray(input.faq?.items)
      ? input.faq.items.map((i) => ({
          question: String(i?.question ?? ''),
          answer: String(i?.answer ?? ''),
        }))
      : base.faq.items;

    return {
      meta: {
        title: String(input.meta?.title ?? base.meta.title),
        description: String(input.meta?.description ?? base.meta.description),
        canonical: String(input.meta?.canonical ?? base.meta.canonical),
        ogImage: String(input.meta?.ogImage ?? base.meta.ogImage),
        keywords: String(input.meta?.keywords ?? base.meta.keywords),
        siteUrl: String(input.meta?.siteUrl ?? base.meta.siteUrl),
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
        primaryCta: link(input.hero?.primaryCta, base.hero.primaryCta),
        secondaryCta: link(input.hero?.secondaryCta, base.hero.secondaryCta),
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
      faq: {
        title: String(input.faq?.title ?? base.faq.title),
        subtitle: String(input.faq?.subtitle ?? base.faq.subtitle),
        items: faqItems.filter((i) => i.question && i.answer),
      },
      download: {
        title: String(input.download?.title ?? base.download.title),
        body: String(input.download?.body ?? base.download.body),
        primaryCta: link(input.download?.primaryCta, base.download.primaryCta),
        secondaryCta: link(
          input.download?.secondaryCta,
          base.download.secondaryCta,
        ),
      },
      footer: {
        left: String(input.footer?.left ?? base.footer.left),
        right: String(input.footer?.right ?? base.footer.right),
        privacyLabel: String(
          input.footer?.privacyLabel ?? base.footer.privacyLabel,
        ),
        privacyHref: String(
          input.footer?.privacyHref ?? base.footer.privacyHref,
        ),
        termsLabel: String(input.footer?.termsLabel ?? base.footer.termsLabel),
        termsHref: String(input.footer?.termsHref ?? base.footer.termsHref),
      },
    };
  }
}
