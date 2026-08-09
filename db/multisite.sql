ALTER TABLE public.link_analytics_sessions
  ADD COLUMN IF NOT EXISTS site_id TEXT NOT NULL DEFAULT 'linkhub',
  ADD COLUMN IF NOT EXISTS parent_session_id TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS converted BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS revenue_cents BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS transaction_id TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS product_id TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS product_name TEXT NOT NULL DEFAULT '';

ALTER TABLE public.link_analytics_events
  ADD COLUMN IF NOT EXISTS site_id TEXT NOT NULL DEFAULT 'linkhub',
  ADD COLUMN IF NOT EXISTS product_id TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS product_name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS value_cents BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS transaction_id TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS link_analytics_sessions_site_idx
  ON public.link_analytics_sessions(site_id, started_at DESC);
CREATE INDEX IF NOT EXISTS link_analytics_sessions_parent_idx
  ON public.link_analytics_sessions(parent_session_id)
  WHERE parent_session_id <> '';
CREATE INDEX IF NOT EXISTS link_analytics_events_site_idx
  ON public.link_analytics_events(site_id, occurred_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS link_analytics_purchase_transaction_idx
  ON public.link_analytics_events(site_id, transaction_id)
  WHERE event_name = 'purchase' AND transaction_id <> '';

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
  v_parent_session_id TEXT := LEFT(COALESCE(payload->>'parent_session_id', ''), 120);
  v_site_id TEXT := LEFT(COALESCE(payload->>'site_id', ''), 40);
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
  v_product_id TEXT := LEFT(COALESCE(payload->>'product_id', ''), 120);
  v_product_name TEXT := LEFT(COALESCE(payload->>'product_name', ''), 500);
  v_transaction_id TEXT := LEFT(COALESCE(payload->>'transaction_id', ''), 160);
  v_value_cents BIGINT := LEAST(100000000, GREATEST(0, COALESCE((payload->>'value_cents')::BIGINT, 0)));
  v_inserted INTEGER := 0;
  v_is_click BOOLEAN;
BEGIN
  IF v_site_id NOT IN ('linkhub', 'apostila_combo') THEN
    RETURN jsonb_build_object('ok', FALSE, 'reason', 'invalid_site');
  END IF;
  IF v_event_id !~ '^[A-Za-z0-9:_-]{8,120}$'
     OR v_session_id !~ '^[A-Za-z0-9:_-]{8,120}$'
     OR v_visitor_id !~ '^[A-Za-z0-9:_-]{8,120}$'
     OR (v_parent_session_id <> '' AND v_parent_session_id !~ '^[A-Za-z0-9:_-]{8,120}$')
     OR v_event_name NOT IN (
       'page_view', 'engagement', 'link_click', 'scroll_depth', 'session_end',
       'cta_click', 'outbound_click', 'lead_submitted', 'checkout_started',
       'purchase', 'purchase_page'
     ) THEN
    RETURN jsonb_build_object('ok', FALSE, 'reason', 'invalid_payload');
  END IF;

  IF (SELECT COUNT(*) FROM public.link_analytics_events
      WHERE session_id = v_session_id AND occurred_at > NOW() - INTERVAL '1 minute') > 80 THEN
    RETURN jsonb_build_object('ok', FALSE, 'reason', 'rate_limited');
  END IF;

  v_is_click := v_event_name IN ('link_click', 'cta_click', 'outbound_click');

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
    session_id, visitor_id, parent_session_id, site_id, landing_path, source, medium,
    campaign, referrer_host, city, region, country, timezone, device_type, browser,
    os, language, screen_width, screen_height, viewport_width, viewport_height,
    last_event, product_id, product_name
  ) VALUES (
    v_session_id, v_visitor_id, v_parent_session_id, v_site_id,
    LEFT(COALESCE(payload->>'landing_path', v_path), 500),
    COALESCE(NULLIF(v_source, ''), 'Direto'), COALESCE(NULLIF(v_medium, ''), 'none'),
    v_campaign, v_referrer_host, LEFT(COALESCE(payload->>'city', ''), 160),
    LEFT(COALESCE(payload->>'region', ''), 100), LEFT(COALESCE(payload->>'country', ''), 8),
    LEFT(COALESCE(payload->>'timezone', ''), 120), LEFT(COALESCE(payload->>'device_type', 'unknown'), 40),
    LEFT(COALESCE(payload->>'browser', 'unknown'), 80), LEFT(COALESCE(payload->>'os', 'unknown'), 80),
    LEFT(COALESCE(payload->>'language', ''), 40), NULLIF(payload->>'screen_width', '')::INTEGER,
    NULLIF(payload->>'screen_height', '')::INTEGER, NULLIF(payload->>'viewport_width', '')::INTEGER,
    NULLIF(payload->>'viewport_height', '')::INTEGER, v_event_name, v_product_id, v_product_name
  ) ON CONFLICT (session_id) DO UPDATE SET
    last_seen_at = NOW(),
    parent_session_id = CASE WHEN link_analytics_sessions.parent_session_id = '' THEN EXCLUDED.parent_session_id ELSE link_analytics_sessions.parent_session_id END,
    city = CASE WHEN link_analytics_sessions.city = '' THEN EXCLUDED.city ELSE link_analytics_sessions.city END,
    region = CASE WHEN link_analytics_sessions.region = '' THEN EXCLUDED.region ELSE link_analytics_sessions.region END,
    country = CASE WHEN link_analytics_sessions.country = '' THEN EXCLUDED.country ELSE link_analytics_sessions.country END,
    timezone = CASE WHEN link_analytics_sessions.timezone = '' THEN EXCLUDED.timezone ELSE link_analytics_sessions.timezone END,
    source = CASE WHEN link_analytics_sessions.source = 'Direto' AND EXCLUDED.source <> 'Direto' THEN EXCLUDED.source ELSE link_analytics_sessions.source END,
    medium = CASE WHEN link_analytics_sessions.medium = 'none' AND EXCLUDED.medium <> 'none' THEN EXCLUDED.medium ELSE link_analytics_sessions.medium END,
    campaign = CASE WHEN link_analytics_sessions.campaign = '' THEN EXCLUDED.campaign ELSE link_analytics_sessions.campaign END,
    device_type = EXCLUDED.device_type, browser = EXCLUDED.browser, os = EXCLUDED.os,
    language = EXCLUDED.language, last_event = v_event_name,
    product_id = CASE WHEN EXCLUDED.product_id <> '' THEN EXCLUDED.product_id ELSE link_analytics_sessions.product_id END,
    product_name = CASE WHEN EXCLUDED.product_name <> '' THEN EXCLUDED.product_name ELSE link_analytics_sessions.product_name END,
    updated_at = NOW();

  INSERT INTO public.link_analytics_events (
    event_id, session_id, visitor_id, site_id, event_name, path, link_id, link_label,
    target_url, link_position, section, product_id, product_name, value_cents,
    transaction_id, properties
  ) VALUES (
    v_event_id, v_session_id, v_visitor_id, v_site_id, v_event_name, v_path, v_link_id,
    v_link_label, v_target_url, NULLIF(v_link_position, 0), v_section, v_product_id,
    v_product_name, v_value_cents, v_transaction_id,
    jsonb_build_object('duration_seconds', v_duration, 'max_scroll', v_scroll,
                       'seconds_before_click', v_seconds_before_click)
  ) ON CONFLICT DO NOTHING;

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
    click_count = click_count + CASE WHEN v_is_click THEN 1 ELSE 0 END,
    first_click_after_seconds = CASE WHEN v_is_click AND first_click_after_seconds IS NULL THEN v_seconds_before_click ELSE first_click_after_seconds END,
    last_link_id = CASE WHEN v_is_click THEN v_link_id ELSE last_link_id END,
    last_link_label = CASE WHEN v_is_click THEN v_link_label ELSE last_link_label END,
    last_link_url = CASE WHEN v_is_click THEN v_target_url ELSE last_link_url END,
    converted = converted OR v_event_name = 'purchase',
    revenue_cents = CASE WHEN v_event_name = 'purchase' THEN GREATEST(revenue_cents, v_value_cents) ELSE revenue_cents END,
    transaction_id = CASE WHEN v_event_name = 'purchase' THEN v_transaction_id ELSE transaction_id END,
    product_id = CASE WHEN v_product_id <> '' THEN v_product_id ELSE product_id END,
    product_name = CASE WHEN v_product_name <> '' THEN v_product_name ELSE product_name END,
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

