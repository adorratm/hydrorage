import { Link, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { loadPlausible } from './seo';
import { SiteFooter } from './SiteFooter';
import { CookieBanner } from './CookieBanner';
import { LocaleToggle, useLocale } from './locale';
import { NavMenu } from './NavMenu';
import type { AppLocale } from '@hydrorage/shared';

type Localized = {
  title: string;
  description: string;
  body: string[];
  tag: string;
};

export type BlogPost = {
  slug: string;
  tr: Localized;
  en: Localized;
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'gunde-kac-ml-su',
    tr: {
      title: 'Günde kaç ml su içmeliyim?',
      description:
        'HydroRage varsayılan hedefi 2500 ml’dir; vücut ağırlığı ve aktiviteye göre ayarla.',
      tag: 'Hidrasyon',
      body: [
        'Çoğu yetişkin için günde 2–3 litre civarı makul bir başlangıçtır. HydroRage varsayılan hedefi 2500 ml’dir.',
        'Kahve, enerji içeceği ve alkol diüretik etkiyle “su borcu” ekler; uygulama bunu net hidrasyona yansıtır.',
        'Hedefini onboarding veya profil ayarından kişiselleştir. Aşırı içmek de gerekmez — dinle ve ölç.',
      ],
    },
    en: {
      title: 'How many ml of water per day?',
      description:
        'HydroRage defaults to 2500 ml; adjust for body weight and activity.',
      tag: 'Hydration',
      body: [
        'For most adults, about 2–3 litres a day is a reasonable start. HydroRage’s default goal is 2500 ml.',
        'Coffee, energy drinks, and alcohol add “water debt” via diuretic effect; the app reflects that in net hydration.',
        'Personalize your goal in onboarding or profile. You don’t need to overdrink — listen and measure.',
      ],
    },
  },
  {
    slug: 'kafein-su-borcu',
    tr: {
      title: 'Kafein su borcu nedir?',
      description:
        'Espresso ve filtre kahve HydroRage’de ekstra ml borcu yazar; telafi için su iç.',
      tag: 'Kafein',
      body: [
        'Kafein idrar söktürücü etki yapabilir. HydroRage espresso, filtre kahve ve enerji içeceklerine ceza ml’si ekler.',
        'Borç göründüğünde ekstra su içerek dengele. Bu tıbbi teşhis değildir; kişisel takip yardımcısıdır.',
      ],
    },
    en: {
      title: 'What is caffeine water debt?',
      description:
        'Espresso and filter coffee add extra ml debt in HydroRage; drink water to catch up.',
      tag: 'Caffeine',
      body: [
        'Caffeine can have a diuretic effect. HydroRage adds penalty ml for espresso, filter coffee, and energy drinks.',
        'When debt shows up, balance it with extra water. This is not a medical diagnosis — a personal tracking helper.',
      ],
    },
  },
  {
    slug: 'guvenli-mod-nedir',
    tr: {
      title: 'Güvenli mod nedir?',
      description:
        '+18 kapalıyken HydroRage argo ve küfür olmadan uyarı verir.',
      tag: 'Uygulama',
      body: [
        'HydroRage’in markası sert hatırlatmadır; herkes küfür istemez. Güvenli modda şablonlar SAFE seviyesinden seçilir.',
        'Tehdit ekranından +18 anahtarını kapatman yeter. Ofis ve gece modu sesi ayrıca kısar.',
      ],
    },
    en: {
      title: 'What is safe mode?',
      description:
        'With +18 off, HydroRage warns without slang or swearing.',
      tag: 'App',
      body: [
        'HydroRage’s brand is tough reminders; not everyone wants swearing. In safe mode, templates use the SAFE level.',
        'Turn off +18 on the Threat screen. Office and night mode also lower volume.',
      ],
    },
  },
];

function loc(post: BlogPost, locale: AppLocale): Localized {
  return post[locale];
}

