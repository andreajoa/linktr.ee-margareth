(() => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const progress = document.getElementById('scrollProgress');
      const dot = document.getElementById('journeyDot');
      const rail = dot?.parentElement;

      function updateScroll(){
        const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
        const p = Math.min(1, Math.max(0, scrollY / max));
        if(progress) progress.style.transform = `scaleX(${p})`;
        if(dot && rail && innerWidth > 1050){
          const travel = Math.max(0, rail.clientHeight - dot.offsetHeight);
          dot.style.transform = `translateY(${Math.round(travel * p)}px)`;
        }
      }
      addEventListener('scroll', updateScroll, {passive:true});
      addEventListener('resize', updateScroll, {passive:true});
      updateScroll();

      const revealItems = document.querySelectorAll('.reveal,[data-stagger]');
      if(reduce){ revealItems.forEach(el => el.classList.add('is-visible')); }
      else {
        const io = new IntersectionObserver(entries => {
          entries.forEach(entry => {
            if(entry.isIntersecting){ entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
          });
        }, {threshold:.13, rootMargin:'0px 0px -5% 0px'});
        revealItems.forEach(el => io.observe(el));
      }

      if(!reduce && matchMedia('(hover:hover) and (pointer:fine)').matches){
        const hero = document.querySelector('.hero');
        const parallax = document.querySelector('[data-parallax]');
        hero?.addEventListener('pointermove', e => {
          if(!parallax) return;
          const r = hero.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - .5;
          const y = (e.clientY - r.top) / r.height - .5;
          parallax.style.transform = `translate3d(${x * 12}px,${y * 9}px,0)`;
        });
        hero?.addEventListener('pointerleave', () => { if(parallax) parallax.style.transform=''; });

        document.querySelectorAll('[data-tilt]').forEach(card => {
          card.addEventListener('pointermove', e => {
            const r = card.getBoundingClientRect();
            const x = (e.clientX-r.left)/r.width-.5;
            const y = (e.clientY-r.top)/r.height-.5;
            card.style.transform = `perspective(900px) rotateX(${-y*3.2}deg) rotateY(${x*4.2}deg) translateY(-3px)`;
          });
          card.addEventListener('pointerleave', () => { card.style.transform=''; });
        });
      }
    })();
