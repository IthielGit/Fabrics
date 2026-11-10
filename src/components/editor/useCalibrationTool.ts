import type Konva from 'konva'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  calibrateImage,
  calibrationFactor,
  findImageAt,
} from '../../features/geometry/calibration'
import { pointDistance } from '../../features/geometry/polygon'
import type { Point } from '../../features/geometry/viewport'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'
import { isTypingTarget } from './isTypingTarget'

type PointerEvent = Konva.KonvaEventObject<MouseEvent | TouchEvent>

export interface CalibrationState {
  /** Points A puis B cliqués sur l'image (coordonnées du document). */
  points: Point[]
  cursor: Point | null
  /** Image sur laquelle le premier point a été posé. */
  imageId: string | null
  /** Les deux points sont posés : on attend la distance réelle. */
  pending: { a: Point; b: Point; imageId: string } | null
}

const EMPTY: CalibrationState = { points: [], cursor: null, imageId: null, pending: null }

/**
 * Outil Calibrer : deux clics sur une image importée, puis saisie de la distance réelle entre
 * ces deux points ; l'image est mise à l'échelle autour du point A (docs/02-ARCHITECTURE.md).
 */
export function useCalibrationTool(active: boolean) {
  const [stored, setStored] = useState({ active, value: EMPTY })
  const storedRef = useRef(stored)

  // Quitter ou rejoindre l'outil repart de zéro (réglage d'état pendant le rendu, sans effet).
  if (stored.active !== active) setStored({ active, value: EMPTY })
  const state = stored.active === active ? stored.value : EMPTY

  useEffect(() => {
    storedRef.current = stored
  }, [stored])

  const read = useCallback(
    () => (storedRef.current.active === active ? storedRef.current.value : EMPTY),
    [active],
  )
  const write = useCallback(
    (value: CalibrationState) => {
      storedRef.current = { active, value }
      setStored({ active, value })
    },
    [active],
  )

  const onPointerDown = useCallback(
    (event: PointerEvent) => {
      if (!active) return
      const raw = event.target.getStage()?.getRelativePointerPosition()
      if (!raw) return
      const current = read()
      if (current.pending) return // la fenêtre de saisie est ouverte

      const store = useEditorStore.getState()
      if (current.points.length === 0) {
        const image = findImageAt(store.project?.document.elements ?? [], raw)
        if (!image) {
          store.setNotice(fr.calibrate.noImage)
          return
        }
        store.setNotice(null)
        write({ points: [raw], cursor: raw, imageId: image.id, pending: null })
        return
      }

      const a = current.points[0]
      if (pointDistance(a, raw) < 1e-6 || !current.imageId) return
      write({ ...current, points: [a, raw], pending: { a, b: raw, imageId: current.imageId } })
    },
    [active, read, write],
  )

  const onPointerMove = useCallback(
    (event: PointerEvent) => {
      if (!active) return
      const current = read()
      if (current.pending || current.points.length === 0) return
      const raw = event.target.getStage()?.getRelativePointerPosition()
      if (raw) write({ ...current, cursor: raw })
    },
    [active, read, write],
  )

  const cancel = useCallback(() => write(EMPTY), [write])

  /** Applique la distance réelle saisie (en mm) : met l'image à l'échelle et quitte l'outil. */
  const confirm = useCallback(
    (realDistanceMm: number): boolean => {
      const { pending } = read()
      if (!pending) return false
      const factor = calibrationFactor(pending.a, pending.b, realDistanceMm)
      if (factor === null) return false
      const store = useEditorStore.getState()
      store.updateElements([pending.imageId], (el) =>
        el.type === 'image' ? calibrateImage(el, pending.a, factor) : el,
      )
      write(EMPTY)
      store.setTool('select')
      return true
    },
    [read, write],
  )

  // Échap annule le point posé (écouté en phase de capture, avant les raccourcis généraux).
  useEffect(() => {
    if (!active) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || isTypingTarget(event.target)) return
      const current = read()
      if (current.points.length === 0 && !current.pending) return
      event.preventDefault()
      event.stopImmediatePropagation()
      cancel()
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [active, read, cancel])

  return useMemo(
    () => ({ state, onPointerDown, onPointerMove, cancel, confirm }),
    [state, onPointerDown, onPointerMove, cancel, confirm],
  )
}
