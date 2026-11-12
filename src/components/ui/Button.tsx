import clsx from 'clsx'
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

const VARIANTS: Record<Variant, string> = {
  // Bouton principal désactivé : fond gris et texte lisible (≥ 4,5:1), plutôt qu'un indigo délavé à 50 %.
  primary:
    'bg-indigo-600 text-white enabled:hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-600',
  secondary:
    'border border-slate-300 bg-white text-slate-700 enabled:hover:bg-slate-50 disabled:opacity-50',
  danger: 'bg-red-600 text-white enabled:hover:bg-red-700 disabled:opacity-50',
}

export default function Button({
  variant = 'secondary',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={clsx(
        'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600',
        'transition-colors duration-150 ease-out disabled:cursor-not-allowed',
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  )
}
