import { Suspense } from 'react'
import CameraRig from './CameraRig'
import Card from './Card'
import Effects from './Effects'
import Lighting from './Lighting'
import MagicParticles from './MagicParticles'

/**
 * Scene — assembles the 3D world inside the <Canvas>.
 *
 * Order doesn't matter for rendering, but conceptually:
 *   CameraRig    → drives the shot
 *   Lighting     → stages the card
 *   Card         → the hero anchor
 *   MagicParticles → the reward energy field
 *   Effects      → the cinematic post layer (must be last)
 *
 * The loader-dependent pieces (Card texture, Environment) sit under Suspense so
 * the rest of the app never blocks on them.
 */
export default function Scene() {
  return (
    <>
      <CameraRig />

      <Suspense fallback={null}>
        <Lighting />
        <Card />
      </Suspense>

      <MagicParticles />

      <fog attach="fog" args={['#050507', 7, 22]} />

      <Effects />
    </>
  )
}
