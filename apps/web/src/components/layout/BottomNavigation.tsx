'use client';

import { Link, useLocation } from '@tanstack/react-router';
import { LayoutGrid, ArrowRightLeft, Landmark, Droplets, Bot, Trophy, MoreHorizontal, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface NavItem {
    label: string;
    path: string;
    icon: React.ReactNode;
}

const navItems: NavItem[] = [
    { label: 'Overview', path: '/overview', icon: <LayoutGrid size={22} /> },
    { label: 'Trade', path: '/trade', icon: <ArrowRightLeft size={22} /> },
    { label: 'Lending', path: '/lending', icon: <Landmark size={22} /> },
    { label: 'Agents', path: '/agents', icon: <Bot size={22} /> },
    { label: 'Leaderboard', path: '/leaderboard', icon: <Trophy size={22} /> },
    // { label: 'Faucet', path: '/faucet', icon: <Droplets size={22} /> },
];

const moreItems: NavItem[] = [
    { label: 'Agents', path: '/agents', icon: <Bot size={22} /> },
    { label: 'Leaderboard', path: '/leaderboard', icon: <Trophy size={22} /> },
    { label: 'Faucet', path: '/faucet', icon: <Droplets size={22} /> },
];

export default function BottomNavigation() {
    const { pathname } = useLocation();
    const [moreOpen, setMoreOpen] = useState(false);

    // Close "More" panel when route changes
    useEffect(() => {
        setMoreOpen(false);
    }, [pathname]);

    const isActive = (path: string) => {
        if (path === '/trade') return pathname.startsWith('/trade');
        if (path === '/agents') return pathname.startsWith('/agents');
        return pathname === path;
    };

    const isMoreActive = moreItems.some((item) => isActive(item.path));

    return (
        <>
            {/* More panel — slides up above the nav bar */}
            {moreOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40 md:hidden"
                        onClick={() => setMoreOpen(false)}
                    />
                    {/* Panel */}
                    <div className="fixed bottom-[70px] left-0 right-0 z-50 md:hidden bg-[#0A0A0A] border-t border-[#1A1A1A] px-4 py-3">
                        <div className="flex justify-around">
                            {moreItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className="flex flex-col items-center gap-1 py-2 px-4"
                                >
                                    <div className="relative">
                                        <span
                                            className={`transition-colors duration-200 ${isActive(item.path) ? 'text-[#F06718]' : 'text-[#606060]'}`}
                                        >
                                            {item.icon}
                                        </span>
                                        {isActive(item.path) && (
                                            <div className="absolute -top-1 right-0 w-1 h-1 rounded-full bg-[#F06718]" />
                                        )}
                                    </div>
                                    <span
                                        className={`text-xs font-medium transition-colors duration-200 ${isActive(item.path) ? 'text-[#F06718]' : 'text-[#606060]'}`}
                                    >
                                        {item.label}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* Bottom nav bar */}
            <nav className="fixed bottom-0 left-0 right-0 h-[70px] bg-[#0A0A0A] border-t border-[#1A1A1A] flex items-center justify-around z-50 md:hidden">
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className="flex flex-col items-center gap-1 py-2 px-4"
                    >
                        <div className="relative">
                            <span
                                className={`transition-colors duration-200 ${isActive(item.path) ? 'text-[#F06718]' : 'text-[#606060]'}`}
                            >
                                {item.icon}
                            </span>
                            {isActive(item.path) && (
                                <div className="absolute -top-1 right-0 w-1 h-1 rounded-full bg-[#F06718]" />
                            )}
                        </div>
                        <span
                            className={`text-xs font-medium transition-colors duration-200 ${isActive(item.path) ? 'text-[#F06718]' : 'text-[#606060]'}`}
                        >
                            {item.label}
                        </span>
                    </Link>
                ))}

                {/* More button */}
                {/* <button
                    type="button"
                    onClick={() => setMoreOpen((v) => !v)}
                    className="flex flex-col items-center gap-1 py-2 px-4"
                >
                    <span className={`transition-colors duration-200 ${isMoreActive || moreOpen ? 'text-[#F06718]' : 'text-[#606060]'}`}>
                        {moreOpen ? <X size={22} /> : <MoreHorizontal size={22} />}
                    </span>
                    <span className={`text-xs font-medium transition-colors duration-200 ${isMoreActive || moreOpen ? 'text-[#F06718]' : 'text-[#606060]'}`}>
                        More
                    </span>
                </button> */}
            </nav>
        </>
    );
}
