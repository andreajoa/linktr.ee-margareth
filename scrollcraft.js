(() => {
  const ready = (fn) => document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', fn, { once:true })
    : fn();

  ready(() => {
    document.body.classList.add('scrollcraft-v2');

    const wrap = document.querySelector('.wrap');
    const hero = document.querySelector('.hero');
    const promo = document.querySelector('.book-promo');
    const caa = document.querySelector('.caa-feature');
    const amor = document.querySelector('.amor-feature');
    const ebook = document.querySelector('.ebook-feature');
    const product = document.querySelector('.product-feature');
    const carousel = document.querySelector('.carousel-wrap');

    if (wrap && hero && !document.querySelector('.sc-hero-stage')) {
      const stage = document.createElement('section');
      stage.className = 'sc-hero-stage sc-reveal';
      stage.id = 'inicio';
      wrap.insertBefore(stage, hero);
      stage.appendChild(hero);
      if (promo) stage.appendChild(promo);

      const profile = document.createElement('div');
      profile.className = 'sc-profile';
      [
        '.photo-frame', '.hero-eyebrow', '.hero-name', '.hero-role',
        '.hero-tagline', '.rule', '.socials'
      ].forEach(selector => {
        const el = hero.querySelector(selector);
        if (el) profile.appendChild(el);
      });

      const intro = document.createElement('div');
      intro.className = 'sc-intro';
      intro.innerHTML = `
        <div class="sc-kicker">Educação que acolhe · desenvolvimento que transforma</div>
        <h1>Que bom ter <em>você aqui!</em></h1>
        <p>Toda criança merece ser compreendida, amada e ter o suporte certo para florescer. Aqui você encontra recursos, orientação e ferramentas para o neurodesenvolvimento com ciência, sensibilidade e propósito.</p>
        <div class="sc-actions">
          <a href="#recursos" class="sc-btn sc-btn-primary">Conheça meu trabalho →</a>
          <a href="#sobre" class="sc-btn sc-btn-ghost">Sobre mim</a>
        </div>`;

      hero.appendChild(intro);
      hero.appendChild(profile);
      profile.id = 'sobre';
    }

    if (caa) {
      caa.id = 'recursos';
      caa.classList.add('sc-reveal');
    }

    if (amor && ebook && product && !document.querySelector('.sc-products')) {
      const section = document.createElement('section');
      section.className = 'sc-products sc-reveal';
      section.id = 'materiais';
      section.innerHTML = `
        <div class="sc-section-head">
          <div>
            <div class="sc-kicker">Produtos e recursos em destaque</div>
            <h2>Conhecimento que apoia, inspira e <em>transforma</em></h2>
          </div>
          <a href="#acessos">Ver todos os recursos →</a>
        </div>
        <div class="sc-product-grid"></div>`;
      caa?.insertAdjacentElement('afterend', section);
      const grid = section.querySelector('.sc-product-grid');
      [amor, ebook, product].forEach((el, i) => {
        el.classList.add('sc-product-card', 'sc-reveal');
        el.style.setProperty('--sc-delay', `${i * 90}ms`);
        grid.appendChild(el);
      });
    }

    if (carousel) {
      carousel.classList.add('sc-mission', 'sc-reveal');
      carousel.setAttribute('aria-label', 'Mensagens de acolhimento e orientação');
    }

    const sectionHeads = [...document.querySelectorAll('.sect-head')];
    const accessHead = sectionHeads.find(h => /Destaques/i.test(h.textContent || ''));
    if (accessHead) accessHead.id = 'acessos';

    document.querySelectorAll('.links').forEach((el, i) => {
      el.classList.add('sc-resource-grid', 'sc-reveal');
      if (i === 0) el.closest('.sect-head')?.setAttribute('id', 'acessos');
    });

    document.querySelectorAll('.lnk').forEach((el, i) => {
      el.classList.add('sc-resource-card');
      el.style.setProperty('--sc-delay', `${(i % 4) * 55}ms`);
    });

    document.querySelector('.footer')?.classList.add('sc-footer');
    document.querySelector('.marquee-wrap')?.classList.add('sc-marquee');
    document.querySelector('.pills')?.classList.add('sc-pills');

    if (!document.querySelector('.sc-living-thread')) {
      const thread = document.createElement('div');
      thread.className = 'sc-living-thread';
      thread.setAttribute('aria-hidden', 'true');
      thread.innerHTML = `<svg viewBox="0 0 1000 1000" preserveAspectRatio="none"><defs><linearGradient id="scThreadGradient"><stop offset="0" stop-color="#C88664" stop-opacity=".04"/><stop offset=".48" stop-color="#E8A060" stop-opacity=".8"/><stop offset="1" stop-color="#C88664" stop-opacity=".05"/></linearGradient></defs><path pathLength="1" d="M920 -70 C760 120 990 260 810 390 S650 650 850 745 S760 930 920 1080"/></svg>`;
      document.body.appendChild(thread);
    }

    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const reveal = document.querySelectorAll('.sc-reveal');
    if (!reduce && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('sc-in');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold:.1, rootMargin:'0px 0px -6% 0px' });
      reveal.forEach(el => observer.observe(el));
    } else reveal.forEach(el => el.classList.add('sc-in'));

    const threadPath = document.querySelector('.sc-living-thread path');
    let ticking = false;
    const paintScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
        const progress = Math.min(1, Math.max(0, scrollY / max));
        if (threadPath && !reduce) threadPath.style.strokeDashoffset = String(1 - progress);
        document.body.classList.toggle('sc-scrolled', scrollY > 28);
        ticking = false;
      });
    };
    addEventListener('scroll', paintScroll, { passive:true });
    paintScroll();

    if (!reduce && matchMedia('(hover:hover) and (pointer:fine)').matches) {
      const stage = document.querySelector('.sc-hero-stage');
      stage?.addEventListener('pointermove', e => {
        const r = stage.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5;
        const y = (e.clientY - r.top) / r.height - .5;
        const photo = stage.querySelector('.photo-frame');
        const book = stage.querySelector('.book-promo');
        if (photo) photo.style.translate = `${x * -8}px ${y * -7}px`;
        if (book) book.style.translate = `${x * 7}px ${y * 6}px`;
      });
      stage?.addEventListener('pointerleave', () => {
        stage.querySelectorAll('.photo-frame,.book-promo').forEach(el => el.style.translate = '');
      });

      document.querySelectorAll('.sc-product-card').forEach(card => {
        card.addEventListener('pointermove', e => {
          const r = card.getBoundingClientRect();
          const rx = ((e.clientY-r.top)/r.height-.5)*-3.2;
          const ry = ((e.clientX-r.left)/r.width-.5)*4;
          card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-5px)`;
        });
        card.addEventListener('pointerleave', () => card.style.transform = '');
      });
    }
  });
})();