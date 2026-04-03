import { useRef, useState } from 'react';
import { Upload, FlaskConical, Loader2 } from 'lucide-react';
import { useViewerStore } from '../../store/viewerStore';
import type { SpectralDataset } from '../../types/spectral';
import { parseMatFile, matVarsToSpectralCube } from '../../utils/matParser';

// ─── Spectrum helpers ─────────────────────────────────────────────────────────

/** Spectral curve from a real RGBA pixel via Gaussian interpolation through R/G/B. */
function pixelToSpectrum(
  r: number, g: number, b: number, // 0–1 normalised
  wavelengths: number[],
): number[] {
  return wavelengths.map((wl) => {
    const wB = Math.exp(-((wl - 450) ** 2) / (2 * 28 ** 2));
    const wG = Math.exp(-((wl - 550) ** 2) / (2 * 28 ** 2));
    const wR = Math.exp(-((wl - 640) ** 2) / (2 * 28 ** 2));
    const t  = wB + wG + wR;
    return (b * wB + g * wG + r * wR) / Math.max(0.001, t);
  });
}

/** Synthetic spectrum when no real data is available (demo dataset). */
function syntheticSpectrum(px: number, py: number, wavelengths: number[]): number[] {
  const minWl = wavelengths[0];
  const maxWl = wavelengths[wavelengths.length - 1];
  return wavelengths.map((wl) => {
    const t  = (wl - minWl) / (maxWl - minWl);
    const p1 = (0.45 + px * 0.4)        * Math.exp(-((t - (0.15 + py * 0.25)) ** 2) / 0.008);
    const p2 = (0.25 + py * 0.3)        * Math.exp(-((t - (0.48 + px * 0.12)) ** 2) / 0.014);
    const p3 = (0.50 + (1 - py) * 0.45) * Math.exp(-((t - (0.72 + (1 - py) * 0.14)) ** 2) / 0.02);
    return Math.min(1, Math.max(0, 0.04 + 0.08 * px + p1 + p2 + p3));
  });
}

// ─── Demo dataset ─────────────────────────────────────────────────────────────

function createDemoDataset(): SpectralDataset {
  const wavelengths: number[] = [];
  for (let wl = 400; wl <= 1000; wl += 10) wavelengths.push(wl);
  return {
    id: 'demo',
    name: 'Demo · Synthetic',
    bands: wavelengths.length,
    wavelengths,
    width: 512,
    height: 512,
  };
}

// ─── File loaders ─────────────────────────────────────────────────────────────

function loadImageFile(file: File, onLoaded: (ds: SpectralDataset) => void) {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    const MAX = 1024;
    let w = img.naturalWidth, h = img.naturalHeight;
    if (w > MAX || h > MAX) {
      const s = MAX / Math.max(w, h);
      w = Math.round(w * s);
      h = Math.round(h * s);
    }
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, w, h);
    const { data } = ctx.getImageData(0, 0, w, h);

    const wavelengths: number[] = [];
    for (let wl = 400; wl <= 700; wl += 10) wavelengths.push(wl);

    onLoaded({
      id: file.name,
      name: file.name.replace(/\.[^.]+$/, ''),
      bands: wavelengths.length,
      wavelengths,
      width: w,
      height: h,
      dataUrl: canvas.toDataURL(),
      pixelData: data,
    });
    URL.revokeObjectURL(url);
  };
  img.onerror = () => URL.revokeObjectURL(url);
  img.src = url;
}

