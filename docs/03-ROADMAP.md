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
- [x] Export IFC pour Revit (murs, ouvertures, pièces, sols, niveaux ; ajouté le 2026-11-12)

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
- ~~**Étiquettes de cote automatiques**~~ : fait puis **retiré** le 2026-11-12 à la demande de
      l'utilisateur (lecture jugée peu naturelle). Voir `docs/PROGRESS.md`.
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

### Lot H — Murs propres : métrés justes et contrôle du plan (demande de l'utilisateur, 2026-11-12)

- [x] **Raccords en T corrigés dans les métrés** : un mur qui se termine contre un autre n'est plus
      compté deux fois dans le volume, et ses faces cachées ne sont plus comptées. Aucune interface.
- [x] **Aimantation du mur** : distance minimale de 50 mm, même très zoomé.
- [x] **Contrôle des murs** : écart (≤ 50 mm) entre deux murs et murs superposés, listés dans
      « À vérifier » du panneau Métrés avec un bouton **Joindre** / **Corriger** (annulable), et
      pastille « N points à vérifier » dans l'en-tête de l'éditeur.

**Critères d'acceptation**
- Un mur de 4000 mm qui se termine sur l'axe d'un mur de 200 mm voit son volume diminuer de
  `100 × 200 × hauteur` ; un angle en L ne change pas
- Deux murs à 10 mm l'un de l'autre font apparaître la pastille « 1 point à vérifier » ; « Joindre »
  la fait disparaître, et Ctrl+Z la fait revenir
- Un plan bien dessiné n'affiche aucune pastille

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

- [x] **Lot A — Barre d'outils lisible** : libellés visibles à côté des icônes de base, flèche des familles
      bien visible, menu des familles aussi accessible au clic simple (2026-11-12). Raccourcis plus logiques :
      faits le 2026-11-27 (D82) : lettre de l'ancien Fabrics et code Revit à deux lettres, vue aux flèches.
- [x] **Lot B — Accueil qui guide** (version « plan seulement » demandée par l'utilisateur le 2026-11-12 : deux cartes, « Dessiner un plan » et « Voir un exemple » ; plus de création de visuel depuis l'accueil) : cartes « Dessiner un plan », « Créer une affiche », « Voir un
      exemple » ; un plan d'exemple créé pour Fabrics ; rappel que les projets restent dans ce navigateur
      (2026-11-12).
- [x] **Lot C — Premier pas dans le plan vide** : carte d'invitation au centre du canevas, qui disparaît au
      premier tracé (2026-11-12).
- [x] **Lot D — Aide pendant le geste** : une consigne principale par outil, les astuces (Maj, Alt…) dans
      un « Astuces » repliable (2026-11-12).
- [x] **Lot E — Raccourcis et gestes** : bouton « ? » et touche `?` ouvrant la liste (déplacer, zoom,
      sélection, outils) (2026-11-12).
- [x] **Lot F — Panneau de droite rangé** : Niveaux sortis de Calques ; réglages avancés (échelle, nord,
      étiquettes) repliés quand rien n'est sélectionné (2026-11-12).
- [x] **Lot G — Vocabulaire** : explication en une ligne pour Plateforme, Axe, Coupe, Étirer, Calibrer ;
      message clair quand un export est bloqué (D55) (2026-11-12).
- [ ] **Lot H — Test avec une vraie personne** : 3 tâches en 5 minutes, corrections qui en sortent.

