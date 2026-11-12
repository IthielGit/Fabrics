import type { SetDef } from './catalog/sets'

/** Ensemble enregistré par l'utilisateur : son nom et sa composition, prête à poser comme un ensemble du catalogue. */
export interface UserSet {
  /** `user-` suivi d'un identifiant unique. */
  id: string
  name: string
  def: SetDef
}

let registry = new Map<string, UserSet>()

/** Remplace la liste des ensembles de l'utilisateur connus du reste de l'application (posés par `getPlaceable`). */
export function setUserSets(sets: readonly UserSet[]): void {
  registry = new Map(sets.map((set) => [set.id, set]))
}

/** Ensemble de l'utilisateur par identifiant, ou `undefined`. */
export function getUserSet(id: string): UserSet | undefined {
  return registry.get(id)
}
