# 02 — Architecture

Tout est open source et utilisable gratuitement. Pas de serveur à écrire pour le MVP :
le navigateur fait le rendu, les calculs et les exports ; Supabase stocke les comptes et les
projets à partir du jalon M12.

## Stack et dépendances autorisées

Installe toujours la **dernière version stable** au moment de l'installation, sauf indication.

| Rôle | Paquet(s) | Jalon | Remarque |
|---|---|---|---|
| Base | `vite`, `react`, `react-dom`, `typescript` | M0 | via `npm create vite@latest` (modèle `react-ts`) |
| Styles | `tailwindcss`, `@tailwindcss/vite` | M0 | Tailwind v4, plugin Vite, pas de `tailwind.config.js` obligatoire |
| Routage | `react-router` | M0 | 2 routes seulement |
| Canevas | `konva`, `react-konva` | M1 | la version **majeure** de `react-konva` doit correspondre à celle de `react` |
| État | `zustand` | M1 | un store éditeur, un store projets |
| Stockage local | `idb-keyval` | M1 | IndexedDB (projets + images) |
| Icônes | `lucide-react` | M1 | seule source d'icônes |
| Utilitaire | `clsx` | M1 | classes conditionnelles |
| Tests | `vitest` | M1 | fonctions pures (géométrie, métrés, unités) |
| PDF | `jspdf` | M4 | PNG/JPG viennent de Konva, sans bibliothèque |
| Backend | `@supabase/supabase-js` | M12 | Auth + Postgres + Storage |
| 3D | `three`, `@react-three/fiber`, `@react-three/drei` | M8 | **à confirmer par l'utilisateur au début de M8** ; version majeure de `@react-three/fiber` compatible avec `react` |
| DXF (import) | `dxf-parser` | M10 | **à confirmer au début de M10** ; l'export DXF est écrit à la main (format texte), sans bibliothèque |
| Temps réel | `yjs`, `y-websocket` | M13 | hébergement à décider |

Interdits sans accord : `html2canvas` (inutile, Konva exporte lui-même), `fabric`, bibliothèques
d'UI complètes (MUI, Ant…), `uuid` (on utilise `crypto.randomUUID()`), `moment`,
bibliothèques de glisser-déposer (`dnd-kit`…) : le réordonnancement des calques utilise le
glisser-déposer HTML5 natif, complété par des boutons « Monter / Descendre ».

Tests : `idb-keyval` est simulé avec `vi.mock` (pas de `fake-indexeddb`).

## Structure des dossiers

```
fabrics/
├── CLAUDE.md
├── docs/                      # ces documents
├── supabase/schema.sql        # appliqué au jalon M12
├── .env.example               # versionné
├── .env.local                 # NON versionné (clés Supabase)
├── index.html
├── vite.config.ts
├── public/
└── src/
    ├── main.tsx
    ├── App.tsx                # routes
    ├── index.css              # @import "tailwindcss";
    ├── i18n/
    │   └── fr.ts              # tous les textes d'interface
    ├── types/
    │   └── document.ts        # modèle de données (voir plus bas) — source de vérité des types
    ├── features/              # logique pure, testée, sans React
    │   ├── geometry/          # distances, aires, polygones, aimantation
    │   ├── units/             # mm ↔ m/cm, formatage « 12,40 m² »
    │   ├── measurements/      # calcul des métrés d'un document
    │   ├── export/            # PNG, JPG, PDF, CSV
    │   └── persistence/       # adaptateurs local / Supabase
    ├── stores/
    │   ├── editorStore.ts     # document ouvert, sélection, outil, historique
    │   └── projectsStore.ts   # liste des projets
    ├── lib/
    │   └── supabase.ts        # client (M12)
    ├── pages/
    │   ├── HomePage.tsx
    │   ├── EditorPage.tsx
    │   └── LoginPage.tsx      # M12
    └── components/
        ├── editor/            # Stage, Toolbar, PropertiesPanel, LayersPanel, MeasurementsPanel…
        │   └── shapes/        # un composant Konva par type d'élément
        └── ui/                # Button, Input, Modal, Menu…
```

Chaque fonction de `src/features/` a un fichier de test voisin `*.test.ts`.

