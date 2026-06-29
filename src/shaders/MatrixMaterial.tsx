import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { vertexShader } from './matrixVertex.glsl'
import { fragmentShader } from './matrixFragment.glsl'

// ─── React Component ───────────────────────────────────────
interface MatrixMaterialProps {
  mouseUV: THREE.Vector2
  isHovered: boolean
  wireframe: boolean
}

export default function MatrixMaterial({ mouseUV, isHovered, wireframe }: MatrixMaterialProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null!)

  const material = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(-1, -1) },
        uRadius: { value: 0.35 },
        uNoiseScale: { value: 0.15 },
        uRainSpeed: { value: 0.6 },
        uGlowIntensity: { value: 0.5 },
        uOpacity: { value: 1.0 },
      },
      vertexShader,
      fragmentShader,
      transparent: false,
      depthWrite: true,
      side: THREE.FrontSide,
    })
    return mat
  }, [])

  useFrame((state) => {
    const mat = materialRef.current
    if (!mat) return

    const u = mat.uniforms
    u.uTime.value = state.clock.elapsedTime

    // Responsive mouse tracking — faster lerp
    const mouse = u.uMouse.value as THREE.Vector2
    if (isHovered) {
      mouse.lerp(mouseUV, 0.3)
    } else {
      mouse.lerp(new THREE.Vector2(-1, -1), 0.08)
    }

    // Smaller radius — tighter reveal circle
    const radius = u.uRadius.value as number
    const targetRadius = isHovered ? 0.2 : 0.0
    u.uRadius.value = radius + (targetRadius - radius) * 0.1

    u.uOpacity.value = wireframe ? 0.12 : 1.0
  })

  return (
    <primitive
      ref={materialRef}
      object={material}
      attach="material"
    />
  )
}