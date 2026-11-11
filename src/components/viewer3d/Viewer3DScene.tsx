import { OrbitControls } from '@react-three/drei'
import { Canvas, useStore, useThree, type ThreeEvent } from '@react-three/fiber'
import { memo, useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import type { Bounds3, BuildingModel, OpeningFill, SlabShape, WallMesh, WallPiece } from '../../features/building/types'
import OrientationCube from './OrientationCube'

/** Le modèle est en mm ; la scène est en mètres. */
const MM = 0.001

const BOX = new THREE.BoxGeometry(1, 1, 1)
// Palette neutre et chaude : enduit blanc cassé, toit gris gravier, menuiseries anthracite.
const WALL_MATERIAL = new THREE.MeshStandardMaterial({ color: '#f3f1ec', roughness: 0.95 })
const SLAB_MATERIAL = new THREE.MeshStandardMaterial({
  color: '#d9d5cd',
  roughness: 1,
  side: THREE.DoubleSide,
})
const ROOF_MATERIAL = new THREE.MeshStandardMaterial({
  color: '#8d9198',
  roughness: 1,
  side: THREE.DoubleSide,
})

const PLATFORM_MATERIAL = new THREE.MeshStandardMaterial({ color: '#cdb594', roughness: 0.85 })
const STAIR_MATERIAL = new THREE.MeshStandardMaterial({ color: '#c9b393', roughness: 0.85 })
const CHIMNEY_MATERIAL = new THREE.MeshStandardMaterial({ color: '#a39d97', roughness: 0.95 })
const FRAME_MATERIAL = new THREE.MeshStandardMaterial({ color: '#3b4048', roughness: 0.6 })
const DOOR_MATERIAL = new THREE.MeshStandardMaterial({ color: '#8f6d4c', roughness: 0.7 })
const GLASS_MATERIAL = new THREE.MeshStandardMaterial({
  color: '#9db7c7',
  roughness: 0.05,
  metalness: 0.2,
  transparent: true,
  opacity: 0.45,
  depthWrite: false,
})
const FILL_MATERIALS: Record<OpeningFill['kind'], THREE.Material> = {
  frame: FRAME_MATERIAL,
  door: DOOR_MATERIAL,
  glass: GLASS_MATERIAL,
}
const SELECTED_WALL_MATERIAL = new THREE.MeshStandardMaterial({ color: '#a5b4fc', roughness: 0.9 })
const GROUND_MATERIAL = new THREE.MeshStandardMaterial({ color: '#e7e5df', roughness: 1 })

/** Couleur du ciel, reprise par le brouillard pour fondre l'horizon. */
const SKY = '#eef1f4'

/** Un déplacement de plus de ce nombre de pixels entre appui et relâchement est un geste de caméra, pas un clic. */
const CLICK_MAX_DRAG = 4

interface PieceMeshProps {
  piece: WallPiece
  /** Matière hors sélection (murs par défaut). */
  material?: THREE.Material
  selected: boolean
  /** Faux pour le verre : il ne porte pas d'ombre. */
  castShadow?: boolean
  onSelectWall: (wallId: string, levelId: string) => void
}

const PieceMesh = memo(function PieceMesh({
  piece,
  material = WALL_MATERIAL,
  selected,
  castShadow = true,
  onSelectWall,
}: PieceMeshProps) {
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    if (event.delta > CLICK_MAX_DRAG) return
    event.stopPropagation() // le morceau le plus proche de la caméra gagne
    onSelectWall(piece.sourceId, piece.levelId)
  }
  return (
    <mesh
      geometry={BOX}
      material={selected ? SELECTED_WALL_MATERIAL : material}
      position={[piece.center.x, piece.center.y, piece.center.z]}
      scale={[piece.size.x, piece.size.y, piece.size.z]}
      rotation={[0, piece.rotationY, 0]}
      castShadow={castShadow}
      receiveShadow
      onClick={handleClick}
    />
  )
})

interface WallBodyProps {
  mesh: WallMesh
  selected: boolean
  onSelectWall: (wallId: string, levelId: string) => void
}

/** Un mur entier, d'un seul maillage (voir `buildWallMesh`) : pas de couture entre ses morceaux. */
const WallBody = memo(function WallBody({ mesh, selected, onSelectWall }: WallBodyProps) {
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(mesh.positions, 3))
    g.setAttribute('normal', new THREE.Float32BufferAttribute(mesh.normals, 3))
    g.computeBoundingSphere()
    return g
  }, [mesh.positions, mesh.normals])
  useEffect(() => () => geometry.dispose(), [geometry])
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    if (event.delta > CLICK_MAX_DRAG) return
    event.stopPropagation()
    onSelectWall(mesh.sourceId, mesh.levelId)
  }
  return (
    <mesh
      geometry={geometry}
      material={selected ? SELECTED_WALL_MATERIAL : WALL_MATERIAL}
      castShadow
      receiveShadow
      onClick={handleClick}
    />
  )
})

