import { useEffect, useState, type FormEvent } from 'react';
import {
  DEFAULT_LANDING_CONTENT,
  type LandingCastItem,
  type LandingContent,
  type LandingStep,
} from '@hydrorage/shared';
import { api } from '../lib/api';

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
  return (
    <div className="field-group">
      <h4>{title}</h4>
      <div className="field-row">
        <Field
          label="Etiket"
          value={value.label}
          onChange={(label) => onChange({ ...value, label })}
        />
        <Field
          label="Link"
          value={value.href}
          onChange={(href) => onChange({ ...value, href })}
        />
      </div>
    </div>
  );
}

export function LandingCmsPage() {
  const [content, setContent] = useState<LandingContent | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<LandingContent>('/admin/landing')
      .then(setContent)
      .catch((e: Error) => {
        setContent(structuredClone(DEFAULT_LANDING_CONTENT));
        setError(e.message);
      });
  }, []);

  const update = (patch: (c: LandingContent) => LandingContent) => {
    setContent((prev) => (prev ? patch(prev) : prev));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const saved = await api<LandingContent>('/admin/landing', {
        method: 'PUT',
        body: JSON.stringify(content),
      });
      setContent(saved);
      setMessage('Landing kaydedildi. hydrorage.com anında güncellenir.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız');
    } finally {
      setSaving(false);
    }
  };

  const resetDefaults = () => {
    if (!confirm('Varsayılan içeriğe dönülsün mü? (Henüz kaydedilmez)')) return;
    setContent(structuredClone(DEFAULT_LANDING_CONTENT));
    setMessage('Varsayılan yüklendi — kaydetmeyi unutma.');
  };

  if (!content) return <p className="muted">Yükleniyor…</p>;

  return (
    <>
      <h1 className="page-title">Landing</h1>
      <p className="page-sub">
        hydrorage.com içeriğini buradan yönet. Kaydettikten sonra public API
        güncellenir.
      </p>

      {message ? <p className="ok-msg">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}

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
            <Field
              label="Sağ"
              value={content.footer.right}
              onChange={(right) =>
                update((c) => ({ ...c, footer: { ...c.footer, right } }))
              }
            />
          </div>
        </section>

        <div className="cms-actions">
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={resetDefaults}
          >
            Varsayılana dön
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
