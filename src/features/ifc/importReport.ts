/**
 * Import IFC contrôlé (M22, 22.4) : bilan de ce que la conversion de Pascal a fait de chaque objet du
 * fichier, pour que rien ne disparaisse ni ne change en silence (gate G5). La conversion n'est pas
 * modifiée : le fichier est relu ici (texte STEP) et comparé à la scène obtenue, objet par objet, par
 * le GlobalId que la conversion garde (`metadata.globalId`). Fonctions pures.
 */
import type { SceneNodeData } from '../scene/sceneTypes'

export interface IfcObject {
  globalId: string
  /** Classe IFC (en majuscules, comme dans le fichier : `IFCWALL`). */
  entity: string
  name: string
}

/** Ce que la conversion de Pascal a signalé (`IfcConversionReport`). */
export interface ConversionIssues {
  skippedGeometry: { transforms: number; vertices: number; triangles: number; primitives: number; elements: number }
  replaced: { unitFactor: boolean; originOffset: boolean; levelElevations: number; normals: number }
}

export interface IfcImportReport {
  /** Objets du fichier repris comme éléments de plan (murs, dalles, portes, pièces…). */
  native: IfcObject[]
  /** Objets repris avec leur seule forme 3D (ni modifiables comme élément de plan, ni dans les métrés). */
  shapeOnly: IfcObject[]
  /** Percements remplis par une porte ou une fenêtre : repris avec elle. */
  filledOpenings: number
  /** Objets du fichier absents de la scène importée. */
  missing: IfcObject[]
  /** Nœuds créés par la conversion sans objet du fichier (ex. trémie déduite d'une dalle), par type. */
  derived: Record<string, number>
  conversion: ConversionIssues
}

/** Classes IFC qui ne sont pas des objets du bâtiment (relations, propriétés, types, groupes…). */
const NOT_OBJECT = /^IFC(REL[A-Z]+|PROPERTYSET|ELEMENTQUANTITY|PROJECT|PROJECTLIBRARY|GROUP|ZONE|SYSTEM|[A-Z]*SYSTEM|TASK|PROCEDURE|ACTOR|ACTIONREQUEST|COSTITEM|COSTSCHEDULE|WORKPLAN|WORKSCHEDULE|PERMIT|APPROVAL|INVENTORY|ASSET|STRUCTURALANALYSISMODEL|PERMEABLECOVERINGPROPERTIES|[A-Z]+TYPE|[A-Z]+STYLE|[A-Z]*PROPERTIES|PROPERTYTEMPLATE|PROPERTYSETTEMPLATE|[A-Z]*CONTEXT)$/
const GUID = /^[0-3][0-9A-Za-z_$]{21}$/
/** Nœuds de forme seule (forme 3D reprise telle quelle par la conversion de Pascal). */
const SHAPE_ONLY_TYPES = new Set(['imported-mesh', 'block'])

/** Texte STEP `'…'` → texte (apostrophes doublées, `\X2\…\X0\` en UTF-16, `\X\hh` en ISO 8859-1). */
export function decodeStepString(raw: string): string {
  return raw
    .replace(/''/g, "'")
    .replace(/\\X2\\([0-9A-F]+)\\X0\\/gi, (_, hex: string) => {
      let out = ''
      for (let i = 0; i + 3 < hex.length; i += 4) out += String.fromCharCode(Number.parseInt(hex.slice(i, i + 4), 16))
      return out
    })
    .replace(/\\X\\([0-9A-F]{2})/gi, (_, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)))
}

/** Attributs de premier niveau d'une entité STEP (texte entre ses parenthèses), sans les décoder. */
export function stepArguments(text: string, start: number): string[] {
  const args: string[] = []
  let depth = 0
  let current = ''
  for (let i = start; i < text.length; i++) {
    const c = text[i]
    if (c === "'") {
      let j = i + 1
      while (j < text.length && !(text[j] === "'" && text[j + 1] !== "'")) j += text[j] === "'" ? 2 : 1
      current += text.slice(i, j + 1)
      i = j
    } else if (c === '(') {
      depth++
      current += c
    } else if (c === ')') {
      if (depth === 0) {
        args.push(current.trim())
        return args
      }
      depth--
      current += c
    } else if (c === ',' && depth === 0) {
      args.push(current.trim())
      current = ''
    } else {
      current += c
    }
  }
  return args
}

const unquote = (arg: string | undefined) => (arg && arg.startsWith("'") && arg.endsWith("'") ? decodeStepString(arg.slice(1, -1)) : '')

/** Objets d'un fichier IFC (racine IFC avec GlobalId, hors relations, propriétés et types). */
export function ifcObjects(text: string): { objects: IfcObject[]; filledOpenings: Set<string> } {
  const objects: IfcObject[] = []
  const byStepId = new Map<string, IfcObject>()
  const fills: [string, string][] = []
  const entity = /#(\d+)\s*=\s*(IFC[A-Z0-9_]+)\s*\(/g
  for (let match = entity.exec(text); match; match = entity.exec(text)) {
    const [, stepId, type] = match
    const start = match.index + match[0].length
    const isFill = type === 'IFCRELFILLSELEMENT'
    // Seules les entités dont le premier attribut est un texte (le GlobalId) sont lues en entier.
    if (!isFill && (text[start] !== "'" || NOT_OBJECT.test(type))) continue
    const args = stepArguments(text, start)
    if (isFill) {
      fills.push([args[4] ?? '', args[5] ?? ''])
      continue
    }
    const globalId = unquote(args[0])
    if (!GUID.test(globalId)) continue
    const object = { globalId, entity: type, name: unquote(args[2]) }
    objects.push(object)
    byStepId.set(`#${stepId}`, object)
  }
  const filledOpenings = new Set<string>()
  for (const [opening] of fills) {
    const found = byStepId.get(opening)
    if (found) filledOpenings.add(found.globalId)
  }
  return { objects, filledOpenings }
}

