"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLinks({
  nav,
}: {
  nav: { label: string; href: string }[];
}) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {nav.map((n) => {
        const active = pathname === n.href;
        return (
          <Link
            key={n.href}
            href={n.href}
            className="block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors"
            style={
              active
                ? { background: "#0E5E63", color: "#fff", fontWeight: 500 }
                : { color: "#475569" }
            }
          >
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
