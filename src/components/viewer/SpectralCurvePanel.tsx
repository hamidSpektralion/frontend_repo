import { useRef, useState } from 'react';
import { Pin, PinOff } from 'lucide-react';
import { useViewerStore } from '../../store/viewerStore';
import type { IlluminantId } from '../../types/spectral';

// ─── Chart geometry ───────────────────────────────────────────────────────────
const VW = 280;   // SVG viewBox width
const VH = 200;   // SVG viewBox height
const ML = 36;    // left margin (y-axis labels)
const MR = 8;     // right margin
const MT = 10;    // top margin
const MB = 36;    // bottom margin (x-axis + spectrum strip)
const CW = VW - ML - MR;   // chart width  = 236
const CH = VH - MT - MB;   // chart height = 154

const ILLUMINANTS: { id: IlluminantId; label: string }[] = [
  { id: 'D65', label: 'D65 Daylight' },
  { id: 'D50', label: 'D50 Horizon' },
  { id: 'A',   label: 'A Tungsten'  },
  { id: 'F2',  label: 'F2 Cool FL'  },
  { id: 'E',   label: 'E Equal'     },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function wlToHex(wl: number): string {
  if (wl < 380 || wl > 780) return '#555';
  let r = 0, g = 0, b = 0;
  if      (wl < 440) { r = -(wl - 440) / 60;  g = 0;               b = 1; }
  else if (wl < 490) { r = 0;                  g = (wl - 440) / 50; b = 1; }
  else if (wl < 510) { r = 0;                  g = 1;               b = -(wl - 510) / 20; }
  else if (wl < 580) { r = (wl - 510) / 70;   g = 1;               b = 0; }
  else if (wl < 645) { r = 1;                  g = -(wl - 645) / 65; b = 0; }
  else               { r = 1;                  g = 0;               b = 0; }
  let f = 1;
  if (wl < 420) f = 0.3 + 0.7 * (wl - 380) / 40;
  else if (wl > 700) f = 0.3 + 0.7 * (780 - wl) / 80;
  const ri = Math.round(Math.max(0, Math.min(1, r)) * f * 255);
  const gi = Math.round(Math.max(0, Math.min(1, g)) * f * 255);
  const bi = Math.round(Math.max(0, Math.min(1, b)) * f * 255);
  return `rgb(${ri},${gi},${bi})`;
}

// Catmull-Rom → cubic Bézier SVG path
function curvePath(pts: [number, number][]): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M${pts[0][0]},${pts[0][1]}`;
  const d: string[] = [`M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    d.push(`C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`);
  }
  return d.join(' ');
}

