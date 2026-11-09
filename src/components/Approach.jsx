import { useLayoutEffect, useRef } from 'react'
import { gsap } from '../lib/scroll.js'
import { reducedMotion } from '../lib/env.js'

// Backdrop image: replace public/assets/approach.webp to change it (see README).
const PRINCIPLES = [
  ['Personal', 'One point of contact who knows your requirements.'],
  ['Precise', 'Careful planning and attention to every detail.'],
  ['Discreet', 'Your plans handled with complete confidentiality.'],
]

export default function Approach() {
  const root = useRef(null)

  useLayoutEffect(() => {
    if (reducedMotion) return
    const el = root.current
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom bottom', scrub: true },
      })
      tl.set({}, {}, 10)
      // the hangar opens up as it arrives, then the camera settles
      tl.fromTo('.ap-frame', { clipPath: 'inset(16% 12% 16% 12%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 4.5, ease: 'power2.out' }, 0)
      tl.fromTo('.ap-frame img', { scale: 1.3 }, { scale: 1.04, duration: 10 }, 0)
      tl.fromTo('.ap-shade', { opacity: 0.4 }, { opacity: 1, duration: 4 }, 3)
      tl.fromTo('.ap-title .mask-inner', { yPercent: 110 }, { yPercent: 0, duration: 1.8, stagger: 0.5, ease: 'power2.out' }, 4.4)
      tl.fromTo('.ap-lede', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1.6 }, 6)
      tl.fromTo('.ap-principle', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1.4, stagger: 0.4 }, 6.8)
      tl.fromTo('.ap-rule', { scaleX: 0 }, { scaleX: 1, duration: 2 }, 6.6)
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section className={`approach ${reducedMotion ? 'is-static' : ''}`} id="approach" ref={root}>
      <div className="ap-stage">
        <div className="ap-frame">
          <img src="/assets/approach.webp" alt="" decoding="async" />
          <div className="ap-shade" />
        </div>

        <div className="ap-content">
          <div className="section-label light">
            <span>02</span>
            <span>Approach</span>
          </div>
          <h2 className="ap-title display">
            <span className="mask"><span className="mask-inner">Aviation,</span></span>
            <span className="mask"><span className="mask-inner">arranged</span></span>
            <span className="mask"><span className="mask-inner">around <em>you.</em></span></span>
          </h2>
          <p className="ap-lede">
            EYARA is a Dubai-based aviation services company. We arrange and manage flight for people, cargo and
            aircraft owners.
          </p>
        </div>

        <div className="ap-principles">
          <div className="ap-rule" />
          {PRINCIPLES.map(([t, d], i) => (
            <div className="ap-principle" key={t}>
              <span className="ap-num">0{i + 1}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
