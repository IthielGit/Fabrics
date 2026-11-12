import { useMemo } from 'react'
import { computeAutoNames, displayNames, isAutoName } from '../../features/naming/autoNames'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'
import type { CanvasElement } from '../../types/document'

const NO_ELEMENTS: readonly CanvasElement[] = []

export interface ElementNames {
  /** Nom affiché (nom tapé, sinon automatique) des murs et des ouvertures. */
  display: Map<string, string>
  /** Nom automatique des murs et des ouvertures, même quand un nom a été tapé. */
  auto: Map<string, string>
}

/** Noms des murs et des ouvertures du document (D58), recalculés seulement quand les éléments changent. */
export function useDisplayNames(): ElementNames {
  const elements = useEditorStore((state) => state.project?.document.elements ?? NO_ELEMENTS)
  return useMemo(() => {
    const auto = computeAutoNames(elements)
    return { auto, display: displayNames(elements, undefined, auto) }
  }, [elements])
}

/** Nom affiché d'un élément : son nom automatique s'il en a un, sinon son nom. */
export function displayNameOf(element: CanvasElement, names: ElementNames): string {
  return names.display.get(element.id) ?? element.name
}

/**
 * Réglages du champ « Nom » d'un mur ou d'une ouverture : vide quand le nom est automatique (le
 * nom automatique apparaît en grisé) ; vider le champ rend le nom automatique.
 */
export function autoNameFieldProps(element: CanvasElement, names: ElementNames) {
  const auto = names.auto.get(element.id)
  if (auto === undefined) return { value: element.name }
  const automatic = isAutoName(element.name)
  return {
    value: automatic ? '' : element.name,
    placeholder: auto,
    title: fr.naming.autoHint(auto),
    allowEmpty: true,
  }
}
