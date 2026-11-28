import { listWorkspaceEvents } from '../../features/audit/auditApi'
import type { AuditEvent } from '../../features/audit/journal'
import type { PricingRepository } from '../../features/pricing/repository'

/** Journal de l'espace : événements d'audit et imports de prix déjà journalisés (M23), réunis. */
export async function libraryJournal(repository: PricingRepository, workspaceId: string, libraryId: string): Promise<AuditEvent[]> {
  const [events, imports] = await Promise.all([
    repository.shared ? listWorkspaceEvents(workspaceId) : Promise.resolve([]),
    repository.listImports(libraryId),
  ])
  const importEvents: AuditEvent[] = imports.map((batch) => ({
    id: `import-${batch.id}`,
    occurredAt: batch.importedAt,
    actorEmail: batch.importedByEmail,
    kind: 'price_import',
    details: { file: batch.fileName, version: String(batch.version) },
  }))
  return [...events, ...importEvents]
}
