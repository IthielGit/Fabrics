// Types minimaux des composants de l'application Pascal repris tels quels (`@pascal-app-host/*` →
// `packages/pascal/apps/editor/components/*`, M19 A5). `paths` (tsconfig.app.json) envoie ici ces
// imports pour que `tsc` ne parcoure pas le code de l'application Pascal (ADR 0002 § 5).
import type { ComponentType, ReactNode } from 'react'

/** Barre de vue, à gauche : replier / déplier la barre latérale. */
export declare const EditorViewerToolbarLeft: ComponentType
/**
 * Barre de vue, à droite : niveaux empilés / éclatés / seuls, murs, menu Affichage (qualité de rendu,
 * lumière du jour, contours, thème), visite à la première personne, réalité virtuelle, aperçu.
 */
export declare const EditorViewerToolbarRight: ComponentType<{
  onVRToggle?: () => void
  vrButton?: ReactNode
  vrActive?: boolean
  vrDisabled?: boolean
  vrLabel?: string
}>

/**
 * Onglet « Construire » de l'application Pascal (M19 B1) : palette des outils de dessin (murs, dalles,
 * plafonds, toitures, escaliers, ouvertures, cotes, terrain, réseaux…).
 */
export declare const BuildTab: ComponentType

// Réalité virtuelle (M19 A6) : modules de l'application Pascal et du module WebXR.
export declare function WebXRFeatureRuntime(props: { enabled: boolean; children: ReactNode }): ReactNode
export declare function useWebXRFeature(): { session?: unknown; immersive?: unknown } | null
export declare function useWebXRInstalled(): boolean
