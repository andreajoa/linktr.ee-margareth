(() => {
  const ready = (fn) => document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', fn, { once:true })
    : fn();

  ready(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const header = document.querySelector('.site-header');
    const progress = document.getElementById('progressLine');
    const toggle = document.getElementById('menuToggle');
    const nav = document.getElementById('mainNav');

    /* Force-load the current visual corrections, bypassing stale browser/CDN cache. */
    if (!document.querySelector('link[data-homepage-fixes]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/product-covers-fix.css?v=20260909-4';
      link.dataset.homepageFixes = 'true';
      document.head.appendChild(link);
    }

    const fixStyle = document.createElement('style');
    fixStyle.dataset.homepageFix = '20260909-v4';
    fixStyle.textContent = `
      .site-header{
        min-height:96px!important;
        padding:14px 0 13px!important;
        overflow:visible!important;
      }
      .brand{
        padding:5px 0 6px!important;
        line-height:normal!important;
        overflow:visible!important;
        flex-shrink:0;
      }
      .brand-name{
        font-size:31px!important;
        line-height:1.1!important;
        padding-top:2px!important;
        overflow:visible!important;
      }
      .brand-name em{line-height:1.1!important}
      .brand-role{margin-top:5px!important;line-height:1.35!important}

      /* Product cards: complete artwork, no crop. */
      .products .product-media{
        height:360px!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        padding:18px!important;
        overflow:hidden!important;
        background:radial-gradient(circle at 50% 42%,rgba(255,255,255,.98),rgba(248,236,228,.9) 68%,rgba(238,218,205,.8))!important;
      }
      .products .product-media img{
        display:block!important;
        width:auto!important;
        height:auto!important;
        max-width:100%!important;
        max-height:100%!important;
        object-fit:contain!important;
        object-position:center!important;
        border-radius:10px!important;
        box-shadow:0 12px 28px rgba(18,43,67,.14)!important;
        transform:none!important;
      }
      .products .product-card:hover .product-media img{
        transform:translateY(-3px) scale(1.01)!important;
      }
      .products .tag{z-index:3!important}

      /* Real book cover rendered as a physical 3D book. */
      .book-stage{
        perspective:1100px!important;
        perspective-origin:50% 42%!important;
        overflow:visible!important;
        min-height:325px!important;
      }
      .book-stage::after{
        width:240px!important;
        height:38px!important;
        bottom:4px!important;
        background:rgba(59,31,18,.24)!important;
        filter:blur(17px)!important;
        transform:translateX(12px) rotate(-2deg)!important;
      }
      .book-cover-art.real-cover-mode{
        position:relative!important;
        width:218px!important;
        height:320px!important;
        padding:0!important;
        background:none!important;
        border:0!important;
        border-radius:4px 8px 8px 4px!important;
        box-shadow:none!important;
        overflow:visible!important;
        transform-style:preserve-3d!important;
        transform:rotateY(-13deg) rotateX(2.5deg) rotateZ(.4deg)!important;
        transform-origin:48% 70%!important;
        animation:bookFloat3d 5.8s ease-in-out infinite!important;
        isolation:isolate!important;
      }
      .book-cover-art.real-cover-mode::before{
        content:''!important;
        display:block!important;
        position:absolute!important;
        z-index:-2!important;
        top:5px!important;
        right:-13px!important;
        bottom:5px!important;
        width:15px!important;
        border-radius:0 5px 5px 0!important;
        background:repeating-linear-gradient(0deg,rgba(118,86,44,.20) 0 1px,rgba(255,244,208,.95) 1px 3px),linear-gradient(90deg,#d7b875,#fff4d6 62%,#b8833f)!important;
        transform:rotateY(76deg)!important;
        transform-origin:left center!important;
        box-shadow:4px 2px 10px rgba(67,39,19,.16)!important;
      }
      .book-cover-art.real-cover-mode::after{
        content:''!important;
        position:absolute!important;
        z-index:-2!important;
        left:8px!important;
        right:-7px!important;
        bottom:-11px!important;
        height:12px!important;
        border-radius:0 0 5px 4px!important;
        background:repeating-linear-gradient(90deg,rgba(113,80,40,.15) 0 1px,rgba(255,245,215,.96) 1px 4px),#f4dfac!important;
        transform:rotateX(-78deg)!important;
        transform-origin:top center!important;
      }
      .book-cover-art.real-cover-mode .book-spine{
        position:absolute!important;
        z-index:-1!important;
        left:-12px!important;
        top:3px!important;
        bottom:3px!important;
        width:14px!important;
        border-radius:4px 0 0 4px!important;
        background:linear-gradient(90deg,#8d5b22,#c99a4f 45%,#744516)!important;
        transform:rotateY(-72deg)!important;
        transform-origin:right center!important;
      }
      .book-cover-art.real-cover-mode img.real-book-cover{
        position:relative!important;
        z-index:3!important;
        display:block!important;
        width:100%!important;
        height:100%!important;
        object-fit:cover!important;
        object-position:center!important;
        border-radius:4px 8px 8px 4px!important;
        border:1px solid rgba(91,55,25,.22)!important;
        box-shadow:-8px 13px 18px rgba(74,43,22,.16),0 28px 42px rgba(62,32,19,.31)!important;
        backface-visibility:hidden!important;
      }
      .book-spotlight:hover .book-cover-art.real-cover-mode{
        transform:rotateY(-9deg) rotateX(1deg) rotateZ(0) translateY(-4px)!important;
      }
      @keyframes bookFloat3d{
        0%,100%{transform:rotateY(-13deg) rotateX(2.5deg) rotateZ(.4deg) translateY(0)}
        50%{transform:rotateY(-10deg) rotateX(1.5deg) rotateZ(-.2deg) translateY(-10px)}
      }

      /* Mobile art direction: no clipping, no horizontal overflow. */
      @media(max-width:850px){
        html,body{max-width:100%;overflow-x:hidden!important}
        .site-header{min-height:82px!important;padding:11px 0 10px!important}
        .brand{padding:4px 0!important;max-width:calc(100vw - 92px)}
        .brand-name{font-size:27px!important;line-height:1.12!important;white-space:nowrap}
        .brand-role{margin-top:4px!important}
        .hero-copy,.hero-person,.book-spotlight,.caa-card,.mission,.resource-hub{max-width:100%!important}
        .hero-copy h1,.section-heading h2,.specialty-heading h2{overflow-wrap:anywhere}
        .book-spotlight{overflow:visible!important}
        .book-stage{min-height:300px!important;overflow:visible!important}
        .book-cover-art.real-cover-mode{width:194px!important;height:285px!important;transform:rotateY(-10deg) rotateX(2deg)!important}
        .products .product-media{height:330px!important;padding:16px!important}
        .products .product-media img{max-width:100%!important;max-height:100%!important}
        .product-body,.price-row{min-width:0!important}
        .price-row{flex-wrap:wrap!important}
      }

      @media(max-width:560px){
        .site-header{width:calc(100% - 28px)!important}
        .brand-name{font-size:24px!important}
        .welcome-strip p{max-width:94vw}
        .hero{gap:14px!important}
        .hero-copy{padding:34px 22px!important}
        .hero-copy h1{font-size:clamp(46px,14vw,58px)!important;line-height:.9!important}
        .hero-lead{font-size:18px!important}
        .hero-body{font-size:11px!important}
        .social-row{gap:6px!important}
        .social-row a{font-size:8px!important}
        .book-spotlight{grid-template-columns:1fr!important;padding:26px 22px!important;overflow:visible!important}
        .book-copy h2{font-size:34px!important}
        .book-stage{min-height:292px!important;margin-top:4px!important}
        .book-cover-art.real-cover-mode{width:176px!important;height:259px!important}
        .products{padding:30px 14px!important}
        .section-heading h2{font-size:39px!important;line-height:.96!important}
        .product-grid{grid-template-columns:repeat(3,minmax(82vw,82vw))!important;gap:12px!important}
        .product-card{min-height:0!important}
        .products .product-media{height:310px!important;padding:14px!important}
        .product-body{padding:20px 17px!important}
        .product-body h3{font-size:28px!important}
        .product-body p{min-height:0!important;font-size:10px!important}
        .price-row{margin-top:16px!important;align-items:flex-start!important}
        .price-row strong{font-size:27px!important}
        .price-row span{font-size:7px!important;white-space:normal!important;text-align:center!important}
        .resource-grid{grid-template-columns:1fr!important}
        .resource-grid a{min-height:150px!important}
        .mission-copy p{overflow-wrap:anywhere}
        .specialty-grid{grid-template-columns:1fr!important}
        .wa-float{right:14px!important;bottom:14px!important}
      }

      @media(prefers-reduced-motion:reduce){
        .products .product-card:hover .product-media img{transform:none!important}
        .book-cover-art.real-cover-mode{animation:none!important;transform:rotateY(-10deg) rotateX(2deg)!important}
      }
    `;
    document.head.appendChild(fixStyle);

    const bookSpotlight = document.querySelector('.book-spotlight');
    if (bookSpotlight) {
      bookSpotlight.href = 'https://www.amazon.com.br/Dois-Iguais-Segredo-Cora%C3%A7%C3%A3o-identidade/dp/B0H9GKJN2X/ref=tmm_pap_swatch_0';
      bookSpotlight.setAttribute('aria-label', 'Conhecer o livro Os Dois Iguais e o Segredo do Coração na Amazon');
    }

    const coverArt = document.querySelector('.book-cover-art');
    if (coverArt) {
      fetch('/image/os-dois-iguais-cover.b64?v=20260909-2', { cache:'no-store' })
        .then(response => {
          if (!response.ok) throw new Error('book cover asset unavailable');
          return response.text();
        })
        .then(base64 => {
          const clean = base64.trim();
          if (!clean) return;
          coverArt.classList.add('real-cover-mode');
          coverArt.innerHTML = `<span class="book-spine" aria-hidden="true"></span><img class="real-book-cover" src="data:image/jpeg;base64,${clean}" alt="Capa real do livro Os Dois Iguais e o Segredo do Coração">`;
        })
        .catch(() => undefined);
    }

    const syncScroll = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      const pct = Math.min(100, Math.max(0, scrollY / max * 100));
      if (progress) progress.style.height = pct + '%';
      header?.classList.toggle('scrolled', scrollY > 16);
    };
    syncScroll();
    addEventListener('scroll', syncScroll, { passive:true });

    if (toggle && nav) {
      const closeMenu = () => {
        nav.classList.remove('open');
        document.body.classList.remove('menu-open');
        toggle.setAttribute('aria-expanded', 'false');
      };
      toggle.addEventListener('click', () => {
        const open = !nav.classList.contains('open');
        nav.classList.toggle('open', open);
        document.body.classList.toggle('menu-open', open);
        toggle.setAttribute('aria-expanded', String(open));
      });
      nav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
      addEventListener('resize', () => { if (innerWidth > 850) closeMenu(); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
    }

    const revealEls = [...document.querySelectorAll('[data-reveal]')];
    if (reduce || !('IntersectionObserver' in window)) {
      revealEls.forEach(el => el.classList.add('is-visible'));
    } else {
      const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      }, { threshold:.12, rootMargin:'0px 0px -6% 0px' });
      revealEls.forEach(el => io.observe(el));
    }

    if (!reduce && matchMedia('(pointer:fine)').matches) {
      document.querySelectorAll('.tilt').forEach(card => {
        const strength = 5;
        card.addEventListener('pointermove', e => {
          const r = card.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - .5;
          const y = (e.clientY - r.top) / r.height - .5;
          card.style.transform = `perspective(900px) rotateY(${x * strength}deg) rotateX(${-y * strength}deg) translateY(-4px)`;
        });
        card.addEventListener('pointerleave', () => card.style.transform = '');
      });

      document.querySelectorAll('.magnetic').forEach(el => {
        el.addEventListener('pointermove', e => {
          const r = el.getBoundingClientRect();
          const x = (e.clientX - r.left - r.width / 2) / r.width;
          const y = (e.clientY - r.top - r.height / 2) / r.height;
          el.style.transform = `translate(${x * 5}px,${y * 5}px)`;
        });
        el.addEventListener('pointerleave', () => el.style.transform = '');
      });

      const depthEls = [...document.querySelectorAll('[data-depth]')];
      let raf = 0;
      addEventListener('pointermove', e => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const nx = e.clientX / innerWidth - .5;
          const ny = e.clientY / innerHeight - .5;
          depthEls.forEach(el => {
            const d = Number(el.dataset.depth || .3);
            el.style.translate = `${nx * 10 * d}px ${ny * 10 * d}px`;
          });
        });
      }, { passive:true });
    }

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', e => {
        const id = anchor.getAttribute('href');
        if (!id || id === '#') return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block:'start' });
      });
    });
  });
})();