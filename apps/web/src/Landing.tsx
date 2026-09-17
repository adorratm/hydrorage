import { useEffect, useState } from 'react';
import {
  DEFAULT_LANDING_CONTENT,
  fillTemplate,
  type LandingContent,
} from '@hydrorage/shared';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export function Landing() {
  const [content, setContent] = useState<LandingContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/landing`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Landing yüklenemedi (${res.status})`);
        return res.json() as Promise<LandingContent>;
      })
      .then((data) => {
        setContent(data);
        document.title = data.meta.title;
        const meta = document.querySelector('meta[name="description"]');
        if (meta) meta.setAttribute('content', data.meta.description);
      })
      .catch(() => {
        setContent(DEFAULT_LANDING_CONTENT);
        setError('Canlı içerik alınamadı — varsayılan gösteriliyor.');
      });
  }, []);

  if (!content) {
    return (
      <div className="page" style={{ display: 'grid', placeItems: 'center' }}>
        <p style={{ color: 'var(--muted)' }}>Yükleniyor…</p>
      </div>
    );
  }

  const year = String(new Date().getFullYear());
  const footerLeft = fillTemplate(content.footer.left, { year });

  return (
    <div className="page">
      {error ? (
        <div
          style={{
            position: 'fixed',
            top: 8,
            right: 8,
            zIndex: 20,
            fontSize: 12,
            color: 'var(--muted)',
            background: 'rgba(0,0,0,0.5)',
            padding: '6px 10px',
            borderRadius: 8,
          }}
        >
          {error}
        </div>
      ) : null}

      <header className="hero">
        <nav className="hero__nav" aria-label="Ana">
          <a className="brand-mark" href="#top">
            {content.nav.brand}
          </a>
          <a className="nav-link" href={content.nav.linkHref}>
            {content.nav.linkLabel}
          </a>
        </nav>

        <div className="hero__visual" aria-hidden>
          <div className="drop">
            <div className="drop__body" />
            <div className="drop__crack" />
          </div>
          <div className="wave" />
        </div>

        <div className="hero__content" id="top">
          <h1 className="hero__brand">{content.hero.brand}</h1>
          <p className="hero__line">{content.hero.headline}</p>
          <p className="hero__sub">{content.hero.sub}</p>
          <div className="cta-row">
            <a className="btn btn--primary" href={content.hero.primaryCta.href}>
              {content.hero.primaryCta.label}
            </a>
            <a className="btn btn--ghost" href={content.hero.secondaryCta.href}>
              {content.hero.secondaryCta.label}
            </a>
          </div>
        </div>
      </header>

      <section className="section" id="nasil">
        <div className="section__head">
          <h2>{content.howItWorks.title}</h2>
          <p>{content.howItWorks.subtitle}</p>
        </div>
        <div className="steps">
          {content.howItWorks.steps.map((step) => (
            <article key={step.title} className="step">
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section section--alt" id="karakterler">
        <div className="section__head">
          <h2>{content.characters.title}</h2>
          <p>{content.characters.subtitle}</p>
        </div>
        <div className="cast">
          {content.characters.items.map((c) => (
            <article key={c.name} className="cast__item">
              <strong>{c.name}</strong>
              <span>{c.blurb}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="section final" id="indir">
        <h2>{content.download.title}</h2>
        <p>{content.download.body}</p>
        <div className="cta-row">
          <a
            className="btn btn--primary"
            href={content.download.primaryCta.href}
          >
            {content.download.primaryCta.label}
          </a>
          <a
            className="btn btn--ghost"
            href={content.download.secondaryCta.href}
          >
            {content.download.secondaryCta.label}
          </a>
        </div>
      </section>

      <footer className="footer">
        <span>{footerLeft}</span>
        <span>{content.footer.right}</span>
      </footer>
    </div>
  );
}
