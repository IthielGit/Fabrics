import { BookOpen, Building2, ChevronRight, FileUp, Image, Loader2, Plus, Ruler, Search, Settings } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import AccountButton from '../components/home/AccountButton'
import DeleteDialog from '../components/home/DeleteDialog'
import ImportIfcDialog from '../components/home/ImportIfcDialog'
import ImportLocalDialog from '../components/home/ImportLocalDialog'
import LeaveDialog from '../components/home/LeaveDialog'
import NewDesignDialog from '../components/home/NewDesignDialog'
import ProjectCard from '../components/home/ProjectCard'
import RenameDialog from '../components/home/RenameDialog'
import SharedProjectCard from '../components/home/SharedProjectCard'
import { useSharedProjects } from '../components/home/useSharedProjects'
import { AppHeader, AppShell, ICON_BUTTON, PRIMARY_PILL, SECONDARY_PILL } from '../components/shell/AppShell'
import { displayProjectName } from '../features/documents/projectName'
import { filterProjectsByName } from '../features/persistence/filterProjects'
import { wasImportAsked } from '../features/persistence/importPrompt'
import { localRepository } from '../features/persistence/repository'
import type { ProjectSummary } from '../features/persistence/types'
import { removeMember } from '../features/sharing/membersApi'
import type { SharedProjectSummary } from '../features/sharing/membersLogic'
import { useT } from '../i18n/useT'
import { useAuthStore } from '../stores/authStore'
import { useProjectsStore } from '../stores/projectsStore'

type Dialog =
  | { type: 'rename'; project: ProjectSummary }
  | { type: 'delete'; project: ProjectSummary }
  | { type: 'leave'; project: SharedProjectSummary }
  | { type: 'newDesign' }
  | { type: 'importIfc' }

