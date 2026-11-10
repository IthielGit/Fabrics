# 03 — Roadmap

Jalons dans l'ordre. Le **MVP = M0 à M6**. Pas de durée : on passe au jalon suivant quand tous
les critères d'acceptation du jalon en cours sont cochés et validés par l'utilisateur.

Légende : `[ ]` à faire · `[x]` terminé (Claude coche au fur et à mesure).

---

## M0 — Mise en place

Objectif : un projet vide qui démarre, se construit et passe le lint.

- [x] Vérifier `node -v` (version LTS récente), `npm -v`, `git --version` ; sinon guider
      l'installation (voir `docs/05-INSTALLATION.md`)
- [x] Générer le projet avec `npm create vite@latest` (modèle React + TypeScript) **dans le
      dossier courant**, en conservant `CLAUDE.md`, `docs/`, `supabase/` et `.env.example`
      (si l'outil refuse un dossier non vide : générer dans un dossier temporaire puis déplacer) ;
      nom du paquet : `fabrics` (minuscules)
- [x] Installer et configurer Tailwind v4 (`tailwindcss` + `@tailwindcss/vite`)
- [x] Installer `react-router` ; deux routes : `/` (Accueil) et `/p/:projectId` (Éditeur),
      pages provisoires
- [x] Créer l'arborescence de `docs/02-ARCHITECTURE.md` (dossiers vides acceptés)
- [x] Créer `src/i18n/fr.ts` et `src/types/document.ts` (copie exacte du modèle de données)
- [x] Vérifier que `.gitignore` contient `node_modules`, `dist`, `.env.local`
- [x] `git init -b main` + premier commit (branche `main`, nécessaire au déploiement de M5)

**Critères d'acceptation**
- `npm run dev` affiche « Fabrics » sur http://localhost:5173, stylé avec Tailwind
- `/p/test` affiche la page Éditeur provisoire
- `npm run build` et `npm run lint` passent

---

## M1 — Socle de l'éditeur

Objectif : créer un projet, dessiner des formes simples, tout retrouver après rechargement.

- [x] Installer `konva`, `react-konva`, `zustand`, `idb-keyval`, `lucide-react`, `clsx`,
      `vitest` ; ajouter le script `"test": "vitest run"`
- [x] `LocalRepository` (IndexedDB) conforme à l'interface `ProjectRepository`
- [x] Accueil : liste des projets (nom, type, date relative), créer un Visuel (choix du format)
      ou un Plan, renommer, dupliquer, supprimer avec confirmation, état vide utile
- [x] Éditeur : `Stage` plein écran, page affichée avec son fond, zoom molette vers le curseur,
      déplacement de la vue (Espace + glisser), « Ajuster à l'écran »
- [x] Barre d'outils : Sélection, Rectangle, Ellipse
- [x] Sélection (clic, Maj + clic, rectangle de sélection), `Transformer` Konva pour
      déplacer / redimensionner / pivoter
- [x] Supprimer, dupliquer, annuler / rétablir (règles de `editorStore`)
- [x] Sauvegarde automatique + indicateur ; titre du projet éditable dans l'en-tête
- [x] Tests Vitest de l'historique (annuler / rétablir) et du dépôt local (`idb-keyval`
      simulé avec `vi.mock`), dont le nettoyage des images non référencées à la suppression

**Critères d'acceptation**
- Je crée un Visuel « Post carré », j'ajoute 3 rectangles, je les déplace, je recharge :
  tout est là
- Annuler 3 fois revient à la page vide ; rétablir 3 fois revient à l'état final
- La sélection multiple + Suppr supprime tous les éléments sélectionnés

---

## M2 — Contenu et mise en forme

Objectif : réaliser le parcours A (post Instagram) de bout en bout, sauf l'export.

- [x] Outil Texte : création au clic, édition au double-clic (zone de saisie superposée),
      police, taille, graisse, italique, couleur, alignement
