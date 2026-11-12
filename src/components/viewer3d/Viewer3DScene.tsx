import { OrbitControls } from '@react-three/drei'
import { Canvas, useStore, useThree, type ThreeEvent } from '@react-three/fiber'
import { memo, useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import type {
  Bounds3,
  BuildingModel,
  FurnitureLook,
  OpeningFill,
  PieceShape,
  RoofPrism,
  SlabShape,
  WallMesh,
  WallPiece,
} from '../../features/building/types'
import { exportCopy, exportGlb } from '../../features/export/gltf'
import { applyPlanarUv, roofSurface, wallSurface } from './materialTextures'
import OrientationCube from './OrientationCube'

/** Le modèle est en mm ; la scène est en mètres. */
const MM = 0.001

const BOX = new THREE.BoxGeometry(1, 1, 1)
// Formes rondes de diamètre et de hauteur 1 : l'échelle de chaque morceau les ajuste (ovale compris).
const SHAPES: Record<PieceShape, THREE.BufferGeometry> = {
  box: BOX,
  cylinder: new THREE.CylinderGeometry(0.5, 0.5, 1, 32),
  sphere: new THREE.SphereGeometry(0.5, 32, 20),
  cone: new THREE.ConeGeometry(0.5, 1, 32),
}
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

// Toitures dessinées : versants gris chaud (couverture neutre, en attendant les matériaux du lot C),
// pignons dans l'enduit des murs. Deux faces : le sens des triangles n'a pas d'importance.
const PITCHED_ROOF_MATERIAL = new THREE.MeshStandardMaterial({
  color: '#7f746d',
  roughness: 0.9,
  side: THREE.DoubleSide,
})
const GABLE_MATERIAL = new THREE.MeshStandardMaterial({
  color: '#f3f1ec',
  roughness: 0.95,
  side: THREE.DoubleSide,
})
const PLATFORM_MATERIAL = new THREE.MeshStandardMaterial({ color: '#cdb594', roughness: 0.85 })
/** Une matière par couleur de plateforme (terrasse en bois, plage de piscine en pierre…). */
const platformMaterials = new Map<string, THREE.MeshStandardMaterial>()
function platformMaterial(color: string | undefined): THREE.MeshStandardMaterial {
  if (!color) return PLATFORM_MATERIAL
  let material = platformMaterials.get(color)
  if (!material) {
    material = new THREE.MeshStandardMaterial({ color, roughness: 0.85 })
    platformMaterials.set(color, material)
  }
  return material
}
const STAIR_MATERIAL = new THREE.MeshStandardMaterial({ color: '#c9b393', roughness: 0.85 })
const standard = (color: string, roughness = 0.8, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness })
/** Matière des objets selon leur aspect (voir `lookOf`) : bois, tissu, plantes, eau, carrosserie… */
const FURNITURE_MATERIALS: Record<FurnitureLook, THREE.Material> = {
  neutral: standard('#b9a999'),
  wood: standard('#a98258', 0.75),
  fabric: standard('#8d99a6', 0.95),
  canvas: standard('#efe8d6', 0.9),
  white: standard('#f1f1ee', 0.5),
  metal: standard('#9298a0', 0.4, 0.5),
  stone: standard('#c3bcb0', 0.9),
  plant: standard('#5f8f4e', 0.95),
  water: standard('#3d9fd3', 0.12, 0.1),
  carDark: standard('#36404a', 0.35, 0.4),
  carLight: standard('#c9ccd0', 0.35, 0.4),
  carGlass: standard('#222a31', 0.2, 0.3),
  tire: standard('#1d1f22', 0.9),
}
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
  garage: new THREE.MeshStandardMaterial({ color: '#8e959c', roughness: 0.45, metalness: 0.35 }),
}
const SELECTED_WALL_MATERIAL = new THREE.MeshStandardMaterial({ color: '#a5b4fc', roughness: 0.9 })
// Terrain : une pelouse douce plutôt qu'un sol gris.
const GROUND_MATERIAL = new THREE.MeshStandardMaterial({ color: '#b8c79d', roughness: 1 })

