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

    /* Homepage visual fixes: keep the logo fully visible and use the real book cover. */
    const fixStyle = document.createElement('style');
    fixStyle.dataset.homepageFix = '20260909';
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
      .brand-role{
        margin-top:5px!important;
        line-height:1.35!important;
      }
      .book-cover-art.real-cover-mode{
        width:205px!important;
        height:301px!important;
        padding:0!important;
        background:none!important;
        border:0!important;
        border-radius:4px 9px 9px 4px!important;
        box-shadow:none!important;
        overflow:visible!important;
      }
      .book-cover-art.real-cover-mode::before{display:none!important}
      .book-cover-art.real-cover-mode::after{
        content:'';
        position:absolute;
        z-index:-1;
        top:7px;
        right:-10px;
        bottom:7px;
        width:12px;
        border-radius:0 6px 6px 0;
        background:linear-gradient(90deg,#e8c991,#fff2cf 58%,#c9985c);
        box-shadow:3px 5px 10px rgba(75,45,23,.18);
      }
      .book-cover-art.real-cover-mode img.real-book-cover{
        display:block;
        width:100%!important;
        height:100%!important;
        object-fit:cover!important;
        object-position:left center!important;
        border-radius:4px 9px 9px 4px!important;
        border:1px solid rgba(98,61,29,.18)!important;
        box-shadow:-8px 8px 0 #e4c589,0 26px 36px rgba(62,32,19,.30)!important;
      }
      @media(max-width:850px){
        .site-header{min-height:82px!important;padding:11px 0 10px!important}
        .brand{padding:4px 0!important}
        .brand-name{font-size:27px!important;line-height:1.12!important}
        .brand-role{margin-top:4px!important}
      }
    `;
    document.head.appendChild(fixStyle);

    const coverArt = document.querySelector('.book-cover-art');
    if (coverArt) {
      fetch('/image/os-dois-iguais-cover.b64', { cache:'force-cache' })
        .then(response => {
          if (!response.ok) throw new Error('book cover asset unavailable');
          return response.text();
        })
        .then(base64 => {
          const clean = base64.trim();
          if (!clean) return;
          coverArt.classList.add('real-cover-mode');
          coverArt.innerHTML = `<img class="real-book-cover" src="data:image/jpeg;base64,${clean}" alt="Capa real do livro Os Dois Iguais e o Segredo do Coração">`;
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