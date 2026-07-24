import NouveauCabinetClient from "./nouveau-client";

export default function NouveauCabinetPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Créer un nouveau cabinet</h1>
      <NouveauCabinetClient />
    </div>
  );
}
