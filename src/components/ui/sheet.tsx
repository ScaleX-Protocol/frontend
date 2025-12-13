'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  side?: 'left' | 'right' | 'top' | 'bottom';
  className?: string;
}

export function Sheet({ open, onOpenChange, children, side = 'right', className }: SheetProps) {
  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const sideClasses = {
    left: 'left-0 top-0 h-full',
    right: 'right-0 top-0 h-full',
    top: 'top-0 left-0 w-full',
    bottom: 'bottom-0 left-0 w-full',
  };

  const slideVariants = {
    left: {
      initial: { x: '-100%' },
      animate: { x: 0 },
      exit: { x: '-100%' },
    },
    right: {
      initial: { x: '100%' },
      animate: { x: 0 },
      exit: { x: '100%' },
    },
    top: {
      initial: { y: '-100%' },
      animate: { y: 0 },
      exit: { y: '-100%' },
    },
    bottom: {
      initial: { y: '100%' },
      animate: { y: 0 },
      exit: { y: '100%' },
    },
  };

  const variants = slideVariants[side];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => onOpenChange(false)}
          />
          {/* Sheet */}
          <motion.div
            initial={variants.initial}
            animate={variants.animate}
            exit={variants.exit}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              'fixed z-50 bg-[#2C2C2C] shadow-xl',
              sideClasses[side],
              side === 'left' || side === 'right' ? 'w-[481px]' : 'h-full max-h-[90vh]',
              className
            )}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface SheetContentProps {
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
  showCloseButton?: boolean;
}

export function SheetContent({
  children,
  className,
  onClose,
  showCloseButton = true,
}: SheetContentProps) {
  return (
    <div className={cn('h-full flex flex-col overflow-hidden w-[481px]', className)}>
      {showCloseButton && onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2 right-2 p-2 hover:bg-[#3C3C3C] rounded-md transition-colors z-10"
          aria-label="Close"
        >
          <X size={20} className="text-[#E0E0E0]/40" />
        </button>
      )}
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}

