# M23 — Plan du jalon (bibliothèque de prix et DQE, gate G6)

Proposé le 2026-11-26, **en attente du feu vert de l'utilisateur**. Il remplace la proposition limitée à
23.1 du 2026-11-24 (ses questions 1 à 5 sont tranchées par D23-11 à D23-15). Décisions de référence :
`docs/phases/M23-decisions.md`.

Façon de faire (comme M21 et M22) : tout le jalon d'une traite, un commit et un `git push origin pascal`
par sous-lot, essai de l'utilisateur dans le navigateur à la fin. Chaque sous-lot passe `npm run build`,
`npm run lint`, `npm test` et `npm run check:all`.

## Principes communs

- **Montants exacts** : tout prix et tout montant est un entier en **dixièmes d'Ariary** (`bigint` en
  TypeScript, `bigint` en base). Jamais de nombre à virgule flottante pour un prix ou un montant. Les
  quantités de M21 restent celles du quantitatif ; leur produit avec un prix passe par une seule
  fonction d'arrondi documentée.
- **Arrondis (D23-5)** : prix unitaires à une décimale ; montant de chaque ligne arrondi à la centaine
  d'Ar supérieure ; totaux = somme des lignes arrondies. HT = TTC ÷ 1,20 (taux réglable, D23-10).
- **Aucun prix inventé** : un poste sans prix reste sans prix, signalé, et bloque le devis « définitif ».
- **Données de test synthétiques** : aucun prix réel du classeur n'entre dans le dépôt (`tmp/` est
  ignoré par git).
- Logique dans `src/features/pricing/` en fonctions pures testées (Vitest) ; aucun calcul dans un
  composant React. Textes d'interface dans `src/i18n/fr.ts`.

## Sous-lots

### 23.1 Espaces et bibliothèque de prix — `/model opus`

- `supabase/m23-pricing.sql` (à lancer par l'utilisateur dans Supabase) : `workspaces`,
  `workspace_members` (rôles `admin` / `member`, `left_at`), `price_libraries` (version, devise `MGA`,
  taux de TVA), `price_items` (`material`, `equipment`, `labour`), `work_items` (postes `CAT-xx-yyy`,
  débours sec), `work_item_components` (composition du sous-détail), `price_item_history`. RLS sur
  chaque table : lecture par les membres présents, écriture par les admins (D23-7).
- `src/features/pricing/money.ts` : dixièmes d'Ar, lecture d'une saisie, affichage (« 1 234 567,8 Ar »),
  arrondi à la centaine supérieure, HT depuis TTC.
- `src/features/pricing/model.ts`, `validate.ts` : types et contrôle d'une ligne (unité, base de prix,
  devise, prix ≥ 0), chaque erreur nommée.
- `src/features/pricing/repository.ts` (+ version locale pour le mode sans compte et les tests).
- `src/features/workspaces/` : créer un espace, inviter ou retirer un membre, rôle.
- Page « Bibliothèque de prix » (`src/pages/PriceLibraryPage.tsx` et ses composants) : espace courant,
  membres, liste des prix avec recherche et filtre par type ; ajout, modification et suppression par un
  admin ; lecture seule pour un membre ; historique d'une ligne.

### 23.2 Import du classeur — `/model sonnet`

- `src/features/pricing/xlsxRead.ts` : lecture XLSX avec `fflate` (déjà installé) et l'analyseur XML du
  navigateur. **Aucune nouvelle dépendance.**
- `src/features/pricing/importWorkbook.ts` : feuilles MTX (TTC livré → HT), MTL et MO (HT, D23-14),
  BIBLIOTHEQUE_TRAVAUX et SDP (postes, composition, débours sec, D23-12). Import CSV simple en plus.
- Rapport d'import : lignes lues, ignorées, corrigées (longues décimales, liens `VOIR_SPD`, espaces),
  écarts entre le « prix de référence » du classeur et le débours × K, unités inconnues. Rien n'est
  corrigé en silence. La version de la bibliothèque prend +1.

