import clsx from 'clsx'
import {
  BrickWall,
  BrickWallFire,
  ChevronRight,
  Circle,
  Crosshair,
  DoorOpen,
  FileInput,
  Footprints,
  Grid2x2,
  Hash,
  House,
  ImagePlus,
  Layers2,
  MousePointer2,
  Pentagon,
  Ruler,
  Scissors,
  Slash,
  Slice,
  Square,
  StretchHorizontal,
  Type,
  type LucideIcon,
} from 'lucide-react'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { ACCEPTED_IMAGE_TYPES } from '../../features/documents/images'
import { fr } from '../../i18n/fr'
import { useEditorStore, type EditorTool } from '../../stores/editorStore'
import { importImageFiles } from './importImages'

// Chargée à la demande : la lecture des DXF (`dxf-parser`) n'alourdit pas l'ouverture de l'éditeur.
const ImportDxfDialog = lazy(() => import('./ImportDxfDialog'))

/** Au-delà, un DXF est refusé avant lecture (le navigateur serait trop lent). */
const MAX_DXF_BYTES = 50 * 1024 * 1024

/** Une entrée d'un groupe : un outil, ou une action immédiate (importer une image). */
type ToolEntry =
  | { kind: 'tool'; id: EditorTool; icon: LucideIcon; label: string; short?: string; shortcut?: string }
  | { kind: 'action'; id: 'image' | 'dxf'; icon: LucideIcon; label: string; short?: string; shortcut?: string }

interface ToolGroup {
  id: string
  label: string
  entries: ToolEntry[]
  /** Réservé aux projets de type Plan. */
  planOnly?: boolean
}

const tool = (
  id: EditorTool,
  icon: LucideIcon,
  label: string,
  shortcut?: string,
  short?: string,
): ToolEntry => ({
  kind: 'tool',
  id,
  icon,
  label,
  short,
  shortcut,
})

/**
 * Familles d'outils, de la plus utilisée à la moins utilisée. Chaque famille n'occupe qu'un bouton
 * (le dernier outil choisi) ; la flèche ouvre la liste complète de la famille.
 */
function toolGroups(isPlan: boolean): ToolGroup[] {
  const groups: ToolGroup[] = [
    { id: 'select', label: fr.tools.groups.select, entries: [tool('select', MousePointer2, fr.tools.select, 'V')] },
    {
      id: 'build',
      label: fr.tools.groups.build,
      planOnly: true,
      entries: [
        tool('wall', BrickWall, fr.tools.wall, 'W'),
        tool('room', Pentagon, fr.tools.room, 'P'),
        tool('platform', Layers2, fr.tools.platform),
        tool('roof', House, fr.tools.roof),
        tool('stair', Footprints, fr.tools.stair),
        tool('chimney', BrickWallFire, fr.tools.chimney),
        tool('stretch', StretchHorizontal, fr.tools.stretch, 'S', fr.tools.short.stretch),
        tool('cut', Slice, fr.tools.cut, undefined, fr.tools.short.cut),
      ],
    },
    {
      id: 'openings',
      label: fr.tools.groups.openings,
      planOnly: true,
      entries: [tool('door', DoorOpen, fr.tools.door, 'B'), tool('window', Grid2x2, fr.tools.window, 'F')],
    },
    {
      id: 'annotate',
      label: fr.tools.groups.annotate,
      planOnly: true,
      entries: [
        tool('dimension', Ruler, fr.tools.dimension, 'D'),
        tool('axis', Hash, fr.tools.axis, 'A', fr.tools.short.axis),
        tool('section', Scissors, fr.tools.section),
      ],
    },
    {
      id: 'draw',
      label: fr.tools.groups.draw,
      entries: [
        tool('text', Type, fr.tools.text, 'T'),
        tool('rect', Square, fr.tools.rect, 'R'),
        tool('ellipse', Circle, fr.tools.ellipse, 'O'),
        tool('line', Slash, fr.tools.line, 'L'),
      ],
    },
    {
      id: 'image',
      label: fr.tools.groups.image,
      entries: [
        { kind: 'action', id: 'image', icon: ImagePlus, label: fr.tools.image, short: fr.tools.short.image },
        ...(isPlan
          ? [
              tool('calibrate', Crosshair, fr.tools.calibrate, undefined, fr.tools.short.calibrate),
              {
                kind: 'action' as const,
                id: 'dxf' as const,
                icon: FileInput,
                label: fr.tools.importDxf,
                short: fr.tools.short.importDxf,
              },
            ]
          : []),
      ],
    },
  ]
  return groups.filter((group) => isPlan || !group.planOnly)
}

const withShortcut = (entry: ToolEntry) =>
  entry.shortcut ? `${entry.label} (${entry.shortcut})` : entry.label

/**
 * Barre d'outils à gauche du canevas, rangée par familles : Sélection, Construction, Ouvertures,
 * Cotation, Dessin, Image (les familles du plan n'apparaissent que dans un plan).
 */
