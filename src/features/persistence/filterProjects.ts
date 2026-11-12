/** Minuscules sans accents (« Éléphant » → « elephant »), pour comparer sans se soucier de la casse ni des accents. */
export function normalizeSearchText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/**
 * Projets dont le nom contient tous les mots recherchés (dans n'importe quel ordre), sans tenir
 * compte de la casse ni des accents. Une recherche vide garde tous les projets, dans leur ordre.
 */
export function filterProjectsByName<T extends { name: string }>(
  projects: readonly T[],
  query: string,
): T[] {
  const words = normalizeSearchText(query).split(/\s+/).filter(Boolean)
  if (words.length === 0) return [...projects]
  return projects.filter((project) => {
    const name = normalizeSearchText(project.name)
    return words.every((word) => name.includes(word))
  })
}
