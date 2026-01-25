'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MeshGradient } from '@paper-design/shaders-react';

interface OnboardingAnimationProps {
  step: 1 | 2 | 3;
  variant?: 'desktop' | 'mobile';
}

// Token Coin with real images for Step 1
const TokenCoin = ({ 
  token, 
  delay = 0, 
  size = 40 
}: { 
  token: 'USDC' | 'WETH' | 'WBTC'; 
  delay?: number; 
  size?: number;
}) => {
  const tokenIcons: Record<string, string> = {
    USDC: '/tokens/usd-coin-usdc-logo.svg',
    WETH: '/tokens/ethereum-eth-logo.svg',
    WBTC: '/tokens/bitcoin-btc-logo.svg',
  };

  const tokenColors: Record<string, string> = {
    USDC: '#2775CA',
    WETH: '#627EEA',
    WBTC: '#F09242',
  };

  return (
    <motion.div
      initial={{ y: -60, opacity: 0, rotateY: 0 }}
      animate={{ 
        y: [0, -8, 0],
        opacity: 1,
        rotateY: [0, 15, -15, 0]
      }}
      transition={{ 
        y: { duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: delay * 0.5 },
        opacity: { duration: 0.5, delay },
        rotateY: { duration: 4, repeat: Infinity, ease: "easeInOut", delay }
      }}
      style={{ 
        width: size, 
        height: size,
        perspective: '500px',
        transformStyle: 'preserve-3d'
      }}
      className="relative"
    >
      {/* Glow effect */}
      <div 
        className="absolute inset-0 rounded-full blur-md opacity-60"
        style={{ backgroundColor: tokenColors[token] }}
      />
      {/* Token image container */}
      <div 
        className="relative w-full h-full rounded-full bg-[#2C2C2C] p-1.5 border-2 overflow-hidden"
        style={{ 
          borderColor: tokenColors[token],
          boxShadow: `0 0 20px ${tokenColors[token]}40, 0 4px 8px rgba(0,0,0,0.3)`
        }}
      >
        <img 
          src={tokenIcons[token]} 
          alt={token}
          className="w-full h-full object-contain"
        />
      </div>
    </motion.div>
  );
};

// Yield Counter - Animated counting display
const YieldCounter = () => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCount(prev => {
        // Reset after reaching a certain amount for continuous loop effect
        if (prev >= 999.99) return 0;
        // Random increment between 0.01 and 0.15 for realistic earning feel
        return prev + (Math.random() * 0.14 + 0.01);
      });
    }, 100);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className="flex items-baseline"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      <span className="text-[#F06718] text-lg font-bold">$</span>
      <motion.span 
        className="text-[#E0E0E0] text-xl font-bold tabular-nums"
        key={Math.floor(count)}
        initial={{ y: -5, opacity: 0.5 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.1 }}
      >
        {count.toFixed(2)}
      </motion.span>
    </motion.div>
  );
};

// Yield Particle for Step 1
const YieldParticle = ({ delay = 0 }: { delay?: number }) => (
  <motion.div
    className="absolute w-2 h-2 rounded-full bg-[#7CC956]"
    initial={{ y: 0, opacity: 0, scale: 0 }}
    animate={{ 
      y: -100,
      opacity: [0, 1, 0],
      scale: [0.5, 1.5, 0.5]
    }}
    transition={{ 
      duration: 2,
      repeat: Infinity,
      delay,
      ease: "easeOut"
    }}
    style={{
      boxShadow: '0 0 10px #7CC956, 0 0 20px #7CC956'
    }}
  />
);

