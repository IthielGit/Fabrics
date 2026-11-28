import { ArrowLeft, FileDown, FileUp, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import AccountButton from '../components/home/AccountButton'
import CreateWorkspaceForm from '../components/pricing/CreateWorkspaceForm'
import ImportDialog from '../components/pricing/ImportDialog'
import ImportHistorySection from '../components/pricing/ImportHistorySection'
import JournalPanel from '../components/editor/JournalPanel'
import { libraryJournal } from '../components/pricing/libraryJournal'
import LibrarySettingsSection from '../components/pricing/LibrarySettingsSection'
import MembersSection from '../components/pricing/MembersSection'
import PriceItemsTable from '../components/pricing/PriceItemsTable'
import RulesTable from '../components/pricing/RulesTable'
import { FIELD_INPUT } from '../components/pricing/styles'
import WorkItemsTable from '../components/pricing/WorkItemsTable'
import { AppHeader, AppShell, ICON_BUTTON, SECONDARY_PILL } from '../components/shell/AppShell'
import { buildLibraryWorkbook } from '../features/pricing/libraryExport'
import { canEditPrices, type PriceKind } from '../features/pricing/model'
import { downloadBlob } from '../lib/download'
import { formatRate } from '../features/pricing/money'
import { useT } from '../i18n/useT'
import { formatIsoDay } from '../lib/date'
import { useAuthStore } from '../stores/authStore'
import { usePricingStore } from '../stores/pricingStore'

type Tab = PriceKind | 'work' | 'rules' | 'members' | 'settings' | 'journal'

const TABS: readonly Tab[] = ['material', 'equipment', 'labour', 'work', 'rules', 'members', 'settings']

/** Bibliothèque de prix de l'espace (M23, 23.1) : matériaux, matériel, main-d'œuvre et postes. */
export default function PriceLibraryPage() {
  const t = useT()
  const userId = useAuthStore((state) => state.user?.id ?? null)
  const status = usePricingStore((state) => state.status)
  const repository = usePricingStore((state) => state.repository)
  const workspaces = usePricingStore((state) => state.workspaces)
  const workspace = usePricingStore((state) => state.workspace)
  const library = usePricingStore((state) => state.library)
  const load = usePricingStore((state) => state.load)
  const selectWorkspace = usePricingStore((state) => state.selectWorkspace)
  const [tab, setTab] = useState<Tab>('material')
  const [creating, setCreating] = useState(false)
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    void load(userId)
  }, [load, userId])

  const canEdit = workspace ? canEditPrices(workspace.role) : false

  return (
    <AppShell>
      <AppHeader>
        <AccountButton />
      </AppHeader>
      <main className="mx-auto max-w-6xl px-6 pb-16 pt-10">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Link to="/" aria-label={t('auth.backToHome')} title={t('auth.backToHome')} className={ICON_BUTTON}>
            <ArrowLeft size={16} aria-hidden="true" />
          </Link>
          <h1 className="text-lg font-semibold">{t('pricing.title')}</h1>
          {workspace && (
            <div className="ml-auto flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">{t('pricing.workspaceLabel')}</span>
                <select
                  className={`${FIELD_INPUT} w-auto`}
                  value={workspace.id}
                  onChange={(event) => void selectWorkspace(event.target.value)}
                >
                  {workspaces.map((ws) => (
                    <option key={ws.id} value={ws.id}>
                      {ws.name}
                    </option>
                  ))}
                </select>
              </label>
              <span className="rounded bg-secondary px-2 py-0.5 text-xs">{t(`pricing.role.${workspace.role}`)}</span>
              {repository?.shared && (
                <button type="button" className={SECONDARY_PILL} onClick={() => setCreating(true)}>
                  <Plus size={14} aria-hidden="true" />
                  {t('pricing.newWorkspace')}
                </button>
              )}
            </div>
          )}
        </div>

        {(status === 'idle' || status === 'loading') && <p className="text-sm text-muted-foreground">{t('common.loading')}</p>}

        {status === 'error' && (
          <div className="space-y-2 text-sm">
            <p className="text-red-600" role="alert">
              {t('pricing.loadError')}
            </p>
            {userId && <p className="text-muted-foreground">{t('pricing.sqlHint')}</p>}
            <button type="button" className={SECONDARY_PILL} onClick={() => void load(userId)}>
              {t('common.retry')}
            </button>
          </div>
        )}

        {status === 'ready' && repository && !repository.shared && (
          <p className="mb-4 text-xs text-muted-foreground">{t('pricing.localNote')}</p>
        )}

        {status === 'ready' && (!workspace || creating) && (
          <CreateWorkspaceForm onDone={() => setCreating(false)} />
        )}

        {status === 'ready' && workspace && library && !creating && (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                {t('pricing.summary', {
                  version: library.version,
                  date: library.priceDate ? formatIsoDay(library.priceDate) : t('pricing.noDate'),
                  rate: formatRate(library.vatRateBp),
                })}
              </p>
              {canEdit && (
                <div className="flex flex-wrap gap-2">
                  {/* Copie complète relisible par « Importer » (M24, 24.3, D24-3) ; admins seulement, comme l'export du DQE. */}
                  <button
                    type="button"
                    className={SECONDARY_PILL}
                    title={t('pricing.export.hint')}
                    onClick={() => {
                      const { priceItems, workItems } = usePricingStore.getState()
                      const bytes = buildLibraryWorkbook(library, priceItems, workItems)
                      downloadBlob(
                        new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
                        `${library.name.replace(/[\\/:*?"<>|]+/g, ' ').trim() || 'bibliotheque'} - bibliothèque ${new Date().toISOString().slice(0, 10)}.xlsx`,
                      )
                    }}
                  >
                    <FileDown size={14} aria-hidden="true" />
                    {t('pricing.export.button')}
                  </button>
                  <button type="button" className={SECONDARY_PILL} onClick={() => setImporting(true)}>
                    <FileUp size={14} aria-hidden="true" />
                    {t('pricing.import.button')}
                  </button>
                </div>
              )}
            </div>
            {!canEdit && <p className="mb-4 rounded-lg bg-secondary px-3 py-2 text-sm">{t('pricing.readOnly')}</p>}

            <div role="tablist" className="mb-4 flex flex-wrap gap-1 border-b border-border">
              {(canEdit ? [...TABS, 'journal' as const] : TABS).map((id) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={tab === id}
                  onClick={() => setTab(id)}
                  className={`-mb-px border-b-2 px-3 py-2 text-sm transition-colors ${
                    tab === id
                      ? 'border-primary font-medium text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t(`pricing.tab.${id}`)}
                </button>
              ))}
            </div>

            <div role="tabpanel">
              {(tab === 'material' || tab === 'equipment' || tab === 'labour') && (
                <PriceItemsTable key={tab} kind={tab} canEdit={canEdit} />
              )}
              {tab === 'work' && <WorkItemsTable canEdit={canEdit} />}
              {tab === 'rules' && <RulesTable canEdit={canEdit} />}
              {tab === 'members' && <MembersSection />}
              {tab === 'journal' && repository && (
                <JournalPanel key={workspace.id} load={() => libraryJournal(repository, workspace.id, library.id)} intro={t('journal.libraryIntro')} />
              )}
              {tab === 'settings' && (
                <div className="grid gap-4">
                  <LibrarySettingsSection key={library.id} canEdit={canEdit} />
                  <ImportHistorySection />
                </div>
              )}
            </div>
            {importing && <ImportDialog onClose={() => setImporting(false)} />}
          </>
        )}
      </main>
    </AppShell>
  )
}
