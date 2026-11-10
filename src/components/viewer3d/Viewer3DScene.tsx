import { Edges, OrbitControls } from '@react-three/drei'
import { Canvas, useThree, type ThreeEvent } from '@react-three/fiber'
import { memo, useEffect, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import type { Bounds3, BuildingModel, SlabShape, WallPiece } from '../../features/building/types'
import OrientationCube from './OrientationCube'

/** Le modèle est en mm ; la scène est en mètres. */
const MM = 0.001

const BOX = new THREE.BoxGeometry(1, 1, 1)
const WALL_MATERIAL = new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.9 })
const SLAB_MATERIAL = new THREE.MeshStandardMaterial({
  color: '#cbd5e1',
  roughness: 1,
  side: THREE.DoubleSide,
})
const ROOF_MATERIAL = new THREE.MeshStandardMaterial({
  color: '#94a3b8',
  roughness: 1,
  side: THREE.DoubleSide,
})

const SELECTED_WALL_MATERIAL = new THREE.MeshStandardMaterial({ color: '#a5b4fc', roughness: 0.9 })

/** Un déplacement de plus de ce nombre de pixels entre appui et relâchement est un geste de caméra, pas un clic. */
const CLICK_MAX_DRAG = 4

interface WallMeshProps {
  piece: WallPiece
  selected: boolean
  onSelectWall: (wallId: string, levelId: string) => void
}

const WallMesh = memo(function WallMesh({ piece, selected, onSelectWall }: WallMeshProps) {
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    if (event.delta > CLICK_MAX_DRAG) return
    event.stopPropagation() // le morceau le plus proche de la caméra gagne
    onSelectWall(piece.sourceId, piece.levelId)
  }
  return (
    <mesh
      geometry={BOX}
      material={selected ? SELECTED_WALL_MATERIAL : WALL_MATERIAL}
      position={[piece.center.x, piece.center.y, piece.center.z]}
      scale={[piece.size.x, piece.size.y, piece.size.z]}
      rotation={[0, piece.rotationY, 0]}
      onClick={handleClick}
    >
      <Edges threshold={15} color={selected ? '#4338ca' : '#475569'} />
    </mesh>
  )
})

function slabGeometry(slab: SlabShape): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape(slab.outline.map((p) => new THREE.Vector2(p.x, p.y)))
  const extruded = new THREE.ExtrudeGeometry(shape, { depth: slab.thickness, bevelEnabled: false })
  // Plan (x, y) → 3D (x, z) ; l'extrusion part vers le bas depuis le dessus de la dalle.
  extruded.rotateX(Math.PI / 2)
  return extruded
}

/**
 * Géométries de dalles déjà construites, par contour et épaisseur : le modèle est reconstruit à
 * chaque modification (ses objets sont neufs), mais une dalle inchangée garde sa géométrie.
 * Les plus anciennes sont libérées au-delà de `SLAB_CACHE_SIZE`.
 */
const SLAB_CACHE_SIZE = 200
const slabCache = new Map<string, THREE.ExtrudeGeometry>()

function cachedSlabGeometry(slab: SlabShape): THREE.ExtrudeGeometry {
  const key = `${slab.thickness}|${slab.outline.map((p) => `${p.x},${p.y}`).join(';')}`
  const hit = slabCache.get(key)
  if (hit) return hit
  const geometry = slabGeometry(slab)
  slabCache.set(key, geometry)
  if (slabCache.size > SLAB_CACHE_SIZE) {
    const oldest = slabCache.keys().next().value
    if (oldest !== undefined) {
      slabCache.get(oldest)?.dispose()
      slabCache.delete(oldest)
    }
  }
  return geometry
}

const SlabMesh = memo(function SlabMesh({ slab }: { slab: SlabShape }) {
  return (
    <mesh
      geometry={cachedSlabGeometry(slab)}
      material={slab.kind === 'roof' ? ROOF_MATERIAL : SLAB_MATERIAL}
      position={[0, slab.baseY + slab.thickness, 0]}
    />
  )
})