## Modèle de données

Un projet = un document JSON complet. On ne découpe **pas** les éléments en lignes de base de
données : le document est enregistré d'un seul bloc (simple, rapide, compatible Yjs plus tard).

```ts
// src/types/document.ts

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
  levels?: Level[];          // M6 : plans uniquement, au moins un niveau, triés par altitude croissante
}

export interface Page {
  width: number;             // dans l'unité du document
  height: number;
  background: string;        // couleur hex
}

// Niveau (étage) d'un plan (M6).
export interface Level {
  id: string;
  name: string;              // « Rez-de-chaussée », « Étage 1 »…
  elevation: number;         // mm, altitude du plancher
  height: number;            // mm, hauteur d'étage (défaut 2 700) ; les nouveaux murs la prennent
  slabThickness: number;     // mm, épaisseur de dalle (défaut 200)
}

export interface PlanSettings {
  scale: number;             // dénominateur d'échelle d'impression par défaut : 50 → 1:50
  gridSize: number;          // mm, défaut 100 (10 cm)
  snapToGrid: boolean;
  defaultWallThickness: number; // mm, défaut 200
  defaultWallHeight: number;    // mm — plus utilisé depuis M6 (la hauteur d'un nouveau mur vient du niveau actif) ; conservé pour les anciens projets
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
```

Valeurs par défaut à la création d'un plan : page 20 000 × 15 000 mm, `scale: 50`,
`gridSize: 100`, `snapToGrid: true`, `defaultWallThickness: 200`, `defaultWallHeight: 2500`.
La page d'un plan est une **zone de travail**, pas une feuille : elle n'a pas à tenir sur
du papier (voir « Export »).

### Formats de départ d'un Visuel (px)

| Format | Largeur × hauteur |
|---|---|
| Post carré | 1080 × 1080 |
| Story | 1080 × 1920 |
| A4 | 2480 × 3508 (A4 à 300 dpi) |
| Affiche A3 | 3508 × 4961 (A3 à 300 dpi) |
| Bannière | 1500 × 500 |

### Géométrie des éléments de plan (`wall`, `room`, `dimension`)

- Leurs `points` sont en **coordonnées absolues** du document ; `x = 0`, `y = 0` et
  `rotation = 0` en permanence.
- Le `Transformer` ne permet que le **déplacement** de ces éléments (ni rotation, ni
  redimensionnement). À la fin du glisser, on ajoute le décalage à tous les points puis on
  remet la position du nœud Konva à (0, 0).
- La forme se modifie uniquement par l'**édition des sommets** (jalon M3).
- `DimensionElement.points` reste un tuple de 4 nombres (deux extrémités exactement).

## Unités et échelle (mode plan)

- Toute géométrie de plan est stockée en **millimètres**, en nombres.
- Le rendu convertit avec une constante `PX_PER_MM_AT_ZOOM_1 = 0.2` (1 m = 200 px à zoom 100 %).
  Le zoom de l'écran est indépendant de l'échelle d'impression.
- L'échelle d'impression (`plan.scale`) ne sert qu'à l'export PDF.
- La barre d'état en bas de l'éditeur affiche les deux valeurs séparément, par exemple
  `Zoom 100 % · Impression 1:50`. On n'affiche jamais une échelle « écran » : elle dépend de
  la taille et de la résolution du moniteur et serait fausse.
- Affichage : convention **Métrique architectural** (comme Revit). Longueurs en `mm` entiers,
  sans décimale (`3500 mm`, jamais `3,50 m` ni `20 cm`) ; surfaces en `m²` avec 2 décimales
  (`12,40 m²`) ; volumes en `m³` ; séparateur décimal virgule. Cela vaut pour l'interface, les
  champs de saisie, les cotes, les exports (PDF, CSV) et la grille. Fonctions dans
  `src/features/units/`.
- Saisie : un nombre sans unité est en mm. `m` et `cm` restent acceptés si l'utilisateur les écrit.

### Calibrage d'une image de plan
1. L'utilisateur importe une image (élément `image`).
2. Outil Calibrer : il clique deux points A et B sur l'image, puis saisit la distance réelle D (m).
3. Facteur = `D_mm / distance(A, B)` en unités du document ; on multiplie `width` et `height`
   de l'image par ce facteur (et on ajuste `x`, `y` pour garder A fixe).

