"use client";

import { useState } from "react";
import { Menu, MenuItem, ProductItem, HoveredLink } from "../ui/navbar-menu";
import { cn } from "@/lib/utils";

export default function Navbar({ className }: { className?: string }) {
  const [active, setActive] = useState<string | null>(null);

  return (
    <div
      className={cn(
        "fixed top-10 inset-x-0 max-w-6xl px-2 mx-auto z-50",
        className
      )}
    >
      <Menu setActive={setActive}>
        <a href="/" className="flex items-center">
          {/* Replace with your logo */}
          {/* <img 
            src="/your-logo.png" 
            alt="Logo" 
            className="h-8 w-8 md:h-10 md:w-10"
          /> */}
          {/* Text logo */}
          <span className="font-bold text-xl text-white">
            ScaleX Protocol
          </span>
        </a>

        <div className="flex items-center space-x-4">
          <MenuItem setActive={setActive} active={active} item="Menu">
            {/* Desktop: Product Items in grid */}
            <div className="hidden md:block text-sm">
              <div className="grid grid-cols-2 gap-10 p-4">
                <ProductItem
                  title="Docs"
                  href="#"
                  src="/docs-mockup.png"
                  description="Learn Why Order Book DEX is the Perfect Choice for Lending Protocols."
                />
                <ProductItem
                  title="Join Waitlist"
                  href="/waitlist"
                  src="/waitlist-page.png"
                  description="Be the first user to generate yield while trading."
                />
              </div>
            </div>

            {/* Mobile: Simple links */}
            <div className="md:hidden flex flex-col space-y-4 p-4 items-start min-w-[150px]">
              <HoveredLink href="#">Docs</HoveredLink>
              <HoveredLink href="/waitlist">Join Waitlist</HoveredLink>
            </div>
          </MenuItem>
        </div>
      </Menu>
    </div>
  );
}
