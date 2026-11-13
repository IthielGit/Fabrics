# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: people who need a plan at real scale and its quantities, without CAD skills.

- Individuals renovating a home: draw a room or a floor, know surfaces and lengths.
- Tradespeople and small design offices: survey an existing building, get the takeoffs
  (métrés), export them.

Secondary (in the product docs): content creators, students and associations making quick
visuals. Since 2026-11-12 the home page is plan-only: new visuals cannot be created from it,
so public pages must not promote visuals until that changes.

All interface copy is in French. Speaks to non-specialists first.

## Product Purpose

Fabrics takes someone from an idea to a clean visual or a dimensioned plan in minutes.
Value proposition (from `docs/01-PRODUIT.md`): « Crée des visuels et des plans à l'échelle,
mesure-les instantanément, exporte-les en un clic. »

Success: a new user draws a room and reads a correct surface (±1 % of the traced outline) in
minutes, without help; no work is ever lost on reload.

## Positioning

Draw it, it measures. Walls and rooms are drawn at real scale and the surfaces, perimeters and
lengths are calculated live, in architectural metric units. A generic design tool draws shapes;
Fabrics draws a building and knows its quantities. A plan grows into a building: levels,
openings, 3D view, facades and sections, all derived from what was drawn.

## Operating Context

- Browser app (React), saved automatically, synced to the user's account (Supabase).
- Access requires an account (e-mail + password, or Google). Public without login: the intro
  page, the login page, the password-reset page, and read-only share links (`/s/…`).
- Exports: PNG, JPG, PDF (A4/A3, chosen scale for plans), CSV of quantities, DXF, glTF.

## Capabilities and Constraints

- Two project kinds sharing one editor: Visual (`design`, pixels) and Plan (`plan`, mm).
- Plan mode: walls with thickness, rooms, dimensions, image calibration, Métrés panel,
  openings, levels, axes, furniture library, 3D view, facades and sections, DXF import/export.
- Units are always « Métrique architectural »: lengths in integer mm (`3500 mm`), areas in m²,
  volumes in m³, everywhere including marketing copy.
- Never: quotes, prices, quotations. Quantities stop at quantities.
- Out of scope today: real-time collaboration, teams and roles, templates, subscriptions,
  dark mode, other languages, AI assistant.

## Brand Commitments

- Name: Fabrics. Logo: indigo tile with the lucide `PencilRuler` icon and the bold wordmark.
- Original identity: never imitate Canva, Figma, Synaps or any existing product's UI, name,
  copy or assets.
- Icons: `lucide-react` only. Fonts: system or OFL (Google Fonts / Fontsource).
- No third-party images or illustrations without a verified licence; demo material is made
  for Fabrics. Furniture symbols are drawn from scratch (clean room).

## Evidence on Hand

- The product itself: drawn plans with live measurements, the example houses « Maison R+1 »
  and « Maison R+3 » shipped in the app, the 3D view.
- No testimonials, customer logos, user counts, ratings or benchmarks exist. Do not
  fabricate them.

## Product Principles

1. Show the measurement, don't describe it: every promise is demonstrated with a real plan
   and real numbers in mm and m².
2. Plain French for non-specialists; precision without jargon.
3. Quantities, never prices.
4. The user's work and media stay theirs and private.
