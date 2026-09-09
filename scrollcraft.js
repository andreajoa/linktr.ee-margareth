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
    style.dataset.homepageFix = '20260909-v5-3d-assets';
    style.textContent = `
      html,body{max-width:100%;overflow-x:hidden!important}

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

      /* Real 3D book asset in the hero. */
      .book-stage{
        min-height:330px!important;
        display:flex!important;
        align-items:flex-end!important;
        justify-content:center!important;
        overflow:visible!important;
      }
      .book-stage::after{display:none!important}
      .book-cover-art.real-cover-mode{
        width:min(100%,275px)!important;
        height:auto!important;
        padding:0!important;
        margin:0 auto!important;
        display:block!important;
        overflow:visible!important;
        background:none!important;
        border:0!important;
        border-radius:0!important;
        box-shadow:none!important;
        animation:none!important;
      }
      .book-cover-art.real-cover-mode::before,
      .book-cover-art.real-cover-mode::after{display:none!important}
      .hero-book-3d{
        display:block!important;
        width:100%!important;
        height:auto!important;
        max-height:330px!important;
        object-fit:contain!important;
        object-position:center bottom!important;
        filter:drop-shadow(0 22px 24px rgba(63,32,19,.27))!important;
        transform-origin:50% 85%!important;
        animation:bookAssetFloat 5.8s ease-in-out infinite!important;
      }
      @keyframes bookAssetFloat{
        0%,100%{transform:translateY(0) rotate(-.25deg)}
        50%{transform:translateY(-9px) rotate(.35deg)}
      }

      /* Product artwork: full object, never cropped. */
      .products .product-media{
        height:370px!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        padding:22px!important;
        overflow:hidden!important;
        background:radial-gradient(circle at 50% 42%,rgba(255,255,255,.99),rgba(248,236,228,.92) 66%,rgba(238,218,205,.82))!important;
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
      }
      .products .product-media img.product-asset-3d{
        width:auto!important;
        max-width:94%!important;
        max-height:96%!important;
        border-radius:0!important;
        box-shadow:none!important;
        filter:drop-shadow(0 16px 18px rgba(18,43,67,.22))!important;
      }
      .products .product-card:hover .product-media img.product-asset-3d{
        transform:translateY(-4px) scale(1.015)!important;
      }
      .products .tag{z-index:4!important}

      @media(max-width:850px){
        .site-header{min-height:82px!important;padding:11px 0 10px!important}
        .brand{padding:4px 0!important;max-width:calc(100vw - 92px)}
        .brand-name{font-size:27px!important;line-height:1.12!important;white-space:nowrap}
        .brand-role{margin-top:4px!important}
        .hero-copy,.hero-person,.book-spotlight,.caa-card,.mission,.resource-hub{max-width:100%!important}
        .hero-copy h1,.section-heading h2,.specialty-heading h2{overflow-wrap:anywhere}
        .book-spotlight{overflow:hidden!important}
        .book-stage{min-height:300px!important}
        .book-cover-art.real-cover-mode{width:min(72vw,245px)!important}
        .hero-book-3d{max-height:300px!important}
        .product-grid{grid-template-columns:1fr!important;gap:18px!important}
        .product-card{width:100%!important;min-width:0!important}
        .products .product-media{height:390px!important;padding:24px!important}
        .products .product-media img.product-asset-3d{max-width:min(88%,340px)!important;max-height:100%!important}
        .product-body,.price-row{min-width:0!important}
        .price-row{flex-wrap:wrap!important}
      }

      @media(max-width:560px){
        .site-header{width:calc(100% - 28px)!important}
        .brand-name{font-size:24px!important}
        .welcome-strip{padding-inline:12px!important;text-align:center}
        .welcome-strip p{max-width:94vw}
        .hero{gap:14px!important}
        .hero-copy{padding:34px 22px!important}
        .hero-copy h1{font-size:clamp(46px,14vw,58px)!important;line-height:.9!important}
        .hero-lead{font-size:18px!important}
        .hero-body{font-size:11px!important}
        .social-row{gap:6px!important}
        .social-row a{font-size:8px!important}
        .book-spotlight{grid-template-columns:1fr!important;padding:26px 22px!important}
        .book-copy h2{font-size:34px!important}
        .book-stage{min-height:278px!important;margin-top:8px!important}
        .book-cover-art.real-cover-mode{width:min(72vw,220px)!important}
        .hero-book-3d{max-height:278px!important}
        .products{padding:30px 14px!important}
        .section-heading h2{font-size:39px!important;line-height:.96!important}
        .product-grid{display:grid!important;grid-template-columns:1fr!important;gap:16px!important;overflow:visible!important}
        .product-card{width:100%!important;min-width:0!important;min-height:0!important}
        .products .product-media{height:340px!important;padding:18px!important}
        .products .product-media img.product-asset-3d{max-width:min(90%,300px)!important;max-height:100%!important}
        .product-body{padding:20px 17px!important}
        .product-body h3{font-size:28px!important}
        .product-body p{min-height:0!important;font-size:10px!important}
        .price-row{margin-top:16px!important;align-items:flex-start!important;gap:10px!important}
        .price-row strong{font-size:27px!important}
        .price-row span{font-size:7px!important;white-space:normal!important;text-align:center!important}
        .resource-grid{grid-template-columns:1fr!important}
        .resource-grid a{min-height:150px!important}
        .mission-copy p{overflow-wrap:anywhere}
        .specialty-grid{grid-template-columns:1fr!important}
        .wa-float{right:14px!important;bottom:14px!important}
      }

      @media(prefers-reduced-motion:reduce){
        .hero-book-3d{animation:none!important}
        .products .product-card:hover .product-media img.product-asset-3d{transform:none!important}
      }
    `;
    document.head.appendChild(style);

    const loadBase64Image = async (path, mime = 'image/webp') => {
      const response = await fetch(`${path}?v=20260909-5`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Asset unavailable: ${path}`);
      const base64 = (await response.text()).trim();
      if (!base64) throw new Error(`Empty asset: ${path}`);
      return `data:${mime};base64,${base64}`;
    };

    const bookSpotlight = document.querySelector('.book-spotlight');
    if (bookSpotlight) {
      bookSpotlight.href = 'https://www.amazon.com.br/Dois-Iguais-Segredo-Cora%C3%A7%C3%A3o-identidade/dp/B0H9GKJN2X/ref=tmm_pap_swatch_0';
      bookSpotlight.setAttribute('aria-label', 'Conhecer o livro Os Dois Iguais e o Segredo do Coração na Amazon');
    }

    const coverArt = document.querySelector('.book-cover-art');
    if (coverArt) {
      loadBase64Image('/image/os-dois-iguais-3d.webp.b64')
        .then(src => {
          coverArt.classList.add('real-cover-mode');
          coverArt.removeAttribute('aria-hidden');
          coverArt.innerHTML = `<img class="hero-book-3d" src="${src}" alt="Livro Os Dois Iguais e o Segredo do Coração em mockup 3D">`;
        })
        .catch(() => {
          /* Keep the existing illustrated fallback if the asset cannot be loaded. */
        });
    }

    const productCards = [...document.querySelectorAll('.product-card')];
    const replaceProductAsset = (title, path, alt) => {
      const card = productCards.find(item => item.querySelector('h3')?.textContent.trim() === title);
      const image = card?.querySelector('.product-media img');
      if (!image) return;
      loadBase64Image(path)
        .then(src => {
          image.src = src;
          image.alt = alt;
          image.classList.add('product-asset-3d');
          image.removeAttribute('width');
          image.removeAttribute('height');
        })
        .catch(() => {
          /* Preserve the current cover as a safe fallback. */
        });
    };

    replaceProductAsset(
      'Não Era Falta de Amor',
      '/image/nao-era-falta-de-amor-3d.webp.b64',
      'Não Era Falta de Amor em mockup 3D'
    );
    replaceProductAsset(
      'Descubra os Sentidos',
      '/image/descubra-os-sentidos-3d.webp.b64',
      'Descubra os Sentidos em mockup 3D'
    );

    const syncScroll = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      const pct = Math.min(100, Math.max(0, scrollY / max * 100));
      if (progress) progress.style.height = `${pct}%`;
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
        card.addEventListener('pointerleave', () => { card.style.transform = ''; });
      });

      document.querySelectorAll('.magnetic').forEach(el => {
        el.addEventListener('pointermove', e => {
          const r = el.getBoundingClientRect();
          const x = (e.clientX - r.left - r.width / 2) / r.width;
          const y = (e.clientY - r.top - r.height / 2) / r.height;
          el.style.transform = `translate(${x * 5}px,${y * 5}px)`;
        });
        el.addEventListener('pointerleave', () => { el.style.transform = ''; });
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
