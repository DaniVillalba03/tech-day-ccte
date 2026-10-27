interface Props {
  /** Orientación del cohete, grados desde la horizontal (90 = vertical) */
  thetaDeg: number;
  /** Ángulo del vector velocidad (prograde), grados */
  pathDeg: number;
  showPath: boolean;
}

/** Indicador de actitud simple: el cohete apunta según su ángulo; el marcador azul es el prograde. */
export function Navball({ thetaDeg, pathDeg, showPath }: Props) {
  const ticks = Array.from({ length: 12 }, (_, i) => i * 30);
  return (
    <svg viewBox="-60 -60 120 120" className="size-28" role="img" aria-label={`Ángulo ${Math.round(thetaDeg)} grados`}>
      <circle r="56" fill="#12151a" stroke="rgb(255 255 255 / 0.3)" />
      <path d="M-56 0 A56 56 0 0 1 56 0 Z" fill="#244b8f" opacity="0.35" />
      <path d="M-56 0 A56 56 0 0 0 56 0 Z" fill="#31363e" opacity="0.6" />
      <line x1="-56" y1="0" x2="56" y2="0" stroke="#f9f9f7" strokeOpacity="0.5" />
      {ticks.map((a) => (
        <line
          key={a}
          x1="0"
          y1="-56"
          x2="0"
          y2="-51"
          stroke="#a8adb5"
          transform={`rotate(${a})`}
        />
      ))}
      {showPath && (
        <g transform={`rotate(${90 - pathDeg})`}>
          <circle cy="-38" r="5" fill="none" stroke="#6f9bec" strokeWidth="2" />
        </g>
      )}
      <g transform={`rotate(${90 - thetaDeg})`}>
        <path d="M0 -34 L7 8 L0 3 L-7 8 Z" fill="#d52b32" stroke="#f9f9f7" strokeWidth="1.5" />
      </g>
    </svg>
  );
}
