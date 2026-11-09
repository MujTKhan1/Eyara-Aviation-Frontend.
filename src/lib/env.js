// Capability checks, evaluated once.

export const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Add ?nowebgl to the URL to preview the fallback, ?reduced to preview reduced motion.
const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
export const forceNoWebGL = params?.has('nowebgl') ?? false
export const reducedMotion = prefersReducedMotion || (params?.has('reduced') ?? false)

export function hasWebGL() {
  if (forceNoWebGL) return false
  try {
    const c = document.createElement('canvas')
    const gl = c.getContext('webgl2') || c.getContext('webgl')
    const ok = !!gl
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
    return ok
  } catch {
    return false
  }
}
