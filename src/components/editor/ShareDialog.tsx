import { useCallback, useEffect, useState } from 'react'
import {
  createShare,
  deleteShare,
  listShares,
  setShareActive,
  setShareExpiry,
  setSharePassword,
} from '../../features/sharing/sharesApi'
import { dateInputToExpiry, type Share } from '../../features/sharing/shareLogic'
import { fr } from '../../i18n/fr'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import ShareItem from './ShareItem'

interface ShareDialogProps {
  projectId: string
  onClose: () => void
}

const INPUT =
  'rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none'

/** Fenêtre « Partager » : liens en lecture seule d'un plan (création, désactivation, mot de passe, date limite). */
export default function ShareDialog({ projectId, onClose }: ShareDialogProps) {
  const [shares, setShares] = useState<Share[] | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [actionFailed, setActionFailed] = useState(false)
  const [password, setPassword] = useState('')
  const [expiry, setExpiry] = useState('')
  const [creating, setCreating] = useState(false)

  // Heure de la dernière lecture : sert à repérer les liens expirés sans lire l'horloge au rendu.
  const [now, setNow] = useState(() => new Date())

  const reload = useCallback(async () => {
    try {
      setShares(await listShares(projectId))
      setNow(new Date())
      setLoadFailed(false)
    } catch {
      setLoadFailed(true)
    }
  }, [projectId])

  useEffect(() => {
    let cancelled = false
    listShares(projectId)
      .then((list) => {
        if (cancelled) return
        setShares(list)
        setNow(new Date())
        setLoadFailed(false)
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [projectId])

  /** Exécute une action puis relit la liste ; un échec affiche un message. */
  const run = async (action: () => Promise<void>) => {
    setActionFailed(false)
    try {
      await action()
    } catch {
      setActionFailed(true)
    }
    await reload()
  }

  const handleCreate = async () => {
    setCreating(true)
    await run(async () => {
      await createShare(projectId, { password, expiresAt: dateInputToExpiry(expiry) })
      setPassword('')
      setExpiry('')
    })
    setCreating(false)
  }

  const t = fr.share

  return (
    <Modal title={t.title} onClose={onClose}>
      <p className="text-sm leading-relaxed text-slate-600">{t.intro}</p>

      <section className="mt-5">
        <h3 className="text-sm font-semibold text-slate-900">{t.newLinkTitle}</h3>
        <div className="mt-2 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs text-slate-600">
            {t.passwordLabel}
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={`${INPUT} w-44`}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-600">
            {t.expiryLabel}
            <input
              type="date"
              value={expiry}
              onChange={(event) => setExpiry(event.target.value)}
              className={INPUT}
            />
          </label>
          <Button variant="primary" disabled={creating} onClick={() => void handleCreate()}>
            {creating ? t.creating : t.create}
          </Button>
        </div>
      </section>

      {actionFailed && (
        <p role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {t.actionError}
        </p>
      )}

      <section className="mt-5">
        <h3 className="text-sm font-semibold text-slate-900">{t.linksTitle}</h3>
        {loadFailed && (
          <p role="alert" className="mt-2 text-sm text-red-700">
            {t.loadError}
          </p>
        )}
        {!loadFailed && shares === null && <p className="mt-2 text-sm text-slate-500">{t.loading}</p>}
        {shares?.length === 0 && <p className="mt-2 text-sm text-slate-500">{t.none}</p>}
        <ul className="mt-2 flex max-h-80 flex-col gap-3 overflow-y-auto">
          {shares?.map((share) => (
            <ShareItem
              key={share.id}
              share={share}
              now={now}
              onToggle={() => void run(() => setShareActive(share.id, !share.active))}
              onRemove={() => void run(() => deleteShare(share.id))}
              onSetPassword={(value) => run(() => setSharePassword(share.id, value))}
              onSetExpiry={(value) => run(() => setShareExpiry(share.id, dateInputToExpiry(value)))}
            />
          ))}
        </ul>
      </section>

      <div className="mt-6 flex justify-end">
        <Button onClick={onClose}>{fr.common.close}</Button>
      </div>
    </Modal>
  )
}
