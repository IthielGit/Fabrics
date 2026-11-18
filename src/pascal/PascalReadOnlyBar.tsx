import { Eye, PanelsTopLeft } from 'lucide-react'
import { Link } from 'react-router'
import { displayProjectName } from '../features/documents/projectName'
import { useT } from '../i18n/useT'
import { useEditorStore } from '../stores/editorStore'
import { useViewsStore } from '../stores/viewsStore'
import { FabricsLogo } from '../components/shell/AppShell'

/**
 * Barre du haut d'un plan en lecture seule dans Pascal (lecteur invité, lien public) : Fabrics, nom du
 * projet, badge « Lecture seule » et Vues (façades, coupes, planche).
 */
export default function PascalReadOnlyBar() {
  const t = useT()
  const projectName = useEditorStore((state) => (state.project ? displayProjectName(state.project) : ''))
  const openViews = useViewsStore((state) => state.openViews)
  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-sidebar px-3 text-foreground">
      <Link to="/" title={t('pascalEditor.madeWith')} className="flex items-center gap-2">
        <FabricsLogo />
      </Link>
      <h1 className="min-w-0 truncate text-[15px] font-semibold">{projectName}</h1>
      <span className="flex shrink-0 items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs text-muted-foreground">
        <Eye size={12} aria-hidden="true" />
        {t('pascalEditor.readOnlyBadge')}
      </span>
      <button
        type="button"
        onClick={openViews}
        title={t('pascalEditor.viewsHint')}
        className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <PanelsTopLeft size={17} aria-hidden="true" />
        <span className="max-md:sr-only">{t('pascalEditor.views')}</span>
      </button>
    </header>
  )
}
