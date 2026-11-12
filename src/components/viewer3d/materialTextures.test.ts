import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { applyPlanarUv, roofSurface, wallSurface } from './materialTextures'

function quad(points: number[][], normal: number[]): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(points.flat(), 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(points.flatMap(() => normal), 3))
  return g
}

describe('coordonnées de texture', () => {
  it('un mur : u le long du mur, v à la verticale (en mètres)', () => {
    const g = quad([[0, 0, 0], [2000, 0, 0], [2000, 3000, 0]], [0, 0, 1])
    applyPlanarUv(g)
    const uv = g.getAttribute('uv')
    expect([uv.getX(1) - uv.getX(0), uv.getY(1) - uv.getY(0)].map(Math.abs)).toEqual([2, 0])
    expect(Math.abs(uv.getY(2) - uv.getY(1))).toBeCloseTo(3)
  })

  it('un versant à 45° : v suit la ligne de pente', () => {
    const s = Math.SQRT1_2
    const g = quad([[0, 0, 0], [0, 1000, -1000], [1000, 0, 0]], [0, s, s])
    applyPlanarUv(g)
    const uv = g.getAttribute('uv')
    // Monter de 1000 mm en hauteur et 1000 mm en profondeur (dans le plan) = √2 mètres le long de la pente.
    expect(Math.abs(uv.getY(1) - uv.getY(0))).toBeCloseTo(Math.SQRT2)
    expect(Math.abs(uv.getX(1) - uv.getX(0))).toBeCloseTo(0)
  })

  it('sans matériau ni couverture : pas de matière (rendu neutre)', () => {
    expect(wallSurface(undefined)).toBeNull()
    expect(roofSurface(undefined)).toBeNull()
    expect(wallSurface('brick')).not.toBeNull()
    expect(roofSurface('tiles')).not.toBeNull()
  })
})
