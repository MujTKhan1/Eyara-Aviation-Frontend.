import { useLayoutEffect, useRef, useState } from 'react'
import { gsap, scrollToTarget } from '../lib/scroll.js'
import { reducedMotion } from '../lib/env.js'

export const SERVICES = [
  {
    key: 'charter',
    card: { eyebrow: 'Made personal', title: 'Your schedule, not ours.', text: 'A suitable aircraft sourced for each journey, with one point of contact from enquiry to arrival.' },
    name: 'Private Charter',
    img: '/assets/svc-charter.webp',
    alt: 'A business jet on the apron at sunset (illustrative image)',
    text: 'Private flights arranged around your schedule. We source a suitable aircraft for each journey, coordinate the details on the ground and in the air, and stay in touch until you arrive.',
    pos: '50% 60%',
  },
  {
    key: 'cargo',
    card: { eyebrow: 'Time-critical', title: 'Capacity when it matters.', text: 'Routing, documentation and handling coordinated so your shipment moves on time.' },
    name: 'Cargo Charter',
    img: '/assets/svc-cargo.webp',
    alt: 'A cargo aircraft in silhouette against an orange sky (illustrative image)',
    text: 'Time-critical, oversized or specialised cargo. We source capacity, plan the routing and coordinate documentation and handling, so your shipment moves when it needs to.',
    pos: '50% 50%',
  },
  {
    key: 'acmi',
    card: { eyebrow: 'Flexible capacity', title: 'Aircraft, crew and cover in one.', text: 'For a season, a project or an unexpected gap in your schedule.' },
    name: 'ACMI Leasing',
    img: '/assets/svc-acmi.webp',
    alt: 'An airliner wing above clouds at sunset (illustrative image)',
    text: 'Aircraft, crew, maintenance and insurance arranged as one package, for airlines and operators that need additional capacity for a season, a project or an unexpected gap.',
    pos: '50% 50%',
  },
  {
    key: 'management',
    card: { eyebrow: 'Owner care', title: 'Your aircraft, properly looked after.', text: 'Maintenance planning, crewing and compliance under one accountable team.' },
    name: 'Aircraft Management',
    img: '/assets/svc-management.webp',
    alt: 'A business jet engine and wing in front of a hangar (illustrative image)',
    text: 'For owners who want their aircraft properly cared for: maintenance planning, crewing, compliance and cost control, overseen by one accountable team.',
    pos: '40% 50%',
  },
  {
    key: 'concierge',
    card: { eyebrow: 'Beyond the flight', title: 'Every detail around the journey.', text: 'Ground transport, accommodation and special requests, arranged for you.' },
    name: 'Aviation Concierge',
    img: '/assets/svc-concierge.webp',
    alt: 'A private jet cabin with leather seats (illustrative image)',
    text: 'Everything around the flight: ground transport, accommodation, catering, special requests and the small details that make a journey feel effortless.',
    pos: '50% 55%',
  },
]

