import { useCallback, useEffect, useMemo, useState } from 'react'
import { EXAMPLE_SETTINGS, type EstimateSettings } from '../../features/pricing/estimate'
import {
  fingerprintSource,
  freezeEstimate,
  type EstimateStatus,
  type EstimateVersion,
  type ProjectEstimatePatch,
  type ProjectEstimateRecord,
} from '../../features/pricing/estimateVersions'
import { projectEstimate } from '../../features/pricing/projectEstimate'
import { sha256Hex } from '../../features/pricing/readPriceFile'
import type { QuantityOverride } from '../../features/pricing/rules'
import { useAuthStore } from '../../stores/authStore'
import { useEditorStore } from '../../stores/editorStore'
import { usePricingStore } from '../../stores/pricingStore'

/**
 * DQE du projet ouvert (M23, 23.6) : réglages et corrections enregistrés dans l'espace, calcul en
 * direct à chaque modification du plan, versions figées et leur empreinte.
 */
export function useProjectEstimate() {
  const userId = useAuthStore((state) => state.user?.id ?? null)
  const project = useEditorStore((state) => state.project)
  const pricing = usePricingStore()
  const [record, setRecord] = useState<ProjectEstimateRecord | null>(null)
  const [versions, setVersions] = useState<EstimateVersion[]>([])
  const [failed, setFailed] = useState(false)
  const [fingerprint, setFingerprint] = useState<string | null>(null)

  const { status, load, repository, library, workspace } = pricing
  useEffect(() => {
    if (status === 'idle' || pricing.userId !== userId) void load(userId)
  }, [status, load, userId, pricing.userId])

  const projectId = project?.id ?? null
  const libraryId = library?.id ?? null
  useEffect(() => {
    if (!repository || !libraryId || !projectId) return
    let cancelled = false
    repository
      .getProjectEstimate(libraryId, projectId)
      .then(async (found) => {
        const list = found ? await repository.listEstimateVersions(found.id) : []
        if (cancelled) return
        setRecord(found)
        setVersions(list)
      })
      .catch((error: unknown) => {
        console.error('Devis du projet :', error)
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [repository, libraryId, projectId])

  const a1Bp = record?.a1Bp ?? EXAMPLE_SETTINGS.a1Bp
  const a2Bp = record?.a2Bp ?? EXAMPLE_SETTINGS.a2Bp
  const a3Bp = record?.a3Bp ?? EXAMPLE_SETTINGS.a3Bp
  const vatRateBp = library?.vatRateBp ?? null
  const settings = useMemo<EstimateSettings | null>(
    () => (vatRateBp === null ? null : { a1Bp, a2Bp, a3Bp, vatRateBp }),
    [a1Bp, a2Bp, a3Bp, vatRateBp],
  )
  const overrides = useMemo(() => record?.overrides ?? [], [record])
  const document = project?.document
  const scene = project?.scene
  const { rules, workItems } = pricing

  // Recalculé à chaque modification du plan, des prix, des règles ou des réglages.
  const live = useMemo(() => {
    if (!document || !settings) return null
    return projectEstimate({ document, scene: scene ?? null, rules, workItems, settings, overrides })
  }, [document, scene, rules, workItems, overrides, settings])

  const fingerprintText = useMemo(
    () =>
      live && settings
        ? fingerprintSource({ quantities: live.quantities, workItems, rules, overrides, settings })
        : null,
    [live, workItems, rules, overrides, settings],
  )
  useEffect(() => {
    if (!fingerprintText) return
    let cancelled = false
    void sha256Hex(new TextEncoder().encode(fingerprintText)).then((hash) => !cancelled && setFingerprint(hash))
    return () => {
      cancelled = true
    }
  }, [fingerprintText])

  const save = useCallback(
    async (patch: Partial<ProjectEstimatePatch>) => {
      if (!repository || !libraryId || !projectId) return
      const next: ProjectEstimatePatch = {
        a1Bp: patch.a1Bp ?? record?.a1Bp ?? EXAMPLE_SETTINGS.a1Bp,
        a2Bp: patch.a2Bp ?? record?.a2Bp ?? EXAMPLE_SETTINGS.a2Bp,
        a3Bp: patch.a3Bp ?? record?.a3Bp ?? EXAMPLE_SETTINGS.a3Bp,
        overrides: patch.overrides ?? record?.overrides ?? [],
      }
      setRecord(await repository.saveProjectEstimate(libraryId, projectId, next, record?.id))
    },
    [repository, libraryId, projectId, record],
  )

  const addOverride = (override: Omit<QuantityOverride, 'id'>) =>
    save({ overrides: [...overrides, { ...override, id: crypto.randomUUID() }] })
  const removeOverride = (id: string) => save({ overrides: overrides.filter((o) => o.id !== id) })

  const freeze = async (versionStatus: EstimateStatus, note: string) => {
    if (!repository || !libraryId || !projectId || !live || !library || !fingerprint) return
    const saved = record ?? (await repository.saveProjectEstimate(libraryId, projectId, { ...EXAMPLE_SETTINGS, overrides: [] }))
    setRecord(saved)
    await repository.freezeEstimateVersion(saved.id, {
      status: versionStatus,
      libraryVersion: library.version,
      fingerprint,
      snapshot: freezeEstimate(live.estimate),
      note: note.trim(),
    })
    setVersions(await repository.listEstimateVersions(saved.id))
  }

  return {
    status,
    failed,
    workspace,
    library,
    rules,
    workItems,
    settings,
    record,
    versions,
    live,
    fingerprint,
    overrides,
    canEdit: workspace?.role === 'admin',
    save,
    addOverride,
    removeOverride,
    freeze,
  }
}
