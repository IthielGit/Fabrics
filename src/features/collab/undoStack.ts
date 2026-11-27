import * as Y from 'yjs'

/**
 * Historique d'annulation d'un `Y.Doc` limité aux écritures de cet éditeur (`origin`), qui prévient
 * `onChange` à chaque changement de pile (pour griser ou non les boutons Annuler / Rétablir).
 * `captureTimeout` : 0 pour une étape par écriture ; très grand pour laisser l'appelant fermer
 * lui-même chaque étape (`stopCapturing`).
 */
export function createUndoStack(
  scope: ConstructorParameters<typeof Y.UndoManager>[0],
  origin: unknown,
  captureTimeout: number,
  onChange: () => void,
): Y.UndoManager {
  const undoManager = new Y.UndoManager(scope, { trackedOrigins: new Set([origin]), captureTimeout })
  undoManager.on('stack-item-added', onChange)
  undoManager.on('stack-item-popped', onChange)
  undoManager.on('stack-cleared', onChange)
  return undoManager
}
