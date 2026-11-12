import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Client Supabase (jalon M13). Uniquement la clé « anon » côté navigateur :
 * la clé service_role ne doit jamais apparaître dans ce projet.
 *
 * Sans les deux variables d'environnement, `supabase` vaut `null` et
 * l'application fonctionne en mode local (pas de bouton de connexion).
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export function isSupabaseConfigured(
  supabaseUrl: string | undefined,
  key: string | undefined,
): boolean {
  return Boolean(supabaseUrl?.trim()) && Boolean(key?.trim())
}

export const cloudEnabled = isSupabaseConfigured(url, anonKey)

export const supabase: SupabaseClient | null = cloudEnabled
  ? createClient(url as string, anonKey as string)
  : null
