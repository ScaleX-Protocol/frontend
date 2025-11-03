"use client";

import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import HeroSection from "./Hero";
import TrustSection from "./Trust";
import FeatureSection from "./Feature";
import HowToWorkSection from "./HowToWork";
import CallToActionSection from "./CallToAction";
import Navbar from "./Navbar";

export default function LandingPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Animated background elements */}

      <Navbar className="top-2" />

      <HeroSection />

      {/* <TrustSection /> */}

      <FeatureSection />

      <HowToWorkSection />

      <CallToActionSection />

      {/* Footer */}
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
