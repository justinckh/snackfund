"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Scan, Search, Zap, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/scan", label: "Scan", icon: Scan },
  { href: "/search", label: "Search", icon: Search },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Zap className="h-4 w-4" />
          </span>
          <span>
            Snack<span className="text-primary">Fund</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}

          {/* Add Product — distinct style */}
          <Link
            href="/add"
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname === "/add"
                ? "bg-primary text-primary-foreground"
                : "text-primary hover:bg-primary/10"
            )}
          >
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Add Product</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
