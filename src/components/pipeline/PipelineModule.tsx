import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight, GripVertical } from 'lucide-react';
import { Toggle } from '../ui/Toggle';
import { usePipelineStore } from '../../store/pipelineStore';
import type { ProcessingModuleId } from '../../types/pipeline';

interface PipelineModuleProps {
  id: ProcessingModuleId;
  label: string;
  enabled: boolean;
  children: ReactNode;
}

export function PipelineModule({ id, label, enabled, children }: PipelineModuleProps) {
  const [expanded, setExpanded] = useState(false);
  const toggleModule = usePipelineStore((s) => s.toggleModule);

  return (
    <div className={`border border-sp-border rounded-lg overflow-hidden transition-opacity ${enabled ? '' : 'opacity-60'}`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-sp-surface hover:bg-sp-surface-2 transition-colors">
        <GripVertical className="w-3.5 h-3.5 text-sp-text-muted cursor-grab shrink-0" />

        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 flex-1 text-left"
        >
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-sp-text-muted shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-sp-text-muted shrink-0" />
          )}
          <span className="text-sm text-sp-text font-medium">{label}</span>
        </button>

        <Toggle
          checked={enabled}
          onChange={() => toggleModule(id)}
        />
      </div>

      {/* Body */}
      {expanded && (
        <div className={`px-4 py-3 border-t border-sp-border bg-sp-bg space-y-3 ${!enabled ? 'pointer-events-none' : ''}`}>
          {children}
        </div>
      )}
    </div>
  );
}
