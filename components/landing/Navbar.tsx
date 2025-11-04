"use client";

import { useState } from "react";
import { Menu, MenuItem, ProductItem, HoveredLink } from "../ui/navbar-menu";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

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
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <Image
              src="/images/logo/ScaleXProtocol.webp"
              alt="ScaleX Protocol Logo"
              width={40}
              height={40}
              className="h-8 w-auto md:h-10 md:w-auto transition-all duration-300 group-hover:scale-110"
              priority
            />
          </div>
          <span className="font-bold text-lg md:text-xl text-white transition-colors duration-300">
            Scale<span className="text-blue-400">X</span> Protocol
          </span>
        </Link>

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
