import { useViewerStore } from '../../store/viewerStore';

export function BandSelector() {
  const { dataset, activeBandIndex, setBand } = useViewerStore();

  if (!dataset) {
    return (
      <div className="px-4 py-3 border-t border-sp-border bg-sp-surface flex items-center gap-3">
        <span className="text-xs text-sp-text-muted">No dataset loaded</span>
      </div>
    );
  }

  const wavelength = dataset.wavelengths[activeBandIndex];
  const minWl = dataset.wavelengths[0];
  const maxWl = dataset.wavelengths[dataset.wavelengths.length - 1];

  return (
    <div className="px-4 py-3 border-t border-sp-border bg-sp-surface flex items-center gap-4">
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-sp-text-muted">Band</span>
        <span className="text-xs font-mono text-sp-accent tabular-nums">
          {activeBandIndex + 1}/{dataset.bands}
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={dataset.bands - 1}
        step={1}
        value={activeBandIndex}
        onChange={(e) => setBand(Number(e.target.value))}
        className="flex-1 accent-sp-accent"
      />

      <div className="flex items-center gap-1 shrink-0">
        <span className="text-xs font-mono text-sp-accent tabular-nums">
          {wavelength ? `${wavelength} nm` : '—'}
        </span>
        <span className="text-xs text-sp-text-muted">
          [{minWl}–{maxWl} nm]
        </span>
      </div>
    </div>
  );
}