/**
 * Matière normale des maillages qui peuvent être surlignés par la sélection : l'export 3D la
 * remet à la place de la couleur de sélection (voir `ExportBridge`).
 */
const BASE_MATERIALS = new WeakMap<THREE.Object3D, THREE.Material>()
const rememberBase = (material: THREE.Material) => (mesh: THREE.Mesh | null) => {
  if (mesh) BASE_MATERIALS.set(mesh, material)
}

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
  /** Forme du volume (boîte par défaut). */
  shape?: PieceShape
  onSelectWall: (wallId: string, levelId: string) => void
}

const PieceMesh = memo(function PieceMesh({
  piece,
  material = WALL_MATERIAL,
  selected,
  castShadow = true,
  shape = 'box',
  onSelectWall,
}: PieceMeshProps) {
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    if (event.delta > CLICK_MAX_DRAG) return
    event.stopPropagation() // le morceau le plus proche de la caméra gagne
    onSelectWall(piece.sourceId, piece.levelId)
  }
  return (
    <mesh
      ref={rememberBase(material)}
      geometry={SHAPES[shape]}
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
    applyPlanarUv(g)
    g.computeBoundingSphere()
    return g
  }, [mesh.positions, mesh.normals])
  useEffect(() => () => geometry.dispose(), [geometry])
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    if (event.delta > CLICK_MAX_DRAG) return
    event.stopPropagation()
    onSelectWall(mesh.sourceId, mesh.levelId)
  }
  const wallMaterial = wallSurface(mesh.material) ?? WALL_MATERIAL
  return (
    <mesh
      ref={rememberBase(wallMaterial)}
      geometry={geometry}
      material={selected ? SELECTED_WALL_MATERIAL : wallMaterial}
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
  applyPlanarUv(extruded)
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
          ? (roofSurface(slab.covering) ?? ROOF_MATERIAL)
          : slab.kind === 'platform'
            ? platformMaterial(slab.color)
            : SLAB_MATERIAL
      }
      position={[0, slab.baseY + slab.thickness, 0]}
      castShadow
      receiveShadow
    />
  )
})

/**
 * Géométrie d'un morceau de toiture : son polygone (dessus d'un versant ou face extérieure d'un
 * pignon), la même face décalée de `extrude`, et les côtés qui les relient. Le polygone est plan :
 * on le triangule dans son propre plan.
 */
function roofPrismGeometry(prism: RoofPrism): THREE.BufferGeometry {
  const pts = prism.polygon.map((p) => new THREE.Vector3(p.x, p.y, p.z))
  const shift = new THREE.Vector3(prism.extrude.x, prism.extrude.y, prism.extrude.z)
  // Repère du plan du polygone (normale de Newell, puis deux axes dans le plan).
  const normal = new THREE.Vector3()
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]
    const b = pts[(i + 1) % pts.length]
    normal.x += (a.y - b.y) * (a.z + b.z)
    normal.y += (a.z - b.z) * (a.x + b.x)
    normal.z += (a.x - b.x) * (a.y + b.y)
  }
  normal.normalize()
  const u = pts[1].clone().sub(pts[0]).normalize()
  const v = normal.clone().cross(u)
  const flat = pts.map((p) => new THREE.Vector2(p.clone().sub(pts[0]).dot(u), p.clone().sub(pts[0]).dot(v)))
  const triangles = THREE.ShapeUtils.triangulateShape(flat, [])

  const positions: number[] = []
  // Un triangle tourné vers `outward` : le sens des triangles de la triangulation n'est pas garanti,
  // et une face mal orientée disparaît avec une matière à une face (la sélection) : on voyait alors
  // le dessous du toit, que le haut des murs traverse.
  const pushTriangle = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, outward: THREE.Vector3) => {
    const facing = b.clone().sub(a).cross(c.clone().sub(a)).dot(outward)
    const [q, r] = facing >= 0 ? [b, c] : [c, b]
    positions.push(a.x, a.y, a.z, q.x, q.y, q.z, r.x, r.y, r.z)
  }
  const back = pts.map((p) => p.clone().add(shift))
  const outwardTop = shift.clone().negate() // le dessus regarde à l'opposé du décalage
  for (const [a, b, c] of triangles) {
    pushTriangle(pts[a], pts[b], pts[c], outwardTop)
    pushTriangle(back[a], back[b], back[c], shift)
  }
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length
    // Côté du volume : vers l'extérieur du contour (le polygone tourne dans le sens direct autour de `normal`).
    const outward = pts[j].clone().sub(pts[i]).cross(normal)
    pushTriangle(pts[i], back[i], back[j], outward)
    pushTriangle(pts[i], back[j], pts[j], outward)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.computeVertexNormals()
  applyPlanarUv(geometry)
  return geometry
}

