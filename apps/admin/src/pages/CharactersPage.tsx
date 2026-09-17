import { useEffect, useState } from 'react';
import { api, type Overview } from '../lib/api';

export function CharactersPage() {
  const [chars, setChars] = useState<Overview['characters'] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Overview>('/admin/overview')
      .then((d) => setChars(d.characters))
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!chars) return <p className="muted">Yükleniyor…</p>;

  return (
    <>
      <h1 className="page-title">Karakterler</h1>
      <p className="page-sub">Tehdit sesleri ve unlock eşikleri</p>
      <div className="panel">
        <div className="cast-list">
          {chars.map((c) => (
            <article key={c.id}>
              <div>
                <strong>{c.name}</strong>
                <span>{c.description}</span>
              </div>
              <span className="badge">
                {c.maxDb} dB · streak {c.unlockStreakDays}
              </span>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
