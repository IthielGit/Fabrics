import { type MessageDescriptor, usePascalI18n } from '@pascal-app/core'
import { Keyboard } from 'lucide-react'
import { Button } from '@pascal-app/viewer/ui'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './../../../../../components/ui/primitives/dialog'
import {
  ShortcutToken,
  shortcutDisplayValue,
} from './../../../../../components/ui/primitives/shortcut-token'

// Fabrics (D82): `keys` are the single key or chord; `code` is the Revit code
// typed letter after letter (`WA`). Actions and notes go through Lingui.
type Shortcut = {
  keys: readonly string[]
  code?: string
  action: MessageDescriptor
  note?: MessageDescriptor
}

type ShortcutCategory = {
  title: MessageDescriptor
  shortcuts: Shortcut[]
}

const SHORTCUT_CATEGORIES: ShortcutCategory[] = [
  {
    title: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabricsTools', message: 'Tools: one letter, or the Revit code' },
    shortcuts: [
      {
        keys: ['V'],
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.toolSelect', message: 'Select' },
      },
      {
        keys: ['W'],
        code: 'WA',
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.toolWall', message: 'Wall' },
        note: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.toolWallNote', message: 'Draws with the shape picked last: Rectangle, Polygon or Walls.' },
      },
      {
        keys: ['P'],
        code: 'RM',
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.toolRoom', message: 'Room' },
        note: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.toolRoomNote', message: 'Z also works.' },
      },
      {
        keys: ['B'],
        code: 'DR',
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.toolDoor', message: 'Door' },
        note: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.toolDoorNote', message: 'Shift+D also works. While placing, R flips the door.' },
      },
      {
        keys: ['F'],
        code: 'WN',
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.toolWindow', message: 'Window' },
        note: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.toolWindowNote', message: 'Shift+W also works.' },
      },
      {
        keys: ['D'],
        code: 'DI',
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.toolDimension', message: 'Dimension' },
      },
      {
        keys: ['A'],
        code: 'GR',
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.toolGrid', message: 'Construction grid' },
      },
      {
        keys: ['O'],
        code: 'CM',
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.toolItem', message: 'Objects (catalog)' },
      },
      {
        keys: ['Shift', 'S'],
        code: 'ST',
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.toolStair', message: 'Stairs' },
      },
      {
        keys: ['Shift', 'R'],
        code: 'RF',
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.toolRoof', message: 'Roof' },
        note: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.toolRoofNote', message: 'R alone rotates or flips the selection.' },
      },
      {
        keys: [],
        code: 'SB',
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.toolSlab', message: 'Slab' },
      },
      {
        keys: [],
        code: 'PT',
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.toolPaint', message: 'Paint' },
      },
      {
        keys: ['M'],
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.toolMeasure', message: 'Measure (last measurement tool)' },
      },
      {
        keys: ['G'],
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.toolTerrain', message: 'Sculpt the ground (terrain)' },
      },
      {
        keys: ['X'],
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.toolDeleteMode', message: 'Delete mode' },
      },
      {
        keys: [],
        code: 'CO',
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.toolCopy', message: 'Copy the selection and place the copy' },
      },
      {
        keys: ['R'],
        code: 'RO',
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.toolRotate', message: 'Rotate the selection' },
      },
      {
        keys: ['Delete / Backspace'],
        code: 'DE',
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.toolDelete', message: 'Delete the selection' },
      },
      {
        keys: [],
        code: 'ZF',
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.toolFit', message: 'Fit the view to the drawing' },
      },
    ],
  },
  {
    title: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.editorNavigation', message: 'Editor Navigation' },
    shortcuts: [
      {
        keys: ['1'],
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.navSite', message: 'Switch to Site' },
      },
      {
        keys: ['2'],
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.navBuilding', message: 'Switch to Building' },
      },
      {
        keys: ['\\'],
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.navSplit', message: 'Open or close the split view' },
      },
      {
        keys: ['Cmd/Ctrl', 'Arrow Up'],
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.navLevelUp', message: 'Next level of the building' },
      },
      {
        keys: ['Cmd/Ctrl', 'Arrow Down'],
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.navLevelDown', message: 'Previous level of the building' },
      },
      {
        keys: ['Cmd/Ctrl', 'B'],
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.navSidebar', message: 'Show or hide the sidebar' },
      },
    ],
  },
  {
    title: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.modesHistory', message: 'Modes & History' },
    shortcuts: [
      {
        keys: ['Esc'],
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.histEscape', message: 'Cancel the active tool and return to Select' },
        note: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.histEscapeNote', message: 'Mid-draw it cancels only the drawing in progress; press it again to leave the tool.' },
      },
      {
        keys: ['Cmd/Ctrl', 'Z'],
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.histUndo', message: 'Undo' },
      },
      {
        keys: ['Cmd/Ctrl', 'Shift', 'Z'],
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.histRedo', message: 'Redo' },
      },
      {
        keys: ['Cmd/Ctrl', 'S'],
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.histSave', message: 'Save' },
      },
    ],
  },
  {
    title: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.selection', message: 'Selection' },
    shortcuts: [
      {
        keys: ['Cmd/Ctrl', 'C'],
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.selCopy', message: 'Copy the selected objects' },
        note: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.selCopyNote', message: 'They can be pasted into another level, project or tab.' },
      },
      {
        keys: ['Cmd/Ctrl', 'X'],
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.selCut', message: 'Cut the selected objects' },
      },
      {
        keys: ['Cmd/Ctrl', 'V'],
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.selPaste', message: 'Paste and place the copied objects' },
        note: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.selPasteNote', message: 'Click to place, Esc to cancel.' },
      },
      {
        keys: ['Cmd/Ctrl', 'Left click'],
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.selToggle', message: 'Add or remove an object from the selection' },
      },
      {
        keys: ['Shift', 'Left click'],
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.selShiftToggle', message: 'Add or remove an object (plan and 3D)' },
        note: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.selShiftToggleNote', message: 'In the scene tree, Shift-click selects a range.' },
      },
      {
        keys: ['Left click'],
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.selMoveGroup', message: 'Move a multi-selection' },
        note: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.selMoveGroupNote', message: 'Drag it, or click it to pick it up and click again to place it.' },
      },
      {
        keys: ['R', 'T'],
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.selRotateGroup', message: 'Rotate a multi-selection by ±45°' },
      },
      {
        keys: ['Cmd/Ctrl', 'G'],
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.selGroup', message: 'Group the selection (this session only)' },
      },
      {
        keys: ['Cmd/Ctrl', 'Shift', 'G'],
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.selUngroup', message: 'Ungroup' },
      },
      {
        keys: ['Arrow keys'],
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.selNudge', message: 'Nudge the selected wall by 10 mm' },
        note: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.selNudgeNote', message: 'In the floor plan. Joined walls follow.' },
      },
      {
        keys: ['Tab'],
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.selCycle', message: 'Select the next object under the pointer' },
        note: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.selCycleNote', message: 'Shift+Tab goes back.' },
      },
      {
        keys: ['Esc'],
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.selClear', message: 'Clear the selection' },
      },
    ],
  },
  {
    title: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.directManipulation', message: 'Direct Manipulation' },
    shortcuts: [
      {
        keys: ['Cmd/Ctrl', 'Left click'],
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.dmMove', message: 'Move the selected object (drag)' },
      },
      {
        keys: ['Cmd/Ctrl', 'Right click'],
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.dmRotate', message: 'Rotate the selected object by 15° steps (drag)' },
      },
      {
        keys: ['Cmd/Ctrl', 'Shift', 'Right click'],
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.dmRotateFree', message: 'Rotate freely' },
      },
    ],
  },
  {
    title: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.drawingTools', message: 'Drawing Tools' },
    shortcuts: [
      {
        keys: ['Shift'],
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.drawSnap', message: 'Change the snapping mode (short tap)' },
      },
      {
        keys: ['Cmd/Ctrl'],
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.drawGrid', message: 'Change the grid step: 500 → 250 → 100 → 50 mm (short tap)' },
      },
      {
        keys: ['Alt'],
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.drawFree', message: 'Ignore snapping and constraints (hold)' },
      },
      {
        keys: ['Shift'],
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.drawRotateFree', message: 'Rotate freely while dragging a handle (hold)' },
      },
    ],
  },
  {
    title: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.itemPlacement', message: 'Item Placement' },
    shortcuts: [
      {
        keys: ['R', 'T'],
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.placeRotate', message: 'Rotate the object being placed' },
      },
      {
        keys: ['E'],
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.placeOperate', message: 'Open or close the selected door, window or cabinet' },
      },
      {
        keys: ['Shift'],
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.placeForce', message: 'Place without the placement checks (hold)' },
      },
    ],
  },
  {
    title: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.camera', message: 'Camera' },
    shortcuts: [
      {
        keys: ['Arrow keys'],
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.camArrows', message: 'Move the view' },
        note: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.camArrowsNote', message: 'With nothing selected; with a wall selected, the arrows nudge it.' },
      },
      {
        keys: ['Middle click'],
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.camPan', message: 'Move the view (drag)' },
        note: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.camPanNote', message: 'Or hold Space and drag with the left button.' },
      },
      {
        keys: ['Right click'],
        action: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.fabrics.camOrbit', message: 'Orbit the camera (drag)' },
      },
    ],
  },
]

