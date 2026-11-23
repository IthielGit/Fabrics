# M20 · Liste de contrôle pour la revue d'un professionnel du bâtiment (gate G3)

À remplir par un architecte ou un ingénieur, sur les feuilles **imprimées à 100 %** (« Taille réelle »,
jamais « Ajuster à la page »). Cas de revue : un projet réel de l'utilisateur, ou l'exemple « maison à
étage » de l'application avec une toiture ajoutée dans Pascal. L'exemple **ROOMIT** (RDC, R+1, toiture),
comparé à la référence `Villa ROOMIT_B.pdf` (pages 5, 6 et 7), est vérifié par les tests automatiques ;
ses PDF peuvent être produits pour la revue avec `tmp/m20-dev/renderSheet.test.ts`.

Pour chaque ligne, cocher **Oui** ou **Non** et noter la remarque. Tout « Non » sur une ligne marquée
**(bloquant)** empêche de valider le gate G3.

## Préparer les feuilles

1. Ouvrir le projet à revoir, puis **Vues**.
2. Exporter en PDF, en **A2 paysage à 1:50** : Plan de niveau RDC, Plan de niveau R+1, Plan de toiture R+1,
   une façade et une coupe. Pour les plans de niveau, régler la cotation sur **Exécution**.
3. Exporter le Plan de niveau R+1 une fois à 1:100 (A3) et une fois à 1:200 (A4).
4. Imprimer à 100 %.

## A. Exactitude (règle graduée)

| # | Contrôle | Oui | Non | Remarque |
|---|---|---|---|---|
| A1 | **(bloquant)** À 1:50, une cote de 4500 mm mesure 90 mm à la règle | | | |
| A2 | **(bloquant)** À 1:100, une cote de 4500 mm mesure 45 mm ; à 1:200, 22,5 mm | | | |
| A3 | **(bloquant)** Sur une façade à 1:50, une hauteur d'étage de 2500 mm mesure 50 mm | | | |
| A4 | L'échelle graphique de la colonne mesure ce qu'elle annonce | | | |
| A5 | Les cotes se ferment : la somme d'une chaîne de cotes égale la cote d'ensemble | | | |

## B. Contenu des plans de niveau

| # | Contrôle | Oui | Non | Remarque |
|---|---|---|---|---|
| B1 | **(bloquant)** Murs coupés lisibles (hachures par matériau, contour épais), poteaux en noir plein | | | |
| B2 | Portes (battant et arc) et fenêtres (vitrage, allège) dessinées comme d'usage | | | |
| B3 | Repères `PP: 900 x 2100` et `All. 1100` justes et lisibles | | | |
| B4 | **(bloquant)** Noms et surfaces des pièces justes (écarts avec la référence : voir `fixtures/ROOMIT-*/README.md`) | | | |
| B5 | Tableau des surfaces : total du niveau juste, balcon compris (D20-10) | | | |
| B6 | Trois chaînes de cotes extérieures et cotes intérieures utiles | | | |
| B7 | Escaliers (montée, arrivée du niveau du dessous) et mobilier corrects | | | |
| B8 | Axes du quadrillage porteur avec leurs bulles, et légende des hachures | | | |
| B9 | **(bloquant)** Aucun texte qui en recouvre un autre ou qui rend une cote illisible | | | |

## C. Toiture, façades, coupes

| # | Contrôle | Oui | Non | Remarque |
|---|---|---|---|---|
| C1 | Plan de toiture : contour, débord, flèches « Pente 1 % », cotes justes (page 7) | | | |
| C2 | Escalier d'accès au toit à sa place (D20-11, D20-14) | | | |
| C3 | Façades : niveaux, ouvertures et toiture cohérents avec les plans | | | |
| C4 | Coupe : éléments coupés (épais, hachurés) distincts des éléments vus ; une cote de faîtage | | | |

## D. Feuille et cartouche

| # | Contrôle | Oui | Non | Remarque |
|---|---|---|---|---|
| D1 | Colonne de droite : type de plan, rose des vents orientée selon le nord, tableaux | | | |
| D2 | Cartouche : projet, émetteur, titre, n° de plan, indice, date, statut, échelle, format | | | |
| D3 | Épaisseurs de traits hiérarchisées : coupé > vu > filets > hachures (D20-16) | | | |
| D4 | Police nette à l'impression, textes d'au moins 7 pt | | | |
| D5 | Unités : tout en mm (longueurs) et m² (surfaces), aucun cm ni m | | | |

## E. Révisions et nomenclatures

| # | Contrôle | Oui | Non | Remarque |
|---|---|---|---|---|
| E1 | Nomenclatures des menuiseries et des pièces justes et complètes | | | |
| E2 | Numéros de feuilles cohérents dans le jeu (Historique : aperçu d'une version) | | | |
| E3 | Après un mur modifié, les feuilles concernées sont signalées comme modifiées | | | |

## Avis

- [ ] Feuilles acceptables pour un **dossier d'esquisse ou d'APS**
- [ ] Feuilles acceptables pour un **dossier de permis ou d'exécution** (après les corrections notées)
- Nom, qualité, date :

Rappel (CLAUDE.md) : tout document destiné à une construction réelle exige la revue d'un architecte ou d'un
ingénieur. Les fondations, réseaux et structure ne sont que dessinés (D20-8) ; leurs données viennent de
l'ingénieur.
