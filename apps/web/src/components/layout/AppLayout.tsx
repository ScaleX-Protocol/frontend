'use client';

import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import BottomNavigation from './BottomNavigation';

interface AppLayoutProps {
    children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
    return (
        <div className="min-h-screen bg-[#050505]">
            {/* Desktop Sidebar - hidden on mobile */}
            <div className="hidden md:block">
                <Sidebar />
            </div>

            {/* Main Content Area */}
            <main className="md:ml-[200px] min-h-screen pb-[70px] md:pb-0">
                {children}
            </main>

            {/* Mobile Bottom Navigation */}
            <BottomNavigation />
        </div>
    );
}
