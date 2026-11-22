# Liste de non-régression (à partir de M17)

Chaque jalon de la phase « Fabrics + Pascal » (M17 → M25) repasse cette liste avant son gate.
**Auto** = vérifié par `npm run check:all` (le fichier de test est indiqué, chemins depuis `src/`).
**Nav.** = geste à refaire dans le navigateur (`npm run dev`, puis http://localhost:5173).
Un écart = gate **FAIL**, sauf écart voulu et documenté (règle du roadmap).

## Passage de la liste — M19 A7 (2026-11-18)

**Parties « Auto »** (`npm run check:all`, `check:all` s'arrête au premier échec) :

| Étape | Résultat |
|---|---|
| Compilation des paquets de Pascal, build, lint Fabrics | ✓ |
| Tests Fabrics (161 fichiers, 3 068 tests, baseline des métrés / CSV / XLSX / IFC / planche identique) | ✓ (14 tests retirés avec les modules supprimés en A7) |
| Tests Pascal (bun) | 19 338 réussis, 74 en échec. **3 nouveaux par rapport à la référence** (`core` : `architecture.test.ts`, `contracts/cut-intent.test.ts`, `registry/registry-isolation.test.ts`) : ils **passent seuls** (15 / 15) ; échecs sous charge et `EPERM` (liens symboliques refusés par Windows) déjà constatés en A5 |
| Lint Pascal (Biome) | 0 erreur (171 avertissements de Pascal) |
| Doublons de code (`jscpd`) | **non exécuté** : `jscpd` est déclaré mais pas installé sur cette machine (`npm install`) |

**Parties « Nav. »** : à refaire par l'utilisateur (test de fin d'A7). Seules celles qui ne dépendent pas des
outils de dessin de l'ancien éditeur sont reprises ici ; le reste est **reporté** aux sous-lots qui
apportent les outils de Pascal.

| Parcours à refaire dans le navigateur | Reprend |
|---|---|
| Accueil : créer un plan, un Visuel ; ouvrir, renommer, dupliquer, supprimer | M0, M1, M12 |
| Ouvrir un plan : 3D, 2D, niveaux, rendu, onglets Scène / Peinture / Objets / Métrés / Paramètres | M8, M19 A5 |
| Métrés Client / Exécution, cotation, repères `M01` / `P01` / `F01` dans les métrés (sur le plan : `PP: …` / `All. …`, D20-9), points à vérifier | M3, M10 ter, M20 |
| Vues : façades, coupes, planche ; exporter PNG, JPG, PDF, métrés, DXF, IFC | M4, M10, M11 |
| Visuel : texte, formes, image, annuler, enregistrer, exporter | M1, M2, M4 |
| Comptes, partage (lien, invitations), lecture seule d'un plan (lecteur, lien public) | M13, A7 |
| Collaboration à deux navigateurs, historique et aperçu de version, commentaires | M14, M15, M16 |
| Palette de commandes (Ctrl+K), raccourcis, réglages audio, visite à la première personne, réalité virtuelle | M19 A6 |
| Onglet Construire ; mur tracé en tapant `5000` (lu en mm) ; accrochages (Maj / Alt) ; cotes, niveaux, grille et surfaces en mm / m² | M19 B1 (outils de Pascal) |
| Mur allongé de 4000 à 5000 mm en 3D (glisser son extrémité) → 5000 mm sur le plan et dans Métrés ; le mur raccordé suit | Auto : `scene/edit3d.test.ts` ; Nav. (M19 B2) |
| Porte élargie puis supprimée en 3D → surfaces nettes recalculées, aucune incohérence | Auto : `scene/edit3d.test.ts` ; Nav. (M19 B2) |
| Mur de 200 mm composé 20 + 160 + 20 mm (panneau du mur, Composition) → Métrés Technique, « Couches des murs » : 3 couches, somme des volumes = volume du mur | Auto : `measurements/wallLayers.test.ts` ; Nav. (M19 B3) |
| Limite de propriété 20 × 30 m (Scène, Limite de propriété, crayon), maison 8000 × 10000 mm → parcelle 600,00 m², emprise 80,00 m², 13,3 %, recul 6000 mm ; bâtiment déplacé hors limite → « dépasse la limite » ; altitudes des niveaux en mm | Auto : `scene/siteMeasures.test.ts` ; Nav. (M19 B4) |
| T1 / T2 : métrés, 2D → 3D, 3D → 2D, emprise = calcul à la main, aucun écart | Auto : `scene/precision.test.ts` (M19 B5) |
| Épaisseur nulle, longueur nulle, murs superposés, raccord en T, ouvertures qui dépassent ou se chevauchent | Auto : `scene/hardCases.test.ts` (M19 B5) |
| Mur, porte, pièce, niveau dessinés avec Construire → présents dans Métrés (« Mur 1 »…), gardés après un changement de cotation | Auto : `scene/edit3d.test.ts` ; Nav. (M19 B2) |

## 0. Référence figée (baseline M17)

| Contrôle | Vérification |
|---|---|
| Métrés JSON, tableaux Client / Exécution, CSV (tableaux et à plat), XLSX, IFC et planche SVG (sans cotes, Client, Exécution) du plan d'exemple et de la grande maison | Auto : `baseline/fabricsBaseline.test.tsx` → `baseline/fabrics/` |
| Tests Fabrics (151 fichiers, 2 978 tests au 2026-11-17) | Auto : `npm test` |
| Tests Pascal identiques à ceux de son propre dossier | Auto : `npm run test:pascal` (référence : `docs/phases/M17-pascal-baseline.md`) |
| Valeurs calculées à la main HOUSE-01, HOUSE-02, EDGE-01 | Auto à partir de M18 (`fixtures/*/spec.json`) |

## 1. Fabrics — critères M0 à M16

### M0 — Mise en place
| Critère | Vérification |
|---|---|
| `npm run dev` affiche Fabrics, stylé avec Tailwind | Nav. : ouvrir l'accueil |
| `/p/test` affiche l'éditeur (ou « projet introuvable ») | Nav. |
| `npm run build` et `npm run lint` passent | Auto |

### M1 — Socle de l'éditeur
| Critère | Vérification |
|---|---|
| Visuel « Post carré », 3 rectangles déplacés, rechargement : tout est là | Nav. ; Auto : `persistence/LocalRepository.test.ts`, `persistence/autosave.test.ts` |
| Annuler 3 fois → page vide ; rétablir 3 fois → état final | Auto : `stores/editorStore.test.ts` ; Nav. |
| Sélection multiple + Suppr supprime tout | Nav. ; Auto : `stores/editorStore.test.ts` |

### M2 — Contenu et mise en forme
| Critère | Vérification |
|---|---|
| Parcours A (post Instagram) sans toucher au code | Nav. |
| Élément verrouillé non sélectionnable sur le canevas, seulement par les calques | Nav. ; Auto : `documents/layers.test.ts` |
| Texte modifié puis annulé revient exactement | Auto : `stores/editorStore.test.ts` ; Nav. |

### M3 — Mode plan et métrés
| Critère | Vérification |
|---|---|
| Pièce 4000 × 3000 mm → 12,00 m² et 14000 mm | Auto : `measurements/measurements.test.ts`, `geometry/polygon.test.ts` |
| Pièce sur faces intérieures de 4 murs (axes 4000 × 3000, ép. 200) → 10,64 m² | Auto : `measurements/measurements.test.ts` |
| Image calibrée sur 3500 mm → cote de 3500 ± 10 mm | Auto : `geometry/calibration.test.ts` ; Nav. |
| CSV lisible dans Excel / LibreOffice (accents, décimales) | Auto : `measurements/csvExport.test.ts` (BOM, `;`, virgule) ; Nav. : ouvrir le fichier |
| Tests de `features/` verts | Auto |

### M4 — Export
| Critère | Vérification |
|---|---|
| PNG ×2 d'un post carré = 2160 × 2160 px | Auto : `export/limits.test.ts` ; Nav. |
| PDF 1:50 imprimé à 100 % : 1,00 m = 2,0 cm | Auto : `export/pdfLayout.test.ts`, `export/pdf.test.ts` ; Nav. : impression |
| Aucune poignée ni grille dans les fichiers | Nav. |
| Plan 20 × 15 m : PNG ×3 grisé, pas de plantage | Auto : `export/limits.test.ts` ; Nav. |

### M5 — Ouvertures
| Critère | Vérification |
|---|---|
| Mur 4,00 × 2,50 m + porte 0,90 × 2,10 → 10,00 m² brut, 8,11 m² net | Auto : `measurements/measurements.test.ts` |
| Ouverture bornée au mur, sans chevauchement | Auto : `geometry/openings.test.ts`, `geometry/openingPlacement.test.ts` |
| Ouverture hors du mur non déduite ; chevauchement déduit une fois ; mur de hauteur nulle signalé (M18) | Auto : `measurements/measurements.test.ts`, `scene/migrate/fixtures.test.ts` |
| Projet d'avant M5 ouvert sans perte | Auto : `documents/migrations.test.ts` |

### M6 — Niveaux
| Critère | Vérification |
|---|---|
| Dupliquer le RDC : murs copiés, pas les pièces | Auto : `documents/levels.test.ts` |
| Mur du niveau de référence non sélectionnable | Nav. |
| Totaux bâtiment = somme des niveaux | Auto : `measurements/measurements.test.ts` |

### M7 — Axes et mobilier
| Critère | Vérification |
|---|---|
| Lit 1600 × 2000 mesuré 1600 × 2000 à la cote | Auto : `library/library.test.ts` ; Nav. |
| Nouvel axe parallèle à « A, B » → « C » | Auto : `geometry/axes.test.ts` |

### M8 — Vue 3D (assurée par le moteur de Pascal depuis M19 A2 ; l'ancienne vue 3D est retirée en A7)
| Critère | Vérification |
|---|---|
| Modifier un mur met la 3D à jour en moins d'1 s | Nav. |
| Fenêtre 1,20 × 1,00 m, allège 0,90 m = trou à la bonne hauteur | Auto : `building/model.test.ts` ; Nav. |
| 3 niveaux fluides en rotation | Nav. |

### M9 — Outils de construction
| Critère | Vérification |
|---|---|
| Pièce rectangle 2 clics 4000 × 3000 → 12,00 m², 14000 mm ; « avec murs » : axe 4200 × 3200 | Auto : `documents/construction.test.ts` |
| Pièce préfabriquée annulée en un Ctrl+Z ; `Maj + R` quart de tour avec ouvertures et mobilier | Auto : `library/prefabs.test.ts`, `geometry/rotateSelection.test.ts` ; Nav. |
| Escalier H 2700 → 15 contremarches de 180, 14 girons ; H 2880 → 16 | Auto : `stairs/stairs.test.ts` |
| Escalier 1000 × 3500 sous pièce 5000 × 4000 → trou 1100 × 3600 (3,96 m²), 20,00 / 16,04 m² ; 3000 mm signalé trop court (3500 nécessaires) | Auto : `stairs/voids.test.ts`, `stairs/stairIntegration.test.ts` |
| Projet d'avant M9 ouvert sans perte | Auto : `documents/migrations.test.ts` |

### M10 — Façades, coupes et planche
| Critère | Vérification |
|---|---|
| Façade : chaque fenêtre du mur, à la bonne hauteur | Auto : `building/views/elevation.test.ts` |
| Déplacer la ligne de coupe met la coupe à jour | Auto : `building/views/section.test.ts` ; Nav. |
| Hauteur d'étage 2500 mm = 50 mm à 1:50 imprimé | Auto : `export/pdfLayout.test.ts` ; Nav. |

### M10 bis — Ouvertures détaillées, toitures, hachures
| Critère | Vérification |
|---|---|
| Chaque style a un symbole 2D distinct | Auto : `geometry/openingSymbolStyles.test.ts` |
| Galandage sans place refusée avec message | Auto : `geometry/openingStyleEdit.test.ts`, `openings/styles.test.ts` |
| Fenêtre deux vantaux : deux vantaux en façade, bonne allège | Auto : `building/openingStyleModel.test.ts` |
| Deux pans 8000 × 6000, 35°, débord 500 : +2101 mm, 76,91 m², faîtage 9000, égouts 2 × 9000, 2 pignons | Auto : `building/roof.test.ts`, `measurements/roofMeasurements.test.ts` |
| Croupe : 76,91 m², faîtage 2000, égout 32000, 0 pignon ; 6000 × 6000 → faîtage 0 | Auto : `building/roof.test.ts` |
| Un pan, portée 6000, 35° → +4201 mm | Auto : `building/roof.test.ts` |
| Pignon en triangle, profil du toit en coupe, mise à jour en direct | Auto : `building/views/roofViews.test.ts` ; Nav. |
| Matériau du mur → hachure en coupe, mêmes motifs en PDF | Auto : `building/views/hatching.test.ts`, `building/views/textures.test.ts` |

### M10 ter — Documents Client / Exécution (+ audit, noms automatiques)
| Critère | Vérification |
|---|---|
| Chambre 4000 × 3000 → « Chambre », `4000 × 3000`, `12,00 m²` en Client | Auto : `measurements/clientView.test.ts`, `dimensioning/clientDimensions.test.ts` |
| Bâtiment 8000 × 6000 aux axes, murs 200 → cotes `8200` et `6200` | Auto : `dimensioning/clientDimensions.test.ts`, `dimensioning/executionDimensions.test.ts` |
| Façade 6000 + fenêtre 1200 centrée → `2400 · 1200 · 2400`, `6000` ; repère de plan `1200 x 1350` + `All. 900`, porte `PP: 900 x 2100` (D20-9 : plus de `F01` / `P01` sur le plan, ils restent dans les métrés) | Auto : `dimensioning/facadeChains.test.ts`, `dimensioning/executionDimensions.test.ts` |
| Même repère sur le plan et dans les métrés ; ouverture 400 × 400 déduite | Auto : `measurements/references.test.ts`, `measurements/measurements.test.ts` |
| Client ↔ Exécution sans entrée d'historique ; cote « Exécution » absente en Client | Auto : `dimensioning/visibility.test.ts` ; Nav. |
| « Total du niveau » en export « niveau affiché » | Auto : `measurements/clientView.test.ts` |
| XLSX / CSV Client sans mot technique | Auto : `measurements/csvExport.test.ts`, baseline |
| Noms de fichiers `-client` / `-execution` | Auto : `export/fileName.test.ts` |
| Pièce en L « forme libre » ; pièce sans nom « Pièce 1 » | Auto : `measurements/clientView.test.ts` |
| Trémie qui déborde / pièces superposées signalées | Auto : `measurements/warnings.test.ts` |
| Pièce 100 mm trop courte contre un mur de 4000 → « 0,40 m² non couverts » | Auto : `measurements/roomCoverage.test.ts` |
| Murs à y = 749 et 751 → `M01`, `M02` | Auto : `measurements/references.test.ts` |
| Noms automatiques « Porte Cuisine 1 »…, renommage suivi, nom manuel prioritaire | Auto : `naming/autoNames.test.ts` |

### M11 — Import et export
| Critère | Vérification |
|---|---|
| DXF exporté ouvert dans LibreCAD, longueurs exactes en mm | Auto : `export/dxf.test.ts`, `export/dxfPlan.test.ts` ; Nav. : LibreCAD |
| DXF importé : ligne de 5000 mm = 5000 mm | Auto : `export/dxfImport.test.ts` |
| IFC exporté (l'export glTF est remplacé par les exports 3D de Pascal, A7) | Auto : `export/ifc.test.ts`, baseline IFC ; Nav. : Paramètres → exports 3D |

### M11 bis — Dessin précis, bibliothèque, plafonds (lots A à H)
| Critère | Vérification |
|---|---|
| Chambre 4000 × 3000 sous dalle +2650 → plafond 12,00 m², 2650 mm | Auto : `measurements/measurements.test.ts` |
| Faux plafond ajouté au tableau | Auto : `measurements/measurements.test.ts` |
| Aucune cote sous plafond sur un plan Client | Auto : `dimensioning/planOverlay.test.ts` |
| Raccord en T : volume − 100 × 200 × h ; angle en L inchangé | Auto : `measurements/wallJunctions.test.ts` |
| Murs à 10 mm → « 1 point à vérifier », Joindre, Ctrl+Z | Auto : `geometry/wallContacts.test.ts`, `geometry/joinWalls.test.ts` ; Nav. |
| Aimantation sur le fond DXF et le niveau de référence | Auto : `geometry/backgroundSnap.test.ts`, `geometry/snapping.test.ts` |
| Pose contre un mur, bibliothèque personnelle, recherche de projets | Auto : `library/againstWall.test.ts`, `library/userSets.test.ts`, `persistence/filterProjects.test.ts` |

### M11 ter — Boussole
| Critère | Vérification |
|---|---|
| Boussole seulement dans un plan, masquée à la première ouverture | Nav. |
| Boussole à 30° ↔ champ « Nord » 30° ; un geste = une annulation | Auto : `building/compass.test.ts`, `building/north.test.ts` ; Nav. |
| Exports avec N, E, S, O dans le bon sens | Auto : `dimensioning/planMarks.test.ts` ; Nav. |

### M11 quater — Prise en main
| Critère | Vérification |
|---|---|
| Barre d'outils lisible, accueil guidé, carte du plan vide, astuces, `?`, tablette, signaux en haut à droite | Nav. (lot H « test avec une vraie personne » toujours ouvert) ; Auto : `components/editor/shortcuts.test.ts` |

### M11 quinquies — Couper un mur, surface habitable
| Critère | Vérification |
|---|---|
| Mur 4000 coupé à 1500 → 1500 + 2500, un Ctrl+Z | Auto : `geometry/splitWall.test.ts` |
| Deux pans 45° sur murs de 1000 mm, pièce 8000 × 6000 → 48,00 m² au sol, 32,00 m² habitables | Auto : `measurements/habitableArea.test.ts` |
| Sans toit en pente : pas de colonne « Surface habitable » | Auto : `measurements/clientView.test.ts` |

### M12 — Mise en ligne
| Critère | Vérification |
|---|---|
| `*.pages.dev` fonctionne, rechargement direct de `/p/…` | Nav. : https://fabrics-8zd.pages.dev |
| `git push` sur `main` redéploie | Nav. : tableau Cloudflare Pages |

### M13 — Comptes, cloud, partage
| Critère | Vérification |
|---|---|
| Projet visible sur un autre appareil, même compte | Nav. |
| Un second compte ne voit rien du premier | `npm run check:security` (RLS) ; Nav. |
| Sans variables Supabase, mode local | Auto : `lib/supabase.test.ts` ; Nav. |
| Lien de partage désactivé : plus rien, lecture seule | Auto : `sharing/shareLogic.test.ts` ; Nav. |

### M14 — Collaboration temps réel
| Critère | Vérification |
|---|---|
| Deux navigateurs éditent en direct ; présence ; annuler limité à soi | Auto : `collab/yDocument.test.ts`, `collab/collabBinding.test.ts`, `collab/presence.test.ts`, `stores/editorStore.collab.test.ts` ; `collab-server` : `npm test` et `npm run smoke` ; Nav. : deux navigateurs |
| Lecteur : écritures ignorées | `collab-server` tests ; Nav. |

### M15 / M15 bis — Versions et réorganisation de l'éditeur
| Critère | Vérification |
|---|---|
| Versions par session, aperçu en lecture seule, différences, restaurer annulable, copie | Auto : `versions/versionsLogic.test.ts`, `versions/versionDiff.test.ts`, `versions/pendingRestore.test.ts` ; Nav. : deux navigateurs |
| En-tête, rail d'outils, barre d'état, métrés en direct (pièce 6000 × 2000 → « Surface 12,00 m² ») | Auto : `measurements/measurements.test.ts` ; Nav. : onglet Métrés de Pascal (la barre « métrés en direct » de l'ancien éditeur est retirée, A7) |

### M16 — Commentaires ancrés
| Critère | Vérification |
|---|---|
| Commentaire sur élément ou point, épingles hors exports, « élément supprimé » | Auto : `comments/commentTarget.test.ts`, `comments/commentsLogic.test.ts` ; Nav. |
| Lecteurs commentent ; lien public sans commentaires ; en direct | Nav. : deux navigateurs |

### Hors jalon (2026-11-16)
| Critère | Vérification |
|---|---|
| Modifier plusieurs éléments à la fois, un pas d'historique | Auto : `documents/commonValues.test.ts` ; Nav. |
| Longueur de mur au clavier | Auto : `geometry/typedLength.test.ts` |
| Verrouiller les murs | Auto : `documents/wallLock.test.ts` ; Nav. |
| Portes au-dessus de leur mur et des pièces ; symboles normalisés dans les exports | Auto : `documents/layers.test.ts`, `building/planSymbols.test.ts` |
| Export d'un plan avec image du compte (pas de canevas contaminé) | Nav. (compte connecté) |

## 2. Pascal — fonctions natives

Chemins relatifs à `packages/pascal/`. **Auto** = `npm run test:pascal` (résultats comparés à
`packages/pascal/.fabrics/known-failures-<système>.json`). **Nav.** = geste dans l'éditeur de Pascal
(en M17 : Pascal lancé seul, `bun run dev` dans `packages/pascal` ; à partir de M19 : dans Fabrics,
comparaison côte à côte, D81).

### 2.1 Modèle et données
| Fonction | Vérification |
|---|---|
| Schémas des nœuds (≈ 60 types : murs, dalles, plafonds, toitures, portes, fenêtres, escaliers, pièces, objets, MEP…) | Auto : `packages/core` (schémas), `packages/nodes/src/index.test.ts` (enregistrement) |
| Anciennes scènes toujours lisibles (E-003, surface au sol à 1 % près) | Auto : `core/src/utils/*corpus*.test.ts`, `frozen-floor-gate.test.ts` |
| Annuler / rétablir, un geste = une étape (E-007) | Auto : `core/src/store/*`, `packages/editor` (historique) ; Nav. |
| Copie détachée de la scène, mêmes résultats (E-018) | Auto : `core/src/runtime/fixture-parity.test.ts`, `detached-scene.test.ts` |
| Pièces d'abord : murs et dalles dérivés des pièces (E-012) | Auto : `core/src/store/derived-writer-allowlist.test.ts` |
| Dépendances entre paquets (E-001) | Auto : `core/src/architecture.test.ts` ; `npm run lint:pascal` (Biome `noRestrictedImports`) |
| Contrat des greffons v1 (E-014) | Auto : `core/src/registry/plugin-v1-conformance.test.ts` |

### 2.2 Édition
| Fonction | Vérification |
|---|---|
| Outils de construction (mur, pièce, dalle, plafond, toiture, poteau, trame, escalier, ascenseur, porte, fenêtre, lucarne, fenêtre de toit, cheminée, gouttière, MEP…) | Auto : `packages/nodes` (un dossier par type) ; Nav. : chaque outil du rail |
| Modes d'accrochage visibles : Maj = changer de mode, Alt = ignorer (E-004) | Nav. |
| Guides d'alignement, saisie de cote pendant le tracé | Auto : `core/src/services/alignment*`, `editor/src/lib/floorplan/dimension-drive*` ; Nav. |
| Glisser en direct sans saccade (E-007, E-010) | Nav. (scène complexe) |
| Peinture des surfaces et matériaux (E-009), types de murs et couches | Auto : `core/src/node-slots`, `schema/assembly` ; Nav. |
| Terrain : sculpter, limites de parcelle | Auto : `nodes/src/site` ; Nav. |
| Catalogue d'objets (145 modèles 3D), objets procéduraux, cuisines | Auto : `packages/editor` (catalogue), `core/src/procedural-items` ; Nav. |
| Palette de commandes, raccourcis | Nav. |
| Parité 2D ↔ 3D d'un même geste (E-006) | Nav. |

### 2.3 Vues et expérience (D81)
| Fonction | Vérification |
|---|---|
| Rendu WebGPU, repli WebGL2 | Auto : `viewer/src/lib/renderer-capability*` ; Nav. (deux navigateurs) |
| Effets : occlusion ambiante, bloom, anticrénelage, contours encrés, surlignage, lumière du jour, HDRI, animation de construction | Nav. (comparaison côte à côte) |
| Sons (`howler`) et réglage pour les couper | Nav. |
| Navigation : perspective / orthographique, première personne, suivi de caméra, WebXR, niveaux empilés / éclatés / seuls, coupe 3D | Auto : `viewer/src/xr`, `editor/.../first-person*` ; Nav. |
| Plan 2D en lecture seule (`viewer/ui`) | Auto : `packages/viewer` |
| Parcours de découverte et aide | Nav. |

#### Comparaison côte à côte du rendu (M19 A5)

Dans le même navigateur, sur le même projet (Maison R+1), avec Pascal lancé seul (dossier
`Projects/BIM Project`, `bun dev`) et Fabrics (`npm run dev`). Cocher quand l'effet est identique.
Les réglages sont au même endroit dans les deux : menu **Affichage** de la barre de vue (en haut à
droite de la 3D) et onglet **Paramètres**.

| Effet | Où le régler | Fabrics = Pascal |
|---|---|---|
| Rendu WebGPU (Chrome, Edge récents), repli WebGL2 (autre navigateur) | automatique | [ ] |
| Qualité Auto / Basse / Moyenne / Haute | Affichage → Qualité | [ ] |
| Occlusion ambiante (qualité moyenne ou haute) | Affichage → Qualité | [ ] |
| Bloom (qualité haute, lumière du jour) | Affichage → Qualité | [ ] |
| Anticrénelage (TAA, ou FXAA en qualité basse) | Affichage → Qualité | [ ] |
| Contours encrés, thèmes de couleurs | Affichage → Couleurs | [ ] |
| Surlignage de la sélection | clic sur un mur | [ ] |
| Lumière du jour, heure et météo, atmosphère | Affichage → Heure et météo ; pastille de l'heure en bas | [ ] |
| Environnement HDRI | Affichage → Heure et météo | [ ] |
| Ombres | Affichage → Ombres ; Paramètres → Viewer | [ ] |
| Animation de construction | Paramètres → Préférences | [ ] |
| Transitions et animations d'interface | ouverture des panneaux et menus | [ ] |

### 2.4 Échanges et agents
| Fonction | Vérification |
|---|---|
| Export IFC4 | Auto : `packages/ifc-converter` ; `tools/ifc/validate.py` sur un export (M22) |
| Import IFC (web-ifc) | Auto : `packages/ifc-converter` (107 tests) |
| Exports GLB, USDZ, STL, OBJ, 3MF ; PDF des plans avec nomenclatures | Auto : `packages/editor` ; Nav. |
| Serveur MCP (≈ 80 outils), stockage des scènes | Auto : `packages/mcp` |
| CLI `pascal` | Auto : `packages/cli` (14 échecs connus sous Windows) |
| Script de géométrie | Auto : `packages/geometry-script` |
| Traductions (Lingui, 5 langues dont le français) | Auto : tests `scripts/i18n*.test.ts` de la racine de Pascal |

## 3. Fabrics + Pascal — critères M20 et suivants

### M20 · 20.1a — Plan de niveau lié au modèle (exemple ROOMIT-RDC)
| Critère | Vérification |
|---|---|
| Surfaces des 12 pièces du RDC = tableau de la référence (écarts expliqués dans `fixtures/ROOMIT-RDC/spec.json`), aucun avertissement de métré | Auto : `scene/roomit.test.ts` |
| Escalier, mobilier et poteaux de Pascal dessinés sur le plan de niveau ; murs hachurés d'après leur composition | Auto : `scene/roomit.test.ts`, `scene/view/wallMaterial.test.ts` ; Nav. |
| Étiquette de pièce : nom + surface ; baies `PP: 900 x 2100`, `1500 x 1000` + `All. 1100` ; une largeur et une profondeur par pièce (D20-9) | Auto : `dimensioning/executionDimensions.test.ts`, baseline `sheet-execution.svg` ; Nav. |
| Cloison SDB_G avancée de 500 mm dans Pascal → cote SDB 1475 → 975 mm, SDB 6,47 → 4,28 m², Séjour 36,18 → 38,37 m² ; annuler rétablit ; rien du plan enregistré hors de la scène | Auto : `scene/modelLink.test.ts` ; Nav. |
| PDF relu : à 1:50, 1000 mm = 20,0 mm, 14473 mm = 289,46 mm, les 1 214 traits du plan à ≤ 0,1 mm ; à 1:100 sur A3, 1000 mm = 10,0 mm | Auto : `export/printScale.test.ts` |
| Impression à 100 % mesurée à la règle | Nav. (validé par l'utilisateur le 2026-11-22) |

### M20 · 20.1b — R+1 et toiture (exemple ROOMIT-R1)
| Critère | Vérification |
|---|---|
| Surfaces des 11 pièces du R+1 = tableau de la référence à l'écart expliqué près (`fixtures/ROOMIT-R1/spec.json`), total balcon compris 144,36 m² (référence 144,16, D20-10 : A), aucun avertissement de métré | Auto : `scene/roomitR1.test.ts` |
| 21 poteaux, escalier et mobilier de Pascal dessinés sur le plan R+1 | Auto : `scene/roomitR1.test.ts` ; Nav. |
| RDC + R+1 dans une scène : surfaces de chaque niveau inchangées ; l'escalier qui monte du RDC est dessiné sur le R+1 (un seul nœud, dans le RDC) ; un escalier trop court n'y est pas | Auto : `scene/roomitBuilding.test.ts` |
| Écran Vues : un onglet « Plan de niveau RDC / R+1 » par niveau, cotation réglable, export PDF du niveau seul avec flèche du nord | Nav. |
| Tableau « Pièces Niveau … » à droite du plan d'un niveau (onglet Vues et PDF) : une ligne par pièce, surfaces des métrés, second tableau « Total Niveau … » (R+1 de ROOMIT : 144,36 m², balcon compris) | Auto : `building/views/areaTable.test.ts`, `scene/roomitBuilding.test.ts` ; Nav. |
| Toiture native de Pascal du R+1 : 4 pans à 1 % (pente lue 0,573°), débord 300 mm, emprise −300 → 14772 × −300 → 12772 mm ; escalier d'accès au toit sur le balcon (2340 × 6389 mm, monte de 3000 mm) | Auto : `scene/roomitBuilding.test.ts` |
| Plan de toiture du R+1 : contour à 10 sommets (réunion des pans, débord 300 mm) en double trait, flèches « Pente 1 % » vers le nord et l'ouest (texte lu de bas en haut pour une flèche verticale), escalier d'accès au toit (jamais celui du RDC), aucune surface | Auto : `building/views/roofPlan.test.ts`, `scene/roomitBuilding.test.ts` ; Nav. (onglet « Plan de toiture R+1 ») |
| Cotes du plan de toiture du R+1 = page 7 (en cm de la référence) : haut 450 · 778 · 279 / 1507, bas 530 · 977 / 1507, gauche 167 · 1140 / 1307, droite 669 · 539 · 99 / 1307 | Auto : `dimensioning/roofChains.test.ts`, `scene/roomitBuilding.test.ts` |
| Toiture de plusieurs pans comptée sur la réunion des pans (D20-15) : bande de recouvrement comptée une fois, égouts sous un autre pan non comptés ; ROOMIT R+1 : 161,12 m² en plan (aire du contour), 161,13 m² réels, égouts 18065 mm, périmètre 56288 mm | Auto : `scene/roofUnion.test.ts`, `scene/roomitBuilding.test.ts` |
| Plan de toiture : surfaces affichées seulement si « Afficher les surfaces de toiture » est cochée ; mêmes valeurs que l'onglet Métrés | Auto : `building/views/areaTable.test.ts` ; Nav. |
| Plan de toiture lié au modèle : pente 1 → 2 % dans Pascal → flèches « Pente 2 % » ; débord 300 → 400 mm → cote d'ensemble 15072 → 15272 mm et surface en plan à jour ; rien enregistré hors de la scène | Auto : `scene/roofModelLink.test.ts` |
| PDF relu : R+1 à 1:50 (A2) tous les traits à ≤ 0,1 mm, 4304 mm = 86,08 mm ; toiture à 1:50 (15072 mm = 301,44 mm), 1:100 (A3) et 1:200 (A4) | Auto : `export/printScaleR1.test.ts` |

### M20 · 20.1c — Coupes et façades
| Critère | Vérification |
|---|---|
| Toiture de Pascal de plusieurs pans (ou pente < 1°) dessinée en façade et en coupe ; pas de toit plat automatique dessous ; métrés de toiture sans doublon | Auto : `scene/roomitViews.test.ts` |
| Coupe : une seule cote « Faîtage » pour des faîtages à moins de 300 mm | Auto : `scene/roomitViews.test.ts` |
| Étage de 2500 mm = 50,0 mm sur une façade imprimée à 1:50 (G3) | Auto : `scene/roomitViews.test.ts` ; Nav. (règle) |
