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

1. **Arrondi : au centaine d'Ariary supérieure (100 Ar)**. Précisé le 2026-11-24 : « on arrondit à 100 Ar
   au-dessus ». Exemple de l'utilisateur : 153 555 Ar → **153 600 Ar**. Un montant déjà multiple de 100 Ar
   ne change pas. Ce point remplace la première réponse « à l'Ar entier ». Choix de Claude à confirmer :
   l'arrondi se fait **ligne par ligne**, puis les lignes sont additionnées (le total est donc la somme
   des lignes arrondies).
2. **Décimale : sur les prix unitaires seulement, une décimale** (précisé le 2026-11-24 : « prix unitaires
   seulement, pas sur la quantité »). Les quantités ne reçoivent pas cette règle. Les montants restent
   arrondis à la centaine d'Ar supérieure (point 1).

Arrondi **ligne par ligne**, confirmé le 2026-11-24 (« par ligne »).
3. **Licence : classeur acheté par l'utilisateur, destiné à un usage professionnel.** Il peut être
   utilisé dans l'application pour son compte. Toute redistribution à d'autres personnes exige une
   vérification de la licence (CLAUDE.md, « Licences »).

## Points ouverts

Aucun point bloquant pour 23.1. Les décisions de 23.0 restant à prendre sont celles du point D23-3
(règles de prix de vente), reportées par l'utilisateur.

## D23-7 · Bibliothèque de prix partagée (décidé le 2026-11-24)

- **Une bibliothèque appartient à un espace** (équipe ou entreprise), pas à un compte personnel.
- **Deux rôles** :
  - **Admin** : seul rôle qui modifie les prix ; gère aussi les membres.
  - **Membre** : consulte tous les prix, sans les modifier.
- **Tout le monde voit les prix** de l'espace, y compris les membres.
- **Un membre qui quitte l'espace** : ses modifications restent dans la bibliothèque, avec son nom dans l'historique.
- **Pas de copie personnelle** : un membre ne peut pas dupliquer la bibliothèque pour travailler à part.
- **Historique par ligne** : chaque modification garde son auteur et sa date ; l'ancienne valeur reste consultable.

Conséquence : la proposition précédente (« les invités voient les quantités sans les prix ») ne s'applique
pas aux prix de la bibliothèque de l'espace. Les règles pour les projets partagés hors espace restent à décider.

## D23-8 · Devis partagé hors de l'espace (décidé le 2026-11-24, option A)

- Une personne **hors de l'espace** qui reçoit un projet voit les **quantités, les postes et les descriptions**, **sans les prix ni les montants**.
- Un montant ne sort de l'application que par un **export PDF ou XLSX** créé par un **admin** de l'espace. L'export porte la date des prix.
- Le **lien public en lecture** n'affiche jamais de prix.

Point non tranché par cette réponse : le devis appartient-il à l'espace (proposition : oui, pour qu'un départ ne bloque pas les montants) ou à la personne qui l'a créé ? À confirmer avant 23.5.

## D23-9 · Propriétaire du devis (décidé le 2026-11-24)

- **Le devis appartient à l'espace**, et non à la personne qui l'a créé. Un départ ne bloque donc ni les montants ni les exports.
- Les admins de l'espace peuvent gérer les devis ; les membres voient les devis de l'espace selon les règles de D23-7 et D23-8.

## D23-10 · Base de calcul HT, TVA à la fin (validé le 2026-11-24)

- **Le TTC livré chantier est conservé tel qu'il est dans le classeur** (valeur source, pour la vérification).
- **Le prix HT est calculé à partir du TTC** (÷ 1,20), avec la règle d'arrondi de D23-5, en un seul endroit.
- **Tous les calculs de devis se font en HT**. La TVA est ajoutée à la fin.
- **Le taux de TVA (20 %) est un réglage unique**, modifiable.

Modifie D23-2 : le prix de référence de calcul est désormais le HT dérivé du TTC livré chantier.
D23-3 (règles de prix de vente) reste ouvert : ni la proposition A, B ou C, ni le choix entre 1,1025 et 1,10 n'ont été tranchés.

## D23-3 · Règles de prix de vente (décidé le 2026-11-24 : option A)

- **Prix de vente HT = débours sec HT × K1.** Le débours sec est la somme des matériaux, du matériel et de la main-d'œuvre, en HT (D23-10).
- **K1 se décompose en trois parts réglables** par un admin de l'espace : frais généraux (A1), bénéfice et aléas (A2), frais proportionnels à la TVA (A3). Les valeurs de départ sont celles du classeur (A1 = 5 %, A2 = 5 %, A3 = 0 %), marquées « valeurs du classeur, à confirmer ».
- **Cumul des parts : multiplication**, soit K1 = (1 + A1) × (1 + A2) × (1 + A3) = 1,1025 avec les valeurs du classeur. **Proposition retenue par défaut, à confirmer** : la réponse explicite n'a pas encore été donnée.
- **Le DQE affiche chaque part** (débours, frais généraux, bénéfice, aléas, prix de vente HT, TVA, prix TTC).
- **Aucune marge n'est imposée** : les pourcentages restent à la main de l'admin.
