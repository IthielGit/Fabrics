'use client'

import {
  type AnyNode,
  type AnyNodeId,
  type ConstructionDimensionDatumPolicy,
  type ConstructionDimensionDrawingPresentation,
  type ConstructionDimensionImperialPrecision,
  type ConstructionDimensionMetricNotation,
  type ConstructionDimensionNode,
  type ConstructionDimensionTerminator,
  type ConstructionDimensionTextPosition,
  type ConstructionDrawingType,
  type MessageDescriptor,
  resolveConstructionDimensionDrawingOverride,
  resolveConstructionDimensionDrawingPresentation,
  setConstructionDimensionDrawingPresentation,
  setConstructionDimensionDrawingSuppressedSegments,
  usePascalI18n,
  useScene,
} from '@pascal-app/core'
import {
  ActionButton,
  ActionGroup,
  DRAWING_TYPE_OPTIONS,
  PanelSection,
  PanelWrapper,
  SliderControl,
  triggerSFX,
  useDrawingView,
} from '@pascal-app/editor'
import { useViewer } from '@pascal-app/viewer'
import { Trash2 } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'

const MODE_LABELS: Record<ConstructionDimensionNode['mode'], string> = {
  linear: 'Linear',
  radius: 'Radius',
  diameter: 'Diameter',
  'center-mark': 'Center mark',
  chord: 'Chord',
  'arc-length': 'Arc length',
  angular: 'Angular',
  coordinate: 'Coordinate',
}

const DATUM_POLICY_OPTIONS: Array<{
  label: MessageDescriptor
  value: ConstructionDimensionDatumPolicy
}> = [
  {
    label: /* i18n */ {
      id: 'node.constructionDimension.panel.option.centerline',
      message: 'Centerline',
    },
    value: 'centerline',
  },
  {
    label: /* i18n */ {
      id: 'node.constructionDimension.panel.option.wallFace',
      message: 'Wall face',
    },
    value: 'wall-face',
  },
  {
    label: {
      id: 'node.constructionDimension.panel.option.structuralFace',
      message: 'Structural face',
    },
    value: 'structural-face',
  },
  {
    label: /* i18n */ {
      id: 'node.constructionDimension.panel.option.finishFace',
      message: 'Finish face',
    },
    value: 'finish-face',
  },
]

const TERMINATOR_OPTIONS: Array<{
  label: MessageDescriptor
  value: ConstructionDimensionTerminator
}> = [
  {
    label: {
      id: 'node.constructionDimension.panel.option.architecturalTick',
      message: 'Architectural tick',
    },
    value: 'architectural-tick',
  },
  {
    label: /* i18n */ {
      id: 'node.constructionDimension.panel.option.filledArrow',
      message: 'Filled arrow',
    },
    value: 'filled-arrow',
  },
  {
    label: /* i18n */ {
      id: 'node.constructionDimension.panel.option.openArrow',
      message: 'Open arrow',
    },
    value: 'open-arrow',
  },
  {
    label: /* i18n */ { id: 'node.constructionDimension.panel.option.dot', message: 'Dot' },
    value: 'dot',
  },
]

const TEXT_POSITION_OPTIONS: Array<{
  label: MessageDescriptor
  value: ConstructionDimensionTextPosition
}> = [
  {
    label: /* i18n */ {
      id: 'node.constructionDimension.panel.option.aboveLine',
      message: 'Above line',
    },
    value: 'above',
  },
  {
    label: {
      id: 'node.constructionDimension.panel.option.centeredOnLine',
      message: 'Centered on line',
    },
    value: 'centered',
  },
]

const IMPERIAL_PRECISION_OPTIONS: Array<{
  label: MessageDescriptor
  value: ConstructionDimensionImperialPrecision
}> = [
  {
    label: /* i18n */ {
      id: 'node.constructionDimension.panel.option.nearestInch',
      message: 'Nearest inch',
    },
    value: '1',
  },
  {
    label: {
      id: 'node.constructionDimension.panel.option.nearest12Inch',
      message: 'Nearest 1/2 inch',
    },
    value: '1/2',
  },
  {
    label: {
      id: 'node.constructionDimension.panel.option.nearest14Inch',
      message: 'Nearest 1/4 inch',
    },
    value: '1/4',
  },
  {
    label: {
      id: 'node.constructionDimension.panel.option.nearest18Inch',
      message: 'Nearest 1/8 inch',
    },
    value: '1/8',
  },
  {
    label: {
      id: 'node.constructionDimension.panel.option.nearest116Inch',
      message: 'Nearest 1/16 inch',
    },
    value: '1/16',
  },
]

