import { scrollToTarget } from '../lib/scroll.js'

const LINKS = [
  ['#approach', 'Approach'],
  ['#solutions', 'Solutions'],
  ['#perspective', 'Perspective'],
]

export default function Nav({ theme }) {
  const go = (e, href) => {
    e.preventDefault()
    scrollToTarget(href)
  }
  return (
    <header className={`nav nav--${theme}`}>
      <a href="#top" className="wordmark" onClick={(e) => go(e, 0)} aria-label="EYARA Aviation, back to top">
        EYARA
      </a>
      <nav aria-label="Primary">
        <ul>
          {LINKS.map(([href, label]) => (
            <li key={href}>
              <a href={href} className="nav-link" onClick={(e) => go(e, href)}>
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <a href="#enquire" className="nav-cta" onClick={(e) => go(e, '#enquire')}>
        <span>Enquire</span>
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </a>
    </header>
  )
}
