'use client';

import { Search } from 'lucide-react';

interface SearchBarProps {
    className?: string;
}

export default function SearchBar({ className = '' }: SearchBarProps) {
    return (
        <div className={`relative ${className}`}>
            <div className="flex items-center bg-[#111111] border border-[#222222] rounded-full px-3 py-2 w-[512px]">
                <Search size={16} className="text-[#444444] mr-2" />
                <input
                    type="text"
                    placeholder="Search assets, pools..."
                    className="bg-transparent text-[#A0A0A0] placeholder-[#444444] text-sm outline-none flex-1"
                />
                <div className="flex items-center gap-0.5 text-[#666666] text-xs">
                    <span className="px-1.5 py-0.5 bg-[#222222] rounded text-[10px]">⌘K</span>
                </div>
            </div>
        </div>
    );
}
