/**
 * M20 20.1a étape 4 — lien au modèle : un mur déplacé dans l'éditeur de Pascal met à jour le plan
 * d'exécution (cotes, étiquettes) et les métrés, sans autre action ; rien du plan n'est enregistré à
 * part de la scène. Exemple ROOMIT-RDC : la cloison SDB_G (entre Séjour et SDB) avance de 500 mm.
 */
import { describe, expect, it } from 'vitest'
import * as Y from 'yjs'
import spec from '../../../fixtures/ROOMIT-RDC/spec.json'
import type { FabricsDocument } from '../../types/document'
import { EXECUTION_LABELS } from '../../i18n/dimensioningLabels'
import { levelAnnotations } from '../dimensioning/levelAnnotations'
import { computeBuildingMeasurements } from '../measurements/measurements'
import { fixtureScene, type FixtureSpec } from './fixturePlan'
import { SceneBinding, type SceneHost } from './sceneBinding'
import type { PlanScene } from './sceneTypes'
import { settleScene } from './settle'
import { toStoredDocument } from './storedScene'
import { sceneToFabricsView } from './view/toFabricsView'

/** Éditeur minimal : il affiche la vue que la liaison lui donne. */
class FakeEditor implements SceneHost {
  document: FabricsDocument
  private readonly scene: PlanScene
  constructor(document: FabricsDocument, scene: PlanScene) {
    this.document = document
    this.scene = scene
  }
  getDocument() {
    return this.document
  }
  getScene() {
    return this.scene
  }
  isLiveEditing() {
    return false
  }
  applyRemoteDocument(document: FabricsDocument) {
    this.document = document
  }
}

const WALL = 'wall_SDB_G__0'
const SHIFT_M = 0.5

/** Geste dans Pascal : la cloison SDB_G avance de 500 mm vers la SDB, puis Pascal reprend la scène. */
function movedInPascal(scene: PlanScene): PlanScene {
  const wall = scene.nodes[WALL]
  const start = wall.start as number[]
  const end = wall.end as number[]
  return settleScene({
    ...scene,
    nodes: { ...scene.nodes, [WALL]: { ...wall, start: [start[0] + SHIFT_M, start[1]], end: [end[0] + SHIFT_M, end[1]] } },
  })
}

const m2 = (mm2: number) => Math.round(mm2 / 1e4) / 100
const roomArea = (doc: FabricsDocument, name: string) =>
  m2(computeBuildingMeasurements(doc).levels[0].measurements.rooms.find((r) => r.name === name)!.area)
const roomId = (doc: FabricsDocument, name: string) => doc.elements.find((el) => el.type === 'room' && el.name === name)!.id

function plan(doc: FabricsDocument) {
  return levelAnnotations(doc, doc.levels![0].id, 'execution', EXECUTION_LABELS)
}
/** Longueur (mm) de la cote intérieure de largeur d'une pièce. */
function roomWidth(doc: FabricsDocument, name: string): number {
  const dim = plan(doc).dimensions.find((d) => d.id === `room-${roomId(doc, name)}-width`)!
  const [x1, y1, x2, y2] = dim.points
  return Math.round(Math.hypot(x2 - x1, y2 - y1))
}
const roomLabel = (doc: FabricsDocument, name: string) =>
  plan(doc).labels.find((l) => l.id === `room-${roomId(doc, name)}`)!.lines

function open() {
  const scene = settleScene(fixtureScene(spec as unknown as FixtureSpec))
  const editor = new FakeEditor(sceneToFabricsView(scene), scene)
  const binding = new SceneBinding(new Y.Doc(), editor)
  binding.start()
  return { editor, binding }
}

describe('ROOMIT-RDC : le plan suit le modèle Pascal (20.1a étape 4)', () => {
  it('avant : SDB 1475 mm de large, 6,47 m² ; Séjour 36,18 m²', () => {
    const { editor } = open()
    expect(roomWidth(editor.document, 'SDB')).toBe(1475)
    expect(roomArea(editor.document, 'SDB')).toBe(6.47)
    expect(roomArea(editor.document, 'Séjour')).toBe(36.18)
    expect(roomLabel(editor.document, 'SDB').join(' ')).toContain('6,47')
  })

  it('mur déplacé de 500 mm dans Pascal : cote, étiquette et surfaces suivent, sans autre action', () => {
    const { editor, binding } = open()
    binding.pushScene(movedInPascal(binding.getScene()!))
    const doc = editor.document
    expect(roomWidth(doc, 'SDB')).toBe(975)
    // 500 mm × 4389 mm de hauteur de pièce = 2,19 m² passés de la SDB au Séjour
    expect(roomArea(doc, 'SDB')).toBe(4.28)
    expect(roomArea(doc, 'Séjour')).toBe(38.37)
    expect(roomLabel(doc, 'SDB').join(' ')).toContain('4,28')
    expect(roomLabel(doc, 'Séjour').join(' ')).toContain('38,37')
  })

  it('annuler (Ctrl+Z) remet la cote et les surfaces d’avant', () => {
    const { editor, binding } = open()
    binding.pushScene(movedInPascal(binding.getScene()!))
    binding.undo()
    expect(roomWidth(editor.document, 'SDB')).toBe(1475)
    expect(roomArea(editor.document, 'SDB')).toBe(6.47)
  })

  it('aucune donnée de plan enregistrée à part : le projet enregistré est la scène seule', () => {
    const { editor, binding } = open()
    binding.pushScene(movedInPascal(binding.getScene()!))
    const stored = toStoredDocument({ kind: 'plan', document: editor.document, scene: binding.getScene()! })
    expect(Object.keys(stored).sort()).toEqual(['format', 'scene', 'sceneFormat', 'version'])
    const json = JSON.stringify(stored)
    expect(json).not.toContain('-width"')
    expect(json).not.toContain('PP:')
  })
})
