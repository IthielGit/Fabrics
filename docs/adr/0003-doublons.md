# ADR 0003 — Doublons Fabrics / Pascal

- Statut : **accepté** par l'utilisateur le 2026-11-17 (réponses aux points 3.3 et 3.4 du plan M17)
- Règle du roadmap : jamais deux implémentations actives d'une même capacité ; l'autre est retirée
  dans le jalon qui fait la bascule. En M17, rien n'est retiré (l'application doit rester identique).

| Doublon | Garde | Retrait de l'autre | Raison |
|---|---|---|---|
| Lint : oxlint / Biome | **les deux, périmètres séparés** : oxlint pour `src/` (Fabrics), Biome pour `packages/pascal/` (règles E-001 de Pascal, `noRestrictedImports`) | — (unification possible plus tard, par une nouvelle ADR) | Pas deux outils sur le même code ; chaque code garde les règles qu'il respecte déjà |
| Identifiants : `crypto.randomUUID()` / `nanoid` | **générateur de Pascal** pour les nœuds de la scène ; `crypto.randomUUID()` pour tout le reste de Fabrics (projets, versions, commentaires, Visuels) | règle écrite dans `CLAUDE.md` | La scène Pascal fixe le format de ses identifiants ; les changer casserait ses scènes et son MCP |
| PDF : `jspdf` / `pdfkit` | `jspdf` jusqu'à M20 | **M20**, après comparaison des plans PDF (qualité, poids, polices, vectoriel) | Les PDF actuels de Fabrics sont validés ; on ne change pas sans preuve |
| Export IFC Fabrics / `@pascal-app/ifc-converter` | `ifc-converter` prend le rôle | **M22**, quand il fait au moins aussi bien (entités, propriétés, contrôle IfcOpenShell, comparaison à la baseline IFC) | Pascal gère aussi l'import ; un seul module IFC à terme |
| Vue 3D Fabrics (`src/components/viewer3d/`) / `@pascal-app/viewer` | `@pascal-app/viewer` prend le rôle | **M19** | Moteur plus complet (WebGPU, sélection, matériaux) ; la vue de Fabrics lit l'ancien modèle |
| Composants d'interface : `src/components/ui/` / primitives de Pascal (`packages/editor/src/components/ui/primitives`, `controls`) | **Pascal** (décision D80 : toute l'interface vient de Pascal) | **M19 lot A**, composant par composant (carte des écrans `docs/screen-map.md`) | Une seule interface ; les champs de longueur restent en mm |
| Traduction : `src/i18n/fr.ts` / Lingui (catalogue `fr` de Pascal) | **Lingui** (choix de l'utilisateur le 2026-11-18) | M19 lot A : les textes de `fr.ts` passent dans le catalogue Lingui au fur et à mesure que chaque écran est reconstruit ; `fr.ts` disparaît à la fin de M19 | L'interface vient de Pascal (D80) et Lingui y est déjà partout (extraction, contrôle des traductions manquantes, 5 langues) ; garder `fr.ts` obligerait à traduire deux fois |

## Garde

- Test d'architecture `src/architecture.test.ts` (M17) : `src/` n'importe Pascal que par les exports
  publics des paquets (`@pascal-app/*`), jamais par `packages/pascal/*/src`.
- À chaque retrait (M19, M20, M22), le module retiré est ajouté à la liste des imports interdits de
  ce test et des règles du lint.
