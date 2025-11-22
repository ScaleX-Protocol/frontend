import type { AvailableToSupply, LendingSupply } from '../../types/lending.types';
import { parseCurrency } from '../../utils/lending.helper';
import { TokenIcon } from '../tokenIcon';

interface EarnParams {
  supplies: LendingSupply[];
  availableToSupply: AvailableToSupply[];
}

export default function Earn({ supplies, availableToSupply }: EarnParams) {
  const totalSupplied = supplies.reduce((sum, s) => sum + parseCurrency(s.currentValue), 0);
  const totalEarnings = supplies.reduce((sum, s) => sum + parseCurrency(s.earnings), 0);

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Your Supplies Section */}
      <div className="bg-[#2C2C2C] rounded-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[#3A3A3A]">
          <h2 className="text-white font-medium">Your supplies</h2>
          <button type="button" className="text-gray-400 text-sm hover:text-white">
            Hide —
          </button>
        </div>

        {supplies.length > 0 && (
          <div className="flex gap-4 px-4 py-3 border-b border-[#3A3A3A]">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs">Balance</span>
              <span className="text-white text-sm font-medium">${totalSupplied.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs">Earnings</span>
              <span className="text-green-400 text-sm font-medium">${totalEarnings.toFixed(2)}</span>
            </div>
          </div>
        )}

        {supplies.length > 0 && (
          <div className="grid grid-cols-[1fr_1fr_0.8fr_0.8fr_1fr] gap-2 px-4 py-2 text-gray-400 text-xs">
            <span>Asset</span>
            <span>Supplied</span>
            <span>APY</span>
            <span>Collateral</span>
            <span></span>
          </div>
        )}

        <div className="px-4 pb-4">
          {supplies.length === 0 ? (
            <p className="text-gray-500 text-sm py-4 text-center">Nothing supplied yet</p>
          ) : (
            supplies.map((supply) => (
              <div
                key={supply.id}
                className="grid grid-cols-[1fr_1fr_0.8fr_0.8fr_1fr] gap-2 py-3 items-center border-t border-[#3A3A3A] first:border-t-0"
              >
                <div className="flex items-center gap-2">
                  <TokenIcon symbol={supply.asset} />
                  <span className="text-white font-medium">{supply.asset}</span>
                </div>
                <div>
                  <p className="text-white text-sm">{supply.suppliedAmount}</p>
                  <p className="text-gray-400 text-xs">{supply.currentValue}</p>
                </div>
                <span className="text-green-400 text-sm">{supply.apy}</span>
                <span className="text-gray-400 text-sm">{supply.collateralUsed}</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="px-3 py-1.5 bg-[#3A3A3A] hover:bg-[#4A4A4A] text-white text-xs rounded-md transition-colors"
                  >
                    Swap
                  </button>
                  <button
                    type="button"
                    disabled={!supply.canWithdraw}
                    className="px-3 py-1.5 bg-[#3A3A3A] hover:bg-[#4A4A4A] text-white text-xs rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Withdraw
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Assets to Supply Section */}
      <div className="bg-[#2C2C2C] rounded-lg overflow-hidden flex-1">
        <div className="flex items-center justify-between p-4 border-b border-[#3A3A3A]">
          <h2 className="text-white font-medium">Assets to supply</h2>
          <div className="flex items-center gap-3">
            <select className="bg-[#3A3A3A] text-white text-sm px-3 py-1.5 rounded-md border-none outline-none">
              <option>All Categories</option>
            </select>
            <button type="button" className="text-gray-400 text-sm hover:text-white">
              Hide —
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-b border-[#3A3A3A]">
          <label className="flex items-center gap-2 text-gray-400 text-sm cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded bg-[#3A3A3A] border-gray-500" />
            Show assets with 0 balance
          </label>
        </div>

        <div className="grid grid-cols-[1fr_1fr_0.8fr_0.8fr] gap-2 px-4 py-2 text-gray-400 text-xs">
          <span>Assets</span>
          <span>Wallet balance</span>
          <span>APY</span>
          <span></span>
        </div>

        <div className="px-4 pb-4 max-h-64 overflow-y-auto">
          {availableToSupply.length === 0 ? (
            <p className="text-gray-500 text-sm py-4 text-center">No assets available to supply</p>
          ) : (
            availableToSupply.map((asset, i) => (
              <div
                key={asset.assetAddress || i}
                className="grid grid-cols-[1fr_1fr_0.8fr_0.8fr] gap-2 py-3 items-center border-t border-[#3A3A3A] first:border-t-0"
              >
                <div className="flex items-center gap-2">
                  <TokenIcon symbol={asset.asset} />
                  <div className="flex flex-col">
                    <span className="text-white font-medium">{asset.asset}</span>
                    {asset.recommended && <span className="text-blue-400 text-xs">Recommended</span>}
                  </div>
                </div>
                <div>
                  <p className="text-white text-sm">{asset.userBalance}</p>
                  <p className="text-gray-400 text-xs">Available: {asset.availableAmount}</p>
                </div>
                <span className="text-green-400 text-sm">{asset.apy}</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={!asset.canSupply}
                    className="px-3 py-1.5 bg-white hover:bg-gray-200 text-black text-xs rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Supply
                  </button>
                  <button
                    type="button"
                    className="px-2 py-1.5 bg-[#3A3A3A] hover:bg-[#4A4A4A] text-white text-xs rounded-md transition-colors"
                  >
                    •••
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