function slabGeometry(slab: SlabShape): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape(slab.outline.map((p) => new THREE.Vector2(p.x, p.y)))
  for (const hole of slab.holes ?? []) {
    shape.holes.push(new THREE.Path(hole.map((p) => new THREE.Vector2(p.x, p.y))))
  }
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
  const holes = (slab.holes ?? []).map((hole) => hole.map((p) => `${p.x},${p.y}`).join(';')).join('/')
  const key = `${slab.thickness}|${slab.outline.map((p) => `${p.x},${p.y}`).join(';')}|${holes}`
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
      material={
        slab.kind === 'roof'
          ? ROOF_MATERIAL
          : slab.kind === 'platform'
            ? PLATFORM_MATERIAL
            : SLAB_MATERIAL
      }
      position={[0, slab.baseY + slab.thickness, 0]}
      castShadow
      receiveShadow
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
  const store = useStore()
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
    // Le panneau est souvent plus haut que large : on cadre selon le plus petit des deux angles de vue.
    const { width, height } = store.getState().size
    const aspect = width > 0 && height > 0 ? width / height : 1
    const verticalFov = THREE.MathUtils.degToRad((camera as THREE.PerspectiveCamera).fov ?? 40)
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * aspect)
    const distance = (radius / Math.sin(Math.min(verticalFov, horizontalFov) / 2)) * 1.1
    const direction = new THREE.Vector3(0.7, 0.6, 1).normalize()
    camera.position.copy(center).addScaledVector(direction, distance)
    controls.target.copy(center)
    controls.update()
    invalidate()
  }, [fitToken, hasBounds, camera, controls, invalidate, store])

  return null
}

/** Centre et rayon (m) de l'emprise ; une petite scène par défaut si le modèle est vide. */
function sceneSphere(bounds: Bounds3 | null): { center: THREE.Vector3; radius: number } {
  if (!bounds) return { center: new THREE.Vector3(0, 0, 0), radius: 10 }
  const min = new THREE.Vector3(bounds.min.x, bounds.min.y, bounds.min.z).multiplyScalar(MM)
  const max = new THREE.Vector3(bounds.max.x, bounds.max.y, bounds.max.z).multiplyScalar(MM)
  return {
    center: min.clone().add(max).multiplyScalar(0.5),
    radius: Math.max(max.clone().sub(min).length() / 2, 2),
  }
}

/** Soleil : lumière directionnelle chaude, ombres cadrées sur le bâtiment. */
function Sun({ bounds }: { bounds: Bounds3 | null }) {
  const light = useRef<THREE.DirectionalLight>(null)
  const target = useMemo(() => new THREE.Object3D(), [])
  const invalidate = useThree((state) => state.invalidate)
  const { center, radius } = sceneSphere(bounds)
  const cx = center.x
  const cy = center.y
  const cz = center.z

  useLayoutEffect(() => {
    const sun = light.current
    if (!sun) return
    const direction = new THREE.Vector3(-0.55, 1, 0.75).normalize()
    target.position.set(cx, cy, cz)
    target.updateMatrixWorld()
    sun.position.set(cx, cy, cz).addScaledVector(direction, radius * 3)
    const camera = sun.shadow.camera
    const extent = radius * 1.3
    camera.left = -extent
    camera.right = extent
    camera.top = extent
    camera.bottom = -extent
    camera.near = 0.1
    camera.far = radius * 6
    camera.updateProjectionMatrix()
    sun.shadow.needsUpdate = true
    invalidate()
  }, [cx, cy, cz, radius, target, invalidate])

  return (
    <>
      <primitive object={target} />
      <directionalLight
        ref={light}
        target={target}
        color="#fff6e8"
        intensity={2.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
    </>
  )
}

/** Altitude du terrain (m) : le bas des murs les plus bas (± 0 par défaut). */
function groundLevel(model: BuildingModel): number {
  let lowest = Infinity
  for (const piece of [...model.walls, ...model.chimneys]) {
    lowest = Math.min(lowest, piece.center.y - piece.size.y / 2)
  }
  return (Number.isFinite(lowest) ? lowest : 0) * MM
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
  const ground = groundLevel(model)
  // La dalle du niveau le plus bas est sous le terrain : invisible en vrai, donc pas dessinée.
  const slabs = model.slabs.filter((slab) => !slab.onGround)
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 2]}
      shadows="soft"
      camera={{ fov: 40, near: 0.1, far: 2000, position: [12, 10, 14] }}
      gl={{ antialias: true }}
      className="h-full w-full"
    >
      <color attach="background" args={[SKY]} />
      <fog attach="fog" args={[SKY, 80, 260]} />
      <hemisphereLight args={['#ffffff', '#b8b2a7', 0.9]} />
      <Sun bounds={model.bounds} />
      {/* Terrain : un grand sol qui reçoit les ombres, la grille de 1 m juste au-dessus. */}
      <mesh
        material={GROUND_MATERIAL}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, ground - 0.002, 0]}
        receiveShadow
      >
        <planeGeometry args={[600, 600]} />
      </mesh>
      <gridHelper args={[100, 100, '#d4d1ca', '#dedbd4']} position={[0, ground - 0.001, 0]} />
      <group scale={MM}>
        {model.wallMeshes.map((mesh) => (
          <WallBody
            key={mesh.sourceId}
            mesh={mesh}
            selected={selectedIds.has(mesh.sourceId)}
            onSelectWall={onSelectWall}
          />
        ))}
        {model.steps.map((piece, i) => (
          <PieceMesh
            key={`step-${piece.sourceId}-${i}`}
            piece={piece}
            material={STAIR_MATERIAL}
            selected={selectedIds.has(piece.sourceId)}
            onSelectWall={onSelectWall}
          />
        ))}
        {model.chimneys.map((piece, i) => (
          <PieceMesh
            key={`chimney-${piece.sourceId}-${i}`}
            piece={piece}
            material={CHIMNEY_MATERIAL}
            selected={selectedIds.has(piece.sourceId)}
            onSelectWall={onSelectWall}
          />
        ))}
        {model.fills.map((piece, i) => (
          <PieceMesh
            key={`fill-${piece.sourceId}-${i}`}
            piece={piece}
            material={FILL_MATERIALS[piece.kind]}
            castShadow={piece.kind !== 'glass'}
            selected={false}
            onSelectWall={onSelectWall}
          />
        ))}
        {slabs.map((slab) => (
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
