import type { CollabRoom } from './room'

/** Liaisons et variables du Worker (voir `wrangler.jsonc` et `.dev.vars.example`). */
export interface Env {
  COLLAB_ROOM: DurableObjectNamespace<CollabRoom>
  /** Adresse du projet Supabase, ex. https://xxxx.supabase.co */
  SUPABASE_URL: string
  /** Clé publique `anon` de Supabase. Jamais la clé `service_role`. */
  SUPABASE_ANON_KEY: string
}
