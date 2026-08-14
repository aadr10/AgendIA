export function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div
        className="mt-1 text-3xl font-semibold"
        style={{ color: accent || "#16232A" }}
      >
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

export function Toggle({
  label,
  desc,
  on,
  onChange,
  onColor = "#0E5E63",
}: {
  label: string;
  desc: string;
  on: boolean;
  onChange: () => void;
  onColor?: string;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="flex w-full items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3 text-left"
    >
      <div>
        <div className="text-sm font-medium text-slate-800">{label}</div>
        <div className="text-xs text-slate-500">{desc}</div>
      </div>
      <div
        className="h-6 w-11 flex-shrink-0 rounded-full p-1 transition-colors"
        style={{ background: on ? onColor : "#CBD5E1" }}
      >
        <div
          className="h-4 w-4 rounded-full bg-white transition-transform"
          style={{ transform: on ? "translateX(20px)" : "translateX(0)" }}
        />
      </div>
    </button>
  );
}

const BADGE_MAP: Record<string, [string, string]> = {
  confirme: ["#E3F2EC", "#0E5E63"],
  annule: ["#FBE7E4", "#9C3325"],
  deplace: ["#FBF0DF", "#8A5A16"],
  termine: ["#EAEEF2", "#40515C"],
  absent: ["#FBE7E4", "#9C3325"],
  rdv_cree: ["#E3F2EC", "#0E5E63"],
  info: ["#EAEEF2", "#40515C"],
  transfert: ["#EAEEF2", "#40515C"],
};

export function badgeStyle(statut: string) {
  const [bg, fg] = BADGE_MAP[statut] || BADGE_MAP.info;
  return { background: bg, color: fg };
}

export const STATUT_LABELS: Record<string, string> = {
  confirme: "Confirmé",
  annule: "Annulé",
  deplace: "Déplacé",
  termine: "Terminé",
  absent: "Absent",
  rdv_cree: "RDV créé",
  info: "Info donnée",
  transfert: "Transfert",
};

export const ORIGINE_LABELS: Record<string, string> = {
  ia_telephone: "IA",
  site: "Site",
  chat: "Chat",
  manuel: "Manuel",
};

export const ORIGINE_COLORS: Record<string, string> = {
  ia_telephone: "#0E5E63",
  site: "#8A5A16",
  chat: "#0E5E63",
  manuel: "#40515C",
};