function BlogChrome({
  children,
  backTo,
  backLabel,
}: {
  children: React.ReactNode;
  backTo: string;
  backLabel: string;
}) {
  const { t } = useLocale();
  return (
    <div className="page blog-page">
      <header className="blog-header">
        <Link className="brand-mark" to="/">
          HydroRage
        </Link>
        <NavMenu>
          {backTo !== '/' ? (
            <Link className="nav-link" to={backTo}>
              {backLabel}
            </Link>
          ) : null}
          <Link className="nav-link nav-link--cta" to="/">
            {t('common.home')}
          </Link>
          <LocaleToggle />
        </NavMenu>
      </header>
      {children}
      <SiteFooter />
      <CookieBanner />
    </div>
  );
}

export function BlogIndex() {
  const { locale, t } = useLocale();

  useEffect(() => {
    document.title = `Blog — HydroRage`;
    loadPlausible();
  }, [locale]);

  const [featured, ...rest] = BLOG_POSTS;
  const featuredL = featured ? loc(featured, locale) : null;

  return (
    <BlogChrome backTo="/" backLabel={t('common.home')}>
      <div className="blog-hero">
        <p className="section__kicker">Blog</p>
        <h1>
          {locale === 'en'
            ? 'Water, debt, and scolding — short posts'
            : 'Su, borç ve azar — kısa yazılar'}
        </h1>
        <p className="blog-hero__sub">
          {locale === 'en'
            ? 'Hydration, caffeine debt, and app tips. Straight and clear.'
            : 'Hidrasyon, kafein borcu ve uygulama ipuçları. Abartısız, net.'}
        </p>
      </div>

      <div className="blog-wrap">
        {featured && featuredL ? (
          <Link to={`/blog/${featured.slug}`} className="blog-featured">
            <span className="blog-tag">{featuredL.tag}</span>
            <h2>{featuredL.title}</h2>
            <p>{featuredL.description}</p>
            <span className="blog-more">{t('common.readMore')}</span>
          </Link>
        ) : null}

        <ul className="blog-grid">
          {rest.map((p) => {
            const l = loc(p, locale);
            return (
              <li key={p.slug}>
                <Link to={`/blog/${p.slug}`} className="blog-card">
                  <span className="blog-tag">{l.tag}</span>
                  <strong>{l.title}</strong>
                  <span>{l.description}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </BlogChrome>
  );
}

export function BlogPostPage() {
  const { slug } = useParams();
  const { locale, t } = useLocale();
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  const others = BLOG_POSTS.filter((p) => p.slug !== slug).slice(0, 2);
  const localized = post ? loc(post, locale) : null;

  useEffect(() => {
    if (localized) {
      document.title = `${localized.title} — HydroRage`;
      loadPlausible();
    }
  }, [localized]);

  if (!post || !localized) {
    return (
      <BlogChrome backTo="/blog" backLabel={t('common.blog')}>
        <div className="blog-wrap">
          <p>
            {locale === 'en' ? 'Post not found.' : 'Yazı bulunamadı.'}
          </p>
          <Link to="/blog">
            {locale === 'en' ? 'Back to blog' : 'Blog’a dön'}
          </Link>
        </div>
      </BlogChrome>
    );
  }

  return (
    <BlogChrome backTo="/blog" backLabel={t('common.blog')}>
      <article className="blog-article">
        <div className="blog-article__head">
          <span className="blog-tag">{localized.tag}</span>
          <h1>{localized.title}</h1>
          <p className="blog-article__dek">{localized.description}</p>
        </div>
        <div className="blog-article__body">
          {localized.body.map((p) => (
            <p key={p.slice(0, 32)}>{p}</p>
          ))}
        </div>
        <div className="blog-article__cta">
          <p>{t('web.blog.ctaTitle')}</p>
          <a className="btn btn--primary" href="/#indir">
            {t('web.blog.ctaBody')}
          </a>
        </div>
      </article>

      {others.length > 0 ? (
        <div className="blog-wrap blog-related">
          <h2>{t('common.continue')}</h2>
          <ul className="blog-grid">
            {others.map((p) => {
              const l = loc(p, locale);
              return (
                <li key={p.slug}>
                  <Link to={`/blog/${p.slug}`} className="blog-card">
                    <span className="blog-tag">{l.tag}</span>
                    <strong>{l.title}</strong>
                    <span>{l.description}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </BlogChrome>
  );
}
