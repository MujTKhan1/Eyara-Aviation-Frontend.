import { useLayoutEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from '../lib/scroll.js'
import { hasWebGL } from '../lib/env.js'

/*
  The cinematic hero: one sticky stage, one scrubbed timeline (0 → 100 units).
  Every value is driven by scroll position, so the film plays identically
  forwards and backwards.

   0–10  Cabin at rest
  10–37  Dolly through the window
  38–60  Open sky, brand statement
  56–70  Flying through a cloud bank (transition to the silver aircraft scene)
  63–84  Jet approaches head-on, "Precision" behind it
  84–93  Jet passes overhead
  88–100 Light falls to night → Approach section
*/


export default function Hero({ onTheme }) {
  const root = useRef(null)
  const canvasRef = useRef(null)

  useLayoutEffect(() => {
    const el = root.current
    const webgl = hasWebGL()
    el.classList.toggle('no-webgl', !webgl)

    // Three.js is loaded on demand so the first frame never waits for it.
    let field = null
    let disposed = false
    const camState = { cam: 0, warmth: 0 }
    let heroVisible = true
    // clouds drift only while the hero is on screen and the tab is visible
    const visTrigger = ScrollTrigger.create({
      trigger: el,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => {
        heroVisible = self.isActive
        if (heroVisible && !document.hidden) field?.start()
        else field?.stop()
      },
    })
    const onVisibility = () => (document.hidden || !heroVisible ? field?.stop() : field?.start())
    document.addEventListener('visibilitychange', onVisibility)
    if (webgl) {
      import('../lib/CloudField.js')
        .then(({ CloudField }) => {
          if (disposed) return
          field = new CloudField(canvasRef.current)
          field.setProgress(camState.cam)
          field.setWarmth(camState.warmth)
          if (heroVisible && !document.hidden) field.start()
        })
        .catch((e) => {
          console.warn('WebGL unavailable, using CSS clouds', e)
          el.classList.add('no-webgl')
        })
    }

    const q = gsap.utils.selector(el)
    let lastTheme = null

    const ctx = gsap.context(() => {
      const state = camState
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          onUpdate(self) {
            const p = self.progress * 100
            // Nav colour: dark type while the bright sky fills the screen.
            const theme = p > 30 && p < 61 ? 'light' : 'dark'
            if (theme !== lastTheme) {
              lastTheme = theme
              onTheme?.(theme)
            }
          },
        },
      })

      // keep the canvas camera in step with the timeline
      tl.eventCallback('onUpdate', () => {
        field?.setProgress(state.cam)
        field?.setWarmth(state.warmth)
      })

      tl.set({}, {}, 100) // fixes total length at 100 units

      // ---------------------------------------------------------------- Stage 1 → 2: cabin headline leaves
      tl.to('.cabin-left', { xPercent: -18, opacity: 0, letterSpacing: '0.06em', ease: 'power1.in', duration: 12 }, 8)
      tl.to('.cabin-right', { xPercent: 18, opacity: 0, letterSpacing: '0.06em', ease: 'power1.in', duration: 12 }, 8)
      tl.fromTo('.cabin-meta, .scroll-cue', { opacity: 1, y: 0 }, { opacity: 0, y: 20, duration: 6, immediateRender: false }, 6)

      // ---------------------------------------------------------------- Stage 2: dolly through the window
      tl.fromTo('.cabin', { scale: 1 }, { scale: 8.5, ease: 'power2.in', duration: 27 }, 10)
      tl.to('.cabin', { opacity: 0, duration: 3.5, ease: 'power1.in' }, 33.5)
      tl.fromTo('.window-bloom', { opacity: 0 }, { opacity: 0.55, duration: 14, ease: 'power1.in' }, 18)
      tl.to('.window-bloom', { opacity: 0, duration: 6 }, 32)
      tl.fromTo('.sky-day', { scale: 1.3, yPercent: 3 }, { scale: 1.02, yPercent: 0, duration: 28, ease: 'power1.out' }, 10)
      tl.to('.sky-day', { scale: 1.12, yPercent: -2, duration: 24 }, 38)
      tl.fromTo(state, { cam: 0 }, { cam: 0.62, duration: 52, ease: 'power1.inOut' }, 10)

      // ---------------------------------------------------------------- Stage 3: statement in open sky
      tl.fromTo('.st-line-1 .mask-inner', { yPercent: 110 }, { yPercent: 0, duration: 6, ease: 'power2.out' }, 39)
      tl.fromTo('.st-line-2 .mask-inner', { yPercent: 110 }, { yPercent: 0, duration: 6, ease: 'power2.out' }, 42)
      tl.fromTo('.st-line-3 .mask-inner', { yPercent: 110 }, { yPercent: 0, duration: 7, ease: 'power2.out' }, 45)
      tl.fromTo('.st-sub', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 5 }, 49)
      tl.fromTo('.statement', { y: 40 }, { y: -50, duration: 24 }, 38)
      tl.to('.statement .st-line, .st-sub', { opacity: 0, letterSpacing: '0.02em', duration: 5, stagger: 0.6 }, 56)
      tl.fromTo('.front-clouds', { xPercent: 22, scale: 1 }, { xPercent: -18, scale: 1.25, duration: 26 }, 36)
      tl.fromTo('.front-clouds', { opacity: 0 }, { opacity: 1, duration: 6 }, 38)

      // ---------------------------------------------------------------- Transition: through a cloud bank
      tl.fromTo('.cloudbank', { opacity: 0, scale: 1.5 }, { opacity: 1, scale: 1, duration: 7, ease: 'power1.in' }, 56)
      tl.to('.cloudbank', { opacity: 0, scale: 2.4, duration: 7, ease: 'power1.out' }, 63)
      tl.to('.front-clouds', { opacity: 0, duration: 2 }, 61)
      tl.set('.sky-layer', { autoAlpha: 0 }, 63)
      tl.fromTo('.dusk', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01 }, 63)
      tl.fromTo(state, { warmth: 0 }, { warmth: 1, duration: 8 }, 55)
      tl.to(state, { cam: 0.74, duration: 10, ease: 'power1.out' }, 62)
      tl.to('.cloud-canvas, .fallback-clouds', { opacity: 0, duration: 6 }, 64)

      // ---------------------------------------------------------------- Stage 4: the jet approaches
      tl.fromTo('.dusk-plate', { scale: 1.16 }, { scale: 1, duration: 30, ease: 'power1.out' }, 63)
      tl.fromTo(
        '.jet',
        { scale: 0.12, yPercent: -60, filter: 'blur(2.5px)' },
        { scale: 1, yPercent: 0, filter: 'blur(0px)', duration: 21, ease: 'power1.in' },
        63,
      )
      tl.fromTo('.jet', { opacity: 0 }, { opacity: 1, duration: 4 }, 64)
      tl.fromTo('.word-precision .mask-inner', { yPercent: 105 }, { yPercent: 0, duration: 7, ease: 'power2.out' }, 68)
      tl.fromTo('.word-precision', { scale: 0.94 }, { scale: 1.04, duration: 20 }, 68)
      tl.fromTo('.dusk-caption', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 5 }, 74)

      // ---------------------------------------------------------------- Stage 5: flyby, then night
      tl.to('.jet', { scale: 3.2, yPercent: -95, duration: 10, ease: 'power2.in' }, 84)
      tl.to('.word-precision, .dusk-caption', { opacity: 0, duration: 5 }, 86)
      tl.fromTo('.night', { opacity: 0 }, { opacity: 1, duration: 7 }, 88)

      // CSS fallback clouds (only visible without WebGL)
      tl.fromTo('.fc-1', { scale: 0.6, opacity: 0 }, { scale: 3.2, opacity: 0.9, duration: 30, ease: 'power1.in' }, 14)
      tl.fromTo('.fc-2', { scale: 0.5, opacity: 0 }, { scale: 2.6, opacity: 0.8, duration: 30, ease: 'power1.in' }, 30)
      tl.fromTo('.fc-3', { scale: 0.5, opacity: 0 }, { scale: 2.8, opacity: 0.85, duration: 22, ease: 'power1.in' }, 42)
    }, el)

    // intro: the cabin "lights up" once the first frame is decoded (time-based, not scroll)
    const intro = gsap.timeline({ delay: 0.15 })
    intro
      .fromTo(q('.cabin-shade'), { opacity: 1 }, { opacity: 0, duration: 1.6, ease: 'power2.out' })
      .fromTo(
        q('.cabin-copy .mask-inner'),
        { yPercent: 110 },
        { yPercent: 0, duration: 1.3, ease: 'expo.out', stagger: 0.09 },
        0.35,
      )
      .fromTo(q('.cabin-meta, .scroll-cue'), { opacity: 0 }, { opacity: 1, duration: 1 }, 0.9)

    const refresh = () => ScrollTrigger.refresh()
    window.addEventListener('load', refresh)

    return () => {
      window.removeEventListener('load', refresh)
      intro.kill()
      ctx.revert()
      disposed = true
      visTrigger.kill()
      document.removeEventListener('visibilitychange', onVisibility)
      field?.dispose()
    }
  }, [onTheme])

  return (
    <section className="hero" ref={root} id="top" aria-label="EYARA Aviation introduction">
      <div className="hero-stage">
        {/* Sky seen through the window, then all around */}
        <div className="sky-layer">
          <img className="sky-day" src="/assets/sky-day.webp" alt="" decoding="async" />
        </div>

        <canvas className="cloud-canvas" ref={canvasRef} aria-hidden="true" />
        <div className="fallback-clouds" aria-hidden="true">
          <img className="fc fc-1" src="/assets/cloud.png" alt="" />
          <img className="fc fc-2" src="/assets/cloud.png" alt="" />
          <img className="fc fc-3" src="/assets/cloud.png" alt="" />
        </div>

        {/* Stage 3 statement — sits between cloud depths */}
        <div className="statement sky-layer-text">
          <h2 className="st-title">
            <span className="st-line st-line-1 mask"><span className="mask-inner">Aviation,</span></span>
            <span className="st-line st-line-2 mask"><span className="mask-inner"><em>beyond</em></span></span>
            <span className="st-line st-line-3 mask"><span className="mask-inner">boundaries.</span></span>
          </h2>
          <p className="st-sub">
            Private and cargo charter, ACMI leasing, aircraft management and concierge, arranged from Dubai with a
            personal standard of care.
          </p>
        </div>
        <div className="front-clouds" aria-hidden="true">
          <img src="/assets/cloud.png" alt="" className="fcl fcl-a" />
          <img src="/assets/cloud.png" alt="" className="fcl fcl-b" />
          <img src="/assets/cloud.png" alt="" className="fcl fcl-c" />
        </div>

        {/* Stage 4: golden hour */}
        <div className="dusk" aria-hidden="false">
          <div className="dusk-frame">
            <img className="dusk-plate" src="/assets/dusk-plate.webp" alt="" decoding="async" />
            <div className="word-precision mask" aria-hidden="true">
              <span className="mask-inner">Precision</span>
            </div>
            <img
              className="jet"
              src="/assets/jet.webp"
              alt="A business jet approaching head-on at dusk (illustrative image)"
              decoding="async"
            />
          </div>
          <div className="dusk-caption">
            <span className="eyebrow">The right aircraft, every time</span>
            <p>
              For each mission we source and arrange a suitable aircraft, then oversee the details on the ground and in
              the air.
            </p>
          </div>
        </div>

        <div className="cloudbank" aria-hidden="true">
          <img src="/assets/cloud.png" alt="" className="cb cb-1" />
          <img src="/assets/cloud.png" alt="" className="cb cb-2" />
          <img src="/assets/cloud.png" alt="" className="cb cb-3" />
        </div>

        {/* Stage 1: the cabin */}
        <div className="cabin" aria-hidden="true">
          <img src="/assets/cabin.webp" alt="" fetchPriority="high" decoding="sync" />
          <div className="window-bloom" />
        </div>
        <div className="cabin-shade" aria-hidden="true" />

        <div className="cabin-copy">
          <h1 className="visually-hidden">EYARA Aviation — a private view of a connected world</h1>
          <p className="cabin-left display" aria-hidden="true">
            <span className="mask"><span className="mask-inner">A private</span></span>
            <span className="mask"><span className="mask-inner">view</span></span>
          </p>
          <p className="cabin-right display" aria-hidden="true">
            <span className="mask"><span className="mask-inner">of a</span></span>
            <span className="mask"><span className="mask-inner">connected</span></span>
            <span className="mask"><span className="mask-inner">world.</span></span>
          </p>
          <div className="cabin-meta">
            <span>Aviation services · Dubai, United Arab Emirates</span>
          </div>
          <div className="scroll-cue">
            <span>Scroll to depart</span>
            <i />
          </div>
        </div>

        <div className="night" aria-hidden="true" />

      </div>
    </section>
  )
}
