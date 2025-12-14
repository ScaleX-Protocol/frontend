'use client';

import { Wallet } from 'lucide-react';
import { useState } from 'react';
import WalletMonitorDashboard from './WalletMonitorDashboard';

/**
 * Button to monitor wallets from the API
 * For development purposes
 */
export default function WalletMonitorButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-transparent hover:bg-black/30 text-white px-6 py-3 rounded-2xl transition-all duration-200 hover:scale-105 flex items-center space-x-2"
      >
        <Wallet className="w-5 h-5" />
        <span className="font-medium text-sm">Wallets</span>
      </button>

      {isOpen && <WalletMonitorDashboard onClose={() => setIsOpen(false)} />}
    </>
  );
}
