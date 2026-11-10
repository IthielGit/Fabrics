# 01 — Produit

## Vision

Fabrics permet de passer d'une idée à un visuel propre ou à un plan coté en quelques minutes,
sans compétence avancée en design ni en dessin technique.

**Proposition de valeur :** « Crée des visuels et des plans à l'échelle, mesure-les
instantanément, exporte-les en un clic. »

## Pour qui

| Profil | Besoin principal | Type de projet |
|---|---|---|
| Créateur de contenu, petite entreprise | Affiches, posts, flyers rapides | Visuel |
| Particulier qui rénove | Dessiner sa pièce, connaître surfaces et longueurs | Plan |
| Artisan, petit bureau d'études | Relever un existant, sortir les métrés | Plan |
| Étudiant, enseignant, association | Supports visuels simples | Visuel |

## Les deux types de projet

Les deux types partagent **le même éditeur** (même canevas, même sélection, mêmes calques,
même export). Seuls les outils disponibles et l'unité changent.

| | Visuel (`design`) | Plan (`plan`) |
|---|---|---|
| Unité | pixel | millimètre (affiché en m / cm) |
| Formats de départ | Post carré 1080×1080, Story 1080×1920, A4, Affiche A3, Bannière 1500×500 | Feuille libre avec échelle |
| Outils | Texte, rectangle, ellipse, ligne/flèche, image | Tous ceux du Visuel + mur, pièce, cote, calibrage d'image |
| Panneau spécifique | — | **Métrés** (surfaces, périmètres, longueurs) |
| Grille | optionnelle, en px | toujours disponible, en cm/m |

## Périmètre du MVP (jalons M0 à M12)

**Inclus**
- Page d'accueil : liste des projets, créer (Visuel ou Plan + format), renommer, dupliquer,
  supprimer.
- Éditeur : zoom, déplacement, sélection simple et multiple, déplacer / redimensionner /
  pivoter, supprimer, dupliquer, copier-coller, annuler / rétablir, calques (ordre, masquer,
  verrouiller), panneau de propriétés, magnétisme sur grille et guides d'alignement.
- Contenu : texte (police, taille, graisse, italique, couleur, alignement), rectangle, ellipse,
  ligne et flèche, import d'image depuis l'appareil.
- Mode Plan : murs avec épaisseur, pièces (polygones fermés) avec nom, cotes, calibrage
  d'une image de plan importée, panneau Métrés, export CSV des métrés.