const METRIC_NOTATION_OPTIONS: Array<{
  label: MessageDescriptor
  value: ConstructionDimensionMetricNotation
}> = [
  {
    label: /* i18n */ { id: 'node.constructionDimension.panel.option.meters', message: 'Meters' },
    value: 'meters',
  },
  {
    label: /* i18n */ {
      id: 'node.constructionDimension.panel.option.millimeters',
      message: 'Millimeters',
    },
    value: 'millimeters',
  },
]

export default function ConstructionDimensionPanel() {
  const i18n = usePascalI18n()
  const selectedId = useViewer((state) => state.selection.selectedIds[0])
  const setSelection = useViewer((state) => state.setSelection)
  const dimension = useScene((state) => {
    const node = selectedId ? state.nodes[selectedId as AnyNodeId] : undefined
    return node?.type === 'construction-dimension' ? node : null
  })
  const updateNode = useScene((state) => state.updateNode)
  const deleteNode = useScene((state) => state.deleteNode)
  const activeDrawingType = useDrawingView((state) => state.drawingType)

  if (!(dimension && selectedId)) return null
  const update = (patch: Partial<ConstructionDimensionNode>) => updateNode(dimension.id, patch)
  const supportsCenterMark = ['radius', 'diameter', 'arc-length', 'angular'].includes(
    dimension.mode,
  )
  const activeDrawingLabel =
    DRAWING_TYPE_OPTIONS.find((option) => option.id === activeDrawingType)?.label ?? 'Floor plan'
  const activePresentation = resolveConstructionDimensionDrawingPresentation(
    dimension,
    activeDrawingType,
  )
  const activeDrawingOverride = resolveConstructionDimensionDrawingOverride(
    dimension,
    activeDrawingType,
  )
  const suppressedSegmentsText = formatSuppressedSegments(
    activeDrawingOverride?.suppressedSegmentIndexes ?? [],
  )
  const updateDrawingPresentation = (
    drawingType: ConstructionDrawingType,
    presentation: ConstructionDimensionDrawingPresentation,
  ) => {
    const drawingOverrides = setConstructionDimensionDrawingPresentation(
      dimension,
      drawingType,
      presentation,
    )
    const firstFoundationController =
      presentation === 'controlled' && !dimension.controllingDimensionId
        ? selectFoundationControllers(useScene.getState().nodes, dimension.id)[0]
        : undefined
    update({
      drawingOverrides,
      ...(presentation === 'controlled' && !dimension.controllingDimensionId
        ? { controllingDimensionId: firstFoundationController?.id ?? null }
        : {}),
    })
  }
  const updateSuppressedSegments = (value: string) => {
    update({
      drawingOverrides: setConstructionDimensionDrawingSuppressedSegments(
        dimension,
        activeDrawingType,
        parseSuppressedSegments(value),
      ),
    })
  }

  return (
    <PanelWrapper
      icon="/icons/blueprint.webp"
      onClose={() => setSelection({ selectedIds: [] })}
      title={i18n._({
        id: 'node.constructionDimension.panel.constructionDimension',
        message: 'Construction Dimension',
      })}
      width={320}
    >
      <PanelSection
        title={i18n._({ id: 'node.constructionDimension.panel.dimension', message: 'Dimension' })}
      >
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">
            {i18n._({ id: 'node.constructionDimension.panel.mode', message: 'Mode' })}
          </span>
          <span className="font-medium text-foreground">{MODE_LABELS[dimension.mode]}</span>
        </div>
        <SliderControl
          label={i18n._({
            id: 'node.constructionDimension.panel.featureCount',
            message: 'Feature count',
          })}
          max={999}
          min={1}
          onChange={(featureCount) => update({ featureCount })}
          precision={0}
          step={1}
          value={dimension.featureCount}
        />
        {supportsCenterMark ? (
          <label className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">
              {i18n._({
                id: 'node.constructionDimension.panel.centerMark',
                message: 'Center mark',
              })}
            </span>
            <input
              checked={dimension.showCenterMark}
              onChange={(event) => update({ showCenterMark: event.target.checked })}
              type="checkbox"
            />
          </label>
        ) : null}
      </PanelSection>

      <PanelSection
        title={i18n._({
          id: 'node.constructionDimension.panel.drawingCoordination',
          message: 'Drawing coordination',
        })}
      >
        <SelectField
          label={i18n._({
            id: 'node.constructionDimension.panel.primaryDrawing',
            message: 'Primary drawing',
          })}
          onChange={(drawingType) =>
            update({ drawingType: drawingType as ConstructionDrawingType })
          }
          options={DRAWING_TYPE_OPTIONS.map((option) => ({
            label: option.label,
            value: option.id,
          }))}
          value={dimension.drawingType}
        />
        <SelectField
          label={i18n._({
            id: 'node.constructionDimension.panel.activedrawinglabelPresentation',
            message: '{activeDrawingLabel} presentation',
            values: { activeDrawingLabel },
          })}
          onChange={(presentation) =>
            updateDrawingPresentation(
              activeDrawingType,
              presentation as ConstructionDimensionDrawingPresentation,
            )
          }
          options={[
            {
              label: i18n._({ id: 'node.constructionDimension.panel.shown', message: 'Shown' }),
              value: 'shown',
            },
            {
              label: i18n._({ id: 'node.constructionDimension.panel.omitted', message: 'Omitted' }),
              value: 'omit',
            },
            ...(activeDrawingType === 'floor-plan'
              ? [
                  {
                    label: i18n._({
                      id: 'node.constructionDimension.panel.controlledByFoundation',
                      message: 'Controlled by foundation',
                    }),
                    value: 'controlled',
                  },
                ]
              : []),
          ]}
          value={activePresentation}
        />
        {activeDrawingType === 'floor-plan' && activePresentation === 'controlled' ? (
          <FoundationControllerField
            dimensionId={dimension.id}
            onChange={(controllingDimensionId) =>
              update({
                controllingDimensionId,
              })
            }
            value={dimension.controllingDimensionId ?? ''}
          />
        ) : null}
        <p className="text-muted-foreground text-xs">
          {i18n._({
            id: 'node.constructionDimension.panel.linkedDimensionsReuseTheControllerS',
            message:
              "Linked dimensions reuse the controller's associative anchors and update with it.",
          })}
        </p>
        <TextField
          label={i18n._({
            id: 'node.constructionDimension.panel.activedrawinglabelSuppressedSegments',
            message: '{activeDrawingLabel} suppressed segments',
            values: { activeDrawingLabel },
          })}
          onCommit={updateSuppressedSegments}
          placeholder="e.g. 2, 4"
          value={suppressedSegmentsText}
        />
        <p className="text-muted-foreground text-xs">
          {i18n._({
            id: 'node.constructionDimension.panel.segmentNumbersAreOneBasedAnd',
            message: 'Segment numbers are one-based and apply only in this drawing view.',
          })}
        </p>
      </PanelSection>

      <PanelSection
        title={i18n._({ id: 'node.constructionDimension.panel.notation', message: 'Notation' })}
      >
        <TextField
          label={i18n._({ id: 'node.constructionDimension.panel.prefix', message: 'Prefix' })}
          onCommit={(prefix) => update({ prefix })}
          value={dimension.prefix}
        />
        <TextField
          label={i18n._({ id: 'node.constructionDimension.panel.suffix', message: 'Suffix' })}
          onCommit={(suffix) => update({ suffix })}
          value={dimension.suffix}
        />
        <TextField
          label={i18n._({
            id: 'node.constructionDimension.panel.textOverride',
            message: 'Text override',
          })}
          onCommit={(textOverride) => update({ textOverride: textOverride || null })}
          placeholder={i18n._({
            id: 'node.constructionDimension.panel.useMeasuredValue',
            message: 'Use measured value',
          })}
          value={dimension.textOverride ?? ''}
        />
      </PanelSection>

      <PanelSection
        title={i18n._({ id: 'node.constructionDimension.panel.standards', message: 'Standards' })}
      >
        <SelectField
          label={i18n._({
            id: 'node.constructionDimension.panel.datumPolicy',
            message: 'Datum policy',
          })}
          onChange={(datumPolicy) =>
            update({ datumPolicy: datumPolicy as ConstructionDimensionDatumPolicy })
          }
          options={DATUM_POLICY_OPTIONS.map((option) => ({
            ...option,
            label: i18n._(option.label),
          }))}
          value={dimension.datumPolicy}
        />
        <SelectField
          label={i18n._({
            id: 'node.constructionDimension.panel.terminator',
            message: 'Terminator',
          })}
          onChange={(terminator) =>
            update({ terminator: terminator as ConstructionDimensionTerminator })
          }
          options={TERMINATOR_OPTIONS.map((option) => ({ ...option, label: i18n._(option.label) }))}
          value={dimension.terminator}
        />
        <SelectField
          label={i18n._({
            id: 'node.constructionDimension.panel.textPosition',
            message: 'Text position',
          })}
          onChange={(textPosition) =>
            update({ textPosition: textPosition as ConstructionDimensionTextPosition })
          }
          options={TEXT_POSITION_OPTIONS.map((option) => ({
            ...option,
            label: i18n._(option.label),
          }))}
          value={dimension.textPosition}
        />
        <SelectField
          label={i18n._({
            id: 'node.constructionDimension.panel.imperialPrecision',
            message: 'Imperial precision',
          })}
          onChange={(imperialPrecision) =>
            update({
              imperialPrecision: imperialPrecision as ConstructionDimensionImperialPrecision,
            })
          }
          options={IMPERIAL_PRECISION_OPTIONS.map((option) => ({
            ...option,
            label: i18n._(option.label),
          }))}
          value={dimension.imperialPrecision}
        />
        <SelectField
          label={i18n._({
            id: 'node.constructionDimension.panel.metricNotation',
            message: 'Metric notation',
          })}
          onChange={(metricNotation) =>
            update({ metricNotation: metricNotation as ConstructionDimensionMetricNotation })
          }
          options={METRIC_NOTATION_OPTIONS.map((option) => ({
            ...option,
            label: i18n._(option.label),
          }))}
          value={dimension.metricNotation}
        />
        <SliderControl
          label={i18n._({
            id: 'node.constructionDimension.panel.extensionGap',
            message: 'Extension gap',
          })}
          max={0.5}
          min={0}
          onChange={(extensionStartGap) => update({ extensionStartGap })}
          precision={3}
          step={0.005}
          value={dimension.extensionStartGap}
        />
        <SliderControl
          label={i18n._({
            id: 'node.constructionDimension.panel.extensionOvershoot',
            message: 'Extension overshoot',
          })}
          max={0.5}
          min={0}
          onChange={(extensionOvershoot) => update({ extensionOvershoot })}
          precision={3}
          step={0.005}
          value={dimension.extensionOvershoot}
        />
      </PanelSection>

      <PanelSection
        title={i18n._({ id: 'node.constructionDimension.panel.actions', message: 'Actions' })}
      >
        <ActionGroup>
          <ActionButton
            className="border-red-500/40 text-red-700 dark:text-red-200 hover:bg-red-500/15"
            icon={<Trash2 className="h-4 w-4" />}
            label={i18n._({ id: 'node.constructionDimension.panel.delete', message: 'Delete' })}
            onClick={() => {
              triggerSFX('sfx:structure-delete')
              deleteNode(dimension.id)
              setSelection({ selectedIds: [] })
            }}
          />
        </ActionGroup>
      </PanelSection>
    </PanelWrapper>
  )
}

