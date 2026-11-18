# Fabrics — Instructions pour Claude

Ce fichier est la référence principale. Lis-le en entier au début de chaque session,
puis lis les documents de `docs/` dans l'ordre indiqué ci-dessous.

## Ce que nous construisons

**Fabrics** est une application web d'édition visuelle sur canevas, avec deux types de projets :

1. **Visuel** (`kind: "design"`) — affiches, posts réseaux sociaux, flyers : texte, formes, images.
2. **Plan** (`kind: "plan"`) — plan de pièce ou de bâtiment **à l'échelle réelle** : murs, pièces,
   cotes. L'application calcule automatiquement les **métrés** (surfaces, périmètres, longueurs).

**Depuis le 2026-11-17 (D75 à D80) : Fabrics + Pascal Editor + amélioration.** Fabrics garde ses
fonctions (métrés Client / Exécution, Supabase, collaboration, historique, commentaires, partage,
projets Visuel) ; on y intègre **tout ce qu'on peut de Pascal Editor**, **interface et prise en
main comprises** (D80 : accueil, éditeur, réglages, import, connexion de Pascal, en restant sur
Vite) (open source MIT, clone local
`C:\Users\My PC\Documents\Projects\BIM Project`) pour viser des livrables de qualité comparable à
Revit : plans professionnels, métrés traçables, IFC, **DQE chiffré** (autorisé depuis D76) et
assistant IA. La **scène Pascal** est l'unique source de vérité des projets Plan (D79).

## Ordre de lecture des documents

| Ordre | Fichier | Rôle |
|---|---|---|
| 1 | `CLAUDE.md` | Règles de travail (ce fichier) |
| 2 | `docs/01-PRODUIT.md` | Quoi construire et pourquoi, périmètre MVP |
| 3 | `docs/02-ARCHITECTURE.md` | Comment construire : stack, modèle de données, calculs |
| 4 | `docs/03-ROADMAP.md` | **Seul roadmap officiel** : jalons M0 → M25, gates, fixtures, anti-régression |
| 5 | `docs/PROGRESS.md` | Journal : où en est le projet |
| — | `docs/04-PROMPTS.md` | Messages que l'utilisateur t'enverra (pour info) |
| — | `docs/05-INSTALLATION.md` | Guide d'installation pour l'utilisateur |
| — | `docs/06-BIBLIOTHEQUE.md` | Catalogue détaillé de la bibliothèque d'objets (jalon M7 uniquement) |
| — | `supabase/schema.sql` | Schéma de base de données (jalon M13 uniquement) |
| — | `docs/capabilities.md` | Registre unique des capacités (à partir de M17) : un module propriétaire par capacité |
| — | `docs/regression-checklist.md` | Liste de non-régression (à partir de M17) |
| — | `AGENTS.md`, `DECISIONS.md`, `CONTRIBUTING.md` de Pascal | Règles du code de `packages/pascal/` (à partir de M17) |

Il n'existe **qu'un seul roadmap** : `docs/03-ROADMAP.md`. Aucun autre fichier ne doit en tenir lieu.

**En cas de contradiction**, l'ordre de priorité est :
`CLAUDE.md` > `docs/02-ARCHITECTURE.md` > `docs/03-ROADMAP.md` > `docs/01-PRODUIT.md`.
Signale toute contradiction à l'utilisateur au lieu de la résoudre en silence.

## Qui est l'utilisateur

L'utilisateur part de zéro sur VS Code. Il ne lit pas forcément le code.
- Explique en **français simple** ce que tu as fait et pourquoi.
- Donne les **commandes exactes** à taper, et dis où les taper (terminal de VS Code).
- Dis-lui toujours **comment vérifier** le résultat dans le navigateur.
- Ne suppose jamais qu'il a installé quelque chose : vérifie (`node -v`, `git --version`…).

## Règles de travail

1. **Un jalon à la fois.** Travaille uniquement sur le jalon en cours de `docs/03-ROADMAP.md`.
   Ne commence pas le jalon suivant sans que l'utilisateur l'ait validé.
2. **Planifie avant de coder.** Au début d'un jalon, liste les tâches et les fichiers que tu vas
   créer ou modifier, puis attends le feu vert.
3. **Petits pas vérifiables.** Après chaque tâche : `npm run build` et `npm run lint` doivent
   passer, et `npm test` quand des tests existent. Ne déclare jamais une tâche terminée si ces
   commandes échouent.
4. **Mets à jour le suivi.** À la fin de chaque tâche, coche la case dans `docs/03-ROADMAP.md`
   et ajoute une entrée dans `docs/PROGRESS.md`.
5. **Commits.** Propose un commit git à la fin de chaque tâche réussie, avec un message clair
   (`feat: outil mur`, `fix: zoom molette`…).
   **Depuis le 2026-11-18, on travaille directement sur `main`** : ni branche de fonctionnalité ni
   worktree. Commit puis `git push origin main` à la fin de chaque tâche réussie.
6. **Dépendances.** N'utilise que les bibliothèques listées dans `docs/02-ARCHITECTURE.md`. Les
   paquets de Pascal et leurs dépendances sont acceptés en bloc (D78). Pour en ajouter une autre,
   demande d'abord en expliquant pourquoi.
