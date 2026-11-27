# M24 · Plan global — Contrôles qualité, performance et sécurité (gate G7)

Proposé le 2026-11-27. **Rien n'est codé.** Ce plan attend ton feu vert. Source : `docs/03-ROADMAP.md`
(section M24). Modèles : opus ou sonnet selon le sous-lot, comme indiqué dans la roadmap.

## Objectif

Rendre Fabrics fiable avant un usage réel : un panneau unique pour les contrôles, des mesures de
performance sur de gros projets, des imports sécurisés, des exports qui ne peuvent pas être à moitié
écrits, et une revue humaine documentée (gate G7).

## Ce qui existe déjà et qu'on réutilise

| Brique | Où | Rôle en M24 |
|---|---|---|
| Contrôles qualité (géométrie, propriétés manquantes, unités) | `src/features/measurements/qualityChecks.ts` (21.7) | Base du panneau unique (24.1) |
| Pastille « points à vérifier » | écran des métrés | À remplacer par le panneau (24.1) |
| Statut des quantités (validé, provisoire, données manquantes) | `src/features/measurements/quantities/status.ts` (21.4) | Affiché dans le panneau |
| Cas EDGE-01 et fixtures HOUSE-01, HOUSE-02, T1, T2, ROOMIT | `fixtures/` | Épreuves et régression (24.2, 24.3) |
| Tests de baseline (planches et PDF de référence) | `baseline/` | Régression visuelle (24.2) |
| Import IFC avec bilan | `src/features/ifc/importIfc.ts` (22.4) | Sécurité des imports (24.5) |
| Import des prix XLSX et CSV | `src/features/pricing/` (23.2) | Limites de taille et de contenu (24.5) |
| Contrôle SQL (PGlite) | `npm run check:sql` (23) | Modèle des tests de sécurité des données (24.5, 24.6) |
| Exports PDF, XLSX, SVG, IFC | `src/features/export/`, `src/features/ifc/` | Exports atomiques (24.6) |
| Versions de projet (M15) et restauration | historique | Sauvegarde et restauration (24.6) |

## Décisions à prendre avant le sous-lot 24.4 (à valider par toi)

Les seuils de performance sont **fixés par toi**, pas par moi. Je propose des valeurs de départ à
discuter :

- **D24-1 Seuils de performance** (proposition) : chargement d'un projet de 10 000 éléments ≤ 10 s ;
  modification d'un élément ≤ 200 ms de recalcul des métrés ; export PDF d'une planche ≤ 15 s ;
  export IFC ≤ 60 s. Tu valides ou tu changes.
- **D24-2 Taille maximale des imports** (proposition) : IFC ≤ 100 Mo ; classeur de prix ≤ 20 Mo.
  Au-delà, refus clair avant lecture.
- **D24-3 Journal d'audit** (proposition) : une entrée par import, export, changement de prix ou de
  membre, avec auteur et date. Pas de contenu des fichiers dans le journal.
- **D24-4 Sauvegarde et restauration** (proposition) : export complet d'un projet (scène, versions,
  devis, prix utilisés) en un fichier, restaurable comme un nouveau projet.

## Sous-lots

### 24.1 Panneau de contrôles qualité — `/model sonnet`

- Un seul panneau « Contrôles » qui regroupe : géométrie incohérente, propriétés manquantes, unités
  incompatibles, postes sans prix, cas EDGE-01.
- Chaque ligne : gravité (bloquant, à vérifier, information), élément concerné, action proposée.
- Remplace la pastille « points à vérifier » : aucun contrôle n'est perdu (test de non-régression).
- **Test** : chaque cas EDGE-01 apparaît dans le panneau avec le bon niveau de gravité.
- **Toi** : ouvrir un projet avec des défauts volontaires et vérifier que le panneau les liste.

### 24.2 Régression visuelle — `/model sonnet`

- Comparaisons automatiques des plans en 2D, des vues 3D et des PDF avec les références de `baseline/`.
- Tests par propriétés sur la géométrie et les quantités (une surface doit rester la même après
  un réordonnancement des éléments, par exemple).
- **Test** : une modification volontaire d'un mur fait échouer la comparaison, et une modification
  sans effet la laisse passer.
- **Toi** : aucun essai particulier, sauf si une différence visuelle apparaît.

### 24.3 Épreuves — `/model sonnet`