### 23.3 Règles de lien élément → postes — `/model opus`

- `src/features/pricing/mapping.ts` : règle = type d'élément + matériau (+ épaisseur) → un ou plusieurs
  postes, chacun avec la quantité de M21 utilisée (surface, volume, longueur, nombre) et un coefficient
  de perte (0 % par défaut). Correction à la main d'un élément dans un projet.
- Contrôle « pas de double comptage » : un même élément ne compte qu'une fois dans un même poste.
- Écran des règles dans la page Bibliothèque (admins).

### 23.4 Calcul des montants — `/model opus`

- `src/features/pricing/estimate.ts` : quantité × prix brut HT → débours ; × K1 du devis (A1, A2, A3
  réglés dans le devis, valeurs du classeur proposées comme exemple, D23-13) → prix de vente HT ; TVA ;
  TTC. Chaque ligne garde sa trace : éléments sources, règle, quantité, prix, version de la bibliothèque.
- Tests de référence : l'exemple du gate G6 (590 000 Ar HT), arrondis aux limites, K1 = 1,1025.

### 23.5 Versions du devis — `/model opus`

- Tables `estimates` et `estimate_versions` (dans le même script SQL, propriété de l'espace, D23-9).
- Devis figé = copie des quantités et des prix utilisés + version du modèle + version de la
  bibliothèque. Recalcul après modification du plan ; comparaison de deux versions (lignes ajoutées,
  retirées, quantité ou prix changé, écart de montant).
- Statut « brouillon » / « définitif » : impossible de passer en définitif s'il reste un poste sans prix.

### 23.6 Panneau DQE — `/model sonnet`

- Panneau dans l'éditeur des projets Plan, à côté des métrés : lots (catégories), postes, quantité,
  unité, prix unitaire, montant, origine (clic → éléments surlignés dans le plan), couverture (éléments
  sans poste), avertissements, réglage de K1 et de la TVA, versions.
- Personnes hors de l'espace : quantités, postes et descriptions **sans prix ni montant** (D23-8).

### 23.7 Exports — `/model sonnet`

- XLSX (même méthode que `metresXlsx.ts`) et PDF (même méthode que `metresPdf.ts`) : en-tête, cartouche,
  synthèse par lot, détail, hypothèses (D23-14, arrondis, K1), date des prix. Export réservé aux admins
  de l'espace.

### 23.8 Contrôles et gate G6 — `/model opus`

- Postes sans prix bloquants ; totaux identiques à l'écran, en XLSX et en PDF (test automatique) ; même
  révision + même bibliothèque = même DQE ; ajout à `npm run check:all`.
- `docs/phases/M23-report.md`, `docs/capabilities.md` (capacité « Bibliothèque de prix, DQE » passée de
  ABSENT à présente), `docs/regression-checklist.md`, roadmap et PROGRESS.

## Ce que l'utilisateur testera à la fin

1. Lancer `supabase/m23-pricing.sql` dans Supabase (pas à pas fourni).
2. Créer un espace, importer `Biblio de prix.xlsx`, lire le rapport d'import.
3. Inviter un second compte comme membre : il voit les prix sans pouvoir les modifier.
4. Définir quelques règles (murs, dalles, peinture), ouvrir un projet Plan, voir le DQE, changer K1.
5. Figer une version, modifier un mur, recalculer, comparer les deux versions.
6. Exporter en XLSX et en PDF et vérifier que les totaux sont les mêmes qu'à l'écran.

## Risques

- Le classeur peut avoir des sous-détails de forme irrégulière (lignes vides, totaux décalés) : chaque
  bloc mal lu est signalé dans le rapport, jamais deviné.
- Les quantités de M21 dont le statut est « provisoire » (raccords de trois murs) donnent des montants
  provisoires, marqués comme tels.
- Le gate G4 (revue d'un métreur) est encore ouvert : le DQE hérite de cette réserve.
