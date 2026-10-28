import React, { useRef, useEffect, useState, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import type { FridgeProduct, FridgeShelf } from '../../types/fridgeProduct'
import {
  RotateCcw,
  DoorOpen,
  DoorClosed,
  Eye,
  Maximize2,
  Sparkles,
} from 'lucide-react'
import {
  getPublicActiveProducts,
  FRIDGE_PRODUCTS_UPDATED_EVENT,
} from '../../services/fridgeProductService'

export interface Photorealistic3DFridgeProps {
  isLeftDoorOpen?: boolean
  isRightDoorOpen?: boolean
  /** Optional legacy prop - freezer compartment removed */
  isFreezerOpen?: boolean
  /** Optional legacy prop - crisper drawer removed */
  isCrisperOpen?: boolean
  onToggleLeftDoor?: () => void
  onToggleRightDoor?: () => void
  /** Optional legacy callback */
  onToggleFreezer?: () => void
  /** Optional legacy callback */
  onToggleCrisper?: () => void
  products?: FridgeProduct[]
  highlightedProductId?: string
  onSelectProduct?: (product: FridgeProduct) => void
  onMoveProduct?: (productId: string, newShelf: FridgeShelf, newPositionX: number) => void
  onRotateProduct?: (productId: string, newRotation: number) => void
  isEditable?: boolean
  className?: string
  aspectRatio?: number
  yaw?: number
  onYawChange?: (yaw: number) => void
}

/**
 * Coordinate definitions matching the redesigned wide interior of side-by-side-fridge.glb.
 * All shelves are stationary components of the refrigerator cabinet interior.
 * Products are NEVER parented to moving doors.
 */
const SHELF_COORDINATES: Record<
  FridgeShelf,
  {
    parent: 'cabinet'
    surfaceY: number
    centerZ: number
    xRange: [number, number]
    zRange: [number, number]
  }
> = {
  // Shelf 1 (Top Shelf)
  top_shelf: {
    parent: 'cabinet',
    surfaceY: 1.510,
    centerZ: -0.02,
    xRange: [-0.35, 0.35],
    zRange: [-0.22, 0.18],
  },
  // Shelf 2 (Upper-Middle Shelf)
  middle_shelf: {
    parent: 'cabinet',
    surfaceY: 1.175,
    centerZ: -0.02,
    xRange: [-0.35, 0.35],
    zRange: [-0.22, 0.18],
  },
  // Shelf 3 (Lower-Middle Shelf)
  bottom_shelf: {
    parent: 'cabinet',
    surfaceY: 0.845,
    centerZ: -0.02,
    xRange: [-0.35, 0.35],
    zRange: [-0.22, 0.18],
  },
  // Shelf 4 (Bottom Shelf / Lower Compartment)
  crisper_drawer: {
    parent: 'cabinet',
    surfaceY: 0.515,
    centerZ: -0.02,
    xRange: [-0.35, 0.35],
    zRange: [-0.22, 0.18],
  },
  // Freezer shelf mapped cleanly to Top Shelf in the redesigned interior
  freezer: {
    parent: 'cabinet',
    surfaceY: 1.510,
    centerZ: -0.02,
    xRange: [-0.35, 0.35],
    zRange: [-0.22, 0.18],
  },
  // Door shelves safely mapped to stationary interior shelves so items never swing away
  door_bin_top: {
    parent: 'cabinet',
    surfaceY: 1.510,
    centerZ: -0.02,
    xRange: [-0.35, 0.35],
    zRange: [-0.22, 0.18],
  },
  door_bin_middle: {
    parent: 'cabinet',
    surfaceY: 1.175,
    centerZ: -0.02,
    xRange: [-0.35, 0.35],
    zRange: [-0.22, 0.18],
  },
  door_bin_bottom: {
    parent: 'cabinet',
    surfaceY: 0.845,
    centerZ: -0.02,
    xRange: [-0.35, 0.35],
    zRange: [-0.22, 0.18],
  },
}

// Map product images or categories to 3D model paths
function get3DModelUrl(product: FridgeProduct): string {
  if (product.model3dUrl) return product.model3dUrl
  const img = (product.imageUrl || '').toLowerCase()
  const name = (product.name || '').toLowerCase()

  if (img.includes('milk') || name.includes('milk')) return '/assets/products/3d/milk-carton.glb'
  if (img.includes('egg') || name.includes('egg')) return '/assets/products/3d/egg-carton.glb'
  if (img.includes('water') || name.includes('water')) return '/assets/products/3d/water-bottle.glb'
  if (img.includes('orange') || name.includes('juice')) return '/assets/products/3d/orange-juice.glb'
  if (img.includes('yogurt') || name.includes('yogurt')) return '/assets/products/3d/yogurt-jar.glb'
  if (img.includes('mustard') || name.includes('condiment')) return '/assets/products/3d/condiment-jar.glb'
  if (img.includes('jam') || name.includes('jam')) return '/assets/products/3d/jam-jar.glb'
  if (img.includes('citrus') || name.includes('basket')) return '/assets/products/3d/citrus-basket.glb'
  if (img.includes('lettuce') || name.includes('lettuce')) return '/assets/products/3d/green-lettuce.glb'
  if (img.includes('meal') || name.includes('container')) return '/assets/products/3d/meal-container.glb'
  if (img.includes('ice-cream') || name.includes('gelato')) return '/assets/products/3d/ice-cream.glb'
  if (img.includes('champagne') || name.includes('champagne')) return '/assets/products/3d/champagne-bottle.glb'

  return '/assets/products/3d/milk-carton.glb'
}

export const Photorealistic3DFridge: React.FC<Photorealistic3DFridgeProps> = ({
  isLeftDoorOpen: controlledLeftOpen,
  isRightDoorOpen: controlledRightOpen,
  onToggleLeftDoor,
  onToggleRightDoor,
  products = [],
  highlightedProductId,
  onSelectProduct,
  className = '',
  aspectRatio = 0.58,
  yaw,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Internal product store if products prop is not provided or empty
  const [fetchedProducts, setFetchedProducts] = useState<FridgeProduct[]>([])
  const [isModelLoaded, setIsModelLoaded] = useState(false)

  // Track product fetch for persistence & real-time updates
  useEffect(() => {
    let isMounted = true
    getPublicActiveProducts().then((res) => {
      if (isMounted) setFetchedProducts(res)
    })
    const handleUpdate = () => {
      getPublicActiveProducts().then((res) => {
        if (isMounted) setFetchedProducts(res)
      })
    }
    if (typeof window !== 'undefined') {
      window.addEventListener(FRIDGE_PRODUCTS_UPDATED_EVENT, handleUpdate)
    }
    return () => {
      isMounted = false
      if (typeof window !== 'undefined') {
        window.removeEventListener(FRIDGE_PRODUCTS_UPDATED_EVENT, handleUpdate)
      }
    }
  }, [])

  // Feature flag to temporarily disable door opening and keep fridge stably closed
  const ENABLE_DOOR_OPENING = false
  // Feature flag to remove all interior products for clean starting state
  const RENDER_INTERIOR_PRODUCTS = false

  const effectiveProducts = products.length > 0 ? products : fetchedProducts

  // Internal door open states if uncontrolled
  const [internalLeftOpen, setInternalLeftOpen] = useState(false)
  const [internalRightOpen, setInternalRightOpen] = useState(false)

  const isLeftOpen = ENABLE_DOOR_OPENING
    ? (controlledLeftOpen !== undefined ? controlledLeftOpen : internalLeftOpen)
    : false
  const isRightOpen = ENABLE_DOOR_OPENING
    ? (controlledRightOpen !== undefined ? controlledRightOpen : internalRightOpen)
    : false

  // Door state mutable refs to avoid stale closure in the Three.js requestAnimationFrame loop
  const isLeftOpenRef = useRef(isLeftOpen)
  const isRightOpenRef = useRef(isRightOpen)
  useEffect(() => {
    isLeftOpenRef.current = isLeftOpen
    isRightOpenRef.current = isRightOpen
  }, [isLeftOpen, isRightOpen])

  // Three.js Core References
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)

  // Door Pivot References
  const doorLeftPivotRef = useRef<THREE.Object3D | null>(null)
  const doorRightPivotRef = useRef<THREE.Object3D | null>(null)

  // Adaptive Interior Light Reference
  const interiorLightRef = useRef<THREE.PointLight | null>(null)

  // Stable Stationary Product Meshes Scene Group (Never attached to moving doors!)
  const stationaryProductsGroupRef = useRef<THREE.Group | null>(null)
  const productGroupsRef = useRef<Map<string, THREE.Group>>(new Map())
  const loadedModelCacheRef = useRef<Map<string, THREE.Group>>(new Map())

  // Loading state
  const [isLoading, setIsLoading] = useState(true)

  // Door toggle handlers (inactive while ENABLE_DOOR_OPENING is false)
  const handleToggleLeftDoor = useCallback(() => {
    if (!ENABLE_DOOR_OPENING) return
    if (onToggleLeftDoor) onToggleLeftDoor()
    else setInternalLeftOpen((v) => !v)
  }, [onToggleLeftDoor])

  const handleToggleRightDoor = useCallback(() => {
    if (!ENABLE_DOOR_OPENING) return
    if (onToggleRightDoor) onToggleRightDoor()
    else setInternalRightOpen((v) => !v)
  }, [onToggleRightDoor])

  const handleToggleBothDoors = useCallback(() => {
    if (!ENABLE_DOOR_OPENING) return
    const shouldOpen = !(isLeftOpen && isRightOpen)
    if (onToggleLeftDoor && onToggleRightDoor) {
      if (isLeftOpen !== shouldOpen) onToggleLeftDoor()
      if (isRightOpen !== shouldOpen) onToggleRightDoor()
    } else {
      setInternalLeftOpen(shouldOpen)
      setInternalRightOpen(shouldOpen)
    }
  }, [isLeftOpen, isRightOpen, onToggleLeftDoor, onToggleRightDoor])

  // Synchronize 3D Camera Orbit when parent controls yaw (e.g. Admin slider)
  useEffect(() => {
    if (yaw !== undefined && cameraRef.current && controlsRef.current) {
      const rad = (yaw * Math.PI) / 180.0
      const dist = 3.25
      const height = 0.93
      cameraRef.current.position.x = dist * Math.sin(rad)
      cameraRef.current.position.z = dist * Math.cos(rad)
      cameraRef.current.position.y = height
      controlsRef.current.target.set(0, height, 0)
      controlsRef.current.update()
    }
  }, [yaw])

  // Camera Presets
  const setCameraView = (view: 'front' | 'angled' | 'interior') => {
    if (!cameraRef.current || !controlsRef.current) return
    const camera = cameraRef.current
    const controls = controlsRef.current

    if (view === 'front') {
      camera.position.set(0, 0.93, 3.25)
      controls.target.set(0, 0.93, 0)
    } else if (view === 'angled') {
      camera.position.set(1.5, 1.15, 2.85)
      controls.target.set(0, 0.93, 0)
    } else if (view === 'interior') {
      camera.position.set(0.0, 1.05, 1.85)
      controls.target.set(0.0, 1.05, 0)
    }
    controls.update()
  }

  // 1. Initialize Three.js Scene, Camera, Renderer, Lighting, and GLB Model
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return
    const canvas = canvasRef.current
    const container = containerRef.current

    // Dimensions
    const width = container.clientWidth || 400
    const height = container.clientHeight || 650

    // Scene
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Stable Stationary Product Group attached directly to the stationary scene
    const stationaryGroup = new THREE.Group()
    stationaryGroup.name = 'stationary_products_group'
    scene.add(stationaryGroup)
    stationaryProductsGroupRef.current = stationaryGroup

    // Camera
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 50)
    camera.position.set(0, 0.93, 3.25)
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    rendererRef.current = renderer

    // Realistic HDRI Studio Environment Map for PBR Metallic & Glass surfaces
    const pmremGenerator = new THREE.PMREMGenerator(renderer)
    pmremGenerator.compileEquirectangularShader()
    const roomEnv = new RoomEnvironment()
    const envTexture = pmremGenerator.fromScene(roomEnv, 0.04).texture
    scene.environment = envTexture
    roomEnv.dispose()
    pmremGenerator.dispose()

    // Orbit Controls
    const controls = new OrbitControls(camera, canvas)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.target.set(0, 0.93, 0)
    controls.minDistance = 1.2
    controls.maxDistance = 4.8
    controls.maxPolarAngle = Math.PI / 2 + 0.05 // Prevent going beneath floor
    controls.minPolarAngle = Math.PI / 8
    controlsRef.current = controls

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    // Key Light
    const keyLight = new THREE.DirectionalLight(0xfff7ed, 1.4)
    keyLight.position.set(2.5, 4.0, 3.5)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.width = 1024
    keyLight.shadow.mapSize.height = 1024
    keyLight.shadow.bias = -0.0001
    scene.add(keyLight)

    // Fill Light
    const fillLight = new THREE.DirectionalLight(0xf0f9ff, 0.65)
    fillLight.position.set(-3.0, 2.5, 2.0)
    scene.add(fillLight)

    // Rim Light
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.45)
    rimLight.position.set(0, 3.0, -3.0)
    scene.add(rimLight)

    // Adaptive Interior LED Ceiling Lights
    const interiorLed = new THREE.PointLight(0xfffaed, 1.6, 2.2)
    interiorLed.position.set(0.0, 1.75, 0.10)
    scene.add(interiorLed)
    interiorLightRef.current = interiorLed

    // Soft Ground Contact Shadow Plane
    const shadowGeo = new THREE.PlaneGeometry(1.6, 1.4)
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x0f172a,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    })
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat)
    shadowMesh.rotation.x = -Math.PI / 2
    shadowMesh.position.set(0, 0.001, 0.05)
    scene.add(shadowMesh)

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect
        if (newW > 0 && newH > 0) {
          camera.aspect = newW / newH
          camera.updateProjectionMatrix()
          renderer.setSize(newW, newH)
        }
      }
    })
    resizeObserver.observe(container)

    // Load Redesigned Refrigerator GLB Model
    const loader = new GLTFLoader()
    loader.load(
      '/fridges/side-by-side-fridge.glb',
      (gltf) => {
        const root = gltf.scene

        // Enhance PBR materials for realistic tempered glass reflections
        root.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh
            mesh.castShadow = true
            mesh.receiveShadow = true

            // Refine tempered glass transparency and reflections
            if (
              mesh.name.includes('shelf') ||
              mesh.name.includes('glass')
            ) {
              const prevMat = mesh.material as THREE.MeshStandardMaterial
              mesh.material = new THREE.MeshPhysicalMaterial({
                color: prevMat?.color || 0xdbeafe,
                transparent: true,
                opacity: 0.65,
                roughness: 0.05,
                metalness: 0.04,
                transmission: 0.90,
                ior: 1.52,
                reflectivity: 0.6,
              })
            }
          }
        })

        // Retain references to door pivots
        doorLeftPivotRef.current = root.getObjectByName('door_left_pivot') || null
        doorRightPivotRef.current = root.getObjectByName('door_right_pivot') || null

        scene.add(root)
        setIsLoading(false)
        setIsModelLoaded(true)
      },
      undefined,
      (err) => {
        console.error('Error loading refrigerator GLB:', err)
        setIsLoading(false)
      }
    )

    // Animation Render Loop with reactive mutable refs (fixes closure bug!)
    let animationId: number
    let curLeftAngle = 0
    let curRightAngle = 0

    const animate = () => {
      animationId = requestAnimationFrame(animate)

      // Animate Left Door Swing smoothly using live ref
      if (doorLeftPivotRef.current) {
        const target = isLeftOpenRef.current ? -2.35 : 0.0
        curLeftAngle += (target - curLeftAngle) * 0.12
        doorLeftPivotRef.current.rotation.y = curLeftAngle
      }

      // Animate Right Door Swing smoothly using live ref
      if (doorRightPivotRef.current) {
        const target = isRightOpenRef.current ? 2.35 : 0.0
        curRightAngle += (target - curRightAngle) * 0.12
        doorRightPivotRef.current.rotation.y = curRightAngle
      }

      // Adaptive Interior Light Intensity based on door openings
      if (interiorLightRef.current) {
        const anyDoorOpen = Math.abs(curLeftAngle) > 0.05 || Math.abs(curRightAngle) > 0.05
        interiorLightRef.current.intensity = anyDoorOpen ? 1.6 : 0.25
      }

      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId)
      resizeObserver.disconnect()
      controls.dispose()
      renderer.dispose()
    }
  }, [])

  // 2. Stable Product 3D Placement Engine
  // Products remain firmly anchored inside the stationary cabinet and never disappear!
  useEffect(() => {
    const stationaryGroup = stationaryProductsGroupRef.current
    if (!stationaryGroup) return

    const productGroups = productGroupsRef.current
    const activeProductIds = new Set<string>()

    // Filter active and unarchived products (empty when RENDER_INTERIOR_PRODUCTS is false)
    const displayProducts = RENDER_INTERIOR_PRODUCTS
      ? effectiveProducts.filter((p) => p.isActive && !p.isArchived)
      : []

    displayProducts.forEach((product) => {
      activeProductIds.add(product.id)
      const shelfConfig = SHELF_COORDINATES[product.shelf] || SHELF_COORDINATES.middle_shelf

      // Calculate Physical 3D Position across the wide interior
      const normX = Math.max(0, Math.min(100, product.positionX)) / 100.0
      const posX = shelfConfig.xRange[0] + (shelfConfig.xRange[1] - shelfConfig.xRange[0]) * normX
      const posY = shelfConfig.surfaceY
      const posZ = shelfConfig.centerZ

      // Retrieve or create product 3D group in the stationary container
      let group = productGroups.get(product.id)
      const count = Math.max(1, Math.min(12, product.itemCount || 1))
      const arrangement = product.arrangement || 'single'
      const spacingM = Math.max(0.035, (product.spacing || 18) * 0.003)

      const attachUnits = (baseModel: THREE.Object3D, targetGroup: THREE.Group) => {
        let container = targetGroup.getObjectByName('units_container') as THREE.Group
        if (!container) {
          container = new THREE.Group()
          container.name = 'units_container'
          targetGroup.add(container)
        }
        container.clear()

        for (let i = 0; i < count; i++) {
          const clone = baseModel.clone()
          if (arrangement === 'row') {
            const ox = (i - (count - 1) / 2) * spacingM
            clone.position.set(ox, 0, 0)
          } else if (arrangement === 'depth') {
            const isBack = i % 2 === 1
            const col = Math.floor(i / 2)
            const cols = Math.ceil(count / 2)
            const ox = (col - (cols - 1) / 2) * spacingM
            clone.position.set(ox, 0, isBack ? -0.06 : 0.03)
          } else if (arrangement === 'grid') {
            const cols = count > 4 ? 3 : 2
            const c = i % cols
            const r = Math.floor(i / cols)
            const ox = (c - (cols - 1) / 2) * spacingM
            clone.position.set(ox, 0, -r * 0.05)
          } else if (arrangement === 'stack') {
            clone.position.set(0, i * 0.075, 0)
          } else {
            clone.position.set(0, 0, 0)
          }
          container.add(clone)
        }
      }

      if (!group) {
        group = new THREE.Group()
        group.name = `product_${product.id}`
        productGroups.set(product.id, group)
        stationaryGroup.add(group)

        // Load 3D Asset
        const modelUrl = get3DModelUrl(product)
        const cached = loadedModelCacheRef.current.get(modelUrl)

        if (cached) {
          attachUnits(cached, group)
        } else {
          const loader = new GLTFLoader()
          loader.load(
            modelUrl,
            (gltf) => {
              const model = gltf.scene
              model.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                  child.castShadow = true
                  child.receiveShadow = true
                }
              })
              loadedModelCacheRef.current.set(modelUrl, model)
              if (group) attachUnits(model, group)
            },
            undefined,
            () => {
              // High-quality fallback box if asset is missing
              const fallbackGeo = new THREE.BoxGeometry(0.06, 0.14, 0.06)
              const fallbackMat = new THREE.MeshStandardMaterial({
                color: 0x3b82f6,
                roughness: 0.3,
                metalness: 0.1,
              })
              const fallbackMesh = new THREE.Mesh(fallbackGeo, fallbackMat)
              fallbackMesh.position.y = 0.07
              if (group) attachUnits(fallbackMesh, group)
            }
          )
        }
      } else {
        if (group.parent !== stationaryGroup) {
          stationaryGroup.add(group)
        }
        const modelUrl = get3DModelUrl(product)
        const cached = loadedModelCacheRef.current.get(modelUrl)
        if (cached) {
          attachUnits(cached, group)
        }
      }

      // Update position, scale, and rotation
      group.position.set(posX, posY, posZ)
      const scale = (product.displayScale || 1.0) * 0.95
      group.scale.set(scale, scale, scale)

      if (product.rotation) {
        group.rotation.y = (product.rotation * Math.PI) / 180.0
      } else {
        group.rotation.y = 0
      }

      // Highlight indicator
      const isHighlighted = product.id === highlightedProductId
      let halo = group.getObjectByName('highlight_halo')
      if (isHighlighted) {
        if (!halo) {
          const haloGeo = new THREE.RingGeometry(0.05, 0.07, 32)
          const haloMat = new THREE.MeshBasicMaterial({
            color: 0x3b82f6,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8,
          })
          halo = new THREE.Mesh(haloGeo, haloMat)
          halo.name = 'highlight_halo'
          halo.rotation.x = -Math.PI / 2
          halo.position.y = 0.002
          group.add(halo)
        }
      } else if (halo) {
        group.remove(halo)
      }
    })

    // Remove any products that were deleted or archived
    productGroups.forEach((group, id) => {
      if (!activeProductIds.has(id)) {
        group.parent?.remove(group)
        productGroups.delete(id)
      }
    })
  }, [effectiveProducts, highlightedProductId, isModelLoaded])

  // 3. Interactive Raycasting for Direct Click & Door Toggles
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !cameraRef.current || !sceneRef.current) return
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1

    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current)

    // Raycast against refrigerator interactive components
    const intersects = raycaster.intersectObjects(sceneRef.current.children, true)
    if (intersects.length > 0) {
      const hit = intersects[0]
      let currentObj: THREE.Object3D | null = hit.object

      while (currentObj && currentObj !== sceneRef.current) {
        const name = currentObj.name || ''

        // Check if a placed product was clicked
        if (name.startsWith('product_')) {
          const productId = name.replace('product_', '')
          const matched = effectiveProducts.find((p) => p.id === productId)
          if (matched && onSelectProduct) {
            onSelectProduct(matched)
            return
          }
        }

        // Check if left door or handle was clicked
        if (name.includes('door_left') || name.includes('handle_left')) {
          if (ENABLE_DOOR_OPENING) {
            handleToggleLeftDoor()
          }
          return
        }

        // Check if right door or handle was clicked
        if (name.includes('door_right') || name.includes('handle_right')) {
          if (ENABLE_DOOR_OPENING) {
            handleToggleRightDoor()
          }
          return
        }

        currentObj = currentObj.parent
      }
    }
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full flex flex-col items-center justify-center select-none ${className}`}
      style={{
        maxWidth: '460px',
        aspectRatio: `${aspectRatio}`,
        maxHeight: '660px',
      }}
    >
      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="w-full h-full cursor-grab active:cursor-grabbing outline-none block rounded-3xl"
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-md rounded-3xl z-30 text-white">
          <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-heading font-bold uppercase tracking-wider text-blue-200">
            Rendering 3D Refrigerator...
          </p>
        </div>
      )}

      {/* Floating 3D Interaction Control HUD */}
      <div className="absolute bottom-3 inset-x-3 flex items-center justify-between pointer-events-none z-20">
        {/* Left: French Door Toggles (preserved for restoration, hidden while disabled) */}
        {ENABLE_DOOR_OPENING ? (
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              onClick={handleToggleBothDoors}
              title={isLeftOpen && isRightOpen ? 'Close Both Doors' : 'Open Both Doors'}
              className={`px-2.5 py-1.5 rounded-xl font-heading text-[11px] font-bold shadow-md backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer border ${
                isLeftOpen && isRightOpen
                  ? 'bg-blue-600/90 text-white border-blue-400'
                  : 'bg-slate-900/80 text-slate-200 border-white/10 hover:bg-slate-800'
              }`}
            >
              {isLeftOpen && isRightOpen ? (
                <DoorOpen className="w-3.5 h-3.5" />
              ) : (
                <DoorClosed className="w-3.5 h-3.5" />
              )}
              <span>{isLeftOpen && isRightOpen ? 'Close Doors' : 'Open Doors'}</span>
            </button>

            <button
              onClick={handleToggleLeftDoor}
              title="Toggle Left Door"
              className={`px-2 py-1.5 rounded-xl font-heading text-[10px] font-bold shadow-md backdrop-blur-md transition-all cursor-pointer border ${
                isLeftOpen
                  ? 'bg-blue-600/90 text-white border-blue-400'
                  : 'bg-slate-900/80 text-slate-200 border-white/10 hover:bg-slate-800'
              }`}
            >
              <span>Left</span>
            </button>

            <button
              onClick={handleToggleRightDoor}
              title="Toggle Right Door"
              className={`px-2 py-1.5 rounded-xl font-heading text-[10px] font-bold shadow-md backdrop-blur-md transition-all cursor-pointer border ${
                isRightOpen
                  ? 'bg-blue-600/90 text-white border-blue-400'
                  : 'bg-slate-900/80 text-slate-200 border-white/10 hover:bg-slate-800'
              }`}
            >
              <span>Right</span>
            </button>
          </div>
        ) : (
          <div />
        )}

        {/* Right: Camera Presets */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={() => setCameraView('front')}
            title="Front View"
            className="p-1.5 rounded-xl bg-slate-900/80 text-slate-200 border border-white/10 hover:bg-slate-800 shadow-md backdrop-blur-md transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setCameraView('angled')}
            title="Perspective View"
            className="p-1.5 rounded-xl bg-slate-900/80 text-slate-200 border border-white/10 hover:bg-slate-800 shadow-md backdrop-blur-md transition-all cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default Photorealistic3DFridge
