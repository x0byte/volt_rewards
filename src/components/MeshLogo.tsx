import { useRef, useMemo } from 'react'
import { useLoader, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const LOGO_W = 2237
const LOGO_H = 426
const W = 2.8
const H = W * (LOGO_H / LOGO_W)
const DEPTH = 0.08

export default function MeshLogo({ atCenter }: { atCenter?: boolean }) {
  const groupRef = useRef<THREE.Group>(null!)
  const meshRef = useRef<THREE.Mesh>(null!)
  const logoTexture = useLoader(THREE.TextureLoader, '/logo.png')

  // Rounded rectangle shape matching logo aspect ratio
  const { geometry, materials } = useMemo(() => {
    const shape = new THREE.Shape()
    const hw = W / 2
    const hh = H / 2
    const r = 0.04
    shape.moveTo(-hw + r, -hh)
    shape.lineTo(hw - r, -hh)
    shape.quadraticCurveTo(hw, -hh, hw, -hh + r)
    shape.lineTo(hw, hh - r)
    shape.quadraticCurveTo(hw, hh, hw - r, hh)
    shape.lineTo(-hw + r, hh)
    shape.quadraticCurveTo(-hw, hh, -hw, hh - r)
    shape.lineTo(-hw, -hh + r)
    shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh)

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: DEPTH,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.008,
      bevelSegments: 4,
      curveSegments: 8,
    })
    geo.center()

    const mats = [
      new THREE.MeshStandardMaterial({ map: logoTexture, transparent: true, side: THREE.FrontSide }),
      new THREE.MeshStandardMaterial({ color: '#e8e4ef', metalness: 0.2, roughness: 0.4, side: THREE.BackSide }),
      new THREE.MeshStandardMaterial({ color: '#e8e4ef', metalness: 0.2, roughness: 0.4 }),
    ]

    return { geometry: geo, materials: mats }
  }, [logoTexture])

  // Wireframe edges of the extruded shape
  const edgeGeo = useMemo(() => new THREE.EdgesGeometry(geometry, 1), [geometry])

  // Store original edge positions for animation
  const origPos = useMemo(() => {
    const pos = edgeGeo.attributes.position
    return new Float32Array(pos.array)
  }, [edgeGeo])

  // Subtle float + vertex shimmer
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (groupRef.current) {
      if (!atCenter) groupRef.current.position.y = 1.6 + Math.sin(t * 0.35) * 0.04
    }
    // Animate edge vertices
    const pos = edgeGeo.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const i3 = i * 3
      pos.array[i3]     = origPos[i3]     + Math.sin(t * 1.5 + i * 0.5) * 0.006
      pos.array[i3 + 1] = origPos[i3 + 1] + Math.cos(t * 1.2 + i * 0.4) * 0.006
      pos.array[i3 + 2] = origPos[i3 + 2] + Math.sin(t * 1.0 + i * 0.3) * 0.006
    }
    pos.needsUpdate = true
  })

  return (
    <group ref={groupRef} position={[0, 1.6, -0.3]}>
      {/* Extruded logo badge */}
      <mesh ref={meshRef} geometry={geometry} material={materials} />

      {/* Edge wireframe */}
      <lineSegments geometry={edgeGeo}>
        <lineBasicMaterial color="white" transparent opacity={0.35} />
      </lineSegments>

      {/* Nodes at edge vertices */}
      <points geometry={edgeGeo}>
        <pointsMaterial color="white" size={0.018} sizeAttenuation transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>
    </group>
  )
}
