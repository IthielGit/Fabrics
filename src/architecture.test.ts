/**
 * Test d'architecture (M17, mécanisme anti-duplication du roadmap).
 *
 * 1. Le code de Fabrics (`src/`) n'importe Pascal que par les exports publics de ses paquets
 *    (`@pascal-app/*`), jamais par un chemin vers `packages/pascal/` ni vers leur `src/`.
 * 2. Aucun module retiré (voir `docs/adr/0003-doublons.md`) n'est importé. La liste grandit à
 *    chaque retrait (M19 : vue 3D de Fabrics, M20 : `jspdf` ou `pdfkit`, M22 : export IFC de Fabrics).
 */
import { describe, expect, it } from 'vitest'

/** Texte de chaque fichier source de `src/` (lu par Vite, sans module Node). */
const SOURCES = import.meta.glob<string>(['./**/*.{ts,tsx}', '!./**/*.test.{ts,tsx}'], {
  query: '?raw',
  import: 'default',
  eager: true,
})

/** Modules retirés : motif d'import interdit et raison (ADR). Vide en M17 : rien n'est retiré. */
const RETIRED: readonly { pattern: RegExp; reason: string }[] = []

const IMPORT = /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g

function importsOf(text: string): string[] {
  return [...text.matchAll(IMPORT)].map((m) => m[1] ?? m[2])
}

const files = Object.entries(SOURCES)

describe('architecture de Fabrics', () => {
  it('trouve les fichiers sources', () => {
    expect(files.length).toBeGreaterThan(100)
  })

  it("n'importe jamais le code interne de Pascal par un chemin", () => {
    const offenders = files.flatMap(([file, text]) =>
      importsOf(text)
        .filter((spec) => /packages[\\/]pascal|@pascal-app\/[^/]+\/src\b/.test(spec))
        .map((spec) => `${file} → ${spec}`),
    )
    expect(offenders).toEqual([])
  })

  // M18 (ADR 0004) : un seul point d'entrée vers la scène Pascal, `src/features/scene/`.
  it("n'importe @pascal-app/core que depuis src/features/scene/", () => {
    const offenders = files.flatMap(([file, text]) =>
      importsOf(text)
        .filter((spec) => spec.startsWith('@pascal-app/core') && !file.startsWith('./features/scene/'))
        .map((spec) => `${file} → ${spec}`),
    )
    expect(offenders).toEqual([])
  })

  it("n'importe aucun module retiré", () => {
    const offenders = files.flatMap(([file, text]) =>
      importsOf(text).flatMap((spec) =>
        RETIRED.filter((r) => r.pattern.test(spec)).map((r) => `${file} → ${spec} (${r.reason})`),
      ),
    )
    expect(offenders).toEqual([])
  })
})
