# M24 · 24.0 — Décisions (contrôles qualité, performance, sécurité)

Le 2026-11-27, l'utilisateur a demandé de réévaluer le plan et de **choisir à sa place**, avec une seule
exigence : que ce soit **facile à utiliser** (« user friendly »). Choix de Claude, à contester à tout
moment.

## Principe directeur (D24-0)

Chaque chose visible du jalon suit la même règle :
1. **Dire ce qui ne va pas** en français simple, sans jargon (« Cette fenêtre dépasse du mur »).
2. **Dire pourquoi c'est gênant** (« le métré ne peut pas déduire son ouverture »).
3. **Proposer l'action** : un bouton qui sélectionne l'élément, ou qui corrige quand c'est sûr.
4. **Ne jamais bloquer en silence** : tout refus explique quoi faire ; toute attente de plus d'une
   seconde montre sa progression ; rien ne fige l'écran.

## D24-1 · Seuils de performance

Mesurés sur des plans générés, dans le navigateur. Repère : 5 000 éléments ≈ un immeuble de 4 à 5
niveaux bien détaillé.

| Action | 1 000 éléments | 5 000 éléments | 10 000 éléments |
|---|---|---|---|
| Ouvrir le projet | ≤ 1 s | ≤ 3 s | ≤ 6 s |
| Une modification apparaît à l'écran | ≤ 100 ms | ≤ 100 ms | ≤ 200 ms |
| Métrés et DQE à jour après la modification (sans bloquer la saisie) | ≤ 200 ms | ≤ 500 ms | ≤ 1 s |
| Export XLSX | ≤ 1 s | ≤ 3 s | ≤ 6 s |
| Export PDF | ≤ 3 s | ≤ 10 s | ≤ 20 s |
| Export IFC | ≤ 5 s | ≤ 15 s | ≤ 30 s |

Un seuil manqué est corrigé (optimisation) ou, si c'est impossible dans le jalon, montré à
l'utilisateur avec la mesure et une proposition. Les exports longs montrent une barre de progression.

## D24-2 · Machine de référence

Le PC de l'utilisateur, **et** une machine plus modeste simulée (processeur ralenti ×4 dans Chromium,
comme un portable de chantier). Les seuils valent sur le PC ; sur la machine lente, on vérifie
seulement que rien ne se fige (pas de seuil chiffré).

## D24-3 · Sauvegarde et restauration

- Un bouton **« Télécharger une sauvegarde »** par projet : un seul fichier `.fabrics` (plan, réglages,
  devis et ses versions figées), lisible par Fabrics seul.
- Un bouton **« Exporter la bibliothèque »** : un fichier Excel que le bouton « Importer » sait relire
  (aller-retour sans perte).
- **Restaurer ne remplace jamais rien** : une sauvegarde ouverte devient une copie nommée « … (restauré
  le JJ/MM/AAAA) ».

## D24-4 · Journal d'audit

- Couvre **projets, prix et devis** : qui, quoi, quand, en une phrase lisible (« b@… a figé la version
  3 du devis (définitif) »).
- Réutilise ce qui existe (versions des projets, historique des prix, journal des imports, versions des
  devis) et n'ajoute que les événements manquants : exports, devis définitif, entrées et sorties de
  membres, restauration.
- Gardé **1 an** ; visible des admins de l'espace (prix, devis) et du propriétaire (projet).

## D24-5 · IFC extérieurs pour les épreuves

Exemples de Pascal (tests locaux seulement, comme l'exige leur README) et fichiers d'exemple publics de
buildingSMART, licence vérifiée avant usage. Les fichiers de l'utilisateur sont les bienvenus mais pas
nécessaires.

## D24-6 · Revue humaine

Claude prépare **un seul dossier de revue** qui sert aux gates G3 (plans), G4 (métrés) et G7 : PDF des
plans, métrés, DQE et IFC de deux projets, avec une grille simple à cocher. Le gate G7 reste **ouvert**
tant que la revue n'est pas faite (comme G3 et G4) ; cela ne bloque pas M25.
