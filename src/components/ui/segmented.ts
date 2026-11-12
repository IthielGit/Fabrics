import clsx from 'clsx'

/**
 * Style commun des sélecteurs à segments (niveau, cotation, version des métrés) : même hauteur,
 * même rayon, même ombre, pour qu'ils se lisent comme une seule famille de contrôles.
 */
export const SEGMENTED_BAR =
  'flex items-center gap-0.5 rounded-xl border border-slate-200 bg-white p-1 ' +
  'shadow-[0_1px_2px_rgb(15_23_42/0.06),0_4px_12px_-4px_rgb(15_23_42/0.10)]'

export const SEGMENT_BASE =
  'inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium ' +
  'transition-colors duration-150 ease-out ' +
  'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-600 ' +
  'disabled:cursor-not-allowed disabled:opacity-40'

/** Classes d'un segment : actif (indigo plein, léger reflet) ou au repos. */
export function segmentClass(active: boolean): string {
  return clsx(
    SEGMENT_BASE,
    active
      ? 'bg-indigo-600 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.18)]'
      : 'text-slate-700 enabled:hover:bg-slate-100 enabled:hover:text-slate-900',
  )
}

/** Petit séparateur vertical entre deux groupes d'un même sélecteur. */
export const SEGMENT_DIVIDER = 'mx-1 h-5 w-px shrink-0 bg-slate-200'
