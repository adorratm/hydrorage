import { Link } from 'react-router-dom';
import { useLocale } from './locale';

export function SiteFooter({ left }: { left?: string }) {
  const { locale, t } = useLocale();
  const year = String(new Date().getFullYear());

  const links =
    locale === 'en'
      ? [
          { to: '/privacy', label: t('web.footer.privacy') },
          { to: '/terms', label: t('web.footer.terms') },
          { to: '/cookies', label: t('web.footer.cookies') },
          { to: '/blog', label: t('web.footer.blog') },
        ]
      : [
          { to: '/gizlilik', label: t('web.footer.privacy') },
          { to: '/kosullar', label: t('web.footer.terms') },
          { to: '/kvkk', label: t('web.footer.kvkk') },
          { to: '/aydinlatma-metni', label: t('web.footer.disclosure') },
          { to: '/cerez-politikasi', label: t('web.footer.cookies') },
          { to: '/blog', label: t('web.footer.blog') },
        ];

  return (
    <footer className="footer">
      <div className="footer__top">
        <Link className="brand-mark" to="/">
          HydroRage
        </Link>
        <nav className="footer__nav" aria-label={locale === 'en' ? 'Legal' : 'Yasal'}>
          {links.map((l) => (
            <Link key={l.to} to={l.to}>
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="footer__bottom">
        <span>{left ?? `© ${year} HydroRage`}</span>
        <span className="footer__credit">
          Developed by{' '}
          <a
            href="https://emrekilic.web.tr"
            target="_blank"
            rel="noopener noreferrer"
          >
            emrekilic.web.tr
          </a>
        </span>
      </div>
    </footer>
  );
}