7. **Pas d'invention de périmètre.** Si une fonctionnalité n'est pas dans le jalon en cours,
   note-la dans la section « Idées » de `docs/PROGRESS.md` au lieu de la coder.
8. **En cas de blocage** (erreur incompréhensible, choix ambigu) : arrête-toi, explique le
   problème en deux phrases et propose deux options.

## Licences (D77 : règles « clean room » supprimées le 2026-11-17)

- On utilise librement les dépôts et contenus open source (Pascal Editor, IfcOpenShell…), code,
  objets, matériaux et composants compris.
- **Vérifier la licence** de chaque dépendance ou contenu repris **avant toute redistribution
  commerciale** ; conserver les notices dans `THIRD_PARTY_NOTICES.md` ; examiner les obligations des
  bibliothèques binaires (WASM) et des services externes (IfcOpenShell est en LGPL).
- Les fichiers IFC d'exemple de Pascal ne servent qu'aux tests locaux (leur README l'exige).
- Les médias importés par l'utilisateur restent sa propriété : on ne les rend jamais publics.

## Règles globales Fabrics + Pascal (à partir de M17)

- **Ne pas dupliquer** le moteur, les vues, les outils ni l'interface sans décision documentée (ADR).
  Suivre RÉUTILISER → ÉTENDRE → REMPLACER et le mécanisme anti-duplication de `docs/03-ROADMAP.md`.
- **Ne jamais annoncer « qualité Revit »** sur la seule base d'une démo : comparaisons chiffrées,
  sorties imprimables, audit des données et revue d'un praticien BIM.
- **Une seule source de vérité** (scène Pascal, D79) et des identifiants stables : vues 2D, 3D,
  nomenclatures, métrés et DQE en dérivent.
- **Métrés et montants déterministes et traçables**, jamais estimés par l'IA. **Aucun prix inventé** :
  les prix viennent de la bibliothèque de prix de l'utilisateur ; montants exacts, pas de flottants.
- Toute modification par l'IA passe par un aperçu, l'accord de l'utilisateur et une seule étape
  d'annulation.
- Documenter les limites des disciplines non prises en charge ; tout document destiné à une
  construction réelle exige la revue d'un architecte ou d'un ingénieur.
- Chaque jalon passe `npm run check:all` (dès qu'il existe) et ne doit rien faire reculer
  (mécanisme anti-régression).

## Sécurité

- Ne committe jamais `.env.local`. Seul `.env.example` est versionné.
- Côté client, uniquement la clé `anon` de Supabase. **Jamais** la clé `service_role`.
- Toute table Supabase a le Row Level Security activé (voir `supabase/schema.sql`).

## Conventions de code

- TypeScript strict. Pas de `any` sauf justification en commentaire.
- Composants React en fonctions, un composant par fichier, nommage `PascalCase.tsx`.
- Code (variables, fonctions, fichiers) en **anglais** ; interface utilisateur en **français**.
  Système de traduction retenu en M17 : **Lingui** (catalogue français de Pascal, choix de
  l'utilisateur du 2026-11-18, ADR 0003). Les composants repris de Pascal passent par Lingui ; les
  textes de `src/i18n/fr.ts` y sont versés écran par écran en M19 (lot A), puis `fr.ts` disparaît.
  D'ici là, un texte d'un écran Fabrics pas encore reconstruit reste dans `fr.ts`.
- Logique métier (géométrie, métrés, unités) dans `src/features/*/` en **fonctions pures**,
  testées avec Vitest. Aucun calcul de métré dans un composant React.
- **Unités : toujours « Métrique architectural » (comme Revit).** Longueurs en `mm` entiers
  (`3500 mm`, jamais `3,50 m` ni `20 cm`), surfaces en `m²`, volumes en `m³`. S'applique à tout
  affichage, champ de saisie, export et texte d'interface, présents et futurs. Un nombre saisi
  sans unité est en mm. Détail dans `docs/02-ARCHITECTURE.md` (« Unités et échelle »). La scène
  Pascal stocke en **mètres** (D79) : la conversion se fait à l'affichage et à la saisie, l'utilisateur
  ne voit jamais de mètres.
- Code de `packages/pascal/` : on y suit les conventions de Pascal (Biome, Lingui, règles E-001…) ;
  chaque modification de Fabrics y est notée dans `packages/pascal/FABRICS_CHANGES.md`.
- Identifiants : `crypto.randomUUID()`.
- Styles : Tailwind CSS uniquement.

## Commandes

```bash
npm run dev      # serveur de développement → http://localhost:5173
npm run build    # vérification TypeScript + build de production
npm run lint     # ESLint
npm test         # Vitest (à partir du jalon M1)
# À partir de M17 :
npm run test:pascal   # tests des paquets Pascal (bun)
npm run lint:pascal   # Biome sur packages/pascal
npm run check:all     # tout : build, lint, tests, références, doublons
```

## Définition de « terminé » pour une tâche

- [ ] Le critère d'acceptation de `docs/03-ROADMAP.md` est rempli et testé dans le navigateur
- [ ] `npm run build`, `npm run lint` et `npm test` passent (`npm test` à partir du jalon M1)
- [ ] Les textes d'interface sont en français via `src/i18n/fr.ts`
- [ ] La case est cochée dans la roadmap et `docs/PROGRESS.md` est à jour
- [ ] L'utilisateur sait comment vérifier le résultat
