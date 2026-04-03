import { usePipelineStore } from '../../../store/pipelineStore';
import { Slider } from '../../ui/Slider';
import { Badge } from '../../ui/Badge';
import type { DenoisingConfig } from '../../../types/pipeline';

export function DenoisingModule() {
  const { modules, updateModuleConfig } = usePipelineStore();
  const module = modules.find((m) => m.id === 'denoising')!;
  const config = module.config as unknown as DenoisingConfig;

  const update = (partial: Partial<DenoisingConfig>) =>
    updateModuleConfig('denoising', partial as Record<string, unknown>);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-sp-text-muted">Algorithm</label>
        <select
          value={config.algorithm}
          onChange={(e) => update({ algorithm: e.target.value as DenoisingConfig['algorithm'] })}
          className="bg-sp-surface border border-sp-border text-sp-text text-xs rounded px-2 py-1.5 outline-none"
        >
          <option value="gaussian">Gaussian</option>
          <option value="bilateral">Bilateral</option>
          <option value="bm3d">BM3D</option>
          <option value="wavelet">Wavelet</option>
        </select>
      </div>

      <Slider
        label="Strength"
        value={config.strength}
        min={0} max={100}
        onChange={(v) => update({ strength: v })}
      />

      <Slider
        label="Spatial σ"
        value={config.spatialSigma}
        min={0.5} max={10} step={0.5}
        onChange={(v) => update({ spatialSigma: v })}
      />

      <Slider
        label="Spectral σ"
        value={config.spectralSigma}
        min={1} max={50}
        unit=" nm"
        onChange={(v) => update({ spectralSigma: v })}
      />

      <div className="flex gap-2 pt-1">
        <Badge variant="info">~2s est.</Badge>
        {config.algorithm === 'bm3d' && (
          <Badge variant="warn">High compute</Badge>
        )}
      </div>
    </div>
  );
}
