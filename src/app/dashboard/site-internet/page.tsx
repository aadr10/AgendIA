import { getSessionContext } from "@/lib/cabinet";
import PageHeader from "@/components/page-header";
import SiteInternetClient from "./site-internet-client";
import { genererQrSvg } from "@/lib/qrcode";

export default async function SiteInternetPage() {
  const { cabinet } = await getSessionContext();

  const lienSite = `${process.env.NEXT_PUBLIC_APP_URL}/${cabinet.slug}`;
  const qrSvg = await genererQrSvg(lienSite);

  return (
    <div className="space-y-4">
      <PageHeader title="Site internet" />
      <SiteInternetClient
        cabinet={{
          slug: cabinet.slug,
          nom: cabinet.nom,
          adresse: cabinet.adresse ?? "",
          ville: cabinet.ville ?? "",
          telephoneAffiche: cabinet.telephone_affiche ?? "",
          horairesTexte: cabinet.horaires_texte ?? "",
          couleurPrimaire: cabinet.couleur_primaire,
          couleurDouce: cabinet.couleur_douce,
          logoUrl: cabinet.logo_url,
          photoHeroUrl: cabinet.photo_hero_url,
          lienAvisGoogle: cabinet.lien_avis_google ?? "",
        }}
        lienSite={lienSite}
        qrSvg={qrSvg}
      />
    </div>
  );
}
