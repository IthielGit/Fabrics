# M23 — Rapport de fin de jalon (gate G6)

Rédigé le 2026-11-27, à la fin de 23.8. Sous-lots 23.0 à 23.8 faits du 2026-11-24 au 2026-11-27, d'une
traite (essai de l'utilisateur à la fin). Décisions : `M23-decisions.md` (D23-1 à D23-19). Plan :
`M23-plan.md`. **En attente de l'essai de l'utilisateur** (voir « Ce que l'utilisateur doit essayer »).

## Critères du gate G6

| Critère | Preuve automatique | Reste à faire |
|---|---|---|
| 13,11 m² × 45 000,0 Ar/m² (prix d'exemple) = 589 950 Ar → 590 000 Ar HT | `pricing/gateG6.test.ts` (1) : un mur de 4 370 × 3 000 mm passé par la scène Pascal donne 13,11 m², 590 000 Ar HT, TVA 118 000 Ar, TTC 708 000 Ar ; `estimate.test.ts` | — |
| Même révision + même bordereau = même DQE | `gateG6.test.ts` (2) : deux calculs sur deux scènes reconstruites → devis figés identiques, même empreinte ; un prix changé → empreinte différente | — |
| Un poste sans prix empêche de marquer le devis comme définitif | `gateG6.test.ts` (3) : refus par le code (`EstimateNotFinalError`) ; refus par la base (contrainte de `estimate_versions`, banc d'essai PGlite) ; bouton « Figer comme définitif » désactivé | — |
| Totaux identiques à l'écran, en XLSX et en PDF ; chaque poste affiche sa source et son unité | `gateG6.test.ts` (4) et `estimateTables.test.ts` : valeurs des cellules XLSX = totaux du calcul, chaque total écrit en entier dans le PDF ; origine (quantité du métré, élément, règle) et unité sur chaque ligne | **Essai de l'utilisateur** : exporter un devis et comparer (voir plus bas) |

Vérifié aussi dans Chromium (mode local, 2026-11-27), sur la maison d'exemple R+1 avec la bibliothèque
importée du classeur de l'utilisateur et une règle « murs → CAT-05-001 » : 243,68 m² × 40 262,0 Ar =
9 811 100 Ar HT, TVA 1 962 300 Ar, TTC 11 773 400 Ar, **identiques à l'écran, dans le XLSX (relu par un
lecteur indépendant) et dans le PDF**.

## Ce que M23 a livré

- **23.0** Décisions D23-1 à D23-19 : Ariary, TTC livré chantier → HT ÷ 1,20, TVA 20 % à la fin,
  arrondi à la centaine supérieure ligne par ligne, prix brut = débours sec, K1 réglé par devis et
  appliqué dans chaque prix, matériaux « sans TVA », quantités du DQE dans l'unité du poste.
- **23.1** Espaces (admin / membre, invitations par lien, départ sans effacement), bibliothèque de
  prix (matériaux, matériel, main-d'œuvre, postes avec sous-détail), historique par ligne, page `/prix`.
  Montants exacts : entiers en dixièmes d'Ariary, jamais de nombre à virgule flottante.
- **23.2** Import du classeur « Expert BTP » (XLSX, lecteur maison sans dépendance) et CSV ; rapport de
  lecture (bloquant / à vérifier / information) ; plan d'import appliqué d'un bloc, avec contrôle de
  version ; lignes saisies à la main jamais touchées ; journal des imports. Classeur réel de
  l'utilisateur : 903 matériaux, 86 lignes de matériel, 20 de main-d'œuvre, 320 postes, tous chiffrés
  sauf 4 matériaux à 0 Ar.
- **23.3** Règles de l'espace « quantité du métré + filtre → poste + perte », sans double comptage,
  unités contrôlées ; onglet « Règles ».
- **23.4** Calcul exact du DQE (`estimate.ts`) et chaîne complète métré → règles → montants.
- **23.5** Devis d'un projet (propriété de l'espace), versions figées immuables, empreinte,
  comparaison, résumé sans prix pour une personne hors de l'espace.
- **23.6** Onglet « DQE » de l'éditeur : K1, points à vérifier, lignes par lot avec origine et
  sélection dans le plan, correction « Retirer de ce poste », totaux, décomposition, versions.
- **23.7** Exports XLSX et PDF par les exportateurs des métrés (en-tête, cartouche, synthèse, détail,
  décomposition, hypothèses, date des prix), réservés aux admins. Correctif de la mise en page PDF
  commune : un total ou un montant n'est plus jamais tronqué.
- **23.8** Test du gate (`gateG6.test.ts`), ce rapport, liste de non-régression.

## Base de données (`supabase/m23-pricing.sql`)

Tables : `workspaces`, `workspace_members`, `workspace_invites`, `price_libraries`, `price_items`,
`work_items`, `price_history`, `price_import_batches`, `pricing_rules`, `estimates`,
`estimate_versions`. RLS sur chacune : lecture par les membres présents de l'espace, écriture par les
admins ; historique, journal et versions écrits seulement par la base. **Banc d'essai PGlite** (Postgres
dans Node, avec le schéma complet de l'application) : **60 contrôles sur 60** (accès des admins, des
membres et des personnes extérieures, import atomique, version dépassée refusée, règles, versions
immuables, définitif refusé sans prix, résumé sans prix). Le banc vit hors du dépôt (voir « Idées »).

## Ce que l'utilisateur doit essayer

1. **Lancer le script SQL dans Supabase** (une fois) : Supabase → SQL Editor → New query → coller tout
   `supabase/m23-pricing.sql` → Run. Il peut être relancé sans danger.
2. `npm run dev`, se connecter, cliquer l'icône **pièces** en haut de l'accueil (Bibliothèque de prix),
   créer un espace, cliquer **Importer**, choisir `tmp/prix/Biblio de prix.xlsx`, lire le rapport, puis
   « Appliquer l'import (version 2) ». Vérifier quelques prix (ex. sable de rivière : « sans TVA »).
3. Onglet **Membres** : créer un lien « membre », l'ouvrir avec un second compte : il voit les prix sans
   pouvoir les modifier.
4. Onglet **Règles** : ajouter 2 ou 3 règles (murs → maçonnerie, revêtement de sol → carrelage,
   portes → menuiserie).
5. Ouvrir un projet Plan, onglet **DQE** : vérifier les lignes, régler K1, cliquer une ligne puis
   « Sélectionner » (l'élément est surligné dans le plan), « Figer une version ».
6. Modifier un mur, revenir au DQE : « a changé » s'affiche ; « Comparer avec l'état actuel ».
7. **Excel (.xlsx)** et **PDF** : ouvrir les deux fichiers et vérifier que Total HT, TVA et TTC sont les
   mêmes qu'à l'écran, et que la date des prix figure dans l'en-tête.

## Limites et points ouverts

- Les gates **G3** et **G4** restent ouverts (revue d'un professionnel, revue d'un métreur) : le DQE
  hérite de ces réserves ; tout devis destiné à un engagement réel doit être relu par un métreur ou un
  économiste (écrit dans les hypothèses de chaque export).
- Lignes « provisoires » : quantités de métré non validées (ex. raccords de trois murs, M21).
- Correction à la main limitée à « Retirer de ce poste » dans l'écran (la logique « changer de poste »
  et « ajouter une ligne » existe).
- Les 5 messages React « unmount a root » de la console de l'éditeur existaient avant M23.
- Le banc d'essai SQL n'est pas dans `npm run check:all` (dépendance de développement à décider).
