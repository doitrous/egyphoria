'use client'

import { useState } from 'react'
import Link from 'next/link'

export type MenuItem = { label: string; href: string }

/**
 * Header: logo -> home, the keyword-named menu (10-internal-linking-menu-footer.md — real
 * search terms, not "Services"), a mobile toggle, and the language switcher. Every link is a
 * real server-rendered `<a>` (via next/link) before any JS runs; the toggle and the "current
 * locale" dropdown state are the only client-side behaviour, ported from src/client/app.js.
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
  const [langOpen, setLangOpen] = useState(false)

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
        ☰
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
        <div className={`lang-switcher${langOpen ? ' open' : ''}`}>
          <button type="button" className="lang-button" aria-expanded={langOpen} aria-label={languageLabel} onClick={() => setLangOpen((v) => !v)}>
            {lang.toUpperCase()}
          </button>
          <ul>
            {locales.map((l) => (
              <li key={l.code}>
                <Link href={`/${l.code}${pathWithoutLang}`} hrefLang={l.code} aria-current={l.code === lang ? 'true' : undefined}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  )
}
