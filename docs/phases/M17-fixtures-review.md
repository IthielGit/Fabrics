# Relecture des fixtures HOUSE-01, HOUSE-02 et EDGE-01 (M17)

Date de la relecture : 2026-11-18. Auteur des calculs à la main : Claude (fichiers `fixtures/*/spec.json`).
Relecteur : l'utilisateur, qui a fourni le rapport ci-dessous (texte repris tel quel, à la demande de l'utilisateur).

## Synthèse

- **HOUSE-01 et HOUSE-02 : calculs confirmés** selon les conventions des fichiers `spec.json`. Aucune erreur arithmétique.
- **EDGE-01 : sept cas analysés, aucun test logiciel exécuté.** Ils ne sont pas « réussis ». Ils deviennent des tests en M18 (ou au plus tard quand le module concerné est écrit).
- Deux réserves de convention : les surfaces de murs à l'axe ne sont pas des surfaces de finition ; les volumes cumulés murs + dalles supposent une convention altimétrique sans recouvrement.

## Décisions de l'utilisateur (2026-11-18), reportées dans les `spec.json`

1. **window-off-wall** : **rejet** avec message clair, jamais de déplacement silencieux, aucune surface déduite.
2. **overlapping-openings** : chevauchement **signalé**, surface déduite = **union**. Hauteur 1 350 mm et allège 900 mm ajoutées au cas : union 2 000 × 1 350 = **2,70 m²**.
3. **Altitude des dalles** : comme la scène Pascal, le dessus de la dalle est à l'altitude du niveau et l'épaisseur descend. **Les murs sont pleine hauteur et la dalle est découpée autour** (choix de l'utilisateur, 2026-11-18, après une première version où la dalle primait). Pour HOUSE-02 : la dalle de l'étage (2 800 → 3 000 mm) est traversée par les murs du rez-de-chaussée (0 → 3 000 mm) ; on retire leur emprise, 8,75 m². La dalle du rez-de-chaussée est sous les murs : entière.

| Indicateur | RdC | Étage 1 | Total |
|---|---:|---:|---:|
| Surface murale brute à l'axe | 156,90 m² | 156,90 m² | 313,80 m² |
| Surface murale nette à l'axe | 148,27 m² | 146,17 m² | **294,44 m²** |
| Volume net des murs | 24,524 m³ | 24,314 m³ | **48,838 m³** |
| Dalles | 80,00 m², 16,000 m³ | 66,74 m², 13,348 m³ | 146,74 m², 29,348 m³ |
| **Murs + dalles** (sans recouvrement) | | | **78,186 m³** |

Contrôle : dalle de l'étage 80 − 8,75 − 4,51 = 66,74 m². Les murs gardent les valeurs du § 9 ; seule la dalle de l'étage change. Le total murs + dalles est le même qu'avec la règle « la dalle prime » (78,186 m³), ce qui confirme qu'il n'y a plus de recouvrement. HOUSE-01 ne change pas.

Le total du § 9 ci-dessous (79,936 m³) comptait deux fois les 1,750 m³ où murs et dalle de l'étage se recouvrent.

## 1. Méthode

- Longueur : mm ÷ 1 000 = m. Surface : mm² ÷ 1 000 000 = m². Volume : mm³ ÷ 1 000 000 000 = m³.
- Surface murale conventionnelle : longueur à l'axe × hauteur. Surface nette : brute − ouvertures. Volume des murs : surface murale × épaisseur.
- Arrondis uniquement au résultat final : 2 décimales (surfaces), 3 (volumes).
- Les références M17 à M24 et le document d'architecture ne sont pas fournis : la vérification porte sur les conventions des données.

## 2. HOUSE-01 : surfaces des pièces

| Pièce | Dimensions intérieures | Surface exacte | Affichée | Périmètre |
|---|---:|---:|---:|---:|
| Séjour | 4,25 × 4,75 m | 20,1875 m² | 20,19 m² | 18,00 m |
| Cuisine | 3,25 × 4,75 m | 15,4375 m² | 15,44 m² | 16,00 m |
| Chambre 1 | 3,75 × 4,75 m | 17,8125 m² | 17,81 m² | 17,00 m |
| Chambre 2 | 3,75 × 4,75 m | 17,8125 m² | 17,81 m² | 17,00 m |
| **Total** | | **71,2500 m²** | **71,25 m²** | **68,00 m** |

Contrôle : 7,60 × 9,60 = 72,96 m² ; cloisons (7,60 + 4,75 + 4,75) × 0,10 = 1,71 m² ; 72,96 − 1,71 = 71,25 m². Les cloisons C2 et C3 s'arrêtent sur C1 : pas de double comptage aux jonctions.

**Verdict : confirmé.** Le total des périmètres correspond aux contours des quatre pièces, pas à des longueurs de murs distinctes.

## 3. HOUSE-01 : ouvertures

| Ouverture | Dimensions | Surface | Volume retiré (mur 200 mm) |
|---|---:|---:|---:|
| P1 | 1,00 × 2,15 m | 2,15 m² | 0,430 m³ |
| F1 à F4 (chacune) | 1,20 × 1,35 m | 1,62 m² | 0,324 m³ |
| **Total** (1 porte, 4 fenêtres) | | **8,63 m²** | **1,726 m³** |

Positions vérifiées : toutes dans leur mur, sous 3 000 mm, sans chevauchement.

## 4. HOUSE-01 : murs et cloisons

Enveloppe à l'axe 7,80 × 9,80 m : longueur 35,20 m.

| Élément | Longueur à l'axe | Surface brute | Ouvertures | Surface nette | Volume brut | Volume net |
|---|---:|---:|---:|---:|---:|---:|
| ENV | 35,20 m | 105,60 m² | 8,63 m² | 96,97 m² | 21,120 m³ | 19,394 m³ |
| C1 | 7,60 m | 22,80 m² | 0 | 22,80 m² | 2,280 m³ | 2,280 m³ |
| C2 | 4,75 m | 14,25 m² | 0 | 14,25 m² | 1,425 m³ | 1,425 m³ |
| C3 | 4,75 m | 14,25 m² | 0 | 14,25 m² | 1,425 m³ | 1,425 m³ |
| **Total** | **52,30 m** | **156,90 m²** | **8,63 m²** | **148,27 m²** | **26,250 m³** | **24,524 m³** |

Contrôle : (8 × 10 − 7,60 × 9,60) × 3 = 21,120 m³ ; 21,120 − 8,63 × 0,20 = 19,394 m³.

Faces de l'enveloppe : intérieure 103,20 m² brut (94,57 m² après baies), extérieure 108,00 m² (99,37 m² après baies). Ces surfaces excluent tableaux et retours de baies, et la face intérieure n'est pas corrigée des contacts avec les cloisons. Pour un métré d'enduit ou de peinture, il faudra des règles propres au lot.

## 5. HOUSE-01 : dalle et bilan

Dalle 8 × 10 m : 80,00 m², 16,000 m³ (0,20 m). Somme murs nets + dalle = 40,524 m³ : somme de quantités par élément, pas une union géométrique.

**Verdict : confirmé.**

## 6. HOUSE-02 : escalier et trémie

- Hauteur 3 000 mm, contremarches ≤ 180 mm : plafond(3 000 ÷ 180) = **17**. Hauteur exacte 176,470588… mm (affichée 176,47 mm ; le modèle garde la valeur exacte).
- Girons : **16** × 250 mm = 4 000 mm. Relation 2h + g = 602,94 mm.
- Trémie avec marge 50 mm : 1,10 × 4,10 = **4,51 m²**, occupant x = 250 à 1 350 mm et y = 550 à 4 650 mm, entièrement dans le Séjour de l'étage.
- Surface nette Séjour étage : 20,1875 − 4,51 = 15,6775 → **15,68 m²**.

Ces calculs confirment les dimensions. Ils ne valident ni l'échappée, ni les paliers, ni les garde-corps, ni la structure.

## 7. HOUSE-02 : passage dans C1

Passage x = 1 500 à 2 500 mm, hauteur 2 100 mm. Surface 1,00 × 2,10 = 2,10 m² ; volume retiré 0,210 m³.
C1 à l'étage : brut 22,80 m², net 20,70 m² ; volume brut 2,280 m³, net 2,070 m³.

L'emprise du seuil (**0,10 m²**) reste hors des surfaces de pièces : totaux corrects selon la convention « surface au tracé ».

## 8. HOUSE-02 : toiture

Débord horizontal 500 mm sur les quatre côtés, pente 35°.

- Montée du faîtage : 4 000 × tan(35°) = 2 800,830153 mm → **2 801 mm**.
- Projection : 9,00 × 11,00 m = **99,00 m²**. Surface réelle : 99 ÷ cos(35°) = 120,856684… → **120,86 m²** ; un pan 60,43 m².
- Faîtage avec débords 11 000 mm ; égouts 2 × 11 000 mm ; longueur inclinée faîtage–égout 5 493,49 mm ; quatre rives 21 973,94 mm.
- Altitude du faîtage 8 800,830153 mm → **8 801 mm** (dessus des murs à 6 000 mm).
- Avec ce débord, l'égout descend à environ 5 649,90 mm, au-delà du mur.

Les murs triangulaires de pignon ne sont pas définis comme maçonnerie (11,20 m² chacun, hors débords, non ajoutés aux métrés).

**Verdict : confirmé sous cette convention de débord.**

## 9. HOUSE-02 : bilan des deux niveaux

| Indicateur | RdC | Étage 1 | Total |
|---|---:|---:|---:|
| Surface des pièces avant trémie | 71,25 m² | 71,25 m² | 142,50 m² |
| Trémie déduite | 0 | 4,51 m² | 4,51 m² |
| Surface nette des pièces | 71,25 m² | 66,74 m² | **137,99 m²** |
| Portes / fenêtres | 1 / 4 | 1 / 4 | 2 / 8 |
| Passages libres | 0 | 1 | 1 |
| Ouvertures murales | 8,63 m² | 10,73 m² | 19,36 m² |
| Surface murale nette à l'axe | 148,27 m² | 146,17 m² | **294,44 m²** |
| Volume net des murs | 24,524 m³ | 24,314 m³ | **48,838 m³** |

Dalles (si deux dalles de 80 m², celle de l'étage percée) : RdC 80,00 m² / 16,000 m³ ; étage 75,49 m² / 15,098 m³ ; total **155,49 m² / 31,098 m³**.
Murs + dalles : 48,838 + 31,098 = **79,936 m³**, hors escalier, pignons et toiture. Les intersections murs–dalles restent à traiter (point 3 ci-dessus).

## 10. EDGE-01 : cas et critères

Règle : chaque cas doit produire une erreur claire ou une exclusion signalée, jamais un résultat faux en silence.

| Cas | Constat | Résultat acceptable |
|---|---|---|
| **window-off-wall** | Mur 0 à 4 000 mm, fenêtre centrée à 300 mm, largeur 1 200 mm : dépassement de 300 mm, largeur contenue 900 mm | Rejeter (décision 1) ; si découpée à la limite, ne déduire que la partie contenue. Surface contenue : 0,90 × h m² (h manquant) |
| **overlapping-openings** | Chevauchement horizontal 400 mm, largeur de l'union 2 000 mm | Signaler ; déduire l'union (décision 2). Hauteurs et allèges manquent |
| **zero-height-wall** | 4,00 × 0 = 0,00 m², volume 0,000 m³ | Avertissement « hauteur nulle » ; aucune ouverture posable |
| **mixed-units** | 3,5 × 1 000 ; 3 500 nu ; 350 × 10 : tous = **3 500 mm** | Le parseur accepte la virgule décimale |
| **missing-material** | Géométrie complète, matériau absent | Calcul géométrique normal + signalement « matériau manquant » ; ne pas inventer matériau ni prix |
| **duplicate-id** | Pas de métré numérique fourni | Erreur claire à l'import, avant agrégation ; ne rien supprimer en silence |
| **ifc-nested-placements** | Pas de fichier IFC ni de transformation chiffrée | Contrôler après composition de toute la chaîne de parents (rotations comprises) ; sinon exclure et signaler. Relation : p_global = T_parent × T_local × p_élément |

**Bilan EDGE-01 : sept critères analysés, aucun test exécuté.** À ne pas marquer « réussis » sur la seule base de ce rapport.

## 11. Points à conserver

- Aucune erreur arithmétique dans les résultats des deux maisons.
- **DQE non calculable** faute de prix : la valeur doit rester `null`, pas 0.
- Surfaces nettes = polygones fournis, trémie déduite. Ce ne sont pas des surfaces réglementaires.
- HOUSE-01 n'a aucune porte intérieure ; HOUSE-02 n'ajoute qu'un passage dans C1 : circulation incomplète.
- HOUSE-02 : une porte extérieure à l'étage, sans balcon ni accès décrit.
- Escalier, toiture et pignons restent hors totaux.

## Confiance et limites

Confiance 99 % sur les calculs numériques (recalculés et recoupés). Non vérifiés : comportements logiciels, règles M17 à M24, conformité constructive. Les totaux complémentaires restent soumis aux hypothèses explicitées.
