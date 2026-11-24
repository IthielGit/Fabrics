# Risques de la phase « Fabrics + Pascal » (M17 → M25)

Repris du roadmap (`docs/03-ROADMAP.md`, « Risques et parades ») et complété par ce qui a été
constaté pendant M17. Mis à jour à chaque jalon.

| # | Risque | Gravité | Parade | Jalon | État |
|---|---|---|---|---|---|
| R1 | Export IFC de Pascal incomplet | Majeure | Preuve de concept et table de correspondance (M17, M22) ; IfcOpenShell en contrôle | M17, M22 | Ouvert |
| R2 | Écart entre géométrie affichée et métrés | Bloquante | Même géométrie source (D79), fixtures HOUSE-01/02, tests d'intersection | M18, M21 | Ouvert (M18 : baseline identique à travers la scène, EDGE-01 corrigé ; reste M21) |
| R3 | Migration des plans Fabrics vers la scène Pascal | Bloquante | Migration testée sur tous les types, comparaison à la baseline M17 (`baseline/fabrics/`) | M18 | Parade en place (M18, gate G1 : migration de la base à faire à la mise en ligne) |
| R4 | Deux historiques (annuler Pascal / Yjs) | Majeure | Un seul historique, décidé par ADR | M18 | Traité (ADR 0005, `Y.UndoManager`) |
| R5 | Méthodes de métré propres au pays | Majeure | Règles paramétrables, versionnées, validées par un métreur | M21 | Ouvert |
| R6 | Licences des dépendances | Majeure | `THIRD_PARTY_NOTICES.md`, vérification avant diffusion commerciale ; IfcOpenShell (LGPL) reste hors de l'application | M17 → | Suivi |
| R7 | Prix périmés | Majeure | Date d'effet, origine, version, avertissements | M23 | Ouvert |
| R8 | Paquets Pascal qui évoluent | Mineure | Versions figées (commit `7f30521`), `packages/pascal/FABRICS_CHANGES.md`, CI | M17 → | Suivi |
| R9 | Actions IA incorrectes | Majeure | Aperçu, validation, une seule annulation | M25 | Ouvert |
| R10 | Performance des grands bâtiments | Majeure | Mesures, tests progressifs, caches ciblés (règle E-010 de Pascal) | M19, M24 | Ouvert |
| R11 | Documents diffusés sans vérification | Majeure | Statut « brouillon / non validé », revue humaine | M20 → | Ouvert |
| R12 | **Constaté en M17** : Pascal est écrit pour Linux / macOS (scripts `lsof`, `rm -rf`, liens symboliques, droits Unix) ; une partie de ses tests échoue sous Windows | Mineure | Échecs relevés une fois pour toutes dans `docs/phases/M17-pascal-baseline.md` ; la CI GitHub (Linux) fait foi ; Git Bash en local | M17 | Suivi |
| R13 | **Constaté en M17** : versions d'outils imposées par Pascal (Node ≥ 24.22.1 ou ≥ 26.12.1, Bun 1.4.4, TypeScript 6 dans ses paquets, TypeScript 7 dans Fabrics) | Mineure | Node 26.13.1 et Bun 1.4.4 installés le 2026-11-17 ; versions écrites dans `docs/05-INSTALLATION.md` et la CI | M17 | Suivi |
| R14 | **Constaté en M17** : l'export IFC actuel de Fabrics n'est pas strictement valide (IfcOpenShell : une porte ou une fenêtre partage son `IfcLocalPlacement` avec son `IfcOpeningElement`, interdit en IFC2X3 ; 23 erreurs sur le plan d'exemple) | Majeure | Non corrigé en M17 (la baseline fige l'état actuel) ; traité en M22 avec `ifc-converter`, `tools/ifc/validate.py` sans erreur exigé au gate G5 | M22 | **Fermé le 2026-11-24** (22.2) : l'export passe par l'IFC4 de Pascal ; `validate.py` : 0 erreur sur le plan d'exemple et la grande maison |
| R15 | **Constaté en M17** : le dépôt grossit (sources de Pascal ~80 Mo, baseline SVG ~7 Mo) | Mineure | Exclusions à la copie, ressources dans `public/pascal/` seulement, IFC d'exemple hors du build | M17 | Suivi |
