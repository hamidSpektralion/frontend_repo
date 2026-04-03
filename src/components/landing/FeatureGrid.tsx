import { Eye, Cpu, Layers, Thermometer, Sparkles, FileOutput } from 'lucide-react';

const features = [
  {
    icon: Eye,
    title: 'Hyperspectral Viewer',
    description: 'Visualize hundreds of spectral bands with interactive band selection, colormaps, and zoom.',
    color: 'text-sp-accent',
    bg: 'bg-sp-accent/10',
  },
  {
    icon: Cpu,
    title: 'Processing Pipeline',
    description: 'Chain pre-processing modules in order. Configure, reorder, and run with a single click.',
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
  },
  {
    icon: Thermometer,
    title: 'Dark Calibration',
    description: 'Subtract dark current noise using loaded dark frames or auto-detected reference data.',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
  },
  {
    icon: Layers,
    title: 'Denoising',
    description: 'Apply Gaussian, Bilateral, BM3D or Wavelet denoising across spatial and spectral dimensions.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
  },
  {
    icon: Sparkles,
    title: 'Super Resolution',
    description: 'Upscale spectral cubes 2×, 4×, or 8× using deep learning models like EDSR and ESPCN.',
    color: 'text-sp-warn',
    bg: 'bg-sp-warn/10',
  },
  {
    icon: FileOutput,
    title: 'Export & Reporting',
    description: 'Export processed bands as PNG, TIFF, or HDF5. Generate spectral analysis reports.',
    color: 'text-rose-400',
    bg: 'bg-rose-400/10',
  },
];

export function FeatureGrid() {
  return (
    <section id="features" className="px-6 py-24 max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-sp-text">Everything you need</h2>
        <p className="text-sp-text-muted mt-3 text-base">
          A complete toolkit for hyperspectral data acquisition, preprocessing, and analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map(({ icon: Icon, title, description, color, bg }) => (
          <div
            key={title}
            className="p-5 rounded-xl border border-sp-border bg-sp-surface hover:border-sp-border-2 transition-colors group"
          >
            <div className={`inline-flex p-2.5 rounded-lg ${bg} mb-4`}>
              <Icon className={`w-5 h-5 ${color}`} strokeWidth={1.5} />
            </div>
            <h3 className="font-semibold text-sp-text text-sm mb-1.5">{title}</h3>
            <p className="text-xs text-sp-text-muted leading-relaxed">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
