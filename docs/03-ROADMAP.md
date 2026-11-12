# 03 — Roadmap

Jalons dans l'ordre. Le **MVP = M0 à M13**. Pas de durée : on passe au jalon suivant quand tous
les critères d'acceptation du jalon en cours sont cochés et validés par l'utilisateur.

Légende : `[ ]` à faire · `[x]` terminé (Claude coche au fur et à mesure).

---

## M0 — Mise en place

Objectif : un projet vide qui démarre, se construit et passe le lint.

- [x] Vérifier `node -v` (version LTS récente), `npm -v`, `git --version` ; sinon guider
      l'installation (voir `docs/05-INSTALLATION.md`)
- [x] Générer le projet avec `npm create vite@latest` (modèle React + TypeScript) **dans le
      dossier courant**, en conservant `CLAUDE.md`, `docs/`, `supabase/` et `.env.example`
      (si l'outil refuse un dossier non vide : générer dans un dossier temporaire puis déplacer) ;
      nom du paquet : `fabrics` (minuscules)
- [x] Installer et configurer Tailwind v4 (`tailwindcss` + `@tailwindcss/vite`)
- [x] Installer `react-router` ; deux routes : `/` (Accueil) et `/p/:projectId` (Éditeur),
      pages provisoires
- [x] Créer l'arborescence de `docs/02-ARCHITECTURE.md` (dossiers vides acceptés)
- [x] Créer `src/i18n/fr.ts` et `src/types/document.ts` (copie exacte du modèle de données)
- [x] Vérifier que `.gitignore` contient `node_modules`, `dist`, `.env.local`
- [x] `git init -b main` + premier commit (branche `main`, nécessaire au déploiement de M12)

**Critères d'acceptation**
- `npm run dev` affiche « Fabrics » sur http://localhost:5173, stylé avec Tailwind
- `/p/test` affiche la page Éditeur provisoire
- `npm run build` et `npm run lint` passent

---

## M1 — Socle de l'éditeur

Objectif : créer un projet, dessiner des formes simples, tout retrouver après rechargement.

- [x] Installer `konva`, `react-konva`, `zustand`, `idb-keyval`, `lucide-react`, `clsx`,
      `vitest` ; ajouter le script `"test": "vitest run"`
- [x] `LocalRepository` (IndexedDB) conforme à l'interface `ProjectRepository`
- [x] Accueil : liste des projets (nom, type, date relative), créer un Visuel (choix du format)
      ou un Plan, renommer, dupliquer, supprimer avec confirmation, état vide utile
- [x] Éditeur : `Stage` plein écran, page affichée avec son fond, zoom molette vers le curseur,
      déplacement de la vue (Espace + glisser), « Ajuster à l'écran »
- [x] Barre d'outils : Sélection, Rectangle, Ellipse
- [x] Sélection (clic, Maj + clic, rectangle de sélection), `Transformer` Konva pour
      déplacer / redimensionner / pivoter
- [x] Supprimer, dupliquer, annuler / rétablir (règles de `editorStore`)
- [x] Sauvegarde automatique + indicateur ; titre du projet éditable dans l'en-tête
- [x] Tests Vitest de l'historique (annuler / rétablir) et du dépôt local (`idb-keyval`
      simulé avec `vi.mock`), dont le nettoyage des images non référencées à la suppression

**Critères d'acceptation**
- Je crée un Visuel « Post carré », j'ajoute 3 rectangles, je les déplace, je recharge :
  tout est là
- Annuler 3 fois revient à la page vide ; rétablir 3 fois revient à l'état final
- La sélection multiple + Suppr supprime tous les éléments sélectionnés

---

## M2 — Contenu et mise en forme

Objectif : réaliser le parcours A (post Instagram) de bout en bout, sauf l'export.

- [x] Outil Texte : création au clic, édition au double-clic (zone de saisie superposée),
      police, taille, graisse, italique, couleur, alignement
- [x] Outil Ligne avec option flèche
- [x] Import d'image (bouton + glisser-déposer d'un fichier) ; stockage via `putAsset`
- [x] Panneau Propriétés : position, taille, rotation, opacité, remplissage, contour,
      épaisseur, arrondi — selon le type sélectionné ; champs en unités d'affichage
- [x] Panneau Calques : liste dans l'ordre d'affichage, renommer, masquer, verrouiller,
      réordonner par glisser (HTML5 natif) et par boutons Monter / Descendre, sélection
      synchronisée avec le canevas
- [x] Copier / coller (y compris entre deux projets ouverts successivement)
- [x] Guides d'alignement et aimantation pendant le déplacement
- [x] Tous les raccourcis de `docs/02-ARCHITECTURE.md` qui concernent ces outils
- [x] Miniature du projet régénérée à la sauvegarde (petite image PNG) et affichée à l'Accueil

**Critères d'acceptation**
- Parcours A réalisable sans toucher au code
- Un élément verrouillé ne peut pas être sélectionné sur le canevas, seulement via les calques
- Un texte modifié puis annulé revient exactement à son contenu précédent

---

## M3 — Mode plan et métrés

Objectif : réaliser les parcours B et C (hors export PDF).

- [x] `src/features/units/` : conversions et formatage (`3,50 m`, `12,40 m²`) + tests
- [x] `src/features/geometry/` : distance, longueur de polyligne, aire (lacet), périmètre,
      centroïde, aimantation + tests
- [x] Grille en cm/m, barre d'état « Zoom 100 % · Impression 1:50 » en bas de l'écran
- [x] Outil Mur : clic par point, Maj = 0/45/90°, double-clic ou Entrée pour finir, Échap pour
      annuler ; épaisseur et hauteur par défaut, modifiables dans Propriétés
- [x] Longueur du segment en cours affichée en direct pendant le tracé
- [x] Outil Pièce : polygone fermé, points aimantés aux sommets des murs et aux angles de
      leurs faces ; étiquette au centre (nom + surface au tracé)
- [x] Murs, pièces et cotes : points absolus, déplacement seul avec le Transformer (règles de
      `docs/02-ARCHITECTURE.md`)
- [x] Outil Cote : deux points, valeur affichée en mm, décalage réglable
- [x] Outil Calibrer pour une image importée (procédure de `docs/02-ARCHITECTURE.md`)
- [x] Édition des sommets : glisser un sommet d'un mur ou d'une pièce après création
- [x] Panneau Métrés (pièces, murs, totaux), mis à jour en temps réel
- [x] Export CSV des métrés
- [x] Ces outils n'apparaissent que dans les projets de type Plan

**Critères d'acceptation**
- Un rectangle de pièce de 4000 × 3000 mm affiche 12,00 m² et 14000 mm
- Une pièce tracée sur les faces intérieures de 4 murs (axes 4000 × 3000 mm, épaisseur 200 mm)
  affiche 10,64 m²
- Une image calibrée sur une distance connue de 3500 mm donne une cote de 3500 mm ± 10 mm entre
  les deux mêmes points
- Le CSV s'ouvre dans Excel ou LibreOffice avec les accents et les décimales corrects
- Tous les tests de `features/` passent

---

## M4 — Export

Objectif : sortir un fichier utilisable de n'importe quel projet.

- [x] Fenêtre Exporter : format (PNG, JPG, PDF ; CSV pour les plans), résolution, nom de fichier
- [x] PNG / JPG via Konva, sans la sélection, les guides ni la grille
- [x] PDF via `jspdf` : A4 / A3, portrait / paysage
- [x] PDF de Visuel : centré avec marges de 10 mm, ou pleine page si même format A4 / A3
- [x] PDF de plan à l'échelle choisie (1:20, 1:50, 1:100, 1:200, Ajuster) sur l'emprise du
      contenu, cartouche et barre d'échelle ; avertissement si le plan ne tient pas sur la
      feuille, avec l'échelle qui tient
