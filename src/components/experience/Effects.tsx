import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  Bloom,
  DepthOfField,
  EffectComposer,
  Noise,
  Vignette,
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { useExperience } from './progressContext'
import { BLOOM_INTENSITY, sampleNumber } from './timeline'

/**
 * Effects — the expensive-looking layer.
 *
 *  - Bloom: HIGH luminance threshold (~0.9) so only the green logo glow and
 *    bright specular highlights bloom. This keeps the scene from blowing out —
 *    the blacks stay black. Intensity ramps gently with scroll.
 *  - DepthOfField: a shallow focus on the card depth gives cinematic falloff.
 *  - Vignette: subtle darkening at the edges to frame the card.
 *  - Noise: faint film grain, OVERLAY blend, very low opacity.
 *
 * On reduced-motion / mobile we drop DOF + noise to save GPU.
 */
export default function Effects() {
  const { progressRef, motion } = useExperience()
  // `any` is used for the bloom ref because the effect instance type isn't
  // exported in a stable way across postprocessing versions.
  const bloomRef = useRef<{ intensity: number } | null>(null)

  // Initialize bloom at the dormant value so phase 1 isn't dim for a frame.
  useEffect(() => {
    if (bloomRef.current) bloomRef.current.intensity = sampleNumber(BLOOM_INTENSITY, 0)
  }, [])

  useFrame((_state, delta) => {
    if (bloomRef.current) {
      const target = sampleNumber(BLOOM_INTENSITY, progressRef.current)
      bloomRef.current.intensity +=
        (target - bloomRef.current.intensity) * Math.min(1, delta * 3)
    }
  })

  const lite = motion.reducedMotion || motion.isMobile

  return (
    <EffectComposer multisampling={lite ? 0 : 4}>
      <Bloom
        ref={bloomRef as never}
        intensity={0.5}
        luminanceThreshold={0.9}
        luminanceSmoothing={0.25}
        mipmapBlur
        radius={0.7}
      />
      {lite ? (
        <></>
      ) : (
        <DepthOfField
          focusDistance={0.02}
          focalLength={0.08}
          bokehScale={2.0}
        />
      )}
      <Vignette eskil={false} offset={0.32} darkness={0.85} />
      {lite ? (
        <></>
      ) : (
        <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.035} />
      )}
    </EffectComposer>
  )
}
