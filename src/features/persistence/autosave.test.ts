import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createDesignProject } from '../documents/createProject'
import { createAutosaver, type AutosaveStatus } from './autosave'

const NOW = new Date('2026-11-10T12:00:00.000Z')

function setup(save = vi.fn().mockResolvedValue(undefined)) {
  const statuses: AutosaveStatus[] = []
  const autosaver = createAutosaver({
    delayMs: 1000,
    save,
    onStatus: (status) => statuses.push(status),
    now: () => NOW,
  })
  return { autosaver, save, statuses }
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('createAutosaver', () => {
  it('enregistre une seconde après la dernière modification', async () => {
    const { autosaver, save, statuses } = setup()
    const project = createDesignProject('post-square', 'Test')
    autosaver.schedule(project)
    expect(statuses).toEqual(['saving'])

    await vi.advanceTimersByTimeAsync(999)
    expect(save).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    expect(save).toHaveBeenCalledTimes(1)
    expect(statuses).toEqual(['saving', 'saving', 'saved'])
  })

  it('regroupe plusieurs modifications rapprochées en un seul enregistrement', async () => {
    const { autosaver, save } = setup()
    const project = createDesignProject('post-square', 'Test')
    autosaver.schedule(project)
    await vi.advanceTimersByTimeAsync(600)
    autosaver.schedule({ ...project, name: 'V2' })
    await vi.advanceTimersByTimeAsync(600)
    expect(save).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(400)
    expect(save).toHaveBeenCalledTimes(1)
    expect(save.mock.calls[0][0].name).toBe('V2')
  })

  it('met à jour la date de modification', async () => {
    const { autosaver, save } = setup()
    autosaver.schedule(createDesignProject('story', 'Test', new Date('2020-01-01')))
    await vi.advanceTimersByTimeAsync(1000)
    expect(save.mock.calls[0][0].updatedAt).toBe(NOW.toISOString())
  })

  it('flush enregistre immédiatement, une seule fois', async () => {
    const { autosaver, save } = setup()
    autosaver.schedule(createDesignProject('a4', 'Test'))
    await autosaver.flush()
    expect(save).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(5000)
    expect(save).toHaveBeenCalledTimes(1)
  })

  it('flush sans modification en attente ne fait rien', async () => {
    const { autosaver, save, statuses } = setup()
    await autosaver.flush()
    expect(save).not.toHaveBeenCalled()
    expect(statuses).toEqual([])
  })

  it('signale une erreur quand l’enregistrement échoue', async () => {
    const { autosaver, statuses } = setup(vi.fn().mockRejectedValue(new Error('disque plein')))
    autosaver.schedule(createDesignProject('banner', 'Test'))
    await vi.advanceTimersByTimeAsync(1000)
    expect(statuses.at(-1)).toBe('error')
  })

  it('ne dit pas « Enregistré » si le projet a changé pendant l’écriture', async () => {
    let finishSave: () => void = () => {}
    const slowSave = vi.fn(
      () => new Promise<void>((resolve) => {
        finishSave = resolve
      }),
    )
    const { autosaver, statuses } = setup(slowSave)
    const project = createDesignProject('post-square', 'Test')

    autosaver.schedule(project)
    await vi.advanceTimersByTimeAsync(1000) // l'écriture démarre, mais n'est pas finie
    autosaver.schedule({ ...project, name: 'Modifié pendant l’écriture' })
    finishSave()
    await vi.advanceTimersByTimeAsync(0)

    expect(statuses).not.toContain('saved')
    expect(statuses.at(-1)).toBe('saving')
  })

  it('cancel abandonne l’enregistrement en attente', async () => {
    const { autosaver, save } = setup()
    autosaver.schedule(createDesignProject('post-square', 'Test'))
    autosaver.cancel()
    await vi.advanceTimersByTimeAsync(5000)
    expect(save).not.toHaveBeenCalled()
  })
})
