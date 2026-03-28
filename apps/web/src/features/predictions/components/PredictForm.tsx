import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useWalletState } from '@/hooks/useWalletState';
import { MarketStatus, MarketType, type PredictionMarket } from '../types/prediction.types';
import { getMarketTypeLabel, COLLATERAL_SYMBOL } from '../utils/tokens';

interface PredictFormProps {
  market: PredictionMarket;
  onSuccess?: () => void;
}

type Direction = 'up' | 'down' | null;

export default function PredictForm({ market }: PredictFormProps) {
  const wallet = useWalletState();
  const isConnected = !!wallet.embeddedWallet.address;
  const [direction, setDirection] = useState<Direction>(null);
  const [amount, setAmount] = useState('');
  const [isPending, setIsPending] = useState(false);

  const labels = getMarketTypeLabel(market.marketType);
  const isOpen = market.status === MarketStatus.Open;
  const isExpired = market.endTime < Math.floor(Date.now() / 1000);
  const canPredict = isConnected && isOpen && !isExpired;

  const handleSubmit = async () => {
    if (!canPredict || !direction || !amount) return;
    setIsPending(true);
    // TODO: Wire contract interaction — predict(marketId, predictUp, amount)
    // For now, this is display-only
    setTimeout(() => setIsPending(false), 1500);
  };

  // Wallet not connected
  if (!isConnected) {
    return (
      <div className="p-4 rounded-[12px] bg-[#111111] border border-[#1F1F1F]">
        <p className="text-[#606060] text-xs text-center mb-3">Connect wallet to predict</p>
        <button
          type="button"
          className="w-full py-2.5 rounded-lg bg-[#F06718] text-white text-sm font-semibold hover:bg-[#D85A14] transition-colors"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  // Market not open
  if (!isOpen) {
    return (
      <div className="p-4 rounded-[12px] bg-[#111111] border border-[#1F1F1F]">
        <p className="text-[#606060] text-xs text-center">
          {market.status === MarketStatus.Settled ? 'Market settled' :
           market.status === MarketStatus.SettlementRequested ? 'Market is settling...' :
           'Market cancelled'}
        </p>
      </div>
    );
  }

  // Market expired but not settled
  if (isExpired) {
    return (
      <div className="p-4 rounded-[12px] bg-[#111111] border border-[#1F1F1F]">
        <p className="text-[#606060] text-xs text-center">Market expired, awaiting settlement</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Direction toggle */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setDirection('up')}
          className={`py-2.5 rounded-lg text-sm font-semibold transition-all ${
            direction === 'up'
              ? 'bg-[#4CAF50] text-white shadow-[0_0_12px_rgba(76,175,80,0.3)]'
              : 'bg-[#4CAF50]/10 text-[#4CAF50] border border-[#4CAF50]/20 hover:bg-[#4CAF50]/20'
          }`}
        >
          {labels.up}
        </button>
        <button
          type="button"
          onClick={() => setDirection('down')}
          className={`py-2.5 rounded-lg text-sm font-semibold transition-all ${
            direction === 'down'
              ? 'bg-[#F44336] text-white shadow-[0_0_12px_rgba(244,67,54,0.3)]'
              : 'bg-[#F44336]/10 text-[#F44336] border border-[#F44336]/20 hover:bg-[#F44336]/20'
          }`}
        >
          {labels.down}
        </button>
      </div>

      {/* Amount input */}
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => {
            const val = e.target.value;
            if (/^\d*\.?\d*$/.test(val)) setAmount(val);
          }}
          placeholder="0.00"
          className="w-full bg-[#111111] border border-[#1F1F1F] rounded-lg px-4 py-3 text-[#E0E0E0] text-sm placeholder-[#404040] focus:outline-none focus:border-[#333333] transition-colors"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#606060] text-xs font-medium">
          {COLLATERAL_SYMBOL}
        </span>
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!direction || !amount || isPending}
        className={`w-full py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
          direction && amount && !isPending
            ? direction === 'up'
              ? 'bg-[#4CAF50] text-white hover:bg-[#43A047]'
              : 'bg-[#F44336] text-white hover:bg-[#E53935]'
            : 'bg-[#1A1A1A] text-[#606060] cursor-not-allowed'
        }`}
      >
        {isPending ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Confirming...
          </>
        ) : (
          direction
            ? `Predict ${direction === 'up' ? labels.up : labels.down}`
            : 'Select direction'
        )}
      </button>
    </div>
  );
}
