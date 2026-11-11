import { describe, expect, it } from 'vitest'
import { formatElevation } from './labels'

describe('formatElevation', () => {
  it('écrit les altitudes en mm avec leur signe', () => {
    expect(formatElevation(0)).toBe('± 0 mm')
    expect(formatElevation(2500)).toBe('+ 2500 mm')
    expect(formatElevation(-300)).toBe('− 300 mm')
  })
})
