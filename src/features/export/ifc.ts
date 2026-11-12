/**
 * Écriture d'un fichier IFC (schéma IFC2x3, format texte STEP) sans bibliothèque, pour Revit et les
 * autres logiciels BIM.
 *
 * Contenu : un étage par niveau ; les murs (un par côté de la ligne du mur), leurs ouvertures
 * (porte, fenêtre, baie, avec la réserve dans le mur), les pièces (espaces) et un sol par pièce.
 * Pas encore : escaliers, toitures, plateformes, cheminées, mobilier, cotes.
 *
 * Unités : millimètres. Le plan de Fabrics a l'axe y vers le bas (écran) ; l'IFC a l'axe Y vers le
 * haut : chaque point est retourné (`Y = −y`), les longueurs ne changent pas. Les identifiants
 * (GlobalId) se déduisent de ceux des éléments : deux exports du même plan donnent les mêmes.
 */
import type { FabricsDocument, OpeningElement, RoomElement, WallElement } from '../../types/document'
import { sortLevels } from '../documents/levels'
import { wallSegment } from '../geometry/openings'

/** Textes écrits dans le fichier (noms des objets), fournis par l'interface. */
export interface IfcLabels {
  site: string
  building: string
  wall: string
  room: string
  floor: string
  door: string
  window: string
  opening: string
}

export interface IfcOptions {
  /** Nom du projet. */
  projectName: string
  /** Nom du fichier, écrit dans l'en-tête. */
  fileName: string
  labels: IfcLabels
  /** Date de l'export (testable). */
  now?: Date
}

/** Nombre réel STEP : toujours un point décimal, jamais de notation scientifique. */
export function ifcNumber(value: number): string {
  let text = (Number.isFinite(value) ? value : 0).toFixed(6)
  if (text.includes('.')) text = text.replace(/0+$/, '')
  if (text === '-0.' || text === '-0') text = '0.'
  return text.includes('.') ? text : `${text}.`
}

/** Texte STEP : apostrophe et barre inverse doublées, caractères non ASCII en `\X2\…\X0\`. */
export function ifcString(text: string): string {
  let out = ''
  let pending = ''
  const flush = () => {
    if (pending) out += `\\X2\\${pending}\\X0\\`
    pending = ''
  }
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    if (code < 32 || code === 127) {
      flush()
      out += ' '
    } else if (code > 126) {
      pending += code.toString(16).toUpperCase().padStart(4, '0')
    } else {
      flush()
      const ch = text[i]
      out += ch === "'" ? "''" : ch === '\\' ? '\\\\' : ch
    }
  }
  flush()
  return `'${out}'`
}

const GUID_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_$'

/** Empreinte de 128 bits d'un texte (quatre entiers de 32 bits). */
function hash128(text: string): [number, number, number, number] {
  let h1 = 1779033703
  let h2 = 3144134277
  let h3 = 1013904242
  let h4 = 2773480762
  for (let i = 0; i < text.length; i++) {
    const k = text.charCodeAt(i)
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067)
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233)
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213)
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179)
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067)
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233)
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213)
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179)
  return [(h1 ^ h2 ^ h3 ^ h4) >>> 0, (h2 ^ h1) >>> 0, (h3 ^ h1) >>> 0, (h4 ^ h1) >>> 0]
}

/** GlobalId IFC (22 caractères) déduit d'un texte : le même texte donne toujours le même identifiant. */
export function ifcGuid(seed: string): string {
  let n = 0n
  for (const part of hash128(seed)) n = (n << 32n) | BigInt(part)
  let out = ''
  for (let i = 0; i < 22; i++) {
    out = GUID_CHARS[Number(n & 63n)] + out
    n >>= 6n
  }
  return out
}

type Vec2 = readonly [number, number]
type Vec3 = readonly [number, number, number]

/** Suite d'entités STEP numérotées `#1`, `#2`… */
class Step {
  private lines: string[] = []