// Step 1: Deposit & Earn Animation - Token-centric design
const DepositAnimation = () => {
  const [yields, setYields] = useState({ USDC: 0, WETH: 0, WBTC: 0 });
  
  useEffect(() => {
    const interval = setInterval(() => {
      setYields(prev => ({
        USDC: prev.USDC >= 99.99 ? 0 : prev.USDC + (Math.random() * 0.08 + 0.02),
        WETH: prev.WETH >= 99.99 ? 0 : prev.WETH + (Math.random() * 0.06 + 0.01),
        WBTC: prev.WBTC >= 99.99 ? 0 : prev.WBTC + (Math.random() * 0.05 + 0.01),
      }));
    }, 150);
    return () => clearInterval(interval);
  }, []);

  const tokens = [
    { symbol: 'USDC' as const, apy: '8.5%', color: '#2775CA', icon: '/tokens/usd-coin-usdc-logo.svg' },
    { symbol: 'WETH' as const, apy: '4.2%', color: '#627EEA', icon: '/tokens/ethereum-eth-logo.svg' },
    { symbol: 'WBTC' as const, apy: '3.8%', color: '#F09242', icon: '/tokens/bitcoin-btc-logo.svg' },
  ];

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden px-4">
      {/* Background shader */}
      <div className="absolute inset-0 opacity-25">
        <MeshGradient
          colors={["#F06718", "#1A1A1A", "#7CC956", "#2C2C2C"]}
          speed={0.2}
        />
      </div>
      
      {/* Header */}
      <motion.div 
        className="relative z-10 mb-4 text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <span className="text-[#E0E0E0]/70 text-[10px] font-medium">DEPOSIT ASSETS</span>
        <div className="flex items-center gap-1 justify-center mt-0.5">
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-[#7CC956]"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="text-[#7CC956] text-[10px] font-semibold">Auto-Earning Active</span>
        </div>
      </motion.div>
      
      {/* Token Cards with Yield */}
      <div className="relative z-10 flex flex-col gap-2.5 w-full max-w-[250px]">
        {tokens.map((token, index) => (
          <motion.div
            key={token.symbol}
            className="relative flex items-center justify-between bg-[#1A1A1A]/80 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/5"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: index * 0.15 }}
            style={{
              boxShadow: `0 0 20px ${token.color}15, inset 0 0 30px ${token.color}08`
            }}
          >
            {/* Token info */}
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-full p-1 border"
                style={{ 
                  borderColor: `${token.color}60`,
                  background: `radial-gradient(circle, ${token.color}20 0%, transparent 70%)`
                }}
              >
                <img src={token.icon} alt={token.symbol} className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="text-[#E0E0E0] text-xs font-semibold">{token.symbol}</span>
                <span className="text-[#7CC956] text-[10px] font-medium">+{token.apy} APY</span>
              </div>
            </div>
            
            {/* Yield Earned */}
            <div className="flex flex-col items-end">
              <span className="text-[#E0E0E0]/50 text-[8px]">EARNED</span>
              <motion.div 
                className="flex items-baseline"
                key={Math.floor(yields[token.symbol])}
              >
                <span className="text-[#7CC956] text-sm font-bold tabular-nums">
                  +${yields[token.symbol].toFixed(2)}
                </span>
              </motion.div>
            </div>
            
            {/* Earning pulse indicator */}
            <motion.div
              className="absolute -right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: token.color }}
              animate={{ 
                opacity: [0.4, 1, 0.4],
                scale: [0.8, 1.2, 0.8]
              }}
              transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.3 }}
            />
          </motion.div>
        ))}
      </div>
      
      {/* Total Earning Summary */}
      <motion.div
        className="relative z-10 mt-4 flex flex-col items-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-center gap-2 px-4 py-2 bg-[#7CC956]/10 rounded-full border border-[#7CC956]/30">
          <motion.div
            className="w-2 h-2 rounded-full bg-[#7CC956]"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            style={{ boxShadow: '0 0 8px #7CC956' }}
          />
          <span className="text-[#E0E0E0] text-xs font-medium">Total: </span>
          <span className="text-[#7CC956] text-sm font-bold tabular-nums">
            +${(yields.USDC + yields.WETH + yields.WBTC).toFixed(2)}
          </span>
        </div>
      </motion.div>
    </div>
  );
};

