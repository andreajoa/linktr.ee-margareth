(() => {
  const ready = (fn) => document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', fn, { once: true })
    : fn();

  ready(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const header = document.querySelector('.site-header');
    const progress = document.getElementById('progressLine');
    const toggle = document.getElementById('menuToggle');
    const nav = document.getElementById('mainNav');

    const style = document.createElement('style');
    style.dataset.scrollcraftFinal = '20260909-7';
    style.textContent = `
      .site-header{min-height:96px!important;padding:14px 0 13px!important;overflow:visible!important}
      .brand{padding:5px 0 6px!important;line-height:normal!important;overflow:visible!important;flex-shrink:0!important}
      .brand-name{display:block!important;font-size:31px!important;line-height:1.08!important;padding-top:2px!important;overflow:visible!important}
      .brand-name em{line-height:1.08!important}
      .brand-role{margin-top:5px!important;line-height:1.35!important}
      .book-stage{position:relative!important;min-height:325px!important;display:flex!important;align-items:flex-end!important;justify-content:center!important;overflow:visible!important;perspective:1100px!important}
      .book-stage::after{content:''!important;position:absolute!important;bottom:5px!important;width:220px!important;height:30px!important;border-radius:50%!important;background:rgba(55,31,18,.22)!important;filter:blur(15px)!important}
      .hero-book-shell{position:relative!important;z-index:2!important;width:205px!important;aspect-ratio:217/319!important;transform-style:preserve-3d!important;transform:rotateY(-10deg) rotateX(1.5deg)!important;animation:bookFloatReal 5.8s ease-in-out infinite!important}
      .hero-book-shell::before{content:'';position:absolute;z-index:-1;top:5px;right:-12px;bottom:5px;width:14px;border-radius:0 5px 5px 0;background:repeating-linear-gradient(0deg,rgba(115,83,43,.18) 0 1px,#fff5dd 1px 3px);transform:rotateY(75deg);transform-origin:left center;box-shadow:4px 3px 10px rgba(66,38,20,.14)}
      .hero-book-shell::after{content:'';position:absolute;z-index:-1;left:7px;right:-6px;bottom:-10px;height:11px;border-radius:0 0 5px 4px;background:repeating-linear-gradient(90deg,rgba(115,83,43,.14) 0 1px,#fff5dd 1px 4px);transform:rotateX(-76deg);transform-origin:top center}
      .hero-book-cover{display:block!important;width:100%!important;height:100%!important;object-fit:cover!important;border-radius:4px 8px 8px 4px!important;border:1px solid rgba(91,55,25,.2)!important;box-shadow:-7px 12px 18px rgba(74,43,22,.14),0 26px 38px rgba(62,32,19,.28)!important;opacity:0!important;transition:opacity .2s ease!important}
      .hero-book-cover.loaded{opacity:1!important}
      @keyframes bookFloatReal{0%,100%{transform:rotateY(-10deg) rotateX(1.5deg) translateY(0)}50%{transform:rotateY(-8deg) rotateX(1deg) translateY(-8px)}}
      .products .product-media{height:360px!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:18px!important;overflow:hidden!important;background:radial-gradient(circle at 50% 42%,rgba(255,255,255,.98),rgba(248,236,228,.92) 68%,rgba(238,218,205,.82))!important;perspective:1000px!important}
      .product-book-shell{position:relative!important;width:min(72%,235px)!important;height:calc(100% - 18px)!important;display:flex!important;align-items:center!important;justify-content:center!important;transform-style:preserve-3d!important;transform:rotateY(-7deg) rotateX(1deg)!important;transition:transform .35s ease!important}
      .product-book-shell::before{content:'';position:absolute;z-index:-1;top:7%;right:-9px;bottom:7%;width:11px;border-radius:0 4px 4px 0;background:repeating-linear-gradient(0deg,rgba(106,77,41,.16) 0 1px,#fff6e3 1px 3px);transform:rotateY(76deg);transform-origin:left center;box-shadow:3px 2px 8px rgba(41,28,19,.12)}
      .product-book-shell::after{content:'';position:absolute;z-index:-1;left:7%;right:-5px;bottom:2%;height:9px;background:repeating-linear-gradient(90deg,rgba(106,77,41,.14) 0 1px,#fff6e3 1px 4px);transform:rotateX(-77deg);transform-origin:top center}
      .product-book-shell img{display:block!important;width:auto!important;height:auto!important;max-width:100%!important;max-height:100%!important;object-fit:contain!important;object-position:center!important;border-radius:5px!important;box-shadow:0 18px 30px rgba(18,43,67,.17)!important}
      .product-card:hover .product-book-shell{transform:rotateY(-4deg) rotateX(.5deg) translateY(-4px)!important}
      .products .tag{z-index:5!important}
      .products .product-media>img{display:block!important;width:auto!important;height:auto!important;max-width:100%!important;max-height:100%!important;object-fit:contain!important;object-position:center!important}
      @media(max-width:850px){html,body{max-width:100%!important;overflow-x:hidden!important}.site-header{min-height:82px!important;padding:11px 0 10px!important}.brand{padding:4px 0!important;max-width:calc(100vw - 92px)!important}.brand-name{font-size:27px!important;line-height:1.1!important;white-space:nowrap!important}.brand-role{margin-top:4px!important}.hero-copy,.hero-person,.book-spotlight,.caa-card,.mission,.resource-hub{max-width:100%!important}.hero-copy h1,.section-heading h2,.specialty-heading h2{overflow-wrap:anywhere!important}.book-stage{min-height:295px!important}.hero-book-shell{width:185px!important}.products .product-media{height:330px!important;padding:16px!important}.product-body,.price-row{min-width:0!important}.price-row{flex-wrap:wrap!important}}
      @media(max-width:560px){.site-header{width:calc(100% - 28px)!important;min-height:78px!important}.brand-name{font-size:24px!important;line-height:1.12!important}.welcome-strip p{max-width:94vw!important}.hero{gap:14px!important}.hero-copy{padding:34px 22px!important}.hero-copy h1{font-size:clamp(46px,14vw,58px)!important;line-height:.9!important}.hero-lead{font-size:18px!important}.hero-body{font-size:11px!important}.book-spotlight{grid-template-columns:1fr!important;padding:26px 22px!important;border-radius:27px!important}.book-copy h2{font-size:34px!important}.book-stage{min-height:275px!important;margin-top:4px!important}.hero-book-shell{width:170px!important}.products{padding:30px 14px!important}.section-heading h2{font-size:39px!important;line-height:.96!important}.product-grid{display:grid!important;grid-template-columns:1fr!important;gap:14px!important;overflow:visible!important;margin-right:0!important;padding-bottom:0!important;scroll-snap-type:none!important}.product-card{width:100%!important;min-width:0!important;min-height:0!important;scroll-snap-align:none!important}.products .product-media{height:300px!important;padding:14px!important}.product-book-shell{width:min(70%,210px)!important;height:calc(100% - 14px)!important}.product-body{padding:20px 17px!important}.product-body h3{font-size:28px!important}.product-body p{min-height:0!important;font-size:10px!important}.price-row{margin-top:16px!important;align-items:flex-start!important}.price-row strong{font-size:27px!important}.price-row span{font-size:7px!important;white-space:normal!important;text-align:center!important}.resource-grid{grid-template-columns:1fr!important}.specialty-grid{grid-template-columns:1fr!important}.wa-float{right:14px!important;bottom:14px!important}}
      @media(prefers-reduced-motion:reduce){.hero-book-shell{animation:none!important}.product-card:hover .product-book-shell{transform:rotateY(-7deg) rotateX(1deg)!important}}
    `;
    document.head.appendChild(style);

    const heroBook = document.getElementById('heroBookCover');
    if (heroBook) {
      fetch('/image/os-dois-iguais-cover.b64?v=20260909-7', { cache: 'no-store' })
        .then((r) => { if (!r.ok) throw new Error('cover'); return r.text(); })
        .then((b64) => {
          const clean = b64.trim();
          if (!clean) throw new Error('empty');
          heroBook.onload = () => heroBook.classList.add('loaded');
          heroBook.src = `data:image/jpeg;base64,${clean}`;
        })
        .catch(() => { heroBook.alt = 'Os Dois Iguais e o Segredo do Coração'; });
    }

    const syncScroll = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      const pct = Math.min(100, Math.max(0, scrollY / max * 100));
      if (progress) progress.style.height = pct + '%';
      header?.classList.toggle('scrolled', scrollY > 16);
    };
    syncScroll();
    addEventListener('scroll', syncScroll, { passive: true });

    if (toggle && nav) {
      const closeMenu = () => { nav.classList.remove('open'); document.body.classList.remove('menu-open'); toggle.setAttribute('aria-expanded', 'false'); };
      toggle.addEventListener('click', () => { const open = !nav.classList.contains('open'); nav.classList.toggle('open', open); document.body.classList.toggle('menu-open', open); toggle.setAttribute('aria-expanded', String(open)); });
      nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMenu));
      addEventListener('resize', () => { if (innerWidth > 850) closeMenu(); });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
    }

    const revealEls = [...document.querySelectorAll('[data-reveal]')];
    if (reduce || !('IntersectionObserver' in window)) revealEls.forEach((el) => el.classList.add('is-visible'));
    else {
      const io = new IntersectionObserver((entries) => { entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); } }); }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
      revealEls.forEach((el) => io.observe(el));
    }

    if (!reduce && matchMedia('(pointer:fine)').matches) {
      document.querySelectorAll('.tilt').forEach((card) => {
        card.addEventListener('pointermove', (e) => { const r = card.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - .5; const y = (e.clientY - r.top) / r.height - .5; card.style.transform = `perspective(900px) rotateY(${x * 4}deg) rotateX(${-y * 4}deg) translateY(-3px)`; });
        card.addEventListener('pointerleave', () => { card.style.transform = ''; });
      });
      document.querySelectorAll('.magnetic').forEach((el) => {
        el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); const x = (e.clientX - r.left - r.width / 2) / r.width; const y = (e.clientY - r.top - r.height / 2) / r.height; el.style.transform = `translate(${x * 4}px,${y * 4}px)`; });
        el.addEventListener('pointerleave', () => { el.style.transform = ''; });
      });
    }

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => { const id = anchor.getAttribute('href'); if (!id || id === '#') return; const target = document.querySelector(id); if (!target) return; e.preventDefault(); target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); });
    });
  });
})();