export default function Toolbar() {
  const activeTool = useEditorStore((state) => state.activeTool)
  const setTool = useEditorStore((state) => state.setTool)
  const isPlan = useEditorStore((state) => state.project?.kind === 'plan')
  const fileInput = useRef<HTMLInputElement>(null)
  const dxfInput = useRef<HTMLInputElement>(null)
  // Fichier DXF choisi, en attente de confirmation dans la fenêtre d'import.
  const [dxfFile, setDxfFile] = useState<{ name: string; text: string } | null>(null)
  const navRef = useRef<HTMLElement>(null)
  // Dernière entrée choisie dans chaque famille : c'est elle que montre le bouton de la famille.
  const [lastByGroup, setLastByGroup] = useState<Record<string, string>>({})
  const [openGroup, setOpenGroup] = useState<string | null>(null)

  // La liste d'une famille se ferme au clic ailleurs ou avec Échap.
  useEffect(() => {
    if (!openGroup) return
    const onPointerDown = (event: PointerEvent) => {
      if (!navRef.current?.contains(event.target as Node)) setOpenGroup(null)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenGroup(null)
    }
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [openGroup])

  const groups = toolGroups(isPlan)

  const run = (group: ToolGroup, entry: ToolEntry) => {
    setLastByGroup((previous) => ({ ...previous, [group.id]: entry.id }))
    setOpenGroup(null)
    if (entry.kind === 'action') (entry.id === 'dxf' ? dxfInput : fileInput).current?.click()
    else setTool(entry.id)
  }

  /** Entrée montrée par le bouton d'une famille : l'outil actif s'il en fait partie, sinon la dernière choisie. */
  const shownEntry = (group: ToolGroup): ToolEntry =>
    group.entries.find((entry) => entry.kind === 'tool' && entry.id === activeTool) ??
    group.entries.find((entry) => entry.id === lastByGroup[group.id]) ??
    group.entries[0]

  return (
    <nav
      ref={navRef}
      aria-label={fr.tools.label}
      className="absolute left-3 top-3 z-20 flex w-40 flex-col gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow"
    >
      {groups.map((group, index) => {
        const entry = shownEntry(group)
        const Icon = entry.icon
        const active = group.entries.some((e) => e.kind === 'tool' && e.id === activeTool)
        const several = group.entries.length > 1
        const open = openGroup === group.id
        return (
          <div key={group.id} className="relative">
            {/* Séparateur entre la sélection et les familles d'outils. */}
            {index === 1 && <hr className="mb-1 border-slate-200" />}
            <div
              className={clsx(
                'flex items-stretch rounded-md',
                active ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100',
              )}
            >
              <button
                type="button"
                title={[withShortcut(entry), fr.tools.explain[entry.id], several ? fr.tools.moreInGroup(group.label) : null]
                  .filter(Boolean)
                  .join(' · ')}
                aria-label={entry.label}
                aria-pressed={entry.kind === 'tool' ? activeTool === entry.id : undefined}
                onClick={() => {
                  // Un second clic sur l'outil déjà actif ouvre la liste de sa famille.
                  if (several && entry.kind === 'tool' && activeTool === entry.id) setOpenGroup(open ? null : group.id)
                  else run(group, entry)
                }}
                onContextMenu={(event) => {
                  if (!several) return
                  event.preventDefault()
                  setOpenGroup(open ? null : group.id)
                }}
                className="flex min-h-9 pointer-coarse:min-h-12 min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm"
              >
                <Icon size={20} className="shrink-0" aria-hidden="true" />
                <span className="truncate">{entry.short ?? entry.label}</span>
              </button>
              {several && (
                <button
                  type="button"
                  title={fr.tools.moreInGroup(group.label)}
                  aria-label={fr.tools.moreInGroup(group.label)}
                  aria-expanded={open}
                  aria-haspopup="menu"
                  onClick={() => setOpenGroup(open ? null : group.id)}
                  className={clsx(
                    'flex w-7 pointer-coarse:w-11 shrink-0 items-center justify-center rounded-md border-l',
                    active
                      ? 'border-indigo-400 hover:bg-indigo-500'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-200 hover:text-slate-800',
                  )}
                >
                  <ChevronRight size={16} strokeWidth={2.5} aria-hidden="true" />
                </button>
              )}
            </div>
            {open && (
              <div
                role="menu"
                aria-label={group.label}
                className="absolute left-full top-0 ml-2 w-64 rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
              >
                <p className="px-2 pb-1 pt-0.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {group.label}
                </p>
                {group.entries.map((item) => {
                  const ItemIcon = item.icon
                  const selected = item.kind === 'tool' && item.id === activeTool
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="menuitem"
                      onClick={() => run(group, item)}
                      className={clsx(
                        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 pointer-coarse:py-3 text-left text-sm',
                        selected ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-100',
                      )}
                    >
                      <ItemIcon size={16} className="shrink-0" aria-hidden="true" />
                      <span className="flex-1">
                        {item.label}
                        {fr.tools.explain[item.id] && (
                          <span className="block text-xs font-normal text-slate-500">{fr.tools.explain[item.id]}</span>
                        )}
                      </span>
                      {item.shortcut && (
                        <kbd className="rounded border border-slate-200 px-1 text-[11px] text-slate-500">
                          {item.shortcut}
                        </kbd>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
      <input
        ref={fileInput}
        type="file"
        multiple
        hidden
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        onChange={(event) => {
          void importImageFiles(Array.from(event.target.files ?? []))
          event.target.value = '' // permet de choisir deux fois le même fichier
        }}
      />
      <input
        ref={dxfInput}
        type="file"
        hidden
        accept=".dxf"
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (!file) return
          if (file.size > MAX_DXF_BYTES) {
            useEditorStore.getState().setNotice(fr.dxfImport.errors.tooLarge)
            return
          }
          void file.text().then(
            (text) => setDxfFile({ name: file.name, text }),
            () => useEditorStore.getState().setNotice(fr.dxfImport.errors.unreadable),
          )
        }}
      />
      {dxfFile && (
        <Suspense fallback={null}>
          <ImportDxfDialog fileName={dxfFile.name} text={dxfFile.text} onClose={() => setDxfFile(null)} />
        </Suspense>
      )}
    </nav>
  )
}
