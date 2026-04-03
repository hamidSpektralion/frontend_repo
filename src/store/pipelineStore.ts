import { create } from 'zustand';
import type { ProcessingModule, PipelineStatus } from '../types/pipeline';
import { useViewerStore } from './viewerStore';

const defaultModules: ProcessingModule[] = [
  {
    id: 'dark-calibration',
    label: 'Dark Calibration',
    enabled: false,
    order: 0,
    config: { source: 'none', integrationTime: 100, temperatureCompensation: false },
  },
  {
    id: 'white-balance',
    label: 'White Balance',
    enabled: false,
    order: 1,
    config: { mode: 'auto', gainR: 1.0, gainG: 1.0, gainB: 1.0 },
  },
  {
    id: 'denoising',
    label: 'Denoising',
    enabled: false,
    order: 2,
    config: { algorithm: 'bilateral', strength: 50, spatialSigma: 2, spectralSigma: 10 },
  },
  {
    id: 'normalization',
    label: 'Normalization',
    enabled: false,
    order: 3,
    config: { method: 'minmax', clipLow: 0, clipHigh: 0, perBand: false },
  },
  {
    id: 'super-resolution',
    label: 'Super Resolution',
    enabled: false,
    order: 4,
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
  runPipeline: () => void;
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

  runPipeline: () => {
    const enabledCount = get().modules.filter((m) => m.enabled).length;
    if (enabledCount === 0) return;
    set({ status: 'running', progress: 0, errorMessage: null });

    let p = 0;
    const interval = setInterval(() => {
      p += 100 / (enabledCount * 10);
      if (p >= 100) {
        clearInterval(interval);
        set({ progress: 100 });

        // Apply canvas-based processing to the preview, then mark complete
        const { dataset, updateDatasetUrl } = useViewerStore.getState();
        if (dataset?.dataUrl) {
          applyPipelineProcessing(dataset.dataUrl, get().modules)
            .then((newUrl) => {
              updateDatasetUrl(newUrl);
              set({ status: 'complete' });
            })
            .catch(() => set({ status: 'complete' }));
        } else {
          set({ status: 'complete' });
        }
      } else {
        set({ progress: Math.min(p, 99) });
      }
    }, 150);
  },

  cancelPipeline: () => set({ status: 'idle', progress: 0 }),
}));
