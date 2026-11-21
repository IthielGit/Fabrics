# M20 · 20.0 — Décisions (plans professionnels et mise en page)

Proposé le 2026-11-21. **Toutes les décisions ont été choisies par l'utilisateur le 2026-11-21**
(option recommandée retenue partout ; précision ajoutée en D20-7). Référence de résultat : `C:/Users/My PC/Downloads/Villa ROOMIT_B.pdf`
(voir `CONTEXT.md`), 13 feuilles A2 paysage : vues 3D (1-2), implantation 1:100 (3),
fondations 1:50 (4), RDC et R+1 1:50 (5-6), toiture 1:50 (7), coupe 1:50 (8), façades 1:50 (9-12),
fosse septique 1:35 (13).

Ce que la référence montre et que Fabrics fait déjà (M10 ter, Exécution) : trois chaînes de cotes
par façade (baies et trumeaux, axes, total), baies notées `PP: 90 x 210` et `All. 110`, noms et
surfaces des pièces, repère du nord. Ce qui manque : le gabarit de feuille à colonne droite, les
tableaux de surfaces sur la feuille, les axes repérés (1, 2… / A, B…), les niveaux sur les coupes,
les styles de traits, la mise à jour automatique du jeu de feuilles.

---

## D20-1 · Unités des cotes imprimées — **contradiction à trancher**

La référence cote en **centimètres** (`450`, `1447`) et les niveaux en mètres (`+2.88`).
`CLAUDE.md` impose le **mm partout** (Métrique architectural, comme Revit), exports compris.

| Option | Effet |
|---|---|
| **A (recommandée)** mm partout, comme la règle actuelle : `4500`, `14470`, niveaux `+2880` | Aucune règle à changer ; cohérent avec l'écran et les métrés. Cotes plus longues d'un chiffre. |
| B Cotes des feuilles en cm, niveaux en m (usage de la référence) | Il faut modifier la règle de `CLAUDE.md` (exception « feuilles imprimées ») ; l'écran reste en mm. |
| C Réglage par projet (mm ou cm sur les feuilles) | Plus souple, mais deux conventions à tester et à vérifier. |

**Retenu le 2026-11-21 : A, mm partout.** La règle de `CLAUDE.md` ne change pas.

## D20-2 · Normes de représentation

| Option | Contenu |
|---|---|
| **A (recommandée)** Usages français (NF / ISO 128), comme retenus en M10 ter pour Madagascar | Éléments coupés en trait fort et hachurés, éléments vus en trait fin, éléments au-dessus en tirets ; cotes au nu brut, baies brutes de maçonnerie ; repères de baies, d'axes et de niveaux comme la référence. |
| B Usages de Revit par défaut (gabarit « Architecture » français) | Proche de A, mais réglages de traits et de symboles de Revit. |

**Retenu le 2026-11-21 : A, usages français.**

## D20-3 · Gabarit de feuille et cartouche

| Option | Contenu |
|---|---|
| **A (recommandée)** Copie du gabarit de la référence | Cadre, **colonne droite** : type de plan (« PLAN DE NIVEAU »), rose des vents orientée selon le nord du projet, tableaux de surfaces ; **cartouche en bas à droite** : projet, émetteur, titre, N° de plan, indice, date, échelle, format. Champ « statut » (Esquisse, APS, APD, PC, DCE, EXE) ajouté. |
| B Cartouche en bande horizontale en bas (actuel de Fabrics, M10) | Moins de travail, mais différent de la référence. |

Formats : A4, A3, A2, A1, paysage ou portrait ; **A2 paysage par défaut** (référence).
**Retenu le 2026-11-21 : A, gabarit de la référence, A2 paysage par défaut.**

## D20-4 · Échelles

Proposition : **1:50** plans de niveau, coupes, façades, toiture ; **1:100** implantation et
plan de masse ; **1:20** et **1:10** détails ; **1:200** disponible. Échelle libre (ex. 1:35 de la
fosse) seulement pour les feuilles de détail. **Retenu le 2026-11-21 tel quel.**

## D20-5 · Livrables et ordre de travail

