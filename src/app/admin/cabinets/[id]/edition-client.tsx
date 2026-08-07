"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { majCabinetAdmin, uploaderImageCabinetAdmin, retirerImageCabinetAdmin } from "../../actions";

type Cabinet = {
  id: string;
  slug: string;
  nom: string;
  adresse: string;
  ville: string;
  telephoneAffiche: string;
  horairesTexte: string;
  couleurPrimaire: string;
  couleurDouce: string;
  logoUrl: string | null;
  photoHeroUrl: string | null;
  lienAvisGoogle: string;
  iaPrenom: string;
  iaTon: string;
  smsRappelActif: boolean;
  smsForfaitMensuel: number;
};

const inputCls = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm";

export default function EditionCabinetAdmin({ cabinet }: { cabinet: Cabinet }) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [envoiLogo, setEnvoiLogo] = useState(false);
  const [envoiPhoto, setEnvoiPhoto] = useState(false);

  const [nom, setNom] = useState(cabinet.nom);
  const [adresse, setAdresse] = useState(cabinet.adresse);
  const [ville, setVille] = useState(cabinet.ville);
  const [telephoneAffiche, setTelephoneAffiche] = useState(cabinet.telephoneAffiche);
  const [horairesTexte, setHorairesTexte] = useState(cabinet.horairesTexte);
  const [couleurPrimaire, setCouleurPrimaire] = useState(cabinet.couleurPrimaire);
  const [couleurDouce, setCouleurDouce] = useState(cabinet.couleurDouce);
  const [lienAvisGoogle, setLienAvisGoogle] = useState(cabinet.lienAvisGoogle);
  const [iaPrenom, setIaPrenom] = useState(cabinet.iaPrenom);
  const [iaTon, setIaTon] = useState(cabinet.iaTon);
  const [smsRappelActif, setSmsRappelActif] = useState(cabinet.smsRappelActif);
  const [smsForfaitMensuel, setSmsForfaitMensuel] = useState(cabinet.smsForfaitMensuel);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  function enregistrer() {
    setErreur(null);
    setSavedMsg(null);
    startTransition(async () => {
      const res = await majCabinetAdmin(cabinet.id, {
        nom, adresse, ville, telephoneAffiche, horairesTexte, couleurPrimaire, couleurDouce, lienAvisGoogle, iaPrenom, iaTon, smsRappelActif, smsForfaitMensuel,
      });
      if (res.error) setErreur(res.error);
      else {
        setSavedMsg("Enregistré — déjà visible sur son site.");
        router.refresh();
      }
    });
  }

  async function surChangementFichier(e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "photo") {
    const fichier = e.target.files?.[0];
    if (!fichier) return;
    setErreur(null);
    const setEnvoi = type === "logo" ? setEnvoiLogo : setEnvoiPhoto;
    setEnvoi(true);
    const formData = new FormData();
    formData.set("type", type);
    formData.set("fichier", fichier);
    const res = await uploaderImageCabinetAdmin(cabinet.id, formData);
    setEnvoi(false);
    if (res.error) setErreur(res.error);
    else router.refresh();
    e.target.value = "";
  }

  function retirer(type: "logo" | "photo") {
    startTransition(async () => {
      const res = await retirerImageCabinetAdmin(cabinet.id, type);
      if (res.error) setErreur(res.error);
      else router.refresh();
    });
  }

  if (!ouvert) {
    return (
      <button
        onClick={() => setOuvert(true)}
        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-slate-300"
      >
        ✎ Personnaliser son site
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="font-medium text-slate-800">Personnaliser le site de {cabinet.nom}</div>
        <button onClick={() => setOuvert(false)} className="text-xs text-slate-400 hover:text-slate-600">
          Fermer
        </button>
      </div>

      {erreur && <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{erreur}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Nom du cabinet</label>
            <input value={nom} onChange={(e) => setNom(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Adresse</label>
            <input value={adresse} onChange={(e) => setAdresse(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Ville</label>
            <input value={ville} onChange={(e) => setVille(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Téléphone affiché</label>
            <input value={telephoneAffiche} onChange={(e) => setTelephoneAffiche(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Horaires (affichés sur le site)</label>
            <input value={horairesTexte} onChange={(e) => setHorairesTexte(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Lien avis Google</label>
            <input value={lienAvisGoogle} onChange={(e) => setLienAvisGoogle(e.target.value)} className={inputCls} placeholder="https://g.page/r/.../review" />
          </div>
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={smsRappelActif} onChange={(e) => setSmsRappelActif(e.target.checked)} />
              Rappel par SMS activé
            </label>
            <p className="mt-1 text-xs text-slate-500">
              Si désactivé, le patient reçoit quand même le rappel par email, mais pas par SMS — utile pour maîtriser le coût sur un cabinet à faible marge.
            </p>
            <div className="mt-3">
              <label className="mb-1 block text-xs font-medium text-slate-500">Forfait SMS inclus / mois</label>
              <select
                value={smsForfaitMensuel}
                onChange={(e) => setSmsForfaitMensuel(+e.target.value)}
                className={inputCls}
              >
                <option value={0}>0 — Email uniquement (64,99€ Site+Chatbot)</option>
                <option value={250}>250 SMS/mois (94,99€ Site+Chatbot / 199,99€ Premium)</option>
                <option value={500}>500 SMS/mois (119,99€ Site+Chatbot / 249,99€ Premium)</option>
                <option value={1000}>1000 SMS/mois (174,99€ Site+Chatbot / 279,99€ Premium)</option>
              </select>
              <p className="mt-1 text-xs text-slate-500">
                Une fois ce forfait atteint dans le mois, les rappels basculent automatiquement sur email uniquement.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Prénom de l&apos;IA</label>
              <input value={iaPrenom} onChange={(e) => setIaPrenom(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Ton</label>
              <select value={iaTon} onChange={(e) => setIaTon(e.target.value)} className={inputCls}>
                <option value="chaleureux-pro">Chaleureux et professionnel</option>
                <option value="formel">Formel</option>
                <option value="decontracte">Décontracté</option>
              </select>
            </div>
          </div>
          <div className="flex gap-6">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Couleur principale</label>
              <input type="color" value={couleurPrimaire} onChange={(e) => setCouleurPrimaire(e.target.value)} className="h-10 w-20 cursor-pointer rounded-lg border border-slate-200" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Couleur douce</label>
              <input type="color" value={couleurDouce} onChange={(e) => setCouleurDouce(e.target.value)} className="h-10 w-20 cursor-pointer rounded-lg border border-slate-200" />
            </div>
          </div>
          <button
            onClick={enregistrer}
            disabled={isPending}
            className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
            style={{ background: couleurPrimaire }}
          >
            Enregistrer
          </button>
          {savedMsg && <span className="ml-3 text-xs text-slate-400">{savedMsg}</span>}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="mb-1 text-sm font-medium text-slate-800">Logo</div>
            <div className="mt-2 flex items-center gap-3">
              {cabinet.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cabinet.logoUrl} alt="Logo" className="h-14 w-14 rounded-xl object-cover" />
              ) : (
                <span className="flex h-14 w-14 items-center justify-center rounded-xl text-lg font-bold text-white" style={{ background: couleurPrimaire }}>
                  {nom.trim().charAt(0) || "?"}
                </span>
              )}
              <button onClick={() => logoInputRef.current?.click()} disabled={envoiLogo} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:border-slate-400 disabled:opacity-40">
                {envoiLogo ? "Envoi…" : cabinet.logoUrl ? "Changer" : "Choisir"}
              </button>
              {cabinet.logoUrl && (
                <button onClick={() => retirer("logo")} className="text-xs text-slate-400 hover:text-red-600">Retirer</button>
              )}
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => surChangementFichier(e, "logo")} />
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="mb-1 text-sm font-medium text-slate-800">Photo de fond</div>
            {cabinet.photoHeroUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cabinet.photoHeroUrl} alt="Photo de fond" className="mb-3 mt-2 h-28 w-full rounded-xl object-cover" />
            )}
            <div className="mt-2 flex items-center gap-3">
              <button onClick={() => photoInputRef.current?.click()} disabled={envoiPhoto} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:border-slate-400 disabled:opacity-40">
                {envoiPhoto ? "Envoi…" : cabinet.photoHeroUrl ? "Changer" : "Choisir"}
              </button>
              {cabinet.photoHeroUrl && (
                <button onClick={() => retirer("photo")} className="text-xs text-slate-400 hover:text-red-600">Retirer</button>
              )}
              <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => surChangementFichier(e, "photo")} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
