import { describe, expect, it } from 'vitest'
import { journalEntries, type AuditEvent, type JournalLabels } from './journal'

const labels: JournalLabels = {
  someone: 'Quelqu’un',
  sentence: {
    export: (who, d) => `${who} a exporté (${d.format})`,
    backup: (who) => `${who} a téléchargé une sauvegarde`,
    restore: (who) => `${who} a restauré`,
    estimate_final: (who, d) => `${who} a figé la version ${d.number} du devis (définitif)`,
    estimate_draft: (who, d) => `${who} a figé la version ${d.number} du devis (brouillon)`,
    workspace_member_joined: (_who, d) => `${d.email} a rejoint l’espace`,
    workspace_member_left: (_who, d) => `${d.email} a quitté l’espace`,
    project_member_joined: (_who, d) => `${d.email} a rejoint le projet`,
    project_member_left: (_who, d) => `${d.email} a quitté le projet`,
    price_import: (who, d) => `${who} a importé ${d.file}`,
  },
}

const event = (id: string, at: string, patch: Partial<AuditEvent>): AuditEvent => ({ id, occurredAt: at, actorEmail: 'b@test', kind: 'export', details: {}, ...patch })

describe('journal d’audit (D24-4)', () => {
  it('une phrase par événement, la plus récente d’abord', () => {
    const entries = journalEntries(
      [
        event('1', '2026-11-28T08:00:00Z', { kind: 'export', details: { format: 'PDF' } }),
        event('2', '2026-11-28T09:00:00Z', { kind: 'estimate_final', details: { number: 3 } }),
        event('3', '2026-11-28T07:00:00Z', { kind: 'backup', actorEmail: '' }),
      ],
      labels,
    )
    expect(entries.map((e) => e.text)).toEqual(['b@test a figé la version 3 du devis (définitif)', 'b@test a exporté (PDF)', 'Quelqu’un a téléchargé une sauvegarde'])
  })
})
