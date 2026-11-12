import { BookOpen, PenTool, Ruler, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import DeleteDialog from '../components/home/DeleteDialog'
import NewDesignDialog from '../components/home/NewDesignDialog'
import ProjectCard from '../components/home/ProjectCard'
import RenameDialog from '../components/home/RenameDialog'
import Button from '../components/ui/Button'
import type { DesignFormatId } from '../features/documents/createProject'
import { filterProjectsByName } from '../features/persistence/filterProjects'
import type { ProjectSummary } from '../features/persistence/types'
import { fr } from '../i18n/fr'
import { useProjectsStore } from '../stores/projectsStore'

type Dialog =
  | { type: 'new-design' }
  | { type: 'rename'; project: ProjectSummary }
  | { type: 'delete'; project: ProjectSummary }

export default function HomePage() {
  const navigate = useNavigate()
  const { projects, status, refresh, createDesign, createPlan, createExample, rename, duplicate, remove } =
    useProjectsStore()
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const [query, setQuery] = useState('')
  const shown = useMemo(() => filterProjectsByName(projects, query), [projects, query])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const closeDialog = () => setDialog(null)

  const handleCreateDesign = async (formatId: DesignFormatId) => {
    const id = await createDesign(formatId)
    navigate(`/p/${id}`)
  }

  const handleCreatePlan = async () => {
    const id = await createPlan()
    navigate(`/p/${id}`)
  }

  const handleCreateExample = async () => {
    const id = await createExample()
    navigate(`/p/${id}`)
  }

  const cardClass =
    'flex flex-col items-start gap-2 rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm hover:border-indigo-300 hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-bold text-indigo-600">{fr.app.name}</h1>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <h2 className="text-lg font-semibold">{fr.home.startTitle}</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <button type="button" className={cardClass} onClick={() => void handleCreatePlan()}>
            <Ruler size={24} className="text-indigo-600" aria-hidden="true" />
            <span className="font-semibold">{fr.home.cards.plan.title}</span>
            <span className="text-sm text-slate-500">{fr.home.cards.plan.text}</span>
          </button>
          <button type="button" className={cardClass} onClick={() => setDialog({ type: 'new-design' })}>
            <PenTool size={24} className="text-indigo-600" aria-hidden="true" />
            <span className="font-semibold">{fr.home.cards.design.title}</span>
            <span className="text-sm text-slate-500">{fr.home.cards.design.text}</span>
          </button>
          <button type="button" className={cardClass} onClick={() => void handleCreateExample()}>
            <BookOpen size={24} className="text-indigo-600" aria-hidden="true" />
            <span className="font-semibold">{fr.home.cards.example.title}</span>
            <span className="text-sm text-slate-500">{fr.home.cards.example.text}</span>
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-500">{fr.home.storageReminder}</p>

        <h2 className="mt-10 text-lg font-semibold">{fr.home.title}</h2>

        {(status === 'idle' || status === 'loading') && projects.length === 0 && (
          <p className="mt-4 text-slate-500">{fr.common.loading}</p>
        )}

        {status === 'error' && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            <p>{fr.home.loadError}</p>
            <Button className="mt-3" onClick={() => void refresh()}>
              {fr.common.retry}
            </Button>
          </div>
        )}

        {status === 'ready' && projects.length === 0 && (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="font-medium">{fr.home.emptyTitle}</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{fr.home.emptyText}</p>
          </div>
        )}

        {projects.length > 0 && (
          <div className="relative mt-4 max-w-md">
            <Search
              size={16}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={fr.home.searchPlaceholder}
              aria-label={fr.home.searchLabel}
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
        )}

        {projects.length > 0 && shown.length === 0 && (
          <p className="mt-4 text-sm text-slate-500">{fr.home.noSearchResult(query.trim())}</p>
        )}

        {shown.length > 0 && (
          <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onRename={() => setDialog({ type: 'rename', project })}
                onDuplicate={() => void duplicate(project.id)}
                onDelete={() => setDialog({ type: 'delete', project })}
              />
            ))}
          </ul>
        )}
      </main>

      {dialog?.type === 'new-design' && (
        <NewDesignDialog onSelect={(id) => void handleCreateDesign(id)} onClose={closeDialog} />
      )}
      {dialog?.type === 'rename' && (
        <RenameDialog
          currentName={dialog.project.name}
          onClose={closeDialog}
          onSubmit={(name) => {
            void rename(dialog.project.id, name)
            closeDialog()
          }}
        />
      )}
      {dialog?.type === 'delete' && (
        <DeleteDialog
          projectName={dialog.project.name}
          onClose={closeDialog}
          onConfirm={() => {
            void remove(dialog.project.id)
            closeDialog()
          }}
        />
      )}
    </div>
  )
}
