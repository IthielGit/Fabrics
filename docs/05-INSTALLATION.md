# 05 — Installation (en partant de zéro)

Ce guide est pour toi, pas pour Claude. Fais les étapes 1 à 4 une seule fois.
Supabase et Cloudflare ne servent qu'aux jalons M5 et M6 : Claude te guidera le moment venu.

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
4. Continue avec le prompt **P1** pour chaque jalon, dans l'ordre M0 → M6.

## Plus tard : comptes à créer (Claude te guidera)

| Jalon | Service | Pourquoi | Coût |
|---|---|---|---|
| M5 | GitHub | Stocker le code, déclencher les déploiements | gratuit |
| M5 | Cloudflare Pages | Mettre l'application en ligne | offre gratuite |
| M6 | Supabase | Comptes utilisateurs, projets et images dans le cloud | offre gratuite (avec limites) |

Ne colle jamais une clé secrète dans la conversation ni dans un fichier versionné : elle va
uniquement dans `.env.local` (et dans les réglages de Cloudflare). Seule la clé **anon** de
Supabase est utilisée par l'application.

## Problèmes fréquents

| Symptôme | Solution |
|---|---|
| `node` ou `npm` « n'est pas reconnu » | Redémarrer VS Code (ou l'ordinateur) après l'installation de Node.js |
| Sous Windows : « l'exécution de scripts est désactivée » dans PowerShell | Dans le terminal de VS Code, choisir **Git Bash** ou **Invite de commandes** comme terminal par défaut |
| Le port 5173 est déjà utilisé | Fermer l'autre terminal qui exécute `npm run dev`, ou accepter le port proposé par Vite |
| La page reste blanche | Ouvrir la console du navigateur (`F12`), copier l'erreur et utiliser le prompt **P4** |
