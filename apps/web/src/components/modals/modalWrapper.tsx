import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

export default function ModalWrapper({
  isOpen,
  onClose,
  title,
  icon: Icon,
  customIcon,
  children,
  isProcessing,
  disableOutsideClick = false,
  maxWidth = 'max-w-md',
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: any;
  customIcon?: React.ReactNode;
  children: React.ReactNode;
  isProcessing?: boolean;
  disableOutsideClick?: boolean;
  maxWidth?: string;
}) {
  // Handle backdrop click
  const handleBackdropClick = () => {
    if (!isProcessing && !disableOutsideClick) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            style={{ zIndex: 'var(--z-modal-backdrop)' }}
            onClick={handleBackdropClick}
          />

          {/* Modal */}
          <div
            className="fixed inset-0 flex items-center justify-center p-4"
            style={{ zIndex: 'var(--z-modal)' }}
            onClick={handleBackdropClick}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={`bg-[#0C0C0C] border border-[#1F1F1F] rounded-[32px] shadow-2xl w-full ${maxWidth} overflow-hidden`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#1F1F1F]">
                <div className="flex items-center gap-3">
                  {customIcon ? (
                    customIcon
                  ) : Icon ? (
                    <div className="p-2 bg-[#F06718]/10 rounded-[10px]">
                      <Icon className="w-5 h-5 text-[#F06718]" />
                    </div>
                  ) : null}
                  <h2 className="text-[#E0E0E0] text-xl leading-[16px] font-medium">{title}</h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-[#A0A0A0] hover:text-[#E0E0E0] transition-colors p-1 rounded-lg hover:bg-[#3A3A3A]"
                  disabled={isProcessing}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {children}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
