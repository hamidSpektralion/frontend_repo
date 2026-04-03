import { Play, Square, CheckCircle, AlertCircle, Undo2, Download } from 'lucide-react';
import { usePipelineStore } from '../../store/pipelineStore';
import { useViewerStore } from '../../store/viewerStore';
import { Button } from '../ui/Button';

export function PipelineRunBar() {
  const { modules, status, progress, runPipeline, cancelPipeline } = usePipelineStore();
  const { dataset, previousDataUrl, revertDataset } = useViewerStore();
  const enabledCount = modules.filter((m) => m.enabled).length;

  const handleDownload = () => {
    if (!dataset?.dataUrl) return;
    const a = document.createElement('a');
    a.href = dataset.dataUrl;
    a.download = `${dataset.name}_processed.png`;
    a.click();
  };

  return (
    <div className="border-t border-sp-border bg-sp-surface p-3 space-y-2.5">
      {/* Progress bar */}
      {(status === 'running' || status === 'complete') && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-sp-text-muted capitalize">{status}</span>
            <span className="font-mono text-sp-accent">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-sp-surface-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                status === 'complete' ? 'bg-sp-success' : 'bg-sp-accent'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Status indicator */}
      {status === 'error' && (
        <div className="flex items-center gap-2 text-xs text-sp-error">
          <AlertCircle className="w-3.5 h-3.5" />
          Pipeline error
        </div>
      )}
      {status === 'complete' && (
        <div className="flex items-center gap-2 text-xs text-sp-success">
          <CheckCircle className="w-3.5 h-3.5" />
          Pipeline complete
        </div>
      )}

      {/* Revert + Download (shown after a successful run) */}
      {status === 'complete' && dataset?.dataUrl && (
        <div className="flex items-center gap-2">
          {previousDataUrl && (
            <Button variant="ghost" size="sm" onClick={revertDataset} className="flex-1">
              <Undo2 className="w-3 h-3" />
              Revert
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleDownload} className="flex-1">
            <Download className="w-3 h-3" />
            Download
          </Button>
        </div>
      )}

      {/* Run / Cancel button */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-sp-text-muted flex-1">
          {enabledCount} module{enabledCount !== 1 ? 's' : ''} active
        </span>
        {status === 'running' ? (
          <Button variant="danger" size="sm" onClick={cancelPipeline}>
            <Square className="w-3 h-3" />
            Cancel
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={runPipeline}
            disabled={enabledCount === 0}
          >
            <Play className="w-3 h-3" />
            Run Pipeline
          </Button>
        )}
      </div>
    </div>
  );
}
