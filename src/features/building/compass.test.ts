import { describe, expect, it } from 'vitest'
import { angleFromPointer, snapCompassAngle } from './compass'

const center = { x: 100, y: 100 }

describe('angleFromPointer', () => {
  it('donne 0° quand le pointeur est au-dessus du centre', () => {
    expect(angleFromPointer(center, { x: 100, y: 40 })).toBe(0)
  })

  it('tourne dans le sens horaire : droite = 90°, bas = 180°, gauche = 270°', () => {
    expect(angleFromPointer(center, { x: 160, y: 100 })).toBe(90)
    expect(angleFromPointer(center, { x: 100, y: 160 })).toBe(180)
    expect(angleFromPointer(center, { x: 40, y: 100 })).toBe(270)
  })

  it('donne 45° en haut à droite', () => {
    expect(angleFromPointer(center, { x: 150, y: 50 })).toBe(45)
  })

  it('ne donne rien quand le pointeur est au centre', () => {
    expect(angleFromPointer(center, { x: 100, y: 100 })).toBeNull()
  })
})

describe('snapCompassAngle', () => {
  it('aimante sur 15° par défaut', () => {
    expect(snapCompassAngle(22, false)).toBe(15)
    expect(snapCompassAngle(23, false)).toBe(30)
  })

  it('reste au degré en mode précis', () => {
    expect(snapCompassAngle(22, true)).toBe(22)
  })

  it('revient à 0° après 352° aimanté', () => {
    expect(snapCompassAngle(353, false)).toBe(0)
  })
})
