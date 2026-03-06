'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle } from 'lucide-react';

interface InfoPopoverProps {
  content: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export function InfoPopover({ content, side = 'right' }: InfoPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const offset = 8;

    switch (side) {
      case 'right':
        setCoords({ top: rect.top + rect.height / 2, left: rect.right + offset });
        break;
      case 'left':
        setCoords({ top: rect.top + rect.height / 2, left: rect.left - offset });
        break;
      case 'bottom':
        setCoords({ top: rect.bottom + offset, left: rect.left + rect.width / 2 });
        break;
      case 'top':
      default:
        setCoords({ top: rect.top - offset, left: rect.left + rect.width / 2 });
        break;
    }
  }, [side]);

  useEffect(() => {
    if (isOpen) updatePosition();
  }, [isOpen, updatePosition]);

  // Close on outside click or Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e: MouseEvent) => {
      if (triggerRef.current?.contains(e.target as Node)) return;
      setIsOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen]);

  const getTransform = () => {
    switch (side) {
      case 'right': return 'translateY(-50%)';
      case 'left': return 'translate(-100%, -50%)';
      case 'bottom': return 'translateX(-50%)';
      case 'top': return 'translate(-50%, -100%)';
      default: return 'translateY(-50%)';
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center justify-center text-[#555555] hover:text-[#888888] transition-colors"
        aria-label="More info"
      >
        <HelpCircle size={16} />
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed z-50 max-w-[280px] px-3 py-2.5 text-xs text-[#B0B0B0] leading-relaxed bg-[#111111] border border-[#222222] rounded-lg shadow-xl"
                style={{
                  top: coords.top,
                  left: coords.left,
                  transform: getTransform(),
                }}
              >
                {content}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
