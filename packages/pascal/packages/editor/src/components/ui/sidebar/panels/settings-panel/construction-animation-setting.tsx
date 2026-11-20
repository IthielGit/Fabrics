'use client'

import { type MessageDescriptor, usePascalI18n } from '@pascal-app/core'
import type { ConstructionRevealLevel } from '@pascal-app/viewer'
import {
  chooseConstructionLevel,
  useConstructionRevealLevel,
  useFramingAvailable,
} from '../../../../../store/use-construction-reveal'
import { SegmentedControl } from '../../../controls/segmented-control'
import { Badge } from '../../../primitives/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@pascal-app/viewer/ui'

/** Why Framing is greyed out. */
export const FRAMING_NEEDS_ARCHITECT = 'Framing needs the Architect plugin.'

const OPTIONS: { label: string; value: ConstructionRevealLevel; title: string; badge?: string }[] = [
  { label: 'Off', value: 'off', title: 'What the AI builds appears at once.' },
  {
    label: 'Simple',
    value: 'simple',
    title: 'Walls rise and the rest grows in, piece by piece. No falls, no dust, no sound.',
  },
  {
    label: 'Full',
    value: 'full',
    title: 'Pieces drop into place with dust, the roof assembles, one sound per phase.',
  },
  {
    label: 'Framing',
    value: 'framing',
    title: 'Full, plus the framing members dropping in first, where the framing plugin draws them.',
    // The plugin that draws the framing is a Pro one.
    badge: 'Pro',
  },
]

// Textes affichés (les données ci-dessus restent en anglais : elles servent aux tests).
const LEVEL_TEXT: Record<ConstructionRevealLevel, { label: MessageDescriptor; title: MessageDescriptor }> = {
  off: {
    label: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.constructionAnimationSetting.off', message: 'Off' },
    title: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.constructionAnimationSetting.offTitle', message: 'What the AI builds appears at once.' },
  },
  simple: {
    label: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.constructionAnimationSetting.simple', message: 'Simple' },
    title: /* i18n */ {
      id: 'editor.sidebar.panels.settingsPanel.constructionAnimationSetting.simpleTitle',
      message: 'Walls rise and the rest grows in, piece by piece. No falls, no dust, no sound.',
    },
  },
  full: {
    label: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.constructionAnimationSetting.full', message: 'Full' },
    title: /* i18n */ {
      id: 'editor.sidebar.panels.settingsPanel.constructionAnimationSetting.fullTitle',
      message: 'Pieces drop into place with dust, the roof assembles, one sound per phase.',
    },
  },
  framing: {
    label: /* i18n */ { id: 'editor.sidebar.panels.settingsPanel.constructionAnimationSetting.framing', message: 'Framing' },
    title: /* i18n */ {
      id: 'editor.sidebar.panels.settingsPanel.constructionAnimationSetting.framingTitle',
      message: 'Full, plus the framing members dropping in first, where the framing plugin draws them.',
    },
  },
}

const FRAMING_NEEDS_ARCHITECT_TEXT: MessageDescriptor = /* i18n */ {
  id: 'editor.sidebar.panels.settingsPanel.constructionAnimationSetting.framingNeedsArchitect',
  message: 'Framing needs the Architect plugin.',
}

/**
 * The four levels as the control offers them: Framing is greyed out, with the reason as its tip,
 * where the project has no plugin that draws the framing.
 */
export function constructionLevelOptions(framingAvailable: boolean) {
  return OPTIONS.map((option) =>
    option.value === 'framing' && !framingAvailable
      ? { ...option, title: FRAMING_NEEDS_ARCHITECT, disabled: true }
      : { ...option, disabled: false },
  )
}

/** How much of an AI build plays as a construction. */
export function ConstructionAnimationSetting() {
  const i18n = usePascalI18n()
  // What plays: the person's choice, or Framing where the framing plugin is installed and Full where it is not.
  const level = useConstructionRevealLevel()
  const framingAvailable = useFramingAvailable()
  const current = OPTIONS.find((option) => option.value === level)
  const options = constructionLevelOptions(framingAvailable).map((option) => {
    const label = option.badge ? (
      <span className="inline-flex items-center gap-1.5">
        {i18n._(LEVEL_TEXT[option.value].label)}
        <Badge label={option.badge} />
      </span>
    ) : (
      i18n._(LEVEL_TEXT[option.value].label)
    )
    if (!option.disabled) return { ...option, label, title: i18n._(LEVEL_TEXT[option.value].title) }
    return {
      ...option,
      title: undefined,
      label: (
        <Tooltip>
          <TooltipTrigger asChild>
            <span>{label}</span>
          </TooltipTrigger>
          <TooltipContent>{i18n._(FRAMING_NEEDS_ARCHITECT_TEXT)}</TooltipContent>
        </Tooltip>
      ),
    }
  })
  return (
    <div className="space-y-2 py-1">
      <div className="space-y-0.5">
        <p className="font-medium text-sm">{i18n._({ id: 'editor.sidebar.panels.settingsPanel.constructionAnimationSetting.constructionAnimation', message: 'Construction animation' })}</p>
        <p className="text-muted-foreground text-xs">{current ? i18n._(LEVEL_TEXT[current.value].title) : null}</p>
      </div>
      <SegmentedControl
        aria-label={i18n._({ id: 'editor.sidebar.panels.settingsPanel.constructionAnimationSetting.constructionAnimation', message: 'Construction animation' })}
        onChange={(next) => chooseConstructionLevel(next, framingAvailable)}
        options={options}
        value={level}
      />
    </div>
  )
}
