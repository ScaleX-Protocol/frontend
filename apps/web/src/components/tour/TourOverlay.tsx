import { useEffect, useState } from 'react';

interface TourOverlayProps {
  targetStep: number | null; // null = no spotlight (welcome step)
}

interface CutoutRect {
  x: number;
  y: number;
  width: number;
  height: number;
  rx: number;
}

export default function TourOverlay({ targetStep }: TourOverlayProps) {
  const [cutout, setCutout] = useState<CutoutRect | null>(null);

  useEffect(() => {
    if (targetStep === null) {
      setCutout(null);
      return;
    }

    const updateCutout = () => {
      const li = document.querySelector(`[data-tour-step="${targetStep}"]`);
      if (!li) {
        setCutout(null);
        return;
      }

      const el = li.querySelector('a') || li;
      const rect = el.getBoundingClientRect();
      const padding = 6;

      setCutout({
        x: rect.left - padding,
        y: rect.top - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
        rx: 10,
      });
    };

    // Delay to sync with sidebar expand animation
    const timer = setTimeout(updateCutout, 250);
    window.addEventListener('resize', updateCutout);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateCutout);
    };
  }, [targetStep]);

  return (
    <svg
      className="fixed inset-0 w-full h-full transition-all duration-300"
      style={{ zIndex: 9998 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <mask id="tour-spotlight-mask">
          {/* White = visible overlay area, Black = transparent cutout */}
          <rect width="100%" height="100%" fill="white" />
          {cutout && (
            <rect
              x={cutout.x}
              y={cutout.y}
              width={cutout.width}
              height={cutout.height}
              rx={cutout.rx}
              fill="black"
            />
          )}
        </mask>
      </defs>

      {/* Dark overlay with mask hole */}
      <rect
        width="100%"
        height="100%"
        fill="rgba(0, 0, 0, 0.70)"
        mask="url(#tour-spotlight-mask)"
      />

      {/* Border around cutout */}
      {cutout && (
        <rect
          x={cutout.x}
          y={cutout.y}
          width={cutout.width}
          height={cutout.height}
          rx={cutout.rx}
          fill="none"
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth="1.5"
        />
      )}
    </svg>
  );
}
