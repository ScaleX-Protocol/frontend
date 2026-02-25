'use client';

import { type ReactNode, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import BottomNavigation from './BottomNavigation';
import TickerBar from './TickerBar';
import { SidebarProvider, useSidebar } from '@/providers/SidebarContext';
import AppHeader from '@/components/appHeader';

interface AppLayoutProps {
    children: ReactNode;
}

function AppLayoutInner({ children }: AppLayoutProps) {
    const { isCollapsed } = useSidebar();
    const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 768);

    useEffect(() => {
        const mq = window.matchMedia('(min-width: 768px)');
        const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    const marginLeft = isDesktop ? (isCollapsed ? 64 : 256) : 0;

    return (
        <div className="min-h-screen bg-[#050505]">
            {/* Desktop Sidebar - hidden on mobile */}
            <div className="hidden md:block">
                <Sidebar />
            </div>

            {/* Main Content Area */}
            <motion.main
                animate={{ marginLeft }}
                initial={{ marginLeft }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="min-h-screen pb-[70px] md:pb-0"
            >
                <AppHeader />
                <TickerBar />
                {children}
            </motion.main>

            {/* Mobile Bottom Navigation */}
            <BottomNavigation />
        </div>
    );
}

export default function AppLayout({ children }: AppLayoutProps) {
    return (
        <SidebarProvider>
            <AppLayoutInner>{children}</AppLayoutInner>
        </SidebarProvider>
    );
}
