"use client";

import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutGrid,
  ArrowRightLeft,
  Landmark,
  Droplets,
  Bot,
  Settings,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Wallet,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import { useSidebar } from "@/providers/SidebarContext";
import { Tooltip } from "@/components/ui/tooltip";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: "Overview", path: "/overview", icon: <LayoutGrid size={20} /> },
  { label: "Portfolio", path: "/portfolio", icon: <Wallet size={20} /> },
  { label: "Trade", path: "/trade", icon: <ArrowRightLeft size={20} /> },
  { label: "Lending", path: "/lending", icon: <Landmark size={20} /> },
  { label: "Predictions", path: "/predictions", icon: <TrendingUp size={20} /> },
  { label: "Agents", path: "/agents", icon: <Bot size={20} /> },
  { label: "Leaderboard", path: "/leaderboard", icon: <Trophy size={20} /> },
  { label: "Faucet", path: "/faucet", icon: <Droplets size={20} /> },
];

export default function Sidebar() {
  const { pathname } = useLocation();
  const { isCollapsed, toggleCollapsed } = useSidebar();

  const isActive = (path: string) => {
    if (path === "/trade") {
      return pathname.startsWith("/trade");
    }
    if (path === "/agents") {
      return pathname.startsWith("/agents");
    }
    if (path === "/portfolio") {
      return pathname === "/portfolio";
    }
    return pathname === path;
  };

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 70 : 256 }}
      initial={{ width: isCollapsed ? 70 : 256 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed left-0 top-0 h-screen bg-[#000000] border-r border-[#1F1F1F] flex flex-col z-50 overflow-hidden"
    >
      {/* Logo */}
      <div className="px-3 h-[64px] flex items-center justify-between shrink-0">
        <Link to="/" className="flex items-center gap-2 group min-w-8">
          <img
            src="/images/logo/ScaleX-Logo.png"
            alt="ScaleX Protocol Logo"
            width={32}
            height={32}
            className="h-8 w-auto shrink-0 transition-all duration-300 group-hover:scale-110"
          />
          {!isCollapsed && (
            <span className="font-bold text-lg text-[#E0E0E0] whitespace-nowrap">
              ScaleX
            </span>
          )}
        </Link>
        <button
          type="button"
          onClick={toggleCollapsed}
          className="shrink-0 p-1 text-[#606060] hover:text-[#A0A0A0] transition-colors rounded"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 w-fit px-3 py-6">
        <ul className="space-y-1 w-fit">
          {navItems.map((item, index) => (
            <li key={item.path} data-tour-step={index + 1}>
              <Tooltip content={item.label} side="right">
                <Link
                  to={item.path}
                  className={`w-full min-w-[46px] flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                    isActive(item.path)
                      ? "bg-[#161616] text-[#FFFFFF] border border-[#222222]"
                      : "text-[#808080] hover:bg-[#141414] hover:text-[#A0A0A0]"
                  }`}
                >
                  <span
                    className={`shrink-0 ${
                      isActive(item.path) ? "text-[#F06718]" : "text-[#808080]"
                    }`}
                  >
                    {item.icon}
                  </span>
                  {!isCollapsed && (
                    <span className="font-medium text-sm whitespace-nowrap">
                      {item.label}
                    </span>
                  )}
                </Link>
              </Tooltip>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="p-3 space-y-3">
        {/* Help Card — hidden when collapsed */}
        {!isCollapsed && (
          <div className="bg-linear-to-b from-[#111111] to-[#000000] rounded-[12px] p-4 border border-[#1F1F1F]">
            <span className="text-[#FFFFFF] text-sm leading-[20px] font-semibold">
              Need Help?
            </span>
            <p className="text-[#666666] leading-[16px] text-xs mb-3">
              Contact our support team.
            </p>
            <button
              type="button"
              className="w-full py-2 bg-[#FFFFFF] hover:bg-[#F0F0F0] rounded-[8px] text-[#000000] text-xs leading-[16px] font-semibold transition-colors"
            >
              Support
            </button>
          </div>
        )}

        {/* Settings Link */}
        <Tooltip content="Settings" side="right">
          <Link
            to="/overview"
            className="flex items-center gap-3 px-3 py-2.5 text-[#606060] hover:text-[#A0A0A0] transition-colors"
          >
            <span className="shrink-0">
              <Settings size={20} />
            </span>
            {!isCollapsed && (
              <span className="font-medium text-sm whitespace-nowrap">
                Settings
              </span>
            )}
          </Link>
        </Tooltip>
      </div>
    </motion.aside>
  );
}
