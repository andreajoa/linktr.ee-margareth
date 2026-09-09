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

    const finalStyle = document.createElement('style');
    finalStyle.dataset.scrollcraftFinal = '20260909-6';
    finalStyle.textContent = `
      .site-header{
        min-height:96px!important;
        padding:14px 0 13px!important;
        overflow:visible!important;
      }
      .brand{
        padding:5px 0 6px!important;
        line-height:normal!important;
        overflow:visible!important;
        flex-shrink:0!important;
      }
      .brand-name{
        display:block!important;
        font-size:31px!important;
        line-height:1.08!important;
        padding-top:2px!important;
        overflow:visible!important;
      }
      .brand-name em{line-height:1.08!important}
      .brand-role{margin-top:5px!important;line-height:1.35!important}

      .book-stage{
        position:relative!important;
        min-height:325px!important;
        display:flex!important;
        align-items:flex-end!important;
        justify-content:center!important;
        overflow:visible!important;
      }
      .book-stage::after{
        content:''!important;
        position:absolute!important;
        z-index:0!important;
        bottom:8px!important;
        width:220px!important;
        height:28px!important;
        border-radius:999px!important;
        background:rgba(55,31,18,.22)!important;
        filter:blur(16px)!important;
      }
      .hero-book-3d{
        position:relative!important;
        z-index:2!important;
        display:block!important;
        width:min(235px,100%)!important;
        height:auto!important;
        max-height:330px!important;
        object-fit:contain!important;
        object-position:center!important;
        filter:drop-shadow(0 24px 34px rgba(58,31,18,.26))!important;
        animation:realBookFloat 5.8s ease-in-out infinite!important;
        transform-origin:50% 80%!important;
      }
      .book-spotlight:hover .hero-book-3d{
        filter:drop-shadow(0 30px 40px rgba(58,31,18,.32))!important;
      }
      @keyframes realBookFloat{
        0%,100%{transform:translateY(0) rotate(.15deg)}
        50%{transform:translateY(-9px) rotate(-.25deg)}
      }

      .products .product-media{
        height:360px!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        padding:18px!important;
        overflow:hidden!important;
        background:radial-gradient(circle at 50% 42%,rgba(255,255,255,.98),rgba(248,236,228,.91) 68%,rgba(238,218,205,.8))!important;
      }
      .products .product-media img{
        display:block!important;
        width:auto!important;
        height:auto!important;
        max-width:100%!important;
        max-height:100%!important;
        object-fit:contain!important;
        object-position:center!important;
        transform:none!important;
        transition:transform .35s ease,filter .35s ease!important;
      }
      .products .product-media img.product-3d{
        border:0!important;
        border-radius:0!important;
        box-shadow:none!important;
        filter:drop-shadow(0 16px 25px rgba(18,43,67,.17))!important;
      }
      .products .product-card:hover .product-media img{
        transform:translateY(-4px) scale(1.012)!important;
      }
      .products .tag{z-index:4!important}

      @media(max-width:850px){
        html,body{max-width:100%!important;overflow-x:hidden!important}
        .site-header{min-height:82px!important;padding:11px 0 10px!important}
        .brand{padding:4px 0!important;max-width:calc(100vw - 92px)!important}
        .brand-name{font-size:27px!important;line-height:1.1!important;white-space:nowrap!important}
        .brand-role{margin-top:4px!important}
        .hero-copy,.hero-person,.book-spotlight,.caa-card,.mission,.resource-hub{max-width:100%!important}
        .hero-copy h1,.section-heading h2,.specialty-heading h2{overflow-wrap:anywhere!important}
        .book-spotlight{overflow:hidden!important}
        .book-stage{min-height:300px!important;overflow:visible!important}
        .hero-book-3d{width:205px!important;max-height:292px!important}
        .products .product-media{height:330px!important;padding:16px!important}
        .product-body,.price-row{min-width:0!important}
        .price-row{flex-wrap:wrap!important}
      }

      @media(max-width:560px){
        .site-header{width:calc(100% - 28px)!important;min-height:78px!important}
        .brand-name{font-size:24px!important;line-height:1.12!important}
        .welcome-strip p{max-width:94vw!important}
        .hero{gap:14px!important}
        .hero-copy{padding:34px 22px!important}
        .hero-copy h1{font-size:clamp(46px,14vw,58px)!important;line-height:.9!important}
        .hero-lead{font-size:18px!important}
        .hero-body{font-size:11px!important}
        .social-row{gap:6px!important}
        .social-row a{font-size:8px!important}
        .book-spotlight{grid-template-columns:1fr!important;padding:26px 22px!important;border-radius:27px!important}
        .book-copy h2{font-size:34px!important}
        .book-stage{min-height:285px!important;margin-top:4px!important}
        .hero-book-3d{width:185px!important;max-height:270px!important}
        .products{padding:30px 14px!important}
        .section-heading h2{font-size:39px!important;line-height:.96!important}
        .product-grid{
          display:grid!important;
          grid-template-columns:1fr!important;
          gap:14px!important;
          overflow:visible!important;
          margin-right:0!important;
          padding-bottom:0!important;
          scroll-snap-type:none!important;
        }
        .product-card{width:100%!important;min-width:0!important;min-height:0!important;scroll-snap-align:none!important}
        .products .product-media{height:310px!important;padding:14px!important}
        .product-body{padding:20px 17px!important}
        .product-body h3{font-size:28px!important}
        .product-body p{min-height:0!important;font-size:10px!important}
        .price-row{margin-top:16px!important;align-items:flex-start!important}
        .price-row strong{font-size:27px!important}
        .price-row span{font-size:7px!important;white-space:normal!important;text-align:center!important}
        .resource-grid{grid-template-columns:1fr!important}
        .resource-grid a{min-height:150px!important}
        .mission-copy p{overflow-wrap:anywhere!important}
        .specialty-grid{grid-template-columns:1fr!important}
        .wa-float{right:14px!important;bottom:14px!important}
      }

      @media(prefers-reduced-motion:reduce){
        .hero-book-3d{animation:none!important}
        .products .product-card:hover .product-media img{transform:none!important}
      }
    `;
    document.head.appendChild(finalStyle);

    const syncScroll = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      const pct = Math.min(100, Math.max(0, scrollY / max * 100));
      if (progress) progress.style.height = pct + '%';
      header?.classList.toggle('scrolled', scrollY > 16);
    };
    syncScroll();
    addEventListener('scroll', syncScroll, { passive: true });

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
      }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
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
      }, { passive: true });
    }

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', e => {
        const id = anchor.getAttribute('href');
        if (!id || id === '#') return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      });
    });
  });
})();