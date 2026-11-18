import { Editor, type SceneGraph } from '@pascal-app/editor'
import { Calculator, History, MessageSquare } from 'lucide-react'
import { lazy, Suspense, useCallback, useEffect, useMemo, type ComponentType, type ReactNode } from 'react'
import HistoryPanel from '../components/editor/HistoryPanel'
import MeasurementsPanel from '../components/editor/MeasurementsPanel'
import Notice from '../components/editor/Notice'
import { useT } from '../i18n/useT'
import { useEditorStore } from '../stores/editorStore'
import { useViewsStore } from '../stores/viewsStore'
import './bootstrap'
import PascalCommentsTab from './PascalCommentsTab'

// Façades, coupes et planche : chargées quand on ouvre les Vues.
const ViewsScreen = lazy(() => import('../components/views/ViewsScreen'))

interface PascalReadOnlyProps {
  /** Barre du haut : bandeau d'une version, ou barre « Lecture seule » (`PascalReadOnlyBar`). */
  banner: ReactNode
  /** Onglet Historique (membres connectés, aperçu d'une version) ; faux sur le lien public. */
  history?: boolean
  /** Nommer des versions dans l'historique (éditeurs et propriétaire). */
  canName?: boolean
  /** Version affichée (aperçu), surlignée dans l'historique. */
  versionId?: string
  /** Onglet Commentaires (membre connecté, pas l'aperçu d'une version ni le lien public). */
  comments?: boolean
}

/**
 * Projet Plan en lecture seule dans l'éditeur de Pascal (M19 A2d, généralisé en A7) : mode « aperçu » de
 * Pascal (`previewScene`, `isVersionPreviewMode` : aucune modification possible), avec la barre de
 * Fabrics et les onglets Métrés, Historique et Commentaires selon la page. Rien n'est enregistré. Sert
 * à l'aperçu d'une version, au lecteur invité (`/p/…`) et au lien public (`/s/…`) : l'ancien plan et
 * l'ancienne vue 3D n'y servent plus.
 */
export default function PascalReadOnly({ banner, history = false, canName = false, versionId, comments = false }: PascalReadOnlyProps) {
  const t = useT()
  const projectId = useEditorStore((state) => state.project?.id ?? '')
  const projectName = useEditorStore((state) => state.project?.name ?? '')
  const scene = useEditorStore((state) => state.project?.scene ?? null) as unknown as SceneGraph | null
  const viewsOpen = useViewsStore((state) => state.open)

  useEffect(() => {
    document.body.classList.add('dark', 'pascal-tokens')
    return () => document.body.classList.remove('dark', 'pascal-tokens')
  }, [])

  const sidebarTabs = useMemo(() => {
    const HistoryTab: ComponentType = () => (
      <div className="fabrics-on-dark h-full min-h-0 overflow-y-auto">
        <HistoryPanel canName={canName} selectedVersionId={versionId} />
      </div>
    )
    const MetresTab: ComponentType = () => (
      <div className="fabrics-on-dark h-full min-h-0 overflow-y-auto">
        <MeasurementsPanel />
      </div>
    )
    const tabs = []
    if (comments) {
      tabs.push({
        id: 'fabrics-comments',
        label: t('pascalEditor.tabComments'),
        icon: <MessageSquare className="h-5 w-5" />,
        mobileIcon: <MessageSquare className="h-5 w-5" />,
        component: PascalCommentsTab,
      })
    }
    if (history) {
      tabs.push({
        id: 'fabrics-history',
        label: t('pascalEditor.tabHistory'),
        icon: <History className="h-5 w-5" />,
        mobileIcon: <History className="h-5 w-5" />,
        component: HistoryTab,
      })
    }
    tabs.push({
      id: 'fabrics-metres',
      label: t('pascalEditor.tabMetres'),
      icon: <Calculator className="h-5 w-5" />,
      mobileIcon: <Calculator className="h-5 w-5" />,
      component: MetresTab,
    })
    return tabs
  }, [t, canName, versionId, comments, history])

  const handleLoad = useCallback(async () => scene, [scene])

  if (!scene) return null

  return (
    <div className="dark pascal-tokens relative h-screen w-screen">
      <Editor
        layoutVersion="v2"
        projectId={projectId}
        projectName={projectName}
        isVersionPreviewMode
        previewScene={scene}
        onLoad={handleLoad}
        navbarSlot={<div className="fabrics-on-dark">{banner}</div>}
        sidebarTabs={sidebarTabs}
      />
      {viewsOpen && (
        <Suspense fallback={null}>
          <ViewsScreen />
        </Suspense>
      )}
      <div className="pointer-events-none absolute inset-x-0 top-14 z-50 [&>*]:pointer-events-auto">
        <Notice />
      </div>
    </div>
  )
}
