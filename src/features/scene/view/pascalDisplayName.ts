/**
 * Noms que Pascal garde en anglais dans la scène (M19 B7) : pièces de son catalogue (« Bedroom 2 ») et
 * noms par défaut de ses outils (« Roof 1 »). Pascal les traduit à l'affichage ; Fabrics fait de même
 * dans ses vues et métrés, sans jamais modifier la scène (la numérotation et le MCP de Pascal lisent
 * l'anglais). Un nom tapé par l'utilisateur reste tel quel.
 */
import { pascalNames } from '../../../i18n/pascalNames'

/** Même découpage que Pascal (`roomNameParts`) : espaces, nom, numéro facultatif, espaces. */
const NAME_PARTS = /^(\s*)(.*?)(\s+\d+)?(\s*)$/

export function pascalDisplayName(name: string, names: Readonly<Record<string, string>> = pascalNames): string {
  const match = NAME_PARTS.exec(name)
  const base = match?.[2] ?? ''
  if (!base || !Object.hasOwn(names, base)) return name
  return `${match?.[1] ?? ''}${names[base]}${match?.[3] ?? ''}${match?.[4] ?? ''}`
}
