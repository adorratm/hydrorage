import type { LandingContent } from '@hydrorage/shared';

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  const selector = `meta[${attr}="${key}"]`;
  let el = document.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

function upsertJsonLd(id: string, data: unknown) {
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

export function applyLandingSeo(
  content: LandingContent,
  locale: 'tr' | 'en' = 'tr',
) {
  const { meta, faq, download } = content;
  document.title = meta.title;
  document.documentElement.lang = locale;
  upsertMeta('name', 'description', meta.description);
  upsertMeta('name', 'keywords', meta.keywords);
  upsertLink('canonical', meta.canonical);

  upsertMeta('property', 'og:type', 'website');
  upsertMeta('property', 'og:site_name', 'HydroRage');
  upsertMeta('property', 'og:title', meta.title);
  upsertMeta('property', 'og:description', meta.description);
  upsertMeta('property', 'og:url', meta.canonical);
  upsertMeta('property', 'og:image', meta.ogImage);
  upsertMeta('property', 'og:locale', locale === 'en' ? 'en_US' : 'tr_TR');
  upsertMeta(
    'property',
    'og:locale:alternate',
    locale === 'en' ? 'tr_TR' : 'en_US',
  );

  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:title', meta.title);
  upsertMeta('name', 'twitter:description', meta.description);
  upsertMeta('name', 'twitter:image', meta.ogImage);

  upsertJsonLd('ld-org', {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'HydroRage',
    url: meta.siteUrl,
    logo: meta.ogImage,
  });

  upsertJsonLd('ld-app', {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'HydroRage',
    applicationCategory: 'HealthApplication',
    operatingSystem: 'iOS, Android',
    inLanguage: ['tr', 'en'],
    description: meta.description,
    featureList: [
      'Hydration tracking',
      'Spoken reminders',
      'Safe mode without profanity',
    ],
    url: meta.siteUrl,
    image: meta.ogImage,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'TRY',
    },
    downloadUrl: [
      download.primaryCta.href,
      download.secondaryCta.href,
    ],
  });

  if (faq?.items?.length) {
    upsertJsonLd('ld-faq', {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.items.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    });
  }
}

export function loadPlausible() {
  const domain = import.meta.env.VITE_PLAUSIBLE_DOMAIN as string | undefined;
  if (!domain || document.getElementById('plausible-script')) return;
  const s = document.createElement('script');
  s.id = 'plausible-script';
  s.defer = true;
  s.dataset.domain = domain;
  s.src = 'https://plausible.io/js/script.js';
  document.head.appendChild(s);
}
