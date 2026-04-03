import { Navbar } from '../components/layout/Navbar';
import { HeroSection } from '../components/landing/HeroSection';
import { FeatureGrid } from '../components/landing/FeatureGrid';
import { CallToAction } from '../components/landing/CallToAction';

export function HomePage() {
  return (
    <div className="min-h-screen bg-sp-bg">
      <Navbar transparent />
      <main className="pt-14">
        <HeroSection />
        <FeatureGrid />
        <CallToAction />
      </main>
      <footer className="px-6 py-6 border-t border-sp-border text-center">
        <p className="text-xs text-sp-text-muted">
          Spektralion · v0.1.0-skeleton
        </p>
      </footer>
    </div>
  );
}
