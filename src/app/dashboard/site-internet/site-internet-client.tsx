"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { majApparence, uploaderImage, retirerImage } from "./actions";

type Cabinet = {
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
};

export default function SiteInternetClient({
  cabinet,
  lienSite,
  qrSvg,
}: {
  cabinet: Cabinet;
  lienSite: string;
  qrSvg: string;
}) {
  const router = useRouter();
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

  const logoInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  function enregistrer() {
    setErreur(null);
    setSavedMsg(null);
    startTransition(async () => {
      const res = await majApparence({
        nom,
        adresse,
        ville,
        telephoneAffiche,
        horairesTexte,
        couleurPrimaire,
        couleurDouce,
        lienAvisGoogle,
      });
      if (res.error) setErreur(res.error);
      else {
        setSavedMsg("Enregistré — déjà visible sur le site.");
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
    const res = await uploaderImage(formData);
    setEnvoi(false);
    if (res.error) setErreur(res.error);
    else router.refresh();
    e.target.value = "";
  }

  function retirer(type: "logo" | "photo") {
    startTransition(async () => {
      const res = await retirerImage(type);
      if (res.error) setErreur(res.error);
      else router.refresh();
    });
  }

  const inputCls = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {erreur && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700 lg:col-span-2">{erreur}</div>}

      <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600 lg:col-span-2">
        Votre site public :{" "}
        <a href={`/${cabinet.slug}`} target="_blank" rel="noreferrer" className="font-medium underline" style={{ color: couleurPrimaire }}>
          /{cabinet.slug}
        </a>{" "}
        — tout changement ci-dessous y est visible immédiatement, sans rien publier.
      </div>

      <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white p-5 text-center lg:col-span-2 sm:flex-row sm:text-left">
        <div
          className="h-28 w-28 flex-shrink-0 [&_svg]:h-full [&_svg]:w-full"
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />
        <div className="flex-1">
          <div className="font-medium text-slate-800">QR code de votre site</div>
          <p className="mt-1 text-xs text-slate-500">
            À coller sur une affiche, votre comptoir ou votre carte de visite : vos patients scannent et réservent directement.
          </p>
          <p className="mt-1 break-all text-[11px] text-slate-400">{lienSite}</p>
          <a
            href={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrSvg)}`}
            download={`qr-code-${cabinet.slug}.svg`}
            className="mt-2 inline-block text-xs font-medium underline"
            style={{ color: couleurPrimaire }}
          >
            Télécharger le QR code
          </a>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 font-medium text-slate-800">Identité et coordonnées</div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Nom du cabinet</label>
          <input value={nom} onChange={(e) => setNom(e.target.value)} className={inputCls + " mb-3"} />
          <label className="mb-1 block text-xs font-medium text-slate-500">Adresse</label>
          <input value={adresse} onChange={(e) => setAdresse(e.target.value)} className={inputCls + " mb-3"} />
          <label className="mb-1 block text-xs font-medium text-slate-500">Ville</label>
          <input value={ville} onChange={(e) => setVille(e.target.value)} className={inputCls + " mb-3"} />
          <label className="mb-1 block text-xs font-medium text-slate-500">Téléphone affiché</label>
          <input value={telephoneAffiche} onChange={(e) => setTelephoneAffiche(e.target.value)} className={inputCls + " mb-3"} />
          <label className="mb-1 block text-xs font-medium text-slate-500">Horaires (affichés sur le site)</label>
          <input value={horairesTexte} onChange={(e) => setHorairesTexte(e.target.value)} className={inputCls} />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
          <div className="mb-1 font-medium text-slate-800">Avis Google</div>
          <p className="mb-3 text-xs text-slate-500">
            Une fois ta fiche Google Business créée (gratuit), colle ici ton lien d&apos;avis — chaque patient reçoit
            automatiquement une demande d&apos;avis après son rendez-vous.
          </p>
          <input
            value={lienAvisGoogle}
            onChange={(e) => setLienAvisGoogle(e.target.value)}
            className={inputCls}
            placeholder="https://g.page/r/.../review"
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 font-medium text-slate-800">Couleurs</div>
          <div className="flex gap-6">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Couleur principale</label>
              <input
                type="color"
                value={couleurPrimaire}
                onChange={(e) => setCouleurPrimaire(e.target.value)}
                className="h-10 w-20 cursor-pointer rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Couleur douce (fond)</label>
              <input
                type="color"
                value={couleurDouce}
                onChange={(e) => setCouleurDouce(e.target.value)}
                className="h-10 w-20 cursor-pointer rounded-lg border border-slate-200"
              />
            </div>
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
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-1 font-medium text-slate-800">Logo</div>
          <p className="mb-3 text-xs text-slate-500">Affiché dans l&apos;en-tête de votre site.</p>
          <div className="flex items-center gap-3">
            {cabinet.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cabinet.logoUrl} alt="Logo" className="h-14 w-14 rounded-xl object-cover" />
            ) : (
              <span
                className="flex h-14 w-14 items-center justify-center rounded-xl text-lg font-bold text-white"
                style={{ background: couleurPrimaire }}
              >
                {nom.trim().charAt(0) || "?"}
              </span>
            )}
            <button
              onClick={() => logoInputRef.current?.click()}
              disabled={envoiLogo}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:border-slate-400 disabled:opacity-40"
            >
              {envoiLogo ? "Envoi…" : cabinet.logoUrl ? "Changer le logo" : "Choisir un logo"}
            </button>
            {cabinet.logoUrl && (
              <button onClick={() => retirer("logo")} className="text-xs text-slate-400 hover:text-red-600">
                Retirer
              </button>
            )}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => surChangementFichier(e, "logo")}
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-1 font-medium text-slate-800">Photo de fond (page d&apos;accueil)</div>
          <p className="mb-3 text-xs text-slate-500">Un voile sombre est ajouté automatiquement pour la lisibilité du texte.</p>
          {cabinet.photoHeroUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cabinet.photoHeroUrl} alt="Photo de fond" className="mb-3 h-32 w-full rounded-xl object-cover" />
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={() => photoInputRef.current?.click()}
              disabled={envoiPhoto}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:border-slate-400 disabled:opacity-40"
            >
              {envoiPhoto ? "Envoi…" : cabinet.photoHeroUrl ? "Changer la photo" : "Choisir une photo"}
            </button>
            {cabinet.photoHeroUrl && (
              <button onClick={() => retirer("photo")} className="text-xs text-slate-400 hover:text-red-600">
                Retirer
              </button>
            )}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => surChangementFichier(e, "photo")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