- [x] **Lot I — Tablette** : déplacer la vue à deux doigts, zoom par pincement, boutons assez grands ; les
      outils actuels doivent rester utilisables au doigt (2026-11-12). Essai sur une vraie tablette
      **abandonné** le 2026-11-27 (choix de l'utilisateur : la tablette est peu utilisée).
- [x] **Lot J — Signaux en haut à droite** (demande du 2026-11-12, choix 1) : pastilles ou bandeau
      permanent en haut à droite qui signale tout de suite les erreurs et avertissements du plan (pièce qui
      ne remplit pas l'espace, export bloqué, etc.), avec le nombre et un clic qui mène à l'élément concerné.
      L'avis actuel (haut au centre, disparaît seul) reste pour les confirmations. Fait le 2026-11-12.

Ordre confirmé : A (barre d'outils), puis C (plan vide), puis les autres lots un par un.

---

## M11 quinquies — Couper un mur ici, surface habitable

Demande de l'utilisateur du 2026-11-13 (deux points de la liste « Idées »). Plan validé par
l'utilisateur le 2026-11-13 ; **codé le 2026-11-13, à tester dans le navigateur**.

- [x] **Lot A — Outil « Couper un mur ici »** (famille Construction) : survol d'un mur = repère de
      coupe avec la distance depuis le sommet ; clic = le mur est coupé en deux à cet endroit
      (distance arrondie à 10 mm), en un seul pas d'historique, annulable. Les portes, fenêtres et
      baies suivent leur morceau. **Refusé** (avec un message) à moins d'une épaisseur de mur d'un
      sommet et au milieu d'une ouverture. Fonctions pures `cutWall` / `cutWallInDocument` testées.
- [x] **Lot B — Surface habitable dans les métrés Client** : surface nette moins la partie sous
      **1800 mm** de hauteur sous toiture (dessous du versant = dessus moins l'épaisseur de dalle,
      comme en 3D). La colonne « Surface habitable » n'apparaît que si elle diffère de la surface au
      sol (« Vos pièces », « Récapitulatif », PDF, Excel, CSV). Hauteur fixe (pas de réglage par
      projet). Fonction pure `habitableArea` testée.

**Critères d'acceptation**
- Un mur de 4000 mm coupé à 1500 mm donne deux murs de 1500 et 2500 mm, annulable d'un seul Ctrl+Z
- Sous un toit à deux pans à 45° sur des murs de 1000 mm, une pièce de 8000 × 6000 mm a 48,00 m² au
  sol et 32,00 m² habitables
- Sans toiture en pente, la colonne « Surface habitable » n'apparaît pas

---

## M12 — Mise en ligne

Objectif : l'application est accessible publiquement (en mode local, sans compte).

- [x] Créer le dépôt GitHub et pousser le code (dépôt IthielGit/Fabrics, 2026-11-12)
- [x] Ajouter `public/_redirects` (`/* /index.html 200`) (2026-11-12)
- [x] Connecter le dépôt à Cloudflare Pages (build `npm run build`, sortie `dist`) (2026-11-12, https://fabrics-8zd.pages.dev)
- [x] Vérifier la version en ligne : création, sauvegarde, export (validé par l'utilisateur le 2026-11-12)
- [x] README : présentation, commandes, lien de la version en ligne

**Critères d'acceptation**
- L'URL `*.pages.dev` fonctionne, y compris en rechargeant directement une page `/p/…`
- Chaque `git push` sur `main` redéploie automatiquement

---

## M13 — Comptes, sauvegarde cloud et partage (terminé et validé le 2026-11-12)

Objectif : retrouver ses projets sur un autre appareil.

- [x] Guider la création du projet Supabase et l'exécution de `supabase/schema.sql` (2026-11-12, table vérifiée)
- [x] `src/lib/supabase.ts` + `.env.local` ; variables ajoutées dans Cloudflare Pages (2026-11-12, client et `.env.local` en place ; variables Cloudflare non vérifiées ici)
- [x] Page Connexion : inscription e-mail + mot de passe (avec vérification e-mail),
      connexion, mot de passe oublié, déconnexion (2026-11-12, à tester dans le navigateur)
- [x] Connexion Google (optionnelle) : bouton « Continuer avec Google » sur la page Connexion, fournisseur activé dans Supabase par l'utilisateur (vérifié le 2026-11-12 : la redirection part bien vers Google)
- [x] `SupabaseRepository` (table `projects`, bucket `assets`, URLs signées) (2026-11-12, à tester dans le navigateur)
- [x] Choix automatique du dépôt : local si déconnecté, Supabase si connecté (2026-11-12, à tester dans le navigateur)
- [x] À la première connexion : proposer d'importer les projets locaux (2026-11-12, à tester dans le navigateur)
- [x] Gestion hors ligne simple : en cas d'échec réseau, garder une copie locale et réessayer (2026-11-12, à tester dans le navigateur)
- [x] Partage par lien en lecture seule (plan, 3D, planche) ; désactivable à tout moment ;
      option mot de passe et date d'expiration (2026-11-12, validé ; plans seulement, images non visibles)
- [x] Table et règles de sécurité Supabase du partage (RLS), testées avec deux comptes (2026-11-12, `npm run check:security` ; validé par l'utilisateur, sortie non relue par Claude)

**Critères d'acceptation**
- Un projet créé sur l'ordinateur apparaît sur le téléphone avec le même compte
- Un second compte ne voit **aucun** projet ni image du premier (tester avec deux comptes)
- Sans variables Supabase, l'application fonctionne toujours en mode local
- Un lien de partage désactivé ne montre plus rien, même rechargé ; la personne qui reçoit
  le lien ne peut rien modifier

**Ajout hors jalon (2026-11-13, demande de l'utilisateur)** : connexion obligatoire et page d'introduction
(`/bienvenue`). Sans session, « / » et l'éditeur renvoient vers l'introduction ; restent publics l'introduction,
la connexion, le nouveau mot de passe et les liens de partage `/s/…` ; sans Supabase (mode local), tout reste
accessible. Contredit l'ancien parcours « sans compte d'abord » : `docs/01-PRODUIT.md` (section « Accès ») est
mis à jour. À tester dans le navigateur.

**✅ Fin du MVP**

---

## M14 — Collaboration temps réel

Décisions du 2026-11-12 (voir `docs/02-ARCHITECTURE.md`, « Collaboration temps réel (M14) ») : Cloudflare
Workers + Durable Objects, invitation par lien, annuler / rétablir limité à ses propres modifications.
Lots à valider un par un.

- [x] **Lot A — Hébergement du serveur Yjs** : choix et documentation (2026-11-12, D68)
- [x] **Lot B — Partage avec un autre compte** (lecture ou édition) : `project_members`, `project_invites`,
      règles RLS, lien d'invitation `/i/<jeton>`, rubrique « Partagés avec moi », fonction `my_project_role`
      (2026-11-13, validé par l'utilisateur après essai à deux comptes)
- [x] **Lot C — Serveur temps réel** : Worker + Durable Object (`collab-server/`), authentification par jeton
      Supabase, refus des écritures d'un lecteur, déploiement (2026-11-15, en ligne sur
      `fabrics-collab.harinosy-tradeco.workers.dev`)
- [x] **Lot D — Liaison Yjs et éditeur** : `elements` en `Y.Array` / `Y.Map`, synchronisation avec
      `editorStore`, annuler / rétablir local (`Y.UndoManager`) (2026-11-15, validé par l'utilisateur)
- [x] **Lot E — Présence** : curseurs et sélections des autres participants (awareness), avatars en en-tête
      (2026-11-15, validé par l'utilisateur ; nom et photo du compte)
- [x] **Lot F — Persistance dans Supabase** et reprise après coupure, essais à deux navigateurs
      (2026-11-15, validé par l'utilisateur après les essais à deux navigateurs)

---

## M15 — Historique de versions

Décisions du 2026-11-15 (D71 à D73, voir `docs/PROGRESS.md` et `docs/02-ARCHITECTURE.md`, « Historique de
versions (M15) ») : fonctionnement d'un historique de tableur en ligne (sessions de travail regroupées,
auteurs, versions nommées), avec une interface propre à Fabrics ; historique visible par tous les membres,
restauration réservée aux éditeurs et au propriétaire. Lots à valider un par un.

- [x] **Lot A — Base de données** (2026-11-15, exécuté dans Supabase et validé par l'utilisateur) : table
      `project_versions` (RLS : membres du projet), déclencheur qui prolonge l'étape en cours (2 min) ou en
      ouvre une nouvelle (session : pause de 5 min ou 30 min de travail continu), auteurs, fonctions
      `create_named_version`, `rename_version`, `project_people`, nettoyage (D72)
      - Critère : modifier un plan pendant 2 min, attendre 5 min, le modifier encore → 2 versions dans la
        table, avec le bon auteur ; un lecteur les lit, un inconnu non
- [x] **Lot B — Panneau « Historique »** (2026-11-15, validé par l'utilisateur) : liste par jour, sessions repliables (versions détaillées en dessous), auteurs avec leur
      couleur, filtre « Versions nommées seulement », créer, nommer et renommer une version
      - Critère : le panneau liste les versions du lot A, en direct quand une nouvelle version apparaît
- [x] **Lot C — Aperçu et changements** (2026-11-15, validé par l'utilisateur) : cliquer une version l'affiche en lecture seule (bandeau
      « Restaurer · Faire une copie · Fermer »), éléments ajoutés, modifiés et supprimés mis en évidence
      depuis la version précédente, métrés de la version dans le panneau ; historique et aperçu aussi sur la
      page en lecture seule d'un membre lecteur (D73)
      - Critère : on ne peut rien modifier pendant l'aperçu ; un mur ajouté depuis la version précédente
        est mis en évidence
- [x] **Lot D — Restaurer et faire une copie** (2026-11-15, validé par l'utilisateur) : restauration (éditeurs, propriétaire) précédée d'une
      version nommée « Avant restauration », appliquée comme une modification (annulable, partagée en
      direct) ; « Faire une copie » crée un nouveau projet à partir de la version ; essais à deux navigateurs
      - Critère : A restaure, B voit le plan restauré en direct ; Ctrl+Z chez A annule la restauration

---

## M15 bis — Réorganisation de l'éditeur (terminé et validé le 2026-11-15)

Décision du 2026-11-15 : l'utilisateur a choisi, parmi trois maquettes, une synthèse (en-tête avec
« Exporter » en principal, rail d'outils à gauche, barre « Niveau · Cotation », barre d'état en bas à
gauche, métrés en direct, onglets du panneau en rail d'icônes). Hors roadmap initiale, placé avant M16.
Lots à valider un par un.

- [x] **Lot A — En-tête et barre « Niveau · Cotation »** (2026-11-15, validé par l'utilisateur) :
      annuler / rétablir avant 3D et Vues, « Exporter » en bouton principal ; niveau et cotation dans une
      seule carte, le niveau devient un menu déroulant (niveau le plus haut en premier)
      - Critère : la barre affiche « Niveau Rez-de-chaussée ▾ | Cotation Aucune ▾ » ; changer de niveau
        par le menu ; les interrupteurs de transparence restent là s'il y a plusieurs niveaux
- [x] **Lot B — Rail d'outils à gauche** (2026-11-15, validé par l'utilisateur) : outils en colonne
      étroite (icône + libellé court), petit coin pour les sous-outils, aide en bas du rail
      - Critère : le rail est collé au bord gauche, le plan commence à sa droite ; le petit coin ouvre la
        liste de la famille ; le bouton « ? » en bas ouvre les raccourcis
- [x] **Lot C — Barre d'état** (2026-11-15, validé par l'utilisateur) : zoom, plein écran, échelle
      d'impression, nord (la boussole s'ouvre au clic) et mini-carte réunis en bas à gauche ; la grande
      boussole disparaît
      - Critère : − et + zooment autour du centre de l'écran ; « N 0° » ouvre la boussole au-dessus de la
        barre, qui se ferme au clic ailleurs ou avec Échap ; tourner la boussole fait tourner la flèche
- [x] **Lot D — Métrés en direct et onglets en rail** (2026-11-15, validé par l'utilisateur) : pièces,
      surface, murs en bas à droite (plans seulement), mini-carte posée au-dessus sans chevauchement ;
      onglets du panneau en colonne d'icônes avec infobulle
      - Critère : dessiner une pièce de 6000 × 2000 mm affiche « Surface 12,00 m² » sans ouvrir l'onglet ;
        « Métrés › » ouvre l'onglet ; plan étroit : la barre passe à gauche, rien ne se chevauche

---

### Hors jalon — Modifier plusieurs éléments à la fois (demande du 2026-11-16, validé le 2026-11-16)

Demande de l'utilisateur : avec plusieurs pièces sélectionnées, changer leur couleur (ou un autre
réglage) en une fois. Le panneau Propriétés affiche chaque réglage que **tous** les éléments
sélectionnés possèdent ; une valeur qui diffère laisse le champ vide (« Différentes », case à tiret).
Le nom n'est jamais modifié en groupe.

- [x] Couleur (remplissage, contour) dès que tous les éléments l'ont, même de types différents
- [x] Pièces : afficher le nom et la surface, faux plafond
- [x] Murs : épaisseur (mm), hauteur (mm), matériau
- [x] Cotes : décalage (mm), version visible (client / exécution)
- [x] Un seul pas d'historique : Ctrl+Z annule le changement sur tous les éléments

## M16 — Commentaires ancrés (sans notifications)

Décision du 2026-11-15 (D74) : tous les membres, lecteurs compris, peuvent commenter. Pas de mentions ni de
notifications dans ce jalon. Lots à valider un par un, après M15.

- [x] **Lot A — Base de données** (2026-11-15, exécuté dans Supabase et validé par l'utilisateur) : table `project_comments` (projet, auteur, niveau, élément ou point,
      texte simple ≤ 2000 caractères, commentaire parent pour les réponses, résolu par / le), RLS (lire et
      écrire : membres ; modifier ou supprimer : l'auteur ; supprimer : aussi le propriétaire ; résoudre :
      tout membre), diffusion Supabase Realtime activée sur la table
- [x] **Lot B — Poser un commentaire** (2026-11-15, validé par l'utilisateur) : outil « Commenter », ancrage sur un élément (suit l'élément) ou sur
      un point, épingles par niveau dans une couche absente des exports et de la miniature ; « élément
      supprimé » quand l'ancre disparaît
- [x] **Lot C — Fils et panneau** (2026-11-15, validé par l'utilisateur) : onglet « Commentaires » (ouverts / résolus / tous, nombre d'ouverts),
      fil avec réponses, résoudre, rouvrir, modifier, supprimer
- [x] **Lot D — Lecteurs** (2026-11-15, validé par l'utilisateur) : la page en lecture seule d'un membre lecteur affiche les épingles et permet de
      commenter et de répondre (le lien public de partage n'affiche jamais les commentaires)
- [x] **Lot E — En direct** (2026-11-15, validé par l'utilisateur) : nouveaux commentaires, réponses et résolutions visibles chez les autres sans
      recharger (Supabase Realtime, déjà inclus dans `@supabase/supabase-js`), reprise après coupure,
      essais à deux navigateurs

---

## Phase « Fabrics + Pascal » (M17 → M25)

Décidée le 2026-11-17 (D75 à D80, voir `docs/PROGRESS.md`). Ce fichier reste le **seul roadmap
officiel** : la roadmap Pascal / IfcOpenShell téléchargée par l'utilisateur est intégrée ici et n'a
plus de valeur de référence.

**Principe : Fabrics + Pascal Editor + amélioration.**

- **Fabrics garde ses fonctions** : métrés Client / Exécution, Supabase (comptes, partage),
  collaboration, historique, commentaires, projets Visuel, déploiement Vite / Cloudflare.
- **L'interface et la prise en main viennent de Pascal** (D80) : accueil, éditeur, réglages, import,
  connexion, aide ; les fonctions de Fabrics y sont reconstruites. On reste sur Vite (pas de Next.js).
- **On prend tout ce qu'on peut de Pascal Editor** (MIT, clone local
  `C:\Users\My PC\Documents\Projects\BIM Project`, commit `7f30521`) : applications, paquets,
  scripts, configurations, conventions, moteur 3D (Three.js / WebGPU), modèle de scène BIM, objets
  et opérations, import / export, MCP, composants d'interface.
- **On ajoute ou améliore**, selon les lacunes constatées : documents professionnels, métrés
  calculés sur le modèle Pascal et contrôlés avec IfcOpenShell, DQE, IA intégrée (le service IA
  hébergé de Pascal n'est **pas** dans le dépôt public : l'orchestration manquante est à écrire),
  améliorations BIM ciblées.
- **Objectif** : des livrables architecturaux de qualité comparable à Revit sur le périmètre défini
  (`docs/01-PRODUIT.md`), sans prétendre à la parité Revit.

**Source de vérité unique (D79).** La scène Pascal est le seul modèle des projets Plan. Elle est
stockée en mètres et **toujours affichée en mm, m², m³**. Vues 2D, 3D, nomenclatures, métrés, IFC et
DQE en dérivent. Les projets Visuel gardent `FabricsDocument`.

**Règle de décision : RÉUTILISER → ÉTENDRE → REMPLACER (exceptionnel).** Chaque capacité a une
ligne dans `docs/capabilities.md` :
`Capacité | Emplacement dans Fabrics | Emplacement dans Pascal | EXISTANT / PARTIEL / ABSENT | Preuve (fichier / test / UI) | Réutiliser / Étendre / Remplacer | Justification | Tests de non-régression`.
- EXISTANT et fonctionnel : réutiliser tel quel, renforcer les tests si besoin.
- PARTIEL : étendre le composant existant, sans duplication.
- ABSENT : ajouter un module intégré aux modèles, états et commandes de Pascal.
- REMPLACER : seulement après étude de plusieurs options, ADR argumentée et accord de l'utilisateur.

**Règle de compatibilité.** Chaque jalon vérifie que les scénarios préexistants de **Fabrics et de
Pascal** fonctionnent toujours. Si une capacité disparaît, le gate est **FAIL** jusqu'à correction
ou accord documenté.

### Mécanisme anti-duplication (chaque jalon)

1. **Registre unique** `docs/capabilities.md` : une capacité = un seul module propriétaire. Claude le
   consulte avant de coder ; une capacité nouvelle y est inscrite avant d'être codée.
2. **Doublon Fabrics / Pascal = une décision** : on garde une seule version (en général celle qui
   travaille sur la scène Pascal), étendue avec le meilleur de l'autre ; l'autre est retirée dans le
   même jalon. Jamais deux implémentations actives. Doublons déjà repérés, à trancher en M17 :
   `jspdf` / `pdfkit`, oxlint / Biome, `crypto.randomUUID()` / `nanoid`, export IFC de Fabrics /
   `ifc-converter`, vue 3D de Fabrics / `viewer` de Pascal, `src/i18n/fr.ts` / Lingui, composants
   d'interface de Fabrics / de Pascal (D80).
3. **Garde des imports** : un test d'architecture (comme `core/src/architecture.test.ts` de Pascal)
   et des règles d'import du lint interdisent d'utiliser un module retiré.
4. **Détection de copier-coller** (`jscpd`, à faire approuver) dans `npm run check:all`.

### Mécanisme anti-régression (chaque jalon)

1. **Baseline figée en M17**, avant tout changement : résultats des tests Fabrics et Pascal,
   **métrés de référence** (JSON) du plan d'exemple et des fixtures, **dessins de référence** (SVG :
   façades, coupes, plans cotés Client et Exécution), exports de référence (CSV, XLSX, IFC).
2. **`docs/regression-checklist.md`** : chaque critère d'acceptation de M0 à M16 et chaque fonction
   native de Pascal, avec sa façon de le vérifier (test automatique ou geste dans le navigateur).
3. **`npm run check:all`** : build, lint, Vitest, `test:pascal`, `lint:pascal`, comparaison aux
   références, test d'architecture, détection de doublons. Lancé aussi par GitHub Actions à chaque push.
4. **Règle du gate** : un écart avec la référence = **FAIL**, sauf s'il est voulu et documenté
   (raison dans `docs/PROGRESS.md`, référence mise à jour dans un commit séparé, accord de
   l'utilisateur). La baseline ne fait que grandir : on améliore, on ne recule pas.

### Fonctionnalités finales (définition de terminé de la phase)

En plus de tout ce que Fabrics a déjà :

| Module | Fonctionnalités finales | Jalon |
|---|---|---|
| Éditeur 2D | Dessiner et modifier murs, portes, fenêtres, pièces, niveaux ; accrochages, alignements, saisie précise des dimensions | M19 |
| Maquette 3D BIM | Modéliser murs, dalles, toitures, escaliers, ouvertures ; modifier dimensions, matériaux, propriétés | M19 |
| Synchronisation 2D/3D | Une modification du bâtiment se répercute en 2D, en 3D et dans les quantités | M18, M19 |
| Terrain et implantation | Modéliser le terrain, positionner le bâtiment, gérer les altitudes des niveaux | M19 |
| Matériaux et compositions | Matériaux et couches des ouvrages : maçonnerie, isolation, enduit, revêtement… | M19 |
| Plans professionnels | Plans d'étage, coupes, façades, avec cotes, annotations, repères, nomenclatures | M20 |
| Mise en page | Feuilles avec cartouche, échelle, légende, numérotation, indice de révision ; PDF | M20 |
| Quantitatif automatique | Longueurs, surfaces, volumes, nombres ; brut et net, ouvertures déduites | M21 |
| Traçabilité des métrés | Éléments à l'origine de chaque quantité, règle de calcul, données manquantes | M21 |
| Bibliothèque de prix | Postes de travaux, unités, prix des matériaux, main-d'œuvre, compositions de prix | M23 |
| DQE | Quantités associées aux postes, montants, regroupement par lot, paramètres de chiffrage | M23 |
| Actualisation du devis | Recalcul des quantités et montants après modification ; comparaison des versions du devis | M23 |
| Échanges IFC | Import et export des éléments pris en charge, identifiants et propriétés conservés, contrôle IfcOpenShell | M22 |
| Exports | Plans PDF, quantitatifs et DQE Excel / PDF, IFC, modèles 3D | M20 à M23 |
| Assistant IA | Créer ou modifier par instruction, interroger le modèle, expliquer les métrés, proposer des postes de prix | M25 |
| Gestion des projets | Créer, ouvrir, sauvegarder, dupliquer ; annuler / rétablir ; versions | existe, étendu en M18 |
| Contrôles qualité | Géométrie incohérente, propriétés manquantes, unités incompatibles, postes sans prix | M21, M23, M24 |

### Jeux de tests de référence (fixés dans `fixtures/` avant le code)

- **HOUSE-01** : emprise 8000 × 10000 mm, 1 niveau, hauteur 3000 mm ; murs d'enveloppe, 3 cloisons,
  1 dalle, 1 porte extérieure, 4 fenêtres, 4 pièces. Valeurs exactes dans `fixtures/HOUSE-01/spec.json`,
  avec un calcul à la main indépendant (périmètres, surfaces, volumes, total DQE).
- **HOUSE-02** : 2 niveaux, escalier, toiture simple, ouverture traversante ; coupes, façades,
  feuilles numérotées, métrés par étage et par lot.
- **EDGE-01** : fenêtre hors mur, ouvertures qui se chevauchent, mur de hauteur 0, mm mêlés à des m,
  matériau manquant, identifiant en double, IFC à placements imbriqués. Attendu : erreur claire ou
  exclusion signalée, **jamais** un résultat faux en silence.

| Domaine | Vérification automatique | Vérification humaine |
|---|---|---|
| Modèle | schémas, identifiants, annuler, versions | lisibilité, prise en main |
| Géométrie | dimensions, intersections, ouvertures | revue des détails |
| 2D / 3D | projections, régression SVG / images | dessin architectural |
| Documents | cotes, échelle, cartouche, révisions | qualité des feuilles |
| Quantités | calcul à la main, traçabilité | validation d'un métreur |
| DQE | multiplications, totaux, prix manquants | prix et règles locales |
| IFC | schéma, IDS, aller-retour | ouverture dans des logiciels tiers |
| IA | droits, aperçu, annulation | pertinence des modifications |

**GO / NO-GO** : l'échec d'un test critique de calcul, d'identité ou de cohérence des documents
bloque la publication. Un contrôle visuel ne remplace pas la vérification des dimensions.

### Déroulé de chaque jalon (M17 à M25)

1. Lire `CLAUDE.md`, ce roadmap, `docs/PROGRESS.md`, `docs/capabilities.md` et, pour le code de
   Pascal, ses `AGENTS.md`, `DECISIONS.md`, `CONTRIBUTING.md`.
2. Écrire `docs/phases/M<n>-plan.md` (existant, modifications, points à confirmer, tests, risques,
   définition de terminé) et attendre le feu vert.
   Chaque jalon est découpé en sous-lots, chacun avec la commande `/model` à taper avant de le
   commencer (`/model opus` : architecture, géométrie, calculs, sécurité ; `/model sonnet` : interface,
   imports, exports, tests de routine). Claude ne change pas de modèle lui-même : il rappelle la commande.
3. Coder par petits lots testés ; `npm run check:all` après chaque lot. Demander l'accord avant toute
   migration destructive ou service payant.
4. Écrire `docs/phases/M<n>-report.md` (fichiers, tests, preuves, limites, suite) ; mettre à jour la
   traçabilité exigence → fonction → test → preuve.
5. S'arrêter au gate : **PASS** ou **FAIL**, avec les écarts restants. Une réussite partielle n'est
   pas une livraison.

Pour commencer : écrire « Commence le jalon M17 » dans Claude Code. Pour une revue indépendante :
« Agis comme auditeur BIM / QA indépendant, vérifie le jalon M<n> contre ce roadmap, sans modifier le
code ; liste les écarts Bloquant / Majeur / Mineur et décide GO / NO-GO. »

---

## M17 — Audit et intégration de Pascal (gate G0)

**Terminé le 2026-11-18, gate G0 validé PASS par l'utilisateur** (rapport : `docs/phases/M17-report.md`).

Prérequis : Git, Node.js, **Bun**, Python 3.11+ (pour IfcOpenShell), Docker facultatif ; WSL2 seulement
si un script de Pascal l'exige ; navigateur compatible WebGPU, avec repli WebGL2. Travail sur une
branche dédiée.

- [x] Vérifier les outils (`node -v`, `npm -v`, `git --version`, `bun --version`, `python --version`) ;
      guider les installations manquantes (2026-11-17 : Node 26.13.1, Bun 1.4.4 installés)
- [x] Lancer Pascal tel quel dans son dossier (`bun install`, `bun run test`, `bun run build`) ; noter
      commit, versions et résultats (`docs/phases/M17-pascal-baseline.md`)
- [x] Figer la baseline Fabrics : tests, métrés de référence du plan d'exemple, dessins SVG, exports
      CSV / XLSX / IFC (`baseline/fabrics/`, `src/baseline/`)
- [x] Remplir `docs/capabilities.md` (matrice complète : UI, vues 2D / 3D, moteur, objets, édition,
      annuler, stockage, IFC, API, MCP, IA, quantités, exports) et `docs/regression-checklist.md`
- [x] **Carte des écrans** (D80) : pour chaque écran et geste de Fabrics (accueil, éditeur, panneaux,
      barre d'outils, barre d'état, aide, partage, versions, commentaires…), l'écran Pascal qui le
      remplace ou le panneau à reconstruire dedans ; aucune fonction de Fabrics sans destination
      (`docs/screen-map.md`)
- [x] `docs/adr/0001-source-of-truth.md` (scène Pascal, D79) ; `docs/adr/0002-monorepo.md` (workspaces
      npm, tests Pascal sous bun, lint) ; trancher les doublons repérés (ADR 0003, Lingui retenu)
- [x] Copier tous les paquets et apps de Pascal dans `packages/pascal/` et `apps/` ; ressources de
      `apps/editor/public` dans `public/pascal/` ; workspaces npm ; `patch-package` pour les correctifs ;
      alias Vite pour `next/image` ; catalogue Lingui en français. **Fait autrement (ADR 0002)** : dépôt
      copié tel quel dans `packages/pascal/` (apps et ressources comprises), installé par Bun (`bun.lock`
      gelé, correctifs appliqués par Bun) car npm changeait les résultats ; catalogue `fr` présent mais
      non traduit (M19)
- [x] Scripts `test:pascal`, `lint:pascal`, `check:all` ; GitHub Actions (+ `install:pascal`,
      `check:duplicates` avec jscpd)
- [x] Tester IfcOpenShell (environnement Python isolé) sur un IFC de référence ; noter version et API
      (0.9.0.post1, `tools/ifc/validate.py`)
- [x] `THIRD_PARTY_NOTICES.md` (Pascal MIT, polices OFL, médias CC BY 4.0, IfcOpenShell LGPL) ; fichiers
      IFC d'exemple de Pascal pour les tests locaux seulement
- [x] `docs/risks.md` (risques et parades, voir la fin de cette phase)

**Critères d'acceptation (G0)**
- `npm install`, `npm run build`, `npm run lint`, `npm test` et `npm run test:pascal` passent ; les
  résultats de Pascal sont identiques à ceux obtenus dans son propre dossier
- L'application en ligne reste identique pour l'utilisateur ; aucun nouvel éditeur ni moteur créé
- Chaque capacité de la matrice a un état, une preuve et une action ; aucune API inventée

## M18 — Modèle BIM unifié (gate G1)

Plan validé le 2026-11-18 (`docs/phases/M18-plan.md`, lots A à F ; décisions 1 A, 2 A, 3 B, 4 A, 5 A).
**Lot A (branchement technique) fait le 2026-11-18** : `@pascal-app/core` lu par `src/features/scene/`
(alias Vite, `paths` TypeScript, `npm run build:pascal`), ADR 0004 et 0005, test d'architecture.
**Lot B (conversion plan ↔ scène) fait le 2026-11-18** : `src/features/scene/` (migration pure, vue
calculée, nœuds Fabrics, chargement par Pascal) ; modèle de pièces de Pascal (ADR 0006) ; baseline M17,
HOUSE-01, HOUSE-02 et EDGE-01 vérifiés par la scène.
**Lot C (la scène devient le document de l'éditeur) fait le 2026-11-18** : `SceneBinding` (scène dans un
`Y.Doc`, local quand on travaille seul), un seul historique `Y.UndoManager` pour les plans, événement
« modèle changé », pièces qui suivent leurs murs.
**Lot D (enregistrement, versions, duplication) fait le 2026-11-18** : un plan est enregistré par sa
scène (format `pascal-scene`, version 5), localement et dans Supabase ; script `npm run migrate:plans`
(essai à blanc, sauvegarde exigée, métrés comparés) prêt, **à lancer à la mise en ligne de M18**.
**Lot E (collaboration et commentaires) fait le 2026-11-18** : en collaboration, un plan partage sa scène
(`SceneBinding` sur la salle, seul historique) ; commentaires ancrés sur les nœuds (`wall_<id>__0` pour un
mur à plusieurs côtés), anciens commentaires gardés.
**Lot F (métrés et gate G1) fait le 2026-11-18** : métrés, cotes Client / Exécution et repères lus à travers la
scène (baseline M17 identique) ; EDGE-01 corrigé (fenêtre hors du mur non déduite, union des ouvertures
qui se chevauchent, avertissement « hauteur nulle ») ; rapport `docs/phases/M18-report.md`.

- [x] La scène Pascal (`@pascal-app/core`) devient le document des projets Plan, enregistré dans Supabase
      (lots C et D, 2026-11-18 ; conversion des plans de la base : à la mise en ligne de M18)
- [x] Migration testée des plans existants vers des nœuds Pascal : niveaux, murs, ouvertures, pièces,
      dalles, toitures, escaliers, cheminées, plateformes, axes, cotes, coupes, mobilier, fonds DXF
      (lot B, 2026-11-18 ; migration de la base elle-même : lot D)
- [x] Identifiants stables ; événement `ModelChanged` ; un seul historique annuler / rétablir
      (lot C, 2026-11-18 ; les projets Visuel gardent leur historique local, sans scène)
- [x] Collaboration Yjs, historique de versions et commentaires passés sur les nœuds Pascal
      (lots D et E, 2026-11-18)
- [x] Métrés, cotes Client / Exécution et repères `M01`, `P01`, `F01` branchés sur la scène Pascal
      (lot F, 2026-11-18 ; baseline M17 identique à travers la scène ; EDGE-01 corrigé)
- [x] Sauvegarde et restauration ; projets dupliqués (lot D, 2026-11-18)

**Critères d'acceptation (G1)**
- Un plan créé avant M18 se rouvre avec les mêmes métrés (comparaison à la baseline, au mm et au
  centième de m² près)
- Créer, modifier, supprimer puis annuler garde identifiants et dimensions ; aucun élément fantôme
- Deux navigateurs modifient le même plan en direct ; un commentaire reste attaché à son élément
- Changer de vue ne modifie pas le document ; les scénarios natifs de Pascal passent toujours

## M19 — Interface Pascal et édition 2D/3D professionnelle (gate G2) — **terminé, gate G2 validé PASS par l'utilisateur le 2026-11-21**

**Découpage en sous-lots validé par l'utilisateur le 2026-11-18.** Ordre : A1 → A7, puis B1 → B5 ;
test dans le navigateur par l'utilisateur après chaque sous-lot (indispensable après A2 et B1).
Avant chaque sous-lot, taper dans Claude Code la commande `/model` indiquée (Claude ne peut pas
changer de modèle lui-même : il la rappelle au début du sous-lot si le modèle actif ne correspond pas).

| Sous-lot | Contenu | Modèle |
|---|---|---|
| A1 Routes et accueil — **validé le 2026-11-18** | Accueil des projets, routes `react-router`, connexion Supabase, textes en Lingui | `/model sonnet` |
| A2 Éditeur et panneaux — **découpé le 2026-11-18** en A2a (ouvrir et enregistrer les vrais projets), A2b (Métrés), A2c (Commentaires), A2d (Historique et aperçu de version) — **validés le 2026-11-18** | Mise en page de l'éditeur Pascal, barre d'outils, panneaux ; panneaux Fabrics reconstruits (Métrés Client / Exécution, Commentaires, Historique et aperçu de version) | `/model opus` |
| A3 Collaboration et partage — **validé le 2026-11-18** | Présence et avatars, partage et invitations, Exporter, points à vérifier, cotation Aucune / Client / Exécution | `/model opus` |
| A4 Projets Visuel — **validé le 2026-11-18** | Éditeur Visuel habillé dans le style de Pascal, accessible depuis le même accueil | `/model sonnet` |
| A5 Rendu — **validé le 2026-11-18** | WebGPU (repli WebGL2), occlusion ambiante, bloom, anticrénelage, contours encrés, surlignage, lumière du jour, HDRI, animation de construction ; modules de Pascal (Mint essayé puis retiré à la demande de l'utilisateur) ; textes de Pascal en un seul fichier français | `/model opus` |
| A6 Navigation, sons et aide — **validé le 2026-11-18** | Perspective / orthographique, première personne, suivi de caméra, WebXR, niveaux empilés / éclatés / seuls, coupe 3D, sons (`howler`) avec réglage, accrochages visibles, palette de commandes, aide et parcours de découverte | `/model sonnet` |
| A7 Nettoyage — **validé le 2026-11-18** | Anciens composants Fabrics remplacés retirés, registre mis à jour, `docs/regression-checklist.md` passé en entier | `/model sonnet` |
| B1 Outils 2D — **fait le 2026-11-18**, test par l'utilisateur à la fin de B5 (son choix) | Outils, vue en plan et accrochages de Pascal, saisie précise en mm, alignements, fusion sans doublon | `/model opus` |
| B2 Édition 3D — **fait en partie le 2026-11-18** (voir la case du lot B), test à la fin de B5 | Murs, dalles, toitures, escaliers, ouvertures en 3D ; jonctions propres ; synchronisation 2D ↔ 3D sur le même objet | `/model opus` |
| B3 Matériaux — **fait le 2026-11-18**, test à la fin de B5 | Couches de mur, bibliothèque de matériaux, quantités par couche sans double comptage | `/model opus` |
| B4 Terrain — **fait le 2026-11-18**, test à la fin de B5 | Terrain, limite de propriété, implantation du bâtiment, altitudes des niveaux | `/model opus` |
| B5 Cas difficiles et preuves — **fait le 2026-11-18**, gate G2 proposé (rapport `docs/phases/M19-report.md`), test par l'utilisateur ; T1 / T2 vérifiés par l'utilisateur (`docs/phases/M19-fixtures-review.md`) | Jonctions, collisions, ouvertures, épaisseur nulle ou invalide ; exemples T1 / T2 ; tests 2D → 3D et 3D → 2D ; rapport de précision ; gate G2 | `/model opus` |
| B6 Toitures, escaliers, dalles de Pascal — **fait et vérifié par l'utilisateur le 2026-11-20** | Toitures, escaliers et dalles natifs de Pascal dans les métrés ; toitures et escaliers des anciens plans convertis en nœuds Pascal (visibles et modifiables en 3D) | `/model opus` |
| B7 Textes de Pascal en français — **fait et vérifié par l'utilisateur le 2026-11-20** (noms par défaut et boîtes de suppression compris ; `apps/editor` non utilisé, non traduit) | Les ≈ 660 textes anglais écrits en dur dans le code de Pascal passés par sa traduction, en français (noms par défaut « Mur 1 »…) | `/model sonnet` |

### Lot A — Interface et prise en main de Pascal (D80)

- [x] Pages de `apps/editor` reprises dans l'app Vite : accueil des projets, éditeur, réglages,
      import, connexion (Supabase Auth), aide et prise en main ; routes `react-router` (`/`,
      `/p/:projectId`, `/s/…`, `/i/…`, `/bienvenue` conservées)
- [x] Fonctions de Fabrics reconstruites dans ce cadre, d'après la carte des écrans : panneau Métrés
      (Client / Exécution, en direct), Commentaires, Historique et aperçu de version, présence et
      avatars, partage et invitations, Exporter, points à vérifier, cotation Aucune / Client / Exécution
- [x] Projets Visuel : leur éditeur reste à part, habillé dans le style de Pascal, accessible depuis
      le même accueil
- [x] **Expérience Pascal conservée telle quelle** (D81), reprise sans simplification :
      - effets visuels : rendu WebGPU (repli WebGL2), occlusion ambiante, bloom, anticrénelage,
        contours encrés, surlignage de sélection, lumière du jour et atmosphère, environnement HDRI,
        animation de construction, transitions et animations d'interface (`motion`) ;
      - effets sonores (`howler`, sons de `public/pascal/audios`), avec un réglage pour les couper ;
      - navigation : perspective et orthographique, visite à la première personne, suivi de caméra,
        réalité virtuelle (WebXR), niveaux empilés / éclatés / seuls, coupe 3D ;
      - options de navigation et gestes : modes d'accrochage visibles (Maj pour changer, Alt pour
        ignorer), palette de commandes, raccourcis, sélection, un geste = une annulation ;
      - prise en main : aide et parcours de découverte de Pascal
- [x] Tous les textes en français (Lingui) ; unités affichées en mm, m², m³ (B7, vérifié le 2026-11-20 ;
      `apps/editor`, non utilisé par Fabrics, non traduit)
- [x] Anciens composants d'interface de Fabrics retirés une fois remplacés (registre mis à jour)

**Critères d'acceptation (lot A)**
- Chaque ligne de la carte des écrans est cochée : aucune fonction de Fabrics n'a disparu
  (`docs/regression-checklist.md` passe en entier)
- Un projet Plan et un projet Visuel existants s'ouvrent depuis le nouvel accueil
- Aucun texte en anglais visible ; aucune longueur affichée en m
- Chaque effet visuel et sonore, mode de navigation et option de la liste ci-dessus fonctionne comme
  dans Pascal lancé seul (comparaison côte à côte, notée dans `docs/regression-checklist.md`)

### Lot B — Édition 2D/3D professionnelle

- [x] Outils, vue en plan et viewer 3D de Pascal ; fusion outil par outil selon la matrice, sans
      doublon (B1, 2026-11-18 : onglet Construire de Pascal ; aucun outil de plan Fabrics dans l'éditeur)
- [x] Saisie précise des dimensions en mm, accrochages, alignements, modes d'accrochage visibles
      (B1, 2026-11-18 : Pascal réglé en mm, `src/pascal/millimetreUnits.ts`)
- [x] Édition directe en 3D : murs, dalles, toitures, escaliers, ouvertures ; jonctions de murs propres ;
      synchronisation 2D ↔ 3D par commandes sur le **même** objet
      (B2, 2026-11-18 : fait pour murs, ouvertures, pièces et niveaux, y compris ceux dessinés dans
      Pascal ; **reste** : toitures, escaliers et dalles natifs de Pascal dans les métrés, et toitures /
      escaliers des anciens plans affichés et modifiables dans la 3D de Pascal ; **fait en B6**, vérifié par
      l'utilisateur le 2026-11-20)
- [x] **Matériaux et compositions** : couches de mur (maçonnerie, isolation, enduit, revêtement),
      bibliothèque de matériaux et objets 3D de Pascal (B3, 2026-11-18 : quantités par couche dans
      les métrés Technique, `measurements/wallLayers.ts` ; couches des toitures et dalles : M21)
- [x] **Terrain et implantation** : terrain, limite de propriété, position du bâtiment, altitudes des niveaux
      (B4, 2026-11-18 : outils de Pascal ; parcelle, emprise, coefficient d'emprise, recul, altitudes
      dans les métrés Technique, `scene/siteMeasures.ts`)
- [x] Cas difficiles : jonctions, collisions, ouvertures, épaisseur nulle ou invalide
      (B5, 2026-11-18 : `scene/hardCases.test.ts`, avertissements « épaisseur invalide », « longueur nulle »)
- [x] Exemple T1 / T2 ; tests 2D → 3D et 3D → 2D ; rapport de précision
      (B5, 2026-11-18 : `fixtures/T1`, `fixtures/T2`, `scene/precision.test.ts`, `docs/phases/M19-report.md`)

**Critères d'acceptation (G2)**
- Allonger un mur de 4000 à 5000 mm en 3D l'affiche à 5000 mm sur le plan et dans les métrés
- Un mur de 200 mm composé de 20 + 160 + 20 mm donne ses quantités par couche, sans double comptage
- Aucune surface ni aucun volume incohérent après la pose ou la suppression d'une ouverture

## M20 — Plans professionnels et mise en page (gate G3)

À décider avec l'utilisateur avant de commencer : normes de représentation (usages retenus en M10
ter : Madagascar, héritage français), échelles, formats et livrables contractuels.

**Décisions 20.0 prises par l'utilisateur le 2026-11-21** (`docs/phases/M20-decisions.md`) : mm partout,
usages français, gabarit de feuille de Villa ROOMIT (A2 paysage par défaut), échelles 1:50 / 1:100 /
1:20 / 1:10 (1:200 disponible), plans de niveau d'abord (feuille RDC comme premier cas de comparaison),
façades en trait avec ombres en option, fondations / réseaux / fosse dessinés seulement, avec une fiche
« Données à fournir par l'ingénieur ».

**Découpage en sous-lots proposé le 2026-11-18, à confirmer au plan du jalon.** Ordre : 20.0 → 20.9 ; test par
l'utilisateur après chaque sous-lot. Taper la commande `/model` indiquée avant le sous-lot (Claude la
rappelle s'il tourne sur un autre modèle).

| Sous-lot | Contenu | Modèle |
|---|---|---|
| 20.0 Décisions — **fait le 2026-11-21** | Normes de représentation, échelles, formats et livrables contractuels proposés en options, choisis par l'utilisateur | `/model opus` |
| 20.1 Vues liées au modèle — découpé le 2026-11-21 en 20.1a plan de niveau RDC (**fait le 2026-11-22**, `docs/phases/M20-plan.md`), 20.1b toiture et R+1 (**fait le 2026-11-22** : exemple ROOMIT-R1, plan de niveau R+1, tableau des surfaces, plan de toiture, surfaces de toiture sur demande, lien au modèle, exactitude imprimée), 20.1c coupes et façades (**fait le 2026-11-22** : toitures de Pascal dans les façades et coupes, critère « 2500 mm = 50 mm » testé) | Plans de niveau, coupes, façades, détails ; planche et cotes Client / Exécution étendues au modèle Pascal | `/model opus` |
| 20.2 Annotations — **fait le 2026-11-22** (conflits d'annotations détectés et corrigés, axes, légende) | Cotes chaînées, repères portes et fenêtres, noms et surfaces de pièces, axes, symboles, légendes | `/model opus` |
| 20.3 Nomenclatures et plans dérivés — **fait le 2026-11-22** (menuiseries, pièces, plan de plafond ; plan de toiture en 20.1b) | Nomenclatures, plan de plafond, plan de toiture | `/model sonnet` |
| 20.4 Feuilles — **fait le 2026-11-22** (gabarit de la référence : colonne de droite, rose des vents, cartouche avec statut ; A4 à A1) | Formats A4 à A1, cartouche, échelle, unités, orientation, nord, indice, date, émetteur, statut | `/model sonnet` |
| 20.5 Styles graphiques — **fait le 2026-11-22** (épaisseurs ISO selon l'échelle, catégories et visibilité, masques sous les noms de pièces) | Épaisseurs de traits, éléments coupés et vus, hachures, calques, masques, visibilité | `/model sonnet` |
| 20.6 PDF et SVG à l'échelle — **fait le 2026-11-22** (Liberation Sans intégrée au PDF, export SVG à l'échelle en calques) | Sorties vectorielles exactes à 1:50, 1:100, 1:200 ; polices intégrées si la licence le permet | `/model opus` |
| 20.7 Révisions — **fait le 2026-11-22** (jeu de feuilles numéroté, gardé dans chaque version, comparé au précédent dans l'aperçu d'une version) | Jeu de feuilles figé par version (M15), numérotation, comparaison avec le jeu précédent | `/model opus` |
| 20.8 Étude `ifcopenshell.draw` — **fait le 2026-11-22** (outil de contrôle des IFC hors application ; moteur de feuilles inchangé, `docs/phases/M20-ifcopenshell-draw.md`) | Essai comme outil complémentaire, limites documentées | `/model sonnet` |
| 20.9 Vérification et gate G3 — **fait le 2026-11-23** sauf l'essai de l'utilisateur et la revue d'un professionnel (`docs/phases/M20-report.md`, `docs/phases/M20-review-checklist.md`) | Impression à 100 %, mise à jour des vues après modification d'un mur, liste de contrôle pour la revue d'un professionnel, rapport | `/model opus` |

- [x] Vues liées au modèle : plans de niveau, coupes, façades, détails ; façades, coupes, planche et
      cotes Client / Exécution de Fabrics étendues au modèle Pascal — fait (2026-11-22)
- [x] Annotations : cotes chaînées, repères portes et fenêtres, noms et surfaces de pièces, axes,
      symboles, légendes, **nomenclatures** ; plan de plafond, plan de toiture — fait (2026-11-22)
- [x] Feuilles A4, A3, A2, A1 : cartouche, échelle, unités, orientation, nord, indice, date, émetteur,
      statut — fait (2026-11-22)
- [x] Styles graphiques : épaisseurs de traits, éléments coupés et vus, hachures, calques, masques,
      visibilité — fait (2026-11-22)
- [x] PDF et SVG vectoriels à l'échelle, polices intégrées si la licence le permet — fait (2026-11-22)
- [x] Révisions : jeu de feuilles figé par version (M15), numérotation, comparaison avec le jeu précédent — fait (2026-11-22)
- [x] Étude de `ifcopenshell.draw` comme outil complémentaire (limites documentées) — fait le 2026-11-22

**Critères d'acceptation (G3)**
- Imprimées à 100 %, les cotes sont justes à 1:50, 1:100 et 1:200
- Une hauteur d'étage de 2500 mm mesure 50 mm sur une façade à 1:50
- Modifier un mur met à jour plans, coupes, façades et nomenclatures ; aucun conflit d'annotations critique
- Revue d'un professionnel du bâtiment réussie (liste de contrôle)

## M21 — Quantitatif automatique et traçabilité (gate G4)

À décider avant de commencer : conventions de métré, seuils de déduction des ouvertures.

**Découpage en sous-lots proposé le 2026-11-18, à confirmer au plan du jalon.** Ordre : 21.0 → 21.8 ; test par
l'utilisateur après chaque sous-lot. Taper la commande `/model` indiquée avant le sous-lot (Claude la
rappelle s'il tourne sur un autre modèle).

| Sous-lot | Contenu | Modèle |
|---|---|---|
| 21.0 Décisions — **fait le 2026-11-23** (`docs/phases/M21-decisions.md`, option recommandée partout) | Conventions de métré et seuils de déduction des ouvertures, en options, choisis par l'utilisateur | `/model opus` |
| 21.1 Deux familles de quantités — **fait le 2026-11-23** (`measurements/quantities/`) | Quantités géométriques et quantités de métré distinguées dans le modèle de données | `/model opus` |
| 21.2 Règles versionnées — **fait le 2026-11-23** (`quantities/rules.ts`) | Par catégorie et composition : longueurs, surfaces brutes et nettes, volumes, nombres, revêtements, déductions (union des ouvertures) | `/model opus` |
| 21.3 Traçabilité — **fait le 2026-11-23** (`quantities/trace.ts`, tableau « Quantitatif ») | Quantité → éléments sources → dimensions → formule → déductions → règle et version | `/model opus` |
| 21.4 Statut des quantités — **fait le 2026-11-23** (`quantities/status.ts`) | Validé, provisoire, non pris en charge, données manquantes ; un quantitatif incomplet n'est jamais présenté comme fiable | `/model sonnet` |
| 21.5 Recalcul ciblé — **fait le 2026-11-24** (`quantities/incremental.ts`) | Seules les quantités touchées par un élément modifié sont recalculées | `/model opus` |
| 21.6 Comparaison IFC — **fait le 2026-11-24** (`docs/phases/M21-ifc-comparison.md`) | Quantités comparées avec IfcOpenShell sur un jeu d'échange | `/model sonnet` |
| 21.7 Contrôles qualité — **fait le 2026-11-24** (`measurements/qualityChecks.ts`) | Géométrie incohérente, propriétés manquantes, unités incompatibles | `/model sonnet` |
| 21.8 Vérification et gate G4 — **fait le 2026-11-24** sauf l'essai de l'utilisateur et la revue d'un métreur (`docs/phases/M21-report.md`) | Toutes les fixtures (HOUSE-01, HOUSE-02, EDGE-01), tolérances, sources visibles dans les exports, rapport | `/model opus` |

- [x] Quantités géométriques et quantités de métré distinguées — fait (2026-11-23)
- [x] Règles versionnées par catégorie et composition : longueur, surface brute et nette, volume brut
      et net, nombre, pièces, revêtements, déductions ; volume d'ouvrage et surface de pose
- [x] Traçabilité : quantité → éléments sources → dimensions → formule → déductions → règle et version
- [x] Statut de chaque quantité : validé, provisoire, non pris en charge, données manquantes ; un
      quantitatif incomplet n'est jamais présenté comme fiable
- [x] Recalcul ciblé après la modification d'un élément
- [x] Comparaison avec les quantités IFC (IfcOpenShell) sur un jeu d'échange
- [x] Contrôles qualité : géométrie incohérente, propriétés manquantes, unités incompatibles

**Critères d'acceptation (G4)**
- Mur 5000 × 3000 × 200 mm avec une ouverture 900 × 2100 mm : brut 15,00 m², ouverture 1,89 m², net
  13,11 m², volume net 2,622 m³
- Deux ouvertures qui se chevauchent : déduction de leur **union**, pas de la somme
- Ouverture qui dépasse du mur, toujours signalée et jamais « validée » : **en hauteur**, seule la
  partie dans le mur est déduite ; **en longueur**, l'ouverture est rejetée et rien n'est déduit
  (décision 1 d'EDGE-01 ; texte précisé le 2026-11-24, option A choisie par l'utilisateur)
- Écart de ±1 mm au plus sur les longueurs et de moins de 0,1 % sur les quantités simples (tolérances
  à confirmer par un métreur)
- 100 % des fixtures passent ; chaque quantité exportée montre ses sources et sa règle

## M22 — Échanges IFC (gate G5) — **terminé, gate G5 validé par l'utilisateur le 2026-11-24**

À décider avant de commencer : IFC4 ou IFC4x3, classification, échange avec Revit.

**Découpage en sous-lots proposé le 2026-11-18, à confirmer au plan du jalon.** Ordre : 22.0 → 22.5 ; test par
l'utilisateur après chaque sous-lot. Taper la commande `/model` indiquée avant le sous-lot (Claude la
rappelle s'il tourne sur un autre modèle).

| Sous-lot | Contenu | Modèle |
|---|---|---|
| 22.0 Décisions — **fait le 2026-11-24** (`docs/phases/M22-decisions.md`, option recommandée partout) | IFC4 ou IFC4x3, classification, échange avec Revit, en options, choisis par l'utilisateur | `/model opus` |
| 22.1 Classes et correspondances — **fait le 2026-11-24** (`docs/phases/M22-classes.md`) | Projet, site, bâtiment, niveau, mur, dalle, porte, fenêtre, ouverture, pièce ; table nœud Pascal → classe IFC | `/model opus` |
| 22.2 Export — **fait le 2026-11-24** | Par l'`ifc-converter` de Pascal : placements, unités, relations spatiales, matériaux et compositions, types, propriétés, quantités | `/model opus` |
| 22.3 Identifiants stables — **fait le 2026-11-24** | Correspondance `elementId ↔ GlobalId` identique d'un export à l'autre | `/model sonnet` |
| 22.4 Import contrôlé — **fait le 2026-11-24** | Rapport d'import : objets inconnus et géométries non prises en charge signalés, jamais modifiés en silence | `/model opus` |
| 22.5 Contrôles et gate G5 — **fait le 2026-11-24** (`docs/phases/M22-report.md`) | Schéma, IDS si applicable, réimport et comparaison géométrique (IfcOpenShell), ouverture dans 2 visionneuses, rapport | `/model opus` |

- [x] Classes cibles : projet, site, bâtiment, niveau, mur, dalle, porte, fenêtre, ouverture, pièce
- [x] Export par l'`ifc-converter` de Pascal : placements, unités, relations spatiales, matériaux et
      compositions, ouvertures, types, propriétés, quantités
- [x] Correspondance `elementId ↔ GlobalId` stable d'un export à l'autre
- [x] Import contrôlé avec rapport : objets inconnus et géométries non prises en charge signalés,
      jamais modifiés en silence
- [x] Contrôle de schéma, IDS si applicable, réimport et comparaison géométrique (script IfcOpenShell)

**Critères d'acceptation (G5)**
- HOUSE-01 exporté s'ouvre dans 2 visionneuses indépendantes avec les mêmes niveaux, hauteurs,
  ouvertures, matériaux et quantités
- Exporter deux fois le même plan donne les mêmes `GlobalId`
- Aucune perte silencieuse : chaque écart figure dans le rapport

## M23 — Bibliothèque de prix et DQE (gate G6) — **terminé, gate G6 validé par l'utilisateur le 2026-11-27** (`docs/phases/M23-report.md`)

À décider avant de commencer : nomenclature des postes, base de prix, devise, taxes.

**Découpage en sous-lots proposé le 2026-11-18, à confirmer au plan du jalon.** Ordre : 23.0 → 23.8 ; test par
l'utilisateur après chaque sous-lot. Taper la commande `/model` indiquée avant le sous-lot (Claude la
rappelle s'il tourne sur un autre modèle).

| Sous-lot | Contenu | Modèle |
|---|---|---|
| 23.0 Décisions — **fait le 2026-11-26** (`docs/phases/M23-decisions.md`) | Nomenclature des postes, base de prix, devise, taxes, en options, choisies par l'utilisateur | `/model opus` |
| 23.1 Bibliothèque de prix — **fait le 2026-11-26** | Postes, prix des matériaux, main-d'œuvre, matériel, compositions, date d'effet, fournisseur, région, version ; tables Supabase avec RLS | `/model opus` |
| 23.2 Import des prix — **fait le 2026-11-27** | CSV et XLSX avec contrôle des unités et des devises ; aucun prix inventé ni implicite | `/model sonnet` |
| 23.3 Correspondance vers les postes — **fait le 2026-11-27** | Élément + matériau + règle → poste ; plusieurs postes par élément sans double comptage | `/model opus` |
| 23.4 Calcul des montants — **fait le 2026-11-27** | Pertes, frais, marge, taxes ; arrondis documentés ; montants exacts, sans nombres à virgule flottante | `/model opus` |
| 23.5 Versions du DQE — **fait le 2026-11-27** (écran en 23.6) | DQE figé par version du modèle et du bordereau ; recalcul après modification ; comparaison des versions | `/model opus` |
| 23.6 Panneau DQE — **fait le 2026-11-27** | Lots, postes, quantité, prix unitaire, montant, origine, couverture, avertissements | `/model sonnet` |
| 23.7 Exports — **fait le 2026-11-27** | XLSX et PDF : en-tête, cartouche, synthèse, détail, hypothèses, date des prix | `/model sonnet` |
| 23.8 Contrôles et gate G6 — **fait le 2026-11-27** (`docs/phases/M23-report.md`) | Postes sans prix bloquants, totaux identiques à l'écran, en XLSX et en PDF, rapport | `/model opus` |

- [x] Bibliothèque de prix : postes (code, libellé, unité, lot, ouvrage type), prix des matériaux,
      main-d'œuvre, matériel, compositions de prix, date d'effet, fournisseur, région, version ;
      tables Supabase avec RLS
- [x] Import CSV et XLSX avec contrôle des unités et devises ; **aucun prix inventé ni implicite**
- [x] Correspondance élément + matériau + règle → poste ; un élément peut alimenter plusieurs postes
      (maçonnerie, enduit, peinture) sans double comptage dans un poste
- [x] Paramètres de chiffrage : pertes, frais, marge, taxes ; arrondis documentés ; montants exacts
      (jamais de nombres à virgule flottante)
- [x] DQE figé par version du modèle et du bordereau ; recalcul après modification ; comparaison des
      versions du devis
- [x] Panneau DQE : lots, postes, quantité, prix unitaire, montant, origine, couverture, avertissements
- [x] Exports XLSX et PDF : en-tête, cartouche, synthèse, détail, hypothèses, date des prix
- [x] Contrôle : postes sans prix

**Critères d'acceptation (G6)**
- 13,11 m² × 45 000,0 Ar/m² HT (prix d'exemple) = 589 950 Ar, arrondi à la centaine supérieure : 590 000 Ar HT
  (D23-1 et D23-5, exemple remplacé le 2026-11-26)
- Même révision + même bordereau = même DQE
- Un poste sans prix empêche de marquer le devis comme définitif
- Les totaux sont identiques à l'écran, en XLSX et en PDF ; chaque poste affiche sa source et son unité

## M24 — Contrôles qualité, performance et sécurité (gate G7)

**Découpage en sous-lots proposé le 2026-11-18, à confirmer au plan du jalon.** Ordre : 24.1 → 24.7 ; test par
l'utilisateur après chaque sous-lot. Taper la commande `/model` indiquée avant le sous-lot (Claude la
rappelle s'il tourne sur un autre modèle).

| Sous-lot | Contenu | Modèle |
|---|---|---|
| 24.1 Onglet « Contrôles » — **fait le 2026-11-28** (`measurements/controls.ts`) | Un seul panneau (suite des « points à vérifier ») : géométrie, propriétés manquantes, unités, postes sans prix, cas EDGE-01 | `/model sonnet` |
| 24.2 Régression visuelle | Comparaisons 2D, 3D et PDF ; tests par propriétés sur la géométrie et les quantités | `/model sonnet` |
| 24.3 Épreuves | Maison simple, villa à plusieurs niveaux, petit immeuble, modèles invalides, IFC externes | `/model sonnet` |
| 24.4 Performance | Seuils fixés avec l'utilisateur, puis mesures sur 1 000, 5 000 et 10 000 éléments : chargement, modification, recalcul, export | `/model opus` |
| 24.5 Sécurité des imports — **fait le 2026-11-28 en 24.2 du plan replanifié** | IFC et fichiers externes : taille, validation, aucun contenu exécuté | `/model opus` |
| 24.6 Fiabilité | Exports atomiques, reprise après plantage, sauvegarde et restauration, journal d'audit | `/model opus` |
| 24.7 Revue humaine et gate G7 | Dossiers pour un architecte ou dessinateur BIM et un métreur indépendant, revue documentée, rapport | `/model sonnet` |

- [x] Panneau unique de contrôles qualité (prolonge la pastille « points à vérifier ») : géométrie,
      propriétés manquantes, unités incompatibles, postes sans prix — fait le 2026-11-28 (onglet « Contrôles »)
- [ ] Régression visuelle 2D, 3D et PDF ; tests par propriétés sur la géométrie et les quantités
- [ ] Épreuves : maison simple, villa à plusieurs niveaux, petit immeuble, modèles invalides, IFC externes
- [ ] Performance mesurée sur 1 000, 5 000 et 10 000 éléments : chargement, modification, recalcul,
      export
- [x] Imports IFC et fichiers externes sécurisés (taille, validation, aucun contenu exécuté) — fait le 2026-11-28 (24.2)
- [ ] Exports atomiques, reprise après plantage, sauvegarde et restauration, journal d'audit
- [ ] Revue par un architecte ou dessinateur BIM et par un métreur indépendant

**Critères d'acceptation (G7)**
- Les seuils de performance fixés au début du jalon sont atteints
- Chaque cas d'EDGE-01 est signalé dans le panneau
- Revue humaine documentée ; dossiers de référence publiables sous supervision professionnelle

## M25 — Assistant IA (gate G8)

À commencer seulement quand le modèle, les métrés et le DQE sont stables.

**Découpage en sous-lots proposé le 2026-11-18, à confirmer au plan du jalon.** Ordre : 25.1 → 25.6 ; test par
l'utilisateur après chaque sous-lot. Taper la commande `/model` indiquée avant le sous-lot (Claude la
rappelle s'il tourne sur un autre modèle). Ces commandes choisissent le modèle de Claude Code
pour développer ; le modèle de l'assistant dans l'application reste un choix séparé (25.1).

| Sous-lot | Contenu | Modèle |
|---|---|---|
| 25.1 Serveur et panneau | Worker Cloudflare qui garde les clés ; panneau assistant dans Fabrics ; choix du modèle de l'assistant | `/model opus` |
| 25.2 Outils typés | Opérations de Pascal (MCP en adaptateur facultatif) : lire le projet, les niveaux, les éléments, proposer un mur, modifier un élément, créer une ouverture, prévisualiser les quantités, comparer des devis, publier | `/model opus` |
| 25.3 Aperçu et annulation | Plan d'actions proposé, paramètres et droits vérifiés, aperçu avant écriture, un seul Ctrl+Z pour toute l'action | `/model opus` |
| 25.4 Explications | Expliquer les métrés (traçabilité de M21) ; proposer des postes de prix, validés par l'utilisateur | `/model sonnet` |
| 25.5 Refus et journal | Refus des demandes impossibles, unités ambiguës, dimensions incompatibles, prix manquants ; journal sans secret | `/model sonnet` |
| 25.6 Mesures et gate G8 | Taux de réussite, incidents et retours arrière sur les fixtures, rapport | `/model opus` |

- [ ] Panneau assistant dans Fabrics ; modèle au choix ; clés gardées côté serveur (Worker Cloudflare)
- [ ] Outils typés sur les opérations de Pascal (opérations d'agent, MCP comme adaptateur facultatif) :
      lire le projet, lister les niveaux, lire les éléments, proposer un mur, modifier un élément,
      créer une ouverture, prévisualiser les quantités, comparer des devis, publier des documents
- [ ] L'IA propose un plan d'actions ; Fabrics vérifie paramètres et droits ; **aperçu des changements**
      avant toute écriture ; une seule étape d'annulation
- [ ] Expliquer les métrés (traçabilité de M21) ; proposer des postes de prix, validés par l'utilisateur
- [ ] Refus des demandes impossibles, unités ambiguës, dimensions incompatibles, prix manquants
- [ ] Journal des demandes et actions (sans secret)

**Critères d'acceptation (G8)**
- L'IA ne produit jamais de quantité ni de prix : tout vient des calculs déterministes
- Aucune modification sans accord ; un Ctrl+Z annule toute l'action de l'assistant
- Taux de réussite, incidents et retours arrière mesurés sur les fixtures

### Risques et parades

| Risque | Parade |
|---|---|
| Export IFC de Pascal incomplet | preuve de concept et table de correspondance en M17 et M22 |
| Écart entre géométrie affichée et métrés | même géométrie source, fixtures, tests d'intersection |
| Migration des plans Fabrics vers la scène Pascal | migration testée sur tous les types, comparaison à la baseline (M18) |
| Deux historiques (annuler Pascal / Yjs) | un seul historique décidé par ADR en M18 |
| Méthodes de métré propres au pays | règles paramétrables, versionnées, validées par un métreur |
| Licences des dépendances | `THIRD_PARTY_NOTICES.md`, vérification avant diffusion commerciale |
| Prix périmés | date d'effet, origine, version, avertissements |
| Paquets Pascal qui évoluent | versions figées, `packages/pascal/FABRICS_CHANGES.md`, CI |
| Actions IA incorrectes | aperçu, validation, annulation |
| Performance des grands bâtiments | mesures, tests progressifs, caches ciblés |
| Documents diffusés sans vérification | statut « brouillon / non validé », revue humaine |

**Règle finale.** Les plans et DQE destinés à une construction réelle restent soumis à la
vérification d'un professionnel qualifié. On n'annonce jamais « qualité Revit » sans comparaisons
chiffrées, sorties imprimables, audit des données et revue d'un praticien BIM. Sans les décisions
métier demandées avant M20, M21 et M23, Claude construit une base générique, marque ses hypothèses
et interdit de qualifier un devis de définitif.

---

## Plus tard (non planifié, à prioriser avec l'utilisateur)

- Structure calculée, réseaux (MEP) complets, ferraillage, phasage 4D, réglementations par pays
  (les outils MEP natifs de Pascal restent disponibles sans amélioration)
- Modèles de visuels originaux, bibliothèque de composants, identité de marque
- QR code pour les liens de partage
- Mentions et notifications sur les commentaires (après M16)
- Comparer deux versions quelconques côte à côte (après M15)
- Plusieurs pages par projet, mode présentation
- Espaces de travail, membres et rôles (propriétaire, admin, éditeur, commentateur, lecteur)
- Traductions anglais et malgache, mode sombre, accessibilité avancée
- Abonnements et paiements, statistiques d'usage, conformité RGPD complète
- Export DWG

Retirés de cette liste le 2026-11-17 car planifiés ou apportés par Pascal : assistant IA (M25),
toitures avancées et fenêtres de toit, lucarnes, fenêtre ronde (natifs dans Pascal, intégrés en M19).
