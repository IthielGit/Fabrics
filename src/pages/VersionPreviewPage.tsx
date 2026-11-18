import { lazy, Suspense, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import ReadOnlySidePanel from '../components/editor/ReadOnlySidePanel'
import ReadOnlyViewer from '../components/editor/ReadOnlyViewer'
import VersionBanner from '../components/editor/VersionBanner'
import { duplicateProject } from '../features/documents/createProject'
import { repository } from '../features/persistence/repository'
import { fetchMyRole } from '../features/sharing/membersApi'
import { canEdit } from '../features/sharing/membersLogic'
import { setPendingRestore } from '../features/versions/pendingRestore'
import { diffVersions, type VersionChanges } from '../features/versions/versionDiff'
import { fetchVersionDocument, listProjectPeople, listVersions } from '../features/versions/versionsApi'
import { previousVersionOf, type ProjectPerson, type ProjectVersion } from '../features/versions/versionsLogic'
import { fr } from '../i18n/fr'
import { useEditorStore } from '../stores/editorStore'
import { useVersionPreviewStore } from '../stores/versionPreviewStore'

// M19 A2d : un projet Plan s'affiche dans l'éditeur de Pascal (chargé à la demande, il est lourd).
const PascalReadOnly = lazy(() => import('../pascal/PascalReadOnly'))

interface Loaded {
  key: string
  state: 'ready' | 'not-found' | 'error'
  version?: ProjectVersion
  changes?: VersionChanges | null
  people?: ReadonlyMap<string, ProjectPerson>
  canName?: boolean
}

/**
 * Aperçu d'une version (M15, lot C) : `/p/:projectId/versions/:versionId`, en lecture seule, pour
 * tout membre du projet. Le document de la version est chargé dans l'éditeur sans enregistrement
 * automatique ni collaboration : rien ici ne peut modifier le projet. Les changements depuis la
 * version précédente sont surlignés sur le plan.
 */
export default function VersionPreviewPage() {
  const { projectId = '', versionId = '' } = useParams()
  const loadProject = useEditorStore((state) => state.loadProject)
  const closeProject = useEditorStore((state) => state.closeProject)
  const setChanges = useVersionPreviewStore((state) => state.setChanges)
  const key = `${projectId}|${versionId}`
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [busy, setBusy] = useState<'restore' | 'copy' | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    const load = async (): Promise<Loaded> => {
      const role = await fetchMyRole(projectId)
      if (!role) return { key, state: 'not-found' }
      const [project, versions, people] = await Promise.all([
        repository.get(projectId),
        listVersions(projectId),
        listProjectPeople(projectId, fr.history.unknownAuthor),
      ])
      const version = versions.find((candidate) => candidate.id === versionId)
      if (!project || !version) return { key, state: 'not-found' }
      const previous = previousVersionOf(versions, versionId)
      const [document, previousDocument] = await Promise.all([
        fetchVersionDocument(versionId),
        previous ? fetchVersionDocument(previous.id) : Promise.resolve(null),
      ])
      if (!document) return { key, state: 'not-found' }
      if (cancelled) return { key, state: 'error' }
      const changes = previous && previousDocument ? diffVersions(previousDocument, document) : null
      // Le nom et le type viennent du projet ; le contenu, de la version.
      loadProject({ ...project, document })
      setChanges(changes)
      return {
        key,
        state: 'ready',
        version,
        changes,
        people: new Map(people.map((person) => [person.id, person])),
        canName: canEdit(role),
      }
    }
    load()
      .then((result) => {
        if (!cancelled) setLoaded(result)
      })
      .catch(() => {
        if (!cancelled) setLoaded({ key, state: 'error' })
      })
    return () => {
      cancelled = true
      setChanges(null)
      closeProject()
    }
  }, [key, projectId, versionId, loadProject, closeProject, setChanges])

  if (!loaded || loaded.key !== key) return <p className="p-8 text-slate-500">{fr.common.loading}</p>

  if (loaded.state !== 'ready' || !loaded.version) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold">{fr.editor.notFoundTitle}</h1>
        <p className="mt-2 text-slate-600">
          {loaded.state === 'error' ? fr.history.preview.loadError : fr.history.preview.notFound}
        </p>
        <Link to={`/p/${encodeURIComponent(projectId)}`} className="mt-4 inline-block text-indigo-600 underline">
          {fr.history.preview.back}
        </Link>
      </main>
    )
  }

  const version = loaded.version
  const label = version.name ?? fr.history.preview.when(version.savedAt)

  // Restaurer : l'éditeur s'en charge à son ouverture (collaboration, sauvegarde « Avant restauration »).
  const restore = () => {
    const document = useEditorStore.getState().project?.document
    if (!document) return
    setBusy('restore')
    setPendingRestore({ projectId, versionId: version.id, document, label })
    navigate(`/p/${encodeURIComponent(projectId)}`)
  }

  // Faire une copie : un nouveau projet à mon nom, à partir du document de la version.
  const copy = async () => {
    const project = useEditorStore.getState().project
    if (!project) return
    setBusy('copy')
    try {
      const duplicate = duplicateProject(
        { ...project, thumbnail: undefined },
        fr.history.preview.copyName(project.name, fr.history.preview.when(version.savedAt)).slice(0, 200),
      )
      await repository.save(duplicate)
      navigate(`/p/${encodeURIComponent(duplicate.id)}`)
    } catch {
      useEditorStore.getState().setNotice(fr.history.preview.copyError, 'error')
      setBusy(null)
    }
  }

  const banner = (
    <VersionBanner
      projectId={projectId}
      version={version}
      changes={loaded.changes ?? null}
      people={loaded.people ?? new Map()}
      canRestore={loaded.canName ?? false}
      busy={busy}
      onRestore={restore}
      onCopy={() => void copy()}
    />
  )
  if (useEditorStore.getState().project?.kind === 'plan') {
    return (
      <Suspense fallback={<p className="pascal-shell p-8 text-muted-foreground">{fr.common.loading}</p>}>
        <PascalReadOnly banner={banner} history canName={loaded.canName ?? false} versionId={versionId} />
      </Suspense>
    )
  }

  return (
    <ReadOnlyViewer
      banner={
        <VersionBanner
          projectId={projectId}
          version={version}
          changes={loaded.changes ?? null}
          people={loaded.people ?? new Map()}
          canRestore={loaded.canName ?? false}
          busy={busy}
          onRestore={restore}
          onCopy={() => void copy()}
        />
      }
      aside={<ReadOnlySidePanel canName={loaded.canName ?? false} selectedVersionId={versionId} />}
    />
  )
}
