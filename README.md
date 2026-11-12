# Fabrics

Application web d'édition visuelle sur canevas, avec deux types de projets :

- **Visuel** : affiches, posts, flyers (texte, formes, images).
- **Plan** : plan de pièce ou de bâtiment à l'échelle réelle (murs, pièces, cotes, niveaux, mobilier, 3D),
  avec calcul automatique des métrés (surfaces, périmètres, longueurs). Exports PDF, PNG, DXF, IFC, glTF.

Les projets sont enregistrés dans le navigateur (mode local, sans compte).

**Version en ligne :** https://fabrics-8zd.pages.dev

## Commandes

```bash
npm install      # installer les dépendances (une seule fois)
npm run dev      # serveur de développement → http://localhost:5173
npm run build    # vérification TypeScript + build de production (dossier dist)
npm run lint     # oxlint
npm test         # tests Vitest
npm run preview  # servir le build de production en local
```

## Déploiement

Hébergé sur Cloudflare Pages : build `npm run build`, dossier de sortie `dist`.
Le fichier `public/_redirects` renvoie toutes les adresses vers `index.html` (application à page unique).
Chaque `git push` sur la branche `main` redéploie automatiquement.

## Documentation

Voir le dossier [docs/](docs/) : produit, architecture, roadmap et journal de progression.