function selectFoundationControllers(
  nodes: Record<string, AnyNode>,
  excludedId: AnyNodeId,
): ConstructionDimensionNode[] {
  return Object.values(nodes).filter(
    (candidate): candidate is ConstructionDimensionNode =>
      candidate.type === 'construction-dimension' &&
      candidate.id !== excludedId &&
      candidate.drawingType === 'foundation-plan',
  )
}

function FoundationControllerField({
  dimensionId,
  value,
  onChange,
}: {
  dimensionId: AnyNodeId
  value: string
  onChange: (value: NonNullable<ConstructionDimensionNode['controllingDimensionId']>) => void
}) {
  const i18n = usePascalI18n()
  const foundationControllers = useScene(
    useShallow((state) => selectFoundationControllers(state.nodes, dimensionId)),
  )
  return (
    <SelectField
      disabled={foundationControllers.length === 0}
      label={i18n._({
        id: 'node.constructionDimension.panel.foundationController',
        message: 'Foundation controller',
      })}
      onChange={(controllingDimensionId) =>
        onChange(
          controllingDimensionId as NonNullable<
            ConstructionDimensionNode['controllingDimensionId']
          >,
        )
      }
      options={foundationControllers.map((controller) => ({
        label:
          controller.name ||
          i18n._({
            id: 'node.constructionDimension.panel.foundationDimension',
            message: 'Foundation dimension',
          }),
        value: controller.id,
      }))}
      placeholder={i18n._({
        id: 'node.constructionDimension.panel.noFoundationDimensions',
        message: 'No foundation dimensions',
      })}
      value={value}
    />
  )
}

