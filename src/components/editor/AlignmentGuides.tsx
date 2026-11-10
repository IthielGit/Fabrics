import { Line } from 'react-konva'
import { useEditorStore } from '../../stores/editorStore'

interface AlignmentGuidesProps {
  /** Dimensions de la page : les guides la traversent de part en part. */
  pageWidth: number
  pageHeight: number
  /** Pixels écran par unité du document (pour garder un trait fin à tous les zooms). */
  scale: number
}

/** Traits d'alignement affichés pendant le déplacement d'un élément. */
export default function AlignmentGuides({ pageWidth, pageHeight, scale }: AlignmentGuidesProps) {
  const guides = useEditorStore((state) => state.guides)

  return (
    <>
      {guides.map((guide) => (
        <Line
          key={`${guide.orientation}-${guide.position}`}
          points={
            guide.orientation === 'vertical'
              ? [guide.position, 0, guide.position, pageHeight]
              : [0, guide.position, pageWidth, guide.position]
          }
          stroke="#ec4899"
          strokeWidth={1 / scale}
          dash={[4 / scale, 3 / scale]}
          listening={false}
        />
      ))}
    </>
  )
}
