import { useLayoutEffect, useRef, useState } from 'react'
import { gsap } from '../lib/scroll.js'
import { reducedMotion } from '../lib/env.js'
import { SERVICES } from './Solutions.jsx'

// Set VITE_ENQUIRY_ENDPOINT in .env to receive enquiries (JSON POST).
const ENDPOINT = import.meta.env.VITE_ENQUIRY_ENDPOINT

const OPTIONS = [...SERVICES.map((s) => s.name), 'Something else']

export default function Enquire() {
  const root = useRef(null)
  const [chosen, setChosen] = useState([])
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [errors, setErrors] = useState({})

  useLayoutEffect(() => {
    if (reducedMotion) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.enq-title .mask-inner',
        { yPercent: 105 },
        {
          yPercent: 0,
          ease: 'none',
          stagger: 0.2,
          scrollTrigger: { trigger: '.enq-title', start: 'top 90%', end: 'bottom 60%', scrub: true },
        },
      )
      gsap.fromTo(
        '.enq-form > *',
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.1,
          ease: 'none',
          scrollTrigger: { trigger: '.enq-form', start: 'top 95%', end: 'top 55%', scrub: true },
        },
      )
    }, root)
    return () => ctx.revert()
  }, [])

  const toggle = (name) => setChosen((c) => (c.includes(name) ? c.filter((x) => x !== name) : [...c, name]))

  async function submit(e) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const data = Object.fromEntries(form.entries())
    const errs = {}
    if (!data.name?.trim()) errs.name = 'Please add your name'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email || '')) errs.email = 'Please add a valid email'
    if (!chosen.length) errs.services = 'Choose at least one service'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setStatus('sending')
    const payload = { ...data, services: chosen }
    try {
      if (ENDPOINT) {
        const res = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error(res.statusText)
      } else {
        console.warn('[EYARA] No VITE_ENQUIRY_ENDPOINT set; enquiry not sent anywhere.', payload)
        await new Promise((r) => setTimeout(r, 700))
      }
      setStatus('sent')
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  return (
    <section className="enquire" id="enquire" ref={root}>
      <div className="section-label dark">
        <span>05</span>
        <span>Enquire</span>
      </div>
      <div className="enq-grid">
        <div className="enq-intro">
          <h2 className="enq-title display">
            <span className="mask"><span className="mask-inner">Tell us where</span></span>
            <span className="mask"><span className="mask-inner"><em>you need to be.</em></span></span>
          </h2>
          <p className="enq-lede">
            Share as much or as little as you like: a route, dates, passengers or cargo details. We will follow up to
            understand your requirements.
          </p>
          <p className="enq-place">Dubai, United Arab Emirates</p>
        </div>

        {status === 'sent' ? (
          <div className="enq-done" role="status">
            <span className="eyebrow">Received</span>
            <p className="display">
              Thank you. <em>We'll be in touch.</em>
            </p>
            <button type="button" className="text-btn" onClick={() => { setStatus('idle'); setChosen([]) }}>
              Send another enquiry
            </button>
          </div>
        ) : (
          <form className="enq-form" onSubmit={submit} noValidate>
            <fieldset className="chips">
              <legend>What can we arrange?</legend>
              <div className="chip-row">
                {OPTIONS.map((o) => (
                  <button
                    type="button"
                    key={o}
                    className={`chip ${chosen.includes(o) ? 'is-on' : ''}`}
                    aria-pressed={chosen.includes(o)}
                    onClick={() => toggle(o)}
                  >
                    {o}
                  </button>
                ))}
              </div>
              {errors.services && <span className="field-error">{errors.services}</span>}
            </fieldset>
            <div className="field-row">
              <Field name="name" label="Name" autoComplete="name" error={errors.name} />
              <Field name="company" label="Company (optional)" autoComplete="organization" />
            </div>
            <div className="field-row">
              <Field name="email" type="email" label="Email" autoComplete="email" error={errors.email} />
              <Field name="phone" type="tel" label="Phone (optional)" autoComplete="tel" />
            </div>
            <Field name="message" label="Your requirements" textarea />
            <div className="enq-submit">
              <button type="submit" className="submit-btn" disabled={status === 'sending'}>
                <span>{status === 'sending' ? 'Sending' : 'Send enquiry'}</span>
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.2" />
                </svg>
              </button>
              {status === 'error' && <span className="field-error">Something went wrong. Please try again.</span>}
            </div>
          </form>
        )}
      </div>
    </section>
  )
}

function Field({ name, label, type = 'text', textarea, error, ...rest }) {
  const id = `f-${name}`
  return (
    <label className={`field ${error ? 'has-error' : ''}`} htmlFor={id}>
      {textarea ? (
        <textarea id={id} name={name} rows={3} placeholder=" " {...rest} />
      ) : (
        <input id={id} name={name} type={type} placeholder=" " {...rest} />
      )}
      <span className="field-label">{label}</span>
      <i className="field-line" />
      {error && <span className="field-error">{error}</span>}
    </label>
  )
}
