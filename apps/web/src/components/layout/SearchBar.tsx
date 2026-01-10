'use client';

import { Search } from 'lucide-react';

interface SearchBarProps {
    className?: string;
}

export default function SearchBar({ className = '' }: SearchBarProps) {
    return (
        <div className={`relative ${className}`}>
            <div className="flex items-center bg-[#141414] border border-[#252525] rounded-lg px-3 py-2 w-[280px]">
                <Search size={16} className="text-[#505050] mr-2" />
                <input
                    type="text"
                    placeholder="Search assets, pools..."
                    className="bg-transparent text-[#A0A0A0] placeholder-[#505050] text-sm outline-none flex-1"
                />
                <div className="flex items-center gap-0.5 text-[#404040] text-xs">
                    <span className="px-1.5 py-0.5 bg-[#1A1A1A] rounded text-[10px] border border-[#303030]">⌘K</span>
                </div>
            </div>
        </div>
    );
}