async function loadMatFile(
  file: File,
  onLoaded: (ds: SpectralDataset) => void,
  onError: (msg: string) => void,
) {
  try {
    const buffer = await file.arrayBuffer();
    const vars   = await parseMatFile(buffer);

    if (vars.length === 0) {
      onError('No numeric arrays found in this .mat file.');
      return;
    }

    const cube = matVarsToSpectralCube(vars);
    if (!cube) {
      onError('Could not find a 2-D or 3-D numeric array in this .mat file.');
      return;
    }

    onLoaded({
      id:          file.name,
      name:        file.name.replace(/\.mat$/i, ''),
      bands:       cube.bands,
      wavelengths: cube.wavelengths,
      width:       cube.width,
      height:      cube.height,
      dataUrl:     cube.displayUrl,
      spectraCube: cube.data,
    });
  } catch (err) {
    onError(err instanceof Error ? err.message : 'Failed to parse .mat file');
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ImageCanvas() {
  const { dataset, zoom, showGrid, colormap, loadDataset, setHoveredSpectrum } = useViewerStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef     = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading]   = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ── File picker handler ─────────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setLoadError(null);
    setLoading(true);

    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (ext === 'mat') {
      await loadMatFile(
        file,
        (ds) => { loadDataset(ds); setLoading(false); },
        (msg) => { setLoadError(msg); setLoading(false); },
      );
    } else {
      loadImageFile(file, (ds) => { loadDataset(ds); setLoading(false); });
    }
  };

  // ── Hover: pixel position → spectral curve ──────────────────────────────────
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dataset) return;

    let px: number, py: number;
    if ((dataset.pixelData || dataset.spectraCube) && imageRef.current) {
      const r = imageRef.current.getBoundingClientRect();
      px = (e.clientX - r.left) / r.width;
      py = (e.clientY - r.top)  / r.height;
    } else {
      const r = containerRef.current?.getBoundingClientRect();
      if (!r) return;
      px = (e.clientX - r.left) / r.width;
      py = (e.clientY - r.top)  / r.height;
    }
    px = Math.max(0, Math.min(1, px));
    py = Math.max(0, Math.min(1, py));

    let spectrum: number[];

    if (dataset.spectraCube) {
      // Real .mat hyperspectral data
      const x   = Math.floor(px * (dataset.width  - 1));
      const y   = Math.floor(py * (dataset.height - 1));
      const B   = dataset.bands;
      const off = (y * dataset.width + x) * B;
      // Normalize on the fly: find min/max across this pixel's spectrum
      const raw = Array.from({ length: B }, (_, b) => dataset.spectraCube![off + b]);
      const mn  = Math.min(...raw);
      const mx  = Math.max(...raw);
      const rng = mx > mn ? mx - mn : 1;
      spectrum  = raw.map((v) => (v - mn) / rng);
    } else if (dataset.pixelData) {
      // PNG/JPG — read actual RGBA pixel
      const x   = Math.floor(px * (dataset.width  - 1));
      const y   = Math.floor(py * (dataset.height - 1));
      const idx = (y * dataset.width + x) * 4;
      spectrum  = pixelToSpectrum(
        dataset.pixelData[idx]     / 255,
        dataset.pixelData[idx + 1] / 255,
        dataset.pixelData[idx + 2] / 255,
        dataset.wavelengths,
      );
    } else {
      spectrum = syntheticSpectrum(px, py, dataset.wavelengths);
    }

    setHoveredSpectrum(spectrum);
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.mat,.hdr,.tif,.tiff,.nc,.envi"
        className="hidden"
        onChange={handleFileChange}
      />

      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden bg-sp-bg flex items-center justify-center"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredSpectrum(null)}
      >
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 z-10 bg-sp-bg/80 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-sp-accent animate-spin" />
            <p className="text-sm text-sp-text-dim">Parsing file…</p>
          </div>
        )}

        {!dataset && !loading ? (
          /* ── Empty state ─────────────────────────────────────────────────── */
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-20 h-20 rounded-full bg-sp-surface border-2 border-dashed border-sp-border flex items-center justify-center">
              <Upload className="w-8 h-8 text-sp-text-muted" />
            </div>
            <div>
              <p className="text-sp-text-dim font-medium">No dataset loaded</p>
              <p className="text-xs text-sp-text-muted mt-1">
                Supports PNG, JPG, and MATLAB <span className="font-mono text-sp-text-dim">.mat</span> (v5)
              </p>
            </div>

            {loadError && (
              <p className="text-xs text-sp-error bg-sp-error/10 border border-sp-error/20 rounded px-3 py-2 max-w-xs">
                {loadError}
              </p>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 text-sm bg-sp-accent text-sp-bg rounded-lg font-medium hover:bg-sp-accent-dim transition-colors"
              >
                Open File
              </button>
              <button
                onClick={() => loadDataset(createDemoDataset())}
                className="flex items-center gap-1.5 px-4 py-2 text-sm border border-sp-border text-sp-text-dim rounded-lg font-medium hover:bg-sp-surface-2 hover:text-sp-text transition-colors"
              >
                <FlaskConical className="w-4 h-4" />
                Load Demo
              </button>
            </div>
          </div>
        ) : !loading && dataset ? (
          /* ── Dataset display ─────────────────────────────────────────────── */
          <div
            className="relative"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              transition: 'transform 0.1s ease',
            }}
          >
            {dataset.dataUrl ? (
              <img
                ref={imageRef}
                src={dataset.dataUrl}
                alt="Band visualization"
                className="block max-w-none"
                draggable={false}
              />
            ) : (
              <div
                className="rounded flex items-end p-3"
                style={{
                  width: dataset.width || 512,
                  height: dataset.height || 512,
                  background: [
                    'radial-gradient(ellipse at 20% 30%, rgba(99,102,241,0.35) 0%, transparent 50%)',
                    'radial-gradient(ellipse at 75% 20%, rgba(16,185,129,0.30) 0%, transparent 45%)',
                    'radial-gradient(ellipse at 55% 70%, rgba(239,68,68,0.30) 0%, transparent 50%)',
                    'radial-gradient(ellipse at 85% 80%, rgba(245,158,11,0.25) 0%, transparent 40%)',
                    '#0d1424',
                  ].join(','),
                }}
              >
                <div className="bg-sp-bg/70 rounded px-2 py-1">
                  <span className="text-[10px] text-sp-text-muted font-mono">
                    {dataset.name} · {dataset.bands} bands · {colormap}
                  </span>
                </div>
              </div>
            )}

            {showGrid && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, rgba(56,189,248,0.08) 1px, transparent 1px),' +
                    'linear-gradient(to bottom, rgba(56,189,248,0.08) 1px, transparent 1px)',
                  backgroundSize: '32px 32px',
                }}
              />
            )}
          </div>
        ) : null}
      </div>
    </>
  );
}
