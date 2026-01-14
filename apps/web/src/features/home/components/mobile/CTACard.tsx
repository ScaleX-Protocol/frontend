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
        <div className="bg-[#0C0C0C] p-6 rounded-[24px] border border-[#1F1F1F] flex flex-col items-center text-center">
            {/* Icon */}
            <div className="w-12 h-12 rounded-2xl bg-[#161616] border border-[#222222] flex items-center justify-center mb-4">
                {icon}
            </div>

            {/* Title */}
            <h3 className="text-[#FFFFFF] font-semibold text-base leading-[24px] mb-2">{title}</h3>

            {/* Description */}
            <p className="text-[#666666] text-xs mb-4 leading-[20px]">{description}</p>

            {/* Action Button */}
            <button
                type="button"
                onClick={onButtonClick}
                className="w-full py-3 bg-[#161616] hover:bg-[#1A1A1A] border border-[#333333] rounded-[12px] text-[#FFFFFF] text-xs font-semibold leading-[16px] transition-colors"
            >
                {buttonText}
            </button>
        </div>
    );
}
