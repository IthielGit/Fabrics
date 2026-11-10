import { useLayoutEffect, useRef } from 'react'
import { fontStack, isBold, isItalic } from '../../features/documents/fonts'
import type { TextElement } from '../../types/document'
import { TEXT_LINE_HEIGHT } from './shapes/TextShape'

interface TextEditorOverlayProps {
  element: TextElement
  /** Pixels écran par unité du document. */
  scale: number
  stagePosition: { x: number; y: number }
  onCommit: (text: string) => void
  onCancel: () => void
}

/** Zone de saisie posée exactement sur le texte du canevas (même position, taille et style). */
export default function TextEditorOverlay({
  element,
  scale,
  stagePosition,
  onCommit,
  onCancel,
}: TextEditorOverlayProps) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const finished = useRef(false) // évite de valider deux fois (Échap puis perte de focus)

  const fitHeight = () => {
    const area = ref.current
    if (!area) return
    area.style.height = '0px'
    area.style.height = `${area.scrollHeight}px`
  }

  useLayoutEffect(() => {
    const area = ref.current
    if (!area) return
    area.focus()
    area.select()
    fitHeight()
  }, [])

  const finish = (commit: boolean) => {
    if (finished.current) return
    finished.current = true
    if (commit) onCommit(ref.current?.value ?? element.text)
    else onCancel()
  }

  const fontSizePx = element.fontSize * scale

  return (
    <textarea
      ref={ref}
      defaultValue={element.text}
      onInput={fitHeight}
      onBlur={() => finish(true)}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          finish(false)
        } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
          event.preventDefault()
          finish(true)
        }
      }}
      spellCheck={false}
      style={{
        position: 'absolute',
        left: stagePosition.x + element.x * scale,
        top: stagePosition.y + element.y * scale,
        width: element.width * scale,
        minHeight: fontSizePx * TEXT_LINE_HEIGHT,
        margin: 0,
        padding: 0,
        border: 'none',
        outline: '1px dashed #4f46e5',
        background: 'transparent',
        resize: 'none',
        overflow: 'hidden',
        whiteSpace: 'pre-wrap',
        fontFamily: fontStack(element.fontFamily),
        fontSize: fontSizePx,
        fontWeight: isBold(element.fontStyle) ? 700 : 400,
        fontStyle: isItalic(element.fontStyle) ? 'italic' : 'normal',
        lineHeight: TEXT_LINE_HEIGHT,
        textAlign: element.align,
        color: element.fill,
        opacity: element.opacity,
        transform: `rotate(${element.rotation}deg)`,
        transformOrigin: 'left top',
      }}
    />
  )
}
