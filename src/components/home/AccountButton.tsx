import { LogIn, LogOut } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useT } from '../../i18n/useT'
import { useAuthStore } from '../../stores/authStore'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import { SECONDARY_PILL } from '../shell/AppShell'

const FOCUS_RING = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/**
 * Compte dans l'en-tête. Connecté : un avatar à l'initiale ouvre un panneau avec
 * l'adresse complète et la déconnexion. Invisible en mode local (Supabase non configuré).
 */
export default function AccountButton() {
  const t = useT()
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
        <div ref={rootRef} className="relative">
          <button
            ref={triggerRef}
            type="button"
            aria-label={t('account.label')}
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((value) => !value)}
            className={`flex size-8 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-foreground ring-1 ring-inset ring-border transition-shadow duration-150 hover:ring-2 hover:ring-ring ${FOCUS_RING}`}
          >
            <span aria-hidden="true">{initial}</span>
          </button>
          {open && (
            <div
              id={panelId}
              className="absolute right-0 top-full z-20 mt-2 w-72 rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-2xl"
            >
              <p className="break-all px-3 pb-2 pt-1.5 text-sm leading-snug text-muted-foreground">{email}</p>
              <div className="border-t border-border pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    setConfirmSignOut(true)
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-accent ${FOCUS_RING}`}
                >
                  <LogOut size={16} aria-hidden="true" className="text-muted-foreground" />
                  {t('account.signOut')}
                </button>
              </div>
            </div>
          )}
        </div>
        {confirmSignOut && (
          <Modal title={t('account.signOutTitle')} onClose={() => setConfirmSignOut(false)}>
            <p className="text-sm text-muted-foreground">{t('account.signOutMessage')}</p>
            <div className="mt-6 flex justify-end gap-2">
              <Button onClick={() => setConfirmSignOut(false)}>{t('common.cancel')}</Button>
              <Button
                variant="primary"
                onClick={() => {
                  setConfirmSignOut(false)
                  void signOut()
                }}
              >
                {t('account.signOut')}
              </Button>
            </div>
          </Modal>
        )}
      </>
    )
  }

  return (
    <Link to="/connexion" className={`${SECONDARY_PILL} ${FOCUS_RING}`}>
      <LogIn size={16} aria-hidden="true" />
      {t('account.signIn')}
    </Link>
  )
}
