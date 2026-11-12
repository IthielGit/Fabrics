import { fr } from '../../i18n/fr'
import { useHelpStore } from '../../stores/helpStore'
import Modal from '../ui/Modal'

/** Liste des gestes et raccourcis de l'éditeur (bouton « ? » ou touche ?). */
export default function ShortcutsDialog() {
  const open = useHelpStore((state) => state.open)
  const setOpen = useHelpStore((state) => state.setOpen)
  if (!open) return null

  return (
    <Modal title={fr.shortcuts.title} onClose={() => setOpen(false)}>
      <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
        {fr.shortcuts.sections.map((section) => (
          <section key={section.title}>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {section.title}
            </h3>
            <dl className="divide-y divide-slate-100 text-sm">
              {section.rows.map((row) => (
                <div key={row.keys} className="flex items-baseline justify-between gap-4 py-1.5">
                  <dt className="text-slate-700">{row.action}</dt>
                  <dd>
                    <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs text-slate-600">
                      {row.keys}
                    </kbd>
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </Modal>
  )
}
