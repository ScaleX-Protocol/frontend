import { Shield, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { AgentPolicy } from "../types/agents.types";
import {
  formatBigIntMax,
  formatBps,
  formatHealthFactor,
  formatTokenAmount,
} from "../utils/formatPolicy";

interface AgentPolicyDisplayProps {
  policy: AgentPolicy;
}

export default function AgentPolicyDisplay({
  policy,
}: AgentPolicyDisplayProps) {
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    trading: true,
    lending: true,
    risk: true,
    advanced: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const BoolBadge = ({ value, label }: { value: boolean; label: string }) => (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        value ? "bg-green-500/10 text-green-400" : "bg-[#1A1A1A] text-[#606060]"
      }`}
    >
      {label}
    </span>
  );

  const Section = ({
    title,
    children,
    name,
  }: {
    title: string;
    children: React.ReactNode;
    name: string;
  }) => (
    <div>
      <button
        type="button"
        onClick={() => toggleSection(name)}
        className="w-full flex items-center justify-between py-2 text-xs font-medium text-[#808080] uppercase tracking-wider hover:text-[#FFFFFF] transition-colors"
      >
        {title}
        {expandedSections[name] ? (
          <ChevronUp size={14} />
        ) : (
          <ChevronDown size={14} />
        )}
      </button>
      {expandedSections[name] && children}
    </div>
  );

  return (
    <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-[#1F1F1F] flex items-center gap-2">
        <Shield size={14} className="text-[#F06718]" />
        <h3 className="text-sm font-semibold text-[#FFFFFF]">
          Policy Configuration
        </h3>
        <span className="ml-auto text-xs text-[#606060]">
          Template: {policy.templateUsed}
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* Trading Permissions */}
        <Section title="Trading Permissions" name="trading">
          <div className="flex flex-wrap gap-2 mt-2">
            <BoolBadge value={policy.allowMarketOrders} label="Market Orders" />
            <BoolBadge value={policy.allowLimitOrders} label="Limit Orders" />
            <BoolBadge value={policy.allowSwap} label="Swap" />
            <BoolBadge value={policy.allowBuy} label="Buy" />
            <BoolBadge value={policy.allowSell} label="Sell" />
            <BoolBadge value={policy.allowCancelOrder} label="Cancel" />
            <BoolBadge
              value={policy.allowPlaceLimitOrder}
              label="Place Limit"
            />
          </div>
        </Section>

        {/* Lending Permissions */}
        <Section title="Lending Permissions" name="lending">
          <div className="flex flex-wrap gap-2 mt-2">
            <BoolBadge value={policy.allowBorrow} label="Borrow" />
            <BoolBadge value={policy.allowRepay} label="Repay" />
            <BoolBadge
              value={policy.allowSupplyCollateral}
              label="Supply Collateral"
            />
            <BoolBadge
              value={policy.allowWithdrawCollateral}
              label="Withdraw Collateral"
            />
            <BoolBadge value={policy.allowAutoBorrow} label="Auto Borrow" />
            <BoolBadge value={policy.allowAutoRepay} label="Auto Repay" />
          </div>
        </Section>

        {/* Risk Limits */}
        <Section title="Risk & Safety Limits" name="risk">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
            <div>
              <span className="text-[#606060] text-xs">Max Order Size</span>
              <p className="text-[#E0E0E0] text-sm font-medium">
                {formatBigIntMax(policy.maxOrderSize)}
              </p>
            </div>
            <div>
              <span className="text-[#606060] text-xs">Min Order Size</span>
              <p className="text-[#E0E0E0] text-sm font-medium">
                {policy.minOrderSize === "0"
                  ? "None"
                  : `${formatTokenAmount(policy.minOrderSize)} IDRX`}
              </p>
            </div>
            <div>
              <span className="text-[#606060] text-xs">Max Slippage</span>
              <p className="text-[#E0E0E0] text-sm font-medium">
                {formatBps(policy.maxSlippageBps)}
              </p>
            </div>
            <div>
              <span className="text-[#606060] text-xs">Min Health Factor</span>
              <p className="text-[#E0E0E0] text-sm font-medium">
                {formatHealthFactor(policy.minHealthFactor)}
              </p>
            </div>
            <div>
              <span className="text-[#606060] text-xs">Max Auto Borrow</span>
              <p className="text-[#E0E0E0] text-sm font-medium">
                {policy.maxAutoBorrowAmount === "0"
                  ? "N/A"
                  : `${formatTokenAmount(policy.maxAutoBorrowAmount)} IDRX`}
              </p>
            </div>
            <div>
              <span className="text-[#606060] text-xs">Min Debt to Repay</span>
              <p className="text-[#E0E0E0] text-sm font-medium">
                {policy.minDebtToRepay === "0"
                  ? "N/A"
                  : `${formatTokenAmount(policy.minDebtToRepay)} IDRX`}
              </p>
            </div>
            <div>
              <span className="text-[#606060] text-xs">Min Between Trades</span>
              <p className="text-[#E0E0E0] text-sm font-medium">
                {policy.minTimeBetweenTrades}s
              </p>
            </div>
            <div>
              <span className="text-[#606060] text-xs">Trading Hours</span>
              <p className="text-[#E0E0E0] text-sm font-medium">
                {policy.tradingStartHour}:00 - {policy.tradingEndHour}:00 UTC
              </p>
            </div>
            {policy.emergencyRecipient !==
              "0x0000000000000000000000000000000000000000" && (
              <div className="col-span-2 md:col-span-3">
                <span className="text-[#606060] text-xs">
                  Emergency Recipient
                </span>
                <p className="text-[#E0E0E0] text-xs font-mono">
                  {policy.emergencyRecipient}
                </p>
              </div>
            )}
          </div>
        </Section>

        {/* Advanced Settings */}
        <Section title="Advanced Settings" name="advanced">
          <div className="space-y-3 mt-2">
            {/* Volume Limits */}
            {(policy.dailyVolumeLimit !== "0" ||
              policy.weeklyVolumeLimit !== "0") && (
              <div>
                <h5 className="text-xs font-medium text-[#A0A0A0] mb-2">
                  Volume Limits
                </h5>
                <div className="grid grid-cols-2 gap-3">
                  {policy.dailyVolumeLimit !== "0" && (
                    <div>
                      <span className="text-[#606060] text-xs">
                        Daily Limit
                      </span>
                      <p className="text-[#E0E0E0] text-sm font-medium">
                        {formatTokenAmount(policy.dailyVolumeLimit)} IDRX
                      </p>
                    </div>
                  )}
                  {policy.weeklyVolumeLimit !== "0" && (
                    <div>
                      <span className="text-[#606060] text-xs">
                        Weekly Limit
                      </span>
                      <p className="text-[#E0E0E0] text-sm font-medium">
                        {formatTokenAmount(policy.weeklyVolumeLimit)} IDRX
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Drawdown Limits */}
            {(policy.maxDailyDrawdown !== "0" ||
              policy.maxWeeklyDrawdown !== "0") && (
              <div>
                <h5 className="text-xs font-medium text-[#A0A0A0] mb-2">
                  Drawdown Limits
                </h5>
                <div className="grid grid-cols-2 gap-3">
                  {policy.maxDailyDrawdown !== "0" && (
                    <div>
                      <span className="text-[#606060] text-xs">
                        Max Daily Drawdown
                      </span>
                      <p className="text-[#E0E0E0] text-sm font-medium">
                        {formatBps(policy.maxDailyDrawdown)}
                      </p>
                    </div>
                  )}
                  {policy.maxWeeklyDrawdown !== "0" && (
                    <div>
                      <span className="text-[#606060] text-xs">
                        Max Weekly Drawdown
                      </span>
                      <p className="text-[#E0E0E0] text-sm font-medium">
                        {formatBps(policy.maxWeeklyDrawdown)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Trade Frequency */}
            {(policy.maxTradesPerDay !== "0" ||
              policy.maxTradesPerHour !== "0") && (
              <div>
                <h5 className="text-xs font-medium text-[#A0A0A0] mb-2">
                  Trade Frequency
                </h5>
                <div className="grid grid-cols-2 gap-3">
                  {policy.maxTradesPerDay !== "0" && (
                    <div>
                      <span className="text-[#606060] text-xs">
                        Max Per Day
                      </span>
                      <p className="text-[#E0E0E0] text-sm font-medium">
                        {policy.maxTradesPerDay}
                      </p>
                    </div>
                  )}
                  {policy.maxTradesPerHour !== "0" && (
                    <div>
                      <span className="text-[#606060] text-xs">
                        Max Per Hour
                      </span>
                      <p className="text-[#E0E0E0] text-sm font-medium">
                        {policy.maxTradesPerHour}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Performance Requirements */}
            {(policy.minWinRateBps !== "0" ||
              policy.minSharpeRatio !== "0") && (
              <div>
                <h5 className="text-xs font-medium text-[#A0A0A0] mb-2">
                  Performance Requirements
                </h5>
                <div className="grid grid-cols-2 gap-3">
                  {policy.minWinRateBps !== "0" && (
                    <div>
                      <span className="text-[#606060] text-xs">
                        Min Win Rate
                      </span>
                      <p className="text-[#E0E0E0] text-sm font-medium">
                        {formatBps(policy.minWinRateBps)}
                      </p>
                    </div>
                  )}
                  {policy.minSharpeRatio !== "0" && (
                    <div>
                      <span className="text-[#606060] text-xs">
                        Min Sharpe Ratio
                      </span>
                      <p className="text-[#E0E0E0] text-sm font-medium">
                        {(Number(policy.minSharpeRatio) / 1e18).toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Token Lists */}
            {(policy.whitelistedTokens.length > 0 ||
              policy.blacklistedTokens.length > 0) && (
              <div>
                <h5 className="text-xs font-medium text-[#A0A0A0] mb-2">
                  Token Restrictions
                </h5>
                <div className="space-y-2">
                  {policy.whitelistedTokens.length > 0 && (
                    <div>
                      <span className="text-[#606060] text-xs">
                        Whitelisted Tokens ({policy.whitelistedTokens.length})
                      </span>
                      <div className="mt-1 space-y-1">
                        {policy.whitelistedTokens.map((token) => (
                          <p
                            key={token}
                            className="text-[#E0E0E0] text-xs font-mono"
                          >
                            {token}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                  {policy.blacklistedTokens.length > 0 && (
                    <div>
                      <span className="text-[#606060] text-xs">
                        Blacklisted Tokens ({policy.blacklistedTokens.length})
                      </span>
                      <div className="mt-1 space-y-1">
                        {policy.blacklistedTokens.map((token) => (
                          <p
                            key={token}
                            className="text-[#E0E0E0] text-xs font-mono"
                          >
                            {token}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Other Advanced Settings */}
            {(policy.minReputationScore !== "0" ||
              policy.maxTradeVsTVLBps !== "0" ||
              policy.useReputationMultiplier ||
              policy.requiresChainlinkFunctions) && (
              <div>
                <h5 className="text-xs font-medium text-[#A0A0A0] mb-2">
                  Other Settings
                </h5>
                <div className="grid grid-cols-2 gap-3">
                  {policy.minReputationScore !== "0" && (
                    <div>
                      <span className="text-[#606060] text-xs">
                        Min Reputation
                      </span>
                      <p className="text-[#E0E0E0] text-sm font-medium">
                        {policy.minReputationScore}
                      </p>
                    </div>
                  )}
                  {policy.maxTradeVsTVLBps !== "0" && (
                    <div>
                      <span className="text-[#606060] text-xs">
                        Max Trade vs TVL
                      </span>
                      <p className="text-[#E0E0E0] text-sm font-medium">
                        {formatBps(policy.maxTradeVsTVLBps)}
                      </p>
                    </div>
                  )}
                  {policy.useReputationMultiplier && (
                    <div className="col-span-2">
                      <BoolBadge
                        value={true}
                        label="Reputation Multiplier Enabled"
                      />
                    </div>
                  )}
                  {policy.requiresChainlinkFunctions && (
                    <div className="col-span-2">
                      <BoolBadge
                        value={true}
                        label="Chainlink Functions Required"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Section>
      </div>
    </div>
  );
}