- Jeux d'essai : maison simple, villa à plusieurs niveaux (ROOMIT), petit immeuble (à créer, données
  synthétiques), modèles invalides, IFC externes (uniquement en local, jamais dans le dépôt).
- Pour chaque épreuve : métrés, nombre de contrôles, temps de traitement.
- **Test** : tous les jeux passent sans plantage ; les modèles invalides sont refusés avec un message.
- **Toi** : fournir un IFC externe de ton choix (en local), si tu en as un.

### 24.4 Performance — `/model opus`

- Mesures sur 1 000, 5 000 et 10 000 éléments (données synthétiques) : chargement, modification,
  recalcul des métrés, export.
- Comparaison aux seuils de D24-1 ; chaque dépassement est noté avec sa cause probable.
- Les points « lot 2 Alléger » et « lot 3 Fluidité » notés dans les idées sont traités ici seulement
  s'ils bloquent un seuil.
- **Test** : tableau des mesures dans le rapport ; seuils atteints ou dépassements expliqués.
- **Toi** : valider les seuils de D24-1 avant la mesure, puis constater les temps sur un projet réel.

### 24.5 Sécurité des imports — `/model opus`

- IFC et classeurs de prix : taille maximale (D24-2), validation du format avant lecture, aucun
  contenu exécuté (ni macro Excel, ni script dans un fichier).
- Refus clair pour un fichier trop gros, mal formé, ou contenant des formules ou des liens externes.
- **Test** : un fichier malveillant de test (macro, lien externe, taille excessive) est refusé sans
  effet ; le test est automatisé.
- **Toi** : tenter d'importer un fichier trop gros, et vérifier le message.

### 24.6 Fiabilité — `/model opus`

- Exports atomiques : un fichier n'est écrit qu'une fois complet (pas de PDF à moitié écrit).
- Reprise après plantage : un projet non enregistré est retrouvé à la réouverture.
- Sauvegarde et restauration (D24-4) ; journal d'audit (D24-3).
- **Test** : un plantage simulé pendant un export ne laisse aucun fichier partiel ; la restauration
  d'une sauvegarde redonne les mêmes métrés et le même devis.
- **Toi** : faire une sauvegarde, la restaurer dans un nouveau projet, comparer les totaux.

### 24.7 Revue humaine et gate G7 — `/model sonnet`

- Dossiers pour un architecte ou dessinateur BIM et pour un métreur indépendant : jeux d'essai,
  résultats, limites connues.
- Revue documentée (dates, noms des relecteurs, remarques, décisions), dans `docs/phases/M24-report.md`.
- Gate G7 : seuils atteints, EDGE-01 signalé dans le panneau, revue humaine faite.
- **Toi** : organiser les revues (architecte ou dessinateur BIM, métreur indépendant) ; je ne peux
  pas les remplacer.

## Critères d'acceptation (gate G7)

- Les seuils de performance (D24-1) sont atteints sur les jeux de 1 000, 5 000 et 10 000 éléments,
  ou chaque dépassement est expliqué et accepté par toi.
- Chaque cas d'EDGE-01 est signalé dans le panneau de contrôles.
- Aucun import dangereux n'est exécuté ; tout fichier hors limite est refusé avant lecture.
- Un export interrompu ne laisse aucun fichier partiel.
- La revue humaine (architecte ou dessinateur BIM, métreur) est documentée.

## Risques et parades

| Risque | Parade |
|---|---|
| Seuils de performance inatteignables sur la machine de test | Mesurer d'abord (24.4), puis discuter avec toi des seuils plutôt que de les modifier en silence |
| Régression visuelle trop sensible (faux positifs) | Comparaison par propriétés plutôt que par pixel, seuil de tolérance documenté |
| Import IFC externe trop lourd pour le navigateur | Limite de taille (D24-2), message clair, pas de plantage |
| Revue humaine longue à organiser | Lancer la demande dès le début de 24.7, en parallèle des derniers sous-lots |

## Ordre et validation

1. Tu valides ce plan et D24-1 à D24-4 (ou tu proposes d'autres valeurs).
2. Sous-lots 24.1 à 24.3 enchaînés ; essai dans le navigateur à la fin du jalon.
3. 24.4 après validation de D24-1.
4. 24.5 et 24.6, puis 24.7 (revue humaine, avec tes démarches).

## Hors périmètre de M24

- Assistant IA (M25).
- Essai dans Revit (licence nécessaire, noté dans les idées).
- Relecture des codes Uniclass par un praticien BIM (noté dans les idées, hors jalon).
