import clsx from 'clsx'
import type { ReactNode } from 'react'

const HEAD = 'px-1 py-1 text-left text-xs font-medium text-slate-600'

interface MeasureTableProps {
  title: string
  /** En-têtes : la première colonne (nom) à gauche, les valeurs chiffrées à droite. */
  columns: readonly string[]
  className?: string
  /** Corps du tableau (`<tbody>`, et `<tfoot>` éventuel). */
  children: ReactNode
}

/** Tableau d'une famille de métrés (pièces, murs, escaliers…) dans le panneau Métrés. */
export default function MeasureTable({ title, columns, className, children }: MeasureTableProps) {
  return (
    <table className={clsx(className, 'w-full text-sm')}>
      <caption className="pb-1 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </caption>
      <thead>
        <tr>
          {columns.map((column, i) => (
            <th key={column} className={i === 0 ? HEAD : `${HEAD} text-right`}>
              {column}
            </th>
          ))}
        </tr>
      </thead>
      {children}
    </table>
  )
}
