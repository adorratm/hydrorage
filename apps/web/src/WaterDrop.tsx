type WaterDropProps = {
  className?: string;
  /** Benzersiz gradient id (sayfada birden fazla damla için) */
  id?: string;
  cracked?: boolean;
  size?: 'sm' | 'md' | 'lg';
};

/** Gerçekçi, animasyonlu su damlası (SVG). */
export function WaterDrop({
  className = '',
  id = 'wd',
  cracked = false,
  size = 'md',
}: WaterDropProps) {
  const g = (name: string) => `${id}-${name}`;

  return (
    <div
      className={`water-drop water-drop--${size} ${className}`.trim()}
      aria-hidden
    >
      <svg className="water-drop__svg" viewBox="0 0 200 280" fill="none">
        <defs>
          <linearGradient id={g('body')} x1="70" y1="10" x2="150" y2="270">
            <stop offset="0%" stopColor="#EAF6FF" />
            <stop offset="22%" stopColor="#9ED8FF" />
            <stop offset="48%" stopColor="#4BA3E8" />
            <stop offset="72%" stopColor="#2D6BB0" />
            <stop offset="100%" stopColor="#163A6B" />
          </linearGradient>
          <radialGradient id={g('shine')} cx="32%" cy="26%" r="42%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
            <stop offset="35%" stopColor="rgba(255,255,255,0.35)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          <radialGradient id={g('core')} cx="55%" cy="62%" r="48%">
            <stop offset="0%" stopColor="rgba(189,147,249,0.45)" />
            <stop offset="55%" stopColor="rgba(77,163,232,0.15)" />
            <stop offset="100%" stopColor="rgba(22,58,107,0)" />
          </radialGradient>
          <linearGradient id={g('edge')} x1="40" y1="40" x2="170" y2="240">
            <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
            <stop offset="40%" stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(10,30,60,0.35)" />
          </linearGradient>
          <filter id={g('soft')} x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="2.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={g('shadow')} x="-40%" y="-10%" width="180%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="10" />
            <feOffset dy="14" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.45" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id={g('clip')}>
            <path d="M100 12C100 12 28 118 28 188c0 42 32.5 72 72 72s72-30 72-72C172 118 100 12 100 12Z" />
          </clipPath>
        </defs>

        {/* Zemin gölgesi */}
        <ellipse
          className="water-drop__ground"
          cx="100"
          cy="268"
          rx="48"
          ry="8"
          fill="rgba(0,0,0,0.35)"
        />

        <g filter={`url(#${g('shadow')})`} className="water-drop__body">
          <path
            d="M100 12C100 12 28 118 28 188c0 42 32.5 72 72 72s72-30 72-72C172 118 100 12 100 12Z"
            fill={`url(#${g('body')})`}
          />
          <path
            d="M100 12C100 12 28 118 28 188c0 42 32.5 72 72 72s72-30 72-72C172 118 100 12 100 12Z"
            fill={`url(#${g('core')})`}
          />
          <path
            d="M100 12C100 12 28 118 28 188c0 42 32.5 72 72 72s72-30 72-72C172 118 100 12 100 12Z"
            fill={`url(#${g('edge')})`}
            opacity="0.55"
          />

          {/* Speküler parlama */}
          <ellipse
            className="water-drop__spec"
            cx="72"
            cy="78"
            rx="22"
            ry="34"
            fill={`url(#${g('shine')})`}
            transform="rotate(-18 72 78)"
          />
          <ellipse
            className="water-drop__spec water-drop__spec--2"
            cx="128"
            cy="150"
            rx="10"
            ry="18"
            fill="rgba(255,255,255,0.22)"
            transform="rotate(12 128 150)"
          />

          {/* İç kaustik dalgalar */}
          <g clipPath={`url(#${g('clip')})`} className="water-drop__caustic">
            <path
              d="M20 160 Q70 140 100 165 T180 155"
              stroke="rgba(255,255,255,0.28)"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M30 190 Q80 175 110 195 T170 188"
              stroke="rgba(189,147,249,0.35)"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M40 215 Q90 200 120 218 T165 210"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
            />
          </g>

          {/* Kenar rim light */}
          <path
            d="M100 18C100 18 42 112 38 175"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            opacity="0.7"
          />

          {cracked ? (
            <g className="water-drop__crack" filter={`url(#${g('soft')})`}>
              <path
                d="M78 145 L98 172 L88 188 L118 210 L104 232"
                stroke="#FF5555"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <path
                d="M118 160 L108 182 L126 198"
                stroke="#FF79C6"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
                opacity="0.9"
              />
            </g>
          ) : null}
        </g>
      </svg>

      <span className="water-drop__ripple water-drop__ripple--a" />
      <span className="water-drop__ripple water-drop__ripple--b" />
    </div>
  );
}

/** Hero’da düşen küçük damlacıklar. */
export function FallingDrops() {
  return (
    <div className="falling-drops" aria-hidden>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`falling-drops__item falling-drops__item--${i}`}>
          <WaterDrop id={`fall${i}`} size="sm" />
        </span>
      ))}
    </div>
  );
}
