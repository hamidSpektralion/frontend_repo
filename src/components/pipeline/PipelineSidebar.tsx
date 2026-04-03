import { Settings2, ChevronsUpDown } from 'lucide-react';
import { usePipelineStore } from '../../store/pipelineStore';
import { PipelineModule } from './PipelineModule';
import { PipelineRunBar } from './PipelineRunBar';
import { DenoisingModule } from './modules/DenoisingModule';
import { SuperResolutionModule } from './modules/SuperResolutionModule';
import { WhiteBalanceModule } from './modules/WhiteBalanceModule';
import { DarkCalibrationModule } from './modules/DarkCalibrationModule';
import { NormalizationModule } from './modules/NormalizationModule';
import type { ProcessingModuleId } from '../../types/pipeline';
import type { ReactNode } from 'react';

const moduleContents: Record<ProcessingModuleId, ReactNode> = {
  'dark-calibration': <DarkCalibrationModule />,
  'white-balance': <WhiteBalanceModule />,
  'denoising': <DenoisingModule />,
  'normalization': <NormalizationModule />,
  'super-resolution': <SuperResolutionModule />,
};

export function PipelineSidebar() {
  const modules = usePipelineStore((s) => s.modules);
  const sorted = [...modules].sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-col h-full border-l border-sp-border bg-sp-bg w-80 shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-sp-border">
        <h2 className="text-sm font-semibold text-sp-text">Processing Pipeline</h2>
        <div className="flex items-center gap-1">
          <button className="p-1 rounded hover:bg-sp-surface-2 text-sp-text-muted hover:text-sp-text transition-colors" title="Settings">
            <Settings2 className="w-4 h-4" />
          </button>
          <button className="p-1 rounded hover:bg-sp-surface-2 text-sp-text-muted hover:text-sp-text transition-colors" title="Collapse all">
            <ChevronsUpDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modules list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
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
      <PipelineRunBar />
    </div>
  );
}
