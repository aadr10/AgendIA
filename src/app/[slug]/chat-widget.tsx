"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { envoyerMessageChat } from "./chat-actions";

type Message = { role: "user" | "assistant"; content: string };

export default function ChatWidget({
  slug,
  iaPrenom,
  cabinetNom,
  couleurPrimaire,
  couleurDouce,
}: {
  slug: string;
  iaPrenom: string;
  cabinetNom: string;
  couleurPrimaire: string;
  couleurDouce: string;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [saisie, setSaisie] = useState("");
  const [isPending, startTransition] = useTransition();
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, ouvert]);

  function envoyer() {
    const texte = saisie.trim();
    if (!texte || isPending) return;
    const historiquePourEnvoi = messages;
    setMessages((prev) => [...prev, { role: "user", content: texte }]);
    setSaisie("");

    startTransition(async () => {
      const res = await envoyerMessageChat({ slug, historique: historiquePourEnvoi, message: texte });
      if ("erreur" in res) {
        setMessages((prev) => [...prev, { role: "assistant", content: "Désolé, une erreur technique m'empêche de répondre. Réessayez, ou appelez le cabinet." }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: res.reponse }]);
      }
    });
  }

  return (
    <div className="fixed bottom-4 right-4 z-10 flex flex-col items-end">
      {ouvert && (
        <div className="mb-3 flex h-96 w-80 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center gap-2 px-4 py-3 text-white" style={{ background: couleurPrimaire }}>
            <span className="relative flex h-2 w-2">
              <span className="absolute h-full w-full animate-ping rounded-full bg-white opacity-60" />
              <span className="relative h-2 w-2 rounded-full bg-white" />
            </span>
            <span className="text-sm font-semibold">
              {iaPrenom} · {cabinetNom}
            </span>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            <div className="max-w-[85%] rounded-xl px-3 py-2 text-sm" style={{ background: couleurDouce }}>
              Bonjour ! Je suis {iaPrenom}. Tarifs, horaires, rendez-vous… posez-moi votre question 🙂
            </div>
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : ""}`}>
                <div
                  className="max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm"
                  style={m.role === "user" ? { background: couleurPrimaire, color: "#fff" } : { background: couleurDouce }}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {isPending && (
              <div className="flex">
                <div className="max-w-[85%] rounded-xl px-3 py-2 text-sm text-slate-400" style={{ background: couleurDouce }}>
                  {iaPrenom} écrit…
                </div>
              </div>
            )}
            <div ref={finRef} />
          </div>
          <div className="flex gap-2 border-t border-slate-100 p-2">
            <input
              value={saisie}
              onChange={(e) => setSaisie(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && envoyer()}
              placeholder="Écrivez ici…"
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              disabled={isPending}
            />
            <button
              onClick={envoyer}
              disabled={isPending || !saisie.trim()}
              className="rounded-lg px-3 text-sm font-medium text-white disabled:opacity-40"
              style={{ background: couleurPrimaire }}
            >
              →
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOuvert(!ouvert)}
        className="flex items-center gap-3 rounded-full py-4 pl-5 pr-6 text-white shadow-2xl transition-transform hover:scale-105"
        style={{ background: couleurPrimaire }}
      >
        <span className="text-2xl">{ouvert ? "✕" : "💬"}</span>
        <span className="text-left text-sm font-semibold leading-tight">
          {ouvert ? "Fermer" : (
            <>
              Une question ?
              <br />
              <span className="font-normal opacity-90">{iaPrenom} vous répond</span>
            </>
          )}
        </span>
      </button>
    </div>
  );
}
