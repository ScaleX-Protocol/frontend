'use client';

import { Link, useLocation } from '@tanstack/react-router';
import { LayoutGrid, ArrowRightLeft, Landmark, Droplets } from 'lucide-react';

interface NavItem {
    label: string;
    path: string;
    icon: React.ReactNode;
}

const navItems: NavItem[] = [
    { label: 'Overview', path: '/overview', icon: <LayoutGrid size={22} /> },
    { label: 'Trade', path: '/trade', icon: <ArrowRightLeft size={22} /> },
    { label: 'Lending', path: '/lending', icon: <Landmark size={22} /> },
    { label: 'Faucet', path: '/faucet', icon: <Droplets size={22} /> },
];

export default function BottomNavigation() {
    const { pathname } = useLocation();

    const isActive = (path: string) => {
        if (path === '/trade') {
            return pathname.startsWith('/trade');
        }
        return pathname === path;
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-[70px] bg-[#0A0A0A] border-t border-[#1A1A1A] flex items-center justify-around z-50 md:hidden">
            {navItems.map((item) => (
                <Link
                    key={item.path}
                    to={item.path}
                    className="flex flex-col items-center gap-1 py-2 px-4"
                >
                    <div className="relative">
                        <span
                            className={`transition-colors duration-200 ${isActive(item.path) ? 'text-[#F06718]' : 'text-[#606060]'
                                }`}
                        >
                            {item.icon}
                        </span>
                        {isActive(item.path) && (
                            <div className="absolute -top-1 right-0 w-1 h-1 rounded-full bg-[#F06718]" />
                        )}
                    </div>
                    <span
                        className={`text-xs font-medium transition-colors duration-200 ${isActive(item.path) ? 'text-[#F06718]' : 'text-[#606060]'
                            }`}
                    >
                        {item.label}
                    </span>
                </Link>
            ))}
        </nav>
    );
}