function parseSuppressedSegments(value: string): number[] {
  return [
    ...new Set(
      value
        .split(/[,\s]+/)
        .map((part) => Number.parseInt(part, 10))
        .filter((index) => Number.isInteger(index) && index > 0)
        .map((index) => index - 1),
    ),
  ].sort((left, right) => left - right)
}

function formatSuppressedSegments(indexes: readonly number[]): string {
  return indexes.map((index) => index + 1).join(', ')
}

function SelectField({
  label,
  value,
  options,
  placeholder,
  disabled,
  onChange,
}: {
  label: string
  value: string
  options: Array<{ label: string; value: string }>
  placeholder?: string
  disabled?: boolean
  onChange: (value: string) => void
}) {
  return (
    <label className="space-y-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <select
        className="w-full rounded-md border border-border/70 bg-background px-2 py-1.5 text-foreground disabled:opacity-50"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {placeholder && options.length === 0 ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function TextField({
  label,
  value,
  placeholder,
  onCommit,
}: {
  label: string
  value: string
  placeholder?: string
  onCommit: (value: string) => void
}) {
  return (
    <label className="space-y-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <input
        className="w-full rounded-md border border-border/70 bg-background px-2 py-1.5 text-foreground"
        defaultValue={value}
        key={value}
        onBlur={(event) => onCommit(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  )
}
