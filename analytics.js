(() => {
  const SITE_ID = 'linkhub';
  const CONSENT_KEY = 'ma_analytics_consent_v1';
  const VISITOR_KEY = 'ma_linkhub_visitor_v1';
  const SESSION_KEY = 'ma_linkhub_session_v1';
  const SESSION_TIMEOUT = 30 * 60 * 1000;
  const OWNED_APOSTILA_HOSTS = new Set(['apostila-promo.vercel.app']);
  let started = false;
  let maxScroll = 0;
  let activeSeconds = 0;
  let pendingSeconds = 0;
  let lastInteraction = Date.now();
  let session = null;

  function uuid() {
    try { return crypto.randomUUID(); }
    catch { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`; }
  }

  function slug(value) {
    return String(value || 'link').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'link';
  }

  function visitorId() {
    let id = localStorage.getItem(VISITOR_KEY) || '';
    if (!id) { id = uuid(); localStorage.setItem(VISITOR_KEY, id); }
    return id;
  }

  function sessionState() {
    const now = Date.now();
    let current = null;
    try { current = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { current = null; }
    if (!current?.id || now - Number(current.lastSeen || 0) > SESSION_TIMEOUT) {
      current = {
        id:uuid(),
        startedAt:now,
        lastSeen:now,
        landingPath:location.pathname || '/',
        landingQuery:location.search || '',
        referrer:document.referrer || '',
      };
    } else current.lastSeen = now;
    localStorage.setItem(SESSION_KEY, JSON.stringify(current));
    return current;
  }

  function device() {
    const ua = navigator.userAgent || '';
    if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (innerWidth >= 600 && innerWidth < 1024 && navigator.maxTouchPoints > 1)) return 'tablet';
    if (/Mobi|Android|iPhone|iPod/i.test(ua) || innerWidth < 600) return 'mobile';
    return 'desktop';
  }

  function browser() {
    const ua = navigator.userAgent || '';
    if (/Instagram/i.test(ua)) return 'Instagram App';
    if (/FBAN|FBAV/i.test(ua)) return 'Facebook App';
    if (/TikTok/i.test(ua)) return 'TikTok App';
    if (/Edg\//.test(ua)) return 'Edge';
    if (/OPR\//.test(ua)) return 'Opera';
    if (/CriOS\//.test(ua)) return 'Chrome iOS';
    if (/FxiOS\//.test(ua)) return 'Firefox iOS';
    if (/Chrome\//.test(ua)) return 'Chrome';
    if (/Firefox\//.test(ua)) return 'Firefox';
    if (/Safari\//.test(ua) && /Version\//.test(ua)) return 'Safari';
    return 'Other';
  }

  function os() {
    const ua = navigator.userAgent || '';
    if (/iPhone|iPad|iPod/.test(ua)) return 'iOS/iPadOS';
    if (/Android/.test(ua)) return 'Android';
    if (/Windows NT/.test(ua)) return 'Windows';
    if (/Mac OS X/.test(ua)) return 'macOS';
    if (/Linux/.test(ua)) return 'Linux';
    return 'Other';
  }

  function acquisition() {
    const query = new URLSearchParams(session?.landingQuery?.replace(/^\?/, '') || location.search);
    let source = query.get('utm_source') || '';
    let medium = query.get('utm_medium') || '';
    const ua = navigator.userAgent || '';
    if (!source && /Instagram/i.test(ua)) { source = 'Instagram'; medium = 'social'; }
    else if (!source && /FBAN|FBAV/i.test(ua)) { source = 'Facebook'; medium = 'social'; }
    else if (!source && /TikTok/i.test(ua)) { source = 'TikTok'; medium = 'social'; }
    return { source, medium, campaign:query.get('utm_campaign') || '' };
  }

  function payload(eventName, details = {}) {
    session.lastSeen = Date.now();
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return {
      site_id:SITE_ID,
      event_id:uuid(),
      session_id:session.id,
      visitor_id:visitorId(),
      event_name:eventName,
      path:location.pathname || '/',
      landing_path:session.landingPath,
      landing_query:session.landingQuery,
      referrer:session.referrer,
      ...acquisition(),
      device_type:device(),
      browser:browser(),
      os:os(),
      language:navigator.language || '',
      screen_width:screen?.width || 0,
      screen_height:screen?.height || 0,
      viewport_width:innerWidth || 0,
      viewport_height:innerHeight || 0,
      max_scroll:maxScroll,
      ...details,
    };
  }

  function track(eventName, details = {}, beacon = false) {
    if (!started || location.pathname.startsWith('/dashboard')) return;
    const body = JSON.stringify(payload(eventName, details));
    try {
      if (beacon && navigator.sendBeacon) {
        navigator.sendBeacon('/api/track', new Blob([body], { type:'application/json' }));
      } else {
        fetch('/api/track', {
          method:'POST', headers:{ 'Content-Type':'application/json' }, body,
          keepalive:true, credentials:'same-origin',
        }).catch(() => undefined);
      }
    } catch {}
  }

  function labelFor(anchor) {
    return (anchor.dataset.trackLabel || anchor.getAttribute('aria-label') ||
      anchor.querySelector('h1,h2,h3,.lnk-title,.caa-feature-title')?.textContent ||
      anchor.textContent || anchor.hostname || 'Link').replace(/\s+/g, ' ').trim().slice(0, 160);
  }

  function sectionFor(anchor) {
    const section = anchor.closest('section,[class*="feature"],.links,.socials,.book-promo,.carousel-wrap');
    if (!section) return 'geral';
    return section.id || Array.from(section.classList).find((name) => !/^(active|primary|featured)$/.test(name)) || 'geral';
  }

  function attributedUrl(anchor) {
    try {
      const url = new URL(anchor.href, location.href);
      if (OWNED_APOSTILA_HOSTS.has(url.hostname)) {
        if (!url.searchParams.has('utm_source')) url.searchParams.set('utm_source', 'link_margareth');
        if (!url.searchParams.has('utm_medium')) url.searchParams.set('utm_medium', 'owned');
        if (!url.searchParams.has('utm_campaign')) url.searchParams.set('utm_campaign', 'linkhub');
        url.searchParams.set('hub_session', session.id);
        anchor.href = url.toString();
      }
      return url.toString();
    } catch { return anchor.href || ''; }
  }

  function onClick(event) {
    const anchor = event.target.closest?.('a[href]');
    if (!anchor || anchor.closest('.ma-consent')) return;
    const href = anchor.getAttribute('href') || '';
    if (!href || href.startsWith('javascript:')) return;
    const anchors = Array.from(document.querySelectorAll('a[href]')).filter((item) => !item.closest('.ma-consent'));
    const label = labelFor(anchor);
    const targetUrl = attributedUrl(anchor);
    track('link_click', {
      link_id:anchor.dataset.trackId || slug(label),
      link_label:label,
      target_url:targetUrl,
      link_position:anchors.indexOf(anchor) + 1,
      section:sectionFor(anchor),
      seconds_before_click:Math.round((Date.now() - session.startedAt) / 1000),
    }, true);
    window.gtag?.('event', 'link_click', { link_text:label, link_url:targetUrl });
  }

  function updateScroll() {
    const total = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    maxScroll = Math.max(maxScroll, Math.min(100, Math.round(scrollY * 100 / total)));
  }

  function flush(eventName = 'engagement', beacon = false) {
    if (!pendingSeconds && eventName === 'engagement') return;
    const seconds = pendingSeconds;
    pendingSeconds = 0;
    track(eventName, { duration_seconds:seconds, max_scroll:maxScroll }, beacon);
  }

  function loadGoogleAnalytics() {
    if (document.querySelector('script[data-ma-ga]')) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', 'G-14K5EVCMKV', { anonymize_ip:true });
    const script = document.createElement('script');
    script.async = true;
    script.dataset.maGa = 'true';
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-14K5EVCMKV';
    document.head.appendChild(script);
  }

  function start() {
    if (started || location.pathname.startsWith('/dashboard')) return;
    started = true;
    session = sessionState();
    loadGoogleAnalytics();
    track('page_view');
    document.addEventListener('click', onClick, true);
    addEventListener('scroll', updateScroll, { passive:true });
    ['pointerdown','touchstart','keydown'].forEach((name) => addEventListener(name, () => { lastInteraction = Date.now(); }, { passive:true }));
    setInterval(() => {
      if (!document.hidden && Date.now() - lastInteraction < 30000) {
        activeSeconds += 5;
        pendingSeconds += 5;
      }
      if (pendingSeconds >= 15) flush();
    }, 5000);
    addEventListener('pagehide', () => flush('session_end', true));
    document.addEventListener('visibilitychange', () => { if (document.hidden) flush('engagement', true); });
  }

  function consent(value) {
    localStorage.setItem(CONSENT_KEY, value);
    document.querySelector('.ma-consent')?.remove();
    window.dispatchEvent(new CustomEvent('ma:analytics-consent', { detail:value }));
    if (value === 'granted') start();
  }

  function banner() {
    const style = document.createElement('style');
    style.textContent = `.ma-consent{position:fixed;z-index:10000;left:16px;right:16px;bottom:16px;max-width:680px;margin:auto;padding:16px 18px;border:1px solid rgba(232,160,96,.45);border-radius:18px;background:rgba(9,20,34,.97);box-shadow:0 20px 70px rgba(0,0,0,.5);color:#fff;font:13px/1.55 Syne,Arial,sans-serif;cursor:auto}.ma-consent strong{display:block;margin-bottom:4px;color:#E8A060;font:700 18px/1.2 'Playfair Display',serif}.ma-consent p{margin:0;color:rgba(255,255,255,.78)}.ma-consent a{color:#E8A060}.ma-consent-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:12px}.ma-consent button{border:0;border-radius:999px;padding:9px 15px;font:700 11px Syne,Arial,sans-serif;cursor:pointer}.ma-consent-accept{background:#B8733A;color:#fff}.ma-consent-decline{background:rgba(255,255,255,.09);color:#fff}`;
    document.head.appendChild(style);
    const element = document.createElement('aside');
    element.className = 'ma-consent';
    element.setAttribute('role', 'dialog');
    element.setAttribute('aria-label', 'Preferências de privacidade');
    element.innerHTML = `<strong>Sua privacidade importa</strong><p>Com sua autorização, usamos dados anônimos de navegação para entender quais conteúdos ajudam mais. Não armazenamos seu IP. <a href="/privacidade/">Saiba mais</a>.</p><div class="ma-consent-actions"><button class="ma-consent-accept" type="button">Aceitar métricas</button><button class="ma-consent-decline" type="button">Agora não</button></div>`;
    element.querySelector('.ma-consent-accept').addEventListener('click', () => consent('granted'));
    element.querySelector('.ma-consent-decline').addEventListener('click', () => consent('denied'));
    document.body.appendChild(element);
  }

  window.maAnalytics = {
    track,
    identity:() => session ? { sessionId:session.id, visitorId:visitorId(), source:acquisition().source, medium:acquisition().medium, campaign:acquisition().campaign } : {},
    consent:() => localStorage.getItem(CONSENT_KEY) || '',
  };

  document.addEventListener('DOMContentLoaded', () => {
    if (location.pathname.startsWith('/dashboard')) return;
    const current = localStorage.getItem(CONSENT_KEY);
    if (current === 'granted') start();
    else if (current !== 'denied') banner();
  });
})();
