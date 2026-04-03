import { usePipelineStore } from '../../../store/pipelineStore';
import { Toggle } from '../../ui/Toggle';
import { FolderOpen } from 'lucide-react';
import type { DarkCalibrationConfig } from '../../../types/pipeline';

export function DarkCalibrationModule() {
  const { modules, updateModuleConfig } = usePipelineStore();
  const module = modules.find((m) => m.id === 'dark-calibration')!;
  const config = module.config as unknown as DarkCalibrationConfig;

  const update = (partial: Partial<DarkCalibrationConfig>) =>
    updateModuleConfig('dark-calibration', partial as Record<string, unknown>);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-sp-text-muted">Dark Frame Source</label>
        <select
          value={config.source}
          onChange={(e) => update({ source: e.target.value as DarkCalibrationConfig['source'] })}
          className="bg-sp-surface border border-sp-border text-sp-text text-xs rounded px-2 py-1.5 outline-none"
        >
          <option value="none">None</option>
          <option value="file">Load from file</option>
          <option value="auto">Auto-detect</option>
        </select>
      </div>

      {config.source === 'file' && (
        <button className="flex items-center gap-2 w-full py-2 px-3 text-xs border border-dashed border-sp-border rounded hover:border-sp-accent/50 text-sp-text-muted hover:text-sp-accent transition-colors">
          <FolderOpen className="w-3.5 h-3.5" />
          {config.darkFrameUrl ? 'dark_frame.tif' : 'Load dark frame…'}
        </button>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-xs text-sp-text-muted">Integration Time</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={config.integrationTime}
            min={1}
            max={100000}
            onChange={(e) => update({ integrationTime: Number(e.target.value) })}
            className="w-full bg-sp-surface border border-sp-border text-sp-text text-xs rounded px-2 py-1.5 outline-none font-mono"
          />
          <span className="text-xs text-sp-text-muted shrink-0">ms</span>
        </div>
      </div>

      <Toggle
        checked={config.temperatureCompensation}
        onChange={(v) => update({ temperatureCompensation: v })}
        label="Temperature compensation"
      />
    </div>
  );
}
