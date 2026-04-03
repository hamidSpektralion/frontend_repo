import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export function CallToAction() {
  return (
    <section className="px-6 py-20 border-t border-sp-border">
      <div className="max-w-2xl mx-auto text-center">
        <div className="spectral-gradient h-0.5 w-32 mx-auto mb-8 rounded-full opacity-60" />
        <h2 className="text-3xl font-bold text-sp-text mb-4">Ready to analyze your data?</h2>
        <p className="text-sp-text-muted mb-8">
          Open the viewer, load your hyperspectral cube, and start processing.
        </p>
        <Link
          to="/viewer"
          className="inline-flex items-center gap-2 px-8 py-4 bg-sp-accent text-sp-bg rounded-xl font-semibold hover:bg-sp-accent-dim transition-colors"
        >
          Open Viewer
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </section>
  );
}
