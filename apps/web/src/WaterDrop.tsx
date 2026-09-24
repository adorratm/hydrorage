import dropUrl from './assets/drop.png';

type WaterDropProps = {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
};

/** Markadaki mor-pembe damla, saydam zemin. */
export function WaterDrop({ className = '', size = 'md' }: WaterDropProps) {
  return (
    <div
      className={`water-drop water-drop--${size} ${className}`.trim()}
      aria-hidden
    >
      <img className="water-drop__img" src={dropUrl} alt="" draggable={false} />
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
          <WaterDrop size="sm" />
        </span>
      ))}
    </div>
  );
}