- [x] Outil Ligne avec option flèche
- [x] Import d'image (bouton + glisser-déposer d'un fichier) ; stockage via `putAsset`
- [x] Panneau Propriétés : position, taille, rotation, opacité, remplissage, contour,
      épaisseur, arrondi — selon le type sélectionné ; champs en unités d'affichage
- [x] Panneau Calques : liste dans l'ordre d'affichage, renommer, masquer, verrouiller,
      réordonner par glisser (HTML5 natif) et par boutons Monter / Descendre, sélection
      synchronisée avec le canevas
- [x] Copier / coller (y compris entre deux projets ouverts successivement)
- [x] Guides d'alignement et aimantation pendant le déplacement
- [x] Tous les raccourcis de `docs/02-ARCHITECTURE.md` qui concernent ces outils
- [x] Miniature du projet régénérée à la sauvegarde (petite image PNG) et affichée à l'Accueil

**Critères d'acceptation**
- Parcours A réalisable sans toucher au code
- Un élément verrouillé ne peut pas être sélectionné sur le canevas, seulement via les calques
- Un texte modifié puis annulé revient exactement à son contenu précédent

---

## M3 — Mode plan et métrés

Objectif : réaliser les parcours B et C (hors export PDF).

- [ ] `src/features/units/` : conversions et formatage (`3,50 m`, `12,40 m²`) + tests
- [ ] `src/features/geometry/` : distance, longueur de polyligne, aire (lacet), périmètre,
      centroïde, aimantation + tests
- [ ] Grille en cm/m, barre d'état « Zoom 100 % · Impression 1:50 » en bas de l'écran
- [ ] Outil Mur : clic par point, Maj = 0/45/90°, double-clic ou Entrée pour finir, Échap pour
      annuler ; épaisseur et hauteur par défaut, modifiables dans Propriétés
- [ ] Longueur du segment en cours affichée en direct pendant le tracé
- [ ] Outil Pièce : polygone fermé, points aimantés aux sommets des murs et aux angles de
      leurs faces ; étiquette au centre (nom + surface au tracé)
- [ ] Murs, pièces et cotes : points absolus, déplacement seul avec le Transformer (règles de
      `docs/02-ARCHITECTURE.md`)
- [ ] Outil Cote : deux points, valeur affichée en mètres, décalage réglable
- [ ] Outil Calibrer pour une image importée (procédure de `docs/02-ARCHITECTURE.md`)
- [ ] Édition des sommets : glisser un sommet d'un mur ou d'une pièce après création
- [ ] Panneau Métrés (pièces, murs, totaux), mis à jour en temps réel
- [ ] Export CSV des métrés
- [ ] Ces outils n'apparaissent que dans les projets de type Plan

**Critères d'acceptation**
- Un rectangle de pièce de 4,00 × 3,00 m affiche 12,00 m² et 14,00 m
- Une pièce tracée sur les faces intérieures de 4 murs (axes 4,00 × 3,00 m, épaisseur 20 cm)
  affiche 10,64 m²
- Une image calibrée sur une distance connue de 3,50 m donne une cote de 3,50 m ± 1 cm entre
  les deux mêmes points
- Le CSV s'ouvre dans Excel ou LibreOffice avec les accents et les décimales corrects
- Tous les tests de `features/` passent

---

## M4 — Export

Objectif : sortir un fichier utilisable de n'importe quel projet.

- [ ] Fenêtre Exporter : format (PNG, JPG, PDF ; CSV pour les plans), résolution, nom de fichier
- [ ] PNG / JPG via Konva, sans la sélection, les guides ni la grille
- [ ] PDF via `jspdf` : A4 / A3, portrait / paysage
- [ ] PDF de Visuel : centré avec marges de 10 mm, ou pleine page si même format A4 / A3
- [ ] PDF de plan à l'échelle choisie (1:20, 1:50, 1:100, 1:200, Ajuster) sur l'emprise du
      contenu, cartouche et barre d'échelle ; avertissement si le plan ne tient pas sur la
      feuille, avec l'échelle qui tient
