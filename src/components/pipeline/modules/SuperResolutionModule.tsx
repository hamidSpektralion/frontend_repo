import { usePipelineStore } from '../../../store/pipelineStore';
import { Slider } from '../../ui/Slider';
import { Badge } from '../../ui/Badge';
import type { SuperResolutionConfig } from '../../../types/pipeline';

const scales: Array<2 | 4 | 8> = [2, 4, 8];

export function SuperResolutionModule() {
  const { modules, updateModuleConfig } = usePipelineStore();
  const module = modules.find((m) => m.id === 'super-resolution')!;
  const config = module.config as unknown as SuperResolutionConfig;

  const update = (partial: Partial<SuperResolutionConfig>) =>
    updateModuleConfig('super-resolution', partial as Record<string, unknown>);

  return (
    <div className="space-y-3">
      {/* Scale factor */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-sp-text-muted">Scale Factor</label>
        <div className="flex gap-1">
          {scales.map((s) => (
            <button
              key={s}
              onClick={() => update({ scaleFactor: s })}
              className={`flex-1 py-1 text-xs rounded border transition-colors ${
                config.scaleFactor === s
                  ? 'bg-sp-accent/10 border-sp-accent text-sp-accent'
                  : 'bg-sp-surface border-sp-border text-sp-text-dim hover:border-sp-border-2'
              }`}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>

      {/* Model */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-sp-text-muted">Model</label>
        <select
          value={config.model}
          onChange={(e) => update({ model: e.target.value as SuperResolutionConfig['model'] })}
          className="bg-sp-surface border border-sp-border text-sp-text text-xs rounded px-2 py-1.5 outline-none"
        >
          <option value="bicubic">Bicubic (fast)</option>
          <option value="edsr">EDSR</option>
          <option value="espcn">ESPCN</option>
        </select>
      </div>

      <Slider
        label="Sharpness"
        value={config.sharpness}
        min={0} max={100}
        onChange={(v) => update({ sharpness: v })}
      />

      <div className="flex gap-2 pt-1">
        {config.scaleFactor === 8 && (
          <Badge variant="warn">High memory at 8×</Badge>
        )}
        {config.model !== 'bicubic' && (
          <Badge variant="info">GPU recommended</Badge>
        )}
      </div>
    </div>
  );
}
