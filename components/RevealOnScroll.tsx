'use client'

import { useEffect } from 'react'

// Ported from the old static build's src/motion.js. Progressive enhancement: every [data-reveal]
// section is visible without JavaScript (server-rendered, no `hidden`), and this only adds the
// fade/slide-in class once IntersectionObserver is available and the visitor hasn't asked for
// reduced motion. Mounted once, at the [lang] layout, same as <ShareBlock/>.
export default function RevealOnScroll() {
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!('IntersectionObserver' in window)) return

    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'))
    let observer: IntersectionObserver | undefined

    function configureMotion() {
      observer?.disconnect()
      sections.forEach((section) => section.classList.remove('reveal-pending'))
      if (preference.matches) return
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.remove('reveal-pending')
              observer?.unobserve(entry.target)
            }
          }
        },
        { threshold: 0, rootMargin: '0px 0px -32px 0px' },
      )
      for (const section of sections) {
        if (section.getBoundingClientRect().top >= window.innerHeight) {
          section.classList.add('reveal-pending')
          observer.observe(section)
        }
      }
    }

    configureMotion()
    preference.addEventListener('change', configureMotion)

    const onFocusIn = (event: FocusEvent) => {
      const section = (event.target as HTMLElement)?.closest?.('[data-reveal]')
      if (section) {
        section.classList.remove('reveal-pending')
        observer?.unobserve(section)
      }
    }
    document.addEventListener('focusin', onFocusIn)

    const onHashChange = () => {
      const target = document.getElementById(window.location.hash.slice(1))
      if (!target) return
      for (const section of sections) {
        if (section === target || target.contains(section)) {
          section.classList.remove('reveal-pending')
          observer?.unobserve(section)
        }
      }
    }
    window.addEventListener('hashchange', onHashChange)

    return () => {
      observer?.disconnect()
      preference.removeEventListener('change', configureMotion)
      document.removeEventListener('focusin', onFocusIn)
      window.removeEventListener('hashchange', onHashChange)
    }
  }, [])

  return null
}
