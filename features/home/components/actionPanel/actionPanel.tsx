import { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import Input from '../input';
import Button from '../button';

export default function ActionPanel({
  activeTab,
  onClose,
}: {
  activeTab: 'deposit' | 'withdraw' | 'transfer';
  onClose: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [asset, setAsset] = useState('');
  const [address, setAddress] = useState('');

  const titles = {
    deposit: 'Deposit',
    withdraw: 'Withdraw',
    transfer: 'Transfer',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      layout
    >
      <div className="bg-[#2C2C2C] rounded-md p-2 h-[281px] relative flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[#E0E0E0] text-lg font-semibold">{titles[activeTab]}</h3>
            <button type="button" onClick={onClose} className="text-[#A0A0A0] hover:text-[#E0E0E0]">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input label="Amount" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div className="flex-1">
                <Input label="Asset" placeholder="USDC" value={asset} onChange={(e) => setAsset(e.target.value)} />
              </div>
            </div>

            {activeTab === 'transfer' && (
              <Input
                label="To Address"
                placeholder="0x1a2b3c..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            )}
          </div>
        </div>

        <Button variant="primary" className="w-full">
          {titles[activeTab]}
        </Button>
      </div>
    </motion.div>
  );
}