function ShortcutKeys({ keys }: { keys: readonly string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {keys.map((key, index) => (
        <div className="flex items-center gap-1" key={`${key}-${index}`}>
          {index > 0 ? <span className="text-[10px] text-muted-foreground">+</span> : null}
          <ShortcutToken displayValue={shortcutDisplayValue(key)} value={key} />
        </div>
      ))}
    </div>
  )
}

export function KeyboardShortcutsDialog() {
  const i18n = usePascalI18n()
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full justify-start gap-2" variant="outline">
          <Keyboard className="size-4" />
          {i18n._({
            id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.keyboardShortcuts',
            message: 'Keyboard shortcuts',
          })}
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle>
            {i18n._({
              id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.keyboardShortcuts',
              message: 'Keyboard shortcuts',
            })}
          </DialogTitle>
          <DialogDescription>
            {i18n._({
              id: 'editor.sidebar.panels.settingsPanel.keyboardShortcutsDialog.shortcutsAreContextAwareGuidedConstraints',
              message:
                'Shortcuts are context-aware. Snapping is a visible mode: tap Shift to cycle it, hold Alt during a gesture to place freely.',
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-4">
          {SHORTCUT_CATEGORIES.map((category) => (
            <section className="space-y-2" key={category.title.id}>
              <h3 className="font-medium text-sm">{i18n._(category.title)}</h3>
              <div className="overflow-hidden rounded-md border border-border/80">
                {category.shortcuts.map((shortcut, index) => (
                  <div
                    className="grid grid-cols-[minmax(130px,220px)_1fr] gap-3 px-3 py-2"
                    key={`${category.title.id}-${shortcut.action.id}`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      {shortcut.keys.length > 0 ? <ShortcutKeys keys={shortcut.keys} /> : null}
                      {shortcut.code ? (
                        <ShortcutToken displayValue={shortcut.code} value={shortcut.code} />
                      ) : null}
                    </div>
                    <div>
                      <p className="text-sm">{i18n._(shortcut.action)}</p>
                      {shortcut.note ? (
                        <p className="text-muted-foreground text-xs">{i18n._(shortcut.note)}</p>
                      ) : null}
                    </div>
                    {index < category.shortcuts.length - 1 ? (
                      <div className="col-span-2 border-border/60 border-b" />
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
