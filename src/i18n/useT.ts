import { usePascalI18n } from '@pascal-app/core/i18n'
import { useMemo } from 'react'
import type { FabricsMessageId } from './fabricsMessages'

export type Translate = (id: FabricsMessageId, values?: Record<string, string | number>) => string

/** `const t = useT()` puis `t('home.title')` ; `t('home.noSearchResult', { query })` pour une variable. */
export function useT(): Translate {
  const scope = usePascalI18n()
  return useMemo<Translate>(() => (id, values) => scope._(`fabrics.${id}`, values), [scope])
}
