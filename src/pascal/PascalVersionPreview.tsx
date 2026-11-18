import { Editor, type SceneGraph } from '@pascal-app/editor'
import { Calculator, History } from 'lucide-react'
import { useCallback, useEffect, useMemo, type ComponentType, type ReactNode } from 'react'
import HistoryPanel from '../components/editor/HistoryPanel'
import MeasurementsPanel from '../components/editor/MeasurementsPanel'
import Notice from '../components/editor/Notice'
import { useT } from '../i18n/useT'
import { useEditorStore } from '../stores/editorStore'
import './bootstrap'

interface PascalVersionPreviewProps {
  /** Bandeau de la version (nom, auteur, Restaurer, Faire une copie), en haut de l'éditeur. */
  banner: ReactNode
  canName: boolean
  versionId: string
}

/**
 * Aperçu d'une version d'un projet Plan dans l'éditeur de Pascal (M19 A2d) : mode « aperçu de
 * version » de Pascal (`previewScene`, `isVersionPreviewMode` : aucune modification possible), avec
 * le bandeau de Fabrics et les onglets Historique et Métrés de la version. Rien n'est enregistré.
 */
export default function PascalVersionPreview({ banner, canName, versionId }: PascalVersionPreviewProps) {
  const t = useT()
  const projectId = useEditorStore((state) => state.project?.id ?? '')
  const projectName = useEditorStore((state) => state.project?.name ?? '')
  const scene = useEditorStore((state) => state.project?.scene ?? null) as unknown as SceneGraph | null

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
    return [
      {
        id: 'fabrics-history',
        label: t('pascalEditor.tabHistory'),
        icon: <History className="h-5 w-5" />,
        mobileIcon: <History className="h-5 w-5" />,
        component: HistoryTab,
      },
      {
        id: 'fabrics-metres',
        label: t('pascalEditor.tabMetres'),
        icon: <Calculator className="h-5 w-5" />,
        mobileIcon: <Calculator className="h-5 w-5" />,
        component: MetresTab,
      },
    ]
  }, [t, canName, versionId])

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
      <div className="pointer-events-none absolute inset-x-0 top-14 z-50 [&>*]:pointer-events-auto">
        <Notice />
      </div>
    </div>
  )
}
