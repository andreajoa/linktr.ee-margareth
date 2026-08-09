import { callAnalyticsRpc, dashboardRequestAllowed, readBody } from './_analytics.js';

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'private, no-store, max-age=0');
  response.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error:'Método não permitido.' });
  }
  if (!dashboardRequestAllowed(request)) return response.status(403).json({ error:'Acesso negado.' });

  const body = readBody(request);
  const password = typeof body.password === 'string' ? body.password.slice(0, 200) : '';
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId.slice(0, 120) : '';
  if (!password || !/^[A-Za-z0-9:_-]{8,120}$/.test(sessionId)) {
    return response.status(400).json({ error:'Dados inválidos.' });
  }

  try {
    const data = await callAnalyticsRpc('get_link_journey', {
      p_password:password,
      p_session_id:sessionId,
    });
    return response.status(200).json(data);
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) {
      return response.status(401).json({ error:'Não foi possível abrir esta jornada.' });
    }
    console.error('journey_rpc_error', { status:error?.status || 0, message:error instanceof Error ? error.message : 'unknown' });
    return response.status(503).json({ error:'A conexão demorou. Tente abrir a jornada novamente.' });
  }
}
