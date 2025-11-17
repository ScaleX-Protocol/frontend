'use client';

import { StickyScroll } from '../ui/sticky-scroll-reveal';

export default function TrustSection() {
  const content = [
    {
      title: 'The Problem: Idle Trading Capital',
      description:
        "In a standard Order Book DEX, funds placed in the liquidity pool, in the exchange wallet, or reserved for active limit orders (e.g., a 'buy limit' order waiting for the price to drop) are simply sitting dormant.",
      content: (
        <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(to_bottom_right,var(--cyan-500),var(--emerald-500))] text-white">
          Idle Trading Capital
        </div>
      ),
    },
    {
      title: 'The Solution: Automatic Deposit',
      description:
        'The moment you deposit assets into the integrated Order Book DEX, those funds are simultaneously and automatically deposited into the Lending Protocol pool.',
      content: (
        <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(to_bottom_right,var(--orange-500),var(--yellow-500))] text-white">
          Automatic Deposit
        </div>
      ),
    },
    {
      title: 'The Result: The Self-Reinforcing Flywheel',
      description:
        'This dual-functionality creates a positive feedback loop that drives growth for both sides of the platform.',
      content: (
        <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(to_bottom_right,var(--cyan-500),var(--emerald-500))] text-white">
          The Self-Reinforcing Flywheel
        </div>
      ),
    },
    {
      title: 'Advanced Benefit: Zero-Risk Collateral',
      description: 'The trading account balance is the collateral for the lending/borrowing side.',
      content: (
        <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(to_bottom_right,var(--cyan-500),var(--emerald-500))] text-white">
          Zero-Risk Collateral
        </div>
      ),
    },
    {
      title: 'Advanced Benefit: Integrated Risk Management',
      description: 'The Order Book provides sophisticated tools to manage risks inherent in the Lending Protocol.',
      content: (
        <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(to_bottom-right,var(--orange-500),var(--yellow-500))] text-white">
          Integrated Risk Management
        </div>
      ),
    },
  ];

  return (
    <section className="relative z-10 px-6 py-20 md:px-12 lg:px-24 bg-gray-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
            Why Order Book DEX is the Perfect Match for Lending Protocol
          </h2>
        </div>

        <StickyScroll content={content} />
      </div>
    </section>
  );
}
