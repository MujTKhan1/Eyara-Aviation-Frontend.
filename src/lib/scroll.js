import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { reducedMotion } from './env.js'

gsap.registerPlugin(ScrollTrigger)

let lenis = null

// Gentle wheel smoothing only. Native scrolling under reduced motion.
export function startSmoothScroll() {
  if (reducedMotion || lenis) return lenis
  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.9, smoothWheel: true })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add(raf)
  gsap.ticker.lagSmoothing(0)
  return lenis
}

function raf(time) {
  lenis?.raf(time * 1000)
}

export function stopSmoothScroll() {
  gsap.ticker.remove(raf)
  lenis?.destroy()
  lenis = null
}

export function scrollToTarget(target, opts = {}) {
  if (lenis) {
    lenis.scrollTo(target, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4), ...opts })
  } else {
    const y =
      typeof target === 'number'
        ? target
        : (typeof target === 'string' ? document.querySelector(target) : target).getBoundingClientRect().top +
          window.scrollY +
          (opts.offset || 0)
    window.scrollTo({ top: y, behavior: reducedMotion ? 'auto' : 'smooth' })
  }
}

export { gsap, ScrollTrigger }
