import { strToU8, zipSync } from 'fflate'
import type { FabricsDocument } from '../../types/document'
import { sortLevels } from '../documents/levels'
import { levelDxf, type DxfPlanOptions } from './dxfPlan'
import { sanitizeFileName } from './fileName'

export type DxfScope = 'level' | 'building'

export interface DxfFile {
  name: string
  text: string
}

/** Hauteur des textes du DXF (mm sur le plan) : 2,5 mm sur le papier à l'échelle du projet. */
export function dxfFontMm(scale: number | undefined): number {
  return (scale && scale > 0 ? scale : 50) * 2.5
}

/**
 * Un fichier DXF par niveau (D60) : le niveau affiché, ou tous les niveaux du plus bas au plus haut.
 * Nom : « <nom> - <niveau>.dxf ».
 */
export function buildDxfFiles(
  document: Pick<FabricsDocument, 'elements' | 'levels'>,
  baseName: string,
  scope: DxfScope,
  activeLevelId: string | null,
  options: DxfPlanOptions,
): DxfFile[] {
  const levels = sortLevels(document.levels ?? [])
  const chosen = scope === 'level' ? levels.filter((l) => l.id === activeLevelId) : levels
  const used = new Set<string>()
  return chosen.map((level) => {
    let name = sanitizeFileName(`${baseName} - ${level.name}`, baseName)
    // Deux niveaux du même nom : on ajoute un numéro pour ne pas écraser un fichier dans le zip.
    for (let n = 2; used.has(name.toLowerCase()); n++) name = sanitizeFileName(`${baseName} - ${level.name} ${n}`, baseName)
    used.add(name.toLowerCase())
    return { name: `${name}.dxf`, text: levelDxf(document, level.id, options) }
  })
}

/** Un seul fichier : tel quel ; plusieurs : réunis dans un `.zip`. */
export function packDxfFiles(files: readonly DxfFile[], zipName: string): { name: string; blob: Blob } | null {
  if (files.length === 0) return null
  if (files.length === 1) {
    return { name: files[0].name, blob: new Blob([files[0].text], { type: 'application/dxf' }) }
  }
  const zipped = zipSync(Object.fromEntries(files.map((f) => [f.name, strToU8(f.text)])))
  return { name: zipName, blob: new Blob([zipped as BlobPart], { type: 'application/zip' }) }
}
