"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { uploaderPhotoPraticienAdmin, retirerPhotoPraticienAdmin } from "../../actions";

export default function PraticienPhotoAdmin({
  cabinetId,
  praticienId,
  nom,
  photoUrl,
}: {
  cabinetId: string;
  praticienId: string;
  nom: string;
  photoUrl: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function surChangementFichier(e: React.ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0];
    if (!fichier) return;
    setErreur(null);
    setEnvoi(true);
    const formData = new FormData();
    formData.append("fichier", fichier);
    const res = await uploaderPhotoPraticienAdmin(cabinetId, praticienId, formData);
    setEnvoi(false);
    if (res.error) setErreur(res.error);
    else router.refresh();
    if (inputRef.current) inputRef.current.value = "";
  }

  async function retirer() {
    setEnvoi(true);
    await retirerPhotoPraticienAdmin(cabinetId, praticienId);
    setEnvoi(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt={nom} className="h-8 w-8 flex-shrink-0 rounded-full object-cover" />
      ) : (
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-500">
          {nom.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2)}
        </span>
      )}
      <button onClick={() => inputRef.current?.click()} disabled={envoi} className="text-xs text-slate-400 hover:text-slate-700 disabled:opacity-40">
        {envoi ? "Envoi…" : photoUrl ? "Changer" : "+ Photo"}
      </button>
      {photoUrl && (
        <button onClick={retirer} disabled={envoi} className="text-xs text-slate-400 hover:text-red-600">
          Retirer
        </button>
      )}
      {erreur && <span className="text-xs text-red-600">{erreur}</span>}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={surChangementFichier} />
    </div>
  );
}
