# M23 · 23.0 — Décisions (bibliothèque de prix et DQE)

Source : classeur `tmp/prix/Biblio de prix.xlsx` (Expert BTP PRO EXCEL, date de mise à jour 2026-10-01)
et son guide PDF. Décisions de l'utilisateur le 2026-11-24. Aucun code de M23 n'est commencé : M21 et
M22 ne sont pas encore fermés.

## D23-1 · Devise — **retenu : Ariary (Ar)**

Projet à Madagascar : tous les montants sont en Ar. L'exemple de la roadmap (45 €/m²) est à remplacer
par un exemple en Ar à la fermeture de 23.0.

## D23-2 · Prix utilisé — **retenu : « PRIX TTC LIVRÉ SUR CHANTIER »** (feuille MTX)

Les prix d'entrée sont TTC et livrés sur chantier. Les colonnes « PU HT Antananarivo » et « PU TTC
Antananarivo » ne sont pas utilisées par le DQE.

## D23-3 · Règles de prix de vente du classeur (SDP, coefficient K1, marge) — **reporté**

Décision de l'utilisateur : « on va voir après ». Le classeur calcule aussi le prix de revient et le
prix de vente (sous-détails, K1, marge). Rien n'est repris de ces règles pour l'instant.

## D23-4 · Métré — **retenu : alimenté par Fabrics**

Les quantités viennent du modèle et du quantitatif de M21, jamais de la feuille MÉTRÉ du classeur, qui
n'est pas reprise.

## D23-5 · Anomalies du classeur — **retenu : à corriger**

Interprétation à confirmer : le fichier d'origine n'est jamais modifié. À l'import, l'application
normalise les valeurs et signale chaque correction dans le rapport d'import. Anomalies relevées :

- nombres à très longues décimales (ex. `208333.33…`) : arrondi à une règle unique (voir point ouvert 1) ;
- liens mal écrits (`VOIR_SPD_003` au lieu de `VOIR_SDP_003`, espaces parasites dans `🔗 VOIR_SDP_004`).

## D23-6 · TVA — **retenu : 20 %** (Madagascar)

Les prix saisis étant TTC, le DQE doit montrer le HT et la TVA, calculés à partir du TTC (voir point
ouvert 1).

## Réponses de l'utilisateur (2026-11-24)

1. **Arrondi : au-dessus, à l'Ar entier** (« arrondit à ,00 au-dessus »). Choix de Claude à confirmer :
   l'arrondi se fait **ligne par ligne**, puis les lignes sont additionnées (le total est donc la somme
   des lignes arrondies).
2. **Décimale : une décimale** (« décimale »). **Point à préciser** : l'arrondi à l'Ar entier et une
   décimale sur les montants se contredisent. Question ouverte : une décimale sur les **prix unitaires
   et les quantités**, et les montants arrondis à l'Ar entier ?
3. **Licence : classeur acheté par l'utilisateur, destiné à un usage professionnel.** Il peut être
   utilisé dans l'application pour son compte. Toute redistribution à d'autres personnes exige une
   vérification de la licence (CLAUDE.md, « Licences »).

## Point ouvert (à trancher avant le sous-lot 23.1)

- **Décimale** : une décimale sur les prix unitaires et quantités seulement, ou ailleurs ?
