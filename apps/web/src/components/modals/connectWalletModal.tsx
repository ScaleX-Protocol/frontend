'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Wallet } from 'lucide-react';

interface ConnectWalletModalProps {
  isOpen: boolean;
  onConnect: () => void;
  disabled?: boolean;
}

export default function ConnectWalletModal({ isOpen, onConnect, disabled }: ConnectWalletModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - non-clickable to prevent closing */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            style={{ zIndex: 'var(--z-modal-backdrop)' }}
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 'var(--z-modal)' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-[#2A2A2A] border border-[#3A3A3A] rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              {/* Content */}
              <div className="px-6 py-8 flex flex-col items-center gap-6">
                {/* Icon */}
                <div className="w-20 h-20 bg-gradient-to-br from-[#F06718]/20 to-[#F06718]/5 rounded-full flex items-center justify-center">
                  <Wallet className="w-10 h-10 text-[#F06718]" />
                </div>

                {/* Text */}
                <div className="text-center space-y-2">
                  <h3 className="text-[#E0E0E0] text-lg font-medium">
                    Wallet Connection Required
                  </h3>
                  <p className="text-[#A0A0A0] text-sm leading-relaxed">
                    Please connect your wallet to access capital flywheel engine.
                  </p>
                </div>

                {/* Connect Button */}
                <button
                  type="button"
                  onClick={onConnect}
                  disabled={disabled}
                  className={`w-full py-3 px-4 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg ${
                    disabled
                      ? 'bg-[#F06718]/50 cursor-not-allowed'
                      : 'bg-[#F06718] hover:bg-[#f0782a] shadow-[#F06718]/20'
                  }`}
                >
                  {disabled ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Initializing...
                    </>
                  ) : (
                    <>
                      <Wallet className="w-5 h-5" />
                      Connect Wallet
                    </>
                  )}
                </button>

                {/* Info text */}
                <p className="text-[#6B6B6B] text-xs text-center">
                  By connecting, you agree to ScaleX's Terms of Service and Privacy Policy.
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
