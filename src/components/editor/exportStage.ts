import Konva from 'konva'
import type { Box } from '../../features/geometry/box'
import { useEditorStore } from '../../stores/editorStore'
import { getEditorStage } from './thumbnail'

export interface RasterRequest {
  /** Zone à photographier, dans l'unité du document (px ou mm). */
  region: Box
  /** Taille exacte de l'image obtenue, en pixels. */
  widthPx: number
  heightPx: number
  mimeType: 'image/png' | 'image/jpeg'
  /** Qualité JPEG, entre 0 et 1. */
  quality?: number
  /** Couleur de fond, utile hors de la page et pour le JPG (qui n'a pas de transparence). */
  background: string
}

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

/**
 * Photographie une zone du document avec la scène Konva de l'éditeur, sans la sélection, les
 * guides, les poignées ni la grille. Tout est remis en l'état ensuite. Renvoie une image en
 * « data URL ». Échoue si aucun éditeur n'est ouvert ou si le navigateur refuse l'image.
 *
 * Pour un plan, la vue est ramenée un instant à 100 % : les traits fins (en pixels écran) ont
 * alors toujours la même épaisseur sur le plan, quel que soit le zoom de l'utilisateur.
 */
export async function captureRegion(request: RasterRequest, forcePlanZoom: boolean): Promise<string> {
  const stage = getEditorStage()
  if (!stage) throw new Error('Aucun éditeur ouvert')

  const store = useEditorStore.getState()
  const saved = {
    selectedIds: store.selectedIds,
    zoom: store.zoom,
    stagePosition: store.stagePosition,
  }

  // 1. Retire la sélection (poignées, surbrillance) et normalise le zoom, puis laisse React redessiner.
  store.setSelection([])
  if (forcePlanZoom) store.setView({ zoom: 1, stagePosition: saved.stagePosition })
  await nextFrame()
  await nextFrame()

  const layer = stage.getLayers()[0]
  const previous = {
    scale: stage.scale(),
    position: stage.position(),
  }
  const hidden = [
    ...stage.getLayers().slice(1),
    ...stage.find('Transformer'),
    ...stage.find('.grid'),
    ...stage.find('.reference'),
    ...stage.find('.surface-highlight'),
  ].filter((node) => node.visible())
  const page = stage.findOne('.page')
  const pageStroke = page && 'strokeEnabled' in page ? (page as Konva.Rect).strokeEnabled() : true
  let background: Konva.Rect | null = null

  try {
    hidden.forEach((node) => node.visible(false))
    if (page) (page as Konva.Rect).strokeEnabled(false)

    // 2. Fond uni sous la page : couvre ce qui dépasse de la page et évite un JPG à fond noir.
    if (layer) {
      background = new Konva.Rect({
        ...request.region,
        fill: request.background,
        listening: false,
      })
      layer.add(background)
      background.moveToBottom()
    }

    // 3. Échelle exacte : 1 unité du document = `k` pixels, la zone en haut à gauche de l'image.
    const kx = request.widthPx / request.region.width
    const ky = request.heightPx / request.region.height
    stage.scale({ x: kx, y: ky })
    stage.position({ x: -request.region.x * kx, y: -request.region.y * ky })

    return stage.toDataURL({
      x: 0,
      y: 0,
      width: request.widthPx,
      height: request.heightPx,
      pixelRatio: 1,
      mimeType: request.mimeType,
      quality: request.quality,
    })
  } finally {
    background?.destroy()
    if (page) (page as Konva.Rect).strokeEnabled(pageStroke)
    hidden.forEach((node) => node.visible(true))
    stage.scale(previous.scale)
    stage.position(previous.position)
    stage.batchDraw()
    const after = useEditorStore.getState()
    after.setView({ zoom: saved.zoom, stagePosition: saved.stagePosition })
    after.setSelection(saved.selectedIds)
  }
}
