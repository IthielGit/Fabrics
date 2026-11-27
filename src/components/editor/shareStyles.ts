import type { ShareStatus } from '../../features/sharing/shareLogic'

/** Champ de saisie de la fenêtre « Partager » (liens publics et invitations). */
export const SHARE_INPUT =
  'rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none'

/** Couleur de la pastille d'état d'un lien. */
export const SHARE_STATUS_STYLE: Record<ShareStatus, string> = {
  active: 'bg-emerald-50 text-emerald-800',
  disabled: 'bg-slate-100 text-slate-700',
  expired: 'bg-amber-50 text-amber-800',
}