/** Accueil des projets, d'après `app/page.tsx` de Pascal (M19 A1) : en-tête, création, grille de cartes. */
export default function HomePage() {
  const t = useT()
  const navigate = useNavigate()
  const { projects, status, refresh, createPlan, createDesign, createExample, createLargeHouse, importPlan, rename, duplicate, remove } =
    useProjectsStore()
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const [query, setQuery] = useState('')
  const shown = useMemo(() => filterProjectsByName(projects, query), [projects, query])

  // La liste n'est lue qu'une fois la session connue, et relue quand on se connecte ou se déconnecte.
  const authStatus = useAuthStore((state) => state.status)
  const userId = useAuthStore((state) => state.user?.id ?? null)
  const shared = useSharedProjects(userId)
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

  // Projet en cours de création : le bouton cliqué affiche une roue, les autres attendent (pas de double création).
  const [opening, setOpening] = useState<string | null>(null)
  const openNew = async (key: string, create: () => Promise<string>) => {
    if (opening) return
    setOpening(key)
    try {
      navigate(`/p/${await create()}`)
    } catch {
      setOpening(null)
    }
  }

  const examples = [
    { key: 'example', Icon: BookOpen, title: t('home.example.title'), text: t('home.example.text'), create: createExample },
    {
      key: 'largeHouse',
      Icon: Building2,
      title: t('home.largeHouse.title'),
      text: t('home.largeHouse.text'),
      create: createLargeHouse,
    },
  ]

  const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

  return (
    <AppShell>
      <AppHeader>
        <button
          type="button"
          className={PRIMARY_PILL}
          disabled={opening !== null}
          aria-busy={opening === 'plan'}
          onClick={() => void openNew('plan', createPlan)}
        >
          {opening === 'plan' ? <Loader2 size={16} aria-hidden="true" className="animate-spin" /> : <Plus size={16} aria-hidden="true" />}
          {t('home.newPlan')}
        </button>
        <button
          type="button"
          className={SECONDARY_PILL}
          disabled={opening !== null}
          aria-busy={opening === 'design'}
          onClick={() => setDialog({ type: 'newDesign' })}
        >
          {opening === 'design' ? <Loader2 size={16} aria-hidden="true" className="animate-spin" /> : <Image size={16} aria-hidden="true" />}
          {t('home.newDesign')}
        </button>
        <button type="button" className={SECONDARY_PILL} disabled={opening !== null} onClick={() => setDialog({ type: 'importIfc' })}>
          <FileUp size={16} aria-hidden="true" />
          {t('home.importIfc')}
        </button>
        <Link to="/reglages" aria-label={t('home.settings')} title={t('home.settings')} className={ICON_BUTTON}>
          <Settings size={16} aria-hidden="true" />
        </Link>
        <AccountButton />
      </AppHeader>

      <main className="mx-auto max-w-6xl px-6 pb-16 pt-10">
        {status === 'ready' && projects.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <Ruler size={40} aria-hidden="true" className="text-muted-foreground/60" />
            <p className="font-medium">{t('home.emptyTitle')}</p>
            <p className="max-w-sm text-sm text-muted-foreground">{t('home.emptyText')}</p>
            <div className="flex flex-wrap justify-center gap-2">
            <button
                type="button"
                className={PRIMARY_PILL}
                disabled={opening !== null}
                onClick={() => void openNew('plan', createPlan)}
            >
                <Plus size={16} aria-hidden="true" />
                {t('home.plan.title')}
                </button>
                <button
                type="button"
                className={SECONDARY_PILL}
                disabled={opening !== null}
                onClick={() => setDialog({ type: 'newDesign' })}
            >
                <Image size={16} aria-hidden="true" />
                {t('home.design.title')}
                </button>
</div>
          </div>
        )}

        {(status === 'idle' || status === 'loading') && projects.length === 0 && (
          <p className="py-10 text-muted-foreground">{t('common.loading')}</p>
        )}

        {status === 'error' && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-destructive">
            <p>{t('home.loadError')}</p>
            <button type="button" className={`${SECONDARY_PILL} mt-3`} onClick={() => void refresh()}>
              {t('common.retry')}
            </button>
          </div>
        )}

        {projects.length > 0 && (
          <>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <h1 className="text-lg font-semibold">{t('home.title')}</h1>
              <div className="relative w-full max-w-xs">
                <Search
                  size={16}
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t('home.searchPlaceholder')}
                  aria-label={t('home.searchLabel')}
                  className="w-full rounded-lg border border-input bg-transparent py-1.5 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                />
              </div>
            </div>
            {shown.length === 0 && (
              <p className="text-sm text-muted-foreground">{t('home.noSearchResult', { query: query.trim() })}</p>
            )}
            {shown.length > 0 && (
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
          </>
        )}

        {shared.projects.length > 0 && (
          <section aria-labelledby="shared-with-me" className="mt-12">
            <h2 id="shared-with-me" className="mb-6 text-lg font-semibold">
              {t('shared.title')}
            </h2>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {shared.projects.map((project) => (
                <SharedProjectCard
                  key={project.id}
                  project={project}
                  onLeave={() => setDialog({ type: 'leave', project })}
                />
              ))}
            </ul>
          </section>
        )}
        {shared.failed && (
          <p role="alert" className="mt-8 text-sm text-destructive">
            {t('shared.loadError')}
          </p>
        )}

        <section aria-labelledby="examples-family" className="mt-12">
          <h2 id="examples-family" className="mb-4 text-lg font-semibold">
            {t('home.examplesFamily')}
          </h2>
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {examples.map(({ key, Icon, title, text, create }) => (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => void openNew(key, create)}
                  disabled={opening !== null}
                  aria-busy={opening === key}
                  className={`group flex h-full w-full items-start gap-4 rounded-xl border border-border/60 bg-background p-4 text-left transition-colors hover:border-border hover:bg-accent disabled:cursor-wait ${focusRing}`}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-sm font-medium">{title}</span>
                    <span className="text-xs leading-relaxed text-muted-foreground">{text}</span>
                  </span>
                  {opening === key ? (
                    <Loader2 size={18} aria-hidden="true" className="mt-2 shrink-0 animate-spin text-muted-foreground" />
                  ) : (
                    <ChevronRight
                      size={18}
                      aria-hidden="true"
                      className="mt-2 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5"
                    />
                  )}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-4 max-w-2xl text-xs leading-relaxed text-muted-foreground">{t('home.storageReminder')}</p>
        </section>
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
      {dialog?.type === 'importIfc' && (
        <ImportIfcDialog onImport={importPlan} onClose={closeDialog} onOpen={(id) => navigate(`/p/${id}`)} />
      )}
      {dialog?.type === 'newDesign' && (
        <NewDesignDialog
          onClose={closeDialog}
          onSelect={(formatId) => {
            closeDialog()
            void openNew('design', () => createDesign(formatId))
          }}
        />
      )}
      {dialog?.type === 'rename' && (
        <RenameDialog
          currentName={displayProjectName(dialog.project)}
          onClose={closeDialog}
          onSubmit={(name) => {
            void rename(dialog.project.id, name)
            closeDialog()
          }}
        />
      )}
      {dialog?.type === 'delete' && (
        <DeleteDialog
          projectName={displayProjectName(dialog.project)}
          onClose={closeDialog}
          onConfirm={() => {
            void remove(dialog.project.id)
            closeDialog()
          }}
        />
      )}
      {dialog?.type === 'leave' && userId && (
        <LeaveDialog
          projectName={displayProjectName(dialog.project)}
          onClose={closeDialog}
          onConfirm={() => {
            const { id } = dialog.project
            closeDialog()
            void removeMember(id, userId)
              .catch(() => undefined)
              .then(() => shared.reload())
          }}
        />
      )}
    </AppShell>
  )
}
