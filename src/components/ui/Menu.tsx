import clsx from 'clsx'
import { MoreHorizontal } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export interface MenuItem {
  label: string
  icon?: ReactNode
  danger?: boolean
  onSelect: () => void
}

interface MenuProps {
  label: string // texte accessible du bouton « ⋯ »
  items: MenuItem[]
}

export default function Menu({ label, items }: MenuProps) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<{ top: number; right: number } | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target) || listRef.current?.contains(target)) return
      setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    const close = () => setOpen(false)
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', close)
    window.addEventListener('scroll', close, true)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', close)
      window.removeEventListener('scroll', close, true)
    }
  }, [open])

  // Le menu est affiché dans <body> (position fixe) pour ne jamais être rogné
  // par un parent avec overflow-hidden.
  useLayoutEffect(() => {
    if (!open || !buttonRef.current || !listRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const height = listRef.current.offsetHeight
    const fitsBelow = rect.bottom + 4 + height <= window.innerHeight
    setPosition({
      top: fitsBelow ? rect.bottom + 4 : Math.max(4, rect.top - 4 - height),
      right: Math.max(4, window.innerWidth - rect.right),
    })
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          setPosition(null)
          setOpen((value) => !value)
        }}
        className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
      >
        <MoreHorizontal size={18} />
      </button>
      {open &&
        createPortal(
          <ul
            ref={listRef}
            role="menu"
            style={{
              top: position?.top ?? 0,
              right: position?.right ?? 0,
              visibility: position ? 'visible' : 'hidden',
            }}
            className="fixed z-50 w-44 rounded-md border border-slate-200 bg-white py-1 shadow-lg"
          >
            {items.map((item) => (
              <li key={item.label} role="none">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false)
                    item.onSelect()
                  }}
                  className={clsx(
                    'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50',
                    item.danger ? 'text-red-600' : 'text-slate-700',
                  )}
                >
                  {item.icon}
                  {item.label}
                </button>
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </div>
  )
}
