import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { localeTag } from '@hydrorage/shared';
import {
  api,
  type ActivityItem,
  type ActivityPage,
  type ActivityType,
  type AdminUserDetail,
} from '../lib/api';
import { useLocale } from '../locale';

const FILTERS: Array<ActivityType | 'all'> = [
  'all',
  'intake',
  'threat',
  'routine',
];

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, locale } = useLocale();
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [filter, setFilter] = useState<ActivityType | 'all'>('all');
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 40;

  useEffect(() => {
    if (!id) return;
    setUser(null);
    setItems([]);
    setOffset(0);
    setError(null);
    api<AdminUserDetail>(`/admin/users/${id}`)
      .then(setUser)
      .catch((e: Error) => setError(e.message));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setLoadingMore(true);
    const q = new URLSearchParams({
      limit: String(limit),
      offset: '0',
    });
    if (filter !== 'all') q.set('type', filter);
    api<ActivityPage>(`/admin/users/${id}/activity?${q}`)
      .then((page) => {
        setItems(page.items);
        setTotal(page.total);
        setOffset(page.items.length);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoadingMore(false));
  }, [id, filter]);

  const loadMore = async () => {
    if (!id || loadingMore) return;
    setLoadingMore(true);
    try {
      const q = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
      });
      if (filter !== 'all') q.set('type', filter);
      const page = await api<ActivityPage>(`/admin/users/${id}/activity?${q}`);
      setItems((prev) => [...prev, ...page.items]);
      setTotal(page.total);
      setOffset((o) => o + page.items.length);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoadingMore(false);
    }
  };

  const filterLabel = (f: ActivityType | 'all') => {
    if (f === 'all') return t('admin.activity.all');
    if (f === 'intake') return t('admin.activity.intake');
    if (f === 'threat') return t('admin.activity.threat');
    return t('admin.activity.routine');
  };

  if (error && !user) return <p className="error">{error}</p>;
  if (!user) return <p className="muted">{t('common.loading')}</p>;

  const tag = localeTag(locale);

  return (
    <>
      <p className="page-sub">
        <Link to="/users">{t('admin.user.back')}</Link>
      </p>
      <h1 className="page-title">{user.displayName || user.email}</h1>
      <p className="page-sub">{user.email}</p>

      <div className="grid-stats">
        <div className="stat">
          <span className="stat__label">{t('admin.user.streak')}</span>
          <span className="stat__value">{user.streakDays}d</span>
        </div>
        <div className="stat">
          <span className="stat__label">{t('admin.user.goal')}</span>
          <span className="stat__value">{user.dailyGoalMl} ml</span>
        </div>
        <div className="stat">
          <span className="stat__label">{t('admin.user.joined')}</span>
          <span className="stat__value stat__value--sm">
            {new Date(user.createdAt).toLocaleDateString(tag)}
          </span>
        </div>
        <div className="stat">
          <span className="stat__label">{t('admin.user.plus18')}</span>
          <span className="stat__value">{user.plus18Mode ? 'ON' : 'OFF'}</span>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: '1rem' }}>
        <div className="panel__head">{t('admin.user.detail')}</div>
        <div className="cms-body" style={{ padding: '1rem 1.15rem' }}>
          <p className="muted" style={{ margin: '0 0 0.5rem' }}>
            {t('admin.user.character')}:{' '}
            <strong>
              {user.activeCharacter?.name ?? (locale === 'en' ? '—' : '—')}
            </strong>
          </p>
          <p className="muted" style={{ margin: 0 }}>
            {t('admin.user.lastGoal')}:{' '}
            <strong>
              {user.lastGoalDate
                ? new Date(user.lastGoalDate).toLocaleDateString(tag)
                : '—'}
            </strong>
          </p>
        </div>
      </div>

      <h2 className="page-title" style={{ fontSize: '1.25rem' }}>
        {t('admin.activity.title')}
      </h2>

      <div className="cms-lang-tabs" style={{ marginBottom: '0.75rem' }}>
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            className={filter === f ? 'is-active' : undefined}
            onClick={() => setFilter(f)}
          >
            {filterLabel(f)}
          </button>
        ))}
      </div>

      {error ? <p className="error">{error}</p> : null}

      <div className="panel">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>{t('admin.activity.type')}</th>
                <th>{t('admin.activity.summary')}</th>
                <th>ml / status</th>
                <th>{t('admin.activity.when')}</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="muted">
                    {loadingMore
                      ? t('common.loading')
                      : t('admin.activity.empty')}
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={`${row.type}-${row.id}`}>
                    <td>
                      <span className="badge">{filterLabel(row.type)}</span>
                    </td>
                    <td>
                      <strong>{row.summary}</strong>
                      {row.detail ? (
                        <div className="muted" style={{ fontSize: '0.8rem' }}>
                          {row.detail}
                        </div>
                      ) : null}
                    </td>
                    <td>
                      {row.amountMl != null ? `${row.amountMl} ml` : null}
                      {row.status ? (
                        <span className="muted"> {row.status}</span>
                      ) : null}
                    </td>
                    <td>
                      {new Date(row.at).toLocaleString(tag, {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {items.length < total || items.length >= limit ? (
          <div style={{ padding: '0.75rem 1rem' }}>
            <button
              type="button"
              className="btn btn--ghost"
              disabled={loadingMore || items.length === 0}
              onClick={() => void loadMore()}
            >
              {loadingMore ? t('common.loading') : t('common.continue')}
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
}
