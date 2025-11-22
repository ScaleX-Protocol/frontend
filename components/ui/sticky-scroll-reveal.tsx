'use client';
import { motion, useMotionValueEvent, useScroll } from 'motion/react';
import type React from 'react';
import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export const StickyScroll = ({
  content,
  contentClassName,
}: {
  content: {
    title: string;
    description: string;
    content?: React.ReactNode | undefined;
  }[];
  contentClassName?: string;
}) => {
  const [activeCard, setActiveCard] = useState(0);
  const [isFirstSectionVisible, setIsFirstSectionVisible] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollSectionsRef = useRef<HTMLDivElement[]>([]);

  // Use the main page scroll instead of container scroll
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'], // Start when the top of the container hits the top of the viewport
  });

  const cardLength = content.length;

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    // Calculate which card should be active based on scroll progress
    const cardIndex = Math.floor(latest * cardLength);
    const clampedIndex = Math.min(Math.max(0, cardIndex), cardLength - 1);
    setActiveCard(clampedIndex);

    // Check if we're still in the sticky scroll area
    if (latest < 1) {
      setIsFirstSectionVisible(true);
    } else {
      setIsFirstSectionVisible(false);
    }
  });

  const linearGradients = [
    'linear-gradient(to bottom right, #06b6d4, #10b981)', // cyan-500 to emerald-500
    'linear-gradient(to bottom right, #ec4899, #6366f1)', // pink-500 to indigo-500
    'linear-gradient(to bottom right, #f97316, #eab308)', // orange-500 to yellow-500
  ];

  const backgroundGradient = linearGradients[activeCard % linearGradients.length];

  // Navigate to a specific section
  const navigateToSection = (index: number) => {
    if (ref.current) {
      const sectionHeight = ref.current.offsetHeight / cardLength;
      window.scrollTo({
        top: ref.current.offsetTop + index * sectionHeight,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div ref={ref} className="relative w-full">
      {/* Progress Indicator */}
      <div className="fixed right-8 top-1/2 transform -translate-y-1/2 z-50 flex flex-col gap-3">
        {content.map((content, index) => (
          <button
            type="button"
            key={content.title}
            onClick={() => navigateToSection(index)}
            className={`progress-dot w-3 h-3 rounded-full transition-all duration-300 ${
              activeCard === index ? 'bg-white scale-125' : 'bg-white/50'
            }`}
            aria-label={`Go to section ${index + 1}`}
          />
        ))}
      </div>

      <div className="relative flex justify-center gap-10">
        {/* Left side - scrollable content */}
        <div className="relative flex w-full max-w-2xl flex-col">
          {/* Fixed container for content */}
          <div
            ref={contentRef}
            className={`sticky top-0 flex items-center justify-center transition-opacity duration-500 z-10 ${
              isFirstSectionVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
            style={{ height: '100vh' }}
          >
            <div className="w-full max-w-lg">
              {content.map((item, index) => (
                <motion.div
                  key={item.title}
                  ref={(el) => {
                    if (el) scrollSectionsRef.current[index] = el;
                  }}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: activeCard === index ? 1 : 0,
                    y: activeCard === index ? 0 : 20,
                  }}
                  transition={{ duration: 0.5 }}
                  className="absolute top-0 left-0 w-full"
                >
                  <h2 className="text-2xl font-bold text-slate-100">{item.title}</h2>
                  <p className="mt-4 text-lg text-slate-300">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Hidden sections to drive scroll */}
          {content.map((content, index) => (
            <div key={`section-${content.title}`} className="h-screen" data-scroll-section={index} />
          ))}
        </div>

        {/* Right side - sticky image */}
        <div className="relative hidden lg:block lg:w-80">
          <div
            className={`sticky top-0 flex items-center justify-center transition-opacity duration-500 ${
              isFirstSectionVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
            style={{ height: '100vh' }}
          >
            <motion.div
              style={{ background: backgroundGradient }}
              animate={{ background: backgroundGradient }}
              transition={{ duration: 0.5 }}
              className={cn('h-60 w-80 overflow-hidden rounded-md bg-white', contentClassName)}
            >
              {content[activeCard].content ?? null}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
