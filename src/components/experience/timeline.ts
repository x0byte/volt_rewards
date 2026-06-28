import * as THREE from 'three'

/**
 * ─────────────────────────────────────────────────────────────────────────
 * CINEMATIC TIMELINE CONFIG
 * ─────────────────────────────────────────────────────────────────────────
 * This is the single source of truth for the whole experience. Every visual
 * value that should react to scroll lives here as a set of keyframes.
 *
 * Scroll progress is normalized 0..1. The four narrative phases map onto it:
 *
 *   Phase 1 — Dormant Card     0.00 .. 0.25
 *   Phase 2 — Awakening        0.25 .. 0.50
 *   Phase 3 — Reward Field     0.50 .. 0.75
 *   Phase 4 — Network Reveal   0.75 .. 1.00
 *
 * To tune the cinematics you almost never touch component code — you edit the
 * keyframes below.
 */

export const BRAND = {
  /** Volt accent — used sparingly */
  accent: '#7CFC00',
  accentVec: new THREE.Color('#7CFC00'),
  white: new THREE.Color('#ffffff'),
  blueWhite: new THREE.Color('#cdd9ff'),
} as const

/** A single keyframe along the 0..1 scroll timeline. */
export interface Keyframe<T> {
  at: number
  value: T
}

/** Generic eased lerp between numeric keyframes. */
export function sampleNumber(frames: Keyframe<number>[], t: number): number {
  if (t <= frames[0].at) return frames[0].value
  const last = frames[frames.length - 1]
  if (t >= last.at) return last.value
  for (let i = 0; i < frames.length - 1; i++) {
    const a = frames[i]
    const b = frames[i + 1]
    if (t >= a.at && t <= b.at) {
      const span = b.at - a.at || 1
      const k = smoothstep((t - a.at) / span)
      return a.value + (b.value - a.value) * k
    }
  }
  return last.value
}

/** Sample a Vector3 timeline into `out` (avoids allocation in the frame loop). */
export function sampleVec3(
  frames: Keyframe<THREE.Vector3>[],
  t: number,
  out: THREE.Vector3
): THREE.Vector3 {
  if (t <= frames[0].at) return out.copy(frames[0].value)
  const last = frames[frames.length - 1]
  if (t >= last.at) return out.copy(last.value)
  for (let i = 0; i < frames.length - 1; i++) {
    const a = frames[i]
    const b = frames[i + 1]
    if (t >= a.at && t <= b.at) {
      const span = b.at - a.at || 1
      const k = smoothstep((t - a.at) / span)
      return out.copy(a.value).lerp(b.value, k)
    }
  }
  return out.copy(last.value)
}

/** Smooth Hermite ease — keeps every transition gentle, no hard joints. */
export function smoothstep(x: number): number {
  const c = x < 0 ? 0 : x > 1 ? 1 : x
  return c * c * (3 - 2 * c)
}

export function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v
}

/** Remap a sub-range of progress to 0..1 (handy for overlay fades). */
export function rangeProgress(t: number, start: number, end: number): number {
  return clamp01((t - start) / (end - start || 1))
}

/* ── CAMERA ──────────────────────────────────────────────────────────────
 * Position the camera flies through, plus the point it looks at.
 * Tune these to redesign the whole "shot list".
 */
export const CAMERA_POSITION: Keyframe<THREE.Vector3>[] = [
  { at: 0.0, value: new THREE.Vector3(0, 0.15, 6.0) }, // dormant: wide, calm
  { at: 0.28, value: new THREE.Vector3(1.1, 0.35, 4.2) }, // awakening: closer, slight orbit
  { at: 0.55, value: new THREE.Vector3(-1.1, 0.2, 4.2) }, // reward field: drift through (less extreme orbit, keep card in frame)
  { at: 0.78, value: new THREE.Vector3(0.4, 0.6, 4.6) }, // pull back for reveal
  { at: 1.0, value: new THREE.Vector3(0, 0.2, 5.4) }, // network: composed, calm
]

export const CAMERA_TARGET: Keyframe<THREE.Vector3>[] = [
  { at: 0.0, value: new THREE.Vector3(0, 0, 0) },
  { at: 0.55, value: new THREE.Vector3(0, 0, 0) }, // keep target on card center instead of behind it
  { at: 1.0, value: new THREE.Vector3(0, 0, 0) },
]

/* ── CARD ────────────────────────────────────────────────────────────────
 * Subtle rotation + scale across the timeline. The card stays the anchor.
 */
export const CARD_ROTATION_Y: Keyframe<number>[] = [
  { at: 0.0, value: -0.35 },
  { at: 0.28, value: 0.25 },
  { at: 0.55, value: -0.15 },
  { at: 0.78, value: 0.1 },
  { at: 1.0, value: 0.0 },
]

export const CARD_SCALE: Keyframe<number>[] = [
  { at: 0.0, value: 1.0 },
  { at: 0.5, value: 1.06 },
  { at: 1.0, value: 1.02 },
]

/** Embedded logo glow strength (emissive intensity multiplier). */
export const LOGO_GLOW: Keyframe<number>[] = [
  { at: 0.0, value: 0.12 }, // dormant: barely there
  { at: 0.3, value: 0.55 }, // awakening: soft green energy
  { at: 0.6, value: 0.9 },
  { at: 1.0, value: 0.7 }, // settle to a confident glow
]

/* ── PARTICLES ───────────────────────────────────────────────────────────
 * `intensity` drives opacity/size; `activity` drives motion energy;
 * `gather` (0 drift → 1 organized halo) drives the Phase 4 network reveal.
 */
export const PARTICLE_INTENSITY: Keyframe<number>[] = [
  { at: 0.0, value: 0.18 }, // faint dust
  { at: 0.3, value: 0.5 },
  { at: 0.6, value: 1.0 }, // full living field
  { at: 1.0, value: 0.85 },
]

export const PARTICLE_ACTIVITY: Keyframe<number>[] = [
  { at: 0.0, value: 0.15 },
  { at: 0.5, value: 1.0 },
  { at: 0.8, value: 0.7 },
  { at: 1.0, value: 0.35 }, // calm down for the reveal
]

export const PARTICLE_GATHER: Keyframe<number>[] = [
  { at: 0.0, value: 0.0 },
  { at: 0.72, value: 0.0 },
  { at: 1.0, value: 1.0 }, // organize into halo
]

/* ── POST-PROCESSING ─────────────────────────────────────────────────────
 * Controlled bloom — never blown out. Threshold stays high so only the
 * green glow and specular highlights pick it up.
 */
export const BLOOM_INTENSITY: Keyframe<number>[] = [
  { at: 0.0, value: 0.35 },
  { at: 0.3, value: 0.7 },
  { at: 0.6, value: 1.05 },
  { at: 1.0, value: 0.85 },
]

/* ── LIGHTING ────────────────────────────────────────────────────────────
 * Environment / key intensity rises subtly as the card awakens.
 */
export const KEY_LIGHT: Keyframe<number>[] = [
  { at: 0.0, value: 1.8 },
  { at: 0.5, value: 3.0 },
  { at: 1.0, value: 2.4 },
]

export const GREEN_LIGHT: Keyframe<number>[] = [
  { at: 0.0, value: 0.6 },
  { at: 0.3, value: 2.4 },
  { at: 0.6, value: 3.6 },
  { at: 1.0, value: 2.8 },
]

export const ENV_INTENSITY: Keyframe<number>[] = [
  { at: 0.0, value: 0.35 },
  { at: 0.5, value: 0.6 },
  { at: 1.0, value: 0.5 },
]