interface OrbitLike {
  target: THREE.Vector3
  update: () => void
}

/** Place la caméra pour voir tout le bâtiment, à l'ouverture et à chaque demande de recentrage. */
function CameraRig({ bounds, fitToken }: { bounds: Bounds3 | null; fitToken: number }) {
  const camera = useThree((state) => state.camera)
  const controls = useThree((state) => state.controls) as unknown as OrbitLike | null
  const invalidate = useThree((state) => state.invalidate)
  const boundsRef = useRef(bounds)
  useEffect(() => {
    boundsRef.current = bounds
  })
  const hasBounds = bounds !== null

  useEffect(() => {
    const b = boundsRef.current
    if (!b || !controls) return
    const min = new THREE.Vector3(b.min.x, b.min.y, b.min.z).multiplyScalar(MM)
    const max = new THREE.Vector3(b.max.x, b.max.y, b.max.z).multiplyScalar(MM)
    const center = min.clone().add(max).multiplyScalar(0.5)
    const radius = Math.max(max.clone().sub(min).length() / 2, 1)
    const fov = THREE.MathUtils.degToRad((camera as THREE.PerspectiveCamera).fov ?? 40)
    const distance = (radius / Math.sin(fov / 2)) * 1.05
    const direction = new THREE.Vector3(0.7, 0.6, 1).normalize()
    camera.position.copy(center).addScaledVector(direction, distance)
    controls.target.copy(center)
    controls.update()
    invalidate()
  }, [fitToken, hasBounds, camera, controls, invalidate])

  return null
}

/** Prend l'image de la vue : la scène est redessinée juste avant la lecture (le tampon n'est pas conservé). */
function CaptureBridge({ captureRef }: { captureRef: RefObject<(() => string | null) | null> }) {
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)
  const camera = useThree((state) => state.camera)
  useEffect(() => {
    captureRef.current = () => {
      gl.render(scene, camera)
      return gl.domElement.toDataURL('image/png')
    }
    return () => {
      captureRef.current = null
    }
  }, [captureRef, gl, scene, camera])
  return null
}

interface SceneProps {
  model: BuildingModel
  fitToken: number
  /** Degrés, sens horaire depuis le haut du plan (voir `PlanSettings.northAngle`). */
  northAngle: number
  /** Éléments sélectionnés sur le plan (les murs sont surlignés). */
  selectedIds: ReadonlySet<string>
  onSelectWall: (wallId: string, levelId: string) => void
  captureRef: RefObject<(() => string | null) | null>
}

/** Dessine le modèle 3D ; ne fait aucun calcul de bâtiment (voir `features/building`). */
export default function Viewer3DScene({
  model,
  fitToken,
  northAngle,
  selectedIds,
  onSelectWall,
  captureRef,
}: SceneProps) {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 2]}
      camera={{ fov: 40, near: 0.1, far: 2000, position: [12, 10, 14] }}
      gl={{ antialias: true }}
      className="h-full w-full"
    >
      <color attach="background" args={['#f1f5f9']} />
      <hemisphereLight args={['#ffffff', '#94a3b8', 1.1]} />
      <directionalLight position={[10, 20, 8]} intensity={1.6} />
      <gridHelper args={[100, 100, '#cbd5e1', '#e2e8f0']} position={[0, -0.25, 0]} />
      <group scale={MM}>
        {model.walls.map((piece, i) => (
          <WallMesh
            key={`${piece.sourceId}-${i}`}
            piece={piece}
            selected={selectedIds.has(piece.sourceId)}
            onSelectWall={onSelectWall}
          />
        ))}
        {model.slabs.map((slab) => (
          <SlabMesh key={`${slab.kind}-${slab.sourceId}`} slab={slab} />
        ))}
      </group>
      <OrbitControls makeDefault enableDamping={false} maxPolarAngle={Math.PI * 0.495} />
      <CameraRig bounds={model.bounds} fitToken={fitToken} />
      <OrientationCube northAngle={northAngle} />
      <CaptureBridge captureRef={captureRef} />
    </Canvas>
  )
}
