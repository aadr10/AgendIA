"use client";

import { useRouter, usePathname } from "next/navigation";

export default function MobileNav({
  nav,
}: {
  nav: { label: string; href: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <select
      value={pathname}
      onChange={(e) => router.push(e.target.value)}
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
    >
      {nav.map((n) => (
        <option key={n.href} value={n.href}>
          {n.label}
        </option>
      ))}
    </select>
  );
}
