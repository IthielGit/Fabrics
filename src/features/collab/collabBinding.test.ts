import { describe, expect, it } from 'vitest'
import * as Y from 'yjs'
import { createPlanProject } from '../documents/createProject'
import { createWallElement } from '../documents/elements'
import type { CanvasElement, FabricsDocument } from '../../types/document'
import { CollabBinding } from './collabBinding'
import { readSavedAt } from './yDocument'

/** Un éditeur simulé : son document, son état « geste en cours » et sa liaison. */
class FakeEditor {
  document: FabricsDocument
  live = false
  history = { canUndo: false, canRedo: false }
  /** Heure d'enregistrement du projet tel que l'éditeur l'a ouvert (`updatedAt`). */
  openedAt: string | null = null
  /** Pour chaque document reçu : venait-il d'une autre connexion ? */
  received: boolean[] = []
  readonly ydoc = new Y.Doc()
  readonly binding: CollabBinding

  constructor(document: FabricsDocument) {
    this.document = document
    this.binding = new CollabBinding(this.ydoc, {
      getDocument: () => this.document,
      isLiveEditing: () => this.live,
      applyRemoteDocument: (next, fromPeer) => {
        this.document = next
        this.received.push(fromPeer)
      },
      getSavedAt: () => this.openedAt,
      onHistoryChange: (canUndo, canRedo) => {
        this.history = { canUndo, canRedo }
      },
    })
  }

  /** Modification locale (comme `commit` dans l'éditeur). */
  edit(change: (elements: CanvasElement[]) => CanvasElement[]): void {
    this.document = { ...this.document, elements: change(this.document.elements) }
    this.binding.localChanged()
  }

  names(): string[] {
    return this.document.elements.map((el) => el.name)
  }

  element(name: string): CanvasElement {
    const found = this.document.elements.find((el) => el.name === name)
    if (!found) throw new Error(`Élément ${name} absent`)
    return found
  }
}

/** Relie deux `Y.Doc` comme le ferait le serveur (chaque mise à jour est transmise à l'autre). */
function connect(a: Y.Doc, b: Y.Doc): void {
  const relay = Symbol('relay')
  a.on('update', (update: Uint8Array, origin: unknown) => {
    if (origin !== relay) Y.applyUpdate(b, update, relay)
  })
  b.on('update', (update: Uint8Array, origin: unknown) => {
    if (origin !== relay) Y.applyUpdate(a, update, relay)
  })
  Y.applyUpdate(b, Y.encodeStateAsUpdate(a), relay)
  Y.applyUpdate(a, Y.encodeStateAsUpdate(b), relay)
}

function wall(name: string): CanvasElement {
  return createWallElement(name, [0, 0, 3500, 0], 200, 2700)
}

/** Deux personnes sur le même plan : Alice l'a créé, Bruno arrive avec une copie plus ancienne. */
function twoEditors() {
  const document = { ...createPlanProject('Essai').document, elements: [wall('A')] }
  const alice = new FakeEditor(document)
  alice.binding.start() // projet inconnu du serveur : Alice l'envoie
  const bruno = new FakeEditor({ ...document, elements: [] })
  connect(alice.ydoc, bruno.ydoc)
  bruno.binding.start() // le serveur a déjà le projet : Bruno reçoit la version partagée
  return { alice, bruno }
}

