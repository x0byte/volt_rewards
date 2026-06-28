import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useExperience } from './progressContext'
import { CAMERA_POSITION, CAMERA_TARGET, sampleVec3 } from './timeline'

/**
 * CameraRig — the only thing that touches the camera.
 *
 * Choreography rules:
 *  - Position & lookAt target are driven entirely by scroll progress, sampled
 *    from the keyframes in timeline.ts.
 *  - The mouse adds a *tiny* parallax offset only — it never rotates the card
 *    aggressively. The offset is damped so it always feels weighty.
 *  - Everything is lerped toward its target each frame, so the camera can
 *    never jump even if scroll progress changes quickly.
 */
export default function CameraRig() {
  const { progressRef, motion } = useExperience()
  const { camera, pointer } = useThree()

  // Scratch vectors — reused every frame to avoid GC churn.
  const desiredPos = useRef(new THREE.Vector3())
  const desiredTarget = useRef(new THREE.Vector3())
  const currentTarget = useRef(new THREE.Vector3(0, 0, 0))
  const parallax = useRef(new THREE.Vector2(0, 0))

  // Parallax is gentle by default, near-zero when reduced motion is requested.
  const parallaxStrength = motion.reducedMotion ? 0 : motion.isMobile ? 0.12 : 0.35

  useFrame((_state, delta) => {
    const t = progressRef.current
    // Frame-rate independent damping factor.
    const damp = 1 - Math.pow(0.0015, delta)

    // 1. Base camera position from the scroll timeline.
    sampleVec3(CAMERA_POSITION, t, desiredPos.current)

    // 2. Subtle mouse parallax, damped so it lags slightly behind the cursor.
    parallax.current.x += (pointer.x - parallax.current.x) * Math.min(1, delta * 3)
    parallax.current.y += (pointer.y - parallax.current.y) * Math.min(1, delta * 3)
    desiredPos.current.x += parallax.current.x * parallaxStrength
    desiredPos.current.y += parallax.current.y * parallaxStrength * 0.6

    // 3. Clamp the desired position to keep the card in safe view.
    //    Never let the camera go behind the card (z < 0.5) or get too close.
    desiredPos.current.z = Math.max(desiredPos.current.z, 1.5)
    desiredPos.current.x = Math.min(Math.max(desiredPos.current.x, -2.5), 2.5)
    desiredPos.current.y = Math.min(Math.max(desiredPos.current.y, -1.0), 2.0)

    // 4. Smoothly approach the desired position.
    camera.position.lerp(desiredPos.current, damp)

    // 5. Look-at target also follows the timeline, damped independently.
    sampleVec3(CAMERA_TARGET, t, desiredTarget.current)
    currentTarget.current.lerp(desiredTarget.current, damp)
    camera.lookAt(currentTarget.current)
  })

  return null
}
