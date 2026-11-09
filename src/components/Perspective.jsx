import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap } from '../lib/scroll.js'
import { reducedMotion } from '../lib/env.js'

function useDubaiTime() {
  const fmt = () =>
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dubai', hour: '2-digit', minute: '2-digit', hour12: false }).format(
      new Date(),
    )
  const [t, setT] = useState(fmt)
  useEffect(() => {
    const id = setInterval(() => setT(fmt()), 15000)
    return () => clearInterval(id)
  }, [])
  return t
}

export default function Perspective() {
  const root = useRef(null)
  const time = useDubaiTime()

  useLayoutEffect(() => {
    if (reducedMotion) return
    const el = root.current
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: el, start: 'top top', end: 'bottom bottom', scrub: true },
      })
      tl.set({}, {}, 10)
      tl.fromTo('.persp-frame', { clipPath: 'inset(22% 31% 22% 31% round 2px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 5, ease: 'power2.inOut' }, 0)
      tl.fromTo('.persp-frame img', { scale: 1.35 }, { scale: 1.02, duration: 10 }, 0)
      tl.fromTo('.persp-line-1 .mask-inner', { yPercent: 105 }, { yPercent: 0, duration: 2 }, 3.2)
      tl.fromTo('.persp-line-2 .mask-inner', { yPercent: 105 }, { yPercent: 0, duration: 2 }, 3.8)
      tl.fromTo('.persp-line-3 .mask-inner', { yPercent: 105 }, { yPercent: 0, duration: 2 }, 4.4)
      tl.fromTo('.persp-line-2', { xPercent: 6 }, { xPercent: -4, duration: 7 }, 3)
      tl.fromTo('.persp-body, .persp-data', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 2, stagger: 0.4 }, 6)
      tl.fromTo('.persp-shade', { opacity: 0 }, { opacity: 1, duration: 3 }, 2.5)
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section className={`perspective ${reducedMotion ? 'is-static' : ''}`} id="perspective" ref={root}>
      <div className="persp-stage">
        <div className="persp-frame">
          <img src="/assets/global.webp" alt="The horizon at blue hour above a sea of cloud"decoding="async" />
          <div className="persp-shade" />
        </div>
        <div className="section-label light">
          <span>04</span>
          <span>Global Perspective</span>
        </div>
        <h2 className="persp-title display">
          <span className="persp-line persp-line-1 mask"><span className="mask-inner">From Dubai,</span></span>
          <span className="persp-line persp-line-2 mask"><span className="mask-inner"><em>connected</em></span></span>
          <span className="persp-line persp-line-3 mask"><span className="mask-inner">to the world.</span></span>
        </h2>
        <p className="persp-body">
          Dubai sits where Europe, Africa and Asia meet. From here we coordinate aviation requirements across time zones,
          with one point of contact and a clear view of every detail.
        </p>
        <dl className="persp-data">
          <div>
            <dt>Base</dt>
            <dd>Dubai, United Arab Emirates</dd>
          </div>
          <div>
            <dt>Coordinates</dt>
            <dd>25.20° N, 55.27° E</dd>
          </div>
          <div>
            <dt>Local time</dt>
            <dd>
              <span className="clock">{time}</span> GST
            </dd>
          </div>
        </dl>
      </div>
    </section>
  )
}
