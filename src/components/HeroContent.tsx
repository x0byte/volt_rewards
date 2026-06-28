import { useEffect, useState } from 'react'
import Button from './Button'

export default function HeroContent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 500)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 1.2s ease' }}
    >
      {/* Title — sits above the card */}
      <div className="flex flex-col items-center pointer-events-auto">
        <h1 className="hero-title text-center">
          Tap the Card.
        </h1>
        <h1 className="hero-title hero-title--accent text-center -mt-4">
          Earn Rewards.
        </h1>
      </div>

      {/* Spacer — card lives here in the 3D canvas behind */}
      <div className="h-[25vh] md:h-[30vh]" />

      {/* Tagline + CTA — sits below the card */}
      <div className="flex flex-col items-center gap-6 pointer-events-auto">
        <p className="hero-tagline text-center">
          Every click, every interaction&nbsp;&mdash;&nbsp;earn points instantly.
          <br />
          Simple, fast, and endlessly rewarding.
        </p>
        <Button href="#signup">Join Volt Rewards</Button>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto">
        <div className="scroll-indicator">
          <span className="scroll-indicator__label">Scroll</span>
          <span className="scroll-indicator__arrow" />
        </div>
      </div>
    </div>
  )
}
