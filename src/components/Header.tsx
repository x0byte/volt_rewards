import { useEffect, useRef, useState } from 'react'

export default function Header() {
  const [visible, setVisible] = useState(false)
  const [hidden, setHidden] = useState(false)
  const lastScrollY = useRef(0)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 400)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY > 80 && currentScrollY > lastScrollY.current) {
        setHidden(true)
      } else {
        setHidden(false)
      }
      lastScrollY.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`fixed-header${visible ? ' fixed-header--visible' : ''}${hidden ? ' fixed-header--hidden' : ''}`}
    >
      <div className="fixed-header__inner">
        <img
          className="fixed-header__logo"
          src="/logo.png"
          alt="Volt Rewards"
          width={2237}
          height={426}
        />
      </div>
    </header>
  )
}
