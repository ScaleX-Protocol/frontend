import type { AvailableToBorrow, LendingBorrow } from '../../types/lending.types';
import { parseCurrency } from '../../utils/lending.helper';
import { TokenIcon } from '../tokenIcon';

interface BorrowParams {
  borrows: LendingBorrow[];
  availableToBorrow: AvailableToBorrow[];
  healthFactor: string;
}

export default function Borrow({ borrows, availableToBorrow, healthFactor }: BorrowParams) {
  const totalDebt = borrows.reduce((sum, b) => sum + parseCurrency(b.currentDebt), 0);
  const totalInterest = borrows.reduce((sum, b) => sum + parseCurrency(b.interestAccrued), 0);

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'safe':
        return 'text-green-400';
      case 'warning':
        return 'text-yellow-400';
      case 'danger':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Your Borrows Section */}
      <div className="bg-[#2C2C2C] rounded-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[#3A3A3A]">
          <div className="flex items-center gap-3">
            <h2 className="text-white font-medium">Your borrows</h2>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs">Health Factor</span>
              <span
                className={`text-sm font-medium ${parseFloat(healthFactor) > 1.5 ? 'text-green-400' : 'text-yellow-400'}`}
              >
                {parseFloat(healthFactor) > 1000 ? '∞' : healthFactor}
              </span>
            </div>
          </div>
        </div>

        {borrows.length > 0 && (
          <div className="flex gap-4 px-4 py-3 border-b border-[#3A3A3A]">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs">Total Debt</span>
              <span className="text-white text-sm font-medium">${totalDebt.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs">Interest Accrued</span>
              <span className="text-red-400 text-sm font-medium">${totalInterest.toFixed(2)}</span>
            </div>
          </div>
        )}

        {borrows.length > 0 && (
          <div className="grid grid-cols-[1fr_1fr_0.8fr_0.8fr_0.8fr] gap-2 px-4 py-2 text-gray-400 text-xs">
            <span>Asset</span>
            <span>Debt</span>
            <span>APY</span>
            <span>Health</span>
            <span></span>
          </div>
        )}

        <div className="px-4 pb-4">
          {borrows.length === 0 ? (
            <p className="text-gray-500 text-sm py-4">Nothing borrowed yet</p>
          ) : (
            borrows.map((borrow) => (
              <div
                key={borrow.id}
                className="grid grid-cols-[1fr_1fr_0.8fr_0.8fr_0.8fr] gap-2 py-3 items-center border-t border-[#3A3A3A] first:border-t-0"
              >
                <div className="flex items-center gap-2">
                  <TokenIcon symbol={borrow.asset} />
                  <span className="text-white font-medium">{borrow.asset}</span>
                </div>
                <div>
                  <p className="text-white text-sm">{borrow.borrowedAmount}</p>
                  <p className="text-gray-400 text-xs">{borrow.currentDebt}</p>
                </div>
                <span className="text-red-400 text-sm">{borrow.apy}</span>
                <span className={`text-sm ${getHealthStatusColor(borrow.healthStatus)}`}>{borrow.healthFactor}</span>
                <button
                  type="button"
                  disabled={!borrow.canRepay}
                  className="px-3 py-1.5 bg-[#3A3A3A] hover:bg-[#4A4A4A] text-white text-xs rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-fit"
                >
                  Repay
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Assets to Borrow Section */}
      <div className="bg-[#2C2C2C] rounded-lg overflow-hidden flex-1">
        <div className="flex items-center justify-between p-4 border-b border-[#3A3A3A]">
          <h2 className="text-white font-medium">Assets to borrow</h2>
          <div className="flex items-center gap-3">
            <select className="bg-[#3A3A3A] text-white text-sm px-3 py-1.5 rounded-md border-none outline-none">
              <option>All Categories</option>
            </select>
            <button type="button" className="text-gray-400 text-sm hover:text-white">
              Hide —
            </button>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_1fr_0.8fr_0.8fr] gap-2 px-4 py-2 text-gray-400 text-xs">
          <span>Asset</span>
          <span>Available</span>
          <span>APY, variable</span>
          <span></span>
        </div>

        <div className="px-4 pb-4 max-h-80 overflow-y-auto">
          {availableToBorrow.length === 0 ? (
            <p className="text-gray-500 text-sm py-4 text-center">No assets available to borrow</p>
          ) : (
            availableToBorrow.map((asset, i) => (
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
                  <p className="text-white text-sm">{asset.availableAmount}</p>
                  <p className="text-gray-400 text-xs">CF: {asset.collateralFactor}</p>
                </div>
                <span className="text-white text-sm">{asset.apy}</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={!asset.canBorrow}
                    className="px-3 py-1.5 bg-white hover:bg-gray-200 text-black text-xs rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Borrow
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1.5 bg-[#3A3A3A] hover:bg-[#4A4A4A] text-white text-xs rounded-md transition-colors"
                  >
                    Details
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
