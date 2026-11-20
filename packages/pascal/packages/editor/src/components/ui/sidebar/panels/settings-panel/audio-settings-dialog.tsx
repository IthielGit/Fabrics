import { usePascalI18n } from '@pascal-app/core'
import { Volume2, VolumeX } from 'lucide-react'
import { Button } from '@pascal-app/viewer/ui'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../../../../components/ui/primitives/dialog'
import { Slider } from '../../../../../components/ui/slider'
import { useAudioSettings as useAudio } from '@pascal-app/viewer/sfx'

export function AudioSettingsDialog() {
  const i18n = usePascalI18n()
  const {
    masterVolume,
    sfxVolume,
    radioVolume,
    muted,
    setMasterVolume,
    setSfxVolume,
    setRadioVolume,
    toggleMute,
  } = useAudio()

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full justify-start gap-2" variant="outline">
          {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          {i18n._({ id: 'editor.sidebar.panels.settingsPanel.audioSettingsDialog.audioSettings', message: 'Audio settings' })}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{i18n._({ id: 'editor.sidebar.panels.settingsPanel.audioSettingsDialog.audioSettings', message: 'Audio settings' })}</DialogTitle>
          <DialogDescription>
            {i18n._({ id: 'editor.sidebar.panels.settingsPanel.audioSettingsDialog.volumeLevelsApplyToEveryTab', message: 'Volume levels apply to every tab. Muting applies to this tab only.' })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* Master Volume */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-medium text-sm">{i18n._({ id: 'editor.sidebar.panels.settingsPanel.audioSettingsDialog.masterVolume', message: 'Master volume' })}</label>
              <span className="text-muted-foreground text-sm">{masterVolume}%</span>
            </div>
            <Slider
              max={100}
              onValueChange={(value) => value[0] !== undefined && setMasterVolume(value[0])}
              step={1}
              value={[masterVolume]}
            />
          </div>

          {/* Radio Volume */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-medium text-sm">{i18n._({ id: 'editor.sidebar.panels.settingsPanel.audioSettingsDialog.radioVolume', message: 'Radio volume' })}</label>
              <span className="text-muted-foreground text-sm">{radioVolume}%</span>
            </div>
            <Slider
              max={100}
              onValueChange={(value) => value[0] !== undefined && setRadioVolume(value[0])}
              step={1}
              value={[radioVolume]}
            />
          </div>

          {/* SFX Volume */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-medium text-sm">{i18n._({ id: 'editor.sidebar.panels.settingsPanel.audioSettingsDialog.soundEffects', message: 'Sound effects' })}</label>
              <span className="text-muted-foreground text-sm">{sfxVolume}%</span>
            </div>
            <Slider
              max={100}
              onValueChange={(value) => value[0] !== undefined && setSfxVolume(value[0])}
              step={1}
              value={[sfxVolume]}
            />
          </div>

          {/* Mute Toggle */}
          <div className="border-t pt-4">
            <Button
              className="w-full justify-start gap-2"
              onClick={toggleMute}
              variant={muted ? 'default' : 'outline'}
            >
              {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
              {muted ? i18n._({ id: 'editor.sidebar.panels.settingsPanel.audioSettingsDialog.unmuteThisTab', message: 'Unmute this tab' }) : i18n._({ id: 'editor.sidebar.panels.settingsPanel.audioSettingsDialog.muteThisTab', message: 'Mute this tab' })}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
