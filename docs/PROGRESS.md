# Journal de progression

Tenu à jour par Claude à la fin de chaque tâche (voir `CLAUDE.md`).

## État actuel

- **Jalon en cours :** M23 Bibliothèque de prix et DQE (feu vert du plan le 2026-11-26) : 23.0 à 23.7 faits ; sous-lots enchaînés, essai de l'utilisateur à la fin du jalon. M22 Échanges IFC **terminé et validé par l'utilisateur le 2026-11-24** (essai dans le navigateur et HOUSE-01 dans 2 visionneuses : **gate G5 validé**). M21 : sous-lots faits, essai de l'utilisateur OK le 2026-11-24 ; **gate G4 encore ouvert** (revue d'un métreur à faire). M20 : tous les sous-lots faits, essai de l'utilisateur OK le 2026-11-23 ; **gate G3 encore ouvert** (mesure à la règle confirmée et revue d'un professionnel à faire). M19 terminé, **gate G2 validé PASS par l'utilisateur le 2026-11-21**.
- **Branche :** depuis le 2026-11-21, tout le travail Pascal se fait sur la branche `pascal` (commit + push sur `pascal`). `main` (version en ligne) n'est pas touché tant que l'utilisateur n'a pas déclaré les mises à jour Pascal terminées. Note : contrairement à ce que disent les entrées de M17 et M18, le travail de M17 à M19 n'est **pas** dans `main` (branche `pascal` partie de `8032c19`).
- **Lot Performance :** lot 1 fait ; lots 2 et 3 remis à plus tard par l'utilisateur le 2026-11-18 (voir « Idées »).
- **Mise en ligne de M18 :** base faite le 2026-11-18 (sauvegarde `supabase/m18-backup.sql` vérifiée à 10/10 projets et 40/40 versions ; projets tests supprimés, aucune conversion lancée). Commande de build Cloudflare Pages changée par l'utilisateur et essayée sur l'aperçu de la branche (`docs/05-INSTALLATION.md`). Les tables `projects_backup_m18` et `project_versions_backup_m18` restent dans Supabase jusqu'à décision de l'utilisateur.
- **Installation (depuis M17) :** `npm install` puis `npm run install:pascal` (Bun) ; vérification complète : `npm run check:all`
- **Avant M18 :** relire les calculs à la main de `fixtures/HOUSE-01`, `HOUSE-02`, `EDGE-01`
- **Hors jalon (demande de l'utilisateur) :** taille de la page modifiable dans Propriétés (largeur, hauteur, formats proposés) pour plans et visuels
- **Problèmes connus :** sur une machine chargée, quelques tests de Pascal dépassent leur délai de 5 s ou Bun s'arrête sans résultat (vu le 2026-11-18, passent seuls) ; le test de durée « 600 murs en moins de 200 ms » (`src/features/building/model.test.ts`) échoue parfois quand toute la suite tourne sur une machine chargée (passe seul) ; aucun test automatisé du rendu Konva (clics, poignées, glisser) : à contrôler à la main ; avertissement de taille de bundle au build (Konva, ~600 Ko, sans conséquence pour M1) ; voir D16 et D17 (lint = oxlint, TypeScript 7)

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
| M11 quater Prise en main naturelle | lots A à G, I et J faits ; lot H (test avec une vraie personne) à faire ; à essayer sur une vraie tablette (lot I) | |
| M11 quinquies Couper un mur ici, surface habitable | terminé, à tester dans le navigateur (lots A et B) | |
| M12 Mise en ligne | terminé | 2026-11-12 |
| M13 Comptes, sauvegarde cloud et partage | terminé (fin du MVP) | 2026-11-12 |
| M14 Collaboration temps réel | terminé (lots A à F) | 2026-11-15 |
| M15 Historique de versions | terminé (lots A à D) | 2026-11-15 |
| M15 bis Réorganisation de l'éditeur | terminé (lots A à D) | 2026-11-15 |
| M16 Commentaires ancrés | terminé (lots A à E) | 2026-11-15 |
| M17 Audit et intégration de Pascal (G0) | terminé, gate G0 validé PASS | 2026-11-18 |
| M18 Modèle BIM unifié (G1) | en cours (lots A à E faits) | |
| M19 Interface Pascal et édition 2D/3D professionnelle (G2) | terminé, gate G2 validé PASS | 2026-11-21 |
| M20 Plans professionnels et mise en page (G3) | sous-lots faits ; gate G3 ouvert (revue d'un professionnel) | |
| M21 Quantitatif automatique et traçabilité (G4) | sous-lots faits, essai OK ; revue d'un métreur à faire (gate G4 ouvert) | |
| M22 Échanges IFC (G5) | terminé, gate G5 validé | 2026-11-24 |
| M23 Bibliothèque de prix et DQE (G6) | en cours (23.0 à 23.7 faits) | |
| M24 Contrôles qualité, performance et sécurité (G7) | à faire | |
| M25 Assistant IA (G8) | à faire | |

## Journal

### 2026-11-27 — M23 · 23.7 Exports XLSX et PDF du DQE : fait

- **Réutilisation** des exportateurs des métrés (`buildMetresXlsx`, `buildMetresPdf`, cadre et cartouche) : pas de second exportateur. Tableaux du DQE (`src/features/pricing/estimateTables.ts`) : synthèse par lot, totaux (HT, TVA, TTC), détail (lot, code, désignation, unité, quantité, PU de vente, montant), décomposition (débours sec, frais et marge, K1), hypothèses (projet, espace, **date des prix**, versions de la bibliothèque et du devis, date de l'export, devise, K1, TVA, prix bruts, HT, arrondis, règles de métré, lignes provisoires, postes sans prix, revue par un professionnel). Montants repris tels quels du calcul : **mêmes totaux qu'à l'écran**.
- **XLSX** : formats en Ariary (`# ##0` et `# ##0,0`) ajoutés **seulement** aux classeurs qui contiennent des montants : le classeur des métrés reste identique octet pour octet (référence inchangée). Totaux en formule SOMME, valeur gardée = total exact.
- **PDF (correctif de la mise en page commune)** : la ligne de total, en gras, est mesurée en gras ; quand un tableau est trop large, c'est la colonne de texte la plus large qui cède d'abord la place, et **les colonnes de nombres ne sont plus réduites**. Avant, un total pouvait être tronqué (« 9 811 1… »). Profite aussi aux PDF des métrés trop larges.
- **Boutons** « Excel (.xlsx) » et « PDF » dans le panneau DQE, **réservés aux admins de l'espace** (D23-8).
- Vérifié dans Chromium sur la maison d'exemple : XLSX relu par un lecteur indépendant (openpyxl) et PDF relu : 9 811 100 / 1 962 300 / 11 773 400 Ar partout, comme à l'écran ; date des prix 01/10/2026 dans l'en-tête et le cartouche. Test automatique : le total HT figure en entier quatre fois dans le PDF.
- Build, lint, 3 532 tests OK ; doublons 0,85 %.

### 2026-11-27 — M19 · Lot A : suivi mis à jour
- L'utilisateur confirme que les effets visuels de Pascal fonctionnent dans Fabrics (qualité, occlusion ambiante, bloom, contours encrés, heure et lumière…). Les 5 cases du lot A de M19 (roadmap) et les 12 cases « Fabrics = Pascal » de `docs/regression-checklist.md` sont cochées. Aucun code modifié.
- Restent ouverts dans les jalons précédents : gate G3 (mesure à la règle, revue d'un professionnel), gate G4 (revue d'un métreur), M11 quater lot H (test avec une vraie personne) et lot I (essai sur tablette), choix des raccourcis.

### 2026-11-27 — M23 · 23.6 Panneau DQE : fait

- **Onglet « DQE »** dans la barre latérale de l'éditeur (à côté de « Métrés »), recalculé à chaque modification du plan : espace et version de la bibliothèque ; réglage des parts de K1 pour ce projet (valeurs du classeur signalées « exemple » tant qu'elles ne sont pas réglées) ; points à vérifier (éléments sans poste, avec un bouton qui les sélectionne dans le plan ; postes sans prix ; lignes provisoires ; remarques sur les règles) ; lignes par lot (poste, quantité dans l'unité du poste D23-17, prix de vente, montant) ; **origine** de chaque ligne (quantité du métré, règle, perte, bouton « Sélectionner ») ; **correction à la main** « Retirer de ce poste », listée et annulable ; totaux HT, TVA, TTC et décomposition ; **versions** (figer en brouillon ou en définitif, définitif bloqué s'il manque un prix, « à jour » ou « a changé » selon l'empreinte, comparaison avec l'état actuel).
- Membre de l'espace : lecture seule. Personne hors de l'espace : postes et quantités de la dernière version figée, sans prix (D23-8).
- Vérifié dans Chromium (mode local) sur la maison d'exemple R+1, avec la bibliothèque importée et une règle « murs → CAT-05-001 » : 243,68 m² × 40 262,0 Ar = 9 811 100 Ar HT (contrôlé à la main), TVA 1 962 300 Ar, TTC 11 773 400 Ar, débours 8 899 000 Ar, 37 éléments sans poste signalés ; version 1 figée, « À jour », comparaison sans différence. Les 5 messages React « unmount a root » de la console existaient déjà sans le DQE (éditeur de Pascal).
- Build, lint, 3 528 tests OK ; doublons 0,86 %.

### 2026-11-27 — M23 · 23.5 Versions du devis : fait (écran en 23.6)

- **Devis d'un projet** (table `estimates`, propriété de l'espace, D23-9) : parts de K1 réglées dans ce devis (D23-13) et corrections à la main. Seul un admin de l'espace **qui a accès au projet** peut le créer ou le modifier.
- **Versions figées** (`estimate_versions`, `src/features/pricing/estimateVersions.ts`) : copie de chaque ligne (quantité, prix brut, prix de vente, montant, sources) et des totaux ; **jamais modifiées ni supprimées** ; numérotées 1, 2, 3… ; empreinte de ce qui a produit le DQE (quantités du métré, prix, règles, corrections, réglages) : même révision + même bordereau = même empreinte. **« Définitif » refusé s'il reste un poste sans prix**, dans le code et par la base (gate G6).
- **Comparaison de deux versions** : poste ajouté, retiré, quantité ou prix changé, écart de montant, écart des totaux.
- **Personne hors de l'espace** (D23-8) : fonction `project_estimate_outline` qui ne renvoie que postes, désignations et quantités, aucun prix.
- Banc d'essai PGlite chargé désormais avec le **schéma complet** de l'application (projets, membres) : 60 contrôles sur 60.
- Build, lint, 3 528 tests OK ; doublons 0,87 %.

### 2026-11-27 — M23 · 23.4 Calcul des montants : fait

- **Décision de l'utilisateur D23-19** : K1 appliqué **dans chaque prix** (comme le DEVIS_AUTOMATIQUE du classeur) ; sous le total, une décomposition débours sec / frais, bénéfice et aléas. Ordre des arrondis écrit dans `docs/phases/M23-decisions.md`.
- **Calcul exact** (`src/features/pricing/estimate.ts`) : quantité d'un poste = somme des quantités de métré (perte comprise) convertie dans l'unité du poste, arrondie (2 décimales en m², ml, m ; 3 en m³ ; entier en U, FFT…) ; prix de vente = prix brut × (1 + A1)(1 + A2)(1 + A3) au dixième ; montant = quantité × prix de vente à la centaine d'Ar supérieure ; TVA à la centaine supérieure ; lots par catégorie de poste ; lignes sans prix et lignes provisoires comptées. Tout en `bigint`, aucun flottant.
- **Gate G6, exemple** : 13,11 m² × 45 000,0 Ar/m² = 589 950 Ar → **590 000 Ar HT**, TVA 118 000 Ar, TTC 708 000 Ar (test). Avec les valeurs du classeur, K1 = 1,1025 et 45 000,0 → 49 612,5 Ar.
- **Chaîne complète** (`projectEstimate.ts`) : métré de M21 → règles → montants. Testée sur un plan qui passe par la scène Pascal : mur de 5 000 × 3 000 mm avec une fenêtre de 1 000 × 1 200 mm → 13,80 m² → 621 000 Ar.
- Build, lint, 3 523 tests OK ; doublons 0,87 %. Pas d'écran dans ce sous-lot (le panneau DQE est 23.6).

### 2026-11-27 — M23 · 23.3 Règles élément → postes : fait

- **Règle de l'espace** (`src/features/pricing/rules.ts`, D23-15) : une quantité de métré de M21 (famille « métré », jamais recalculée), un filtre sur l'élément (matériau du mur, matériau et épaisseur de la couche, épaisseur du mur, type d'ouverture), un poste et une perte. Plusieurs postes par élément (maçonnerie, enduit, peinture) ; **une même quantité n'entre jamais deux fois dans un même poste** (doublon écarté et signalé). Unité du poste contrôlée (m² pour une surface, m³ pour un volume, ml ou m pour une longueur, U / FFT / Lot / Ferme / Paire pour un nombre).
- **Corrections à la main** dans un projet (`QuantityOverride`) : poste remplacé, quantité retirée, ligne ajoutée, chacune tracée ; logique prête et testée, écran avec le panneau DQE (23.6). **Couverture** : éléments avec des quantités mais sans aucun poste.
- **Base** : table `pricing_rules` (lecture par les membres, écriture par les admins, poste retiré → règle gardée sans poste). Banc d'essai PGlite : 48 contrôles sur 48.
- **Écran** : onglet « Règles » de la bibliothèque (liste, ajout, modification, activation, suppression ; choix du poste avec recherche). Vérifié dans Chromium sur la bibliothèque importée : poste en FFT refusé pour une surface, règle « Maçonnerie en brique, ≥ 200 mm → CAT-05-001 (m²), perte 5 % » enregistrée, désactivation gardée après rechargement.
- Build, lint, 3 512 tests OK ; doublons 0,88 %.

### 2026-11-27 — M23 · 23.2 Import des prix : fait

- **Lecteur XLSX maison** (`xlsxRead.ts`, avec `fflate` déjà installé, aucune nouvelle dépendance) : nombres gardés en texte exact, valeurs calculées d'Excel, limites de taille, aucun contenu exécuté.
- **Import du classeur « Expert BTP »** (`importWorkbook.ts`), colonnes trouvées par leur en-tête : MTX (TTC livré → HT), MTL et MO (en HT, y compris le second tableau de chaque feuille), BIBLIOTHEQUE_TRAVAUX + SDP (prix brut = débours sec, sous-détail gardé). **Import CSV** (`importCsv.ts`) en plus.
- **Décisions de l'utilisateur prises en cours de route (2026-11-26)** : D23-16 les 53 matériaux dont le classeur donne un HT égal au TTC (bois, sable, gravillons…) sont marqués « sans TVA » (HT = TTC) ; D23-17 dans le DQE, la quantité s'écrit dans l'unité du poste (ml, m²…), seule exception à la règle des mm (CLAUDE.md et 02-ARCHITECTURE mis à jour). Choix de Claude D23-18 : matériel sans location par jour → prix HT de la feuille avec son unité.
- **Rapport de lecture** (`importReport.ts`) : chaque correction et chaque manque, regroupés avec exemples (bloquant / à vérifier / information). **Plan d'import** (`importPlan.ts`) : ajouts, mises à jour (même ligne, historique gardé), retraits par source, lignes à la main jamais touchées. **Application d'un bloc** dans la base (`apply_price_import`, refus si la version a changé) et journal des imports.
- **Classeur réel de l'utilisateur** (fichier local, jamais versionné) : 903 matériaux, 86 lignes de matériel, 20 de main-d'œuvre, 320 postes tous chiffrés avec sous-détail, date des prix 01/10/2026 ; seuls 4 matériaux à 0 Ar restent « sans prix ». Essai local `importWorkbook.local.test.ts`, sauté ailleurs.
- **Écran** : bouton « Importer » (admins), aperçu avant application, journal des imports dans Réglages. Vérifié dans Chromium avec le vrai classeur : lecture 0,4 s, 1 329 lignes ajoutées, version 2, sable « sans TVA » à 70 000,0 Ar, réimport identique → « Rien à changer », aucune erreur.
- **Script SQL** (`supabase/m23-pricing.sql`) exécuté dans PGlite : 42 contrôles sur 42 (accès, import atomique, version dépassée refusée, lignes à la main gardées, journal).
- Build, lint, 3 505 tests OK ; doublons 0,87 %.

### 2026-11-26 — M23 · 23.1 Espaces et bibliothèque de prix : fait

- Feu vert de l'utilisateur pour le plan du jalon (« prix brut » = débours sec HT, confirmé implicitement par le feu vert).
- **Montants exacts** (`src/features/pricing/money.ts`) : prix en dixièmes d'Ariary (`bigint`) ; lecture d'un nombre de tableur sans calcul flottant ; prix saisi refusé au-delà d'une décimale ; HT = TTC ÷ (1 + TVA) au dixième le plus proche ; arrondi d'un montant à la centaine d'Ar supérieure (153 555 → 153 600 ; 589 950 → 590 000).
- **Modèle et contrôles** (`model.ts`, `validate.ts`, `units.ts`) : matériaux, matériel, main-d'œuvre, postes avec sous-détail ; désignation et unité obligatoires ; « sans prix » signalé ; unités normalisées (« m2 » → « m² »).
- **Base** (`supabase/m23-pricing.sql`, à lancer par l'utilisateur) : espaces, membres (admin / membre, départ sans effacement), invitations par lien, bibliothèque, lignes, postes, historique par ligne écrit par la base. Le taux de TVA ne change que par une fonction qui recalcule aussi les HT tirés d'un TTC. **Script exécuté dans un vrai Postgres (PGlite, banc d'essai hors dépôt) : 28 contrôles d'accès sur 28 conformes**, script relançable.
- **Dépôts** : Supabase (connecté) et local (sans compte, un seul espace, IndexedDB).
- **Page « Bibliothèque de prix »** (`/prix`, icône pièces sur l'accueil) : onglets Matériaux, Matériel, Main-d'œuvre, Postes de travaux (sous-détail dépliable), Membres (liens d'invitation, rôles, départ), Réglages (nom, TVA, date des prix) ; historique de chaque ligne ; lecture seule pour un membre. Page `/espace/<jeton>` pour rejoindre un espace.
- Vérifié dans Chromium (mode local) : TTC 42 000 → HT 35 000,0 ; « 42 000,55 » refusé ; TVA 10 % → 38 181,8 et ligne d'historique ; poste saisi à la main ; données gardées après rechargement ; aucune erreur dans la console.
- Build, lint, 3 483 tests OK ; doublons : aucun dans le nouveau code (factorisé), total 0,95 %.

### 2026-11-26 — M23 · 23.0 Décisions : fait

- L'utilisateur a demandé de commencer M23. Quatre réponses ferment 23.0 (`docs/phases/M23-decisions.md`, D23-11 à D23-15) : postes du classeur avec leur sous-détail ; **prix d'un poste = prix brut (débours sec HT)**, modifié par un admin ou par réimport, jamais recalculé tout seul ; **K1 réglé dans chaque devis** (les valeurs du classeur ne sont qu'un exemple) ; matériel et main-d'œuvre en HT ; lien élément → postes par des règles de l'espace, avec correction à la main.
- Vérifié dans le classeur : le « prix de référence » d'un poste contient déjà le coefficient K = 1,1 de son sous-détail (SDP-001 : 7 844 766,67 × 1,1 → 8 629 300 Ar) ; il n'est donc pas utilisé.
- Exemple du gate G6 passé en Ariary dans la roadmap : 13,11 m² × 45 000,0 Ar/m² = 589 950 Ar → 590 000 Ar HT.
- Plan complet du jalon (23.1 à 23.8) écrit dans `docs/phases/M23-plan.md`, en attente du feu vert. Aucun code.

### 2026-11-24 — M22 : validé par l'utilisateur, gate G5 validé

- L'utilisateur a fait l'essai de fin de jalon (export IFC de la grande maison, import IFC avec bilan, HOUSE-01 dans 2 visionneuses) : « tout est validé ». Gate G5 validé. Restent ouverts : G4 (revue d'un métreur), G3 (revue d'un professionnel) ; relecture des codes Uniclass par un praticien BIM et essai Revit notés dans les Idées.

### 2026-11-24 — M22 · 22.5 : contrôles et gate G5

- `tools/ifc/fabrics-g5.ids` (IDS 1.0 : niveaux, murs avec matériau, quantités, Uniclass, `Fabrics.ElementId`, dalles, portes, fenêtres, pièces) ; `tools/ifc/check_g5.py` (schéma, IDS par ifctester, quantités écrites ↔ géométrie relue, niveaux, matériaux, classification) ; `npm run check:ifc` (`scripts/ifc-g5.mjs`, fichiers et rapport dans `tmp/ifc-g5/`). `ifctester==0.9.0` ajouté à `tools/ifc/requirements.txt` (module IDS d'IfcOpenShell, LGPL, environnement Python local seulement).
- Résultat : HOUSE-01, HOUSE-02, plan d'exemple, grande maison : schéma IFC4 0 erreur, IDS 6/6, niveaux identiques, tous les murs avec matériau, tous les objets classés ; quantités ↔ géométrie dans 0,1 % (au plus 0,020 %), sauf 6 murs « provisoires » de la grande maison (raccords de 3 murs, M21).
- `reimport.test.ts` : export puis réimport (web-ifc) des quatre plans : mêmes niveaux ; murs, ouvertures, pièces (surface et périmètre) identiques ; dalles à moins de 0,1 %.
- Corrigé grâce au réimport : la dalle de niveau ajoutée à l'export faisait arrêter les murs du dessous sous elle (HOUSE-02 : 2,80 m au lieu de 3,00 m). Elle est maintenant découpée autour des murs du dessous et percée des trémies (`scene/levelSlabNode.ts`, règle des fixtures), avec 0,2 mm de marge (arrondi des découpes de Pascal) et `boundary: 'auto'` (contour non recalé par Pascal) ; quantité de M21 répartie au prorata des morceaux.
- Corrigé : les trémies dessinées dans Pascal (`floor-opening`) sont déduites des dalles de leur niveau dans les métrés (`scene/slabMeasures.ts`, test).
- Rapport : `docs/phases/M22-report.md` ; liste de non-régression (M22) ; `docs/05-INSTALLATION.md`.
- Baseline : `export.ifc` régénérés (commit séparé).

### 2026-11-24 — M22 · 22.4 : import IFC contrôlé

- Accueil : bouton « Importer un IFC ». Le fichier est lu par la conversion de Pascal (web-ifc, fichiers `.wasm` servis par Vite) et devient un **nouveau projet Plan** (D22-6) ; aucun projet existant n'est modifié.
- Bilan (`src/features/ifc/importReport.ts`) : le fichier est relu (texte STEP) et chaque objet est retrouvé dans la scène par son GlobalId : repris comme élément de plan, repris avec sa seule forme 3D (ni modifiable comme élément, ni dans les métrés), percement repris avec sa porte ou fenêtre, ou **non importé** (classe, nom, GlobalId). S'y ajoutent les éléments créés par la conversion (trémies…) et ce que la conversion a dû remplacer (unité, origine, altitudes illisibles). Affiché après l'import, téléchargeable en texte.
- `scene/foreignScene.ts` : le terrain et le bâtiment de la scène importée prennent les identifiants de Fabrics et les réglages d'un plan neuf ; rien d'autre ne change (identifiants et GlobalId d'origine gardés). `fromFabrics.ts` : `documentSettingsOf` (même calcul qu'avant, partagé).
- Tests (`importIfc.test.ts`, conversion réelle par web-ifc) : aller-retour HOUSE-01, HOUSE-02, grande maison sans aucune perte (mêmes GlobalId) ; IFC d'essai de Pascal (poutres en forme seule, assemblage non importé signalé ; percement compté avec sa porte ; objet générique en forme seule) ; un objet inconnu glissé dans un fichier est listé avec sa classe, son nom et son GlobalId.
- `architecture.test.ts` : l'ancien `features/export/ifc` est un module retiré (interdit à l'import).
- Vérifié : build (fichiers `web-ifc*.wasm` dans `dist/assets`), lint, tests ; le test de durée « 600 murs » a échoué une fois machine chargée, réussi seul (problème connu).

### 2026-11-24 — M22 · 22.3 : GlobalId stables

- Le GlobalId d'un objet IFC vient de l'identifiant de son nœud (enregistré avec le projet), ou du GlobalId d'origine d'un élément importé (`metadata.globalId`). Ceux des propriétés, quantités et relations viennent du même nœud.
- `src/features/ifc/globalIds.ts` : table élément Fabrics ↔ nœud ↔ classe ↔ GlobalId (un mur à plusieurs côtés : une ligne par côté).
- `globalIds.test.ts` (HOUSE-01, HOUSE-02, grande maison) : deux exports à des dates différentes donnent les mêmes GlobalId partout, tous distincts ; idem après enregistrement et rechargement ; déplacer un mur ne change aucun GlobalId ; un élément importé garde le sien.
- Incident Git : le commit `2554589` d'une autre session (M23) a emporté la suppression de l'ancien export IFC que j'avais préparée ; la branche ne compilait pas entre ce commit et `7648479`. Désormais, préparation et commit en une seule commande.

### 2026-11-24 — M22 · 22.2 : export IFC4 par Pascal

- Le bouton « Exporter » → IFC (nom affiché « IFC (BIM) ») et le bouton IFC des réglages de Pascal écrivent le même fichier : l'exportateur IFC4 de Pascal, avec les ajouts de Fabrics (`src/features/ifc/exportIfc.ts`, branchés par `src/pascal/ifcExportHost.ts` via le nouveau crochet `setIfcExportHost` de l'éditeur de Pascal) :
  - pièces au contour tracé (D22-5) : surface de l'`IfcSpace` = surface des métrés ;
  - dalle de chaque niveau sans dalle dessinée, en `IfcSlab` (surface et volume de M21) ;
  - quantités de M21 dans `Qto_WallBaseQuantities`, `Qto_DoorBaseQuantities`, `Qto_WindowBaseQuantities`, `Qto_SpaceBaseQuantities`, `Qto_SlabBaseQuantities` (m, m², m³) ; un mur à plusieurs côtés porte ses quantités côté par côté (`segmentQuantities.ts`, somme = mur entier, testé) ;
  - propriété `Fabrics` (ElementId, QuantityRules `geo-2026.1`, QuantityStatus) ; codes Uniclass 2015 ; annotations exclues.
- Après l'export, la fenêtre affiche les remarques (objets sans forme 3D laissés de côté, éléments aux quantités provisoires) au lieu de se fermer en silence.
- Sans vue 3D montée, l'export part de la scène seule : toitures, escaliers et mobilier sont alors signalés « sans forme 3D ».
- Ancien export IFC2x3 (`src/features/export/ifc.ts` et son test) supprimé (D22-4). **R14 fermé** : `tools/ifc/validate.py` → 0 erreur sur le plan d'exemple et la grande maison.
- `wallContacts.ts` : un raccord en T dit à quel bout du mur il se trouve (`overlapAtEnd`), pour les quantités côté par côté.
- `tmp/` exclu de Vitest (brouillons hors de Git ; `tmp/m20-dev/ifc.test.ts` importait l'ancien export).
- Pascal (`FABRICS_CHANGES.md`) : crochet `setIfcExportHost` dans `editor/src/lib/ifc-export.ts`.
- Baseline : fichiers `export.ifc` régénérés (commit séparé).

### 2026-11-24 — M22 · 22.1 : classes IFC et correspondances

- `src/features/ifc/classes.ts` : table nœud Pascal → classe IFC4, code Uniclass 2015 (table EF), jeu de quantités et catégorie Revit attendue ; annotations non exportées (cotes, coupes, trames, séparations). `classes.test.ts` : l'exportateur de Pascal écrit bien ces classes sur HOUSE-01, HOUSE-02, le plan d'exemple et la grande maison, avec un GlobalId valide par produit.
- Pascal (`FABRICS_CHANGES.md`, M22) : l'exportateur IFC reçoit des ajouts de l'hôte (propriétés, quantités, classification) et rend, par nœud, la classe et le GlobalId écrits. Test `tests/export-extensions.test.ts` ; les 23 échecs de `ifc-converter` lancés sans les IFC d'exemple sont ceux de la référence.
- `@pascal-app/ifc-converter/export` utilisable depuis Fabrics (alias Vite et chemin TypeScript vers la version compilée, comme `core`).
- Constat : toitures, escaliers, mobilier et plateformes ne sont exportés qu'avec la forme 3D de la vue ; les dalles de niveau de Fabrics n'existent pas dans la scène (ajoutées à l'export en 22.2).
- Incident : `npx biome` a téléchargé et lancé un paquet npm sans rapport (`biome@0.3.3`) au lieu du Biome de Pascal ; aucun fichier du projet modifié (`git status` vérifié). Biome de Pascal : `packages/pascal/node_modules/.bin/biome`.
- Vérifié : build, lint, 3435 tests Fabrics.

### 2026-11-24 — M22 · 22.0 : décisions IFC

- Essai de M21 dans le navigateur : OK (utilisateur, 2026-11-24). Gate G4 encore ouvert : revue d'un métreur.
- Feu vert pour M22. Décisions D22-1 à D22-8 choisies par l'utilisateur, option recommandée partout (`docs/phases/M22-decisions.md`) : IFC4 ; Uniclass 2015 ; deux visionneuses gratuites (pas d'essai Revit) ; ancien export IFC2x3 remplacé par celui de Pascal ; pièces au contour Fabrics ; import en nouveau projet Plan ; quantités de M21 dans l'IFC ; petit IDS au gate G5.

### 2026-11-24 — M21 : contradiction « ouverture qui dépasse » tranchée (option A)

L'utilisateur garde le fonctionnement livré : une ouverture qui dépasse en hauteur ne déduit que sa
partie dans le mur ; une ouverture qui dépasse en longueur est rejetée (décision 1 d'EDGE-01
inchangée). Le texte du critère G4 est précisé dans `docs/03-ROADMAP.md` ; rapport et commentaire
du test du gate mis à jour. Aucun calcul changé.

### 2026-11-24 — M21 · 21.8 : vérification et gate G4
- `quantities/gateG4.test.ts` : les critères du gate G4 réunis (mur témoin, union, ouverture qui dépasse en hauteur et en longueur, tolérances sur HOUSE-01 et HOUSE-02, sources et règle sur chaque ligne exportée). Cas `missing-material` d'EDGE-01 : test « à faire » devenu vrai test (reste `ifc-nested-placements`, M22).
- Rapport : `docs/phases/M21-report.md` ; liste de non-régression M21 ; registre des capacités (traçabilité : EXISTANT).
- **Contradiction signalée** (rapport) : critère G4 « ouverture qui dépasse : partie contenue déduite » contre décision 1 d'EDGE-01 « rejet ». Appliqué : rejet en longueur (EDGE-01), partie contenue en hauteur. Choix à confirmer par l'utilisateur.
- `npm run check:all` : build, lint, 3426 tests Fabrics OK ; tests Pascal arrêtés par 3 échecs de `@pascal-app/core` dus à la charge (relancé seul : identique à la référence) ; lint Pascal et doublons OK (40 clones, inchangé). `npm run check:ifc-quantities` OK.
- Reste pour fermer le gate G4 : essai de l'utilisateur dans le navigateur, choix sur la contradiction, revue d'un métreur (seuils, tolérances, règles).

### 2026-11-24 — M21 · 21.7 : contrôles qualité
- `measurements/qualityChecks.ts`, ajouté au système d'avertissements existant (`warnings.ts`, un seul système) :
  - **géométrie incohérente** : ouverture plus haute que son mur, ouverture sans largeur ou sans hauteur, contour de pièce qui se croise, toiture impossible à calculer (s'ajoutent aux contrôles existants : mur de hauteur nulle, sans épaisseur, réduit à un point, ouverture hors du mur, chevauchements, murs disjoints ou superposés) ;
  - **propriétés manquantes** : mur sans matériau ni composition (cas « missing-material » d'EDGE-01), pièce sans nom ;
  - **unités incompatibles** : épaisseur, hauteur, largeur ou hauteur d'étage hors des valeurs plausibles en mm (ex. épaisseur 0,2 ou 15) : saisie probable en m ou en cm.
- Panneau Métrés : liste « Contrôles qualité » dans le bloc Quantitatif (cliquer un point sélectionne l'élément) ; aussi dans la fenêtre Exporter, comme les autres avertissements. Rien n'est corrigé ni bloqué.
- Tests : `qualityChecks.test.ts`. Les tests « aucun avertissement » des fixtures et des plans d'exemple ignorent maintenant « mur sans matériau » : ces plans ont des murs sans matériau (HOUSE-01, T1, T2 ; 5 cloisons de la grande maison), signalés à juste titre (voir Idées).
- Build, lint, tests OK ; baseline inchangée.

### 2026-11-24 — M21 · 21.6 : comparaison avec IfcOpenShell
- `npm run check:ifc-quantities` (`scripts/ifc-quantities.mjs`) : quatre jeux d'échange (HOUSE-01, HOUSE-02, plan d'exemple, grande maison) passés par la scène Pascal, exportés en IFC4 par l'exportateur de Pascal (chargé depuis ses sources, dans un test : `quantities/ifcExchange.test.ts`), puis relus par IfcOpenShell (`tools/ifc/compare_quantities.py`). Rapport : `tmp/ifc-exchange/report.md`. Compte rendu : `docs/phases/M21-ifc-comparison.md`.
- Résultats : volumes nets des murs et surfaces des portes et fenêtres **identiques** (0,000 %) sur HOUSE-01, HOUSE-02 et le plan d'exemple ; 18 murs sur 21 identiques sur la grande maison. Les 3 autres s'écartent de 0,18 à 0,60 % : la règle à l'axe compte deux fois une pointe d'angle quand trois murs se rejoignent au même point. Ces volumes et faces sont maintenant **provisoires** (`multiWallJunction`, `status.ts`), donc le quantitatif de la grande maison est déclaré incomplet.
- Pièces : l'IfcSpace de Pascal reprend la zone recalculée sur l'axe des murs (5 à 20 % plus grande que la surface au tracé de Fabrics) : différence de convention, listée pour information ; à traiter en M22 (Idées).
- `fixtureDocuments.ts` : plans HOUSE-01 / HOUSE-02 partagés entre les tests (sortis de `fixtures.test.ts`).
- **Écart voulu de la baseline** : quantitatif Exécution de la grande maison (statuts provisoires, synthèse « incomplet »). Référence mise à jour dans un commit séparé.
- Build, lint, tests OK ; `npm run check:ifc-quantities` OK.

### 2026-11-24 — M21 · 21.5 : recalcul ciblé
- `quantities/incremental.ts` : après une modification, seules les quantités des éléments touchés sont recalculées, les autres sont reprises telles quelles (même objet). Éléments touchés : ajoutés, supprimés ou changés (empreinte de leurs données et de leur nom affiché), puis leurs dépendants (un mur → ses ouvertures, les murs qui le touchent, les pièces de son niveau ; une ouverture → son mur et les pièces du niveau ; escalier, toiture, plateforme → les pièces). Les métrés ne sont refaits que pour les niveaux concernés (`computeBuildingMeasurements` accepte les niveaux à reprendre). Niveaux ou seuils de métré changés : recalcul complet. Dalles et éléments non pris en charge : toujours recalculés.
- Panneau Métrés : le bloc Quantitatif utilise ce recalcul ciblé (`createQuantityTracker`).
- Tests (`incremental.test.ts`) : pour chaque modification (mur allongé, fenêtre ajoutée, mur supprimé, pièce renommée, suite de modifications), le recalcul ciblé donne **exactement** le même quantitatif qu'un recalcul complet ; les murs des autres niveaux ne sont pas recalculés.
- **Défaut corrigé, trouvé par ces tests** : les plinthes d'une pièce déduisaient aussi les portes du niveau du dessus placées au même endroit en plan. Seules les portes du même niveau sont déduites maintenant. **Écart voulu de la baseline** : plinthes du quantitatif Exécution des deux plans d'exemple (ex. Séjour 16 800 → 18 600 mm). Référence mise à jour dans un commit séparé.
- Build, lint, tests OK.

### 2026-11-23 — M21 · 21.4 : statut des quantités
- `quantities/status.ts` : chaque quantité a un statut et une raison : **données manquantes** (mur de hauteur nulle, ouverture hors de son mur — rejetée, EDGE-01 —, escalier sans niveau au-dessus, toiture impossible), **provisoire** (ouverture plus haute que le mur — seule la partie dans le mur est déduite —, mur qui porte une ouverture rejetée, escalier trop court, pan de toiture découpé ou recouvert, trémie qui déborde), **non pris en charge** (élément de la scène que le métré ne quantifie pas : une ligne « Élément non pris en charge » par élément, D21-5), **validé** sinon.
- Synthèse : « Quantitatif complet » seulement si tout est validé, sinon « Quantitatif incomplet, à ne pas utiliser tel quel » avec le nombre de chaque statut. En tête du bloc Quantitatif du panneau (encadré vert ou orange) et du tableau exporté ; nouvelle colonne « Statut » ; pastille de couleur par ligne.
- Escaliers sans niveau au-dessus : contremarches et girons à 0, statut « données manquantes » (au lieu d'être absents).
- **Écart voulu de la baseline** : colonne « Statut » et synthèse du tableau « Quantitatif » des exports Exécution (plans d'exemple : quantitatif complet, 268 et 576 quantités). Référence mise à jour dans un commit séparé.
- Tests : G4 complet, hauteur nulle, ouverture hors du mur, ouverture plus haute que le mur, élément non pris en charge, synthèse du tableau. Build, lint OK.

### 2026-11-23 — M21 · 21.3 : traçabilité
- `quantities/trace.ts` : chaque quantité porte sa trace (éléments sources sous leur nom affiché, dimensions utilisées, déductions — ouvertures déduites ou gardées sous le seuil, union quand elles se chevauchent, portes des plinthes, murs du dessous et trémies des dalles). Règle et version : déjà sur la quantité (21.2).
- Tableau « Quantitatif » (`quantities/quantityTable.ts`) : une ligne par quantité de métré avec niveau, élément, quantité, valeur, unité, règle (et seuil), version, sources, dimensions, formule, déductions. Ajouté aux exports **Exécution** (CSV, Excel — nouvel onglet —, PDF). m³ au millième (D21-6) : nouveau format Excel `0.000`.
- Panneau Métrés : bloc « Quantitatif » (`QuantitiesSection.tsx`) ; un clic sur une ligne ouvre son détail et sélectionne l'élément.
- **Écart voulu de la baseline** : exports Exécution (nouvel onglet / tableau « Quantitatif ») et styles Excel de tous les classeurs (format `0.000` ajouté). Aucun chiffre existant ne change. Référence mise à jour dans un commit séparé.
- Tests : trace du mur témoin G4, ouverture sous le seuil, union, tableau (valeurs arrondies), chaque quantité a une source. Build, lint OK.

### 2026-11-23 — M21 · 21.2 : règles versionnées
- `quantities/rules.ts` : jeu de règles « avant-métré à la française » version `fr-2026.1` (géométrie : `geo-2026.1`) ; chaque quantité porte sa règle (identifiant, version, seuil appliqué).
- Seuils de déduction des vides par catégorie (maçonnerie, enduits, peinture), 0 m² par défaut (D21-2), enregistrés avec le plan (`plan.takeoff`, mm² ; m² dans la scène Pascal). Réglage dans le panneau Métrés, bloc « Règles de métré » (`TakeoffRulesSection.tsx`).
- Nouvelles quantités de métré : enduits et peinture des faces des murs, tableaux des ouvertures (pourtour × épaisseur, D21-3), revêtement de sol, plafond, plinthes (portes de la pièce déduites).
- Dalles : dalles dessinées dans Pascal (`scene/slabMeasures.ts`, réutilisé) et dalle de niveau quand le niveau n'en a pas (emprise du niveau − murs du dessous qui la traversent − trémies ; `quantities/levelSlabs.ts`, emprise par `levelFootprintAreas` de `scene/siteMeasures.ts`, calcul de Pascal).
- `measurements.ts` : calcul des ouvertures isolé (`measureOpenings`, `deductedOpeningsArea`) pour servir aux métrés et au métré avec seuil, sans doublon ; chiffres inchangés.
- Tests : seuils, union avec seuil, tableaux, plinthes, aller-retour des seuils par la scène ; HOUSE-01 dalle 80 m² / 16 m³ ; HOUSE-02 volumes nets des murs 48,838 m³, dalles 146,74 m² / 29,348 m³ (test « à faire » de M18 devenu vrai test). Build, lint, 3384 tests OK, baseline identique.

### 2026-11-23 — M21 · 21.1 : deux familles de quantités
- Nouveau dossier `src/features/measurements/quantities/` (dans le module des métrés, pas de doublon) : `types.ts` (`QuantityResult` : famille `geometric` ou `takeoff`, code, grandeur, valeur exacte en mm / mm² / mm³ / nombre, éléments sources, couche, niveau), `geometric.ts` (métrés actuels mis dans ce format, aucun nouveau calcul de forme), `takeoff.ts` (quantités de métré ; avec la convention par défaut D21-2 / D21-4, mêmes valeurs que la géométrie).
- Nouvelle quantité : volume brut des murs (volume net + ouvertures × épaisseur).
- Tests : `quantities/quantities.test.ts` (mur témoin G4 : 15,00 / 1,89 / 13,11 m², 2,622 m³ ; sommes des quantités = totaux des métrés du plan d'exemple et de la grande maison passés par la scène) ; `scene/migrate/fixtures.test.ts` : le test « à faire » des volumes de HOUSE-01 est devenu un vrai test (ENV brut 21,12 m³, net 19,394 m³ ; cloisons 5,13 m³). La dalle de HOUSE-01 reste « à faire » (21.2).
- Rien ne change à l'écran ; baseline identique. `docs/capabilities.md` et `docs/02-ARCHITECTURE.md` à jour. `npm run check:all` réussi (3375 tests Fabrics, tests Pascal, lint, doublons).

### 2026-11-23 — M21 · 21.0 : décisions de métré
- Feu vert de l'utilisateur pour M21. Décisions proposées en options et **choisies par l'utilisateur** (option recommandée partout), dans `docs/phases/M21-decisions.md` :
  usages français (D21-1) ; seuils de déduction des vides réglables par catégorie, 0 m² par défaut, à faire confirmer par un métreur (D21-2) ; tableaux des ouvertures en quantité séparée (D21-3) ; longueur des murs à l'axe, inchangée (D21-4) ; toute la scène, éléments natifs de Pascal compris (D21-5) ; tolérances ±1 mm et < 0,1 % provisoires (D21-6) ; comparaison avec un IFC4 de l'exportateur de Pascal, relu par IfcOpenShell (D21-7) ; traçabilité dans le panneau Métrés et les exports CSV / XLSX (D21-8).
- Aucun code modifié.

### 2026-11-23 — M20 : essai de fin de jalon
- L'utilisateur a fait l'essai de fin de M20 dans le navigateur : **tout est correct**. Reste pour fermer le gate G3 : la confirmation de la mesure à la règle sur une feuille imprimée à 100 % et la revue d'un professionnel (`docs/phases/M20-review-checklist.md`).

### 2026-11-23 — M20 : choix D20-16 à D20-19 validés
- L'utilisateur valide les styles graphiques (D20-16), les sorties vectorielles (D20-17), les révisions (D20-18) et l'étude de `ifcopenshell.draw` (D20-19). Reste avant de fermer le gate G3 : l'essai dans le navigateur, l'impression à 100 % et la revue d'un professionnel.

### 2026-11-23 — M20 · 20.9 : vérification et gate G3
- Nouveau test : un mur de ROOMIT déplacé dans Pascal met à jour le plan du RDC, son plafond, la coupe, les façades nord et sud et les nomenclatures. Les feuilles du R+1 et de la toiture ne bougent pas.
- **Liste de contrôle** pour la revue d'un architecte ou d'un ingénieur : `docs/phases/M20-review-checklist.md`. **Rapport** : `docs/phases/M20-report.md`.
- `npm run check:all` : build, lint et tests de Fabrics réussis. Les tests de Pascal ont 3 échecs de plus que la référence Windows : ce sont des dépassements de délai sur ce poste, et ils réussissent avec un délai plus long (le code de Pascal n'a pas changé).
- Reste à faire avant de fermer le gate G3 : l'essai dans le navigateur et l'impression à 100 % par l'utilisateur, la revue d'un professionnel, et la validation des choix D20-16 à D20-19 (faite le 2026-11-23).

### 2026-11-22 — M20 · 20.8 : étude de `ifcopenshell.draw`
- Essai d'IfcOpenShell pour dessiner les plans et façades à partir des fichiers IFC de ROOMIT (exports de Fabrics et de Pascal). L'échelle est juste, mais il n'y a ni cotes, ni repères, ni cartouche, ni hachures, et l'outil plante avec ses réglages par défaut (version 0.9.0.post1).
- **Les feuilles restent dessinées par Fabrics.** L'outil est gardé pour contrôler un export IFC, hors de l'application : `tools/ifc/draw_plans.py` (un SVG par niveau et par façade).
- Rapport : `docs/phases/M20-ifcopenshell-draw.md`. Choix proposé par Claude, à valider (D20-19).

### 2026-11-22 — M20 · 20.7 : révisions du jeu de feuilles
- Les feuilles du projet forment un **jeu numéroté** (01 Plan de niveau RDC, 02 Plan de niveau R+1, 03 Plan de toiture…). Le n° proposé dans la fenêtre d'export suit cet ordre ; un n° saisi à la main est gardé.
- Émetteur, indice, statut et n° saisis sont **enregistrés avec le projet** : chaque version de l'historique garde les siens.
- Dans l'**aperçu d'une version**, le bandeau indique l'indice et le statut du jeu, et quelles feuilles ont changé depuis la version précédente.
- Choix proposés par Claude, à valider (D20-18). Test `features/sheets/sheetSet.test.ts`.

### 2026-11-22 — M20 · 20.6 : PDF et SVG à l'échelle
- Les PDF de feuilles **intègrent leur police** (Liberation Sans, licence libre OFL) : le texte s'affiche et s'imprime à l'identique sur tous les postes, et reste cherchable et copiable.
- Nouveau bouton **« Exporter en SVG »** dans la fenêtre d'export : le dessin seul, à l'échelle choisie (1:50, 1:100, 1:200…), rangé en calques (Murs, Cotes, Mobilier…), pour le reprendre dans un logiciel de dessin.
- Choix proposés par Claude, à valider (D20-17). Test `export/vectorOutput.test.ts`.

### 2026-11-22 — M20 · 20.5 : styles graphiques
- Les PDF impriment les traits avec des **épaisseurs qui dépendent de l'échelle** (série ISO 128) : murs coupés à 0,5 mm à 1:50, 0,35 mm à 1:100, 0,25 mm à 1:200 ; éléments vus, filets et hachures plus fins.
- Chaque trait et chaque texte des plans a une **catégorie** (murs, poteaux, portes et fenêtres, escaliers, mobilier, pièces, cotes, repères, axes). Des cases **« Visibilité »** au-dessus des plans masquent une catégorie, ou les hachures, à l'écran et dans le PDF.
- **Masque blanc** sous les noms et surfaces des pièces : le mobilier ne passe plus à travers le texte.
- Choix proposés par Claude, à valider (D20-16). Test `building/views/graphicStyles.test.ts`.

### 2026-11-22 — M20 · 20.4 : feuilles au gabarit de la référence
- Tous les PDF de l'écran Vues prennent le **gabarit de Villa ROOMIT** (D20-3 : A) : colonne de droite avec le type de plan (« PLAN DE NIVEAU »), la rose des vents orientée selon le nord, les tableaux de la feuille (surfaces, légende) et, en bas, l'échelle graphique et le cartouche (projet, émetteur, titre, N° de plan / Indice, Date / Statut, Échelle / Format).
- Formats A4, A3, A2 et **A1** ; **A2 paysage par défaut**. La fenêtre d'export demande l'émetteur, le n° de plan, l'indice et le statut (Esquisse, APS, APD, PC, DCE, EXE).
- Les exports de l'éditeur gardent le cartouche en bande (M10).
- Test `export/sheetTemplate.test.ts` : la feuille R+1 de ROOMIT est relue dans le PDF (tous les traits du plan à ≤ 0,1 mm à 1:50 ; textes du cartouche et de la colonne présents).

### 2026-11-22 — M20 · 20.3 : nomenclatures et plan de plafond
- Écran Vues, onglet **« Nomenclatures »** : menuiseries regroupées par type identique (genre et style, L x H, allège, quantité, repères `P01`…, niveaux) et pièces (niveau, surface, hauteur sous plafond, faux plafond), tirées des métrés. ROOMIT : 9 fenêtres 1500 x 1000 (allège 1100) sur une ligne, « RDC, R+1 » ; 23 pièces.
- Onglet **« Plan de plafond … »** par niveau : murs, nom de la pièce, « HSP 2880 », « Faux plafond » s'il y en a un.
- Le plan de toiture (dérivé) est fait depuis 20.1b.
- Test `scene/roomitSchedules.test.ts` (dont : aucun conflit de texte sur ces feuilles).

### 2026-11-22 — M20 · 20.2 : annotations (conflits, axes, légende)
- **Détecteur de conflits d'annotations** (`dimensioning/conflicts.ts`) : deux textes qui se recouvrent à leur **taille imprimée** (le PDF imprime un texte à 7 pt au moins, 10 pt en gras : règle commune `export/printedText.ts`).
- Sur ROOMIT, 4 conflits trouvés et corrigés :
  - noms de pièces (« Bibliothèque », « Suite parentale ») sur un chiffre de cote : le nom, en gras, était imprimé 1,4 fois plus grand que ce que le placement prévoyait ; il est maintenant dessiné à cette taille (aussi à l'écran) et placé en conséquence ;
  - deux chiffres de cotes l'un sur l'autre : le second prend un autre rang (sous la ligne ou un rang plus haut).
- **Défaut du PDF corrigé** : les textes tournés (cotes verticales, texte de la flèche de pente) étaient décalés d'une demi-longueur par jsPDF. Les traits étaient justes, ce qui explique que les tests d'impression ne le voyaient pas.
- **Axes** du quadrillage porteur dessinés sur les feuilles de l'écran Vues (trait mixte, bulles, repères).
- **Légende des hachures** (« Brique »…) sous le tableau des surfaces du plan de niveau.
- Tests : `conflicts.test.ts`, `roomitAnnotations.test.ts` (0 conflit sur les plans de ROOMIT à 1:50), `axes.test.ts`, `legend.test.ts`, `layout.test.ts` mis à jour (étiquette plus haute). Baseline : positions et tailles de textes des planches mises à jour (commit séparé), même nombre de textes et de traits.

### 2026-11-22 — M20 · 20.1c : coupes et façades avec les toitures de Pascal
- Les façades et coupes lisaient déjà la scène ; il manquait les toitures de Pascal de plusieurs pans (ou à pente sous 1°), que la toiture de Fabrics ne sait pas représenter.
- `scene/view/nativeRoofs.ts` : un élément de toiture **dérivé** par pan (champ `nativeRoofs` de la vue, jamais enregistré ni compté dans les métrés). Le modèle du bâtiment les dessine (`computeRoof` accepte toute pente > 0 pour elles) ; les pièces dessous n'ont plus de toit plat automatique.
- Coupe : une seule cote « Faîtage » quand des faîtages sont à moins de 300 mm (4 cotes superposées sur ROOMIT avant).
- Tests `scene/roomitViews.test.ts` : façade sud et coupe A–A de ROOMIT avec la toiture ; **critère G3** : un étage de 2500 mm mesure 50,0 mm sur une façade imprimée à 1:50 (PDF relu). Références anti-régression inchangées.

### 2026-11-22 — M20 · 20.1b tâches 7 et 8 : exactitude imprimée, 20.1b terminé
- Test `src/features/export/printScaleR1.test.ts` : le PDF est relu (`export/printedPdf.ts`, aide commune avec le test du RDC). R+1 à 1:50 sur A2 (plan, cotes, tableau des surfaces) : **tous les traits** à leur place et à l'échelle (≤ 0,1 mm), 4304 mm = 86,08 mm. Toiture à 1:50 (15072 mm = 301,44 mm, 4504 mm = 90,08 mm), 1:100 sur A3 et 1:200 sur A4.
- **20.1b terminé.** `npm run check:all` et l'essai complet dans le navigateur sont faits à la fin de M20 (demande de l'utilisateur).

### 2026-11-22 — M20 · 20.1b tâche 6 : plan de toiture lié au modèle
- Demande de l'utilisateur : **terminer tout M20**, commit à chaque fin de tâche, tests dans le navigateur à la fin de M20. Les choix rencontrés en route sont pris par Claude (option la plus sûre), notés « proposé par Claude, à valider » dans `docs/phases/M20-decisions.md`.
- Test `src/features/scene/roofModelLink.test.ts` (ROOMIT, RDC + R+1) : pente des pans 1 → 2 % dans Pascal → flèches « Pente 2 % » ; débord 300 → 400 mm → cote d'ensemble 15072 → 15272 mm et surface en plan des métrés à jour ; le projet enregistré ne contient que la scène.
- Aucun code à changer : le plan de toiture est recalculé depuis les pans à chaque affichage.

### 2026-11-22 — M20 · 20.1b tâche 5 : surfaces de toiture sur demande, métrés sur la réunion des pans
- Choix de l'utilisateur **D20-15 : A** : une toiture de plusieurs pans de Pascal est comptée sur la réunion de ses pans.
- `src/features/scene/roofUnion.ts` (fonction pure, testée), branché dans `view/pascalQuantities.ts` :
  - chaque morceau du toit appartient au premier pan qui le couvre ;
  - surface réelle = surface en plan × facteur de pente du pan ;
  - égouts : seulement les bouts sur le vrai bord du toit, comptés une fois.
  - Exact pour plat, un pan, deux pans, croupe. Faîtage, arêtiers, ou forme à plusieurs pentes recouverte : remarque « Pans qui se recouvrent : faîtage et arêtiers à vérifier » dans les métrés.
  - Une toiture d'un seul pan, ou des pans qui ne se recouvrent pas : métrés inchangés.
- R+1 de ROOMIT : **161,12 m² en plan** (exactement l'aire du contour de la toiture), 161,13 m² réels, égouts 18065 mm. Avant : les 4 pans entiers, bandes de recouvrement comptées deux fois.
- **Validé par l'utilisateur le 2026-11-22.**
- Onglet « Plan de toiture » : case **« Afficher les surfaces de toiture »**, décochée par défaut (D20-10). Cochée : tableau « Toiture R+1 » à droite du plan (une ligne par pan, surface réelle) et « Total toiture » (surface réelle, surface en plan, égouts, périmètre du contour 56288 mm), lus dans les métrés.

### 2026-11-22 — M20 · 20.1b tâche 4c : cotes du plan de toiture
- Étape 4b validée par l'utilisateur.
- `src/features/dimensioning/roofChains.ts` (fonction pure, testée) : de chaque côté du plan de toiture, une chaîne dont les graduations sont les extrémités des bords tournés vers ce côté (elle suit les redents), puis la cote d'ensemble plus loin. Mêmes écarts (800 / 600 mm) et même dessin que les cotes des plans de niveau (`annotationGraphics`).
- R+1 de ROOMIT : **les 4 côtés redonnent exactement les cotes de la page 7** (au cm de la référence) : haut `4504 · 7777 · 2791` / `15072`, bas `5304 · 9768` / `15072`, gauche `1670 · 11402` / `13072`, droite `6688 · 5390 · 994` / `13072`.
- **Validé par l'utilisateur le 2026-11-22.**
- Pas encore : les cotes intérieures de la page 7 (`450 · 758`, `510 · 698 · 279`, `1021`, `669`, `519`, `99`), tracées à l'intérieur du contour ; ce qu'elles mesurent reste à lire sur la référence.

### 2026-11-22 — M20 · 20.1b tâche 4b : dessin du plan de toiture
- Choix de l'utilisateur **D20-14 : A** : l'escalier d'accès au toit est gardé sur le balcon, le canapé du balcon est retiré de ROOMIT-R1.
- **Écran Vues : onglet « Plan de toiture R+1 »**, pour chaque niveau qui porte une toiture de Pascal ; PDF avec flèche du nord.
- Lecture dans le modèle (`scene/view/roofPlanData.ts`) : contour de la toiture = réunion des pans, débords compris (fonction `union` de Pascal, aucune nouvelle dépendance) ; **une flèche par sens de pente**, au centre du plus grand pan de ce sens ; la pente en % vient du `pitch` des pans (jamais saisie).
- Dessin (`building/views/roofPlan.ts`, fonctions pures) : contour en trait fort, bord de 100 mm en second trait (décalage à angles vifs), flèches « Pente 1 % » avec le texte le long de la flèche (lu de bas en haut pour une flèche verticale, comme une cote). Pas de pièce ni de surface.
- **Escalier d'accès au toit** (`pascalRoofStairSymbols`) : escalier du niveau qui monte jusqu'en haut du niveau sans arriver sur un niveau au-dessus. L'escalier du RDC (qui monte au R+1) n'est donc jamais pris pour un accès au toit (défaut trouvé et corrigé pendant le test).
- R+1 de ROOMIT, comparé à la page 7 : même contour à redents, double trait, deux flèches « Pente 1 % » (nord et ouest), escalier sur le balcon. Différences : l'escalier de Pascal a moins de marches dessinées que les 14 de la référence ; le texte de la flèche verticale est un peu décalé vers la pointe. Les cotes viennent à l'étape 4c.

### 2026-11-22 — M20 · 20.1b tâche 4a : toiture et escalier d'accès dans le modèle ROOMIT
- Choix de l'utilisateur **D20-13 : A** : la toiture à 1 % est une toiture **native de Pascal** (la toiture de Fabrics refuse une pente sous 1°).
- Relevé de la page 7 : la toiture couvre le R+1 sans le balcon, avec un débord de 300 mm de tous les côtés (15072 × 13072 mm, cotes `1507` / `1307`). Elle a deux sens de pente (ouest et nord) et un escalier droit sur le balcon.
- `fixturePlan.ts` : les exemples acceptent des toitures de Pascal (`roofs` : pans « un pan » sur des rectangles de murs, débord, pente en %, sens de la descente). ROOMIT-R1 a 4 pans à 1 % et l'escalier `ESC_TOIT` (2340 × 6389 mm, monte de 3000 mm).
- Tests (`scene/roomitBuilding.test.ts`) : pente lue dans le modèle = 1 %, débord 300 mm, emprise −300 → 14772 × −300 → 12772 mm, escalier à sa place sur le plan du R+1.
- **Incohérence de la référence** : la page 6 ne montre pas l'escalier sur le balcon (des meubles à sa place), la page 7 le montre (2340 mm de large sur un balcon de 2791 mm). **Choix de l'utilisateur D20-14 : A** : escalier gardé, canapé du balcon retiré.
- À régler à la tâche 5 : les débords des pans se chevauchent aux jonctions ; la somme des surfaces des pans compte ces bandes deux fois.
- Les façades et coupes de Fabrics ne voient pas encore cette toiture de 4 pans (20.1c).

### 2026-11-22 — M20 · 20.1b étape 3 : tableau des surfaces du niveau
- Étape 2 (onglets « Plan de niveau … », escalier sur l'étage) **validée par l'utilisateur dans le navigateur**.
- Nouveau `src/features/building/views/areaTable.ts` (fonctions pures, testées) : tableau « Pièces Niveau R+1 » (colonnes Pièces / Surface, une ligne par pièce), puis un second tableau « Total Niveau R+1 » avec la ligne « Niveau R+1 », comme la colonne droite de la référence (D20-3). Les surfaces viennent des métrés, le total est leur somme, balcon compris (D20-10 : A).
- Le tableau est posé à droite du plan dans l'onglet « Plan de niveau … » de l'écran Vues et dans son PDF ; le plan ne bouge pas (mêmes coordonnées, même échelle). La planche (tous les niveaux) n'a pas de tableau. Le gabarit de feuille de 20.4 le placera dans la colonne droite.
- Écart de forme avec la référence : le second tableau s'appelle « Total Niveau R+1 » (la référence répète « Pièces Niveau R+1 ») ; les surfaces s'écrivent `18,63 m²` (virgule française).
- R+1 de ROOMIT : 11 lignes, total **144,36 m²**. Test : `areaTable.test.ts`, `scene/roomitBuilding.test.ts`. Contrôle visuel du PDF A2 1:50.
- Vérification : build ✓ lint ✓ 3 236 tests ✓ ; références anti-régression inchangées. **Validé par l'utilisateur dans le navigateur le 2026-11-22.**

### 2026-11-22 — M20 · 20.1b étape 2 : plan de niveau R+1
- Choix de l'utilisateur **D20-12 : A** : la cloison isolée d'une douche n'est pas déduite de la surface (règle de Pascal), écart de +0,09 m² accepté pour SDB 1 et SDB 2. L'option B est notée dans les Idées.
- **Écran Vues : un onglet par niveau** (« Plan de niveau RDC », « Plan de niveau R+1 »), avant les façades. Même dessin que sur la planche, avec le choix de cotation du niveau (Aucune / Client / Exécution) ; le bouton PDF exporte ce niveau seul, avec la flèche du nord. C'est la feuille 05 ou 06 de la référence (le gabarit de feuille viendra en 20.4). Fichiers : `ViewsScreen.tsx`, `viewsStore.ts`, `fr.ts`.
- **Escalier du niveau du dessous** : Pascal ne dessine un escalier que sur son propre niveau. La référence montre l'escalier qui monte du RDC sur le plan du R+1. `levelPlanSymbols.ts` le dessine maintenant sur le niveau où il arrive (escalier dont `toLevelId` est ce niveau, ou qui monte d'au moins 90 % de la hauteur de son niveau). La trémie et ses cotes apparaissent sur le R+1.
- **Scène à deux niveaux** : `fixtureBuildingScene` (`fixturePlan.ts`) réunit ROOMIT-RDC et ROOMIT-R1 (ids préfixés `R1_…`). L'escalier est retiré de ROOMIT-R1 : il appartient au RDC. Test `src/features/scene/roomitBuilding.test.ts` : niveaux à 0 et 3000 mm, surfaces inchangées, escalier sur le R+1 avec les mêmes traits qu'au RDC, repères `PP: 2000 x 2100`, `All. 800`, surface du balcon.
- **Baseline mise à jour (commit séparé)** : sur les planches des exemples « example » et « large-house », les escaliers qui montent à l'étage sont maintenant dessinés aussi sur l'étage : +33 et +147 traits, aucun polygone ni métré changé.
- Vérification : build ✓ lint ✓ 3 231 tests ✓. Contrôle visuel du plan R+1 (PDF A2 1:50) : escalier et trémie à leur place. Limites connues : quelques textes de cotes se chevauchent dans la Bibliothèque (placement des textes : 20.2) ; escalier sans marches balancées (comme au RDC).

### 2026-11-22 — M20 · 20.1b étape 1 : exemple ROOMIT-R1 (R+1 de la Villa ROOMIT)
- Relevé au mm de la page 6 du PDF (PyMuPDF, outil local hors projet), **dans le même repère que le RDC** (les deux pages ont la même emprise, 14472 × 12472 mm) : 22 murs, 19 ouvertures, 21 poteaux, 11 pièces, une séparation de pièces, l'escalier en L, 8 meubles du catalogue de Pascal. Fichiers : `fixtures/ROOMIT-R1/spec.json`, `README.md` ; test `src/features/scene/roomitR1.test.ts`.
- Surfaces recalculées à travers la scène Pascal : **7 pièces sur 11 identiques** au tableau « Pièces Niveau R+1 ». Total balcon compris (D20-10 : A) : **144,36 m²** pour 144,16 m².
  - SDB 1 et SDB 2 : 4,64 au lieu de 4,55 m². La référence déduit la petite cloison de la douche (100 × 912 mm) ; Pascal ne déduit pas une cloison dont un bout est libre. **Écart accepté par l'utilisateur (D20-12 : A).**
  - BAR : 18,46 au lieu de 18,47 (18,4645 m², arrondi).
  - Bibliothèque : 21,52 au lieu de 21,50. Bibliothèque et Dégagement forment un seul espace ouvert, sans ligne de séparation sur la référence : la séparation de pièces est placée pour garder 5,65 m² au Dégagement.
- Appris : Pascal détecte les pièces à partir des **axes** des murs. Un mur arrêté sur la face d'un autre fusionne deux pièces (au premier essai, Bibliothèque et Dégagement donnaient une seule pièce de 27,17 m²). Tous les murs de l'exemple se rejoignent donc sur leurs axes.
- Hypothèses à vérifier (README) : fenêtre d'angle du BAR modélisée par deux fenêtres de 1400 × 1500 mm, portes sans étiquette, escalier repris du RDC pour dessiner le niveau seul. La toiture viendra avec le plan de toiture (tâche 4).
- Vérification : build ✓ lint ✓ 3 225 tests ✓. Contrôle visuel : plan R+1 exporté en PDF A2 1:50, comparé à la page 6 (mêmes murs, poteaux, pièces, repères `PP` / `All.`).

### 2026-11-22 — M20 · 20.1a terminé, feu vert pour 20.1b
- Impression à 100 % à 1:50 mesurée à la règle par l'utilisateur : 20.1a est fait (roadmap, `docs/regression-checklist.md` section 3).
- Décisions de l'utilisateur pour 20.1b (`docs/phases/M20-decisions.md`) :
  - **D20-10 : A**, le total d'un niveau inclut le balcon (R+1 de ROOMIT : 144,16 m²) ; surfaces de toiture sur la feuille seulement sur demande.
  - **D20-11 : A**, l'escalier d'accès au toit est un escalier natif de Pascal, même symbole que sur le plan de niveau.
- Feu vert pour 20.1b (`docs/phases/M20-plan.md`). Étape suivante : exemple ROOMIT-R1.

### 2026-11-22 — M20 · 20.1a étape 5 : exactitude imprimée (test)
- Test `src/features/export/printScale.test.ts` : le plan de niveau ROOMIT-RDC (cotes Exécution, escaliers, mobilier) est exporté par `buildDrawingPdf`, puis le **contenu du PDF est relu** (flux décompressés, traits `m` / `l` en points convertis en mm de papier).
  - 1:50 sur A2 paysage : cote de 1000 mm = 20,0 mm, largeur SDB 1475 mm = 29,5 mm, cote d'ensemble 14473 mm = 289,46 mm ; **les 1 214 traits du plan** sont à leur place et à leur longueur (écart ≤ 0,1 mm).
  - 1:100 sur A3 paysage : 1000 mm = 10,0 mm, 14473 mm = 144,73 mm. À 1:100, le plan (192 × 173 mm) ne tient pas sur A4.
- Aucun code à changer. Reste l'impression à 100 % par l'utilisateur (critère « mesuré à la règle »).

### 2026-11-22 — M20 · 20.1a étape 4 : lien au modèle
- Test `src/features/scene/modelLink.test.ts` sur l'exemple ROOMIT-RDC, par le même chemin que l'éditeur de Pascal (`SceneBinding.pushScene`) : la cloison SDB_G avance de 500 mm.
  - Cote intérieure de la SDB : 1475 → 975 mm ; surfaces : SDB 6,47 → 4,28 m², Séjour 36,18 → 38,37 m² (500 × 4389 mm = 2,19 m²) ; étiquettes du plan à jour.
  - Annuler remet la cote et les surfaces d'avant.
  - Le projet enregistré ne contient que la scène : aucune cote ni repère gardé à part.
- Aucun code à changer : les pièces de Pascal suivent leurs murs (`autoFromWalls`) et les cotes sont recalculées depuis la vue de la scène.
- Le plan proposait l'exemple « mur de 4000 à 5000 mm » ; le test utilise une cloison réelle de ROOMIT (même principe, valeurs vérifiables sur la référence).
- Vérification : build ✓ lint ✓ 3 202 tests ✓ ; `check:all` arrêté aux tests de Pascal, lancés pendant d'autres tests (machine chargée, `EPERM` de liens symboliques) ; relancés seuls : 19 341 réussis, 71 en échec, **identiques à la référence**. Aucun fichier de `packages/pascal/` modifié.

### 2026-11-21 — M20 · 20.1a étape 3 (3/3) : étiquettes, repères des baies, cotes intérieures (D20-9)
- Choix de l'utilisateur (D20-9, `docs/phases/M20-decisions.md`), qui modifie les usages de M10 ter, lot B :
  - **Pièces** : nom + surface seulement. Les altitudes (sol, sous plafond, dalle) restent dans les métrés et iront sur les coupes.
  - **Baies au format ROOMIT, en mm** : porte ou baie `PP: 900 x 2100`, fenêtre `1500 x 1000` + `All. 1100`. Plus de `P01` / `F01` sur le plan (ils restent dans les métrés). Note de la planche mise à jour (`fr.ts`).
  - **Cotes intérieures** : une largeur et une profondeur par pièce, au nu des murs (`roomChord`, qui gère les pièces en L), au lieu des chaînes par rangée qui répétaient des valeurs.
- Fichiers : `executionDimensions.ts` (+ tests), `levelAnnotations.ts`, `dimensioningLabels.ts`, `fr.ts` ; planches de référence (baseline) `example` et `large-house` mises à jour en conséquence.
- Build, lint, 3 198 tests OK.

### 2026-11-21 — M20 · 20.1a étape 3 (2/3) : murs hachurés et poteaux
- **Murs dessinés dans Pascal** : le matériau de coupe vient de leur composition (couche porteuse : brique, bloc / pierre, béton, bois) ; un mur coupé avec un matériau est hachuré, sinon noir plein (`wallMaterialOfAssembly`, `scene/view/toFabricsView.ts`, testé).
- **Poteaux de Pascal** sur les plans de niveau : noir plein, peints par-dessus les murs coupés (`cutPolygons`, `planSymbols.ts`, `levelPlanSymbols.ts`, `drawing.ts`).
- Exemple ROOMIT-RDC : murs en brique, 25 poteaux de 200 × 200 mm. Rendu proche de la référence (murs hachurés, poteaux noirs).
- Planche de référence (baseline) inchangée. Build, lint, 3 198 tests OK.

### 2026-11-21 — M20 · 20.1a étape 3 (1/3) : escaliers et mobilier de Pascal sur les plans de niveau
- **Choix de l'utilisateur : moteur de Fabrics** (ADR 0007, `docs/adr/0007-sheet-engine.md`) ; doublon jsPDF / pdfkit tranché (ADR 0003), `docs/capabilities.md` à jour. Code d'essai supprimé.
- Les plans de niveau (écran Vues, planche, PDF des vues) dessinent les **escaliers et les objets du catalogue de Pascal** avec sa géométrie de plan (`collectSheetGeometry`, sans annotations), convertie en traits de Fabrics : meubles en filet gris, sanitaires en symbole (masque blanc), nez de marche en filet sur leur axe ; étiquettes anglaises (`WC`, `LAV`) et ombrages écartés. Les marches 3D de Fabrics ne sont plus dessinées sur le plan (pas de double dessin).
- Fichiers : `src/features/scene/view/planSymbols.ts` (+ tests, conversion et chemins SVG), `src/features/scene/view/levelPlanSymbols.ts`, `src/pascal/useLevelPlanSymbols.ts`, `building/views/drawing.ts` (`symbolsOfPascal`), `building/views/sheet.ts`, `components/views/ViewsScreen.tsx`, `src/pascal/editor-types.d.ts`. Exemple ROOMIT-RDC : escalier en L et 4 objets.
- **Baseline mise à jour volontairement** (`baseline/fabrics/*/sheet-*.svg`, 6 fichiers) : la planche des exemples montre maintenant escalier et mobilier (absents avant) ; murs, ouvertures, cotes, façades et coupes inchangés ; même planche par le plan Fabrics et par la scène Pascal. Build, lint, 3 194 tests OK.

### 2026-11-21 — M20 · 20.1a étape 2 : essai des deux moteurs de dessin (choix de l'utilisateur à venir)
- Convention des pièces séparées sans mur : **A retenu** par l'utilisateur (séparation au milieu de la poutre, D20-8).
- Plan RDC de ROOMIT dessiné par Fabrics et par Pascal, A2 à 1:50, comparé à la page 5 (`docs/phases/M20-engine-trial.md`, images dans `tmp/m20-trial/out/`, non versionnées).
- Fabrics : usages français, 3 chaînes de cotes lisibles, noms et surfaces, façades et coupes ; mais ni escalier ni mobilier de Pascal, murs en noir plein. Pascal : escalier dessiné, mais cotes qui se chevauchent, repères à l'américaine, noms et surfaces absents, texte d'escalier en anglais, ni façades ni coupes.
- **Recommandation** : moteur de Fabrics, avec reprise du dessin 2D de Pascal pour escaliers et mobilier. Code d'essai non versionné (`tmp/`, `packages/pascal/packages/editor/fabrics-trial.tmp.ts`), supprimé après le choix.

### 2026-11-21 — M20 · 20.1a étape 1 : exemple ROOMIT-RDC (RDC de la Villa ROOMIT)
- **Relevé au mm** dans le PDF vectoriel de l'utilisateur (page 5) : 22 murs, 20 ouvertures, 12 pièces, une séparation de pièces (`fixtures/ROOMIT-RDC/spec.json`, méthode et hypothèses dans `README.md`).
- **Surfaces par la scène Pascal : 9 pièces sur 12 identiques au tableau de la référence.** Séjour et Dégagement +0,20 m² : passage ouvert de 2 m sous une poutre, modélisé par une séparation de pièces de Pascal (comme Revit), sans épaisseur ; la référence exclut la bande de 200 mm sous la poutre (convention à choisir par l'utilisateur). SDB −0,01 m² (non expliqué).
- **Constat** : sans séparation, Pascal fusionne Séjour et Dégagement (65,25 m², chevauchement signalé). Les exemples acceptent désormais des séparations (`separators`).
- Fichiers : `src/features/scene/fixturePlan.ts` (nouveau, partagé avec `precision.test.ts`), `src/features/scene/roomit.test.ts` (nouveau). Build, lint, 3 182 tests OK.

### 2026-11-21 — M20 · 20.0 Décisions prises par l'utilisateur
- Détail et raisons : `docs/phases/M20-decisions.md`. Référence de résultat : dossier Villa ROOMIT (`CONTEXT.md`).
- Retenu : **mm partout** sur les feuilles (la référence est en cm ; la règle de `CLAUDE.md` est gardée) ; usages français (NF / ISO 128) ; gabarit de feuille de la référence (colonne droite, cartouche avec statut), A2 paysage par défaut ; échelles 1:50 / 1:100 / 1:20 / 1:10, 1:200 disponible ; **plans de niveau d'abord**, feuille RDC refaite comme premier cas de comparaison ; façades en trait, ombres en option.
- Fondations, réseaux, fosse : **dessin seulement**, jamais de dimensionnement par Fabrics ; une **fiche « Données à fournir par l'ingénieur »** dit ce que l'app attend de lui (valeurs, unités, usage) ; objet marqué « à dimensionner par l'ingénieur » tant qu'il manque une valeur.

### 2026-11-21 — M19 terminé (gate G2 PASS) ; règle des branches changée
- **G2 validé PASS par l'utilisateur** après test dans le navigateur des trois critères (mur allongé de 4000 à 5000 mm en 3D, couches 20 + 160 + 20 mm, pose et suppression d'une ouverture).
- **Règle des branches** (demande de l'utilisateur) : le travail Pascal se fait sur la branche `pascal` ; `main` n'est plus touché tant que les mises à jour Pascal ne sont pas terminées (`CLAUDE.md`, règle 5).
- **Suivant :** M20, sous-lot 20.0 Décisions (`docs/phases/M20-decisions.md`).

### 2026-11-20 — M19 · B7 Textes de Pascal en français : fait, vérifié par l'utilisateur dans le navigateur (« c'est en français »)
- **Noms par défaut** (« Wall 3 », « Door 1 », « Roof 2 »…) : comme les pièces du catalogue de Pascal, ils restent en anglais dans la scène (la numérotation et le MCP de Pascal les lisent) et s'affichent traduits (« Mur 3 »). Pascal : `DEFAULT_NODE_NAME_MESSAGES` dans `viewer/src/ui/lib/room-name-messages.ts`, utilisé par l'arbre, le renommage, le titre des panneaux et la barre de sélection. Fabrics : `src/features/scene/view/pascalDisplayName.ts` (testé) avec `src/i18n/pascalNames.ts`, généré par `scripts/compile-pascal-texts.mjs` (80 noms) : pièces du catalogue (« Bedroom 2 » → « Chambre 2 »), toitures et escaliers natifs dans les vues et métrés.
- **Boîtes de confirmation de suppression** : phrases réécrites en messages ICU entiers avec pluriels (fini l'assemblage anglais « it/them », « is/are ») ; 50 messages traduits ; noms de pièces traduits ; surface perdue en « 1,50 m² ». Les 65 tests de Pascal qui vérifient le texte anglais passent sans changement.
- **Recompilation** : Fabrics charge `core`, `viewer` et `nodes` de Pascal depuis leur version compilée (`dist`, non versionnée) : après une mise à jour de la branche, lancer `npm run build:pascal` (≈ 2 min).
- **Non traduit volontairement** : `apps/editor` (84 textes, pages Next.js de Pascal non utilisées par Fabrics), catalogue d'objets, panneau de performance pour développeurs.
- Vérification : build ✓ lint ✓ 3 166 tests ✓ ; `test:pascal` : une seule différence avec la référence (`core` › `cut-intent.test.ts`, échec intermittent sous charge : 12/12 lancé seul).


### 2026-11-20 — M19 · B7 Textes de Pascal en français (lots précédents : 512 textes sur 656)
- **Méthode** : codemod de Pascal (`bun run i18n:literals -- convert --apply`) pour passer les textes en dur par Lingui, puis traductions françaises écrites dans `packages/pascal/i18n/fabrics-fr.json` et versées au catalogue par `bun scripts/i18n.ts translate fr` avec un fournisseur `file` ajouté à `scripts/i18n.ts` (aucune clé d'API ; entrées « à relire »). Voir `packages/pascal/FABRICS_CHANGES.md`.
- **Fait** : zones `viewer` (24), `nodes` (92 + listes d'options de cotes de construction) et `editor` (345 : palette de commandes, matériaux, terrain, réglages, import, capture, modules). Les durées en pieds sont affichées en mm.
- **Cas manuels faits** (2026-11-20) : peinture de matériau, terrain, thème, types d'éléments de l'import, animation de construction, vitesse d'animation, boîte d'erreur, avis « Choisissez d'abord un matériau », visite guidée (verbes et noms de repli), messages à valeurs nommées. Non traduits volontairement : catalogue d'objets (« Intensity »), panneau de performance pour développeurs.
- **Reste** : (1) boîtes de confirmation de suppression (`delete-confirmation-dialog.tsx`, 20 textes aux phrases composées avec accords et pronoms) ; (2) noms par défaut « Wall 1 », « Door 1 »… écrits dans la scène par les outils de Pascal (à décider : à la création ou à l'affichage) ; (3) `apps/editor` (84 textes, pages Next.js non utilisées par Fabrics : non prévu).
- Les catalogues `es`, `ja`, `zh-CN` ne reçoivent pas les nouveaux textes (Fabrics est en français) ; `i18n:check` de Pascal les signale, `check:all` de Fabrics ne l'appelle pas. Les 8 tests de Pascal sur les versions de publication échouent sous Windows avec ou sans ce travail (liens symboliques).
- Vérification : build ✓ lint ✓ tests de `src/i18n` et `src/features/scene` ✓.

### 2026-11-20 — M19 · B6 Toitures, escaliers, dalles de Pascal (vérifié par l'utilisateur dans le navigateur)
- **Métrés** : dalles (tableau « Dalles » à part), escaliers et toitures natifs de Pascal comptés dans leur niveau (`scene/slabMeasures.ts`, `scene/roofQuantities.ts` : formules des 9 types de toits ; `view/pascalQuantities.ts`).
- **Anciens plans → 3D de Pascal** (`scene/migrate/roofStairNodes.ts`) : toitures rectangulaires et escaliers deviennent des nœuds `roof` / `stair` de Pascal, visibles et modifiables en 3D ; l'élément d'origine est gardé. Non modifié : métrés identiques à ceux de Fabrics ; modifié : recalculé depuis la géométrie de Pascal. Formes non convertibles (mansarde, pan découpé, escalier hélicoïdal) : nœud Fabrics, quantités par `pascalQuantities.ts`.
- **Test de l'utilisateur** : toiture et escalier d'un ancien plan visibles et modifiables en 3D, métrés qui suivent — « ça marche ».
- Vérification : build ✓ lint ✓ 3 162 tests ✓.
- Correction du journal : les entrées B1 à B5 étaient restées dans le commentaire de format (invisibles) ; le commentaire est remis à sa place.

### 2026-11-18 — M19 · Décisions de l'utilisateur après B5 (plan seulement)
- **T1 et T2 vérifiés par l'utilisateur** : rapport de vérification, tout VALIDÉ (`docs/phases/M19-fixtures-review.md`) ; statut mis à jour dans `fixtures/T1/spec.json` et `fixtures/T2/spec.json`. Ses recommandations (contrôles des ouvertures, tests T3 à T10, conventions de métré des finitions, dalles et fondations séparées) y sont notées.
- **Sous-lot B6 décidé** : toitures, escaliers et dalles de Pascal dans les métrés, et toitures / escaliers des anciens plans dans la 3D de Pascal. Plan proposé, en attente du feu vert.
- **Textes anglais écrits en dur dans Pascal : à traduire** (sous-lot B7). Plan proposé, en attente du feu vert.

### 2026-11-18 — M19 · B5 Cas difficiles et preuves, gate G2 proposé (test par l'utilisateur)
- **Cas difficiles** (`src/features/scene/hardCases.test.ts`, 9 tests) : les commandes de Pascal refusent épaisseur nulle et longueur nulle ; un mur sans épaisseur déjà dans la scène compte 0 m³ et est signalé (**nouvel avertissement « épaisseur invalide »**) ; un mur de longueur nulle est retiré par Pascal au chargement (il ne comptait rien ; **nouvel avertissement « longueur nulle »** pour un document hors scène) ; murs superposés signalés avec la longueur commune ; raccord en T sans double comptage ; ouvertures qui dépassent ou se chevauchent (union), porte plus haute que le mur : jamais de surface négative.
- **Exemples T1 et T2** (`fixtures/T1/spec.json`, `fixtures/T2/spec.json`, calculs à la main **à relire par l'utilisateur**) : studio 6000 × 5000 mm ; séjour + chambre 9000 × 5000 mm. `src/features/scene/precision.test.ts` (15 tests) : métrés par la scène, 2D → 3D (nœuds Pascal aux mêmes cotes), emprise calculée par Pascal, 3D → 2D (mur déplacé avec ses coins, fenêtre élargie). Plus de 30 grandeurs comparées : **aucun écart**.
- **Rapport** : `docs/phases/M19-report.md` (critères G2, précision, cas difficiles, limites). **G2 proposé PASS** sous réserve du test de l'utilisateur et de sa décision sur les toitures et escaliers natifs de Pascal.
- Vérification : build ✓ lint ✓ 3 118 tests ✓ ; `check:all` : tout passe (tests de Pascal identiques à la référence) sauf l'étape `jscpd`, non installé sur cette machine.

### 2026-11-18 — M19 · B4 Terrain et implantation (test par l'utilisateur à la fin de B5)
- **Outils de Pascal réutilisés** : relief du terrain (Construire → Terrain), limite de propriété (onglet Scène, « Limite de propriété », crayon), position et rotation du bâtiment, altitude de base des niveaux. Le panneau de la limite de propriété affiche maintenant ses coordonnées et son périmètre en mm (modification de Pascal notée dans `FABRICS_CHANGES.md`).
- **Métrés, version Technique : bloc « Terrain et implantation »** (`src/features/scene/siteMeasures.ts`, testé ; `SiteMeasuresTable.tsx`) : surface et périmètre de la parcelle, emprise au sol (contour extérieur des murs du niveau du sol, calculé par Pascal et placé par la position du bâtiment), coefficient d'emprise, recul minimal à la limite, alerte si le bâtiment dépasse la limite, relief modelé ou plat, altitudes et hauteurs des niveaux en mm. Tant que la limite est le carré par défaut de Pascal (30 × 30 m), elle n'est pas comptée comme une parcelle.
- Tests : maison 8000 × 10000 mm sur une parcelle de 20 × 30 m → 600,00 m², emprise 80,00 m², recul 6000 mm ; déplacée de 5000 mm → recul 1000 mm ; de 8000 mm → hors de la parcelle ; altitudes 0 et +3000 mm.
- Vérifié dans Chromium (Maison R+1) : emprise 78,66 m², « Limite de propriété non réglée », altitudes 0 et +2700 mm.
- Limites : reculs réglementaires par côté (avant, latéral, arrière) et altitude du terrain sous chaque niveau non calculés ; le bloc n'est pas encore dans les exports Excel / CSV (M21).
- Vérification : build ✓ lint ✓ 3 094 tests ✓.

### 2026-11-18 — M19 · B3 Matériaux (test par l'utilisateur à la fin de B5)
- **Composition et matériaux : ceux de Pascal**, réutilisés tels quels : couches d'un mur dans son panneau (section composition), matériaux dans l'onglet Peinture, objets 3D dans l'onglet Objets.
- **Couches lues par Fabrics** : `WallElement.layers` (rôle, matériau, épaisseur en mm), lu dans la composition du mur de la scène (`scene/view/toFabricsView.ts`) ; Fabrics ne l'écrit jamais. Quand Fabrics réécrit la scène, chaque nœud garde les propriétés que seul Pascal connaît (composition, matériaux par face…) (`scene/nativeNodes.ts`).
- **Quantités par couche, sans double comptage** (`src/features/measurements/wallLayers.ts`, testé) : surface d'une couche = surface nette du mur à l'axe ; volume = volume net du mur × épaisseur de la couche / somme des épaisseurs (la somme des couches redonne exactement le volume du mur, ouvertures et raccords en T déduits). Critère G2 vérifié : mur de 200 mm = 20 + 160 + 20 mm avec une fenêtre → 3 couches, volumes 20 / 160 / 20 mm de la surface nette.
- **Métrés, version Technique** : tableau « Couches des murs » (`WallLayersTable.tsx`), regroupé par couche identique (rôle, matériau, épaisseur), rôles et matériaux de Pascal en français (`fr.ts`).
- Limites : couches des toitures et dalles, et colonnes « couches » dans les exports Excel / CSV : M21 (quantitatif par lot). Un mur tracé par défaut dans Pascal n'a pas de composition : le tableau n'apparaît qu'une fois la composition donnée.
- Vérification : build ✓ lint ✓ 3 087 tests ✓ ; Chromium : mur tracé dans Pascal nommé « Mur isolé » dans les métrés.

### 2026-11-18 — M19 · B2 Édition 3D (en partie ; test par l'utilisateur à la fin de B5)
- **Objets dessinés dans Pascal pris en compte par Fabrics** (`src/features/scene/view/toFabricsView.ts`) : jusqu'ici, la vue de Fabrics (métrés, cotes, repères, exports) ne lisait que les nœuds venus de Fabrics ; un mur tracé avec Construire n'existait pas pour les métrés. Murs, portes, fenêtres, pièces (`zone` de rôle pièce) et niveaux créés dans Pascal sont maintenant lus : identifiant du nœud, épaisseur et hauteur par défaut de Pascal (hauteur du niveau), noms anglais par défaut de Pascal (« Wall 1 ») remplacés par les noms automatiques de Fabrics (« Mur 1 »).
- **Rien n'est effacé quand Fabrics réécrit la scène** (`src/features/scene/nativeNodes.ts`, `rebuildScene` dans `sceneBinding.ts`) : changer la cotation ou la version des métrés reconstruisait la scène depuis la vue de Fabrics et aurait supprimé dalles, plafonds, objets, toitures et escaliers de Pascal, et retiré aux murs leurs propriétés propres. Ils sont remis tels quels (ou avec leur nouvelle position si Fabrics les a déplacés). `nodeIdOf` garde l'identifiant d'un nœud natif (`migrate/nodeIds.ts`).
- **Critères G2 vérifiés par les commandes de Pascal** (`src/features/scene/edit3d.test.ts`, 9 tests) : mur allongé de 4000 à 5000 mm en glissant son extrémité (geste de Pascal en 2D comme en 3D) → 5000 mm sur le plan et dans les métrés, le mur raccordé suit le coin ; même chose par le panneau « Longueur » ; identifiants inchangés, aucun élément fantôme ; porte élargie puis supprimée → surfaces nettes et volume cohérents.
- Vérifié dans Chromium : nouveau plan, mur tracé avec Construire en tapant `4000` → onglet Métrés : 4000 mm, 10,80 m².
- **Reste à faire (non fait en B2)** : toitures, escaliers et dalles **natifs** de Pascal dans les métrés (leur géométrie par segments demande une conversion dédiée) ; les toitures et escaliers des anciens plans restent des nœuds Fabrics, invisibles et non modifiables dans la 3D de Pascal. Constat : la commande `setWallGeometry` de Pascal ajoute un mur « pont » quand on prolonge un mur dans son axe depuis un coin (mur en double) ; le geste de l'interface, lui, déplace le coin proprement.
- Vérification : build ✓ lint ✓ 3 081 tests ✓.

<!-- Format d'une entrée (la plus récente en haut) :
### AAAA-MM-JJ — M1 · Outil rectangle
- Fait : …
- Fichiers : src/…, src/…
- Vérification : build ✓ lint ✓ tests ✓ — testé dans le navigateur : …
- Commit : feat: outil rectangle
-->

### 2026-11-18 — M19 · B1 Outils 2D (test par l'utilisateur à la fin de B5)
- **Onglet « Construire »** de Pascal dans la barre latérale (`src/pascal/pascalTabs.tsx`), repris tel quel depuis l'application Pascal (`@pascal-app-host/build-tab`) : pièces (rectangle, polygone, murs), portes, fenêtres, toit, escalier, étagère, cuisine, clôture, terrain, terrasse, et « Avancé » (dalle, plafond, poteau…). Il s'ouvre par défaut, comme dans Pascal.
- **Unités en mm partout** (`src/pascal/millimetreUnits.ts`, testé) : Pascal est verrouillé sur sa notation « millimètres » (un réglage mémorisé en mètres ou en pieds revient en mm), surfaces à 2 décimales, menu « Unités » masqué. Un nombre tapé sans unité pendant un tracé est lu en mm (mur tracé en tapant `5000` vérifié). Petites modifications de Pascal pour les affichages qui retombaient sur les mètres (grille « 500mm », étiquettes de pièces, flèches de redimensionnement…), notées dans `packages/pascal/FABRICS_CHANGES.md` ; sans réglage, Pascal reste identique.
- **Accrochages et alignements** : ceux de Pascal (modes visibles dans l'aide de l'outil, Maj pour changer, Alt pour ignorer, grille réglable avec Ctrl).
- **Sans doublon** : l'éditeur de plans n'a que les outils de Pascal. Les outils de dessin de l'ancien plan Konva (`snapping`, `typedLength`, `backgroundSnap`) ne servent plus qu'à cet ancien plan, gardé pour les Visuels et les exports jusqu'à M20. Registre mis à jour.
- Limites : Pascal écrit « 900mm » (sans espace, sa forme, ses tests en dépendent) ; l'heure du panneau soleil reste au format anglais (« 11:45 AM ») ; accrocher sur un fond DXF importé ou sur le niveau de référence n'est pas encore fait (Idées).
- Vérification : build ✓ lint ✓ 3 072 tests ✓ ; tests Pascal des fichiers touchés ✓ ; Chromium (mode local) : onglet Construire, niveaux « 2700 mm », porte « 900mm », pièces « 14,96 m² », saisie « 5000 » au tracé d'un mur, aucune erreur bloquante.

### 2026-11-18 — M19 · A6 Navigation, sons et aide + A7 Nettoyage (validés avec A5 le 2026-11-18)
- **A6** : tout ce qui relève de la navigation vient du moteur et de la barre de vue de Pascal, repris en A5 : perspective / orthographique et suivi de caméra (barre de vue), visite à la première personne, niveaux empilés / pleine hauteur / éclatés, coupe 3D, accrochages (Maj / Alt), palette de commandes (Ctrl+K), dialogue des raccourcis et réglages audio (Paramètres), sons `howler` avec le réglage de Fabrics (A1). **Ajouté en A6 : la réalité virtuelle** (`@webxr/plugin`, MIT) : module enregistré à la découverte (`bootstrap.ts`), installé par défaut dans un projet comme dans Pascal ; son environnement (`@react-three/xr`, émulateur de casque) n'est chargé que quand il est installé (`src/pascal/PascalWebXR.tsx`, `useWebXRInstalled.ts`) ; bouton « Entrer en VR » dans la barre de vue.
- **« Aide et parcours de découverte »** : Pascal n'a pas de parcours guidé. Ce qu'il offre est repris tel quel : carte d'aide de la caméra (Panoramique / Pivoter / Zoom), dialogue des raccourcis clavier, palette de commandes. Le parcours guidé de Fabrics (`EmptyPlanCard`) est retiré.
- **A7** : lecture seule des plans = éditeur de Pascal en mode aperçu (`src/pascal/PascalReadOnly.tsx` + barre `PascalReadOnlyBar.tsx`) pour le lecteur invité, le lien public et l'aperçu de version ; `ReadOnlyViewer` ne sert plus qu'aux Visuels. Retirés (21 fichiers + leurs tests) : ancienne vue 3D (`viewer3d/*`, `viewer3dStore`), `LiveMetresBar`, `PlanContextBar`, `LevelSelector`, `EmptyPlanCard`, `AuthBrandPanel`, export glTF (`export/gltf.ts`), `measurements/liveSummary`, `building/panelWidth`. `EditorPage` (Visuels) n'affiche plus que ses propres panneaux. Registre (`docs/capabilities.md`), carte des écrans et liste de non-régression mis à jour.
- **Ce qui reste de l'ancien code de plan, volontairement** : le plan Konva (`EditorStage` et ses couches), nécessaire aux exports PNG / JPG / PDF avec cotes (monté seulement pendant la fenêtre Exporter) et aux Visuels, jusqu'à M20 (exports et mise en page par Pascal). Les modules de calcul `features/*` (métrés, géométrie, vues) restent : ils alimentent métrés, baseline et exports.
- **À savoir** : 660 textes de l'interface de Pascal sont écrits **en dur en anglais dans son code**, hors de son système de traduction (74 fichiers : Paramètres 83, Plugins 38, palette de commandes 41, « Enter VR », etc.). Le fichier de textes français ne peut pas les traduire ; il faudrait modifier le code de Pascal (à noter dans `FABRICS_CHANGES.md`). À décider.
- Vérifié dans Chromium : bouton VR présent, module WebXR installé, palette Ctrl+K, dialogue de raccourcis, lecture seule d'un plan (Commentaires, Historique, Métrés, Vues, sans outils de modification), aucune erreur de console. Non vérifié : session VR réelle (casque), sons (pas de carte son dans le navigateur de test), invité / lien public avec un vrai compte.

### 2026-11-18 — Lot Performance (demande de l'utilisateur : « trop lourde et lente »)
- **Lot 1 Chargement** : pages chargées à la demande (`src/pages/lazyPages.ts`) ; l'éditeur se précharge au survol d'une carte ; l'accueil n'utilise plus que les traductions de Pascal (`@pascal-app/core/i18n`) ; `public/_headers` : cache d'un an pour `/assets` sur Cloudflare Pages. Mint retiré (choix de l'utilisateur).
- **Une seule version de l'éditeur de plans** : l'ancien plan Konva n'est plus monté à l'ouverture d'un plan. Il est chargé seulement pendant la fenêtre Exporter (`src/pascal/PascalExportDialog.tsx`, exports PNG / JPG / PDF avec cotes), et la miniature est photographiée par Pascal (`src/pascal/usePascalThumbnail.ts`, 640 × 360). L'adresse `/p/:id/ancien` et l'entrée « Ouvrir dans l'ancien éditeur » sont retirées. Vues et Partager sont chargés à l'ouverture. Les projets Visuel gardent leur éditeur (c'est le seul qu'ils ont).
- **Textes de Pascal** : un seul fichier en français (`src/i18n/pascalTexts.ts`, généré par `node scripts/compile-pascal-texts.mjs`) : 3 960 textes sur 3 962 ; plus aucun autre catalogue de langue chargé.
- Mesures (`vite preview`, comme en ligne, Chromium sans carte graphique) : accueil 1,6 s → 0,9 s ; ouverture d'un plan 8,6 s → 2,6 s (après survol) ; rafraîchissement 16 s → 5,1 s ; JavaScript de l'éditeur 12,5 → 11,5 Mo.
- Limites : miniature photographiée après une modification (comme Pascal) ou 20 s après l'ouverture si le projet n'en a pas ; dans le navigateur de test, cette photo d'ouverture peut être mal cadrée (caméra encore en mouvement). L'accueil charge encore le moteur de Pascal (1,7 Mo) par le chemin enregistrement → conversion des scènes : à couper au lot 2.
- Vérification : build ✓ lint ✓ 3 082 tests ✓ ; Chromium : export PNG téléchargé, Vues, miniature enregistrée, aucune erreur.

### 2026-11-18 — Hors jalon : lenteur du chargement en développement (demande de l'utilisateur)
- Mesures (Chromium sans carte graphique, `npm run dev`) : ouverture de l'éditeur 35 s, rafraîchissement 18 s, environ 3 300 fichiers servis un par un (dont 2 235 de Pascal, en source TypeScript). Version compilée (`vite preview`, comme en ligne) : accueil 1,6 s, éditeur 8,6 s.
- Correctif : Pascal (éditeur, moteur, rendu, nœuds) regroupé en quelques fichiers mis en cache par Vite en développement (`optimizeDeps` dans `vite.config.ts`). Après : accueil 2,5 s, éditeur 5,6 à 8,7 s, rafraîchissement 11 s, environ 1 100 fichiers. Après une modification du code de Pascal : `npx vite --force`.
- Reste (aussi en ligne) : environ 12,5 Mo de JavaScript à exécuter pour l'éditeur (Pascal, three.js WebGPU, modules, ancien éditeur monté hors écran pour les exports) et le démarrage de la 3D. À alléger plus tard (Idées).
- Vérification : build ✓ lint ✓ tests ✓ ; onglets, Plugins (Mint), menu Affichage vérifiés dans Chromium.

### 2026-11-18 — M19 · A5 suite : Mint et français complet de Pascal (choix de l'utilisateur)
- **Français de Pascal** : les 3 888 traductions automatiques « à relire » du catalogue français de Pascal sont chargées par Fabrics (2 écartées : variables différentes de l'anglais). Script `scripts/compile-pascal-fr.mjs` → fichier généré `src/i18n/pascalFrReview.ts`, chargé par `src/pascal/bootstrap.ts` avant le catalogue officiel (les traductions relues gardent la main). Pascal n'est pas modifié. À relancer après une mise à jour de Pascal. Des tournures maladroites sont possibles : à corriger au fil de l'eau.
- **Mint** (objets 3D générés) : module branché (`bootstrap.ts`, désactivé par défaut, à installer par projet dans Plugins → Parcourir), route de connexion `/api/plugins/mint/…` montée dans le serveur de développement (`vite.config.ts`, adaptateur serveur fourni par Mint, jetons en cookies HttpOnly). **La connexion ne marchera qu'après que Mint a autorisé l'adresse de retour de Fabrics** (`http://localhost:5173/api/plugins/mint/oauth/callback`, puis celle du site en ligne) : Mint enregistre ces adresses une par une, aujourd'hui seulement celles de Pascal. En ligne (Cloudflare Pages), il faudra en plus une fonction serveur équivalente.
- Vérifié dans Chromium : interface de Pascal en français (Empilé, Affichage, Aperçu, Panoramique…) ; Mint listé dans « Parcourir les plugins » ; `/api/plugins/mint/session` répond `{"connected":false}` et `oauth/start` redirige vers `mcp.mint.gg`. Les avertissements React « unmount a root » de la console existaient déjà avant (mêmes 5).
- Vérification : build ✓ lint ✓ 3 081 tests ✓.

### 2026-11-18 — M19 · A5 Rendu : réglages et barre de vue de Pascal (à tester dans le navigateur)
- Les effets de rendu sont ceux du moteur de Pascal, actif dans Fabrics depuis A2 : WebGPU avec repli WebGL2 (`three/webgpu`), occlusion ambiante, bloom, anticrénelage (selon la qualité de rendu), contours, surlignage, lumière du jour et atmosphère, HDRI, animation de construction. Il manquait leurs **réglages**, fournis par l'application Pascal :
  - barre de vue de Pascal (en haut à droite de la 3D : niveaux empilés / pleine hauteur, menu **Affichage** avec qualité, ombres, caméra, couleurs, heure et météo, accrochage ; visite ; aperçu), reprise **telle quelle** depuis `packages/pascal/apps/editor/components/viewer-toolbar.tsx` par l'alias `@pascal-app-host/*` (et `@/` pour ses propres imports), sans copie ni modification de Pascal ;
  - onglets de Pascal dans la barre latérale : **Scène** (arbre du bâtiment, niveaux, pièces, éléments ; ouvert par défaut), **Peinture**, **Objets** (catalogue), **Paramètres** (rendu, exports 3D, animation de construction, sons, raccourcis) ; « Construire » viendra avec les outils (B1) ;
  - modules d'extension de Pascal enregistrés comme dans Pascal lancé seul (`src/pascal/bootstrap.ts`) : arbres, environnement, ossature (non installée par défaut), piscine, paysage, salle de bain, rues. Non branchés : Mint (service externe `api.mint.gg`, à décider) et WebXR (A6). Licences vérifiées (MIT) et services externes listés dans `THIRD_PARTY_NOTICES.md`.
- Liste de comparaison côte à côte des effets avec Pascal lancé seul : `docs/regression-checklist.md` § 2.3 (sur un vrai GPU : le navigateur de test dessine en logiciel, qualité détectée « basse »).
- Constats : (1) le catalogue français de Pascal a 3 962 messages, dont **3 890 traduits automatiquement et marqués « à relire »**, écartés à la compilation : seuls 72 sont chargés, d'où l'interface de Pascal surtout en anglais ; (2) le menu Affichage règle les unités sur « Meters » (mm en B1).
- Vérification : build ✓ lint ✓ 3 082 tests ✓ ; essai Chromium (WebGL2 logiciel) : onglets, panneau Paramètres, barre de vue et menu Affichage, sans erreur de console.

### 2026-11-18 — M19 · A4 Projets Visuel dans le style de Pascal (validé le 2026-11-18)
- Accueil : bouton « Nouveau visuel » dans l'en-tête (et dans l'écran « Aucun projet »), qui ouvre le choix du format (post carré, A4, affiche A3, bannière) dans le style de Pascal (`NewDesignDialog`, textes Lingui). Les Visuels s'affichent parmi les projets, avec miniature. Ils étaient devenus impossibles à créer depuis l'accueil refait en A1.
- Éditeur Visuel (Konva, reste à part, conforme à la carte des écrans) : thème sombre de Pascal sur toute la page et sur `<body>` pour les menus et fenêtres (`EditorPage`, classes `pascal-tokens` et `fabrics-on-dark`) ; écrans de chargement et d'erreur dans la coque sombre.
- `ProjectPage` choisit l'éditeur d'après le type du projet (connu par la création, la liste de l'accueil ou le dépôt) : un Visuel ne charge plus l'éditeur de Pascal (lourd).
- Vérifié dans Chromium : création d'un Visuel (affiche), ajout d'un texte, enregistrement (`kind: design`, élément `text`), miniature sur l'accueil, aucune erreur de console. Non vérifié : images importées, export PDF d'un Visuel, partage / lien d'un Visuel avec un compte.
- Vérification : build ✓ lint ✓ 3 081 tests ✓.

### 2026-11-18 — M19 · A3 Collaboration, partage, Exporter, points à vérifier, cotation (validé avec A2 le 2026-11-18)
- **`/p/:id` ouvre maintenant un projet Plan dans l'éditeur de Pascal** (`ProjectPage` → `PascalEditorPage`, chargé à la demande). Un projet Visuel y retrouve son éditeur. L'ancien éditeur reste en secours à `/p/:id/ancien` (entrée « Ouvrir dans l'ancien éditeur » du menu « ⋯ » des cartes Plan) jusqu'au nettoyage d'A7 ; `/p/:id/pascal` renvoie vers `/p/:id`.
- Barre du haut de Fabrics dans Pascal (`src/pascal/PascalNavbar.tsx`) : retour, nom du projet (renommer), état d'enregistrement, collaboration (indicateur, avatars de présence), points à vérifier (ouvre l'onglet Métrés de Pascal), cotation Aucune / Client / Exécution, Vues (façades, coupes, planche), Partager (propriétaire connecté : lien, invitations, membres), Exporter (PNG, JPG, PDF, métrés, DXF, IFC). Signaux du plan en haut à droite.
- Le plan de l'ancien éditeur est monté hors de l'écran, en lecture seule et inerte : les exports PNG / JPG / PDF (cotes Client / Exécution comprises) et la miniature se prennent dessus, comme avant.
- Niveau affiché dans Pascal → niveau actif de Fabrics (`usePascalLevelSync`) : métrés, points à vérifier et exports suivent le niveau regardé.
- Vérifié dans Chromium (mode local) : éditeur de Pascal à `/p/:id`, miniature enregistrée, export PNG téléchargé, fenêtre Exporter et écran Vues. Non vérifiable sans compte : Partager, invitations, présence à deux, commentaires, historique.
- Limites connues : les cotes Client / Exécution et les curseurs des autres personnes ne sont pas dessinés dans la vue 2D / 3D de Pascal (seulement dans les exports et les Vues) ; épingles de commentaires absentes de Pascal ; un lecteur invité (rôle « lecture ») garde l'ancienne page de lecture seule ; annuler / rétablir passent par Pascal (Ctrl+Z), pas par l'historique de la scène Fabrics.
- Vérification : build ✓ lint ✓ 3 081 tests ✓. `check:all` (tests de Pascal sous Bun, ~11 min) non relancé pour A3.

### 2026-11-18 — M19 · A2d Historique et aperçu de version dans l'éditeur de Pascal
- Onglet « Historique » de la barre de Pascal (avec un compte) : versions, noms, sessions, comme avant ; restaurer passe par `usePendingRestore`, monté dans la page Pascal, et la scène restaurée est appliquée à Pascal.
- Aperçu d'une version d'un projet Plan (`/p/:id/versions/:versionId`) : éditeur de Pascal en mode aperçu (`previewScene`, `isVersionPreviewMode` : aucune modification possible), bandeau de Fabrics (Restaurer, Faire une copie) en barre du haut, onglets Historique et Métrés de la version (`src/pascal/PascalVersionPreview.tsx`). Un projet Visuel garde l'ancien aperçu.
- Non vérifié dans le navigateur (il faut un compte Supabase) : à tester par l'utilisateur à la fin d'A3. Limite : les changements depuis la version précédente ne sont pas surlignés dans Pascal (ils l'étaient sur l'ancien plan).
- Vérification : build ✓ lint ✓ tests ✓.

### 2026-11-18 — M19 · A2b Métrés et A2c Commentaires dans l'éditeur de Pascal
- Pont entre les deux éditeurs : la page `/p/:id/pascal` ouvre maintenant le projet dans `editorStore`, comme l'ancien éditeur. Chaque enregistrement de Pascal (`onSave`) écrit sa scène dans la scène du projet (`SceneBinding.pushScene`, une étape d'annulation, testé) ; une scène venue d'ailleurs (autre personne, version restaurée) est appliquée à Pascal (`applySceneGraphToEditor`). Enregistrement automatique, collaboration (`useCollaboration`), restauration de version et commentaires suivent sans être réécrits.
- Correctif `useAutosave` : la scène d'un plan est mise à jour juste après sa vue ; l'enregistrement est reprogrammé avec la scène à jour (sinon l'ancienne scène était enregistrée). Vérifié dans Chromium : mur allongé de 1000 mm dans Pascal → 2900 mm dans la vue de Fabrics, retrouvé après rechargement.
- A2b : onglet « Métrés » dans la barre latérale de Pascal (panneau Fabrics complet : Client / Technique, Excel, CSV, pièces, plafonds, murs). Les couleurs claires des panneaux Fabrics passent en sombre par la classe `fabrics-on-dark` (variables de couleur de Tailwind réassignées, `src/pascal-theme.css`), sans réécrire les panneaux.
- A2c : onglet « Commentaires » (avec un compte) : liste, fils, réponses ; « Nouveau » ouvre une bulle dans le panneau, posée sur l'objet sélectionné dans Pascal ou au milieu du plan (`features/scene/commentDraft.ts`, testé ; `src/pascal/PascalCommentsTab.tsx`). Messages de Fabrics (`Notice`) affichés par-dessus l'éditeur.
- Constats : Pascal étiquette le Séjour à 34,2 m² et les métrés Fabrics donnent 31,85 m² (axe des murs / contour tracé) : règles à trancher en M21 ; épingles de commentaires pas encore affichées dans la vue 3D / 2D de Pascal ; cliquer un fil ne recentre pas la vue de Pascal.
- Vérification : build ✓ lint ✓ 3 082 tests ✓ ; essai Chromium en mode local (sans compte : commentaires non testés).

### 2026-11-18 — Nettoyage des branches : on travaille sur `main`
- Demande de l'utilisateur : trop de branches polluaient le dépôt. A2a validé et fusionné dans `main`.
- Fait : les 45 branches locales et les 2 branches distantes restantes (toutes déjà contenues dans `main`) et les worktrees `Fabrics-m17` et `Fabrics-m19` sont supprimés. Il ne reste que `main`, en local et sur `origin`.
- Règle : dorénavant, commit puis push directement sur `main` (`CLAUDE.md`, règle 5). Les mentions de branches `feat/…` plus haut dans ce journal sont historiques.
- Il faut refaire `npm run install:pascal` puis `npm run build:pascal` dans le dossier principal (les paquets de Pascal n'y étaient pas installés).

### 2026-11-18 — M19 · A2a Les vrais projets Plan s'ouvrent dans l'éditeur de Pascal (à tester dans le navigateur)
- Fait : page `src/pages/PascalEditorPage.tsx`, route `/p/:projectId/pascal` ; elle charge la scène du projet (`project.scene`, ou celle calculée depuis l'ancien document) dans `<Editor>` de Pascal et enregistre chaque modification dans le projet (`repository.save`, scène + vue recalculée). Entrée « Ouvrir dans l'éditeur Pascal (essai) » dans le menu « ⋯ » des cartes Plan de l'accueil. L'essai `/pascal-test` est retiré.
- L'ancien éditeur reste l'éditeur par défaut de `/p/:id` : collaboration, commentaires, historique et métrés n'existent pas encore dans l'éditeur de Pascal (A2b à A2d), on ne bascule qu'à la fin d'A2.
- Vérifié dans Chromium : la Maison R+1 s'ouvre avec ses murs, portes, fenêtres, 2 niveaux et ses pièces (Entrée 15,0 m², Cuisine 20,1 m², Séjour 34,2 m²), sans erreur bloquante. Constats : le mobilier de Fabrics apparaît en fils rouges (nœuds sans modèle 3D Pascal) ; Pascal affiche des mètres (« 2,7 m »), à passer en mm (B1) ; une partie de l'interface reste en anglais ; avertissement React « unmount a root » venu du code de Pascal (sans effet visible) ; pas de miniature, ni de renommage dans cette page.
- Vérification : build ✓ lint ✓ tests ✓.

### 2026-11-18 — M19 · A2 (étape 1) : l'éditeur de Pascal tourne dans Vite (essai `/pascal-test`)
- Fait : `<Editor layoutVersion="v2">` de `@pascal-app/editor` se monte dans l'application Vite, avec la vue 3D, la vue en plan, la barre d'outils et les panneaux de Pascal. Aucune erreur dans la console (Chromium).
- Branchement : alias Vite `@pascal-app/editor`, `viewer`, `nodes` (`vite.config.ts`) ; types redirigés vers `src/pascal/editor-types.d.ts` pour que `tsc` ne parcoure pas le code de Pascal (`tsconfig.app.json`) ; remplaçant des modules internes de Next (`src/pascal/NextInternalsShim.ts`) ; `process.env` vide côté navigateur (`index.html`) ; fichiers publics de Pascal (icônes, objets, matières, sons, HDRI : 29 Mo) servis depuis `packages/pascal/apps/editor/public` puis copiés dans `dist` au build, sans doublon dans le dépôt ; thème et sources Tailwind de l'éditeur (`src/index.css`, `src/pascal-theme.css`) ; enregistrement des nœuds et des catalogues de langues (`src/pascal/bootstrap.ts`).
- Constats pour la suite : (1) le français de Pascal est partiel (« Rez-de-chaussée » traduit, « Plugins » non) : relevé des textes manquants à faire ; (2) Pascal affiche des mètres (« 2,5 m ») : à passer en mm (règle des unités, sous-lot B1) ; (3) les modules d'extension de Pascal (arbres, piscine, WebXR…) ne sont pas encore branchés (A5/A6) ; (4) la route `/pascal-test` est un essai, à retirer quand l'éditeur ouvre les vrais projets.
- Vérification : build ✓ lint ✓ tests ✓.
- Branche `feat/m19-a2-editor`.

### 2026-11-18 — M19 · A1 Routes et accueil (à tester dans le navigateur)
- Fait : thème de Pascal repris dans `src/pascal-theme.css` (jetons clairs par défaut, sombres dans `.pascal-shell` ; police Geist) ; coque `src/components/shell/AppShell.tsx` (en-tête, carte centrée, boutons) ; accueil refait d'après `app/page.tsx` de Pascal (`HomePage.tsx`, cartes, menu compte, boîtes Renommer / Supprimer / Quitter / Importer) ; connexion et nouveau mot de passe en carte centrée sur la coque sombre ; page Réglages (`/reglages`) avec l'interrupteur des sons, mémorisé dans ce navigateur (`features/settings/soundSetting.ts`, testé) ; `Button`, `Modal`, `Menu` suivent le thème (clair dans l'éditeur actuel, sombre sur l'accueil).
- Textes : système de traduction de Pascal (Lingui, sans macro) branché dans `src/main.tsx` ; textes de l'accueil, des cartes, des boîtes de dialogue, du compte, de la connexion et des réglages versés dans `src/i18n/fabricsMessages.ts` (`useT()`), testés. Restent dans `fr.ts` : messages d'erreur de connexion, boîte « Importer vos projets », éditeur.
- Test d'architecture : `@pascal-app/core` peut aussi être importé depuis `src/i18n/` (ADR 0004, point 4).
- Les routes `/`, `/p/:id`, `/s/…`, `/i/…`, `/bienvenue` existaient déjà et sont conservées. **Pas fait en A1** : la route d'import de scène (elle dépend de l'éditeur Pascal, A2) et la création d'un projet Visuel depuis l'accueil (A4 ; `NewDesignDialog` n'était déjà plus branché).
- Vérification : build ✓ lint ✓ 3 075 tests ✓ ; `check:all` : 3 tests de Pascal en échec en suite complète (machine chargée, erreurs EPERM de liens symboliques sous Windows), verts relancés seuls, aucun fichier de `packages/pascal/` modifié ; accueil, réglages vérifiés dans Chromium sans erreur de console. Connexion : à voir avec Supabase (compte en ligne).
- Branche `feat/m19-pascal-ui` (dossier `Fabrics-m19`).

### 2026-11-18 — M20 à M25 · Sous-lots et modèle par sous-lot (plan seulement)
- Demande de l'utilisateur : appliquer à tous les jalons suivants le découpage en sous-lots avec la commande `/model` de chacun, comme pour M19.
- Fait : `docs/03-ROADMAP.md` : un tableau de sous-lots pour M20 (20.0 à 20.9), M21 (21.0 à 21.8), M22 (22.0 à 22.5), M23 (23.0 à 23.8), M24 (24.1 à 24.7) et M25 (25.1 à 25.6), avec `/model opus` ou `/model sonnet` ; un sous-lot « Décisions » ouvre M20 à M23 (questions métier du roadmap) ; règle ajoutée au déroulé de chaque jalon.
- Statut : **proposition**, à confirmer dans le plan de chaque jalon. M18 garde son découpage A à F (`docs/phases/M18-plan.md`, branche `feat/m18-bim-model`).
- Commit : docs(roadmap): sous-lots et modèle par sous-lot de M20 à M25

### 2026-11-18 — M19 · Découpage en sous-lots validé (plan seulement)
- Décision de l'utilisateur : M19 découpé en 12 sous-lots (A1 à A7 pour l'interface, B1 à B5 pour l'édition 2D/3D), dans cet ordre, avec un test dans le navigateur après chaque sous-lot.
- Chaque sous-lot porte la commande `/model sonnet` ou `/model opus` à taper avant de le commencer. Claude ne peut pas changer de modèle tout seul : il rappelle la commande au début du sous-lot.
- Fichier : `docs/03-ROADMAP.md` (section M19). Aucun code ; M19 commence après le gate G1 de M18.
- Commit : docs(m19): sous-lots et modèle par sous-lot

### 2026-11-18 — M18 · Mise en ligne : base de données et commande de build
- Fait : sauvegarde `supabase/m18-backup.sql` exécutée (10 projets et 40 versions copiés, nombres égaux). Plan refusé à l'essai à blanc (plan « 16 nov. à 22:10 », écart de 9 mm² sur une surface, lié à l'arrondi du millimètre) : sans objet, car l'utilisateur a choisi de supprimer les projets tests (liste complète : 10 projets, dont 2 « Exemple »). Suppression faite par l'utilisateur dans Supabase (`delete from public.projects`, cascade sur les versions) ; contrôle : 0 projet, 0 version, 10 projets sauvegardés. Aucune conversion lancée (`migrate:plans --apply` non utilisé). Clé `service_role` retirée de `.env.local`.
- Fait : `docs/05-INSTALLATION.md` décrit la nouvelle commande de build Cloudflare Pages (Bun 1.4.4, `install:pascal`, `build:pascal`, Node 26.13.1) et la section de conversion, devenue sans objet, est remplacée.
- Fait (par l'utilisateur) : commande réglée dans Cloudflare ; build d'aperçu de la branche `feat/m18-bim-model` sans erreur, vérifié en ligne et validé le 2026-11-18. Branche mergée dans `main`.
- Commit : docs(m18): commande de build Cloudflare et suivi de la mise en ligne

### 2026-11-18 — M18 · Lot F : métrés sur la scène et corrections EDGE-01
- Fait : les trois écarts d'EDGE-01 décidés par l'utilisateur sont corrigés dans les métrés. (1) Une ouverture qui dépasse de son mur n'est plus déduite (`isOpeningOutside`, `geometry/openings.ts`, partagé avec l'avertissement existant ; sa surface affichée est 0). (2) Les ouvertures d'un même côté de mur qui se chevauchent sont déduites une seule fois : surface de l'union de leurs rectangles dans l'élévation (`unionArea`, `measurements.ts`). (3) Un mur de hauteur nulle déclenche l'avertissement `wallZeroHeight` (« hauteur nulle », non bloquant) avec texte et conseil français.
- Écarts voulus : seuls les plans où une ouverture dépasse de son mur ou en chevauche une autre changent de métré (jamais ceux de la baseline M17 : référence inchangée, aucun fichier de référence modifié). Deux anciens tests avaient des ouvertures qui se chevauchaient de 50 mm sans le vouloir : elles sont écartées, valeurs attendues inchangées.
- Preuves : les trois `it.todo` d'EDGE-01 deviennent des tests (`fixtures.test.ts`) ; 4 tests de `measurements.test.ts` (dépassement, union, recouvrement en hauteur seule, surface jamais négative). Baseline M17 (28 tests : métrés, tableaux Client / Exécution, CSV, XLSX, IFC, SVG, repères `M01` / `P01` / `F01`) identique à travers la scène.
- Rapport : `docs/phases/M18-report.md` (critères G1, décisions, limites, mise en ligne).
- Commit : feat(m18): métrés sur la scène et corrections EDGE-01 (lot F)

### 2026-11-18 — M18 · Lot E : collaboration et commentaires sur la scène Pascal
- Fait : `useCollaboration.ts` : un projet Plan partage sa scène Pascal (`SceneBinding` sur le `Y.Doc` de la salle, clés `sceneMeta` / `sceneNodes`, distinctes de l'ancien format) ; une fois synchronisée, elle remplace la scène locale de l'éditeur (`setSharedPlanBinding`) : un seul historique ; à la fin de la collaboration, retour à une scène locale. Projets Visuel : inchangés (`CollabBinding`).
- Commentaires (point 5 A) : `src/features/scene/commentAnchors.ts`, `src/features/comments/commentAnchoring.ts` : un commentaire posé sur un élément d'un plan est enregistré sur le nœud qui le porte (premier côté d'un mur à plusieurs côtés), relu sur l'élément affiché ; les commentaires d'avant M18 restent valables.
- Correctif trouvé par les tests : au retour en scène locale, la scène gardée avec le projet n'est reprise que si elle correspond exactement à l'affichage (sinon le dernier geste aurait été perdu).
- Preuves : `commentAnchors.test.ts` (ancres, anciens commentaires, épingle qui suit son mur déplacé par un autre éditeur), `editorStore.scene.test.ts` (geste reçu par l'autre personne, annuler ne défait que ses gestes, retour en local sans perte) ; 3063 tests Fabrics OK.
- À vérifier dans deux navigateurs (serveur temps réel local) à la fin de M18.
- Commit : feat(m18): collaboration et commentaires sur la scène Pascal (lot E)

### 2026-11-18 — M18 · Lot D : enregistrement de la scène, versions, duplication
- Fait : `src/features/scene/storedScene.ts` (format enregistré `{ format: 'pascal-scene', version: 5, sceneFormat, scene }`) ; `Project.scene` (scène du projet ouvert, tenue à jour par la liaison) ; lecture : `migrateProject` / `migrateDocument` reconnaissent les deux formats (anciens plans, versions, liens de partage) ; écriture : `toStoredProject` dans `LocalRepository`, `ResilientRepository` et `projectToRow` (Supabase) : un plan n'est enregistré que par sa scène ; suppression d'images : les images d'un plan en scène sont protégées (requête sur le document entier).
- Version 5 : une ancienne version de Fabrics refuse proprement un plan converti (« version plus récente »), sans l'écraser.
- Conversion de la base (point 3 B) : `src/features/scene/migrate/bulkMigration.ts` (pure, testée : métrés comparés avant / après, projet laissé intact au moindre écart), `scripts/migrate-plans-m18.ts` (`npm run migrate:plans`, essai à blanc par défaut, `--apply` exige les tables de sauvegarde de `supabase/m18-backup.sql` ; écrit seulement si le projet n'a pas changé depuis sa lecture) ; vérifié dans Node sur la grande maison. **Non lancé** : à faire à la mise en ligne de M18, avec l'accord de l'utilisateur. Les versions déjà enregistrées gardent leur ancien format (lues telles quelles).
- Preuves : `storedScene.test.ts` (plan enregistré par sa scène, rouvert avec les mêmes métrés, ancien plan rouvert puis réenregistré, duplication, versions des deux formats, refus d'une version plus récente) ; `bulkMigration.test.ts` (une pièce tracée sur une partie d'un espace est refusée et signalée).
- Vérification : build, lint, 3056 tests Fabrics OK. Tests de Pascal : un premier passage a planté (`nodes` arrêté sans résultat), le second a donné 3 tests du cœur au-delà de 5 s (`architecture.test.ts`, `cut-intent.test.ts`, `registry-isolation.test.ts`) ; relancés seuls : 15 réussis, 0 échec. Machine chargée, aucun fichier de Pascal modifié.
- Commit : feat(m18): enregistrement des plans en scène Pascal (lot D)

### 2026-11-18 — M18 · Lot C : la scène Pascal devient le document de l'éditeur
- Fait : `src/features/scene/yScene.ts` (scène dans un `Y.Doc`, une entrée par nœud et par propriété ; fonctions partagées avec `collab/yDocument.ts`) ; `sceneBinding.ts` (`SceneBinding` : chaque geste de l'éditeur → scène chargée par Pascal → seuls les nœuds modifiés écrits ; vue recalculée en gardant les objets inchangés) ; `modelEvents.ts` (« modèle changé ») ; `editorStore.ts` : un projet Plan ouvre sa scène dans un `Y.Doc` local, son historique (`Y.UndoManager`) remplace l'historique local (ADR 0005), les appuis rapides sur les flèches restent une seule étape ; `EditorHeader.tsx` (boutons annuler / rétablir).
- Comportement nouveau : une pièce fermée par des murs suit un mur déplacé (modèle de Pascal, ADR 0006), à la fin du geste.
- Preuves : `sceneBinding.test.ts` (créer, modifier, supprimer puis annuler : mêmes identifiants et dimensions, aucun élément fantôme ; geste en direct = une étape ; pièce qui suit son mur ; deux éditeurs : annuler ne défait que ses gestes) ; tests de l'éditeur repris (5 tests comptaient l'ancien historique : ils comptent maintenant les étapes réelles avec `undoDepth()`).
- Mesures : ~30 ms par geste sur le plan d'exemple, 70 à 90 ms sur la grande maison (machine chargée). Taille : le fichier principal de l'application passe de 1,6 à 2,7 Mo (cœur de Pascal) : chargement à part de l'éditeur de plan à prévoir (risque noté).
- Transitoire jusqu'au lot E : en collaboration, un plan passe encore par l'ancienne liaison (`CollabBinding`).
- Commit : feat(m18): la scène Pascal devient le document de l'éditeur (lot C)

### 2026-11-18 — M18 · Lot B : conversion plan Fabrics ↔ scène Pascal
- Fait : `src/features/scene/` : `migrate/fromFabrics.ts` (plan → scène, fonction pure : niveaux empilés comme Pascal, mur à N côtés → N `wall`, portes / fenêtres / baies → `door` / `window` sur leur côté, pièces → `zone`, mobilier → `item`, axes → `structural-grid`, cotes → `construction-dimension`) ; `nodes/fabricsNodes.ts` (coupe, toiture, escalier, cheminée, plateforme, textes, formes, images, fonds DXF : types déclarés par `registerNode`, sans modifier Pascal) ; `view/toFabricsView.ts` (vue calculée) ; `settle.ts` (chargement par Pascal) ; `view/roomClearFloor.ts`.
- Une seule conversion m ↔ mm : `mToMm` / `mmToM` de `src/features/units/format.ts` (arrondi au millionième de mm). `zod` lu dans la copie de Pascal (alias).
- Découvertes : (1) au chargement, Pascal reprend toute pièce fermée par des murs et la redessine à l'axe des murs ; **choix de l'utilisateur : modèle de pièces de Pascal** (ADR 0006), les métrés mesurent le sol intérieur calculé par Pascal ; (2) une dalle Pascal remonte les portes posées dessus (+150 mm sur la terrasse de la grande maison) : les plateformes restent des nœuds Fabrics.
- Preuves : aller-retour exact (plan de test avec chaque type, exemple, grande maison) ; scène validée par `validateBuildJson` ; 31 pièces sur 31 identiques (surface, périmètre, dimensions) après chargement par Pascal ; **baseline M17 complète identique par la scène** (28 tests) ; HOUSE-01 et HOUSE-02 conformes au calcul à la main pour ce que Fabrics calcule (pièces, murs, ouvertures, trémie ; volumes et dalles en M21) ; EDGE-01 exécuté : identifiants en double refusés avec une erreur claire, unités mêlées OK, 3 écarts de métrés (fenêtre hors du mur déduite, chevauchement non réduit à l'union, pas d'avertissement « hauteur nulle ») **à corriger dans M18, lot F** (choix de l'utilisateur).
- Commit : feat(m18): conversion plan Fabrics ↔ scène Pascal (lot B)

### 2026-11-18 — M18 · Lot A : branchement technique de Pascal
- Plan validé par l'utilisateur (`docs/phases/M18-plan.md`) : vue calculée (1 A), `Y.UndoManager` seul historique (2 A), **script de migration de la base Supabase (3 B)**, types de nœuds Fabrics par `registerNode` (4 A), repère du mur d'origine (5 A). Travail dans le dossier séparé `Fabrics-m18`, branche `feat/m18-bim-model`.
- Fait : `@pascal-app/core` résolu vers sa version compilée (`vite.config.ts`, `paths` dans `tsconfig.app.json`) ; script `npm run build:pascal`, ajouté en tête de `check:all` ; test d'architecture : seul `src/features/scene/` importe `@pascal-app/core` ; premier test (`src/features/scene/smoke.test.ts`) : un mur Pascal validé depuis Fabrics ; ADR 0004 (vue calculée) et 0005 (un seul historique) ; `docs/05-INSTALLATION.md`.
- À noter : dès que l'application elle-même importera Pascal (lot C), Cloudflare Pages devra aussi installer et compiler Pascal (commande de build à changer, avec l'accord de l'utilisateur).
- Commit : feat(m18): branchement de @pascal-app/core (lot A)

### 2026-11-18 — M17 · Fixtures : murs pleine hauteur, dalle découpée
- Décision de l'utilisateur : les murs passent sur toute la hauteur et la dalle est découpée autour (remplace « la dalle prime »).
- Fait : HOUSE-02 : murs sur 3000 mm aux deux niveaux (nets 294,44 m², 48,838 m³) ; dalle de l'étage 80 − 8,75 (emprise des murs du RdC) − 4,51 (trémie) = 66,74 m², 13,348 m³ ; total murs + dalles 78,186 m³ (inchangé, sans recouvrement). HOUSE-01 inchangé.
- Commit : docs(m17): fixtures avec murs pleine hauteur et dalle découpée

### 2026-11-18 — M17 · Décisions sur les fixtures
- Décisions de l'utilisateur : baie hors du mur **rejetée** (jamais déplacée en silence) ; baies qui se chevauchent : chevauchement **signalé**, surface de l'**union** déduite ; dalles placées comme dans Pascal (dessus à l'altitude du niveau, épaisseur vers le bas) et la **dalle prime** sur les murs (murs arrêtés sous la dalle du dessus).
- Fait : `fixtures/*/spec.json` mis à jour. HOUSE-02 : murs du rez-de-chaussée mesurés sur 2800 mm ; murs et dalles ajoutés aux résultats attendus (murs nets 283,98 m², 47,088 m³ ; dalles 31,098 m³ ; total 78,186 m³ sans recouvrement). EDGE-01 : cas 1 et 2 précisés (hauteur 1350 mm, allège 900 mm ; union 2,70 m²). HOUSE-01 inchangé.
- Commit : docs(m17): décisions sur les fixtures (rejet, union, altitude des dalles)

### 2026-11-18 — M17 · Relecture des fixtures HOUSE-01, HOUSE-02, EDGE-01
- Fait : rapport de relecture de l'utilisateur enregistré (`docs/phases/M17-fixtures-review.md`). HOUSE-01 et HOUSE-02 : calculs confirmés, aucune erreur arithmétique. EDGE-01 : sept cas analysés, **aucun test exécuté** (à faire en M18).
- Décisions à prendre : rejet ou décalage d'une baie hors mur ; déduction des chevauchements de baies ; altitudes des dalles pour éviter le double comptage murs + dalles.

### 2026-11-18 — M17 · CI GitHub verte sur Linux
- Fait : premier passage de la CI en échec (929 puis 23 échecs). Causes : paquets de Pascal non compilés (étape turbo build ajoutée) ; tests IFC qui lisent des fichiers d'exemple absents de Git (6 fichiers sautés en CI, uniquement quand les fichiers manquent). Diagnostic des échecs ajouté dans `scripts/test-pascal.mjs`.
- Résultat : `check:all` vert sur Linux (run `a89a7f0`). Pas de fichier de référence Linux : tout échec est bloquant.
- Détails : `docs/phases/M17-report.md` § 8.
- Commits : `f5dc4e4`, `edcefca`, `a89a7f0`

### 2026-11-18 — M17 · Audit et intégration de Pascal (gate G0)
- Fait : outils (Node 26.13.1, Bun 1.4.4) ; Pascal lancé dans son dossier (19 394 réussis, 71 échecs Windows, 8 ignorés) ; baseline Fabrics (`baseline/fabrics/`, 24 fichiers) et fixtures HOUSE-01 / HOUSE-02 / EDGE-01 ; `docs/capabilities.md`, `docs/regression-checklist.md`, `docs/screen-map.md` (D80) ; ADR 0001 à 0003 ; copie de Pascal dans `packages/pascal/` (code inchangé), installée par Bun (`npm run install:pascal`) ; scripts `test:pascal`, `lint:pascal`, `check:duplicates`, `check:all` ; GitHub Actions ; IfcOpenShell (`tools/ifc/`) ; `THIRD_PARTY_NOTICES.md`, `docs/risks.md`.
- Résultat clé : tests de Pascal intégré **identiques** à ceux de son dossier, paquet par paquet ; lint Biome identique ; `src/` n'importe rien de Pascal (application inchangée).
- Décisions de l'utilisateur : Lingui retenu pour les traductions (doublon `fr.ts` / Lingui) ; jscpd validé (seuil 1,2 %, mesuré 1,05 %).
- Constats : workspaces npm abandonnés au profit d'une installation Bun séparée (versions différentes de `bun.lock`, 3 échecs de plus dans `viewer`, ADR 0002) ; export IFC de Fabrics non strictement valide (R14, M22) ; licences des objets 3D, textures et sons de Pascal à vérifier.
- Détails : `docs/phases/M17-report.md`.
- Commits : `feat(m17): baseline Fabrics…`, `feat(m17): contrôle IFC…`, `fix(m17): CSV de la baseline…`, `feat(m17): intégration de Pascal Editor…`, `docs(m17): rapport…`

### 2026-11-18 — Roadmap · effets, navigation et UX de Pascal (D81)
- Fait : décision D81 ; M19 lot A liste les effets visuels et sonores, modes et options de navigation, gestes et prise en main de Pascal à garder tels quels, avec un critère de comparaison côte à côte.
- Aucun code modifié.
- Commit : docs: effets, navigation et UX de Pascal (D81)

### 2026-11-17 — Roadmap · interface et prise en main de Pascal (D80)
- Fait : décision D80 (toute l'interface de Pascal, en restant sur Vite) ; `docs/03-ROADMAP.md` : principe mis à jour, carte des écrans ajoutée en M17, M19 devient « Interface Pascal et édition 2D/3D professionnelle » avec un lot A Interface ; doublons `fr.ts` / Lingui et composants d'interface ajoutés ; `CLAUDE.md`, `docs/01-PRODUIT.md`, `docs/02-ARCHITECTURE.md` alignés.
- Aucun code modifié.
- Commit : docs: interface et prise en main de Pascal (D80)

### 2026-11-17 — Roadmap · phase « Fabrics + Pascal » (M17 → M25)
- Fait : la roadmap Pascal / IfcOpenShell téléchargée par l'utilisateur est adaptée à Fabrics et intégrée dans `docs/03-ROADMAP.md`, **seul roadmap officiel** : principe « Fabrics + Pascal Editor + amélioration », règle RÉUTILISER → ÉTENDRE → REMPLACER, mécanismes anti-duplication et anti-régression, 17 modules finaux, fixtures HOUSE-01 / HOUSE-02 / EDGE-01 en mm, jalons M17 à M25 avec gates G0 à G8, risques.
- Audit de Pascal (clone local, commit `7f30521`, MIT) : monorepo bun avec `core`, `viewer`, `editor`, `nodes`, `ifc-converter`, `geometry-script`, `mcp`, `cli` ; mêmes versions de three (0.187), React (19.3) et R3F (9.8) que Fabrics ; scène en mètres ; rendu WebGPU avec repli WebGL2 ; IFC import (web-ifc) et export IFC4 ; Fabrics est en avance sur les façades, coupes, cotes Client / Exécution, collaboration, versions et commentaires.
- Décisions D75 à D79 (ci-dessous). Docs mises à jour : `CLAUDE.md` (périmètre, licences, règles globales, commandes), `docs/01-PRODUIT.md`, `docs/02-ARCHITECTURE.md` (dépendances, « Intégration de Pascal Editor »), `docs/06-BIBLIOTHEQUE.md`.
- Aucun code modifié.
- Commit : docs: roadmap Fabrics + Pascal (M17 à M25)

### 2026-11-16 — Mise en ligne · collaboration en direct activée sur le site publié
- Constat : le code local, GitHub et le site Cloudflare Pages étaient identiques, mais `VITE_COLLAB_URL` n'existait que dans `.env.local`. Le site en ligne n'avait donc pas d'adresse de serveur temps réel : pas d'édition à plusieurs, pas de présence, pas de « En direct ». Supabase (toutes les tables) et le Worker `fabrics-collab` répondaient normalement.
- Fait (par l'utilisateur) : variable `VITE_COLLAB_URL=https://fabrics-collab.harinosy-tradeco.workers.dev` ajoutée dans Cloudflare Pages (Production, texte simple), puis site redéployé.
- Vérification : l'adresse du Worker est présente dans le code publié (`index-DaRcZNRl.js`) ; collaboration en direct validée par l'utilisateur sur https://fabrics-8zd.pages.dev.
- À retenir : toute nouvelle variable `VITE_*` doit être ajoutée **aussi** dans Cloudflare Pages, puis le site redéployé (Vite l'intègre au moment de la construction).

### 2026-11-15 — Hors jalon · « Commenter » hors de la colonne d'outils, en-tête poli
- Demande de l'utilisateur : « Commenter » faisait intrus parmi les outils de dessin (libellé coupé « Commen… »). Choix sur maquettes : variante 1 (en-tête + panneau).
- Fait : outil retiré de la colonne ; bouton bulle dans l'en-tête avec le nombre de fils ouverts (ouvre l'onglet Commentaires, état enfoncé quand l'onglet est affiché) ; bouton « + Nouveau » en haut de l'onglet (lance l'outil, la touche C marche toujours) ; texte d'aide de l'onglet qui change pendant la pose.
- Polissage de l'en-tête : tous les contrôles à 32 px (44 px au doigt) avec le même arrondi que les barres du plan ; contour de focus clavier sur chaque bouton ; trois groupes séparés (historique, vues, actions) ; nom du projet qui s'élargit selon sa longueur, fond au survol et infobulle « Cliquez pour renommer » ; bouton du panneau (petit écran) déplacé à droite, du côté où le panneau s'ouvre ; pastille « points à vérifier » alignée avec contour de focus.
- Fichiers : `EditorHeader.tsx`, `CommentsPanel.tsx`, `Toolbar.tsx`, `PlanCheckBadge.tsx`, `fr.ts`.
- Vérification : build ✓ lint ✓ tests ✓ (2949). À vérifier par l'utilisateur dans le navigateur.

### 2026-11-15 — Correctif · « Dessiner un plan » ne faisait rien une fois connecté
- Cause : depuis M14 lot B, la règle de lecture de `projects` (`projects_select_member`) passait uniquement par `my_project_role(id)`. Or l'enregistrement (`upsert` = `insert … on conflict do update`) doit aussi satisfaire la règle de lecture **sur la nouvelle ligne** ; à la création, `my_project_role` ne trouve pas encore le projet et renvoie null : la base refusait toute création (nouveau plan, exemples, copie). L'erreur n'était pas affichée, donc le clic semblait sans effet.
- Fait : règle remplacée par `owner_id = auth.uid() or my_project_role(id) is not null` dans `supabase/schema.sql` (à ré-exécuter dans Supabase). Sans compte (mode local), le clic ouvrait déjà l'éditeur (vérifié dans un navigateur automatique).
- Fichiers : `supabase/schema.sql`, `docs/PROGRESS.md`.
- Vérification : build ✓ lint ✓ tests ✓ — SQL exécuté dans Supabase et création d'un plan connecté **validée par l'utilisateur le 2026-11-15**.
- Commit : fix: création de projet refusée par la règle RLS de lecture

### 2026-11-13 — Hors jalon · Échelle écrite en chiffres dans le cartouche

- Le cartouche des PDF n'a plus de barre d'échelle graphique (0 · 2000 · 4000 mm) : l'échelle s'écrit en chiffres dans la cellule « Échelle » ; la flèche du nord reste à gauche.
- Le format reste « 1:50 » partout (le passage à « 1/50 » a été annulé à la demande).
- Retrait de la barre d'échelle annulé : elle est de retour dans le cartouche, à côté de la flèche du nord.

### 2026-11-13 — Hors jalon · Audit UX/UI, troisième lot

- Propriétés sans sélection : l'aide passe dans un encadré indigo avec icône ; « Taille de la page » est repliée pour un plan (ouverte pour un visuel).
- Calques : pastilles par type (Meubles, Murs, Pièces, Ouvertures, Cotes, Autres) avec leur nombre ; poignée et flèches visibles au survol, au focus, sur la ligne choisie et au toucher ; le glisser-déposer reste réservé à la liste complète.
- Niveaux : les deux boutons de transparence prennent des flèches distinctes (niveau du dessous / du dessus).
- Barre d'outils : chevrons des sous-menus plus larges et plus contrastés.

### 2026-11-13 — Hors jalon · Audit UX/UI, deuxième lot

- Plan : nom et surface des pièces dessinés au-dessus des meubles, de l'escalier et des axes (nouvelle couche `RoomLabelsLayer`), avec un liseré clair ; ils ne disparaissent plus dessous. Pendant le déplacement d'une pièce, son étiquette rejoint sa place au lâcher.
- Ouverture d'un plan : le zoom cadre le dessin (et non la page entière), en tenant compte de la barre d'outils et des sélecteurs ; sur téléphone le plan est enfin lisible.
- Métrés, vue Client : les surfaces s'affichent juste après le niveau et la pièce, visibles sans faire défiler (l'ordre du fichier exporté ne change pas).
- Miniatures : cadrées sur le dessin ; un plan ouvert sans miniature (maison d'exemple) en reçoit une.
- Sélecteur de niveau : largeur minimale quand la 3D réduit la place.

### 2026-11-13 — Hors jalon · Corrections issues de l'audit UX/UI

- Messages de l'éditeur : vert pour une confirmation (« Mur corrigé »), rouge pour un échec (jamais refermé tout seul), ambre pour une information ; le minuteur s'arrête au survol ; annonce lecteur d'écran adaptée.
- Téléphone : barre d'outils réduite à ses icônes, sélecteur de niveau et cotation sur deux lignes au lieu d'être écrasés.
- Métrés : phrase qui explique « Client » et « Technique » sous le sélecteur.
- Export PDF : bouton « Utiliser l'échelle 1:N » dans l'alerte quand le plan ne tient pas sur la feuille ; note d'impression plus lisible.
- Textes : « Polyligne » devient « Murs enchaînés », « Mur droit » devient « Un seul mur », « Données à plat » devient « Une seule liste », « en mètres » retiré de l'infobulle 3D.
- Bibliothèque : les pastilles vides (Récents, Mes ensembles) restent cachées.
- Focus clavier : anneau indigo commun à tous les boutons, liens et champs.
- Restent à traiter (audit) : étiquettes de pièces masquées par les meubles sur le plan, tableau « Client » des métrés trop large, ajustement du zoom au contenu sur téléphone, panneau 3D + panneau de droite trop larges ensemble, vignettes des projets récents.

### 2026-11-13 — Hors jalon · Audit UX/UI de l'application

- Couleurs : palette déjà cohérente (gris ardoise + indigo, ambre / rouge / vert réservés aux alertes) ; seuls des gris trop clairs (`slate-400`) sur du texte sont passés à `slate-500` (suffixe « mm », compteurs de la bibliothèque, calques).
- Éditeur sur téléphone et tablette : le panneau de droite occupait tout l'écran et écrasait le plan. Sous 1024 px il devient un tiroir (bouton dans l'en-tête, fond voilé, bouton de fermeture) ; l'en-tête passe en icônes pour tout garder visible ; la mini-carte est masquée sous 768 px.
- Dialogue d'export : formats rangés en trois colonnes (IFC ne reste plus seul sur une ligne).

### 2026-11-13 — Hors jalon · Passe de lisibilité sur l'application

- Éditeur : panneau de droite élargi (22 rem) pour que les cinq onglets respirent, textes de 11 px passés à 12 px (formats de page, bibliothèque, raccourcis), onglets avec focus clavier visible.
- Accueil : rappel de stockage local en 14 px, chevrons des maisons d'exemple plus lisibles.

### 2026-11-13 — Hors jalon · Finition de la scène du hero

- Onglets, phrase et scène réunis dans un seul bloc, à angles droits (plus de bords arrondis dans le hero).
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

### 2026-11-15 — M16 · Lots D et E : validés (fin du jalon M16)
- L'utilisateur a fait les essais à deux comptes et validé les lots D et E, donc le jalon M16.

### 2026-11-15 — M16 · Lots D et E : lecteurs et direct (codés, à tester à la fin du jalon)
- Choix par défaut (l'utilisateur n'a pas tranché) : sur la page d'un lecteur, les épingles sont visibles dès l'ouverture, comme chez les éditeurs.
- Fait (D) : un membre invité en lecture voit les épingles, a l'onglet « Commentaires » (même liste et mêmes fils), un bouton « Commenter » dans l'en-tête, et peut poser un commentaire, répondre, résoudre, rouvrir, modifier et supprimer les siens. Il ne peut toujours rien modifier dans le plan. Rien sur le lien public de partage ni dans l'aperçu d'une version.
- Fait (E) : les nouveaux commentaires, réponses, modifications et résolutions arrivent en direct chez les autres (Supabase Realtime). Relecture complète à la (re)connexion du direct et toutes les 30 s.
- Limites connues : les suppressions n'arrivent pas en direct (au plus 30 s de retard, par la relecture) ; avec l'outil « Commenter » actif, un lecteur ne peut pas déplacer la vue en glissant (il quitte l'outil avec le bouton) ; le direct n'a pas pu être essayé sans deux comptes réels.
- Fichiers : `src/features/comments/commentsLogic.ts` (+ test : `parseCommentRow`), `src/stores/commentsStore.ts` (`upsertComment`), `src/components/editor/{useComments,EditorStage,ReadOnlyViewer,ReadOnlySidePanel}.tsx`, `src/pages/SharedProjectPage.tsx`, `docs/02-ARCHITECTURE.md`, `docs/03-ROADMAP.md`.
- Vérification : build ✓ lint ✓ tests ✓ (2949). Non fait ici : essais dans le navigateur (deux comptes nécessaires).
- **Essais à faire** (`npm run dev`, deux fenêtres : une normale pour A propriétaire, une privée pour B invité **en lecture**, même plan) :
  1. *Lecteur voit* : B ouvre le plan ; il voit les épingles existantes et l'onglet « Commentaires » (ouvert par défaut), avec la même liste que A.
  2. *Lecteur commente* : B clique « Commenter » dans l'en-tête, clique sur un mur, écrit, Entrée → l'épingle apparaît ; il revient seul à la sélection (bouton non enfoncé). B ne peut pas déplacer ni modifier le plan.
  3. *Lecteur répond / résout* : B répond au fil de A, le résout, le rouvre. B n'a un crayon et une poubelle que sur ses propres messages.
  4. *Direct A voit B* : pendant que B commente, A voit apparaître l'épingle et la réponse **sans recharger** (en quelques secondes). Idem pour une résolution (l'épingle s'estompe) et un texte modifié.
  5. *Direct B voit A* : A pose un commentaire, B le voit apparaître sans recharger ; la pastille de A et le filtre « Ouverts » se mettent à jour.
  6. *Suppression* : A supprime un commentaire ; chez B il disparaît au plus tard après 30 s.
  7. *Coupure* : B coupe le réseau (F12 → Réseau → Hors connexion), A commente, B remet le réseau → le commentaire de A apparaît chez B (relecture à la reconnexion).
  8. *Lien public* : le lien de partage public `/s/…` n'affiche ni épingle, ni onglet, ni bouton « Commenter ».
  9. *Aperçu de version* : l'aperçu d'une version n'affiche pas de commentaires.

### 2026-11-15 — M16 · Lot C : validé
- L'utilisateur a fait les essais et validé le lot C.

### 2026-11-15 — M16 · Lot C : fils et panneau « Commentaires » (codé, à tester)
- Fait : onglet « Commentaires » dans le panneau de droite (avec un compte connecté), avec une pastille qui compte les fils ouverts. Liste filtrable (Ouverts, Résolus, Tous), du fil le plus récemment commenté au plus ancien : numéro et couleur de l'auteur, auteur, début du texte, date de la dernière activité, nombre de réponses, niveau (s'il y en a plusieurs), « Résolu ». Cliquer un fil (ou son épingle sur le plan) l'ouvre : le plan affiche son niveau et se centre sur l'épingle (qui est cerclée). Dans un fil : commentaire et réponses (auteur, date, « modifié »), Résoudre / Rouvrir, Modifier (son propre texte), Supprimer (le sien, ou n'importe lequel pour le propriétaire du projet ; confirmation, les réponses partent avec), zone de réponse (Entrée envoie), « Voir sur le plan », « Élément supprimé » quand l'ancre n'existe plus.
- Pas encore : commentaires des membres lecteurs (lot D) ; direct (lot E, relecture toutes les 30 s en attendant).
- Fichiers : `src/features/comments/commentsLogic.ts` (+ test : extrait, tri par activité, niveau, droits), `src/stores/commentsStore.ts` (fil ouvert, rôle, remplacer / retirer), `src/components/editor/{CommentsPanel,CommentThreadView,CommentReplyBox,focusThread,CommentPinsLayer,SidePanel,useComments}.ts(x)`, `src/stores/editorStore.ts` (onglet), `src/i18n/fr.ts`, `docs/02-ARCHITECTURE.md`, `docs/03-ROADMAP.md`.
- Vérification : build ✓ lint ✓ tests ✓ (2944). Non fait ici : essai dans le navigateur (compte connecté nécessaire).
- **Essais à faire** (`npm run dev`, compte connecté ; idéalement deux comptes, A propriétaire et B invité en édition) :
  1. *Onglet* : l'icône bulle apparaît dans la colonne d'onglets à droite ; une pastille indique le nombre de fils ouverts.
  2. *Liste* : poser 3 commentaires (outil Commenter) ; ils apparaissent dans la liste, le plus récent en haut ; les filtres Ouverts / Résolus / Tous fonctionnent.
  3. *Ouvrir* : cliquer un fil de la liste → le plan se centre sur son épingle (cerclée) ; cliquer une épingle sur le plan ouvre le panneau sur ce fil.
  4. *Niveaux* : cliquer un fil posé à l'étage depuis le rez-de-chaussée → le plan passe à l'étage.
  5. *Répondre* : écrire une réponse, Entrée → elle s'ajoute ; le compteur « 1 réponse » apparaît dans la liste.
  6. *Résoudre* : Résoudre → le fil passe dans « Résolus », son épingle s'estompe, la pastille diminue ; Rouvrir le remet dans « Ouverts ».
  7. *Modifier* : crayon sur son commentaire → modifier → « modifié » apparaît ; on ne voit pas de crayon sur le commentaire d'un autre.
  8. *Supprimer* : poubelle → confirmation ; supprimer un fil avec réponses prévient qu'elles partent aussi. B ne peut supprimer que les siens, A (propriétaire) peut supprimer tous les commentaires.
  9. *Élément supprimé* : supprimer le mur d'un commentaire → dans le fil, « Élément supprimé » ; le fil reste lisible.
  10. *Deux comptes* : B répond, et A voit la réponse au plus tard 30 s après (le direct arrive au lot E).

### 2026-11-15 — M16 · Lot B : validé
- L'utilisateur a fait les essais et validé le lot B.

### 2026-11-15 — M16 · Lot B : poser un commentaire (codé, à tester)
- Choix de l'utilisateur : un clic sur un élément attache le commentaire à cet élément (l'épingle le suit).
- Fait : outil « Commenter » (touche C, famille « Commentaire » de la barre d'outils, avec un compte connecté seulement). Clic sur un élément ou dans le vide : bulle de saisie au point cliqué (« Sur : <élément> » quand il est attaché), Entrée envoie, Maj + Entrée retour à la ligne, Échap annule, compteur près de 2000 caractères, message si l'envoi échoue. Épingles numérotées à la couleur de l'auteur sur le niveau affiché ; estompées pour un fil résolu ou un élément supprimé ; infobulle au survol (auteur, début du texte, réponses). Après l'envoi, retour à l'outil Sélection. Couche des épingles absente des exports et de la miniature ; commentaires hors de l'historique d'annulation.
- Pas encore : ouvrir un fil en cliquant l'épingle, répondre, résoudre, modifier, supprimer (lot C) ; commentaires des membres lecteurs (lot D) ; direct (lot E, relecture toutes les 30 s en attendant).
- Test modifié : « C » seul n'est plus « aucune action » (c'est l'outil Commenter) ; Ctrl + C copie toujours.
- Limite : la visée utilise la boîte englobante d'un élément (sauf les murs) : imprécise pour une pièce en L.
- Fichiers : `src/features/comments/{commentTarget,commentTarget.test}.ts`, `src/stores/commentsStore.ts`, `src/components/editor/{CommentPinsLayer,CommentComposerOverlay,useComments}.ts(x)`, `EditorStage.tsx`, `Toolbar.tsx`, `ToolHint.tsx`, `shortcuts.ts` (+ test), `useEditorShortcuts.ts`, `src/stores/editorStore.ts`, `src/pages/EditorPage.tsx`, `src/i18n/fr.ts`, `docs/02-ARCHITECTURE.md`, `docs/03-ROADMAP.md`.
- Vérification : build ✓ lint ✓ tests ✓ (2934). Non fait ici : essai dans le navigateur (compte connecté nécessaire).
- **Essais à faire** (`npm run dev`, compte connecté, un plan avec des murs) :
  1. *Outil* : à gauche, un nouveau bouton « Commenter » (bulle) ; la touche C le choisit ; sans compte (ou déconnecté) il n'existe pas.
  2. *Sur un mur* : choisir l'outil, cliquer sur un mur → bulle « Sur : Mur … » ; écrire, Entrée → une épingle « 1 » apparaît au milieu du mur et l'outil repasse à Sélection.
  3. *L'épingle suit* : déplacer ce mur → l'épingle le suit. Supprimer le mur → l'épingle reste en place, estompée ; son infobulle dit « élément supprimé ».
  4. *Point libre* : cliquer dans le vide → bulle sans « Sur : » ; épingle « 2 » à cet endroit.
  5. *Infobulle* : survoler une épingle → auteur et début du texte.
  6. *Annuler la saisie* : Échap ou « Annuler » ferme la bulle sans rien créer ; changer d'outil aussi.
  7. *Niveaux* : un commentaire posé au rez-de-chaussée n'apparaît pas à l'étage.
  8. *Exports* : exporter en PNG ou PDF → aucune épingle sur le fichier ; la miniature de l'accueil non plus.
  9. *Rechargement* : recharger la page → les épingles sont toujours là (elles sont dans Supabase).
  10. *Annuler (Ctrl+Z)* : n'enlève pas un commentaire (il n'est pas dans l'historique du plan).

### 2026-11-15 — M16 · Lot A : validé
- L'utilisateur a exécuté le SQL dans Supabase : les 4 règles de sécurité (DELETE, INSERT, SELECT, UPDATE) sont en place et la diffusion en direct est active sur `project_comments`.

### 2026-11-15 — M16 · Lot A : base de données des commentaires (codé, à exécuter dans Supabase)
- Fait (`supabase/schema.sql`, section « M16 », **à ré-exécuter en entier dans Supabase**, sans risque) : table `project_comments` (commentaire = position obligatoire ; réponse = ni position ni ancre ; texte de 1 à 2000 caractères) ; règles de sécurité (lecture et création pour tout membre, lecteurs compris ; texte modifiable par l'auteur ; suppression par l'auteur ou le propriétaire ; l'auteur est toujours le compte connecté) ; déclencheur qui impose qu'une réponse réponde à un commentaire de premier niveau du même projet ; date de modification posée par la base ; fonction `set_comment_resolved` (tout membre) ; diffusion en direct activée sur la table. `project_people` renvoie aussi les auteurs de commentaires.
- Fait (application) : `src/features/comments/commentsLogic.ts` (+ test, 18 cas : fils, numéros, filtres, nettoyage du texte, position des épingles, élément supprimé) et `commentsApi.ts`. Rien n'est encore visible dans l'interface (lot B).
- Non vérifié ici : le SQL n'a pas pu être exécuté sur une vraie base (pas de PostgreSQL local) ; il est relu, à vérifier dans Supabase.
- Fichiers : `supabase/schema.sql`, `src/features/comments/{commentsLogic,commentsLogic.test,commentsApi}.ts`, `docs/02-ARCHITECTURE.md`, `docs/03-ROADMAP.md`.
- Vérification : build ✓ lint ✓ tests ✓.
- **Vérification dans Supabase** (SQL Editor, après avoir exécuté `schema.sql`) :
  ```sql
  select cmd, policyname from pg_policies where tablename = 'project_comments' order by cmd;
  select exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and tablename = 'project_comments') as direct_actif;
  ```
  Attendu : 4 règles (DELETE, INSERT, SELECT, UPDATE) et `direct_actif` = true. Le vrai essai (poser un commentaire) se fera avec le lot B.

### 2026-11-15 — M15 bis · Lot D : métrés en direct et onglets en rail (fin du jalon)
- **Validé par l'utilisateur dans le navigateur : jalon M15 bis terminé.**
- Lot C validé par l'utilisateur dans le navigateur.
- Fait : barre « métrés en direct » en bas à droite d'un plan (pièces, surface des pièces, longueur des murs du niveau affiché, lien « Métrés › » vers l'onglet) ; recalcul différé (`useDeferredValue`) pour garder le dessin fluide. La mini-carte se pose au-dessus. Quand le plan fait moins de 768 px de large (requête de conteneur), la barre passe à gauche au-dessus de la barre d'état et la mini-carte reste en bas à droite : aucun chevauchement. Panneau de droite : onglets en colonne d'icônes à droite, nom en infobulle au survol ou au clavier ; largeur portée à 25,25rem pour garder 22rem de contenu.
- Historique git : le code de ce lot est entré dans `main` avec le commit `7b566c9` (« M16 lot B »), parce qu'une autre session l'a committé en même temps que les commentaires, alors que le lot était encore en cours ; le contenu est identique et complet.
- Logique pure : `liveMetresSummary` (`features/measurements/liveSummary.ts`, + 3 tests).
- Fichiers : `LiveMetresBar.tsx` (nouveau), `liveSummary.ts` et `liveSummary.test.ts` (nouveaux), `MiniMap.tsx`, `SidePanel.tsx`, `EditorPage.tsx`, `fr.ts`.
- Vérification : build ✓ lint ✓ tests ✓ (2937 ; test de durée « 600 murs » instable au passage complet, vert seul). À vérifier par l'utilisateur dans le navigateur.

### 2026-11-15 — M15 bis · Lot C : barre d'état en bas à gauche
- Lot B validé par l'utilisateur dans le navigateur.
- Fait : barre d'état dans le style de la barre « Niveau · Cotation » : boutons − / + (un cran = 25 %, centré sur le milieu de l'écran), pourcentage, ajuster à l'écran, « Impression 1:50 » (plans), nord « ▲ N 0° » (flèche rouge tournée selon le nord du plan), mini-carte. La grande boussole disparaît : un clic sur « N 0° » l'ouvre en petite fenêtre au-dessus de la barre (fermée au clic ailleurs ou avec Échap, et fermée à l'ouverture d'un projet ; elle n'est plus mémorisée dans le navigateur). Page en lecture seule : nord affiché, non réglable.
- Logique pure : `zoomStepAtCenter` dans `navigation.ts` (+ 3 tests dans `zoomStep.test.ts`).
- Fichiers : `ZoomControls.tsx`, `CompassWidget.tsx`, `compassStore.ts`, `navigation.ts`, `zoomStep.test.ts`, `EditorPage.tsx`, `ReadOnlyViewer.tsx`, `fr.ts` (anciens libellés « Zoom 19 % · Impression… » et « Afficher la boussole » retirés).
- Vérification : build ✓ lint ✓ tests ✓ (2933 ; le test de durée « 600 murs » a échoué une fois au passage complet, vert relancé seul : problème connu). À vérifier par l'utilisateur dans le navigateur.

### 2026-11-15 — M15 bis · Lot B : rail d'outils à gauche
- Lot A validé par l'utilisateur dans le navigateur.
- Fait : la barre d'outils devient un rail de 64 px collé au bord gauche (hors du canevas, qui commence à sa droite). Chaque famille = une tuile icône + libellé court ; un petit coin en haut à droite de la tuile ouvre la liste de la famille (comme avant : second clic sur l'outil actif ou clic droit). Bouton d'aide (raccourcis) déplacé en bas du rail, retiré de la barre de zoom. La barre « Niveau · Cotation » se cale désormais à 12 px du bord du plan.
- Fichiers : `Toolbar.tsx`, `EditorPage.tsx`, `ZoomControls.tsx`.
- Vérification : build ✓ lint ✓ tests ✓ (2922). À vérifier par l'utilisateur dans le navigateur.

### 2026-11-15 — M15 bis · Lot A : en-tête et barre « Niveau · Cotation »
- Contexte : l'utilisateur a comparé trois maquettes de l'éditeur et retenu une synthèse ; nouveau jalon M15 bis (4 lots) ajouté avant M16.
- Fait : en-tête réordonné (annuler / rétablir, séparateur, 3D avec libellé, Vues, Partager, **Exporter en bouton principal**). Niveau et cotation réunis dans une seule carte (`PlanContextBar`) ; le niveau devient un menu « Niveau  Rez-de-chaussée ▾ » (niveau le plus haut en premier), les interrupteurs de transparence restent dans la carte. Page en lecture seule : même carte, sans la cotation.
- Fichiers : `PlanContextBar.tsx`, `useDismiss.ts`, `ui/menuStyles.ts` (nouveaux), `LevelSelector.tsx`, `DimensioningSelector.tsx`, `EditorHeader.tsx`, `ReadOnlyViewer.tsx`, `EditorPage.tsx`, `fr.ts`.
- Changement d'habitude : changer de niveau demande maintenant deux clics (ouvrir le menu, choisir) au lieu d'un.
- Vérification : build ✓ lint ✓ tests ✓ (2922). À vérifier par l'utilisateur dans le navigateur.

### 2026-11-15 — M15 · Lots C et D : validés (fin du jalon M15)
- L'utilisateur a fait les essais et validé les lots C et D, donc le jalon M15.

### 2026-11-15 — M15 · Lots C et D : aperçu, changements, restaurer, faire une copie (codés, à tester)
- Fait (C) : cliquer une version dans « Historique » ouvre son aperçu `/p/<projet>/versions/<version>` en lecture seule (aucun enregistrement, aucune collaboration). Bandeau : nom ou date, auteurs, « Depuis la version précédente : N ajoutés / modifiés / supprimés » avec légende, « Revenir au projet ». Sur le plan : contour vert (ajouté), orange (modifié), rouge pointillé (supprimé), niveau par niveau. À droite : Historique (version affichée mise en évidence ; la session qui la contient s'ouvre) et Métrés de la version. Un membre lecteur a maintenant le même panneau sur sa page (sans « Nommer »).
- Fait (D) : « Restaurer cette version » (éditeurs, propriétaire) : retour à l'éditeur, attente de la collaboration, version « Avant restauration de « … » », puis remplacement du plan comme une modification normale (partagée en direct, Ctrl+Z l'annule). « Faire une copie » (tout membre) : nouveau projet à son nom, ouvert aussitôt.
- Limites connues : restaurer demande la connexion au serveur temps réel quand il est configuré (sinon message et rien n'est fait) ; la copie d'un plan avec images dépend du dossier du propriétaire d'origine ; aperçu sans Realtime (liste relue toutes les 30 s).
- Fichiers : `src/features/versions/{versionDiff,pendingRestore}.ts` (+ tests), `versionsLogic.ts` (+ tests), `src/stores/versionPreviewStore.ts`, `src/stores/editorStore.ts` (`replaceDocument`, + test), `src/components/editor/{ChangesLayer,VersionBanner,ReadOnlySidePanel,HistoryPanel,HistorySessionItem,ReadOnlyViewer,EditorStage}.tsx`, `usePendingRestore.ts`, `useCollaboration.ts` (`isCollaborationConfigured`), `src/pages/{VersionPreviewPage,SharedProjectPage,EditorPage}.tsx`, `src/App.tsx` (route), `src/i18n/fr.ts`, `docs/02-ARCHITECTURE.md`, `docs/03-ROADMAP.md`.
- Vérification : build ✓ lint ✓ tests ✓ (2904). Non fait ici : essais dans le navigateur (compte connecté nécessaire).
- **Essais à faire** (`npm run dev`, compte connecté, un plan avec quelques versions) :
  1. *Aperçu* : Historique → cliquer une version. Le bandeau jaune apparaît ; on peut zoomer, changer de niveau, mais rien ne se modifie. Les éléments ajoutés depuis la version précédente sont entourés en vert, les modifiés en orange, les supprimés en rouge pointillé. L'onglet Métrés montre les quantités de cette version.
  2. *Navigation* : cliquer une autre version dans le panneau de droite de l'aperçu ; « Revenir au projet » rouvre l'éditeur normal.
  3. *Restaurer* : sur une ancienne version, « Restaurer cette version » → l'éditeur s'ouvre, le message « Version … restaurée » s'affiche, le plan est celui de la version. Dans Historique, une version « Avant restauration de … » est apparue. Ctrl+Z remet le plan d'avant.
  4. *À deux* : B a le plan ouvert pendant que A restaure → B voit le plan restauré en direct.
  5. *Faire une copie* : « Faire une copie » → un nouveau projet « <nom> (version du …) » s'ouvre ; il apparaît sur l'accueil.
  6. *Lecteur* : un compte invité en lecture voit l'onglet Historique sur sa page, peut ouvrir un aperçu et faire une copie, mais ne voit ni « Nommer » ni « Restaurer ».

### 2026-11-15 — M15 · Lots A et B : validés
- L'utilisateur a exécuté le SQL dans Supabase et validé le panneau « Historique ».

### 2026-11-15 — M15 · Lot B : panneau « Historique » (codé, à vérifier)
- Fait : onglet « Historique » dans le panneau de droite (seulement avec un compte connecté). Versions par jour (« Aujourd'hui », « Hier », puis la date), une carte par session (heures de début et de fin, nom s'il y en a un, auteurs avec photo ou initiales et couleur), « Voir les N étapes » pour déplier les étapes d'une session, case « Versions nommées seulement ». Bouton « Nommer » (copie l'état enregistré du projet, après la fin de l'enregistrement en cours), crayon pour nommer ou renommer une version (nom vidé : redevient automatique). Liste relue à l'ouverture, toutes les 30 s et juste après chaque enregistrement.
- Avatar commun présence / historique : `src/components/ui/UserAvatar.tsx` (`PresenceAvatars` l'utilise).
- Pas encore : cliquer une version pour l'afficher (lot C), restaurer (lot D) ; historique pour les membres lecteurs (leur page en lecture seule) : à ajouter au lot C.
- Fichiers : `src/components/editor/{HistoryPanel,HistorySessionItem,VersionNameInput}.tsx`, `useVersions.ts`, `SidePanel.tsx`, `PresenceAvatars.tsx`, `src/components/ui/UserAvatar.tsx`, `src/stores/editorStore.ts` (onglet), `src/i18n/fr.ts`, `docs/02-ARCHITECTURE.md`, `docs/03-ROADMAP.md`.
- Vérification : build ✓ lint ✓ tests ✓ (2893). Non fait ici : essai dans le navigateur (demande le SQL du lot A dans Supabase et un compte connecté).

### 2026-11-15 — M15 · Lot A : base de données de l'historique (codé, à exécuter dans Supabase)
- Fait (`supabase/schema.sql`, section « M15 », **à ré-exécuter en entier dans Supabase**, sans risque) : table `project_versions` (une ligne = une étape de ~2 min ; `session_id` ; auteurs ; RLS lecture pour tout membre, aucune écriture directe) ; déclencheur `projects_record_version` (prolonge l'étape, ouvre une nouvelle étape ou session, verrou par projet, nettoyage D72, ne bloque jamais l'enregistrement du projet en cas d'erreur) ; fonctions `create_named_version`, `rename_version` (éditeurs et propriétaire), `project_people` (nom et photo pour tout membre, jamais l'e-mail complet).
- Fait (application) : `src/features/versions/versionsLogic.ts` (+ test : lignes → versions, regroupement jours → sessions → étapes, auteurs d'une session, filtre « nommées seulement », « Aujourd'hui » / « Hier », nom de version, personnes) et `versionsApi.ts` (lister, lire un document migré, nommer, renommer, personnes). Rien n'est encore visible dans l'interface (lot B).
- D72 précisée : étapes détaillées 24 h, puis une par session, puis une par jour après 30 jours.
- Non vérifié ici : le SQL n'a pas pu être exécuté sur une vraie base (pas de PostgreSQL local) ; il est relu, à vérifier dans Supabase.
- Fichiers : `supabase/schema.sql`, `src/features/versions/{versionsLogic,versionsLogic.test,versionsApi}.ts`, `docs/02-ARCHITECTURE.md`, `docs/03-ROADMAP.md`.
- Vérification : build ✓ lint ✓ tests ✓.

### 2026-11-15 — Planification · M15 (historique de versions) et M16 (commentaires ancrés)
- Choix de l'utilisateur parmi « Plus tard » : historique de versions, puis commentaires ancrés sans notifications.
- Décisions D71 à D74 notées ci-dessous ; roadmap M15 (lots A à D) et M16 (lots A à E) écrite ; principe ajouté à `docs/02-ARCHITECTURE.md`.

### 2026-11-15 — M14 · Lot F : validé (fin du jalon M14)
- L'utilisateur a fait les essais à deux navigateurs et validé le lot F, donc le jalon M14.

### 2026-11-15 — M14 · Lot F : persistance dans Supabase et reprise après coupure
- Constat : les modifications faites hors de la salle (connexion coupée dès l'ouverture, file hors connexion) étaient écrasées à la réouverture par l'ancienne version de la salle ; chaque modification reçue déclenchait l'enregistrement de tous les participants ; la coupure n'était pas expliquée à l'écran.
- Fait (F1) : `SupabaseRepository.save` renvoie l'heure du serveur (`updated_at`) ; `ResilientRepository` renvoie `null` quand le projet est resté sur l'appareil. Après chaque enregistrement réussi, l'heure est notée dans la salle (`meta.savedAt`, sans effet d'affichage ni d'annulation). À l'arrivée dans une salle déjà remplie, un projet enregistré après cette heure est envoyé à la salle ; sinon la salle garde la priorité.
- Fait (F2) : un seul enregistreur pour les modifications des autres (`saveLeader.ts` : plus petit numéro de connexion présent) ; ses propres modifications, chacun les enregistre. Si l'enregistreur part, le suivant reprend ce qu'il avait laissé passer. `applyRemoteDocument` reçoit `fromPeer` (annuler / rétablir ne compte pas comme « autre ») ; `editorStore.remoteRevision`.
- Fait (F3) : indicateur « Hors ligne, modifications gardées » ; à la reconnexion, message « Connexion retrouvée… » et enregistrement forcé.
- Aucun changement côté serveur Cloudflare ni dans le schéma Supabase ; aucune nouvelle dépendance.
- Limites connues : deux personnes hors connexion chacune de leur côté puis rouvrant le projet dans des sessions séparées : la version enregistrée en dernier l'emporte ; la comparaison des heures mélange horloge du serveur et de l'appareil (projet revenu de la file hors connexion) ; le rôle n'est vérifié qu'à l'ouverture de la connexion (lot C).
- Fichiers : `src/features/collab/{saveLeader,collabSession}.ts` (+ test du premier), `yDocument.ts`, `collabBinding.ts` (+ tests), `src/features/persistence/{types,SupabaseRepository,ResilientRepository}.ts` (+ tests), `src/stores/{editorStore,collabStore}.ts`, `src/components/editor/{useAutosave,useCollaboration}.ts`, `src/i18n/fr.ts`, `docs/02-ARCHITECTURE.md`, `docs/03-ROADMAP.md`.
- Vérification : build ✓ lint ✓ tests ✓ (2880). Non fait ici : essais réels à deux navigateurs.
- **Essais à faire à la fin du jalon** (`npm run dev`, deux fenêtres : une normale et une privée, deux comptes différents, même plan ; l'un est propriétaire, l'autre invité en édition) :
  1. *Édition à deux* : dessinez un mur dans la fenêtre A, un autre dans B. Chacun voit les deux murs. Attendez 2 s, rechargez A : les deux murs sont toujours là (ils sont enregistrés).
  2. *Coupure* : dans la fenêtre B, ouvrez les outils du navigateur (F12) → onglet « Réseau » → choisissez « Hors connexion ». L'indicateur de B passe à « Hors ligne, modifications gardées ». Dessinez un mur dans B, un autre dans A. Remettez « Aucune limitation » : B affiche « Connexion retrouvée », et A et B montrent les mêmes murs.
  3. *Fermeture hors connexion* : coupez le réseau de B, dessinez un mur dans B, fermez l'onglet B, puis rétablissez le réseau. Rouvrez le projet dans B : le mur dessiné hors connexion est présent (aussi chez A).
  4. *Peu d'enregistrements* : ouvrez le plan dans trois fenêtres (trois comptes ou deux fenêtres privées), et dans l'onglet « Réseau » de chacune filtrez sur « projects ». Dessinez un mur dans A : A enregistre, une seule autre fenêtre (l'enregistreur désigné) enregistre aussi, la troisième n'envoie rien.
  5. *Départ de l'enregistreur* : fermez la fenêtre qui enregistre les modifications de l'autre ; dessinez ensuite dans la fenêtre restante, puis rechargez : tout est conservé.

### 2026-11-15 — M14 · Lot E : présence (curseurs, sélections, avatars) — validé par l'utilisateur
- Accord de l'utilisateur : le nom et la photo viennent du compte (Google ou autre : `full_name` / `name`, `avatar_url` / `picture`), sinon la partie de l'e-mail avant le `@` ; l'adresse e-mail complète n'est jamais partagée.
- Fait : `src/features/collab/presence.ts` (couleur stable par compte, initiales, photo acceptée en https seulement, nettoyage et bornes de tout état reçu, liste des autres participants, un compte ouvert dans deux onglets compte une fois). `useCollaboration` publie nom, couleur, curseur, niveau affiché et sélection (au plus ~16 envois par seconde) et range les autres connexions dans `collabStore`. Canevas : `PresenceLayer` (curseur coloré avec le nom ; contour pointillé coloré autour de ce que l'autre sélectionne ; visibles seulement sur le même niveau), dans une couche non cliquable : absente des exports et de la miniature. En-tête : `PresenceAvatars` (photo ou initiales, infobulle avec le nom, « +N » au-delà de 4). Aucun changement côté serveur ni nouvelle dépendance (`provider.awareness` de `y-websocket`).
- Limites connues : seuls les éditeurs sont connectés au temps réel (les lecteurs n'apparaissent donc pas) ; une personne qui ferme brutalement son navigateur peut rester affichée jusqu'à ~30 s ; si la photo Google ne charge pas, ses initiales s'affichent ; pas de champ « nom » modifiable dans l'application (idée).
- Fichiers : `src/features/collab/presence.ts` (+ test), `src/components/editor/{PresenceLayer,PresenceAvatars}.tsx`, `useCollaboration.ts`, `EditorStage.tsx`, `EditorHeader.tsx`, `src/stores/collabStore.ts`, `src/i18n/fr.ts`, `docs/02-ARCHITECTURE.md`, `docs/03-ROADMAP.md`.
- Vérification : build ✓ lint ✓ tests ✓ (2860). Non fait ici : essai réel à deux comptes (voir « comment vérifier » ci-dessous).

### 2026-11-15 — M14 · Lot D : validé
- L'utilisateur a essayé et validé le lot D. Il demande de ne pas lancer le lot E directement : attendre sa demande.

### 2026-11-15 — M14 · Lot D : liaison Yjs et éditeur
- Dépendances : `yjs` et `y-websocket` dans l'application (déjà prévues dans `docs/02-ARCHITECTURE.md` pour ce lot). Nouvelle variable `VITE_COLLAB_URL` (`.env.example`) ; ajoutée au `.env.local` de l'utilisateur avec l'adresse du serveur en ligne.
- Fait : `src/features/collab/yDocument.ts` (document Fabrics ↔ `Y.Doc` : `order` + `elements`, `levelOrder` + `levels`, `meta`, `page`, `plan` ; écriture des seules propriétés modifiées ; ordre réconcilié par plus longue suite croissante ; doublons ignorés si deux personnes envoient le projet en même temps ; relecture qui garde les objets non modifiés). `collabBinding.ts` : envoi de chaque modification locale, application des modifications reçues sans toucher à l'historique, attente de la fin d'un geste (glisser un mur, une poignée) avant d'envoyer ou d'appliquer, `Y.UndoManager` limité aux modifications de l'éditeur (le premier envoi du projet ne s'annule pas). Store : `liveEditing`, `applyRemoteDocument`, `setCollabHistory` (Ctrl+Z / Ctrl+Maj+Z délégués pendant la collaboration). `useCollaboration` : connexion seulement avec un compte connecté et `VITE_COLLAB_URL`, jeton dans `Sec-WebSocket-Protocol`, renouvelé à chaque rafraîchissement Supabase, reconnexion automatique (attente max. 30 s). En-tête : « Connexion… », « En direct », « Hors ligne ».
- Règle de départ : projet inconnu du serveur → le premier éditeur l'envoie ; sinon c'est la version du serveur qui s'affiche (une modification faite pendant la toute première seconde de connexion peut alors être remplacée).
- Limites connues : un geste en cours n'est vu par l'autre personne qu'au lâcher ; si l'un supprime un élément pendant que l'autre le glisse, l'élément revient (le dernier geste l'emporte) ; le nom du projet n'est pas partagé en direct (il est dans la table `projects`) ; les lecteurs gardent leur page sans mise à jour en direct (hors lot, choix de l'utilisateur) ; chaque éditeur continue d'enregistrer le document complet dans Supabase (lot F).
- Fichiers : `src/features/collab/{yDocument,collabBinding,collabUrl}.ts` (+ 3 fichiers de tests), `src/components/editor/{useCollaboration.ts,CollabIndicator.tsx}`, `src/stores/collabStore.ts`, `src/stores/editorStore.ts` (+ `editorStore.collab.test.ts`), `EditorHeader.tsx`, `EditorPage.tsx`, `fr.ts`, `.env.example`, `package.json`, `docs/02-ARCHITECTURE.md`.
- Vérification : build ✓ lint ✓ tests ✓ (2844, dont deux éditeurs simulés en mémoire : modifications croisées, propriétés différentes du même mur, Ctrl+Z limité à ses modifications, geste en cours). Non fait ici : essai réel à deux comptes contre le serveur en ligne (demande deux sessions connectées).
- Commit : feat: liaison Yjs et éditeur (collaboration en direct)

### 2026-11-15 — M14 · Lot C : mise en ligne
- L'utilisateur a enregistré `SUPABASE_URL` et la clé publique (`sb_publishable_…`, nouveau format Supabase, accepté tel quel) avec `wrangler secret put`, puis déployé : `https://fabrics-collab.harinosy-tradeco.workers.dev`.
- Vérifié en ligne : la racine répond « Fabrics — serveur temps réel » (200) ; salle sans jeton → 401 ; faux jeton → 401 (donc Supabase est bien joint et configuré) ; adresse de salle invalide → 404. Essai avec un vrai compte : au lot D, quand l'éditeur s'y connectera.

### 2026-11-13 — M14 · Lot C : serveur temps réel (Cloudflare Worker + Durable Object)
- Dépendances acceptées par l'utilisateur : `y-protocols`, `lib0`, `wrangler` (avec `yjs`, `typescript`, `vitest`), **uniquement dans `collab-server/`** ; ajoutées au tableau de `docs/02-ARCHITECTURE.md`.
- Fait : dossier `collab-server/` séparé (son `package.json`, `wrangler.jsonc`, `README.md`). Worker : adresse `/room/<projectId>`, jeton Supabase lu dans `Sec-WebSocket-Protocol` (`fabrics-collab, <jeton>`, jamais dans l'adresse), rôle demandé à Supabase via `my_project_role` avec la clé `anon` (aucun secret, jamais `service_role`) ; 401 / 403 / 502 sinon. Durable Object `CollabRoom` (un par projet) : `Y.Doc` en mémoire, protocole de synchronisation Yjs, présence relayée, WebSocket hibernables, état sauvegardé dans son SQLite (snapshot en morceaux de 512 Ko + mises à jour, compaction toutes les 500). **Un lecteur reçoit le document mais ses modifications sont ignorées** (sa présence est relayée).
- Limites connues : rôle vérifié à l'ouverture seulement (un membre retiré reste connecté jusqu'à sa déconnexion ; jeton expiré idem) ; messages WebSocket limités par Cloudflare (un très gros plan pourrait dépasser à la première synchronisation, à surveiller au lot F) ; compaction non essayée en vrai (fonctions testées).
- Racine : `vite.config.ts` exclut `collab-server/` des tests de l'application.
- Fichiers : `collab-server/{package.json,wrangler.jsonc,tsconfig.json,.gitignore,.dev.vars.example,README.md}`, `collab-server/src/{index,room,auth,protocol,persistence,env}.ts` (+ 3 fichiers de tests), `collab-server/scripts/smoke.mjs`, `vite.config.ts`, `docs/02-ARCHITECTURE.md`.
- Vérification : application build ✓ lint ✓ tests ✓ (2820 ; le test de vitesse « 600 murs en moins de 200 ms » a échoué une fois à 229 ms sous charge, vert seul et au passage complet suivant) — serveur : types ✓, 22 tests ✓, **essai de bout en bout `npm run smoke` ✓ (10 vérifications : éditeurs synchronisés, lecteur refusé en écriture, présence, sans rôle et jeton invalide refusés, document retrouvé après redémarrage)**. Non fait : mise en ligne (demande le compte Cloudflare de l'utilisateur).
- Commit : feat: serveur temps réel Cloudflare (Worker + Durable Object)

### 2026-11-13 — M14 · Lot B : partage avec un autre compte (lecture ou édition)
- Fait (base, `supabase/schema.sql`, **à ré-exécuter en entier dans Supabase**, sans risque) : tables `project_members` (projet, compte, rôle `viewer` / `editor`) et `project_invites` (jeton de 192 bits tiré par la base, rôle, expiration, désactivable) ; fonction `my_project_role` (security definer, évite la récursion entre règles RLS) ; règles de `projects` étendues (un membre lit, un éditeur modifie, seul le propriétaire supprime) ; déclencheur qui fige `owner_id` et `created_at` (l'enregistrement automatique d'un éditeur envoie la ligne entière) ; fonctions `create_invite`, `accept_invite` (jamais de rétrogradation d'un membre), `list_project_members` (propriétaire seul, avec e-mails), `my_shared_projects` ; lecture des images du propriétaire par ses membres (stockage). Aucun accès pour les visiteurs sans compte.
- Fait (application) : lien `/i/<jeton>` (derrière la connexion, retour automatique après connexion), fenêtre « Partager » avec section « Inviter un autre compte » (rôle, date limite, copier, désactiver, supprimer ; liste des membres, changement de rôle, retrait), rubrique « Partagés avec moi » sur l'accueil (avec « Quitter le projet »), `/p/:id` choisit l'éditeur ou la lecture seule (`ProjectPage`) selon le rôle, bouton « Partager » réservé au propriétaire et ouvert aux visuels (le lien public reste réservé aux plans). « Mes projets » ne liste plus que les projets dont on est propriétaire. Visualiseur en lecture seule extrait de `SharePage` (`ReadOnlyViewer`).
- Limites connues (voulues, traitées plus tard) : les images ajoutées par un éditeur invité restent dans son propre dossier de stockage, donc invisibles pour les autres (lot D) ; un membre peut lire toutes les images de dossier du propriétaire (identifiants non devinables) ; pas de modification simultanée tant que le serveur temps réel (lots C et D) n'existe pas : le dernier enregistrement l'emporte ; retour après connexion Google : l'invitation n'est pas reprise (le lien est à rouvrir).
- Fichiers : `supabase/schema.sql`, `src/features/sharing/membersLogic.ts` (+ test), `membersApi.ts`, `SupabaseRepository.ts`, `cloudMapping.ts`, `src/pages/{InvitePage,ProjectPage,SharedProjectPage,EditorPage,HomePage}.tsx`, `src/components/editor/{InviteSection,ReadOnlyViewer,ShareDialog,EditorHeader}.tsx`, `src/components/home/{SharedProjectCard,LeaveDialog,useSharedProjects}`, `App.tsx`, `fr.ts`.
- Vérification : build ✓ lint ✓ tests ✓ (2820). **Non testé contre une vraie base** : les règles RLS n'ont été exécutées nulle part ici ; essai à deux comptes à faire (voir la réponse de fin de tâche).
- Commit : feat: partage avec un autre compte (membres, invitations, RLS)

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
| D37 | Surface du client | Le client voit la **surface au sol** (trémie déduite). **Complété le 2026-11-13 (demande de l'utilisateur)** : une colonne « Surface habitable » s'ajoute, seulement quand elle diffère (partie sous 1800 mm retirée, hauteur fixe). Au départ : pas de « surface habitable ». | Recommandation de Claude acceptée : sans toits en pente ni hauteurs sous plafond variables, les deux sont égales ; une définition légale (hauteur minimale) ne s'appliquera qu'après les toitures (voir Idées). |
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
| D71 | Rythme des versions automatiques | **Choix de l'utilisateur le 2026-11-15** : « comme un tableur en ligne » : une version par session de travail (nouvelle version après 5 min de pause ou 30 min de travail continu), avec la liste de ses auteurs ; sessions regroupées par jour et dépliables ; versions nommées. Le fonctionnement est repris, pas l'interface (règle de `CLAUDE.md` : identité visuelle originale). | Un historique lisible sans réglage, qui suit le rythme réel du travail. |
| D72 | Conservation des versions | Étapes détaillées (toutes les ~2 min de travail) gardées 24 h ; ensuite la dernière étape de chaque session ; après 30 jours, une version automatique par jour ; versions nommées jamais supprimées automatiquement. (Précisé au lot A le 2026-11-15 : « tout garder 30 jours » aurait pu dépasser l'offre gratuite de Supabase sur un plan très modifié.) | Historique fin pour réparer une erreur récente, place limitée sur l'offre gratuite. |
| D73 | Qui voit et restaure l'historique | **Choix de l'utilisateur le 2026-11-15** : tous les membres voient l'historique (lecteurs compris) ; seuls les éditeurs et le propriétaire restaurent. « Faire une copie » d'une version : tout membre connecté (la copie lui appartient). | Transparence pour tous ; le contenu ne change que par ceux qui peuvent déjà le modifier. |
| D74 | Qui peut commenter | **Choix de l'utilisateur le 2026-11-15** : tous les membres, lecteurs compris ; pas de commentaires sur le lien public de partage. | Valider un plan sans pouvoir le modifier. |
| D75 | Base de la suite du projet | **Choix de l'utilisateur le 2026-11-17** : Fabrics reste l'application (interface et prise en main, métrés, Supabase, collaboration, historique, commentaires) ; on y intègre tout ce qu'on peut de Pascal Editor (applications, paquets, scripts, configurations, conventions, moteur 3D, modèle de scène BIM, objets et opérations, import / export, MCP, composants d'interface). | Profiter d'un moteur BIM open source complet sans perdre ce que Fabrics fait déjà mieux. |
| D76 | Prix et devis | **Choix de l'utilisateur le 2026-11-17** : l'interdiction « aucun prix, aucun devis » est levée ; DQE chiffré en M23, prix toujours fournis par l'utilisateur, jamais inventés, montants exacts. | Livrer métrés **et** DQE à partir du même modèle. |
| D77 | Clean room et provenance | **Choix de l'utilisateur le 2026-11-17** : toutes les règles « clean room » et de provenance sont supprimées de `CLAUDE.md` ; on utilise librement les dépôts open source (code, objets, matériaux) en vérifiant les licences avant redistribution commerciale et en gardant les notices (`THIRD_PARTY_NOTICES.md`). | Le projet s'appuie désormais sur des dépôts open source. |
| D78 | Paquets Pascal | **Choix de l'utilisateur le 2026-11-17** : tous les paquets de Pascal entrent dans Fabrics (workspaces npm, `packages/pascal/`) ; leurs dépendances sont acceptées en bloc ; toute autre dépendance demande toujours un accord. | Réutiliser le code tel quel au lieu de le recopier, et pouvoir reprendre les mises à jour de Pascal. |
| D79 | Source de vérité | **Choix de l'utilisateur le 2026-11-17** : la scène Pascal devient l'unique modèle des projets Plan (stockage en mètres, affichage toujours en mm, m², m³) ; migration testée des plans existants en M18 ; les projets Visuel gardent `FabricsDocument`. | Une seule source pour la 2D, la 3D, les métrés, l'IFC et le DQE, sans traduction permanente entre deux modèles. |
| D80 | Interface et prise en main | **Choix de l'utilisateur le 2026-11-17** (précise D75) : on prend aussi **toute l'interface et la prise en main de Pascal** (accueil, éditeur, réglages, import, connexion, aide). Les fonctions de Fabrics y sont reconstruites (métrés Client / Exécution, commentaires, historique, présence, partage, export, DQE) ; l'éditeur Visuel reste à part, dans le même style. **On reste sur Vite** (composants de `apps/editor` repris sans Next.js). Remplace l'interface choisie en M15 bis et la prise en main de M11 quater : leurs **fonctions** restent exigées par la liste de non-régression. | Une seule interface cohérente, celle du moteur repris, sans perdre ce que fait Fabrics. |
| D81 | Expérience de Pascal | **Souhait de l'utilisateur le 2026-11-18** (précise D80) : tous les effets visuels et sonores, la navigation, les options de navigation et l'UX de Pascal sont gardés tels quels dans Fabrics ; ils entrent dans la liste de non-régression (comparaison avec Pascal lancé seul). Les sons se coupent dans les réglages. | L'utilisateur apprécie l'expérience de Pascal : elle ne doit pas être appauvrie par l'intégration. |
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

### 2026-11-13 — M11 quinquies, lots A et B (couper un mur ici, surface habitable)

- **Lot A, outil « Couper un mur ici »** (famille Construction, icône tranche) : on survole un mur, un trait pointillé en travers du mur et la distance depuis le sommet s'affichent (rouge si la coupe est refusée) ; un clic coupe le mur en deux. Un seul pas d'historique (Ctrl+Z recolle) ; les deux morceaux sont sélectionnés. Les portes, fenêtres et baies passent sur le bon morceau, à la même place. Refus avec message : trop près d'un sommet (moins que l'épaisseur du mur) ou au milieu d'une ouverture (choix de l'utilisateur). Distance arrondie à 10 mm. Pas de raccourci clavier (aucune lettre libre évidente).
- **Lot B, surface habitable** (métrés Client) : pour chaque versant de toiture du niveau, on retire de la pièce la partie où le dessous du versant (dessus − épaisseur de dalle, comme en 3D) est sous 1800 mm. Sans toiture : toute la pièce, sauf si la hauteur sous plafond plate est sous 1800 mm. La colonne « Surface habitable (m², hauteur ≥ 1800 mm) » n'apparaît que si au moins une pièce diffère de plus de 0,005 m² ; quand elle apparaît, elle est remplie pour toutes les pièces (le total reste cohérent) dans « Vos pièces », « Récapitulatif », PDF, Excel et CSV Client. Version Exécution inchangée.
- Limites connues : une trémie située dans la partie basse est retirée deux fois (résultat borné à 0) ; une partie de pièce hors de toute toiture compte entière ; hauteur de 1800 mm fixe (pas de réglage par projet, non demandé).
- Fichiers : `splitWall.ts` (+ tests), `polygonClip.ts` (nouveau), `habitableArea.ts` (nouveau, + tests), `measurements.ts`, `clientView.ts` (+ tests), `editorStore.ts`, `useCutTool.ts` et `CutPreviewLayer.tsx` (nouveaux), `EditorStage.tsx`, `Toolbar.tsx`, `ToolHint.tsx`, `fr.ts`. Build, lint, 2800 tests OK (un test a échoué une seule fois à un premier passage complet, sans qu'on ait pu l'identifier, puis trois passages complets sont revenus verts).

### 2026-11-15 — Correctif : curseur « main » sur les éléments cliquables

- Problème : sur l'accueil (onglets du Hero, boutons « Nouveau plan », cartes de projets…), le curseur restait une flèche. Tailwind v4 ne met plus de curseur « main » sur les boutons par défaut.
- Correctif global dans `src/index.css` (couche `base`) : main sur `button`, `[role="button"]`, `[role="tab"]`, `summary`, `select`, `label[for]` actifs ; curseur « interdit » sur les boutons désactivés. Les classes `cursor-*` existantes (ex. curseur ↔ du comparateur avant/après) restent prioritaires.
- Build, lint, 2860 tests OK (un échec intermittent au premier passage, présent aussi sans la modification, vert au passage suivant). **Validé par l'utilisateur dans le navigateur le 2026-11-15.**

### 2026-11-15 — Correctif : ouverture lente depuis « Par où commencer ? »

- Problème : connecté à un compte, un clic sur « Dessiner un plan », « Maison R+1 » ou « Maison R+3 » enchaînait quatre allers-retours avec le serveur, l'un après l'autre : enregistrer le projet, relire toute la liste, demander son rôle, puis retélécharger le projet complet. La création du plan elle-même ne prend que quelques millisecondes.
- Correctif : seul l'enregistrement est attendu. La liste se relit en arrière-plan ; le projet créé passe directement à l'éditeur (`src/features/persistence/justCreated.ts`), sans demander le rôle (on est propriétaire) ni le relire.
- Le bouton cliqué affiche une roue pendant l'enregistrement, et les autres sont désactivés : plus de double création par double clic.
- Build, lint, 2951 tests OK. **Validé par l'utilisateur sur la version déployée le 2026-11-15.**

### 2026-11-16 — Correctif : la carte « Commencez votre plan » gênait le tracé

- Problème : sur un plan vide, après un clic sur « Tracer une pièce » ou « Tracer des murs », la carte restait au centre et empêchait de dessiner dessous.
- Correctif (`src/components/editor/EmptyPlanCard.tsx`) : la carte ne s'affiche plus que lorsque l'outil Sélection est actif. Elle disparaît dès qu'un outil est choisi et revient après Échap tant que le plan est vide.
- Build, lint, 2951 tests OK (le test chronométré « 600 murs en moins de 200 ms » a échoué une fois sous charge, vert relancé seul). **Validé par l'utilisateur sur la version déployée le 2026-11-16.**

### 2026-11-16 — Correctif : fini les « Plan sans titre » en série sur l'accueil

- Problème : chaque nouveau projet s'appelait « Plan sans titre » (ou « Visuel sans titre ») ; l'accueil alignait des cartes identiques, impossibles à distinguer.
- Correctif (`src/features/documents/projectName.ts`, testé) : un nouveau projet reçoit un nom daté, « Plan du 16 nov. à 14:32 ». Aucun nom en double : un exemple créé deux fois devient « Exemple : maison à étage (2) », de même pour une copie.
- Les anciens projets « sans titre » s'affichent avec leur date de création (accueil, en-tête de l'éditeur, lecture seule), sans réécrire les données. Le nom est enregistré dès qu'on le modifie.
- Build, lint, 2956 tests OK.

### 2026-11-16 — Modifier plusieurs éléments à la fois (hors jalon)

- Avec plusieurs éléments sélectionnés, le panneau Propriétés montre maintenant les réglages qu'ils ont tous : couleur (remplissage, contour), pour des pièces « Afficher le nom et la surface » et « Faux plafond », pour des murs épaisseur, hauteur et matériau, pour des cotes décalage et version visible. Le changement s'applique à tous en un seul pas d'historique.
- Valeurs différentes : champ numérique vide, « Différentes » à côté de la couleur, tiret dans la case à cocher (un clic coche tout), choix « Différentes » grisé dans la liste.
- Le nom n'est jamais modifié en groupe.
- Fichiers : `commonValues.ts` (nouveau, + tests), `MultiSelectionFields.tsx` et `CheckboxField.tsx` (nouveaux), `ColorField.tsx`, `DimensionVisibilityField.tsx`, `PlanElementFields.tsx`, `PropertiesPanel.tsx`, `fr.ts`. Build, lint, 2964 tests OK (un échec intermittent au premier passage complet, deux passages suivants verts). **Validé par l'utilisateur dans le navigateur le 2026-11-16.**

### 2026-11-16 — Correctif : portes sans battant ni arc sur le plan

- Problème : une pièce tracée après une porte la recouvrait de son sol gris. On ne voyait plus que l'ouverture dans le mur, sans le battant ni l'arc d'ouverture (dessin normalisé d'une porte). Même chose pour les pointillés des coulissants et des portes de garage.
- Correctif (`src/features/documents/layers.ts`, `drawOrder`, testé) : une porte, une fenêtre ou une baie est toujours dessinée au-dessus de son mur **et** des pièces, quel que soit l'ordre de tracé. La liste des calques n'est pas modifiée.
- Build, lint, 2966 tests OK. **Validé par l'utilisateur dans le navigateur le 2026-11-16.**

### 2026-11-16 — Correctif : portes et fenêtres aux normes dans les exports et les vues

- Problème : la planche, les vues et les PDF (client, métrés) dessinent le plan à partir du modèle 3D coupé à 1 m. Les portes n'y avaient ni battant ni arc d'ouverture, et les fenêtres n'étaient que des cadres 3D coupés.
- Correctif : le modèle du bâtiment fournit maintenant le symbole 2D de chaque ouverture (`src/features/building/planSymbols.ts`, testé), le même que sur le plan de travail (`openingSymbol`). `levelPlanDrawing` efface le mur dans l'ouverture et trace ce symbole : battant et arc pour une porte, cadre et deux traits de vitrage pour une fenêtre, pointillés des coulissants à galandage et des portes de garage.
- Baies : la baie coulissante n'avait que ses deux montants (simple trou, aussi sur le plan de travail et dans le DXF). Elle a maintenant le cadre et deux vantaux décalés ; la baie fixe a le cadre et un vitrage au milieu.
- Vérifié sur une capture de la planche de l'exemple. Build, lint, 2970 tests OK. **Validé par l'utilisateur dans le navigateur le 2026-11-16.**

### 2026-11-16 — Longueur exacte d'un mur au clavier (hors jalon)

- Demande : pendant le tracé d'un mur, taper une valeur (ex. `5000`) pour obtenir une longueur précise.
- Après le premier point, les chiffres tapés s'affichent sur le segment (« 5000 mm ↵ ») et l'aperçu prend cette longueur dans la direction de la souris (Maj garde les angles de 45°). Entrée pose le point ; en mode « mur droit », le mur est créé. Retour arrière efface un chiffre, Échap efface la saisie (un second Échap annule le tracé).
- Fichiers : `src/features/geometry/typedLength.ts` (nouveau, + tests), `usePolylineDrawing.ts`, `PolylineDraftLayer.tsx`, `fr.ts` (astuces de l'outil Mur). Build, lint, 2974 tests OK (le test chronométré « 600 murs » a échoué une fois sous charge, vert relancé seul). **Validé par l'utilisateur dans le navigateur le 2026-11-16.**

### 2026-11-16 — Verrouiller les murs (hors jalon)

- Demande : éviter de déplacer un mur par accident.
- Le verrou existait déjà dans Calques, mais il était difficile à trouver, et un mur verrouillé n'était plus cliquable sur le plan.
- Panneau Propriétés : bouton « Verrouiller ce mur / Déverrouiller ce mur » (aussi pour plusieurs murs sélectionnés), avec un encadré « Mur verrouillé ». Quand rien n'est sélectionné, un bloc « Murs du niveau » affiche « Verrouiller tous les murs » / « Déverrouiller tous les murs ».
- Un mur verrouillé reste cliquable, mais il ne bouge pas : si on le glisse, il reste en place et un message s'affiche. La touche Suppr l'ignore aussi, avec un message. Le reste était déjà bloqué (flèches, rotation, Étirer, poignées, Couper, Joindre).
- Les autres éléments verrouillés (fond DXF importé) restent non cliquables.
- Fichiers : `src/features/documents/wallLock.ts` (nouveau, + tests), `WallLockSection.tsx` (nouveau), `PropertiesPanel.tsx`, `WallShape.tsx`, `useElementInteractions.ts`, `useEditorShortcuts.ts`, `editorStore.ts` (`removeElements` renvoie le nombre de murs verrouillés écartés), `fr.ts`. Build, lint, 2978 tests OK (le test chronométré « 600 murs » a échoué une fois sous charge, vert relancé seul). **Validé par l'utilisateur dans le navigateur le 2026-11-16.**

### 2026-11-16 — Correctif : « L'export a échoué » sur un plan avec image (compte en ligne)

- Symptôme : PDF A2 (et tout export image) refusé avec « L'export a échoué… ». Ce n'était pas la taille : jsPDF et Konva passent en A2 (vérifié dans Chromium).
- Cause : avec un compte, les images viennent du stockage Supabase (autre domaine) et étaient chargées sans `crossOrigin`. Le canevas devenait « contaminé » et le navigateur refusait `toDataURL` (« Tainted canvases may not be exported »). Reproduit avec une image servie depuis un autre port.
- Correctif : `image.crossOrigin = 'anonymous'` dans `useAssetImage.ts` (Supabase Storage renvoie bien `Access-Control-Allow-Origin: *`). La cause d'un échec est désormais écrite dans la console (`ExportDialog.tsx`). Build, lint, 2978 tests OK.

## Idées (hors jalon en cours)
- **PDF des tableaux (M23)** : faire passer à la ligne une désignation trop longue au lieu de la couper par « … » (mise en page commune aux métrés et au DQE).
- **Console de l'éditeur (vu en M23)** : 5 messages React « Attempted to synchronously unmount a root while React was already rendering » à l'ouverture d'un plan, présents avant M23 ; à examiner (sans effet visible constaté).
- **DQE (M23)** : correction à la main « changer de poste » et « ajouter une ligne » (la logique existe, `QuantityOverride`) ; l'écran ne propose aujourd'hui que « Retirer de ce poste ».
- **Contrôle du SQL dans `npm run check:all` (M23)** : le banc d'essai PGlite (Postgres dans Node) qui vérifie `supabase/m23-pricing.sql` vit hors du dépôt. L'y ajouter demande une dépendance de développement (`@electric-sql/pglite`, licence Apache 2.0 / PostgreSQL) : à décider (règle 6).
- **Plans d'exemple (M21 21.7)** : donner un matériau aux quelques cloisons qui n'en ont pas, pour que le contrôle « mur sans matériau » ne s'y affiche plus (change leurs dessins et la 3D : baseline).
- **Métrés, raccord de trois murs ou plus (M21 21.6)** : couper la pointe d'angle comme Pascal (volume et faces exacts), au lieu de marquer ces quantités « provisoires ». Change les métrés existants (baseline) : à décider. Voir `docs/phases/M21-ifc-comparison.md`.
- ~~**M22, IfcSpace**~~ : fait en 22.2 (contour tracé, D22-5).
- **Pièces et trémies de Pascal (M22 22.5)** : déduire de la surface nette d'une pièce les trémies dessinées dans Pascal (`floor-opening`), comme celles des escaliers de Fabrics ; au réimport d'un IFC, la trémie d'escalier ne revient que comme trou de dalle.
- **Trémies tracées au plafond (M22 22.5)** : les déduire de la dalle du niveau du dessus (`drawnOn: 'ceiling'`).
- **IFC, quantités des toitures et escaliers (M22)** : écrire leurs `Qto_RoofBaseQuantities` / `Qto_StairFlightBaseQuantities` depuis les quantités de M21.
- **Essai dans Revit (M22, D22-3)** : ouvrir HOUSE-01 dans Revit quand une licence est disponible.
- **Performance, lot 2 Alléger (remis à plus tard le 2026-11-18)** : l'accueil charge encore le moteur de Pascal (1,7 Mo) par le chemin enregistrement → conversion des scènes (`storedScene` → `sceneBinding` / `toFabricsView`) ; modules arbres, environnement et ossature chargés même quand le projet ne les utilise pas ; regrouper les ~1 100 petits fichiers JavaScript ; budget de poids dans `npm run check:all`.
- **Performance, lot 3 Fluidité (remis à plus tard le 2026-11-18)** : mesurer avec le profileur de React ce que Fabrics refait à chaque modification dans Pascal (métrés, enregistrement, collaboration), regrouper les calculs, supprimer les rendus inutiles ; mesures sur une machine avec carte graphique.
- Saisie de longueur au clavier pour les autres outils de tracé (pièce, cote, plateforme, rectangle largeur × hauteur).
- Accrochage de Pascal sur les traits d'un fond DXF importé (nœud `fabrics:annotation`) et sur le niveau de référence (comme l'ancien plan, M11 bis lots A et C).

<!-- Demandes de l'utilisateur ou idées de Claude à prioriser plus tard. -->
- Déduire de la surface d'une pièce les cloisons dont un bout est libre (cloison de douche), comme Revit (D20-12, option B non retenue le 2026-11-22) : change les métrés de tous les projets.
- ~~Signaler les irrégularités de dessin qui faussent cotes et métrés~~ : fait en M11 bis, lot H (2026-11-12) pour les écarts et superpositions de murs. Reste à étudier : objets posés à quelques mm d'un mur, murs plus courts que leur épaisseur, bouts de mur sur la face (et pas l'axe) d'un autre mur dessinés en biais, raccords sur un sommet d'un tracé à plusieurs côtés.
- ~~Aimantation sur les sommets et les traits d'un fond DXF importé~~ : planifié dans M11 bis, lot A (2026-11-12).
- ~~Reprendre les textes d'un DXF importé et exporter dans le DXF les escaliers, plateformes, toitures et cheminées~~ : planifié dans M11 bis, lot E (2026-11-12).
- ~~Afficher le **niveau du dessus** en transparence, et qu'il attire comme celui du dessous~~ : planifié dans M11 bis, lot C (2026-11-11, à confirmer).
- ~~Export des métrés en vrai fichier Excel~~ : fait (hors jalon K bis, avec `fflate`).
- ~~Hachures et textures dans les façades et coupes~~ et ~~toitures (versants, débords)~~ : planifiés dans le jalon M10 bis (2026-11-11).
- ~~Redimensionner une pièce préfabriquée d'un bloc~~ : fait (hors jalon I, option A).
- ~~Glisser un seul mur à la poignée (option A)~~ : planifié dans M11 bis, lot B (demande du 2026-11-11).
- ~~**Export pour Revit**~~ : fait (IFC2x3, option A, 2026-11-12). Reste à faire : escaliers, toitures, plateformes, mobilier, matériaux dans l'IFC. Texte d'origine : un fichier `.rvt` natif est impossible (format fermé Autodesk). Piste : export **IFC** (standard ouvert que Revit ouvre et importe : murs, dalles, pièces, portes, fenêtres, niveaux, en mm), en plus du DXF déjà prévu en M11. À décider : écrire l'IFC à la main (texte STEP, sans nouvelle dépendance) ou ajouter une bibliothèque (demande d'accord, règle 6). Non planifié : à placer dans un jalon.
- ~~Surface habitable dans les métrés client~~ : fait en M11 quinquies, lot B (2026-11-13) : 1800 mm, colonne affichée seulement quand elle diffère.
- ~~Joindre des murs (l'inverse de « Séparer les côtés »)~~ : planifié dans M11 bis, lot B (2026-11-12).
- ~~Outil « couper ici »~~ : fait en M11 quinquies, lot A (2026-11-13).
- ~~Recherche de projets sur l'accueil~~ (prévue dans la maquette de `docs/01-PRODUIT.md`) : planifié dans M11 bis, lot D.
- Afficher un message sur l'accueil quand la création d'un projet échoue (aujourd'hui l'erreur est silencieuse : voir le correctif du 2026-11-15).
- Grille et aimantation sur grille pour les Visuels (réglage en px dans le document).
- Calcul automatique de la surface intérieure d'une pièce (déduction de l'épaisseur des murs).
- ~~Aimantation des murs et des sommets sur ceux du niveau de référence~~ : planifié dans M11 bis, lot C (2026-11-12).
- ~~Pivoter un objet de 90° au clavier~~ : fait, `Maj + R` (décidé par l'utilisateur).
- Régler le nord avec le capteur d'orientation d'un téléphone (boussole réelle) : non fait en M11 ter (autorisations, inutile sur PC), à reprendre si le besoin vient du terrain.
- ~~Assistant IA « Demander quelque chose »~~ : planifié en M25 (2026-11-17).
- Bibliothèque (voir `docs/06-BIBLIOTHEQUE.md`, section 10), hors M7 : import de symboles SVG / DXF par l'utilisateur, niveau de détail « détaillé », variantes de style. Pose contre un mur, hauteurs 3D, bibliothèque personnelle, étiquettes de cote et annotations de plan sont planifiées dans M11 bis, lot F (2026-11-12).
- Plafonds : tableau dans les métrés et cote sous plafond (plan Technique) sont planifiés dans M11 bis, lot G (confirmés le 2026-11-12, D63). Faux plafond : confirmé.
- E-mails Supabase (M13) : l'envoi par défaut est limité à quelques e-mails par heure (atteint pendant les tests). Avant d'ouvrir à de vrais utilisateurs : brancher un service d'envoi (Supabase, Authentication, SMTP Settings). Connexion Google : finalement en place (voir l'entrée « Connexion Google »).
- Prise en main naturelle (audit du 2026-11-12) : jalon **M11 quater** confirmé par l'utilisateur le 2026-11-12 (avant M12, tablette incluse en lot I), dans `docs/03-ROADMAP.md`. Ordre : A, C, puis le reste. Lot J (signaux en haut à droite) ajouté le 2026-11-12.
- Alertes et signaux en haut à droite de l'écran (demande du 2026-11-12) : pastilles ou bandeau qui signalent immédiatement les erreurs et avertissements (ex. pièce qui ne remplit pas l'espace, export bloqué). Aujourd'hui, l'avis (Notice) s'affiche en haut au centre. Placé dans M11 quater, lot J (choix de l'utilisateur, 2026-11-12).