// Downsample array to at most maxPts evenly-spaced items
function downsample<T>(arr: T[], maxPts: number): T[] {
  if (arr.length <= maxPts) return arr;
  const step = arr.length / maxPts;
  const result: T[] = [];
  for (let i = 0; i < maxPts; i++) result.push(arr[Math.round(i * step)]);
  if (result[result.length - 1] !== arr[arr.length - 1]) result.push(arr[arr.length - 1]);
  return result;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SpectralCurvePanel() {
  const {
    dataset, activeBandIndex, setBand,
    hoveredSpectrum, pinnedSpectrum, pinSpectrum, clearPinnedSpectrum,
    illuminant, setIlluminant,
    viewMode, rgbBands, setRGBBands,
  } = useViewerStore();

  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (!dataset) {
    return (
      <div className="w-[300px] border-l border-sp-border bg-sp-surface flex-shrink-0 flex items-center justify-center">
        <p className="text-xs text-sp-text-muted text-center px-6 leading-relaxed">
          Load a dataset to<br />view spectral curves
        </p>
      </div>
    );
  }

  const { wavelengths, bands: numBands } = dataset;
  const minWl = wavelengths[0];
  const maxWl = wavelengths[numBands - 1];

  // Which spectrum to draw: hovered → pinned → zeros
  const displaySpectrum: number[] =
    hoveredSpectrum ?? pinnedSpectrum ?? new Array(numBands).fill(0);

  // ── Coordinate helpers ──────────────────────────────────────────────────────
  const toX = (wl: number) => ML + ((wl - minWl) / (maxWl - minWl)) * CW;
  const toY = (v: number)  => MT + (1 - Math.max(0, Math.min(1, v))) * CH;

  const svgXtoBandIdx = (clientX: number): number => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const svgX = ((clientX - rect.left) / rect.width) * VW;
    const t = (svgX - ML) / CW;
    return Math.max(0, Math.min(numBands - 1, Math.round(t * (numBands - 1))));
  };

  // ── Chart data ──────────────────────────────────────────────────────────────
  const sampledIdx = downsample(
    Array.from({ length: numBands }, (_, i) => i),
    80,
  );
  const chartPts: [number, number][] = sampledIdx.map((i) => [
    toX(wavelengths[i]),
    toY(displaySpectrum[i]),
  ]);

  const linePath = curvePath(chartPts);
  const fillPath = chartPts.length > 1
    ? `${linePath} L${toX(maxWl).toFixed(1)},${(MT + CH).toFixed(1)} L${toX(minWl).toFixed(1)},${(MT + CH).toFixed(1)} Z`
    : '';

  // Pinned spectrum (shown as ghost when hovered replaces it)
  let pinnedPts: [number, number][] | null = null;
  if (pinnedSpectrum && hoveredSpectrum) {
    pinnedPts = sampledIdx.map((i) => [toX(wavelengths[i]), toY(pinnedSpectrum[i])]);
  }

  // ── Spectrum gradient stops ─────────────────────────────────────────────────
  const gradStops: { pct: string; color: string }[] = [];
  for (let wl = minWl; wl <= maxWl; wl += 10) {
    const pct = (((wl - minWl) / (maxWl - minWl)) * 100).toFixed(1);
    gradStops.push({ pct: `${pct}%`, color: wlToHex(wl) });
  }

  // ── Axis ticks ──────────────────────────────────────────────────────────────
  const yTicks = [0, 0.25, 0.5, 0.75, 1.0];
  const xTicks: number[] = [];
  for (let wl = Math.ceil(minWl / 100) * 100; wl <= maxWl; wl += 100) xTicks.push(wl);

  // ── Current display values ──────────────────────────────────────────────────
  const readIdx = hoverIdx ?? activeBandIndex;
  const readWl  = wavelengths[readIdx];
  const readVal = displaySpectrum[readIdx] ?? 0;

  // ── RGB band safe indices ────────────────────────────────────────────────────
  const rIdx = Math.min(rgbBands.r, numBands - 1);
  const gIdx = Math.min(rgbBands.g, numBands - 1);
  const bIdx = Math.min(rgbBands.b, numBands - 1);

  // ── Active band position ────────────────────────────────────────────────────
  const activeX = toX(wavelengths[activeBandIndex]);

  // ── Hover cursor readout position ───────────────────────────────────────────
  const hoverX = hoverIdx !== null ? toX(wavelengths[hoverIdx]) : null;
  const hoverY = hoverIdx !== null ? toY(displaySpectrum[hoverIdx]) : null;

  // Position tooltip so it doesn't overflow the chart
  const tooltipRight = hoverX !== null && hoverX > ML + CW * 0.6;

  return (
    <div className="w-[300px] flex-shrink-0 border-l border-sp-border bg-sp-surface flex flex-col overflow-y-auto">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-sp-border shrink-0">
        <span className="text-[10px] font-semibold text-sp-text-muted uppercase tracking-widest">
          Spectral Curve
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={pinnedSpectrum ? clearPinnedSpectrum : pinSpectrum}
            title={pinnedSpectrum ? 'Clear pinned spectrum' : 'Pin current spectrum'}
            className={`p-1 rounded transition-colors ${
              pinnedSpectrum
                ? 'text-sp-accent bg-sp-accent/10'
                : 'text-sp-text-muted hover:text-sp-text-dim hover:bg-sp-surface-2'
            }`}
          >
            {pinnedSpectrum
              ? <PinOff className="w-3.5 h-3.5" />
              : <Pin className="w-3.5 h-3.5" />
            }
          </button>
          <select
            value={illuminant}
            onChange={(e) => setIlluminant(e.target.value as IlluminantId)}
            className="text-[10px] bg-sp-surface-2 border border-sp-border text-sp-text-muted rounded px-1.5 py-0.5 outline-none cursor-pointer"
          >
            {ILLUMINANTS.map((il) => (
              <option key={il.id} value={il.id}>{il.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Stats row ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-sp-surface-2 border-b border-sp-border text-[10px] shrink-0">
        <span
          className="font-mono font-semibold tabular-nums"
          style={{ color: wlToHex(readWl) }}
        >
          {readWl} nm
        </span>
        <span className="text-sp-border-2">│</span>
        <span className="font-mono text-sp-text-dim tabular-nums">
          {(readVal * 100).toFixed(1)}%
        </span>
        {hoveredSpectrum && (
          <>
            <span className="text-sp-border-2">│</span>
            <span className="text-sp-text-muted italic">live probe</span>
          </>
        )}
        {pinnedSpectrum && !hoveredSpectrum && (
          <>
            <span className="text-sp-border-2">│</span>
            <span className="text-sp-accent">pinned</span>
          </>
        )}
      </div>

      {/* ── SVG Chart ──────────────────────────────────────────────────────── */}
      <div className="px-1 py-1 shrink-0">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VW} ${VH}`}
          className="w-full block cursor-crosshair select-none"
          onMouseMove={(e) => setHoverIdx(svgXtoBandIdx(e.clientX))}
          onMouseLeave={() => setHoverIdx(null)}
          onClick={(e) => setBand(svgXtoBandIdx(e.clientX))}
        >
          <defs>
            <linearGradient id="sp-spec-strip" x1="0%" y1="0%" x2="100%" y2="0%">
              {gradStops.map((s) => (
                <stop key={s.pct} offset={s.pct} stopColor={s.color} stopOpacity={0.95} />
              ))}
            </linearGradient>
            <linearGradient id="sp-curve-fill" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%"   stopColor="#38bdf8" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.02} />
            </linearGradient>
            <clipPath id="sp-chart-clip">
              <rect x={ML} y={MT} width={CW} height={CH} />
            </clipPath>
          </defs>

          {/* Chart background */}
          <rect x={ML} y={MT} width={CW} height={CH} fill="#0c1220" rx={2} />

          {/* Horizontal grid lines */}
          {yTicks.map((v) => (
            <line
              key={v}
              x1={ML} y1={toY(v)}
              x2={ML + CW} y2={toY(v)}
              stroke={v === 0 || v === 1 ? '#1f2937' : '#161e2e'}
              strokeWidth={v === 0 || v === 1 ? 1 : 0.5}
            />
          ))}

          {/* Pinned ghost curve */}
          {pinnedPts && (
            <path
              d={curvePath(pinnedPts)}
              fill="none"
              stroke="#64748b"
              strokeWidth={1}
              strokeDasharray="4,3"
              clipPath="url(#sp-chart-clip)"
            />
          )}

          {/* Fill area */}
          {fillPath && (
            <path d={fillPath} fill="url(#sp-curve-fill)" clipPath="url(#sp-chart-clip)" />
          )}

          {/* Main curve */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#38bdf8"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              clipPath="url(#sp-chart-clip)"
            />
          )}

          {/* False-color RGB band markers */}
          {viewMode === 'false-color' && (
            <g clipPath="url(#sp-chart-clip)">
              {([
                { idx: rIdx, color: '#ef4444', label: 'R' },
                { idx: gIdx, color: '#10b981', label: 'G' },
                { idx: bIdx, color: '#60a5fa', label: 'B' },
              ] as const).map(({ idx, color, label }) => {
                const x = toX(wavelengths[idx]);
                return (
                  <g key={label}>
                    <line
                      x1={x} y1={MT} x2={x} y2={MT + CH}
                      stroke={color} strokeWidth={1} strokeDasharray="3,3" opacity={0.65}
                    />
                    <circle cx={x} cy={MT + 8} r={5} fill={color} opacity={0.9} />
                    <text
                      x={x} y={MT + 8.5}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize={6} fontWeight="bold" fill="#000" fontFamily="monospace"
                    >
                      {label}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* Active band cursor */}
          <line
            x1={activeX} y1={MT}
            x2={activeX} y2={MT + CH}
            stroke="#38bdf8" strokeWidth={1.5} opacity={0.8}
            clipPath="url(#sp-chart-clip)"
          />
          <polygon
            points={`${activeX - 4},${MT} ${activeX + 4},${MT} ${activeX},${MT + 7}`}
            fill="#38bdf8" opacity={0.9}
          />

          {/* Hover cursor + readout */}
          {hoverX !== null && hoverIdx !== activeBandIndex && (
            <g>
              <line
                x1={hoverX} y1={MT}
                x2={hoverX} y2={MT + CH}
                stroke="#94a3b8" strokeWidth={0.75} strokeDasharray="2,3"
                clipPath="url(#sp-chart-clip)"
              />
              {hoverY !== null && (
                <circle cx={hoverX} cy={hoverY} r={3} fill="#38bdf8" stroke="#0c1220" strokeWidth={1.5} />
              )}
              {hoverY !== null && (
                <g transform={`translate(${tooltipRight ? hoverX - 4 : hoverX + 4}, ${Math.max(MT + 4, hoverY - 18)})`}>
                  <rect
                    x={tooltipRight ? -56 : 0} y={0} width={52} height={16}
                    rx={2} fill="#0a0e1a" stroke="#1f2937" strokeWidth={0.5}
                  />
                  <text
                    x={tooltipRight ? -52 + 26 : 26} y={10.5}
                    textAnchor="middle" fontSize={8} fill="#94a3b8" fontFamily="monospace"
                  >
                    {hoverIdx !== null ? wavelengths[hoverIdx] : '—'}nm
                  </text>
                </g>
              )}
            </g>
          )}

          {/* Y-axis labels */}
          {yTicks.map((v) => (
            <text
              key={v}
              x={ML - 4} y={toY(v) + 3}
              textAnchor="end" fontSize={7.5} fill="#475569" fontFamily="monospace"
            >
              {v === 1 ? '1.0' : v === 0 ? '0' : v.toFixed(2).replace('0.', '.')}
            </text>
          ))}

          {/* X-axis ticks + labels */}
          {xTicks.map((wl) => (
            <g key={wl}>
              <line
                x1={toX(wl)} y1={MT + CH}
                x2={toX(wl)} y2={MT + CH + 5}
                stroke="#374151" strokeWidth={1}
              />
              <text
                x={toX(wl)} y={MT + CH + 14}
                textAnchor="middle" fontSize={7.5} fill="#475569" fontFamily="monospace"
              >
                {wl}
              </text>
            </g>
          ))}

          {/* Axis unit label */}
          <text
            x={ML + CW / 2} y={VH - 19}
            textAnchor="middle" fontSize={7} fill="#374151" fontFamily="monospace"
          >
            wavelength (nm)
          </text>

          {/* Visible spectrum strip */}
          <rect
            x={ML} y={VH - 14}
            width={CW} height={6}
            fill="url(#sp-spec-strip)" rx={1}
          />
        </svg>
      </div>

      {/* ── RGB Band Controls (false-color mode only) ───────────────────────── */}
      {viewMode === 'false-color' && (
        <div className="border-t border-sp-border px-3 py-2.5 space-y-2 shrink-0">
          <span className="text-[10px] text-sp-text-muted uppercase tracking-wider block">
            RGB Band Assignment
          </span>
          {(['r', 'g', 'b'] as const).map((ch) => {
            const colors = { r: '#ef4444', g: '#10b981', b: '#60a5fa' } as const;
            const labels = { r: 'R', g: 'G', b: 'B' } as const;
            return (
              <div key={ch} className="flex items-center gap-2">
                <span
                  className="text-[10px] font-bold w-3 shrink-0"
                  style={{ color: colors[ch] }}
                >
                  {labels[ch]}
                </span>
                <input
                  type="range"
                  min={0}
                  max={numBands - 1}
                  step={1}
                  value={rgbBands[ch]}
                  onChange={(e) =>
                    setRGBBands({ ...rgbBands, [ch]: Number(e.target.value) })
                  }
                  className="flex-1"
                  style={{ accentColor: colors[ch] }}
                />
                <span
                  className="text-[10px] font-mono tabular-nums w-12 text-right shrink-0"
                  style={{ color: colors[ch] }}
                >
                  {wavelengths[Math.min(rgbBands[ch], numBands - 1)]} nm
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Illuminant info ─────────────────────────────────────────────────── */}
      <div className="mt-auto border-t border-sp-border px-3 py-2 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-sp-text-muted">Illuminant</span>
          <span className="text-[10px] font-mono text-sp-accent">{illuminant}</span>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-[10px] text-sp-text-muted">Range</span>
          <span className="text-[10px] font-mono text-sp-text-dim tabular-nums">
            {minWl}–{maxWl} nm
          </span>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-[10px] text-sp-text-muted">Bands</span>
          <span className="text-[10px] font-mono text-sp-text-dim tabular-nums">
            {numBands}
          </span>
        </div>
      </div>

    </div>
  );
}
