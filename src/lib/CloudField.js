import { Color, Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry, SRGBColorSpace, Scene, TextureLoader, WebGLRenderer } from 'three'

/**
 * Real-time cloud volume the hero camera flies through.
 * - One canvas, one scene, ~70 soft sprites sharing one texture.
 * - Renders on demand only (when the scroll progress changes or on resize).
 * - Progress 0..1 is mapped to the camera's position along -z.
 */
export class CloudField {
  constructor(canvas, { count = 72, textureUrl = '/assets/cloud.png' } = {}) {
    this.canvas = canvas
    this.renderer = new WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance',
      premultipliedAlpha: true,
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
    this.renderer.setClearColor(0x000000, 0)

    this.scene = new Scene()
    this.camera = new PerspectiveCamera(58, 1, 1, 1400)
    this.progress = 0
    this.tint = new Color(1, 1, 1)
    this.sprites = []
    this.pending = false
    this.disposed = false

    const loader = new TextureLoader()
    this.texture = loader.load(textureUrl, () => this.requestRender())
    this.texture.colorSpace = SRGBColorSpace
    this.geometry = new PlaneGeometry(1, 1)

    // Deterministic layout so the film is identical on every visit.
    let seed = 1337
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)

    for (let i = 0; i < count; i++) {
      const material = new MeshBasicMaterial({
        map: this.texture,
        transparent: true,
        depthWrite: false,
        opacity: 0,
      })
      const m = new Mesh(this.geometry, material)
      const z = -40 - (i / count) * 1150 - rand() * 12
      // keep a loose corridor in the middle so the camera threads between banks
      const side = rand() < 0.5 ? -1 : 1
      const x = side * (8 + rand() * 75) + (rand() - 0.5) * 18
      const y = -34 + rand() * 30 + (rand() < 0.22 ? 30 : 0)
      const s = 34 + rand() * 70
      m.position.set(x, y, z)
      m.scale.set(s * (1.2 + rand() * 0.6), s, 1)
      m.rotation.z = (rand() - 0.5) * 0.5
      m.userData.base = 0.55 + rand() * 0.4
      m.userData.x = x
      m.userData.speed = -(4.5 + rand() * 6.5) // gentle crosswind, units per second
      this.scene.add(m)
      this.sprites.push(m)
    }

    this.time = 0
    this.running = false
    this.last = 0
    this.tick = this.tick.bind(this)

    this.resize = this.resize.bind(this)
    window.addEventListener('resize', this.resize)
    this.resize()
  }

  resize() {
    const { clientWidth: w, clientHeight: h } = this.canvas
    if (!w || !h) return
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.requestRender()
  }

  setProgress(p) {
    if (p === this.progress) return
    this.progress = p
    this.requestRender()
  }

  // Cool the cloud colour towards the silver aircraft scene (0 = midday white, 1 = steel).
  setWarmth(w) {
    this.tint.setRGB(1 - 0.16 * w, 1 - 0.1 * w, 1 - 0.02 * w)
    this.requestRender()
  }

  // Continuous gentle drift while the hero is on screen. Stopped when it is not.
  start() {
    if (this.running || this.disposed) return
    this.running = true
    this.last = performance.now()
    requestAnimationFrame(this.tick)
  }

  stop() {
    this.running = false
  }

  tick(now) {
    if (!this.running || this.disposed) return
    const dt = Math.min(0.05, (now - this.last) / 1000)
    this.last = now
    this.time += dt
    this.render()
    requestAnimationFrame(this.tick)
  }

  requestRender() {
    if (this.running) return // the drift loop is already drawing every frame
    if (this.pending || this.disposed) return
    this.pending = true
    requestAnimationFrame(() => {
      this.pending = false
      this.render()
    })
  }

  render() {
    if (this.disposed) return
    const p = this.progress
    const cam = this.camera
    cam.position.set(Math.sin(p * Math.PI) * 5, 2 + p * 6, 70 - p * 1080)
    cam.rotation.z = Math.sin(p * Math.PI * 1.3) * 0.012 // a breath of bank, not a spin
    const far = 620
    const W = 125
    for (const m of this.sprites) {
      let x = m.userData.x + m.userData.speed * this.time
      x = ((((x + W) % (2 * W)) + 2 * W) % (2 * W)) - W
      m.position.x = x
      const edge = 1 - smoothstep(W - 30, W, Math.abs(x))
      const d = cam.position.z - m.position.z
      let o = 0
      if (d > 0) {
        const fadeFar = 1 - smoothstep(far * 0.55, far, d)
        const fadeNear = smoothstep(4, 46, d)
        o = fadeFar * fadeNear * edge * m.userData.base
      }
      m.visible = o > 0.004
      m.material.opacity = o
      m.material.color.copy(this.tint)
    }
    this.renderer.render(this.scene, cam)
  }

  dispose() {
    this.disposed = true
    this.running = false
    window.removeEventListener('resize', this.resize)
    this.sprites.forEach((m) => m.material.dispose())
    this.geometry.dispose()
    this.texture.dispose()
    this.renderer.dispose()
  }
}

function smoothstep(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
