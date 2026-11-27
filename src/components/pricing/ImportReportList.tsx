import type { ImportIssue } from '../../features/pricing/importReport'
import { useT } from '../../i18n/useT'

const LEVEL_CLASS = {
  blocking: 'text-red-600',
  warning: 'text-amber-600',
  info: 'text-muted-foreground',
} as const

/** Rapport de lecture d'un fichier de prix : un message par type, avec quelques exemples dépliables. */
export default function ImportReportList({ issues }: { issues: readonly ImportIssue[] }) {
  const t = useT()
  if (issues.length === 0) return <p className="text-sm text-muted-foreground">{t('pricing.import.reportEmpty')}</p>
  return (
    <ul className="space-y-1.5 text-sm">
      {issues.map((issue) => (
        <li key={issue.code}>
          <details>
            <summary className="cursor-pointer">
              <span className={`mr-2 text-xs font-medium ${LEVEL_CLASS[issue.level]}`}>
                {t(`pricing.import.level.${issue.level}`)}
              </span>
              {t(`pricing.issue.${issue.code}`, { count: issue.count })}
            </summary>
            {issue.examples.length > 0 && (
              <ul className="ml-6 mt-1 list-disc space-y-0.5 text-xs text-muted-foreground">
                {issue.examples.map((example, index) => (
                  <li key={index} className="whitespace-pre-line break-words">
                    {example.sheet && `${example.sheet}${example.row ? ` (${t('pricing.import.row', { row: example.row })})` : ''} : `}
                    {example.detail}
                  </li>
                ))}
              </ul>
            )}
          </details>
        </li>
      ))}
    </ul>
  )
}
