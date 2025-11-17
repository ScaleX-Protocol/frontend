import type { AvailableToBorrow, LendingBorrow } from '../../types/lending.types';

interface BorrowParams {
  borrows: LendingBorrow[];
  availableToBorrow: AvailableToBorrow[];
}

export default function Borrow({ borrows, availableToBorrow }: BorrowParams) {
  console.log(borrows, availableToBorrow);
  return <div className="w-full h-full bg-[#2C2C2C] rounded-md"></div>;
}