export default function Solutions() {
  const root = useRef(null)
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState(false)
  const stRef = useRef(null)

  useLayoutEffect(() => {
    if (reducedMotion) return
    const el = root.current
    const n = SERVICES.length
    // Glass cards are placed straight from scroll position (pure function of progress),
    // so they are always correct in both scroll directions.
    const cards = gsap.utils.toArray(el.querySelectorAll('.svc-card'))
    const clamp = gsap.utils.clamp(0, 1)
    const ease = (t) => 1 - Math.pow(1 - t, 3)
    const placeCards = (u) => {
      cards.forEach((card, i) => {
        const local = u - i
        const tin = i === 0 ? 1 : ease(clamp((local - 0.0) / 0.14))
        const tout = i === n - 1 ? 0 : clamp((local - 0.46) / 0.12)
        const o = tin * (1 - tout)
        card.style.opacity = o
        card.style.visibility = o > 0.01 ? 'visible' : 'hidden'
        card.style.transform = `translate3d(0, ${(1 - tin) * 46 - tout * 30}px, 0) scale(${0.97 + 0.03 * tin})`
      })
    }
    placeCards(0)

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          onUpdate(self) {
            const idx = Math.min(n - 1, Math.floor(self.progress * n + 0.25)) // switch mid-transition, in step with the visuals
            setActive((a) => (a === idx ? a : idx))
            placeCards(self.progress * n)
          },
        },
      })
      stRef.current = tl.scrollTrigger
      tl.set({}, {}, n) // n units, one per service
      for (let i = 1; i < n; i++) {
        const at = i - 0.42
        tl.fromTo(`.svc-img-${i}`, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.42, ease: 'power2.inOut' }, at)
        tl.fromTo(`.svc-img-${i} img`, { scale: 1.25, yPercent: 6 }, { scale: 1.06, yPercent: 0, duration: 0.9 }, at)
        tl.to(`.svc-img-${i - 1} img`, { scale: 1.0, yPercent: -4, duration: 0.42, ease: 'power2.inOut' }, at)
        // the big service name: previous slides up and out, next rises in through its mask
        tl.fromTo(`.svc-title-${i - 1} .mask-inner`, { yPercent: 0 }, { yPercent: -110, duration: 0.3, ease: 'power2.in', immediateRender: false }, at)
        tl.fromTo(`.svc-title-${i} .mask-inner`, { yPercent: 110 }, { yPercent: 0, duration: 0.34, ease: 'power2.out', immediateRender: false }, at + 0.16)
      }
      tl.fromTo('.svc-img-0 img', { scale: 1.2 }, { scale: 1.06, duration: 0.6 }, 0)
      gsap.set('.svc-title:not(.svc-title-0) .mask-inner', { yPercent: 110 })
      gsap.fromTo(
        '.solutions-frame',
        { clipPath: 'inset(14% 10% 14% 10%)' },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top 85%', end: 'top top', scrub: true },
        },
      )
    }, el)
    return () => ctx.revert()
  }, [])

  const jump = (i) => {
    const st = stRef.current
    if (!st) return scrollToTarget('#solutions')
    const n = SERVICES.length
    scrollToTarget(st.start + ((i + 0.25) / n) * (st.end - st.start))
  }

  if (reducedMotion) {
    return (
      <section className="solutions-static" id="solutions">
        <div className="section-label">
          <span>03</span>
          <span>Aviation Solutions</span>
        </div>
        <p className="solutions-intro">
          Five services. <em>One standard of care.</em>
        </p>
        {SERVICES.map((s, i) => (
          <article key={s.key} className="svc-static">
            <img src={s.img} alt={s.alt} style={{ objectPosition: s.pos }} />
            <div>
              <span className="svc-num">0{i + 1}</span>
              <h3 className="svc-name">{s.name}</h3>
              <p>{s.text}</p>
            </div>
          </article>
        ))}
      </section>
    )
  }

  return (
    <section className="solutions" id="solutions" ref={root}>
      <div className="solutions-stage">
        <div className="solutions-left">
          <div className="section-label">
            <span>03</span>
            <span>Aviation Solutions</span>
          </div>
          <div className="svc-titles" aria-live="polite">
            {SERVICES.map((s, i) => (
              <h3 key={s.key} className={`svc-title svc-title-${i} mask`} aria-hidden={i !== active}>
                <span className="mask-inner">{s.name}</span>
              </h3>
            ))}
          </div>

          <div className={`svc-details ${open ? 'is-open' : ''}`}>
            <button
              type="button"
              className="svc-toggle"
              aria-expanded={open}
              aria-controls="svc-panel"
              onClick={() => setOpen((o) => !o)}
            >
              <span>{open ? 'Hide details' : 'View details'}</span>
              <i aria-hidden="true" />
            </button>
            <div className="svc-panel" id="svc-panel" role="region" aria-label={`${SERVICES[active].name} details`}>
              <div className="svc-panel-inner">
                <p key={active}>{SERVICES[active].text}</p>
                <button type="button" className="text-btn light" onClick={() => scrollToTarget('#enquire')}>
                  Enquire about {SERVICES[active].name} →
                </button>
              </div>
            </div>
          </div>

          <ol className="svc-tabs">
            {SERVICES.map((s, i) => (
              <li key={s.key} className={i === active ? 'is-active' : ''}>
                <button type="button" onClick={() => jump(i)} aria-current={i === active ? 'true' : undefined}>
                  <span className="svc-tab-num">0{i + 1}</span>
                  <span className="svc-tab-name">{s.name}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
        <div className="solutions-right">
          <div className="solutions-frame">
            {SERVICES.map((s, i) => (
              <figure key={s.key} className={`svc-img svc-img-${i}`}>
                <img src={s.img} alt={s.alt} decoding="async" style={{ objectPosition: s.pos }} />
              </figure>
            ))}
            {SERVICES.map((s, i) => (
              <aside key={s.key} className={`svc-card svc-card-${i}`} aria-hidden={i !== active}>
                <svg className="svc-card-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 3c.6 4.6 3.4 7.4 8 8-4.6.6-7.4 3.4-8 8-.6-4.6-3.4-7.4-8-8 4.6-.6 7.4-3.4 8-8Z" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
                </svg>
                <span className="svc-card-eyebrow">{s.card.eyebrow}</span>
                <p className="svc-card-title">{s.card.title}</p>
                <p className="svc-card-text">{s.card.text}</p>
              </aside>
            ))}
            <div className="svc-counter" aria-hidden="true">
              <span>{String(active + 1).padStart(2, '0')}</span>
              <i />
              <span>05</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
