'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { LogOut } from 'lucide-react';

interface LogoutConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function LogoutConfirmationModal({ 
  isOpen, 
  onConfirm, 
  onCancel 
}: LogoutConfirmationModalProps) {
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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            onClick={onCancel}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-[#2A2A2A] border border-[#3A3A3A] rounded-xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
              {/* Content */}
              <div className="px-6 py-8 flex flex-col items-center gap-6">
                {/* Icon */}
                <div className="w-16 h-16 bg-[#F06718]/10 rounded-full flex items-center justify-center">
                  <LogOut className="w-8 h-8 text-[#F06718]" />
                </div>

                {/* Text */}
                <div className="text-center space-y-2">
                  <h3 className="text-[#E0E0E0] text-lg font-medium">
                    Disconnect Wallet
                  </h3>
                  <p className="text-[#A0A0A0] text-sm leading-relaxed">
                    Are you sure you want to disconnect your wallet?
                  </p>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 w-full">
                  <button
                    type="button"
                    onClick={onCancel}
                    className="w-full py-2.5 px-4 text-[#A0A0A0] hover:text-[#E0E0E0] font-medium rounded-lg border border-[#3A3A3A] hover:bg-[#3A3A3A] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={onConfirm}
                    className="w-full py-2.5 px-4 text-white font-semibold rounded-lg bg-[#F06718] hover:bg-[#f0782a] transition-colors shadow-lg shadow-[#F06718]/20"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
