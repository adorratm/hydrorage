import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  defaultLandingForLocale,
  fillTemplate,
  type LandingContent,
} from '@hydrorage/shared';
import { applyLandingSeo, loadPlausible } from './seo';
import { SiteFooter } from './SiteFooter';
import { CookieBanner } from './CookieBanner';
import { StoreButtons, storeLinks } from './StoreButtons';
import { WaterDrop, FallingDrops } from './WaterDrop';
import { LocaleToggle, useLocale } from './locale';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const STEP_ICONS = ['target', 'bolt', 'speaker'] as const;
const CAST_TONES = ['rage', 'coach', 'mom', 'boss'] as const;

const MARQUEE = {
  tr: [
    'Su iç',
    'Azar duy',
    'Streak koru',
    'Kafein borcu',
    'Haftalık karne',
    '+18 veya güvenli',
  ],
  en: [
    'Drink water',
    'Get scolded',
    'Keep the streak',
    'Caffeine debt',
    'Weekly report',
    '+18 or safe',
  ],
} as const;

function useReveal(ready: boolean) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ready) return;
    const root = rootRef.current;
    if (!root) return;

    const nodes = Array.from(root.querySelectorAll('.reveal'));
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      nodes.forEach((n) => n.classList.add('in-view'));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in-view');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.06, rootMargin: '0px 0px -2% 0px' },
    );

    nodes.forEach((n) => io.observe(n));

    const safety = window.setTimeout(() => {
      nodes.forEach((n) => {
        const r = n.getBoundingClientRect();
        if (r.top < window.innerHeight) n.classList.add('in-view');
      });
    }, 350);

    return () => {
      io.disconnect();
      window.clearTimeout(safety);
    };
  }, [ready]);

  return rootRef;
}

function PhoneMock({
  quote,
  listen,
  snooze,
}: {
  quote: string;
  listen: string;
  snooze: string;
}) {
  return (
    <div className="phone" aria-hidden>
      <div className="phone__glow" />
      <div className="phone__bezel">
        <div className="phone__notch" />
        <div className="phone__screen">
          <div className="phone__status">
            <span>HydroRage</span>
            <span>100%</span>
          </div>
          <div className="phone__gauge">
            <svg viewBox="0 0 120 120" className="phone__ring">
              <circle cx="60" cy="60" r="48" className="phone__ring-bg" />
              <circle cx="60" cy="60" r="48" className="phone__ring-fill" />
            </svg>
            <div className="phone__gauge-label">
              <strong>1.8L</strong>
              <span>/ 2.5L</span>
            </div>
          </div>
          <div className="phone__alert">
            <span className="phone__alert-dot" />
            <p>{quote}</p>
          </div>
          <div className="phone__chips">
            <span>+250 ml</span>
            <span>{listen}</span>
            <span>{snooze}</span>
          </div>
        </div>
      </div>
      <div className="phone__drop-mini">
        <WaterDrop id="phoneDrop" size="sm" cracked />
      </div>
    </div>
  );
}

