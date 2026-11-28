# M24 — Plan du jalon (contrôles qualité, performance, sécurité, gate G7)

Replanifié le 2026-11-28, **en attente du feu vert de l'utilisateur ; rien n'est codé.** Ce plan
remplace les deux versions du 2026-11-27 : celle « facile à utiliser » (choix de Claude demandé par
l'utilisateur) et celle qui l'avait écrasée deux minutes plus tard avec d'autres décisions. On garde la
première, corrigée avec ce que le code fait déjà. Décisions : `M24-decisions.md` (D24-0 à D24-9).

Façon de faire (comme M21 à M23) : tout le jalon d'une traite, un commit et un `git push origin pascal`
par sous-lot, essai de l'utilisateur dans le navigateur à la fin. Chaque sous-lot passe `npm run build`,
`npm run lint`, `npm test` et `npm run check:all`.

## Principes communs

- **Facile à utiliser (D24-0)** : chaque message dit ce qui ne va pas, pourquoi, et propose un bouton.
  Rien ne fige l'écran ; une attente de plus d'une seconde montre sa progression.
- **Réutiliser d'abord** : M24 complète ce qui existe (liste ci-dessous) au lieu de le refaire. Toute
  capacité nouvelle s'inscrit dans `docs/capabilities.md` avant d'être codée.
- Logique en fonctions pures testées (Vitest) ; aucun calcul dans un composant React. Nouveaux textes
  dans le catalogue Lingui de Fabrics (`src/i18n/fabricsMessages.ts`), comme en M23.
- Longueurs en mm partout ; montants en dixièmes d'Ariary exacts (M23).
- Aucune nouvelle dépendance : `playwright-core` (déjà dans les paquets de Pascal, D78) sert aux mesures
  et captures dans Chromium. Si un autre besoin apparaît, l'utilisateur est consulté d'abord (règle 6).

## Ce qui existe déjà

| Brique | Où | Ce que M24 en fait |
|---|---|---|
| Contrôles du plan : pièces qui se chevauchent, trous de couverture, ouverture hors du mur, ouvertures qui se chevauchent, mur de hauteur ou longueur nulle, épaisseur invalide | `src/features/measurements/warnings.ts`, `roomCoverage.ts` | Regroupés dans l'onglet « Contrôles » (24.1) |
| Contrôles de qualité : ouverture trop haute ou de taille invalide, pièce qui se croise, toiture invalide, mur sans matériau, pièce sans nom, unité suspecte | `src/features/measurements/qualityChecks.ts` (21.7) | idem |
| Murs disjoints ou superposés, corrigés en un clic | `src/features/geometry/wallContacts.ts`, pastille `PlanCheckBadge.tsx` (ne compte que les murs) | La pastille compte tous les points et ouvre l'onglet |
| Liste des points dans l'onglet Métrés, aller à l'élément | `MetresWarningList.tsx`, `warningFocus.ts` | Remplacée par l'onglet « Contrôles », sans perdre un seul contrôle |
| Contrôles du DQE : postes sans prix, éléments sans poste | panneau DQE (23.6) | Repris dans l'onglet « Contrôles » |
| Contrôles de Pascal : `validate_scene`, `verify_scene`, `check_collisions` | paquets de Pascal | Étudiés en 24.1 ; repris s'ils ajoutent un contrôle utile (registre, ligne « Contrôles du plan ») |
| Limites d'import : images 20 Mo (jamais SVG), DXF 50 Mo et 20 000 traits, classeur de prix 30 Mo avec garde-fous de décompression | `images.ts`, `Toolbar.tsx`, `dxfImport.ts`, `pricing/xlsxRead.ts` | Gardées ; **l'IFC n'a aucune limite** : ajoutée en 24.2 |
| Enregistrement 1 s après chaque modification et à la fermeture ; copie sur l'appareil si le réseau est coupé | `useAutosave.ts`, `persistence/ResilientRepository.ts` | Prouvé par test, deux manques comblés (24.3, D24-8) |
| Versions de projet (M15), historique des prix, journal des imports, versions du devis (M23) | `supabase/schema.sql`, `supabase/m23-pricing.sql` | Base du journal d'audit (24.3, D24-4) |
| Référence anti-régression : planches SVG, métrés CSV et XLSX, IFC, quantités | `baseline/fabrics/`, `src/baseline/` | Étendue au PDF et à la 3D (24.4) |
| Plans d'essai : HOUSE-01, HOUSE-02, EDGE-01, T1, T2, villa ROOMIT (RDC, R+1) | `fixtures/` | Épreuves (24.4) |
| Un seul test de durée (« 600 murs en moins de 200 ms ») | `src/features/building/model.test.ts` | Remplacé par des mesures dédiées (24.5) |

## Par rapport au découpage de la roadmap (2026-11-18)

- **24.1 devient le cœur du jalon** : un onglet pensé pour l'utilisateur, pas une liste technique.
- **Imports sûrs et « ne rien perdre » passent avant la performance** : ce sont eux que l'utilisateur
  remarque en premier.
- **Régression et épreuves sont regroupées et placées avant la performance** : les optimisations de
  24.5 touchent au cœur des calculs ; le filet doit être tendu avant.
- 7 sous-lots → 6. La section M24 de la roadmap sera mise à ce découpage au feu vert.

## Sous-lots (ordre d'exécution)

### 24.1 Onglet « Contrôles » — `/model sonnet`

**Pour l'utilisateur.** Un seul endroit pour tout ce qui cloche, en trois groupes : **« À corriger
avant d'exporter »**, **« À vérifier »**, **« Pour information »**. Chaque ligne dit ce qui ne va pas et
pourquoi, avec un bouton « Voir sur le plan » (et « Corriger » quand c'est sûr, par exemple raccorder
deux murs, déjà possible aujourd'hui). Filtre « Ce niveau / Tout le projet ». La pastille du haut compte
tous les points, plus seulement les murs, et ouvre l'onglet.

**Technique.**
- Module propriétaire (décidé et inscrit au registre en début de sous-lot) : une fonction pure qui
  rassemble `warnings.ts`, `qualityChecks.ts`, `wallContacts.ts`, les contrôles du DQE et les
  identifiants en double, et donne pour chaque point : groupe, phrase, raison, élément, action.
- Les contrôles de Pascal sont essayés sur les plans d'essai ; on ne reprend que ceux qui signalent
  quelque chose que Fabrics ne voit pas encore.
- L'onglet « Contrôles » prend la place de la liste de l'onglet Métrés (`MetresWarningList.tsx`).

**Tests automatiques.** Chaque type de contrôle a sa phrase, sa raison et son groupe (aucun oublié) ;
EDGE-01 donne les lignes attendues (voir les critères du gate) ; aucun contrôle de l'ancienne liste ne
disparaît.

### 24.2 Imports et exports sûrs — `/model opus`

**Pour l'utilisateur.** Un fichier refusé l'est avec une phrase qui dit quoi faire (« Ce fichier IFC
fait 180 Mo ; la limite est 100 Mo. Essayez d'exporter un seul bâtiment. »). Un import IFC long montre
sa progression, peut être annulé et ne fige pas l'écran.

**Technique.**
- Inventaire des entrées (IFC, DXF, images, classeur de prix, projet ouvert ou partagé, sauvegarde
  `.fabrics` de 24.3) et des sorties (CSV, XLSX, PDF, SVG, DXF, IFC), noté dans le rapport.
- D24-7 : limite de l'IFC, contrôle du début de chaque fichier avant lecture, avertissement au-delà de
  30 Mo ; conversion IFC hors du fil principal de la page (Web Worker) si le convertisseur de Pascal le
  permet, sinon progression par étapes.
- D24-9 : formules neutralisées dans les CSV exportés ; échappement des noms dans SVG, DXF et IFC.

**Tests automatiques.** Fichiers piégés, tous refusés sans rien modifier, chacun avec le bon message :
PNG renommé en `.ifc`, IFC tronqué, IFC trop gros (taille simulée), DXF de 25 000 traits, classeur
« bombe de décompression », `.xlsm`, désignation `=HYPERLINK(…)` exportée en CSV.

### 24.3 Ne rien perdre — `/model opus`

**Pour l'utilisateur.**
- Bouton **« Télécharger une sauvegarde »** dans un projet ; **« Restaurer une sauvegarde »** sur
  l'accueil, qui crée toujours une copie « … (restauré le JJ/MM/AAAA) » (D24-3).
- Bouton **« Exporter la bibliothèque »** sur la page des prix : un Excel que « Importer » relit sans
  perte.
- Si un enregistrement est refusé : « Pas enregistré : … » avec « Réessayer » et « Télécharger une
  copie » (D24-8). Le bandeau « Reprendre là où vous en étiez ? » n'apparaît que dans le cas rare d'une
  copie sur l'appareil plus récente que celle du serveur.
- Onglet **« Journal »** du projet et de la bibliothèque : une phrase par événement (D24-4).

**Technique.**
- Format `.fabrics` : archive (avec `fflate`, déjà installé) contenant la scène, les réglages, le devis
  et ses versions, une version de format et une empreinte de contrôle ; lu par les contrôles de 24.2.
  Prix et montants seulement pour un admin de l'espace (D24-3).
- Export de la bibliothèque dans la forme de classeur que l'import de M23 reconnaît.
- `supabase/m24-audit.sql` : table des événements manquants (exports, devis définitif, entrées et
  sorties de membres, restaurations), règles d'accès, durée 1 an ; vérifié par `npm run check:sql`
  avant que l'utilisateur le lance.

**Tests automatiques.** Fermeture brutale pendant la saisie : au plus 1 s perdue ; sauvegarde puis
restauration : mêmes métrés et même DQE au dixième d'Ariary ; aller-retour de la bibliothèque sans
perte ; un non-admin ne trouve aucun prix dans sa sauvegarde ; un export qui échoue en cours de route
ne télécharge rien (D24-9).

### 24.4 Plans d'essai et filet anti-régression — `/model sonnet`

**Pour l'utilisateur.** Rien de visible : la garantie que la suite (dont les optimisations de 24.5) ne
casse rien.

**Technique.**
- Générateur de plans reproductible (même graine = même plan) : 1 000, 5 000 et 10 000 éléments.
- Nouveau plan d'essai : petit immeuble R+3, calculs écrits à la main comme pour HOUSE-01.
- Référence étendue au **PDF** (texte et mise en page de chaque page) et à la **3D** (captures dans
  Chromium, tolérance écrite dans le rapport).
- Tests sur plans tirés au hasard, graine fixe, sans nouvelle bibliothèque : les métrés ne changent
  pas si on réordonne les éléments ou si on déplace tout le plan.
- Épreuves : HOUSE-01, villa ROOMIT, petit immeuble, modèles abîmés, IFC extérieurs (D24-5, sur la
  machine seulement, jamais dans le dépôt).

**Tests automatiques.** Une modification volontaire d'un mur fait échouer la comparaison ; une
modification sans effet la laisse passer.

### 24.5 Performance — `/model opus`

**Pour l'utilisateur.** L'éditeur reste fluide sur un grand projet ; barre de progression sur tout
export de plus d'une seconde.

**Technique.**
- Mesures face à D24-1 sur les plans de 24.4, dans Chromium, sur le PC et au processeur ralenti ×4
  (D24-2).
- Optimisations ciblées sur les seuils manqués. Les idées « lot 2 Alléger » et « lot 3 Fluidité » ne
  sont reprises que si elles servent un seuil.
- Métrés et DQE recalculés sans bloquer la saisie.
- `npm run check:perf` : mesures détaillées et tableau. Dans `check:all`, seulement le plan de 1 000
  éléments avec une marge ×2, pour éviter les échecs dus à une machine chargée (comme le test
  « 600 murs », qui disparaît).

**Tests automatiques.** Tableau des mesures dans le rapport ; seuils atteints, ou écarts montrés à
l'utilisateur avec la mesure et une proposition.

### 24.6 Dossier de revue et gate G7 — `/model sonnet`

- Un seul dossier pour G3, G4 et G7 (D24-6) : PDF des plans, métrés, DQE et IFC de HOUSE-01 et du petit
  immeuble, grille simple à cocher, limites connues.
- `docs/phases/M24-report.md`, `docs/capabilities.md`, `docs/regression-checklist.md`, roadmap (section
  M24 remise à ce découpage) et `docs/PROGRESS.md`.
- G7 reste ouvert tant que la revue n'est pas faite (comme G3 et G4) ; cela ne bloque pas M25.

## Ce que l'utilisateur essaiera à la fin

1. Lancer `supabase/m24-audit.sql` dans Supabase (pas à pas fourni).
2. Ouvrir EDGE-01 : l'onglet « Contrôles » montre chaque cas, avec « Voir sur le plan ».
3. Importer un fichier trop gros ou abîmé : refus clair, rien n'est cassé.
4. Fermer l'onglet en pleine saisie, rouvrir : le travail est là.
5. Télécharger une sauvegarde, la restaurer : une copie apparaît, l'original est intact, les totaux du
   DQE sont les mêmes.
6. Ouvrir le plan de 5 000 éléments : il reste fluide ; exporter en PDF avec la barre de progression.
7. Lire le journal du projet et celui de la bibliothèque.

## Critères d'acceptation (gate G7)

- Seuils D24-1 atteints sur le PC, ou chaque écart montré à l'utilisateur et accepté par lui.
- EDGE-01 (7 cas) : fenêtre hors du mur, ouvertures qui se chevauchent, mur de hauteur nulle et mur
  sans matériau apparaissent dans « Contrôles » avec le bon groupe ; les identifiants en double donnent
  un message clair à l'ouverture et une ligne dans « Contrôles » ; le placement IFC imbriqué apparaît
  dans le bilan d'import, et dans « Contrôles » si un élément est exclu ; les unités mélangées sont une
  règle de saisie (« 3,5 m », « 3500 », « 350 cm » donnent 3500 mm), vérifiée par test, sans rien à
  signaler. (Précision du critère de la roadmap « chaque cas est signalé dans le panneau ».)
- Tout fichier piégé est refusé avant lecture avec une phrase claire ; rien n'est exécuté ; aucun
  projet n'est modifié.
- Un export interrompu ne télécharge rien ; une sauvegarde restaurée redonne les mêmes métrés et le
  même DQE.
- Revue humaine documentée, ou G7 laissé ouvert jusqu'à elle.

## Ce que seul l'utilisateur peut faire

- Lancer le script SQL de 24.3 dans Supabase.
- Trouver les relecteurs (architecte ou dessinateur BIM, métreur indépendant) ; Claude prépare le
  dossier mais ne peut pas les remplacer.
- Facultatif : fournir un IFC venu d'un autre logiciel pour les épreuves.

## Risques

| Risque | Parade |
|---|---|
| Seuil de 10 000 éléments hors de portée dans le jalon | Mesurer d'abord, montrer l'écart et une proposition ; jamais de seuil changé en silence |
| Captures 3D qui changent d'une machine à l'autre (fausses alertes) | Tolérance écrite, références prises sur la même machine, comparaison des métrés en premier |
| Convertisseur IFC de Pascal impossible à sortir du fil principal | Progression par étapes et limite de taille ; noté dans le rapport |
| Revue humaine longue à organiser | Dossier prêt dès 24.6 ; G7 reste ouvert sans bloquer M25 |

## Hors périmètre

- Assistant IA (M25).
- Essai dans Revit (licence nécessaire, noté dans les idées).
- Relecture des codes Uniclass par un praticien BIM (idées).
