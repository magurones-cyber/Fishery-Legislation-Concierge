import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { adminLinks } from "@/components/layout/nav-links";

export default function AdminPage() {
  return (
    <AppShell title="メニュー">
      <div className="space-y-3">
        {adminLinks.map((link) => (
          <Link key={link.href} href={link.href} className="block rounded-md border bg-card p-4 text-sm font-semibold active:bg-muted">
            {link.label}
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
