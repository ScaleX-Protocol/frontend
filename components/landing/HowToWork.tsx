'use client';

import { BarChart2, Database, LineChart, Wallet } from 'lucide-react';
import { motion } from 'motion/react';

export default function HowToWorkSection() {
  const steps = [
    {
      number: 1,
      title: 'Connect Wallet',
      description: 'Connect your wallet to create your trading account',
      icon: Wallet,
      color: 'from-blue-500 to-blue-600',
    },
    {
      number: 2,
      title: 'Deposit & Earn',
      description:
        'Deposit assets like USDC to our Balance Manager contract. Your actual tokens are sent to the Lending Manager for getting yield and borrowing power while you receive synthetic sUSDC tokens for trading',
      icon: Database,
      color: 'from-blue-600 to-blue-700',
    },
    {
      number: 3,
      title: 'Trade Instantly',
      description:
        'Trade using your synthetic tokens (sUSDC) on our CLOB while your actual USDC continues earning yield. Auto-redemption occurs when orders are matched',
      icon: LineChart,
      color: 'from-blue-700 to-blue-800',
    },
    {
      number: 4,
      title: 'Maximize Returns',
      description: 'Monitor both your market performance and accumulated yield in real-time',
      icon: BarChart2,
      color: 'from-blue-800 to-blue-900',
    },
  ];

  return (
    <section className="py-20 relative z-10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Start making your assets work harder</h2>
          <p className="text-base md:text-lg text-gray-300 max-w-3xl mx-auto">
            Deposit once, earn continuously, and capture market opportunities without downtime
          </p>
        </div>

        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-linear-to-b from-blue-900/0 via-blue-900/50 to-blue-900/0 transform -translate-x-1/2 hidden md:block"></div>

          <div className="space-y-8 md:space-y-16 relative">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  viewport={{ once: true, amount: 0.2 }}
                  className={`flex flex-col md:flex-row items-center ${
                    index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                >
                  {/* Step number with icon */}
                  <div className={`shrink-0 z-10 mb-6 md:mb-0 ${index % 2 === 0 ? 'md:mr-8' : 'md:ml-8'}`}>
                    <div className="relative">
                      <div
                        className={`w-24 h-24 rounded-full bg-linear-to-br ${step.color} flex items-center justify-center shadow-lg shadow-blue-900/20`}
                      >
                        <step.icon className="h-10 w-10 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#0a0a0a] border border-blue-900/50 flex items-center justify-center">
                        <span className="text-blue-400 font-bold">{step.number}</span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className={`md:w-1/2 ${index % 2 === 0 ? 'md:text-left' : 'md:text-right'}`}>
                    <div className="bg-[#0a0a0a] border border-blue-900/30 rounded-lg p-6 shadow-lg relative overflow-hidden group hover:border-blue-500/50 transition-all duration-300">
                      <div className="absolute inset-0 rounded-lg bg-linear-to-r from-blue-900/20 via-purple-900/10 to-blue-900/20 opacity-50" />

                      <div className="relative z-10">
                        <h3 className="text-xl md:text-2xl font-bold mb-3">{step.title}</h3>
                        <p className="text-sm md:text-base text-gray-400">{step.description}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