function Marquee({ items }: { items: readonly string[] }) {
  const loop = [...items, ...items, ...items];
  return (
    <div className="marquee" aria-hidden>
      <div className="marquee__track">
        {loop.map((text, i) => (
          <span key={`${text}-${i}`} className="marquee__item">
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Landing() {
  const { locale, t } = useLocale();
  const [content, setContent] = useState<LandingContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useReveal(!!content);

  useEffect(() => {
    loadPlausible();
    setContent(null);
    setError(null);
    fetch(`${API_URL}/landing?lang=${locale}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Landing ${res.status}`);
        return res.json() as Promise<LandingContent>;
      })
      .then((data) => {
        setContent(data);
        applyLandingSeo(data, locale);
      })
      .catch(() => {
        const fallback = defaultLandingForLocale(locale);
        setContent(fallback);
        applyLandingSeo(fallback, locale);
        setError(
          locale === 'en'
            ? 'Live content unavailable — showing defaults.'
            : 'Canlı içerik alınamadı — varsayılan gösteriliyor.',
        );
      });
  }, [locale]);

  if (!content) {
    return (
      <div className="page page--loading">
        <WaterDrop id="loaderDrop" size="sm" className="loader-water" />
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  const year = String(new Date().getFullYear());
  const footerLeft = fillTemplate(content.footer.left, { year });
  const brand = content.hero.brand || 'HydroRage';
  const stores = storeLinks(content.download);
  const brandParts =
    brand.length > 5 && /rage/i.test(brand)
      ? {
          top: brand.replace(/rage/i, ''),
          bottom: brand.match(/rage/i)?.[0] ?? 'Rage',
        }
      : {
          top: brand.slice(0, Math.ceil(brand.length / 2)),
          bottom: brand.slice(Math.ceil(brand.length / 2)),
        };

  const sampleThreat =
    content.faq.items[0]?.answer.slice(0, 48) ||
    (locale === 'en' ? 'Skip water and I’ll be back.' : 'Su içmezsen yine gelirim.');

  const days = [
    t('web.day.mon'),
    t('web.day.tue'),
    t('web.day.wed'),
    t('web.day.thu'),
    t('web.day.fri'),
  ];

  return (
    <div className="page" ref={rootRef}>
      {error ? (
        <div className="toast-error" role="status">
          {error}
        </div>
      ) : null}

      <header className="hero">
        <div className="hero__mesh" aria-hidden />
        <div className="hero__noise" aria-hidden />
        <div className="hero__grid" aria-hidden />
        <div className="hero__watermark" aria-hidden>
          RAGE
        </div>
        <FallingDrops />

        <nav className="hero__nav" aria-label={locale === 'en' ? 'Main' : 'Ana'}>
          <a className="brand-mark" href="#top">
            {brand}
          </a>
          <div className="nav-links">
            <a className="nav-link" href={content.nav.linkHref}>
              {content.nav.linkLabel}
            </a>
            <a className="nav-link" href="#karakterler">
              {t('web.nav.characters')}
            </a>
            <a className="nav-link" href="#sss">
              {t('web.nav.faq')}
            </a>
            <Link className="nav-link" to="/blog">
              {t('web.nav.blog')}
            </Link>
            <LocaleToggle />
          </div>
        </nav>

        <div className="hero__stage" id="top">
          <div className="hero__content">
            <h1 className="hero__brand">
              <span className="hero__brand-line">{brandParts.top}</span>
              <span className="hero__brand-line hero__brand-line--rage">
                {brandParts.bottom}
              </span>
            </h1>
            <p className="hero__line">{content.hero.headline}</p>
            <p className="hero__sub">{content.hero.sub}</p>
            <StoreButtons appleHref={stores.apple} googleHref={stores.google} />
          </div>
          <div className="hero__visual">
            <PhoneMock
              quote={`“${sampleThreat}…”`}
              listen={t('web.phone.listen')}
              snooze={t('web.phone.snooze')}
            />
          </div>
        </div>
      </header>

      <Marquee items={MARQUEE[locale]} />

      <section className="section reveal" id="nasil">
        <div className="section__inner">
          <div className="section__head">
            <p className="section__kicker">{t('web.nav.how')}</p>
            <h2>{content.howItWorks.title}</h2>
            <p>{content.howItWorks.subtitle}</p>
          </div>
          <div className="steps">
            {content.howItWorks.steps.map((step, i) => (
              <article
                key={step.title}
                className="step"
                style={{ ['--i' as string]: i }}
              >
                <div
                  className={`step__icon step__icon--${STEP_ICONS[i % STEP_ICONS.length]}`}
                  aria-hidden
                />
                <span className="step__num">0{i + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--band reveal">
        <div className="band">
          <div className="band__visual" aria-hidden>
            <svg className="band__chart" viewBox="0 0 360 200" fill="none">
              <defs>
                <linearGradient id="bandBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#BD93F9" />
                  <stop offset="100%" stopColor="#FF5555" />
                </linearGradient>
                <linearGradient id="bandGlow" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="rgba(189,147,249,0)" />
                  <stop offset="50%" stopColor="rgba(189,147,249,0.35)" />
                  <stop offset="100%" stopColor="rgba(255,85,85,0)" />
                </linearGradient>
              </defs>
              <rect
                x="0"
                y="0"
                width="360"
                height="200"
                fill="url(#bandGlow)"
                opacity="0.35"
              />
              <line
                x1="24"
                y1="28"
                x2="24"
                y2="168"
                stroke="rgba(189,147,249,0.25)"
                strokeWidth="1"
              />
              <line
                x1="24"
                y1="168"
                x2="336"
                y2="168"
                stroke="rgba(189,147,249,0.25)"
                strokeWidth="1"
              />
              <rect
                className="band__bar"
                x="48"
                y="96"
                width="36"
                height="72"
                rx="8"
                fill="url(#bandBar)"
                opacity="0.55"
              />
              <rect
                className="band__bar band__bar--2"
                x="108"
                y="64"
                width="36"
                height="104"
                rx="8"
                fill="url(#bandBar)"
                opacity="0.7"
              />
              <rect
                className="band__bar band__bar--3"
                x="168"
                y="40"
                width="36"
                height="128"
                rx="8"
                fill="url(#bandBar)"
              />
              <rect
                className="band__bar band__bar--4"
                x="228"
                y="76"
                width="36"
                height="92"
                rx="8"
                fill="url(#bandBar)"
                opacity="0.8"
              />
              <rect
                className="band__bar band__bar--5"
                x="288"
                y="52"
                width="36"
                height="116"
                rx="8"
                fill="url(#bandBar)"
                opacity="0.9"
              />
              <path
                className="band__line"
                d="M66 110 C120 70, 150 50, 186 48 C230 46, 250 90, 306 60"
                stroke="#FF79C6"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="186" cy="48" r="5" fill="#FF5555" />
              {days.map((d, i) => (
                <text
                  key={d}
                  x={48 + i * 60}
                  y="188"
                  fill="#8fa0a8"
                  fontSize="11"
                  fontFamily="Ubuntu,sans-serif"
                >
                  {d}
                </text>
              ))}
            </svg>
          </div>
          <div className="band__copy">
            <h2>{t('web.band')}</h2>
            <p>
              {locale === 'en'
                ? 'Net ml, caffeine debt, and spoken reminders in one place. If you forget, the app won’t.'
                : 'Net ml, kafein borcu ve sesli hatırlatma aynı yerde. Unutursan uygulama unutmaz.'}
            </p>
          </div>
        </div>
      </section>

      <section className="section section--alt reveal" id="karakterler">
        <div className="section__inner">
          <div className="section__head">
            <p className="section__kicker">{t('web.nav.characters')}</p>
            <h2>{content.characters.title}</h2>
            <p>{content.characters.subtitle}</p>
          </div>
          <div className="cast">
            {content.characters.items.map((c, i) => (
              <article
                key={c.name}
                className={`cast__item cast__item--${CAST_TONES[i % CAST_TONES.length]}`}
                style={{ ['--i' as string]: i }}
              >
                <div className="cast__face" aria-hidden>
                  <span className="cast__face-eye" />
                  <span className="cast__face-eye" />
                  <span className="cast__face-mouth" />
                </div>
                <div className="cast__body">
                  <strong>{c.name}</strong>
                  <span>{c.blurb}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section reveal" id="sss">
        <div className="section__inner section__inner--faq">
          <div className="section__head">
            <p className="section__kicker">{t('web.nav.faq')}</p>
            <h2>{content.faq.title}</h2>
            <p>{content.faq.subtitle}</p>
          </div>
          <div className="faq">
            {content.faq.items.map((item) => (
              <details key={item.question} className="faq__item">
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="section final reveal" id="indir">
        <div className="final__panel">
          <div className="final__glow" aria-hidden />
          <div className="final__copy">
            <h2>{content.download.title}</h2>
            <p>{content.download.body}</p>
            <StoreButtons appleHref={stores.apple} googleHref={stores.google} />
          </div>
          <div className="final__art" aria-hidden>
            <WaterDrop id="finalDrop" size="lg" cracked className="final__water" />
          </div>
        </div>
      </section>

      <SiteFooter left={footerLeft} />
      <CookieBanner />
    </div>
  );
}
