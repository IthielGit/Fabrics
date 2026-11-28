import type { JournalLabels } from '../../features/audit/journal'
import type { Translate } from '../../i18n/useT'

/** Phrases du journal d'audit en français (catalogue Lingui de Fabrics). */
export function journalLabels(t: Translate): JournalLabels {
  return {
    someone: t('journal.someone'),
    sentence: {
      export: (who, d) => t('journal.export', { who, format: d.format ?? '' }),
      backup: (who) => t('journal.backup', { who }),
      restore: (who, d) => t('journal.restore', { who, from: d.from ?? '' }),
      estimate_final: (who, d) => t('journal.estimateFinal', { who, number: d.number ?? '' }),
      estimate_draft: (who, d) => t('journal.estimateDraft', { who, number: d.number ?? '' }),
      workspace_member_joined: (_who, d) => t('journal.workspaceJoined', { email: d.email ?? '' }),
      workspace_member_left: (_who, d) => t('journal.workspaceLeft', { email: d.email ?? '' }),
      project_member_joined: (_who, d) => t('journal.projectJoined', { email: d.email ?? '' }),
      project_member_left: (_who, d) => t('journal.projectLeft', { email: d.email ?? '' }),
      price_import: (who, d) => t('journal.priceImport', { who, file: d.file ?? '', version: d.version ?? '' }),
    },
  }
}
