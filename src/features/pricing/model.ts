/**
 * Modèle de la bibliothèque de prix (M23, 23.1). Décisions : `docs/phases/M23-decisions.md`.
 *
 * - Une bibliothèque appartient à un **espace** (D23-7) ; un seul jeu de prix par espace.
 * - Prix de base : **HT** (D23-10). Le prix lu dans la source (TTC livré chantier pour les matériaux)
 *   est gardé à côté, pour la vérification.
 * - Prix d'un poste de travaux : **prix brut = débours sec HT** (D23-12) ; la composition du
 *   sous-détail est conservée pour la traçabilité.
 */
import type { BasisPoints, Tenths } from './money'

export type WorkspaceRole = 'admin' | 'member'

export interface WorkspaceSummary {
  id: string
  name: string
  /** Rôle de la personne connectée. */
  role: WorkspaceRole
}

export interface WorkspaceMember {
  userId: string
  email: string
  role: WorkspaceRole
  joinedAt: string
}

export interface WorkspaceInvite {
  id: string
  workspaceId: string
  token: string
  role: WorkspaceRole
  active: boolean
  expiresAt: string | null
  createdAt: string
}

export interface PriceLibrary {
  id: string
  workspaceId: string
  name: string
  /** +1 à chaque import (choix par défaut de 23.0). */
  version: number
  currency: 'MGA'
  /** Taux de TVA, réglage unique de l'espace (D23-10). */
  vatRateBp: BasisPoints
  /** Date des prix (date de mise à jour de la source), AAAA-MM-JJ ; `null` si inconnue. */
  priceDate: string | null
  updatedAt: string
}

/** Matériau (MTX), matériel (MTL) ou main-d'œuvre (MO). */
export type PriceKind = 'material' | 'equipment' | 'labour'

/** Base du prix lu dans la source. */
export type SourceBasis = 'ht' | 'ttc_delivered'

export interface PriceItemFields {
  kind: PriceKind
  code: string
  category: string
  designation: string
  unit: string
  sourceBasis: SourceBasis
  /** Prix tel qu'il est dans la source (TTC livré pour un matériau du classeur), en dixièmes. */
  sourcePrice: Tenths | null
  /** Prix HT utilisé par les calculs ; `null` : ligne sans prix. */
  priceHt: Tenths | null
  supplier: string
  region: string
  /** Date d'effet du prix, AAAA-MM-JJ. */
  effectiveDate: string | null
  /** Autres colonnes de la source (location par jour, durée d'amortissement…), pour information. */
  details: Record<string, string>
  /** Origine : « MTX!12 » (feuille et ligne), ou vide pour une saisie à la main. */
  sourceRow: string
}

export interface Tracking {
  updatedByEmail: string
  updatedAt: string
}

export interface PriceItem extends PriceItemFields, Tracking {
  id: string
  libraryId: string
}

/** Groupe d'une ligne de sous-détail (feuille SDP). */
export type ComponentGroup = 'equipment' | 'material' | 'labour' | 'other'

export interface WorkComponent {
  group: ComponentGroup
  designation: string
  unit: string
  /** Quantité telle qu'écrite dans le sous-détail (texte décimal exact). */
  quantity: string
  unitPriceHt: Tenths
  amountHt: Tenths
}

export interface WorkItemFields {
  code: string
  category: string
  designation: string
  unit: string
  /** Prix brut = débours sec HT (D23-12) ; `null` : poste sans prix. */
  priceHt: Tenths | null
  /** « Prix de référence » du classeur (coefficient compris), pour information seulement. */
  referencePrice: Tenths | null
  /** Coefficient du sous-détail dans la source (ex. « 1.1 »), pour information seulement. */
  sourceCoefficient: string
  /** Rendement du sous-détail (texte). */
  output: string
  components: WorkComponent[]
  sourceRow: string
}

export interface WorkItem extends WorkItemFields, Tracking {
  id: string
  libraryId: string
}

export type HistoryAction = 'insert' | 'update' | 'delete'

/** Une modification d'une ligne de prix ou d'un poste (D23-7 : auteur, date, ancienne valeur). */
export interface PriceHistoryEntry {
  id: string
  itemId: string
  code: string
  designation: string
  action: HistoryAction
  oldPriceHt: Tenths | null
  newPriceHt: Tenths | null
  changedByEmail: string
  changedAt: string
}

export function canEditPrices(role: WorkspaceRole): boolean {
  return role === 'admin'
}

export function isWorkspaceRole(value: unknown): value is WorkspaceRole {
  return value === 'admin' || value === 'member'
}

export function isPriceKind(value: unknown): value is PriceKind {
  return value === 'material' || value === 'equipment' || value === 'labour'
}

export const PRICE_KINDS: readonly PriceKind[] = ['material', 'equipment', 'labour']

/** Valeurs vides d'une nouvelle ligne de prix saisie à la main. */
export function emptyPriceItem(kind: PriceKind, today: string): PriceItemFields {
  return {
    kind,
    code: '',
    category: '',
    designation: '',
    unit: '',
    sourceBasis: 'ht',
    sourcePrice: null,
    priceHt: null,
    supplier: '',
    region: DEFAULT_REGION,
    effectiveDate: today,
    details: {},
    sourceRow: '',
  }
}

/** Région par défaut d'une ligne (choix par défaut de 23.0). */
export const DEFAULT_REGION = 'Antananarivo'
