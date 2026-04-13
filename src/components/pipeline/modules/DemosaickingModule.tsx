import { usePipelineStore } from '../../../store/pipelineStore';
import { Badge } from '../../ui/Badge';
import type { DemosaickingConfig } from '../../../types/pipeline';

export function DemosaickingModule() {
  const { modules, updateModuleConfig } = usePipelineStore();
  const module = modules.find((m) => m.id === 'demosaicking')!;
  const config = module.config as unknown as DemosaickingConfig;

  const update = (partial: Partial<DemosaickingConfig>) =>
    updateModuleConfig('demosaicking', partial as Record<string, unknown>);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-sp-text-muted">SFA Pattern</label>
        <select
          value={config.pattern}
          onChange={(e) => update({ pattern: e.target.value as DemosaickingConfig['pattern'] })}
          className="bg-sp-surface border border-sp-border text-sp-text text-xs rounded px-2 py-1.5 outline-none"
        >
          <option value="4x4">4×4 (IMEC 16-band)</option>
          <option value="5x5">5×5 (IMEC 25-band / Photonfocus)</option>
          <option value="2x2">2×2 (Fabry-Pérot 4-band)</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-sp-text-muted">Interpolation Method</label>
        <select
          value={config.method}
          onChange={(e) => update({ method: e.target.value as DemosaickingConfig['method'] })}
          className="bg-sp-surface border border-sp-border text-sp-text text-xs rounded px-2 py-1.5 outline-none"
        >
          <option value="bilinear">Bilinear (balanced)</option>
          <option value="malvar">Malvar (high quality)</option>
          <option value="nn">Nearest-neighbour (fast)</option>
        </select>
      </div>

      <div className="flex gap-2 pt-1">
        <Badge variant="info">Runs first in pipeline</Badge>
        {config.method === 'malvar' && (
          <Badge variant="warn">Slower</Badge>
        )}
      </div>
    </div>
  );
}
