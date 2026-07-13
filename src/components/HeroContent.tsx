import { useEffect, useState } from 'react'

export default function HeroContent() {
  const [visible, setVisible] = useState(false)
  // Tracks whether the user has begun interacting (scroll / drag). Once they
  // do, the "scroll" hint gracefully retires so it never fights the debris.
  const [engaged, setEngaged] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 500)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const onEngage = () => setEngaged(true)
    window.addEventListener('wheel', onEngage, { passive: true, once: true })
    window.addEventListener('touchmove', onEngage, { passive: true, once: true })
    return () => {
      window.removeEventListener('wheel', onEngage)
      window.removeEventListener('touchmove', onEngage)
    }
  }, [])

  return (
    <div
      className="absolute inset-0 z-10 pointer-events-none"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 1.2s ease' }}
    >
      {/* Heading — bottom-left corner */}
      <div className="absolute left-[2.8rem] md:left-[5rem] bottom-20 md:bottom-24 pointer-events-auto">
        <h1 className="hero-title">Scroll to Break.</h1>
        <h1 className="hero-title -mt-1">Earn Rewards.</h1>
        <p className="hero-tagline mt-4 max-w-sm">
          Scroll to shatter the card into stardust — then scroll back to rebuild it.
        </p>
      </div>

      {/* Scroll prompt — centered, animated, retires once the user engages */}
      <div
        className="scroll-prompt pointer-events-none"
        style={{
          opacity: engaged ? 0 : 1,
          transform: engaged ? 'translate(-50%, 8px)' : 'translate(-50%, 0)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}
      >
        <span className="scroll-prompt__label">scroll to shatter</span>
        <span className="scroll-prompt__mouse" aria-hidden="true">
          <span className="scroll-prompt__wheel" />
        </span>
      </div>
    </div>

  )
}

