import { describe, expect, it } from 'vitest'
import { dataUrlToBlob } from './dataUrl'

describe('dataUrlToBlob', () => {
  it('décode le contenu et le type', async () => {
    const blob = dataUrlToBlob('data:text/plain;base64,SGVsbG8=')
    expect(blob.type).toBe('text/plain')
    expect(await blob.text()).toBe('Hello')
  })
})
