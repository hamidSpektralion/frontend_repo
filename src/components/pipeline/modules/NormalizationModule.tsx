import { usePipelineStore } from '../../../store/pipelineStore';
import { Slider } from '../../ui/Slider';
import { Toggle } from '../../ui/Toggle';
import type { NormalizationConfig } from '../../../types/pipeline';

export function NormalizationModule() {
  const { modules, updateModuleConfig } = usePipelineStore();
  const module = modules.find((m) => m.id === 'normalization')!;
  const config = module.config as unknown as NormalizationConfig;

  const update = (partial: Partial<NormalizationConfig>) =>
    updateModuleConfig('normalization', partial as Record<string, unknown>);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-sp-text-muted">Method</label>
        <select
          value={config.method}
          onChange={(e) => update({ method: e.target.value as NormalizationConfig['method'] })}
          className="bg-sp-surface border border-sp-border text-sp-text text-xs rounded px-2 py-1.5 outline-none"
        >
          <option value="minmax">Min–Max</option>
          <option value="zscore">Z-score</option>
          <option value="percentile">Percentile clip</option>
        </select>
      </div>

      {config.method === 'percentile' && (
        <div className="space-y-2.5">
          <Slider
            label="Clip low"
            value={config.clipLow}
            min={0} max={5} step={0.1}
            unit="%"
            onChange={(v) => update({ clipLow: v })}
          />
          <Slider
            label="Clip high"
            value={config.clipHigh}
            min={0} max={5} step={0.1}
            unit="%"
            onChange={(v) => update({ clipHigh: v })}
          />
        </div>
      )}

      <Toggle
        checked={config.perBand}
        onChange={(v) => update({ perBand: v })}
        label="Per-band normalization"
      />

      <div className="flex items-center justify-between text-xs pt-1">
        <span className="text-sp-text-muted">Output range</span>
        <span className="font-mono text-sp-accent">
          {config.method === 'zscore' ? 'μ=0, σ=1' : '[0, 1]'}
        </span>
      </div>
    </div>
  );
}
