import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function LoadingScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Simulate loading time (or wait for actual app load signals if integrated later)
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2500); // Slightly longer to appreciate the intro

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-9999 flex flex-col items-center justify-center overflow-hidden bg-black font-sans"
        >
          {/* Ambient Background Glow */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#E07B39]/10 rounded-full blur-[120px] opacity-40 animate-pulse-slow" />
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,transparent_0%,#000000_100%)]" />
          </div>

          {/* Grid Pattern Overlay (Optional for tech feel) */}
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:radial-gradient(black,transparent)] opacity-10" />

          <div className="relative z-10 flex flex-col items-center gap-10">
            {/* Logo Container */}
            <div className="relative">
              {/* Glow behind logo */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute inset-0 bg-[#E07B39] blur-3xl opacity-10"
              />
              
              <motion.img
                initial={{ scale: 0.9, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ 
                  duration: 1.2, 
                  ease: [0.22, 1, 0.36, 1],
                }}
                src="/images/logo/ScaleX-Logo.png"
                alt="ScaleX Protocol"
                width={96}
                height={96} // Increased size for impact
                className="relative z-10 drop-shadow-2xl"
              />
            </div>

            {/* Text & Loader Container */}
            <div className="flex flex-col items-center gap-6">
              <div className="overflow-hidden">
                <motion.h1
                  initial={{ y: 40 }}
                  animate={{ y: 0 }}
                  transition={{ 
                    duration: 1, 
                    ease: [0.22, 1, 0.36, 1], 
                    delay: 0.2 
                  }}
                  className="text-4xl font-bold tracking-[0.2em] text-white uppercase text-center"
                >
                  Scale<span className="text-[#E07B39]">X</span>
                </motion.h1>
              </div>

              {/* Minimal Loading Bar */}
              <div className="relative w-48 h-[2px] bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.5,
                    ease: "easeInOut",
                  }}
                  className="absolute inset-y-0 left-0 w-1/2 bg-linear-to-r from-transparent via-[#E07B39] to-transparent"
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
