export default function SummaryCard() {
  return (
    <div className="bg-[#2C2C2C] rounded-md p-2 h-[281px] flex flex-col gap-2">
      <span className="text-[#E0E0E0] text-xl font-medium">Summary</span>
      <div className="flex flex-col gap-2">
        <div className="flex flex-row justify-between items-center pb-2 border-b border-[#3A3A3A]">
          <span className="text-[#A0A0A0]">Total Supplied</span>
          <span className="text-[#E0E0E0]">0</span>
        </div>
        <div className="flex flex-row justify-between items-center pb-2 border-b border-[#3A3A3A]">
          <span className="text-[#A0A0A0]">Total Borrowed</span>
          <span className="text-[#E0E0E0]">0</span>
        </div>
        <div className="flex flex-row justify-between items-center pb-2 border-b border-[#3A3A3A]">
          <span className="text-[#A0A0A0]">Total Earning</span>
          <span className="text-[#E0E0E0]">0</span>
        </div>
        <div className="flex flex-row justify-between items-center pb-2 border-b border-[#3A3A3A]">
          <span className="text-[#A0A0A0]">Net APY</span>
          <span className="text-[#E0E0E0]">0</span>
        </div>
        <div className="flex flex-row justify-between items-center pb-2 border-b border-[#3A3A3A]">
          <span className="text-[#A0A0A0]">Borrowing Power</span>
          <span className="text-[#E0E0E0]">0</span>
        </div>
        <div className="flex flex-row justify-between items-center">
          <span className="text-[#A0A0A0]">Health Factor</span>
          <span className="text-[#E0E0E0]">0</span>
        </div>
      </div>
    </div>
  );
}
