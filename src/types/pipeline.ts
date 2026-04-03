export type ProcessingModuleId =
  | 'denoising'
  | 'super-resolution'
  | 'white-balance'
  | 'dark-calibration'
  | 'normalization';

export type PipelineStatus = 'idle' | 'running' | 'complete' | 'error';

export interface ProcessingModule {
  id: ProcessingModuleId;
  label: string;
  enabled: boolean;
  order: number;
  config: Record<string, unknown>;
}

export interface DenoisingConfig {
  algorithm: 'gaussian' | 'bilateral' | 'bm3d' | 'wavelet';
  strength: number;
  spatialSigma: number;
  spectralSigma: number;
}

export interface SuperResolutionConfig {
  scaleFactor: 2 | 4 | 8;
  model: 'bicubic' | 'edsr' | 'espcn';
  sharpness: number;
}

export interface WhiteBalanceConfig {
  mode: 'auto' | 'manual' | 'reference';
  gainR: number;
  gainG: number;
  gainB: number;
}

export interface DarkCalibrationConfig {
  source: 'none' | 'file' | 'auto';
  integrationTime: number;
  temperatureCompensation: boolean;
  darkFrameUrl?: string;
}

export interface NormalizationConfig {
  method: 'minmax' | 'zscore' | 'percentile';
  clipLow: number;
  clipHigh: number;
  perBand: boolean;
}
