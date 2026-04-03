import { ViewerToolbar } from './ViewerToolbar';
import { ImageCanvas } from './ImageCanvas';
import { BandSelector } from './BandSelector';
import { WavelengthRuler } from './WavelengthRuler';
import { SpectralCurvePanel } from './SpectralCurvePanel';

export function SpectralViewer() {
  return (
    <div className="flex flex-col h-full bg-sp-bg">
      <ViewerToolbar />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Image pane */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <ImageCanvas />
          <WavelengthRuler />
          <BandSelector />
        </div>
        {/* Spectral curve panel */}
        <SpectralCurvePanel />
      </div>
    </div>
  );
}
