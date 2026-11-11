# 06 — Bibliothèque d'objets (jalon M7)

**Statut : réalisé au jalon M7 (lots A à J).** Ce document reste la référence du catalogue ; les
emprises des ensembles (section 5.18) sont celles calculées par `src/features/library/catalog/sets.ts`.

Les dimensions sont en **mm** (largeur × profondeur) et viennent de **mesures usuelles et
génériques** (normes courantes, tailles de marché habituelles). Règle « clean room » de
`CLAUDE.md` : aucun fichier, catalogue ou bibliothèque tiers n'est ouvert, converti ou décalqué
(ni Revit `.rfa`, ni fabricants, ni packs de symboles) ; aucune marque dans les noms.

**Contenu : 392 objets en 17 catégories + 24 ensembles prêts à poser.**

---

## 1. Principes

1. **Dessin vectoriel de formes simples** (rectangles, cercles, arcs, lignes) composées à la main
   pour Fabrics. Lisible à 1:50 et à 1:100, sans décor inutile.
2. **Une seule définition par objet**, partagée par le canevas (Konva), l'aperçu du panneau (SVG)
   et, plus tard, l'export PDF/DXF et la 3D.
3. **Générateurs plutôt que dessins un par un** : une vingtaine de gabarits (section 4)
   produisent plusieurs centaines d'objets. Ajouter un objet = ajouter une ligne de données.
4. **Taille réelle** : un objet posé a ses dimensions réelles en mm ; `Cote` le mesure juste.
5. **Hors métrés** : le mobilier n'entre dans aucun calcul de surface ; il apparaît dans le CSV
   sous forme de liste (nom, nombre, dimensions).
6. **Pas de prix, pas de devis, pas de marque.**

## 2. Conventions de dessin

- **Orientation** : à rotation 0, la **face avant** de l'objet est vers le **bas** de l'écran
  (sud). Les dossiers, têtes de lit, arrière de meuble sont en haut.
- **Origine** : coin haut-gauche de la boîte englobante, axe Y vers le bas, unités mm.
- **Traits** (épaisseur en mm sur le plan, constante quel que soit le zoom) :

  | Usage | Style |
  |---|---|
  | Contour de l'objet | plein, 15 mm, gris foncé |
  | Détails (tiroirs, coussins, feux) | plein, 8 mm, gris moyen |
  | Éléments situés **au-dessus** du plan de coupe (meubles hauts, hotte, étagère murale) | pointillé, 8 mm |
  | Zones libres à respecter (rotation PMR, débattement) | pointillé long, 6 mm, sans remplissage |
  | Remplissage | blanc cassé, ou transparent pour les zones |

- **Symboles nominaux** (`nominal: true`) : repères d'électricité, détecteurs, etc. Ils ne sont
  **pas à l'échelle réelle** : taille conventionnelle lisible (par défaut 300 mm), non
  redimensionnable. Ils sont marqués « N » dans le catalogue.
- **Symboles de zone** (`zone: true`) : surfaces de référence (cercle de manœuvre, place de
  stationnement). Fond transparent, pointillé, listés à part dans le CSV.
