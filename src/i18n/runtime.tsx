import { createI18n, PascalI18nProvider, registerCompiledMessages } from '@pascal-app/core/i18n'
import type { ReactNode } from 'react'
import { fabricsFr } from './fabricsMessages'

// Les textes de Fabrics sont un paquet « hôte » de Pascal, sous l'espace de noms `fabrics`.
registerCompiledMessages('fr', 'fabrics', fabricsFr as unknown as Parameters<typeof registerCompiledMessages>[2])

const i18n = createI18n({ locale: 'fr' })

/** Fournit la langue française à tout l'arbre (Pascal et Fabrics partagent la même instance). */
export function I18nProvider({ children }: { children: ReactNode }) {
  return <PascalI18nProvider i18n={i18n}>{children}</PascalI18nProvider>
}
