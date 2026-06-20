"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { menuLinks } from "@/components/layout/nav-links";

export function BottomNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const links = menuLinks.map((item) =>
    item.href === "/admin" && !isAdmin ? { ...item, href: "/favorites", label: "お気に入り" } : item
  );

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/96 pb-[env(safe-area-inset-bottom)] shadow-lg backdrop-blur">
      <div className="mx-auto grid h-16 max-w-3xl grid-cols-5">
        {links.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-xs font-medium",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
