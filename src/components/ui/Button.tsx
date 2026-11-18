import clsx from 'clsx'
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

// Couleurs du thème de Pascal (src/pascal-theme.css) : claires dans l'éditeur, sombres sur l'accueil.
const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-primary text-primary-foreground enabled:hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground',
  secondary: 'border border-border bg-transparent text-foreground enabled:hover:bg-accent disabled:opacity-50',
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
        'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        'transition-colors duration-150 ease-out disabled:cursor-not-allowed',
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  )
}
