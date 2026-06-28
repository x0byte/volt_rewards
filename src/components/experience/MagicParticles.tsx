import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useExperience } from './progressContext'
import {
  PARTICLE_ACTIVITY,
  PARTICLE_GATHER,
  PARTICLE_INTENSITY,
  sampleNumber,
} from './timeline'

/**
 * MagicParticles — a single, performant particle field.
 *
 * Implementation notes:
 *  - ONE THREE.Points object with a custom ShaderMaterial. No per-particle
 *    React components. Motion is computed in the vertex shader from per-point
 *    seeds, so the CPU only updates a handful of uniforms each frame.
 *  - Each particle stores a "home" position (drifting cloud) and a "gather"
 *    position (organized halo ring). A uniform blends between them for the
 *    Phase 4 network reveal.
 *  - Palette: mostly white / blue-white, with a small fraction of #7CFC00.
 *  - Some particles are seeded right on the card surface so they read as being
 *    emitted from the logo.
 *  - Soft round sprite + size/alpha variation gives a gentle "trail" feel.
 */

const COLOR_WHITE = new THREE.Color('#ffffff')
const COLOR_BLUE = new THREE.Color('#cdd9ff')
const COLOR_GREEN = new THREE.Color('#7cfc00')

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uActivity;
  uniform float uIntensity;
  uniform float uGather;
  uniform float uPixelRatio;

  attribute vec3 aHome;       // drifting cloud position
  attribute vec3 aGather;     // organized halo position
  attribute float aSeed;      // per-particle randomness
  attribute float aSize;      // base size
  attribute vec3 aColor;

  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    vColor = aColor;

    // Organic drift: layered sines offset by the seed.
    float t = uTime * (0.15 + aSeed * 0.25);
    vec3 drift = vec3(
      sin(t + aSeed * 6.2831) ,
      cos(t * 0.8 + aSeed * 3.14),
      sin(t * 0.6 + aSeed * 1.7)
    ) * (0.12 + uActivity * 0.35);

    vec3 cloudPos = aHome + drift;

    // Blend toward the organized halo as uGather rises.
    vec3 pos = mix(cloudPos, aGather, uGather);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

    // Size: base * intensity, attenuated by distance, with a soft pulse.
    float pulse = 0.7 + 0.3 * sin(uTime * 1.5 + aSeed * 10.0);
    float size = aSize * (0.5 + uIntensity) * pulse;
    gl_PointSize = size * uPixelRatio * (300.0 / -mvPosition.z);

    // Alpha rises with intensity; distant points fade for depth.
    float depthFade = clamp(1.0 - (-mvPosition.z - 2.0) / 14.0, 0.0, 1.0);
    vAlpha = uIntensity * depthFade * (0.55 + 0.45 * pulse);

    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = /* glsl */ `
  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    // Soft round sprite — radial falloff, no hard edges.
    vec2 c = gl_PointCoord - vec2(0.5);
    float d = length(c);
    float alpha = smoothstep(0.5, 0.0, d);
    alpha *= alpha; // tighter core for a sparkle feel
    gl_FragColor = vec4(vColor, alpha * vAlpha);
  }
`

export default function MagicParticles() {
  const { progressRef, motion } = useExperience()
  const matRef = useRef<THREE.ShaderMaterial>(null!)
  const pointsRef = useRef<THREE.Points>(null!)

  // Reasonable, scaled particle counts.
  const count = motion.reducedMotion ? 280 : motion.isMobile ? 500 : 1500

  const { geometry, uniforms } = useMemo(() => {
    const home = new Float32Array(count * 3)
    const gather = new Float32Array(count * 3)
    const seed = new Float32Array(count)
    const size = new Float32Array(count)
    const color = new Float32Array(count * 3)

    const tmp = new THREE.Color()

    for (let i = 0; i < count; i++) {
      const i3 = i * 3

      // ~18% of particles are "emitted" from the card surface, the rest fill
      // a soft ellipsoidal cloud around it.
      const fromCard = Math.random() < 0.18
      if (fromCard) {
        home[i3] = (Math.random() - 0.5) * 2.6
        home[i3 + 1] = (Math.random() - 0.5) * 1.6
        home[i3 + 2] = 0.1 + Math.random() * 0.6
      } else {
        const r = 1.5 + Math.random() * 4.5
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)
        home[i3] = r * Math.sin(phi) * Math.cos(theta)
        home[i3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6
        home[i3 + 2] = r * Math.cos(phi) * 0.8
      }

      // Organized halo: a slightly noisy ring around the card.
      const ringR = 2.2 + Math.random() * 0.5
      const ringA = (i / count) * Math.PI * 2 + Math.random() * 0.3
      gather[i3] = Math.cos(ringA) * ringR
      gather[i3 + 1] = Math.sin(ringA) * ringR * 0.62
      gather[i3 + 2] = (Math.random() - 0.5) * 0.6

      seed[i] = Math.random()
      size[i] = 1.2 + Math.random() * 2.6

      // Palette: mostly white/blue-white, ~10% green sparingly.
      const roll = Math.random()
      if (roll < 0.1) tmp.copy(COLOR_GREEN)
      else if (roll < 0.5) tmp.copy(COLOR_BLUE)
      else tmp.copy(COLOR_WHITE)
      color[i3] = tmp.r
      color[i3 + 1] = tmp.g
      color[i3 + 2] = tmp.b
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(home.slice(), 3))
    geo.setAttribute('aHome', new THREE.BufferAttribute(home, 3))
    geo.setAttribute('aGather', new THREE.BufferAttribute(gather, 3))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
    geo.setAttribute('aColor', new THREE.BufferAttribute(color, 3))

    const u = {
      uTime: { value: 0 },
      uActivity: { value: 0 },
      uIntensity: { value: 0 },
      uGather: { value: 0 },
      uPixelRatio: {
        value: Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 1.75),
      },
    }

    return { geometry: geo, uniforms: u }
  }, [count])

  useFrame((state, delta) => {
    if (!matRef.current) return
    const t = progressRef.current
    const u = matRef.current.uniforms

    u.uTime.value = state.clock.elapsedTime
    // Smoothly approach timeline targets to avoid popping.
    const k = Math.min(1, delta * 3)
    u.uIntensity.value += (sampleNumber(PARTICLE_INTENSITY, t) - u.uIntensity.value) * k
    u.uActivity.value += (sampleNumber(PARTICLE_ACTIVITY, t) - u.uActivity.value) * k
    u.uGather.value += (sampleNumber(PARTICLE_GATHER, t) - u.uGather.value) * k

    // Whole field rotates very slowly for a living-network feel.
    if (pointsRef.current && !motion.reducedMotion) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.015
    }
  })

  return (
    <points ref={pointsRef} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