## Calculs de métrés

Fonctions pures dans `src/features/measurements/` et `src/features/geometry/`, testées.

| Métré | Formule |
|---|---|
| Surface d'une pièce | formule du lacet (shoelace) : `|Σ (xᵢ·yᵢ₊₁ − xᵢ₊₁·yᵢ)| / 2`, mm² → m² (÷ 1 000 000) |
| Périmètre d'une pièce | somme des longueurs des côtés, polygone fermé |
| Longueur d'un mur | somme des segments de l'axe |
| Surface murale brute | longueur du mur × `height` (une face, sans déduction d'ouvertures) |
| Surface murale nette | surface brute − surfaces des ouvertures du mur (jamais négative) |
| Surface d'une ouverture | `width` × hauteur limitée à ce qui reste au-dessus de l'allège |
| Longueur d'une cote | distance entre les deux extrémités |

**Surface au tracé.** La surface et le périmètre d'une pièce sont ceux du **polygone tel
qu'il est dessiné**. Si l'utilisateur aimante ses points sur l'axe des murs, la surface inclut
la moitié de l'épaisseur des murs ; pour une surface intérieure, il trace la pièce le long
des faces intérieures. Le panneau Métrés l'indique en une ligne sous le tableau des pièces
(« Surfaces mesurées sur le contour tracé »). L'aimantation propose donc aussi les **angles
des faces des murs**, en plus des sommets de l'axe. Le calcul automatique de la surface
intérieure est une idée pour après le MVP.

Le panneau **Métrés** affiche :
- un tableau des pièces : nom, surface, périmètre ;
- un tableau des murs : nom, longueur, surface murale brute, surface murale nette ;
- un tableau des ouvertures (si le plan en a) : nom, dimensions, surface, avec le nombre de
  portes, de fenêtres et de baies ;
- les totaux : surface totale des pièces, linéaire total de murs, surface murale brute et
  nette, surface totale des ouvertures.

Export **CSV** (séparateur `;`, décimales à virgule, encodage UTF-8 avec BOM pour Excel) avec
les mêmes tableaux ; les murs y ont en plus l'épaisseur, la hauteur et la surface des
ouvertures, et le tableau des ouvertures donne type, mur, largeur, hauteur, allège et surface.

Tests minimum : carré 4 m × 3 m → 12,00 m² et 14,00 m ; polygone en L connu ; polygone
parcouru dans les deux sens → même surface ; mur en 3 segments → somme exacte.

## Aimantation (snapping)

Ordre de priorité quand l'utilisateur place un point :
1. extrémité ou sommet existant (mur, pièce, cote), ou angle d'une face de mur, à moins de
   8 px écran ;
2. grille si `snapToGrid` ;
3. avec **Maj** enfoncée : contrainte à 0°, 45° ou 90° depuis le point précédent.

Les guides d'alignement (bords et centres des éléments voisins) s'appliquent au déplacement
d'éléments dans les deux modes.

## État de l'application

`editorStore` (Zustand) contient : `project`, `selectedIds: string[]`, `activeTool`,
`zoom`, `stagePosition`, `history: { past: FabricsDocument[]; future: FabricsDocument[] }`,
`saveStatus: 'saved' | 'saving' | 'error'`.

- Toute modification du document passe par une action du store qui empile l'ancien document
  dans `history.past` (100 états maximum) et vide `history.future`.
- Pendant un glisser-déposer, on n'empile **qu'une fois**, à la fin du geste.
- Les mises à jour sont immuables (copie des objets modifiés).

## Persistance

Interface commune, deux implémentations :

```ts
// src/features/persistence/types.ts
export interface ProjectRepository {
  list(): Promise<Omit<Project, 'document'>[]>;
  get(id: string): Promise<Project | null>;
  save(project: Project): Promise<void>;
  remove(id: string): Promise<void>;
  putAsset(id: string, blob: Blob): Promise<void>;
  getAssetUrl(id: string): Promise<string>;   // object URL (local) ou URL signée (cloud)
}
```

- `LocalRepository` (M1) : IndexedDB via `idb-keyval`. Projets et images.
- `SupabaseRepository` (M12) : table `projects` + bucket Storage `assets`, voir
  `supabase/schema.sql`. Chemin des images : `<user_id>/<assetId>`.
- Sauvegarde automatique : 1 seconde après la dernière modification (debounce), indicateur
  « Enregistrement… / Enregistré ✓ / Erreur » dans l'en-tête. Sauvegarde aussi à la fermeture
  de l'onglet (`visibilitychange`).
- Au jalon M12 : un utilisateur connecté utilise `SupabaseRepository` ; à la première connexion,
  on propose d'importer les projets locaux dans le cloud.

### Images partagées entre projets

Dupliquer un projet ou coller une image dans un autre projet **réutilise le même `assetId`**
(pas de copie du fichier). Conséquence :
- `remove(projectId)` supprime le projet, puis supprime **uniquement** les images que plus
  aucun projet restant ne référence (parcours des `elements` de type `image`).
- Cette règle vaut pour `LocalRepository` (M1) et `SupabaseRepository` (M12, par utilisateur).
- Supprimer une image du canevas ne supprime pas le fichier (l'annulation doit pouvoir la
  restaurer) ; le nettoyage se fait à la suppression du projet.

## Export (100 % navigateur)

| Format | Méthode |
|---|---|
| PNG | `stage.toDataURL({ mimeType: 'image/png', pixelRatio })` sur la zone de la page |
| JPG | idem avec `image/jpeg`, qualité 0,92, fond de page forcé (pas de transparence) |
| PDF | `jspdf` en unité `mm`, format A4 ou A3, portrait/paysage ; image PNG de la page insérée |
| CSV | métrés, voir ci-dessus |

Avant tout export : masquer le transformateur de sélection, les guides et la grille, puis les
réafficher.

**Zone exportée**
- Visuel : la page entière.
- Plan : l'**emprise du contenu**, c'est-à-dire le rectangle englobant les éléments visibles
  (non masqués), agrandi de 500 mm réels de chaque côté. Un plan vide ne s'exporte pas
  (bouton désactivé avec un message).

**PDF d'un Visuel** : l'image de la page est centrée sur la feuille avec des marges de
10 mm, en gardant ses proportions. Exception : un Visuel au format A4 (ou A3) exporté sur la
même feuille occupe toute la page, sans marge. L'orientation proposée par défaut est celle
qui correspond aux proportions du Visuel.

**PDF à l'échelle (plans)** : taille sur papier (mm) = taille réelle (mm) ÷ `scale`. Zone
imprimable = feuille − marges de 10 mm − bande de 20 mm en bas réservée au cartouche et à
la barre d'échelle. Si la zone exportée dépasse la zone imprimable, afficher un
avertissement avec l'échelle la plus proche qui tient (1:100, 1:200) et l'option « Ajuster à
la page » (l'échelle n'est alors plus garantie et le cartouche l'indique). Cartouche en bas à
droite : nom du projet, date, échelle (`1:50` ou `Sans échelle`). Barre d'échelle graphique
de 1 m. L'échelle par défaut reste 1:50 ; la page de travail par défaut (20 × 15 m) ne tient
pas sur une feuille, ce qui est normal puisque seule l'emprise du contenu est exportée.

**Résolutions**
- PNG/JPG : ×1, ×2, ×3. Pour un plan, ×1 correspond à `PX_PER_MM_AT_ZOOM_1` (0,2 px/mm).
- PDF : rendu à 200 dpi.
- **Plafond** : une image exportée ne dépasse jamais **8 192 px** sur son plus grand côté ni
  **16 777 216 pixels** au total (limites sûres du canvas sur Chrome, Firefox et Safari).
  Les résolutions qui dépasseraient sont grisées avec la taille obtenue affichée ; pour le
  PDF, le dpi est réduit automatiquement jusqu'à respecter le plafond.

## Raccourcis clavier

| Touche | Action |
|---|---|
| `V` | Sélection |
| `T` / `R` / `O` / `L` | Texte / Rectangle / Ellipse / Ligne |
| `W` / `P` / `D` | Mur / Pièce / Cote (plan) |
| `B` / `F` | Porte / Fenêtre (plan) |
| `Échap` | Annuler le tracé en cours, puis désélectionner |
| `Entrée` ou double-clic | Terminer un mur ou une pièce |
| `Suppr` / `Retour arrière` | Supprimer la sélection |
| `Ctrl/Cmd + Z` / `Ctrl/Cmd + Maj + Z` | Annuler / Rétablir |
| `Ctrl/Cmd + C` / `V` / `D` | Copier / Coller / Dupliquer |
| `Ctrl/Cmd + A` | Tout sélectionner |
| Flèches (`+ Maj`) | Déplacer de 1 (10) unités d'affichage |
| `Espace` + glisser, molette | Déplacer la vue, zoomer vers le curseur |
| `Ctrl/Cmd + 0` | Ajuster la page à l'écran |

Les raccourcis sont ignorés quand le focus est dans un champ de saisie.

## Mode bâtiment (jalons M5 à M10)

Cette section **prévoit** les règles ; le modèle de données ci-dessus reste la source de vérité
tant que le jalon correspondant n'a pas commencé. Chaque jalon qui change le format du document
incrémente `FabricsDocument.version` et ajoute une **migration** pure et testée
(`src/features/documents/migrations.ts`), appliquée à l'ouverture d'un projet.

### Ajouts prévus au modèle de données

```ts
// M5 — version 2 : OpeningElement, intégré au modèle ci-dessus.

// M6 — version 3 (réalisé, voir le modèle de données ci-dessus)
export interface Level {
  id: string;
  name: string;              // « Rez-de-chaussée », « Étage 1 »…
  elevation: number;         // mm, altitude du plancher
  height: number;            // mm, hauteur d'étage (défaut 2 700)
  slabThickness: number;     // mm, épaisseur de dalle (défaut 200)
}
// FabricsDocument.levels?: Level[]   (projets Plan uniquement, au moins un niveau)
// BaseElement.levelId?: string       (éléments de plan ; absent = commun à tous les niveaux)
// PlanSettings.northAngle: number    (degrés, M8)

// M7
export interface AxisElement extends BaseElement {
  type: 'axis';
  points: [number, number, number, number];
  label: string;             // « A », « 1 »… ; commun à tous les niveaux (pas de levelId)
}
export interface FurnitureElement extends BaseElement {
  type: 'furniture';
  symbol: string;            // identifiant dans la bibliothèque intégrée (ex. 'bed-double')
  width: number;             // mm
  depth: number;             // mm
}

// M9
export interface SectionLineElement extends BaseElement {
  type: 'section';
  points: [number, number, number, number];
  label: string;             // « A » → coupe A–A
  lookLeft: boolean;         // sens de vue
}
```

Règles :
- `opening` : sa position est **relative au mur** ; elle n'a pas de points absolus. Le
  Transformer ne l'utilise pas : on la fait coulisser le long du segment, bornée par les
  extrémités du segment et les ouvertures voisines.
- `furniture` : seule exception à la règle D6 parmi les éléments de plan : position, rotation
  et taille (`x`, `y`, `rotation`, `width`, `depth`) comme une forme du Visuel, plus
  `mirrored?: boolean` (objet retourné). Les symboles sont **créés pour Fabrics en « clean
  room »** et décrits par des données (primitives de dessin générées par des gabarits) dans
  `src/features/library/`, rendues par `FurnitureShape.tsx` (Konva) et `SymbolPreview.tsx`
  (SVG). Catalogue, format et tests : `docs/06-BIBLIOTHEQUE.md`.
- `axis` et `section` suivent la règle D6 (points absolus, déplacement seul).

### Niveaux (M6, réalisé)

- Les niveaux sont triés par altitude. Monter ou descendre un niveau recalcule les altitudes
  (chacun démarre où finit celui du dessous) ; modifier une altitude retrie la liste.
- Le niveau actif est un état d'interface (`editorStore.activeLevelId`), hors historique. On ne
  voit net, ne sélectionne et ne modifie que les éléments du niveau actif (`selectActiveElements`).
  Le niveau du dessous est affiché à 30 % d'opacité, sans interaction ni aimantation, et n'apparaît
  ni dans les exports ni dans les miniatures.
- Un élément créé ou collé reçoit le `levelId` du niveau actif. Dupliquer un niveau copie ses murs
  et leurs ouvertures (pas les pièces) juste au-dessus ; supprimer un niveau supprime ses éléments.
- Les métrés d'un niveau ne comptent que ses propres éléments : les totaux du bâtiment sont la
  somme des niveaux. Le CSV a une colonne « Niveau » et un tableau de totaux par niveau.
- Les exports PNG, JPG et PDF d'un plan portent sur le niveau affiché.

### Métrés ajoutés

| Métré | Formule |
|---|---|
| Surface d'une ouverture | `width × height` |
| Surface murale nette | surface murale brute − Σ surfaces des ouvertures du mur |
| Métrés d'un niveau | mêmes tableaux, filtrés par `levelId` |
| Totaux du bâtiment | somme des niveaux |

### Modèle 3D (`src/features/building/`, fonctions pures)

Le document est d'abord traduit en un modèle neutre, **sans Three.js**, testable avec Vitest :
- chaque segment de mur → boîtes ; une ouverture coupe le segment en morceaux (trumeaux,
  allège sous la fenêtre, linteau au-dessus) : **pas de calcul booléen** ;
- chaque pièce → dalle (polygone extrudé de `slabThickness`) à l'altitude de son niveau ;
- dernier niveau → toit plat sur l'emprise des pièces ;
- coordonnées en mm, plan (x, y) → 3D (x, z), hauteur → y.

Le composant 3D (`src/components/viewer3d/`) ne fait que dessiner ce modèle. Mise à jour
limitée à une fois par image (`requestAnimationFrame`), géométrie recalculée seulement pour
les éléments modifiés.

### Façades et coupes (`src/features/building/views/`)

- Façade = projection orthographique du modèle neutre sur un plan vertical (N, S, E, O selon
  `northAngle`). Faces cachées traitées par **algorithme du peintre** : on trie les faces de
  la plus lointaine à la plus proche et on les dessine remplies de blanc avec un contour, en
  2D dans Konva.
- Coupe = même principe, limité à ce qui est derrière la ligne de coupe ; les sections
  coupées (intersection des boîtes avec le plan de coupe) sont remplies en noir.
- Les vues sont **calculées**, jamais stockées dans le document.

### Écran de l'éditeur (mode bâtiment)

- À gauche : outils ; au centre : plan du niveau actif ; à droite : panneaux habituels, et
  panneau 3D ouvrable, redimensionnable.
- En haut du canevas : sélecteur de niveau.
- Bouton « Planche » : vue d'ensemble en lecture seule (niveaux, façades, coupes côte à côte),
  exportable en PDF.

### Import et export (M10), partage (M12)

- DXF exporté : unités mm (`$INSUNITS = 4`), calques `MURS`, `PIECES`, `OUVERTURES`, `COTES`,
  `AXES`, `MOBILIER` ; un fichier par niveau ou un seul fichier avec un calque par niveau.
- DXF importé : lignes et polylignes converties en éléments `line`, groupées et verrouillées
  sur le niveau actif.
- glTF : `GLTFExporter` fourni par `three`.
- Partage : table Supabase `shares` (jeton aléatoire, projet, actif, mot de passe haché
  optionnel, expiration), RLS activé ; la lecture publique passe par une fonction Postgres
  qui vérifie le jeton. Ajout à `supabase/schema.sql` au jalon M12.

## Variables d'environnement

```
VITE_SUPABASE_URL=        # M12
VITE_SUPABASE_ANON_KEY=   # M12, clé anon uniquement
```

Sans ces variables, l'application fonctionne en mode local (pas de bouton de connexion).

## Hébergement

- **Cloudflare Pages** (M11) : build `npm run build`, dossier `dist`. Ajouter une règle de
  redirection SPA : fichier `public/_redirects` contenant `/* /index.html 200`.
- **Supabase** (M12) : offre gratuite. Attention : un projet gratuit inactif peut être mis en
  pause ; vérifier les limites actuelles sur le site de Supabase.
- **Temps réel** (M13) : Cloudflare Pages ne garde pas de connexion WebSocket ouverte ; il faudra
  choisir un hébergeur pour le serveur Yjs. Décision à prendre au début de M13.
