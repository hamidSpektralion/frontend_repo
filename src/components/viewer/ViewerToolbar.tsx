import { useRef, useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Grid3x3, Download, Layers, Blend, FolderOpen, Loader2 } from 'lucide-react';
import { useViewerStore, API_BASE } from '../../store/viewerStore';
import { ColormapSelector } from './ColormapSelector';
import { uploadToBackend } from '../../utils/uploadFile';
import type { ViewMode } from '../../types/spectral';

const VIEW_MODES: { id: ViewMode; icon: typeof Layers; label: string }[] = [
  { id: 'single',      icon: Layers, label: 'Single Band'  },
  { id: 'false-color', icon: Blend,  label: 'False Color'  },
];

export function ViewerToolbar() {
  const { zoom, showGrid, viewMode, colormap, dataset, setZoom, toggleGrid, resetView, setViewMode, loadDataset, clearDataset } = useViewerStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploading(true);
    clearDataset();
    await uploadToBackend(
      file,
      colormap,
      (ds) => { loadDataset(ds); setUploading(false); },
      () => { setUploading(false); },
    );
  };

  const handleDownloadBand = () => {
    if (!dataset) return;
    if (dataset.sessionId) {
      const a = document.createElement('a');
      a.href = `${API_BASE}/api/band/export/${dataset.sessionId}?colormap=${colormap}`;
      a.download = `${dataset.name}_bands.zip`;
      a.click();
    } else if (dataset.dataUrl) {
      const a = document.createElement('a');
      a.href = dataset.dataUrl;
      a.download = `${dataset.name}.png`;
      a.click();
    }
  };

  return (
    <div className="flex items-center gap-1 px-3 py-2 border-b border-sp-border bg-sp-surface flex-shrink-0">
      <input
        ref={fileInputRef}
        type="file"
        accept=".tif,.tiff,.hdr,.h5,.hdf5,.he5,.npy,.mat,.png,.jpg,.jpeg,.bmp"
        className="hidden"
        onChange={handleFileChange}
      />
      {/* Zoom controls */}
      <button
        onClick={() => setZoom(zoom * 1.25)}
        className="p-1.5 rounded hover:bg-sp-surface-2 text-sp-text-dim hover:text-sp-text transition-colors"
        title="Zoom in"
      >
        <ZoomIn className="w-4 h-4" />
      </button>

      <button
        onClick={() => setZoom(zoom / 1.25)}
        className="p-1.5 rounded hover:bg-sp-surface-2 text-sp-text-dim hover:text-sp-text transition-colors"
        title="Zoom out"
      >
        <ZoomOut className="w-4 h-4" />
      </button>

      <span className="px-2 py-0.5 text-xs font-mono text-sp-text-muted bg-sp-surface-2 rounded tabular-nums">
        {Math.round(zoom * 100)}%
      </span>

      <button
        onClick={resetView}
        className="p-1.5 rounded hover:bg-sp-surface-2 text-sp-text-dim hover:text-sp-text transition-colors"
        title="Fit to window"
      >
        <Maximize2 className="w-4 h-4" />
      </button>

      <div className="w-px h-5 bg-sp-border mx-1" />

      <button
        onClick={toggleGrid}
        className={`p-1.5 rounded transition-colors ${
          showGrid
            ? 'bg-sp-accent/10 text-sp-accent'
            : 'hover:bg-sp-surface-2 text-sp-text-dim hover:text-sp-text'
        }`}
        title="Toggle grid"
      >
        <Grid3x3 className="w-4 h-4" />
      </button>

      <div className="w-px h-5 bg-sp-border mx-1" />

      {/* View mode switcher */}
      <div className="flex items-center border border-sp-border rounded overflow-hidden">
        {VIEW_MODES.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setViewMode(id)}
            title={label}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs transition-colors ${
              viewMode === id
                ? 'bg-sp-accent text-sp-bg font-medium'
                : 'text-sp-text-muted hover:bg-sp-surface-2 hover:text-sp-text-dim'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="w-px h-5 bg-sp-border mx-1" />

      <ColormapSelector />

      <div className="ml-auto flex items-center gap-1">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border border-sp-border text-sp-text-dim hover:bg-sp-surface-2 hover:text-sp-text transition-colors disabled:opacity-50"
          title="Open new file"
        >
          {uploading
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <FolderOpen className="w-3.5 h-3.5" />
          }
          Open File
        </button>

        <button
          onClick={handleDownloadBand}
          disabled={!dataset}
          className="p-1.5 rounded hover:bg-sp-surface-2 text-sp-text-dim hover:text-sp-text transition-colors disabled:opacity-30"
          title={dataset?.sessionId ? 'Download all bands as ZIP' : 'Export PNG'}
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
