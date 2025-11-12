'use client';

import CallToActionSection from './CallToAction';
import FeatureSection from './Feature';
import HeroSection from './Hero';
import HowToWorkSection from './HowToWork';
import Navbar from './Navbar';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      <Navbar className="top-2" />

      <HeroSection />

      <FeatureSection />

      <HowToWorkSection />

      <CallToActionSection />

      <footer className="relative z-10 px-6 py-8 md:px-12 lg:px-24 border-t border-white/10">
        <div className="max-w-6xl mx-auto text-center text-slate-400">
          <p>© 2025 Capital Flywheel. All rights reserved.</p>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