- Export : PNG, JPG, PDF (format A4/A3, échelle choisie pour les plans).
- Sauvegarde automatique (locale d'abord, puis cloud au jalon M12).
- Comptes utilisateurs (e-mail + mot de passe ; Google en option) et synchronisation cloud.
- Mise en ligne publique sur Cloudflare Pages.

**Exclus du MVP**
- Devis, prix, quotations : **jamais** dans ce produit tant que l'utilisateur ne le demande pas.
- Phase « Bâtiment » (jalons M5 à M10, voir ci-dessous).
- Collaboration temps réel (jalon M13).
- Espaces de travail multi-membres, rôles, commentaires.
- Modèles, identité de marque, historique de versions.
- Abonnements, paiements, statistiques d'administration.
- Traduction anglais / malgache, mode sombre (préparés mais non livrés).
- Assistant IA : reporté, à décider plus tard avec l'utilisateur.

## Phase « Bâtiment » (après le MVP, jalons M5 à M10)

Un projet Plan devient un **bâtiment** : on dessine chaque niveau, l'application en déduit
le reste.

| Jalon | Ce que l'utilisateur obtient |
|---|---|
| M5 Ouvertures | Portes et fenêtres posées dans les murs ; surface murale nette |
| M6 Niveaux | Rez-de-chaussée, étages ; niveau du dessous en transparence ; métrés par niveau |
| M7 Axes et mobilier | Axes repérés A, B / 1, 2 ; bibliothèque de mobilier dessinée pour Fabrics |
| M8 Vue 3D | Le bâtiment en volume à côté du plan, mis à jour en direct |
| M9 Façades et coupes | Façades N/S/E/O et coupes générées ; planche qui les présente côte à côte ; PDF |
| M10 Import, export, partage | DXF (import et export), glTF, lien de partage en lecture seule |

**Parcours D. Du plan au bâtiment**
Nouveau plan → dessiner les murs du rez-de-chaussée → poser porte et fenêtres → dupliquer le
niveau en « Étage 1 » et l'adapter → ouvrir la vue 3D → tracer une ligne de coupe → ouvrir la
planche → exporter en PDF.

## Écrans

### Accueil (`/`)
```
┌───────────────────────────────────────────────────────────┐
│ Fabrics                                   [Se connecter]  │
├───────────────────────────────────────────────────────────┤
│ [+ Nouveau visuel]  [+ Nouveau plan]     🔍 Rechercher    │
│                                                           │
│ Projets récents                                           │
│ ┌───────┐ ┌───────┐ ┌───────┐                             │
│ │ miniat│ │ miniat│ │ miniat│   (vide : message +         │
│ │ Nom   │ │ Nom   │ │ Nom   │    boutons de création)     │
│ │ Plan ·│ │Visuel·│ │ Plan ·│                             │
│ │ il y a│ │ hier  │ │ 3 j   │   menu ⋯ : renommer,        │
│ └───────┘ └───────┘ └───────┘   dupliquer, supprimer      │
└───────────────────────────────────────────────────────────┘
```
« Nouveau visuel » ouvre un choix de format. « Nouveau plan » crée directement un plan vide
à l'échelle 1:50 avec grille de 10 cm.

### Éditeur (`/p/:projectId`)
```
┌────────────────────────────────────────────────────────────────┐
│ ← Nom du projet (éditable)   Enregistré ✓   ↶ ↷   [Exporter]   │
├────┬────────────────────────────────────────────┬──────────────┤
│ ⬚  │                                            │ Propriétés   │
│ T  │                                            │ X  Y  L  H  ⟳│
│ ▭  │              CANEVAS                       │ Remplissage  │
│ ◯  │       (zoom molette, déplacer :            │ Contour      │
│ ╱  │        espace + glisser)                   │ Opacité      │
│ 🖼 │                                            ├──────────────┤
│────│                                            │ Calques      │
│ ▤  │  (plan uniquement :                        │ ☰ Pièce 1 👁🔒│
│ ⬡  │   mur, pièce, cote, calibrer)              │ ☰ Mur 3   👁🔒│
│ ↔  │                                            ├──────────────┤
│ ⌖  │            Zoom 100 % · Impression 1:50    │ Métrés (plan)│
└────┴────────────────────────────────────────────┴──────────────┘
```

## Parcours utilisateurs clés

**A. Créer un post Instagram**
Accueil → Nouveau visuel → Post carré → ajouter un texte, une image importée, un rectangle
de fond → modifier les couleurs → Exporter → PNG.

**B. Dessiner sa cuisine et connaître sa surface**
Accueil → Nouveau plan → outil Mur : cliquer les angles (Maj = angle droit), double-clic pour
finir → outil Pièce : tracer le polygone (les points s'aimantent aux angles des murs) →
nommer « Cuisine » →
le panneau Métrés affiche 12,40 m² et 14,20 m de périmètre → Exporter PDF A4 à 1:50.

**C. Repartir d'un plan existant (photo ou scan)**
Nouveau plan → importer l'image → outil Calibrer : cliquer deux points dont on connaît la
distance, saisir « 3,50 m » → l'image est mise à l'échelle → tracer murs et pièces par-dessus
→ masquer l'image → exporter les métrés en CSV.

## Indicateurs de réussite du MVP

- Un nouvel utilisateur réalise le parcours A en moins de 5 minutes sans aide.
- Un nouvel utilisateur réalise le parcours B et obtient une surface juste à ±1 % près
  par rapport au contour qu'il a tracé (surface au tracé, voir `docs/02-ARCHITECTURE.md`).
- Aucun travail perdu après rechargement de la page.
- Export PDF d'un plan : une cote de 1,00 m mesure 2,0 cm à la règle sur papier à 1:50.
