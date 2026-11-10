import { createImageElement, duplicateOffset, nextElementName } from '../../features/documents/elements'
import { MAX_IMAGE_BYTES, checkImageFile, fitImageSize } from '../../features/documents/images'
import type { Point } from '../../features/geometry/viewport'
import { repository } from '../../features/persistence/repository'
import { fr } from '../../i18n/fr'
import { selectActiveElements, useEditorStore } from '../../stores/editorStore'

/** Lit les dimensions d'une image (en pixels) sans l'afficher. */
function readImageSize(file: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new window.Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: image.naturalWidth, height: image.naturalHeight })
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Image illisible'))
    }
    image.src = url
  })
}

/**
 * Importe des images dans le projet ouvert : vérification, enregistrement dans le stockage,
 * puis ajout sur la page (au centre, ou autour de `center` pour un glisser-déposer).
 * Les fichiers refusés sont signalés par un message, sans bloquer les autres.
 */
export async function importImageFiles(files: File[], center: Point | null = null): Promise<void> {
  const store = useEditorStore.getState()
  store.setNotice(null)

  let placed = 0
  for (const file of files) {
    const check = checkImageFile(file)
    if (check === 'unsupported') {
      useEditorStore.getState().setNotice(fr.notices.imageUnsupported(file.name))
      continue
    }
    if (check === 'too-large') {
      useEditorStore
        .getState()
        .setNotice(fr.notices.imageTooLarge(file.name, MAX_IMAGE_BYTES / (1024 * 1024)))
      continue
    }

    try {
      const natural = await readImageSize(file)
      const assetId = crypto.randomUUID()
      await repository.putAsset(assetId, file)

      // Le projet a pu changer pendant l'attente : on relit l'état courant.
      const { project, addElement } = useEditorStore.getState()
      if (!project) return
      const { page, unit } = project.document
      const elements = selectActiveElements(useEditorStore.getState())
      const size = fitImageSize(natural, page, unit)
      const middle = center ?? { x: page.width / 2, y: page.height / 2 }
      const shift = duplicateOffset(unit) * placed // plusieurs images : on les décale
      addElement(
        createImageElement(
          nextElementName(fr.elements.image, 'image', elements),
          assetId,
          middle.x - size.width / 2 + shift,
          middle.y - size.height / 2 + shift,
          size.width,
          size.height,
        ),
      )
      placed += 1
    } catch {
      useEditorStore.getState().setNotice(fr.notices.imageUnreadable(file.name))
    }
  }
}
