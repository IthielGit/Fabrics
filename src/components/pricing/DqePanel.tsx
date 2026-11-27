import { Link } from 'react-router'
import { useT } from '../../i18n/useT'
import { useEditorStore } from '../../stores/editorStore'
import { usePricingStore } from '../../stores/pricingStore'
import DqeChecks from './DqeChecks'
import DqeExportSection from './DqeExportSection'
import DqeLines from './DqeLines'
import DqeOutline from './DqeOutline'
import DqeOverrides from './DqeOverrides'
import DqeSettingsSection from './DqeSettingsSection'
import DqeTotals from './DqeTotals'
import DqeVersions from './DqeVersions'
import { LINK_BUTTON } from './styles'
import { useProjectEstimate } from './useProjectEstimate'

/**
 * Panneau DQE d'un projet Plan (M23, 23.6) : lots, postes, quantités, prix, montants, origine,
 * couverture, réglage de K1, versions. Recalculé à chaque modification du plan.
 */
export default function DqePanel() {
  const t = useT()
  const projectId = useEditorStore((state) => state.project?.id ?? null)
  const projectName = useEditorStore((state) => state.project?.name ?? '')
  const setSelection = useEditorStore((state) => state.setSelection)
  const dqe = useProjectEstimate()
  const repository = usePricingStore((state) => state.repository)

  if (!projectId) return null
  if (dqe.status === 'idle' || dqe.status === 'loading') {
    return <p className="p-4 text-sm text-muted-foreground">{t('dqe.loading')}</p>
  }
  if (dqe.status === 'error' || dqe.failed) {
    return <p className="p-4 text-sm text-red-600">{t('dqe.loadError')}</p>
  }

  if (!dqe.workspace || !dqe.library || !dqe.settings || !dqe.live) {
    return (
      <section className="space-y-3 p-4 text-sm">
        <h2 className="text-base font-semibold">{t('dqe.title')}</h2>
        {repository && <DqeOutline repository={repository} projectId={projectId} />}
        <p className="text-muted-foreground">{t('dqe.noWorkspace')}</p>
        <Link to="/prix" className={LINK_BUTTON}>
          {t('dqe.openLibrary')}
        </Link>
      </section>
    )
  }

  const { estimate } = dqe.live
  return (
    <section aria-label={t('dqe.title')} className="space-y-5 p-4 text-sm">
      <div>
        <h2 className="text-base font-semibold">{t('dqe.title')}</h2>
        <p className="text-xs text-muted-foreground">
          {t('dqe.workspace', { name: dqe.workspace.name, version: dqe.library.version })}
        </p>
        {!dqe.canEdit && <p className="mt-1 text-xs text-muted-foreground">{t('dqe.readOnly')}</p>}
      </div>
      {dqe.rules.length === 0 && (
        <p className="text-xs text-amber-600">
          {t('dqe.noRules')}{' '}
          <Link to="/prix" className={LINK_BUTTON}>
            {t('dqe.openLibrary')}
          </Link>
        </p>
      )}
      <DqeSettingsSection
        settings={dqe.settings}
        isExample={dqe.record === null}
        canEdit={dqe.canEdit}
        onSave={(patch) => dqe.save(patch)}
      />
      <DqeChecks estimate={estimate} onSelect={setSelection} />
      <DqeLines
        estimate={estimate}
        rules={dqe.rules}
        canEdit={dqe.canEdit}
        onSelect={setSelection}
        onOverride={(override) => void dqe.addOverride(override).catch((error: unknown) => console.error('Correction :', error))}
      />
      <DqeOverrides
        overrides={dqe.overrides}
        canEdit={dqe.canEdit}
        onUndo={(id) => void dqe.removeOverride(id).catch((error: unknown) => console.error('Correction :', error))}
      />
      <DqeTotals estimate={estimate} />
      <DqeVersions
        estimate={estimate}
        versions={dqe.versions}
        fingerprint={dqe.fingerprint}
        canEdit={dqe.canEdit}
        onFreeze={dqe.freeze}
      />
      <DqeExportSection
        estimate={estimate}
        projectName={projectName}
        workspaceName={dqe.workspace.name}
        library={dqe.library}
        versions={dqe.versions}
        fingerprint={dqe.fingerprint}
        canEdit={dqe.canEdit}
      />
    </section>
  )
}
