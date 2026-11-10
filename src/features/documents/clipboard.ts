import type { CanvasElement, FabricsDocument } from '../../types/document'
import { cloneElements, duplicateOffset } from './elements'

type Unit = FabricsDocument['unit']

interface ClipboardContent {
  elements: CanvasElement[]
  unit: Unit
  pasteCount: number
}

// Presse-papiers interne : il vit tant que l'application est ouverte, donc on peut copier
// dans un projet, revenir à l'accueil, ouvrir un autre projet et coller.
let content: ClipboardContent | null = null

export type PasteResult =
  | { status: 'empty' }
  | { status: 'unit-mismatch' }
  | { status: 'ok'; elements: CanvasElement[] }

export function copyToClipboard(elements: readonly CanvasElement[], unit: Unit): void {
  content = elements.length === 0 ? null : { elements: structuredClone([...elements]), unit, pasteCount: 0 }
}

/**
 * Prépare les copies à coller dans un document d'unité `unit`. Chaque collage décale un peu plus
 * les copies pour qu'elles ne s'empilent pas exactement. On ne colle pas un élément d'un visuel
 * (pixels) dans un plan (millimètres) : les tailles n'auraient aucun sens.
 */
export function takePasteCopies(unit: Unit): PasteResult {
  if (!content) return { status: 'empty' }
  if (content.unit !== unit) return { status: 'unit-mismatch' }
  content.pasteCount += 1
  return {
    status: 'ok',
    elements: cloneElements(content.elements, duplicateOffset(unit) * content.pasteCount),
  }
}

export function clearClipboard(): void {
  content = null
}