- [ ] Plafond de résolution (8 192 px par côté, 16,7 Mpx au total) : options trop grandes
      grisées

**Critères d'acceptation**
- Le PNG ×2 d'un post carré fait 2160 × 2160 px
- Imprimé à 100 %, un mur de 1,00 m d'un PDF à 1:50 mesure 2,0 cm à la règle
- Aucun élément d'interface (poignées, grille) n'apparaît dans les fichiers exportés
- Sur un plan de 20 × 15 m, l'option PNG ×3 est grisée et l'export ne plante pas

---

## M5 — Mise en ligne

Objectif : l'application est accessible publiquement (en mode local, sans compte).

- [ ] Créer le dépôt GitHub et pousser le code (guider l'utilisateur pas à pas)
- [ ] Ajouter `public/_redirects` (`/* /index.html 200`)
- [ ] Connecter le dépôt à Cloudflare Pages (build `npm run build`, sortie `dist`)
- [ ] Vérifier la version en ligne : création, sauvegarde, export
- [ ] README : présentation, commandes, lien de la version en ligne

**Critères d'acceptation**
- L'URL `*.pages.dev` fonctionne, y compris en rechargeant directement une page `/p/…`
- Chaque `git push` sur `main` redéploie automatiquement

---

## M6 — Comptes et sauvegarde cloud

Objectif : retrouver ses projets sur un autre appareil.

- [ ] Guider la création du projet Supabase et l'exécution de `supabase/schema.sql`
- [ ] `src/lib/supabase.ts` + `.env.local` ; variables ajoutées dans Cloudflare Pages
- [ ] Page Connexion : inscription e-mail + mot de passe (avec vérification e-mail),
      connexion, mot de passe oublié, déconnexion
- [ ] Connexion Google (optionnelle, seulement si l'utilisateur la veut)
- [ ] `SupabaseRepository` (table `projects`, bucket `assets`, URLs signées)
- [ ] Choix automatique du dépôt : local si déconnecté, Supabase si connecté
- [ ] À la première connexion : proposer d'importer les projets locaux
- [ ] Gestion hors ligne simple : en cas d'échec réseau, garder une copie locale et réessayer

**Critères d'acceptation**
- Un projet créé sur l'ordinateur apparaît sur le téléphone avec le même compte
- Un second compte ne voit **aucun** projet ni image du premier (tester avec deux comptes)
- Sans variables Supabase, l'application fonctionne toujours en mode local

**✅ Fin du MVP**

---

## M7 — Collaboration temps réel (après le MVP)

- [ ] Choisir et documenter l'hébergement du serveur Yjs (option gratuite)
- [ ] Représenter `elements` dans un `Y.Array` / `Y.Map` ; synchroniser avec `editorStore`
- [ ] Curseurs et présence des autres participants (awareness)
- [ ] Persistance de l'état Yjs dans Supabase
- [ ] Partage d'un projet avec un autre compte (lecture ou édition)

---

## Après le MVP (non planifié, à prioriser avec l'utilisateur)

- Ouvertures dans les murs (portes, fenêtres) déduites des surfaces murales
- Modèles de visuels originaux, bibliothèque de composants, identité de marque
- Partage par lien (lecture seule, mot de passe, expiration), QR code
- Commentaires ancrés sur le canevas, mentions, notifications
- Historique de versions avec restauration
- Plusieurs pages par projet, mode présentation
- Espaces de travail, membres et rôles (propriétaire, admin, éditeur, commentateur, lecteur)
- Traductions anglais et malgache, mode sombre, accessibilité avancée
- Abonnements et paiements, statistiques d'usage, conformité RGPD complète
- Assistant IA (mise en page, couleurs, textes)
