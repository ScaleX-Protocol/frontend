import { useEffect, useRef, useState } from "react";

// CountUp component - duration based on number magnitude
interface CountUpProps {
  end: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  separator?: string;
  className?: string;
}

export default function CountUp({
  end,
  decimals = 2,
  prefix = '',
  suffix = '',
  separator = ',',
  className = '',
}: CountUpProps) {
  const [count, setCount] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  // Duration based on number magnitude: bigger numbers = longer animation
  // Base: 800ms, adds ~100ms per digit, max 2000ms
  const calculateDuration = (value: number) => {
    const digits = Math.max(1, Math.floor(Math.log10(Math.abs(value) + 1)) + 1);
    return Math.min(800 + digits * 100, 2000);
  };

  const duration = calculateDuration(end);

  // Easing function for smooth deceleration
  const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

  useEffect(() => {
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOut(progress);
      const currentValue = end * easedProgress;

      setCount(currentValue);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [end, duration]);

  const formatNumber = (num: number) => {
    const parts = num.toFixed(decimals).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    return parts.join('.');
  };

  return (
    <span className={className}>
      {prefix}{formatNumber(count)}{suffix}
    </span>
  );
}