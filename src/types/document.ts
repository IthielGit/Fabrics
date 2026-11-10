// Modèle de données de Fabrics — source de vérité des types.
// Copie exacte de docs/02-ARCHITECTURE.md (section « Modèle de données »).

export type ProjectKind = 'design' | 'plan';

export interface Project {
  id: string;
  name: string;
  kind: ProjectKind;
  document: FabricsDocument;
  thumbnail?: string;        // data URL (local) ou chemin Storage (cloud)
  createdAt: string;         // ISO 8601
  updatedAt: string;
}

export interface FabricsDocument {
  version: 3;                // incrémenté si le format change (migration : features/documents/migrations.ts)
  unit: 'px' | 'mm';         // 'px' pour design, 'mm' pour plan
  page: Page;
  elements: CanvasElement[]; // ordre du tableau = ordre d'affichage (dernier = au-dessus)
  plan?: PlanSettings;       // présent seulement si kind = 'plan'
  levels?: Level[];          // M6 : projets Plan uniquement, au moins un niveau, triés par altitude croissante
}

// Niveau (étage) d'un plan (M6).
export interface Level {
  id: string;
  name: string;              // « Rez-de-chaussée », « Étage 1 »…
  elevation: number;         // mm, altitude du plancher
  height: number;            // mm, hauteur d'étage (défaut 2 700) ; les nouveaux murs la prennent
  slabThickness: number;     // mm, épaisseur de dalle (défaut 200)
}

export interface Page {
  width: number;             // dans l'unité du document
  height: number;
  background: string;        // couleur hex
}

export interface PlanSettings {
  scale: number;             // dénominateur d'échelle d'impression par défaut : 50 → 1:50
  gridSize: number;          // mm, défaut 100 (10 cm)
  snapToGrid: boolean;
  defaultWallThickness: number; // mm, défaut 200
  defaultWallHeight: number;    // mm, défaut 2500 — plus utilisé depuis M6 (la hauteur d'un nouveau mur vient du niveau actif) ; conservé pour les anciens projets
}

interface BaseElement {
  id: string;
  name: string;              // affiché dans les calques
  x: number;                 // position dans l'unité du document
  y: number;
  rotation: number;          // degrés
  opacity: number;           // 0 → 1
  locked: boolean;
  hidden: boolean;
  levelId?: string;          // M6 : niveau de l'élément (plans) ; absent = commun à tous les niveaux
}

export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  width: number;
  fontFamily: string;
  fontSize: number;
  fontStyle: 'normal' | 'bold' | 'italic' | 'bold italic';
  align: 'left' | 'center' | 'right';
  fill: string;
}

export interface RectElement extends BaseElement {
  type: 'rect';
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  cornerRadius: number;
}

export interface EllipseElement extends BaseElement {
  type: 'ellipse';
  radiusX: number;
  radiusY: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface LineElement extends BaseElement {
  type: 'line';
  points: number[];          // [x1, y1, x2, y2, …] relatifs à (x, y)
  stroke: string;
  strokeWidth: number;
  arrowEnd: boolean;
}

export interface ImageElement extends BaseElement {
  type: 'image';
  assetId: string;           // clé de l'image dans le stockage (IndexedDB ou Supabase Storage)
  width: number;
  height: number;
}

// --- Éléments réservés au mode plan (unité : mm) ---

export interface WallElement extends BaseElement {
  type: 'wall';
  points: number[];          // axe du mur, polyligne ouverte [x1, y1, x2, y2, …], absolus
  thickness: number;         // mm
  height: number;            // mm, sert à la surface murale
  fill: string;
}

export interface RoomElement extends BaseElement {
  type: 'room';
  points: number[];          // polygone fermé (le dernier point rejoint le premier), absolus
  fill: string;              // couleur semi-transparente
  showLabel: boolean;        // affiche nom + surface au centre
}

export interface DimensionElement extends BaseElement {
  type: 'dimension';
  points: [number, number, number, number]; // deux extrémités, absolues
  offset: number;            // décalage de la ligne de cote, mm
}

// Ouverture (M5) : position relative à son mur, pas de points absolus.
export interface OpeningElement extends BaseElement {
  type: 'opening';
  kind: 'door' | 'window' | 'bay';   // porte, fenêtre, baie
  wallId: string;            // mur porteur ; supprimé avec lui
  segmentIndex: number;      // segment de la polyligne du mur
  offset: number;            // mm, du début du segment au centre de l'ouverture
  width: number;             // mm
  height: number;            // mm
  sillHeight: number;        // mm, 0 pour une porte
  hinge: 'start' | 'end';    // côté des gonds
  side: 'left' | 'right';    // côté du mur vers lequel la porte s'ouvre
}

export type CanvasElement =
  | TextElement | RectElement | EllipseElement | LineElement | ImageElement
  | WallElement | RoomElement | DimensionElement | OpeningElement;
