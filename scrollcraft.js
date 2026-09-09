(() => {
  const ready = (fn) => document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', fn, { once: true })
    : fn();

  ready(() => {
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduce = motionPreference.matches;
    motionPreference.addEventListener('change', (event) => { reduce = event.matches; syncScroll(); });
    const header = document.querySelector('.site-header');
    const progress = document.getElementById('progressLine');
    const toggle = document.getElementById('menuToggle');
    const nav = document.getElementById('mainNav');

    const hero = document.querySelector('.hero');
    const mission = document.querySelector('.mission');
    const syncScroll = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      const pct = Math.min(100, Math.max(0, scrollY / max * 100));
      if (progress) progress.style.transform = `scaleY(${pct / 100})`;
      header?.classList.toggle('scrolled', scrollY > 16);
      if (hero) {
        const travel = reduce || innerWidth <= 850 ? 0 : Math.min(1, Math.max(0, -hero.getBoundingClientRect().top / hero.offsetHeight));
        hero.style.setProperty('--hero-travel', travel.toFixed(3));
      }
      if (mission) {
        const rect = mission.getBoundingClientRect();
        const trace = reduce ? 1 : Math.min(1, Math.max(0, (innerHeight - rect.top) / (innerHeight * .65)));
        mission.style.setProperty('--connection-progress', trace.toFixed(3));
      }
    };
    syncScroll();
    let scrollFrame = 0;
    const scheduleScroll = () => {
      if (scrollFrame) return;
      scrollFrame = requestAnimationFrame(() => { scrollFrame = 0; syncScroll(); });
    };
    addEventListener('scroll', scheduleScroll, { passive: true });
    addEventListener('resize', scheduleScroll);
    document.fonts.ready.then(scheduleScroll);

    if (toggle && nav) {
      const closeMenu = () => { nav.classList.remove('open'); document.body.classList.remove('menu-open'); toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Abrir menu'); };
      toggle.addEventListener('click', () => { const open = !nav.classList.contains('open'); nav.classList.toggle('open', open); document.body.classList.toggle('menu-open', open); toggle.setAttribute('aria-expanded', String(open)); toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu'); });
      nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMenu));
      addEventListener('resize', () => { if (innerWidth > 850) closeMenu(); });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('open')) { closeMenu(); toggle.focus(); } });
    }

    const revealEls = [...document.querySelectorAll('[data-reveal]')];
    // Content stays readable before JavaScript and in keyboard navigation.
    document.documentElement.classList.add('motion-ready');
    document.querySelectorAll('.product-card').forEach((card, index) => {
      card.style.setProperty('--entry-delay', `${index * 60}ms`);
      card.setAttribute('data-reveal', '');
      revealEls.push(card);
    });
    document.addEventListener('focusin', (event) => {
      const reveal = event.target.closest('[data-reveal]');
      reveal?.classList.add('is-visible');
    });
    if (reduce || !('IntersectionObserver' in window)) revealEls.forEach((el) => el.classList.add('is-visible'));
    else {
      const io = new IntersectionObserver((entries) => { entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); } }); }, { threshold: .05, rootMargin: '0px 0px -24px 0px' });
      revealEls.forEach((el) => io.observe(el));
    }

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => { const id = anchor.getAttribute('href'); if (!id || id === '#') return; const target = document.querySelector(id); if (!target) return; e.preventDefault(); if (anchor.classList.contains('skip-link')) target.focus({ preventScroll: true }); target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); });
    });
    document.documentElement.classList.add('sc-ready');
  });
})();