| Option | Ordre |
|---|---|
| **A (recommandée)** Plans de niveau d'abord | 1. Feuille RDC (page 5) refaite à l'identique comme premier cas de comparaison ; 2. R+1 et toiture ; 3. coupe et façades ; 4. implantation ; 5. jeu complet, révisions. |
| B Tout le dossier en même temps | Plus long avant le premier résultat comparable. |

Livrable contractuel : **PDF vectoriel** du jeu de feuilles (un fichier, pages numérotées),
SVG par feuille, indice de révision par version. **Retenu le 2026-11-21 : A, plans de niveau d'abord, feuille RDC comme premier cas de comparaison.**

## D20-6 · Façades : rendu

| Option | Contenu |
|---|---|
| **A (recommandée)** Trait seul + hachures des matériaux, ombres portées en option | Imprimable, léger, mesurable. |
| B Ombres portées comme la référence par défaut | Plus proche visuellement ; fichiers PDF plus lourds (image). |

**Retenu le 2026-11-21 : A, trait et hachures, ombres portées en option.**

## D20-7 · Fondations, réseaux et fosse septique

La référence contient un plan de fondations (semelles, longrines, poteaux, axes), des réseaux
(EP, EU, EV) sur l'implantation et une fosse septique pour 6 personnes. Pascal déclare un type
`foundation-plan` sans rendu opérationnel (voir `CONTEXT.md`).

Proposition : **dans M20, seulement dessiner ce que l'utilisateur modélise** (objets et lignes
annotées) ; **aucun dimensionnement automatique** (semelles, volume de fosse) : il relève d'un
ingénieur, comme l'exige `CLAUDE.md`. L'étude Pascal / AutoCAD / Revit demandée le 2026-11-19 est
faite à part et présentée avant d'ajouter des objets « fondation » et « fosse » (sous-lot à
placer).

**Retenu le 2026-11-21 : dessin seulement**, avec une exigence de l'utilisateur : **l'application
dit à l'ingénieur ce qu'elle attend de lui**. Pour chaque objet non dimensionné par Fabrics
(semelle, longrine, poteau, fosse, puisard, réseau), une **fiche « Données à fournir par
l'ingénieur »** liste les valeurs à saisir, leur unité et leur usage dans les plans et les métrés,
par exemple : semelle (largeur, longueur, hauteur en mm, profondeur d'assise, béton) ; fosse
(nombre d'usagers, volume utile en m³, compartiments et dimensions en mm) ; réseau (type EP / EU /
EV, diamètre en mm, pente en %). Tant qu'une valeur manque, l'objet est marqué « à dimensionner
par l'ingénieur » sur la feuille et dans les métrés ; Fabrics ne propose jamais de valeur. La fiche
se remplit dans l'app et s'exporte (PDF) pour être envoyée à l'ingénieur.

---

## D20-8 · Pièces séparées sans mur (ajoutée le 2026-11-21, étape 1 de 20.1a)

Un passage ouvert entre deux pièces se modélise par une **séparation de pièces** de Pascal. **Retenu : A,
la séparation passe au milieu de la poutre** (règle de Revit, sans épaisseur) ; la bande sous la poutre
est partagée entre les deux pièces (Villa ROOMIT : +0,20 m² au Séjour et au Dégagement par rapport au
tableau de la référence).

## D20-9 · Plan d'exécution : étiquettes, repères, cotes intérieures (2026-11-21, 20.1a étape 3)

Choix de l'utilisateur (modifie les usages validés en M10 ter, lot B) :
- **Étiquette de pièce : nom + surface** (comme Villa ROOMIT). Les altitudes (sol, sous plafond, dalle)
  restent dans les métrés et iront sur les coupes.
- **Repères des baies au format ROOMIT, en mm** : porte `PP: 900 x 2100`, fenêtre `1500 x 1000` et
  `All. 1100`. Pas de numéro `P01` / `F01` sur le plan (les numéros restent dans les métrés).
- **Cotes intérieures : une largeur et une profondeur par pièce**, au nu des murs, au lieu des chaînes
  par rangée de pièces (qui répétaient des valeurs).

## Après les choix

Les décisions retenues sont reportées ici (« retenu le … »), dans `docs/03-ROADMAP.md` (M20) et
dans `docs/PROGRESS.md`, puis le plan de 20.1 est proposé (tâches et fichiers).
