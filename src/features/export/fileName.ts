/**
 * Nom de fichier sûr : sans caractères interdits par Windows (`\ / : * ? " < > |`), sans
 * caractères de contrôle ni points ou espaces en fin de nom. `fallback` sert si rien ne reste.
 */
export function sanitizeFileName(name: string, fallback: string): string {
  const cleaned = name
    // eslint-disable-next-line no-control-regex -- les caractères de contrôle sont interdits dans un nom de fichier
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[. ]+$/, '')
  return cleaned || fallback
}

export type ExportFileType = 'png' | 'jpg' | 'pdf' | 'csv'

/** Nom complet : ajoute l'extension si l'utilisateur ne l'a pas déjà saisie. */
export function exportFileName(name: string, type: ExportFileType, fallback: string): string {
  const base = sanitizeFileName(name, fallback)
  const extension = `.${type}`
  const hasExtension = base.toLowerCase().endsWith(extension) && base.length > extension.length
  return hasExtension ? base : `${base}${extension}`
}
