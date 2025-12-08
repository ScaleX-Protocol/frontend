import { Search } from "lucide-react";
import { useState } from "react";

export default function SheetContentHistory() {
    const [searchHistory, setSearchHistory] = useState('');
    
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-row gap-2 px-3 py-2 rounded-md border border-[#E0E0E0]/20">
        <Search size={20} className="text-[#E0E0E0]" />
        <input
          type="text"
          placeholder="Search History"
          value={searchHistory}
          onChange={(e) => setSearchHistory(e.target.value)}
          className="text-[#E0E0E0] placeholder:text-[#E0E0E0]/70 bg-transparent outline-none"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#3C3C3C]">
              <th className="text-left py-2 px-2 text-sm font-medium text-[#A0A0A0]">Type</th>
              <th className="text-right py-2 px-2 text-sm font-medium text-[#A0A0A0]">Amount</th>
              <th className="text-right py-2 px-2 text-sm font-medium text-[#A0A0A0]">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={3} className="py-8 px-2 text-center text-sm text-[#A0A0A0]">
                No History Found
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
