import { useRef, useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import RewardCard from './RewardCard'
import FloatingPoints, { generatePoint } from './FloatingPoints'
import Starfield from './Starfield'
import type { FloatingPoint } from './FloatingPoints'

export default function Scene() {
  const [points, setPoints] = useState<FloatingPoint[]>([])
  const pointIdRef = useRef(0)

  const handleEarn = useCallback((worldPos: THREE.Vector3) => {
    const id = ++pointIdRef.current
    const newPoint = generatePoint(worldPos, id)
    setPoints((prev) => [...prev, newPoint])
  }, [])

  const handleRemovePoint = useCallback((id: number) => {
    setPoints((prev) => prev.filter((p) => p.id !== id))
  }, [])

  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0.1, 4.5], fov: 35 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
        style={{ background: '#050508' }}
      >
        {/* Starfield — outer space background */}
        <Starfield />

        {/* Night environment for cold metallic reflections */}
        <Environment preset="night" environmentIntensity={0.5} />

        {/* Harsh neon green under-glow from below/behind */}
        <pointLight
          position={[0, -4, -2]}
          intensity={6.0}
          distance={14}
          color="#7cfc00"
          decay={1.5}
        />

        {/* Secondary neon green stab from front-bottom */}
        <pointLight
          position={[0, -2.5, 3]}
          intensity={3.0}
          distance={8}
          color="#7cfc00"
          decay={2}
        />

        {/* Hard white rim light from top-right — industrial edge definition */}
        <directionalLight
          position={[5, 6, 4]}
          intensity={3.0}
          color="#d0d8ff"
        />

        {/* Cold backlight for depth */}
        <directionalLight
          position={[-1, 1, -6]}
          intensity={0.6}
          color="#5577aa"
        />

        {/* Tight fog — claustrophobic industrial depth */}
        <fog attach="fog" args={['#050508', 8, 20]} />

        {/* OrbitControls — auto-rotate slow, pause on user drag */}
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

        {/* The reward card — centered */}
        <RewardCard onEarn={handleEarn} />

        {/* Floating points overlay */}
        <FloatingPoints points={points} onRemove={handleRemovePoint} />
      </Canvas>
    </div>
  )
}
