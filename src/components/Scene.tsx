import { useRef, useState, useCallback, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import { EffectComposer, Glitch } from '@react-three/postprocessing'
import { GlitchMode } from 'postprocessing'
import * as THREE from 'three'
import RewardCard from './RewardCard'
import FloatingPoints, { generatePoint } from './FloatingPoints'
import Starfield from './Starfield'
import type { FloatingPoint } from './FloatingPoints'

export default function Scene() {
  const [points, setPoints] = useState<FloatingPoint[]>([])
  const [wireframe, setWireframe] = useState(false)
  const [glitchActive, setGlitchActive] = useState(false)
  const pointIdRef = useRef(0)

  const handleEarn = useCallback((worldPos: THREE.Vector3) => {
    const id = ++pointIdRef.current
    const newPoint = generatePoint(worldPos, id)
    setPoints((prev) => [...prev, newPoint])
  }, [])

  const handleRemovePoint = useCallback((id: number) => {
    setPoints((prev) => prev.filter((p) => p.id !== id))
  }, [])

  // Every 8s: glitch → wireframe (2s) → glitch → solid
  useEffect(() => {
    const interval = setInterval(() => {
      // Glitch → wireframe transition
      setGlitchActive(true)
      const toWf = setTimeout(() => {
        setWireframe(true)
        setGlitchActive(false)
      }, 150)

      // Glitch → solid transition
      const toGlitch = setTimeout(() => {
        setGlitchActive(true)
      }, 1900)
      const revert = setTimeout(() => {
        setWireframe(false)
        setGlitchActive(false)
      }, 2050)

      return () => {
        clearTimeout(toWf)
        clearTimeout(toGlitch)
        clearTimeout(revert)
      }
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0.1, 4.5], fov: 35 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
        style={{ background: '#050508' }}
      >
        <Starfield />
        <Environment preset="night" environmentIntensity={0.5} />

        <pointLight position={[0, -4, -2]} intensity={6.0} distance={14} color="#7cfc00" decay={1.5} />
        <pointLight position={[0, -2.5, 3]} intensity={3.0} distance={8} color="#7cfc00" decay={2} />
        <directionalLight position={[5, 6, 4]} intensity={3.0} color="#d0d8ff" />
        <directionalLight position={[-1, 1, -6]} intensity={0.6} color="#5577aa" />
        <fog attach="fog" args={['#050508', 8, 20]} />

        <OrbitControls
          enablePan={false}
          enableZoom={false}
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.5}
          autoRotate
          autoRotateSpeed={1.2}
          target={[0, 0, 0]}
        />

        <RewardCard onEarn={handleEarn} wireframe={wireframe} />

        <EffectComposer>
          <Glitch
            active={glitchActive}
            mode={GlitchMode.SPORADIC}
            delay={new THREE.Vector2(0.02, 0.08)}
            duration={new THREE.Vector2(0.08, 0.15)}
            strength={new THREE.Vector2(0.2, 0.5)}
          />
        </EffectComposer>

        <FloatingPoints points={points} onRemove={handleRemovePoint} />
      </Canvas>
    </div>
  )
}
