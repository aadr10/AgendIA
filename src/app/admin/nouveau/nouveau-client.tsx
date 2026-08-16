"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { creerCabinet, qrCodeCabinet, uploaderImageCabinetAdmin, uploaderPhotoPraticienAdmin } from "../actions";
import { METIERS, metierConfig } from "@/lib/metiers";
import { type Offre, OFFRE_LABEL, OFFRE_DESCRIPTION, PALIERS_SMS } from "@/lib/offres";

const inputCls = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm";
// Variante sans "w-full" pour les champs placés dans une rangée flex (sinon
// "w-full" (width: 100%) entre en conflit avec "flex-1"/largeur fixe et un des
// champs se retrouve écrasé à quelques pixels de large, invisible malgré une
// vraie valeur à l'intérieur — voir la ligne "Prestations" du formulaire.
const inputClsFlex = "rounded-lg border border-slate-200 px-3 py-2 text-sm";

export default function NouveauCabinetClient() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<{ slug: string; cabinetId?: string; numeroTwilio?: string | null; lienEspacePraticien?: string | null; lienPaiement?: string | null } | null>(null);
  const [copie, setCopie] = useState<string | null>(null);

  function copier(texte: string, cle: string) {
    navigator.clipboard.writeText(texte);
    setCopie(cle);
    setTimeout(() => setCopie(null), 1500);
  }
  const [qr, setQr] = useState<{ svg: string; lien: string } | null>(null);

  useEffect(() => {
    if (!succes) return;
    qrCodeCabinet(succes.slug).then(setQr);
  }, [succes]);

  const [nom, setNom] = useState("");
  const [metier, setMetier] = useState("kine");
  const [ville, setVille] = useState("");
  const [adresse, setAdresse] = useState("");
  const [telephoneAffiche, setTelephoneAffiche] = useState("");
  const [couleurPrimaire, setCouleurPrimaire] = useState("#0E5E63");
  const [couleurDouce, setCouleurDouce] = useState("#F2F7F6");
  const [emailAdmin, setEmailAdmin] = useState("");
  const [lienAvisGoogle, setLienAvisGoogle] = useState("");

  const [praticiens, setPraticiens] = useState<{ nom: string; role: string; photo: File | null }[]>([{ nom: "", role: "", photo: null }]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [envoiPhotos, setEnvoiPhotos] = useState(false);
  const [prestations, setPrestations] = useState(metierConfig("kine").prestations);
  const [faq, setFaq] = useState([{ question: "", reponse: "" }]);

  const [iaPrenom, setIaPrenom] = useState("Sofia");
  const [iaTon, setIaTon] = useState("chaleureux-pro");
  const [horairesTexte, setHorairesTexte] = useState("Lun-Ven 8h-18h");
  const [delaiMinReservationHeures, setDelaiMinReservationHeures] = useState(2);
  const [delaiAnnulationHeures, setDelaiAnnulationHeures] = useState(24);
  const [accepteNouveauxPatients, setAccepteNouveauxPatients] = useState(true);
  const [offre, setOffre] = useState<Offre>("site");
  const [smsForfaitMensuel, setSmsForfaitMensuel] = useState(250);
  const [activerPaiementStripe, setActiverPaiementStripe] = useState(false);

  // Certaines offres n'ont pas les mêmes paliers (ex: "site" a un palier 0 SMS
  // que les autres n'ont pas) — en changeant d'offre, on retombe sur le premier
  // palier valide plutôt que de garder une valeur qui n'existe plus pour elle.
  function changerOffre(nouvelleOffre: Offre) {
    setOffre(nouvelleOffre);
    if (!PALIERS_SMS[nouvelleOffre].some((p) => p.sms === smsForfaitMensuel)) {
      setSmsForfaitMensuel(PALIERS_SMS[nouvelleOffre][0].sms);
    }
  }

  function changerMetier(nouveauMetier: string) {
    setMetier(nouveauMetier);
    setPrestations(metierConfig(nouveauMetier).prestations);
  }

  function creer() {
    setErreur(null);
    startTransition(async () => {
      const res = await creerCabinet({
        nom,
        metier,
        ville,
        adresse,
        telephoneAffiche,
        couleurPrimaire,
        couleurDouce,
        emailAdmin,
        lienAvisGoogle,
        iaPrenom,
        iaTon,
        iaMessageAccueil: metierConfig(metier).accueil(nom, iaPrenom),
        horairesTexte,
        praticiens: praticiens.map((p) => ({ nom: p.nom, role: p.role })),
        prestations,
        faq,
        delaiMinReservationHeures,
        delaiAnnulationHeures,
        accepteNouveauxPatients,
        offre,
        smsForfaitMensuel,
        activerPaiementStripe,
      });
      if (res.error) {
        setErreur(res.error);
        return;
      }

      // Les photos ne peuvent être envoyées qu'une fois le cabinet (et ses
      // praticiens) réellement créés en base — on les envoie juste après,
      // avant d'afficher l'écran de succès.
      if (res.cabinetId) {
        setEnvoiPhotos(true);
        if (logoFile) {
          const fd = new FormData();
          fd.append("type", "logo");
          fd.append("fichier", logoFile);
          await uploaderImageCabinetAdmin(res.cabinetId, fd);
        }
        if (photoFile) {
          const fd = new FormData();
          fd.append("type", "photo");
          fd.append("fichier", photoFile);
          await uploaderImageCabinetAdmin(res.cabinetId, fd);
        }
        const praticiensAvecId = praticiens.filter((p) => p.nom.trim());
        for (let i = 0; i < praticiensAvecId.length; i++) {
          const photo = praticiensAvecId[i].photo;
          const praticienId = res.praticiens?.[i]?.id;
          if (photo && praticienId) {
            const fd = new FormData();
            fd.append("fichier", photo);
            await uploaderPhotoPraticienAdmin(res.cabinetId, praticienId, fd);
          }
        }
        setEnvoiPhotos(false);
      }

      setSucces({ slug: res.slug!, cabinetId: res.cabinetId, numeroTwilio: res.numeroTwilio, lienEspacePraticien: res.lienEspacePraticien, lienPaiement: res.lienPaiement });
      router.refresh();
    });
  }

  if (succes) {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const lienSite = `${base}/${succes.slug}`;

    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-3 text-lg font-semibold text-emerald-700">Cabinet créé avec succès ✅</div>
        {succes.numeroTwilio && <p className="mb-3 text-sm text-slate-600">Numéro attribué : {succes.numeroTwilio}</p>}

        <div className="space-y-3">
          <div className="rounded-lg border border-slate-200 p-3">
            <div className="text-xs font-medium text-slate-500">Lien du site (à partager avec les patients)</div>
            <div className="mt-1 flex items-center gap-2">
              <a href={`${lienSite}?admin=1`} className="break-all text-sm underline">{lienSite}</a>
              <button
                onClick={() => copier(lienSite, "site")}
                className="flex-shrink-0 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
              >
                {copie === "site" ? "Copié !" : "Copier"}
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 p-3">
            <div className="text-xs font-medium text-slate-500">Lien espace praticien (à partager avec le client — usage unique, pour qu&apos;il définisse son mot de passe)</div>
            {succes.lienEspacePraticien ? (
              <div className="mt-1 flex items-center gap-2">
                <span className="break-all text-sm">{succes.lienEspacePraticien}</span>
                <button
                  onClick={() => copier(succes.lienEspacePraticien!, "praticien")}
                  className="flex-shrink-0 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                >
                  {copie === "praticien" ? "Copié !" : "Copier"}
                </button>
              </div>
            ) : (
              <p className="mt-1 text-sm text-red-600">Échec de la génération du lien — va dans la fiche du cabinet pour réessayer.</p>
            )}
          </div>

          {succes.lienPaiement && (
            <div className="rounded-lg border border-slate-200 p-3">
              <div className="text-xs font-medium text-slate-500">Lien de paiement (à partager avec le client — carte ou virement SEPA, prélèvement automatique le 1er de chaque mois)</div>
              <div className="mt-1 flex items-center gap-2">
                <span className="break-all text-sm">{succes.lienPaiement}</span>
                <button
                  onClick={() => copier(succes.lienPaiement!, "paiement")}
                  className="flex-shrink-0 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                >
                  {copie === "paiement" ? "Copié !" : "Copier"}
                </button>
              </div>
            </div>
          )}
        </div>

        {qr && (
          <div className="mt-5 flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="h-24 w-24 flex-shrink-0 [&_svg]:h-full [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: qr.svg }} />
            <div>
              <div className="text-sm font-medium text-slate-800">QR code à remettre au client</div>
              <p className="mt-1 break-all text-xs text-slate-500">{qr.lien}</p>
              <a
                href={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(qr.svg)}`}
                download={`qr-code-${succes.slug}.svg`}
                className="mt-2 inline-block text-xs font-medium underline"
                style={{ color: "#0E5E63" }}
              >
                Télécharger le QR code
              </a>
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {succes.cabinetId && (
            <a
              href={`/admin/cabinets/${succes.cabinetId}`}
              className="inline-block rounded-lg px-4 py-2 text-sm font-semibold text-white"
              style={{ background: "#0E5E63" }}
            >
              ✎ Personnaliser (logo, photo, photos praticiens) →
            </a>
          )}
          <a href="/admin" className="inline-block rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-slate-300">
            Retour à la liste des cabinets
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {erreur && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{erreur}</div>}

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 font-medium text-slate-800">1. Identité</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Nom du cabinet</label>
            <input value={nom} onChange={(e) => setNom(e.target.value)} className={inputCls} placeholder="Cabinet Martin" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Métier</label>
            <select value={metier} onChange={(e) => changerMetier(e.target.value)} className={inputCls}>
              {Object.entries(METIERS).map(([cle, config]) => (
                <option key={cle} value={cle}>{config.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Ville</label>
            <input value={ville} onChange={(e) => setVille(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Adresse</label>
            <input value={adresse} onChange={(e) => setAdresse(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Téléphone affiché</label>
            <input value={telephoneAffiche} onChange={(e) => setTelephoneAffiche(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Email de l&apos;administrateur (compte de connexion)</label>
            <input value={emailAdmin} onChange={(e) => setEmailAdmin(e.target.value)} className={inputCls} type="email" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Lien avis Google (facultatif, ajoutable plus tard)</label>
            <input
              value={lienAvisGoogle}
              onChange={(e) => setLienAvisGoogle(e.target.value)}
              className={inputCls}
              placeholder="https://g.page/r/.../review"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Couleur principale</label>
            <input type="color" value={couleurPrimaire} onChange={(e) => setCouleurPrimaire(e.target.value)} className="h-9 w-20 rounded-lg border border-slate-200" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Couleur douce</label>
            <input type="color" value={couleurDouce} onChange={(e) => setCouleurDouce(e.target.value)} className="h-9 w-20 rounded-lg border border-slate-200" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Logo (facultatif)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
              className="block w-full text-xs text-slate-500 file:mr-2 file:rounded-lg file:border file:border-slate-200 file:bg-white file:px-3 file:py-1.5 file:text-xs"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Photo de fond du site (facultatif)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
              className="block w-full text-xs text-slate-500 file:mr-2 file:rounded-lg file:border file:border-slate-200 file:bg-white file:px-3 file:py-1.5 file:text-xs"
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 font-medium text-slate-800">2. Équipe</h2>
        <div className="space-y-2">
          {praticiens.map((p, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <input
                placeholder="Nom du praticien"
                value={p.nom}
                onChange={(e) => setPraticiens(praticiens.map((x, j) => (j === i ? { ...x, nom: e.target.value } : x)))}
                className={inputClsFlex + " min-w-0 flex-1"}
              />
              <input
                placeholder="Rôle"
                value={p.role}
                onChange={(e) => setPraticiens(praticiens.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)))}
                className={inputClsFlex + " min-w-0 flex-1"}
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPraticiens(praticiens.map((x, j) => (j === i ? { ...x, photo: e.target.files?.[0] ?? null } : x)))}
                className="w-40 flex-shrink-0 text-xs text-slate-500 file:mr-1 file:rounded-lg file:border file:border-slate-200 file:bg-white file:px-2 file:py-1.5 file:text-xs"
              />
              <button onClick={() => setPraticiens(praticiens.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-600">✕</button>
            </div>
          ))}
          <button onClick={() => setPraticiens([...praticiens, { nom: "", role: "", photo: null }])} className="text-xs text-slate-500 hover:underline">
            + Ajouter un praticien
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-1 font-medium text-slate-800">3. Prestations</h2>
        <p className="mb-3 text-xs text-slate-500">Pré-remplies selon le métier — ajuste librement.</p>
        <div className="space-y-2">
          {prestations.map((p, i) => (
            <div key={i} className="flex gap-2">
              <input
                placeholder="Nom"
                value={p.nom}
                onChange={(e) => setPrestations(prestations.map((x, j) => (j === i ? { ...x, nom: e.target.value } : x)))}
                className={inputClsFlex + " min-w-0 flex-1"}
              />
              <div className="relative w-28 flex-shrink-0">
                <input
                  type="number"
                  placeholder="Durée"
                  value={p.dureeMinutes}
                  onChange={(e) => setPrestations(prestations.map((x, j) => (j === i ? { ...x, dureeMinutes: +e.target.value } : x)))}
                  className={inputClsFlex + " w-full pr-9"}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">min</span>
              </div>
              <div className="relative w-28 flex-shrink-0">
                <input
                  type="number"
                  placeholder="Prix"
                  value={p.prix}
                  onChange={(e) => setPrestations(prestations.map((x, j) => (j === i ? { ...x, prix: +e.target.value } : x)))}
                  className={inputClsFlex + " w-full pr-7"}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">€</span>
              </div>
              <button onClick={() => setPrestations(prestations.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-600">✕</button>
            </div>
          ))}
          <button onClick={() => setPrestations([...prestations, { nom: "", dureeMinutes: 30, prix: 0 }])} className="text-xs text-slate-500 hover:underline">
            + Ajouter une prestation
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 font-medium text-slate-800">4. Secrétaire IA</h2>
        <div className="grid gap-3 sm:grid-cols-2">
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
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Horaires (texte affiché)</label>
            <input value={horairesTexte} onChange={(e) => setHorairesTexte(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Délai min. de réservation (h)</label>
            <input type="number" value={delaiMinReservationHeures} onChange={(e) => setDelaiMinReservationHeures(+e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Délai d&apos;annulation gratuite (h)</label>
            <input type="number" value={delaiAnnulationHeures} onChange={(e) => setDelaiAnnulationHeures(+e.target.value)} className={inputCls} />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={accepteNouveauxPatients} onChange={(e) => setAccepteNouveauxPatients(e.target.checked)} />
            Accepte les nouveaux patients
          </label>
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-xs font-medium text-slate-500">FAQ de départ</label>
          <div className="space-y-2">
            {faq.map((f, i) => (
              <div key={i} className="flex gap-2">
                <input
                  placeholder="Question"
                  value={f.question}
                  onChange={(e) => setFaq(faq.map((x, j) => (j === i ? { ...x, question: e.target.value } : x)))}
                  className={inputCls}
                />
                <input
                  placeholder="Réponse"
                  value={f.reponse}
                  onChange={(e) => setFaq(faq.map((x, j) => (j === i ? { ...x, reponse: e.target.value } : x)))}
                  className={inputCls}
                />
                <button onClick={() => setFaq(faq.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-600">✕</button>
              </div>
            ))}
            <button onClick={() => setFaq([...faq, { question: "", reponse: "" }])} className="text-xs text-slate-500 hover:underline">
              + Ajouter une question
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-1 font-medium text-slate-800">5. Offre</h2>
        <p className="mb-3 text-xs text-slate-500">Détermine si un numéro de téléphone est attribué, et qui répond en premier.</p>
        <div className="space-y-2">
          {(Object.keys(OFFRE_LABEL) as Offre[]).map((o) => (
            <label
              key={o}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm ${offre === o ? "border-slate-400 bg-slate-50" : "border-slate-200"}`}
            >
              <input
                type="radio"
                name="offre"
                checked={offre === o}
                onChange={() => changerOffre(o)}
                className="mt-0.5"
              />
              <span>
                <span className="font-medium text-slate-800">{OFFRE_LABEL[o]}</span>
                <span className="block text-xs text-slate-500">{OFFRE_DESCRIPTION[o]}</span>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-1 font-medium text-slate-800">6. Forfait SMS</h2>
        <p className="mb-3 text-xs text-slate-500">
          Nombre de rappels SMS inclus par mois selon le palier vendu au client. Une fois ce forfait
          atteint dans le mois, les rappels basculent automatiquement sur email uniquement — pas de
          dépassement de frais de ton côté.
        </p>
        <select
          value={smsForfaitMensuel}
          onChange={(e) => setSmsForfaitMensuel(+e.target.value)}
          className={inputCls}
        >
          {PALIERS_SMS[offre].map((p) => (
            <option key={p.sms} value={p.sms}>
              {p.sms === 0 ? "0 — Email uniquement" : `${p.sms} SMS/mois`} — {p.prix.toFixed(2)}€ ({OFFRE_LABEL[offre]})
            </option>
          ))}
        </select>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-1 font-medium text-slate-800">7. Paiement</h2>
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={activerPaiementStripe}
            onChange={(e) => setActiverPaiementStripe(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            <span className="font-medium text-slate-800">Générer un lien de paiement Stripe pour ce cabinet</span>
            <span className="block text-xs text-slate-500">
              Décoché par défaut — laisse décoché si tu gères ce client en dehors de Stripe pour l&apos;instant.
              Prélèvement mensuel automatique le 1er du mois si activé.
            </span>
          </span>
        </label>
      </section>

      <button
        onClick={creer}
        disabled={isPending || !nom.trim() || !emailAdmin.trim()}
        className="rounded-lg px-6 py-3 text-sm font-semibold text-white disabled:opacity-40"
        style={{ background: "#0E5E63" }}
      >
        {envoiPhotos ? "Envoi des photos…" : isPending ? "Création en cours…" : "Créer le cabinet"}
      </button>
    </div>
  );
}