- [x] Plafond de résolution (8 192 px par côté, 16,7 Mpx au total) : options trop grandes
      grisées

**Critères d'acceptation**
- Le PNG ×2 d'un post carré fait 2160 × 2160 px
- Imprimé à 100 %, un mur de 1,00 m d'un PDF à 1:50 mesure 2,0 cm à la règle
- Aucun élément d'interface (poignées, grille) n'apparaît dans les fichiers exportés
- Sur un plan de 20 × 15 m, l'option PNG ×3 est grisée et l'export ne plante pas

---

## Phase « Bâtiment » (M5 → M11)

Objectif d'ensemble : dessiner un bâtiment niveau par niveau, puis obtenir automatiquement la
vue 3D, les façades et les coupes. Les règles techniques sont dans `docs/02-ARCHITECTURE.md`,
section « Mode bâtiment ». L'interface reste propre à Fabrics : on reprend des **fonctions**,
jamais l'apparence d'un logiciel existant.

## M5 — Ouvertures (portes et fenêtres)

Objectif : percer les murs et obtenir des métrés nets.

- [x] Type `opening` (porte, fenêtre, baie) accroché à un mur (`wallId` + position le long de l'axe)
- [x] Outils Porte et Fenêtre : survol d'un mur = aperçu, clic = pose ; impossible hors d'un mur
- [x] Glisser une ouverture la fait coulisser le long de son mur, sans en sortir
- [x] Symboles 2D originaux : battant et arc d'ouverture (porte), double trait (fenêtre) ;
      sens d'ouverture inversable (gauche / droite, intérieur / extérieur)
- [x] Propriétés : largeur, hauteur, hauteur d'allège (fenêtre), sens
- [x] Déplacer ou modifier le mur garde les ouvertures à leur place relative ; supprimer le mur
      supprime ses ouvertures
- [x] Métrés : surface murale **nette** (brute − ouvertures), nombre et liste des ouvertures ;
      CSV mis à jour
- [x] Migration du document (version 1 → 2) testée

**Critères d'acceptation**
- Un mur de 4,00 m × 2,50 m avec une porte de 0,90 × 2,10 m affiche 10,00 m² brut et 8,11 m² net
- Une ouverture ne peut pas dépasser l'extrémité de son mur ni chevaucher une autre ouverture
- Un projet créé avant M5 s'ouvre sans perte

## M6 — Niveaux

Objectif : un projet Plan contient plusieurs étages.

- [x] Liste des niveaux (rez-de-chaussée par défaut) : ajouter, renommer, réordonner,
      supprimer avec confirmation, dupliquer un niveau (copie des murs)
- [x] Chaque niveau a une altitude et une hauteur d'étage ; les nouveaux murs prennent la
      hauteur d'étage par défaut
- [x] Sélecteur de niveau dans l'éditeur ; on ne dessine et ne sélectionne que sur le niveau actif
- [x] Niveau inférieur affiché en transparence (calque de référence, désactivable)
- [x] Métrés par niveau et pour tout le bâtiment ; CSV avec une colonne « Niveau »
- [x] Migration : un projet existant reçoit un niveau « Rez-de-chaussée »

**Critères d'acceptation**
- Je duplique le rez-de-chaussée en « Étage 1 » : les murs sont copiés, les pièces non
- Un clic sur un mur du niveau de référence ne le sélectionne pas
- Les totaux du bâtiment = somme des totaux des niveaux

## M7 — Axes de construction et mobilier

- [x] Outil Axe : ligne de repère avec bulle et étiquette ; numérotation automatique
      (A, B, C… pour un sens, 1, 2, 3… pour l'autre), modifiable
- [x] Les axes sont communs à tous les niveaux ; les points s'y aimantent
- [x] Bibliothèque de mobilier et d'équipements **dessinés pour Fabrics, en « clean room »**
      (règle de `CLAUDE.md` : aucune source tierce) : **392 objets en 17 catégories + 24
      ensembles** (cuisines complètes : américaine, en L, en U… ; bars), entièrement spécifiés dans `docs/06-BIBLIOTHEQUE.md` (catalogue, dimensions
      en mm, gabarits de dessin, format de données, tests, découpage en lots A à J). Au début
      de M7 : lire ce document, présenter les lots, puis exécuter sans réinventer le contenu.
      Le catalogue **remplace** la liste courte d'objets d'origine (table, chaise, lit…)
- [x] Panneau Bibliothèque : recherche, glisser-déposer sur le plan ; objet à taille réelle,
      redimensionnable et pivotable
- [x] Le mobilier n'entre pas dans les métrés ; il apparaît dans le CSV sous forme de liste
      (nom, nombre)

**Critères d'acceptation**
- Un lit 1600 × 2000 mm posé sur le plan mesure 1600 × 2000 mm avec l'outil Cote
- Un nouvel axe parallèle aux axes « A, B » reçoit « C »

## M8 — Vue 3D

Objectif : voir le bâtiment en volume, à côté du plan, mis à jour en direct.

- [x] Dépendances 3D installées (voir `docs/02-ARCHITECTURE.md`, accord de l'utilisateur)
- [x] `src/features/building/` : fonctions pures qui transforment le document en modèle 3D
      (murs extrudés, ouvertures découpées, dalles sous les pièces, toit plat) + tests
- [x] Panneau 3D à droite de l'éditeur, ouvrable / fermable, redimensionnable
- [x] Caméra orbitale (tourner, zoomer, déplacer), cube d'orientation avec points cardinaux
      (nord réglable dans les réglages du plan)
- [x] Afficher tous les niveaux ou seulement jusqu'au niveau actif (vue « étage ouvert »)
- [x] Sélectionner un mur en 3D le sélectionne aussi sur le plan
- [x] Capture PNG de la vue 3D

**Critères d'acceptation**
- Modifier un mur sur le plan met la 3D à jour en moins d'une seconde
- Une fenêtre de 1,20 × 1,00 m à 0,90 m d'allège apparaît comme un trou à la bonne hauteur
- Un bâtiment de 3 niveaux reste fluide (pas de saccade en tournant la caméra)

## M9 — Outils de construction

Objectif : construire plus vite (pièces en un geste, pièces toutes faites) et ajouter les
éléments de bâtiment qui manquent : plateformes, escaliers entre niveaux, cheminées. Ce jalon
vient **avant** les façades et coupes pour que ces éléments y apparaissent dès le départ.
Pas de nouveau raccourci clavier : `Maj + R` existe déjà (son champ d'action est étendu au
lot B) ; pas de toit en pente. Unités : mm, m², m³ partout. Les pièces préfabriquées sont
dessinées de zéro (« clean room »). **Pas de changement de version du document** : trois
nouveaux types d'éléments, aucun ancien projet modifié (même règle qu'en M7). Règles
détaillées : `docs/02-ARCHITECTURE.md`, section « Outils de construction (M9) ».

### Lot A — Murs et pièces
- [x] Outil Mur : mode « Mur droit » (2 clics, début et fin), en plus du tracé en polyligne ;
      mêmes aimantations. Pas de nouveau bouton dans la barre d'outils
- [x] Outil Pièce : mode « Rectangle » (2 clics, coins opposés), en plus du polygone libre.
      Pas de nouveau bouton
- [x] Option « avec murs » du mode Rectangle : la pièce + **un seul mur fermé** placé à
      l'extérieur (le tracé = faces intérieures), créés en un seul pas d'historique

### Lot B — Pièces préfabriquées
- [x] Catégorie « Pièces préfabriquées » dans la Bibliothèque : chambre, salle de bain, WC,
      cuisine, séjour, bureau, garage (mur fermé, ouvertures, mobilier, pièce étiquetée)
- [x] Aperçu fantôme sous le curseur ; pose en un seul pas d'historique, annulable ; les
      éléments posés restent indépendants et gardent leurs ouvertures
- [x] `Maj + R` pivote aussi les murs, pièces, cotes et plateformes : la sélection entière
      tourne de 90° autour de son centre commun ; les ouvertures suivent leur mur

### Lot C — Plateformes
- [x] Type `platform` (polygone à points absolus, hauteur, épaisseur)
- [x] Outil Plateforme (polygone libre ou rectangle), dessin 2D avec étiquette (`+450 mm`),
      propriétés ; épaisseur par défaut = hauteur (estrade pleine), jamais plus grande
- [x] Volume en 3D ; surface (m²) et volume = surface × épaisseur (m³) dans les métrés et le CSV

### Lot D — Escaliers entre niveaux
- [x] Type `stair` : droit (`length`), en L (`length` + `length2`), en U (`length` +
      `length2` + jour central `gap`), retournable ; posé sur un niveau, relié au niveau du dessus
- [x] Nombre de contremarches calculé depuis la hauteur à monter (≤ 180 mm chacune), giron
      = longueur des volées ÷ nombre de girons, au moins 250 mm ; recalculé quand une altitude
      change ; pose refusée sur le dernier niveau ; escalier trop court en rouge avec la
      longueur nécessaire
- [x] Niveau du dessus supprimé plus tard : l'escalier reste, en rouge, avec le message
      « aucun niveau au-dessus », sans trémie. Dupliquer un niveau ne copie pas ses escaliers
- [x] Symbole 2D (marches, flèche de montée), marches en 3D, escalier visible en fantôme sur
      le niveau du dessus
- [x] Métrés : nombre de contremarches et de girons, hauteur de contremarche, giron,
      emmarchement (en mm)

### Lot D bis — Trémie
- [x] Trémie calculée depuis l'emprise de l'escalier + marge `voidMargin` (50 mm par défaut),
      jamais stockée ; en L : polygone en L
- [x] Dalle 3D du niveau du dessus trouée (forme avec trou, sans calcul booléen)
- [x] Contour pointillé avec croix sur le plan du niveau du dessus
- [x] Métrés : surface de la pièce au tracé, trémie, surface nette ; colonne « Trémie » du CSV
- [x] Trémie qui déborde de la pièce : avertissement, dalle laissée pleine (cas noté dans « Idées »)

### Lot E — Cheminées
- [x] Type `chimney` (emprise, rotation, dépassement en mm au-dessus du dernier niveau)
- [x] Symbole 2D sur son niveau, contour fantôme sur les niveaux du dessus ; volume en 3D
      (sans trou dans les dalles) ; propriétés

**Critères d'acceptation**
- Une pièce rectangulaire de 4000 × 3000 mm tracée en 2 clics affiche 12,00 m² et 14 000 mm ;
  avec l'option « avec murs » (épaisseur 200 mm), elle garde 12,00 m² et le mur fermé a un
  axe de 4200 × 3200 mm
- Une pièce préfabriquée posée puis annulée disparaît entièrement en un seul « annuler » ;
  `Maj + R` la fait tourner d'un quart de tour avec ses ouvertures et son mobilier
- Un escalier entre deux niveaux distants de 2 700 mm a 15 contremarches de 180 mm et
  14 girons ; passer la hauteur d'étage à 2 880 mm donne 16 contremarches
- Un escalier droit de 1000 × 3500 mm sous une pièce de 5000 × 4000 mm (20,00 m²) perce un
  trou de 1100 × 3600 mm (3,96 m²) : la pièce affiche 20,00 m² au tracé et 16,04 m² net ;
  déplacer l'escalier déplace le trou ; un escalier de 3000 mm de long est signalé trop court
  (3500 mm nécessaires)
- Un projet créé avant M9 s'ouvre sans perte

---

## M10 — Façades, coupes et planche

Objectif : obtenir sans dessiner les façades et les coupes, et les présenter ensemble.

- [x] Façades (élévations) Nord, Sud, Est, Ouest générées à partir du modèle 3D
- [x] Outil Ligne de coupe sur le plan (repère A–A, B–B…, sens de vue) ; coupe générée,
      matières coupées en noir
- [x] Vues générées en lecture seule, toujours à jour avec le plan
- [x] Planche : affichage côte à côte des niveaux, façades et coupes, avec leurs titres
- [x] Export PDF de la planche ou d'une vue seule, à l'échelle choisie, avec cartouche
- [x] Cotes de niveaux (altitudes) sur les façades et coupes

**Critères d'acceptation**
- Une façade montre chaque fenêtre du mur correspondant, à la bonne hauteur
- Déplacer la ligne de coupe met la coupe à jour
- Imprimée à 100 %, une hauteur d'étage de 2500 mm mesure 50 mm sur une façade à 1:50

## M10 bis — Ouvertures détaillées, toitures, hachures et textures

Objectif : des plans, façades et coupes qui ressemblent à de vrais dessins d'architecte.
Ajouté le 2026-11-11 à la demande de l'utilisateur ; commence après la validation de M10.
**Validé le 2026-11-12** (test dans le navigateur, par l'utilisateur).
Unités : mm, m², m³ ; la pente d'un toit se saisit en degrés (comme la rotation et le nord).

### Lot A — Styles de portes, fenêtres et baies

Un champ `style` facultatif sur `opening` choisit le dessin (plan, façades **et 3D**, demande de
l'utilisateur du 2026-11-11). Le trou dans le mur et les métrés ne changent pas. Sans `style`, l'ouverture garde son dessin actuel : pas de migration.
Pas de doublon : une variante qui ne change que la taille est une **taille rapide**, pas un style.

| Type | Styles (taille par défaut en mm) | Tailles rapides |
|---|---|---|
| Porte | battant (existe, 900 × 2100) · double battant (1400 × 2100) · coulissante en applique (900 × 2100) · coulissante à galandage (900 × 2100) · pliante (900 × 2100) · va-et-vient (900 × 2100) · garage sectionnelle (2400 × 2000) · garage basculante (2400 × 2000) | porte d'entrée 1000 × 2150 (battant) |
| Fenêtre | deux vantaux (existe, 1200 × 1000, allège 900) · un vantail (700 × 1200, allège 900) · fixe (1200 × 1000, allège 900) · coulissante (1500 × 1200, allège 900) · à soufflet (600 × 400, allège 1600) | porte-fenêtre : allège 0, hauteur 2150 (un ou deux vantaux) |
| Baie | coulissante (existe, 2400 × 2150) · fixe (2400 × 2150) · ouverture libre (1000 × 2100) | vitrine 3000 × 2200 (fixe) ; passe-plat 600 × 600, allège 1000 (ouverture libre) |

« Oscillo-battant » est une option des fenêtres à vantaux (marque en façade seulement). La
fenêtre fixe et la baie fixe partagent le même dessin.

- [x] Catalogue des styles (fonctions pures) : styles permis par type, tailles par défaut,
      tailles rapides ; changer de style suit la règle de M8 (une taille encore par défaut prend
      celle du nouveau style, une taille modifiée à la main est gardée) ; la galandage exige une
      longueur de mur libre égale à sa largeur à côté de l'ouverture (sinon : message, refus)
- [x] Symboles 2D originaux de chaque style ; choix du style dans la barre contextuelle des outils
      Porte et Fenêtre et dans Propriétés (avec les tailles rapides et l'option oscillo-battant)
- [x] Menuiseries dessinées en façade (vantaux, triangle d'ouverture vers les gonds, flèche du
      coulissant, panneaux du garage) ; colonne « Style » dans le tableau des ouvertures du CSV
- [x] Menuiseries en **3D** (`buildOpeningFills`) : vantaux, montants et traverses selon le style
      (deux vantaux séparés, fixe sans battant, coulissante décalée, panneaux du garage, porte
      pliante en lames, ouverture libre sans remplissage) ; mêmes formes que la façade

### Lot B — Toitures

Type `roof` : contour, forme, pente α (degrés), débord d (mm), sens du faîtage. Posé sur un
niveau, sa base est le dessus des murs de ce niveau (altitude + hauteur d'étage). Le toit plat
automatique actuel n'est plus dessiné sous l'emprise d'un toit. Formes :

| Forme | Contour | Hauteur du faîtage h (L = portée, perpendiculaire au faîtage) |
|---|---|---|
| Plat | polygone ou rectangle | 0 |
| Un pan | rectangle | h = L × tan α |
| Deux pans | rectangle | h = (L ÷ 2) × tan α ; faîtage parallèle au grand côté par défaut |
| Quatre pans (croupe) | rectangle | h = (L ÷ 2) × tan α ; longueur du faîtage = Lg − L ; sur un carré, le faîtage devient un point (pavillon) |

Le débord agrandit l'emprise de d sur chaque côté ; le versant garde sa pente, donc l'égout
descend de d × tan α sous le dessus du mur. Toutes les formes à versants : **surface réelle =
surface projetée (avec débord) ÷ cos α**. Les toits en pente demandent un rectangle (orientable,
`Maj + R`) ; un bâtiment en L reçoit deux toits (les noues viendront plus tard).

- [x] Calcul pur (`src/features/building/roof.ts`) : versants, faîtage, égouts, pignons, surfaces,
      avec tests
- [x] Outil Toiture : tracé rectangle (et polygone pour le toit plat), symbole 2D (contour du
      débord en pointillé, faîtage, arêtiers, sens de la pente) ; Propriétés : forme, pente,
      débord, bouton « Pivoter le faîtage », hauteur du faîtage affichée en mm
- [x] Toiture en 3D (versants, débords ; pignons fermés jusqu'au versant)
- [x] Toiture dans les façades (versants inclinés, pignons en triangle) et dans les coupes
      (profil coupé en noir, altitude du faîtage cotée)
- [x] Métrés : surface réelle (m²), longueur de faîtage et d'égout (mm), nombre de pignons ;
      tableau « Toitures » dans le panneau et le CSV. Aucun prix.

### Lot C — Hachures et textures

- [x] Matériau par mur (béton, maçonnerie, brique, bois, isolant, plaque de plâtre) et
      couverture par toit (tuiles, ardoises, zinc, bac acier, toiture plate) ; sans matériau,
      rendu actuel (blanc, ou noir en coupe). Catalogue et générateur de motifs vectoriels purs
      (`materials.ts`, `views/patterns.ts`), avec tests
- [x] Choix du matériau et de la couverture dans Propriétés (aussi pour plusieurs murs)
- [x] Hachures des matières coupées dans les coupes (et les plans de niveau de la planche),
      selon le matériau
- [x] Textures des façades (brique, enduit, bardage bois, couverture des versants), motifs
      originaux dessinés pour Fabrics ; mêmes motifs, en vectoriel, dans le PDF des vues et de
      la planche
- [x] Couleur par matériau et par couverture en 3D (demande de l'utilisateur ; sans matériau,
      3D inchangée)

**Critères d'acceptation**
- Chaque style a un symbole 2D distinct ; un projet d'avant M10 bis s'ouvre sans changement
- Une galandage sans place à côté dans le mur est refusée avec un message
- Une fenêtre à deux vantaux montre ses deux vantaux en façade, à la bonne hauteur d'allège
- Deux pans sur 8000 × 6000 mm, pente 35°, débord 500 mm : faîtage à + 2101 mm au-dessus des
  murs, surface réelle 76,91 m², faîtage 9000 mm, égouts 2 × 9000 mm, 2 pignons
- La même toiture en croupe : 76,91 m², faîtage 2000 mm, égout 32000 mm, aucun pignon ;
  sur 6000 × 6000 mm, faîtage de 0 mm (pavillon)
- Un pan de 6000 mm de portée à 35° : point haut à + 4201 mm
- La façade pignon montre un triangle ; la coupe perpendiculaire au faîtage montre le profil
  du toit en noir ; changer la pente met à jour la 3D, les façades et les coupes en direct
- Changer le matériau d'un mur change sa hachure en coupe ; le PDF montre les mêmes motifs

## M10 ter — Documents client / exécution (métrés et cotes)

Objectif : de chaque plan, tirer deux documents : une version **Client** simple, sans
vocabulaire technique, et une version **Exécution** complète pour le chantier.
Ajouté le 2026-11-11 à la demande de l'utilisateur ; commence après la validation de M10 bis.
**Lot A validé le 2026-11-12** (test dans le navigateur, par l'utilisateur). **Lot B codé et validé le 2026-11-12** (test dans le navigateur, par l'utilisateur).

**Principe : un seul calcul, deux présentations.** Les quantités et la géométrie viennent des
calculs existants (`src/features/measurements/`, `src/features/geometry/`). Les deux versions
ne diffèrent que par ce qu'elles montrent et par leurs libellés ; elles ne peuvent donc pas se
contredire. Toute la logique est en fonctions pures testées. Unités : mm entiers, m², m³, dans
les deux versions. Aucun prix.

**Repères** (partagés par les métrés et les cotes) : murs `M01…`, portes `P01…`, fenêtres et
baies `F01…`. Calcul pur, numérotation par niveau puis de haut en bas et de gauche à droite.

**Usages de cotation retenus (Madagascar, héritage des usages français)** — à confirmer par
l'utilisateur sur un premier PDF :
- cotes d'exécution **au nu brut** des murs (faces de la maçonnerie, enduits non compris) ;
- baies cotées en **dimensions brutes de maçonnerie** (de tableau à tableau), notées
  `largeur / hauteur` (`1200 / 1350`), allège à part (`All. 900`) ;
- une note sur chaque document d'exécution : « Baies cotées en dimensions brutes de maçonnerie
  (tableau à tableau). Dimensions des menuiseries : à confirmer par le menuisier après prise de
  cotes sur place. »

### Lot A — Métrés client / exécution

- [x] Repères automatiques `M01`, `P01`, `F01` (calcul pur, avec tests), affichés dans les
      métrés d'exécution
- [x] Présentation **Client** (fonction pure) : pour chaque pièce, son nom, ses dimensions
      intérieures et sa **surface au sol** (trémie déduite) ; total par niveau et pour le
      bâtiment ; nombre de portes et de fenêtres. Libellés simples, sans épaisseur ni surface
      de mur
- [x] PDF Client : vignette du plan, tableau des pièces, totaux, cartouche de M10 ; le PDF
      continue sur la page suivante si les pièces ne tiennent pas sur une page
- [x] Présentation **Exécution** (fonction pure) : murs (repère, longueur à l'axe et par face,
      épaisseur, hauteur, surface brute et nette par face, volume), ouvertures (repère, style,
      baie brute largeur × hauteur, allège, mur porteur), escaliers, dalles, trémies,
      cheminées, toitures ; par niveau et pour le bâtiment. **Toutes les ouvertures sont
      déduites**, sans seuil. Rappel des règles de calcul imprimé en fin de document
- [x] CSV et PDF de plusieurs pages pour la version Exécution (repart de l'export actuel des
      métrés et de son modèle de tableaux commun `buildMetresTables` : tableaux, données à
      plat, PDF) ; la version Client passe par le même modèle
- [x] Panneau Métrés : bascule « Client / Exécution » ; la fenêtre Exporter demande la version

### Lot B — Cotes client / exécution

Les cotes automatiques sont **calculées**, pas enregistrées dans le document : elles suivent
toujours le plan. Les cotes tracées à la main restent des éléments du document.

- [x] Calcul pur des cotes **Client** : dimensions extérieures totales du bâtiment (une cote
      par côté) ; dans chaque pièce, son nom, ses dimensions intérieures (pièce rectangulaire :
      `4000 × 3000` ; autre forme : la longueur de chaque côté intérieur) et sa surface
- [x] Calcul pur des cotes **Exécution** : trois chaînes par façade (1. baies et trumeaux ;
      2. murs de refend et axes ; 3. longueur totale), chaînes intérieures avec l'épaisseur de
      chaque mur, baies `largeur / hauteur` + allège + repère, altitudes des sols et des dalles
      (`±0`, `+2850`), trémies, escaliers (nombre de contremarches, hauteur, giron)
- [x] Réglage « Cotation : Aucune / Client / Exécution » dans la barre d'outils du plan (« Aucune »
      par défaut, D50) ; texte plus grand et cotes moins nombreuses en Client
- [x] Cotes tracées à la main : champ facultatif « Visible en : Client / Exécution / Les deux »
      (sans champ : les deux, donc pas de migration)
- [x] Planche : réglage de cotation par vue ; export PDF : choix de la version ; note sur les
      baies imprimée sur les documents d'exécution
- [x] Ajout demandé le 2026-11-12 : **périmètre** et **hauteur sous plafond** de chaque pièce dans
      le tableau des pièces des métrés Client (pas sur le plan coté, choix de l'utilisateur ; D52)

**Critères d'acceptation**
- Une pièce « Chambre » de 4000 × 3000 mm intérieurs affiche en Client « Chambre »,
  `4000 × 3000` et `12,00 m²`, sans aucune autre cote à l'intérieur
- Un bâtiment de 8000 × 6000 mm aux axes, murs de 200 mm : cotes extérieures totales
  `8200` et `6200` dans les deux versions
- Façade de 6000 mm au nu avec une fenêtre de 1200 mm centrée : 1re chaîne `2400 · 1200 · 2400`,
  dernière chaîne `6000` ; la fenêtre porte `F01`, `1200 / 1350`, `All. 900`
- Le même repère (`F01`, `M03`…) apparaît sur le plan d'exécution et dans les métrés
  d'exécution ; une ouverture de 400 × 400 mm est déduite de la surface du mur
- Passer de Client à Exécution ne modifie pas le document (pas d'entrée dans l'historique) ;
  une cote manuelle « Exécution » n'apparaît pas en Client
- Un projet d'avant M10 ter s'ouvre sans changement
- Aucun montant, prix ni devis dans aucune des deux versions

### À traiter — Cas limites des métrés client / exécution (audit du 2026-11-12)

Issu de l'audit du lot A. À traiter avant M11, dans l'ordre des groupes. Chaque tâche : une
fonction pure testée (Vitest) quand il y a un calcul, textes dans `src/i18n/fr.ts`, puis
`npm run build`, `npm run lint`, `npm test`. Les groupes 3 et 4 commencent par une **décision
de l'utilisateur** (notée dans `docs/PROGRESS.md`).

**Groupe 1 — Exports justes (petit, sans ambiguïté)**

- [x] **Total d'un seul niveau.** Exporté avec la portée « niveau affiché », la ligne de total
      du récapitulatif Client dit « Total du niveau » au lieu de « Bâtiment ».
      Fichiers : `src/features/measurements/clientView.ts` (paramètre `scope`), `src/i18n/fr.ts`,
      `src/components/editor/exportMetres.ts`, test dans `clientView.test.ts`.
- [x] **Niveau actif introuvable.** `restrictToLevel` ne renvoie plus tout le bâtiment en silence :
      il renvoie `null` et l'export affiche un message (« Ce niveau n'existe plus »).
      Fichiers : `src/features/measurements/measurements.ts`, `exportMetres.ts`, `ExportDialog.tsx`,
      test dans `measurements.test.ts`.
- [x] **En-tête Client du XLSX et du CSV.** Comme le PDF : titre « Surfaces de votre projet » et
      note Client, sans note technique. Fichiers : `exportMetres.ts` (un `meta` par version),
      `src/features/measurements/csv.ts`, `src/i18n/fr.ts`, test dans `csvExport.test.ts`.
- [x] **Nom de fichier par version.** Suffixe `-client` ou `-execution` ajouté au nom (après
      nettoyage, avant l'extension). Fichiers : `src/features/export/fileName.ts`, `exportMetres.ts`,
      test dans `fileName.test.ts`.
- [x] **Option mobilier.** La case « Inclure le mobilier » est masquée en version Client (la vue
      Client n'a pas de mobilier). Fichier : `ExportDialog.tsx`.
- [x] **Une seule version choisie.** La fenêtre Exporter s'ouvre sur la version affichée dans le
      panneau Métrés (état d'interface partagé dans le store de l'éditeur, hors document et hors
      historique). Fichiers : store de l'éditeur, `MeasurementsPanel.tsx`, `ExportDialog.tsx`.

**Groupe 2 — Lisibilité du document Client**

- [x] **Pièce sans dimensions** (forme en L, rectangle incliné) : la cellule affiche « forme
      libre » au lieu d'être vide. Fichiers : `clientView.ts`, `fr.ts`, test.
- [x] **Nom de pièce vide ou en double** : nom vide → « Pièce 1 », « Pièce 2 »… (numérotation
      par niveau) ; deux pièces de même nom gardent leur nom (cas normal : « Chambre »). Fichiers :
      `clientView.ts`, test.
- [x] **Niveau vide** : absent du récapitulatif Client (aucune pièce, aucune ouverture), mais
      toujours présent en Exécution. Fichiers : `clientView.ts`, test.
- [x] **Vignette du plan** : légende « Niveau : RDC » sous la vignette ; en portée « bâtiment »,
      une vignette par niveau qui a des murs (côte à côte si la place suffit, sinon page suivante).
      Vérifier sur un plan très allongé et un plan très petit que traits et textes restent
      lisibles (épaisseur de trait minimale). Fichiers : `metresPdf.ts`, `exportMetres.ts`,
      test dans `metresPdf.test.ts`.
- [x] **« PDF d'une page »** : si les pièces ne tiennent pas sur une page, le PDF continue sur la
      suivante (comportement actuel) ; libellé de la tâche du lot A corrigé en conséquence.

**Groupe 3 — Fiabilité des surfaces (décision de l'utilisateur d'abord)**

- [x] **Décision : dimensions affichées au client** — option A retenue le 2026-11-12 (D49). Le contour d'une pièce est tel que dessiné
      (souvent à l'axe des murs) ; la roadmap promet des « dimensions intérieures ».
      Option A : libellé « Dimensions du tracé » (simple, honnête). Option B : calculer les
      dimensions et la surface intérieures en retirant la demi-épaisseur des murs qui bordent la
      pièce (rejoint l'idée « surface intérieure » de `docs/PROGRESS.md`, prérequis du lot B).
- [x] **Avertissements visibles en Client** : trémie qui déborde d'une pièce (surface laissée
      pleine) et pièces qui se chevauchent sont signalées dans la vue Client du panneau, comme en
      Exécution. Fichier : `MeasurementsPanel.tsx`.
- [x] **Contrôle avant export** : fonction pure `metresWarnings(document, building)` qui liste
      pièces superposées, trémies qui débordent, pièces masquées comptées, pièces qui ne
      remplissent pas l'espace entre leurs murs ou qui en débordent (tâche suivante), éléments
      sans niveau (hors axes), ouvertures plus larges que leur segment ou qui se chevauchent. La fenêtre
      Exporter affiche la liste avant le téléchargement (sans bloquer, sauf manque ou débord d'une
      pièce : export refusé jusqu'à correction, D55). Fichiers :
      `src/features/measurements/warnings.ts` (nouveau) + test, `ExportDialog.tsx`, `fr.ts`.
- [x] **Pièce qui ne remplit pas l'espace entre les murs** (cas très fréquent). Une pièce
      dessinée à la main laisse souvent une petite bande ou un coin non couvert entre son contour
      et les murs qui l'entourent : cette surface manque dans les métrés sans que rien ne le
      signale. Fonction pure `roomCoverageGaps(room, walls)` : calcule la zone fermée par les murs
      autour de la pièce (même référence que le contour : axe ou face, selon la décision
      « dimensions affichées au client »), lui retire la pièce et renvoie les morceaux restants
      au-delà d'un seuil (par exemple plus de 50 mm de large ou plus de 0,01 m²), avec leur
      surface. Le cas inverse est aussi signalé : une pièce qui déborde au-delà des murs.
      Affichage : avertissement dans le panneau Métrés (Client et Exécution) et dans le contrôle
      avant export (« Salon : 0,12 m² non couverts le long du mur M04 ») ; la zone manquante est
      surlignée sur le plan quand on clique l'avertissement. Rien n'est corrigé automatiquement.
      Fichiers : `src/features/measurements/roomCoverage.ts` (nouveau) + test,
      `warnings.ts`, `MeasurementsPanel.tsx`, `fr.ts`. Tests : pièce exacte (aucun écart),
      pièce décalée de 100 mm d'un côté (bande signalée avec sa surface), coin oublié d'une pièce
      en L, pièce qui déborde d'un mur, pièce sans murs autour (aucun avertissement), écart sous
      le seuil (ignoré).
- [x] **Décision : pièces masquées** — option A retenue le 2026-11-12 (D56) : comptées, avec l'avertissement. Les compter (règle actuelle, avec l'avertissement ci-dessus)
      ou les retirer du document Client seulement.

**Groupe 4 — Repères `M01`, `P01`, `F01`**

- [x] **Ordre de lecture sans saut de bande** : regrouper en lignes par écart réel entre éléments
      (tri par y, nouvelle ligne quand l'écart dépasse 500 mm) au lieu de `Math.round(y / 500)` ;
      deux murs à y = 749 et y = 751 sont sur la même ligne. Fichiers : `references.ts`, test
      dans `references.test.ts`.
- [x] **Ouverture hors de son segment** : centre ramené sur le segment (`offset` borné à sa
      longueur) pour le classement. Fichiers : `references.ts`, test.
- [x] **Décision : stabilité des repères** — option A retenue le 2026-11-12 (D57).
- [x] **Mention « Repères valables à la date du document »** (suite de la décision A) : imprimée
      dans la note et dans les règles de calcul des métrés Technique (PDF, Excel, CSV) et dans la
      note des PDF de plans cotés en Technique. Absente de la version Client (pas de repères).
      Fichiers : `src/i18n/fr.ts`, test dans `clientView.test.ts`. Les repères changent dès qu'on ajoute ou déplace un
      élément ; un PDF déjà envoyé peut ne plus correspondre. Option A : garder le calcul et
      imprimer « Repères valables à la date du document ». Option B : figer les repères (champ
      facultatif enregistré, sans migration), les nouveaux éléments prennent le numéro suivant.
- [x] **Tri au-delà de 99** : repères sur trois chiffres (`M001`) dès qu'un type dépasse 99
      éléments, pour que le tri d'Excel reste juste. Fichiers : `references.ts`, test.

**Critères d'acceptation**
- Un export Client « niveau affiché » du R+1 dit « Total du niveau » et non « Bâtiment »
- Un XLSX ou CSV Client ne contient aucun mot technique (épaisseur, surface de mur, volume)
- Exporter la version Client puis Exécution donne deux fichiers distincts
  (`maison-client.pdf`, `maison-execution.pdf`)
- Une pièce en L affiche « forme libre » ; une pièce sans nom affiche « Pièce 1 »
- Une trémie qui déborde ou deux pièces superposées sont signalées dans la vue Client et dans
  la fenêtre Exporter
- Une pièce dessinée 100 mm trop courte contre un mur de 4000 mm est signalée (« 0,40 m² non
  couverts ») ; une pièce qui touche exactement ses murs ne l'est pas
- Deux murs à y = 749 et y = 751, x = 0 et x = 1000, reçoivent `M01` puis `M02`
- Un projet d'avant cette étape s'ouvre sans changement

### Hors jalon — Noms automatiques des murs et des ouvertures (demande du 2026-11-12)

Demande de l'utilisateur : « Mur 1 », « Porte 2 » ne se lisent pas naturellement. Les murs,
portes, fenêtres et baies prennent un nom tiré des **pièces qu'ils touchent**. Fait et validé dans le
navigateur le 2026-11-12.

**Principe** (décisions D58 et D59 dans `docs/PROGRESS.md`) : le nom est **calculé à l'affichage**, jamais
enregistré ; il suit les renommages de pièces, les déplacements et le sens d'ouverture. Un nom
tapé à la main reste prioritaire ; vider le champ rend le nom automatique. Les anciens noms par
défaut (« Mur 1 », « Porte 2 »…) sont traités comme automatiques. Les repères `M01`, `P01`, `F01`
ne changent pas.

**Format des ouvertures : Type + Pièce + numéro**, numéro repris à 1 dans chaque pièce, dans
l'ordre de lecture du plan (de haut en bas, puis de gauche à droite).

| Cas | Nom |
|---|---|
| Portes de la cuisine | « Porte Cuisine 1 », « Porte Cuisine 2 » |
| Fenêtres du séjour | « Fenêtre Séjour 1 », « Fenêtre Séjour 2 » |
| Baie (comptée avec les fenêtres) | « Baie Séjour 1 » |
| Pièce dont le nom finit par un nombre | « Porte Chambre 1 – 1 » |
| Ouverture sans pièce | « Porte 1 », « Fenêtre 1 » |

- Une **porte** appartient à la pièce **vers laquelle elle s'ouvre** (champ `side`) ; une porte
  d'entrée prend donc le nom de la pièce d'arrivée.
- Une **fenêtre** ou une **baie** appartient à la pièce côté intérieur du mur.
- **Murs** (option A, D58) : « Mur Cuisine / Séjour », « Mur extérieur Cuisine », « Mur isolé ».
  Au-delà de deux pièces : les deux plus grandes, dans l'ordre de lecture, puis « +N »
  (« Mur Cuisine / Séjour +1 »). Deux murs du même niveau au même nom sont numérotés
  (« Mur extérieur Cuisine 1 », « … 2 »).
- Les pièces masquées comptent pour le nom, comme pour les surfaces (D56).

**Tâches**

- [x] **Décision : format des murs** — option A retenue le 2026-11-12 (D58).
- [x] **Calcul des noms** : fonction pure qui cherche, pour chaque côté d'un mur et au centre de
      chaque ouverture, la pièce du même niveau juste derrière la face. Fichiers :
      `src/features/naming/autoNames.ts` (nouveau), `autoNames.test.ts` (nouveau),
      `src/i18n/fr.ts`.
- [x] **Nom personnalisé** : le champ `name` existant suffit (D59, pas de `customName`) : un nom
      vide ou un ancien nom par défaut est automatique ; vider le champ rend le nom automatique. Fichiers : `src/types/document.ts`,
      `LayersPanel.tsx`, `OpeningFields.tsx`, `PlanElementFields.tsx`.
- [x] **Affichage partout** : calques, Propriétés, panneau Métrés (dont « Mur : … » d'une
      ouverture), exports CSV, Excel et PDF. Fichiers : `src/features/measurements/measurements.ts`,
      `tables.ts`, `MeasurementsPanel.tsx`.
- [x] **Mur coupé** : les morceaux prennent un nom automatique (fini « Mur 1 1 »). Fichier :
      `src/features/geometry/splitWall.ts`.

**Critères d'acceptation**

- Deux portes qui s'ouvrent vers la pièce « Cuisine » s'appellent « Porte Cuisine 1 » et
  « Porte Cuisine 2 » ; inverser le sens d'ouverture de l'une la renomme d'après l'autre pièce
- Renommer la pièce « Séjour » en « Salon » renomme ses fenêtres sans autre action
- Un mur renommé à la main garde son nom ; vider le champ rend le nom automatique
- Les métrés et les exports montrent les mêmes noms que les calques
- Un projet existant s'ouvre avec les nouveaux noms, sans migration

## M11 — Import et export

- [x] Export DXF (murs, pièces, cotes, ouvertures, axes sur des calques séparés, en mm)
- [x] Import DXF comme calque de fond verrouillé, sur un niveau, à l'échelle
- [x] Export 3D (glTF) du bâtiment

**Critères d'acceptation**
- Le DXF exporté s'ouvre dans LibreCAD avec des longueurs exactes en mm
- Un DXF importé garde ses dimensions (une ligne de 5000 mm mesure 5000 mm)

---

## M11 bis — Dessin précis, bibliothèque et plafonds

Objectif : dessiner plus vite et plus juste sur un fond DXF et entre niveaux, placer le mobilier
sans réglage manuel, et sortir les plafonds dans les métrés et les cotes.
Ajouté le 2026-11-12 à la demande de l'utilisateur. **Fait le 2026-11-12** (lots A à G), à tester
dans le navigateur. Placé avant M12 (décision D64, confirmée le 2026-11-12).

**Règles de jalon** : chaque tâche = fonction pure testée (Vitest) quand il y a un calcul, textes
dans `src/i18n/fr.ts`, puis build, lint et tests. Ordre des lots : A → G, sauf indication contraire.

### Lot A — Aimantation sur le fond DXF

- [x] Aimantation des murs et des sommets sur les **sommets** et les **traits** du fond DXF
      importé (groupe `groupId`, D62), pour redessiner les murs par-dessus. Calcul pur du point
      d'accroche le plus proche (extrémités, intersections, milieux) dans un rayon à l'écran.
      Fichiers : `src/features/geometry/` (calcul), `src/components/editor/` (accroche au dessin).

### Lot B — Édition des murs

- [x] **Glisser un seul mur** (option A) : poignée au milieu d'un segment droit ; le mur se déplace
      perpendiculairement, les murs voisins s'allongent et la pièce suit. Réutilise `stretchZone`.
- [x] **Joindre des murs** (inverse de « Séparer les côtés ») : fusion de murs bout à bout, de même
      épaisseur et même matériau, en un seul tracé. Sinon, refus avec un message clair. Fonction
      inverse de `src/features/geometry/splitWall.ts`.

### Lot C — Niveaux

- [x] **Niveau du dessus** affiché en transparence (désactivé par défaut) : réglage d'interface,
      hors document, hors historique.
- [x] **Aimantation sur le niveau de référence** : murs et sommets s'alignent sur ceux du niveau
      du dessous (aligner un étage sur celui d'en dessous), et sur le niveau du dessus si affiché.

### Lot D — Accueil

- [x] **Recherche de projets** sur l'accueil : filtre par nom (insensible à la casse et aux accents),
      liste locale ; fonction pure de filtrage testée.

### Lot E — Échanges DXF

- [x] **Export DXF** : ajouter les escaliers, plateformes, toitures et cheminées (nouveaux calques,
      D60 complétée).
- [x] **Import DXF** : reprendre les **textes** (TEXT, MTEXT) du fond, à leur place, à leur hauteur
      en mm (D62 : le texte garde son calque d'origine, verrouillé comme le reste du fond).

### Lot F — Bibliothèque et annotations

- [x] **Pose contre un mur** : à la pose et au déplacement, l'objet se colle à la face du mur le plus
      proche et se tourne dans le bon sens. Calcul pur testé.
- [x] **Hauteurs 3D des objets** (M8) : une hauteur de référence en mm par objet du catalogue
      (`docs/06-BIBLIOTHEQUE.md`), générique, sans valeur commerciale (principe clean room).
- [x] **Bibliothèque personnelle** : enregistrer une sélection d'objets sous un nom (« Ensemble
      cuisine ») et la réinsérer ailleurs. Stockage local du navigateur ; synchronisation avec le
      compte au M13.
- [x] **Étiquettes de cote automatiques** : à la demande, une cote (longueur d'un mur, largeur d'une
      ouverture) posée sur le plan et recalculée avec le plan. **À préciser avec l'utilisateur**
      avant de coder (quels éléments, faut-il les garder dans le document ?).
- [x] **Annotations de plan** : flèche du nord et repère de niveau, dessinés de zéro (pas de symbole
      tiers), inclus dans PDF, PNG et DXF.

### Lot G — Plafonds : cotes et métrés (D63 : tout confirmé le 2026-11-12)

Lecture retenue : « sous plafonds » = les **plafonds** de chaque pièce (surface de plafond, faux
plafonds, hauteur sous plafond).

- [x] **Tableau « Plafonds » dans les métrés**, Client et Technique : par pièce, nom, surface de
      plafond (= surface au sol, trémie déduite, D37), hauteur sous plafond (D52), périmètre ; totaux
      par niveau et pour le bâtiment. Export CSV, Excel et PDF. Pas de nouveau calcul de hauteur.
- [x] **Faux plafond** (confirmé le 2026-11-12) : option par pièce (absent = pas de faux plafond,
      donc aucune migration) ; le tableau ajoute alors une ligne « Faux plafond » avec sa surface.
- [x] **Cote d'altitude sous plafond sur le plan Technique** uniquement (« +2650 sous plafond », par
      pièce), sous le réglage « Cotation » existant. **Pas sur le plan Client** : les étiquettes Client
      restent propres (choix déjà fait en M10 ter).

**Critères d'acceptation**
- Une chambre de 4000 × 3000 mm sous une dalle à +2650 affiche dans les métrés une surface de
  plafond de `12,00 m²` et une hauteur de `2650 mm`, en Client et en Technique
- Une pièce marquée « faux plafond » ajoute sa surface dans le tableau ; une pièce sans l'option ne
  change pas
- Aucune cote sous plafond n'apparaît sur un plan Client
- Un projet d'avant M11 bis s'ouvre sans changement, avec les mêmes métrés
- Les textes sont en français ; les unités sont en mm, m² et m³ ; aucun prix

---

## M11 ter — Boussole du plan

Demande de l'utilisateur du 2026-11-12. Règle unique : **le nord est un seul angle**
(`plan.northAngle`, 0° = nord en haut) ; la boussole, la rose des vents imprimée, le cube 3D et les
façades s'en déduisent. Aucun changement du format du document.

- [x] **Boussole interactive** en bas à gauche du canevas d'un plan, **affichée à la demande**
      (bouton dans la barre d'état, masquée par défaut, choix mémorisé dans le navigateur) : rose
      N / E / S / O et aiguille rouge vers le nord, qui tourne avec l'angle ; on la tourne à la souris
      (aimantée tous les 15°, Maj = au degré), aux flèches du clavier, double-clic = nord en haut ;
      un seul « Annuler » par geste. Liée au champ « Nord » des réglages du plan.
- [x] **Rose des vents à l'impression** : la flèche du nord des annotations de plan devient une rose
      (graduations et lettres N, E, S, O qui suivent le nord), reprise dans PDF, PNG, DXF et planche.

**Critères d'acceptation**
- Le bouton boussole apparaît dans un plan (pas dans un visuel) ; la boussole est masquée à la première ouverture
- Tourner la boussole à 30° met le champ « Nord » à 30° ; saisir 90° dans le champ tourne la boussole
- Un geste complet de rotation = une seule étape d'annulation
- Avec « Flèche du nord et repère de niveau » cochée, les exports montrent N, E, S, O dans le bon sens
- Les textes sont en français ; aucune nouvelle dépendance

---

## M11 quater — Prise en main naturelle (confirmé le 2026-11-12 : placé avant M12, tablette incluse)

Origine : audit « prise en main » du 2026-11-12 (demande de l'utilisateur). Objectif : qu'une personne
qui n'a jamais utilisé de logiciel de plan dessine une pièce, pose une porte et lit sa surface sans aide
extérieure. Aucun changement du format du document. Lots à valider un par un.

- [ ] **Lot A — Barre d'outils lisible** : libellés visibles à côté des icônes de base, flèche des familles
      bien visible, menu des familles aussi accessible au clic simple, raccourcis plus logiques (à fixer).
- [ ] **Lot B — Accueil qui guide** : cartes « Dessiner un plan », « Créer une affiche », « Voir un
      exemple » ; un plan d'exemple créé pour Fabrics ; rappel que les projets restent dans ce navigateur.
- [ ] **Lot C — Premier pas dans le plan vide** : carte d'invitation au centre du canevas, qui disparaît au
      premier tracé.
- [ ] **Lot D — Aide pendant le geste** : une consigne principale par outil, les astuces (Maj, Alt…) dans
      un « Astuces » repliable.
- [ ] **Lot E — Raccourcis et gestes** : bouton « ? » et touche `?` ouvrant la liste (déplacer, zoom,
      sélection, outils).
- [ ] **Lot F — Panneau de droite rangé** : Niveaux sortis de Calques ; réglages avancés (échelle, nord,
      étiquettes) repliés quand rien n'est sélectionné.
- [ ] **Lot G — Vocabulaire** : explication en une ligne pour Plateforme, Axe, Coupe, Étirer, Calibrer ;
      message clair quand un export est bloqué (D55).
- [ ] **Lot H — Test avec une vraie personne** : 3 tâches en 5 minutes, corrections qui en sortent.

- [ ] **Lot I — Tablette** : déplacer la vue à deux doigts, zoom par pincement, boutons assez grands ; les
      outils actuels doivent rester utilisables au doigt.

Ordre confirmé : A (barre d'outils), puis C (plan vide), puis les autres lots un par un.

---

## M12 — Mise en ligne

Objectif : l'application est accessible publiquement (en mode local, sans compte).

- [ ] Créer le dépôt GitHub et pousser le code (guider l'utilisateur pas à pas)
- [ ] Ajouter `public/_redirects` (`/* /index.html 200`)
- [ ] Connecter le dépôt à Cloudflare Pages (build `npm run build`, sortie `dist`)
- [ ] Vérifier la version en ligne : création, sauvegarde, export
- [ ] README : présentation, commandes, lien de la version en ligne

**Critères d'acceptation**
- L'URL `*.pages.dev` fonctionne, y compris en rechargeant directement une page `/p/…`
- Chaque `git push` sur `main` redéploie automatiquement

---

## M13 — Comptes, sauvegarde cloud et partage

Objectif : retrouver ses projets sur un autre appareil.

- [ ] Guider la création du projet Supabase et l'exécution de `supabase/schema.sql`
- [ ] `src/lib/supabase.ts` + `.env.local` ; variables ajoutées dans Cloudflare Pages
- [ ] Page Connexion : inscription e-mail + mot de passe (avec vérification e-mail),
      connexion, mot de passe oublié, déconnexion
- [ ] Connexion Google (optionnelle, seulement si l'utilisateur la veut)
- [ ] `SupabaseRepository` (table `projects`, bucket `assets`, URLs signées)
- [ ] Choix automatique du dépôt : local si déconnecté, Supabase si connecté
- [ ] À la première connexion : proposer d'importer les projets locaux
- [ ] Gestion hors ligne simple : en cas d'échec réseau, garder une copie locale et réessayer
- [ ] Partage par lien en lecture seule (plan, 3D, planche) ; désactivable à tout moment ;
      option mot de passe et date d'expiration
- [ ] Table et règles de sécurité Supabase du partage (RLS), testées avec deux comptes

**Critères d'acceptation**
- Un projet créé sur l'ordinateur apparaît sur le téléphone avec le même compte
- Un second compte ne voit **aucun** projet ni image du premier (tester avec deux comptes)
- Sans variables Supabase, l'application fonctionne toujours en mode local
- Un lien de partage désactivé ne montre plus rien, même rechargé ; la personne qui reçoit
  le lien ne peut rien modifier

**✅ Fin du MVP**

---

## M14 — Collaboration temps réel

- [ ] Choisir et documenter l'hébergement du serveur Yjs (option gratuite)
- [ ] Représenter `elements` dans un `Y.Array` / `Y.Map` ; synchroniser avec `editorStore`
- [ ] Curseurs et présence des autres participants (awareness)
- [ ] Persistance de l'état Yjs dans Supabase
- [ ] Partage d'un projet avec un autre compte (lecture ou édition)

---

## Plus tard (non planifié, à prioriser avec l'utilisateur)

- **Assistant IA « Demander quelque chose »** (plan, mise en page, couleurs, textes) — à
  étudier après M14, à la demande de l'utilisateur
- Modèles de visuels originaux, bibliothèque de composants, identité de marque
- QR code pour les liens de partage
- Commentaires ancrés sur le canevas, mentions, notifications
- Historique de versions avec restauration
- Plusieurs pages par projet, mode présentation
- Espaces de travail, membres et rôles (propriétaire, admin, éditeur, commentateur, lecteur)
- Traductions anglais et malgache, mode sombre, accessibilité avancée
- Abonnements et paiements, statistiques d'usage, conformité RGPD complète
- Export DWG
- Toitures avancées, après M10 bis : demi-croupe, mansarde, sheds, toit courbe, noues (toits
  en L ou en T d'un seul tenant), lucarnes, fenêtres de toit
- Fenêtre ronde (œil-de-bœuf) : demande un trou rond dans le mur en 3D et en coupe