/** Bilan de l'import d'un fichier IFC en scène Pascal. */
export function ifcImportReport(
  ifcText: string,
  nodes: Readonly<Record<string, SceneNodeData>>,
  conversion: ConversionIssues,
): IfcImportReport {
  const { objects, filledOpenings } = ifcObjects(ifcText)
  const nodeByGuid = new Map<string, SceneNodeData>()
  const derived: Record<string, number> = {}
  for (const node of Object.values(nodes)) {
    const guid = node.metadata?.globalId
    if (typeof guid === 'string' && GUID.test(guid)) nodeByGuid.set(guid, node)
    else derived[node.type] = (derived[node.type] ?? 0) + 1
  }
  const report: IfcImportReport = { native: [], shapeOnly: [], filledOpenings: 0, missing: [], derived, conversion }
  for (const object of objects) {
    const node = nodeByGuid.get(object.globalId)
    if (node) (SHAPE_ONLY_TYPES.has(node.type) ? report.shapeOnly : report.native).push(object)
    else if (object.entity === 'IFCOPENINGELEMENT' && filledOpenings.has(object.globalId)) report.filledOpenings++
    else report.missing.push(object)
  }
  return report
}

/** Vrai si le bilan a quelque chose à signaler (sinon : tout a été repris comme élément de plan). */
export function importReportHasIssues(report: IfcImportReport): boolean {
  const { skippedGeometry: s, replaced: r } = report.conversion
  return (
    report.missing.length > 0 ||
    report.shapeOnly.length > 0 ||
    s.transforms + s.vertices + s.triangles + s.primitives + s.elements + r.levelElevations > 0 ||
    r.unitFactor ||
    r.originOffset
  )
}

export interface ImportReportTexts {
  native: (count: number) => string
  filledOpenings: (count: number) => string
  shapeOnly: (count: number) => string
  missing: (count: number) => string
  derived: (count: number, types: string) => string
  skippedElements: (count: number) => string
  skippedPieces: (count: number) => string
  unitFactor: string
  originOffset: string
  levelElevations: (count: number) => string
  object: (entity: string, name: string, globalId: string) => string
  group: (entity: string, count: number) => string
}

export interface ImportReportSection {
  text: string
  /** Détail (objets un par un, ou par classe). */
  items: string[]
  /** `info` : rien de perdu ; `warning` : à vérifier. */
  tone: 'info' | 'warning'
}

/** Bilan d'import en phrases, dans l'ordre : repris, forme seule, non importés, conversion. */
export function importReportSections(report: IfcImportReport, texts: ImportReportTexts): ImportReportSection[] {
  const sections: ImportReportSection[] = []
  const byClass = (list: readonly IfcObject[]) => {
    const counts = new Map<string, number>()
    for (const o of list) counts.set(o.entity, (counts.get(o.entity) ?? 0) + 1)
    return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([entity, count]) => texts.group(entity, count))
  }
  sections.push({ text: texts.native(report.native.length), items: byClass(report.native), tone: 'info' })
  if (report.filledOpenings > 0) sections.push({ text: texts.filledOpenings(report.filledOpenings), items: [], tone: 'info' })
  if (report.shapeOnly.length > 0) sections.push({ text: texts.shapeOnly(report.shapeOnly.length), items: byClass(report.shapeOnly), tone: 'warning' })
  if (report.missing.length > 0) {
    sections.push({
      text: texts.missing(report.missing.length),
      items: report.missing.map((o) => texts.object(o.entity, o.name, o.globalId)),
      tone: 'warning',
    })
  }
  const derivedCount = Object.values(report.derived).reduce((a, b) => a + b, 0)
  if (derivedCount > 0) {
    const types = Object.entries(report.derived).map(([type, count]) => `${type} × ${count}`).join(', ')
    sections.push({ text: texts.derived(derivedCount, types), items: [], tone: 'info' })
  }
  const { skippedGeometry: s, replaced: r } = report.conversion
  const conversion: string[] = []
  if (s.elements > 0) conversion.push(texts.skippedElements(s.elements))
  const pieces = s.transforms + s.primitives + s.triangles
  if (pieces > 0) conversion.push(texts.skippedPieces(pieces))
  if (r.unitFactor) conversion.push(texts.unitFactor)
  if (r.originOffset) conversion.push(texts.originOffset)
  if (r.levelElevations > 0) conversion.push(texts.levelElevations(r.levelElevations))
  for (const text of conversion) sections.push({ text, items: [], tone: 'warning' })
  return sections
}

/** Bilan en texte brut (fichier téléchargé avec le projet importé). */
export function importReportText(title: string, fileName: string, sections: readonly ImportReportSection[]): string {
  const lines = [title, fileName, '']
  for (const section of sections) {
    lines.push(`${section.tone === 'warning' ? '!' : '-'} ${section.text}`)
    for (const item of section.items) lines.push(`    ${item}`)
  }
  return `${lines.join('\n')}\n`
}
