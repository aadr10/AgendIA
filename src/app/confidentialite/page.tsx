import Link from "next/link";

export const metadata = {
  title: "Politique de confidentialité — AgendIA",
};

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-[#F7F9F8] font-sans text-[#16232A]">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, #14B8A6, #0E5E63)" }}
          >
            A
          </span>
          <span className="text-lg font-semibold">AgendIA</span>
        </Link>
        <Link href="/" className="text-sm font-medium" style={{ color: "#0E5E63" }}>
          ← Retour à l&apos;accueil
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-24 text-sm leading-relaxed text-[#3A4A50]">
        <h1 className="mb-2 text-2xl font-semibold text-[#16232A]">Politique de confidentialité</h1>
        <p className="mb-8 text-xs text-slate-400">Dernière mise à jour : juillet 2026.</p>

        <Section titre="Qui est responsable de vos données ?">
          <p>
            Andrea Aita, éditeur du site AgendIA, est responsable du traitement des données décrites ici. Pour toute
            question ou demande relative à vos données personnelles : <a className="underline" href="mailto:andrea.aita0305@gmail.com">andrea.aita0305@gmail.com</a>.
          </p>
        </Section>

        <Section titre="Quelles données sont collectées ?">
          <ul className="ml-4 list-disc space-y-1.5">
            <li>
              <strong>Praticiens et cabinets clients</strong> : nom, email professionnel, mot de passe (stocké de
              façon chiffrée), informations du cabinet (adresse, horaires, prestations).
            </li>
            <li>
              <strong>Patients prenant rendez-vous</strong> : nom, numéro de téléphone, email (facultatif), et le
              type de rendez-vous demandé.
            </li>
            <li>
              <strong>Appels téléphoniques</strong>{" "}
              (offre incluant l&apos;assistant vocal) : la conversation est traitée en temps réel par un assistant
              IA afin de gérer la prise de rendez-vous.
            </li>
          </ul>
        </Section>

        <Section titre="Pourquoi ces données sont-elles utilisées ?">
          <p>
            Uniquement pour la prise, la gestion et le rappel des rendez-vous auprès du cabinet concerné, et pour
            répondre aux questions posées via le chatbot ou l&apos;assistant téléphonique. Aucune donnée
            n&apos;est utilisée à des fins publicitaires ou revendue à des tiers.
          </p>
        </Section>

        <Section titre="Qui a accès à ces données ?">
          <p>Vos données restent strictement cloisonnées entre cabinets : un cabinet n&apos;a jamais accès aux données d&apos;un autre cabinet. Certains prestataires techniques traitent les données pour le compte d&apos;AgendIA, dans le seul but de faire fonctionner le service :</p>
          <ul className="ml-4 mt-2 list-disc space-y-1.5">
            <li>Supabase (hébergement de la base de données et authentification)</li>
            <li>Vercel (hébergement du site et de l&apos;application)</li>
            <li>Twilio (envoi de SMS et téléphonie)</li>
            <li>Vapi, Deepgram, Anthropic, Microsoft Azure (fonctionnement de l&apos;assistant vocal, offre Premium uniquement)</li>
            <li>Resend (envoi des emails de confirmation et de rappel)</li>
          </ul>
          <p className="mt-2">
            Certains de ces prestataires sont situés hors de l&apos;Union européenne (notamment aux États-Unis) et
            encadrent le transfert de données par des garanties contractuelles reconnues (clauses contractuelles
            types de la Commission européenne ou équivalent).
          </p>
        </Section>

        <Section titre="Combien de temps vos données sont-elles conservées ?">
          <p>
            Les données liées à un rendez-vous sont conservées le temps nécessaire à la gestion de la relation avec
            le cabinet, puis supprimées ou archivées selon les obligations propres à chaque cabinet. Vous pouvez
            demander la suppression de vos données à tout moment auprès du cabinet concerné ou d&apos;AgendIA.
          </p>
        </Section>

        <Section titre="Vos droits">
          <p>
            Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement,
            de limitation et d&apos;opposition concernant vos données. Vous pouvez exercer ces droits en écrivant à{" "}
            <a className="underline" href="mailto:andrea.aita0305@gmail.com">andrea.aita0305@gmail.com</a>. Vous
            disposez également du droit d&apos;introduire une réclamation auprès de l&apos;Autorité de protection
            des données belge (APD — autoriteprotectiondonnees.be).
          </p>
        </Section>

        <Section titre="Cookies">
          <p>
            Le site utilise uniquement des cookies techniques strictement nécessaires à la connexion et au bon
            fonctionnement du service (maintien de la session). Aucun cookie publicitaire ou de suivi tiers
            n&apos;est utilisé.
          </p>
        </Section>

        <Section titre="Sécurité">
          <p>
            Les échanges avec le site sont chiffrés (HTTPS). L&apos;accès aux données de chaque cabinet est protégé
            par authentification et strictement cloisonné des autres cabinets utilisant AgendIA.
          </p>
        </Section>
      </main>
    </div>
  );
}

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-2 text-base font-semibold text-[#16232A]">{titre}</h2>
      {children}
    </section>
  );
}
