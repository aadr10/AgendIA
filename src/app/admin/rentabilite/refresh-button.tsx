"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export default function BoutonRafraichir() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [fait, setFait] = useState(false);

  function rafraichir() {
    setFait(false);
    startTransition(() => {
      router.refresh();
      setFait(true);
      setTimeout(() => setFait(false), 1500);
    });
  }

  return (
    <button
      onClick={rafraichir}
      disabled={isPending}
      className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-300 disabled:opacity-50"
    >
      {isPending ? "Actualisation…" : fait ? "✓ À jour" : "↻ Actualiser"}
    </button>
  );
}
