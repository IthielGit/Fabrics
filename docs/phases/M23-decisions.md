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

## D23-3 · Cumul des parts de K1 : multiplication (confirmé le 2026-11-24)

- **K1 = (1 + A1) × (1 + A2) × (1 + A3)**, soit 1,1025 avec les valeurs du classeur.
- Le point « à confirmer » ci-dessus est levé.

## Clôture de 23.0 (réponses de l'utilisateur le 2026-11-26)

M22 étant fermé (gate G5 validé le 2026-11-24), l'utilisateur a demandé de commencer M23 (« 1 », le
2026-11-26). Les décisions ci-dessous ferment 23.0.

### D23-11 · Nomenclature des postes — **retenu : postes du classeur**

Les postes de travaux de la feuille BIBLIOTHEQUE_TRAVAUX (codes `CAT-xx-yyy`, catégorie, désignation,
unité) sont importés, **avec leur sous-détail** (feuille SDP : matériel, matériaux, main-d'œuvre,
quantités, rendement). Un admin de l'espace peut ensuite ajouter, modifier ou retirer des postes dans
l'application.

### D23-12 · Prix d'un poste — **retenu : prix brut (débours sec HT)**

Réponse de l'utilisateur : « je veux un prix brut, l'admin peut faire des mises à jour dans
l'application ou en réimportant ». Constat dans le classeur : le « prix de référence » contient déjà le
coefficient du sous-détail (SDP-001 : débours sec 7 844 766,67 Ar × K = 1,1 = 8 629 243 Ar, arrondi à
8 629 300 Ar). Donc :

- **Le prix d'un poste est son débours sec HT** (ligne « Total » du sous-détail : MTL + MTX + MO), avant
  tout coefficient, avec une décimale (D23-5).
- Ce prix est **enregistré** dans la bibliothèque. Il change seulement quand un admin le modifie dans
  l'application ou réimporte le classeur. Il n'est **pas recalculé tout seul** quand le prix d'un
  matériau change. La composition du sous-détail est conservée et affichée, pour la traçabilité.
- Le coefficient K du sous-détail (1,1) et le « prix de référence » ne sont pas utilisés ; le rapport
  d'import les mentionne pour information.

### D23-13 · K1 réglé par projet — **amende D23-3**

« Le coefficient K1 est dans l'Excel à titre d'exemple, on pourra modifier les pourcentages dans les
projets réels. » Les parts A1, A2 et A3 se règlent **dans chaque devis** (par un admin de l'espace). Les
valeurs du classeur (5 %, 5 %, 0 %) servent de **valeurs de départ**, affichées comme « exemple ». La
règle de cumul ne change pas : K1 = (1 + A1) × (1 + A2) × (1 + A3).

### D23-14 · Matériel et main-d'œuvre — **retenu : en HT**

Matériel (MTL, « prix HT Tana ») : utilisé tel quel en HT. Main-d'œuvre (MO) : traitée en HT (les
salaires ne portent pas de TVA). Hypothèse écrite dans le rapport d'import et dans les hypothèses du DQE.

### D23-15 · Lien élément → poste — **retenu : règles de l'espace**

Un admin définit des règles « type d'élément + matériau (+ épaisseur si utile) → un ou plusieurs postes
+ quantité de M21 utilisée ». Tous les projets de l'espace les appliquent. Dans un projet, on peut
corriger le poste d'un élément à la main ; la correction est visible et tracée.

### Choix par défaut de Claude (à contester au feu vert du plan)

- **Région** (question 4 de 23.1) : texte libre par ligne, « Antananarivo » par défaut.
- **Version** (question 5 de 23.1) : la bibliothèque prend une version de plus à chaque import ; les
  modifications à la main sont tracées ligne par ligne (D23-7). Un DQE figé garde une copie des prix
  utilisés (23.5).
- **Travaux** (question 3 de 23.1) : remplacée par D23-11 et D23-12.
- **Anomalies du classeur** (D23-5) : le fichier n'est jamais modifié ; l'import normalise et signale
  chaque correction dans le rapport.
- **Pertes** : les quantités des sous-détails les contiennent déjà. Une règle de lien peut ajouter un
  coefficient de perte sur la quantité (0 % par défaut, toujours affiché).
- **Exemple du gate G6 en Ariary** : 13,11 m² × 45 000,0 Ar/m² HT = 589 950 Ar, arrondi à la centaine
  supérieure : **590 000 Ar HT**.