DROP FUNCTION IF EXISTS public.get_link_dashboard(TEXT, INTEGER);

CREATE FUNCTION public.get_link_dashboard(p_password TEXT, p_days INTEGER DEFAULT 7, p_site TEXT DEFAULT 'all')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_days INTEGER := LEAST(90, GREATEST(1, COALESCE(p_days, 7)));
  v_site TEXT := COALESCE(NULLIF(p_site, ''), 'all');
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
  v_checkouts INTEGER := 0;
  v_purchases INTEGER := 0;
  v_revenue BIGINT := 0;
  v_result JSONB;
BEGIN
  IF v_site NOT IN ('all', 'linkhub', 'apostila_combo') THEN v_site := 'all'; END IF;
  SELECT password_hash INTO v_password_hash FROM public.link_analytics_config WHERE config_key = 'dashboard';
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
         COUNT(*) FILTER (WHERE click_count = 0 AND engaged_seconds < 10)::INTEGER,
         COUNT(*) FILTER (WHERE converted)::INTEGER, COALESCE(SUM(revenue_cents), 0)::BIGINT
  INTO v_sessions, v_visitors, v_clicks, v_clicked_sessions, v_avg_engagement,
       v_avg_scroll, v_avg_click_time, v_quick_exits, v_purchases, v_revenue
  FROM public.link_analytics_sessions
  WHERE started_at >= v_since AND (v_site = 'all' OR site_id = v_site);

  SELECT COUNT(DISTINCT session_id)::INTEGER INTO v_checkouts
  FROM public.link_analytics_events
  WHERE occurred_at >= v_since AND event_name = 'checkout_started'
    AND (v_site = 'all' OR site_id = v_site);

  SELECT COUNT(*)::INTEGER, COUNT(DISTINCT visitor_id)::INTEGER
  INTO v_previous_sessions, v_previous_visitors
  FROM public.link_analytics_sessions
  WHERE started_at >= v_previous_since AND started_at < v_since
    AND (v_site = 'all' OR site_id = v_site);

  SELECT jsonb_build_object(
    'range_days', v_days,
    'site', v_site,
    'generated_at', NOW(),
    'summary', jsonb_build_object(
      'sessions', v_sessions, 'visitors', v_visitors, 'clicks', v_clicks,
      'clicked_sessions', v_clicked_sessions, 'checkouts', v_checkouts,
      'purchases', v_purchases, 'revenue_cents', v_revenue,
      'click_rate', CASE WHEN v_sessions > 0 THEN ROUND(v_clicked_sessions * 100.0 / v_sessions, 1) ELSE 0 END,
      'purchase_rate', CASE WHEN v_sessions > 0 THEN ROUND(v_purchases * 100.0 / v_sessions, 2) ELSE 0 END,
      'avg_engagement', ROUND(v_avg_engagement, 1), 'avg_scroll', ROUND(v_avg_scroll, 1),
      'avg_click_time', ROUND(v_avg_click_time, 1),
      'quick_exit_rate', CASE WHEN v_sessions > 0 THEN ROUND(v_quick_exits * 100.0 / v_sessions, 1) ELSE 0 END,
      'sessions_delta', CASE WHEN v_previous_sessions > 0 THEN ROUND((v_sessions - v_previous_sessions) * 100.0 / v_previous_sessions, 1) ELSE 0 END,
      'visitors_delta', CASE WHEN v_previous_visitors > 0 THEN ROUND((v_visitors - v_previous_visitors) * 100.0 / v_previous_visitors, 1) ELSE 0 END
    ),
    'sites', COALESCE((SELECT jsonb_agg(row_to_json(x) ORDER BY x.sessions DESC) FROM (
      SELECT site_id, COUNT(*)::INTEGER sessions, COUNT(*) FILTER (WHERE click_count > 0)::INTEGER clicked_sessions,
             COUNT(*) FILTER (WHERE converted)::INTEGER purchases, COALESCE(SUM(revenue_cents), 0)::BIGINT revenue_cents,
             ROUND(AVG(engaged_seconds), 1) avg_engagement
      FROM public.link_analytics_sessions WHERE started_at >= v_since GROUP BY site_id
    ) x), '[]'::jsonb),
    'funnel', jsonb_build_array(
      jsonb_build_object('key','hub_visit','label','Entrou nos links','value',(SELECT COUNT(*) FROM public.link_analytics_sessions WHERE started_at >= v_since AND site_id='linkhub')),
      jsonb_build_object('key','apostila_click','label','Clicou nas apostilas','value',(SELECT COUNT(DISTINCT session_id) FROM public.link_analytics_events WHERE occurred_at >= v_since AND site_id='linkhub' AND event_name='link_click' AND target_url ILIKE '%apostila-promo%')),
      jsonb_build_object('key','apostila_visit','label','Abriu a página de vendas','value',(SELECT COUNT(*) FROM public.link_analytics_sessions WHERE started_at >= v_since AND site_id='apostila_combo')),
      jsonb_build_object('key','cta_click','label','Clicou em comprar','value',(SELECT COUNT(DISTINCT session_id) FROM public.link_analytics_events WHERE occurred_at >= v_since AND site_id='apostila_combo' AND event_name='cta_click')),
      jsonb_build_object('key','checkout','label','Iniciou checkout','value',(SELECT COUNT(DISTINCT session_id) FROM public.link_analytics_events WHERE occurred_at >= v_since AND site_id='apostila_combo' AND event_name='checkout_started')),
      jsonb_build_object('key','purchase','label','Comprou','value',(SELECT COUNT(DISTINCT session_id) FROM public.link_analytics_events WHERE occurred_at >= v_since AND site_id='apostila_combo' AND event_name='purchase'))
    ),
    'timeline', COALESCE((SELECT jsonb_agg(row_to_json(x) ORDER BY x.bucket) FROM (
      SELECT CASE WHEN v_days = 1 THEN TO_CHAR(date_trunc('hour', started_at AT TIME ZONE 'America/Fortaleza'), 'YYYY-MM-DD HH24:00')
                  ELSE TO_CHAR(date_trunc('day', started_at AT TIME ZONE 'America/Fortaleza'), 'YYYY-MM-DD') END bucket,
             COUNT(*)::INTEGER sessions, COALESCE(SUM(click_count),0)::INTEGER clicks,
             COUNT(*) FILTER (WHERE converted)::INTEGER purchases
      FROM public.link_analytics_sessions WHERE started_at >= v_since AND (v_site='all' OR site_id=v_site)
      GROUP BY 1
    ) x), '[]'::jsonb),
    'links', COALESCE((SELECT jsonb_agg(row_to_json(x) ORDER BY x.clicks DESC, x.position ASC) FROM (
      SELECT site_id, COALESCE(NULLIF(link_id,''), target_url) link_id, MAX(link_label) label,
             MAX(target_url) target_url, MIN(link_position) position, MAX(section) section,
             COUNT(*)::INTEGER clicks, COUNT(DISTINCT session_id)::INTEGER unique_sessions,
             ROUND(AVG(COALESCE((properties->>'seconds_before_click')::NUMERIC,0)),1) avg_seconds_before_click,
             CASE WHEN v_sessions>0 THEN ROUND(COUNT(DISTINCT session_id)*100.0/v_sessions,1) ELSE 0 END session_click_rate
      FROM public.link_analytics_events
      WHERE occurred_at>=v_since AND event_name IN ('link_click','cta_click','outbound_click') AND (v_site='all' OR site_id=v_site)
      GROUP BY site_id, COALESCE(NULLIF(link_id,''), target_url) ORDER BY COUNT(*) DESC LIMIT 60
    ) x), '[]'::jsonb),
    'offers', COALESCE((SELECT jsonb_agg(row_to_json(x) ORDER BY x.cta_clicks DESC) FROM (
      SELECT product_id, MAX(product_name) product_name,
             COUNT(*) FILTER (WHERE event_name='cta_click')::INTEGER cta_clicks,
             COUNT(DISTINCT session_id) FILTER (WHERE event_name='checkout_started')::INTEGER checkouts,
             COUNT(DISTINCT session_id) FILTER (WHERE event_name='purchase')::INTEGER purchases,
             COALESCE(SUM(value_cents) FILTER (WHERE event_name='purchase'),0)::BIGINT revenue_cents
      FROM public.link_analytics_events
      WHERE occurred_at>=v_since AND site_id='apostila_combo' AND product_id<>''
      GROUP BY product_id ORDER BY COUNT(*) FILTER (WHERE event_name='cta_click') DESC LIMIT 30
    ) x), '[]'::jsonb),
    'sources', COALESCE((SELECT jsonb_agg(row_to_json(x) ORDER BY x.sessions DESC) FROM (
      SELECT source, medium, COUNT(*)::INTEGER sessions, COUNT(*) FILTER (WHERE click_count>0)::INTEGER clicked_sessions,
             COUNT(*) FILTER (WHERE converted)::INTEGER purchases, COALESCE(SUM(click_count),0)::INTEGER clicks,
             COALESCE(SUM(revenue_cents),0)::BIGINT revenue_cents, ROUND(AVG(engaged_seconds),1) avg_engagement,
             ROUND(COUNT(*) FILTER (WHERE click_count>0)*100.0/NULLIF(COUNT(*),0),1) click_rate
      FROM public.link_analytics_sessions WHERE started_at>=v_since AND (v_site='all' OR site_id=v_site)
      GROUP BY source,medium ORDER BY COUNT(*) DESC LIMIT 30
    ) x), '[]'::jsonb),
    'geography', COALESCE((SELECT jsonb_agg(row_to_json(x) ORDER BY x.sessions DESC) FROM (
      SELECT country,region,city,COUNT(*)::INTEGER sessions,COUNT(*) FILTER (WHERE click_count>0)::INTEGER clicked_sessions,
             COUNT(*) FILTER (WHERE converted)::INTEGER purchases,COALESCE(SUM(click_count),0)::INTEGER clicks
      FROM public.link_analytics_sessions WHERE started_at>=v_since AND (v_site='all' OR site_id=v_site)
        AND (country<>'' OR region<>'' OR city<>'')
      GROUP BY country,region,city ORDER BY COUNT(*) DESC LIMIT 50
    ) x), '[]'::jsonb),
    'devices', COALESCE((SELECT jsonb_agg(row_to_json(x) ORDER BY x.sessions DESC) FROM (
      SELECT device_type,COUNT(*)::INTEGER sessions,COUNT(*) FILTER (WHERE click_count>0)::INTEGER clicked_sessions,
             COUNT(*) FILTER (WHERE converted)::INTEGER purchases,ROUND(AVG(engaged_seconds),1) avg_engagement
      FROM public.link_analytics_sessions WHERE started_at>=v_since AND (v_site='all' OR site_id=v_site)
      GROUP BY device_type
    ) x), '[]'::jsonb),
    'browsers', COALESCE((SELECT jsonb_agg(row_to_json(x) ORDER BY x.sessions DESC) FROM (
      SELECT browser,os,COUNT(*)::INTEGER sessions FROM public.link_analytics_sessions
      WHERE started_at>=v_since AND (v_site='all' OR site_id=v_site)
      GROUP BY browser,os ORDER BY COUNT(*) DESC LIMIT 20
    ) x), '[]'::jsonb),
    'campaigns', COALESCE((SELECT jsonb_agg(row_to_json(x) ORDER BY x.sessions DESC) FROM (
      SELECT campaign,source,COUNT(*)::INTEGER sessions,COUNT(*) FILTER (WHERE converted)::INTEGER purchases,
             COALESCE(SUM(click_count),0)::INTEGER clicks,COALESCE(SUM(revenue_cents),0)::BIGINT revenue_cents
      FROM public.link_analytics_sessions WHERE started_at>=v_since AND campaign<>'' AND (v_site='all' OR site_id=v_site)
      GROUP BY campaign,source ORDER BY COUNT(*) DESC LIMIT 30
    ) x), '[]'::jsonb),
    'source_links', COALESCE((SELECT jsonb_agg(row_to_json(x) ORDER BY x.clicks DESC) FROM (
      SELECT s.source,e.site_id,e.link_id,MAX(e.link_label) label,COUNT(*)::INTEGER clicks,
             COUNT(DISTINCT e.session_id)::INTEGER sessions
      FROM public.link_analytics_events e JOIN public.link_analytics_sessions s ON s.session_id=e.session_id
      WHERE e.occurred_at>=v_since AND e.event_name IN ('link_click','cta_click','outbound_click') AND (v_site='all' OR e.site_id=v_site)
      GROUP BY s.source,e.site_id,e.link_id ORDER BY COUNT(*) DESC LIMIT 60
    ) x), '[]'::jsonb),
    'hours', COALESCE((SELECT jsonb_agg(row_to_json(x) ORDER BY x.hour_of_day) FROM (
      SELECT EXTRACT(HOUR FROM started_at AT TIME ZONE 'America/Fortaleza')::INTEGER hour_of_day,
             COUNT(*)::INTEGER sessions,COUNT(*) FILTER (WHERE click_count>0)::INTEGER clicked_sessions,
             COUNT(*) FILTER (WHERE converted)::INTEGER purchases
      FROM public.link_analytics_sessions WHERE started_at>=v_since AND (v_site='all' OR site_id=v_site) GROUP BY 1
    ) x), '[]'::jsonb),
    'weekdays', COALESCE((SELECT jsonb_agg(row_to_json(x) ORDER BY x.weekday) FROM (
      SELECT EXTRACT(ISODOW FROM started_at AT TIME ZONE 'America/Fortaleza')::INTEGER weekday,
             COUNT(*)::INTEGER sessions,COUNT(*) FILTER (WHERE click_count>0)::INTEGER clicked_sessions,
             COUNT(*) FILTER (WHERE converted)::INTEGER purchases
      FROM public.link_analytics_sessions WHERE started_at>=v_since AND (v_site='all' OR site_id=v_site) GROUP BY 1
    ) x), '[]'::jsonb),
    'recent_sessions', COALESCE((SELECT jsonb_agg(row_to_json(x) ORDER BY x.last_seen_at DESC) FROM (
      SELECT session_id,parent_session_id,site_id,started_at,last_seen_at,source,medium,campaign,city,region,country,
             device_type,browser,os,engaged_seconds,max_scroll,click_count,first_click_after_seconds,
             last_link_id,last_link_label,last_link_url,last_event,converted,revenue_cents,product_id,product_name
      FROM public.link_analytics_sessions WHERE started_at>=v_since AND (v_site='all' OR site_id=v_site)
      ORDER BY last_seen_at DESC LIMIT 70
    ) x), '[]'::jsonb)
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
  v_root TEXT;
  v_result JSONB;
BEGIN
  SELECT password_hash INTO v_password_hash FROM public.link_analytics_config WHERE config_key='dashboard';
  IF v_password_hash IS NULL OR p_password IS NULL OR v_password_hash <> crypt(p_password,v_password_hash) THEN
    RAISE EXCEPTION 'invalid_password' USING ERRCODE='28000';
  END IF;
  IF p_session_id !~ '^[A-Za-z0-9:_-]{8,120}$' THEN RAISE EXCEPTION 'invalid_session'; END IF;
  SELECT COALESCE(NULLIF(parent_session_id,''),session_id) INTO v_root
  FROM public.link_analytics_sessions WHERE session_id=p_session_id;
  IF v_root IS NULL THEN v_root:=p_session_id; END IF;

  SELECT jsonb_build_object(
    'sessions',COALESCE((SELECT jsonb_agg(row_to_json(s) ORDER BY s.started_at) FROM (
      SELECT session_id,parent_session_id,site_id,started_at,last_seen_at,source,medium,campaign,city,region,country,
             device_type,browser,os,engaged_seconds,max_scroll,click_count,last_event,converted,revenue_cents,
             product_id,product_name
      FROM public.link_analytics_sessions WHERE session_id=v_root OR parent_session_id=v_root ORDER BY started_at
    ) s),'[]'::jsonb),
    'events',COALESCE((SELECT jsonb_agg(row_to_json(e) ORDER BY e.occurred_at) FROM (
      SELECT event_name,occurred_at,site_id,path,link_id,link_label,target_url,link_position,section,
             product_id,product_name,value_cents,transaction_id,properties
      FROM public.link_analytics_events WHERE session_id IN (
        SELECT session_id FROM public.link_analytics_sessions WHERE session_id=v_root OR parent_session_id=v_root
      ) ORDER BY occurred_at LIMIT 700
    ) e),'[]'::jsonb)
  ) INTO v_result;
  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_link_dashboard(TEXT,INTEGER,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_link_dashboard(TEXT,INTEGER,TEXT) TO anonymous;
GRANT EXECUTE ON FUNCTION public.track_link_event(JSONB) TO anonymous;
GRANT EXECUTE ON FUNCTION public.get_link_journey(TEXT,TEXT) TO anonymous;

NOTIFY pgrst, 'reload schema';
