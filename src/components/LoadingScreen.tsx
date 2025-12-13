import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export default function LoadingScreen() {
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<SVGSVGElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timeline = gsap.timeline();

    // Animate bars sliding in from left
    barsRef.current.forEach((bar, index) => {
      if (bar) {
        timeline.from(
          bar,
          {
            x: -100,
            opacity: 0,
            duration: 0.6,
            ease: 'power2.out',
          },
          index * 0.15
        );
      }
    });

    // Animate logo fade in
    timeline.from(
      logoRef.current,
      {
        opacity: 0,
        scale: 0.8,
        duration: 0.8,
        ease: 'back.out',
      },
      0.3
    );

    // Animate text
    timeline.from(
      textRef.current,
      {
        opacity: 0,
        y: 20,
        duration: 0.6,
        ease: 'power2.out',
      },
      0.5
    );

    // Hold the screen for 2 seconds then fade out
    timeline.to(
      containerRef.current,
      {
        opacity: 0,
        duration: 0.8,
        ease: 'power2.inOut',
        delay: 2,
        onComplete: () => {
          setIsVisible(false);
        },
      }
    );

    return () => {
      timeline.kill();
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black z-50 flex items-center justify-center overflow-hidden"
    >
      {/* Left Bar */}
      <div
        ref={(el) => {
          barsRef.current[0] = el;
        }}
        className="absolute left-0 top-0 bottom-0 w-1/3 bg-linear-to-r from-[#E07B39] to-[#D46E2A]"
      />

      {/* Center Bar */}
      <div
        ref={(el) => {
          barsRef.current[1] = el;
        }}
        className="absolute left-1/3 top-0 bottom-0 w-1/3 bg-linear-to-r from-[#D46E2A] to-[#C46320]"
      />

      {/* Right Bar */}
      <div
        ref={(el) => {
          barsRef.current[2] = el;
        }}
        className="absolute left-2/3 top-0 bottom-0 w-1/3 bg-linear-to-r from-[#C46320] to-[#B85618]"
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-6">
        {/* Logo */}
        <img
          src="/images/logo/ScaleX.webp"
          alt="ScaleX Protocol Logo"
          width={80}
          height={80}
          className="drop-shadow-xl"
        />

        {/* Text */}
        <div ref={textRef} className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">ScaleX</h1>
          <p className="text-white/70 text-sm tracking-wide">Trade Without Limits. Protect Against Chaos.</p>
        </div>
      </div>

      {/* Loading indicator dots */}
      <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 flex gap-2">
        {[0, 1, 2].map((dot) => (
          <div
            key={dot}
            className="w-2 h-2 rounded-full bg-white"
            style={{
              animation: `pulse 1.5s ease-in-out infinite`,
              animationDelay: `${dot * 0.2}s`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
