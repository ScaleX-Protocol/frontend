import { Shield } from 'lucide-react';
import type { AgentPolicy } from '../types/agents.types';
import { formatBigIntMax, formatBps, formatHealthFactor, formatTokenAmount } from '../utils/formatPolicy';

interface AgentPolicyDisplayProps {
  policy: AgentPolicy;
}

export default function AgentPolicyDisplay({ policy }: AgentPolicyDisplayProps) {
  const BoolBadge = ({ value, label }: { value: boolean; label: string }) => (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
      value ? 'bg-green-500/10 text-green-400' : 'bg-[#1A1A1A] text-[#606060]'
    }`}>
      {label}
    </span>
  );

  return (
    <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-[#1F1F1F] flex items-center gap-2">
        <Shield size={14} className="text-[#F06718]" />
        <h3 className="text-sm font-semibold text-[#FFFFFF]">Policy Configuration</h3>
        <span className="ml-auto text-xs text-[#606060]">Template: {policy.templateUsed}</span>
      </div>

      <div className="p-4 space-y-4">
        {/* Trading Permissions */}
        <div>
          <h4 className="text-xs font-medium text-[#808080] mb-2 uppercase tracking-wider">Trading Permissions</h4>
          <div className="flex flex-wrap gap-2">
            <BoolBadge value={policy.allowMarketOrders} label="Market Orders" />
            <BoolBadge value={policy.allowLimitOrders} label="Limit Orders" />
            <BoolBadge value={policy.allowSwap} label="Swap" />
            <BoolBadge value={policy.allowBuy} label="Buy" />
            <BoolBadge value={policy.allowSell} label="Sell" />
            <BoolBadge value={policy.allowCancelOrder} label="Cancel" />
          </div>
        </div>

        {/* Lending Permissions */}
        <div>
          <h4 className="text-xs font-medium text-[#808080] mb-2 uppercase tracking-wider">Lending Permissions</h4>
          <div className="flex flex-wrap gap-2">
            <BoolBadge value={policy.allowBorrow} label="Borrow" />
            <BoolBadge value={policy.allowRepay} label="Repay" />
            <BoolBadge value={policy.allowSupplyCollateral} label="Supply Collateral" />
            <BoolBadge value={policy.allowWithdrawCollateral} label="Withdraw Collateral" />
            <BoolBadge value={policy.allowAutoBorrow} label="Auto Borrow" />
            <BoolBadge value={policy.allowAutoRepay} label="Auto Repay" />
          </div>
        </div>

        {/* Risk Limits */}
        <div>
          <h4 className="text-xs font-medium text-[#808080] mb-2 uppercase tracking-wider">Risk Limits</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <span className="text-[#606060] text-xs">Max Order Size</span>
              <p className="text-[#E0E0E0] text-sm font-medium">{formatBigIntMax(policy.maxOrderSize)}</p>
            </div>
            <div>
              <span className="text-[#606060] text-xs">Max Slippage</span>
              <p className="text-[#E0E0E0] text-sm font-medium">{formatBps(policy.maxSlippageBps)}</p>
            </div>
            <div>
              <span className="text-[#606060] text-xs">Min Health Factor</span>
              <p className="text-[#E0E0E0] text-sm font-medium">{formatHealthFactor(policy.minHealthFactor)}</p>
            </div>
            <div>
              <span className="text-[#606060] text-xs">Max Auto Borrow</span>
              <p className="text-[#E0E0E0] text-sm font-medium">
                {policy.maxAutoBorrowAmount === '0' ? 'N/A' : `${formatTokenAmount(policy.maxAutoBorrowAmount)} IDRX`}
              </p>
            </div>
            <div>
              <span className="text-[#606060] text-xs">Min Between Trades</span>
              <p className="text-[#E0E0E0] text-sm font-medium">{policy.minTimeBetweenTrades}s</p>
            </div>
            <div>
              <span className="text-[#606060] text-xs">Trading Hours</span>
              <p className="text-[#E0E0E0] text-sm font-medium">{policy.tradingStartHour}:00 - {policy.tradingEndHour}:00 UTC</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
