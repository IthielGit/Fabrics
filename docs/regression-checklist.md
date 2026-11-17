# Liste de non-régression (à partir de M17)

Chaque jalon de la phase « Fabrics + Pascal » (M17 → M25) repasse cette liste avant son gate.
**Auto** = vérifié par `npm run check:all` (le fichier de test est indiqué, chemins depuis `src/`).
**Nav.** = geste à refaire dans le navigateur (`npm run dev`, puis http://localhost:5173).
Un écart = gate **FAIL**, sauf écart voulu et documenté (règle du roadmap).

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

### M8 — Vue 3D
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
| Façade 6000 + fenêtre 1200 centrée → `2400 · 1200 · 2400`, `6000`, `F01`, `1200 / 1350`, `All. 900` | Auto : `dimensioning/facadeChains.test.ts`, `dimensioning/executionDimensions.test.ts` |
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
| glTF et IFC exportés | Auto : `export/gltf.test.ts`, `export/ifc.test.ts`, baseline IFC |

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
| En-tête, rail d'outils, barre d'état, métrés en direct (pièce 6000 × 2000 → « Surface 12,00 m² ») | Auto : `measurements/liveSummary.test.ts` ; Nav. |

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

Section à compléter au lot 4 à partir de l'inventaire `docs/capabilities.md` (une ligne par
fonction native de Pascal, vérifiée par `npm run test:pascal` ou dans l'éditeur de Pascal).