- **Miroir** (« M ») : objets asymétriques (canapé d'angle, escalier en L, évier avec égouttoir)
  proposés en miroir gauche/droite par un bouton « Retourner » dans Propriétés.

## 3. Format technique

```ts
// src/features/library/types.ts   (fonctions pures, testées avec Vitest)
export type SymbolCategory =
  | 'living' | 'dining' | 'bedroom' | 'office' | 'storage' | 'kitchen' | 'bathroom'
  | 'laundry' | 'stairs' | 'electrical' | 'hvac' | 'safety' | 'outdoor' | 'vehicles'
  | 'hospitality' | 'health-education' | 'leisure' | 'sets';

export type ResizeMode = 'free' | 'ratio' | 'length' | 'fixed';
//  free   : largeur et profondeur libres
//  ratio  : proportions verrouillées (arbres, cercles)
//  length : seule la largeur est libre, la profondeur est fixe (radiateur, haie, meuble bas)
//  fixed  : taille imposée (symboles nominaux)

export interface SymbolDef {
  id: string;                    // kebab-case anglais, unique : 'bed-queen'
  category: SymbolCategory;
  width: number;                 // mm, défaut
  depth: number;                 // mm, défaut
  sizes?: { label: string; width: number; depth: number }[]; // tailles rapides (puces)
  min: { width: number; depth: number };   // mm
  max: { width: number; depth: number };   // mm
  resize: ResizeMode;
  mirrorable: boolean;           // bouton « Retourner »
  nominal?: boolean;             // symbole conventionnel (non à l'échelle)
  zone?: boolean;                // surface de référence
  height: number;                // mm, hauteur typique (réservé à la 3D, M8)
  elevation?: number;            // mm, hauteur de pose (meuble haut, applique, climatiseur)
  draw: (w: number, d: number) => Primitive[];   // fonction pure, coordonnées dans [0,w]×[0,d]
}

export type Primitive =
  | { kind: 'rect'; x: number; y: number; w: number; h: number; r?: number; style: Style }
  | { kind: 'circle'; cx: number; cy: number; r: number; style: Style }
  | { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number; style: Style }
  | { kind: 'line'; points: number[]; style: Style }          // polyligne ouverte
  | { kind: 'polygon'; points: number[]; style: Style }       // fermé
  | { kind: 'arc'; cx: number; cy: number; r: number; from: number; to: number; style: Style };
// Style : 'outline' | 'detail' | 'above' (pointillé) | 'zone' (pointillé long) | 'fill-soft'
```

- **Fichiers** : `src/features/library/` : `types.ts`, `primitives.ts` (aides de dessin),
  `templates/*.ts` (un fichier par gabarit), `catalog/<categorie>.ts` (un fichier par
  catégorie), `catalog/index.ts` (registre et `getSymbol(id)`), `search.ts` (recherche sans
  accents ni casse), `csv.ts` (liste du mobilier).
- **Rendu** : `src/components/editor/shapes/FurnitureShape.tsx` (Konva, lit `draw`) et
  `src/components/library/SymbolPreview.tsx` (SVG, mêmes primitives). **Aucune dépendance
  nouvelle.**
- **Textes** : noms, mots-clés et catégories dans `src/i18n/fr.ts`, sous `library.categories`
  et `library.symbols.<id> = { name, keywords }` (le catalogue ci-dessous donne les noms
  français ; les mots-clés sont écrits à l'implémentation : synonymes courants, ex. « divan »
  pour canapé, « WC » pour toilettes).
- **Document** : `FurnitureElement` de `docs/02-ARCHITECTURE.md` (`symbol`, `width`, `depth`)
  + un champ `mirrored?: boolean`. Les « tailles rapides » ne demandent aucun champ : elles
  modifient `width` / `depth`.

## 4. Gabarits de dessin (générateurs)

Chaque gabarit est une fonction pure `(w, d, options) → Primitive[]`. Un objet du catalogue
= un gabarit + ses paramètres.

| Gabarit | Sert à |
|---|---|
| `box` | caissons, meubles simples (avec tiroirs / portes en option) |
| `table` | tables rectangulaires, carrées, rondes, ovales (+ chaises autour en option) |
| `chair` | chaises, fauteuils, tabourets, sièges de bureau |
| `sofa` | canapés 2/3 places, d'angle, modulaires (accoudoirs, coussins) |
| `bed` | lits (oreillers, couette, tête de lit), lits superposés, berceau |
| `kitchenUnit` | meubles bas/hauts/colonne/angle, plan de travail ; **cuisines complètes** (linéaire, L, U, parallèle, américaine, îlot) assemblées à partir de ces éléments, avec évier, plaque et réfrigérateur placés proportionnellement |
| `barCounter` | comptoirs de bar droit, en L, en U, courbe, rond (arcs), avec rebord de service et zone de tabourets |
| `appliance` | électroménager (feux, hublot, cadran) |
| `sink` | éviers, lavabos, vasques, bacs |
| `bath` | baignoires (rectangulaire, d'angle, îlot, sabot), bains à remous |
| `shower` | receveurs, douches carrées, d'angle, italiennes, PMR |
| `toilet` | WC au sol, suspendu, urinoir, bidet |
| `stair` | escaliers droits, quart/demi-tournant, en L/U (marches calculées à partir de la longueur, giron ≈ 250 mm), hélicoïdal |
| `ramp` | rampes, avec flèche et pourcentage de pente |
| `radiator` | radiateurs, sèche-serviettes, convecteurs |
| `lamp` | luminaires (cercle + croix, rosace) |
| `marker` | symboles nominaux d'électricité et de sécurité (pictogramme simple) |
| `plant` | arbres, arbustes, massifs, haies (contour irrégulier fixe, déterministe) |
| `vehicle` | voitures, utilitaires, motos, vélos (silhouette générique) |
| `zone` | surfaces pointillées (cercle PMR, places de parking, débattement) |
| `round` | tout objet circulaire (pouf, poêle, ballon, parasol) |

## 5. Catalogue

Légende des colonnes : **Taille** = largeur × profondeur par défaut (mm) · **Tailles rapides**
= autres puces proposées · **R** = mode de redimensionnement (L libre, P proportionnel, l
longueur seule, F fixe) · **Marques** : **M** miroir · **H** dessin pointillé (au-dessus du
plan de coupe) · **N** symbole nominal · **Z** zone.

### 5.1 Séjour et salon — `living`

| id | Nom | Taille | Tailles rapides | R | Marques |
|---|---|---|---|---|---|
| `sofa-2` | Canapé 2 places | 1600 × 900 | 1500, 1800 | L | |
| `sofa-3` | Canapé 3 places | 2100 × 900 | 1950, 2300 | L | |
| `sofa-corner` | Canapé d'angle | 2500 × 1600 | 2700 × 1700 | L | M |
| `sofa-modular` | Canapé modulable (méridienne) | 2800 × 1600 | | L | M |
| `sofa-chaise` | Canapé avec méridienne | 2300 × 1500 | | L | M |
| `daybed` | Banquette-lit | 1900 × 800 | | L | |
| `armchair` | Fauteuil | 850 × 850 | 750, 950 | L | |
| `armchair-wing` | Fauteuil à oreilles | 800 × 850 | | L | |
| `pouf-square` | Pouf carré | 500 × 500 | | L | |
| `pouf-round` | Pouf rond | 450 × 450 | 600 | P | |
| `coffee-table` | Table basse rectangulaire | 1100 × 600 | 900 × 500, 1300 × 700 | L | |
| `coffee-table-round` | Table basse ronde | 800 × 800 | 600, 1000 | P | |
| `side-table` | Table d'appoint | 450 × 450 | | L | |
| `side-table-round` | Table d'appoint ronde | 450 × 450 | | P | |
| `tv-unit` | Meuble TV | 1600 × 450 | 1200, 2000, 2400 | l | |
| `tv-wall` | Télévision murale | 1200 × 80 | 1000, 1400 | l | |
| `bookcase` | Bibliothèque | 900 × 300 | 600, 1200 | L | |
| `sideboard` | Buffet | 1600 × 450 | 1200, 2000 | l | |
| `console` | Console | 1000 × 300 | 800, 1400 | L | |
| `fireplace` | Cheminée | 1200 × 400 | | L | |
| `wood-stove` | Poêle à bois | 500 × 500 | | L | |
| `rug-rect` | Tapis rectangulaire | 2000 × 3000 | 1600 × 2300 | L | Z |
| `rug-round` | Tapis rond | 2000 × 2000 | 1500, 2500 | P | Z |
| `piano-upright` | Piano droit | 1500 × 600 | | L | |
| `piano-grand` | Piano à queue | 1500 × 1700 | | P | M |
| `floor-lamp` | Lampadaire | 300 × 300 | | F | |
| `plant-pot` | Plante en pot | 400 × 400 | 300, 600 | P | |
| `room-divider` | Paravent | 1800 × 40 | | l | |
| `bench` | Banc | 1200 × 400 | 1500 | L | |

### 5.2 Salle à manger — `dining`

| id | Nom | Taille | Tailles rapides | R | Marques |
|---|---|---|---|---|---|
| `table-rect-4` | Table rectangulaire 4 personnes | 1200 × 800 | | L | |
| `table-rect-6` | Table rectangulaire 6 personnes | 1800 × 900 | | L | |
| `table-rect-8` | Table rectangulaire 8 personnes | 2400 × 1000 | 2200, 2800 | L | |
| `table-rect-12` | Table de banquet 12 personnes | 3600 × 1100 | | L | |
| `table-square` | Table carrée | 900 × 900 | 800, 1000 | L | |
| `table-round-4` | Table ronde 4 personnes | 1000 × 1000 | 900 | P | |
| `table-round-6` | Table ronde 6 personnes | 1400 × 1400 | 1300, 1500 | P | |
| `table-round-8` | Table ronde 8 personnes | 1800 × 1800 | 1700, 2000 | P | |
| `table-oval` | Table ovale | 2000 × 1000 | 1800 × 900, 2400 × 1100 | L | |
| `table-high` | Table haute (mange-debout) | 1600 × 700 | 600 × 600 | L | |
| `chair` | Chaise | 450 × 500 | | L | |
| `chair-arm` | Chaise avec accoudoirs | 550 × 550 | | L | |
| `stool` | Tabouret | 350 × 350 | | P | |
| `stool-bar` | Tabouret de bar | 400 × 400 | | P | |
| `bench-dining` | Banc de table | 1400 × 350 | 1800 | l | |
| `chair-high-child` | Chaise haute enfant | 500 × 550 | | L | |
| `display-cabinet` | Vitrine | 1000 × 450 | 800, 1200 | L | |
| `buffet-dining` | Desserte de salle à manger | 1400 × 450 | | l | |

### 5.3 Chambre — `bedroom`

| id | Nom | Taille | Tailles rapides | R | Marques |
|---|---|---|---|---|---|
| `bed-single` | Lit 1 personne | 900 × 2000 | 800 × 1900, 1000 × 2000 | L | |
| `bed-double` | Lit 2 personnes | 1400 × 1900 | 1400 × 2000 | L | |
| `bed-queen` | Lit 160 × 200 | 1600 × 2000 | 1600 × 1900 | L | |
| `bed-king` | Lit 180 × 200 | 1800 × 2000 | | L | |
| `bed-king-xl` | Lit 200 × 200 | 2000 × 2000 | 2000 × 2200 | L | |
| `bed-bunk` | Lit superposé | 900 × 2000 | | L | |
| `bed-child` | Lit enfant | 700 × 1400 | 900 × 1900 | L | |
| `crib` | Lit bébé | 700 × 1300 | | L | |
| `sofa-bed` | Canapé-lit | 1900 × 900 | | L | |
| `nightstand` | Chevet | 450 × 400 | 400, 550 | L | |
| `wardrobe-2` | Armoire 2 portes | 1000 × 600 | | L | |
| `wardrobe-3` | Armoire 3 portes | 1500 × 600 | | L | |
| `wardrobe-sliding` | Armoire à portes coulissantes | 2000 × 650 | 1500, 2500 | l | |
| `wardrobe-built-in` | Placard intégré | 1800 × 600 | | l | |
| `dressing-open` | Dressing ouvert | 1800 × 600 | | l | |
| `dresser` | Commode | 1200 × 500 | 800, 1500 | l | |
| `chest-drawers` | Chiffonnier | 800 × 450 | | L | |
| `vanity` | Coiffeuse | 1000 × 450 | | L | |
| `mirror-standing` | Miroir sur pied | 500 × 50 | | l | |
| `bench-bed` | Banc de pied de lit | 1200 × 400 | | L | |
| `changing-table` | Table à langer | 900 × 600 | | L | |
| `desk-child` | Bureau d'enfant | 1100 × 550 | | L | |
| `trunk` | Coffre | 1000 × 500 | | L | |

### 5.4 Bureau et travail — `office`

| id | Nom | Taille | Tailles rapides | R | Marques |
|---|---|---|---|---|---|
| `desk` | Bureau | 1400 × 700 | 1200 × 600, 1600 × 800 | L | |
| `desk-corner` | Bureau d'angle | 1600 × 1600 | | L | M |
| `desk-executive` | Bureau de direction | 1800 × 900 | 2000 × 1000 | L | |
| `desk-standing` | Bureau réglable en hauteur | 1400 × 700 | | L | |
| `desk-double` | Poste de travail double | 2800 × 700 | | L | |
| `office-chair` | Fauteuil de bureau | 600 × 600 | | P | |
| `chair-visitor` | Chaise visiteur | 550 × 550 | | L | |
| `meeting-table-6` | Table de réunion 6 places | 2400 × 1000 | | L | |
| `meeting-table-10` | Table de réunion 10 places | 3600 × 1200 | | L | |
| `meeting-table-round` | Table de réunion ronde | 1200 × 1200 | 1500 | P | |
| `reception-desk` | Banque d'accueil | 2000 × 800 | 1600, 2600 | l | |
| `filing-pedestal` | Caisson à tiroirs | 400 × 600 | | L | |
| `filing-cabinet` | Armoire de classement | 800 × 450 | | L | |
| `shelf-unit` | Étagère de bureau | 800 × 350 | | L | |
| `lockers` | Casiers de vestiaire | 900 × 500 | 1200, 1800 | l | |
| `whiteboard` | Tableau blanc | 1500 × 50 | 1200, 2000 | l | H |
| `printer` | Imprimante | 450 × 400 | | L | |
| `copier` | Photocopieur | 700 × 700 | | L | |
| `server-rack` | Baie informatique | 600 × 1000 | | L | |
| `phone-booth` | Cabine de téléphone isolée | 1000 × 1000 | | L | |
| `lounge-office` | Coin détente (fauteuil + table basse) | 1600 × 1600 | | L | |
| `plant-office` | Grande plante d'intérieur | 600 × 600 | | P | |

### 5.5 Rangements et entrée — `storage`

| id | Nom | Taille | Tailles rapides | R | Marques |
|---|---|---|---|---|---|
| `cabinet-low` | Meuble bas | 800 × 400 | 600, 1000, 1200 | l | |
| `cabinet-tall` | Meuble haut (armoire) | 800 × 400 | | l | |
| `shelving` | Rayonnage ouvert | 1000 × 400 | 800, 1200 | l | |
| `shelf-wall` | Étagère murale | 800 × 250 | | l | H |
| `shoe-rack` | Meuble à chaussures | 800 × 300 | | l | |
| `coat-rack-wall` | Porte-manteaux mural | 1000 × 150 | | l | H |
| `coat-stand` | Portemanteau sur pied | 400 × 400 | | P | |
| `bench-hall` | Banc d'entrée | 1000 × 350 | | l | |
| `storage-chest` | Coffre de rangement | 1000 × 500 | | L | |
| `pantry-cabinet` | Cellier | 900 × 600 | | L | |
| `garage-rack` | Étagère de garage | 1200 × 500 | | l | |
| `workbench` | Établi | 1800 × 700 | | l | |
| `tool-cabinet` | Armoire à outils | 700 × 500 | | L | |
| `bike-storage` | Range-vélos | 1800 × 600 | | l | |
| `umbrella-stand` | Porte-parapluies | 250 × 250 | | P | |
| `mailbox-indoor` | Boîtes aux lettres d'entrée | 600 × 150 | | l | |

### 5.6 Cuisine — `kitchen`

| id | Nom | Taille | Tailles rapides | R | Marques |
|---|---|---|---|---|---|
| `kitchen-base` | Meuble bas | 600 × 600 | 300, 400, 450, 500, 800, 900, 1000, 1200 | l | |
| `kitchen-base-drawers` | Meuble bas à tiroirs | 600 × 600 | 400, 800, 900 | l | |
| `kitchen-wall` | Meuble haut | 600 × 350 | 300, 400, 800, 900 | l | H |
| `kitchen-corner` | Meuble d'angle | 900 × 900 | 1000 × 1000 | L | M |
| `kitchen-corner-wall` | Meuble haut d'angle | 600 × 600 | | L | H, M |
| `kitchen-tall` | Colonne | 600 × 600 | | l | |
| `worktop` | Plan de travail | 1000 × 600 | 600 × 600 | L | |
| `sink-kitchen-1` | Évier 1 bac | 800 × 600 | | l | |
| `sink-kitchen-1d` | Évier 1 bac avec égouttoir | 1200 × 600 | | l | M |
| `sink-kitchen-2` | Évier 2 bacs | 1200 × 600 | 1400 | l | M |
| `hob-4` | Plaque de cuisson 4 feux | 600 × 520 | | L | |
| `hob-5` | Plaque de cuisson 5 feux | 750 × 520 | 900 | L | |
| `hob-induction` | Plaque à induction | 600 × 520 | | L | |
| `cooker` | Cuisinière | 600 × 600 | 900 × 600 | L | |
| `oven-built-in` | Four encastré | 600 × 600 | | L | |
| `microwave` | Four à micro-ondes | 450 × 350 | | L | |
| `hood` | Hotte | 600 × 500 | 900 | L | H |
| `hood-island` | Hotte d'îlot | 900 × 600 | | L | H |
| `fridge` | Réfrigérateur | 600 × 650 | 550 | L | |
| `fridge-freezer` | Réfrigérateur-congélateur | 600 × 650 | | L | |
| `fridge-side` | Réfrigérateur côte à côte | 900 × 750 | | L | |
| `freezer` | Congélateur | 600 × 650 | | L | |
| `freezer-chest` | Congélateur coffre | 1000 × 650 | | L | |
| `dishwasher` | Lave-vaisselle | 600 × 600 | 450 | L | |
| `wine-cooler` | Cave à vin | 600 × 600 | | L | |
| `kitchen-island` | Îlot central | 2400 × 1000 | 1800 × 900, 3000 × 1200 | L | |
| `breakfast-bar` | Bar de cuisine | 1600 × 400 | | l | |
| `kitchen-trolley` | Desserte roulante | 600 × 400 | | L | |
| `pantry-walk-in` | Garde-manger | 1200 × 1200 | | L | |
| `coffee-station` | Coin café | 800 × 500 | | L | |
| `trash-bin-kitchen` | Poubelle de cuisine | 350 × 400 | | L | |
| `table-kitchen` | Table de cuisine | 1100 × 700 | | L | |
| `sink-utility-kitchen` | Évier d'arrière-cuisine | 600 × 500 | | L | |
| `kitchen-peninsula` | Péninsule | 1800 × 900 | | L | M |

**Cuisines complètes** : un seul objet, dessiné d'un bloc (meubles, évier, plaque, réfrigérateur
et plan de travail déjà placés), redimensionnable. À distinguer des **ensembles** (section 5.18),
qui posent des éléments séparés que l'on modifie un par un. Rotation 0 : le mur est en haut, la
zone de travail est ouverte vers le bas.

| id | Nom | Taille | Tailles rapides | R | Marques |
|---|---|---|---|---|---|
| `kitchenette` | Kitchenette | 1800 × 600 | 1200, 1500, 2100 | l | |
| `kitchen-linear` | Cuisine linéaire | 3000 × 650 | 2400, 3600, 4200 | l | |
| `kitchen-parallel` | Cuisine en parallèle (deux lignes) | 3000 × 2600 | 2700 × 2400, 3600 × 2800 | L | |
| `kitchen-l` | Cuisine en L | 3000 × 2400 | 2700 × 2100, 3600 × 2700 | L | M |
| `kitchen-l-island` | Cuisine en L avec îlot | 3600 × 3400 | | L | M |
| `kitchen-u` | Cuisine en U | 3000 × 3000 | 2700 × 2700, 3600 × 3200 | L | |
| `kitchen-american` | Cuisine américaine (linéaire avec bar) | 3200 × 1500 | 2700, 3600 | L | M |
| `kitchen-american-l` | Cuisine américaine en L (avec bar) | 3200 × 2600 | 2800 × 2400, 3600 × 2800 | L | M |
| `kitchen-american-island` | Cuisine américaine avec îlot-bar | 3600 × 3400 | | L | M |
| `kitchen-bar-counter` | Bar de cuisine américaine (comptoir seul) | 2400 × 500 | 1800, 3000 | l | |

### 5.7 Salle de bain et sanitaires — `bathroom`

| id | Nom | Taille | Tailles rapides | R | Marques |
|---|---|---|---|---|---|
| `wc` | WC | 400 × 700 | | F | |
| `wc-wall` | WC suspendu | 360 × 540 | | F | |
| `wc-child` | WC enfant | 300 × 480 | | F | |
| `urinal` | Urinoir | 350 × 350 | | F | |
| `bidet` | Bidet | 400 × 600 | | F | |
| `washbasin` | Lavabo | 600 × 450 | 500, 650, 800 | L | |
| `washbasin-small` | Lave-mains | 400 × 300 | | L | |
| `washbasin-double` | Double vasque | 1400 × 500 | 1200, 1600 | L | |
| `vanity-unit` | Meuble vasque | 800 × 460 | 600, 1000, 1200 | L | |
| `basin-vessel` | Vasque à poser | 400 × 400 | | P | |
| `shower-square` | Douche carrée | 900 × 900 | 800, 1000 | L | |
| `shower-rect` | Douche rectangulaire | 1200 × 800 | 1400 × 900 | L | |
| `shower-corner` | Douche d'angle (quart de rond) | 900 × 900 | | L | M |
| `shower-walk-in` | Douche à l'italienne | 1200 × 900 | 1600 × 900 | L | |
| `shower-pmr` | Douche accessible PMR | 1200 × 1200 | | L | |
| `bathtub` | Baignoire | 1700 × 700 | 1600, 1800 × 800 | L | |
| `bathtub-corner` | Baignoire d'angle | 1400 × 1400 | | L | M |
| `bathtub-freestanding` | Baignoire îlot | 1700 × 800 | | L | |
| `bathtub-small` | Baignoire sabot | 1200 × 700 | | L | |
| `whirlpool` | Bain à remous | 1800 × 1800 | 2000 × 2000 | L | |
| `sauna` | Sauna | 2000 × 2000 | 1500 × 1500 | L | |
| `hammam` | Hammam | 2000 × 2000 | | L | |
| `towel-radiator` | Sèche-serviettes | 500 × 100 | 600 × 120 | l | |
| `mirror-wall` | Miroir mural | 800 × 30 | | l | H |
| `bathroom-cabinet` | Armoire de toilette | 600 × 150 | | l | H |
| `bathroom-shelf` | Étagère de salle de bain | 600 × 150 | | l | H |
| `laundry-basket` | Panier à linge | 400 × 400 | | L | |
| `washbasin-pmr` | Lavabo accessible PMR | 600 × 550 | | F | |
| `wc-pmr` | WC accessible PMR (avec barres) | 800 × 700 | | F | M |
| `grab-bar` | Barre d'appui | 600 × 50 | 400, 800 | l | |
| `shower-seat` | Siège de douche rabattable | 450 × 450 | | F | |
| `toilet-cubicle` | Cabine de sanitaires | 900 × 1500 | 1000 × 1800 | L | |
| `baby-changing-wall` | Table à langer murale | 800 × 500 | | F | |
| `wc-brush-bin` | Poubelle sanitaire | 200 × 200 | | P | |

### 5.8 Buanderie et technique domestique — `laundry`

| id | Nom | Taille | Tailles rapides | R | Marques |
|---|---|---|---|---|---|
| `washing-machine` | Lave-linge | 600 × 600 | | L | |
| `dryer` | Sèche-linge | 600 × 650 | | L | |
| `washer-dryer-column` | Colonne lave-linge / sèche-linge | 600 × 650 | | L | |
| `utility-sink` | Bac de buanderie | 600 × 500 | | L | |
| `ironing-board` | Table à repasser | 1300 × 400 | | L | |
| `drying-rack` | Séchoir à linge | 1500 × 600 | | L | |
| `water-heater` | Chauffe-eau (ballon) | 500 × 500 | 400, 600 | P | |
| `boiler-wall` | Chaudière murale | 400 × 350 | | L | |
| `boiler-floor` | Chaudière au sol | 600 × 650 | | L | |
| `buffer-tank` | Ballon tampon | 600 × 600 | 800 | P | |
| `water-softener` | Adoucisseur d'eau | 350 × 450 | | L | |
| `vmc-unit` | Groupe de ventilation | 600 × 500 | | L | |
| `electrical-panel` | Tableau électrique | 400 × 150 | 600 | L | H |
| `meter-cupboard` | Armoire à compteurs | 800 × 250 | | L | |

### 5.9 Escaliers et circulation verticale — `stairs`

Les marches des escaliers sont **calculées à partir de la longueur** (giron ≈ 250 mm, nombre
entier de marches), avec flèche de montée et ligne de coupe conventionnelle. Escaliers
**symboliques** : les escaliers paramétriques (hauteur d'étage, contremarches) restent dans
« Plus tard » de la roadmap.

| id | Nom | Taille | Tailles rapides | R | Marques |
|---|---|---|---|---|---|
| `stair-straight` | Escalier droit | 900 × 2800 | 1000, 1200 × 3000 | L | |
| `stair-quarter` | Escalier quart tournant | 1000 × 2400 | | L | M |
| `stair-half` | Escalier demi-tournant | 1800 × 2800 | | L | M |
| `stair-l` | Escalier en L avec palier | 2400 × 2400 | | L | M |
| `stair-u` | Escalier en U avec palier | 2200 × 3000 | | L | M |
| `stair-spiral` | Escalier hélicoïdal | 1600 × 1600 | 1200, 1400, 1800 | P | M |
| `stair-ladder` | Échelle de meunier | 500 × 2400 | | L | |
| `ramp` | Rampe d'accès | 1200 × 6000 | 1200 × 8000 | L | |
| `ramp-pmr` | Rampe PMR (pente ≤ 5 %) | 1200 × 6000 | | L | |
| `lift` | Ascenseur | 1100 × 1400 | | L | |
| `lift-pmr` | Ascenseur accessible PMR | 1400 × 1600 | | L | |
| `lift-goods` | Monte-charge | 1600 × 2000 | | L | |
| `platform-lift` | Plateforme élévatrice | 1000 × 1400 | | L | |
| `escalator` | Escalier mécanique | 1000 × 6000 | | L | |
| `shaft` | Gaine technique | 600 × 600 | 400, 800 | L | Z |
| `stair-opening` | Trémie d'escalier | 1000 × 2800 | | L | Z |

### 5.10 Électricité et éclairage — `electrical`

Symboles **nominaux** (N) : taille de repérage, non à l'échelle réelle, sauf les luminaires
(vraie taille).

| id | Nom | Taille | R | Marques |
|---|---|---|---|---|
| `socket-single` | Prise simple | 300 × 300 | F | N |
| `socket-double` | Prise double | 300 × 300 | F | N |
| `socket-floor` | Prise de sol | 300 × 300 | F | N |
| `socket-rj45` | Prise réseau | 300 × 300 | F | N |
| `socket-tv` | Prise TV | 300 × 300 | F | N |
| `socket-usb` | Prise USB | 300 × 300 | F | N |
| `switch-single` | Interrupteur simple | 300 × 300 | F | N |
| `switch-two-way` | Va-et-vient | 300 × 300 | F | N |
| `dimmer` | Variateur | 300 × 300 | F | N |
| `push-button` | Bouton poussoir | 300 × 300 | F | N |
| `light-ceiling` | Point lumineux plafond | 300 × 300 | F | N |
| `light-wall` | Point lumineux mural | 300 × 300 | F | N |
| `smoke-detector` | Détecteur de fumée | 300 × 300 | F | N |
| `thermostat` | Thermostat | 300 × 300 | F | N |
| `doorbell` | Sonnette | 300 × 300 | F | N |
| `intercom` | Interphone | 300 × 300 | F | N |
| `ev-charger` | Borne de recharge véhicule | 300 × 200 | F | N |
| `camera` | Caméra de surveillance | 300 × 300 | F | N |
| `lamp-ceiling` | Plafonnier | 300 × 300 | P | |
| `lamp-pendant` | Suspension | 450 × 450 | P | |
| `lamp-chandelier` | Lustre | 700 × 700 | P | |
| `lamp-spot` | Spot encastré | 100 × 100 | P | |
| `lamp-wall` | Applique | 150 × 100 | F | |
| `lamp-rail` | Rail de spots | 2000 × 50 | l | |

### 5.11 Chauffage, ventilation, plomberie — `hvac`

| id | Nom | Taille | Tailles rapides | R | Marques |
|---|---|---|---|---|---|
| `radiator-panel` | Radiateur à panneaux | 1000 × 100 | 600, 800, 1400, 2000 | l | |
| `radiator-column` | Radiateur colonne | 600 × 100 | | l | |
| `convector` | Convecteur | 800 × 100 | | l | |
| `radiator-floor` | Convecteur de sol | 1500 × 200 | | l | |
| `manifold` | Collecteur de plancher chauffant | 600 × 150 | | L | |
| `ac-split-indoor` | Climatiseur mural (unité intérieure) | 900 × 200 | | l | H |
| `ac-cassette` | Climatiseur cassette | 600 × 600 | | L | H |
| `ac-outdoor` | Unité extérieure de climatisation | 900 × 350 | | L | |
| `heat-pump-outdoor` | Pompe à chaleur extérieure | 1100 × 450 | | L | |
| `heat-pump-indoor` | Pompe à chaleur (unité intérieure) | 600 × 700 | | L | |
| `vent-grille` | Bouche de ventilation | 150 × 150 | | P | |
| `chimney-flue` | Conduit de cheminée | 200 × 200 | 300 | P | |
| `floor-drain` | Siphon de sol | 150 × 150 | | P | |
| `water-point` | Point d'eau | 80 × 80 | | F | N |
| `gas-meter` | Compteur de gaz | 400 × 300 | | L | |
| `rainwater-downpipe` | Descente d'eaux pluviales | 100 × 100 | | P | |
| `solar-panel` | Panneau solaire | 1700 × 1000 | | L | |
| `inspection-chamber` | Chambre de visite | 500 × 500 | | L | |

### 5.12 Sécurité et accessibilité — `safety`

| id | Nom | Taille | R | Marques |
|---|---|---|---|---|
| `extinguisher` | Extincteur | 300 × 300 | F | N |
| `hose-reel` | Dévidoir d'incendie | 400 × 300 | F | N |
| `fire-alarm-button` | Déclencheur manuel d'alarme | 300 × 300 | F | N |
| `exit-sign` | Sortie de secours | 400 × 150 | F | N |
| `emergency-light` | Éclairage de sécurité | 300 × 300 | F | N |
| `aed` | Défibrillateur | 300 × 300 | F | N |
| `first-aid` | Armoire à pharmacie | 300 × 300 | F | N |
| `assembly-point` | Point de rassemblement | 600 × 600 | F | N |
| `evacuation-arrow` | Flèche d'évacuation | 800 × 300 | l | |
| `pmr-turning-circle` | Cercle de manœuvre PMR (Ø 1 500) | 1500 × 1500 | F | Z |
| `pmr-clear-zone` | Espace d'usage PMR (900 × 1 400) | 900 × 1400 | F | Z |
| `door-swing-zone` | Débattement de porte | 900 × 900 | L | Z |
| `fire-compartment-mark` | Repère de compartiment coupe-feu | 400 × 400 | F | N |
| `wheelchair-symbol` | Pictogramme accessibilité | 400 × 400 | F | N |

### 5.13 Extérieur et jardin — `outdoor`

| id | Nom | Taille | Tailles rapides | R | Marques |
|---|---|---|---|---|---|
| `tree-small` | Arbre (petit) | 2000 × 2000 | 1500, 3000 | P | |
| `tree-medium` | Arbre (moyen) | 5000 × 5000 | 4000, 6000 | P | |
| `tree-large` | Arbre (grand) | 8000 × 8000 | 10000 | P | |
| `tree-conifer` | Conifère | 2500 × 2500 | 1500, 4000 | P | |
| `tree-palm` | Palmier | 2000 × 2000 | | P | |
| `tree-fruit` | Arbre fruitier | 3500 × 3500 | | P | |
| `shrub` | Arbuste | 1000 × 1000 | 600, 1500 | P | |
| `hedge` | Haie | 3000 × 600 | 1000, 5000 | l | |
| `flower-bed` | Massif de fleurs | 2000 × 1000 | | L | |
| `lawn` | Pelouse (zone) | 4000 × 3000 | | L | Z |
| `gravel` | Gravier (zone) | 3000 × 2000 | | L | Z |
| `paving` | Dallage (zone) | 3000 × 3000 | | L | Z |
| `pot-large` | Grand pot | 500 × 500 | | P | |
| `planter-box` | Bac de plantation | 1500 × 500 | | l | |
| `vegetable-patch` | Potager | 2000 × 1200 | | L | |
| `pond` | Bassin | 3000 × 2000 | | L | |
| `swimming-pool` | Piscine rectangulaire | 8000 × 4000 | 6000 × 3000, 10000 × 5000 | L | |
| `swimming-pool-round` | Piscine ronde | 4000 × 4000 | | P | |
| `swimming-pool-l` | Piscine en L | 8000 × 4000 | | L | M |
| `hot-tub` | Spa extérieur | 2000 × 2000 | | L | |
| `table-garden` | Table de jardin | 1600 × 900 | | L | |
| `chair-garden` | Chaise de jardin | 550 × 600 | | L | |
| `sun-lounger` | Bain de soleil | 700 × 2000 | | L | |
| `parasol` | Parasol | 3000 × 3000 | 2000, 4000 | P | H |
| `bbq` | Barbecue | 800 × 500 | | L | |
| `outdoor-kitchen` | Cuisine d'été | 2400 × 700 | | l | |
| `pergola` | Pergola | 3000 × 4000 | | L | H |
| `gazebo` | Tonnelle | 3000 × 3000 | | L | H |
| `garden-shed` | Abri de jardin | 2000 × 3000 | | L | |
| `carport` | Abri de voiture | 3000 × 5500 | | L | H |
| `greenhouse` | Serre | 2500 × 3500 | | L | |
| `compost` | Composteur | 1000 × 1000 | | L | |
| `rain-barrel` | Récupérateur d'eau de pluie | 700 × 700 | | P | |
| `cistern` | Citerne enterrée | 2000 × 2000 | | P | Z |
| `septic-tank` | Fosse septique | 2000 × 2000 | | P | Z |
| `waste-bins` | Local poubelles | 1500 × 700 | | l | |
| `mailbox` | Boîte aux lettres | 300 × 200 | | F | |
| `trampoline` | Trampoline | 3000 × 3000 | | P | |
| `sandbox` | Bac à sable | 1500 × 1500 | | L | |
| `swing-set` | Balançoire | 3000 × 2000 | | L | |
| `fence-panel` | Panneau de clôture | 2000 × 50 | | l | |

### 5.14 Véhicules et stationnement — `vehicles`

Silhouettes **génériques** (pas de modèle ni de marque).

| id | Nom | Taille | Tailles rapides | R | Marques |
|---|---|---|---|---|---|
| `car` | Voiture | 1800 × 4500 | | F | |
| `car-compact` | Voiture compacte | 1700 × 3800 | | F | |
| `car-sedan` | Berline | 1850 × 4800 | | F | |
| `car-suv` | Voiture haute (SUV) | 1950 × 4700 | | F | |
| `van` | Camionnette | 2000 × 5400 | | F | |
| `truck` | Camion | 2500 × 10000 | | F | |
| `bus` | Autocar | 2550 × 12000 | | F | |
| `motorcycle` | Moto | 800 × 2100 | | F | |
| `scooter` | Scooter | 700 × 1800 | | F | |
| `bicycle` | Vélo | 600 × 1800 | | F | |
| `cargo-bike` | Vélo cargo | 800 × 2500 | | F | |
| `bike-rack` | Arceau à vélos | 800 × 50 | 1600, 2400 | l | |
| `parking-bay` | Place de stationnement | 2500 × 5000 | 2300 × 5000 | L | Z |
| `parking-bay-pmr` | Place de stationnement PMR | 3500 × 5000 | | L | Z |
| `parking-bay-parallel` | Place en créneau | 2000 × 5500 | | L | Z |
| `loading-bay` | Quai de chargement | 3500 × 12000 | | L | Z |

### 5.15 Commerce et restauration — `hospitality`

| id | Nom | Taille | Tailles rapides | R | Marques |
|---|---|---|---|---|---|
| `counter` | Comptoir | 2000 × 700 | 1500, 3000 | l | |
| `checkout` | Caisse | 1200 × 700 | | L | |
| `display-shelf` | Gondole | 1200 × 500 | 900, 2400 | l | |
| `display-table` | Table de présentation | 1500 × 900 | | L | |
| `display-window` | Vitrine d'exposition | 1500 × 600 | | l | |
| `rack-clothes` | Portant à vêtements | 1200 × 500 | | l | |
| `fitting-room` | Cabine d'essayage | 1000 × 1000 | | L | |
| `table-restaurant-2` | Table de restaurant 2 places | 600 × 600 | | L | |
| `table-restaurant-4` | Table de restaurant 4 places | 800 × 800 | 1200 × 800 | L | |
| `booth` | Banquette de restaurant | 1800 × 700 | | l | |
| `bar-counter` | Comptoir de bar | 3000 × 600 | | l | |
| `bar-back` | Arrière-bar | 3000 × 500 | | l | |
| `buffet-line` | Buffet | 2400 × 800 | | l | |
| `kitchen-pro-table` | Table de travail inox | 1800 × 700 | | l | |
| `kitchen-pro-range` | Piano de cuisson | 1200 × 800 | | L | |
| `cold-room` | Chambre froide | 2000 × 2000 | | L | |
| `stage` | Estrade | 4000 × 2000 | | L | |
| `dj-booth` | Régie / cabine de mixage | 1600 × 800 | | L | |
| `pew` | Banc d'église | 2500 × 500 | | l | |
| `hair-salon-chair` | Fauteuil de coiffeur | 700 × 800 | | L | |
| `bar-counter-l` | Comptoir de bar en L | 3000 × 2000 | 2400 × 1800, 3600 × 2400 | L | M |
| `bar-counter-u` | Comptoir de bar en U | 3000 × 2400 | | L | |
| `bar-counter-curved` | Comptoir de bar courbe | 3000 × 1500 | 2400 × 1200, 4000 × 1800 | L | M |
| `bar-counter-round` | Bar rond (service au centre) | 3000 × 3000 | 2400, 4000 | P | |
| `bar-service-station` | Poste de service | 1200 × 600 | | L | |
| `bar-cabinet` | Meuble bar (mini-bar) | 900 × 450 | 700, 1200 | L | |
| `bar-trolley` | Chariot bar | 800 × 450 | | L | |
| `bar-home` | Bar d'intérieur avec arrière-bar | 2400 × 1500 | 1800 × 1400, 3000 × 1600 | L | M |
| `bar-outdoor` | Bar de jardin | 2000 × 600 | 1500, 3000 | l | |
| `bar-pool` | Bar de piscine (îlot) | 3000 × 1200 | | L | |
| `bar-high-table` | Table de bar haute (avec tabourets) | 1200 × 1200 | | L | |

### 5.16 Santé et enseignement — `health-education`

| id | Nom | Taille | Tailles rapides | R | Marques |
|---|---|---|---|---|---|
| `hospital-bed` | Lit médicalisé | 900 × 2100 | | L | |
| `exam-table` | Table d'examen | 650 × 1900 | | L | |
| `wheelchair` | Fauteuil roulant | 650 × 1050 | | F | |
| `stretcher` | Brancard | 700 × 2000 | | F | |
| `medical-cabinet` | Armoire médicale | 800 × 400 | | L | |
| `massage-table` | Table de massage | 700 × 1900 | | L | |
| `dental-chair` | Fauteuil de soins | 700 × 1700 | | L | |
| `scale` | Pèse-personne / toise | 400 × 400 | | L | |
| `school-desk` | Pupitre | 600 × 500 | | L | |
| `school-desk-double` | Pupitre double | 1200 × 500 | | L | |
| `teacher-desk` | Bureau d'enseignant | 1400 × 700 | | L | |
| `blackboard` | Tableau mural | 3000 × 50 | 2000, 4000 | l | H |
| `lab-bench` | Paillasse de laboratoire | 1800 × 750 | | l | |
| `lab-fume-hood` | Hotte de laboratoire | 1500 × 800 | | L | |
| `library-shelf` | Rayonnage de bibliothèque | 900 × 300 | | l | |
| `kids-table` | Table d'enfant | 800 × 600 | | L | |

### 5.17 Loisirs et sport — `leisure`

| id | Nom | Taille | Tailles rapides | R | Marques |
|---|---|---|---|---|---|
| `table-tennis` | Table de tennis de table | 1525 × 2740 | | F | |
| `billiard` | Billard | 1270 × 2540 | 1100 × 2200 | P | |
| `foosball` | Baby-foot | 700 × 1300 | | F | |
| `treadmill` | Tapis de course | 800 × 1800 | | L | |
| `exercise-bike` | Vélo d'appartement | 550 × 1200 | | L | |
| `weight-bench` | Banc de musculation | 600 × 1400 | | L | |
| `yoga-mat` | Tapis de yoga | 600 × 1800 | | L | Z |
| `home-cinema` | Fauteuils de cinéma (rangée de 3) | 2000 × 1000 | | l | |
| `game-table` | Table de jeux | 900 × 900 | | L | |
| `aquarium` | Aquarium | 1200 × 400 | | L | |
| `pet-bed` | Panier d'animal | 700 × 500 | | L | |
| `workshop-lathe` | Machine d'atelier | 1200 × 600 | | L | |
| `sports-court-basket` | Terrain de basket (zone) | 15000 × 28000 | | L | Z |
| `sports-court-tennis` | Terrain de tennis (zone) | 10970 × 23770 | | F | Z |
| `sports-court-five` | Terrain de football à 5 (zone) | 25000 × 40000 | | L | Z |
| `petanque` | Terrain de pétanque (zone) | 4000 × 15000 | | L | Z |

### 5.18 Ensembles — `sets`

Compositions prêtes à poser, **groupes de symboles** des catégories ci-dessus (un seul
glisser-déposer pose plusieurs éléments, ensuite indépendants). Ils sont décrits comme des
listes `{ symbol, dx, dy, rotation }` autour d'un point d'ancrage.

| id | Nom | Contenu | Emprise |
|---|---|---|---|
| `set-dining-4` | Table + 4 chaises | table rectangulaire 4 + 4 chaises | 1200 × 1600 |
| `set-dining-6` | Table + 6 chaises | table rectangulaire 6 + 6 chaises | 2600 × 1700 |
| `set-dining-8` | Table + 8 chaises | table rectangulaire 8 + 8 chaises | 3200 × 1800 |
| `set-dining-round-6` | Table ronde + 6 chaises | table ronde 6 + 6 chaises | 2130 × 2200 |
| `set-living-corner` | Salon d'angle | canapé d'angle + table basse + tapis + meuble TV | 2500 × 4325 |
| `set-living-straight` | Salon droit | canapé 3 places + 2 fauteuils + table basse + tapis | 2100 × 3400 |
| `set-bedroom-double` | Chambre parentale | lit 160 × 200 + 2 chevets + armoire 3 portes | 2550 × 2900 |
| `set-bedroom-child` | Chambre d'enfant | lit enfant + chevet + bureau d'enfant + armoire | 2450 × 2250 |
| `set-office-workstation` | Poste de travail | bureau + fauteuil + caisson | 1800 × 1300 |
| `set-office-meeting-6` | Salle de réunion 6 | table 6 + 6 chaises | 3300 × 1900 |
| `set-kitchen-linear` | Cuisine linéaire 3 m | bas + évier + plaque + frigo + hotte | 3000 × 650 |
| `set-kitchen-l` | Cuisine en L | éléments d'angle + évier + plaque + frigo | 2900 × 2700 |
| `set-kitchen-island` | Cuisine avec îlot | linéaire + îlot + 3 tabourets | 3000 × 3150 |
| `set-bathroom-basic` | Salle de bain complète | baignoire + meuble vasque + WC | 1700 × 1600 |
| `set-bathroom-shower` | Salle d'eau | douche + meuble vasque + WC | 2200 × 900 |
| `set-wc-pmr` | Sanitaire accessible PMR | WC PMR + lavabo PMR + barres + cercle PMR | 2250 × 2250 |
| `set-terrace-4` | Salon de jardin | table + 4 chaises + parasol | 3000 × 3000 |
| `set-parking-3` | 3 places de stationnement | 3 places côte à côte | 7500 × 5000 |
| `set-kitchen-american` | Cuisine américaine et coin repas | cuisine américaine + 3 tabourets de bar + table 4 + 4 chaises | 3300 × 4400 |
| `set-kitchen-american-l` | Cuisine américaine en L et salon | cuisine américaine en L + 3 tabourets + canapé 3 places + table basse | 3200 × 4950 |
| `set-kitchen-u-table` | Cuisine en U avec table | cuisine en U + table de cuisine + 4 chaises | 3000 × 3000 |
| `set-bar-home` | Coin bar | bar d'intérieur + 4 tabourets de bar | 2550 × 2000 |
| `set-bar-l-restaurant` | Bar de restaurant en L | comptoir de bar en L + arrière-bar + 6 tabourets de bar | 3450 × 2450 |
| `set-bar-garden` | Bar de jardin | bar de jardin + 4 tabourets de bar + parasol | 3000 × 3000 |

## 6. Comportement du panneau Bibliothèque

- **Recherche** : insensible à la casse et aux accents (« lave vaisselle » trouve
  « Lave-vaisselle »), sur le nom, les mots-clés et la catégorie. Résultats mis à jour à la
  frappe.
- **Catégories** : liste repliable avec le nombre d'objets, plus « Tous », « Récents » (les 12
  derniers posés) et « Favoris » (étoile ; mémorisés dans le navigateur, pas dans le projet).
- **Vignettes** : aperçu SVG généré depuis `draw`, avec nom et dimensions (`1600 × 2000 mm`).
- **Pose** : glisser-déposer sur le plan, ou clic sur la vignette puis clic sur le plan
  (l'objet reste actif pour en poser plusieurs, `Échap` pour quitter). Aperçu fantôme sous le
  curseur, taille réelle. L'objet est posé au **niveau actif** (M6).
- **Tailles rapides** : puces dans Propriétés (`Largeur × profondeur`) en plus des champs libres,
  dans les limites `min` / `max` (message en français au-delà).
- **Propriétés d'un objet** : nom, largeur, profondeur (selon `resize`), rotation, bouton
  « Retourner » (si `mirrorable`), opacité, verrouiller.
- **Aimantation** : réutilise celle des guides d'alignement (M2) ; rotation par pas de 15° avec
  `Maj`, par pas de 90° avec `R` (raccourci à ajouter à `docs/02-ARCHITECTURE.md`).
- **CSV** : tableau « Mobilier et équipements » : catégorie, nom, largeur, profondeur
  (en mm), nombre ; les symboles de zone et les symboles nominaux sont comptés à part.
- **Calques** : un objet est listé avec son nom français et l'icône de sa catégorie
  (`lucide-react`).

## 7. Tests exigés (Vitest, fonctions pures)

Tests de données, exécutés sur **tout** le catalogue :
1. Chaque `id` est unique, en kebab-case, et possède un nom français et des mots-clés dans
   `fr.ts`.
2. Chaque catégorie existe et contient au moins le nombre d'objets annoncé dans ce document.
3. Pour la taille par défaut, la taille minimale, la taille maximale et chaque taille rapide :
   `draw(w, d)` ne renvoie aucune primitive hors de `[0, w] × [0, d]`, aucune valeur `NaN`,
   et au moins un contour.
4. `min ≤ défaut ≤ max` ; toute taille rapide est dans `[min, max]`.
5. Les noms et mots-clés ne contiennent aucun mot de la liste de marques interdites (liste
   courte tenue dans le test).
6. Mode `ratio` : redimensionner conserve les proportions ; mode `fixed` : refuse tout
   changement ; mode `length` : la profondeur ne change pas.
7. Escaliers : nombre de marches = `round(longueur / 250)`, au moins 3 ; la flèche est dans la
   boîte.
8. Miroir : `draw` miroité occupe la même boîte ; deux retournements = l'original.
9. Recherche : accents, casse, mots-clés, absence de résultat.
10. Ensembles : tout `symbol` référencé existe ; l'emprise calculée correspond à celle annoncée
    (±1 mm) ; poser un ensemble crée N éléments indépendants (un seul état d'historique).
11. CSV : le mobilier est listé, jamais ajouté aux surfaces ni aux volumes.
12. Critère de la roadmap : un `bed-queen` mesure **1600 × 2000 mm** avec l'outil Cote.

## 8. Contrôle à la main (navigateur)

À indiquer à l'utilisateur à la fin de chaque lot : ouvrir un Plan, ouvrir le panneau
Bibliothèque, chercher « canapé », glisser un objet, le tourner, le retourner, le mesurer avec
`Cote`, l'annuler avec `Ctrl+Z`, recharger la page et vérifier qu'il est toujours là.

## 9. Découpage de M7 en lots (proposition, à valider au début du jalon)

Chaque lot se termine par `npm run build`, `npm run lint`, `npm test`, la mise à jour de la
roadmap et de `PROGRESS.md`, et un commit.

| Lot | Contenu |
|---|---|
| A | Axes de construction (outil, numérotation, aimantation) — partie « Axes » de M7 |
| B | Infrastructure : `types.ts`, `primitives.ts`, rendu Konva + aperçu SVG, `FurnitureElement` (+ `mirrored`), migration du document si besoin, 3 objets de test |
| C | Panneau Bibliothèque : catégories, recherche, vignettes, pose glisser-déposer, propriétés, tailles rapides, retourner |
| D | Gabarits `box`, `table`, `chair`, `sofa`, `bed`, `round` + catégories Séjour, Salle à manger, Chambre, Rangements |
| E | Gabarits `kitchenUnit` (cuisines complètes : linéaire, L, U, parallèle, américaine, îlot), `appliance`, `sink`, `bath`, `shower`, `toilet` + catégories Cuisine, Salle de bain, Buanderie |
| F | Gabarit `stair`, `ramp` + catégorie Escaliers ; gabarit `box` étendu : Bureau |
| G | Gabarits `radiator`, `lamp`, `marker`, `zone` + catégories Électricité, Chauffage, Sécurité et accessibilité |
| H | Gabarits `plant`, `vehicle` + catégories Extérieur, Véhicules |
| I | Gabarit `barCounter` ; catégories Commerce et restauration (bars compris), Santé et enseignement, Loisirs |
| J | Ensembles, Récents et Favoris, liste du mobilier dans le CSV, tests globaux (section 7) |

Le critère d'acceptation de la roadmap (lit 160 × 200 mesuré à 1,60 × 2,00 m ; axe « C » après
« A, B ») est vérifié dès les lots C et A.

## 10. Extensions proposées (**hors M7**, à valider avant tout code)

Ces idées enrichiraient la bibliothèque mais dépassent le périmètre de M7 ; elles sont
conservées ici et dans la section « Idées » de `docs/PROGRESS.md`.

- **Pose contre un mur** : un objet « mural » (WC, lavabo, radiateur, meuble haut) s'aimante à la
  face du mur le plus proche et se tourne dos au mur.
- **Hauteur en 3D** : les champs `height` et `elevation` du catalogue alimentent la vue 3D
  (boîtes simples) au jalon M8.
- **Import de symboles par l'utilisateur** (SVG ou DXF), stockés dans son compte, jamais publics.
- **Bibliothèque de l'utilisateur** : enregistrer une sélection (ex. « ma cuisine ») comme
  ensemble personnel.
- **Niveau de détail** : variante « détaillée » (poignées, charnières, tiroirs) pour les plans
  de présentation.
- **Étiquettes de cote automatiques** sur un objet (largeur × profondeur au survol).
- **Variantes de style** (contour seul, plein, hachuré).
- **Annotations de plan** (flèche du nord, repère de niveau, étiquette de pièce) : à rattacher
  aux jalons M8 et M10.
