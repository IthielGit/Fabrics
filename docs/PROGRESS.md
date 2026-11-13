# Journal de progression

Tenu à jour par Claude à la fin de chaque tâche (voir `CLAUDE.md`).

## État actuel

- **Jalon en cours :** M14 Collaboration temps réel (lot A fait ; lot B à lancer sur feu vert) ; M13 et M12 terminés et validés (MVP terminé) ; M11 bis, M11 et M11 ter terminés, à tester dans le navigateur ; M10 ter terminé et validé
- **Dernière tâche terminée :** M14 · Lot A · hébergement du temps réel (Cloudflare Workers + Durable Objects), documentation
- **Prochaine tâche :** M14 · Lot B (partage avec un autre compte : tables, règles RLS, lien d'invitation), après validation du plan par l'utilisateur
- **Hors jalon (demande de l'utilisateur) :** taille de la page modifiable dans Propriétés (largeur, hauteur, formats proposés) pour plans et visuels
- **Problèmes connus :** aucun test automatisé du rendu Konva (clics, poignées, glisser) : à contrôler à la main ; avertissement de taille de bundle au build (Konva, ~600 Ko, sans conséquence pour M1) ; voir D16 et D17 (lint = oxlint, TypeScript 7)

## Jalons

| Jalon | Statut | Validé par l'utilisateur le |
|---|---|---|
| M0 Mise en place | terminé | 2026-11-10 |
| M1 Socle de l'éditeur | terminé | 2026-11-10 |
| M2 Contenu et mise en forme | terminé | 2026-11-10 |
| M3 Mode plan et métrés | terminé | 2026-11-10 |
| M4 Export | terminé | 2026-11-10 |
| M5 Ouvertures | terminé | 2026-11-10 |
| M6 Niveaux | terminé | 2026-11-10 |
| M7 Axes et mobilier | terminé | 2026-11-10 |
| M8 Vue 3D | terminé | 2026-11-11 |
| M9 Outils de construction | terminé | 2026-11-11 |
| M10 Façades, coupes et planche | terminé | 2026-11-11 |
| M10 bis Ouvertures détaillées, toitures, hachures et textures | terminé, à tester dans le navigateur (lots A, B et C) | |
| M10 ter Documents client / exécution (métrés et cotes) | terminé | 2026-11-12 |
| M11 Import et export | terminé, à tester dans le navigateur | |
| M11 bis Dessin précis, bibliothèque et plafonds | terminé, à tester dans le navigateur (lots A à G) | |
| M11 ter Boussole du plan | terminé, à tester dans le navigateur | |
| M12 Mise en ligne | terminé | 2026-11-12 |
| M13 Comptes, sauvegarde cloud et partage | terminé (fin du MVP) | 2026-11-12 |
| M14 Collaboration temps réel | en cours (lot A fait ; lots B à F à faire) | |

## Journal

<!-- Format d'une entrée (la plus récente en haut) :
### AAAA-MM-JJ — M1 · Outil rectangle
- Fait : …
- Fichiers : src/…, src/…
- Vérification : build ✓ lint ✓ tests ✓ — testé dans le navigateur : …
- Commit : feat: outil rectangle
-->

### 2026-11-13 — Hors jalon · Finition de la scène du hero

- Les trois onglets forment un seul contrôle segmenté (moins de boutons, mêmes fonctions).
- Scène posée sur une ombre portée décalée ; anneau d'invitation autour de la poignée jusqu'au premier geste ; carte des métrés légèrement translucide, voyant « Export Excel prêt » qui pulse.

### 2026-11-13 — Hors jalon · Animations de la page d'introduction (principes d'Emil Kowalski)

- Titre révélé mot par mot, scène dévoilée par le bas, onglets du hero avec un fond actif qui glisse, phrase qui change avec un léger flou.
- Retour d'appui (`scale 0.97`) sur les boutons, flèche du bouton principal qui avance au survol, poignée du comparateur qui se resserre au toucher.
- Courbes personnalisées dans `src/index.css` (`ease-out-strong`, `ease-in-out-strong`) ; mouvement supprimé si « réduire les animations » est actif.
- Vérifié sur navigateur (1440 et 390 px) ; build, lint et tests OK.

### 2026-11-13 — Hors jalon · Hero animé et interactif de la page d'introduction
- Demande de l'utilisateur : un hero qui met en avant les plus-values de l'app, animé et interactif, avec GSAP et Lenis (dépôts `greensock/gsap-skills` et `darkroomengineering/lenis`). Dépendances `gsap` et `lenis` ajoutées avec son accord (listées dans `docs/02-ARCHITECTURE.md`).
- Fait : sous le titre, trois boutons de plus-values qui pilotent la même scène. « Du croquis au plan » (séparateur à glisser), « Métrés automatiques » (le plan se révèle, surfaces comptées de 0 à leur valeur exacte, pièces surlignées tour à tour), « Contrôle avant export » (deux murs superposés repérés en orange, alerte avec les vrais textes « Que faire » et « Voir sur le plan », export marqué bloqué). Défilement fluide Lenis synchronisé avec ScrollTrigger, entrée du titre et apparition des sections au défilement ; rien de tout cela avec « réduire les animations ». Correction de texte : l'export des métrés est Excel (et non CSV). Bouton « Se connecter » de l'en-tête retiré à la demande de l'utilisateur : « J'ai déjà un compte » reste le lien de connexion.
- Fichiers : `src/features/intro/heroModes.ts` (+ test), `src/components/intro/{SketchToPlan,HeroModeTabs,FaultPill,IntroMotion,MeasuresCard,PlanDrawing}.tsx`, `src/pages/IntroPage.tsx`, `src/i18n/fr.ts`, `docs/02-ARCHITECTURE.md`, `package.json`.
- Vérification : build ✓ lint ✓ tests ✓ (2780) — navigateur : trois modes, 1440 et 390 px, aucun défilement horizontal, sections visibles après défilement. Non testé à la main : « réduire les animations » et le défilement à la molette.
- Commit : feat: hero animé et interactif (GSAP, Lenis)

### 2026-11-13 — Hors jalon · Connexion obligatoire et page d'introduction
- Demande de l'utilisateur : l'application ne doit plus être accessible sans connexion ; une page d'introduction mène à la connexion. Contredit l'ancien parcours « sans compte d'abord » de `docs/01-PRODUIT.md`, mis à jour (section « Accès »).
- Fait : garde `RequireAuth` sur `/` et `/p/:projectId` (sans session : renvoi vers `/bienvenue` ; mode local sans Supabase : accès libre) ; restent publics `/bienvenue`, `/connexion`, `/nouveau-mot-de-passe`, `/s/…`. Après connexion, retour à la page demandée (`safeRedirectPath`, testé). `/connexion?mode=inscription` ouvre l'inscription.
- Page `/bienvenue` « Du croquis au plan » (structure choisie par l'utilisateur) : croquis au crayon et plan propre séparés par un curseur à glisser (balayage d'ouverture, respect de « réduire les animations »), métrés calculés par `polygonArea` (`demoPlan.ts`, testé : 21,84 + 11,20 + 3,50 = 36,54 m²), cuisine cotée, planche plan / façade / coupe. Aucune promesse de visuels (l'accueil est « plan seulement »). Police manuscrite Caveat (OFL, Google Fonts) pour le croquis seulement.
- Fichiers : `App.tsx`, `LoginPage.tsx`, `IntroPage.tsx`, `RequireAuth.tsx`, `redirect.ts` (+ test), `demoPlan.ts` (+ test), `src/components/intro/*`, `fr.ts`, `PRODUCT.md`, `docs/01-PRODUIT.md`.
- Vérification : build ✓ lint ✓ tests ✓ (2773) — navigateur : 1440 et 390 px sans défilement horizontal, garde et retour après connexion contrôlés.
- Commit : feat: connexion obligatoire et page d'introduction

### 2026-11-12 — M14 · Lot A : hébergement du temps réel (documentation)
- Fait : décisions D68 à D70 prises avec l'utilisateur et écrites dans `docs/02-ARCHITECTURE.md` (nouvelle section « Collaboration temps réel (M14) » : serveur, authentification sans secret, membres et invitations, liaison Yjs, annuler / rétablir) ; roadmap M14 découpée en lots A à F.
- Fichiers : `docs/02-ARCHITECTURE.md`, `docs/03-ROADMAP.md`, `docs/PROGRESS.md`. Aucun code.
- Vérification : documentation seulement (rien à compiler).
- Prochain : lot B (partage avec un autre compte : tables, règles RLS, lien d'invitation), après validation.

### 2026-11-12 — M13 · Connexion Google (correction du journal)
- Constat : la connexion Google est déjà en place, contrairement à ce que le journal disait (« écartée pour M13 ») : le bouton « Continuer avec Google » (`LoginPage.tsx`, `signInWithGoogle` dans `authStore.ts`, textes dans `fr.ts`) a été ajouté dans les fichiers par l'utilisateur et a été embarqué sans que Claude le remarque dans le commit `b13e50c` (« fix: le script de sécurité… ») par un `git add -A`. Il est donc déjà sur `main` et en ligne. Le fournisseur Google est activé dans Supabase.
- Vérifié : la fonction d'autorisation Supabase redirige bien vers `accounts.google.com` (302), avec retour vers le site ; build ✓ lint ✓.
- Non vérifié par Claude : une vraie connexion Google de bout en bout, et le lien automatique d'un compte Google avec un compte e-mail de même adresse (comportement par défaut de Supabase).
- Leçon de méthode : avant un commit, lister les fichiers modifiés (`git status`) au lieu d'un `git add -A` aveugle.

### 2026-11-12 — M13 · Mise en ligne des lots A à F
- Fait : `feat/m13` fusionnée dans `main` (avance rapide) et poussée ; Cloudflare a redéployé. Vérifié à distance sur https://fabrics-8zd.pages.dev : l'adresse du projet Supabase et la clé publiable sont dans le code publié (donc les variables Cloudflare sont bonnes) ; aucune vraie clé secrète dans le code (le seul `sb_secret_` est un test de préfixe de la bibliothèque `supabase-js`) ; `/connexion`, `/nouveau-mot-de-passe` et `/s/<jeton>` renvoient l'application (200) ; la fonction de partage répond « unavailable » pour un jeton inconnu.
- Validé par l'utilisateur le 2026-11-12 après essai sur le site en ligne : M13 terminé, fin du MVP.
- Vérification : build ✓ lint ✓ tests ✓ (2762).

### 2026-11-12 — M13 · Lot F : contrôle de sécurité à deux comptes (script prêt, à lancer)
- Fait : le lot E est validé par l'utilisateur (SQL exécuté, partage essayé). Vérifié à distance : un visiteur ne peut lire ni `shares` ni les projets, ne peut pas créer de lien, et un jeton inconnu donne « indisponible ». Script `scripts/check-security.mjs` (commande `npm run check:security`, jamais lancé par `npm test`) : se connecte avec deux comptes de test, crée un projet, une image et un lien protégé, puis vérifie que B ne peut ni lire, ni modifier, ni supprimer, ni créer quoi que ce soit chez A (projets, liens, images, signatures de téléchargement), que le visiteur anonyme ne lit aucune table, et que le lien se comporte comme prévu (mot de passe demandé / refusé / accepté, désactivé, réactivé, expiré, retiré, supprimé, réponse sans identifiant de compte ni mot de passe haché). Il supprime ses données à la fin.
- Résultat : l'utilisateur a validé le lot le 2026-11-12 après avoir lancé le script (comptes de test créés par e-mail + mot de passe ; le compte B ajouté dans Supabase avec « Auto Confirm User » car la limite d'e-mails par heure était atteinte). La sortie du script n'a pas été relue par Claude.
- Fichiers : `scripts/check-security.mjs`, `package.json` (script `check:security`).
- Vérification : syntaxe ✓ lint ✓ ; le script refuse de démarrer sans les variables de test.

### 2026-11-12 — M13 · Lot E : partage par lien en lecture seule (à tester)
- Fait : (1) base : table `shares` (jeton aléatoire de 192 bits tiré par la base, actif, mot de passe haché bcrypt, expiration), accès par colonne (le mot de passe haché n'est jamais lisible depuis le navigateur), RLS propriétaire seulement, fonctions `create_share` (plans seulement), `set_share_password`, et `get_shared_project` seule porte d'entrée des visiteurs (même réponse « indisponible » pour jeton inconnu, désactivé ou expiré). (2) bouton « Partager » dans l'éditeur (plan, connecté) : créer un lien avec mot de passe et date limite facultatifs, copier, désactiver / réactiver, changer ou retirer le mot de passe, changer la date, supprimer. (3) page publique `/s/<jeton>` : demande le mot de passe si besoin, puis plan (déplacer et zoomer seulement), niveaux, 3D et planche ; aucun outil de modification, aucun enregistrement.
- Limites connues : les images importées ne sont pas visibles dans un plan partagé (le stockage reste privé) ; pas de limitation du nombre d'essais de mot de passe (le hachage bcrypt ralentit les essais) ; seuls les plans se partagent (pas les visuels) ; il faut réexécuter `supabase/schema.sql` dans Supabase (réexécutable sans risque).
- Fichiers : `supabase/schema.sql`, `src/features/sharing/` (logique, API, tests), `src/components/editor/ShareDialog.tsx`, `ShareItem.tsx`, `EditorHeader.tsx`, `EditorStage.tsx` (option lecture seule), `src/pages/SharePage.tsx`, `App.tsx`, `src/i18n/fr.ts`.
- Vérification : build ✓ lint ✓ tests ✓ (2762, dont 12 nouveaux). Le SQL n'a pas été exécuté ici : à lancer dans Supabase puis à tester avec un vrai lien.

### 2026-11-12 — M13 · Lot D : import des projets locaux et hors ligne
- Fait : (1) à la connexion, si le navigateur contient des projets, une fenêtre propose de les copier dans le compte (images d'abord, puis projet ; jamais d'écrasement d'un projet déjà dans le compte ; les projets locaux ne sont pas supprimés ; refus ou succès mémorisés par compte sur l'appareil, un échec laisse la proposition active). (2) `ResilientRepository` autour du dépôt cloud : réseau coupé → projet ou image gardés dans IndexedDB (séparés par compte), l'enregistrement ne signale pas d'erreur, l'en-tête affiche « Hors ligne : modifications gardées sur cet appareil », renvoi automatique au retour du réseau, toutes les 30 s, et au démarrage ; les écritures passent une par une pour qu'un renvoi tardif n'écrase jamais un enregistrement plus récent ; les erreurs qui ne viennent pas du réseau (droits, données) remontent normalement.
- Limites connues : la liste de l'accueil hors ligne reste en erreur (seules les modifications sont gardées) ; une suppression de projet hors ligne échoue ; si le même projet est modifié sur deux appareils, le dernier envoi gagne.
- Fichiers : `src/features/persistence/ResilientRepository.ts`, `networkError.ts`, `importLocal.ts`, `importPrompt.ts` (+ tests), `repository.ts`, `LocalRepository.ts`, `src/stores/syncStore.ts`, `src/components/home/ImportLocalDialog.tsx`, `SaveIndicator.tsx`, `HomePage.tsx`, `src/i18n/fr.ts`.
- Vérification : build ✓ lint ✓ tests ✓ (2750, dont 14 nouveaux). À tester dans le navigateur (mode « Hors connexion » des outils de développement).

### 2026-11-12 — M13 · Lot C : sauvegarde dans le cloud
- Fait : `SupabaseRepository` (liste sans document, lecture avec migration, enregistrement par `upsert`, suppression avec nettoyage des images plus utilisées, images dans `assets/<compte>/<image>`, URLs signées d'une heure mises en cache) ; `repository` suit la connexion : cloud si connecté, local sinon, choisi avant que la session soit déclarée prête ; l'accueil et l'éditeur attendent la fin de lecture de la session avant de lire les projets, et relisent si le compte change. Les projets locaux restent intacts dans le navigateur (lot D : import proposé).
- Vérifié à distance : un visiteur anonyme ne peut pas créer de projet (erreur RLS 42501).
- Limite connue : si l'on se déconnecte pendant qu'un projet est ouvert, l'enregistrement suivant part dans le dépôt local.
- Fichiers : `src/features/persistence/SupabaseRepository.ts`, `cloudMapping.ts`, `repository.ts` (+ tests), `src/stores/authStore.ts`, `src/pages/EditorPage.tsx`, `HomePage.tsx`.
- Vérification : build ✓ lint ✓ tests ✓ (2736, dont 12 nouveaux avec un faux client Supabase). Pas encore essayé avec un vrai compte : à tester dans le navigateur.

### 2026-11-12 — M13 · Lot B : page de connexion
- Fait : pages `/connexion` (connexion, inscription avec e-mail de confirmation, mot de passe oublié) et `/nouveau-mot-de-passe` (lien reçu par e-mail) ; bouton « Se connecter » / « Se déconnecter » en haut de l'accueil, invisible quand Supabase n'est pas configuré. Contrôles de saisie (adresse valide, 8 caractères, confirmation) et erreurs Supabase traduites en français. Les projets restent encore enregistrés localement : le lot C branchera le cloud. Connexion Google : non (idée).
- Fichiers : `src/stores/authStore.ts`, `src/features/auth/` (validation, erreurs, tests), `src/pages/LoginPage.tsx`, `ResetPasswordPage.tsx`, `src/components/auth/`, `src/components/home/AccountButton.tsx`, `App.tsx`, `HomePage.tsx`, `src/i18n/fr.ts`.
- Vérification : build ✓ lint ✓ tests ✓ (2727). Pas de test automatisé des écrans ; l'inscription et les liens par e-mail sont à essayer à la main (redirections Supabase nécessaires).

### 2026-11-12 — M13 · Lot A (partie code) : client Supabase
- Fait : dépendance `@supabase/supabase-js` ; `src/lib/supabase.ts` (client créé seulement si `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont remplies, sinon `supabase` vaut `null` et l'application reste en mode local) ; `.env.example` déjà prêt.
- Reste du lot A (à faire avec l'utilisateur) : créer le projet Supabase, exécuter `supabase/schema.sql`, remplir `.env.local`, ajouter les variables dans Cloudflare Pages, régler les adresses de redirection.
- Fichiers : `src/lib/supabase.ts`, `src/lib/supabase.test.ts`, `package.json`.
- Vérification : build ✓ lint ✓ tests ✓ (3 nouveaux).
- Idée notée : les e-mails Supabase par défaut sont très limités par heure ; brancher un service d'envoi avant d'ouvrir à de vrais utilisateurs. Connexion Google : non pour M13.

### 2026-11-12 — M12 · Dépôt GitHub, redirection SPA, README
- Fait : `feat/m11-bis` fusionnée dans `main` (avance rapide) ; `public/_redirects` créé (`/* /index.html 200`, bien présent dans `dist/`) ; README réécrit (présentation, commandes, déploiement) ; `main` poussée sur https://github.com/IthielGit/Fabrics.git.
- Cloudflare Pages connecté (build `npm run build`, sortie `dist`, branche `main`) : https://fabrics-8zd.pages.dev. Vérifié par requête : `/`, `/p/test-123` et une adresse inconnue renvoient tous l'application (200). Lien ajouté au README.
- Reste : test dans le navigateur par l'utilisateur (création, sauvegarde, export, rechargement sur `/p/…`) ; le redéploiement automatique au prochain `git push` sera confirmé par ce push.
- Fichiers : `public/_redirects`, `README.md`, `docs/03-ROADMAP.md`, `docs/PROGRESS.md`.
- Vérification : build ✓ lint ✓ tests ✓ (2713 ; le test de vitesse « 600 murs » a échoué sous la charge et passe seul : connu).

### 2026-11-12 — Hors jalon · Export IFC pour Revit (option A, sans bibliothèque)
- Fait : nouveau format « IFC (Revit) » dans Exporter le projet (plans seulement), écrit à la main en IFC2x3 (texte STEP), en mm. Contenu : un étage par niveau, un mur par côté de ligne (bout prolongé d'une demi-épaisseur aux raccords), ouvertures (réserve dans le mur + porte ou fenêtre ; une baie devient une fenêtre), pièces (espaces) et un sol par pièce, nord du plan. Les identifiants sont déduits de ceux des éléments : deux exports du même plan donnent les mêmes. Tous les niveaux dans un seul fichier ; refusé s'il y a un manque ou un débord (D55), comme le DXF.
- Pas encore (hors périmètre de cette tâche) : escaliers, toitures, plateformes, cheminées, mobilier, matériaux. Les raccords d'angle sont des boîtes qui se recouvrent un peu.
- Fichiers : `src/features/export/ifc.ts` (+ `ifc.test.ts`), `fileName.ts`, `exportProject.ts`, `ExportDialog.tsx`, `src/i18n/fr.ts`.
- Vérification : build ✓ lint ✓ tests ✓ (11 nouveaux ; le test de vitesse « 600 murs » a échoué sous la charge et passe seul : connu). **Non vérifié : l'ouverture réelle du fichier dans Revit** (pas de Revit ici).

### 2026-11-12 — Hors jalon · Exemples : fenêtres de WC hautes, têtes de lit libres
- Fait : dans les deux exemples (maison et grande maison), les fenêtres de WC et de salle de bains avec WC sont petites et hautes (600 × 600 mm, allège 1500 mm, constante `WC_WINDOW`) ; les fenêtres sont décalées ou retirées pour qu'aucune tête de lit ne soit devant une fenêtre.
- Fichiers : `src/features/documents/examplePlan.ts`, `largeHousePlan.ts`.
- Vérification : build ✓ lint ✓ tests ✓ (2703 ; le test de vitesse « 600 murs » a échoué sous la charge et passe seul : connu).

### 2026-11-12 — Hors jalon · Rendu 3D plus soigné (lot A : objets, matières, sol)
- Fait : (1) le parasol, la pergola, le gazebo et le carport ne sont plus des blocs pleins (mât et toile en cône ; quatre poteaux et un toit mince) ; (2) la piscine et les mares sont dessinées : bassin d'eau bleu avec margelle ; (3) chaque type d'objet a son aspect (bois, tissu, blanc laqué, métal, pierre, plantes, eau, carrosserie) et les objets ronds sont des cylindres ; voitures avec caisse, habitacle vitré et roues ; arbres avec tronc et couronne ronde ; (4) les exemples ont des murs en maçonnerie (brique pour le garage), un toit en tuiles, des terrasses en bois et une plage de piscine en pierre (la couleur d'une plateforme est maintenant reprise en 3D) ; (5) les panneaux de porte de garage ont leur propre matière métal ; (6) le terrain est une pelouse. Façades, coupes, métrés et exports ne changent pas.
- Fichiers : `src/features/building/furnitureParts.ts` (nouveau) et son test, `types.ts`, `model.ts`, `furniture.ts`, `openingFills.ts`, `views/projection.ts`, `views/section.ts`, `src/components/viewer3d/Viewer3DScene.tsx`, `src/features/documents/examplePlan.ts`, `largeHousePlan.ts`.
- Vérification : build ✓ lint ✓ tests ✓ (2703) — à regarder dans la vue 3D de « Voir une grande maison » (à recréer).

### 2026-11-12 — Hors jalon · Grande maison : garage, véranda, terrasses, piscine
- Fait : l'exemple « grande maison R+3 » passe en page « Bâtiment » (40000 × 30000 mm) et reçoit un garage deux voitures accolé à l'est (porte sectionnelle de 5000 mm, porte de service vers la cuisine, toit plat), une véranda au sud du séjour vitrée sur trois côtés (baies coulissantes de 3000 et 4400 mm), une terrasse en L (repas sous parasol, cuisine d'été), une piscine de 10000 × 5000 mm entourée d'une plage en U (la piscine reste visible en creux en 3D) et une terrasse sur le toit du garage à l'étage 1, accessible par une baie depuis la chambre 3. 21 pièces, 3 plateformes. Aucune alerte de métrés.
- Fichiers : `src/features/documents/largeHousePlan.ts`, `createProject.ts`, `createProject.test.ts`, `src/i18n/fr.ts`.
- Vérification : build ✓ lint ✓ tests ✓ (2692) — à regarder dans le navigateur : accueil → « Voir une grande maison ».

### 2026-11-12 — Hors jalon · Exemple « grande maison R+3 »
- Fait : nouvelle carte d'accueil « Voir une grande maison ». Maison de 12000 × 10000 mm hors tout (120 m² au sol), quatre niveaux (rez-de-chaussée + 3 étages), 19 pièces meublées, escalier en U empilé au centre (trois volées), toit à deux pans, 2 cotes et une ligne de coupe A à travers l'escalier. Aucune alerte de métrés ; un test vérifie aussi que chaque meuble des deux exemples tient dans une pièce de son niveau.
- Fichiers : `src/features/documents/largeHousePlan.ts` (nouveau), `examplePlan.ts` (aides partagées), `createProject.ts`, `createProject.test.ts`, `src/stores/projectsStore.ts`, `src/pages/HomePage.tsx`, `src/i18n/fr.ts`.
- Vérification : build ✓ lint ✓ tests ✓ (2691) — à regarder dans le navigateur : accueil → « Voir une grande maison ».

### 2026-11-12 — Correctif · Vide entre les étages en 3D
- Fait : la dalle n'était posée que sous les pièces ; avec des murs de 2500 mm sur un étage de 2700 mm, il restait un vide de 200 mm au droit des murs (entre étages et sous le toit). Désormais, dans la maquette (3D, façades, coupes), un mur qui monte jusque sous la dalle du dessus la traverse jusqu'au plancher suivant (au dernier niveau : jusqu'à la base du toit). Un muret plus bas garde sa hauteur ; les métrés gardent la hauteur saisie.
- Fichiers : `src/features/building/model.ts` (`wallHeightInModel`), `src/features/building/model.test.ts`.
- Vérification : build ✓ lint ✓ tests ✓ (2685) — à regarder dans la vue 3D de l'exemple.

### 2026-11-12 — Hors jalon · Exemple plus complet (« Voir un exemple »)
- Fait : le plan d'exemple devient une maison à deux niveaux : rez-de-chaussée (séjour et coin repas, cuisine avec îlot, entrée avec escalier en L, WC et buanderie) et étage (deux chambres, salle de bains, bureau, palier, dressing), 10 pièces, une quarantaine de meubles, portes, fenêtres et baie, 3 cotes, une ligne de coupe A et une toiture à deux pans. Aucune alerte de métrés (testé).
- Fichiers : `src/features/documents/examplePlan.ts` (nouveau, contenu du plan), `src/features/documents/createProject.ts`, `src/features/documents/createProject.test.ts`, `src/i18n/fr.ts` (textes de l'exemple et de la carte d'accueil).
- Vérification : build ✓ lint ✓ tests ✓ (2681) — à regarder dans le navigateur : accueil → « Voir un exemple ».

### 2026-11-12 — M11 ter · Boussole du plan
- Fait : demande de l'utilisateur (« une vraie boussole, avec une logique simple »). Règle unique : le nord est **un seul angle** (`plan.northAngle`), tout le reste en découle. **Boussole interactive** en bas à gauche du canevas d'un plan, **affichée à la demande** (bouton boussole dans la barre d'état ; masquée par défaut ; choix mémorisé dans le navigateur, jamais dans le projet) : rose N / E / S / O, aiguille rouge vers le nord, légende « Nord : 30° ». On la tourne à la souris (aimantée tous les 15°, Maj = au degré), aux flèches du clavier (Maj = 1°), double-clic ou Début = nord en haut. L'angle reste local pendant le geste et n'est enregistré qu'au relâchement : un seul « Annuler ». Liée au champ « Nord » des réglages du plan. **Rose des vents à l'impression** : la flèche des annotations de plan reçoit des graduations aux 4 points et les lettres N, E, S, O qui suivent le nord (repris dans PDF, PNG, DXF et planche) ; le repère de niveau descend sous la lettre du sud. Les lettres E, S, O sont facultatives dans `ExecutionLabels` (sans elles, seul le N est écrit, comme avant).
- Fichiers : src/features/building/compass.ts (+ test), src/stores/compassStore.ts, src/components/editor/CompassWidget.tsx, ZoomControls.tsx, src/pages/EditorPage.tsx, src/features/dimensioning/planMarks.ts (+ test), executionDimensions.ts, planDecorations.ts, src/i18n/fr.ts, dimensioningLabels.ts
- Vérification : build ✓ lint ✓ tests ✓ (2654 au total) — **à contrôler dans le navigateur** : ouvrir un plan, cliquer l'icône boussole en bas à gauche, tourner l'aiguille, vérifier le champ « Nord » dans Propriétés ; cocher « Flèche du nord et repère de niveau » et regarder un export PDF
- Idée notée : régler le nord avec le capteur d'un téléphone (non fait : demande des autorisations, inutile sur PC).
- Commit : feat: boussole du plan et rose des vents (M11 ter)

### 2026-11-12 — M11 bis · Correctif · Import DXF hors de la page
- Problème vu à l'essai : un DXF plus grand que la page (feuille A0 avec cartouche, par exemple) était centré sur la vue et débordait de la page et de la grille.
- Correction : `placeImport` (dans `dxfImport.ts`) garde le dessin dans la page, et agrandit la page (marge de 2000 mm, limite 200 m) s'il est trop grand. `ImportDxfDialog.tsx` l'utilise. 4 tests ajoutés.
- Pour un projet déjà importé : agrandir la page dans les réglages du plan, ou supprimer le fond et le réimporter.

### 2026-11-12 — M11 bis · Lot H · Murs propres : métrés justes et contrôle du plan
- Demande de l'utilisateur : rendre les irrégularités de dessin invisibles ou faciles à corriger, sans vocabulaire technique (points 1, 2 et 3 d'une même proposition).
- Fait :
  1. **Métrés** : `tJunctionAdjustments` (`src/features/geometry/wallContacts.ts`) repère les murs qui se terminent dans l'épaisseur d'un autre (à peu près perpendiculaires). `computeMeasurements` retire de leur volume la part comptée dans l'autre mur, et des longueurs de faces la part cachée ou recouverte. Les angles en L ne changent pas (leurs erreurs s'annulaient déjà).
  2. **Aimantation** : un mur s'aimante au moins à 50 mm (`usePolylineDrawing.ts`), même très zoomé. L'aimantation sur l'axe des murs existait déjà.
  3. **Contrôle** : `wallIssues` détecte les écarts (≤ 50 mm, entre deux bouts ou entre un bout et un mur) et les murs superposés. Ils s'ajoutent à « À vérifier » du panneau Métrés (`MetresWarningList`), avec un bouton **Joindre** ou **Corriger** (annulable avec Ctrl+Z), et une pastille « N points à vérifier » dans l'en-tête (`PlanCheckBadge.tsx`). Un mur entièrement dans un autre est signalé sans correction automatique.
- Limites connues : un T en biais (hors ±3° de la perpendiculaire) ou posé sur un sommet d'un tracé à plusieurs côtés n'est pas corrigé dans les métrés ; un écart n'est cherché qu'avec un mur à plus de 30° du bout.
- Fichiers : `src/features/geometry/wallContacts.ts` (+ test), `src/features/measurements/{measurements,warnings}.ts` (+ `wallJunctions.test.ts`), `src/components/editor/{MetresWarningList,PlanCheckBadge,EditorHeader,metresWarningText,usePolylineDrawing}`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (2665)

### 2026-11-12 — M11 bis · Correctif · Retrait des étiquettes de cote automatiques
- Demande de l'utilisateur : la lecture n'était pas naturelle (longueurs de face extérieure écrites dans les pièces à côté des dimensions intérieures, murs coupés par les ouvertures). Il a demandé d'enlever l'option.
- Fait : suppression de la case « Étiquettes de cote », de `lengthLabels.ts` (+ test), de `plan.showDimensionLabels` (type, textes, doc d'architecture). `planDecorations` ne rend plus que la flèche du nord et le repère de niveau. La décision D66 est caduque. Un ancien projet qui contient encore `showDimensionLabels` s'ouvre sans problème (le champ est ignoré).
- Idée gardée pour plus tard : cotes de murs mesurées entre faces intérieures dans les pièces, un seul chiffre par mur malgré les ouvertures, texte jamais dans une pièce voisine.

### 2026-11-12 — M11 bis · Lot F · Tâche 4 · Étiquettes de cote automatiques (retirées, voir ci-dessus)
- Décision de l'utilisateur (D66) : option « calculées, non enregistrées », longueurs de murs **et** largeurs d'ouvertures.
- Fait : case **« Étiquettes de cote »** dans les réglages du plan (option `plan.showDimensionLabels`, facultative, absente = non). Quand elle est cochée, le plan écrit en mm, **le long des murs**, la longueur de chaque côté de mur (côté extérieur) et la largeur de chaque porte, fenêtre et baie (côté intérieur), texte aligné sur le mur et jamais à l'envers. Les côtés trop courts pour porter un chiffre ne sont pas étiquetés. Recalculées à chaque modification du plan, **jamais enregistrées** dans le document (seule la case l'est). Reprises dans le PDF et le PNG du plan, les plans de niveau de la planche et le DXF (calque `COTES`), avec la flèche du nord.
- Fichiers : `src/features/dimensioning/{lengthLabels,planDecorations}.ts` (+ test), `planOverlay.ts`, `src/components/editor/{PlanMarksLayer,PlanSettingsSection}.tsx`, `src/i18n/fr.ts`, `src/types/document.ts`, `docs/02-ARCHITECTURE.md`
- Vérification : build ✓ lint ✓ tests ✓ (2641)
- Commit : feat: étiquettes de cote automatiques des murs et des ouvertures (M11 bis, lot F)

### 2026-11-12 — M11 bis · Jalon terminé, à tester dans le navigateur
- Toutes les tâches des lots A à G sont faites et commitées une par une (ou par lot). Le test dans le navigateur est prévu à la fin du jalon, à la demande de l'utilisateur ; scénarios à parcourir : voir la réponse de fin de session.
- Validation de l'utilisateur : en attente.

### 2026-11-12 — M11 bis · Lot F · Tâche 5 · Annotations de plan (flèche du nord, repère de niveau)
- Fait : case **« Flèche du nord et repère de niveau »** dans les réglages du plan (Propriétés, rien de sélectionné) ; option `plan.showAnnotations` (facultative, absente = non : un projet d'avant M11 bis ne change pas). Quand elle est cochée, le plan affiche **à droite du bâtiment** une flèche du nord dans un cercle (dessinée de zéro avec des traits simples, pointe vers le nord réglé dans « Nord », lettre N) et le repère du niveau affiché (« Niveau RDC (±0) »). Calculés à chaque modification, jamais enregistrés. Repris dans le **PDF et le PNG** du plan (la zone exportée s'agrandit pour les contenir), dans les **plans de niveau de la planche** et dans le **DXF** (sur le calque `COTES`, comme les cotes automatiques), indépendamment du réglage « Cotation ». Taille proportionnelle à la hauteur des textes, donc lisible à toutes les échelles.
- Fichiers : `src/features/dimensioning/planMarks.ts` (+ test), `planOverlay.ts`, `executionDimensions.ts` (libellés `north`, `levelMark`), `src/components/editor/{PlanMarksLayer,EditorStage,PlanSettingsSection}.tsx`, `src/features/export/dxfPlan.ts`, `src/i18n/{fr,dimensioningLabels}.ts`, `src/types/document.ts`, `docs/02-ARCHITECTURE.md`
- Vérification : build ✓ lint ✓ tests ✓ (2634) — à contrôler dans le navigateur et dans un PDF à la fin du jalon
- Commit : feat: flèche du nord et repère de niveau sur le plan et les exports (M11 bis, lot F)

### 2026-11-12 — M11 bis · Lot F · Tâche 3 · Bibliothèque personnelle
- Fait : dans le panneau Bibliothèque, bouton **« Enregistrer la sélection »** (actif quand la sélection contient des objets de la bibliothèque) : on donne un nom (« Ensemble cuisine ») et les objets (position, rotation, taille, retournement) sont gardés relativement au coin de leur emprise ; les murs, pièces et autres éléments de la sélection ne sont pas gardés. L'ensemble apparaît dans la puce **« Mes ensembles »** (et dans la recherche et la catégorie Ensembles) avec la mention « Mon ensemble » ; il se pose comme un ensemble du catalogue (clic puis clic sur le plan, ou glisser-déposer, un seul pas d'annulation) avec les mêmes positions relatives. Bouton corbeille pour le supprimer. **Stockage local du navigateur** (`fabrics.library.userSets`, 50 ensembles au plus), jamais dans le projet ; synchronisation avec le compte au jalon M13.
- Fichiers : `src/features/library/{userRegistry,userSets}.ts` (+ test), `catalog/prefabs.ts` (`getPlaceable` connaît les ensembles de l'utilisateur), `src/components/library/{LibraryPanel,useUserSets,symbolText}.ts(x)`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (2628) — à tester dans le navigateur à la fin du jalon : sélectionner une cuisine, l'enregistrer, la poser ailleurs, recharger la page
- Commit : feat: bibliothèque personnelle d'ensembles (M11 bis, lot F)

### 2026-11-12 — M11 bis · Lot F · Tâche 1 · Pose contre un mur
- Fait : les objets **muraux** de la bibliothèque (WC, lavabo, baignoire, radiateur, éléments de cuisine, électroménager, armoires, bibliothèques, meubles hauts…, liste dans `againstWall.ts`) se collent à la **face du mur le plus proche** quand on les pose et quand on les déplace : le **dos** de l'objet (le haut du dessin, convention du catalogue) touche le mur, la face avant est tournée vers la pièce (rotation 0°, 90°, 180° ou 270° pour un mur droit), l'objet glisse le long du mur sous le curseur sans dépasser en bout. Accroche à moins de 28 px de la face du mur. L'aperçu de pose montre déjà l'objet tourné. **Alt** pendant un déplacement : sans accroche au mur. Les tables, lits, canapés et autres meubles libres ne tournent pas. Un test vérifie que tout objet du catalogue fixé en hauteur est dans la liste (sauf luminaires, hotte d'îlot, parasol, pergola, gazebo, carport, cassette de climatisation, VMC).
- Fichiers : `src/features/library/againstWall.ts` (+ test), `placement.ts`, `src/components/editor/{EditorStage,FurnitureGhost,useElementInteractions}.tsx|ts`
- Vérification : build ✓ lint ✓ tests ✓ (2623 ; le test de vitesse « 600 murs » échoue parfois sous la charge) — à contrôler dans le navigateur à la fin du jalon : poser un WC près d'un mur, puis le glisser
- Commit : feat: pose des objets muraux contre un mur (M11 bis, lot F)

### 2026-11-12 — M11 bis · Lot F · Tâche 2 · Hauteurs 3D des objets
- Fait : chaque objet du catalogue a une **hauteur de référence en mm** (nouveau fichier `catalog/heights.ts`, valeurs génériques d'usage courant : lit 500, plan de travail 900, réfrigérateur-congélateur 1850, table 750…) et, pour un objet fixé en hauteur, la **hauteur de son dessous** (meuble haut de cuisine 700 à 1450, hotte 450 à 1850, miroir mural 900 à 1000…). Aucun nom ni mesure de fabricant (clean room). Les objets du plan s'affichent maintenant **en 3D** comme des boîtes simples de cette hauteur, posées sur le plancher de leur niveau, tournées comme sur le plan ; pas de volume pour les zones (tapis, couloirs de manœuvre), les symboles conventionnels (prises, détecteurs) et les escaliers symboliques. Clic dans la 3D = sélection de l'objet. Façades et coupes inchangées. L'export glTF reprend les objets.
- Fichiers : `src/features/library/catalog/{heights,define}.ts` (+ test), `src/features/building/{furniture,model,types}.ts` (+ test), `src/components/viewer3d/Viewer3DScene.tsx`
- Vérification : build ✓ lint ✓ tests ✓ (2614) ; un test vérifie que chaque objet du mobilier a sa règle propre — à contrôler dans la vue 3D à la fin du jalon
- Commit : feat: hauteurs 3D des objets de la bibliothèque (M11 bis, lot F)

### 2026-11-12 — M11 bis · Lot G · Plafonds : métrés, faux plafond et cote sous plafond
- Fait : **tableau « Plafonds »** dans les métrés, en **Client et en Technique** : par pièce, surface de plafond (= surface au sol, trémie déduite, D37), hauteur sous plafond (D52, aucun nouveau calcul) et périmètre ; total de la surface. Présent dans le panneau Métrés (Client : tous les niveaux ; Technique : niveau affiché), en PDF, Excel et CSV (le CSV à plat reçoit « Hauteur sous plafond » et « Faux plafond »). **Faux plafond** : case « Faux plafond » dans Propriétés d'une pièce (champ facultatif `falseCeiling`, absent = non, aucune migration) ; le tableau ajoute alors une ligne « Salon – faux plafond » avec sa surface, **sans l'ajouter au total** (il est posé sous le plafond). **Cote d'altitude sous plafond** : l'étiquette de chaque pièce du plan en cotation **Technique** gagne une ligne « +2650 sous plafond » (sol + hauteur sous plafond), entre « Sol ±0 » et « Dalle +2850 ». **Rien en Client** : les étiquettes Client sont inchangées.
- Vérification : une chambre de 4000 × 3000 sous une dalle à +2650 donne `12,00` m² et `2650` mm en Client et en Technique (test) ; une pièce sans l'option ne change pas ; build ✓ lint ✓ tests ✓ (2606 ; le test de vitesse « 600 murs » échoue parfois sous la charge, il passe seul)
- Fichiers : `src/features/measurements/{tables,clientView,measurements,csv}.ts` (+ tests), `src/features/dimensioning/executionDimensions.ts` (+ test), `src/components/editor/{MeasurementsPanel,PlanElementFields}.tsx`, `src/i18n/{fr,dimensioningLabels}.ts`, `src/types/document.ts`, `docs/02-ARCHITECTURE.md`
- Commit : feat: plafonds dans les métrés, faux plafond et cote sous plafond (M11 bis, lot G)

### 2026-11-12 — M11 bis · Lot E · Tâche 2 · Import DXF : les textes
- Fait : l'import reprend les **textes** (TEXT et MTEXT, y compris dans les blocs, avec leur position, échelle et rotation). Chaque texte devient un élément `text` **verrouillé, du même groupe que les traits** (une seule ligne « Fond DXF – plan.dxf » dans les calques, « N éléments ») : masquer, verrouiller, sélectionner en entier, Suppr, déplacement d'un bloc une fois déverrouillé. **Hauteur** : la hauteur des majuscules du fichier, en mm, donne la taille de police (÷ 0,7) ; le point d'accroche (ligne de base, haut, milieu, centre, droite) est ramené au coin haut-gauche ; rotation conservée (axe y retourné). Codes de mise en forme retirés (`\P`, polices, `\U+00E9`, `%%c` `%%d` `%%p`). Un fichier qui ne contient que des textes est accepté. La fenêtre d'import affiche le nombre de textes ; 5000 textes au plus (les suivants sont ignorés).
- Choix technique (D65) : champ facultatif `groupId` sur les éléments `text` (comme sur `line`, D62), sans changement de version du document.
- Fichiers : `src/features/export/dxfImport.ts` (+ tests), `src/features/documents/backgroundGroup.ts` (nouveau), `src/types/document.ts`, `ImportDxfDialog.tsx`, `LayersPanel.tsx`, `useElementInteractions.ts`, `src/i18n/fr.ts`, `docs/02-ARCHITECTURE.md`
- Vérification : build ✓ lint ✓ tests ✓ (2602) ; aller-retour avec l'export (« Séjour » à 125 mm) ✓ — test dans le navigateur à faire à la fin du jalon
- Commit : feat: import DXF des textes et export des escaliers, plateformes, toitures, cheminées (M11 bis, lot E)

### 2026-11-12 — M11 bis · Lot E · Tâche 1 · Export DXF : escaliers, plateformes, toitures, cheminées
- Fait : quatre calques de plus dans le DXF d'un niveau. `ESCALIERS` : contour de l'emprise (volées et palier), lignes de marche selon le nombre de girons calculé, ligne de foulée de chaque volée. `PLATEFORMES` : contour fermé et altitude du dessus (« +450 », en mm). `TOITURES` : contour au nu des murs (pointillés), bord du débord, faîtage et arêtiers. `CHEMINEES` : carré et ses deux diagonales. Éléments masqués non exportés ; tout en mm.
- Fichiers : `src/features/export/dxfPlan.ts` (+ tests), `docs/02-ARCHITECTURE.md`
- Vérification : build ✓ lint ✓ tests ✓ — à ouvrir dans LibreCAD à la fin du jalon

### 2026-11-12 — M11 bis · Lot D · Recherche de projets sur l'accueil
- Fait : un champ « Rechercher un projet par son nom » au-dessus de la liste (affiché dès qu'il y a un projet). Le filtre ignore la casse et les accents et demande **tous** les mots tapés, dans n'importe quel ordre ; liste locale, immédiate. Sans résultat : « Aucun projet ne correspond à « … » ». Champ vide : tous les projets, dans leur ordre.
- Fichiers : `src/features/persistence/filterProjects.ts` (+ test), `src/pages/HomePage.tsx`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ — à vérifier dans le navigateur : page d'accueil, taper « ete » trouve « Affiche été »
- Commit : feat: recherche de projets sur l'accueil (M11 bis, lot D)

### 2026-11-12 — M11 bis · Lot C · Niveau du dessus et aimantation sur les niveaux de référence
- Fait : nouveau bouton (icône « calques ») à côté de celui du niveau du dessous, dans le sélecteur de niveau : **affiche le niveau du dessus en transparence**, sans interaction. **Désactivé par défaut**, réglage d'interface (hors document, hors historique, comme celui du dessous). **Aimantation** : les tracés, les poignées de sommets et les déplacements s'aimantent sur les murs et sommets du niveau du dessous (déjà le cas) **et du dessus** quand ils sont affichés. Les croisements de faces de murs ne sont plus cherchés entre murs de niveaux différents (plus de points d'accroche fantômes).
- Fichiers : `src/features/documents/levels.ts` (`levelAbove`, `referenceLevels`) + test, `src/stores/editorStore.ts` (`showUpperLevel`, `selectSnapElements`) + test, `snapping.ts` + test, `EditorStage.tsx`, `LevelSelector.tsx`, `useElementInteractions.ts`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (le test de vitesse « 600 murs en moins de 200 ms » échoue parfois sous la charge, passe seul : connu) — test dans le navigateur à faire à la fin du jalon
- Commit : feat: niveau du dessus et aimantation sur les niveaux de référence (M11 bis, lot C)

### 2026-11-12 — M11 bis · Lot B · Tâche 2 · Joindre des murs
- Fait : quand plusieurs murs sont sélectionnés (double-clic = murs liés), bouton **« Joindre les murs »** dans Propriétés : ils deviennent un seul mur bout à bout (l'inverse de « Séparer les côtés »). Les murs doivent être sur le même niveau, de même épaisseur, hauteur et matériau, et former une chaîne simple (ouverte ou fermée). Un mur dessiné à l'envers est retourné avec ses portes et fenêtres (place comptée depuis l'autre bout, charnière et côté d'ouverture inversés). Le mur obtenu garde l'identifiant et le nom tapé du premier ; un nom automatique reste automatique. Sinon, message clair en français (épaisseur différente, mur verrouillé, pas bout à bout…). Un seul pas d'annulation. Longueur et surfaces murales identiques avant et après (test).
- Fichiers : `src/features/geometry/joinWalls.ts` (+ test), `src/stores/editorStore.ts` (action `joinWalls`), `src/components/editor/PropertiesPanel.tsx`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (2583)
- Commit : feat: joindre des murs et glisser un seul mur (M11 bis, lot B)

### 2026-11-12 — M11 bis · Lot B · Tâche 1 · Glisser un seul mur
- Fait : le petit point rond au **milieu d'un côté droit** (horizontal ou vertical) d'un mur sélectionné se **glisse** : le mur se déplace perpendiculairement, les murs voisins s'allongent ou se raccourcissent, la pièce dont un sommet est sur ce côté suit, les ouvertures gardent leur place réelle (même calcul que l'outil Étirer : `stretchZone`). Un **clic** sur ce même point ajoute toujours un sommet. Aimantation de la position du mur à la grille (sinon au mm entier). Un mur dans son prolongement ou un côté voisin en biais bloque le glissement, avec un message. Un seul pas d'annulation par geste ; les ouvertures qui ne tiennent plus sont signalées.
- Fichiers : `src/features/geometry/moveWallSide.ts` (+ test), `src/stores/editorStore.ts` (`liveMoveWallSide`), `src/components/editor/VertexHandles.tsx`, `PlanElementFields.tsx`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ — test dans le navigateur à faire à la fin du jalon

### 2026-11-12 — M11 bis · Lot A · Aimantation sur le fond DXF
- Fait : les tracés (mur, pièce, plateforme, toiture, cote, axe, coupe) et les poignées de sommets s'aimantent au fond DXF importé : **extrémité** d'un trait, **croisement** de deux traits, **milieu**, puis **point du trait** (ignoré avec Maj, qui impose la direction). Un sommet du plan reste prioritaire. Le repère bleu affiche « Extrémité du fond », « Croisement du fond », « Milieu du fond » ou « Trait du fond ». **Alt** coupe cette aimantation. Seuls les traits proches du curseur sont examinés (pas de calcul sur 20 000 croisements).
- Fichiers : `src/features/geometry/backgroundSnap.ts` (+ test), `snapping.ts`, `src/components/editor/usePolylineDrawing.ts`, `VertexHandles.tsx`, `PolylineDraftLayer.tsx`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ — test dans le navigateur à faire à la fin du jalon (importer un DXF, tracer un mur près d'un coin)
- Commit : feat: aimantation sur le fond DXF (M11 bis, lot A)

### 2026-11-12 — M11 · Tâche 3 · Export 3D (glTF)
- Fait : nouveau bouton « Exporter la 3D » (icône de téléchargement) dans l'en-tête du panneau 3D. Il enregistre un fichier `.glb` (glTF binaire) du bâtiment **tel qu'il est affiché** (« Étage ouvert » compris) : murs, ouvertures (cadres, vitres, portes), dalles, toits, toitures, escaliers, cheminées, avec leurs couleurs et leurs motifs. Ni terrain, ni grille, ni lumières. En **mètres** (unité du glTF), y vers le haut ; un mur sélectionné garde sa couleur normale dans le fichier. Positions, rotations et échelles écrites séparément (plus lisibles dans Blender ou un visualiseur). L'exporteur (`GLTFExporter` de `three`) est chargé à la demande.
- Fichiers : `src/features/export/gltf.ts` (nouveau, + tests), `src/components/viewer3d/Viewer3DScene.tsx`, `Viewer3DPanel.tsx`, `src/features/export/fileName.ts`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (2558) ; le fichier produit commence par la signature glTF et garde l'échelle mm → m (test) — ouverture dans un visualiseur glTF à faire par l'utilisateur
- Commit : feat: export 3D glTF du bâtiment (M11)

### 2026-11-12 — M11 · Tâche 2 · Import DXF en calque de fond
- Fait : bouton « Importer un DXF (fond de plan) » dans la famille Image de la barre d'outils (plans seulement). Une fenêtre montre l'unité lue dans le fichier (`$INSUNITS` : mm, cm, m, pouces, pieds ; mm par défaut si le fichier ne la donne pas, avec un avertissement), modifiable, puis les **dimensions réelles du dessin en mm** et le nombre de traits, pour vérifier l'échelle avant d'importer. Sont repris : lignes, polylignes (avec arcs), cercles, arcs, ellipses, splines, contenu des blocs (position, rotation, échelle, réseaux) et dessin des cotes ; pas les textes ni les hachures, ni l'espace papier. Les lignes qui se suivent sont réunies (moins d'éléments). Le dessin est posé **sur le niveau actif, sous tous les autres éléments, verrouillé**, centré sur la vue (dézoom automatique s'il est plus grand qu'elle), en gris et en trait d'un pixel quel que soit le zoom. Dans les calques, tout le fond tient sur **une seule ligne** (« Fond DXF – plan.dxf », nombre de traits) : masquer, verrouiller, sélectionner en entier (Suppr le retire) ; déverrouillé, un clic sur un trait prend tout le fond, qui se déplace d'un bloc. Refus au-delà de 20 000 traits ou 50 Mo. Code chargé à la demande.
- Choix techniques (D62) : champ facultatif `groupId` sur les éléments `line` (pas de nouveau type, pas de changement de version du document).
- Fichiers : `src/features/export/dxfImport.ts` (nouveau, + tests), `src/components/editor/ImportDxfDialog.tsx` (nouveau), `Toolbar.tsx`, `LayersPanel.tsx`, `useElementInteractions.ts`, `shapes/LineShape.tsx`, `src/stores/editorStore.ts` (`addBackgroundElements`), `src/types/document.ts`, `docs/02-ARCHITECTURE.md`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (2556) ; une ligne de 5000 mm importée mesure 5000 mm (test), aller-retour export → import exact — test dans le navigateur à faire par l'utilisateur
- Commit : feat: import DXF en calque de fond (M11)

### 2026-11-12 — M11 · Tâche 1 · Export DXF
- Fait : nouveau format « DXF » dans la fenêtre Exporter d'un plan. Fichier texte écrit à la main (version R12, lisible par AutoCAD et LibreCAD), **en mm** (`$INSUNITS = 4`), axe y retourné (le haut du plan reste en haut). Calques `MURS` (contour des murs vu en plan, ouvertures découpées et angles raccordés, sans coutures), `PIECES` (contour fermé, nom et surface), `OUVERTURES` (symbole du plan : battant, arc, vitrage ; pointillés en type de trait `DASHED`), `COTES` (cotes tracées à la main selon le réglage « Cotation », plus les cotes automatiques Client / Technique quand elles sont affichées), `AXES` (ligne, bulles, étiquettes), `MOBILIER` (dessin des objets de la bibliothèque). Textes à 2,5 mm sur le papier à l'échelle du projet ; accents codés `\U+00E9`. Un fichier par niveau (D60) : « Niveau affiché (.dxf) » ou « Tous les niveaux » (un .dxf par niveau dans un .zip). Bloqué comme les autres exports du plan par un manque ou un débord de pièce (D55). Code chargé à la demande.
- Fichiers : `src/features/export/dxf.ts`, `dxfPlan.ts`, `dxfFiles.ts` (nouveaux, + tests), `src/features/export/fileName.ts`, `src/components/editor/exportProject.ts`, `ExportDialog.tsx`, `src/i18n/fr.ts`, `package.json` (`dxf-parser`, accordé pour l'import ; sert aussi aux tests de relecture de l'export)
- Vérification : build ✓ lint ✓ tests ✓ (2545) ; le DXF exporté est relu par `dxf-parser` dans les tests (une ligne de 5000 mm mesure 5000 mm) — ouverture dans LibreCAD à faire par l'utilisateur
- Commit : feat: export DXF du plan (M11)

### 2026-11-12 — M10 ter et noms automatiques · Test dans le navigateur validé
- Fait : l'utilisateur a validé dans le navigateur le groupe 4 des cas limites (repères) et les noms automatiques des murs et des ouvertures. M10 ter est terminé.
- Décisions de l'utilisateur : la numérotation des murs au même nom est gardée (« Mur extérieur Cuisine 1 », « 2 ») ; le choix D59 (pas de champ `customName`) est validé.
- Fichiers : `docs/PROGRESS.md`
- Vérification : test dans le navigateur par l'utilisateur ✓
- Commit : docs: M10 ter et noms automatiques validés

### 2026-11-12 — Hors jalon · Noms automatiques des murs et des ouvertures
- Fait : les murs et les ouvertures prennent un nom tiré des pièces qu'ils touchent, **calculé à l'affichage**, jamais enregistré. **Murs** : « Mur Cuisine / Séjour », « Mur extérieur Cuisine », « Mur isolé » ; au-delà de deux pièces, les deux plus grandes dans l'ordre de lecture puis « +N » ; deux murs du même niveau au même nom sont numérotés (« Mur extérieur Cuisine 1 », « 2 »). **Ouvertures** : « Porte Cuisine 1 » (pièce vers laquelle la porte s'ouvre), « Fenêtre Séjour 2 » (pièce côté intérieur), les baies comptent avec les fenêtres, « Porte 1 » sans pièce ; « Chambre 1 – 1 » quand la pièce finit par un nombre ; une pièce sans nom devient « Pièce 1 ». Les pièces masquées comptent (D56) ; seules les pièces du même niveau sont regardées. **Nom tapé** : il reste prioritaire ; dans Propriétés, le champ « Nom » est vide avec le nom automatique en grisé, et le vider rend le nom automatique (aussi dans les calques). Les anciens noms par défaut (« Mur 1 », « Porte 2 », « Mur 1 1 ») sont traités comme automatiques : aucun changement de format, aucune migration. **Partout** : calques, Propriétés, panneau Métrés (dont « Mur : … » d'une ouverture), exports CSV, Excel et PDF des métrés, avertissements. **Séparer les côtés** : les morceaux d'un mur au nom automatique prennent chacun le leur ; un nom tapé est gardé et numéroté (« Façade 1 », « Façade 2 »).
- Choix techniques (D59) : pas de champ `customName` (prévu dans le plan) ; le champ `name` existant suffit. La pièce est cherchée 100 mm au-delà de chaque face, tous les 250 mm le long du mur (une petite pièce le long d'un long mur n'est pas ratée).
- Fichiers : `src/features/naming/autoNames.ts` (nouveau), `autoNames.test.ts` (nouveau), `src/features/measurements/references.ts`, `measurements.ts`, `warnings.ts`, `csvExport.test.ts`, `src/features/geometry/splitWall.ts`, `splitWall.test.ts`, `src/components/editor/useDisplayNames.ts` (nouveau), `LayersPanel.tsx`, `OpeningFields.tsx`, `PlanElementFields.tsx`, `src/components/ui/TextField.tsx`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (2526) — test dans le navigateur à faire par l'utilisateur
- Commit : feat: noms automatiques des murs et des ouvertures

### 2026-11-12 — Hors jalon · Noms automatiques · Décision sur le format des murs
- Décision de l'utilisateur (D58) : option A, « Mur Cuisine / Séjour », « Mur extérieur Cuisine », « Mur isolé ».
- Plan présenté, en attente du feu vert. Aucun code modifié.

### 2026-11-12 — M10 ter · Cas limites des métrés · Groupe 4 · Tâche 4 · Repères au-delà de 99
- Fait : dès qu'un type dépasse 99 éléments (murs, portes ou fenêtres), tous les repères de ce type passent à trois chiffres (`M001`…`M100`), pour que le tri d'Excel reste juste. Chaque type décide pour lui-même : 100 murs n'allongent pas `P01`.
- Fichiers : `src/features/measurements/references.ts`, `references.test.ts`
- Vérification : build ✓ lint ✓ tests ✓
- Commit : feat: repères sur trois chiffres au-delà de 99

### 2026-11-12 — M10 ter · Cas limites des métrés · Groupe 4 · Tâche 3 · Mention des repères
- Fait : « Repères valables à la date du document » est imprimé dans la remarque d'en-tête et dans les règles de calcul des métrés Technique (PDF, Excel, CSV), et dans la note des PDF de plans cotés en Technique (fenêtre Exporter et écran Vues). La version Client n'en a pas besoin (aucun repère).
- Fichiers : `src/i18n/fr.ts`, `src/features/measurements/clientView.test.ts`
- Vérification : build ✓ lint ✓ tests ✓ (2503)
- Commit : feat: mention « repères valables à la date du document »

### 2026-11-12 — M10 ter · Cas limites des métrés · Groupe 4 · Tâche 2 · Ouverture hors de son segment
- Fait : le centre d'une ouverture est ramené sur son segment (offset borné entre 0 et la longueur) pour le classement des repères. Les surfaces ne changent pas ; la fenêtre Exporter signale déjà ces ouvertures (groupe 3).
- Fichiers : `src/features/measurements/references.ts`, `references.test.ts`
- Vérification : build ✓ lint ✓ tests ✓
- Commit : fix: repères des ouvertures hors de leur segment

### 2026-11-12 — M10 ter · Cas limites des métrés · Groupe 4 · Tâche 1 · Ordre de lecture sans saut de bande
- Fait : les repères se lisent de haut en bas par lignes réelles (nouvelle ligne quand l'écart avec l'élément précédent dépasse 500 mm), puis de gauche à droite. Deux murs à y = 749 et y = 751 sont sur la même ligne.
- Fichiers : `src/features/measurements/references.ts`, `references.test.ts`
- Vérification : build ✓ lint ✓ tests ✓ (2501)
- Commit : fix: ordre de lecture des repères sans saut de bande

### 2026-11-12 — M10 ter · Cas limites des métrés · Groupe 4 · Décision sur les repères
- Décision de l'utilisateur (D57) : option A, les repères restent **recalculés** à chaque modification ; les documents qui les montrent portent la mention « Repères valables à la date du document ».
- Plan du groupe 4 présenté, en attente du feu vert. Aucun code modifié.

### 2026-11-12 — M10 ter · Cas limites des métrés · Groupe 3 · Validé par l'utilisateur
- Fait : l'utilisateur valide le groupe 3 (contrôle des surfaces, exports bloqués si manque ou débord, pièces masquées comptées). Commit effectué.
- Prochaine tâche : groupe 4 (repères `M01`, `P01`, `F01`), après la décision de l'utilisateur sur leur stabilité.

### 2026-11-12 — M10 ter · Cas limites des métrés · Groupe 3 · Pièces masquées et blocage de tous les exports du plan
- Décisions de l'utilisateur : pièces masquées **comptées** avec l'avertissement (option A, D56) ; un manque ou un débord bloque **aussi** l'export du plan en image et en PDF (D55 élargie).
- Fait : fenêtre Exporter : PNG, JPG et PDF d'un plan refusés tant que le **niveau affiché** a un manque ou un débord (encadré rouge, bouton désactivé, `exportProject` refuse aussi). Écran Vues : le PDF (planche, façades, coupes, plans de niveau) est refusé tant qu'un manque ou un débord existe sur **n'importe quel niveau**. Nouvelle fonction pure `blockingSurfaceWarnings(document, levelId?)` + test. La capture d'image de la vue 3D n'est pas bloquée.
- Fichiers : `src/features/measurements/warnings.ts` + test, `src/components/editor/{ExportDialog.tsx,exportProject.ts}`, `src/components/views/ViewsPdfDialog.tsx`, `src/i18n/fr.ts`, `docs/03-ROADMAP.md`
- Vérification : build ✓ lint ✓ tests ✓ (2499) — à tester dans le navigateur
- Commit : à proposer

### 2026-11-12 — M10 ter · Cas limites des métrés · Groupe 3 · Export bloqué par un manque ou un débord
- Décision de l'utilisateur (D55) : **jamais d'export des métrés tant qu'une pièce laisse un manque ou déborde des murs** ; il faut le signaler et demander de corriger.
- Fait : fenêtre Exporter (métrés) : encadré rouge « Export impossible : corrigez d'abord ces pièces », bouton Exporter désactivé ; un clic sur une ligne ferme la fenêtre et montre la zone sur le plan. Panneau Métrés : encadré rouge « À corriger avant d'exporter » (au-dessus de l'encadré orange « À vérifier »), boutons Excel et CSV désactivés avec une explication. Sécurité : `prepareMetres` refuse aussi l'export (`MetresCoverageError`). Les autres points (pièce masquée, élément sans niveau, ouvertures) restent de simples avertissements.
- Portée : seul ce qui est exporté compte (« Niveau affiché » : seulement ce niveau). Élargi ensuite aux exports d'image et de PDF du plan (entrée ci-dessus).
- Fichiers : `src/features/measurements/warnings.ts` (`isBlockingWarning`) + test, `src/components/editor/{exportMetres.ts,ExportDialog.tsx,MeasurementsPanel.tsx,MetresWarningList.tsx}`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (2498) — à tester dans le navigateur
- Commit : à proposer

### 2026-11-12 — M10 ter · Cas limites des métrés · Groupe 3 (fiabilité des surfaces)
- Fait : **contrôle des surfaces** (fonctions pures, rien n'est corrigé). `roomCoverageGaps` / `createCoverageChecker` : pour chaque pièce, la zone fermée par les murs autour d'elle est comparée à son contour ; les morceaux non couverts (« Salon : 0,28 m² non couverts le long du mur M02 ») et les parties qui passent au-delà des murs sont signalés au-delà de 50 mm de large ou de 0,01 m². `metresWarnings` liste en plus les pièces superposées, les trémies qui débordent, les pièces masquées (comptées, D21), les éléments sans niveau (absents des métrés, axes et coupes exceptés), les ouvertures qui dépassent de leur segment ou se chevauchent. **Panneau Métrés** : encadré « À vérifier » en Client (tout le bâtiment) et en Technique (niveau affiché ; remplace l'ancien message des pièces superposées) ; un clic affiche le niveau, sélectionne la pièce et surligne la zone en orange sur le plan (la zone disparaît dès que le plan change ; jamais dans les exports d'image). **Fenêtre Exporter** (métrés) : la liste complète s'affiche avant le téléchargement, sans bloquer.
- Choix (D54) : le **manque** est mesuré par rapport aux **faces** des murs, le **débord** par rapport à leurs **axes** : une pièce tracée à l'axe (D49, contour tel que dessiné) ou sur les faces n'est jamais signalée. Un espace couvert par une autre pièce (cuisine et séjour dans la même zone, sans mur entre eux) n'est pas un manque ; un manque dans une zone partagée n'est signalé qu'une fois.
- Nouveau calcul géométrique sans bibliothèque : `polygonDifference` (différence de deux polygones, trous compris), même méthode de graphe plan que `regions.ts`.
- Décision encore en attente : pièces masquées comptées (règle actuelle, avec l'avertissement) ou retirées du document Client.
- Fichiers : `src/features/geometry/polygonPieces.ts` (nouveau), `src/features/measurements/{roomCoverage,warnings}.ts` (nouveaux) + tests, `src/components/editor/{MetresWarningList,SurfaceHighlightLayer}.tsx` et `metresWarningText.ts` (nouveaux), `MeasurementsPanel.tsx`, `ExportDialog.tsx`, `EditorStage.tsx`, `exportStage.ts`, `thumbnail.ts`, `src/stores/editorStore.ts`, `src/i18n/fr.ts`, `docs/03-ROADMAP.md`
- Vérification : build ✓ lint ✓ tests ✓ (2497, dont 18 nouveaux) — à tester dans le navigateur
- Commit : à proposer

### 2026-11-12 — M10 ter · Cas limites des métrés · Groupes 1 et 2
- Fait, groupe 1 (exports) : la ligne de total du récapitulatif Client dit « Total du niveau » quand un seul niveau est exporté ; un niveau introuvable n'exporte plus tout le bâtiment en silence (`restrictToLevel` renvoie `null`, la fenêtre Exporter affiche un message et bloque le bouton) ; l'en-tête du CSV et du fichier Excel Client reprend le titre et la remarque du PDF Client, sans note technique ; le nom de fichier reçoit `-client` ou `-execution` (affiché à côté du champ du nom) ; la case « Inclure le mobilier » est masquée en Client ; la fenêtre Exporter s'ouvre sur la version affichée dans le panneau Métrés (état partagé dans le store, hors document et hors historique). Les boutons Excel et CSV du panneau passent par le même export que la fenêtre.
- Fait, groupe 2 (lisibilité Client) : une pièce qui n'est pas un rectangle affiche « forme libre » ; un nom vide devient « Pièce 1 », « Pièce 2 »… par niveau (les noms en double sont gardés) ; un niveau sans pièce ni ouverture n'apparaît plus dans le récapitulatif Client (il reste en Technique) ; le PDF Client montre une vignette par niveau qui a des murs (portée « bâtiment »), côte à côte si la place suffit, sinon à la rangée ou à la page suivante, avec la légende « Niveau : RDC » ; les traits de la vignette ont une épaisseur fixe sur le papier, donc lisibles sur un plan très allongé comme sur un très petit (testé). Le libellé « PDF d'une page » de la roadmap est corrigé : le PDF continue sur la page suivante quand il le faut.
- Choix : le suffixe de fichier reste `-execution` (et non `-technique`), comme le prévoit D53 pour les fichiers.
- Fichiers : `src/features/measurements/clientView.ts`, `measurements.ts`, `tables.ts`, `src/features/export/fileName.ts`, `metresPdf.ts`, `src/components/editor/exportMetres.ts`, `ExportDialog.tsx`, `MeasurementsPanel.tsx`, `src/stores/editorStore.ts`, `src/i18n/fr.ts`, tests associés, `docs/03-ROADMAP.md`
- Vérification : build ✓ lint ✓ tests ✓ — à tester dans le navigateur (voir ci-dessous)
- Commit : à proposer

### 2026-11-12 — M10 ter · Lot B · Validé par l'utilisateur
- Fait : test dans le navigateur du réglage Cotation (barre d'outils), des cotes tracées à la main (« Visible en ») et du réglage par vue de la planche : **validé** par l'utilisateur. Roadmap mise à jour.
- Prochaine tâche (non lancée, à la demande de l'utilisateur) : groupe 1 des cas limites des métrés (« Exports justes »).
- Vérification : build ✓ lint ✓ tests ✓ (2465)

### 2026-11-12 — M10 ter · Lot B · Lisibilité des cotes automatiques
- Demande de l'utilisateur (capture d'un plan en Exécution) : « que ce ne soit pas trop le bordel ». Première tentative (chaînes intérieures raccourcies, étiquettes de pièce à 3 lignes, 1re chaîne à 1400 mm) **refusée** : l'utilisateur veut garder la visualisation d'origine et seulement éviter les chevauchements. Elle a été retirée.
- Fait (mise en page seulement, mêmes cotes, mêmes étiquettes) : **petites cotes** (200, 100…) : quand le chiffre ne tient pas entre les traits, il passe un rang plus haut ou sous la ligne, en alternance le long de la chaîne ; **fond blanc** derrière chiffres et étiquettes (écran) ; **étiquettes écartées** : une étiquette évite les étiquettes déjà placées, les lignes et les chiffres des cotes (`dimensionObstacles`) ; elle essaie son autre emplacement (une ouverture passe de l'autre côté de son mur), puis des positions de plus en plus éloignées, et une étiquette de pièce reste dans sa pièce quand c'est possible (`bounds`). Les pièces sont placées en premier. Planche et PDF suivent la même mise en page (sans fond blanc).
- Limite : dans une pièce très petite et très chargée, un léger chevauchement peut rester (l'étiquette prend alors la position qui gêne le moins).
- Fichiers : `src/features/dimensioning/{layout,annotationGraphics,executionDimensions,clientDimensions,facadeChains,types}.ts` + tests, `src/components/editor/AutoDimensionsLayer.tsx`, `src/components/editor/shapes/DimensionDrawing.tsx`
- Vérification : build ✓ lint ✓ tests ✓ (2465) — rendu à contrôler dans le navigateur
- Commit : fix: cotes automatiques sans chevauchement

### 2026-11-12 — M10 ter · Lot B · Plus de détails par pièce pour le client
- Fait : à la demande de l'utilisateur, le tableau « Vos pièces » des métrés Client (panneau, PDF, Excel, CSV) a deux colonnes de plus : **Périmètre (mm)** (tour du contour dessiné) et **Hauteur sous plafond (mm)** (nouveau `RoomMeasure.ceilingHeight`, D52). Dans le panneau Métrés, les tableaux Client défilent horizontalement s'ils sont trop larges. L'étiquette des pièces sur le plan coté en Client ne change pas (essayé puis retiré, choix de l'utilisateur).
- Limite : sous un toit en pente, la hauteur varie ; c'est la hauteur du toit plat qui est donnée (D52).
- Fichiers : `src/features/measurements/{measurements,clientView}(.test).ts`, `src/components/editor/MeasurementsPanel.tsx`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ — à contrôler dans le navigateur
- Commit : feat: périmètre et hauteur sous plafond par pièce dans les métrés client

### 2026-11-12 — M10 ter · Lot B · Cotes Client / Exécution (tâches 1 à 5)
- Décisions de l'utilisateur : option A pour les dimensions des pièces (D49) et réglage « Aucune » par défaut (D50).
- Fait : **cotes automatiques**, calculées et jamais enregistrées (nouveau dossier `src/features/dimensioning/`, fonctions pures testées). **Client** : quatre cotes extérieures totales (rectangle qui englobe les faces des murs : 8000 × 6000 aux axes avec des murs de 200 donnent `8200` et `6200`) ; dans chaque pièce, son nom, `4000 × 3000` (pièce rectangulaire) ou une cote par côté (autre forme), et sa surface au sol prise dans les métrés. **Exécution** : trois chaînes par façade, au nu brut (1. baies et trumeaux : `2400 · 1200 · 2400` ; 2. axes des refends et axes de construction ; 3. longueur totale ; une chaîne qui ne dit rien de plus que le total n'est pas dessinée) ; chaînes intérieures avec l'épaisseur de chaque mur (une par rangée de pièces) ; baies `F01`, `1200 / 1350`, `All. 900` côté extérieur (repères des métrés d'exécution) ; pièces avec `Sol ±0` et `Dalle +2850` ; plateformes (altitude du dessus) ; trémies (`Trémie`, `1100 × 4600`) ; escaliers (`16 CM × 175`, `Giron 260`). **Barre du haut** : réglage « Cotation : Aucune / Client / Exécution » (état d'interface, rien dans l'historique) ; texte 1,3 fois plus grand en Client ; l'étiquette de pièce habituelle est remplacée par l'étiquette calculée. **Cotes tracées à la main** : champ « Visible en : Les deux / Client / Exécution » (`visibleIn` facultatif, sans migration ; sans valeur, la cote apparaît dans les deux versions). **Écran Vues, planche** : un réglage de cotation par plan de niveau ; la fenêtre PDF demande « Cotation des plans : Comme à l'écran / Client / Exécution » ; la note sur les baies est imprimée au-dessus du cartouche des documents d'exécution. **Export PDF / PNG du plan** : la zone exportée est agrandie pour ne pas couper les cotes extérieures, et la note sur les baies est imprimée quand la cotation est « Exécution ».
- Limites : les chaînes de façade ne prennent que les murs horizontaux et verticaux (la longueur totale englobe quand même un mur en biais) ; l'étiquette d'une pièce en L est au centre de gravité (qui peut tomber hors de la pièce) ; la note du PDF est imprimée juste au-dessus du cartouche et peut toucher le bas d'un dessin qui remplit toute la feuille.
- Reste : contrôle dans le navigateur par l'utilisateur (critères d'acceptation du lot B).
- Fichiers : `src/features/dimensioning/{types,clientDimensions,facadeChains,executionDimensions,levelAnnotations,annotationGraphics,planOverlay,visibility}.ts` + tests, `src/features/building/views/{drawing,sheet}.ts`, `src/features/export/pdf.ts`, `src/components/editor/{AutoDimensionsLayer,DimensioningSelector,DimensionVisibilityField,EditorStage,PlanElementFields,exportProject}.tsx|ts`, `src/components/editor/shapes/{DimensionDrawing,DimensionShape,RoomShape}.tsx`, `src/components/views/{ViewsScreen,ViewsPdfDialog,ViewDrawing}.tsx`, `src/stores/{editorStore,viewsStore}.ts`, `src/pages/EditorPage.tsx`, `src/i18n/{fr,dimensioningLabels}.ts`, `src/types/document.ts`, `docs/02-ARCHITECTURE.md`
- Vérification : build ✓ lint ✓ tests ✓ (2455, dont 33 nouveaux) — affichage à contrôler dans le navigateur
- Commit : feat: M10 ter lot B, cotes Client et Exécution

### 2026-11-12 — M10 bis et M10 ter lot A · Test dans le navigateur validé
- Fait : l'utilisateur a validé le test dans le navigateur de M10 bis (ouvertures détaillées, toitures, hachures et textures) et du lot A de M10 ter (métrés Client / Exécution, repères M01 / P01 / F01). Le lot B de M10 ter (cotes) reste à faire.
- Fichiers : `docs/PROGRESS.md`
- Vérification : test dans le navigateur par l'utilisateur ✓
- Commit : à proposer

### 2026-11-12 — Hors jalon · Noms automatiques des murs et des ouvertures (planification)
- Fait : à la demande de l'utilisateur, plan ajouté à la roadmap (section « Hors jalon — Noms automatiques », avant M11) : les murs, portes, fenêtres et baies prennent un nom tiré des pièces qu'ils touchent (« Porte Cuisine 1 », « Fenêtre Séjour 2 »). Aucun code modifié.
- Décision en attente de l'utilisateur : format des murs (option A « Mur Cuisine / Séjour », recommandée, ou option B « Mur Cuisine 1 »).
- Fichiers : `docs/03-ROADMAP.md`, `docs/PROGRESS.md`
- Vérification : documentation seulement (pas de build nécessaire)
- Commit : docs: plan des noms automatiques des murs et des ouvertures

### 2026-11-12 — M10 ter · Audit des cas limites des métrés (planification)
- Fait : audit du lot A (vue Client, vue Exécution, repères, exports) ; les cas limites trouvés sont ajoutés à la roadmap dans la section « À traiter — Cas limites des métrés client / exécution », avant M11, en quatre groupes : exports justes, lisibilité du document Client, fiabilité des surfaces, repères. Aucun code modifié.
- Ajout à la demande de l'utilisateur (cas très fréquent) : détecter une pièce qui ne remplit pas tout l'espace entre ses murs (petite surface non couverte) ou qui déborde des murs, et le signaler sans corriger.
- Décisions en attente de l'utilisateur : dimensions affichées au client (libellé « du tracé » ou calcul intérieur) ; pièces masquées comptées ou non en Client ; stabilité des repères (calculés à la date du document ou figés).
- Fichiers : `docs/03-ROADMAP.md`, `docs/PROGRESS.md`
- Vérification : documentation seulement (pas de build nécessaire)
- Commit : docs: cas limites des métrés à traiter avant M11

### 2026-11-12 — M10 bis · Lot C · Tâche 5 (reprise) · Textures en 3D
- Fait : à la demande de l'utilisateur, la 3D reflète la **texture** des matériaux et plus seulement leur couleur : brique en rangs décalés avec joints, maçonnerie en blocs, bardage bois en lames avec fil, béton avec joints de coffrage et trous de banche, isolant fibreux, plâtre ; tuiles et ardoises en rangs, zinc à joints debout, bac acier nervuré, toiture plate en gravillons. Les motifs sont dessinés par le code (canevas), sans image tierce, et répétés à une taille réelle (la brique reprend tous les 520 mm). Les coordonnées de texture suivent chaque face : les rangs d'un mur restent horizontaux et continus, ceux d'un versant suivent la pente. Sans matériau ni couverture : rendu d'avant. Un mur sélectionné reste violet uni.
- Fichiers : `src/components/viewer3d/materialTextures.ts` (nouveau), `Viewer3DScene.tsx`, `materialTextures.test.ts` (nouveau)
- Vérification : build ✓ lint ✓ tests ✓ (2422) ; non testé dans le navigateur (à faire à la fin)
- Commit : feat: M10 bis lot C, textures des matériaux en 3D

### 2026-11-12 — M10 ter · Lot A · Tâches 2 à 6 · Métrés Client et Exécution
- Fait : deux présentations des mêmes calculs. **Client** : « Vos pièces » (nom, dimensions `4000 × 3000` pour une pièce rectangulaire, surface au sol trémie déduite, D37) et « Récapitulatif » (surface par niveau et pour le bâtiment, nombre de portes, fenêtres, baies) ; aucune épaisseur ni surface de mur. **Exécution** : tous les tableaux détaillés (murs avec repères, surfaces brutes et nettes par face, volumes, ouvertures avec repères, escaliers, plateformes, cheminées, toitures, totaux par niveau) suivis des **règles de calcul** (ouvertures toutes déduites sans seuil, baies brutes de maçonnerie à confirmer par le menuisier, repères, aucun prix). **PDF Client** d'une page avec vignette vectorielle du plan (premier niveau, ou le niveau affiché), tableaux et cartouche. Le panneau Métrés a une bascule **Client / Exécution** (réglage d'interface, hors historique) qui change l'affichage et les exports Excel et CSV ; la fenêtre Exporter demande la **Version** (les données à plat n'existent qu'en Exécution). Sans choix, l'export reste celui d'avant (Exécution).
- Limites : en Exécution, la baie reste en deux colonnes « Largeur » et « Hauteur » (pas encore `largeur / hauteur`) ; la mention sur les baies brutes est dans les règles de calcul en fin de document ; la vignette du PDF Client montre un seul niveau.
- Fichiers : `src/features/measurements/{clientView,executionView,measurements,csv}.ts`, `clientView.test.ts` et `metresPdf.test.ts` (tests), `src/features/export/{pdf,metresPdf}.ts` (`drawDrawing` extrait), `src/components/editor/{MeasurementsPanel,ExportDialog,exportMetres,exportProject}.tsx`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ ; non testé dans le navigateur (à faire à la fin, à la demande de l'utilisateur)
- Commit : feat: M10 ter lot A, métrés Client et Exécution

### 2026-11-12 — M10 ter · Lot A · Tâche 1 · Repères M01, P01, F01
- Fait : chaque mur, porte et fenêtre a un repère : murs `M01…`, portes `P01…`, fenêtres et baies `F01…`. Numérotation continue dans tout le bâtiment, niveau par niveau (du plus bas au plus haut), puis de haut en bas et de gauche à droite sur le plan. Le tableau des murs (colonne « Réf. ») et celui des ouvertures (nouvelle colonne « Réf. » en plus de « Réf. du mur ») les affichent ; dans le CSV à plat, une ouverture porte son propre repère (avant : celui de son mur). Les anciens repères « M1 » deviennent « M01 ». Calcul pur partagé : il servira aussi aux cotes du lot B.
- Fichiers : `src/features/measurements/{references,measurements,tables,csv}.ts`, `references.test.ts` (nouveau), `csvExport.test.ts`
- Vérification : build ✓ lint ✓ tests ✓ (4 nouveaux)
- Commit : feat: M10 ter lot A tâche 1, repères M01, P01, F01

### 2026-11-12 — M10 bis · Lot C · Tâche 5 · Couleurs en 3D
- Fait : en 3D, un mur prend la couleur de son matériau (béton gris, maçonnerie sable, brique rouge, bois brun, isolant jaune, plâtre blanc) et une toiture celle de sa couverture (tuiles rouges, ardoises anthracite, zinc gris clair, bac acier gris bleu, toiture plate gris foncé, y compris le toit plat dessiné). Sans matériau ni couverture : couleurs d'avant. Un mur sélectionné reste violet. Couleurs unies, sans image (D48).
- Fichiers : `src/features/building/{materials,types,roofModel}.ts`, `src/components/viewer3d/Viewer3DScene.tsx`, `materials.test.ts`
- Vérification : build ✓ lint ✓ tests ✓ (2406)
- Commit : feat: M10 bis lot C tâche 5, couleurs par matériau en 3D

### 2026-11-12 — M10 bis · Lot C · Tâche 4 · Textures des façades
- Fait : les murs sont dessinés avec la texture déduite de leur matériau (D46) dans les **façades** et sur les murs vus derrière le plan d'une **coupe** : brique apparente (rangs et joints en quinconce), enduit (points épars), bardage bois (lames). Les versants des toitures portent la texture de leur couverture : tuiles, ardoises, zinc (joints debout), bac acier (nervures). Isolant, plâtre, toiture plate, pignons et sans matériau : rien (rendu d'avant). Mêmes traits vectoriels à l'écran, dans le PDF et dans la planche (écartement constant sur le papier, D47). La matière coupée reste hachurée, jamais texturée.
- Limites : les pignons ne prennent pas de texture (ils ne connaissent pas le mur dessous) ; les textures ne passent pas dans les plans de niveau (vus de dessus).
- Fichiers : `src/features/building/{types,model,roofModel}.ts`, `views/{projection,section,drawing}.ts`, `views/textures.test.ts` (nouveau), `hatching.test.ts`
- Vérification : build ✓ lint ✓ ; tests : 7 nouveaux ✓ (vues 65 sur 65)
- Commit : feat: M10 bis lot C tâche 4, textures dans les façades, coupes et PDF

### 2026-11-12 — M10 bis · Lot C · Tâche 3 · Hachures dans les coupes et les plans de niveau
- Fait : un mur qui a un matériau est dessiné, là où il est coupé, en **blanc hachuré** au lieu du noir plein : dans les coupes et dans les plans de niveau de la planche, à l'écran et dans le PDF (mêmes traits vectoriels). Hachure selon le matériau (béton 45° serré, maçonnerie 45° espacé, brique 45° doublé, bois fil le long du mur, isolant zigzag, plâtre pointillé), écartement constant sur le papier (D47). La matière hachurée est cernée d'un trait de coupe **sans couture** entre ses morceaux (angles, allèges, linteaux) : nouvelle fonction pure `exposedOutline`. Sans matériau : rendu d'avant (noir). Le matériau suit le mur dans le modèle (`WallPiece.material`, `ViewFace.material`).
- Limites : les pignons (prolongement du mur sous la toiture) et le profil coupé des toitures restent noirs ; aux angles, un bout de contour est tracé deux fois au même endroit (invisible).
- Fichiers : `src/features/building/views/{drawing,patterns,section,projection}.ts`, `hatching.test.ts` (nouveau), `src/features/building/{types,wallPieces}.ts`, `src/components/views/ViewDrawing.tsx`, `src/features/export/pdf.ts`
- Vérification : build ✓ lint ✓ ; tests : 10 nouveaux ✓. Suite complète 2396 sur 2397 : toujours le test de vitesse « 600 murs en moins de 200 ms » sous la charge, qui passe seul (37 sur 37).
- Commit : feat: M10 bis lot C tâche 3, hachures dans les coupes et les plans

### 2026-11-12 — Hors jalon · Séparer les côtés d'un mur
- Fait : bouton **« Séparer les côtés »** dans Propriétés (visible quand le mur sélectionné a au moins deux côtés). Il remplace le mur par un mur par côté ; les nouveaux murs gardent épaisseur, hauteur, couleur, matériau, niveau, verrouillage et visibilité, et restent sélectionnés (un clic en choisit un seul, un double-clic les reprend tous). Le premier côté garde l'identifiant du mur d'origine ; les noms deviennent « Mur 1 », « Mur 2 »… Les portes et fenêtres passent sur le mur de leur côté, à la même place. Une ouverture posée sur un côté de longueur nulle (sommet en double) est retirée, avec un message. Un seul pas d'annulation. Pour couper un côté droit en deux, ajouter d'abord un sommet avec le « + » du milieu du côté.
- Fichiers : `src/features/geometry/splitWall(.test).ts` (nouveaux), `src/stores/editorStore.ts` (action `splitWall`), `PlanElementFields.tsx`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ ; tests : 11 nouveaux ✓ (longueur 14000 mm, surfaces et ouvertures déduites identiques avant et après ; raccords d'angle présents). Dans la suite complète, 2386 sur 2387 : le test de vitesse « 600 murs en moins de 200 ms » échoue sous la charge (3e fois depuis C.2), et passe seul (37 sur 37). Seuil non modifié : à décider avec l'utilisateur.
- Commit : feat: séparer les côtés d'un mur

### 2026-11-12 — Hors jalon · Sélection des murs liés
- Fait : un clic sélectionne un seul mur (inchangé) ; un **double-clic** sélectionne tous les murs liés, de proche en proche, sur le même niveau (Maj + double-clic : les ajoute à la sélection). « Lié » = un sommet d'un mur touche l'axe d'un autre, à la demi-épaisseur près : angles, prolongements et cloisons en T. Les murs masqués et ceux des autres niveaux sont ignorés. Une indication apparaît dans Propriétés.
- Fichiers : `src/features/building/wallChains(.test).ts` (nouveaux), `useElementInteractions.ts`, `shapes/WallShape.tsx`, `PlanElementFields.tsx`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (2376, dont 7 nouveaux)
- Commit : feat: double-clic pour sélectionner les murs liés

### 2026-11-12 — M10 bis · Lot C · Tâche 2 · Choix du matériau et de la couverture dans Propriétés
- Fait : liste « Matériau » pour un mur (six matériaux + « Aucun »), liste « Couverture » pour une toiture (cinq couvertures + « Aucun »). Avec plusieurs murs sélectionnés, la même liste change le matériau de tous d'un coup (un seul pas d'annulation) et affiche « Plusieurs » si les murs diffèrent. « Aucun » retire le champ : le fichier redevient identique à celui d'avant. Rien n'est encore dessiné différemment (hachures, textures et 3D : tâches 3 à 5).
- Fichiers : `src/components/editor/MaterialField.tsx` (nouveau), `PlanElementFields.tsx`, `PropertiesPanel.tsx`, `RoofFields.tsx`, `src/features/building/materials(.test).ts`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (2369 ; le test de vitesse « 600 murs en moins de 200 ms » a échoué une fois sous la charge du lot complet, et passe seul)
- Commit : feat: M10 bis lot C tâche 2, choix du matériau dans Propriétés

### 2026-11-11 — M10 bis · Lot C · Tâche 1 · Matériaux et motifs (calcul pur)
- Fait : champs facultatifs `material` sur un mur et `covering` sur une toiture (D46). Catalogue (`materials.ts`) : six matériaux, cinq couvertures, texture de façade déduite. Générateur de motifs (`views/patterns.ts`) : traits découpés dans n'importe quel polygone (convexe ou non), sur une grille commune, écartement proportionnel à la hauteur des textes (D47). **Hachures** : béton (45° serré), maçonnerie (45° espacé), brique (45° doublé), bois (fil le long du plus long côté), isolant (zigzag d'une face à l'autre), plaque de plâtre (pointillé). **Textures** : enduit (points épars), brique (rangs et joints en quinconce), bardage (lames horizontales), tuiles, ardoises (rangs et joints), zinc (joints debout), bac acier (nervures doublées). Motifs dessinés pour Fabrics. Rien n'est encore affiché (tâches 2 à 5).
- Fichiers : `src/features/building/materials(.test).ts`, `src/features/building/views/patterns.ts` (nouveaux), `src/types/document.ts`
- Vérification : build ✓ lint ✓ tests ✓ (2366, dont 19 nouveaux)
- Commit : feat: M10 bis lot C tâche 1, matériaux et motifs

### 2026-11-11 — Correctif · Pièces qui se superposent sur un même niveau
- Fait : le dessin n'est pas bloqué, mais deux pièces d'un même niveau qui se recouvrent sur une surface réelle (recouvrement partiel, pièce incluse, doublon) passent en **rouge** sur le plan, et le panneau Métrés affiche un **avertissement** (« n pièces se superposent… surface comptée en double »). Les pièces mitoyennes ou qui se touchent par un coin ne comptent pas ; les niveaux sont comparés séparément ; une pièce sans niveau est comparée à toutes. Calcul pur dans `roomOverlap.ts` (pièces concaves et déplacées comprises).
- Fichiers : `src/features/geometry/roomOverlap.ts`, `roomOverlap.test.ts` (nouveaux), `src/components/editor/shapes/RoomShape.tsx`, `src/components/editor/MeasurementsPanel.tsx`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (2347, dont 13 nouveaux) — à tester dans le navigateur (voir ci-dessous)
- Commit : fix: avertissement pour les pièces superposées

### 2026-11-11 — M10 bis · Lot B · Tâche 5 · Métrés des toitures
- Fait : `computeMeasurements` mesure chaque toiture (`RoofMeasure`) : forme, pente (vide pour un toit plat), débord, surface au sol débord compris, **surface réelle**, longueurs de **faîtage**, d'**égouts** et d'**arêtiers** (en pente), **nombre de pignons** ; totaux par niveau et pour le bâtiment. Une toiture non valable est listée avec des quantités nulles et la raison. **Panneau Métrés** : tableau « Toitures » (nom, surface réelle, faîtage ; forme, pente, égouts et pignons au survol ; ligne rouge si non valable ; clic = sélection) et total. **Exports** : tableau « Toitures » dans le CSV tableaux, le PDF et l'Excel (même modèle de tableaux) avec une phrase d'explication et une ligne de total ; lignes « Toiture » dans le CSV à plat (pente en °, nouvelle unité `deg`). Aucun prix.
- Fichiers : `src/features/measurements/{measurements,tables,csv}.ts`, `roofMeasurements.test.ts` (nouveau), `measurements.test.ts`, `src/components/editor/MeasurementsPanel.tsx`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (2334, dont 8 nouveaux) — à ouvrir dans Excel : onglet « Toitures »
- Commit : feat: M10 bis lot B tâche 5, métrés des toitures

### 2026-11-11 — M10 bis · Lot B · Tâche 4 · Toiture dans les façades et les coupes
- Fait : les façades et coupes savent dessiner des **faces inclinées**. Chaque prisme de toiture donne ses faces (dessus et dessous du versant, rives, pignon) avec leur normale sortante ; une face tournée vers la personne qui regarde et non vue par la tranche est projetée (polygone quelconque) et passe par l'algorithme du peintre comme les autres. **Façades** : versant vu de face au-dessus de la tranche de l'égout, débord compris ; façade pignon : le **triangle** du pignon sous les deux rives. **Coupes** : la section d'un versant ou d'un pignon par le plan de coupe est l'enveloppe des points où ses arêtes traversent le plan, en **noir** ; ses faces derrière le plan sont découpées par le plan ; une toiture coupée reçoit la cote **« Faîtage »** avec son altitude (en plus des cotes de niveaux), aussi dans la planche. Changer la pente, la forme ou le débord met la 3D, les façades et les coupes à jour en direct (même modèle).
- Critères de la roadmap vérifiés par les tests : la façade pignon montre un triangle ; la coupe perpendiculaire au faîtage montre le profil du toit en noir et cote le faîtage (+ 4601 mm sur un niveau de 2500 mm) ; changer la pente change la façade et la coupe. Vérifié aussi dans un navigateur sans fenêtre (façades Est et Sud, coupe A–A).
- Fichiers : `src/features/building/views/{projection,section,sheet}.ts`, `roofViews.test.ts` (nouveau), `src/components/views/ViewsScreen.tsx`, `src/i18n/fr.ts`, `docs/02-ARCHITECTURE.md`
- Vérification : build ✓ lint ✓ tests ✓ (2326, dont 11 nouveaux)
- Commit : feat: M10 bis lot B tâche 4, toiture dans les façades et les coupes

### 2026-11-11 — M10 bis · Lot B · Tâche 3 · Toiture en 3D
- Fait : le modèle 3D gagne `roofs` : un **prisme par versant** (dessus du versant, épaisseur de dalle du niveau vers le bas, D42) et **par pignon** (triangle au nu extérieur, poussé vers l'intérieur de l'épaisseur du mur dessous, ou de l'épaisseur par défaut du plan sans mur, D43) ; un toit à un pan a aussi son mur haut rehaussé. Les pignons montent jusqu'au **dessous** du versant (sinon leur haut affleurait le dessus du toit et dessinait des traits blancs). Un **toit plat dessiné** est une dalle dessus au haut des murs, débord compris (D44). Une toiture **remplace le toit plat automatique** des pièces de son niveau dont le centre est sous son contour ; aucune toiture en vue « étage ouvert » sous le dernier niveau ; une toiture masquée ou non valable ne donne rien (D45). L'emprise du modèle monte jusqu'au faîtage (cadrage de la caméra). **Vue 3D** : versants gris chaud, pignons dans l'enduit des murs, ombres ; un clic sélectionne la toiture. Le modèle reçoit les réglages du plan (épaisseur par défaut des pignons).
- Vérifié dans un navigateur sans fenêtre : deux pans avec pignons, croupe, un pan et toit plat en L.
- Limite (jusqu'à la tâche 4) : les façades et coupes ne dessinent pas encore les toitures ; comme le toit plat automatique est retiré sous une toiture, une façade y montre les murs sans toit.
- Fichiers : `src/features/building/roofModel(.test).ts` (nouveaux), `src/features/building/{model,types}.ts`, `src/components/viewer3d/{Viewer3DScene.tsx,useBuildingModel.ts}`, tests `model.test.ts`, `views/elevation.test.ts`, `docs/02-ARCHITECTURE.md`
- Vérification : build ✓ lint ✓ tests ✓ (2315, dont 16 nouveaux)
- Commit : feat: M10 bis lot B tâche 3, toiture en 3D

### 2026-11-11 — M10 bis · Lot B · Tâche 2 · Outil Toiture et symbole 2D
- Fait : **outil Toiture** (bouton maison, famille Construction, sans raccourci). Barre d'options : Plat, Un pan, Deux pans (par défaut), Croupe ; pour un toit plat, tracé Rectangle ou Polygone ; un toit en pente se trace toujours en rectangle (deux clics). L'outil attrape d'abord les **faces extérieures** des murs (D40). Pendant le tracé : rectangle, cotes, surface, et en plus le débord en pointillé, le faîtage et les arêtiers avec les valeurs par défaut. **Dessin sur le plan** : contour au nu extérieur, débord en pointillé, faîtage et arêtiers en trait fort, une flèche par versant vers le bas avec la pente (« 35° ») ; contour rouge si la toiture n'est pas valable. Pas de remplissage : on la sélectionne par ses traits, et le plan reste lisible et cliquable dessous. **Propriétés** : nom, forme, pente (1° à 75°, au dixième), débord (mm), « Pivoter le faîtage » (deux pans) ou « Changer le côté haut » (un pan), et les mesures : hauteur et altitude du faîtage (ou du point haut), surface réelle, surface au sol avec débord, faîtage, égouts, arêtiers, pignons. Un message rouge explique un toit en pente sur un contour non rectangulaire ou une pente hors limites. Changer de forme : un débord encore à sa valeur par défaut prend celle de la nouvelle forme (500 / 0 mm). **Édition** : déplacement par les points (D6), `Maj + R`, Étirer une zone et Redimensionner l'ensemble ; un toit en pente reste un rectangle quand on glisse un coin (le coin opposé ne bouge pas, pas d'ajout ni de retrait de sommet) ; un toit plat a des sommets libres. Icône dans le panneau Calques, emprise d'export avec le débord.
- Vérifié dans un navigateur sans fenêtre : deux pans, croupe, un pan et toit plat en L dessinés ; outil et options ; tracé d'une nouvelle toiture (aperçu, création, propriétés : faîtage 6200 mm pour 5200 mm + 2 × 500 mm).
- Fichiers : `src/components/editor/{shapes/RoofShape,RoofFields}.tsx` (nouveaux), `src/components/editor/{usePolylineDrawing.ts,PolylineDraftLayer,ToolModeBar,ToolHint,Toolbar,EditorStage,ElementNode,PropertiesPanel,VertexHandles}.tsx`, `src/features/geometry/{transform,rotateSelection,snapping,snapLines,stretchZone,resizeBlock}.ts`, `src/stores/editorStore.ts` (`roof`, `roofShape`, `roofMode`), `src/i18n/fr.ts`, test `roofEditing.test.ts`
- Vérification : build ✓ lint ✓ tests ✓ (2299, dont 8 nouveaux)
- Commit : feat: M10 bis lot B tâche 2, outil Toiture et symbole 2D

### 2026-11-11 — M10 bis · Lot B · Tâche 1 · Calcul pur des toitures
- Fait : nouveau type **`roof`** (contour au nu extérieur des murs, forme, pente en degrés, débord en mm, côté du faîtage `ridgeEdge`) ; pas de changement de version du document. **Calcul pur** `computeRoof` (`src/features/building/roof.ts`) : pour un toit plat (polygone quelconque, contour agrandi du débord), un pan, deux pans et croupe (rectangle obligatoire, pente de 1° à 75°) : versants en 3D avec leur sens de pente, faîtage et arêtiers dans le plan, pignons triangulaires (un pan : deux triangles rectangles et le mur haut rehaussé), altitudes du faîtage et de l'égout, surfaces projetée et réelle, longueurs de faîtage, d'égout et d'arêtiers, nombre de pignons. Refus : contour qui n'est pas un rectangle, pente hors limites, moins de trois points. `createRoofElement` applique les valeurs par défaut (D41) et met le faîtage le long du grand côté ; `pivotRidge` fait le tour des quatre côtés. Décisions D40 à D45 (contour, valeurs par défaut, épaisseur, pignons, toit plat, niveau), corrigées selon les règles déjà en place à la demande de l'utilisateur.
- Critères de la roadmap vérifiés par les tests : deux pans 8000 × 6000 mm, 35°, débord 500 mm → faîtage à + 2101 mm, 76,91 m², faîtage 9000 mm, égouts 2 × 9000 mm, 2 pignons ; croupe → 76,91 m², faîtage 2000 mm, égout 32000 mm, aucun pignon ; pavillon 6000 × 6000 → faîtage 0 mm ; un pan de 6000 mm de portée → + 4201 mm.
- Pas encore visible : aucun outil ni dessin (tâche 2). Seuls l'emprise d'export et l'icône du panneau Calques connaissent déjà le type.
- Fichiers : `src/features/building/roof(.test).ts`, `src/types/document.ts`, `src/features/documents/elements.ts`, `src/features/export/bounds.ts`, `src/components/editor/LayersPanel.tsx`, `docs/02-ARCHITECTURE.md`
- Vérification : build ✓ lint ✓ tests ✓ (2291, dont 27 nouveaux) — rien à contrôler dans le navigateur à ce stade
- Commit : feat: M10 bis lot B tâche 1, calcul pur des toitures

### 2026-11-11 — M10 bis · Lot A · Tâches 3 et 4 · Menuiseries en façade et en 3D, colonne « Style »
- Fait : demande de l'utilisateur de voir les styles aussi en 3D ; les deux tâches partagent un seul calcul (`buildOpeningDetails`), donc la façade, la coupe et la 3D montrent les mêmes menuiseries. **Volumes** : deux vantaux = montant central et deux vitres ; un vantail, fixe, soufflet = une vitre ; coulissante (fenêtre ou baie) = deux vitres décalées qui se recouvrent ; double battant = deux vantaux avec un jour ; va-et-vient = vantail avec un petit vitrage ; pliante = 4 panneaux en zigzag ; coulissante en applique = vantail posé contre la face du mur ; garage sectionnelle = panneaux superposés (environ 500 mm), basculante = un panneau ; ouverture libre = ni cadre ni remplissage. **Traits de façade** (`marks`, nouveau dans le modèle, jamais en 3D) : triangle d'ouverture en pointillé dont la pointe est du côté des gonds (battants et vantaux de fenêtre), triangle pointe en bas pour le soufflet et l'oscillo-battant (en plus du triangle de côté), flèche pour les coulissantes. Ils sont peints juste devant la vitre ou le vantail qui les porte (ordre du peintre), vus en miroir selon la façade. Un mur vu par la tranche ne montre pas ses traits. L'écran Vues et le PDF savent dessiner une ligne brisée fine (`open` et `dashed` sur un polygone de dessin). **CSV, PDF et Excel** : colonne « Style » dans le tableau des ouvertures (le style par défaut est nommé : « Battant », « Deux vantaux », « Coulissante »).
- Changement visible sur les anciens projets (voulu par le critère d'acceptation) : la fenêtre par défaut a maintenant deux vantaux en façade et en 3D (montant central) ; les portes battantes montrent leur triangle d'ouverture en façade. Les plans 2D et les métrés ne changent pas, sauf la colonne « Style » ajoutée.
- Limites : les marques de coupe (triangles) n'apparaissent pas dans les coupes ; les vantaux ne sont pas dessinés ouverts en 3D.
- Fichiers : `src/features/building/{openingFills,types,model}.ts`, `src/features/building/views/{projection,drawing}.ts`, `src/components/views/ViewDrawing.tsx`, `src/features/export/pdf.ts`, `src/features/measurements/{measurements,tables,csv}.ts`, `src/i18n/fr.ts`, tests `openingStyleModel.test.ts` (nouveau) et mises à jour de `model`, `elevation`, `section`, `sheet`, `csvExport`, `measurements`
- Vérification : build ✓ lint ✓ tests ✓ (2264, dont 23 nouveaux) — à contrôler dans le navigateur : façades (triangles, flèches, vantaux), 3D (vitres, panneaux de garage), PDF d'une façade, colonne « Style » du CSV
- Commit : feat: M10 bis lot A tâches 3 et 4, menuiseries en façade et en 3D

### 2026-11-11 — M10 bis · Lot A · Tâche 2 · Symboles 2D et choix du style
- Fait : **un symbole 2D distinct par style** (16), dessiné pour Fabrics. Portes : battant (inchangé), double (deux battants et deux arcs), va-et-vient (battant des deux côtés), coulissante en applique (vantail contre la face du mur et flèche), à galandage (vantail fermé, place dans le mur en pointillé), pliante (zigzag), garage sectionnelle (rails en pointillé vers l'intérieur) et basculante (panneau qui sort, en pointillé). Fenêtres : deux vantaux (inchangé), un vantail (trait de dormant côté gonds), fixe (un trait de vitrage plein), coulissante (deux vitrages décalés), à soufflet (trait pointillé au milieu). Baies : coulissante (inchangée), fixe (un trait), ouverture libre (seuils en pointillé). Le symbole a un nouveau champ `dashed` (traits pointillés), pris en compte par le plan, l'aperçu de pose et l'emprise d'export. L'oscillo-battant ne change pas le plan. **Choix du style** : dans la barre contextuelle des outils Porte et Fenêtre (liste des styles, boutons de tailles rapides, case « Oscillo-battant » pour les fenêtres à vantaux ; le réglage est mémorisé par outil dans l'état d'interface) et dans Propriétés d'une ouverture posée (même liste, tailles rapides, oscillo-battant). Le style n'est écrit dans le document que s'il diffère du style par défaut. Une galandage sans place est refusée à la pose (aperçu rouge et message) comme à la modification.
- Remarque : sur une coulissante en applique ou à galandage, le bouton « Charnière de l'autre côté » choisit le côté où le vantail se range (le champ `hinge` sert à cela).
- Fichiers : `src/features/geometry/openingSymbol(.test).ts`, `openingSymbolStyles.test.ts`, `src/features/openings/styles.ts` (réglages `OpeningPreset`), `src/stores/editorStore.ts` (`openingPresets`), `src/components/editor/{ToolModeBar,OpeningFields,useOpeningTool,OpeningPreviewLayer,shapes/OpeningShape}.tsx`, `src/features/export/bounds.ts`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (2240, dont 14 nouveaux) — à contrôler dans le navigateur : pose avec chaque style, aperçu, Propriétés, refus de la galandage
- Commit : feat: M10 bis lot A tâche 2, symboles 2D et choix du style

### 2026-11-11 — M10 bis · Lot A · Tâche 1 · Catalogue des styles d'ouvertures
- Fait : champs facultatifs **`style`** et **`tiltTurn`** (oscillo-battant) sur `opening` ; pas de migration, une ouverture sans style garde son dessin d'avant (battant, deux vantaux, baie coulissante). **Catalogue** (`src/features/openings/styles.ts`) : 8 styles de porte, 5 de fenêtre, 3 de baie, avec leurs tailles par défaut (mm) ; **tailles rapides** (porte d'entrée 1000 × 2150, porte-fenêtre à un ou deux vantaux, vitrine 3000 × 2200, passe-plat 600 × 600 à 1000 d'allège). **Modifications** (`openingEdit.ts`) : `changeOpeningStyle` (une taille encore par défaut prend celle du nouveau style, une taille modifiée à la main est gardée, ainsi que l'ancienne si la nouvelle ne tient pas), `applyQuickSize`, `setTiltTurn`. **Galandage** : refusée (`no-pocket`, message dédié) s'il n'y a pas, d'un côté, une longueur de mur libre au moins égale à sa largeur ; la même règle vaut quand on la redimensionne. Changer le type d'une ouverture (porte → fenêtre…) retire son style.
- Décisions : tailles des portes-fenêtres choisies par moi (un vantail 900 × 2150, deux vantaux 1400 × 2150) car la roadmap ne les chiffrait pas. Les styles s'afficheront aussi en 3D (demande de l'utilisateur, tâche 4 du lot A).
- Pas encore visible : aucun écran ne choisit encore le style (tâche 2).
- Fichiers : `src/features/openings/styles(.test).ts`, `src/features/geometry/openingEdit.ts`, `openingStyleEdit.test.ts`, `src/types/document.ts`, `src/components/editor/OpeningFields.tsx`, `src/i18n/fr.ts`, `docs/02-ARCHITECTURE.md`
- Vérification : build ✓ lint ✓ tests ✓ (2226, dont 30 nouveaux) — rien à contrôler dans le navigateur à ce stade
- Commit : feat: M10 bis lot A tâche 1, catalogue des styles d'ouvertures

### 2026-11-11 — Hors jalon · Sommets d'aimantation lisibles (nature et tri selon l'outil)
- Fait : demande de l'utilisateur (outil Pièce en rectangle avec murs : trois points verts à 100 mm les uns des autres, on ne sait pas lequel choisir). Option 2 choisie. **Nature de chaque sommet** : axe du mur, face intérieure ou extérieure d'un mur fermé (la face intérieure entoure la plus petite surface), face d'un mur ouvert ou croisement de faces, angle de pièce, extrémité de cote, croisement d'axes, point du tracé. **Repère près du curseur** : couleur propre à chaque nature et étiquette (« Axe du mur », « Face intérieure »…). **Tri selon l'outil** : Mur, Axe et Ligne de coupe attrapent d'abord les axes des murs ; Pièce et Plateforme les faces intérieures, faces de murs ouverts et angles de pièces ; Cote les faces, angles de pièces et extrémités de cotes. Un autre sommet compte comme deux fois plus loin : il reste attrapable en s'en approchant. Les points du tracé en cours sont toujours préférés. Même tri quand on glisse le sommet d'un élément posé.
- Fichiers : `src/features/geometry/snapping(.test).ts` (`VertexKind`, `preferredVertexKinds`), `src/components/editor/{usePolylineDrawing.ts,VertexHandles.tsx,PolylineDraftLayer.tsx}`, `src/i18n/fr.ts`
- Vérification : lint ✓ ; build ✓ et tests ✓ (2180, dont 5 nouveaux) sur une copie propre du dernier commit avec ces seuls changements. Dans le dossier de travail, le build et un test (`model.test.ts`, calcul 3D) échouent à cause de modifications en cours de `src/features/building/*` qui ne viennent pas de cette tâche. Étiquettes et tri à contrôler dans le navigateur.
- Commit : feat: sommets d'aimantation lisibles (nature et tri selon l'outil)

### 2026-11-11 — Hors jalon · Aimantation précise (pose, déplacement, niveaux)
- Fait : demande de l'utilisateur (murs de deux pièces préfabriquées voisines décalés de quelques cm ; étages difficiles à aligner ; objets et escaliers mal aimantés). **Causes** : à la pose, le **centre** suivait la grille, donc les bords d'une emprise de 3900 mm tombaient à 50 mm de la grille ; au déplacement, l'aimantation utilisait le cadre dessiné à l'écran (traits, étiquettes, textes compris) et aucune grille ; le niveau du dessous n'attirait rien. **A. Pose** (objets, ensembles, pièces préfabriquées, escaliers, cheminées) : les bords et le centre de l'emprise s'aimantent aux **faces et axes des murs** et aux bords des éléments proches (8 px à l'écran), avec les guides roses dans l'aperçu ; à défaut, c'est le **coin** qui suit la grille. Une pièce préfabriquée s'aligne par son mur (faces extérieures, axe, faces intérieures). **B. Déplacement** dans un plan : même calcul sur la vraie géométrie (faces et axes des murs, sommets des pièces et plateformes, emprises), puis grille si aucun guide ; positions en mm entiers ; Alt coupe l'aimantation. Un groupe s'aimante par son emprise et ses murs, pas par son mobilier. Les visuels gardent l'aimantation d'avant. **C. Niveaux** : le niveau du dessous, **quand il est affiché en transparence**, attire le tracé, le glissement des sommets, la pose et le déplacement (choix de l'utilisateur). Les guides s'effacent quand on change d'outil.
- Changement : le glissement d'un sommet ne s'aimante plus aux sommets de **tous** les niveaux, seulement au niveau actif et au niveau du dessous affiché (même règle partout).
- Fichiers : `src/features/geometry/snapLines(.test).ts` (nouveau), `src/features/library/placement.ts`, `src/features/stairs/placement.ts`, `src/stores/editorStore(.test).ts` (`selectSnapElements`), `src/components/editor/{EditorStage,useElementInteractions,usePolylineDrawing,VertexHandles,FurnitureGhost,StairGhost}`, tests `search.test.ts`, `stairIntegration.test.ts`
- Vérification : build ✓ lint ✓ tests ✓ (2175, dont 15 nouveaux) — pose, déplacement et alignement entre niveaux à contrôler dans le navigateur
- Commit : fix: aimantation précise à la pose, au déplacement et entre niveaux

### 2026-11-11 — Hors jalon · Feuille A2 pour les PDF
- Fait : demande de l'utilisateur (les plans sont souvent imprimés en A2). Le format **A2** (420 × 594 mm) s'ajoute à A4 et A3 dans la fenêtre Exporter (plans, visuels, métrés en PDF) et dans la fenêtre PDF des vues (façades, coupes, planche). Le cartouche affiche « A2 ». Liste des formats commune : `SHEET_FORMATS`.
- Fichiers : `src/features/export/pdfLayout(.test).ts`, `src/components/editor/ExportDialog.tsx`, `src/components/views/ViewsPdfDialog.tsx`
- Vérification : build ✓ lint ✓ tests ✓ (2161) — PDF A2 à ouvrir dans le navigateur
- Commit : feat: feuille A2 pour les PDF

### 2026-11-11 — Plan du jalon M10 ter
- Fait : demande de l'utilisateur. Nouveau jalon **M10 ter — Documents client / exécution** dans `docs/03-ROADMAP.md`, après M10 bis. Un seul calcul, deux présentations. Lot A : métrés Client (pièces, dimensions intérieures, surface au sol, nombre d'ouvertures ; PDF d'une page) et Exécution (tout, avec repères `M01`/`P01`/`F01`, toutes les ouvertures déduites ; CSV + PDF). Lot B : cotes Client (cotes extérieures totales, nom et dimensions intérieures des pièces) et Exécution (trois chaînes de façade, chaînes intérieures, baies `largeur / hauteur` + allège, altitudes, escaliers), réglage « Cotation » dans la barre du plan et par vue de la planche. Décisions D35 à D39. Au passage, les critères de M3, M7, M10 et M11 encore écrits en m ou en cm sont réécrits en mm (règle de `CLAUDE.md`).
- Fichiers : `docs/03-ROADMAP.md`, `docs/PROGRESS.md`
- Vérification : documentation seulement (pas de code)
- Commit : docs: plan du jalon M10 ter

### 2026-11-11 — Plan du jalon M10 bis
- Fait : demande de l'utilisateur. Nouveau jalon **M10 bis** dans `docs/03-ROADMAP.md`, entre M10 et M11 (pas de renumérotation de M11 à M14). Lot A : styles de portes, fenêtres et baies (champ `style` facultatif, tailles rapides au lieu de styles en double). Lot B : toitures (plat, un pan, deux pans, croupe ; pavillon = croupe sur un carré) avec leurs calculs. Lot C : hachures et textures. Critères d'acceptation chiffrés. Les toitures avancées et la fenêtre ronde passent dans « Plus tard ». Décisions D32 à D34.
- Fichiers : `docs/03-ROADMAP.md`, `docs/PROGRESS.md`
- Vérification : documentation seulement (pas de code)
- Commit : docs: plan du jalon M10 bis

### 2026-11-11 — Hors jalon · M · Façades, coupes et plans de planche plus propres
- Fait : demande de l'utilisateur (« améliore la qualité de dessin des façades et coupes, c'est très moche »). **Murs sans couture** : façades et coupes dessinent les murs d'après leurs faces sur grille (`buildWallQuads`, les mêmes que la 3D) ; chaque face dit quels côtés sont de vrais bords (contour, ouverture, angle) — les jonctions entre trumeau, allège et linteau, entre deux segments alignés et entre le rez et l'étage d'un même plan (`mergeStackedEdges`) ne sont plus tracées. À l'écran comme dans le PDF, les faces d'un même plan sont peintes ensemble : tous les fonds (rendu net, sans interstice), puis les traits (`paintBatches`). **Ouvertures garnies** : cadre et vitre gris clair (fenêtres, baies), cadre et vantail (portes) en façade ; en coupe, cadre coupé en noir et vitre coupée en filet. **Dalle du rez** : plus dessinée sous le terrain en façade (les coupes la gardent). **Cotes de niveau** : le trait part du bord du bâtiment au lieu de traverser le dessin. **Plans de la planche** : coupés à 1000 mm comme un plan d'architecte — murs coupés en noir plein d'un seul tenant, allèges vues sous la coupe, cadres et vitres dans les fenêtres, passages de porte ouverts. Vérifié par captures de l'écran Vues et du PDF A3 de la planche (maison de test : rez, étage, annexe, coupe).
- Fichiers : `src/features/building/{types,wallMesh}.ts`, `src/features/building/views/{projection,section,drawing}.ts` + tests, `src/components/views/ViewDrawing.tsx`, `src/features/export/pdf.ts`
- Vérification : build ✓ lint ✓ tests ✓ (2196)
- Commit : feat: façades, coupes et plans de planche sans couture, avec cadres et vitres

### 2026-11-11 — Hors jalon · L · Vue 3D plus propre
- Fait : demande de l'utilisateur (« c'est quoi ce petit chapeau moche au-dessus ? et en dessous ? », puis « améliore la 3D en général »). **Toit plat** : il est maintenant **pris entre les murs** (son dessus au haut des murs, comme un toit plat avec acrotère) au lieu d'être posé dessus, en retrait d'une épaisseur de mur ; il couvre **chaque pièce sans pièce au-dessus** (un rez plus large que l'étage, une annexe, reçoit aussi son toit). **Dalle du rez** : elle est sous le terrain, la 3D ne la dessine plus (les coupes la gardent, en noir). **Murs sans couture** : chaque mur est dessiné d'un seul maillage, découpé par ses ouvertures sur une grille complète (`buildWallMesh`), ce qui supprime les lignes parasites aux bords des fenêtres et aux angles ; les façades et coupes gardent les boîtes. **Ouvertures garnies** : cadre anthracite, vitre teintée (fenêtres, baies) ou vantail bois (portes) (`buildOpeningFills`). **Rendu** : soleil avec **ombres douces** cadrées sur le bâtiment, **terrain** qui reçoit les ombres sous une grille discrète, brouillard qui fond l'horizon, palette neutre et chaude (enduit blanc cassé, toit gris gravier). Aucun métré ne change. Vérifié par captures d'écran d'une maison de test (rez, étage, annexe) dans un navigateur sans fenêtre.
- Fichiers : `src/features/building/{model,types,wallPieces,wallMesh,openingFills}.ts`, `model.test.ts`, `views/elevation.test.ts`, `src/components/viewer3d/Viewer3DScene.tsx`
- Vérification : build ✓ lint ✓ tests ✓ (2191)
- Commit : feat: vue 3D plus propre (toit entre les murs, murs sans couture, vitres et ombres)

### 2026-11-11 — Hors jalon · K ter · Excel par défaut pour les métrés
- Fait : demande de l'utilisateur (« exportable en .xls, le CSV n'est pas vraiment user-friendly et les données s'éparpillent »). Le fichier Excel existait déjà (`.xlsx`, K bis) mais restait derrière l'option CSV : il devient **le choix par défaut** dans Exporter > Métrés (ordre : Excel, PDF, CSV tableaux, CSV à plat) et le panneau Métrés gagne un bouton principal **« Exporter en Excel »** (tout le bâtiment, mobilier compris) ; le CSV reste disponible en bouton secondaire. Format `.xlsx` gardé plutôt que l'ancien `.xls` (Excel 97-2003) : c'est le format natif d'Excel depuis 2007, ouvert aussi par LibreOffice, Numbers et Google Sheets.
- Fichiers : `src/components/editor/{ExportDialog,MeasurementsPanel}.tsx`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (2161) — bouton à contrôler dans le navigateur
- Commit : feat: Excel par défaut pour l'export des métrés

### 2026-11-11 — Hors jalon · K bis · Fichier Excel des métrés et apostrophe
- Fait : demande de l'utilisateur (« fix this » : le lot 4 laissé en suspens et l'apostrophe visible). **Fichier Excel (.xlsx)** : présentation « Excel (.xlsx) » dans la fenêtre Exporter (même périmètre et même option mobilier). Un **onglet d'information** (projet, date, unités, remarque) puis **un onglet par tableau** ; de **vrais nombres** (valeurs exactes, affichées en mm entiers ou en m² et m³ à 2 décimales) ; **totaux en formules `SOMME`** ; en-têtes figés et filtre ; mise en page paysage sur une page de large ; texte stocké comme texte (un nom qui commence par `=` n'est jamais une formule) ; Excel recalcule à l'ouverture. Vérifié en relisant le fichier avec une bibliothèque Excel indépendante (`openpyxl`, installée seulement dans le dossier temporaire) : onglets, nombres, formules, volets figés et filtres lus correctement. **Dépendance** : `fflate` ajouté à `package.json` (accord de l'utilisateur) ; il ne sert qu'à zipper le fichier, dont le XML est écrit à la main, et il est chargé à la première exportation seulement. **Apostrophe** : un nom qui commence par `= + - @` reçoit maintenant une **espace** en tête dans le CSV (plus d'apostrophe visible : `-Salon` ne devient plus `'-Salon`) ; le fichier Excel n'en a pas besoin. Les cellules des tableaux portent leur valeur exacte (`MetresNumber`) en plus de leur texte.
- Fichiers : `src/features/export/metresXlsx(.test).ts`, `src/features/measurements/{tables,csv}.ts` + tests, `src/components/editor/{exportMetres,ExportDialog}`, `src/features/export/fileName.ts`, `src/i18n/fr.ts`, `package.json`, `docs/02-ARCHITECTURE.md`
- Vérification : build ✓ lint ✓ tests ✓ (2161) — à ouvrir dans Excel : onglets, filtres, formules de total
- Commit : feat: export Excel des métrés (xlsx) et apostrophe CSV remplacée par une espace

### 2026-11-11 — Hors jalon · K · Export des métrés plus professionnel
- Fait : demande de l'utilisateur, après une critique de l'export CSV (huit tableaux empilés, totaux qui ne collent pas, aucun contexte, surfaces ambiguës). Choix de l'utilisateur : **totaux sur les valeurs exactes** (écrit dans le fichier) ; **surface sur l'axe gardée, deux faces ajoutées en colonnes séparées**. **Lot 1, CSV « tableaux »** : en-tête (projet, date, application, unités, remarque sur les totaux) ; une **ligne de total par tableau** ; **références des murs** (M1, M2…) reprises par les ouvertures, pour ne plus confondre deux murs au même nom ; murs avec longueur de l'axe, **surface une face sur l'axe** (brute, ouvertures, nette), **longueur des faces**, **surface deux faces** (brute et nette, ouvertures déduites sur chaque face, mesurée sur les faces onglets compris) et **volume** (m³) ; tableau des **cheminées** ; colonnes Trémie et Surface nette masquées s'il n'y a aucune trémie ; « Surface au tracé » nommée comme telle ; une phrase sous « Murs » explique chaque surface ; totaux par niveau complétés (surface deux faces nette, volume). **Lot 2, CSV « données à plat »** : une ligne par grandeur (Niveau ; Catégorie ; Élément ; Réf. ; Grandeur ; Valeur ; Unité), vrais nombres (mm entiers, m² et m³ à 4 décimales), sans total, pour les tableaux croisés d'Excel. **Lot 3, PDF des métrés** : bordereau avec le cadre et le cartouche des autres PDF (projet, date, feuille, page n/N), tableaux à colonnes ajustées, nombres alignés à droite, totaux en gras, en-tête répété et « (suite) » quand un tableau passe à la page suivante. **Lot 5, fenêtre Exporter** : le bouton « Métrés » propose la présentation (tableaux, données à plat, PDF), le périmètre (tout le bâtiment ou le niveau affiché), le mobilier inclus ou non ; feuille et orientation pour le PDF (paysage proposé). Le bouton « Exporter en CSV » du panneau Métrés garde le CSV tableaux du bâtiment, avec l'en-tête.
- Architecture : un modèle de tableaux commun (`buildMetresTables`) alimente le CSV et le PDF ; les calculs (`computeMeasurements`) gagnent `facesLength`, `facesArea`, `facesNetArea`, `volume` par mur et `chimneys`.
- Pas fait : **lot 4, vrai fichier Excel (.xlsx)** : demande une bibliothèque, à valider par l'utilisateur (voir `CLAUDE.md`). L'apostrophe de protection des formules (`'-Salon`) est gardée : elle protège d'une formule dans Excel et ne s'applique qu'aux noms qui commencent par `= + - @`.
- Fichiers : `src/features/measurements/{measurements,tables,csv}.ts` + tests (`csvExport.test.ts`, `measurements.test.ts`), `src/features/export/{metresPdf,pdf}.ts` + `metresPdf.test.ts`, `src/components/editor/{exportMetres,exportProject,ExportDialog,MeasurementsPanel}`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (2146) — PDF des métrés généré et rendu en image pour contrôle ; ouverture des CSV dans Excel à contrôler à la main
- Commit : feat: PDF des métrés et options d'export des métrés

### 2026-11-11 — Hors jalon · J · Mise en page professionnelle des PDF
- Fait : demande de l'utilisateur (PDF « professionnels, design neutre », en s'aidant des skills `ui-ux-pro-max` et `impeccable`). Les recherches de `ui-ux-pro-max` proposaient une page web violette sans rapport : j'ai gardé seulement son principe « minimalisme / suisse » (neutre, fonctionnel, sans décor) et Helvetica, la police standard des PDF. **Cadre** fin autour de la feuille. **Cartouche** refait : à gauche la **flèche du nord** (plans et planche) et une **barre d'échelle graphique** à deux segments gradués en mm (1:50 : 2 × 1000 mm ; 1:100 : 2 × 2000 mm ; 1:20 : 2 × 500 mm), au milieu le **nom du projet** en gras et ce que montre la feuille (« Façade Nord », nom du niveau et surface des pièces pour un plan), à droite des cellules **Échelle / Date / Feuille** (intitulé en petites capitales grises, valeur dessous ; « Échelle indicative / env. 1:87 » quand le plan est ajusté à la page, car elle n'est pas garantie). **Palette neutre** : encre presque noire, gris sans teinte, plus aucun indigo. **Trois épaisseurs de trait** : sol en gras, contours normaux, cotes de niveaux en filet gris pointillé ; matière coupée en noir ; filet sous chaque titre de la planche. **Textes** : environ 7 pt sur le papier à toutes les échelles (le dessin est reconstruit à l'échelle choisie, donc les cotes de niveaux ne se chevauchent plus), titres de la planche en gras, propriétés du PDF (titre, sujet, créateur). L'écran Vues utilise la même palette et les mêmes épaisseurs.
- Fichiers : `src/features/export/{pdf,pdfLayout,cartouche}.ts` + tests, `src/features/building/views/{drawing,sheet}.ts`, `src/components/views/{ViewDrawing,ViewsScreen,ViewsPdfDialog}.tsx`, `src/components/editor/exportProject.ts`, `src/lib/date.ts`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (2128) — PDF de planche (A3) et de coupe (A4, 1:100) générés et rendus en image pour contrôle ; le PDF d'un plan (image du canevas dans le nouveau cadre) est à ouvrir dans le navigateur
- Commit : feat: mise en page professionnelle des PDF (cadre, cartouche, palette neutre, traits)

### 2026-11-11 — M10 · Tâche 6 · Export PDF des vues
- Fait : bouton **« PDF »** dans l'écran Vues, pour la vue affichée (façade, coupe ou planche). Fenêtre : nom du fichier, feuille A4 / A3, orientation (paysage si le dessin est plus large), **échelle** 1:20, 1:50, 1:100, 1:200 ou « Ajuster à la page » (l'échelle la plus grande qui tient est proposée d'emblée ; message et suggestion si elle ne tient pas, comme pour les plans). PDF **vectoriel** (pas une image) : les mm réels du dessin divisés par l'échelle donnent des mm de papier (2,50 m à 1:50 = 50 mm), faces blanches ou noires (coupes), cotes de niveaux, titres de la planche ; textes jamais plus petits que 6 pt. Même **cartouche** et même barre d'échelle de 1 m que le PDF d'un plan (nom du projet, date, échelle, et le titre de la vue). `Choice` et `ChoiceGroup` (pastilles de la fenêtre Exporter) sont devenus des composants communs.
- Fichiers : `src/features/export/pdf.ts` (`buildDrawingPdf`, `drawCartouche`), `pdf.test.ts`, `src/components/views/{ViewsPdfDialog,ViewsScreen}.tsx`, `src/components/ui/{Choice,ChoiceGroup}.tsx`, `src/components/editor/ExportDialog.tsx`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (2122) — PDF à ouvrir et mesurer à la règle (hauteur d'étage de 2,50 m = 50 mm à 1:50, impression à 100 %)
- Commit : feat: M10 tâche 6, export PDF des vues

### 2026-11-11 — M10 · Tâche 5 · Planche
- Fait : format de **dessin commun** (`Drawing` : polygones, lignes, textes, en mm réels) que l'écran et le PDF de la tâche 6 dessineront tous les deux ; les façades et coupes passent maintenant par lui (même rendu qu'avant). **Onglet « Planche »** (dernier onglet de l'écran Vues) : plans de chaque niveau (sols en gris clair, murs en gris foncé, vus de dessus), les quatre façades et les coupes, **côte à côte à la même échelle**, rangés en lignes dans cet ordre, chacun sous son titre (nom du niveau, « Façade Nord », « Coupe A–A »). Les textes ont une hauteur commune ; un niveau ou une vue vide n'a pas de case. Planche vide : message.
- Limite : le plan d'un niveau montre les murs pleins (pas de symboles de portes ni de fenêtres) ; les symboles viendront avec les hachures et textures si tu le veux.
- Fichiers : `src/features/building/views/{drawing,sheet,section}.ts`, `sheet.test.ts`, `src/components/views/{ViewsScreen,ViewDrawing}.tsx`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (2121, dont 10 nouveaux) — rangement et lisibilité à contrôler dans le navigateur
- Commit : feat: M10 tâche 5, planche

### 2026-11-11 — M10 · Tâche 4 · Calcul et affichage de la coupe
- Fait : **calcul pur** `buildSection` : tout solide (morceau de mur, marche, cheminée, dalle, plateforme) est un contour extrudé ; le plan de coupe le traverse sur des segments (règle pair-impair, donc les trémies sont des vides) qui deviennent des faces **coupées** (noires, au premier plan) ; ses côtés restent visibles **derrière** la ligne, dans le sens du regard, en blanc à contour noir ; tout est limité à la **longueur** de la ligne. Une fenêtre coupée montre l'allège et le linteau en noir et le vide entre les deux. **Écran Vues** : un onglet « Coupe A–A » par ligne de coupe du plan (dans l'ordre des repères), à jour en direct : déplacer ou inverser la ligne met la coupe à jour ; une ligne supprimée affiche un message ; une ligne qui ne rencontre rien aussi. Même dessin et mêmes cotes de niveaux que les façades.
- Limites : les côtés intérieurs d'une trémie derrière la coupe ne sont pas dessinés ; hachures et textures plus tard (jalon ultérieur).
- Fichiers : `src/features/building/views/{section(.test),projection}.ts`, `src/components/views/{ViewsScreen,ViewDrawing}.tsx`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (2111, dont 10 nouveaux) — onglets et noir de la coupe à contrôler dans le navigateur
- Commit : feat: M10 tâche 4, coupes

### 2026-11-11 — M10 · Tâche 3 · Ligne de coupe
- Fait : nouveau type **`section`** (deux points absolus, repère, sens de vue `lookLeft` ; commun à tous les niveaux comme les axes ; pas de changement de version). **Outil « Ligne de coupe »** (bouton ciseaux, famille Cotation, sans raccourci) : deux clics, avec les mêmes aimantations et guides que l'axe ; le repère suit la suite A, B, C… **Dessin 2D** : trait mixte noir, une flèche à chaque bout vers le sens de vue, une bulle avec le repère au bout de chaque flèche. **Propriétés** : repère (le nom suit : « Coupe A–A »), bouton « Inverser le sens de vue », longueur en mm. Se déplace et se modifie aux sommets comme un axe ; ne tourne pas avec `Maj + R`. Le sens de vue : « à gauche » est celui de la personne qui marche du premier au deuxième point, vue de dessus. La coupe elle-même vient à la tâche 4.
- Fichiers : `src/types/document.ts`, `src/features/geometry/{sections(.test),transform,rotateSelection}.ts`, `src/features/documents/{elements,levels}.ts`, `src/features/export/bounds.ts`, `src/components/editor/{shapes/SectionShape,SectionFields,ElementNode,Toolbar,ToolHint,EditorStage,usePolylineDrawing,PolylineDraftLayer,PropertiesPanel,LayersPanel}`, `src/stores/editorStore.ts`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (2101) — tracé, flèches et inversion à contrôler dans le navigateur
- Commit : feat: M10 tâche 3, ligne de coupe

### 2026-11-11 — M10 · Tâche 2 · Écran « Vues » avec les façades
- Fait : bouton **« Vues »** dans l'en-tête (projets Plan) qui ouvre un écran en lecture seule plein écran avec quatre onglets **Façade Nord / Est / Sud / Ouest** (vue de l'extérieur). Dessin en SVG : faces blanches à contour noir, ligne de sol, **cotes de niveaux** (nom et altitude du plancher en mm, `± 0 mm`, `+ 2500 mm`) en pointillé indigo. La vue suit le plan en direct (même modèle que la 3D, tous les niveaux, toit plat). Les onglets des coupes et de la planche arrivent aux tâches 4 et 5.
- Choix : dessin en SVG et non en Konva (plus léger pour une vue en lecture seule ; le PDF de la tâche 6 redessinera les mêmes faces en vectoriel).
- Fichiers : `src/stores/viewsStore.ts`, `src/components/views/{ViewsScreen,ViewDrawing}.tsx`, `src/features/building/views/labels(.test).ts`, `src/components/editor/EditorHeader.tsx`, `src/pages/EditorPage.tsx`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (2091) — affichage à contrôler dans le navigateur
- Commit : feat: M10 tâche 2, écran Vues avec les façades

### 2026-11-11 — M10 · Tâche 1 · Calcul des façades
- Fait : choix validés avec l'utilisateur : écran « Vues » en lecture seule ouvert par un bouton de l'en-tête (la planche en dernier onglet) ; faces blanches à contour noir (hachures, textures et toitures dans un jalon ultérieur, notés dans « Idées » et dans la roadmap) ; escaliers, cheminées et plateformes inclus. **Calcul pur** : `projectModel` projette le modèle 3D sur un plan vertical (u = droite de la personne qui regarde, v = hauteur), ne garde que les faces verticales tournées vers elle, triées de la plus lointaine à la plus proche (algorithme du peintre) ; `buildElevation` donne la façade N, S, E ou O selon le nord réglé, avec son emprise et les cotes de niveaux (altitudes des planchers). Une face vue par la tranche (moins de 0,5 mm de large) n'est pas dessinée. Pas encore d'écran : suivent les tâches 2 à 7.
- Limite connue : le tri se fait par face (milieu de la face), approximation classique du peintre ; sans conséquence pour des faces blanches à contour noir sur des murs droits.
- Fichiers : `src/features/building/views/{projection,elevation}.ts`, `elevation.test.ts`
- Vérification : build ✓ lint ✓ tests ✓ (2090, dont 12 nouveaux)

### 2026-11-11 — Hors jalon · I · Étirer par zone (tâche 4 sur 4 : validation)
- Fait : contrôle dans le navigateur par l'utilisateur : outil Étirer (rectangle, aperçu, distance au clavier, annulation en un pas) validé. **Étirer par zone terminé.**
- Suite possible : option A (glisser un seul mur à la poignée), notée dans « Idées ».
- Vérification : build ✓ lint ✓ tests ✓

### 2026-11-11 — Hors jalon · I · Étirer par zone (tâche 3 sur 4 : distance au clavier)
- Fait : pendant le déplacement de l'outil Étirer, on peut **taper la distance en mm** (chiffres, `-` en premier pour inverser, Retour arrière pour corriger) puis `Entrée` : elle s'applique dans la direction où pointe la souris (horizontale ou verticale), arrondie au mm, avec les mêmes garde-fous (angles droits, ouvertures retirées si elles ne tiennent plus). L'aperçu affiche `1000 mm ↵`. La saisie est interceptée avant les raccourcis (Retour arrière ne supprime donc pas la sélection). Le bouton et le raccourci `S` étaient déjà faits à la tâche 2.
- Reste : tâche 4 (contrôle final dans le navigateur).
- Fichiers : `src/features/geometry/stretchZone(.test).ts` (`typedStretchDelta`), `src/components/editor/{useStretchTool.ts,StretchDraftLayer.tsx}`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (2078)

### 2026-11-11 — Hors jalon · I · Étirer par zone (tâche 2 sur 4 : outil et aperçu)
- Fait : **outil Étirer** (`S`, famille Construction, projets Plan uniquement). On **glisse un rectangle** autour de la partie à déplacer, on **clique un point de départ**, puis on **clique le point d'arrivée** : l'aperçu montre en direct les murs, pièces, cotes et objets tels qu'ils seraient (en indigo), avec la distance en mm ; `Maj` garde l'horizontale ou la verticale ; le point suit la grille d'aimantation ; un côté en biais qui traverse la zone bloque le déplacement (message rouge). `Échap` quitte l'outil et abandonne le geste. La validation passe par `stretchZoneBy` (un seul pas d'historique, annulable ; un message si des ouvertures sont retirées). L'outil reste actif pour enchaîner.
- Reste : tâche 3 (saisie de la distance en mm au clavier) et tâche 4 (contrôle final dans le navigateur).
- Fichiers : `src/components/editor/{useStretchTool.ts,StretchDraftLayer.tsx,EditorStage.tsx,Toolbar.tsx,ToolHint.tsx,shortcuts.ts,useEditorShortcuts.ts}`, `src/stores/editorStore.ts` (`stretchZoneBy`, outil `stretch`), `src/i18n/fr.ts`, `src/features/geometry/stretchZone.test.ts`
- Vérification : build ✓ lint ✓ tests ✓ (17 pour l'étirement) — le geste à la souris est à contrôler à la main dans le navigateur

### 2026-11-11 — Hors jalon · I · Étirer par zone (tâche 1 sur 4 : calcul)
- Fait : demande de l'utilisateur (option C : étirer une zone au rectangle, comme « stretch » en CAO ; l'option A, glisser un seul mur à la poignée, est gardée pour après). **Calcul pur** `stretchZone` : les sommets de murs, de pièces et de cotes dans le rectangle se déplacent, les autres restent (les murs qui traversent le bord s'allongent ou se raccourcissent) ; les objets posés dont le centre est dans la zone bougent entiers ; les ouvertures gardent leur taille et leur place réelle (elles suivent leur mur s'il est dans la zone), retirées si elles ne tiennent plus ; verrouillés ignorés. `constrainStretch` garde les angles droits (un mur horizontal qui traverse la zone interdit le déplacement vertical, et inversement ; un côté en biais qui traverse la zone bloque tout). Pas encore d'outil ni de bouton : suivent les tâches 2 (outil et aperçu), 3 (saisie en mm, bouton, raccourci `S`) et 4 (annulation en un pas).
- Fichiers : `src/features/geometry/stretchZone(.test).ts`
- Vérification : build ✓ lint ✓ tests ✓ (15 nouveaux)

### 2026-11-11 — Hors jalon · I · Redimensionner une pièce en bloc
- Fait : demande de l'utilisateur (option A choisie : par la sélection, sans nouveau type dans le document). Quand la sélection contient un mur ou une pièce (par exemple une pièce préfabriquée qui vient d'être posée, ou un rectangle dessiné « Avec murs » sélectionné d'un cadre), Propriétés affiche **« Redimensionner l'ensemble »** : largeur et profondeur en mm, mesurées sur la **pièce** (face intérieure) ou, sans pièce, sur l'axe des murs. À la validation : les **murs, le sol (pièces) et les cotes s'étirent** (les murs gardent leur épaisseur) ; les **ouvertures gardent leur taille** et leur place en proportion le long de leur mur (même celles non sélectionnées, du moment que leur mur l'est) ; les **meubles, escaliers, cheminées et plateformes gardent leur taille** : un élément à moins de 250 mm d'un mur reste contre ce mur (sur chaque axe indépendamment : collé en haut mais au milieu en largeur, il glisse en proportion le long du mur ; dans un angle, il reste dans l'angle), sinon son centre garde sa place en proportion ; toujours dans la pièce (trop grand : poussé contre le début). Une ouverture qui ne tient plus sur son mur raccourci est retirée (message). Un seul pas d'historique ; minimum 500 mm ; éléments verrouillés ignorés. Les ouvertures sont placées par la fonction elle-même : `commit` accepte maintenant de sauter `reconcileOpenings` pour cette action.
- Limites : plans axés sur les axes (murs horizontaux et verticaux ; une pièce tournée par `Maj + R` convient) ; les textes, lignes et images de la sélection ne bougent pas ; la hauteur de plan, les trémies et les niveaux au-dessus se recalculent d'eux-mêmes (rien n'est stocké).
- Fichiers : `src/features/geometry/resizeBlock(.test).ts`, `src/stores/editorStore.ts`, `src/components/editor/{BlockResizeSection,PropertiesPanel}.tsx`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (16 nouveaux) — à contrôler dans le navigateur
- Commit : feat: redimensionner une pièce en bloc (murs et sol s'étirent, ouvertures et meubles gardent leur taille)

### 2026-11-11 — Hors jalon · H · Réorganisation de l'écran de l'éditeur
- Fait : demande de l'utilisateur (« on dirait qu'on a juste jeté tous les outils et éléments en même temps »). **Barre d'outils par familles** (à gauche) : Sélection | Construction (mur, pièce, plateforme, escalier, cheminée) | Ouvertures (porte, fenêtre) | Cotation (cote, axe) | Dessin et texte (texte, rectangle, ellipse, ligne) | Image (importer, calibrer). Un bouton par famille montre l'outil actif ou le dernier choisi ; la petite flèche (ou un clic droit) ouvre la liste de la famille avec les noms et les raccourcis ; Échap ou un clic ailleurs la ferme. Les familles du plan n'apparaissent que dans un plan ; les raccourcis clavier ne changent pas. **Barre contextuelle en haut du plan** : le sélecteur de niveau, puis les options de l'outil en cours (mur droit, rectangle, avec murs, forme d'escalier…), qui étaient en bas au milieu. **Panneau de droite à onglets** (320 px) : Propriétés | Bibliothèque | Calques (niveaux puis calques) | Métrés ; un seul contenu à la fois au lieu de cinq panneaux empilés ; dans un visuel, seulement Propriétés et Calques. Sélectionner un élément sur le plan depuis l'onglet Bibliothèque bascule sur Propriétés (pas depuis Calques ni Métrés, où l'on sélectionne aussi). Les titres répétés par les onglets sont gardés pour les lecteurs d'écran seulement.
- Fichiers : `src/components/editor/{Toolbar,SidePanel,ToolModeBar,LevelSelector,PropertiesPanel,MeasurementsPanel,LayersPanel,LevelsPanel}.tsx`, `src/components/library/LibraryPanel.tsx`, `src/pages/EditorPage.tsx`, `src/stores/editorStore.ts`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (2042) — disposition à contrôler dans le navigateur (aucun test automatisé de l'interface)
- Commit : feat: réorganisation de l'écran de l'éditeur (outils par familles, barre contextuelle, onglets)

### 2026-11-11 — M9 · Lot E · Cheminées
- Fait : nouveau type **`chimney`** (conduit `width × depth`, `heightAboveTop`, `x, y, rotation` comme le mobilier ; pas de changement de version). **Outil Cheminée** (bouton `BrickWallFire`, sans raccourci) : un clic pose un conduit de 600 × 600 mm (dépassement 800 mm), centré et aimanté à la grille ; l'outil reste actif. **2D** : carré gris aux deux diagonales sur son niveau ; **contour fantôme** (pointillé, croix légère) sur tous les niveaux au-dessus du sien. **3D** : une boîte du plancher de son niveau jusqu'au dessus du dernier niveau affiché + le dépassement, cliquable, **sans trou dans les dalles**. **Propriétés** : nom, largeur, profondeur, dépassement, position et rotation ; redimensionnable à la poignée (mm entiers, minimum 100 mm) ; `Maj + R` la tourne sur place. Pas dans les métrés (aucune quantité prévue au jalon).
- Fichiers : `src/features/building/{chimney,chimney.test,model,types}.ts`, `src/features/documents/elements.ts`, `src/features/geometry/{transform,rotateSelection}.ts`, `src/features/export/bounds.ts`, `src/components/editor/{shapes/ChimneyShape,ChimneyFields,ChimneyUpperGhosts,ElementNode,PropertiesPanel,Toolbar,ToolHint,EditorStage,LayersPanel}`, `src/components/viewer3d/Viewer3DScene.tsx`, `src/stores/editorStore.ts`, `src/i18n/fr.ts`, `src/types/document.ts`
- Vérification : build ✓ lint ✓ tests ✓ (2042, dont 12 nouveaux) — pose, fantôme et volume 3D à contrôler dans le navigateur
- Commit : feat: M9 lot E, cheminées

### 2026-11-11 — M9 · Lot D bis · Trémies
- Fait : la **trémie** d'un escalier est calculée (emprise agrandie de la marge, 50 mm par défaut ; jamais stockée) : rectangle pour un escalier droit, **polygone en L** pour un L, rectangle englobant pour un U (volées, palier et jour central). **Dalle 3D** du niveau du dessus **trouée** : la dalle d'une pièce reçoit un trou par trémie qui tient entièrement dans la pièce (forme à trous Three.js, pas de calcul booléen) ; déplacer l'escalier déplace le trou. **Plan du niveau du dessus** : contour pointillé de la trémie avec une croix par rectangle, en plus du contour fantôme de l'escalier. **Métrés** : chaque pièce a sa surface au tracé, sa trémie et sa **surface nette** (panneau Métrés, propriétés de la pièce, totaux du bâtiment) ; le CSV du tableau des pièces gagne les colonnes **« Trémie (m²) »** et **« Surface nette (m²) »**. Une pièce de 5000 × 4000 mm (20,00 m²) au-dessus d'un escalier droit de 1000 × 3500 mm : trou de 1100 × 3600 mm (3,96 m²), 20,00 m² au tracé et 16,04 m² net. **Trémie qui déborde de la pièce** (première version, pas de découpe entre polygones) : avertissement rouge (propriétés de l'escalier, métrés, contour rouge sur le plan), dalle laissée pleine, aucune surface retirée. Niveau du dessus supprimé : plus de trémie. Une trémie est attribuée à la pièce du niveau du dessus qui contient son centre ; sans pièce, il n'y a rien à percer et pas d'avertissement.
- Fichiers : `src/features/stairs/{voids,voids.test}.ts`, `src/features/building/{model,types}.ts`, `src/features/measurements/{measurements,csv}.ts`, `src/components/viewer3d/Viewer3DScene.tsx`, `src/components/editor/{StairUpperGhosts,StairFields,MeasurementsPanel,PlanElementFields}.tsx`, `src/i18n/fr.ts`, tests `measurements.test.ts`
- Vérification : build ✓ lint ✓ tests ✓ (2030, dont 14 nouveaux) — trou de la dalle 3D et croix sur le plan à contrôler dans le navigateur
- Commit : feat: M9 lot D bis, trémies

### 2026-11-11 — M9 · Lot D · Escaliers entre niveaux
- Fait : nouveau type **`stair`** (droit, en L, en U ; `x, y, rotation` comme le mobilier ; marches, paliers et trémie calculés, jamais stockés ; pas de changement de version). **Calcul** (`src/features/stairs/`, fonctions pures) : hauteur à monter = altitude du niveau du dessus − altitude du niveau de départ ; contremarches n = plus petit entier avec hauteur ≤ 180 mm ; girons = n − 1 ; giron = longueur des volées ÷ girons (≥ 250 mm) ; longueur nécessaire = (n − 1) × 250 mm. 2 700 mm donnent 15 contremarches de 180 mm, 14 girons, 3500 mm ; 2 880 mm donnent 16 contremarches. **Outil Escalier** (bouton `Footprints`, sans raccourci) : choix Droit / En L / En U dans la barre de modes, aperçu fantôme, clic = pose centrée avec des longueurs qui suffisent ; **refusée sur le dernier niveau** (message). **Propriétés** : forme (les longueurs sont recalculées au changement), emmarchement, longueurs des volées, jour central (U), Retourner (L et U), marge de trémie, et les marches calculées. **2D** : volées avec lignes de marche, palier, flèche de montée ; **en rouge** avec « Trop court : 3500 mm nécessaires » ou « Aucun niveau au-dessus » (niveau du dessus supprimé : l'escalier reste, sans marches ni trémie). Contour en fantôme (pointillé) sur le niveau du dessus. **3D** : une marche pleine par giron (+ le palier, qui compte pour une marche), cliquable. **Métrés** : tableau « Escaliers » (contremarches, hauteur de contremarche, girons) dans le panneau, et dans le CSV (forme, emmarchement, contremarches, hauteur, girons, giron, remarque). Un escalier ne se redimensionne pas à la poignée (déplacement et rotation seulement ; `Maj + R` le tourne autour du centre de son emprise). Dupliquer un niveau ne copie pas ses escaliers (seuls les murs sont copiés, comme avant).
- Choix : pour que « changer la hauteur d'étage » recalcule les marches, **changer la hauteur d'un niveau remonte ou descend d'autant les niveaux au-dessus** quand ils étaient empilés dessus (le niveau du dessus démarrait exactement à altitude + hauteur) ; un niveau dont l'altitude a été réglée à la main n'est pas déplacé. Un escalier en U a une trémie rectangulaire (volées, palier et jour central).
- Fichiers : `src/features/stairs/{stairs,placement}.ts` + tests, `src/features/building/{stairSteps,model,types}.ts`, `src/features/documents/{elements,levels,properties}.ts`, `src/features/geometry/{transform,rotateSelection}.ts`, `src/features/export/bounds.ts`, `src/features/measurements/{measurements,csv}.ts`, `src/components/editor/{shapes/StairShape,StairFields,StairGhost,StairUpperGhosts,ElementNode,PropertiesPanel,Toolbar,ToolModeBar,ToolHint,EditorStage,LayersPanel,SelectionTransformer,MeasurementsPanel}`, `src/components/viewer3d/Viewer3DScene.tsx`, `src/stores/editorStore.ts`, `src/i18n/fr.ts`, `src/types/document.ts`
- Vérification : build ✓ lint ✓ tests ✓ (2016, dont 41 nouveaux) — pose, rouge, fantôme et marches 3D à contrôler dans le navigateur
- Commit : feat: M9 lot D, escaliers entre niveaux

### 2026-11-11 — M9 · Lot C · Plateformes
- Fait : nouveau type d'élément **`platform`** (polygone à points absolus, `elevation` = hauteur du dessus par rapport au plancher du niveau, `thickness` = épaisseur sous le dessus ; **pas de changement de version** du document). **Outil Plateforme** (bouton `Layers2` dans la barre d'outils des plans, sans raccourci clavier) avec les modes « Polygone » et « Rectangle » (2 clics) de la barre de modes ; mêmes aimantations et guides que la pièce ; les sommets se déplacent comme ceux d'une pièce. Dessin 2D : aplat sable, contour brun et étiquette de hauteur **`+450 mm`** au centre. Propriétés : nom, **hauteur du dessus** (défaut 450 mm), **épaisseur** (défaut = hauteur du dessus, estrade pleine ; jamais plus grande : une saisie plus grande est ramenée à la hauteur, et une estrade pleine suit sa hauteur quand on la change), surface, périmètre et volume. **3D** : prisme extrudé du dessus (`niveau + hauteur`) vers le bas sur son épaisseur, matière sable ; jamais sous le plancher. **Métrés** : tableau « Plateformes » dans le panneau (surface m², volume m³ = surface × épaisseur), totaux par niveau et pour le bâtiment ; **CSV** : tableau « Plateformes » (niveau, nom, surface m², hauteur du dessus mm, épaisseur mm, volume m³) avec une ligne de totaux ; la plateforme n'entre pas dans la surface des pièces. Une plateforme de 4000 × 3000 mm à 450 mm donne 12,00 m² et 5,40 m³. Elle tourne avec `Maj + R`. Unités : mm, m², m³ (nouveaux helpers `formatVolume` et `mm3ToM3`).
- Choix : dupliquer un niveau ne copie pas les plateformes (seuls les murs et leurs ouvertures sont copiés, comme avant) ; l'aimantation des autres tracés tient compte des sommets des plateformes.
- Fichiers : `src/types/document.ts`, `src/features/documents/elements.ts`, `src/features/geometry/{transform,snapping,rotateSelection}.ts`, `src/features/export/bounds.ts`, `src/features/measurements/{measurements,csv}.ts`, `src/features/units/format.ts`, `src/features/building/{model,types}.ts`, `src/components/viewer3d/Viewer3DScene.tsx`, `src/components/editor/{shapes/PlatformShape,PlatformFields,ElementNode,PropertiesPanel,Toolbar,LayersPanel,ToolModeBar,ToolHint,EditorStage,usePolylineDrawing,PolylineDraftLayer,MeasurementsPanel,VertexHandles}`, `src/stores/editorStore.ts`, `src/i18n/fr.ts`, tests `src/features/measurements/platform.test.ts` et `src/features/building/platform.test.ts`
- Vérification : build ✓ lint ✓ tests ✓ (1975, dont 16 nouveaux) — tracé, étiquette et 3D à contrôler dans le navigateur
- Commit : feat: M9 lot C, plateformes

### 2026-11-11 — M9 · Lot B · Pièces préfabriquées et Maj + R étendu
- Fait : catégorie **« Pièces préfabriquées »** dans la Bibliothèque (7 pièces : chambre 3500 × 3200 mm, salle de bain 2500 × 2200, WC 1500 × 1500, cuisine 3600 × 3000, séjour 5000 × 4000, bureau 3000 × 3000, garage 3200 × 6000 ; dimensions = face intérieure). Chacune est **dessinée de zéro** (clean room) à partir d'objets du catalogue et se pose comme un ensemble : une pièce étiquetée, **un seul mur fermé** de 200 mm, des portes et fenêtres rattachées à ce mur (portes ouvertes vers l'intérieur, baie pour le garage) et le mobilier, avec **aperçu fantôme** (mur compris) sous le curseur, vignette avec le mur, clic ou glisser-déposer. La pose se fait en **un seul pas d'historique** (un « annuler » retire tout) ; les éléments restent ensuite **indépendants** et gardent leurs ouvertures. Elles ne fusionnent pas avec les murs voisins. **`Maj + R`** : toute la sélection tourne de 90° autour du centre de son emprise commune (murs, pièces, cotes : leurs points ; mobilier, rectangles, images, ellipses : rotation et position) ; les ouvertures suivent leur mur (une rotation du mur ne les déplace plus ni ne les supprime : `reconcileOpenings` reconnaît un mouvement rigide) ; les axes, éléments verrouillés, textes et lignes ne tournent pas. Escaliers, cheminées et plateformes seront ajoutés au quart de tour avec leurs lots.
- Limite : les meubles de la pièce sont placés à la main sans vérification de passage ; le test contrôle seulement qu'ils restent dans la pièce et que les ouvertures tiennent dans leur mur.
- Fichiers : `src/features/library/catalog/{prefabs,sets,define,index}.ts`, `src/features/library/{placeSet,types}.ts`, `src/features/geometry/rotateSelection(.test).ts`, `src/features/documents/wallOpenings.ts`, `src/features/library/{prefabs.test,testBrands,catalogGlobal.test}.ts`, `src/components/library/{LibraryPanel,SymbolPreview}.tsx`, `src/components/editor/{EditorStage,FurnitureGhost,useEditorShortcuts}`, `src/i18n/{fr,libraryTexts}.ts`
- Vérification : build ✓ lint ✓ tests ✓ (1959, dont 17 nouveaux) — aperçu fantôme, vignettes et rotation à contrôler dans le navigateur
- Commit : feat: M9 lot B, pièces préfabriquées et Maj + R étendu

### 2026-11-11 — M9 · Lot A · Murs et pièces
- Fait : une **barre de modes** apparaît en bas du canevas (pas de bouton de plus dans la barre d'outils). **Outil Mur** : « Polyligne » (comme avant) ou « Mur droit » (clic de début, clic de fin : le mur est créé). **Outil Pièce** : « Polygone » ou « Rectangle » (clic sur un coin, clic sur le coin opposé), avec une case **« Avec murs »** : le rectangle tracé est la face intérieure, et la pièce plus **un seul mur fermé** (axe décalé d'une demi-épaisseur) sont créés en **un seul pas d'historique** (une pièce de 4000 × 3000 mm avec un mur de 200 mm donne 12,00 m² et un axe de 4200 × 3200 mm). Aperçu en direct du rectangle avec largeur, hauteur et surface ; le mur épais est prévisualisé avec l'option. Mêmes aimantations qu'avant, sauf pour le rectangle (pas de direction contrainte, pour ne pas obtenir un rectangle aplati : un clic qui donnerait une surface nulle est ignoré). Changer de mode abandonne le tracé en cours. Maj + survol (pièce automatique) reste disponible dans les deux modes de l'outil Pièce.
- Fichiers : `src/features/documents/construction(.test).ts`, `src/components/editor/{ToolModeBar,usePolylineDrawing,PolylineDraftLayer,ToolHint}`, `src/stores/editorStore.ts`, `src/pages/EditorPage.tsx`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (1942, dont 6 nouveaux) — tracé à la souris à contrôler dans le navigateur
- Commit : feat: M9 lot A, mur droit, pièce rectangle et pièce avec murs

### 2026-11-11 — Hors jalon · G · Style des cotes
- Fait : demande de l'utilisateur (image d'un plan coté). Les cotes se rapprochent de ce style : trait **noir**, **chiffres plus petits** posés juste au-dessus de la ligne, **lignes d'attache fines qui ne touchent pas l'objet** (un petit écart au départ, un dépassement au bout), traits obliques à 45° un peu plus longs. Le texte d'une cote **verticale se lit de bas en haut** (-90°), quel que soit le sens de la mesure. Les valeurs gardent leur unité (règle du projet) mais **l'unité « mm » est plus petite et grise** que le chiffre, et elle est **masquée quand la cote fait moins de 90 px à l'écran** (le chiffre reste) : moins d'encombrement. Largeur du texte estimée (≈ 0,56 × la taille de police par caractère), donc le centrage est approximatif.
- Fichiers : `src/features/geometry/dimension(.test).ts`, `src/components/editor/shapes/DimensionShape.tsx`
- Vérification : build ✓ lint ✓ tests ✓ (1936) — rendu à contrôler à l'écran
- Commit : feat: style des cotes (texte, lignes d'attache)

### 2026-11-11 — Hors jalon · F · Cotes aimantées aux ouvertures
- Fait : demande de l'utilisateur (la cote doit tenir compte des fenêtres, portes et autres ouvertures, avec l'aimantation). Avec l'outil **Cote**, et quand on **glisse l'extrémité d'une cote**, le curseur s'aimante aux **deux jambages** (bords) et au **milieu** de chaque porte, fenêtre ou baie visible, sur l'axe du mur et sur ses deux faces (9 points par ouverture). Repère **turquoise** ; priorité : ouverture, sommet, axe, alignement, grille. On peut ainsi coter la largeur d'une ouverture, ou un trumeau (angle du mur → bord de l'ouverture). Les points d'ouverture servent aussi de repères aux guides d'alignement. Alt désactive les guides comme avant. Ouvertures masquées, ou dont le mur est masqué ou absent : ignorées.
- Limite : seuls les outils Cote (et ses poignées) utilisent ces points ; murs, pièces et axes inchangés.
- Fichiers : `src/features/geometry/snapping(.test).ts` (`collectOpeningSnapPoints`, `openingPoints`), `src/components/editor/{usePolylineDrawing,VertexHandles,PolylineDraftLayer}`
- Vérification : build ✓ lint ✓ tests ✓ (1936 au total, dont 4 nouveaux) — aimantation à contrôler à l'écran
- Commit : feat: cotes aimantées aux ouvertures

### 2026-11-11 — Hors jalon · C · Navigation sur le plan de travail
- Fait : demande de l'utilisateur (aucun moyen de naviguer à part Espace + glisser). **Clic molette maintenu** : déplace la vue, quel que soit l'outil, même au-dessus d'un élément (un clic molette ou droit ne sélectionne plus ni ne déplace d'élément : `Konva.dragButtons = [0]`). **Molette** : un cran de souris zoome vers le curseur (comme avant) ; **glissement à deux doigts** sur un pavé tactile (petits défilements en pixels, ou horizontal) déplace la vue ; **pincement** et **Ctrl + molette** zooment en continu ; **Maj + molette** déplace horizontalement. **Barres de défilement** (horizontale en bas, verticale à droite) : la plage couvre la page avec une demi-fenêtre de marge de chaque côté ; on glisse le curseur ou on clique sur la piste. **Mini-carte** en bas à droite : la page, les éléments du niveau actif (jusqu'à 2 000) et un cadre pour la zone visible ; un clic ou un glissement déplace la vue ; bouton « carte » dans la barre de zoom pour l'afficher ou la masquer (choix mémorisé dans le navigateur, affichée par défaut). Espace + glisser est conservé.
- Limite connue : la distinction souris / pavé tactile est une estimation (un défilement vertical de moins de 40 px sans Maj est pris pour un pavé tactile) ; une souris à molette très fine pourrait déplacer la vue au lieu de zoomer. Ctrl + molette zoome toujours.
- Fichiers : `src/features/geometry/navigation(.test).ts`, `src/components/editor/{ScrollBars,MiniMap,usePanDrag,EditorStage,ZoomControls,useElementInteractions}`, `src/stores/minimapStore.ts`, `src/pages/EditorPage.tsx`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (1932 au total, dont 18 nouveaux) — clic molette, barres et mini-carte à contrôler dans le navigateur
- Commit : feat: navigation (clic molette, pavé tactile, barres de défilement, mini-carte)

### 2026-11-11 — Hors jalon · B · Guides d'alignement dans les plans
- Fait : demande de l'utilisateur. **Pendant le tracé** d'un mur, d'une pièce, d'une cote ou d'un axe, et **quand on glisse un sommet**, le curseur s'aligne en x et en y (à 8 px près) sur les sommets des autres éléments, et un **guide en pointillé rose** traverse la page (le même affichage que les guides de M2). Les deux coordonnées s'alignent indépendamment (un croisement de deux guides est possible) ; la coordonnée alignée n'est plus arrondie à la grille, l'autre l'est. Sur une direction horizontale ou verticale (alignement doux, Maj), seule la coordonnée libre s'aligne ; sur une diagonale à 45°, aucun guide. Priorité : sommet, axe de construction, axe de mur, alignement doux, **guides**, grille. **Repères** : mur et axe s'alignent sur les points d'axe des murs, pièces et cotes ; pièce et cote aussi sur les angles des faces de murs (pour tracer une pièce à l'aplomb d'un coin intérieur) ; en plus, les points déjà posés du tracé en cours et les autres sommets du même élément quand on glisse un sommet. **Alt** désactive les guides avec l'alignement. Les guides s'effacent en quittant l'outil et à la fin d'un glissement.
- Rappel : le déplacement d'un élément entier avait déjà ses guides (M2, bords et centres des boîtes) ; je ne l'ai pas modifié.
- Fichiers : `src/features/geometry/snapping(.test).ts` (`alignTargets`, `collectAlignTargets`, guides), `src/components/editor/{usePolylineDrawing,VertexHandles,PolylineDraftLayer}`
- Vérification : build ✓ lint ✓ tests ✓ (1914 au total, dont 10 nouveaux) — guides à contrôler à l'écran
- Commit : feat: guides d'alignement pendant le tracé et le glissement de sommets

### 2026-11-11 — Hors jalon · E · Pièce automatique (Maj + survol)
- Fait : demande de l'utilisateur. Avec l'outil Pièce, **Maj maintenu** (aucun point posé) et le curseur dans une zone fermée par des murs : la zone s'affiche en vert avec sa surface ; **un clic crée la pièce** sur les **faces intérieures** des murs (4 murs d'axes 4 000 × 3 000 mm et de 200 mm : 10,64 m²). Si la zone n'est pas fermée (mur manquant, trouée, extérieur) ou si le curseur est dans l'épaisseur d'un mur, un message « Zone non fermée par les murs » suit le curseur et un clic ne crée rien. L'aperçu suit aussi l'appui et le relâchement de Maj sans bouger la souris ; Maj en cours de tracé garde son rôle (angles de 45°). **Calcul** (`createRegionFinder`) : les faces de tous les murs du niveau actif sont découpées à chaque croisement pour former un graphe plan, les bouts qui ne ferment rien sont élagués, chaque zone fermée est un cycle ; on prend le plus petit cycle qui contient le point. Gère murs séparés ou tracés d'un seul trait, angles obliques, murs d'épaisseurs différentes, murs de refend, îlots fermés dans une grande pièce, murs superposés. Le graphe est préparé une fois par état du plan (900 murs : moins d'une seconde), puis chaque survol est instantané. Les portes et fenêtres ne coupent pas la zone (le mur reste continu).
- Limite : une zone qui contient un îlot fermé (un caisson, une pièce dans une grande pièce) est renvoyée avec le contour extérieur seulement, l'îlot n'est pas retiré de la surface.
- Fichiers : `src/features/geometry/regions(.test).ts`, `src/components/editor/{usePolylineDrawing,PolylineDraftLayer}`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (1904 au total, dont 14 nouveaux) — aperçu et clic à contrôler dans le navigateur
- Commit : feat: pièce automatique sur une zone fermée par des murs (Maj + survol)

### 2026-11-11 — Hors jalon · D · Liaison des murs
- Fait : demande de l'utilisateur (murs qui se superposent au lieu de se lier). **Aimantation sur l'axe d'un mur existant** (outil Mur et glissement d'un sommet de mur) : un point posé sur un mur, dans son épaisseur, ou près de lui est ramené sur son axe, ce qui donne des jonctions en T et des murs qui partagent le même axe ; repère orange ; priorité : sommet, axe de construction, **axe de mur**, alignement, grille ; Maj (45°) et Alt (désactive) inchangés. Pas pour la pièce ni la cote, qui suivent les faces. **Raccords d'angle** : des murs séparés qui se terminent au même point avaient un coin extérieur creux (bouts droits) ; un polygone de la couleur du mur comble désormais ce creux (angles droits, obliques, murs d'épaisseurs différentes ; angle très aigu coupé en biseau). Rien aux jonctions en T / X, aux prolongements, aux extrémités libres ni aux contours fermés (déjà en onglet). Affichage seulement : le document n'est pas modifié (pas de migration), la 3D garde son propre raccord.
- Fichiers : `src/features/geometry/{snapping,wallJoins}(.test).ts`, `src/components/editor/shapes/{WallShape.tsx,WallJoinsContext.ts}`, `src/components/editor/{EditorStage,usePolylineDrawing,VertexHandles,PolylineDraftLayer}`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (1890 au total, dont 16 nouveaux) — aimantation et raccords à contrôler à l'écran
- Commit : feat: liaison des murs (aimantation sur l'axe, raccords d'angle)

### 2026-11-11 — Hors jalon · A · Alignement doux du tracé (murs, pièces, cotes, axes)
- Fait : demande de l'utilisateur (tracés pas droits : chaque point s'aimantait seul sur la grille, donc un mur pouvait finir décalé d'un cran). **Sans Maj**, un point à moins de 12 px de l'horizontale ou de la verticale du point précédent, et à moins de 5° de cette direction, est ramené exactement dessus ; la grille ne s'applique alors que **le long** de la ligne. Priorité : sommet, axe, alignement, grille ; Maj (45°) reste prioritaire ; **Alt** désactive l'alignement. Actif aussi quand on glisse un sommet d'un mur, d'une pièce ou d'une cote (voisin = point précédent). Rappels en bas de l'écran mis à jour.
- Reste de la demande (3 tâches) : B guides d'alignement dans les plans (lignes pointillées pendant le tracé), C navigation (clic molette, deux doigts, barres de défilement, mini-carte).
- Fichiers : `src/features/geometry/snapping(.test).ts` (`softAlign`), `src/components/editor/{usePolylineDrawing.ts,VertexHandles.tsx}`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (1874 au total, dont 9 nouveaux) — tracé à la souris à contrôler dans le navigateur
- Commit : feat: alignement doux horizontal et vertical du tracé

### 2026-11-11 — M8 · Correctifs après essai dans le navigateur
- Fait : essai réel dans Edge (même moteur que Chrome) avec un plan de test. **Cadrage de la 3D** : la caméra tient compte de la largeur du panneau (étroit et haut), le bâtiment n'est plus coupé à l'ouverture. **Traits en pointillé** retirés : les arêtes dessinées sur chaque morceau de mur se superposaient aux jonctions et aux coins ; l'allège et le linteau pénètrent de 1 mm dans les trumeaux voisins (invisible) pour supprimer les coutures. **Changer le type d'une ouverture** (Propriétés > Type) : une ouverture qui a encore la taille par défaut de son type prend celle du nouveau (fenêtre 1200 × 1000 devenue porte → 900 × 2100, au sol ; porte → fenêtre 1200 × 1000, allège 900 ; baie 2400 × 2150) ; une taille modifiée à la main est gardée, et l'ancienne taille aussi si la nouvelle ne tient pas (mur trop bas, pas de place à côté d'une voisine). Vérifié en réel : la fenêtre à 900 mm d'allège est un trou à la bonne hauteur, la porte descend au sol, un clic sur un mur en 3D le sélectionne sur le plan.
- Fichiers : `src/components/viewer3d/Viewer3DScene.tsx`, `src/features/building/wallPieces.ts`, `src/features/geometry/openingEdit(.test).ts`, `src/components/editor/OpeningFields.tsx`
- Vérification : build ✓ lint ✓ tests ✓ (1865 au total) — contrôle visuel du changement de type à refaire dans le navigateur
- Commit : fix: cadrage 3D, coutures des murs, taille par défaut au changement de type d'ouverture

### 2026-11-11 — M8 · Panneau 3D, caméra, cube d'orientation, étage ouvert, sélection, capture
- Fait : bouton « cube » dans l'en-tête de l'éditeur (projets Plan seulement) qui ouvre / ferme le **panneau 3D** à droite du plan ; il se **redimensionne** en glissant son bord gauche (mini 280 px, il laisse toujours 640 px au plan et aux panneaux). **Scène** (`@react-three/fiber`) : murs découpés par leurs ouvertures (boîtes aux arêtes marquées), dalles sous les pièces, toit plat, sol quadrillé ; Three.js est **chargé à la première ouverture** seulement (fichier à part, l'éditeur démarre aussi vite). **Caméra orbitale** (clic gauche : tourner, molette : zoom, clic droit : déplacer), cadrage automatique sur le bâtiment à l'ouverture, bouton « Recentrer ». **Cube d'orientation** en haut à droite : faces N, E, S, O, Haut, Bas, tournées selon le **nord réglé** ; un clic sur une face recadre la vue de ce côté. **Étage ouvert** : case à cocher, affiche seulement jusqu'au niveau actif, sans toit. **Sélection** : un clic sur un mur en 3D le sélectionne sur le plan (et passe au niveau du mur) ; les murs sélectionnés sur le plan sont surlignés en 3D ; un glissement de caméra n'est pas pris pour un clic. **Capture PNG** (bouton appareil photo) : `<nom du projet> 3D.png`, sans le cube. **Fluidité** : le modèle est recalculé au plus une fois par image, la scène ne se redessine que quand quelque chose change (`frameloop="demand"`), une seule géométrie de boîte partagée par tous les murs, géométries de dalles gardées tant que le contour ne change pas. Si WebGL n'est pas disponible, un message remplace la vue sans bloquer l'éditeur.
- Fichiers : `src/components/viewer3d/{Viewer3DPanel,Viewer3DScene,OrientationCube,Viewer3DErrorBoundary,useBuildingModel}`, `src/stores/viewer3dStore.ts`, `src/features/building/{panelWidth(.test),model.test}.ts`, `src/components/editor/EditorHeader.tsx`, `src/pages/EditorPage.tsx`, `src/i18n/fr.ts`, `docs/03-ROADMAP.md`
- Vérification : build ✓ lint ✓ tests ✓ (1858 au total, dont un test « 3 niveaux, 600 murs et ouvertures calculés en moins de 200 ms ») — géométrie des dalles et orientation des murs contrôlées par calcul ; **rendu, caméra, cube, clic sur un mur, capture et fluidité à contrôler dans le navigateur** (aucun test automatisé du rendu 3D)
- Commit : feat: vue 3D (panneau, caméra, cube, sélection, capture)

### 2026-11-10 — M8 · Réglage du nord et migration v4
- Fait : champ **« Nord (sens horaire depuis le haut) »** en degrés dans « Réglages du plan » (visible quand rien n'est sélectionné, projets Plan uniquement ; modifiable avec ↑ ↓, pas de 15°, Maj = ×10 ; annulable). `plan.northAngle` : 0 = le nord est en haut du plan (comme à l'écran depuis toujours) ; la valeur saisie est ramenée à 0–359 (`-90` → 270, `370` → 10). **Document en version 4** : migration v3 → v4 qui donne `northAngle = 0` à un plan (une valeur déjà présente est gardée) ; un Visuel change seulement de version ; les projets enregistrés avant s'ouvrent sans perte. Helper `cardinalDirection` (direction du plan vers N / E / S / O selon le nord) prêt pour le cube d'orientation.
- Fichiers : `src/types/document.ts`, `src/features/documents/{migrations,createProject}(.test).ts`, `src/features/building/north(.test).ts`, `src/features/persistence/LocalRepository.test.ts`, `src/components/editor/PlanSettingsSection.tsx`, `src/i18n/fr.ts`, `docs/02-ARCHITECTURE.md`
- Vérification : build ✓ lint ✓ tests ✓ (1848 au total, dont 14 nouveaux : migration v3 → v4, nord conservé, angles, directions cardinales) — champ à contrôler dans le navigateur
- Commit : feat: réglage du nord et migration du document en version 4

### 2026-11-10 — M8 · Dépendances 3D et modèle 3D (fonctions pures)
- Fait : installation de `three` 0.187, `@react-three/fiber` 9.8 (compatible React 19.3) et `@react-three/drei` 10.7, plus `@types/three` (dev), avec l'accord de l'utilisateur. **Modèle 3D neutre, sans Three.js** : `buildBuildingModel(doc, { upToLevelId? })` renvoie les morceaux de mur, les dalles / toits et l'emprise. Repère : x = x du plan, y = hauteur, z = y du plan, en mm. **Murs** : une boîte par segment ; une ouverture coupe le segment en trumeaux (pleine hauteur), allège (sous la fenêtre) et linteau (au-dessus), sans calcul booléen ; les angles intérieurs et les tracés fermés sont prolongés d'une demi-épaisseur pour boucher les coins ; une ouverture plus haute que le mur est coupée à sa hauteur. **Dalles** : sous chaque pièce, dessus à l'altitude du niveau, épaisseur du niveau vers le bas. **Toit plat** : sur les pièces du dernier niveau, seulement quand tous les niveaux sont affichés (pas de toit en vue « étage ouvert »). Éléments masqués ignorés ; un élément sans niveau est rattaché au premier niveau ; un Visuel donne un modèle vide. Chaque mur se construit séparément (`buildWallPieces`) : le panneau 3D pourra ne recalculer que les murs modifiés.
- Choix : les angles non droits sont bouchés par simple prolongement (léger dépassement possible à l'extérieur), pas par un onglet exact.
- Fichiers : `src/features/building/{types,wallPieces,model,model.test}.ts`, `package.json`, `docs/{03-ROADMAP,PROGRESS}.md`
- Vérification : build ✓ lint ✓ tests ✓ (1834 au total, dont 24 nouveaux : fenêtre de 1 200 × 1 000 mm à 900 mm d'allège = trou à la bonne hauteur, porte, angles, niveaux, étage ouvert, toit, emprise). Rien de visible à l'écran pour l'instant.
- Commit : feat: modèle 3D du bâtiment (fonctions pures)

### 2026-11-10 — M7 · Lot D · Séjour, salle à manger, chambre, rangements
- Fait : **fiches du catalogue complet générées** depuis `docs/06-BIBLIOTHEQUE.md` (392 objets : id, catégorie, taille, tailles rapides, mode de redimensionnement, miroir, pointillé, nominal, zone ; noms français et mots-clés dans `src/i18n/libraryTexts.ts`) ; limites min / max déduites (de la moitié au double, élargies aux tailles rapides ; `fixed` = une taille ; `length` = profondeur gardée) ; les éléments « au-dessus du plan de coupe » sont dessinés en pointillé, les zones en pointillé long. **Catégories ouvertes** dans le panneau : séjour et salon (29), salle à manger (18), chambre (23), rangements et entrée (16) = 86 objets. **Gabarits** : caissons (plein, plateau, tiroirs, portes, compartiments, ouvert, croix), bandeau mural, tables (rectangulaire, ronde, ovale), ronds, sièges (chaise, avec accoudoirs, fauteuil, à oreilles, fauteuil de bureau, banc), canapés droit et en L (angle ou méridienne, asymétriques : « Retourner » actif), lits (simple/double, superposé, bébé), piano droit et à queue, tapis, poêle, cheminée, plante, paravent.
- Fichiers : `src/features/library/{primitives,catalog/{specs,define,draws,index},templates/*}.ts`, `src/i18n/{libraryTexts,fr}.ts`
- Vérification : build ✓ lint ✓ tests ✓ (862 au total : contrôles sur chaque objet — dessin dans sa boîte à toutes les tailles, avec et sans retournement)
- Commit : feat: catalogue séjour, salle à manger, chambre, rangements

### 2026-11-10 — M7 · Lot E · Cuisine, salle de bain, buanderie
- Fait : trois catégories ouvertes : **cuisine** (44 objets), **salle de bain et sanitaires** (34), **buanderie et technique domestique** (14). Gabarits : meubles de cuisine (bas, tiroirs, haut en pointillé, angle en L asymétrique, colonne), éviers (1 ou 2 bacs, égouttoir à gauche), plaques (gaz 4/5 feux, induction), cuisinière, appareils (réfrigérateurs, congélateur coffre, lave-vaisselle, cave à vin, micro-ondes, four, hotte en pointillé, lave-linge, sèche-linge, colonne, chaudière, adoucisseur, VMC), îlot, bar, péninsule, desserte ; **cuisines complètes d'un seul bloc** (kitchenette, linéaire, parallèle, en L, en L avec îlot, en U, américaine, américaine en L, américaine avec îlot-bar) : rangées de meubles le long des murs avec évier, plaque, réfrigérateur et lave-vaisselle placés proportionnellement (les cuisines en L et américaines se retournent) ; sanitaires (WC au sol / suspendu / enfant, urinoir, bidet, lavabos, meuble vasque, douches carrée / quart de rond / italienne / PMR, baignoires rectangulaire / d'angle / îlot / sabot, bain à remous, sauna, hammam, sèche-serviettes, WC PMR avec barres, barre d'appui, siège de douche, cabine de sanitaires avec débattement de porte). Correction : en mode « longueur », une taille rapide ne change plus la profondeur.
- Fichiers : `src/features/library/templates/{appliance,kitchen,bathroom}.ts`, `catalog/{draws,index,define}.ts`
- Vérification : build ✓ lint ✓ tests ✓ (1138 au total : mêmes contrôles sur chacun des 178 objets ouverts)
- Commit : feat: catalogue cuisine, salle de bain, buanderie

### 2026-11-10 — M7 · Lot F · Escaliers, circulation verticale, bureau
- Fait : deux catégories ouvertes : **escaliers et circulation verticale** (16) et **bureau et travail** (22). **Escaliers** : le nombre de marches est calculé depuis la longueur (`stairSteps` : giron ≈ 250 mm, au moins 3) ; escalier droit, quart tournant, demi-tournant, en L, en U (palier), hélicoïdal (noyau, marches en rayons, flèche en arc), échelle de meunier, rampes (rives, chevrons, flèche), ascenseurs et plateforme élévatrice (cabine, croix, seuil), escalier mécanique, gaine et trémie en zone de référence ; flèche de montée et virage dessinés ; les escaliers tournants se retournent. **Bureau** : postes avec écran et clavier (simple, direction, double, d'angle en L retournable), sièges, tables de réunion, banque d'accueil, caissons, armoire, étagère, casiers, tableau blanc (pointillé), imprimante / photocopieur, baie informatique, cabine isolée, coin détente, plante.
- Fichiers : `src/features/library/templates/{stairs,office}.ts`, `catalog/{draws,index}.ts`, `library.test.ts`
- Vérification : build ✓ lint ✓ tests ✓ (1252 au total, dont le nombre de marches d'un escalier de 2 800 mm = 11)
- Commit : feat: catalogue escaliers et bureau

### 2026-11-10 — M7 · Lot G · Électricité, chauffage-ventilation-plomberie, sécurité et accessibilité
- Fait : trois catégories ouvertes : **électricité et éclairage** (24), **chauffage, ventilation, plomberie** (18), **sécurité et accessibilité** (14). **Symboles conventionnels** (non à l'échelle, taille de repérage fixe) : prises (simple, double, de sol, réseau, TV, USB), interrupteurs (simple, va-et-vient, variateur, poussoir), points lumineux, détecteur de fumée, thermostat, sonnette, interphone, borne de recharge, caméra ; sécurité : extincteur, dévidoir, déclencheur d'alarme, sortie de secours, éclairage de sécurité, défibrillateur, pharmacie, point de rassemblement, repère coupe-feu, pictogramme d'accessibilité, flèche d'évacuation. **Luminaires** à leur vraie taille (plafonnier, suspension, lustre, spot, applique, rail de spots). **Chauffage** : radiateurs (panneaux, colonne, convecteur, de sol), collecteur, climatisation (unité murale en pointillé, cassette, extérieure), pompe à chaleur, bouche de ventilation, conduit de cheminée, siphon, point d'eau, compteur, descente pluviale, panneau solaire, regard. **Zones de référence** en pointillé : cercle de manœuvre PMR (Ø 1 500), espace d'usage PMR, débattement de porte.
- Fichiers : `src/features/library/templates/tech.ts`, `catalog/{draws,index}.ts`
- Vérification : build ✓ lint ✓ tests ✓ (1423 au total)
- Commit : feat: catalogue électricité, chauffage, sécurité

### 2026-11-10 — M7 · Lot H · Extérieur et jardin, véhicules et stationnement
- Fait : deux catégories ouvertes : **extérieur et jardin** (41) et **véhicules et stationnement** (16). Extérieur : arbres feuillus, arbustes, conifère (étoile), palmier, haie, massif de fleurs, potager, pelouse / gravier / dallage (zones), bassin, piscines (rectangulaire, ronde, en L retournable), spa, mobilier de jardin, bain de soleil, parasol (pointillé), barbecue, cuisine d'été, pergola, tonnelle, abri de voiture (pointillé), abri de jardin, serre, composteur, bac à sable, citerne et fosse enterrées (zones), local poubelles, trampoline, balançoire, clôture. Véhicules (silhouettes génériques, sans marque, face avant vers le bas) : voitures, camionnette, camion, autocar, moto, scooter, vélo, vélo cargo, arceaux ; places de stationnement (standard, PMR avec pictogramme, en créneau) et quai de chargement en zones.
- Fichiers : `src/features/library/templates/{outdoor,vehicles}.ts`, `primitives.ts` (`translatePrimitives`), `catalog/{draws,index}.ts`
- Vérification : build ✓ lint ✓ tests ✓ (1594 au total)
- Commit : feat: catalogue extérieur et véhicules

### 2026-11-10 — M7 · Lot I · Commerce et bars, santé et enseignement, loisirs et sport
- Fait : trois catégories ouvertes : **commerce et restauration** (31, bars compris), **santé et enseignement** (16), **loisirs et sport** (16) ; les 392 objets du catalogue sont désormais tous proposés. **Bars** : comptoirs droit, en L, en U, courbe (arc d'ellipse) et rond (service au centre), avec bord de service en pointillé ; arrière-bar, poste de service, meuble bar, chariot, bar d'intérieur avec arrière-bar, bar de jardin, bar de piscine (îlot et tabourets), table haute avec tabourets. Commerce : caisse, gondole, vitrine, portant, cabine d'essayage avec débattement, tables et banquettes de restaurant, buffet, plan de travail et piano de cuisson professionnels, chambre froide, estrade, régie, banc d'église, fauteuil de coiffeur. Santé : lit médicalisé, tables d'examen et de massage, brancard, fauteuil roulant, fauteuil de soins, pèse-personne ; enseignement : pupitres, bureau d'enseignant, tableau, paillasse et hotte de laboratoire, rayonnage. Loisirs : tennis de table, billard, baby-foot, appareils de sport, tapis de yoga, fauteuils de cinéma, aquarium, panier d'animal, machine d'atelier, terrains (basket, tennis, football à 5, pétanque) en zones. Correction : le billard passe en proportions verrouillées (sa taille « fixe » contredisait sa taille rapide 1100 × 2200).
- Fichiers : `src/features/library/templates/venue.ts`, `catalog/{draws,index,specs}.ts`, `docs/06-BIBLIOTHEQUE.md`
- Vérification : build ✓ lint ✓ tests ✓ (1783 au total)
- Commit : feat: catalogue commerce, bars, santé, loisirs

### 2026-11-10 — M7 · Lot J · Ensembles, récents et favoris, liste du mobilier (CSV), tests globaux
- Fait : **24 ensembles** prêts à poser (table + 4 / 6 / 8 chaises, table ronde + 6, salons, chambres, poste de travail, salle de réunion, cuisines linéaire / en L / avec îlot / américaines / en U, salles de bain et d'eau, sanitaire PMR, salon de jardin, 3 places de parking, coins bars) : chaque ensemble est une liste d'objets placés et tournés (les chaises tournent le dos à la table), avec son aperçu, sa vignette dans la catégorie « Ensembles » et son **aperçu fantôme** ; poser un ensemble crée tous ses objets **en un seul pas d'historique** (annuler les retire tous), sur le niveau actif, ils deviennent la sélection et restent indépendants. **Récents** (12 derniers objets ou ensembles posés) et **Favoris** (étoile sur chaque vignette) : mémorisés dans le navigateur (localStorage, tolérant aux erreurs), jamais dans le projet. **CSV** : tableau « Mobilier et équipements » (catégorie, nom, largeur, profondeur en mm, nombre, regroupé par objet et par taille), puis deux tableaux à part pour les symboles conventionnels et les zones de référence ; le mobilier n'entre dans aucun métré (surfaces, longueurs). Les emprises annoncées dans `docs/06-BIBLIOTHEQUE.md` sont remplacées par celles calculées. Roadmap M7 : bibliothèque, panneau et liste du mobilier cochés.
- Fichiers : `src/features/library/{catalog/sets,placeSet,prefs,furnitureList,catalogGlobal.test}.ts`, `src/components/library/{LibraryPanel,SymbolPreview,useLibraryPrefs,furnitureRows}`, `src/components/editor/{EditorStage,FurnitureGhost,exportProject,MeasurementsPanel}`, `src/features/measurements/csv.ts`, `src/stores/editorStore.ts` (`addElements`), `src/i18n/{fr,libraryTexts}.ts`, `docs/{03-ROADMAP,06-BIBLIOTHEQUE}.md`
- Vérification : build ✓ lint ✓ tests ✓ (1806 au total : 392 objets comptés par catégorie, aucune marque, ensembles, récents / favoris, CSV)
- Commit : feat: ensembles, récents et favoris, liste du mobilier

### 2026-11-10 — M7 · Lot C · Panneau Bibliothèque
- Fait : panneau « Bibliothèque » complet : **recherche** sans accents ni casse (« lave vaisselle » trouve « Lave-vaisselle »), sur le nom, les mots-clés et la catégorie, tous les mots devant être trouvés, résultats classés (début du nom, nom, mot-clé, catégorie) ; **catégories** en pastilles avec le nombre d'objets (« Tous » + une par catégorie remplie) ; **vignettes** (aperçu SVG, nom, dimensions en mm). **Pose** : clic sur une vignette puis clic sur le plan (l'outil reste actif, Échap pour quitter) ou **glisser-déposer** de la vignette sur le plan ; **aperçu fantôme** translucide à taille réelle sous le curseur, aimanté à la grille. Bouton **« Retourner »** dans Propriétés pour les objets asymétriques (`mirrorable`), tailles courantes en puces (lot B). Aucun objet du catalogue de test n'est asymétrique : le bouton apparaîtra avec les premiers objets asymétriques (lot D).
- Fichiers : `src/features/library/{placement,search}(.test).ts`, `catalog/index.ts`, `src/components/library/{LibraryPanel,symbolText,dragType}`, `src/components/editor/{FurnitureGhost,FurnitureFields,EditorStage}`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (613 au total) — glisser-déposer et aperçu fantôme à contrôler dans le navigateur
- Commit : feat: panneau bibliothèque (recherche, catégories, glisser-déposer)

### 2026-11-10 — M7 · Lot B · Infrastructure de la bibliothèque
- Fait : le **socle** de la bibliothèque d'objets (`docs/06-BIBLIOTHEQUE.md`). **Données** : chaque objet est décrit par un `SymbolDef` (id, catégorie, taille par défaut, tailles rapides, limites min / max, mode de redimensionnement `free` / `ratio` / `length` / `fixed`, hauteur 3D) et une fonction pure `draw(largeur, profondeur)` qui renvoie des **primitives** (rectangle, cercle, ellipse, ligne, polygone, arc) en mm. **Rendu** : le même dessin s'affiche sur le canevas (`FurnitureShape`, Konva) et en aperçu (`SymbolPreview`, SVG) ; une table de styles unique (contour, détail, pointillé « au-dessus », zone, aplat) donne les traits (épaisseur en mm sur le plan, 1 px minimum à l'écran). **Élément `furniture`** (`symbol`, `width`, `depth`, `mirrored?`) : se pose, se déplace, se pivote et se redimensionne comme un rectangle ; le redimensionnement est ramené aux règles de l'objet (`resizeSymbol` : mode, limites, mm entiers) — les poignées du transformateur suivent le mode (taille fixe : aucune ; proportions : coins ; longueur : côtés). Retournement gauche / droite prêt (`mirrorPrimitives`, deux retournements = l'original), sans bouton pour l'instant. Un objet inconnu (projet plus récent) s'affiche en cadre pointillé rouge. **Pose** : panneau « Bibliothèque » (liste simple) → clic sur un objet → clic sur le plan, centré sur le curseur et aimanté à la grille ; l'outil reste actif, `Échap` quitte. Propriétés : nom, largeur, profondeur (selon le mode), tailles courantes, X, Y, rotation, opacité. **3 objets de test** : Lit 160 × 200 (`bed-queen`), Canapé 3 places (`sofa-3`), Table ronde 4 personnes (`table-round-4`), avec leurs gabarits `bed`, `sofa` et `table`. Pas de changement de version du document (nouveau type d'élément, aucun ancien projet touché).
- Hors lot (prévu au lot C) : catégories, recherche, glisser-déposer, aperçu fantôme sous le curseur, bouton « Retourner », récents / favoris.
- Fichiers : `src/types/document.ts` (`FurnitureElement`), `src/features/library/{types,primitives,style,resize,drawing}(.test).ts`, `src/features/library/templates/{bed,sofa,table}.ts`, `src/features/library/catalog/{index,bedroom,living,dining}.ts`, `src/features/documents/{elements,properties}.ts`, `src/features/geometry/transform.ts`, `src/features/export/bounds(.test).ts`, `src/stores/editorStore(.test).ts`, `src/components/library/{LibraryPanel,SymbolPreview}.tsx`, `src/components/editor/{shapes/FurnitureShape,FurnitureFields,ElementNode,EditorStage,SelectionTransformer,PropertiesPanel,LayersPanel,ToolHint}`, `src/pages/EditorPage.tsx`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (603 au total, dont 33 nouveaux : primitives, redimensionnement, contrôles sur chaque objet du catalogue — dessin dans sa boîte à toutes les tailles, avec et sans retournement —, noms français, emprise, store) — rendu et interactions à contrôler dans le navigateur
- Commit : feat: socle de la bibliothèque d'objets

### 2026-11-10 — M7 · Lot A · Axes de construction
- Fait : outil **Axe** (`A`, projets Plan uniquement) : deux clics, `Maj` = angle droit, `Échap` = annuler. L'axe se dessine en trait mixte entre deux **bulles** portant le repère. **Numérotation automatique** : un axe plutôt horizontal reçoit une lettre (A, B… Z, AA…), un axe plutôt vertical un nombre (1, 2…), à la suite de la plus grande étiquette de son sens (un axe parallèle à « A, B » reçoit « C ») ; le repère se modifie dans Propriétés (4 caractères au plus). Les axes sont **communs à tous les niveaux** (jamais de `levelId`, ni à la création, ni au collage) : visibles et sélectionnables sur chaque niveau, conservés quand on supprime un niveau, absents de la copie d'un niveau. **Aimantation** : un point posé près d'un axe est ramené sur sa ligne (repère rouge), et sur le croisement de deux axes (sommet) ; la ligne d'un axe passe avant la grille, et la direction contrainte par `Maj` passe avant l'axe. Les extrémités d'un axe se déplacent à la poignée (avec aimantation), l'axe entier se déplace ; l'emprise exportée comprend les bulles. Un axe n'entre dans aucun métré.
- Choix : axes horizontaux = lettres, axes verticaux = nombres (convention courante des plans) ; la numérotation continue après la plus grande étiquette, elle ne réutilise pas un trou (A, C → D).
- Fichiers : `src/types/document.ts` (`AxisElement`), `src/features/geometry/{axes,snapping,transform}(.test).ts`, `src/features/documents/{elements,levels}.ts`, `src/features/export/bounds(.test).ts`, `src/stores/editorStore(.test).ts`, `src/components/editor/{shapes/AxisShape,ElementNode,Toolbar,ToolHint,shortcuts,useEditorShortcuts,EditorStage,usePolylineDrawing,PolylineDraftLayer,VertexHandles,PlanElementFields,PropertiesPanel,LayersPanel}`, `src/i18n/fr.ts`, `docs/02-ARCHITECTURE.md`
- Vérification : build ✓ lint ✓ tests ✓ (570 au total, dont 35 nouveaux sur les axes) — rendu et interactions à contrôler dans le navigateur
- Commit : feat: axes de construction

### 2026-11-10 — M6 · Niveaux
- Fait : un plan contient plusieurs **niveaux** (rez-de-chaussée par défaut). Panneau « Niveaux » : ajouter, renommer (double-clic), monter / descendre, dupliquer (les murs et leurs ouvertures sont copiés, pas les pièces), supprimer avec confirmation (annulable), altitude et hauteur d'étage du niveau actif. **Sélecteur de niveau** en haut du canevas, avec un interrupteur pour le niveau du dessous en **transparence** (référence : non sélectionnable, sans aimantation, absent des exports). On ne dessine, ne sélectionne, ne liste (calques) et n'aimante que sur le niveau actif ; un nouveau mur prend la hauteur d'étage. **Métrés** : tableaux du niveau actif, tableau « Bâtiment » (une ligne par niveau + total = somme des niveaux) ; **CSV** avec colonne « Niveau » et tableau des totaux par niveau et du bâtiment. Les exports PNG / JPG / PDF portent sur le niveau affiché. **Migration v2 → v3** : un plan reçoit un « Rez-de-chaussée » qui porte tous ses éléments (hauteur = ancienne hauteur de mur par défaut).
- Fichiers : `src/types/document.ts`, `src/features/documents/{levels,migrations,createProject}(.test).ts`, `src/features/measurements/{measurements,csv}.ts`, `src/stores/editorStore(.test).ts`, `src/components/editor/{LevelSelector,LevelsPanel,EditorStage,MeasurementsPanel,LayersPanel,ExportDialog,exportProject,exportStage,thumbnail,usePolylineDrawing,useOpeningTool,useCalibrationTool,useElementInteractions,importImages,PlanSettingsSection}`, `src/pages/EditorPage.tsx`, `src/i18n/fr.ts`, `docs/02-ARCHITECTURE.md`
- Vérification : build ✓ lint ✓ tests ✓ (535 au total, dont 32 nouveaux sur les niveaux, la migration et le CSV) — rendu et interactions (sélecteur, transparence, clic sur un mur de référence) à contrôler dans le navigateur
- Commit : feat: niveaux (étages) du plan

### 2026-11-10 — Unités « Métrique architectural » (consigne transversale)
- Fait : tout le plan s'affiche et se saisit comme dans Revit (métrique) : **longueurs en mm entiers** (`3500 mm`, `200 mm`), surfaces en m² (`12,40 m²`). Appliqué à : cotes, aperçu des murs et des ouvertures, panneau Métrés (épaisseur comprise), propriétés d'un mur / cote, réglages du plan (épaisseur, hauteur, grille en mm : 50 / 100 / 200 / 500 / 1000), barre d'échelle du PDF (`1000 mm`), export CSV (longueurs en mm, surfaces en m²), fenêtre de calibrage. Un nombre saisi sans unité vaut des mm ; `m` et `cm` restent acceptés si écrits. Les helpers `mmToM`, `mmToCm` et `formatCentimeters` sont supprimés. Règle ajoutée dans `CLAUDE.md` et `docs/02-ARCHITECTURE.md` pour toutes les prochaines tâches. Les projets déjà enregistrés ne changent pas (le stockage était déjà en mm).
- Reste à noter : les commentaires de code et la roadmap citent encore des valeurs en m / cm (ex. « 0,90 × 2,10 m ») ; les futures tâches M5 (Porte/Fenêtre) afficheront des mm.
- Fichiers : `src/features/units/format(.test).ts`, `src/features/measurements/{csv,measurements.test}.ts`, `src/components/editor/{MeasurementsPanel,PlanElementFields,PlanSettingsSection,CalibrateDialog}.tsx`, `src/i18n/fr.ts`, `src/features/export/pdf.test.ts`, `CLAUDE.md`, `docs/01-PRODUIT.md`, `docs/02-ARCHITECTURE.md`
- Vérification : build ✓ lint ✓ tests ✓ (422) — à contrôler dans le navigateur
- Commit : feat: unités Métrique architectural (mm, m²)

### 2026-11-10 — M5 · Export et calques
- Fait : **zone exportée** : l'emprise d'un plan inclut le dessin complet des ouvertures, battant et arc d'une porte compris (ils dépassent de l'épaisseur du mur) ; une ouverture masquée, ou dont le mur est masqué ou absent, ne compte pas. **Calques** : les ouvertures sont listées avec leur icône, et se renomment, se masquent et se verrouillent comme les autres éléments. **Ordre d'affichage** : une ouverture est toujours dessinée juste au-dessus de son mur, même si on l'a descendue sous lui dans les calques (sinon la découpe du mur serait cachée) ; la liste des calques, elle, garde l'ordre choisi. **Masquer un mur masque ses ouvertures.**
- Fichiers : `src/features/export/bounds(.test).ts` (`openingBounds`), `src/features/documents/layers(.test).ts` (`drawOrder`), `src/components/editor/{EditorStage,shapes/OpeningShape}.tsx`
- Vérification : build ✓ lint ✓ tests ✓ (503 au total, dont 12 sur la zone exportée et l'ordre de dessin) — export PNG / PDF d'un plan avec porte à contrôler dans le navigateur
- Commit : feat: ouvertures dans l'export et l'ordre d'affichage

### 2026-11-10 — M5 · Métrés et CSV des ouvertures
- Fait : les métrés calculent la **surface murale nette** (brute moins les ouvertures du mur, jamais négative) : un mur de 4,00 × 2,50 m avec une porte de 0,90 × 2,10 m donne 10,00 m² brut, 1,89 m² d'ouvertures, 8,11 m² net. Une ouverture plus haute que ce qui reste au-dessus de son allège est comptée à la hauteur du mur ; une ouverture sans mur est ignorée. Le panneau Métrés affiche pour les murs : longueur, surface brute et nette (l'épaisseur n'y est plus, elle reste dans Propriétés et dans le CSV), puis un tableau des ouvertures (nom, dimensions, surface ; cliquer une ligne sélectionne l'ouverture) avec le total et le nombre de portes, fenêtres et baies. Propriétés d'un mur : surface brute, ouvertures et surface nette. CSV : colonnes brute / ouvertures / nette pour les murs, et un tableau des ouvertures (type, mur, largeur, hauteur, allège, surface) suivi du nombre de portes, fenêtres et baies, présent seulement s'il y a des ouvertures.
- Fichiers : `src/features/measurements/{measurements,csv}(.test).ts`, `src/components/editor/{MeasurementsPanel,PlanElementFields}.tsx`, `src/i18n/fr.ts`, `docs/02-ARCHITECTURE.md`
- Vérification : build ✓ lint ✓ tests ✓ (491 au total, dont 13 sur les ouvertures dans les métrés et le CSV) — ouverture du CSV dans Excel / LibreOffice à contrôler
- Commit : feat: métrés et CSV des ouvertures

### 2026-11-10 — M5 · Liens entre murs et ouvertures
- Fait : **supprimer un mur supprime ses ouvertures** (un seul état d'historique). **Dupliquer, copier ou coller un mur emmène ses ouvertures**, rattachées à la copie du mur ; une ouverture seule ne se duplique ni ne se colle (rien n'est ajouté à l'historique). **Déplacer un mur** : ses ouvertures le suivent, aussi en direct pendant le glissement. **Modifier la forme d'un mur** (glisser, ajouter ou retirer un sommet) : les ouvertures restent là où elles étaient (projetées sur le segment le plus proche, au bon segment si on ajoute un sommet), se décalent pour ne pas se chevaucher, et sont supprimées si elles ne tiennent plus ; pendant un glissement de sommet, le calcul repart du début du geste, donc une ouverture écartée un instant revient quand le mur se rallonge. Annuler restaure le mur et ses ouvertures d'un coup.
- Fichiers : `src/features/documents/wallOpenings(.test).ts`, `elements.ts` (`cloneElements`), `src/stores/editorStore(.test).ts`, `src/components/editor/useElementInteractions.ts`
- Vérification : build ✓ lint ✓ tests ✓ (478 au total, dont 29 sur ces liens) — à contrôler dans le navigateur
- Commit : feat: ouvertures liées à leur mur

### 2026-11-10 — M5 · Propriétés des ouvertures
- Fait : panneau Propriétés d'une ouverture : nom, type (porte / fenêtre / baie), largeur, hauteur, allège (fenêtre et baie), boutons « Charnière de l'autre côté » et « Ouvrir de l'autre côté » (portes), opacité, surface. Les changements de taille sont vérifiés : refusés avec un message si l'ouverture dépasserait la hauteur du mur ou ne tiendrait plus sur son segment (le centre se décale au besoin pour ne pas chevaucher une voisine) ; le champ reprend alors sa valeur. Passer en porte ou baie remet l'allège à 0 ; passer en fenêtre donne l'allège par défaut (0,90 m), réduite si elle dépasserait le mur. Taille minimale 100 mm.
- Fichiers : `src/features/geometry/openingEdit(.test).ts`, `src/components/editor/{OpeningFields,PropertiesPanel}.tsx`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (449 au total, dont 15 sur les modifications) — à contrôler dans le navigateur
- Commit : feat: propriétés des ouvertures

### 2026-11-10 — M5 · Glisser une ouverture
- Fait : avec l'outil Sélection, on saisit une ouverture et on la fait coulisser le long de son mur ; elle suit le curseur en gardant l'écart de la saisie, arrondie à 1 cm, s'arrête aux extrémités du segment et contre les ouvertures voisines. Un glissement = un seul état d'historique (annuler la remet où elle était). Une ouverture ne quitte pas son segment (ni son mur). Une ouverture ne se déplace jamais d'elle-même : le déplacement générique (glisser, flèches) l'ignore ; sa place vient de son mur. Au glissement d'un mur entier, l'ouverture suit à l'enregistrement (suivi en direct et copie : tâche 7).
- Fichiers : `src/features/geometry/openingPlacement(.test).ts` (`pointerOffset`, `slideOpening`), `src/features/geometry/transform(.test).ts`, `src/components/editor/shapes/OpeningShape.tsx`, `src/components/editor/useElementInteractions.ts`
- Vérification : build ✓ lint ✓ tests ✓ (434 au total, dont 11 sur le glissement) — à contrôler dans le navigateur
- Commit : feat: glisser une ouverture le long de son mur

### 2026-11-10 — M5 · Outils Porte et Fenêtre
- Fait : deux outils dans la barre (projets Plan uniquement) : Porte (`B`, 0,90 × 2,10 m) et Fenêtre (`F`, 1,20 × 1,00 m, allège 0,90 m). Au survol d'un mur : aperçu de l'ouverture et distances libres jusqu'aux deux bouts du segment ; clic = pose (l'ouverture posée devient la sélection, l'outil reste actif pour en poser d'autres ; `Échap` pour quitter). La porte s'ouvre du côté du mur où se trouve le curseur. Position arrondie à 1 cm, bornée sur le segment, décalée si elle chevauche une voisine. Aperçu en rouge et message si la pose est impossible (pas assez de place, ouverture plus haute que le mur) ou si on clique hors d'un mur. Murs masqués ou verrouillés ignorés. La baie n'a pas d'outil : ce sera un réglage de la fenêtre (tâche 6). Rappel des commandes en bas de l'écran.
- Fichiers : `src/features/geometry/openingPlacement(.test).ts`, `src/features/documents/elements.ts` (`createOpeningElement`, `OPENING_DEFAULTS`), `src/components/editor/{useOpeningTool,OpeningPreviewLayer,EditorStage,Toolbar,ToolHint,shortcuts,useEditorShortcuts}`, `src/stores/editorStore.ts`, `src/i18n/fr.ts`, `docs/02-ARCHITECTURE.md`
- Vérification : build ✓ lint ✓ tests ✓ (422 au total, dont 12 sur la pose) — à contrôler dans le navigateur
- Commit : feat: outils porte et fenêtre

### 2026-11-10 — M5 · Dessin des ouvertures
- Fait : composant `OpeningShape` : le mur est « découpé » par un rectangle de la couleur du fond de page, puis le symbole est tracé dessus, orienté selon le segment du mur. **Porte** : deux montants, battant ouvert à 90° et arc d'ouverture (charnière à gauche ou à droite, ouverture de l'un ou l'autre côté du mur). **Fenêtre** : cadre et deux traits de vitrage. **Baie** : deux montants seulement. Surbrillance quand l'ouverture est sélectionnée ; clic pour la sélectionner. Pas de poignées de redimensionnement pour une ouverture (sa position dépend de son mur). Les ouvertures ne sont pas encore créables (tâche 4) ni déplaçables (tâche 5).
- Décision : la découpe utilise la couleur du fond de page plutôt qu'un vrai trou, pour ne pas découper le mur en morceaux (ce qui casserait les angles en onglet). Conséquence : sur une image de fond (calque), la découpe la masque localement.
- Fichiers : `src/features/geometry/openingSymbol(.test).ts`, `src/components/editor/shapes/OpeningShape.tsx`, `ElementNode.tsx`, `SelectionTransformer.tsx`
- Vérification : build ✓ lint ✓ tests ✓ (409 au total, dont 12 sur le dessin des symboles) — rendu à l'écran à contrôler après la tâche 4 (on ne peut pas encore poser d'ouverture)
- Commit : feat: dessin des portes, fenêtres et baies

### 2026-11-10 — M5 · Calculs des ouvertures
- Fait : fonctions pures pour placer une ouverture sur son mur : segment d'un mur (longueur, direction, normale), position réelle d'une ouverture (centre, extrémités, angle), **bornage** de la position (reste sur le segment, ne chevauche pas une voisine, se toucher est permis ; `null` s'il n'y a pas de place), distances libres jusqu'aux bouts du segment, contrôle de hauteur (allège + hauteur ≤ hauteur du mur), surface, recherche du mur sous le curseur (dans l'épaisseur + tolérance, le plus proche gagne), **replacement** d'une ouverture quand son mur change (sommet déplacé, ajouté ou retiré ; `null` si elle ne tient plus). Rien de visible à l'écran pour l'instant.
- Fichiers : `src/features/geometry/openings(.test).ts`
- Vérification : build ✓ lint ✓ tests ✓ (397 au total, dont 29 nouveaux)
- Commit : feat: calculs de position des ouvertures

### 2026-11-10 — M5 · Modèle des ouvertures et migration
- Fait : type `OpeningElement` (porte, fenêtre, baie ; accroché à un mur par `wallId`, `segmentIndex`, `offset`) ajouté au modèle ; document en **version 2** ; `migrateDocument` / `migrateProject` (v1 → v2 sans changement des éléments, version inconnue ou plus récente refusée) appliqués à la lecture d'un projet dans `LocalRepository`. Pas encore visible à l'écran : les ouvertures ne sont ni dessinées ni créées (tâches 3 et 4).
- Fichiers : `src/types/document.ts`, `src/features/documents/migrations(.test).ts`, `createProject.ts`, `src/features/persistence/{LocalRepository(.test),collectAssetIds}.ts`, `src/components/editor/{ElementNode,LayersPanel}.tsx`, `src/features/export/bounds.ts`, `src/i18n/fr.ts`, `docs/02-ARCHITECTURE.md`
- Vérification : build ✓ lint ✓ tests ✓ (368 au total, dont « un projet v1 s'ouvre sans perte »)
- Commit : feat: modèle des ouvertures et migration du document

### 2026-11-10 — M4 · Export (PNG, JPG, PDF, CSV)
- Fait : bouton « Exporter » dans l'en-tête de l'éditeur → fenêtre avec format (PNG, JPG, PDF ; CSV pour un plan), nom du fichier, résolution (×0,5 / ×1 / ×2 / ×3, avec la taille en pixels ; les tailles au-dessus de 8 192 px par côté ou 16,7 millions de pixels sont grisées), feuille A4 / A3, orientation, échelle 1:20 / 1:50 / 1:100 / 1:200 ou « Ajuster à la page ». Image sans sélection, poignées, guides ni grille, taille exacte en pixels (échelle de la scène réglée au pixel près). Zone exportée : page entière d'un Visuel ; emprise du contenu visible + 500 mm pour un plan (plan vide : export refusé avec un message). PDF d'un Visuel centré avec marges de 10 mm, ou pleine page pour un A4 / A3 sur la même feuille. PDF de plan : taille papier = taille réelle ÷ échelle, bande de 20 mm en bas avec barre d'échelle de 1 m et cartouche (nom, échelle, date, surface des pièces) ; si le plan ne tient pas : avertissement + échelle qui tient + export bloqué tant qu'on ne change pas. `jspdf` chargé à la demande (n'alourdit pas l'ouverture de l'éditeur). Pour un plan, la vue est ramenée à 100 % pendant la capture (traits fins de même épaisseur quel que soit le zoom), puis remise.
- Fichiers : src/features/export/{limits,bounds,pdfLayout,pdf,fileName}.ts (+ tests), src/components/editor/{exportStage,exportProject}.ts, ExportDialog.tsx, EditorHeader.tsx, src/lib/dataUrl.ts, src/i18n/fr.ts
- Vérification : build ✓ lint ✓ tests ✓ (357 au total) — rendu réel et mesure à la règle à contrôler dans le navigateur
- Commit : feat: fenêtre Exporter (PNG, JPG, PDF, CSV)

### 2026-11-10 — M3 · Ajout et retrait de sommets (correctif demandé)
- Fait : sur un mur ou une pièce sélectionné, un petit point « + » apparaît au milieu de chaque côté (pour une pièce, y compris le côté de fermeture) ; un clic ajoute un sommet à cet endroit (la forme ne change pas, on le glisse ensuite) ; un double-clic sur un sommet le retire (minimum 2 sommets pour un mur, 3 pour une pièce ; une cote reste à 2). Un geste = un pas d'annulation. Rappel affiché dans Propriétés.
- Fichiers : src/features/geometry/transform.ts (+ tests), src/components/editor/VertexHandles.tsx, PlanElementFields.tsx, src/i18n/fr.ts
- Vérification : build ✓ lint ✓ tests ✓ (319 au total) — clics et double-clics à contrôler dans le navigateur
- Commit : feat: ajout et retrait de sommets

### 2026-11-10 — M3 · Panneau Métrés et export CSV
- Fait : panneau « Métrés » (projets de type Plan uniquement), mis à jour en temps réel : tableau des pièces (nom, surface, périmètre), tableau des murs (nom, longueur, épaisseur, surface murale), totaux, mention « Surfaces mesurées sur le contour tracé » ; cliquer une ligne sélectionne l'élément sur le plan ; bouton « Exporter en CSV » (désactivé s'il n'y a rien à exporter) : fichier `<nom du projet>-metres.csv` (séparateur `;`, décimales à virgule, UTF-8 avec BOM, accents conservés ; caractères interdits dans un nom de fichier retirés). Aucun calcul dans les composants : tout vient de `features/measurements` et `features/units`.
- Fichiers : `src/components/editor/MeasurementsPanel.tsx`, `src/features/measurements/csv.ts` (`csvFileName`), `src/lib/download.ts`, `src/pages/EditorPage.tsx`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (308 au total) — ouverture du CSV dans Excel / LibreOffice à contrôler
- Commit : feat: panneau métrés et export CSV

### 2026-11-10 — M3 · Outil Calibrer
- Fait : outil Calibrer (pas de raccourci) : un clic pose le point A sur une image importée (sinon un message demande de cliquer sur une image), un second clic pose le point B, puis une fenêtre demande la distance réelle (`3,50 m`, `350 cm`, `3500 mm` ; sans unité = mètres ; message d'erreur si la saisie est invalide). L'image est mise à l'échelle autour du point A (facteur = distance réelle ÷ distance mesurée) ; un seul état d'historique, annulable. `Échap` annule. Aucune aimantation sur ce tracé (pour ne pas fausser la mesure). Ajout d'un rappel des commandes en bas de l'écran pour les outils Mur, Pièce, Cote et Calibrer. Correction : un tracé de mur, de pièce ou de cote abandonné en changeant d'outil ne réapparaît plus au retour sur l'outil.
- Fichiers : `src/features/geometry/calibration(.test).ts`, `src/components/editor/{useCalibrationTool,CalibrateDialog,CalibrationDraftLayer,ToolHint,EditorStage,usePolylineDrawing}`, `src/pages/EditorPage.tsx`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (303 au total, dont « une image calibrée sur 3,50 m donne 3,50 m ± 1 cm entre les deux mêmes points ») — à contrôler dans le navigateur avec une vraie image
- Commit : feat: outil calibrer pour les images de plan

### 2026-11-10 — M3 · Édition des sommets et propriétés du plan
- Fait : quand un mur, une pièce ou une cote est seul sélectionné, des poignées apparaissent sur chaque sommet : on les glisse pour modifier la forme (aimantation aux sommets, angles de faces et grille ; `Maj` contraint la direction depuis le sommet voisin) ; le métré se met à jour en direct et un geste complet ne forme qu'un seul état d'historique (nouvelles actions `beginLiveEdit` / `liveReplaceElements` / `endLiveEdit`). Panneau Propriétés pour les éléments de plan : nom, épaisseur et hauteur du mur (en cm), « afficher le nom et la surface » pour une pièce, décalage d'une cote, couleur (une pièce garde un remplissage translucide), opacité, et un cadre « Mesures » (surface et périmètre d'une pièce avec la mention « Surface mesurée sur le contour tracé », longueur et surface murale d'un mur, longueur d'une cote). Rotation et position ne sont plus proposées pour ces éléments (points absolus, décision D6).
- Fichiers : `src/components/editor/{VertexHandles,PlanElementFields,PropertiesPanel,EditorStage}`, `src/components/ui/TextField.tsx`, `src/features/geometry/transform(.test).ts` (`getVertices`, `moveVertex`), `src/features/documents/properties(.test).ts`, `src/stores/editorStore.ts`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (292 au total) — glisser des sommets à contrôler dans le navigateur
- Commit : feat: édition des sommets et propriétés des éléments de plan

### 2026-11-10 — M3 · Outil Cote
- Fait : outil Cote (`D`) : deux clics (le second valide la cote), aimantation comme pour les murs (sommets, angles de faces, grille, `Maj`), longueur affichée en direct pendant le tracé. Rendu d'une cote : ligne décalée (50 cm par défaut), lignes d'attache, traits obliques aux extrémités, longueur en mètres (`3,50 m`) centrée au-dessus de la ligne, toujours lisible (jamais à l'envers). Murs, pièces et cotes sont maintenant des groupes Konva : leur surbrillance et leur étiquette suivent l'élément quand on le déplace ; les gestionnaires de clic lisent l'élément du document (`currentTarget`) et non la forme cliquée à l'intérieur. Le décalage de la cote se règle dans Propriétés (tâche 9).
- Fichiers : `src/features/geometry/dimension(.test).ts`, `src/components/editor/shapes/{DimensionShape,WallShape,RoomShape}.tsx`, `ElementNode.tsx`, `useElementInteractions.ts`, `EditorStage.tsx`
- Vérification : build ✓ lint ✓ tests ✓ (277 au total) — à contrôler dans le navigateur
- Commit : feat: outil cote

### 2026-11-10 — M3 · Outil Pièce
- Fait : outil Pièce (`P`) : polygone fermé, mêmes commandes que le mur (clic, `Maj`, double-clic ou `Entrée`, `Échap`, `Retour arrière`) ; un clic sur le premier point ferme le polygone ; aimantation aux sommets des murs et aux angles de leurs faces (donc on peut tracer une pièce le long des faces intérieures) ; la pièce est remplie (couleur semi-transparente) avec une étiquette au centre : **nom + surface au tracé** (`12,00 m²`), à la taille de 25 cm sur le plan (10 px minimum à l'écran). Le nom se change par double-clic dans « Calques » (champ « Nom » dans Propriétés : tâche 9).
- Fichiers : `src/components/editor/shapes/RoomShape.tsx`, `ElementNode.tsx`, `EditorStage.tsx`
- Vérification : build ✓ lint ✓ tests ✓ (267 au total) — à contrôler dans le navigateur ; pendant le déplacement d'une pièce, l'étiquette rejoint la pièce à la fin du geste
- Commit : feat: outil pièce avec étiquette de surface

### 2026-11-10 — M3 · Outil Mur
- Fait : outil Mur (`W`) : un clic par point, `Maj` = direction à 0/45/90°…, double-clic ou `Entrée` pour terminer, `Échap` pour annuler le tracé (un second `Échap` quitte l'outil), `Retour arrière` pour retirer le dernier point ; le mur créé prend l'épaisseur et la hauteur par défaut du plan ; l'outil reste actif pour enchaîner plusieurs murs. Aperçu en direct : épaisseur du mur, points, repère d'aimantation coloré (vert = sommet, gris = grille, bleu = angle contraint) et **longueur du segment en cours** (`3,50 m`). Les points s'aimantent aux sommets, aux angles des faces de murs et à la grille. Rendu des murs (axe fermé si le tracé revient à son départ). Les éléments de plan (points absolus) se déplacent, se dupliquent, se collent et se déplacent aux flèches en décalant leurs points (`translateElement`), position `x, y` toujours à 0 ; pas de poignées de redimensionnement pour eux (leurs sommets s'éditeront à la tâche 9).
- Fichiers : `src/components/editor/{usePolylineDrawing,PolylineDraftLayer,EditorStage,SelectionTransformer,useElementInteractions,ElementNode}`, `src/components/editor/shapes/WallShape.tsx`, `src/features/geometry/{transform,walls}`, `src/features/documents/elements.ts`, `src/stores/editorStore.ts`
- Vérification : build ✓ lint ✓ tests ✓ (267 au total) — le tracé à la souris est à contrôler dans le navigateur
- Commit : feat: outil mur avec aimantation et longueur en direct

### 2026-11-10 — M3 · Grille, barre d'état et réglages du plan
- Fait : grille d'un plan (traits tous les 10 cm par défaut, un peu plus marqués à chaque mètre ; quand le zoom est faible, un trait sur 2, 5, 10… pour ne pas noircir l'écran ; dessinée en un seul tracé pour rester fluide) ; barre d'état « Zoom 100 % · Impression 1:50 » (un visuel affiche seulement le zoom) ; réglages du plan dans « Propriétés » quand rien n'est sélectionné : échelle d'impression (1:20, 1:50, 1:100, 1:200), taille de grille (5, 10, 20, 50 cm, 1 m), aimantation sur la grille, épaisseur et hauteur de mur par défaut (en cm). Chaque réglage est annulable.
- Fichiers : `src/features/geometry/grid(.test).ts`, `src/components/editor/{PlanGrid,PlanSettingsSection,ZoomControls,PropertiesPanel,EditorStage}`, `src/stores/editorStore.ts`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (261 au total) — l'affichage de la grille est à contrôler dans le navigateur
- Commit : feat: grille, barre d'état et réglages du plan

### 2026-11-10 — M3 · Outils réservés aux plans
- Fait : outils Mur (`W`), Pièce (`P`), Cote (`D`) et Calibrer dans la barre d'outils, visibles uniquement dans un projet de type Plan (séparés des outils communs) ; le store refuse aussi ces outils dans un Visuel (raccourcis compris) ; création des éléments mur, pièce et cote (`createWallElement`, `createRoomElement`, `createDimensionElement`). Les outils ne dessinent pas encore : leur comportement arrive dans les tâches suivantes.
- Fichiers : `src/components/editor/{Toolbar,shortcuts,useEditorShortcuts}`, `src/stores/editorStore.ts`, `src/features/documents/elements.ts`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (249 au total)
- Commit : feat: outils de plan dans la barre d'outils

### 2026-11-10 — M3 · Métrés et CSV
- Fait : `computeMeasurements` (surface et périmètre de chaque pièce ; longueur, épaisseur, hauteur et surface murale de chaque mur — une face, sans déduction d'ouvertures ; totaux) ; `measurementsToCsv` (séparateur `;`, décimales à virgule, UTF-8 avec BOM, fins de ligne CRLF, deux tableaux avec leurs totaux, intitulés fournis par `fr.ts`) ; protection contre l'injection de formule dans un tableur (un nom de calque commençant par `=`, `+`, `-` ou `@` reçoit une apostrophe).
- Fichiers : `src/features/measurements/{measurements,csv}.ts`, `measurements.test.ts`
- Vérification : build ✓ lint ✓ tests ✓ (245 au total)
- Commit : feat: calcul des métrés et export CSV

### 2026-11-10 — M3 · Géométrie pure
- Fait : `polygon.ts` (liste de points ↔ coordonnées à plat, longueur d'une polyligne, aire par la formule du lacet — identique dans les deux sens —, périmètre, centroïde pondéré par l'aire) ; `walls.ts` (les deux faces d'un mur avec angles en onglet, axe fermé reconnu, angles très aigus coupés ; intersection de segments ; angles des faces et croisements de faces entre murs différents, ce qui donne les angles intérieurs d'une pièce) ; `snapping.ts` (contrainte à 0/45/90°… par projection du curseur, aimantation dans l'ordre sommet → grille → contrainte, collecte des sommets du plan). Tests de la doc réalisés : rectangle 4 × 3 m = 12,00 m² et 14,00 m, polygone en L, sens inverse, mur en 3 segments ; et 4 murs de 20 cm autour d'axes 4 × 3 m donnent un intérieur de 10,64 m².
- Fichiers : `src/features/geometry/{polygon,walls,snapping}(.test).ts`
- Vérification : build ✓ lint ✓ tests ✓ (226 au total)
- Commit : feat: géométrie des polygones, des murs et aimantation des points

### 2026-11-10 — M3 · Unités
- Fait : conversions mm ↔ m ↔ cm, surfaces mm² → m², formatage à la française (`3,50 m`, `12,40 m²`, jamais `-0,00`), épaisseur en cm, et lecture d'une longueur saisie (`3,50 m`, `350 cm`, `3500mm`, sans unité = mètres) pour le calibrage.
- Fichiers : `src/features/units/format(.test).ts`
- Vérification : build ✓ lint ✓ tests ✓ (172 au total)
- Commit : feat: unités et formatage des longueurs et surfaces

### 2026-11-10 — M2 · Miniatures des projets
- Fait : à chaque sauvegarde automatique, une miniature PNG (320 px maximum) de la page est générée à partir de la scène du canevas, sans les poignées de sélection ni les guides, puis enregistrée avec le projet et affichée sur la carte du projet à l'accueil (l'icône reste affichée pour un projet jamais modifié). Si la capture échoue, l'ancienne miniature est conservée et l'enregistrement n'est pas bloqué.
- Fichiers : `src/features/export/thumbnail(.test).ts`, `src/components/editor/{thumbnail,useAutosave,EditorStage}`, `src/components/home/ProjectCard.tsx`
- Vérification : build ✓ lint ✓ tests ✓ (160 au total) — la capture réelle n'est pas testable automatiquement : à contrôler à l'accueil
- Commit : feat: miniatures des projets

### 2026-11-10 — M2 · Guides d'alignement et aimantation
- Fait : pendant le déplacement d'un ou plusieurs éléments, la sélection s'aimante sur les bords et les centres des autres éléments visibles et de la page (tolérance 8 px à l'écran, quel que soit le zoom) ; des traits roses pointillés montrent les alignements trouvés ; `Alt` enfoncée désactive l'aimantation. Valable dans les deux modes (visuel et plan). Calcul pur et testé dans `features/geometry/guides.ts`.
- Fichiers : `src/features/geometry/{guides,box}(.test).ts`, `src/components/editor/{AlignmentGuides,useElementInteractions,EditorStage}`, `src/stores/editorStore.ts`
- Vérification : build ✓ lint ✓ tests ✓ (156 au total) — comportement du glisser à contrôler dans le navigateur
- Commit : feat: guides d'alignement et aimantation

### 2026-11-10 — M2 · Copier / coller, tout sélectionner, flèches
- Fait : `Ctrl+C` / `Ctrl+V` (le presse-papiers interne survit au changement de projet : on peut copier dans un projet, retourner à l'accueil, en ouvrir un autre et coller ; chaque collage décale un peu plus les copies) ; `Ctrl+A` (tout sélectionner, sans les éléments verrouillés ni masqués) ; flèches pour déplacer la sélection de 1 unité (Maj : 10), sans bouger les éléments verrouillés ; les appuis rapprochés (moins de 0,6 s) ne forment qu'un état d'historique. Coller un élément de visuel (px) dans un plan (mm) est refusé avec un message (unités incompatibles).
- Fichiers : `src/features/documents/clipboard(.test).ts`, `src/stores/editorStore.ts`, `src/components/editor/{shortcuts,useEditorShortcuts}`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (144 au total) — contrôle dans le navigateur à faire par l'utilisateur
- Commit : feat: copier-coller, tout sélectionner et déplacement aux flèches

### 2026-11-10 — M2 · Panneau Calques
- Fait : panneau « Calques » sous les propriétés : liste dans l'ordre d'affichage (le dessus en haut), clic = sélection (Maj = ajouter / retirer), synchronisée avec le canevas ; renommer par double-clic ; masquer / afficher ; verrouiller / déverrouiller ; réordonner par glisser-déposer natif (trait indicateur) et par boutons Monter / Descendre. Un élément verrouillé ne réagit plus à la souris sur le canevas (ni sélection, ni déplacement, ni poignées) mais reste sélectionnable depuis la liste ; un élément masqué disparaît du canevas. Chaque action = un état d'historique ; un ordre inchangé n'en crée pas.
- Fichiers : `src/components/editor/LayersPanel.tsx`, `src/features/documents/layers(.test).ts`, `src/stores/editorStore.ts` (`reorderElement`, `stepElementOrder`), `src/pages/EditorPage.tsx`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (129 au total) — contrôle dans le navigateur à faire par l'utilisateur
- Commit : feat: panneau calques

### 2026-11-10 — M2 · Panneau Propriétés
- Fait : colonne de droite « Propriétés ». Un élément sélectionné : X, Y, largeur, hauteur, rotation, opacité (en %), épaisseur de contour, arrondi (rectangle), remplissage et contour (avec « Aucun »), police (6 polices système), taille, gras, italique, alignement (texte), flèche (ligne) — selon le type. Plusieurs éléments : opacité commune. Les champs sont en unités du document (px, ou mm sur un plan) ; virgule ou point acceptés, ↑ ↓ pour ajuster (Maj = ×10). Chaque modification valide un seul état d'historique (à la sortie du champ, ou à la fermeture du sélecteur de couleur). Une ellipse s'affiche par son coin haut-gauche et sa taille.
- Fichiers : `src/components/editor/PropertiesPanel.tsx`, `src/components/ui/{NumberField,ColorField}.tsx`, `src/features/documents/properties(.test).ts`, `src/lib/numberFormat(.test).ts`, `src/pages/EditorPage.tsx`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (116 au total) — contrôle dans le navigateur à faire par l'utilisateur
- Commit : feat: panneau propriétés

### 2026-11-10 — M2 · Import d'image
- Fait : import par le bouton de la barre d'outils (plusieurs fichiers possibles) et par glisser-déposer d'un fichier sur le canevas (l'image se place là où on la dépose). Formats PNG, JPEG, WebP, GIF ; 20 Mo maximum ; un fichier refusé affiche un message en français (bandeau qui se ferme seul) sans bloquer les autres. L'image est stockée via `putAsset`, ajoutée au projet (taille : au plus la moitié de la page, proportions conservées, jamais agrandie sur un visuel) et affichée ; un cadre gris la remplace pendant le chargement, rouge si le fichier est introuvable.
- Fichiers : `src/features/documents/images(.test).ts`, `src/components/editor/{importImages,useAssetImage,Notice,Toolbar,EditorStage}`, `src/components/editor/shapes/ImageShape.tsx`, `src/stores/editorStore.ts`
- Vérification : build ✓ lint ✓ tests ✓ (97 au total) — import réel d'un fichier à contrôler dans le navigateur
- Commit : feat: import d'images

### 2026-11-10 — M2 · Outil Texte
- Fait : outil Texte (`T`) : un clic pose un texte (« Votre texte ») et ouvre la saisie ; double-clic sur un texte pour le modifier. La zone de saisie est superposée au texte (même position, taille, police, rotation). La saisie est validée à la sortie du champ ou avec `Ctrl+Entrée` ; `Échap` abandonne. Un seul état d'historique par modification, donc annuler restaure exactement l'ancien contenu ; un texte vidé est supprimé (et l'annulation le ramène). Un texte ne se redimensionne qu'en largeur. Les 6 polices système (option A) sont définies dans `features/documents/fonts.ts` ; le choix de police arrive avec le panneau Propriétés.
- Fichiers : `src/components/editor/{TextEditorOverlay,EditorStage,SelectionTransformer,Toolbar,ElementNode,useElementInteractions}`, `src/components/editor/shapes/TextShape.tsx`, `src/features/documents/{fonts,elements}(.test).ts`, `src/stores/editorStore.ts`
- Vérification : build ✓ lint ✓ tests ✓ (89 au total, dont annuler un texte modifié)
- Commit : feat: outil texte avec édition au double-clic

### 2026-11-10 — M2 · Outil Ligne
- Fait : outil Ligne (`L`) au glisser, ou au clic (ligne horizontale de taille par défaut) ; rendu en ligne ou en flèche selon `arrowEnd` (le réglage arrive avec le panneau Propriétés) ; zone de clic élargie pour les lignes fines ; le redimensionnement étire les points de la ligne ; transformateur : retournement désactivé et taille minimale qui ne bloque plus les lignes horizontales.
- Fichiers : `src/components/editor/shapes/LineShape.tsx`, `ElementNode.tsx`, `EditorStage.tsx`, `SelectionTransformer.tsx`, `Toolbar.tsx`, `shortcuts(.test).ts`, `src/features/documents/elements.ts`, `src/features/geometry/transform(.test).ts`
- Vérification : build ✓ lint ✓ tests ✓ (81 au total)
- Commit : feat: outil ligne

### 2026-11-10 — M1 · Sauvegarde automatique, indicateur et titre éditable
- Fait : sauvegarde automatique 1 seconde après la dernière modification (regroupe les modifications rapprochées), immédiate à la fermeture de l'onglet / changement de page / sortie de l'éditeur ; indicateur « Enregistrement… / Enregistré / Erreur d'enregistrement » ; en-tête avec retour à l'accueil, titre éditable (Entrée valide, Échap annule, un nom vide est refusé), boutons Annuler / Rétablir. Pas de faux « Enregistré » si le projet change pendant l'écriture.
- Fichiers : `src/features/persistence/autosave(.test).ts`, `src/components/editor/{useAutosave,SaveIndicator,EditorHeader}`, `src/pages/EditorPage.tsx`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (79 au total) — contrôle dans le navigateur à faire par l'utilisateur
- Commit : feat: sauvegarde automatique, indicateur et titre éditable

### 2026-11-10 — M1 · Supprimer, dupliquer, annuler / rétablir
- Fait : raccourcis `Suppr` / `Retour arrière` (supprime toute la sélection), `Ctrl+D` (duplique, copie décalée et sélectionnée), `Ctrl+Z` (annuler), `Ctrl+Maj+Z` (rétablir) ; `Cmd` accepté comme `Ctrl` sur Mac ; comportements par défaut du navigateur bloqués (favori, retour arrière). Correspondance touche → action en fonction pure testée.
- Fichiers : `src/components/editor/{shortcuts(.test).ts,useEditorShortcuts.ts}`
- Vérification : build ✓ lint ✓ tests ✓ (71 au total) — contrôle dans le navigateur à faire par l'utilisateur
- Commit : feat: raccourcis supprimer, dupliquer, annuler, rétablir

### 2026-11-10 — M1 · Sélection et transformation
- Fait : sélection par clic, Maj + clic (ajouter / retirer), rectangle de sélection (Maj = ajouter) ; clic dans le vide = désélection ; `Transformer` Konva (redimensionner, pivoter avec aimantation à 45°, taille minimale) ; déplacement d'un ou plusieurs éléments ensemble ; chaque geste ne crée qu'un seul état d'historique. Logique pure `applyNodeTransform` testée (l'échelle Konva est « cuite » dans les dimensions).
- Fichiers : `src/components/editor/{SelectionTransformer,useElementInteractions,EditorStage}`, `src/features/geometry/transform(.test).ts`
- Vérification : build ✓ lint ✓ tests ✓ (61 au total) — contrôle dans le navigateur à faire par l'utilisateur (le comportement des poignées et du glisser n'est pas testable automatiquement)
- Commit : feat: sélection et transformation des éléments

### 2026-11-10 — M1 · Barre d'outils et tracé de formes
- Fait : barre d'outils (Sélection, Rectangle, Ellipse) ; tracé au glisser, ou au simple clic (forme de taille par défaut centrée sur le clic : 200 px, ou 1 m sur un plan) ; aperçu pointillé pendant le tracé ; retour automatique à l'outil Sélection ; affichage des rectangles et ellipses ; raccourcis `V`, `R`, `O`, `Échap`, `Ctrl+0`. Les éléments ne sont pas encore sélectionnables (tâche suivante).
- Fichiers : `src/components/editor/{Toolbar,ElementNode,EditorStage,useEditorShortcuts}`, `src/components/editor/shapes/*`, `src/features/geometry/box(.test).ts`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (55 au total) — contrôle dans le navigateur à faire par l'utilisateur
- Commit : feat: barre d'outils et tracé de rectangles et ellipses

### 2026-11-10 — M1 · Canevas, zoom et déplacement
- Fait : page de l'éditeur (charge le projet depuis le dépôt, gère « introuvable » et erreur) ; `Stage` Konva plein écran avec la page et son fond ; zoom molette vers le curseur ; déplacement de la vue avec Espace + glisser ; « Ajuster à l'écran » (bouton, et automatique à l'ouverture) ; affichage du zoom. Logique pure : `features/geometry/viewport.ts` (zoom vers un point, ajustement, conversion écran → document) et `features/units/scale.ts` (0,2 px/mm pour les plans).
- Fichiers : `src/pages/EditorPage.tsx`, `src/components/editor/{EditorStage,ZoomControls,useContainerSize,isTypingTarget}`, `src/features/geometry/viewport(.test).ts`, `src/features/units/scale.ts`, `src/stores/editorStore.ts`
- Vérification : build ✓ lint ✓ tests ✓ (49 au total) — contrôle dans le navigateur à faire par l'utilisateur
- Commit : feat: canevas avec zoom et déplacement de la vue

### 2026-11-10 — M1 · Page d'accueil
- Fait : liste des projets (nom, type, date relative en français), « Nouveau visuel » (fenêtre de choix du format avec aperçu des proportions), « Nouveau plan », menu ⋯ (renommer, dupliquer, supprimer avec confirmation), état vide utile, chargement et erreur. Composants `ui/` : Button, Modal, Menu. Textes dans `fr.ts`.
- Fichiers : `src/pages/HomePage.tsx`, `src/components/home/*`, `src/components/ui/*`, `src/lib/relativeTime.ts` (+ test), `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (39 au total) — contrôle dans le navigateur à faire par l'utilisateur
- Commit : feat: page d'accueil et gestion des projets

### 2026-11-10 — M1 · Store des projets
- Fait : `createProjectsStore(repo)` (dépôt injecté, donc testable) et `useProjectsStore` ; actions rafraîchir, créer Visuel / Plan (renvoient l'identifiant), renommer, dupliquer (suffixe « (copie) »), supprimer. `repository.ts` : point unique de choix du dépôt (local ; Supabase en M13).
- Fichiers : `src/stores/projectsStore.ts`, `projectsStore.test.ts`, `src/features/persistence/repository.ts`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (34 au total)
- Commit : feat: store des projets

### 2026-11-10 — M1 · Store de l'éditeur
- Fait : `editorStore` (document, sélection, outil, zoom/position, historique de 100 états, état de sauvegarde, compteur `revision` pour déclencher la sauvegarde) ; actions ajouter / remplacer / modifier / supprimer / dupliquer, annuler / rétablir. Un appel = un seul état d'historique (le geste complet de Konva est validé à la fin, pas à chaque mouvement). Création des rectangles et ellipses dans `features/documents/elements.ts`.
- Fichiers : `src/stores/editorStore.ts`, `editorStore.test.ts`, `src/features/documents/elements.ts`, `src/i18n/fr.ts`
- Vérification : build ✓ lint ✓ tests ✓ (28 au total : annuler 3 / rétablir 3, suppression multiple, limite de 100, immutabilité)
- Commit : feat: store de l'éditeur avec historique

### 2026-11-10 — M1 · Fabrique de projets
- Fait : `createDesignProject` (5 formats), `createPlanProject` (20 × 15 m, 1:50, grille 10 cm), `duplicateProject` (copie indépendante, mêmes `assetId`).
- Fichiers : `src/features/documents/createProject.ts`, `createProject.test.ts`
- Vérification : build ✓ lint ✓ tests ✓ (15 au total)
- Commit : feat: création et duplication de projets

### 2026-11-10 — M1 · Dépôt local (IndexedDB)
- Fait : interface `ProjectRepository`, `LocalRepository` (clés `project:`, `meta:`, `asset:`), nettoyage des images non référencées à la suppression d'un projet, URLs d'images mises en cache et libérées.
- Fichiers : `src/features/persistence/{types,collectAssetIds,LocalRepository}.ts`, `LocalRepository.test.ts`
- Vérification : build ✓ lint ✓ tests ✓ (8 tests, `idb-keyval` simulé)
- Commit : feat: dépôt local IndexedDB

### 2026-11-10 — M1 · Retrait de la démo et dépendances
- Fait : suppression de `src/App.css`, `src/assets/vite.svg`, `public/icons.svg` ; installation de `konva`, `react-konva` (19), `zustand`, `idb-keyval`, `lucide-react`, `clsx`, `vitest` ; script `npm test`.
- Vérification : build ✓ lint ✓ (pas encore de test)
- Commit : chore: retrait de la démo Vite et dépendances du jalon M1

### 2026-11-10 — M0 · Mise en place
- Fait : projet Vite (React 19 + TypeScript) à la racine ; Tailwind v4 (`@tailwindcss/vite`) ;
  `react-router` avec les routes `/` et `/p/:projectId` (+ page « introuvable ») ;
  arborescence de `docs/02-ARCHITECTURE.md` (`.gitkeep` dans les dossiers vides) ;
  `src/i18n/fr.ts` ; `src/types/document.ts` (copie exacte du modèle) ; favicon original ;
  `lang="fr"` et titre « Fabrics » ; `"strict": true` ajouté dans `tsconfig.app.json` ;
  `.env.local` ajouté explicitement dans `.gitignore` ; `git init -b main`.
- Fichiers : `package.json`, `vite.config.ts`, `index.html`, `tsconfig.app.json`, `.gitignore`,
  `public/favicon.svg`, `src/main.tsx`, `src/App.tsx`, `src/index.css`,
  `src/pages/HomePage.tsx`, `src/pages/EditorPage.tsx`, `src/i18n/fr.ts`,
  `src/types/document.ts`.
- Vérification : build ✓ lint ✓ (tests : pas avant M1) — serveur de dev : `/` et `/p/test`
  répondent 200, CSS Tailwind servi. Contrôle visuel dans le navigateur à faire par
  l'utilisateur.
- Commit : à proposer (`chore: mise en place du projet (M0)`)

## Décisions prises

<!-- Toute décision qui s'écarte des docs ou les précise, avec la raison. -->

### 2026-11-10 — Résolution des points flous de la lecture initiale

Docs mises à jour : `CLAUDE.md`, `docs/01-PRODUIT.md`, `docs/02-ARCHITECTURE.md`,
`docs/03-ROADMAP.md`.

| # | Sujet | Décision | Raison |
|---|---|---|---|
| D1 | Surface des pièces | Surface **au tracé** (polygone dessiné). Aimantation aussi sur les angles des faces de murs. Mention dans le panneau Métrés. | Calcul simple et vérifiable ; l'utilisateur obtient la surface intérieure en traçant sur les faces. |
| D2 | Échelle à l'écran | Barre d'état « Zoom 100 % · Impression 1:50 », jamais d'échelle « écran ». | Une échelle écran dépend du moniteur et serait fausse. |
| D3 | Zone exportée d'un plan | Emprise des éléments visibles + 500 mm ; la page 20 × 15 m reste une zone de travail. Marges de 10 mm et bande cartouche de 20 mm. | Le plan par défaut ne tient sur aucune feuille à 1:50. |
| D4 | Plafond d'export | 8 192 px par côté et 16 777 216 px au total ; options trop grandes grisées, dpi du PDF réduit si besoin. | Limites sûres des canvas navigateur. |
| D5 | PDF d'un Visuel | Centré avec marges de 10 mm ; pleine page si même format A4 / A3. Formats A4 = 2480 × 3508 px, A3 = 3508 × 4961 px (300 dpi). | La conversion px → mm n'était pas définie. |
| D6 | Points des éléments de plan | Coordonnées absolues, `x = y = 0`, `rotation = 0`, Transformer en déplacement seul. | Évite les ambiguïtés entre rotation, échelle et métrés. |
| D7 | `DimensionElement.points` | Reste un tuple de 4 nombres. | Copie exacte du modèle exigée. |
| D8 | Grille d'un Visuel | Repoussée (voir Idées). | Aucun réglage prévu dans le modèle. |
| D9 | Images partagées | Même `assetId` à la duplication et au collage ; suppression d'un projet = suppression des seules images qui ne sont plus référencées. | Éviter de casser un projet dupliqué. |
| D10 | Réordonner les calques | Glisser-déposer HTML5 natif + boutons Monter / Descendre. | Aucune nouvelle dépendance. |
| D11 | Tests du dépôt local | `idb-keyval` simulé avec `vi.mock`. | Aucune nouvelle dépendance. |
| D12 | `npm test` en M0 | Exigé seulement à partir de M1. | Le script n'existe qu'en M1. |
| D13 | Nom du paquet | `fabrics` dans `package.json`. | npm refuse les majuscules (dossier `Fabrics`). |
| D14 | Branche git | `git init -b main`. | Le déploiement automatique de M12 suit `main`. |
| D15 | Méthode | Un jalon à la fois, feu vert avant chaque jalon, même si un plan d'ensemble a été présenté. | Règle 1 de `CLAUDE.md`. |
| D16 | Outil de lint | `npm run lint` = **oxlint** (fourni par le gabarit Vite actuel), pas ESLint. | Le gabarit officiel l'utilise ; la commande reste `npm run lint`, comme dans `CLAUDE.md`. |
| D17 | Versions | Dernières versions stables à l'installation : React 19, Vite 8, TypeScript 7, Tailwind v4. `react-konva` (M1) devra être en version 19. | Règle « dernière version stable » de `docs/02-ARCHITECTURE.md`. |
| D18 | Dossier `features/documents/` | Ajouté pour la création et la duplication de projets (logique pure testée). | Ces fonctions n'entrent dans aucun dossier prévu par `docs/02-ARCHITECTURE.md`. |
| D19 | Collage entre visuel et plan | Refusé avec un message (unités px et mm incompatibles). | La roadmap ne le précise pas ; une conversion automatique n'aurait pas de sens. |
| D20 | Polices (M2) | 6 polices système uniquement (Arial, Georgia, Times New Roman, Courier New, Verdana, Trebuchet MS), sans dépendance. | Choix de l'utilisateur (option A). |
| D21 | Éléments masqués et métrés | Les murs et pièces masqués sont comptés dans les métrés. | Masquer ne change que l'affichage ; le métré décrit la géométrie du document. |
| D22 | Contrainte d'angle (Maj) | Le point est la projection du curseur sur la direction autorisée (multiples de 45°), pas un point à la même distance. | Le point reste aligné avec le curseur : plus naturel, et exact sur les axes. |
| D23 | Aimantation sur les faces de murs | On s'aimante aussi aux croisements des faces de murs différents (angles intérieurs). | Quatre murs séparés n'ont pas de sommet à leur angle intérieur : sans cela le critère 10,64 m² serait inatteignable. |
| D24 | Phase « Bâtiment » | Ouvertures (M5), niveaux (M6), axes et mobilier (M7), 3D (M8), façades / coupes / planche (M10), import-export DXF / glTF et partage (M11) ajoutés **après le MVP** ; collaboration renumérotée M14 ; IA reportée. Dépendances 3D et DXF à confirmer au début de leur jalon. | Demande de l'utilisateur (capture d'un outil de bâtiment, 2026-11-10) ; le MVP reste inchangé pour être mis en ligne d'abord. |
| D25 | Ordre des jalons | La phase « Bâtiment » passe **avant** la mise en ligne et les comptes : M5 Ouvertures, M6 Niveaux, M7 Axes et mobilier, M8 3D, M10 Façades et coupes, M11 Import et export, M12 Mise en ligne, M13 Comptes, cloud et partage (fin du MVP), M14 Collaboration. Le partage par lien passe en M13 car il a besoin de Supabase. Remplace l'ordre de D24. | Demande de l'utilisateur (2026-11-10). |

### 2026-11-10 — Bibliothèque d'objets

| # | Sujet | Décision | Raison |
|---|---|---|---|
| D26 | Bibliothèque d'objets (M7) | Pas d'import des familles Revit (`.rfa`, format fermé, licences Autodesk et fabricants). Bibliothèque **propre à Fabrics**, dessinée en « clean room » (règle ajoutée dans `CLAUDE.md`) et **riche** (nombreuses catégories, voir M7). Un import de symboles SVG / DXF par l'utilisateur reste une idée pour plus tard. | Demande de l'utilisateur (2026-11-10) ; licences ; un plan 2D n'a besoin que d'un symbole et de dimensions. À réaliser en M7, après M6. |
| D30 | Catalogue de M7 | Spécifié à l'avance dans `docs/06-BIBLIOTHEQUE.md` : 392 objets en 17 catégories + 24 ensembles (cuisines complètes américaine / en L / en U et bars ajoutés à la demande de l'utilisateur), gabarits de dessin, format de données, tests, 10 lots (A à J). Symboles décrits par des **données** (`features/library/`, fonctions pures) et non par des composants Konva écrits un à un ; `FurnitureElement` gagne `mirrored?`. `docs/02-ARCHITECTURE.md` mis à jour en conséquence (il remplace la mention `components/editor/symbols/`). | Demande de l'utilisateur (2026-11-10) : préparer M7 pour n'avoir plus qu'à exécuter ; un catalogue de cette taille n'est maintenable qu'avec des gabarits testables. |

### 2026-11-10 — Niveaux (M6)

| # | Sujet | Décision | Raison |
|---|---|---|---|
| D27 | Hauteur des murs | La hauteur d'un nouveau mur est celle du **niveau actif** (défaut 2 700 mm). Le réglage « Hauteur des murs » disparaît des réglages du plan ; `defaultWallHeight` reste dans le modèle pour les anciens projets (sert de hauteur au rez-de-chaussée migré). | Roadmap M6 : « les nouveaux murs prennent la hauteur d'étage par défaut » ; évite deux réglages concurrents. |
| D28 | Ordre et altitudes | Niveaux triés par altitude. Monter / descendre un niveau recalcule les altitudes à partir du plus bas ; modifier une altitude retrie la liste. | L'ordre réordonné et les altitudes doivent rester cohérents (3D en M8). |
| D29 | Niveau actif et référence | Niveau actif et interrupteur « niveau inférieur » sont des états d'interface (hors historique et hors document). | Changer d'étage n'est pas une modification du plan. |
| D30 | Éléments sans niveau | Un élément sans `levelId` est commun à tous les niveaux (axes de M7) et n'entre dans les métrés d'aucun niveau. | Évite le double comptage ; totaux = somme des niveaux. |
| D31 | Exports d'un plan | PNG, JPG et PDF portent sur le niveau affiché ; le CSV couvre tout le bâtiment. | La roadmap ne précise que le CSV ; une planche multi-niveaux arrive en M10. |

### 2026-11-11 — Jalon M10 bis

| # | Sujet | Décision | Raison |
|---|---|---|---|
| D32 | Numéro du jalon | « M10 bis » entre M10 et M11, sans renuméroter M11 à M14. | Choix de l'utilisateur ; les numéros M11 à M14 sont cités dans `CLAUDE.md` et les documents. |
| D33 | Formes de toiture | Plat, un pan, deux pans, croupe (pavillon = croupe sur un carré). Toits en pente sur un rectangle seulement. Pente en degrés. | Choix laissé à Claude par l'utilisateur ; couvre les cas courants sans calcul de squelette de polygone. |
| D34 | Styles d'ouvertures | Champ `style` facultatif, sans migration. Une variante qui ne change que la taille est une taille rapide (porte d'entrée, porte-fenêtre, vitrine, passe-plat), pas un style. Fenêtre ronde reportée. | Demande de l'utilisateur : éviter les doublons. La fenêtre ronde demande un trou rond en 3D et en coupe. |

### 2026-11-11 — Jalon M10 ter

| # | Sujet | Décision | Raison |
|---|---|---|---|
| D35 | Place et contenu | Un seul jalon « M10 ter » après M10 bis pour les métrés **et** les cotes client / exécution. | Choix de l'utilisateur ; les deux partagent les repères `M01`, `P01`, `F01`. |
| D36 | Déduction des ouvertures | Toutes les ouvertures sont déduites des surfaces de murs, sans seuil. | Choix de l'utilisateur ; c'est déjà le calcul actuel. |
| D37 | Surface du client | Le client voit la **surface au sol** (trémie déduite), pas de « surface habitable ». | Recommandation de Claude acceptée : sans toits en pente ni hauteurs sous plafond variables, les deux sont égales ; une définition légale (hauteur minimale) ne s'appliquera qu'après les toitures (voir Idées). |
| D38 | Point de départ des cotes exé | Au **nu brut** des murs (faces de la maçonnerie, enduits non compris). | L'utilisateur a demandé l'usage courant à Madagascar (héritage des usages français) ; à confirmer sur un premier PDF. |
| D39 | Cote des baies (exé) | Dimensions **brutes de maçonnerie** (tableau à tableau), `largeur / hauteur`, allège à part, avec une note : les dimensions des menuiseries sont à confirmer par le menuisier. | Même usage ; le modèle connaît le trou dans le mur, pas le jeu de pose du châssis. |

### 2026-11-11 — M10 bis, Lot B (toitures)

| # | Sujet | Décision | Raison |
|---|---|---|---|
| D40 | Contour d'une toiture | Le contour tracé est le **nu extérieur brut** des murs (faces de la maçonnerie) ; le débord part de là. L'outil Toiture attrape d'abord les faces extérieures (tri des sommets par outil). Points absolus (règle D6), comme une pièce ou une plateforme ; `Maj + R` tourne les points. | Même référence que les cotes d'exécution (D38) ; même stockage que les autres polygones du plan. |
| D41 | Valeurs par défaut | Toit en pente : deux pans, 35°, débord 500 mm. Toit plat : débord 0 mm. Pente en degrés (seule exception aux mm, D33), débord et hauteurs en mm entiers. | Usage courant ; le toit plat automatique n'a pas de débord. |
| D42 | Épaisseur des versants | Épaisseur de dalle du niveau (`slabThickness`, 200 mm par défaut), comme les dalles et le toit plat automatique. Aspect seulement (3D, façades, coupes) : les métrés donnent la surface réelle du versant. | Pas de nouvelle constante ; un seul réglage d'épaisseur par niveau. |
| D43 | Pignons | Un pignon **prolonge le mur qui est dessous** (même épaisseur, même plan) jusqu'au versant ; sans mur dessous, épaisseur des murs par défaut du plan, face extérieure sur le contour. Calculé, jamais stocké. | Le pignon est la suite du mur ; même règle « calculé, jamais stocké » que les marches et trémies. |
| D44 | Toit plat dessiné | Même logique que le toit plat automatique : **dessus au haut des murs**, pris entre les murs ; avec un débord, la dalle dépasse des murs à la même hauteur. | Cohérence avec la 3D validée (« toit entre les murs »). |
| D45 | Niveau d'une toiture | Une toiture appartient à un niveau (`levelId`) ; sa base est le haut des murs de ce niveau (altitude + hauteur d'étage). Elle remplace le toit plat automatique des pièces de ce niveau dont le centre est sous son emprise. Vue « étage ouvert » : pas de toiture (comme le toit automatique). Dupliquer un niveau ne copie pas ses toitures (comme plateformes et escaliers). Nouveau type sans changement de version du document. | Mêmes règles que les éléments déjà ajoutés en M9. |

### 2026-11-11 — M10 bis, Lot C (hachures et textures)

| # | Sujet | Décision | Raison |
|---|---|---|---|
| D46 | Un seul champ matériau | Un mur a un `material` facultatif (béton, maçonnerie, brique, bois, isolant, plaque de plâtre) ; une toiture une `covering` facultative (tuiles, ardoises, zinc, bac acier, toiture plate). La **texture de façade se déduit** du matériau : brique → brique apparente, bois → bardage, béton et maçonnerie → enduit, isolant et plâtre → aucune. Sans valeur : rendu d'avant (pas de migration, pas de changement de version). | Choix de l'utilisateur (option A1) : simple, suffit pour la roadmap ; un parement séparé pourra venir plus tard. |
| D47 | Écartement des motifs | Les hachures et textures sont des **traits vectoriels** découpés dans chaque face, écartés en multiples de la hauteur des textes du dessin : constants sur le papier (≈ 2 mm à l'impression) quelle que soit l'échelle. Ils partent d'une grille commune, donc deux morceaux d'un même mur se raccordent. | Lisible à 1:50 comme à 1:200 ; l'écran et le PDF dessinent les mêmes traits. |
| D48 | 3D | **Révisée le 2026-11-12** : la 3D montre le **motif** de chaque matériau et de chaque couverture (brique en rangs, bois en lames, tuiles, zinc à joints debout…), pas seulement une couleur. Motifs dessinés par le code sur un canevas (aucune image tierce), répétés selon une taille réelle (ex. 520 mm pour la brique) ; sans matériau, 3D inchangée. | Demande de l'utilisateur après essai des aplats ; reste original (clean room) et léger. Avant : une couleur unie par matériau. |

### 2026-11-12 — M10 ter, Lot B (cotes)

| # | Sujet | Décision | Raison |
|---|---|---|---|
| D49 | Dimensions d'une pièce (Client) | Option A : le contour de la pièce **tel qu'il est dessiné** ; la surface vient des métrés. Une pièce créée en cliquant dans une zone fermée suit déjà les faces intérieures. | Choix de l'utilisateur : cotes et métrés ne peuvent pas se contredire. Le calcul intérieur (option B) pourra venir avec le contrôle « pièce qui ne remplit pas l'espace entre les murs ». |
| D50 | Réglage « Cotation » | Trois choix : **Aucune** (par défaut), Client, Exécution. État d'interface, hors document et hors historique ; même chose pour le réglage par vue de la planche. | Choix de l'utilisateur : un projet existant s'ouvre sans cotes ajoutées. |
| D51 | Version du PDF des vues | « Cotation des plans : Comme à l'écran / Client / Exécution » ; la note sur les baies est imprimée dès qu'un plan est coté en Exécution. | Garde le réglage par vue tout en permettant d'imposer une version à toute la planche. |
| D52 | Hauteur sous plafond | Du dessus du sol de la pièce au-dessous de la dalle du niveau du dessus (altitude du niveau du dessus moins son épaisseur de dalle, comme en 3D). Dernier niveau : hauteur d'étage moins l'épaisseur du toit plat posé entre les murs. Exemples : étage du dessus à +2850 avec une dalle de 200 → 2650 ; dernier niveau de 2700 avec 200 de toit → 2500. | Demande de l'utilisateur ; même géométrie que la 3D, donc pas de contradiction. Sous un toit en pente, la hauteur variable n'est pas calculée. |
| D53 | Nom de la version « Exécution » | Affichée **« Technique »** partout dans l'interface (réglage Cotation, version des métrés, champ « Visible en », PDF des vues). Le code, les fichiers et les documents de conception gardent « execution » / « Exécution ». | Demande de l'utilisateur ; seuls les textes de `src/i18n/fr.ts` changent. |
| D54 | Contrôle « la pièce remplit l'espace entre ses murs » | Manque : zone fermée par les **faces** des murs moins la pièce (et moins les autres pièces de la zone). Débord : pièce moins la zone fermée par les **axes**. Seuil : 50 mm de large ou 0,01 m². Signalé, jamais corrigé. | Une pièce tracée à l'axe ou aux faces (D49) n'est pas signalée ; seules les vraies erreurs de tracé le sont. |
| D55 | Export et surfaces fausses | Un **manque** ou un **débord** (D54) dans ce qui est exporté **bloque l'export des métrés** (fenêtre Exporter, boutons du panneau, `prepareMetres`), **du plan en PNG, JPG et PDF** (niveau affiché ; `exportProject`) et **du PDF des vues** (tout le bâtiment) jusqu'à correction. Les autres avertissements n'empêchent pas l'export. | Choix de l'utilisateur : ne jamais livrer des métrés faux. |
| D56 | Pièces masquées | Comptées dans les métrés Client et Technique (D21 inchangée), avec l'avertissement « … est masquée mais sa surface est comptée » ; elles ne bloquent pas l'export. | Choix de l'utilisateur (option A). |
| D57 | Stabilité des repères | Option A : `M01`, `P01`, `F01` recalculés à chaque modification (rien d'enregistré). Les documents Technique qui les montrent impriment « Repères valables à la date du document ». | Choix de l'utilisateur : l'ordre de lecture du plan reste toujours juste. |
| D58 | Nom automatique d'un mur | Option A : « Mur Cuisine / Séjour » (pièces des deux côtés), « Mur extérieur Cuisine » (une pièce d'un seul côté), « Mur isolé » (aucune pièce). Calculé à l'affichage, jamais enregistré (D49). | Choix de l'utilisateur : un mur mitoyen se lit des deux côtés. |
| D59 | Stockage du nom personnalisé | Pas de champ `customName` : un `name` vide ou au format par défaut (« Mur 1 », « Porte 2 », « Mur 1 1 ») est remplacé par le nom automatique ; tout autre nom est gardé. Plus de deux pièces : les deux plus grandes puis « +N » ; pièces masquées comptées. | Une seule source de vérité, aucune migration ; les anciens projets prennent les nouveaux noms tout seuls. |

### 2026-11-12 — M11 (import et export)

| # | Sujet | Décision | Raison |
|---|---|---|---|
| D60 | Fichiers DXF | **Un fichier par niveau** (calques `MURS`, `PIECES`, `OUVERTURES`, `COTES`, `AXES`, `MOBILIER`), pas de calque par niveau. « Tous les niveaux » : un .dxf par niveau réunis dans un .zip. | Choix de l'utilisateur. |
| D62 | Fond DXF importé | Des éléments `line` verrouillés liés par un champ facultatif `groupId` (une ligne dans les calques, trait d'un pixel à l'écran), posés sous les autres éléments du niveau actif. Pas de nouveau type d'élément. | Le modèle n'a pas de groupes ; un champ facultatif évite une migration. |
| D65 | Textes d'un fond DXF | Éléments `text` verrouillés portant le même `groupId` que les traits (champ facultatif, comme D62) ; hauteur des majuscules du fichier ÷ 0,7 = taille de police. | Une seule ligne dans les calques, aucune migration. |
| D61 | Bibliothèque DXF | `dxf-parser` (MIT) accepté pour l'import ; l'export reste écrit à la main (R12, ASCII). | Choix de l'utilisateur ; un lecteur DXF écrit à la main serait fragile. |

### 2026-11-12 — Planification M11 bis

| # | Sujet | Décision | Raison |
|---|---|---|---|
| D63 | Plafonds (« sous plafonds ») | **Confirmé par l'utilisateur le 2026-11-12** : tableau « Plafonds » dans les métrés (Client et Technique : surface de plafond, hauteur sous plafond, périmètre ; export CSV, Excel et PDF) ; option « faux plafond » par pièce ; cote d'altitude « sous plafond » **sur le plan Technique seulement**. Rien sur le plan Client. | Les métrés sont l'endroit où le client et l'exécution lisent les surfaces ; le plan Client reste sans cote superflue (D50, D53) ; la hauteur sous plafond existe déjà (D52), donc peu de code nouveau. |
| D64 | Place de M11 bis | **Confirmé par l'utilisateur le 2026-11-12** : jalon **avant M12** (mise en ligne), numéroté « M11 bis » comme M10 bis et M10 ter. | Les items sont des outils d'édition ; les faire avant la mise en ligne évite de publier un éditeur incomplet. |
| D68 | Hébergement du temps réel (M14) | **Choix de l'utilisateur le 2026-11-12** : Cloudflare Workers + Durable Objects, dossier `collab-server/` séparé de l'application ; le Worker ne détient aucun secret (il interroge Supabase avec le jeton de la personne). | Même compte que Cloudflare Pages, offre gratuite, WebSocket avec mise en veille ; pas de `service_role`. |
| D69 | Invitation à un projet | **Choix de l'utilisateur le 2026-11-12** : par lien (`/i/<jeton>`), jamais par adresse e-mail. | Une recherche par e-mail permettrait de deviner qui a un compte. |
| D70 | Annuler / rétablir en collaboration | **Choix de l'utilisateur le 2026-11-12** : chaque personne ne défait que ses propres modifications (`Y.UndoManager`). | Un « annuler » ne doit pas effacer le travail des autres. |
| D67 | Miniature dans le cloud | La miniature (image encodée en texte) est stockée telle quelle dans la colonne `thumbnail_path` de `projects`, sans fichier Storage. | Évite une URL signée par carte de l'accueil ; le nom de la colonne est trompeur mais le schéma reste inchangé. À revoir si la base grossit trop. |
| D66 | Étiquettes de cote automatiques | **Choix de l'utilisateur le 2026-11-12** : calculées à l'affichage et dans les exports, jamais enregistrées ; longueurs de murs et largeurs d'ouvertures ; seule la case `plan.showDimensionLabels` est enregistrée. | Elles suivent le plan sans alourdir le document (même principe que les cotes Client / Technique). |

### 2026-11-12 — M11 quater, Lot A (barre d'outils lisible)

- Chaque famille de la barre d'outils montre maintenant l'icône **et le nom** de l'outil (Mur, Porte, Cote…) ; la barre fait 160 px de large, la barre du haut a été décalée en conséquence.
- La flèche des familles est un vrai bouton séparé (plus grand, avec un trait de séparation). Un second clic sur l'outil déjà actif ouvre aussi la liste de la famille ; le clic droit marche toujours.
- Fichiers : `src/components/editor/Toolbar.tsx`, `src/i18n/fr.ts` (libellés courts), `src/pages/EditorPage.tsx`.
- Vérifié : build, lint et 2665 tests passent. Pas encore regardé dans le navigateur par Claude.
- Reste ouvert : « raccourcis plus logiques » (non touchés, demande de précision à l'utilisateur).

### 2026-11-12 — M11 quater, Lot C (plan vide)

- Un plan sans aucun élément affiche au centre une carte « Commencez votre plan » avec deux boutons : « Tracer une pièce » (mode rectangle, deux coins) et « Tracer des murs ». Elle disparaît au premier élément tracé.
- Fichiers : `src/components/editor/EmptyPlanCard.tsx` (nouveau), `src/i18n/fr.ts`, `src/pages/EditorPage.tsx`. Build, lint, 2665 tests OK.

### 2026-11-12 — M11 quater, Lot B (accueil)

- L'accueil montre trois cartes : « Dessiner un plan », « Créer une affiche », « Voir un exemple », et un rappel que les projets restent dans ce navigateur.
- « Voir un exemple » crée une copie du plan d'exemple (séjour + chambre, 2 murs, 2 portes, 2 fenêtres), dessiné pour Fabrics (`createExamplePlanProject`, testé).
- Fichiers : `HomePage.tsx`, `createProject.ts`, `projectsStore.ts`, `fr.ts`. Build, lint, 2667 tests OK.

### 2026-11-12 — M11 quater, Lot D (aide pendant le geste)

- La bulle d'aide en bas de l'écran ne montre plus qu'une consigne principale par outil ; Maj, Alt, Échap et les détails sont dans un bouton « Astuces » repliable.
- Fichiers : `ToolHint.tsx`, `fr.ts` (`hints` devient `{ main, tips }`). Build, lint, 2667 tests OK.

### 2026-11-12 — M11 quater, Lot E (raccourcis et gestes)

- Bouton « ? » dans la barre du bas à gauche et touche `?` : fenêtre « Raccourcis et gestes » (déplacer, zoomer, sélection, outils du plan, dessin, édition).
- Fichiers : `ShortcutsDialog.tsx`, `helpStore.ts` (nouveaux), `shortcuts.ts` (+ test), `useEditorShortcuts.ts`, `ZoomControls.tsx`, `fr.ts`. Build, lint, 2668 tests OK.

### 2026-11-12 — M11 quater, Lot F (panneau de droite)

- Nouvel onglet « Niveaux » (plan) séparé de « Calques ». Les « Réglages du plan » (échelle, grille, épaisseur, nord, annotations) sont repliés par défaut quand rien n'est sélectionné.
- Fichiers : `SidePanel.tsx`, `PlanSettingsSection.tsx`, `editorStore.ts` (type d'onglet), `fr.ts`. Build, lint, 2668 tests OK.

### 2026-11-12 — M11 quater, Lot G (vocabulaire)

- Une ligne d'explication sous Plateforme, Axe de construction, Coupe, Étirer une zone et Calibrer l'image (liste des familles) et dans l'infobulle du bouton.
- Le message d'export bloqué (D55) dans l'onglet Métrés est plus clair et en encadré orangé : il dit pourquoi et quoi faire.
- Fichiers : `Toolbar.tsx`, `MeasurementsPanel.tsx`, `fr.ts`. Build, lint, 2668 tests OK.

### 2026-11-12 — M11 quater, Lot I (tablette)

- Deux doigts : déplacer la vue et pincer pour zoomer (`pinchView`, fonction pure testée ; `useTouchGestures`). Un second doigt annule le tracé ou la sélection en cours d'un doigt, et rien n'est tracé tant qu'un doigt reste posé. Le canevas bloque le zoom et le défilement de la page par le navigateur.
- Boutons plus grands sur écran tactile (variante `pointer-coarse`) : barre d'outils, liste des familles, barre du bas.
- Limite connue : le tout premier doigt d'un geste à deux doigts peut déjà avoir posé un point avec un outil de tracé de murs ou de pièces (annulable). **À essayer sur une vraie tablette** (pas de tablette ici).
- Fichiers : `useTouchGestures.ts` (nouveau), `navigation.ts` (+ tests), `EditorStage.tsx`, `Toolbar.tsx`, `ZoomControls.tsx`. Build, lint, 2672 tests OK.

### 2026-11-12 — M11 quater, Lot J (signaux en haut à droite)

- Deux pastilles permanentes en haut à droite du plan : rouge « N à corriger » (manque ou débord : l'export est bloqué) et orange « N à vérifier » (superpositions, murs qui ne se touchent pas…). Un clic déplie la liste ; un clic sur un point affiche le niveau, sélectionne l'élément et surligne la zone. Calcul différé pour ne pas ralentir le dessin. L'avis du haut (confirmations) et la pastille de l'en-tête restent.
- Le plan d'exemple est testé : il ne déclenche aucune alerte.
- Fichiers : `PlanSignals.tsx` (nouveau), `EditorPage.tsx`, `fr.ts`, `createProject.test.ts`. Build, lint, 2673 tests OK.
- **Lot H** (test avec une vraie personne) : volontairement non coché, il se fait avec l'utilisateur à la fin du jalon.

### 2026-11-12 — Retour de l'accueil à l'original (M11 quater, lot B)

- À la demande de l'utilisateur, `HomePage.tsx` retrouve sa version d'avant le lot B (boutons « Nouveau visuel » et « Nouveau plan »). Le plan d'exemple (`createExamplePlanProject`, `createExample`) reste dans le code et testé, sans bouton pour l'instant.

### 2026-11-12 — Barre du haut allégée (M11 quater)

- Demande de l'utilisateur : trop d'éléments en haut du plan. Solution : ligne 1 = niveau + bouton unique « Cotation : Aucune ▾ » (liste au clic) ; ligne 2 = options de l'outil (Polygone / Rectangle / Avec murs…), seulement quand l'outil en a ; les deux interrupteurs de transparence des niveaux n'apparaissent qu'avec plusieurs niveaux.
- Fichiers : `DimensioningSelector.tsx`, `LevelSelector.tsx`, `EditorPage.tsx`.

### 2026-11-12 — Accueil qui guide, version plan seulement (M11 quater, lot B)

- L'accueil montre deux cartes : « Dessiner un plan » et « Voir un exemple », plus le rappel que les projets restent dans ce navigateur. Plus de bouton ni de carte pour créer un visuel (affiche, post…) ; les visuels déjà créés restent dans la liste des projets. `NewDesignDialog` n'est plus utilisé par l'accueil.
- Fichiers : `HomePage.tsx`, `fr.ts`. Build, lint, 2673 tests OK.

### 2026-11-12 — Signaux : pointer et dire quoi faire (M11 quater, lot J)

- Chaque point de la liste (pastilles en haut à droite et onglet Métrés) montre maintenant : le constat, une ligne « Que faire : … » propre à chaque cas, un bouton « Voir sur le plan » et, pour les murs, le bouton de correction.
- « Voir sur le plan » affiche le bon niveau, sélectionne l'élément, **entoure la zone en orangé** (contour de la surface, ou rectangle autour du mur, de la pièce ou de l'ouverture) et **centre et zoome le plan** dessus.
- Fichiers : `warningFocus.ts` (+ test), `navigation.ts` (`fitBoxView`, + tests), `MetresWarningList.tsx`, `metresWarningText.ts`, `fr.ts`. Build, lint, 2680 tests OK.

## Idées (hors jalon en cours)

<!-- Demandes de l'utilisateur ou idées de Claude à prioriser plus tard. -->
- ~~Signaler les irrégularités de dessin qui faussent cotes et métrés~~ : fait en M11 bis, lot H (2026-11-12) pour les écarts et superpositions de murs. Reste à étudier : objets posés à quelques mm d'un mur, murs plus courts que leur épaisseur, bouts de mur sur la face (et pas l'axe) d'un autre mur dessinés en biais, raccords sur un sommet d'un tracé à plusieurs côtés.
- ~~Aimantation sur les sommets et les traits d'un fond DXF importé~~ : planifié dans M11 bis, lot A (2026-11-12).
- ~~Reprendre les textes d'un DXF importé et exporter dans le DXF les escaliers, plateformes, toitures et cheminées~~ : planifié dans M11 bis, lot E (2026-11-12).
- ~~Afficher le **niveau du dessus** en transparence, et qu'il attire comme celui du dessous~~ : planifié dans M11 bis, lot C (2026-11-11, à confirmer).
- ~~Export des métrés en vrai fichier Excel~~ : fait (hors jalon K bis, avec `fflate`).
- ~~Hachures et textures dans les façades et coupes~~ et ~~toitures (versants, débords)~~ : planifiés dans le jalon M10 bis (2026-11-11).
- ~~Redimensionner une pièce préfabriquée d'un bloc~~ : fait (hors jalon I, option A).
- ~~Glisser un seul mur à la poignée (option A)~~ : planifié dans M11 bis, lot B (demande du 2026-11-11).
- ~~**Export pour Revit**~~ : fait (IFC2x3, option A, 2026-11-12). Reste à faire : escaliers, toitures, plateformes, mobilier, matériaux dans l'IFC. Texte d'origine : un fichier `.rvt` natif est impossible (format fermé Autodesk). Piste : export **IFC** (standard ouvert que Revit ouvre et importe : murs, dalles, pièces, portes, fenêtres, niveaux, en mm), en plus du DXF déjà prévu en M11. À décider : écrire l'IFC à la main (texte STEP, sans nouvelle dépendance) ou ajouter une bibliothèque (demande d'accord, règle 6). Non planifié : à placer dans un jalon.
- Surface habitable dans les métrés client (partie des pièces sous une hauteur minimale, par exemple 1800 mm, retirée) : utile seulement après les toitures en pente de M10 bis ; la définition est à fixer avec l'utilisateur (D37).
- ~~Joindre des murs (l'inverse de « Séparer les côtés »)~~ : planifié dans M11 bis, lot B (2026-11-12).
- Outil « couper ici » : cliquer un point d'un mur sur le canevas pour le couper en deux, sans passer par le « + » puis « Séparer les côtés » (proposé le 2026-11-12, si le bouton ne suffit pas à l'usage).
- ~~Recherche de projets sur l'accueil~~ (prévue dans la maquette de `docs/01-PRODUIT.md`) : planifié dans M11 bis, lot D.
- Grille et aimantation sur grille pour les Visuels (réglage en px dans le document).
- Calcul automatique de la surface intérieure d'une pièce (déduction de l'épaisseur des murs).
- ~~Aimantation des murs et des sommets sur ceux du niveau de référence~~ : planifié dans M11 bis, lot C (2026-11-12).
- ~~Pivoter un objet de 90° au clavier~~ : fait, `Maj + R` (décidé par l'utilisateur).
- Régler le nord avec le capteur d'orientation d'un téléphone (boussole réelle) : non fait en M11 ter (autorisations, inutile sur PC), à reprendre si le besoin vient du terrain.
- Assistant IA « Demander quelque chose » : reporté à la demande de l'utilisateur (après M14, à rediscuter).
- Bibliothèque (voir `docs/06-BIBLIOTHEQUE.md`, section 10), hors M7 : import de symboles SVG / DXF par l'utilisateur, niveau de détail « détaillé », variantes de style. Pose contre un mur, hauteurs 3D, bibliothèque personnelle, étiquettes de cote et annotations de plan sont planifiées dans M11 bis, lot F (2026-11-12).
- Plafonds : tableau dans les métrés et cote sous plafond (plan Technique) sont planifiés dans M11 bis, lot G (confirmés le 2026-11-12, D63). Faux plafond : confirmé.
- E-mails Supabase (M13) : l'envoi par défaut est limité à quelques e-mails par heure (atteint pendant les tests). Avant d'ouvrir à de vrais utilisateurs : brancher un service d'envoi (Supabase, Authentication, SMTP Settings). Connexion Google : finalement en place (voir l'entrée « Connexion Google »).
- Prise en main naturelle (audit du 2026-11-12) : jalon **M11 quater** confirmé par l'utilisateur le 2026-11-12 (avant M12, tablette incluse en lot I), dans `docs/03-ROADMAP.md`. Ordre : A, C, puis le reste. Lot J (signaux en haut à droite) ajouté le 2026-11-12.
- Alertes et signaux en haut à droite de l'écran (demande du 2026-11-12) : pastilles ou bandeau qui signalent immédiatement les erreurs et avertissements (ex. pièce qui ne remplit pas l'espace, export bloqué). Aujourd'hui, l'avis (Notice) s'affiche en haut au centre. Placé dans M11 quater, lot J (choix de l'utilisateur, 2026-11-12).
