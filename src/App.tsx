import Scene from './components/Scene'
import Header from './components/Header'
import HeroContent from './components/HeroContent'


export default function App() {
  return (
    <div className="w-screen bg-black overflow-x-hidden">
      <Header />

      {/* Hero Section — fixed full viewport. The page does NOT scroll;
          the wheel/touch gesture drives the card shatter in place. */}
      <section className="relative w-full h-screen overflow-hidden">
        <div className="absolute inset-0">
          <Scene />
        </div>
        <HeroContent />
      </section>

    </div>
  )
}

