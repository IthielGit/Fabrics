# Fabrics — Instructions pour Claude

Ce fichier est la référence principale. Lis-le en entier au début de chaque session,
puis lis les documents de `docs/` dans l'ordre indiqué ci-dessous.

## Ce que nous construisons

**Fabrics** est une application web d'édition visuelle sur canevas, avec deux types de projets :

1. **Visuel** (`kind: "design"`) — affiches, posts réseaux sociaux, flyers : texte, formes, images.
2. **Plan** (`kind: "plan"`) — plan de pièce ou de bâtiment **à l'échelle réelle** : murs, pièces,
   cotes. L'application calcule automatiquement les **métrés** (surfaces, périmètres, longueurs).

Hors périmètre : **aucun devis, aucun prix, aucune quotation**. Les métrés s'arrêtent aux quantités.

## Ordre de lecture des documents

| Ordre | Fichier | Rôle |
|---|---|---|
| 1 | `CLAUDE.md` | Règles de travail (ce fichier) |
| 2 | `docs/01-PRODUIT.md` | Quoi construire et pourquoi, périmètre MVP |
| 3 | `docs/02-ARCHITECTURE.md` | Comment construire : stack, modèle de données, calculs |
| 4 | `docs/03-ROADMAP.md` | Jalons M0 → M13 avec critères d'acceptation |
| 5 | `docs/PROGRESS.md` | Journal : où en est le projet |
| — | `docs/04-PROMPTS.md` | Messages que l'utilisateur t'enverra (pour info) |
| — | `docs/05-INSTALLATION.md` | Guide d'installation pour l'utilisateur |
| — | `supabase/schema.sql` | Schéma de base de données (jalon M12 uniquement) |

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
6. **Dépendances.** N'utilise que les bibliothèques listées dans `docs/02-ARCHITECTURE.md`.
   Pour en ajouter une, demande d'abord en expliquant pourquoi.
7. **Pas d'invention de périmètre.** Si une fonctionnalité n'est pas dans le jalon en cours,
   note-la dans la section « Idées » de `docs/PROGRESS.md` au lieu de la coder.
8. **En cas de blocage** (erreur incompréhensible, choix ambigu) : arrête-toi, explique le
   problème en deux phrases et propose deux options.

## Contraintes légales et de conception

- N'imite pas l'interface, le nom, le logo, les textes ni les assets d'un produit existant
  (Canva, Figma, Synaps…). L'identité visuelle de Fabrics est originale.
- Icônes : uniquement `lucide-react` (licence ISC).
- Polices : polices système ou Google Fonts / Fontsource sous licence libre (OFL).
- Aucune image, illustration ou modèle tiers sans licence vérifiée. Les exemples de démo sont
  créés pour Fabrics.
- Les médias importés par l'utilisateur restent sa propriété : on ne les rend jamais publics.

## Sécurité

- Ne committe jamais `.env.local`. Seul `.env.example` est versionné.
- Côté client, uniquement la clé `anon` de Supabase. **Jamais** la clé `service_role`.
- Toute table Supabase a le Row Level Security activé (voir `supabase/schema.sql`).

## Conventions de code

- TypeScript strict. Pas de `any` sauf justification en commentaire.
- Composants React en fonctions, un composant par fichier, nommage `PascalCase.tsx`.
- Code (variables, fonctions, fichiers) en **anglais** ; interface utilisateur en **français**.
  Tous les textes d'interface passent par `src/i18n/fr.ts` (prépare la traduction future).
- Logique métier (géométrie, métrés, unités) dans `src/features/*/` en **fonctions pures**,
  testées avec Vitest. Aucun calcul de métré dans un composant React.
- **Unités : toujours « Métrique architectural » (comme Revit).** Longueurs en `mm` entiers
  (`3500 mm`, jamais `3,50 m` ni `20 cm`), surfaces en `m²`, volumes en `m³`. S'applique à tout
  affichage, champ de saisie, export et texte d'interface, présents et futurs. Un nombre saisi
  sans unité est en mm. Détail dans `docs/02-ARCHITECTURE.md` (« Unités et échelle »).
- Identifiants : `crypto.randomUUID()`.
- Styles : Tailwind CSS uniquement.

## Commandes

```bash
npm run dev      # serveur de développement → http://localhost:5173
npm run build    # vérification TypeScript + build de production
npm run lint     # ESLint
npm test         # Vitest (à partir du jalon M1)
```

## Définition de « terminé » pour une tâche

- [ ] Le critère d'acceptation de `docs/03-ROADMAP.md` est rempli et testé dans le navigateur
- [ ] `npm run build`, `npm run lint` et `npm test` passent (`npm test` à partir du jalon M1)
- [ ] Les textes d'interface sont en français via `src/i18n/fr.ts`
- [ ] La case est cochée dans la roadmap et `docs/PROGRESS.md` est à jour
- [ ] L'utilisateur sait comment vérifier le résultat
