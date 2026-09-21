const APP_STORE_URL = 'https://apps.apple.com/app/hydrorage';
const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.hydrorage.app';

function isAdminUrl(href: string) {
  return /admin\.hydrorage|\/admin\b|admin\.localhost/i.test(href);
}

export function storeLinks(content?: {
  primaryCta?: { href: string };
  secondaryCta?: { href: string };
}) {
  const a = content?.primaryCta?.href;
  const b = content?.secondaryCta?.href;
  const apple =
    a && /apps\.apple\.com|itunes\.apple\.com/i.test(a) && !isAdminUrl(a)
      ? a
      : b && /apps\.apple\.com|itunes\.apple\.com/i.test(b) && !isAdminUrl(b)
        ? b
        : APP_STORE_URL;
  const google =
    a && /play\.google\.com/i.test(a) && !isAdminUrl(a)
      ? a
      : b && /play\.google\.com/i.test(b) && !isAdminUrl(b)
        ? b
        : PLAY_STORE_URL;
  return { apple, google };
}

/** App Store + Google Play indirme butonları (admin linki yok). */
export function StoreButtons({
  appleHref,
  googleHref,
  className = 'cta-row',
}: {
  appleHref?: string;
  googleHref?: string;
  className?: string;
}) {
  const apple = appleHref && !isAdminUrl(appleHref) ? appleHref : APP_STORE_URL;
  const google =
    googleHref && !isAdminUrl(googleHref) ? googleHref : PLAY_STORE_URL;

  return (
    <div className={className}>
      <a
        className="store-btn store-btn--apple"
        href={apple}
        rel="noopener noreferrer"
        target="_blank"
        aria-label="App Store’dan indir"
      >
        <svg className="store-btn__icon" viewBox="0 0 24 24" aria-hidden>
          <path
            fill="currentColor"
            d="M16.365 12.23c-.022-2.263 1.85-3.35 1.934-3.4-1.055-1.543-2.696-1.754-3.277-1.777-1.394-.142-2.72.82-3.427.82-.707 0-1.8-.798-2.96-.777-1.524.022-2.93.886-3.715 2.25-1.585 2.748-.405 6.82 1.139 9.055.755 1.093 1.655 2.32 2.836 2.277 1.138-.047 1.568-.737 2.943-.737 1.375 0 1.76.737 2.96.714 1.223-.02 1.998-1.112 2.747-2.21.866-1.267 1.222-2.493 1.242-2.556-.027-.012-2.382-.914-2.405-3.628l-.017-.031zM14.5 5.98c.627-.76 1.05-1.817.934-2.87-.903.037-1.996.602-2.643 1.36-.58.672-1.088 1.746-.952 2.774 1.008.078 2.034-.512 2.661-1.264z"
          />
        </svg>
        <span className="store-btn__text">
          <small>Download on the</small>
          <strong>App Store</strong>
        </span>
      </a>
      <a
        className="store-btn store-btn--google"
        href={google}
        rel="noopener noreferrer"
        target="_blank"
        aria-label="Google Play’den indir"
      >
        <svg className="store-btn__icon" viewBox="0 0 24 24" aria-hidden>
          <path
            fill="currentColor"
            d="M3.6 2.4c-.35.2-.6.58-.6 1.05v17.1c0 .47.25.85.6 1.05l9.55-9.6L3.6 2.4zm11.05 6.35L6.05 3.4l9.7 5.6-1.1-.25zm.95 1.55 2.35 1.35c.55.32.55.84 0 1.16l-2.4 1.4-1.85-1.85 1.9-2.06zM6.05 20.6l8.55-4.95 1.15-.2-9.7 5.15z"
          />
        </svg>
        <span className="store-btn__text">
          <small>GET IT ON</small>
          <strong>Google Play</strong>
        </span>
      </a>
    </div>
  );
}
