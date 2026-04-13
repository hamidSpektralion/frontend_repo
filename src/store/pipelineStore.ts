import { create } from 'zustand';
import type { ProcessingModule, PipelineStatus } from '../types/pipeline';
import { useViewerStore, API_BASE } from './viewerStore';

const defaultModules: ProcessingModule[] = [
  {
    id: 'demosaicking',
    label: 'Demosaicking',
    enabled: false,
    order: 0,
    config: { pattern: '4x4', method: 'bilinear' },
  },
  {
    id: 'dark-calibration',
    label: 'Dark Calibration',
    enabled: false,
    order: 1,
    config: { source: 'none', integrationTime: 100, temperatureCompensation: false },
  },
  {
    id: 'white-balance',
    label: 'White Balance',
    enabled: false,
    order: 2,
    config: { mode: 'auto', gainR: 1.0, gainG: 1.0, gainB: 1.0 },
  },
  {
    id: 'denoising',
    label: 'Denoising',
    enabled: false,
    order: 3,
    config: { algorithm: 'bilateral', strength: 50, spatialSigma: 2, spectralSigma: 10 },
  },
  {
    id: 'normalization',
    label: 'Normalization',
    enabled: false,
    order: 4,
    config: { method: 'minmax', clipLow: 0, clipHigh: 0, perBand: false },
  },
  {
    id: 'super-resolution',
    label: 'Super Resolution',
    enabled: false,
    order: 5,
    config: { scaleFactor: 2, model: 'edsr', sharpness: 50 },
  },
];

// ─── Backend API call for each module ────────────────────────────────────────

function buildRequestBody(sessionId: string, mod: ProcessingModule): object {
  const c = mod.config;
  switch (mod.id) {
    case 'demosaicking':
      return { session_id: sessionId, pattern: c.pattern ?? '4x4', method: c.method ?? 'bilinear' };
    case 'dark-calibration':
      return { session_id: sessionId, integration_time: c.integrationTime ?? 100, temperature_compensation: c.temperatureCompensation ?? false };
    case 'white-balance':
      return { session_id: sessionId, mode: c.mode ?? 'auto', gain_r: c.gainR ?? 1.0, gain_g: c.gainG ?? 1.0, gain_b: c.gainB ?? 1.0 };
    case 'denoising':
      return { session_id: sessionId, algorithm: c.algorithm ?? 'bilateral', strength: c.strength ?? 50, spatial_sigma: c.spatialSigma ?? 2, spectral_sigma: c.spectralSigma ?? 10 };
    case 'normalization':
      return { session_id: sessionId, method: c.method ?? 'minmax', clip_low: c.clipLow ?? 0, clip_high: c.clipHigh ?? 0, per_band: c.perBand ?? false };
    case 'super-resolution':
      return { session_id: sessionId, scale_factor: c.scaleFactor ?? 2, model: c.model ?? 'bicubic', sharpness: c.sharpness ?? 50 };
    default:
      return { session_id: sessionId };
  }
}

const MODULE_ENDPOINT: Record<string, string> = {
  'demosaicking':     '/api/demosaicking',
  'dark-calibration': '/api/dark-calibration',
  'white-balance':    '/api/white-balance',
  'denoising':        '/api/denoising',
  'normalization':    '/api/normalization',
  'super-resolution': '/api/super-resolution',
};

// ─── Store ────────────────────────────────────────────────────────────────────

interface PipelineStore {
  modules: ProcessingModule[];
  status: PipelineStatus;
  progress: number;
  errorMessage: string | null;
  toggleModule: (id: string) => void;
  updateModuleConfig: (id: string, config: Record<string, unknown>) => void;
  reorderModules: (fromIndex: number, toIndex: number) => void;
  runPipeline: () => Promise<void>;
  cancelPipeline: () => void;
}

export const usePipelineStore = create<PipelineStore>((set, get) => ({
  modules: defaultModules,
  status: 'idle',
  progress: 0,
  errorMessage: null,

  toggleModule: (id) =>
    set((s) => ({
      modules: s.modules.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m)),
    })),

  updateModuleConfig: (id, config) =>
    set((s) => ({
      modules: s.modules.map((m) =>
        m.id === id ? { ...m, config: { ...m.config, ...config } } : m,
      ),
    })),

  reorderModules: (fromIndex, toIndex) =>
    set((s) => {
      const mods = [...s.modules];
      const [moved] = mods.splice(fromIndex, 1);
      mods.splice(toIndex, 0, moved);
      return { modules: mods.map((m, i) => ({ ...m, order: i })) };
    }),

  runPipeline: async () => {
    const modules = get().modules;
    const enabled = [...modules].filter((m) => m.enabled).sort((a, b) => a.order - b.order);
    if (enabled.length === 0) return;

    const { dataset } = useViewerStore.getState();
    if (!dataset?.sessionId) {
      set({ status: 'error', errorMessage: 'Load a file first before running the pipeline.' });
      return;
    }

    set({ status: 'running', progress: 0, errorMessage: null });
    const step = 100 / enabled.length;

    for (let i = 0; i < enabled.length; i++) {
      const mod = enabled[i];
      const endpoint = MODULE_ENDPOINT[mod.id];
      if (!endpoint) continue;

      try {
        const res = await fetch(`${API_BASE}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildRequestBody(dataset.sessionId, mod)),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: `${mod.label} failed` }));
          set({ status: 'error', errorMessage: err.detail ?? `${mod.label} failed` });
          return;
        }

        const meta = await res.json() as {
          bands: number; wavelengths: number[]; width: number; height: number;
        };

        // Update dataset metadata (bands/dimensions may change after demosaicking or SR)
        useViewerStore.setState((s) => ({
          dataset: s.dataset ? {
            ...s.dataset,
            bands: meta.bands,
            wavelengths: meta.wavelengths,
            width: meta.width,
            height: meta.height,
          } : null,
          activeBandIndex: Math.min(useViewerStore.getState().activeBandIndex, meta.bands - 1),
        }));

      } catch {
        set({ status: 'error', errorMessage: `Cannot reach backend for ${mod.label}.` });
        return;
      }

      set({ progress: Math.round(step * (i + 1)) });
    }

    // Re-fetch the current band preview after all modules ran
    await useViewerStore.getState().fetchBandFromBackend();
    set({ status: 'complete', progress: 100 });
  },

  cancelPipeline: () => set({ status: 'idle', progress: 0 }),
}));