interface RoofPrismMeshProps {
  prism: RoofPrism
  selected: boolean
  onSelectWall: (wallId: string, levelId: string) => void
}

/** Versant (matière du toit) ou pignon (matière des murs) d'une toiture ; un clic la sélectionne. */
const RoofPrismMesh = memo(function RoofPrismMesh({ prism, selected, onSelectWall }: RoofPrismMeshProps) {
  const geometry = useMemo(() => roofPrismGeometry(prism), [prism])
  useEffect(() => () => geometry.dispose(), [geometry])
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    if (event.delta > CLICK_MAX_DRAG) return
    event.stopPropagation()
    onSelectWall(prism.sourceId, prism.levelId)
  }
  const base = prism.kind === 'gable' ? GABLE_MATERIAL : (roofSurface(prism.covering) ?? PITCHED_ROOF_MATERIAL)
  const material = selected ? SELECTED_WALL_MATERIAL : base
  return (
    <mesh
      ref={rememberBase(base)}
      geometry={geometry}
      material={material}
      castShadow
      receiveShadow
      onClick={handleClick}
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

/**
 * Export 3D (M11) : copie du bâtiment seul (ni terrain, ni grille, ni lumières), en mètres, avec
 * les matières normales à la place de la couleur de sélection, en fichier `.glb`.
 */
function ExportBridge({
  exportRef,
  buildingRef,
}: {
  exportRef: RefObject<(() => Promise<ArrayBuffer>) | null>
  buildingRef: RefObject<THREE.Group | null>
}) {
  useEffect(() => {
    exportRef.current = async () => {
      const building = buildingRef.current
      if (!building) throw new Error('no building')
      const copy = exportCopy(building, (mesh) =>
        mesh.material === SELECTED_WALL_MATERIAL ? (BASE_MATERIALS.get(mesh) ?? WALL_MATERIAL) : null,
      )
      copy.name = 'Fabrics'
      return exportGlb(copy)
    }
    return () => {
      exportRef.current = null
    }
  }, [exportRef, buildingRef])
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
  /** Reçoit la fonction d'export 3D (fichier `.glb`). */
  exportRef: RefObject<(() => Promise<ArrayBuffer>) | null>
}

/** Dessine le modèle 3D ; ne fait aucun calcul de bâtiment (voir `features/building`). */
export default function Viewer3DScene({
  model,
  fitToken,
  northAngle,
  selectedIds,
  onSelectWall,
  captureRef,
  exportRef,
}: SceneProps) {
  const buildingRef = useRef<THREE.Group>(null)
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
      <gridHelper args={[100, 100, '#a9b88f', '#b0bf96']} position={[0, ground - 0.001, 0]} />
      <group ref={buildingRef} scale={MM}>
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
        {model.furniture.map((piece, i) => (
          <PieceMesh
            key={`furniture-${piece.sourceId}-${i}`}
            piece={piece}
            material={FURNITURE_MATERIALS[piece.look]}
            shape={piece.shape}
            selected={selectedIds.has(piece.sourceId)}
            onSelectWall={onSelectWall}
          />
        ))}
        {model.roofs.map((prism, i) => (
          <RoofPrismMesh
            key={`roof-${prism.sourceId}-${i}`}
            prism={prism}
            selected={selectedIds.has(prism.sourceId)}
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
      <ExportBridge exportRef={exportRef} buildingRef={buildingRef} />
    </Canvas>
  )
}
