// Progressive enhancement: all content is visible without JavaScript or motion.
(() => {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!('IntersectionObserver' in window)) return;
  const sections = [...document.querySelectorAll('[data-reveal]')];
  let observer;
  function configureMotion() {
    observer?.disconnect();
    sections.forEach(section => section.classList.remove('reveal-pending'));
    if (preference.matches) return;
    observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.remove('reveal-pending');
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: 0, rootMargin: '0px 0px -32px 0px' });
    for (const section of sections) {
      // Keep initial viewport and restored scroll positions immediately readable.
      if (section.getBoundingClientRect().top >= window.innerHeight) {
        section.classList.add('reveal-pending');
        observer.observe(section);
      }
    }
  }
  configureMotion();
  preference.addEventListener('change', configureMotion);
  document.addEventListener('focusin', event => {
    const section = event.target.closest('[data-reveal]');
    if (section) {
      section.classList.remove('reveal-pending');
      observer?.unobserve(section);
    }
  });
  // Anchor navigation must never land on concealed content.
  window.addEventListener('hashchange', () => {
    const target = document.getElementById(window.location.hash.slice(1));
    if (!target) return;
    for (const section of sections) {
      if (section === target || target.contains(section)) {
        section.classList.remove('reveal-pending');
        observer?.unobserve(section);
      }
    }
  });
})();
