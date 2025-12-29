import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

export default function ModalWrapper({
  isOpen,
  onClose,
  title,
  icon: Icon,
  children,
  isProcessing,
  disableOutsideClick = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: any;
  children: React.ReactNode;
  isProcessing?: boolean;
  disableOutsideClick?: boolean;
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={handleBackdropClick}
          />

          {/* Modal */}
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={handleBackdropClick}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-[#2A2A2A] border border-[#3A3A3A] rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#3A3A3A]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#F06718]/10 rounded-lg">
                    <Icon className="w-5 h-5 text-[#F06718]" />
                  </div>
                  <h2 className="text-[#E0E0E0] text-xl font-semibold">{title}</h2>
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
