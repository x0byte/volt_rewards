import { useEffect, useState } from 'react'

export default function HeroContent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 500)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      className="absolute inset-0 z-10 pointer-events-none"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 1.2s ease' }}
    >
      {/* Heading — bottom-left corner */}
      <div className="absolute left-[2.8rem] md:left-[5rem] bottom-20 md:bottom-24 pointer-events-auto">
        <h1 className="hero-title">Tap the Card.</h1>
        <h1 className="hero-title -mt-1">Earn Rewards.</h1>
        <p className="hero-tagline mt-4 max-w-sm">
          Every click earns points. Simple, fast, and endlessly rewarding.
        </p>
      </div>

      {/* Scroll indicator — bottom-right corner */}
      <div className="absolute bottom-10 right-[2.8rem] md:right-[5rem] pointer-events-auto">
        <div className="scroll-indicator scroll-indicator--right">
          <span className="scroll-indicator__label">scroll to discover</span>
          <svg className="scroll-indicator__icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 2v12M4 10l4 4 4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  )
}
