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
  const days = [1,7,30,90].includes(Number(body.days)) ? Number(body.days) : 7;
  const site = ['all','linkhub','apostila_combo'].includes(body.site) ? body.site : 'all';
  if (!password) return response.status(401).json({ error:'Informe a senha.' });

  try {
    const data = await callAnalyticsRpc('get_link_dashboard', {
      p_password:password,
      p_days:days,
      p_site:site,
    });
    return response.status(200).json(data);
  } catch {
    return response.status(401).json({ error:'Senha incorreta ou painel indisponível.' });
  }
}