  add(body: string): string {
    const id = `#${this.lines.length + 1}`
    this.lines.push(`${id}=${body};`)
    return id
  }

  get data(): string {
    return this.lines.join('\n')
  }
}

const list = (ids: readonly string[]) => `(${ids.join(',')})`
const num = ifcNumber

/** Segment de mur écrit : son entité et son repère (les ouvertures se placent dans ce repère). */
interface WallPiece {
  id: string
  placement: string
}

export function buildIfc(
  document: Pick<FabricsDocument, 'elements' | 'levels' | 'plan'>,
  options: IfcOptions,
): string | null {
  const { labels } = options
  const levels = sortLevels(document.levels ?? [])
  if (levels.length === 0) return null
  const firstLevelId = levels[0].id
  const ownerLevel = (el: { levelId?: string }) => el.levelId ?? firstLevelId

  const walls = document.elements.filter((el): el is WallElement => el.type === 'wall' && !el.hidden)
  const rooms = document.elements.filter(
    (el): el is RoomElement => el.type === 'room' && !el.hidden && el.points.length >= 6,
  )
  const openings = document.elements.filter((el): el is OpeningElement => el.type === 'opening' && !el.hidden)
  if (walls.length === 0 && rooms.length === 0) return null

  const now = options.now ?? new Date()
  const s = new Step()
  const g = (seed: string) => `'${ifcGuid(seed)}'`

  // --- Géométrie de base ---
  const pt3 = ([x, y, z]: Vec3) => s.add(`IFCCARTESIANPOINT((${num(x)},${num(y)},${num(z)}))`)
  const pt2 = ([x, y]: Vec2) => s.add(`IFCCARTESIANPOINT((${num(x)},${num(y)}))`)
  const dir3 = ([x, y, z]: Vec3) => s.add(`IFCDIRECTION((${num(x)},${num(y)},${num(z)}))`)
  const dir2 = ([x, y]: Vec2) => s.add(`IFCDIRECTION((${num(x)},${num(y)}))`)
  const axis3 = (origin: Vec3, xDir?: Vec2) =>
    s.add(`IFCAXIS2PLACEMENT3D(${pt3(origin)},${xDir ? dir3([0, 0, 1]) : '$'},${xDir ? dir3([xDir[0], xDir[1], 0]) : '$'})`)
  const place = (parent: string | null, origin: Vec3, xDir?: Vec2) =>
    s.add(`IFCLOCALPLACEMENT(${parent ?? '$'},${axis3(origin, xDir)})`)

  // --- En-tête de projet ---
  const person = s.add(`IFCPERSON($,$,'Fabrics',$,$,$,$,$)`)
  const organization = s.add(`IFCORGANIZATION($,'Fabrics',$,$,$)`)
  const personAndOrg = s.add(`IFCPERSONANDORGANIZATION(${person},${organization},$)`)
  const application = s.add(`IFCAPPLICATION(${organization},'1.0','Fabrics','Fabrics')`)
  const history = s.add(
    `IFCOWNERHISTORY(${personAndOrg},${application},$,.ADDED.,$,$,$,${Math.floor(now.getTime() / 1000)})`,
  )

  const northAngle = ((document.plan?.northAngle ?? 0) * Math.PI) / 180
  const worldAxis = axis3([0, 0, 0])
  const trueNorth = dir2([Math.sin(northAngle), Math.cos(northAngle)])
  const context = s.add(`IFCGEOMETRICREPRESENTATIONCONTEXT($,'Model',3,1.E-05,${worldAxis},${trueNorth})`)
  const bodyContext = s.add(
    `IFCGEOMETRICREPRESENTATIONSUBCONTEXT('Body','Model',*,*,*,*,${context},$,.MODEL_VIEW.,$)`,
  )
  const units = s.add(
    `IFCUNITASSIGNMENT(${list([
      s.add('IFCSIUNIT(*,.LENGTHUNIT.,.MILLI.,.METRE.)'),
      s.add('IFCSIUNIT(*,.AREAUNIT.,$,.SQUARE_METRE.)'),
      s.add('IFCSIUNIT(*,.VOLUMEUNIT.,$,.CUBIC_METRE.)'),
      s.add('IFCSIUNIT(*,.PLANEANGLEUNIT.,$,.RADIAN.)'),
    ])})`,
  )
  const project = s.add(
    `IFCPROJECT(${g('project')},${history},${ifcString(options.projectName)},$,$,$,$,${list([context])},${units})`,
  )

  const sitePlacement = place(null, [0, 0, 0])
  const site = s.add(`IFCSITE(${g('site')},${history},${ifcString(labels.site)},$,$,${sitePlacement},$,$,.ELEMENT.,$,$,$,$,$)`)
  const buildingPlacement = place(sitePlacement, [0, 0, 0])
  const building = s.add(
    `IFCBUILDING(${g('building')},${history},${ifcString(labels.building)},$,$,${buildingPlacement},$,$,.ELEMENT.,$,$,$)`,
  )
  const aggregate = (seed: string, parent: string, children: readonly string[]) =>
    s.add(`IFCRELAGGREGATES(${g(seed)},${history},$,$,${parent},${list(children)})`)
  aggregate('rel-project', project, [site])
  aggregate('rel-site', site, [building])

  // --- Formes ---
  const zDir = dir3([0, 0, 1])
  const body = (solid: string) =>
    s.add(
      `IFCPRODUCTDEFINITIONSHAPE($,$,${list([s.add(`IFCSHAPEREPRESENTATION(${bodyContext},'Body','SweptSolid',${list([solid])})`)])})`,
    )
  const extrude = (profile: string, depth: number, z = 0) =>
    s.add(`IFCEXTRUDEDAREASOLID(${profile},${axis3([0, 0, z])},${zDir},${num(depth)})`)
  const rectProfile = (cx: number, cy: number, xDim: number, yDim: number) =>
    s.add(`IFCRECTANGLEPROFILEDEF(.AREA.,$,${s.add(`IFCAXIS2PLACEMENT2D(${pt2([cx, cy])},$)`)},${num(xDim)},${num(yDim)})`)
  const polygonProfile = (flat: readonly number[]) => {
    const ids: string[] = []
    for (let i = 0; i + 1 < flat.length; i += 2) ids.push(pt2([flat[i], -flat[i + 1]]))
    ids.push(ids[0])
    return s.add(`IFCARBITRARYCLOSEDPROFILEDEF(.AREA.,$,${s.add(`IFCPOLYLINE(${list(ids)})`)})`)
  }

  const label = (text: string | undefined, fallback: string) => ifcString(text?.trim() ? text : fallback)
  const wallsBySegment = new Map<string, WallPiece>()

  for (const level of levels) {
    const storeyPlacement = place(buildingPlacement, [0, 0, level.elevation])
    const storey = s.add(
      `IFCBUILDINGSTOREY(${g(`level:${level.id}`)},${history},${ifcString(level.name)},$,$,${storeyPlacement},$,$,.ELEMENT.,${num(level.elevation)})`,
    )
    const contained: string[] = []
    const spaces: string[] = []

    // Murs : un par côté de la ligne ; le bout d'un côté est prolongé d'une demi-épaisseur aux
    // raccords, pour combler le coin extérieur.
    for (const wall of walls.filter((w) => ownerLevel(w) === level.id)) {
      const flat = wall.points
      const count = Math.floor(flat.length / 2)
      const closed = count > 2 && flat[0] === flat[flat.length - 2] && flat[1] === flat[flat.length - 1]
      for (let k = 0; k + 1 < count; k++) {
        const seg = wallSegment(wall, k)
        if (!seg) continue
        const joins = k + 2 < count || closed
        const extra = joins ? wall.thickness / 2 : 0
        const length = seg.length + extra
        const placement = place(storeyPlacement, [seg.a.x, -seg.a.y, 0], [seg.direction.x, -seg.direction.y])
        const shape = body(extrude(rectProfile(length / 2, 0, length, wall.thickness), wall.height))
        const name = count > 2 ? `${wall.name || labels.wall} ${k + 1}` : wall.name || labels.wall
        const id = s.add(`IFCWALL(${g(`wall:${wall.id}:${k}`)},${history},${ifcString(name)},$,$,${placement},${shape},$)`)
        contained.push(id)
        wallsBySegment.set(`${wall.id}:${k}`, { id, placement })
      }
    }

    // Ouvertures : réserve dans le mur, puis porte, fenêtre ou baie qui la remplit.
    for (const opening of openings.filter((o) => ownerLevel(o) === level.id)) {
      const wall = walls.find((w) => w.id === opening.wallId)
      const piece = wallsBySegment.get(`${opening.wallId}:${opening.segmentIndex}`)
      if (!wall || !piece) continue
      const holePlacement = place(piece.placement, [0, 0, opening.sillHeight])
      const hole = s.add(
        `IFCOPENINGELEMENT(${g(`hole:${opening.id}`)},${history},${ifcString(labels.opening)},$,$,${holePlacement},${body(
          extrude(rectProfile(opening.offset, 0, opening.width, wall.thickness), opening.height),
        )},$)`,
      )
      s.add(`IFCRELVOIDSELEMENT(${g(`void:${opening.id}`)},${history},$,$,${piece.id},${hole})`)
      const isDoor = opening.kind === 'door'
      const panelDepth = Math.min(wall.thickness, 80)
      const filler = s.add(
        `${isDoor ? 'IFCDOOR' : 'IFCWINDOW'}(${g(`fill:${opening.id}`)},${history},${label(opening.name, isDoor ? labels.door : labels.window)},$,$,${holePlacement},${body(
          extrude(rectProfile(opening.offset, 0, opening.width, panelDepth), opening.height),
        )},$,${num(opening.height)},${num(opening.width)})`,
      )
      s.add(`IFCRELFILLSELEMENT(${g(`fills:${opening.id}`)},${history},$,$,${hole},${filler})`)
      contained.push(filler)
    }

    // Pièces (espaces) et sol.
    for (const room of rooms.filter((r) => ownerLevel(r) === level.id)) {
      const name = label(room.name, labels.room)
      spaces.push(
        s.add(
          `IFCSPACE(${g(`room:${room.id}`)},${history},${name},$,$,${place(storeyPlacement, [0, 0, 0])},${body(
            extrude(polygonProfile(room.points), level.height),
          )},$,.ELEMENT.,.INTERNAL.,$)`,
        ),
      )
      contained.push(
        s.add(
          `IFCSLAB(${g(`floor:${room.id}`)},${history},${ifcString(`${labels.floor} ${room.name || labels.room}`.trim())},$,$,${place(storeyPlacement, [0, 0, 0])},${body(
            extrude(polygonProfile(room.points), level.slabThickness, -level.slabThickness),
          )},$,.FLOOR.)`,
        ),
      )
    }

    aggregate(`rel-building:${level.id}`, building, [storey])
    if (spaces.length > 0) aggregate(`rel-storey:${level.id}`, storey, spaces)
    if (contained.length > 0) {
      s.add(`IFCRELCONTAINEDINSPATIALSTRUCTURE(${g(`rel-contained:${level.id}`)},${history},$,$,${list(contained)},${storey})`)
    }
  }

  const stamp = now.toISOString().slice(0, 19)
  return [
    'ISO-10303-21;',
    'HEADER;',
    "FILE_DESCRIPTION(('ViewDefinition [CoordinationView]'),'2;1');",
    `FILE_NAME(${ifcString(options.fileName)},'${stamp}',('Fabrics'),('Fabrics'),'Fabrics','Fabrics','');`,
    "FILE_SCHEMA(('IFC2X3'));",
    'ENDSEC;',
    'DATA;',
    s.data,
    'ENDSEC;',
    'END-ISO-10303-21;',
    '',
  ].join('\n')
}
