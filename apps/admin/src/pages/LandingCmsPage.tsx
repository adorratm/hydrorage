import { useEffect, useState, type FormEvent } from 'react';
import {
  DEFAULT_LANDING_BY_LOCALE,
  type AppLocale,
  type LandingCastItem,
  type LandingContent,
  type LandingContentByLocale,
  type LandingStep,
} from '@hydrorage/shared';
import { api } from '../lib/api';
import { useLocale } from '../locale';

function Field({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {multiline ? (
        <textarea
          value={value}
          rows={3}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}

function LinkFields({
  title,
  value,
  onChange,
}: {
  title: string;
  value: { label: string; href: string };
  onChange: (v: { label: string; href: string }) => void;
}) {
  const { t } = useLocale();
  return (
    <div className="field-group">
      <h4>{title}</h4>
      <div className="field-row">
        <Field
          label={t('admin.field.label')}
          value={value.label}
          onChange={(label) => onChange({ ...value, label })}
        />
        <Field
          label={t('admin.field.link')}
          value={value.href}
          onChange={(href) => onChange({ ...value, href })}
        />
      </div>
    </div>
  );
}

export function LandingCmsPage() {
  const { t } = useLocale();
  const [byLocale, setByLocale] = useState<LandingContentByLocale | null>(null);
  const [editLang, setEditLang] = useState<AppLocale>('tr');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<LandingContentByLocale>('/admin/landing?lang=all')
      .then(setByLocale)
      .catch((e: Error) => {
        setByLocale(structuredClone(DEFAULT_LANDING_BY_LOCALE));
        setError(e.message);
      });
  }, []);

  const content = byLocale?.[editLang] ?? null;

  const update = (patch: (c: LandingContent) => LandingContent) => {
    setByLocale((prev) => {
      if (!prev) return prev;
      return { ...prev, [editLang]: patch(prev[editLang]) };
    });
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!byLocale) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const saved = await api<LandingContentByLocale>('/admin/landing', {
        method: 'PUT',
        body: JSON.stringify(byLocale),
      });
      setByLocale(saved);
      setMessage(t('admin.landing.saved'));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('admin.landing.saveFail'),
      );
    } finally {
      setSaving(false);
    }
  };

  const resetDefaults = () => {
    if (!confirm(t('admin.landing.reset'))) return;
    setByLocale((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [editLang]: structuredClone(DEFAULT_LANDING_BY_LOCALE[editLang]),
      };
    });
    setMessage(t('admin.landing.resetOk'));
  };

  if (!content || !byLocale) {
    return <p className="muted">{t('common.loading')}</p>;
  }

  return (
    <>
      <h1 className="page-title">{t('admin.landing.title')}</h1>
      <p className="page-sub">{t('admin.landing.sub')}</p>

      {message ? <p className="ok-msg">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <div className="cms-lang-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          className={editLang === 'tr' ? 'is-active' : undefined}
          aria-selected={editLang === 'tr'}
          onClick={() => setEditLang('tr')}
        >
          {t('admin.landing.tabTr')}
        </button>
        <button
          type="button"
          role="tab"
          className={editLang === 'en' ? 'is-active' : undefined}
          aria-selected={editLang === 'en'}
          onClick={() => setEditLang('en')}
        >
          {t('admin.landing.tabEn')}
        </button>
      </div>

      <form className="cms" onSubmit={onSubmit}>
        <section className="panel cms-section">
          <div className="panel__head">SEO / Meta</div>
          <div className="cms-body">
            <Field
              label="Sayfa başlığı"
              value={content.meta.title}
              onChange={(title) =>
                update((c) => ({ ...c, meta: { ...c.meta, title } }))
              }
            />
            <Field
              label="Açıklama"
              multiline
              value={content.meta.description}
              onChange={(description) =>
                update((c) => ({ ...c, meta: { ...c.meta, description } }))
              }
            />
            <Field
              label="Canonical URL"
              value={content.meta.canonical}
              onChange={(canonical) =>
                update((c) => ({ ...c, meta: { ...c.meta, canonical } }))
              }
            />
            <Field
              label="OG Image URL"
              value={content.meta.ogImage}
              onChange={(ogImage) =>
                update((c) => ({ ...c, meta: { ...c.meta, ogImage } }))
              }
            />
            <Field
              label="Keywords"
              value={content.meta.keywords}
              onChange={(keywords) =>
                update((c) => ({ ...c, meta: { ...c.meta, keywords } }))
              }
            />
            <Field
              label="Site URL"
              value={content.meta.siteUrl}
              onChange={(siteUrl) =>
                update((c) => ({ ...c, meta: { ...c.meta, siteUrl } }))
              }
            />
          </div>
        </section>

        <section className="panel cms-section">
          <div className="panel__head">Navigasyon</div>
          <div className="cms-body">
            <div className="field-row">
              <Field
                label="Marka"
                value={content.nav.brand}
                onChange={(brand) =>
                  update((c) => ({ ...c, nav: { ...c.nav, brand } }))
                }
              />
              <Field
                label="Link etiketi"
                value={content.nav.linkLabel}
                onChange={(linkLabel) =>
                  update((c) => ({ ...c, nav: { ...c.nav, linkLabel } }))
                }
              />
              <Field
                label="Link href"
                value={content.nav.linkHref}
                onChange={(linkHref) =>
                  update((c) => ({ ...c, nav: { ...c.nav, linkHref } }))
                }
              />
            </div>
          </div>
        </section>

        <section className="panel cms-section">
          <div className="panel__head">Hero</div>
          <div className="cms-body">
            <Field
              label="Marka (büyük)"
              value={content.hero.brand}
              onChange={(brand) =>
                update((c) => ({ ...c, hero: { ...c.hero, brand } }))
              }
            />
            <Field
              label="Başlık"
              value={content.hero.headline}
              onChange={(headline) =>
                update((c) => ({ ...c, hero: { ...c.hero, headline } }))
              }
            />
            <Field
              label="Alt metin"
              multiline
              value={content.hero.sub}
              onChange={(sub) =>
                update((c) => ({ ...c, hero: { ...c.hero, sub } }))
              }
            />
            <LinkFields
              title="Birincil CTA"
              value={content.hero.primaryCta}
              onChange={(primaryCta) =>
                update((c) => ({ ...c, hero: { ...c.hero, primaryCta } }))
              }
            />
            <LinkFields
              title="İkincil CTA"
              value={content.hero.secondaryCta}
              onChange={(secondaryCta) =>
                update((c) => ({ ...c, hero: { ...c.hero, secondaryCta } }))
              }
            />
          </div>
        </section>

        <section className="panel cms-section">
          <div className="panel__head">Nasıl çalışır</div>
          <div className="cms-body">
            <Field
              label="Başlık"
              value={content.howItWorks.title}
              onChange={(title) =>
                update((c) => ({
                  ...c,
                  howItWorks: { ...c.howItWorks, title },
                }))
              }
            />
            <Field
              label="Alt metin"
              multiline
              value={content.howItWorks.subtitle}
              onChange={(subtitle) =>
                update((c) => ({
                  ...c,
                  howItWorks: { ...c.howItWorks, subtitle },
                }))
              }
            />
            {content.howItWorks.steps.map((step, idx) => (
              <div key={idx} className="field-group">
                <div className="field-group__bar">
                  <h4>Adım {idx + 1}</h4>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() =>
                      update((c) => ({
                        ...c,
                        howItWorks: {
                          ...c.howItWorks,
                          steps: c.howItWorks.steps.filter((_, i) => i !== idx),
                        },
                      }))
                    }
                  >
                    Sil
                  </button>
                </div>
                <Field
                  label="Başlık"
                  value={step.title}
                  onChange={(title) =>
                    update((c) => {
                      const steps = [...c.howItWorks.steps] as LandingStep[];
                      steps[idx] = { ...steps[idx], title };
                      return {
                        ...c,
                        howItWorks: { ...c.howItWorks, steps },
                      };
                    })
                  }
                />
                <Field
                  label="Metin"
                  multiline
                  value={step.body}
                  onChange={(body) =>
                    update((c) => {
                      const steps = [...c.howItWorks.steps] as LandingStep[];
                      steps[idx] = { ...steps[idx], body };
                      return {
                        ...c,
                        howItWorks: { ...c.howItWorks, steps },
                      };
                    })
                  }
                />
              </div>
            ))}
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() =>
                update((c) => ({
                  ...c,
                  howItWorks: {
                    ...c.howItWorks,
                    steps: [
                      ...c.howItWorks.steps,
                      { title: 'Yeni adım', body: '' },
                    ],
                  },
                }))
              }
            >
              Adım ekle
            </button>
          </div>
        </section>

        <section className="panel cms-section">
          <div className="panel__head">Karakterler bölümü</div>
          <div className="cms-body">
            <Field
              label="Başlık"
              value={content.characters.title}
              onChange={(title) =>
                update((c) => ({
                  ...c,
                  characters: { ...c.characters, title },
                }))
              }
            />
            <Field
              label="Alt metin"
              multiline
              value={content.characters.subtitle}
              onChange={(subtitle) =>
                update((c) => ({
                  ...c,
                  characters: { ...c.characters, subtitle },
                }))
              }
            />
            {content.characters.items.map((item, idx) => (
              <div key={idx} className="field-group">
                <div className="field-group__bar">
                  <h4>Karakter {idx + 1}</h4>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() =>
                      update((c) => ({
                        ...c,
                        characters: {
                          ...c.characters,
                          items: c.characters.items.filter((_, i) => i !== idx),
                        },
                      }))
                    }
                  >
                    Sil
                  </button>
                </div>
                <Field
                  label="İsim"
                  value={item.name}
                  onChange={(name) =>
                    update((c) => {
                      const items = [
                        ...c.characters.items,
                      ] as LandingCastItem[];
                      items[idx] = { ...items[idx], name };
                      return {
                        ...c,
                        characters: { ...c.characters, items },
                      };
                    })
                  }
                />
                <Field
                  label="Açıklama"
                  multiline
                  value={item.blurb}
                  onChange={(blurb) =>
                    update((c) => {
                      const items = [
                        ...c.characters.items,
                      ] as LandingCastItem[];
                      items[idx] = { ...items[idx], blurb };
                      return {
                        ...c,
                        characters: { ...c.characters, items },
                      };
                    })
                  }
                />
              </div>
            ))}
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() =>
                update((c) => ({
                  ...c,
                  characters: {
                    ...c.characters,
                    items: [
                      ...c.characters.items,
                      { name: 'Yeni karakter', blurb: '' },
                    ],
                  },
                }))
              }
            >
              Karakter ekle
            </button>
          </div>
        </section>

        <section className="panel cms-section">
          <div className="panel__head">SSS (FAQ / AEO)</div>
          <div className="cms-body">
            <Field
              label="Başlık"
              value={content.faq.title}
              onChange={(title) =>
                update((c) => ({ ...c, faq: { ...c.faq, title } }))
              }
            />
            <Field
              label="Alt metin"
              multiline
              value={content.faq.subtitle}
              onChange={(subtitle) =>
                update((c) => ({ ...c, faq: { ...c.faq, subtitle } }))
              }
            />
            {content.faq.items.map((item, idx) => (
              <div key={idx} className="field-group">
                <div className="field-group__bar">
                  <h4>Soru {idx + 1}</h4>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() =>
                      update((c) => ({
                        ...c,
                        faq: {
                          ...c.faq,
                          items: c.faq.items.filter((_, i) => i !== idx),
                        },
                      }))
                    }
                  >
                    Sil
                  </button>
                </div>
                <Field
                  label="Soru"
                  value={item.question}
                  onChange={(question) =>
                    update((c) => {
                      const items = [...c.faq.items];
                      items[idx] = { ...items[idx], question };
                      return { ...c, faq: { ...c.faq, items } };
                    })
                  }
                />
                <Field
                  label="Cevap"
                  multiline
                  value={item.answer}
                  onChange={(answer) =>
                    update((c) => {
                      const items = [...c.faq.items];
                      items[idx] = { ...items[idx], answer };
                      return { ...c, faq: { ...c.faq, items } };
                    })
                  }
                />
              </div>
            ))}
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() =>
                update((c) => ({
                  ...c,
                  faq: {
                    ...c.faq,
                    items: [
                      ...c.faq.items,
                      { question: 'Yeni soru?', answer: '' },
                    ],
                  },
                }))
              }
            >
              Soru ekle
            </button>
          </div>
        </section>

        <section className="panel cms-section">
          <div className="panel__head">İndir / Final CTA</div>
          <div className="cms-body">
            <Field
              label="Başlık"
              value={content.download.title}
              onChange={(title) =>
                update((c) => ({
                  ...c,
                  download: { ...c.download, title },
                }))
              }
            />
            <Field
              label="Metin"
              multiline
              value={content.download.body}
              onChange={(body) =>
                update((c) => ({
                  ...c,
                  download: { ...c.download, body },
                }))
              }
            />
            <LinkFields
              title="Birincil CTA"
              value={content.download.primaryCta}
              onChange={(primaryCta) =>
                update((c) => ({
                  ...c,
                  download: { ...c.download, primaryCta },
                }))
              }
            />
            <LinkFields
              title="İkincil CTA"
              value={content.download.secondaryCta}
              onChange={(secondaryCta) =>
                update((c) => ({
                  ...c,
                  download: { ...c.download, secondaryCta },
                }))
              }
            />
          </div>
        </section>

        <section className="panel cms-section">
          <div className="panel__head">Footer</div>
          <div className="cms-body">
            <Field
              label="Sol ({{year}} kullanılabilir)"
              value={content.footer.left}
              onChange={(left) =>
                update((c) => ({ ...c, footer: { ...c.footer, left } }))
              }
            />
            <div className="field-row">
              <Field
                label="Gizlilik etiketi"
                value={content.footer.privacyLabel}
                onChange={(privacyLabel) =>
                  update((c) => ({
                    ...c,
                    footer: { ...c.footer, privacyLabel },
                  }))
                }
              />
              <Field
                label="Gizlilik href"
                value={content.footer.privacyHref}
                onChange={(privacyHref) =>
                  update((c) => ({
                    ...c,
                    footer: { ...c.footer, privacyHref },
                  }))
                }
              />
            </div>
            <div className="field-row">
              <Field
                label="Koşullar etiketi"
                value={content.footer.termsLabel}
                onChange={(termsLabel) =>
                  update((c) => ({
                    ...c,
                    footer: { ...c.footer, termsLabel },
                  }))
                }
              />
              <Field
                label="Koşullar href"
                value={content.footer.termsHref}
                onChange={(termsHref) =>
                  update((c) => ({
                    ...c,
                    footer: { ...c.footer, termsHref },
                  }))
                }
              />
            </div>
          </div>
        </section>

        <div className="cms-actions">
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? t('common.loading') : t('admin.common.save')}
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={resetDefaults}
          >
            {t('admin.common.reset')}
          </button>
          <a
            className="btn btn--ghost"
            href={import.meta.env.VITE_LANDING_URL || 'http://localhost:5173'}
            target="_blank"
            rel="noreferrer"
          >
            Önizleme ↗
          </a>
        </div>
      </form>
    </>
  );
}
