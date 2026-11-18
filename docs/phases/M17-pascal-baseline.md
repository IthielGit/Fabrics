# M17 — Référence de Pascal dans son propre dossier

Relevé le 2026-11-17 dans le clone `C:\Users\My PC\Documents\Projects\BIM Project`, **sans aucune
modification** du code (critère G0 : les tests de la copie intégrée doivent donner les mêmes
résultats).

## Environnement

| Élément | Valeur |
|---|---|
| Commit | `7f30521` « Initial Pascal Editor source » (MIT, Pascal Group Inc.) |
| Système | Windows 11 Pro (chemin avec espace : `My PC`) |
| Node.js | 26.13.1 (mis à jour depuis 24.16.0, refusé par `engines` de Pascal) |
| Bun | 1.4.4 (version du champ `packageManager`) |
| Installation | `bun install` : 845 paquets, 3 min 50 s |
| Commande | `bunx turbo run test --continue --concurrency=1` (= `bun run test` de Pascal, sans arrêt au premier paquet en échec), puis les tests de scripts de la racine |
| Durée | 15 min 31 s (Turbo) + 27 s (scripts racine) |

`bun run build` n'a pas été lancé : la construction de `nodes` demande 6 Go de mémoire et celle de
l'application Next.js n'est pas utile en M17 (aucun paquet n'est importé par Fabrics). À faire en M18,
quand `src/` importera `@pascal-app/core`.

## Résultats

| Paquet | Réussis | Échecs | Ignorés | Fichiers | Durée |
|---|---:|---:|---:|---:|---:|
| `@pascal-app/core` | 7 306 | 6 | 3 | 400 | 102 s |
| `@pascal-app/nodes` | 5 525 | 0 | 1 | 457 | 246 s |
| `@pascal-app/editor` | 2 742 | 19 | 0 | 298 | 84 s |
| `@pascal-app/viewer` | 1 746 | 3 | 0 | 168 | 38 s |
| `@pascal-app/mcp` | 1 512 | 19 | 0 | 78 | 194 s |
| `@pascal-app/cli` | 243 | 14 | 2 | 13 | 28 s |
| `@pascal-app/ifc-converter` | 107 | 0 | 0 | 16 | 28 s |
| `editor` (application) | 76 | 2 | 0 | 16 | 17 s |
| `@pascal-app/geometry-script` | 64 | 0 | 2 | 5 | 3 s |
| Scripts racine (i18n, proxy) | 73 | 8 | 0 | 4 | 27 s |
| **Total** | **19 394** | **71** | **8** | | |

La liste exacte des 70 tests en échec (un nom apparaît deux fois) est la référence machine :
`packages/pascal/.fabrics/known-failures-win32.json`. `npm run test:pascal` compare la copie à cette
liste : un nouvel échec bloque `check:all`.

## Nature des échecs (Windows)

Aucun échec ne touche la géométrie, les métrés ou le modèle des nœuds (`nodes` : 0 échec).

| Groupe | Paquets | Cause probable |
|---|---|---|
| Liens symboliques, droits de fichiers Unix, arrêt de processus | `cli` (14) | Fonctions Unix absentes ou réservées à l'administrateur sous Windows |
| Bundles « propres » et vérification des sources | `core` (6), `viewer` (3) | Construction de bundles et lecture de fichiers avec des chemins Windows (`\`, espace) |
| Historique « standalone » | `editor` (19) | Même suite de tests (`standalone history source invalidation`) : environnement de test, à confirmer sous Linux |
| Brief de conception et `run_batch` par MCP | `mcp` (19) | Exécution de scripts / sous-processus sous Windows, à confirmer sous Linux |
| Feuille de style de l'application | `editor` app (2) | Compilation Tailwind / lightningcss : binaires Windows absents des `optionalDependencies` de Pascal |
| Scripts i18n | racine (8) | Fins de ligne et chemins des catalogues |

La CI GitHub (Linux) relèvera la référence Linux ; elle fait foi pour le gate.
