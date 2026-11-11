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
- [x] Outil Cote : deux points, valeur affichée en mètres, décalage réglable
- [x] Outil Calibrer pour une image importée (procédure de `docs/02-ARCHITECTURE.md`)
- [x] Édition des sommets : glisser un sommet d'un mur ou d'une pièce après création
- [x] Panneau Métrés (pièces, murs, totaux), mis à jour en temps réel
- [x] Export CSV des métrés
- [x] Ces outils n'apparaissent que dans les projets de type Plan

**Critères d'acceptation**
- Un rectangle de pièce de 4,00 × 3,00 m affiche 12,00 m² et 14,00 m
- Une pièce tracée sur les faces intérieures de 4 murs (axes 4,00 × 3,00 m, épaisseur 20 cm)
  affiche 10,64 m²
- Une image calibrée sur une distance connue de 3,50 m donne une cote de 3,50 m ± 1 cm entre
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
- Un lit 160 × 200 cm posé sur le plan mesure 1,60 × 2,00 m avec l'outil Cote
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
- [ ] Trémie calculée depuis l'emprise de l'escalier + marge `voidMargin` (50 mm par défaut),
      jamais stockée ; en L : polygone en L
- [ ] Dalle 3D du niveau du dessus trouée (forme avec trou, sans calcul booléen)
- [ ] Contour pointillé avec croix sur le plan du niveau du dessus
- [ ] Métrés : surface de la pièce au tracé, trémie, surface nette ; colonne « Trémie » du CSV
- [ ] Trémie qui déborde de la pièce : avertissement, dalle laissée pleine (cas noté dans « Idées »)

### Lot E — Cheminées
- [ ] Type `chimney` (emprise, rotation, dépassement en mm au-dessus du dernier niveau)
- [ ] Symbole 2D sur son niveau, contour fantôme sur les niveaux du dessus ; volume en 3D
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

- [ ] Façades (élévations) Nord, Sud, Est, Ouest générées à partir du modèle 3D
- [ ] Outil Ligne de coupe sur le plan (repère A–A, B–B…, sens de vue) ; coupe générée,
      matières coupées en noir
- [ ] Vues générées en lecture seule, toujours à jour avec le plan
- [ ] Planche : affichage côte à côte des niveaux, façades et coupes, avec leurs titres
- [ ] Export PDF de la planche ou d'une vue seule, à l'échelle choisie, avec cartouche
- [ ] Cotes de niveaux (altitudes) sur les façades et coupes

**Critères d'acceptation**
- Une façade montre chaque fenêtre du mur correspondant, à la bonne hauteur
- Déplacer la ligne de coupe met la coupe à jour
- Imprimée à 100 %, une hauteur d'étage de 2,50 m mesure 5,0 cm sur une façade à 1:50

## M11 — Import et export

- [ ] Export DXF (murs, pièces, cotes, ouvertures, axes sur des calques séparés, en mm)
- [ ] Import DXF comme calque de fond verrouillé, sur un niveau, à l'échelle
- [ ] Export 3D (glTF) du bâtiment

**Critères d'acceptation**
- Le DXF exporté s'ouvre dans LibreCAD avec des longueurs exactes en mm
- Un DXF importé garde ses dimensions (une ligne de 5 000 mm mesure 5,00 m)

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
- Toits en pente, export DWG
