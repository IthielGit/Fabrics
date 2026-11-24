# M23 · 23.1 — Bibliothèque de prix (proposition, en attente du feu vert)

Proposé le 2026-11-24. **Rien n'est codé.** M21 et M22 ne sont pas encore fermés : ce plan attend leur
clôture avant le début du sous-lot. Décisions de référence : `docs/phases/M23-decisions.md` (23.0).

## Ce que 23.1 doit produire

La bibliothèque de prix propre à l'utilisateur, en base (Supabase, RLS activé), avec un modèle de
données et des fonctions pures testées. **Pas d'import de fichier** (c'est 23.2) et **pas de calcul de
montant** (c'est 23.4). 23.1 pose les fondations.

## Ce que contient le classeur (à partir de la structure relevée)

| Feuille | Colonnes utiles | Base de prix |
|---|---|---|
| MTX (matériaux) | code, catégorie, désignation, unité, PU HT Tana, PU TTC Tana, frais de transport, **PU TTC livré chantier**, fournisseur | TTC livré chantier (décision D23-2) |
| MTL et outillage | désignation, unité, prix HT Tana, durée d'amortissement, location par jour / par heure, carburant par jour, fournisseur | **HT Tana** : base différente, à décider |
| MO (main-d'œuvre) | désignation, MO par mois / semaine / jour / heure | base non précisée, à décider |
| BIBLIOTHEQUE_TRAVAUX | code, catégorie, désignation, unité, prix de référence, lien vers SDP | prix calculés par les SDP : **reportés** (D23-3) |

## Proposition de modèle (tables Supabase)

- **`price_libraries`** : `id`, `owner_id` (utilisateur), `name`, `version` (entier, +1 à chaque import),
  `currency` = `'MGA'`, `vat_rate` = 20, `created_at`.
- **`price_items`** : `id`, `library_id`, `owner_id`, `kind` (`material`, `equipment`, `labour`,
  `work` — `work` réservé à 23.3), `code`, `category`, `designation`, `unit`, `unit_price_ar`
  (**entier en dixièmes d'Ariary**, pour une décimale sans virgule flottante, décision 2026-11-24),
  `price_basis` (`ttc_delivered`, `ht_tana`, `ttc_tana`, `unspecified`), `supplier`, `region`,
  `effective_date`, `source_row` (ligne d'origine, pour la traçabilité).
- **`price_import_batches`** (préparée ici, utilisée en 23.2) : nom du fichier, empreinte SHA-256,
  date, nombre de lignes, avertissements.

Politique RLS : chaque ligne n'est lisible et modifiable que par son `owner_id` = `auth.uid()`. Aucune
clé `service_role` côté client (CLAUDE.md, « Sécurité »). Le script SQL est fourni dans
`supabase/m23-pricing.sql` ; tu le lances toi-même dans Supabase, comme pour M16 et M18.

## Code proposé (fonctions pures, testées avec Vitest)

- `src/features/pricing/model.ts` : types, `unit_price_ar` en dixièmes, conversion vers l'affichage
  (un chiffre après la virgule, jamais de flottant pour un montant).
- `src/features/pricing/validate.ts` : contrôle d'une ligne (code non vide, unité connue, prix ≥ 0,
  devise MGA, base de prix renseignée). Chaque erreur est nommée, rien n'est corrigé en silence.
- `src/features/pricing/repository.ts` : lecture et écriture de la bibliothèque (même principe que
  `LocalRepository` et `SupabaseRepository` existants).

Tests : **données synthétiques uniquement** (aucun prix réel du classeur n'entre dans le dépôt, le
dossier `tmp/prix/` restant ignoré par git).

## Ce que tu pourras tester dans le navigateur

Une page « Bibliothèque de prix » minimale : créer une bibliothèque, ajouter, modifier et supprimer des
lignes (matériau, matériel, main-d'œuvre), voir la version. Pas de montant calculé, pas d'import.

## Critères d'acceptation proposés (23.1)

- Une ligne de prix ne peut être créée sans unité, sans base de prix ni devise.
- Un utilisateur ne voit jamais les lignes d'un autre (test RLS avec deux comptes).
- Aucun prix n'est stocké en nombre à virgule flottante.
- Le prix saisi avec une décimale est relu à l'identique.

## Questions à trancher avant le feu vert

1. **MTL (matériel) : base HT Tana ou TTC livré ?** Le classeur donne seulement un prix HT Tana. Proposition :
   stocker tel quel avec `price_basis = ht_tana`, et ne pas l'utiliser dans un devis tant qu'une base
   TTC livré n'est pas définie.
2. **MO (main-d'œuvre) : base de prix ?** Le classeur ne dit pas si ces montants incluent la TVA.
   Même proposition : `unspecified`, bloquant pour le devis tant que ce n'est pas précisé.
3. **Travaux (BIBLIOTHEQUE_TRAVAUX) : garder les prix de référence du classeur en 23.1 ?** Proposition :
   non, les postes de travaux arrivent en 23.3 avec leurs règles.
4. **Région** : que veut dire « région » pour toi ? Proposition : la zone de livraison (Antananarivo,
   autre), à saisir par ligne.
5. **Version** : une version par import (proposition), ou une version par modification ?

## Modèle de sous-lot

`/model opus` (décision de la roadmap pour 23.1).
