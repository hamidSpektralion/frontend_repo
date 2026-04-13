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

// ─── Canvas-based preview processing ─────────────────────────────────────────

function applyModuleFilter(dataUrl: string, mod: ProcessingModule): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale =
        mod.id === 'super-resolution' ? ((mod.config.scaleFactor as number) ?? 2) : 1;
      const canvas = document.createElement('canvas');
      canvas.width  = img.width  * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d')!;

      switch (mod.id) {
        case 'demosaicking':
          // Demosaicking is handled via backend API — skip canvas preview
          break;
        case 'dark-calibration':
          ctx.filter = 'brightness(1.08) contrast(1.1)';
          break;
        case 'white-balance':
          ctx.filter = 'saturate(1.2) hue-rotate(5deg)';
          break;
        case 'denoising': {
          const strength = (mod.config.strength as number ?? 50) / 100;
          ctx.filter = `blur(${(strength * 1.2).toFixed(2)}px)`;
          break;
        }
        case 'normalization':
          ctx.filter = 'contrast(1.25) brightness(1.03)';
          break;
        case 'super-resolution':
          ctx.filter = 'contrast(1.05)';
          break;
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/png'));
    };
    img.src = dataUrl;
  });
}

async function applyPipelineProcessing(
  dataUrl: string,
  modules: ProcessingModule[],
): Promise<string> {
  const enabled = [...modules]
    .filter((m) => m.enabled)
    .sort((a, b) => a.order - b.order);
  let current = dataUrl;
  for (const mod of enabled) {
    current = await applyModuleFilter(current, mod);
  }
  return current;
}

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
    const enabledCount = modules.filter((m) => m.enabled).length;
    if (enabledCount === 0) return;
    set({ status: 'running', progress: 0, errorMessage: null });

    const viewerState = useViewerStore.getState();
    const { dataset } = viewerState;

    // ── Step 1: run backend demosaicking if enabled and we have a session ────
    const demosaickingMod = modules.find((m) => m.id === 'demosaicking' && m.enabled);
    if (demosaickingMod && dataset?.sessionId) {
      try {
        const res = await fetch(`${API_BASE}/api/demosaicking`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: dataset.sessionId,
            pattern: demosaickingMod.config.pattern ?? '4x4',
            method: demosaickingMod.config.method ?? 'bilinear',
          }),
        });
        if (res.ok) {
          const meta = await res.json() as {
            bands: number; wavelengths: number[]; width: number; height: number;
          };
          // Update dataset metadata in viewer store
          useViewerStore.setState((s) => ({
            dataset: s.dataset ? {
              ...s.dataset,
              bands: meta.bands,
              wavelengths: meta.wavelengths,
              width: meta.width,
              height: meta.height,
            } : null,
            activeBandIndex: 0,
          }));
          // Fetch new band 0 preview
          await useViewerStore.getState().fetchBandFromBackend(0);
        } else {
          const err = await res.json().catch(() => ({ detail: 'Demosaicking failed' }));
          set({ status: 'error', errorMessage: err.detail ?? 'Demosaicking failed' });
          return;
        }
      } catch {
        set({ status: 'error', errorMessage: 'Cannot reach backend for demosaicking.' });
        return;
      }
    }

    set({ progress: 30 });

    // ── Step 2: canvas-based preview for remaining modules ───────────────────
    const { dataset: updatedDataset, updateDatasetUrl } = useViewerStore.getState();
    if (updatedDataset?.dataUrl) {
      try {
        const newUrl = await applyPipelineProcessing(updatedDataset.dataUrl, modules);
        updateDatasetUrl(newUrl);
      } catch {
        // non-fatal — preview stays as-is
      }
    }

    set({ progress: 100, status: 'complete' });
  },

  cancelPipeline: () => set({ status: 'idle', progress: 0 }),
}));
