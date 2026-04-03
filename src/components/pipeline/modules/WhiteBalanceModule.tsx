import { usePipelineStore } from '../../../store/pipelineStore';
import { Slider } from '../../ui/Slider';
import { Pipette } from 'lucide-react';
import type { WhiteBalanceConfig } from '../../../types/pipeline';

export function WhiteBalanceModule() {
  const { modules, updateModuleConfig } = usePipelineStore();
  const module = modules.find((m) => m.id === 'white-balance')!;
  const config = module.config as unknown as WhiteBalanceConfig;

  const update = (partial: Partial<WhiteBalanceConfig>) =>
    updateModuleConfig('white-balance', partial as Record<string, unknown>);

  const kelvin = Math.round(1000 + (config.gainR / 2) * 5500);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-sp-text-muted">Mode</label>
        <select
          value={config.mode}
          onChange={(e) => update({ mode: e.target.value as WhiteBalanceConfig['mode'] })}
          className="bg-sp-surface border border-sp-border text-sp-text text-xs rounded px-2 py-1.5 outline-none"
        >
          <option value="auto">Auto</option>
          <option value="manual">Manual</option>
          <option value="reference">Reference Patch</option>
        </select>
      </div>

      {config.mode === 'manual' && (
        <div className="space-y-2.5">
          <Slider
            label="R gain"
            value={config.gainR}
            min={0.1} max={3} step={0.05}
            onChange={(v) => update({ gainR: v })}
          />
          <Slider
            label="G gain"
            value={config.gainG}
            min={0.1} max={3} step={0.05}
            onChange={(v) => update({ gainG: v })}
          />
          <Slider
            label="B gain"
            value={config.gainB}
            min={0.1} max={3} step={0.05}
            onChange={(v) => update({ gainB: v })}
          />
        </div>
      )}

      {config.mode === 'reference' && (
        <button className="flex items-center gap-2 w-full py-2 px-3 text-xs border border-dashed border-sp-border rounded hover:border-sp-accent/50 text-sp-text-muted hover:text-sp-accent transition-colors">
          <Pipette className="w-3.5 h-3.5" />
          Sample from canvas
        </button>
      )}

      <div className="flex items-center justify-between text-xs">
        <span className="text-sp-text-muted">Color temp.</span>
        <span className="font-mono text-sp-accent">{kelvin} K</span>
      </div>
    </div>
  );
}
