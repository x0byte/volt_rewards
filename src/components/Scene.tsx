import { useRef, useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import RewardCard from './RewardCard'
import FloatingPoints, { generatePoint } from './FloatingPoints'
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
    <div className="w-full h-full relative">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 35 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
        style={{ background: '#050505' }}
      >
        {/* Environment for realistic metal reflections */}
        <Environment preset="city" environmentIntensity={0.5} />

        {/* Ambient fill */}
        <ambientLight intensity={0.1} color="#222222" />

        {/* Neon green under-glow from below/behind */}
        <pointLight
          position={[0, -3, -2]}
          intensity={2.5}
          distance={10}
          color="#7cfc00"
          decay={2}
        />

        {/* Secondary neon green fill from front-bottom */}
        <pointLight
          position={[0, -2, 2]}
          intensity={1.2}
          distance={8}
          color="#7cfc00"
          decay={2}
        />

        {/* White rim light from top-right to define edges */}
        <directionalLight
          position={[3, 4, 3]}
          intensity={1.2}
          color="#ffffff"
        />

        {/* Soft backlight */}
        <directionalLight
          position={[-1, 1, -4]}
          intensity={0.4}
          color="#4488ff"
        />

        {/* Green aura fog */}
        <fog attach="fog" args={['#050505', 8, 15]} />

        {/* OrbitControls for full 360° rotation — drag to spin the card in any direction */}
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.8}
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