# M19 — Vérification des calculs à la main de T1 et T2

Rapport de vérification fourni par l'utilisateur le 2026-11-18 (« Rapport de vérification des calculs
architecturaux, projets T1 et T2 »). Résumé fidèle ; les valeurs sont celles de `fixtures/T1/spec.json` et
`fixtures/T2/spec.json`.

## Verdict

| Élément | Résultat |
|---|---|
| T1 : configuration initiale (murs 21200 mm, 57,24 / 3,09 / 54,15 m², 10,830 m³ ; studio 25,76 m², 20400 mm ; emprise 30,00 m²) | VALIDÉ |
| T1 : mur est déplacé de 1000 mm (23200 mm, 62,64 / 59,55 m², studio 30,36 m², emprise 35,00 m²) | VALIDÉ |
| T2 : configuration initiale (ENV 27200 mm, 73,44 / 4,29 / 69,15 m², 13,830 m³ ; C1 4600 mm, 12,42 / 1,68 / 10,74 m², 1,074 m³ ; séjour 21,85 m², chambre 17,25 m², total 39,10 m² ; emprise 45,00 m²) | VALIDÉ |
| T2 : fenêtre F1 élargie à 1500 mm (4,59 m², nette 68,85 m², 13,770 m³) | VALIDÉ |
| Cohérence arithmétique et géométrique des cas étudiés | VALIDÉE |
| Cas complexes | À TESTER |
| Validation structurelle | Hors périmètre |

Contrôle croisé du rapport (T2) : emprise 45,00 m² = pièces 39,10 m² + murs et cloison 5,90 m².

## Observations et recommandations de l'utilisateur

1. Garder T1 et T2 comme tests de référence (fait : `src/features/scene/precision.test.ts`).
2. **Conventions de métré** : distinguer la surface à l'axe (métré actuel) des surfaces de finition (faces
   intérieures / extérieures, tableaux, linteaux, appuis).
3. **Jonctions** : éviter tout double comptage en L, en T, entre murs d'épaisseurs différentes.
4. **Ouvertures pendant les modifications 3D** : mur déplacé, raccourci ou supprimé avec ses ouvertures ;
   ouverture élargie ou déplacée ; une ouverture ne doit pas sortir de son mur.
5. **Dalles et fondations** : calculs séparés des murs (dalles, semelles, longrines, poteaux, poutres).
6. **Contrôles des ouvertures** : largeur > 0, hauteur > 0, décalage ≥ 0, décalage + largeur ≤ longueur du
   côté, allège ≥ 0, allège + hauteur ≤ hauteur du mur.
7. **Tests complémentaires T3 à T10** :

| ID | Test | Résultat attendu |
|---|---|---|
| T3 | Augmenter l'épaisseur d'un mur | Volume recalculé |
| T4 | Augmenter la hauteur du bâtiment | Surfaces et volumes recalculés |
| T5 | Supprimer une fenêtre | Surface nette augmentée |
| T6 | Ajouter une porte | Surface nette diminuée |
| T7 | Déplacer une cloison | Surfaces des pièces recalculées |
| T8 | Supprimer une cloison | Pièces fusionnées et surfaces recalculées |
| T9 | Déplacer un mur avec une fenêtre | Position de la fenêtre adaptée |
| T10 | Bâtiment à plusieurs angles | Absence de double comptage |

Chaque test vérifie : géométrie, dimensions des murs, surfaces brutes, ouvertures, nettes, volumes, pièces,
emprise et cohérence avec l'affichage, avec une tolérance définie.
