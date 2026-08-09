const AUTH_URL = 'https://ep-square-credit-ayz2x9qc.neonauth.c-5.us-east-2.aws.neon.tech/neondb/auth';
const DATA_API_URL = 'https://ep-square-credit-ayz2x9qc.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1';
const BOT_RE = /bot|crawler|spider|crawling|headless|slurp|bingpreview|facebookexternalhit|whatsapp|telegrambot|googleother/i;
const ID_RE = /^[A-Za-z0-9:_-]{8,120}$/;
const EVENT_RE = /^(page_view|engagement|link_click|scroll_depth|session_end|cta_click|outbound_click|lead_submitted|checkout_started|purchase|purchase_page)$/;

const globalCache = globalThis;
if (!globalCache.__maAnalyticsToken) globalCache.__maAnalyticsToken = { token:'', expiresAt:0 };

function header(request, name) {
  const value = request.headers?.[name] ?? request.headers?.[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : String(value || '');
}

function decode(value) {
  try { return decodeURIComponent(value || ''); } catch { return String(value || ''); }
}

function text(value, max = 500) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function integer(value, min = 0, max = 100000000) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function readBody(request) {
  if (request.body && typeof request.body === 'object' && !Buffer.isBuffer(request.body)) return request.body;
  try {
    const raw = Buffer.isBuffer(request.body) ? request.body.toString('utf8') : String(request.body || '{}');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function sameOrigin(request) {
  const origin = header(request, 'origin');
  if (!origin) return true;
  try {
    const originHost = new URL(origin).hostname;
    const forwardedHost = header(request, 'x-forwarded-host').split(',')[0].trim();
    const requestHost = forwardedHost || header(request, 'host');
    return originHost === requestHost;
  } catch {
    return false;
  }
}

export function sanitizeEvent(input, siteId) {
  const eventId = text(input.event_id, 120);
  const sessionId = text(input.session_id, 120);
  const visitorId = text(input.visitor_id, 120);
  const parentSessionId = text(input.parent_session_id, 120);
  const eventName = text(input.event_name, 40);
  if (!ID_RE.test(eventId) || !ID_RE.test(sessionId) || !ID_RE.test(visitorId) || !EVENT_RE.test(eventName)) return null;
  if (parentSessionId && !ID_RE.test(parentSessionId)) return null;

  return {
    site_id:siteId,
    event_id:eventId,
    session_id:sessionId,
    visitor_id:visitorId,
    parent_session_id:parentSessionId,
    event_name:eventName,
    path:text(input.path, 500) || '/',
    landing_path:text(input.landing_path, 500) || '/',
    landing_query:text(input.landing_query, 1500),
    referrer:text(input.referrer, 1500),
    source:text(input.source, 120),
    medium:text(input.medium, 80),
    campaign:text(input.campaign, 240),
    device_type:text(input.device_type, 40) || 'unknown',
    browser:text(input.browser, 80) || 'unknown',
    os:text(input.os, 80) || 'unknown',
    language:text(input.language, 40),
    screen_width:integer(input.screen_width, 0, 10000),
    screen_height:integer(input.screen_height, 0, 10000),
    viewport_width:integer(input.viewport_width, 0, 10000),
    viewport_height:integer(input.viewport_height, 0, 10000),
    duration_seconds:integer(input.duration_seconds, 0, 30),
    max_scroll:integer(input.max_scroll, 0, 100),
    seconds_before_click:integer(input.seconds_before_click, 0, 86400),
    link_id:text(input.link_id, 120),
    link_label:text(input.link_label, 500),
    target_url:text(input.target_url, 1500),
    link_position:integer(input.link_position, 0, 500),
    section:text(input.section, 120),
    product_id:text(input.product_id, 120),
    product_name:text(input.product_name, 500),
    value_cents:integer(input.value_cents, 0, 100000000),
    transaction_id:text(input.transaction_id, 160),
  };
}

async function anonymousToken() {
  const cached = globalCache.__maAnalyticsToken;
  const now = Math.floor(Date.now() / 1000);
  if (cached.token && cached.expiresAt > now + 90) return cached.token;

  const response = await fetch(`${AUTH_URL}/token/anonymous`, {
    headers:{ Accept:'application/json', Origin:'https://link-margareth.vercel.app' },
    signal:AbortSignal.timeout(8000),
    cache:'no-store',
  });
  if (!response.ok) throw new Error(`analytics_auth_${response.status}`);
  const data = await response.json();
  if (!data.token) throw new Error('analytics_auth_missing_token');
  cached.token = data.token;
  cached.expiresAt = Number(data.expires_at || now + 600);
  return cached.token;
}

export async function callAnalyticsRpc(name, body) {
  const token = await anonymousToken();
  const response = await fetch(`${DATA_API_URL}/rpc/${name}`, {
    method:'POST',
    headers:{
      Authorization:`Bearer ${token}`,
      'Content-Type':'application/json',
      Accept:'application/json',
    },
    body:JSON.stringify(body),
    signal:AbortSignal.timeout(10000),
    cache:'no-store',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error('analytics_rpc_failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

export async function recordAnalyticsEvent(payload, siteId) {
  const clean = sanitizeEvent(payload, siteId);
  if (!clean) return { ok:false, reason:'invalid_payload' };
  return callAnalyticsRpc('track_link_event', { payload:clean });
}

export function analyticsTrackHandler(siteId) {
  return async function handler(request, response) {
    response.setHeader('Cache-Control', 'no-store, max-age=0');
    if (request.method !== 'POST') {
      response.setHeader('Allow', 'POST');
      return response.status(405).end();
    }
    if (!sameOrigin(request)) return response.status(403).end();
    if (BOT_RE.test(header(request, 'user-agent'))) return response.status(204).end();
    const length = Number(header(request, 'content-length') || 0);
    if (length > 36_000) return response.status(413).end();

    try {
      const payload = sanitizeEvent(readBody(request), siteId);
      if (!payload) return response.status(400).end();
      payload.city = decode(header(request, 'x-vercel-ip-city')).slice(0, 160);
      payload.region = decode(header(request, 'x-vercel-ip-country-region')).slice(0, 100);
      payload.country = decode(header(request, 'x-vercel-ip-country')).slice(0, 8);
      payload.timezone = decode(header(request, 'x-vercel-ip-timezone')).slice(0, 120);
      await callAnalyticsRpc('track_link_event', { payload });
      return response.status(204).end();
    } catch {
      return response.status(202).end();
    }
  };
}

export function dashboardRequestAllowed(request) {
  return sameOrigin(request) && !BOT_RE.test(header(request, 'user-agent'));
}

export { readBody };
