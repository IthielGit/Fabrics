import { Editor, type SceneGraph } from '@pascal-app/editor'
import { useEffect } from 'react'
import '../pascal/bootstrap'

const EMPTY: SceneGraph = { nodes: {}, rootNodeIds: [] }

/** ESSAI M19 A2 : monte l'éditeur de Pascal sur une scène vide. À supprimer. */
export default function PascalSpikePage() {
  useEffect(() => {
    document.body.classList.add('dark', 'pascal-tokens')
    return () => document.body.classList.remove('dark', 'pascal-tokens')
  }, [])
  return (
    <div className="dark pascal-tokens relative h-screen w-screen">
      <Editor layoutVersion="v2" projectId="spike" projectName="Essai" onLoad={async () => EMPTY} onSave={async () => {}} />
    </div>
  )
}
