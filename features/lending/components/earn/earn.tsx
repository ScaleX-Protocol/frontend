import type { AvailableToSupply, LendingSupply } from '../../types/lending.types';

interface EarnParams {
  supplies: LendingSupply[];
  availableToSupply: AvailableToSupply[];
}

export default function Earn({ supplies, availableToSupply }: EarnParams) {
  console.log(supplies, availableToSupply);
  return <div className="w-full h-full bg-[#2C2C2C] rounded-md"></div>;
}
