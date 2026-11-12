import type Konva from 'konva'
import { thumbnailPixelRatio } from '../../features/export/thumbnail'

// La scène Konva affichée à l'écran : l'éditeur l'enregistre à son ouverture.
let currentStage: Konva.Stage | null = null

export function setThumbnailStage(stage: Konva.Stage | null): void {
  currentStage = stage
}

/** La scène Konva de l'éditeur ouvert (`null` si aucun éditeur n'est affiché). */
export function getEditorStage(): Konva.Stage | null {
  return currentStage
}

/**
 * Photographie la page (et seulement elle) en petite image PNG, sans les poignées de sélection
 * ni les guides. Renvoie `null` s'il n'y a pas de scène ou si la capture échoue.
 */
export function captureThumbnail(page: { width: number; height: number }): string | null {
  const stage = currentStage
  if (!stage) return null

  const scale = stage.scaleX()
  const widthPx = page.width * scale
  const heightPx = page.height * scale
  if (widthPx <= 0 || heightPx <= 0) return null

  // On masque ce qui n'appartient pas au document : couches d'aide et transformateur.
  const helpers = [
    ...stage.getLayers().slice(1),
    ...stage.find('Transformer'),
    ...stage.find('.reference'),
    ...stage.find('.surface-highlight'),
  ].filter((node) => node.visible())
  helpers.forEach((node) => node.visible(false))
  try {
    return stage.toDataURL({
      x: stage.x(),
      y: stage.y(),
      width: widthPx,
      height: heightPx,
      pixelRatio: thumbnailPixelRatio(widthPx, heightPx),
      mimeType: 'image/png',
    })
  } catch {
    return null // une miniature manquante ne doit jamais empêcher l'enregistrement
  } finally {
    helpers.forEach((node) => node.visible(true))
    stage.batchDraw()
  }
}
