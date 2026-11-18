# 05 — Installation (en partant de zéro)

Ce guide est pour toi, pas pour Claude. Fais les étapes 1 à 4 une seule fois.
Supabase et Cloudflare ne servent qu'aux jalons M12 et M13 : Claude te guidera le moment venu.

## 1. Installer les outils

| Outil | Où le trouver | Vérification (dans un terminal) |
|---|---|---|
| Node.js (version **LTS**) | nodejs.org | `node -v` puis `npm -v` |
| Git | git-scm.com | `git --version` |
| Visual Studio Code | code.visualstudio.com | — |
| Navigateur Chrome, Edge ou Firefox récent | — | — |

Sous Windows, accepte les options par défaut des installateurs. Redémarre l'ordinateur après
avoir installé Node.js et Git, sinon VS Code risque de ne pas les trouver.

## 2. Installer Claude Code dans VS Code

1. Ouvre VS Code → icône **Extensions** dans la barre de gauche (ou `Ctrl+Maj+X`).
2. Cherche **Claude Code** et installe l'extension publiée par **Anthropic**.
3. Ouvre le panneau Claude Code et connecte-toi avec ton compte Claude.
   Il faut un abonnement Claude ou un compte API : vérifie les conditions actuelles dans la
   documentation officielle d'Anthropic.

Extensions utiles en plus (facultatives) : **Tailwind CSS IntelliSense**, **ESLint**.

## 3. Préparer le dossier du projet

1. Crée un dossier vide, par exemple `Documents/fabrics`.
2. Copie dedans **tout le contenu** de ce pack, en gardant la structure :
   ```
   fabrics/
   ├── CLAUDE.md
   ├── .env.example
   ├── docs/
   │   ├── 01-PRODUIT.md
   │   ├── 02-ARCHITECTURE.md
   │   ├── 03-ROADMAP.md
   │   ├── 04-PROMPTS.md
   │   ├── 05-INSTALLATION.md
   │   └── PROGRESS.md
   └── supabase/
       └── schema.sql
   ```
   Attention : `.env.example` commence par un point ; sur Mac il peut être masqué dans le
   Finder (`Cmd+Maj+.` pour l'afficher).
3. Dans VS Code : **Fichier → Ouvrir le dossier…** → choisis `fabrics`.
4. Ouvre le terminal intégré : **Terminal → Nouveau terminal**. C'est là que tu taperas
   les commandes que Claude te donne.

## 4. Premier échange avec Claude

1. Ouvre le panneau Claude Code.
2. Copie-colle le prompt **P0** de `docs/04-PROMPTS.md`.
3. Lis son résumé et ses questions, réponds, puis donne-lui le feu vert pour M0.
4. Continue avec le prompt **P1** pour chaque jalon, dans l'ordre M0 → M13.

## Plus tard : comptes à créer (Claude te guidera)

| Jalon | Service | Pourquoi | Coût |
|---|---|---|---|
| M12 | GitHub | Stocker le code, déclencher les déploiements | gratuit |
| M12 | Cloudflare Pages | Mettre l'application en ligne | offre gratuite |
| M13 | Supabase | Comptes utilisateurs, projets et images dans le cloud | offre gratuite (avec limites) |

Ne colle jamais une clé secrète dans la conversation ni dans un fichier versionné : elle va
uniquement dans `.env.local` (et dans les réglages de Cloudflare). Seule la clé **anon** de
Supabase est utilisée par l'application.

## Outils Pascal (à partir de M17)

Depuis M17, le dépôt contient Pascal Editor (`packages/pascal/`). Il faut en plus :

| Outil | Version | Installation (terminal de VS Code, PowerShell) | Vérifier |
|---|---|---|---|
| Node.js | **≥ 26.12.1** (ou 24.22.1) : Pascal refuse les versions plus anciennes | `winget upgrade --id OpenJS.NodeJS.LTS` | `node -v` → `v26.13.1` |
| Bun | **1.4.4** (sert aux tests de Pascal) | `powershell -c "irm bun.sh/install.ps1 \| iex"` | `bun --version` → `1.4.4` |
| Python | 3.11 ou plus (contrôle des fichiers IFC) | https://www.python.org/downloads/ | `python --version` |

Après une installation, **fermer puis rouvrir VS Code** pour que les nouvelles commandes soient
reconnues. Ensuite, à la racine du projet :

```bash
npm install              # Fabrics
npm run install:pascal   # Pascal, avec Bun, aux versions exactes de son bun.lock (~2 min)
npm run build:pascal     # compile les paquets de Pascal (Fabrics lit @pascal-app/core depuis M18) ; ~5 min la première fois
npm run check:all        # tout vérifier : build, lint, tests Fabrics, tests Pascal, lint Pascal, doublons
```

Contrôle IFC avec IfcOpenShell (facultatif, environnement Python séparé) :

```bash
python -m venv tools/ifc/.venv
tools/ifc/.venv/Scripts/python.exe -m pip install -r tools/ifc/requirements.txt
tools/ifc/.venv/Scripts/python.exe -I tools/ifc/validate.py baseline/fabrics/example/export.ifc
```

## Mise en ligne de M18 : base de données et Cloudflare Pages

À partir de M18, un projet Plan est enregistré sous forme de scène Pascal. Le 2026-11-18, les
projets tests de la base ont été supprimés avant la mise en ligne ; il n'y a donc **pas de
conversion à lancer**. Le script `npm run migrate:plans` reste dans le dépôt, mais il ne doit pas
être lancé tant qu'il existe des projets à convertir.

Les tables de sauvegarde `projects_backup_m18` et `project_versions_backup_m18` restent dans
Supabase tant que M18 n'est pas validé. Ne les supprime qu'avec l'accord de l'utilisateur.

### Commande de build de Cloudflare Pages

Depuis M18, l'application importe Pascal. Cloudflare Pages doit donc installer Bun et compiler
Pascal avant le build de l'application. Dans Cloudflare → Workers & Pages → fabrics → Settings →
Builds, règle (le projet Pages est celui de `https://fabrics-8zd.pages.dev`) :

| Réglage | Valeur |
|---|---|
| Build command | `npm install -g bun@1.4.4 && npm run install:pascal && npm run build:pascal && npm run build` |
| Build output directory | `dist` |
| Variable `NODE_VERSION` | `26.13.1` |

Cette commande n'a pas encore été essayée sur Cloudflare. Le premier déploiement doit être
surveillé : la compilation de Pascal est lourde (environ 5 min, et la construction du paquet
`nodes` demande environ 6 Go de mémoire). Si le build échoue pour cette raison, le signaler et ne
pas le relancer en boucle.

## Problèmes fréquents

| Symptôme | Solution |
|---|---|
| `node` ou `npm` « n'est pas reconnu » | Redémarrer VS Code (ou l'ordinateur) après l'installation de Node.js |
| Sous Windows : « l'exécution de scripts est désactivée » dans PowerShell | Dans le terminal de VS Code, choisir **Git Bash** ou **Invite de commandes** comme terminal par défaut |
| Le port 5173 est déjà utilisé | Fermer l'autre terminal qui exécute `npm run dev`, ou accepter le port proposé par Vite |
| La page reste blanche | Ouvrir la console du navigateur (`F12`), copier l'erreur et utiliser le prompt **P4** |
