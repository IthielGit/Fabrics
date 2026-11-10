import { GizmoHelper, useGizmoContext } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { fr } from '../../i18n/fr'

/** Ordre des faces d'un `BoxGeometry` : +x, −x, +y, −y, +z, −z (dans le repère du cube). */
const FACES = [
  { label: fr.viewer3d.cardinal.east, normal: [1, 0, 0], accent: false },
  { label: fr.viewer3d.cardinal.west, normal: [-1, 0, 0], accent: false },
  { label: fr.viewer3d.top, normal: [0, 1, 0], accent: false },
  { label: fr.viewer3d.bottom, normal: [0, -1, 0], accent: false },
  { label: fr.viewer3d.cardinal.south, normal: [0, 0, 1], accent: false },
  { label: fr.viewer3d.cardinal.north, normal: [0, 0, -1], accent: true },
] as const

function labelMaterial(label: string, accent: boolean): THREE.MeshBasicMaterial {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = accent ? '#4f46e5' : '#f8fafc'
    ctx.fillRect(0, 0, size, size)
    ctx.strokeStyle = '#94a3b8'
    ctx.lineWidth = 6
    ctx.strokeRect(0, 0, size, size)
    ctx.fillStyle = accent ? '#ffffff' : '#1e293b'
    ctx.font = `600 ${label.length > 2 ? 34 : 56}px system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(label, size / 2, size / 2 + 3)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return new THREE.MeshBasicMaterial({ map: texture })
}

/**
 * Le cube lui-même. Il est tourné de −`northAngle` pour que sa face « Nord » pointe vers le nord
 * du plan (le sud du plan est vers +z de la scène quand le nord est en haut).
 */
function Cube({ northAngle }: { northAngle: number }) {
  const { tweenCamera } = useGizmoContext()
  const yaw = (-northAngle * Math.PI) / 180
  const materials = useMemo(() => FACES.map((f) => labelMaterial(f.label, f.accent)), [])
  useEffect(
    () => () => {
      for (const m of materials) {
        m.map?.dispose()
        m.dispose()
      }
    },
    [materials],
  )

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    const index = event.face?.materialIndex
    if (index === undefined) return
    const [x, y, z] = FACES[index].normal
    // Direction réelle de la face dans la scène : la normale du cube, tournée du même angle.
    tweenCamera(new THREE.Vector3(x, y, z).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw))
  }

  return (
    <mesh rotation={[0, yaw, 0]} material={materials} onClick={handleClick}>
      <boxGeometry args={[1.3, 1.3, 1.3]} />
    </mesh>
  )
}

/** Cube d'orientation dans un coin de la vue : montre les points cardinaux, un clic recadre la vue. */
export default function OrientationCube({ northAngle }: { northAngle: number }) {
  return (
    <GizmoHelper alignment="top-right" margin={[56, 56]}>
      <ambientLight intensity={1} />
      <group scale={34}>
        <Cube northAngle={northAngle} />
      </group>
    </GizmoHelper>
  )
}
