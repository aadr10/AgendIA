import { METIERS } from "@/lib/metiers";
import DemandeDemoForm from "./demande-demo-form";

const ETAPES = [
  {
    titre: "Vos patients réservent en ligne, ou appellent 24h/24",
    texte: "Un site de réservation à votre image, et une secrétaire IA qui décroche le téléphone à toute heure — jamais d'appel manqué.",
  },
  {
    titre: "L'IA gère les rendez-vous à votre place",
    texte: "Prise de RDV, rappels automatiques la veille, annulations, questions fréquentes : elle s'occupe de tout, par téléphone, chat ou SMS.",
  },
  {
    titre: "Vous gérez tout depuis un seul dashboard",
    texte: "Agenda, patients, praticiens, prestations — tout est centralisé, modifiable à tout moment, sans compétence technique requise.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F7F9F8] font-sans text-[#16232A]">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, #14B8A6, #0E5E63)" }}
          >
            A
          </span>
          <span className="text-lg font-semibold">AgendIA</span>
        </div>
        <a href="#demo" className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: "#0E5E63" }}>
          Demander une démo
        </a>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-16 text-center sm:py-24">
        <div
          className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium shadow-sm"
          style={{ color: "#0E5E63" }}
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute h-full w-full animate-ping rounded-full bg-[#0E5E63] opacity-60" />
            <span className="relative h-2 w-2 rounded-full bg-[#0E5E63]" />
          </span>
          Une secrétaire IA qui ne dort jamais
        </div>
        <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
          Votre secrétariat géré par l&apos;IA, 24h/24, 7j/7
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-slate-600 sm:text-lg">
          AgendIA répond au téléphone, prend vos rendez-vous et renseigne vos patients — comme une vraie secrétaire,
          pour une fraction du prix d&apos;une secrétaire à temps plein.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a href="#demo" className="rounded-xl px-7 py-3.5 text-base font-semibold text-white shadow-lg transition-transform hover:scale-105" style={{ background: "#0E5E63" }}>
            Demander une démo gratuite
          </a>
          <a href="/cabinet-dupont" target="_blank" rel="noreferrer" className="rounded-xl border border-slate-300 px-7 py-3.5 text-base font-semibold text-slate-700 transition hover:border-slate-400">
            Voir un exemple en direct
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="mb-8 text-center text-2xl font-semibold">Comment ça marche</h2>
        <div className="grid gap-5 sm:grid-cols-3">
          {ETAPES.map((e, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6">
              <div
                className="mb-4 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ background: "#0E5E63" }}
              >
                {i + 1}
              </div>
              <h3 className="mb-2 font-semibold">{e.titre}</h3>
              <p className="text-sm text-slate-600">{e.texte}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="mb-2 text-center text-2xl font-semibold">Conçu pour tous les métiers sur rendez-vous</h2>
        <p className="mb-8 text-center text-sm text-slate-500">
          Kinés, médecins, dentistes, esthéticiennes, coiffeurs... si vous prenez des rendez-vous, AgendIA s&apos;adapte à vous.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {Object.entries(METIERS).map(([cle, config]) => (
            <div
              key={cle}
              className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3"
            >
              <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: config.couleur }} />
              <span className="text-sm font-medium text-slate-700">{config.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="rounded-2xl p-8 text-center text-white sm:p-10" style={{ background: "linear-gradient(135deg, #0E5E63, #14B8A6)" }}>
          <h2 className="text-2xl font-semibold">Pourquoi pas une secrétaire humaine ?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-white/90 sm:text-base">
            Une secrétaire à temps plein coûte entre 800€ et 1500€ par mois, ne répond qu&apos;aux heures de bureau, et peut
            être absente ou débordée. AgendIA répond toujours, ne prend jamais de congé, et coûte une fraction du prix.
          </p>
        </div>
      </section>

      <section id="demo" className="mx-auto max-w-2xl px-6 py-16">
        <DemandeDemoForm />
      </section>

      <footer className="mx-auto max-w-5xl px-6 pb-10 text-center text-xs text-slate-400">
        AgendIA — la secrétaire IA pour les professionnels qui prennent des rendez-vous.
        <br />
        <a href="/mentions-legales" className="underline hover:text-slate-600">
          Mentions légales
        </a>
        {" · "}
        <a href="/confidentialite" className="underline hover:text-slate-600">
          Politique de confidentialité
        </a>
      </footer>
    </div>
  );
}