// Candlestick bar for Step 2
const CandlestickBar = ({ 
  height, 
  color, 
  delay = 0 
}: { 
  height: number; 
  color: 'green' | 'red'; 
  delay?: number;
}) => (
  <motion.div
    className="relative flex flex-col items-center"
    initial={{ scaleY: 0, opacity: 0 }}
    animate={{ scaleY: 1, opacity: 1 }}
    transition={{ duration: 0.5, delay }}
    style={{ originY: 1 }}
  >
    {/* Wick */}
    <div 
      className={`w-0.5 ${color === 'green' ? 'bg-[#44CF6C]' : 'bg-[#E25544]'}`}
      style={{ height: 12 }}
    />
    {/* Body */}
    <motion.div
      className={`w-4 rounded-sm ${color === 'green' ? 'bg-[#44CF6C]' : 'bg-[#E25544]'}`}
      style={{ height }}
      animate={{ 
        boxShadow: [
          `0 0 5px ${color === 'green' ? '#44CF6C' : '#E25544'}`,
          `0 0 15px ${color === 'green' ? '#44CF6C' : '#E25544'}`,
          `0 0 5px ${color === 'green' ? '#44CF6C' : '#E25544'}`
        ]
      }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
    {/* Lower wick */}
    <div 
      className={`w-0.5 ${color === 'green' ? 'bg-[#44CF6C]' : 'bg-[#E25544]'}`}
      style={{ height: 8 }}
    />
  </motion.div>
);

// Step 2: Trade Animation
const TradeAnimation = () => (
  <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
    {/* Background shader */}
    <div className="absolute inset-0 opacity-30">
      <MeshGradient
        colors={["#4ECDC4", "#1A1A1A", "#F06718", "#2C2C2C"]}
        speed={0.4}
      />
    </div>
    
    {/* Candlestick chart */}
    <div className="relative z-10 flex items-end gap-2 h-32">
      <CandlestickBar height={40} color="green" delay={0} />
      <CandlestickBar height={60} color="green" delay={0.1} />
      <CandlestickBar height={30} color="red" delay={0.2} />
      <CandlestickBar height={50} color="green" delay={0.3} />
      <CandlestickBar height={35} color="red" delay={0.4} />
      <CandlestickBar height={70} color="green" delay={0.5} />
      <CandlestickBar height={45} color="green" delay={0.6} />
    </div>
    
    {/* Trading flow line */}
    <motion.div
      className="absolute z-10 w-48 h-0.5 bg-linear-to-r from-[#44CF6C] via-[#F06718] to-[#4ECDC4]"
      initial={{ scaleX: 0, opacity: 0 }}
      animate={{ scaleX: 1, opacity: 1 }}
      transition={{ duration: 1, delay: 0.7 }}
      style={{ 
        originX: 0,
        boxShadow: '0 0 10px rgba(240, 103, 24, 0.5)'
      }}
    />
    
    {/* Order flow indicators */}
    <div className="mt-6 flex gap-8">
      <motion.div
        className="flex items-center gap-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8 }}
      >
        <div className="w-3 h-3 rounded-full bg-[#44CF6C] animate-pulse" />
        <span className="text-[#44CF6C] text-xs font-medium">BUY</span>
      </motion.div>
      
      <motion.div
        className="flex items-center gap-2"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.9 }}
      >
        <div className="w-3 h-3 rounded-full bg-[#E25544] animate-pulse" />
        <span className="text-[#E25544] text-xs font-medium">SELL</span>
      </motion.div>
    </div>
  </div>
);

