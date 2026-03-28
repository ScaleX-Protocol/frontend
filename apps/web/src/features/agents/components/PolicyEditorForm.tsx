import { useState } from "react";
import { ChevronDown, ChevronUp, Info, AlertTriangle } from "lucide-react";
import type { PolicyStruct } from "../utils/policyTemplates";
import { validatePolicy, getPolicyWarnings } from "../utils/policyValidation";

interface PolicyEditorFormProps {
  initialPolicy: PolicyStruct;
  onSave: (policy: PolicyStruct) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function PolicyEditorForm({
  initialPolicy,
  onSave,
  onCancel,
  isLoading,
}: PolicyEditorFormProps) {
  const [policy, setPolicy] = useState<PolicyStruct>(initialPolicy);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    basic: true,
    trading: true,
    lending: false,
    safety: false,
    limits: false,
    advanced: false,
  });

  const errors = validatePolicy(policy);
  const warnings = getPolicyWarnings(policy);
  const hasErrors = errors.length > 0;

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const updatePolicy = (field: keyof PolicyStruct, value: unknown) => {
    setPolicy((prev) => ({ ...prev, [field]: value }));
  };

  const formatBigInt = (value: bigint): string => {
    if (
      value ===
      BigInt(
        "115792089237316195423570985008687907853269984665640564039457584007913129639935"
      )
    ) {
      return "unlimited";
    }
    return value.toString();
  };

  const parseBigInt = (value: string): bigint => {
    if (value === "unlimited" || value === "") {
      return BigInt(
        "115792089237316195423570985008687907853269984665640564039457584007913129639935"
      );
    }
    try {
      return BigInt(value);
    } catch {
      return 0n;
    }
  };

  const MAX_TIMESTAMP = BigInt(
    "115792089237316195423570985008687907853269984665640564039457584007913129639935"
  );

  const isNeverExpiry = (v: bigint) => v >= BigInt("9999999999");

  const ExpiryField = ({
    value,
    onChange,
  }: {
    value: bigint;
    onChange: (v: bigint) => void;
  }) => {
    const never = isNeverExpiry(value);
    // Convert bigint seconds to datetime-local string (YYYY-MM-DDTHH:mm)
    const toDatetimeLocal = (v: bigint) => {
      const ms = Number(v) * 1000;
      const d = new Date(ms);
      // Format as YYYY-MM-DDTHH:mm
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const fromDatetimeLocal = (s: string): bigint => {
      if (!s) return MAX_TIMESTAMP;
      const ms = new Date(s).getTime();
      if (isNaN(ms)) return MAX_TIMESTAMP;
      return BigInt(Math.floor(ms / 1000));
    };

    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-[#606060]">Expiry</label>
            <div className="group relative">
              <Info size={12} className="text-[#404040] cursor-help" />
              <div className="absolute left-0 bottom-full mb-1 hidden group-hover:block w-48 p-2 bg-[#1F1F1F] border border-[#2A2A2A] rounded text-xs text-[#A0A0A0] z-10">
                Date and time when the policy expires.
              </div>
            </div>
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer text-xs text-[#606060]">
            <input
              type="checkbox"
              checked={never}
              onChange={(e) => onChange(e.target.checked ? MAX_TIMESTAMP : BigInt(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60))}
              className="accent-[#5B9CF6] w-3 h-3"
            />
            Never
          </label>
        </div>
        <input
          type="datetime-local"
          disabled={never}
          value={never ? "" : toDatetimeLocal(value)}
          onChange={(e) => onChange(fromDatetimeLocal(e.target.value))}
          className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded px-3 py-2 text-sm text-[#E0E0E0] focus:outline-none focus:border-[#404040] disabled:opacity-40 disabled:cursor-not-allowed [color-scheme:dark]"
        />
      </div>
    );
  };

  const Section = ({
    title,
    name,
    children,
  }: {
    title: string;
    name: string;
    children: React.ReactNode;
  }) => (
    <div className="border border-[#1F1F1F] rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => toggleSection(name)}
        className="w-full px-4 py-3 bg-[#0A0A0A] flex items-center justify-between hover:bg-[#111111] transition-colors"
      >
        <h3 className="text-sm font-semibold text-[#FFFFFF]">{title}</h3>
        {expandedSections[name] ? (
          <ChevronUp size={16} className="text-[#606060]" />
        ) : (
          <ChevronDown size={16} className="text-[#606060]" />
        )}
      </button>
      {expandedSections[name] && (
        <div className="p-4 space-y-4 bg-[#111111]">{children}</div>
      )}
    </div>
  );

  const InputField = ({
    label,
    value,
    onChange,
    type = "text",
    suffix,
    tooltip,
    placeholder,
  }: {
    label: string;
    value: string | number;
    onChange: (value: string) => void;
    type?: "text" | "number";
    suffix?: string;
    tooltip?: string;
    placeholder?: string;
  }) => {
    const id = `input-${label.toLowerCase().replace(/\s+/g, "-")}`;
    return (
      <div>
        <label
          htmlFor={id}
          className="text-xs text-[#808080] mb-1.5 flex items-center gap-1.5"
        >
          {label}
          {tooltip && (
            <div className="group relative">
              <Info size={12} className="text-[#606060] cursor-help" />
              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-xs text-[#B0B0B0] z-10">
                {tooltip}
              </div>
            </div>
          )}
        </label>
        <div className="relative">
          <input
            id={id}
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#1F1F1F] rounded text-sm text-[#E0E0E0] focus:border-[#F06718] focus:outline-none"
          />
          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#606060]">
              {suffix}
            </span>
          )}
        </div>
      </div>
    );
  };

  const CheckboxField = ({
    label,
    checked,
    onChange,
    tooltip,
  }: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    tooltip?: string;
  }) => (
    <label className="flex items-center gap-2 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-[#1F1F1F] bg-[#0A0A0A] text-[#F06718] focus:ring-[#F06718] focus:ring-offset-0"
      />
      <span className="text-sm text-[#E0E0E0] flex items-center gap-1.5">
        {label}
        {tooltip && (
          <div className="relative">
            <Info size={12} className="text-[#606060] cursor-help" />
            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-xs text-[#B0B0B0] z-10">
              {tooltip}
            </div>
          </div>
        )}
      </span>
    </label>
  );

  const TokenListField = ({
    label,
    value,
    onChange,
    tooltip,
  }: {
    label: string;
    value: readonly `0x${string}`[];
    onChange: (value: `0x${string}`[]) => void;
    tooltip?: string;
  }) => {
    const [input, setInput] = useState("");
    const id = `tokenlist-${label.toLowerCase().replace(/\s+/g, "-")}`;

    const addToken = () => {
      if (input.match(/^0x[a-fA-F0-9]{40}$/)) {
        onChange([...value, input as `0x${string}`]);
        setInput("");
      }
    };

    const removeToken = (tokenToRemove: `0x${string}`) => {
      onChange(value.filter((token) => token !== tokenToRemove));
    };

    return (
      <div>
        <label
          htmlFor={id}
          className="text-xs text-[#808080] mb-1.5 flex items-center gap-1.5"
        >
          {label}
          {tooltip && (
            <div className="group relative">
              <Info size={12} className="text-[#606060] cursor-help" />
              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-xs text-[#B0B0B0] z-10">
                {tooltip}
              </div>
            </div>
          )}
        </label>
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              id={id}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="0x..."
              className="flex-1 px-3 py-2 bg-[#0A0A0A] border border-[#1F1F1F] rounded text-sm text-[#E0E0E0] focus:border-[#F06718] focus:outline-none"
            />
            <button
              type="button"
              onClick={addToken}
              className="px-3 py-2 bg-[#F06718] text-white text-xs font-semibold rounded hover:bg-[#D85A14] transition-colors"
            >
              Add
            </button>
          </div>
          {value.length > 0 && (
            <div className="space-y-1">
              {value.map((token) => (
                <div
                  key={token}
                  className="flex items-center justify-between px-3 py-2 bg-[#0A0A0A] border border-[#1F1F1F] rounded"
                >
                  <span className="text-xs text-[#E0E0E0] font-mono">
                    {token}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeToken(token)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 overflow-y-auto" style={{ zIndex: 'var(--z-modal)' }}>
      <div className="bg-[#111111] border border-[#1F1F1F] rounded-xl w-full max-w-4xl my-8">
        <div className="p-5 border-b border-[#1F1F1F] sticky top-0 bg-[#111111] z-10">
          <h2 className="text-lg font-bold text-[#FFFFFF]">
            Custom Policy Configuration
          </h2>
          <p className="text-sm text-[#606060] mt-1">
            Configure detailed permissions and limits for this agent
          </p>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Basic Settings */}
          <Section title="Basic Settings" name="basic">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Max Order Size"
                value={formatBigInt(policy.maxOrderSize)}
                onChange={(v) => updatePolicy("maxOrderSize", parseBigInt(v))}
                placeholder="unlimited"
                tooltip="Maximum size per order. Use 'unlimited' for no limit."
              />
              <InputField
                label="Min Order Size"
                value={formatBigInt(policy.minOrderSize)}
                onChange={(v) => updatePolicy("minOrderSize", parseBigInt(v))}
                placeholder="0"
                tooltip="Minimum size per order."
              />
              <ExpiryField
                value={policy.expiryTimestamp}
                onChange={(v) => updatePolicy("expiryTimestamp", v)}
              />
            </div>
          </Section>

          {/* Trading Permissions */}
          <Section title="Trading Permissions" name="trading">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <CheckboxField
                label="Allow Market Orders"
                checked={policy.allowMarketOrders}
                onChange={(v) => updatePolicy("allowMarketOrders", v)}
                tooltip="Allow agent to place market orders"
              />
              <CheckboxField
                label="Allow Limit Orders"
                checked={policy.allowLimitOrders}
                onChange={(v) => updatePolicy("allowLimitOrders", v)}
                tooltip="Allow agent to place limit orders"
              />
              <CheckboxField
                label="Allow Swap"
                checked={policy.allowSwap}
                onChange={(v) => updatePolicy("allowSwap", v)}
                tooltip="Allow agent to perform token swaps"
              />
              <CheckboxField
                label="Allow Place Limit Order"
                checked={policy.allowPlaceLimitOrder}
                onChange={(v) => updatePolicy("allowPlaceLimitOrder", v)}
              />
              <CheckboxField
                label="Allow Cancel Order"
                checked={policy.allowCancelOrder}
                onChange={(v) => updatePolicy("allowCancelOrder", v)}
              />
              <CheckboxField
                label="Allow Buy"
                checked={policy.allowBuy}
                onChange={(v) => updatePolicy("allowBuy", v)}
              />
              <CheckboxField
                label="Allow Sell"
                checked={policy.allowSell}
                onChange={(v) => updatePolicy("allowSell", v)}
              />
            </div>
          </Section>

          {/* Lending Permissions */}
          <Section title="Lending Permissions" name="lending">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <CheckboxField
                  label="Allow Borrow"
                  checked={policy.allowBorrow}
                  onChange={(v) => updatePolicy("allowBorrow", v)}
                  tooltip="Allow agent to borrow assets"
                />
                <CheckboxField
                  label="Allow Repay"
                  checked={policy.allowRepay}
                  onChange={(v) => updatePolicy("allowRepay", v)}
                  tooltip="Allow agent to repay borrowed assets"
                />
                <CheckboxField
                  label="Allow Supply Collateral"
                  checked={policy.allowSupplyCollateral}
                  onChange={(v) => updatePolicy("allowSupplyCollateral", v)}
                />
                <CheckboxField
                  label="Allow Withdraw Collateral"
                  checked={policy.allowWithdrawCollateral}
                  onChange={(v) => updatePolicy("allowWithdrawCollateral", v)}
                />
              </div>
              <div className="space-y-3">
                <CheckboxField
                  label="Allow Auto Borrow"
                  checked={policy.allowAutoBorrow}
                  onChange={(v) => updatePolicy("allowAutoBorrow", v)}
                  tooltip="Allow agent to automatically borrow when needed"
                />
                <InputField
                  label="Max Auto Borrow Amount"
                  value={formatBigInt(policy.maxAutoBorrowAmount)}
                  onChange={(v) =>
                    updatePolicy("maxAutoBorrowAmount", parseBigInt(v))
                  }
                  placeholder="0"
                  tooltip="Maximum amount agent can auto-borrow"
                />
                <CheckboxField
                  label="Allow Auto Repay"
                  checked={policy.allowAutoRepay}
                  onChange={(v) => updatePolicy("allowAutoRepay", v)}
                  tooltip="Allow agent to automatically repay debt"
                />
                <InputField
                  label="Min Debt to Repay"
                  value={formatBigInt(policy.minDebtToRepay)}
                  onChange={(v) =>
                    updatePolicy("minDebtToRepay", parseBigInt(v))
                  }
                  placeholder="0"
                  tooltip="Minimum debt amount to trigger auto-repay"
                />
              </div>
            </div>
          </Section>

          {/* Safety Limits */}
          <Section title="Safety Limits" name="safety">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Min Health Factor"
                value={(Number(policy.minHealthFactor) / 1e18).toFixed(2)}
                onChange={(v) =>
                  updatePolicy(
                    "minHealthFactor",
                    BigInt(Math.floor(parseFloat(v || "1.5") * 1e18))
                  )
                }
                type="number"
                tooltip="Minimum health factor (e.g., 1.5 = 150%). Must be >= 1.0"
              />
              <InputField
                label="Max Slippage"
                value={(Number(policy.maxSlippageBps) / 100).toFixed(2)}
                onChange={(v) =>
                  updatePolicy(
                    "maxSlippageBps",
                    BigInt(Math.floor(parseFloat(v || "1") * 100))
                  )
                }
                type="number"
                suffix="%"
                tooltip="Maximum allowed slippage percentage"
              />
              <InputField
                label="Min Time Between Trades"
                value={policy.minTimeBetweenTrades.toString()}
                onChange={(v) =>
                  updatePolicy("minTimeBetweenTrades", BigInt(v || "0"))
                }
                type="number"
                suffix="seconds"
                tooltip="Minimum cooldown between trades"
              />
              <InputField
                label="Emergency Recipient"
                value={policy.emergencyRecipient}
                onChange={(v) =>
                  updatePolicy("emergencyRecipient", v as `0x${string}`)
                }
                placeholder="0x0000000000000000000000000000000000000000"
                tooltip="Address to receive funds in emergency"
              />
            </div>
          </Section>

          {/* Volume & Risk Limits */}
          <Section title="Volume & Risk Limits" name="limits">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Daily Volume Limit"
                value={formatBigInt(policy.dailyVolumeLimit)}
                onChange={(v) =>
                  updatePolicy("dailyVolumeLimit", parseBigInt(v))
                }
                placeholder="0 (unlimited)"
                tooltip="Maximum trading volume per day. 0 = unlimited"
              />
              <InputField
                label="Weekly Volume Limit"
                value={formatBigInt(policy.weeklyVolumeLimit)}
                onChange={(v) =>
                  updatePolicy("weeklyVolumeLimit", parseBigInt(v))
                }
                placeholder="0 (unlimited)"
                tooltip="Maximum trading volume per week. 0 = unlimited"
              />
              <InputField
                label="Max Daily Drawdown"
                value={(Number(policy.maxDailyDrawdown) / 100).toFixed(2)}
                onChange={(v) =>
                  updatePolicy(
                    "maxDailyDrawdown",
                    BigInt(Math.floor(parseFloat(v || "0") * 100))
                  )
                }
                type="number"
                suffix="%"
                tooltip="Maximum daily loss percentage. 0 = no limit"
              />
              <InputField
                label="Max Weekly Drawdown"
                value={(Number(policy.maxWeeklyDrawdown) / 100).toFixed(2)}
                onChange={(v) =>
                  updatePolicy(
                    "maxWeeklyDrawdown",
                    BigInt(Math.floor(parseFloat(v || "0") * 100))
                  )
                }
                type="number"
                suffix="%"
                tooltip="Maximum weekly loss percentage. 0 = no limit"
              />
              <InputField
                label="Max Trades Per Day"
                value={policy.maxTradesPerDay.toString()}
                onChange={(v) =>
                  updatePolicy("maxTradesPerDay", BigInt(v || "0"))
                }
                type="number"
                placeholder="0 (unlimited)"
                tooltip="Maximum number of trades per day. 0 = unlimited"
              />
              <InputField
                label="Max Trades Per Hour"
                value={policy.maxTradesPerHour.toString()}
                onChange={(v) =>
                  updatePolicy("maxTradesPerHour", BigInt(v || "0"))
                }
                type="number"
                placeholder="0 (unlimited)"
                tooltip="Maximum number of trades per hour. 0 = unlimited"
              />
            </div>
          </Section>

          {/* Advanced Settings */}
          <Section title="Advanced Settings" name="advanced">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="Trading Start Hour (UTC)"
                  value={policy.tradingStartHour.toString()}
                  onChange={(v) =>
                    updatePolicy(
                      "tradingStartHour",
                      BigInt(Math.min(23, Math.max(0, parseInt(v || "0"))))
                    )
                  }
                  type="number"
                  tooltip="Hour when trading starts (0-23 UTC)"
                />
                <InputField
                  label="Trading End Hour (UTC)"
                  value={policy.tradingEndHour.toString()}
                  onChange={(v) =>
                    updatePolicy(
                      "tradingEndHour",
                      BigInt(Math.min(23, Math.max(0, parseInt(v || "23"))))
                    )
                  }
                  type="number"
                  tooltip="Hour when trading ends (0-23 UTC)"
                />
                <InputField
                  label="Min Win Rate"
                  value={(Number(policy.minWinRateBps) / 100).toFixed(2)}
                  onChange={(v) =>
                    updatePolicy(
                      "minWinRateBps",
                      BigInt(Math.floor(parseFloat(v || "0") * 100))
                    )
                  }
                  type="number"
                  suffix="%"
                  tooltip="Minimum required win rate percentage"
                />
                <InputField
                  label="Min Sharpe Ratio"
                  value={(Number(policy.minSharpeRatio) / 1e18).toFixed(2)}
                  onChange={(v) =>
                    updatePolicy(
                      "minSharpeRatio",
                      BigInt(Math.floor(parseFloat(v || "0") * 1e18))
                    )
                  }
                  type="number"
                  tooltip="Minimum Sharpe ratio for performance evaluation"
                />
                <InputField
                  label="Min Reputation Score"
                  value={policy.minReputationScore.toString()}
                  onChange={(v) =>
                    updatePolicy("minReputationScore", BigInt(v || "0"))
                  }
                  type="number"
                  tooltip="Minimum reputation score required"
                />
                <InputField
                  label="Max Trade vs TVL"
                  value={(Number(policy.maxTradeVsTVLBps) / 100).toFixed(2)}
                  onChange={(v) =>
                    updatePolicy(
                      "maxTradeVsTVLBps",
                      BigInt(Math.floor(parseFloat(v || "0") * 100))
                    )
                  }
                  type="number"
                  suffix="%"
                  tooltip="Maximum trade size as percentage of TVL"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <CheckboxField
                  label="Use Reputation Multiplier"
                  checked={policy.useReputationMultiplier}
                  onChange={(v) => updatePolicy("useReputationMultiplier", v)}
                  tooltip="Apply reputation-based multipliers to limits"
                />
                <CheckboxField
                  label="Requires Chainlink Functions"
                  checked={policy.requiresChainlinkFunctions}
                  onChange={(v) =>
                    updatePolicy("requiresChainlinkFunctions", v)
                  }
                  tooltip="Enable Chainlink oracle integration"
                />
              </div>

              <TokenListField
                label="Whitelisted Tokens"
                value={policy.whitelistedTokens}
                onChange={(v) => updatePolicy("whitelistedTokens", v)}
                tooltip="Only these tokens can be traded. Empty = all tokens allowed"
              />

              <TokenListField
                label="Blacklisted Tokens"
                value={policy.blacklistedTokens}
                onChange={(v) => updatePolicy("blacklistedTokens", v)}
                tooltip="These tokens cannot be traded"
              />
            </div>
          </Section>
        </div>

        {/* Errors and Warnings */}
        {(errors.length > 0 || warnings.length > 0) && (
          <div className="space-y-2">
            {errors.length > 0 && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-red-400 text-sm font-semibold mb-2">
                  <AlertTriangle size={14} />
                  Validation Errors
                </div>
                <ul className="space-y-1">
                  {errors.map((error) => (
                    <li key={error.field} className="text-xs text-red-300">
                      • {error.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {warnings.length > 0 && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-400 text-sm font-semibold mb-2">
                  <AlertTriangle size={14} />
                  Warnings
                </div>
                <ul className="space-y-1">
                  {warnings.map((warning) => (
                    <li key={warning} className="text-xs text-yellow-300">
                      • {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="p-5 border-t border-[#1F1F1F] flex gap-3 sticky bottom-0 bg-[#111111]">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-lg border border-[#222222] text-sm text-[#E0E0E0] hover:bg-[#1A1A1A] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(policy)}
            disabled={isLoading || hasErrors}
            className="flex-1 py-2.5 rounded-lg bg-[#F06718] text-sm text-white font-semibold hover:bg-[#D85A14] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading
              ? "Saving..."
              : hasErrors
              ? "Fix Errors to Continue"
              : "Save & Authorize"}
          </button>
        </div>
      </div>
    </div>
  );
}