describe('CollabBinding', () => {
  it('le second arrivé reçoit la version partagée', () => {
    const { bruno } = twoEditors()
    expect(bruno.names()).toEqual(['A'])
  })

  it('chacun voit les modifications de l’autre', () => {
    const { alice, bruno } = twoEditors()
    alice.edit((elements) => [...elements, wall('B')])
    expect(bruno.names()).toEqual(['A', 'B'])
    bruno.edit((elements) => elements.map((el) => (el.name === 'A' ? { ...el, x: 500 } : el)))
    expect(alice.element('A').x).toBe(500)
  })

  it('deux propriétés différentes du même mur ne s’écrasent pas', () => {
    const { alice, bruno } = twoEditors()
    // Les deux modifient le mur A « en même temps » (avant de recevoir l'autre modification).
    alice.live = true
    bruno.live = true
    alice.edit((elements) => elements.map((el) => ({ ...el, thickness: 300 }) as CanvasElement))
    bruno.edit((elements) => elements.map((el) => ({ ...el, name: 'A' }) as CanvasElement))
    bruno.edit((elements) => elements.map((el) => ({ ...el, height: 3000 }) as CanvasElement))
    alice.live = false
    alice.binding.localChanged()
    bruno.live = false
    bruno.binding.localChanged()
    for (const editor of [alice, bruno]) {
      const a = editor.element('A') as CanvasElement & { thickness: number; height: number }
      expect(a.thickness).toBe(300)
      expect(a.height).toBe(3000)
    }
  })

  it('Ctrl+Z n’annule que ses propres modifications', () => {
    const { alice, bruno } = twoEditors()
    alice.edit((elements) => [...elements, wall('B')])
    bruno.edit((elements) => [...elements, wall('C')])
    expect(alice.names()).toEqual(['A', 'B', 'C'])

    alice.binding.undo()
    expect(alice.names()).toEqual(['A', 'C'])
    expect(bruno.names()).toEqual(['A', 'C'])

    alice.binding.redo()
    expect(bruno.names()).toEqual(['A', 'B', 'C'])

    bruno.binding.undo()
    expect(alice.names()).toEqual(['A', 'B'])
    // Rien à annuler de plus pour Bruno : l'envoi initial et les ajouts d'Alice ne sont pas à lui.
    expect(bruno.binding.canUndo()).toBe(false)
    bruno.binding.undo()
    expect(alice.names()).toEqual(['A', 'B'])
  })

  it('l’envoi initial du projet ne s’annule pas', () => {
    const { alice } = twoEditors()
    expect(alice.binding.canUndo()).toBe(false)
    alice.edit((elements) => [...elements, wall('B')])
    expect(alice.history.canUndo).toBe(true)
    alice.binding.undo()
    expect(alice.names()).toEqual(['A'])
    expect(alice.history).toEqual({ canUndo: false, canRedo: true })
  })

  it('une modification reçue pendant un geste attend la fin du geste', () => {
    const { alice, bruno } = twoEditors()
    alice.live = true
    alice.edit((elements) => elements.map((el) => ({ ...el, x: 10 })))
    bruno.edit((elements) => [...elements, wall('B')])
    expect(alice.names()).toEqual(['A']) // pas d'interruption du geste
    expect(bruno.element('A').x).toBe(0) // le geste n'est pas encore envoyé
    alice.live = false
    alice.binding.localChanged()
    expect(alice.names()).toEqual(['A', 'B'])
    expect(alice.element('A').x).toBe(10)
    expect(bruno.element('A').x).toBe(10)
  })

  it('suppression d’un côté, modification de l’autre pendant un geste : les deux finissent identiques', () => {
    const { alice, bruno } = twoEditors()
    alice.live = true
    alice.edit((elements) => elements.map((el) => ({ ...el, x: 10 })))
    bruno.edit(() => [])
    alice.live = false
    alice.binding.localChanged()
    // Alice a modifié un élément déjà supprimé : sa modification le recrée (dernier mot à Alice).
    expect(alice.names()).toEqual(['A'])
    expect(bruno.names()).toEqual(['A'])
  })

  it('une modification d’une autre personne est signalée, pas mon annuler / rétablir', () => {
    const { alice, bruno } = twoEditors()
    bruno.received = []
    alice.edit((elements) => [...elements, wall('B')])
    expect(bruno.received).toEqual([true])
    alice.received = []
    alice.binding.undo()
    expect(alice.received).toEqual([false])
    expect(bruno.received).toEqual([true, true])
  })
})

describe('CollabBinding : enregistrement dans Supabase (lot F)', () => {
  it('la marque d’enregistrement part vers les autres sans rien afficher ni s’annuler', () => {
    const { alice, bruno } = twoEditors()
    alice.received = []
    bruno.received = []
    alice.binding.markSaved('2026-11-15T10:00:00.000Z')
    expect(bruno.received).toEqual([])
    expect(alice.received).toEqual([])
    expect(alice.binding.canUndo()).toBe(false)
    expect(readSavedAt(bruno.ydoc)).toBe('2026-11-15T10:00:00.000Z')
  })

  it('une marque plus ancienne ne remplace pas une plus récente', () => {
    const { alice } = twoEditors()
    alice.binding.markSaved('2026-11-15T10:00:00.000Z')
    alice.binding.markSaved('2026-11-15T09:00:00.000Z')
    expect(readSavedAt(alice.ydoc)).toBe('2026-11-15T10:00:00.000Z')
  })

  /** La salle contient A ; elle a été enregistrée à 10 h ; Carole arrive avec sa copie. */
  function joinLater(openedAt: string | null, savedAt: string | null) {
    const document = { ...createPlanProject('Essai').document, elements: [wall('A')] }
    const alice = new FakeEditor(document)
    alice.binding.start()
    if (savedAt) alice.binding.markSaved(savedAt)
    const carole = new FakeEditor({ ...document, elements: [wall('A'), wall('B')] })
    carole.openedAt = openedAt
    connect(alice.ydoc, carole.ydoc)
    carole.binding.start()
    return { alice, carole }
  }

  it('un projet enregistré après la salle (travail hors connexion) la met à jour', () => {
    const { alice, carole } = joinLater('2026-11-15T11:00:00.000Z', '2026-11-15T10:00:00.000Z')
    expect(carole.names()).toEqual(['A', 'B'])
    expect(alice.names()).toEqual(['A', 'B'])
  })

  it('un projet enregistré avant la salle prend la version de la salle', () => {
    const { alice, carole } = joinLater('2026-11-15T09:00:00.000Z', '2026-11-15T10:00:00.000Z')
    expect(carole.names()).toEqual(['A'])
    expect(alice.names()).toEqual(['A'])
  })

  it('même heure : la salle garde la priorité', () => {
    const { carole } = joinLater('2026-11-15T10:00:00.000Z', '2026-11-15T10:00:00.000Z')
    expect(carole.names()).toEqual(['A'])
  })

  it('salle sans marque (jamais enregistrée depuis la salle) : la salle garde la priorité', () => {
    const { carole } = joinLater('2026-11-15T11:00:00.000Z', null)
    expect(carole.names()).toEqual(['A'])
  })

  it('l’envoi du projet plus récent ne s’annule pas', () => {
    const { carole } = joinLater('2026-11-15T11:00:00.000Z', '2026-11-15T10:00:00.000Z')
    expect(carole.binding.canUndo()).toBe(false)
  })
})
