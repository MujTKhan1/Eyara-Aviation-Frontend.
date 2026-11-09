// Reduced-motion version of the hero: the same three moments as still frames,
// no scroll-linked movement, no WebGL.
export default function HeroStatic() {
  return (
    <section className="hero-static" id="top" aria-label="EYARA Aviation introduction">
      <div className="hs-frame hs-cabin">
        <img className="hs-sky" src="/assets/sky-day.webp" alt="" />
        <img className="hs-cabin-img" src="/assets/cabin.webp" alt="" />
        <div className="cabin-copy static">
          <h1 className="visually-hidden">EYARA Aviation — a private view of a connected world</h1>
          <p className="cabin-left display" aria-hidden="true">
            <span>A private</span>
            <span>view</span>
          </p>
          <p className="cabin-right display" aria-hidden="true">
            <span>of a</span>
            <span>connected</span>
            <span>world.</span>
          </p>
          <div className="cabin-meta">
            <span>Aviation services</span>
            <span>Dubai, United Arab Emirates</span>
          </div>
        </div>
      </div>
      <div className="hs-frame hs-sky-frame">
        <img className="hs-sky" src="/assets/sky-day.webp" alt="" />
        <div className="statement static">
          <h2 className="st-title">
            <span className="st-line st-line-1">Aviation,</span>
            <span className="st-line st-line-2"><em>beyond</em></span>
            <span className="st-line st-line-3">boundaries.</span>
          </h2>
          <p className="st-sub">
            Private and cargo charter, ACMI leasing, aircraft management and concierge, arranged from Dubai with a
            personal standard of care.
          </p>
        </div>
      </div>
      <div className="hs-frame hs-dusk">
        <div className="dusk-frame">
          <img className="dusk-plate" src="/assets/dusk-plate.webp" alt="" />
          <div className="word-precision">Precision</div>
          <img className="jet" src="/assets/jet.webp" alt="A business jet approaching head-on at dusk (illustrative image)" />
        </div>
        <div className="dusk-caption">
          <span className="eyebrow">The right aircraft, every time</span>
          <p>
            For each mission we source and arrange a suitable aircraft, then oversee the details on the ground and in
            the air.
          </p>
        </div>
      </div>
    </section>
  )
}
