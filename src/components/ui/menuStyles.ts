import clsx from 'clsx'

/**
 * Styles communs des menus déroulants de la barre « Niveau · Cotation » (M15 bis) : un bouton
 * « Libellé  Valeur ▾ » et une liste d'options à cocher.
 */
export const MENU_TRIGGER =
  'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-sm ' +
  'transition-colors duration-150 ease-out hover:bg-slate-100 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-600'

export const MENU_LIST =
  'absolute left-0 top-full z-30 mt-2 min-w-44 rounded-lg border border-slate-200 bg-white p-1 shadow-lg'

export function menuItemClass(checked: boolean): string {
  return clsx(
    'flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left text-sm',
    checked ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-100',
  )
}
