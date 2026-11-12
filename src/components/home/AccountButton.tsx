import { LogIn, LogOut } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router'
import { fr } from '../../i18n/fr'
import { useAuthStore } from '../../stores/authStore'
import Button from '../ui/Button'
import Modal from '../ui/Modal'

const FOCUS_RING = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'

/**
 * Compte dans l'en-tête. Connecté : un avatar à l'initiale ouvre un panneau avec
 * l'adresse complète et la déconnexion. Invisible en mode local (Supabase non configuré).
 */
export default function AccountButton() {
  const status = useAuthStore((state) => state.status)
  const user = useAuthStore((state) => state.user)
  const signOut = useAuthStore((state) => state.signOut)

  const [open, setOpen] = useState(false)
  const [confirmSignOut, setConfirmSignOut] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      triggerRef.current?.focus()
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  if (status === 'disabled' || status === 'loading') return null

  if (status === 'signedIn') {
    const email = user?.email ?? ''
    const initial = email.charAt(0).toUpperCase() || '?'
    return (
      <>
      <div ref={rootRef} className="relative ml-auto">
        <button
          ref={triggerRef}
          type="button"
          aria-label={fr.auth.account}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
          className={`flex size-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-900 ring-1 ring-inset ring-indigo-200 transition-shadow duration-150 hover:ring-2 hover:ring-indigo-300 ${FOCUS_RING}`}
        >
          <span aria-hidden="true">{initial}</span>
        </button>
        {open && (
          <div
            id={panelId}
            className="absolute right-0 top-full z-20 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10"
          >
            <p className="break-all px-3 pb-2 pt-1.5 text-sm leading-snug text-slate-600">{email}</p>
            <div className="border-t border-slate-100 pt-1">
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  setConfirmSignOut(true)
                }}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-800 transition-colors hover:bg-slate-100 ${FOCUS_RING}`}
              >
                <LogOut size={16} aria-hidden="true" className="text-slate-500" />
                {fr.auth.signOut}
              </button>
            </div>
          </div>
        )}
      </div>
      {confirmSignOut && (
        <Modal title={fr.auth.signOutTitle} onClose={() => setConfirmSignOut(false)}>
          <p className="text-sm text-slate-600">{fr.auth.signOutMessage}</p>
          <div className="mt-6 flex justify-end gap-2">
            <Button onClick={() => setConfirmSignOut(false)}>{fr.common.cancel}</Button>
            <Button
              variant="primary"
              onClick={() => {
                setConfirmSignOut(false)
                void signOut()
              }}
            >
              {fr.auth.signOut}
            </Button>
          </div>
        </Modal>
      )}
      </>
    )
  }

  return (
    <Link
      to="/connexion"
      className={`ml-auto inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 ${FOCUS_RING}`}
    >
      <LogIn size={16} aria-hidden="true" />
      {fr.auth.signIn}
    </Link>
  )
}
