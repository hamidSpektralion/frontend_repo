import { create } from 'zustand';
import type {
  ColormapId, IlluminantId, RGBBandAssignment,
  SpectralDataset, ViewerState, ViewMode,
} from '../types/spectral';

export const API_BASE = 'http://localhost:8000';

interface ViewerStore extends ViewerState {
  setBand: (index: number) => void;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  setColormap: (colormap: ColormapId) => void;
  toggleGrid: () => void;
  resetView: () => void;
  loadDataset: (dataset: SpectralDataset) => void;
  updateDatasetUrl: (dataUrl: string) => void;
  revertDataset: () => void;
  setViewMode: (mode: ViewMode) => void;
  setIlluminant: (id: IlluminantId) => void;
  setRGBBands: (bands: RGBBandAssignment) => void;
  setHoveredSpectrum: (values: number[] | null) => void;
  pinSpectrum: () => void;
  clearPinnedSpectrum: () => void;
  fetchBandFromBackend: (bandIndex?: number) => Promise<void>;
}

const defaultState: ViewerState = {
  activeBandIndex: 0,
  zoom: 1,
  panX: 0,
  panY: 0,
  colormap: 'viridis',
  showGrid: false,
  dataset: null,
  previousDataUrl: null,
  viewMode: 'single',
  illuminant: 'D65',
  rgbBands: { r: 0, g: 0, b: 0 },
  hoveredSpectrum: null,
  pinnedSpectrum: null,
};

export const useViewerStore = create<ViewerStore>((set, get) => ({
  ...defaultState,
  fetchBandFromBackend: async (bandIndex?: number) => {
    const { dataset, activeBandIndex, colormap } = get();
    if (!dataset?.sessionId) return;
    const idx = bandIndex ?? activeBandIndex;
    try {
      const res = await fetch(
        `${API_BASE}/api/band/${dataset.sessionId}/${idx}?colormap=${colormap}`,
      );
      if (!res.ok) return;
      const blob = await res.blob();
      const dataUrl = URL.createObjectURL(blob);
      set((s) => ({ dataset: s.dataset ? { ...s.dataset, dataUrl } : null }));
    } catch {
      // network error — leave existing preview
    }
  },
  setBand: (index) => {
    set({ activeBandIndex: index });
    get().fetchBandFromBackend(index);
  },
  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(20, zoom)) }),
  setPan: (panX, panY) => set({ panX, panY }),
  setColormap: (colormap) => {
    set({ colormap });
    get().fetchBandFromBackend();
  },
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  resetView: () => set({ zoom: 1, panX: 0, panY: 0 }),
  loadDataset: (dataset) => {
    const n = dataset.bands;
    set({
      dataset,
      previousDataUrl: null,
      activeBandIndex: 0,
      rgbBands: {
        r: Math.min(n - 1, Math.round(n * 0.8)),
        g: Math.min(n - 1, Math.round(n * 0.5)),
        b: Math.min(n - 1, Math.round(n * 0.2)),
      },
    });
  },
  updateDatasetUrl: (dataUrl) =>
    set((s) => ({
      previousDataUrl: s.dataset?.dataUrl ?? null,
      dataset: s.dataset ? { ...s.dataset, dataUrl } : null,
    })),
  revertDataset: () =>
    set((s) => {
      if (!s.previousDataUrl || !s.dataset) return s;
      return {
        dataset: { ...s.dataset, dataUrl: s.previousDataUrl },
        previousDataUrl: null,
      };
    }),
  setViewMode: (viewMode) => set({ viewMode }),
  setIlluminant: (illuminant) => set({ illuminant }),
  setRGBBands: (rgbBands) => set({ rgbBands }),
  setHoveredSpectrum: (hoveredSpectrum) => set({ hoveredSpectrum }),
  pinSpectrum: () => set((s) => ({ pinnedSpectrum: s.hoveredSpectrum ?? s.pinnedSpectrum })),
  clearPinnedSpectrum: () => set({ pinnedSpectrum: null }),
}));
