import { ArrowRight, BookOpen, Building2, ChevronRight, PencilRuler, Ruler, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import AccountButton from '../components/home/AccountButton'
import DeleteDialog from '../components/home/DeleteDialog'
import ImportLocalDialog from '../components/home/ImportLocalDialog'
import ProjectCard from '../components/home/ProjectCard'
import RenameDialog from '../components/home/RenameDialog'
import Button from '../components/ui/Button'
import { filterProjectsByName } from '../features/persistence/filterProjects'
import { wasImportAsked } from '../features/persistence/importPrompt'
import { localRepository } from '../features/persistence/repository'
import type { ProjectSummary } from '../features/persistence/types'
import { fr } from '../i18n/fr'
import { useAuthStore } from '../stores/authStore'
import { useProjectsStore } from '../stores/projectsStore'

type Dialog =
  | { type: 'rename'; project: ProjectSummary }
  | { type: 'delete'; project: ProjectSummary }

export default function HomePage() {
  const navigate = useNavigate()
  const { projects, status, refresh, createPlan, createExample, createLargeHouse, rename, duplicate, remove } =
    useProjectsStore()
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const [query, setQuery] = useState('')
  const shown = useMemo(() => filterProjectsByName(projects, query), [projects, query])

  // La liste n'est lue qu'une fois la session connue, et relue quand on se connecte ou se déconnecte.
  const authStatus = useAuthStore((state) => state.status)
  const userId = useAuthStore((state) => state.user?.id ?? null)
  useEffect(() => {
    if (authStatus === 'loading') return
    void refresh()
  }, [refresh, authStatus, userId])

  // À la connexion : s'il y a des projets dans ce navigateur, on propose de les copier dans le compte (une fois par compte).
  const [localToImport, setLocalToImport] = useState(0)
  useEffect(() => {
    if (authStatus !== 'signedIn' || !userId || wasImportAsked(userId)) return
    let cancelled = false
    void localRepository.list().then((list) => {
      if (!cancelled) setLocalToImport(list.length)
    })
    return () => {
      cancelled = true
    }
  }, [authStatus, userId])

  const closeDialog = () => setDialog(null)

  const handleCreatePlan = async () => {
    const id = await createPlan()
    navigate(`/p/${id}`)
  }

  const handleCreateExample = async () => {
    const id = await createExample()
    navigate(`/p/${id}`)
  }

  const handleCreateLargeHouse = async () => {
    const id = await createLargeHouse()
    navigate(`/p/${id}`)
  }

  const focusRing =
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50'

  const examples = [
    { key: 'example', Icon: BookOpen, card: fr.home.cards.example, onOpen: handleCreateExample },
    { key: 'largeHouse', Icon: Building2, card: fr.home.cards.largeHouse, onOpen: handleCreateLargeHouse },
  ]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-4">
          <span className="flex size-9 items-center justify-center rounded-xl bg-indigo-950 text-indigo-200 shadow-sm shadow-indigo-950/20">
            <PencilRuler size={18} aria-hidden="true" />
          </span>
          <h1 className="text-xl font-bold tracking-tight text-indigo-950">{fr.app.name}</h1>
          <AccountButton />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-16 pt-12">
        <h2 className="text-2xl font-semibold tracking-tight text-balance text-slate-950">
          {fr.home.startTitle}
        </h2>

        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-5">
          <button
            type="button"
            onClick={() => void handleCreatePlan()}
            className={`rise group relative flex min-h-64 flex-col items-start justify-end overflow-hidden rounded-3xl bg-indigo-950 p-7 text-left shadow-xl shadow-indigo-950/20 ring-1 ring-indigo-900 transition-shadow duration-300 hover:shadow-2xl hover:shadow-indigo-950/30 lg:col-span-3 ${focusRing}`}
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgb(165_180_252/0.14)_1px,transparent_1px),linear-gradient(to_bottom,rgb(165_180_252/0.14)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]"
            />
            <svg
              aria-hidden="true"
              viewBox="0 0 220 150"
              fill="none"
              className="pointer-events-none absolute right-6 top-6 w-44 text-indigo-300/70 transition-transform duration-500 ease-out group-hover:-translate-y-0.5 group-hover:scale-[1.03] sm:w-56"
            >
              <path
                d="M8 8h204v134H8z M8 78h96 M140 8v70 M104 78v64"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinejoin="round"
              />
              <path d="M104 100a22 22 0 0 0 22-22" stroke="currentColor" strokeWidth="1.5" />
              <path d="M104 78h22" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 156h204 M8 152v8 M212 152v8" stroke="currentColor" strokeWidth="1" opacity="0.6" />
            </svg>
            <Ruler size={22} className="relative text-indigo-300" aria-hidden="true" />
            <span className="relative mt-3 flex w-full items-center justify-between gap-4 text-2xl font-semibold tracking-tight text-white">
              {fr.home.cards.plan.title}
              <ArrowRight
                size={22}
                aria-hidden="true"
                className="shrink-0 text-indigo-300 transition-transform duration-300 ease-out group-hover:translate-x-1"
              />
            </span>
            <span className="relative mt-2 max-w-sm text-base leading-relaxed text-indigo-200">
              {fr.home.cards.plan.text}
            </span>
          </button>

          <section
            aria-labelledby="examples-family"
            className="rise flex flex-col rounded-3xl border border-slate-200 bg-white p-2 shadow-sm [animation-delay:90ms] lg:col-span-2"
          >
            <h3 id="examples-family" className="px-4 pb-1 pt-4 text-base font-semibold text-slate-900">
              {fr.home.examplesFamily}
            </h3>
            <ul className="flex flex-1 flex-col divide-y divide-slate-100">
              {examples.map(({ key, Icon, card, onOpen }) => (
                <li key={key} className="flex flex-1">
                  <button
                    type="button"
                    onClick={() => void onOpen()}
                    className={`group flex w-full items-start gap-4 rounded-2xl px-4 py-4 text-left transition-colors hover:bg-indigo-50/60 ${focusRing}`}
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-100">
                      <Icon size={20} aria-hidden="true" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="font-semibold text-slate-900">{card.title}</span>
                      <span className="text-sm leading-relaxed text-slate-600">{card.text}</span>
                    </span>
                    <ChevronRight
                      size={18}
                      aria-hidden="true"
                      className="mt-3 shrink-0 text-slate-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-indigo-500"
                    />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
        <p className="mt-4 max-w-2xl text-xs leading-relaxed text-slate-500">
          {fr.home.storageReminder}
        </p>

        <h2 className="mt-16 text-2xl font-semibold tracking-tight text-slate-950">{fr.home.title}</h2>

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
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white/60 p-10 text-center">
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
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm shadow-sm placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
        )}

        {projects.length > 0 && shown.length === 0 && (
          <p className="mt-4 text-sm text-slate-500">{fr.home.noSearchResult(query.trim())}</p>
        )}

        {shown.length > 0 && (
          <ul className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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

      {localToImport > 0 && userId && (
        <ImportLocalDialog
          userId={userId}
          count={localToImport}
          onClose={(imported) => {
            setLocalToImport(0)
            if (imported) void refresh()
          }}
        />
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
