import { useViewerStore } from '../../store/viewerStore';

const RULER_HEIGHT = 32;
const TICK_INTERVAL = 100; // nm

export function WavelengthRuler() {
  const { dataset, activeBandIndex } = useViewerStore();

  if (!dataset) return null;

  const minWl = dataset.wavelengths[0];
  const maxWl = dataset.wavelengths[dataset.wavelengths.length - 1];
  const range = maxWl - minWl;
  const currentWl = dataset.wavelengths[activeBandIndex];

  // Generate tick positions
  const ticks: number[] = [];
  const firstTick = Math.ceil(minWl / TICK_INTERVAL) * TICK_INTERVAL;
  for (let wl = firstTick; wl <= maxWl; wl += TICK_INTERVAL) {
    ticks.push(wl);
  }

  const toPercent = (wl: number) => ((wl - minWl) / range) * 100;

  return (
    <div
      className="relative border-t border-sp-border bg-sp-surface mx-0"
      style={{ height: RULER_HEIGHT }}
    >
      <svg width="100%" height={RULER_HEIGHT} className="overflow-visible">
        {/* Spectral gradient bar */}
        <defs>
          <linearGradient id="spectral-ruler-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="20%" stopColor="#2563eb" />
            <stop offset="40%" stopColor="#0891b2" />
            <stop offset="60%" stopColor="#059669" />
            <stop offset="80%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="100%" height="3" fill="url(#spectral-ruler-grad)" />

        {/* Ticks and labels */}
        {ticks.map((wl) => {
          const x = `${toPercent(wl)}%`;
          return (
            <g key={wl}>
              <line x1={x} y1={3} x2={x} y2={10} stroke="#1f2937" strokeWidth={1} />
              <text
                x={x}
                y={24}
                textAnchor="middle"
                fontSize={9}
                fill="#64748b"
                fontFamily="monospace"
              >
                {wl}nm
              </text>
            </g>
          );
        })}

        {/* Current wavelength marker */}
        {currentWl && (
          <g>
            <line
              x1={`${toPercent(currentWl)}%`}
              y1={0}
              x2={`${toPercent(currentWl)}%`}
              y2={RULER_HEIGHT}
              stroke="#38bdf8"
              strokeWidth={1.5}
              strokeDasharray="3,2"
            />
          </g>
        )}
      </svg>
    </div>
  );
}
