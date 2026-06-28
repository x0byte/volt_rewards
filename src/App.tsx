import Scene from './components/Scene'
import Header from './components/Header'
import HeroContent from './components/HeroContent'
import Features from './components/Features'
import SignupSection from './components/SignupSection'

export default function App() {
  return (
    <div className="w-screen bg-black overflow-x-hidden">
      <Header />

      {/* Hero Section — full viewport 3D canvas with overlay */}
      <section className="relative w-full h-screen overflow-hidden">
        <div className="absolute inset-0">
          <Scene />
        </div>
        <HeroContent />
      </section>

      {/* Features / Value Proposition */}
      <Features />

      {/* Signup CTA + Footer */}
      <SignupSection />
    </div>
  )
}
