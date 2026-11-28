/**
 * M24, 24.3 (D24-9) : un fichier est fabriqué en entier avant d'être proposé au téléchargement ; une
 * erreur en cours de route ne télécharge rien et remonte à l'appelant (qui l'annonce).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createDesignProject } from '../../features/documents/createProject'

const downloadBlob = vi.fn()
vi.mock('../../lib/download', () => ({ downloadBlob: (...args: unknown[]) => downloadBlob(...args) }))
vi.mock('../../features/persistence/repository', () => ({ repository: { getAssetUrl: vi.fn() } }))
const buildBackup = vi.fn()
vi.mock('../../features/backup/backup', async (original) => ({
  ...(await original<typeof import('../../features/backup/backup')>()),
  buildBackup: (...args: unknown[]) => buildBackup(...args),
}))

const { downloadProjectBackup } = await import('./backupActions')

beforeEach(() => {
  downloadBlob.mockReset()
  buildBackup.mockReset()
})

describe('exports atomiques (D24-9)', () => {
  it('une sauvegarde qui échoue en cours de fabrication ne télécharge rien', async () => {
    buildBackup.mockRejectedValue(new Error('mémoire insuffisante'))
    await expect(downloadProjectBackup(createDesignProject('banner', 'Essai'), { withEstimate: false })).rejects.toThrow('mémoire insuffisante')
    expect(downloadBlob).not.toHaveBeenCalled()
  })

  it('une sauvegarde réussie est proposée une seule fois, en entier', async () => {
    buildBackup.mockResolvedValue(new Uint8Array([0x50, 0x4b, 3, 4]))
    await downloadProjectBackup(createDesignProject('banner', 'Essai'), { withEstimate: false })
    expect(downloadBlob).toHaveBeenCalledTimes(1)
    const [blob, name] = downloadBlob.mock.calls[0] as [Blob, string]
    expect(blob.size).toBe(4)
    expect(name).toMatch(/^Essai - sauvegarde \d{4}-\d{2}-\d{2}\.fabrics$/)
  })
})
