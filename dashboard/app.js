(() => {
  const PASSWORD_KEY = 'ma_dashboard_password';
  const TOKEN_KEY = 'ma_dashboard_anon_token';
  const CACHE_PREFIX = 'ma_dashboard_data_';
  const AUTH_URL = 'https://ep-square-credit-ayz2x9qc.neonauth.c-5.us-east-2.aws.neon.tech/neondb/auth';
  const DATA_API_URL = 'https://ep-square-credit-ayz2x9qc.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1';
  const state = { password:sessionStorage.getItem(PASSWORD_KEY) || '', days:7, site:'all', data:null };
  const $ = (id) => document.getElementById(id);
  const siteNames = { linkhub:'Página de links', apostila_combo:'Combo de apostilas', all:'Todos os sites' };
  const eventNames = {
    page_view:'Abriu a página', engagement:'Permaneceu ativo', link_click:'Clicou em um link',
    scroll_depth:'Avançou na página', session_end:'Saiu da página', cta_click:'Clicou em comprar',
    outbound_click:'Abriu outro produto', lead_submitted:'Preencheu os dados',
    checkout_started:'Iniciou o checkout', purchase:'Compra confirmada', purchase_page:'Viu o acesso da compra',
  };

  function esc(value) { return String(value ?? '').replace(/[&<>'"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function n(value) { const parsed = Number(value || 0); return Number.isFinite(parsed) ? parsed : 0; }
  function number(value) { return new Intl.NumberFormat('pt-BR').format(Math.round(n(value))); }
  function money(cents) { return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n(cents)/100); }
  function pct(value, digits=1) { return `${n(value).toFixed(digits).replace('.',',')}%`; }
  function duration(seconds) { const value=Math.round(n(seconds)); if(value<60)return `${value}s`; return `${Math.floor(value/60)}m ${value%60}s`; }
  function when(value) { try{return new Date(value).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});}catch{return '—';} }
  function empty(cols, text) { return `<tr><td class="empty" colspan="${cols}">${esc(text)}</td></tr>`; }
  function timeoutSignal(milliseconds) {
    if(typeof AbortSignal.timeout==='function')return AbortSignal.timeout(milliseconds);
    const controller=new AbortController();setTimeout(()=>controller.abort(),milliseconds);return controller.signal;
  }

  let tokenPromise=null;
  function anonymousToken() {
    if(tokenPromise)return tokenPromise;
    try{
      const cached=JSON.parse(sessionStorage.getItem(TOKEN_KEY)||'null');
      if(cached?.token&&Number(cached.expiresAt)>Math.floor(Date.now()/1000)+60)return Promise.resolve(cached.token);
    }catch{}
    tokenPromise=fetch(`${AUTH_URL}/token/anonymous`,{headers:{Accept:'application/json'},cache:'no-store',signal:timeoutSignal(8000)})
      .then(async(response)=>{const data=await response.json().catch(()=>({}));if(!response.ok||!data.token)throw new Error('Falha na conexão segura.');sessionStorage.setItem(TOKEN_KEY,JSON.stringify({token:data.token,expiresAt:Number(data.expires_at||0)}));return data.token;})
      .catch((error)=>{tokenPromise=null;throw error;});
    return tokenPromise;
  }

  async function directRpc(name,body) {
    const token=await anonymousToken();
    const response=await fetch(`${DATA_API_URL}/rpc/${name}`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(body),cache:'no-store',signal:timeoutSignal(12000)});
    const data=await response.json().catch(()=>({}));
    if(!response.ok){const error=new Error('rpc_failed');error.status=response.status;throw error;}
    return data;
  }

  async function sameOriginRpc(path,body) {
    let response;
    try{response=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store',signal:timeoutSignal(22000)});}
    catch{throw new Error('A conexão demorou mais que o esperado. Tente entrar novamente.');}
    const data=await response.json().catch(()=>({}));
    if(!response.ok){const error=new Error(data.error||'Não foi possível abrir o painel.');error.status=response.status;throw error;}
    return data;
  }

  function dataCacheKey(){return `${CACHE_PREFIX}${state.days}_${state.site}`;}
  function cachedDashboard(){try{return JSON.parse(sessionStorage.getItem(dataCacheKey())||'null');}catch{return null;}}
  function clearDashboardSession(){for(const key of Object.keys(sessionStorage))if(key===PASSWORD_KEY||key===TOKEN_KEY||key.startsWith(CACHE_PREFIX))sessionStorage.removeItem(key);}

  let directReady=false;
  directRpc('track_link_event',{payload:{}}).then(()=>true).catch(async()=>{
    try{const response=await fetch('/api/warm',{method:'POST',cache:'no-store',signal:timeoutSignal(10000)});return response.status===204;}catch{return false;}
  }).then((ready)=>{
    directReady=ready;
    const status=$('connectionStatus');
    if(status){status.classList.toggle('ready',ready);status.lastChild.textContent=ready?' Conexão pronta':' Conexão será concluída ao entrar';}
  });

  function kpi(label, value, detail, accent=false) {
    return `<article class="kpi${accent?' accent':''}"><div class="kpi-label">${esc(label)}</div><div class="kpi-value">${esc(value)}</div><div class="kpi-detail">${esc(detail)}</div></article>`;
  }

  function renderKpis(data) {
    const s=data.summary;
    $('kpis').innerHTML=[
      kpi('VISITANTES',number(s.visitors),`${s.visitors_delta>=0?'+':''}${pct(s.visitors_delta)} vs. período anterior`),
      kpi('SESSÕES',number(s.sessions),`${s.sessions_delta>=0?'+':''}${pct(s.sessions_delta)} vs. período anterior`),
      kpi('TAXA DE CLIQUE',pct(s.click_rate),`${number(s.clicked_sessions)} sessões com clique`,true),
      kpi('CLIQUES',number(s.clicks),`${s.sessions? (s.clicks/s.sessions).toFixed(1).replace('.',','):'0'} por sessão`),
      kpi('TEMPO ATIVO',duration(s.avg_engagement),'Média por sessão'),
      kpi('INÍCIO DE CHECKOUT',number(s.checkouts),'Pagamento aberto'),
      kpi('COMPRAS',number(s.purchases),`${pct(s.purchase_rate,2)} das sessões`),
      kpi('RECEITA',money(s.revenue_cents),'Compras confirmadas pela Stripe'),
    ].join('');
  }

  function dropAnalysis(funnel) {
    let biggest=null;
    for(let i=1;i<funnel.length;i++){
      const from=n(funnel[i-1].value),to=n(funnel[i].value);
      if(!from)continue;
      const drop=(from-to)*100/from;
      if(!biggest||drop>biggest.drop)biggest={from:funnel[i-1].label,to:funnel[i].label,drop};
    }
    return biggest;
  }

  function generateInsights(data) {
    const s=data.summary, insights=[];
    if(s.sessions<20) insights.push({tone:'info',title:'Base ainda pequena',text:`Há ${s.sessions} sessão(ões) no período. O painel já está medindo, mas decisões maiores ficam mais seguras a partir de cerca de 20 sessões.`,action:'Continue divulgando com UTMs para formar uma base comparável.'});
    if(s.sessions>=10&&s.quick_exit_rate>=45) insights.push({tone:'warn',title:'Muitas saídas rápidas',text:`${pct(s.quick_exit_rate)} saem antes de 10 segundos sem clicar. A promessa inicial pode não estar confirmando o que trouxe a pessoa até a página.`,action:'Alinhe o primeiro título à promessa do post ou anúncio.'});
    if(s.sessions>=10&&s.click_rate<25) insights.push({tone:'warn',title:'Poucas pessoas avançam',text:`A taxa de clique está em ${pct(s.click_rate)}. Há atenção, mas pouca decisão.`,action:'Destaque uma ação principal e reduza a competição visual entre links.'});
    if(s.sessions>=10&&s.click_rate>=40) insights.push({tone:'good',title:'Boa intenção de avanço',text:`${pct(s.click_rate)} das sessões geram ao menos um clique.`,action:'Preserve o destaque dos primeiros links e teste mudanças pequenas.'});
    if(s.avg_click_time>=45&&s.clicked_sessions>=5) insights.push({tone:'warn',title:'A decisão está demorando',text:`Quem clica leva em média ${duration(s.avg_click_time)}.`,action:'Leve a oferta mais importante para mais perto do início da página.'});
    if(data.links?.length){
      const top=data.links[0];
      if(n(top.position)>5&&n(top.clicks)>=3) insights.push({tone:'good',title:'Um link escondido está forte',text:`“${top.label||'Link'}” lidera mesmo na posição ${top.position}.`,action:'Teste movê-lo para uma das três primeiras posições.'});
      const total=data.links.reduce((sum,item)=>sum+n(item.clicks),0);
      if(total&&n(top.clicks)/total>=.5) insights.push({tone:'info',title:'Um interesse domina',text:`“${top.label||'Link'}” concentra ${pct(n(top.clicks)*100/total)} dos cliques.`,action:'Use esse interesse como porta de entrada e conecte os demais produtos a ele.'});
    }
    const drop=dropAnalysis(data.funnel||[]);
    if(drop&&drop.drop>=50) insights.push({tone:'warn',title:'Maior vazamento do funil',text:`De “${drop.from}” para “${drop.to}”, a queda é de ${pct(drop.drop)}.`,action:drop.to.includes('checkout')?'Reforce segurança, forma de pagamento e o que será recebido junto ao botão.':drop.to.includes('comprar')?'Torne a oferta e o preço visíveis antes da rolagem.':'Revise a continuidade entre a promessa do link e a página seguinte.'});
    if(s.checkouts>=5&&s.purchases/s.checkouts<.35) insights.push({tone:'warn',title:'Checkout aberto, compra baixa',text:`${s.checkouts} checkout(s) resultaram em ${s.purchases} compra(s).`,action:'Verifique objeções de pagamento, confiança e abandono no formulário.'});
    const qualified=(data.sources||[]).filter((item)=>n(item.sessions)>=5).sort((a,b)=>n(b.click_rate)-n(a.click_rate));
    if(qualified[0]) insights.push({tone:'good',title:'Origem mais eficiente',text:`${qualified[0].source} gera ${pct(qualified[0].click_rate)} de sessões com clique.`,action:'Repita o tipo de conteúdo e a promessa que trazem esse público.'});
    const devices=data.devices||[];
    const mobile=devices.find((item)=>item.device_type==='mobile');
    if(s.sessions&&mobile&&n(mobile.sessions)/s.sessions>=.7) insights.push({tone:'info',title:'O mobile decide tudo',text:`${pct(n(mobile.sessions)*100/s.sessions)} das sessões são pelo celular.`,action:'Avalie sempre títulos, ordem dos links e checkout primeiro na tela pequena.'});
    const hot=[...(data.hours||[])].sort((a,b)=>n(b.clicked_sessions)-n(a.clicked_sessions)||n(b.sessions)-n(a.sessions))[0];
    if(hot&&n(hot.sessions)>=3) insights.push({tone:'info',title:'Horário com mais resposta',text:`Por volta de ${String(hot.hour_of_day).padStart(2,'0')}h houve ${hot.sessions} sessão(ões) e ${hot.clicked_sessions} com clique.`,action:'Teste publicar e reforçar stories pouco antes desse horário.'});
    if(!insights.length) insights.push({tone:'info',title:'Coleta em andamento',text:'Ainda não há volume suficiente para apontar uma mudança segura.',action:'Mantenha os links atuais enquanto o painel reúne dados reais.'});
    return insights.slice(0,6);
  }

  function renderInsights(data) {
    $('insights').innerHTML=generateInsights(data).map((item)=>`<article class="insight ${item.tone}"><h3>${esc(item.title)}</h3><p>${esc(item.text)}<strong>Próxima ação: ${esc(item.action)}</strong></p></article>`).join('');
  }

  function renderFunnel(items) {
    $('funnel').innerHTML=(items||[]).map((item,index)=>{
      const previous=index?n(items[index-1].value):n(item.value),current=n(item.value);
      const pass=index&&previous?current*100/previous:100;
      return `<article class="funnel-step"><small>Etapa ${index+1}</small><strong>${number(current)}</strong><span>${esc(item.label)}${index?` · ${pct(pass)} avançaram`:''}</span></article>`;
    }).join('')||'<p class="empty">Ainda não há dados no funil.</p>';
  }

  function renderTimeline(items) {
    const max=Math.max(1,...(items||[]).map((item)=>n(item.sessions)));
    $('timeline').innerHTML=(items||[]).map((item)=>{
      const height=Math.max(3,n(item.sessions)*100/max);
      const title=`${item.bucket}: ${item.sessions} sessões, ${item.clicks} cliques, ${item.purchases||0} compras`;
      return `<i class="timeline-bar" style="height:${height}%" data-title="${esc(title)}"></i>`;
    }).join('')||'<p class="empty">A curva aparecerá com as primeiras visitas.</p>';
  }

  function renderSites(items) {
    $('sites').innerHTML=(items||[]).map((item)=>`<article class="site-card"><small>${esc(siteNames[item.site_id]||item.site_id)}</small><strong>${number(item.sessions)}</strong><p>${number(item.clicked_sessions)} com clique · ${duration(item.avg_engagement)} ativos · ${number(item.purchases)} compra(s)</p></article>`).join('')||'<p class="empty">Nenhum site recebeu visitas ainda.</p>';
  }

  function renderLinks(items) {
    $('links').innerHTML=(items||[]).map((item)=>`<tr><td><strong>${esc(item.label||item.link_id||'Ação')}</strong><small>${esc(siteNames[item.site_id]||item.site_id)}${item.position?` · posição ${item.position}`:''}</small></td><td>${number(item.clicks)}</td><td>${number(item.unique_sessions)}</td><td>${pct(item.session_click_rate)}</td><td>${duration(item.avg_seconds_before_click)}</td></tr>`).join('')||empty(5,'Os cliques aparecerão aqui.');
  }

  function renderOffers(items) {
    $('offers').innerHTML=(items||[]).map((item)=>`<tr><td><strong>${esc(item.product_name||item.product_id)}</strong><small>${esc(item.product_id)}</small></td><td>${number(item.cta_clicks)}</td><td>${number(item.checkouts)}</td><td>${number(item.purchases)}</td><td>${money(item.revenue_cents)}</td></tr>`).join('')||empty(5,'As ofertas aparecerão após os primeiros cliques em comprar.');
  }

  function barList(id,items,label,value,detail,tone='') {
    const values=(items||[]).map(value),max=Math.max(1,...values);
    $(id).innerHTML=(items||[]).map((item,index)=>`<div><div class="bar-row-head"><strong>${esc(label(item))}</strong><span>${esc(detail(item))}</span></div><div class="bar ${tone}"><i style="width:${Math.max(2,values[index]*100/max)}%"></i></div></div>`).join('')||'<p class="empty">Ainda não há dados suficientes.</p>';
  }

  function renderSources(items) { barList('sources',items,(i)=>i.source||'Direto',(i)=>n(i.sessions),(i)=>`${number(i.sessions)} sessões · ${pct(i.click_rate)} clicam · ${number(i.purchases)} compra(s)`); }
  function renderGeo(items) { barList('geography',items,(i)=>`${i.city||'Cidade não identificada'}${i.region?`/${i.region}`:''}${i.country?` · ${i.country}`:''}`,(i)=>n(i.sessions),(i)=>`${number(i.sessions)} sessões · ${number(i.clicked_sessions)} clicam · ${number(i.purchases)} compra(s)`,'terra'); }
  function renderDevices(items) { barList('devices',items,(i)=>({mobile:'Celular',desktop:'Computador',tablet:'Tablet'}[i.device_type]||i.device_type),(i)=>n(i.sessions),(i)=>`${number(i.sessions)} sessões · ${duration(i.avg_engagement)} ativos`); }

  function simpleList(id,items,left,right,emptyText) {
    $(id).innerHTML=(items||[]).map((item)=>`<div class="simple-row"><strong>${esc(left(item))}</strong><span>${esc(right(item))}</span></div>`).join('')||`<p class="empty">${esc(emptyText)}</p>`;
  }

  function renderHours(items) {
    const max=Math.max(1,...(items||[]).map((i)=>n(i.clicked_sessions)));
    $('hours').innerHTML=Array.from({length:24},(_,hour)=>{
      const item=(items||[]).find((i)=>n(i.hour_of_day)===hour)||{sessions:0,clicked_sessions:0};
      return `<div class="hour${n(item.clicked_sessions)===max&&max>0?' hot':''}"><strong>${String(hour).padStart(2,'0')}h</strong><span>${number(item.sessions)} / ${number(item.clicked_sessions)}</span></div>`;
    }).join('');
  }

  function renderSessions(items) {
    $('sessions').innerHTML=(items||[]).map((item)=>`<tr data-session="${esc(item.session_id)}"><td>${when(item.started_at)}</td><td>${esc(siteNames[item.site_id]||item.site_id)}</td><td><strong>${esc(item.source||'Direto')}</strong><small>${esc(item.medium||'')}</small></td><td>${esc(item.city||'—')}${item.region?`/${esc(item.region)}`:''}<small>${esc(item.country||'')}</small></td><td>${esc(item.device_type)}<small>${esc(item.browser)}</small></td><td>${duration(item.engaged_seconds)}<small>${number(item.max_scroll)}% da página</small></td><td>${number(item.click_count)}</td><td>${esc(eventNames[item.last_event]||item.last_event||'—')}<small>${esc(item.last_link_label||item.product_name||'')}</small></td><td>${item.converted?`<span class="result sale">Comprou · ${money(item.revenue_cents)}</span>`:'<span class="result">Sem compra</span>'}</td></tr>`).join('')||empty(9,'As jornadas aparecerão quando as primeiras pessoas entrarem.');
    $('sessions').querySelectorAll('tr[data-session]').forEach((row)=>row.addEventListener('click',()=>openJourney(row.dataset.session)));
  }

  function render(data) {
    state.data=data;
    $('updatedAt').textContent=`Atualizado em ${new Date(data.generated_at).toLocaleString('pt-BR')} · período de ${data.range_days===1?'hoje':`${data.range_days} dias`} · ${siteNames[data.site]||data.site}`;
    renderKpis(data); renderInsights(data); renderFunnel(data.funnel); renderTimeline(data.timeline);
    renderSites(data.sites); renderLinks(data.links); renderOffers(data.offers); renderSources(data.sources);
    renderGeo(data.geography); renderDevices(data.devices);
    simpleList('browsers',data.browsers,(i)=>`${i.browser} · ${i.os}`,(i)=>`${number(i.sessions)} sessões`,'Navegadores ainda não identificados.');
    renderHours(data.hours);
    simpleList('campaigns',data.campaigns,(i)=>`${i.campaign} · ${i.source}`,(i)=>`${number(i.sessions)} sessões · ${number(i.purchases)} compra(s) · ${money(i.revenue_cents)}`,'Use parâmetros UTM para comparar campanhas.');
    simpleList('sourceLinks',data.source_links,(i)=>`${i.source} → ${i.label||i.link_id}`,(i)=>`${number(i.clicks)} cliques em ${number(i.sessions)} sessões`,'A relação entre origem e ação aparecerá com os cliques.');
    renderSessions(data.recent_sessions);
  }

  async function load(showLoading=true) {
    if(!state.password)return;
    if(showLoading)$('loading').hidden=false;
    try{
      let data;
      if(directReady){
        try{
          data=await directRpc('get_link_dashboard',{p_password:state.password,p_days:state.days,p_site:state.site});
        }catch(error){
          if(error.status===401||error.status===403)throw new Error('Senha incorreta.');
          data=await sameOriginRpc('/api/dashboard',{password:state.password,days:state.days,site:state.site});
        }
      }else{
        data=await sameOriginRpc('/api/dashboard',{password:state.password,days:state.days,site:state.site});
      }
      sessionStorage.setItem(PASSWORD_KEY,state.password);
      sessionStorage.setItem(dataCacheKey(),JSON.stringify(data));
      $('login').hidden=true;$('app').hidden=false;$('loginError').textContent='';
      render(data);
    }catch(error){
      if(!showLoading&&state.data)return;
      if(error.status===401||error.status===403||error.message==='Senha incorreta.'){clearDashboardSession();state.password='';}
      $('app').hidden=true;$('login').hidden=false;
      $('loginError').textContent=error.message||'Senha incorreta.';
    }finally{$('loading').hidden=true;}
  }

  async function openJourney(sessionId) {
    const modal=$('journeyModal'),content=$('journeyContent');
    content.innerHTML='<div class="journey"><h2>Carregando jornada...</h2></div>';modal.showModal();
    try{
      let data;
      if(directReady){
        try{
          data=await directRpc('get_link_journey',{p_password:state.password,p_session_id:sessionId});
        }catch(error){
          if(error.status===401||error.status===403)throw new Error('Não foi possível abrir esta jornada.');
          data=await sameOriginRpc('/api/journey',{password:state.password,sessionId});
        }
      }else{
        data=await sameOriginRpc('/api/journey',{password:state.password,sessionId});
      }
      const sessions=data.sessions||[],events=data.events||[],root=sessions[0]||{};
      content.innerHTML=`<div class="journey"><p class="eyebrow">JORNADA COMPLETA</p><h2>${esc(root.source||'Visita direta')} · ${esc(root.city||'Local não identificado')}</h2><div class="journey-summary"><div><small>Início</small><strong>${when(root.started_at)}</strong></div><div><small>Sites visitados</small><strong>${number(sessions.length)}</strong></div><div><small>Tempo ativo</small><strong>${duration(sessions.reduce((sum,i)=>sum+n(i.engaged_seconds),0))}</strong></div><div><small>Resultado</small><strong>${sessions.some((i)=>i.converted)?'Compra confirmada':'Sem compra'}</strong></div></div><div class="event-list">${events.map((event)=>`<article class="event"><strong>${esc(eventNames[event.event_name]||event.event_name)} · ${esc(siteNames[event.site_id]||event.site_id)}</strong><p>${esc(event.link_label||event.product_name||event.target_url||event.path||'')}</p><time>${when(event.occurred_at)}${event.value_cents?` · ${money(event.value_cents)}`:''}</time></article>`).join('')||'<p>Nenhum evento encontrado.</p>'}</div></div>`;
    }catch(error){content.innerHTML=`<div class="journey"><h2>Não foi possível abrir</h2><p>${esc(error.message)}</p></div>`;}
  }

  $('loginForm').addEventListener('submit',(event)=>{event.preventDefault();state.password=$('password').value;load();});
  $('rangeFilters').addEventListener('click',(event)=>{const button=event.target.closest('[data-days]');if(!button)return;state.days=Number(button.dataset.days);$('rangeFilters').querySelectorAll('button').forEach((item)=>item.classList.toggle('active',item===button));load();});
  $('siteFilter').addEventListener('change',(event)=>{state.site=event.target.value;load();});
  $('refresh').addEventListener('click',()=>load());
  $('logout').addEventListener('click',()=>{clearDashboardSession();location.reload();});
  $('closeJourney').addEventListener('click',()=>$('journeyModal').close());
  $('journeyModal').addEventListener('click',(event)=>{if(event.target===$('journeyModal'))$('journeyModal').close();});
  if(state.password){const cached=cachedDashboard();if(cached){$('login').hidden=true;$('app').hidden=false;render(cached);load(false);}else load();}
})();
