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
  version: 4;                // incrémenté si le format change (migration : features/documents/migrations.ts)
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
  northAngle: number;           // M8 : degrés, de 0 à 359 ; sens horaire depuis le haut du plan vers la direction du nord (0 = le nord est en haut)
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
// Style d'une ouverture (M10 bis) : choisit le dessin (plan, façade, 3D). Les styles permis dépendent
// du `kind` (voir `src/features/openings/styles.ts`). Sans style : battant / deux vantaux / coulissante.
export type OpeningStyle =
  // portes
  | 'swing' | 'double' | 'slidingSurface' | 'slidingPocket' | 'folding' | 'swingBoth'
  | 'garageSectional' | 'garageTilt'
  // fenêtres
  | 'casement2' | 'casement1' | 'fixed' | 'sliding' | 'tilt'
  // baies
  | 'bay-sliding' | 'bay-fixed' | 'free';

export interface OpeningElement extends BaseElement {
  type: 'opening';
  kind: 'door' | 'window' | 'bay';   // porte, fenêtre, baie
  style?: OpeningStyle;      // facultatif (M10 bis) : absent = style par défaut du `kind`
  tiltTurn?: boolean;        // facultatif : oscillo-battant (fenêtres à vantaux), marque en façade seulement
  wallId: string;            // mur porteur ; supprimé avec lui
  segmentIndex: number;      // segment de la polyligne du mur
  offset: number;            // mm, du début du segment au centre de l'ouverture
  width: number;             // mm
  height: number;            // mm
  sillHeight: number;        // mm, 0 pour une porte
  hinge: 'start' | 'end';    // côté des gonds
  side: 'left' | 'right';    // côté du mur vers lequel la porte s'ouvre
}

// Axe de construction (M7) : ligne de repère avec bulle et étiquette, commun à tous les niveaux
// (pas de `levelId`). Points absolus, déplacement seul (règle D6).
export interface AxisElement extends BaseElement {
  type: 'axis';
  points: [number, number, number, number]; // deux extrémités, absolues
  label: string;             // « A », « 1 »… affiché dans les bulles
}

// Ligne de coupe (M10) : trace d'un plan de coupe vertical, commune à tous les niveaux (pas de
// `levelId`). Points absolus, déplacement seul (règle D6). La coupe est calculée, jamais stockée.
export interface SectionLineElement extends BaseElement {
  type: 'section';
  points: [number, number, number, number]; // deux extrémités, absolues
  label: string;             // « A » → coupe A–A
  lookLeft: boolean;         // sens de vue : à gauche du sens de tracé (premier → deuxième point)
}

// Objet de la bibliothèque (M7) : mobilier ou équipement. Seule exception à la règle D6 parmi les
// éléments de plan : position, rotation et taille comme une forme du Visuel (x, y = coin haut-gauche
// avant rotation). Le dessin vient du catalogue (`src/features/library/`).
export interface FurnitureElement extends BaseElement {
  type: 'furniture';
  symbol: string;            // identifiant dans la bibliothèque intégrée (ex. 'bed-queen')
  width: number;             // mm
  depth: number;             // mm
  mirrored?: boolean;        // objet retourné gauche / droite
}

// Escalier entre deux niveaux (M9) : x, y = coin haut-gauche de son emprise avant rotation (comme
// `furniture`). Les marches, les paliers et la trémie sont calculés, jamais stockés ; le niveau de
// départ est `levelId`, le niveau d'arrivée est celui juste au-dessus.
export interface StairElement extends BaseElement {
  type: 'stair';
  shape: 'straight' | 'l' | 'u';
  width: number;             // mm, emmarchement (largeur d'une volée)
  length: number;            // mm, longueur de la 1re volée (seule volée pour 'straight')
  length2?: number;          // mm, longueur de la 2e volée ('l', 'u')
  gap?: number;              // mm, jour central entre les deux volées ('u')
  mirrored?: boolean;        // tourne à gauche / à droite ('l', 'u')
  voidMargin: number;        // mm, marge de la trémie autour de l'emprise (défaut 50)
}

// Cheminée (M9) : conduit qui traverse les niveaux au-dessus du sien jusqu'au toit. x, y = coin
// haut-gauche avant rotation (comme `furniture`).
export interface ChimneyElement extends BaseElement {
  type: 'chimney';
  width: number;             // mm
  depth: number;             // mm
  heightAboveTop: number;    // mm, dépassement au-dessus du dernier niveau
}

// Plateforme (M9) : estrade ou podium. Polygone à points absolus (déplacement seul, règle D6).
export interface PlatformElement extends BaseElement {
  type: 'platform';
  points: number[];          // polygone fermé, absolus
  elevation: number;         // mm, hauteur du dessus par rapport au plancher du niveau
  thickness: number;         // mm, épaisseur sous le dessus ; défaut = elevation, jamais plus
  fill: string;
}

export type CanvasElement =
  | TextElement | RectElement | EllipseElement | LineElement | ImageElement
  | WallElement | RoomElement | DimensionElement | OpeningElement | AxisElement
  | FurnitureElement | PlatformElement | StairElement | ChimneyElement | SectionLineElement;
