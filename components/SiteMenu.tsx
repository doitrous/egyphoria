'use client'

import { useState } from 'react'
import Link from 'next/link'

export type MenuItem = { label: string; href: string }

/**
 * Header: logo -> home, the keyword-named menu (10-internal-linking-menu-footer.md — real
 * search terms, not "Services"), a mobile toggle, and the language switcher. Every link is a
 * real server-rendered `<a>` (via next/link) before any JS runs; the mobile toggle is the only
 * client-side behaviour left, ported from src/client/app.js.
 *
 * V2-PHASE-9b (The Continental Timetable): the language switcher is six two-letter cells in a
 * row — the departure-board convention for a language/platform code — rather than a dropdown.
 * Every cell is a real `<a hreflang>`; the current locale's cell carries `.lang-cell-current`
 * (styled sun-yellow — the one other reserved use of that colour besides the primary action and
 * the board's active row).
 */
export default function SiteMenu({
  lang, homeLabel, items, locales, pathWithoutLang, openMenuLabel, closeMenuLabel, languageLabel,
}: {
  lang: string
  homeLabel: string
  items: MenuItem[]
  locales: { code: string; label: string }[]
  pathWithoutLang: string
  openMenuLabel: string
  closeMenuLabel: string
  languageLabel: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <nav aria-label="Primary" className="site-nav">
      <Link href={`/${lang}`} className="logo" aria-label={homeLabel}>
        Egyphoria
      </Link>
      <button
        type="button"
        className="menu-button"
        aria-expanded={open}
        aria-label={open ? closeMenuLabel : openMenuLabel}
        onClick={() => setOpen((v) => !v)}
      >
        <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true">
          <rect width="18" height="2" fill="currentColor" />
          <rect y="6" width="18" height="2" fill="currentColor" />
          <rect y="12" width="18" height="2" fill="currentColor" />
        </svg>
      </button>
      <div id="main-nav" className={open ? 'open' : ''}>
        <ul>
          {items.map((item) => (
            <li key={item.href}>
              <Link href={item.href} onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <ul className="lang-cells" aria-label={languageLabel}>
          {locales.map((l) => (
            <li key={l.code}>
              <Link
                href={`/${l.code}${pathWithoutLang}`}
                hrefLang={l.code}
                lang={l.code}
                title={l.label}
                aria-current={l.code === lang ? 'true' : undefined}
                className={l.code === lang ? 'lang-cell-current' : undefined}
                onClick={() => setOpen(false)}
              >
                {l.code.toUpperCase()}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
