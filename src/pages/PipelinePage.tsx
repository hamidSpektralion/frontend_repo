import { AppShell } from '../components/layout/AppShell';
import { PipelineModule } from '../components/pipeline/PipelineModule';
import { PipelineRunBar } from '../components/pipeline/PipelineRunBar';
import { DenoisingModule } from '../components/pipeline/modules/DenoisingModule';
import { SuperResolutionModule } from '../components/pipeline/modules/SuperResolutionModule';
import { WhiteBalanceModule } from '../components/pipeline/modules/WhiteBalanceModule';
import { DarkCalibrationModule } from '../components/pipeline/modules/DarkCalibrationModule';
import { NormalizationModule } from '../components/pipeline/modules/NormalizationModule';
import { usePipelineStore } from '../store/pipelineStore';
import { Save, FolderOpen } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function PipelinePage() {
  const modules = usePipelineStore((s) => s.modules);
  const sorted = [...modules].sort((a, b) => a.order - b.order);

  const moduleContents: Record<string, React.ReactNode> = {
    'dark-calibration': <DarkCalibrationModule />,
    'white-balance': <WhiteBalanceModule />,
    'denoising': <DenoisingModule />,
    'normalization': <NormalizationModule />,
    'super-resolution': <SuperResolutionModule />,
  };

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-sp-text">Pipeline Configuration</h1>
            <p className="text-sm text-sp-text-muted mt-1">
              Configure and save pre-processing presets for your spectral data.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <FolderOpen className="w-4 h-4" />
              Load Preset
            </Button>
            <Button variant="secondary" size="sm">
              <Save className="w-4 h-4" />
              Save Preset
            </Button>
          </div>
        </div>

        {/* Module grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {sorted.map((mod) => (
            <PipelineModule
              key={mod.id}
              id={mod.id}
              label={mod.label}
              enabled={mod.enabled}
            >
              {moduleContents[mod.id]}
            </PipelineModule>
          ))}
        </div>

        {/* Run bar */}
        <div className="border border-sp-border rounded-lg overflow-hidden">
          <PipelineRunBar />
        </div>
      </div>
    </AppShell>
  );
}
