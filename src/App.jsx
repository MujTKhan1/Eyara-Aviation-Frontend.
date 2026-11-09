import { useCallback, useEffect, useState } from 'react'
import Nav from './components/Nav.jsx'
import Hero from './components/Hero.jsx'
import HeroStatic from './components/HeroStatic.jsx'
import Approach from './components/Approach.jsx'
import Solutions from './components/Solutions.jsx'
import Perspective from './components/Perspective.jsx'
import Enquire from './components/Enquire.jsx'
import Footer from './components/Footer.jsx'
import { startSmoothScroll, stopSmoothScroll, ScrollTrigger } from './lib/scroll.js'
import { reducedMotion } from './lib/env.js'

export default function App() {
  const [heroTheme, setHeroTheme] = useState('dark')
  const [pastHero, setPastHero] = useState(false)
  const [onLight, setOnLight] = useState(false)

  const onTheme = useCallback((t) => setHeroTheme(t), [])

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
    document.documentElement.classList.toggle('reduced-motion', reducedMotion)
    startSmoothScroll()
    // nav theme outside the hero: dark type on the ivory enquiry section
    const triggers = [
      ScrollTrigger.create({
        trigger: '#approach',
        start: 'top 60px',
        onToggle: (s) => setPastHero(s.isActive || s.progress > 0),
        end: 'max',
      }),
      ScrollTrigger.create({
        trigger: '#enquire',
        start: 'top 40px',
        end: 'bottom 40px',
        onToggle: (s) => setOnLight(s.isActive),
      }),
    ]
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
    return () => {
      triggers.forEach((t) => t.kill())
      stopSmoothScroll()
    }
  }, [])

  const theme = onLight ? 'light' : pastHero ? 'dark' : heroTheme

  return (
    <>
      <a className="skip-link" href="#enquire">
        Skip to enquiry
      </a>
      <Nav theme={theme} />
      <main>
        {reducedMotion ? <HeroStatic /> : <Hero onTheme={onTheme} />}
        <Approach />
        <Solutions />
        <Perspective />
        <Enquire />
      </main>
      <Footer />
      <div className="grain" aria-hidden="true" />
    </>
  )
}
