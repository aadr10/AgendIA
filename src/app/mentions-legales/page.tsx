import Link from "next/link";

export const metadata = {
  title: "Mentions légales — AgendIA",
};

export default function MentionsLegalesPage() {
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
        <h1 className="mb-8 text-2xl font-semibold text-[#16232A]">Mentions légales</h1>

        <Section titre="Éditeur du site">
          <p>
            Le site AgendIA (agendia-app.com) est édité par <strong>Andrea Aita</strong>, personne physique, dont
            l&apos;activité est actuellement en phase de lancement.
          </p>
          <p className="mt-2">
            Contact : <a className="underline" href="mailto:andrea.aita0305@gmail.com">andrea.aita0305@gmail.com</a> ·{" "}
            <a className="underline" href="tel:+32486568255">+32 486 56 82 55</a>
          </p>
          <p className="mt-2">Adresse professionnelle disponible sur demande auprès du contact ci-dessus.</p>
        </Section>

        <Section titre="Directeur de la publication">
          <p>Andrea Aita.</p>
        </Section>

        <Section titre="Hébergement">
          <p>Site et application : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.</p>
          <p className="mt-1">Base de données : Supabase Inc.</p>
          <p className="mt-1">Nom de domaine enregistré via OVH SAS.</p>
        </Section>

        <Section titre="Propriété intellectuelle">
          <p>
            L&apos;ensemble des contenus présents sur ce site (textes, logo, mise en page, code) est la propriété
            d&apos;Andrea Aita, sauf mention contraire. Toute reproduction sans autorisation préalable est interdite.
          </p>
        </Section>

        <Section titre="Contact">
          <p>
            Pour toute question relative au site ou à ces mentions légales, contactez{" "}
            <a className="underline" href="mailto:andrea.aita0305@gmail.com">andrea.aita0305@gmail.com</a>.
          </p>
        </Section>

        <p className="mt-12 text-xs text-slate-400">Dernière mise à jour : juillet 2026.</p>
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
