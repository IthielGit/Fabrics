# Serveur temps réel de Fabrics (M14)

Worker Cloudflare + Durable Object : une salle par projet, protocole Yjs (synchronisation et présence).
Séparé de l'application : ses dépendances ne sont pas celles de Fabrics. Détails dans
`docs/02-ARCHITECTURE.md`, section « Collaboration temps réel (M14) ».

Toutes les commandes se tapent dans le terminal de VS Code, **dans ce dossier** :

```bash
cd collab-server
npm install          # une seule fois
```

## Vérifier

```bash
npm run types        # génère les types Cloudflare (worker-configuration.d.ts)
npm run typecheck    # vérification TypeScript
npm test             # tests des fonctions pures
npm run smoke        # essai complet en local (faux Supabase, vrai Worker), sans compte
```

## Lancer en local avec le vrai Supabase

1. Copier `.dev.vars.example` en `.dev.vars` et y mettre les mêmes valeurs que `VITE_SUPABASE_URL` et
   `VITE_SUPABASE_ANON_KEY` de `.env.local` (clé `anon` seulement, jamais `service_role`).
2. `npm run dev` → serveur sur `http://localhost:8787` (salle : `ws://localhost:8787/room/<projectId>`).

## Mettre en ligne (une fois par compte Cloudflare)

```bash
npx wrangler login                        # ouvre le navigateur, se connecter à Cloudflare
npx wrangler secret put SUPABASE_URL      # coller l'adresse Supabase
npx wrangler secret put SUPABASE_ANON_KEY # coller la clé anon
npm run deploy
```

Wrangler affiche l'adresse du serveur (`https://fabrics-collab.<compte>.workers.dev`). Ouvrir cette
adresse dans le navigateur doit afficher « Fabrics — serveur temps réel ».

## Connexion d'un client

```js
new WebSocket('wss://<serveur>/room/<projectId>', ['fabrics-collab', session.access_token])
```

| Réponse | Sens |
|---|---|
| 101 | connecté ; un lecteur reçoit le document mais ses modifications sont ignorées |
| 401 | jeton absent, invalide ou expiré |
| 403 | aucun rôle sur ce projet |
| 404 | adresse de salle invalide |
| 502 | Supabase injoignable |
