import { scrollToTarget } from '../lib/scroll.js'
import { SERVICES } from './Solutions.jsx'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <ul className="footer-services">
          {SERVICES.map((s) => (
            <li key={s.key}>{s.name}</li>
          ))}
        </ul>
        <button type="button" className="text-btn light" onClick={() => scrollToTarget(0)}>
          Back to top ↑
        </button>
      </div>
      <div className="footer-mark" aria-hidden="true">EYARA</div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} EYARA Aviation · Dubai, United Arab Emirates</span>
        <span>Aircraft imagery is illustrative and does not depict aircraft owned or operated by EYARA.</span>
      </div>
    </footer>
  )
}
