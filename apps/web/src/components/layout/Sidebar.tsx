'use client';

import { Link, useLocation } from '@tanstack/react-router';
import { Home, ArrowRightLeft, Landmark, Droplets, Settings, HelpCircle } from 'lucide-react';

interface NavItem {
    label: string;
    path: string;
    icon: React.ReactNode;
}

const navItems: NavItem[] = [
    { label: 'Home', path: '/home', icon: <Home size={20} /> },
    { label: 'Trade', path: '/trade', icon: <ArrowRightLeft size={20} /> },
    { label: 'Lending', path: '/lending', icon: <Landmark size={20} /> },
    { label: 'Faucet', path: '/faucet', icon: <Droplets size={20} /> },
];

export default function Sidebar() {
    const { pathname } = useLocation();

    const isActive = (path: string) => {
        if (path === '/trade') {
            return pathname.startsWith('/trade');
        }
        return pathname === path;
    };

    return (
        <aside className="fixed left-0 top-0 h-screen w-[200px] bg-[#0A0A0A] border-r border-[#1A1A1A] flex flex-col z-50">
            {/* Logo */}
            <div className="p-5 flex items-center gap-2">
                <Link to="/" className="flex items-center gap-2 group">
                    <img
                        src="/images/logo/ScaleX.webp"
                        alt="ScaleX Protocol Logo"
                        width={32}
                        height={32}
                        className="h-8 w-auto transition-all duration-300 group-hover:scale-110"
                    />
                    <span className="font-bold text-lg text-[#E0E0E0]">ScaleX</span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-2">
                <ul className="space-y-1">
                    {navItems.map((item) => (
                        <li key={item.path}>
                            <Link
                                to={item.path}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${isActive(item.path)
                                        ? 'bg-[#1A1A1A] text-[#F06718] border-l-2 border-[#F06718]'
                                        : 'text-[#808080] hover:bg-[#141414] hover:text-[#A0A0A0]'
                                    }`}
                            >
                                <span className={isActive(item.path) ? 'text-[#F06718]' : ''}>
                                    {item.icon}
                                </span>
                                <span className="font-medium text-sm">{item.label}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Bottom Section */}
            <div className="p-3 space-y-3">
                {/* Help Card */}
                <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] rounded-xl p-4 border border-[#252525]">
                    <div className="flex items-center gap-2 mb-1">
                        <HelpCircle size={16} className="text-[#606060]" />
                        <span className="text-[#E0E0E0] text-sm font-medium">Need Help?</span>
                    </div>
                    <p className="text-[#606060] text-xs mb-3">Contact our support team.</p>
                    <button
                        type="button"
                        className="w-full py-2 bg-[#1A1A1A] hover:bg-[#252525] border border-[#303030] rounded-lg text-[#E0E0E0] text-sm font-medium transition-colors"
                    >
                        Support
                    </button>
                </div>

                {/* Settings Link */}
                <Link
                    to="/home"
                    className="flex items-center gap-3 px-3 py-2.5 text-[#606060] hover:text-[#A0A0A0] transition-colors"
                >
                    <Settings size={20} />
                    <span className="font-medium text-sm">Settings</span>
                </Link>
            </div>
        </aside>
    );
}