// Shield wave for Step 3
const ShieldWave = ({ delay = 0, scale = 1 }: { delay?: number; scale?: number }) => (
  <motion.div
    className="absolute rounded-full border-2 border-[#7CC956]"
    initial={{ scale: 0.5, opacity: 0.8 }}
    animate={{ scale: scale + 0.5, opacity: 0 }}
    transition={{ 
      duration: 2,
      repeat: Infinity,
      delay,
      ease: "easeOut"
    }}
    style={{
      width: 100,
      height: 100,
      top: '50%',
      left: '50%',
      marginTop: -50,
      marginLeft: -50
    }}
  />
);

// Step 3: Protect Animation
const ProtectAnimation = () => (
  <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
    {/* Background shader */}
    <div className="absolute inset-0 opacity-30">
      <MeshGradient
        colors={["#7CC956", "#1A1A1A", "#4ECDC4", "#2C2C2C"]}
        speed={0.25}
      />
    </div>
    
    {/* Protection waves */}
    <div className="absolute inset-0 flex items-center justify-center">
      <ShieldWave delay={0} scale={1} />
      <ShieldWave delay={0.5} scale={1.2} />
      <ShieldWave delay={1} scale={1.4} />
    </div>
    
    {/* Shield icon */}
    <motion.div
      className="relative z-10"
      initial={{ scale: 0, rotateY: 0 }}
      animate={{ 
        scale: 1,
        rotateY: [0, 10, -10, 0]
      }}
      transition={{ 
        scale: { duration: 0.5 },
        rotateY: { duration: 4, repeat: Infinity, ease: "easeInOut" }
      }}
      style={{ perspective: '500px' }}
    >
      <svg width="80" height="96" viewBox="0 0 80 96" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-2xl">
        <defs>
          <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7CC956" />
            <stop offset="50%" stopColor="#5DA840" />
            <stop offset="100%" stopColor="#4ECDC4" />
          </linearGradient>
          <filter id="shieldGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path 
          d="M40 4L8 20V44C8 66.5 21.5 87.5 40 92C58.5 87.5 72 66.5 72 44V20L40 4Z" 
          fill="url(#shieldGradient)" 
          stroke="#7CC956"
          strokeWidth="3"
          filter="url(#shieldGlow)"
        />
        {/* Check mark */}
        <motion.path
          d="M28 48L36 56L52 40"
          stroke="#FFFFFF"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        />
      </svg>
    </motion.div>
    
    {/* Protection label */}
    <motion.div
      className="mt-4 px-4 py-1.5 bg-[#7CC956]/20 rounded-full border border-[#7CC956]/40"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
    >
      <span className="text-[#7CC956] text-xs font-semibold">Zero-Slippage Protection</span>
    </motion.div>
  </div>
);

export default function OnboardingAnimation({ step, variant = 'desktop' }: OnboardingAnimationProps) {
  const isMobile = variant === 'mobile';
  
  return (
    <div 
      className={`${isMobile ? 'w-[200px] h-[220px]' : 'w-[293px] h-[320px]'} rounded-3xl overflow-hidden border border-white/10 bg-[#1A1A1A]`}
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d'
      }}
    >
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            className="w-full h-full"
            initial={{ opacity: 0, rotateY: -90 }}
            animate={{ opacity: 1, rotateY: 0 }}
            exit={{ opacity: 0, rotateY: 90 }}
            transition={{ duration: 0.5 }}
          >
            <DepositAnimation />
          </motion.div>
        )}
        
        {step === 2 && (
          <motion.div
            key="step2"
            className="w-full h-full"
            initial={{ opacity: 0, rotateY: -90 }}
            animate={{ opacity: 1, rotateY: 0 }}
            exit={{ opacity: 0, rotateY: 90 }}
            transition={{ duration: 0.5 }}
          >
            <TradeAnimation />
          </motion.div>
        )}
        
        {step === 3 && (
          <motion.div
            key="step3"
            className="w-full h-full"
            initial={{ opacity: 0, rotateY: -90 }}
            animate={{ opacity: 1, rotateY: 0 }}
            exit={{ opacity: 0, rotateY: 90 }}
            transition={{ duration: 0.5 }}
          >
            <ProtectAnimation />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
