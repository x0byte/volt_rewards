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
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
        style={{ background: '#050508' }}
      >
        {/* Starfield — outer space background */}
        <Starfield />

        {/* Night environment for metallic reflections */}
        <Environment preset="night" environmentIntensity={0.45} />

        {/* Neon green under-glow from below/behind */}
        <pointLight
          position={[0, -3.5, -2]}
          intensity={4.0}
          distance={12}
          color="#7cfc00"
          decay={2}
        />

        {/* Secondary neon green fill from front-bottom */}
        <pointLight
          position={[0, -2.5, 2.5]}
          intensity={2.0}
          distance={8}
          color="#7cfc00"
          decay={2}
        />

        {/* White rim light from top-right to define edges */}
        <directionalLight
          position={[4, 5, 4]}
          intensity={2.0}
          color="#ffffff"
        />

        {/* Soft blue-left fill to catch the left edge */}
        <directionalLight
          position={[-3, 2, 3]}
          intensity={0.6}
          color="#4488cc"
        />

        {/* Soft backlight for depth */}
        <directionalLight
          position={[-1, 1, -5]}
          intensity={0.5}
          color="#4488ff"
        />

        {/* Dark fog for depth */}
        <fog attach="fog" args={['#161616', 10, 25]} />

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
