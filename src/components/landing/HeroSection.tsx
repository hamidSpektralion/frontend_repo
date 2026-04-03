import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-sp-accent/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-[300px] h-[200px] rounded-full bg-purple-500/5 blur-3xl" />
        <div className="absolute top-1/2 right-1/4 w-[300px] h-[200px] rounded-full bg-emerald-500/5 blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-3xl">
        {/* Spectral bar */}
        <div className="spectral-gradient h-0.5 w-48 mx-auto mb-8 rounded-full opacity-80" />

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-sp-border bg-sp-surface text-xs text-sp-text-muted mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-sp-success animate-pulse" />
          Hyperspectral Analysis Platform
        </div>

        <h1 className="text-6xl font-bold tracking-tight text-sp-text mb-2">
          Spektral<span className="text-sp-accent">ion</span>
        </h1>
        <p className="text-xl text-sp-text-muted mt-4 leading-relaxed">
          End-to-end hyperspectral imaging viewer and pre-processing pipeline.
          Dark calibration, denoising, super resolution, and beyond.
        </p>

        <div className="flex items-center justify-center gap-4 mt-10">
          <Link
            to="/viewer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-sp-accent text-sp-bg rounded-lg font-semibold text-sm hover:bg-sp-accent-dim transition-colors"
          >
            Launch Viewer
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#features"
            className="inline-flex items-center gap-2 px-6 py-3 border border-sp-border text-sp-text-dim rounded-lg text-sm hover:border-sp-border-2 hover:text-sp-text transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            Learn More
          </a>
        </div>
      </div>

      {/* Mock spectral waterfall placeholder */}
      <div className="relative z-10 mt-16 w-full max-w-2xl">
        <div className="rounded-xl border border-sp-border bg-sp-surface overflow-hidden shadow-2xl">
          <div className="flex items-center gap-1.5 px-4 py-3 border-b border-sp-border">
            <div className="w-2.5 h-2.5 rounded-full bg-sp-error/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-sp-warn/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-sp-success/60" />
            <span className="ml-3 text-xs text-sp-text-muted font-mono">viewer — sample_cube.hdr</span>
          </div>
          <div className="h-52 bg-gradient-to-br from-sp-bg via-sp-surface-2 to-sp-bg flex items-center justify-center relative overflow-hidden">
            {/* Simulated spectral bands */}
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="absolute inset-y-0 opacity-20"
                style={{
                  left: `${(i / 12) * 100}%`,
                  width: `${100 / 12}%`,
                  background: `hsl(${260 - i * 20}, 80%, 60%)`,
                }}
              />
            ))}
            <div className="relative text-center">
              <p className="text-xs text-sp-text-muted">hyperspectral preview</p>
              <p className="text-xs text-sp-text-muted/60 mt-1 font-mono">128 bands · 400–1000 nm</p>
            </div>
          </div>
          {/* Spectral ruler */}
          <div className="spectral-gradient h-1" />
          <div className="px-4 py-2 flex justify-between text-xs text-sp-text-muted font-mono">
            <span>400 nm</span>
            <span>700 nm</span>
            <span>1000 nm</span>
          </div>
        </div>
      </div>
    </section>
  );
}
