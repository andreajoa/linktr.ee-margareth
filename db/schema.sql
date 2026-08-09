CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.link_analytics_sessions (
  session_id TEXT PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  landing_path TEXT NOT NULL DEFAULT '/',
  source TEXT NOT NULL DEFAULT 'Direto',
  medium TEXT NOT NULL DEFAULT 'none',
  campaign TEXT NOT NULL DEFAULT '',
  referrer_host TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  region TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT '',
  timezone TEXT NOT NULL DEFAULT '',
  device_type TEXT NOT NULL DEFAULT 'unknown',
  browser TEXT NOT NULL DEFAULT 'unknown',
  os TEXT NOT NULL DEFAULT 'unknown',
  language TEXT NOT NULL DEFAULT '',
  screen_width INTEGER,
  screen_height INTEGER,
  viewport_width INTEGER,
  viewport_height INTEGER,
  page_views INTEGER NOT NULL DEFAULT 0,
  event_count INTEGER NOT NULL DEFAULT 0,
  engaged_seconds INTEGER NOT NULL DEFAULT 0,
  max_scroll INTEGER NOT NULL DEFAULT 0,
  click_count INTEGER NOT NULL DEFAULT 0,
  first_click_after_seconds INTEGER,
  last_link_id TEXT NOT NULL DEFAULT '',
  last_link_label TEXT NOT NULL DEFAULT '',
  last_link_url TEXT NOT NULL DEFAULT '',
  last_event TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.link_analytics_events (
  id BIGSERIAL PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,
  session_id TEXT NOT NULL REFERENCES public.link_analytics_sessions(session_id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  path TEXT NOT NULL DEFAULT '/',
  link_id TEXT NOT NULL DEFAULT '',
  link_label TEXT NOT NULL DEFAULT '',
  target_url TEXT NOT NULL DEFAULT '',
  link_position INTEGER,
  section TEXT NOT NULL DEFAULT '',
  properties JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.link_analytics_config (
  config_key TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS link_analytics_sessions_started_idx
  ON public.link_analytics_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS link_analytics_sessions_source_idx
  ON public.link_analytics_sessions(source, started_at DESC);
CREATE INDEX IF NOT EXISTS link_analytics_sessions_geo_idx
  ON public.link_analytics_sessions(country, region, city, started_at DESC);
CREATE INDEX IF NOT EXISTS link_analytics_events_time_idx
  ON public.link_analytics_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS link_analytics_events_name_idx
  ON public.link_analytics_events(event_name, occurred_at DESC);
CREATE INDEX IF NOT EXISTS link_analytics_events_session_idx
  ON public.link_analytics_events(session_id, occurred_at ASC);
CREATE INDEX IF NOT EXISTS link_analytics_events_link_idx
  ON public.link_analytics_events(link_id, occurred_at DESC)
  WHERE event_name = 'link_click';

ALTER TABLE public.link_analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_analytics_config ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.link_analytics_sessions FROM PUBLIC, anonymous, authenticated;
REVOKE ALL ON public.link_analytics_events FROM PUBLIC, anonymous, authenticated;
REVOKE ALL ON public.link_analytics_config FROM PUBLIC, anonymous, authenticated;
REVOKE ALL ON SEQUENCE public.link_analytics_events_id_seq FROM PUBLIC, anonymous, authenticated;

CREATE OR REPLACE FUNCTION public.track_link_event(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_event_id TEXT := LEFT(COALESCE(payload->>'event_id', ''), 120);
  v_session_id TEXT := LEFT(COALESCE(payload->>'session_id', ''), 120);
  v_visitor_id TEXT := LEFT(COALESCE(payload->>'visitor_id', ''), 120);
  v_event_name TEXT := LEFT(COALESCE(payload->>'event_name', ''), 40);
  v_path TEXT := LEFT(COALESCE(payload->>'path', '/'), 500);
  v_referrer TEXT := LEFT(COALESCE(payload->>'referrer', ''), 1500);
  v_referrer_host TEXT := '';
  v_landing_query TEXT := LEFT(COALESCE(payload->>'landing_query', ''), 1500);
  v_source TEXT := LEFT(COALESCE(payload->>'source', ''), 120);
  v_medium TEXT := LEFT(COALESCE(payload->>'medium', ''), 80);
  v_campaign TEXT := LEFT(COALESCE(payload->>'campaign', ''), 240);
  v_duration INTEGER := LEAST(30, GREATEST(0, COALESCE((payload->>'duration_seconds')::INTEGER, 0)));
  v_scroll INTEGER := LEAST(100, GREATEST(0, COALESCE((payload->>'max_scroll')::INTEGER, 0)));
  v_seconds_before_click INTEGER := LEAST(86400, GREATEST(0, COALESCE((payload->>'seconds_before_click')::INTEGER, 0)));
  v_link_id TEXT := LEFT(COALESCE(payload->>'link_id', ''), 120);
  v_link_label TEXT := LEFT(COALESCE(payload->>'link_label', ''), 500);
  v_target_url TEXT := LEFT(COALESCE(payload->>'target_url', ''), 1500);
  v_link_position INTEGER := LEAST(500, GREATEST(0, COALESCE((payload->>'link_position')::INTEGER, 0)));
  v_section TEXT := LEFT(COALESCE(payload->>'section', ''), 120);
  v_inserted INTEGER := 0;
BEGIN
  IF v_event_id !~ '^[A-Za-z0-9:_-]{8,120}$'
     OR v_session_id !~ '^[A-Za-z0-9:_-]{8,120}$'
     OR v_visitor_id !~ '^[A-Za-z0-9:_-]{8,120}$'
     OR v_event_name NOT IN ('page_view', 'engagement', 'link_click', 'scroll_depth', 'session_end') THEN
    RETURN jsonb_build_object('ok', FALSE, 'reason', 'invalid_payload');
  END IF;

  IF (SELECT COUNT(*) FROM public.link_analytics_events
      WHERE session_id = v_session_id AND occurred_at > NOW() - INTERVAL '1 minute') > 60 THEN
    RETURN jsonb_build_object('ok', FALSE, 'reason', 'rate_limited');
  END IF;

  IF v_referrer <> '' THEN
    v_referrer_host := LOWER(SPLIT_PART(SPLIT_PART(REGEXP_REPLACE(v_referrer, '^https?://', '', 'i'), '/', 1), ':', 1));
    v_referrer_host := REGEXP_REPLACE(v_referrer_host, '^www\.', '');
  END IF;

  IF v_source = '' THEN
    IF v_landing_query ~* '(^|[?&])utm_source=' THEN
      v_source := LEFT(COALESCE((REGEXP_MATCH(v_landing_query, '(^|[?&])utm_source=([^&]+)', 'i'))[2], ''), 120);
      v_source := REPLACE(v_source, '+', ' ');
      v_medium := COALESCE(NULLIF(v_medium, ''), 'campaign');
    ELSIF v_landing_query ~* '(^|[?&])gclid=' THEN
      v_source := 'Google Ads'; v_medium := 'paid';
    ELSIF v_landing_query ~* '(^|[?&])fbclid=' THEN
      v_source := 'Meta Ads'; v_medium := 'paid';
    ELSIF v_landing_query ~* '(^|[?&])ttclid=' THEN
      v_source := 'TikTok Ads'; v_medium := 'paid';
    ELSIF v_referrer_host ~ 'instagram\.' THEN
      v_source := 'Instagram'; v_medium := 'social';
    ELSIF v_referrer_host ~ '(facebook\.|fb\.com$)' THEN
      v_source := 'Facebook'; v_medium := 'social';
    ELSIF v_referrer_host ~ 'tiktok\.' THEN
      v_source := 'TikTok'; v_medium := 'social';
    ELSIF v_referrer_host ~ 'youtube\.|youtu\.be$' THEN
      v_source := 'YouTube'; v_medium := 'social';
    ELSIF v_referrer_host ~ 'google\.' THEN
      v_source := 'Google'; v_medium := 'organic';
    ELSIF v_referrer_host <> '' THEN
      v_source := v_referrer_host; v_medium := 'referral';
    ELSE
      v_source := 'Direto'; v_medium := 'none';
    END IF;
  END IF;

  INSERT INTO public.link_analytics_sessions (
    session_id, visitor_id, landing_path, source, medium, campaign, referrer_host,
    city, region, country, timezone, device_type, browser, os, language,
    screen_width, screen_height, viewport_width, viewport_height, last_event
  ) VALUES (
    v_session_id, v_visitor_id, LEFT(COALESCE(payload->>'landing_path', v_path), 500),
    COALESCE(NULLIF(v_source, ''), 'Direto'), COALESCE(NULLIF(v_medium, ''), 'none'),
    v_campaign, v_referrer_host, LEFT(COALESCE(payload->>'city', ''), 160),
    LEFT(COALESCE(payload->>'region', ''), 100), LEFT(COALESCE(payload->>'country', ''), 8),
    LEFT(COALESCE(payload->>'timezone', ''), 120), LEFT(COALESCE(payload->>'device_type', 'unknown'), 40),
    LEFT(COALESCE(payload->>'browser', 'unknown'), 80), LEFT(COALESCE(payload->>'os', 'unknown'), 80),
    LEFT(COALESCE(payload->>'language', ''), 40), NULLIF(payload->>'screen_width', '')::INTEGER,
    NULLIF(payload->>'screen_height', '')::INTEGER, NULLIF(payload->>'viewport_width', '')::INTEGER,
    NULLIF(payload->>'viewport_height', '')::INTEGER, v_event_name
  ) ON CONFLICT (session_id) DO UPDATE SET
    last_seen_at = NOW(),
    city = CASE WHEN link_analytics_sessions.city = '' THEN EXCLUDED.city ELSE link_analytics_sessions.city END,
    region = CASE WHEN link_analytics_sessions.region = '' THEN EXCLUDED.region ELSE link_analytics_sessions.region END,
    country = CASE WHEN link_analytics_sessions.country = '' THEN EXCLUDED.country ELSE link_analytics_sessions.country END,
    timezone = CASE WHEN link_analytics_sessions.timezone = '' THEN EXCLUDED.timezone ELSE link_analytics_sessions.timezone END,
    source = CASE WHEN link_analytics_sessions.source = 'Direto' AND EXCLUDED.source <> 'Direto' THEN EXCLUDED.source ELSE link_analytics_sessions.source END,
    medium = CASE WHEN link_analytics_sessions.medium = 'none' AND EXCLUDED.medium <> 'none' THEN EXCLUDED.medium ELSE link_analytics_sessions.medium END,
    campaign = CASE WHEN link_analytics_sessions.campaign = '' THEN EXCLUDED.campaign ELSE link_analytics_sessions.campaign END,
    device_type = EXCLUDED.device_type,
    browser = EXCLUDED.browser,
    os = EXCLUDED.os,
    language = EXCLUDED.language,
    last_event = v_event_name,
    updated_at = NOW();

  INSERT INTO public.link_analytics_events (
    event_id, session_id, visitor_id, event_name, path, link_id, link_label,
    target_url, link_position, section, properties
  ) VALUES (
    v_event_id, v_session_id, v_visitor_id, v_event_name, v_path, v_link_id, v_link_label,
    v_target_url, NULLIF(v_link_position, 0), v_section,
    jsonb_build_object(
      'duration_seconds', v_duration,
      'max_scroll', v_scroll,
      'seconds_before_click', v_seconds_before_click
    )
  ) ON CONFLICT (event_id) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  IF v_inserted = 0 THEN
    RETURN jsonb_build_object('ok', TRUE, 'duplicate', TRUE);
  END IF;

  UPDATE public.link_analytics_sessions SET
    last_seen_at = NOW(),
    page_views = page_views + CASE WHEN v_event_name = 'page_view' THEN 1 ELSE 0 END,
    event_count = event_count + 1,
    engaged_seconds = engaged_seconds + v_duration,
    max_scroll = GREATEST(max_scroll, v_scroll),
    click_count = click_count + CASE WHEN v_event_name = 'link_click' THEN 1 ELSE 0 END,
    first_click_after_seconds = CASE
      WHEN v_event_name = 'link_click' AND first_click_after_seconds IS NULL THEN v_seconds_before_click
      ELSE first_click_after_seconds
    END,
    last_link_id = CASE WHEN v_event_name = 'link_click' THEN v_link_id ELSE last_link_id END,
    last_link_label = CASE WHEN v_event_name = 'link_click' THEN v_link_label ELSE last_link_label END,
    last_link_url = CASE WHEN v_event_name = 'link_click' THEN v_target_url ELSE last_link_url END,
    last_event = v_event_name,
    updated_at = NOW()
  WHERE session_id = v_session_id;

  IF RANDOM() < 0.01 THEN
    DELETE FROM public.link_analytics_events WHERE occurred_at < NOW() - INTERVAL '180 days';
    DELETE FROM public.link_analytics_sessions WHERE last_seen_at < NOW() - INTERVAL '180 days';
  END IF;

  RETURN jsonb_build_object('ok', TRUE, 'inserted', TRUE);
EXCEPTION
  WHEN invalid_text_representation OR numeric_value_out_of_range THEN
    RETURN jsonb_build_object('ok', FALSE, 'reason', 'invalid_number');
END;
$$;

CREATE OR REPLACE FUNCTION public.get_link_dashboard(p_password TEXT, p_days INTEGER DEFAULT 7)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_days INTEGER := LEAST(90, GREATEST(1, COALESCE(p_days, 7)));
  v_since TIMESTAMPTZ;
  v_previous_since TIMESTAMPTZ;
  v_password_hash TEXT;
  v_sessions INTEGER := 0;
  v_visitors INTEGER := 0;
  v_clicks INTEGER := 0;
  v_clicked_sessions INTEGER := 0;
  v_previous_sessions INTEGER := 0;
  v_previous_visitors INTEGER := 0;
  v_avg_engagement NUMERIC := 0;
  v_avg_scroll NUMERIC := 0;
  v_avg_click_time NUMERIC := 0;
  v_quick_exits INTEGER := 0;
  v_result JSONB;
BEGIN
  SELECT password_hash INTO v_password_hash
  FROM public.link_analytics_config WHERE config_key = 'dashboard';

  IF v_password_hash IS NULL OR p_password IS NULL OR v_password_hash <> crypt(p_password, v_password_hash) THEN
    RAISE EXCEPTION 'invalid_password' USING ERRCODE = '28000';
  END IF;

  v_since := NOW() - MAKE_INTERVAL(days => v_days);
  v_previous_since := NOW() - MAKE_INTERVAL(days => v_days * 2);

  SELECT COUNT(*)::INTEGER, COUNT(DISTINCT visitor_id)::INTEGER,
         COALESCE(SUM(click_count), 0)::INTEGER,
         COUNT(*) FILTER (WHERE click_count > 0)::INTEGER,
         COALESCE(AVG(engaged_seconds), 0), COALESCE(AVG(max_scroll), 0),
         COALESCE(AVG(first_click_after_seconds) FILTER (WHERE first_click_after_seconds IS NOT NULL), 0),
         COUNT(*) FILTER (WHERE click_count = 0 AND engaged_seconds < 10)::INTEGER
  INTO v_sessions, v_visitors, v_clicks, v_clicked_sessions, v_avg_engagement,
       v_avg_scroll, v_avg_click_time, v_quick_exits
  FROM public.link_analytics_sessions WHERE started_at >= v_since;

  SELECT COUNT(*)::INTEGER, COUNT(DISTINCT visitor_id)::INTEGER
  INTO v_previous_sessions, v_previous_visitors
  FROM public.link_analytics_sessions
  WHERE started_at >= v_previous_since AND started_at < v_since;

  SELECT jsonb_build_object(
    'range_days', v_days,
    'generated_at', NOW(),
    'summary', jsonb_build_object(
      'sessions', v_sessions,
      'visitors', v_visitors,
      'clicks', v_clicks,
      'clicked_sessions', v_clicked_sessions,
      'click_rate', CASE WHEN v_sessions > 0 THEN ROUND(v_clicked_sessions * 100.0 / v_sessions, 1) ELSE 0 END,
      'avg_engagement', ROUND(v_avg_engagement, 1),
      'avg_scroll', ROUND(v_avg_scroll, 1),
      'avg_click_time', ROUND(v_avg_click_time, 1),
      'quick_exit_rate', CASE WHEN v_sessions > 0 THEN ROUND(v_quick_exits * 100.0 / v_sessions, 1) ELSE 0 END,
      'sessions_delta', CASE WHEN v_previous_sessions > 0 THEN ROUND((v_sessions - v_previous_sessions) * 100.0 / v_previous_sessions, 1) ELSE 0 END,
      'visitors_delta', CASE WHEN v_previous_visitors > 0 THEN ROUND((v_visitors - v_previous_visitors) * 100.0 / v_previous_visitors, 1) ELSE 0 END
    ),
    'timeline', COALESCE((
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.bucket) FROM (
        SELECT CASE WHEN v_days = 1
                    THEN TO_CHAR(date_trunc('hour', started_at AT TIME ZONE 'America/Fortaleza'), 'YYYY-MM-DD HH24:00')
                    ELSE TO_CHAR(date_trunc('day', started_at AT TIME ZONE 'America/Fortaleza'), 'YYYY-MM-DD') END AS bucket,
               COUNT(*)::INTEGER AS sessions,
               COALESCE(SUM(click_count), 0)::INTEGER AS clicks
        FROM public.link_analytics_sessions
        WHERE started_at >= v_since
        GROUP BY 1
      ) t
    ), '[]'::jsonb),
    'links', COALESCE((
      SELECT jsonb_agg(row_to_json(l) ORDER BY l.clicks DESC, l.position ASC) FROM (
        SELECT COALESCE(NULLIF(link_id, ''), target_url) AS link_id,
               MAX(link_label) AS label, MAX(target_url) AS target_url,
               MIN(link_position) AS position, MAX(section) AS section,
               COUNT(*)::INTEGER AS clicks, COUNT(DISTINCT session_id)::INTEGER AS unique_sessions,
               ROUND(AVG(COALESCE((properties->>'seconds_before_click')::NUMERIC, 0)), 1) AS avg_seconds_before_click,
               CASE WHEN v_sessions > 0 THEN ROUND(COUNT(DISTINCT session_id) * 100.0 / v_sessions, 1) ELSE 0 END AS session_click_rate
        FROM public.link_analytics_events
        WHERE occurred_at >= v_since AND event_name = 'link_click'
        GROUP BY COALESCE(NULLIF(link_id, ''), target_url)
        ORDER BY COUNT(*) DESC, MIN(link_position) ASC
        LIMIT 40
      ) l
    ), '[]'::jsonb),
    'sources', COALESCE((
      SELECT jsonb_agg(row_to_json(s) ORDER BY s.sessions DESC) FROM (
        SELECT source, medium, COUNT(*)::INTEGER AS sessions,
               COUNT(*) FILTER (WHERE click_count > 0)::INTEGER AS clicked_sessions,
               COALESCE(SUM(click_count), 0)::INTEGER AS clicks,
               ROUND(AVG(engaged_seconds), 1) AS avg_engagement,
               ROUND(COUNT(*) FILTER (WHERE click_count > 0) * 100.0 / NULLIF(COUNT(*), 0), 1) AS click_rate
        FROM public.link_analytics_sessions WHERE started_at >= v_since
        GROUP BY source, medium
        ORDER BY COUNT(*) DESC
        LIMIT 20
      ) s
    ), '[]'::jsonb),
    'geography', COALESCE((
      SELECT jsonb_agg(row_to_json(g) ORDER BY g.sessions DESC) FROM (
        SELECT country, region, city, COUNT(*)::INTEGER AS sessions,
               COUNT(*) FILTER (WHERE click_count > 0)::INTEGER AS clicked_sessions,
               COALESCE(SUM(click_count), 0)::INTEGER AS clicks
        FROM public.link_analytics_sessions
        WHERE started_at >= v_since AND (country <> '' OR region <> '' OR city <> '')
        GROUP BY country, region, city
        ORDER BY COUNT(*) DESC
        LIMIT 40
      ) g
    ), '[]'::jsonb),
    'devices', COALESCE((
      SELECT jsonb_agg(row_to_json(d) ORDER BY d.sessions DESC) FROM (
        SELECT device_type, COUNT(*)::INTEGER AS sessions,
               COUNT(*) FILTER (WHERE click_count > 0)::INTEGER AS clicked_sessions,
               ROUND(AVG(engaged_seconds), 1) AS avg_engagement
        FROM public.link_analytics_sessions WHERE started_at >= v_since
        GROUP BY device_type
      ) d
    ), '[]'::jsonb),
    'browsers', COALESCE((
      SELECT jsonb_agg(row_to_json(b) ORDER BY b.sessions DESC) FROM (
        SELECT browser, os, COUNT(*)::INTEGER AS sessions
        FROM public.link_analytics_sessions WHERE started_at >= v_since
        GROUP BY browser, os
        ORDER BY COUNT(*) DESC
        LIMIT 15
      ) b
    ), '[]'::jsonb),
    'campaigns', COALESCE((
      SELECT jsonb_agg(row_to_json(c) ORDER BY c.sessions DESC) FROM (
        SELECT campaign, source, COUNT(*)::INTEGER AS sessions,
               COUNT(*) FILTER (WHERE click_count > 0)::INTEGER AS clicked_sessions,
               COALESCE(SUM(click_count), 0)::INTEGER AS clicks
        FROM public.link_analytics_sessions
        WHERE started_at >= v_since AND campaign <> ''
        GROUP BY campaign, source
        ORDER BY COUNT(*) DESC
        LIMIT 20
      ) c
    ), '[]'::jsonb),
    'source_links', COALESCE((
      SELECT jsonb_agg(row_to_json(x) ORDER BY x.clicks DESC) FROM (
        SELECT s.source, e.link_id, MAX(e.link_label) AS label,
               COUNT(*)::INTEGER AS clicks, COUNT(DISTINCT e.session_id)::INTEGER AS sessions
        FROM public.link_analytics_events e
        JOIN public.link_analytics_sessions s ON s.session_id = e.session_id
        WHERE e.occurred_at >= v_since AND e.event_name = 'link_click'
        GROUP BY s.source, e.link_id
        ORDER BY COUNT(*) DESC
        LIMIT 40
      ) x
    ), '[]'::jsonb),
    'hours', COALESCE((
      SELECT jsonb_agg(row_to_json(h) ORDER BY h.hour) FROM (
        SELECT EXTRACT(HOUR FROM started_at AT TIME ZONE 'America/Fortaleza')::INTEGER AS hour,
               COUNT(*)::INTEGER AS sessions,
               COUNT(*) FILTER (WHERE click_count > 0)::INTEGER AS clicked_sessions
        FROM public.link_analytics_sessions WHERE started_at >= v_since
        GROUP BY 1
      ) h
    ), '[]'::jsonb),
    'weekdays', COALESCE((
      SELECT jsonb_agg(row_to_json(w) ORDER BY w.weekday) FROM (
        SELECT EXTRACT(ISODOW FROM started_at AT TIME ZONE 'America/Fortaleza')::INTEGER AS weekday,
               COUNT(*)::INTEGER AS sessions,
               COUNT(*) FILTER (WHERE click_count > 0)::INTEGER AS clicked_sessions
        FROM public.link_analytics_sessions WHERE started_at >= v_since
        GROUP BY 1
      ) w
    ), '[]'::jsonb),
    'recent_sessions', COALESCE((
      SELECT jsonb_agg(row_to_json(r) ORDER BY r.last_seen_at DESC) FROM (
        SELECT session_id, started_at, last_seen_at, source, medium, campaign,
               city, region, country, device_type, browser, os, engaged_seconds,
               max_scroll, click_count, first_click_after_seconds, last_link_id,
               last_link_label, last_link_url, last_event
        FROM public.link_analytics_sessions WHERE started_at >= v_since
        ORDER BY last_seen_at DESC LIMIT 50
      ) r
    ), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_link_journey(p_password TEXT, p_session_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_password_hash TEXT;
  v_result JSONB;
BEGIN
  SELECT password_hash INTO v_password_hash
  FROM public.link_analytics_config WHERE config_key = 'dashboard';
  IF v_password_hash IS NULL OR p_password IS NULL OR v_password_hash <> crypt(p_password, v_password_hash) THEN
    RAISE EXCEPTION 'invalid_password' USING ERRCODE = '28000';
  END IF;
  IF p_session_id !~ '^[A-Za-z0-9:_-]{8,120}$' THEN
    RAISE EXCEPTION 'invalid_session';
  END IF;

  SELECT jsonb_build_object(
    'session', (SELECT row_to_json(s) FROM public.link_analytics_sessions s WHERE s.session_id = p_session_id),
    'events', COALESCE((
      SELECT jsonb_agg(row_to_json(e) ORDER BY e.occurred_at) FROM (
        SELECT event_name, occurred_at, path, link_id, link_label, target_url,
               link_position, section, properties
        FROM public.link_analytics_events WHERE session_id = p_session_id
        ORDER BY occurred_at LIMIT 500
      ) e
    ), '[]'::jsonb)
  ) INTO v_result;
  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.track_link_event(JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_link_dashboard(TEXT, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_link_journey(TEXT, TEXT) FROM PUBLIC;

GRANT USAGE ON SCHEMA public TO anonymous;
GRANT EXECUTE ON FUNCTION public.track_link_event(JSONB) TO anonymous;
GRANT EXECUTE ON FUNCTION public.get_link_dashboard(TEXT, INTEGER) TO anonymous;
GRANT EXECUTE ON FUNCTION public.get_link_journey(TEXT, TEXT) TO anonymous;
