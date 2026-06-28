import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import * as THREE from 'three'
import { useExperience } from './progressContext'
import { ENV_INTENSITY, GREEN_LIGHT, KEY_LIGHT, sampleNumber } from './timeline'

/**
 * Lighting — premium cinematic setup tuned for a near-black stage.
 *
 *  - Environment ("night") provides soft metallic reflections.
 *  - A cool key light shapes the card from above-front.
 *  - A dim rim light separates the card from the black background.
 *  - A green accent light pushes #7CFC00 energy from below/behind, rising as
 *    the card "awakens" with scroll.
 *
 * Intensities are driven by the scroll timeline so the stage brightens as the
 * narrative builds, then settles for the calm reveal.
 */
export default function Lighting() {
  const { progressRef } = useExperience()
  const keyRef = useRef<THREE.DirectionalLight>(null!)
  const greenRef = useRef<THREE.PointLight>(null!)
  const greenRef2 = useRef<THREE.PointLight>(null!)

  useFrame((_state, delta) => {
    const t = progressRef.current
    const k = Math.min(1, delta * 3)

    if (keyRef.current) {
      const target = sampleNumber(KEY_LIGHT, t)
      keyRef.current.intensity += (target - keyRef.current.intensity) * k
    }
    const greenTarget = sampleNumber(GREEN_LIGHT, t)
    if (greenRef.current) {
      greenRef.current.intensity += (greenTarget - greenRef.current.intensity) * k
    }
    if (greenRef2.current) {
      greenRef2.current.intensity +=
        (greenTarget * 0.5 - greenRef2.current.intensity) * k
    }
  })

  return (
    <>
      <Environment preset="night" environmentIntensity={sampleNumber(ENV_INTENSITY, 0)} />

      {/* Cool key light */}
      <directionalLight
        ref={keyRef}
        position={[4, 5, 5]}
        intensity={1.8}
        color="#d4def5"
      />

      {/* Dim cool rim light from behind */}
      <directionalLight position={[-3, 2, -5]} intensity={0.7} color="#5570aa" />

      {/* Green accent — from below/behind, the card's "reward energy" */}
      <pointLight
        ref={greenRef}
        position={[0, -2.4, 1.5]}
        intensity={0.6}
        distance={12}
        decay={1.8}
        color="#7cfc00"
      />
      <pointLight
        ref={greenRef2}
        position={[0, 1.5, -3]}
        intensity={0.3}
        distance={10}
        decay={2}
        color="#7cfc00"
      />

      {/* Soft ambient fill so blacks aren't crushed completely */}
      <ambientLight intensity={0.12} color="#20242e" />
    </>
  )
}
