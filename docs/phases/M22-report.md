# M22 — Rapport de fin de jalon (gate G5)

**Validé par l'utilisateur le 2026-11-24** : essai dans le navigateur et HOUSE-01 ouvert dans 2 visionneuses (« tout est validé »). Gate G5 validé.

Rédigé le 2026-11-24, à la fin de 22.5. Sous-lots 22.0 à 22.5 faits le 2026-11-24, d'une traite
(demande de l'utilisateur : essai dans le navigateur à la fin). Décisions : `M22-decisions.md`.
Classes : `M22-classes.md`.

## Critères du gate G5

| Critère | Preuve automatique | Reste à faire |
|---|---|---|
| HOUSE-01 exporté s'ouvre dans 2 visionneuses indépendantes avec les mêmes niveaux, hauteurs, ouvertures, matériaux et quantités | `npm run check:ifc` : IfcOpenShell relit le fichier (schéma IFC4 : 0 erreur ; IDS : 6/6 ; niveaux, matériaux, Uniclass, quantités ↔ géométrie à 0,000 %) ; `reimport.test.ts` : réimporté par web-ifc (Pascal), mêmes niveaux et métrés | **Ouvrir `tmp/ifc-g5/HOUSE-01.ifc` dans 2 visionneuses** (utilisateur, voir plus bas) |
| Exporter deux fois le même plan donne les mêmes `GlobalId` | `globalIds.test.ts` : deux exports à des dates différentes, après rechargement, après modification d'un autre mur ; un élément importé garde son GlobalId | — |
| Aucune perte silencieuse : chaque écart figure dans le rapport | Export : remarques affichées (objets sans forme 3D, quantités provisoires, quantités sans objet). Import : bilan objet par objet par GlobalId (`importIfc.test.ts`, dont un objet inconnu glissé dans un fichier). Contrôle : `tmp/ifc-g5/report.md` | — |

## Résultats de `npm run check:ifc` (2026-11-24)

| Plan | Schéma | IDS | Quantités ↔ géométrie | Niveaux | Matériaux des murs | Uniclass |
|---|---|---|---|---|---|---|
| HOUSE-01 | IFC4, 0 erreur | 6 / 6 | 17 / 17 (0,000 %) | identiques | 7 / 7 | 13 / 13 |
| HOUSE-02 | IFC4, 0 erreur | 6 / 6 | 38 / 38 (au plus 0,020 %) | identiques | 14 / 14 | 30 / 30 |
| Plan d'exemple | IFC4, 0 erreur | 6 / 6 | 51 / 51 (0,000 %) | identiques | 16 / 16 | 41 / 41 |
| Grande maison | IFC4, 0 erreur | 6 / 6 | 108 / 114 ; 6 provisoires (raccords de 3 murs, M21) | identiques | 37 / 37 | 93 / 93 |

Le défaut R14 (ancien export IFC2x3 non valide, 23 erreurs sur le plan d'exemple) est fermé.

## Ce que M22 a livré

- **22.0** Décisions D22-1 à D22-8 (option recommandée partout) : IFC4, Uniclass 2015, deux
  visionneuses gratuites, export de Pascal, pièces au contour Fabrics, import en nouveau projet,
  quantités de M21, petit IDS.
- **22.1** Table des classes (`src/features/ifc/classes.ts`) ; l'exportateur de Pascal reçoit les
  ajouts de l'hôte et rend la classe et le GlobalId de chaque objet (`FABRICS_CHANGES.md`).
- **22.2** Le bouton « Exporter » → « IFC (BIM) » et celui des réglages de Pascal écrivent le même
  fichier IFC4 : contour tracé des pièces, dalles de niveau, quantités de M21 (`Qto_*`), propriété
  `Fabrics` (élément, règles, statut), Uniclass, annotations exclues ; remarques après l'export.
  L'ancien export IFC2x3 est supprimé.
- **22.3** GlobalId stables, table élément Fabrics ↔ GlobalId.
- **22.4** Accueil « Importer un IFC » : nouveau projet Plan et bilan objet par objet (téléchargeable).
- **22.5** IDS `tools/ifc/fabrics-g5.ids`, `tools/ifc/check_g5.py`, `npm run check:ifc` ; réimport
  comparé (`reimport.test.ts`) ; ce rapport.

## Défauts trouvés et corrigés pendant le jalon

- **Dalle de niveau et murs du dessous** (trouvé par le réimport) : la dalle ajoutée à l'export faisait
  arrêter par Pascal les murs du niveau du dessous sous elle (2,80 m au lieu de 3,00 m pour HOUSE-02).
  La dalle est maintenant découpée autour de ces murs et percée des trémies (règle des fixtures du
  2026-11-18) ; une marge de 0,2 mm la sépare des murs (les découpes de Pascal arrondissent au 0,1 mm).
  Effet : la surface du solide est jusqu'à 0,02 % plus petite que la quantité écrite (HOUSE-02).
- **Trémies dessinées dans Pascal** (trouvé par le réimport) : elles n'étaient pas déduites de la
  surface des dalles dans les métrés. Corrigé (`scene/slabMeasures.ts`), sans double compte d'un trou
  de la dalle.

## Limites connues

- **Sans vue 3D** (tests, export sans éditeur ouvert), toitures, escaliers, mobilier et plateformes ne
  sont pas exportés : ils sont signalés dans les remarques. Depuis l'éditeur, ils le sont avec leur
  forme 3D, mais sans jeu de quantités (`Qto`) ni comparaison IfcOpenShell.
- **Trémie d'escalier au réimport** : elle revient comme trou de dalle ; la surface nette des pièces ne
  la déduit plus (Idées). Les trémies tracées au plafond dans Pascal ne sont pas encore déduites de la
  dalle du dessus.
- **Revit** non essayé (D22-3) : la catégorie attendue de chaque classe est dans `M22-classes.md`.
- **Codes Uniclass** (table EF) à faire relire par un praticien BIM ; pas de code pour les pièces.
- **Dalle de niveau en plusieurs morceaux** : la quantité de M21 est répartie entre les morceaux au
  prorata de leur surface (la somme est exacte).
- Les murs aux raccords de 3 murs restent « provisoires » (M21, Idées).

## Essai par l'utilisateur

Liste dans le message de fin de jalon et dans `docs/regression-checklist.md` (M22). Visionneuses
gratuites proposées : **BIMvision** et **Open IFC Viewer** (Windows, gratuites, le fichier reste sur l'ordinateur).
