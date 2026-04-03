import type { ColormapId } from '../../types/spectral';
import { useViewerStore } from '../../store/viewerStore';

const colormaps: { id: ColormapId; label: string; gradient: string }[] = [
  { id: 'viridis', label: 'Viridis', gradient: 'linear-gradient(to right, #440154, #31688e, #35b779, #fde725)' },
  { id: 'plasma', label: 'Plasma', gradient: 'linear-gradient(to right, #0d0887, #cc4778, #f89540, #f0f921)' },
  { id: 'inferno', label: 'Inferno', gradient: 'linear-gradient(to right, #000004, #7c1d6f, #f1605d, #fcffa4)' },
  { id: 'grayscale', label: 'Grayscale', gradient: 'linear-gradient(to right, #000, #fff)' },
  { id: 'jet', label: 'Jet (legacy)', gradient: 'linear-gradient(to right, #00007f, #0000ff, #00ffff, #ffff00, #ff0000, #7f0000)' },
];

export function ColormapSelector() {
  const { colormap, setColormap } = useViewerStore();

  return (
    <div className="relative">
      <select
        value={colormap}
        onChange={(e) => setColormap(e.target.value as ColormapId)}
        className="bg-sp-surface-2 border border-sp-border text-sp-text-dim text-xs rounded px-2 py-1 cursor-pointer hover:border-sp-border-2 outline-none"
      >
        {colormaps.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>
    </div>
  );
}
