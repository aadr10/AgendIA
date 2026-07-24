"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
          <p className="text-sm text-slate-500">Connexion en cours…</p>
        </div>
      }
    >
      <AuthCallbackContenu />
    </Suspense>
  );
}

function AuthCallbackContenu() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    const next = searchParams.get("next") ?? "/dashboard";
    const supabase = createClient();

    async function traiter() {
      // Cas 1 : Supabase renvoie les jetons dans le fragment d'URL (#access_token=...),
      // utilisé par les liens generateLink/invite/recovery. Le fragment n'est
      // jamais envoyé au serveur, donc on le lit ici, côté client.
      const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
      const hashParams = new URLSearchParams(hash);
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (error) {
          setErreur(error.message);
          return;
        }
        router.replace(next);
        return;
      }

      // Cas 2 : flux par code (PKCE), au cas où.
      const code = searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setErreur(error.message);
          return;
        }
        router.replace(next);
        return;
      }

      setErreur("Lien invalide ou expiré.");
    }

    traiter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (erreur) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-red-700">{erreur}</p>
          <a href="/login" className="mt-4 inline-block text-sm font-medium text-[#0E5E63] underline">
            Retour à la connexion
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <p className="text-sm text-slate-500">Connexion en cours…</p>
    </div>
  );
}
