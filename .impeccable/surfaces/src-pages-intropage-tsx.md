---
version: 1
slug: "src-pages-intropage-tsx"
primary_target: "src/pages/IntroPage.tsx"
related_targets: []
---

# Intro page (`/bienvenue`)

Scope: public entry page; every other app route requires login. Visitor mode: Persuade.
Audience: plan users first (renovators, tradespeople); visuals second. Job: understand
"draw it, it measures", then create an account or sign in. Proof: product demos only
(drawn plan with real computed measurements, the shipped example houses). No testimonials,
counts, prices or invented claims. Constraints: French copy via `src/i18n/fr.ts`, units in
mm / m² / m³, lucide icons, OFL fonts only.

## Direction contract

THESIS: Your pencil sketch becomes a measured plan. The page owns that transformation and
refuses the split hero with a product screenshot and the row of feature cards.

OWN-WORLD: Fabrics' incumbent world. Indigo-950 field for the measured side, warm paper for
the sketch side, indigo-300 walls, indigo-600 actions, system sans, a handwritten OFL face
only inside the sketch, dimension lines with ticks in mm, tabular numerals.

STORY: The visitor recognises their own sketch, watches it become a clean plan with surfaces
in m², drags the divider to check, learns the plan grows into a building (levels, 3D,
façades, coupes, exports), creates an account. (Visuals beat dropped: PRODUCT.md forbids promoting visuals while the home page is plan-only.)

FIRST VIEWPORT: Header with logo left and "Se connecter" right. Headline left in two lines;
right column with lead, primary "Créer mon compte" and "J'ai déjà un compte". Then a
full-width rounded stage split by a draggable divider: sketch left, indigo plan right,
labelled "Votre croquis" / "Dans Fabrics", Métrés readout bottom-right. Signature
interaction: the divider sweeps once from the plan side to rest at 50 %, where the handwritten séjour and its "5200 ?" guess stay on paper beside the measured cuisine and entrée, then drags or keys.

FORM: "Du croquis au plan", position 5 of 7 on the ordered list, seed:aa3089aa118ce144.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
