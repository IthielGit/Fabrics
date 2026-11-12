import type { User } from '@supabase/supabase-js'
import { create } from 'zustand'
import { authErrorKey, type AuthErrorKey } from '../features/auth/authErrors'
import { selectRepository } from '../features/persistence/repository'
import { cloudEnabled, supabase } from '../lib/supabase'

/** disabled : Supabase non configuré (mode local) ; loading : session en cours de lecture. */
export type AuthStatus = 'disabled' | 'loading' | 'signedOut' | 'signedIn'

interface AuthState {
  status: AuthStatus
  user: User | null
  /** Vrai quand la personne arrive par le lien « mot de passe oublié » de l'e-mail. */
  recovery: boolean
  /** Démarre l'écoute de la session ; renvoie la fonction qui l'arrête. */
  init: () => () => void
  /** Chaque action renvoie `null` si elle a réussi, sinon la clé du message d'erreur. */
  signIn: (email: string, password: string) => Promise<AuthErrorKey | null>
  signUp: (email: string, password: string) => Promise<AuthErrorKey | null>
  sendPasswordReset: (email: string) => Promise<AuthErrorKey | null>
  updatePassword: (password: string) => Promise<AuthErrorKey | null>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  status: cloudEnabled ? 'loading' : 'disabled',
  user: null,
  recovery: false,

  init: () => {
    if (!supabase) return () => {}
    void supabase.auth.getSession().then(({ data }) => {
      // Le dépôt est choisi avant de changer l'état : les pages qui attendent la fin du
      // chargement de la session lisent alors tout de suite le bon dépôt.
      selectRepository(data.session?.user.id ?? null)
      set({
        user: data.session?.user ?? null,
        status: data.session ? 'signedIn' : 'signedOut',
      })
    })
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      selectRepository(session?.user.id ?? null)
      set((state) => ({
        user: session?.user ?? null,
        status: session ? 'signedIn' : 'signedOut',
        recovery: event === 'PASSWORD_RECOVERY' ? true : session ? state.recovery : false,
      }))
    })
    return () => data.subscription.unsubscribe()
  },

  signIn: async (email, password) => {
    if (!supabase) return 'generic'
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    return error ? authErrorKey(error) : null
  },

  signUp: async (email, password) => {
    if (!supabase) return 'generic'
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    })
    return error ? authErrorKey(error) : null
  },

  sendPasswordReset: async (email) => {
    if (!supabase) return 'generic'
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/nouveau-mot-de-passe`,
    })
    return error ? authErrorKey(error) : null
  },

  updatePassword: async (password) => {
    if (!supabase) return 'generic'
    const { error } = await supabase.auth.updateUser({ password })
    if (error) return authErrorKey(error)
    set({ recovery: false })
    return null
  },

  signOut: async () => {
    await supabase?.auth.signOut()
  },
}))
