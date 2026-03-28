import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface SidebarContextValue {
    isCollapsed: boolean;
    toggleCollapsed: () => void;
    setCollapsed: (value: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
        const saved = localStorage.getItem('gtx-sidebar-collapsed');
        return saved ? JSON.parse(saved) : false;
    });

    const toggleCollapsed = useCallback(() => {
        setIsCollapsed((prev) => {
            const next = !prev;
            localStorage.setItem('gtx-sidebar-collapsed', JSON.stringify(next));
            return next;
        });
    }, []);

    const setCollapsed = useCallback((value: boolean) => {
        setIsCollapsed(value);
        localStorage.setItem('gtx-sidebar-collapsed', JSON.stringify(value));
    }, []);

    return (
        <SidebarContext.Provider value={{ isCollapsed, toggleCollapsed, setCollapsed }}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar(): SidebarContextValue {
    const context = useContext(SidebarContext);
    if (!context) throw new Error('useSidebar must be used within a SidebarProvider');
    return context;
}
