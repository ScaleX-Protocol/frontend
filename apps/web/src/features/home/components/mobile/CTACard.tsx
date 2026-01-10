'use client';

import { ReactNode } from 'react';

interface CTACardProps {
    icon: ReactNode;
    title: string;
    description: string;
    buttonText: string;
    onButtonClick: () => void;
}

export default function CTACard({ icon, title, description, buttonText, onButtonClick }: CTACardProps) {
    return (
        <div className="bg-[#0F0F0F] rounded-2xl p-5 border border-[#1A1A1A] flex flex-col items-center text-center">
            {/* Icon */}
            <div className="w-12 h-12 rounded-2xl bg-[#141414] border border-[#1F1F1F] flex items-center justify-center mb-4">
                {icon}
            </div>

            {/* Title */}
            <h3 className="text-[#E0E0E0] font-medium text-base mb-2">{title}</h3>

            {/* Description */}
            <p className="text-[#505050] text-sm mb-4 leading-relaxed">{description}</p>

            {/* Action Button */}
            <button
                type="button"
                onClick={onButtonClick}
                className="w-full py-2.5 bg-[#141414] hover:bg-[#1A1A1A] border border-[#252525] rounded-full text-[#E0E0E0] text-sm font-medium transition-colors"
            >
                {buttonText}
            </button>
        </div>
    );
}
