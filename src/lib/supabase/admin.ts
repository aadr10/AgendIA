import { createClient } from "@supabase/supabase-js";

/**
 * Client "admin" (clé service_role) — usage serveur UNIQUEMENT.
 * Ne jamais importer ce fichier depuis un composant client ("use client").
 * Sert à servir le site public du cabinet (lecture) et à enregistrer une
 * réservation patient (écriture) sans que le visiteur soit connecté.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
