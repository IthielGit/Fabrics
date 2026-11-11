import { createContext } from 'react'
import type { Point } from '../../../features/geometry/viewport'

/** Raccords d'angle à dessiner avec chaque mur (clé : identifiant du mur), voir `computeWallJoins`. */
export type WallJoins = ReadonlyMap<string, readonly (readonly Point[])[]>

export const NO_WALL_JOINS: WallJoins = new Map()

export const WallJoinsContext = createContext<WallJoins>(NO_WALL_JOINS)
