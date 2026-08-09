import { callAnalyticsRpc, dashboardRequestAllowed } from './_analytics.js';

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store, max-age=0');
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).end();
  }
  if (!dashboardRequestAllowed(request)) return response.status(403).end();

  try {
    await callAnalyticsRpc('track_link_event', { payload:{} });
    return response.status(204).end();
  } catch (error) {
    console.warn('analytics_warmup_failed', { status:error?.status || 0, message:error instanceof Error ? error.message : 'unknown' });
    return response.status(202).end();
  }
}
