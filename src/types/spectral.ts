export type ColormapId = 'viridis' | 'plasma' | 'grayscale' | 'inferno' | 'jet';
export type IlluminantId = 'D65' | 'D50' | 'A' | 'F2' | 'E';
export type ViewMode = 'single' | 'false-color';

export interface RGBBandAssignment {
  r: number; // band index
  g: number;
  b: number;
}

export interface SpectralDataset {
  id: string;
  name: string;
  bands: number;
  wavelengths: number[]; // in nm, e.g. [400, 405, ..., 1000]
  width: number;
  height: number;
  dataUrl?: string;
  pixelData?: Uint8ClampedArray; // RGBA from ImageData, for PNG/JPG pixel probing
  spectraCube?: Float32Array;    // [height * width * bands] row-major, for .mat probing
}

export interface ViewerState {
  activeBandIndex: number;
  zoom: number;
  panX: number;
  panY: number;
  colormap: ColormapId;
  showGrid: boolean;
  dataset: SpectralDataset | null;
  previousDataUrl: string | null;
  viewMode: ViewMode;
  illuminant: IlluminantId;
  rgbBands: RGBBandAssignment;
  hoveredSpectrum: number[] | null;
  pinnedSpectrum: number[] | null;
}
