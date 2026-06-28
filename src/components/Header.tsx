import { useEffect, useState } from 'react'

export default function Header() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 400)
    return () => clearTimeout(t)
  }, [])

  return (
    <header className={`header-logo${visible ? ' header-logo--visible' : ''}`}>
      {/* Logo mark — lightning bolt */}
      <svg className="header-logo__mark" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="boltGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <path
          d="M22 4L8 22h10l-2 14 16-20H22l2-12z"
          fill="url(#boltGrad)"
          stroke="#a78bfa"
          strokeWidth="0.5"
        />
      </svg>

      {/* Wordmark */}
      <div className="header-logo__type">
        {'VOLT'.split('').map((ch, i) => (
          <span
            key={i}
            className="logo-type__char"
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontWeight: 800,
              fontSize: 'clamp(1.2rem, 1.8vw, 1.6rem)',
              letterSpacing: '0.1em',
              color: '#e8e4ef',
              transitionDelay: `${0.4 + i * 0.12}s`,
            }}
          >
            {ch}
          </span>
        ))}
      </div>
    </header>
  )
}
