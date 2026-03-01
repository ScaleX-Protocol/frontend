'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  side?: 'top' | 'right';
}

export function Tooltip({ content, children, side = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      if (side === 'right') {
        setCoords({
          top: rect.top + rect.height / 2,
          left: rect.right + 8,
        });
      } else {
        setCoords({
          top: rect.top - 8,
          left: rect.left + rect.width / 2,
        });
      }
    }
  }, [isVisible, side]);

  return (
    <>
      <div
        ref={triggerRef}
        className="relative inline-block w-full min-w-[46px]"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {mounted && isVisible && createPortal(
        <div
          className="fixed z-50 px-3 py-2 text-xs font-medium text-[#E0E0E0] bg-[#111111] border border-[#222222] rounded-[8px] shadow-xl whitespace-nowrap pointer-events-none transition-opacity duration-200 animate-in fade-in zoom-in-95"
          style={{
            top: coords.top,
            left: coords.left,
            transform: side === 'right' ? 'translateY(-50%)' : 'translate(-50%, -100%)',
          }}
        >
          {content}
          {side === 'right' ? (
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-[#222222]">
              <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-[#111111]" />
            </div>
          ) : (
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-[#222222]">
              <div className="absolute top-[-6px] left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-[#111111]" />
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
}
