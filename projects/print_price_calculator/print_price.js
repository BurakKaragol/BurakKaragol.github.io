/* 3B Baskı Fiyatlandırma — Final SPA (localStorage) */

// ---------- DOM helpers ----------
const $  = (s, r=document)=>r.querySelector(s);
const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));
const uuid = ()=> (crypto?.randomUUID?.() || `id_${Date.now()}_${Math.random().toString(36).slice(2)}`);
const r2 = n => Math.round((Number(n)+Number.EPSILON)*100)/100;
const r4 = n => Math.round((Number(n)+Number.EPSILON)*10000)/10000;

// ---------- Formatters ----------
function money(n){
  try{
    const cur = state.profile.currency || 'TRY';
    const loc = state.profile.locale || 'tr-TR';
    return new Intl.NumberFormat(loc, {style:'currency', currency:cur, maximumFractionDigits:2}).format(Number(n)||0);
  }catch{
    return `${(Number(n)||0).toFixed(2)} ${(state.profile.currency||'TRY')}`;
  }
}
function numfmt(n){
  try{
    const loc = state.profile.locale || 'tr-TR';
    return new Intl.NumberFormat(loc, {maximumFractionDigits:2}).format(Number(n)||0);
  }catch{ return (Number(n)||0).toFixed(2); }
}
const pad2 = n => String(n).padStart(2,'0');
const fmtDate = (d)=> {
  try{ return new Date(d).toLocaleString(state.profile?.locale||'tr-TR'); }
  catch{ return d || '-'; }
};
const monthKey = (d=new Date()) => `${d.getFullYear()}-${pad2(d.getMonth()+1)}`;

// ---------- Storage / Defaults ----------
const SAVE_KEY = 'pp_app_tr_v3_final';

const defaults = {
  schema: 3,
  profile: { name:'Varsayılan Profil', currency:'TRY', locale:'tr-TR' },
  // Ticari: yalnız fiyatlama katmanları, açıklaması Kurallar/Ticari UI’de verilir
  commercial:{
    mu:0.30,          // kâr marjı (pre üzerine)
    disc:0.00,        // indirim
    tax:0.20,         // KDV vb.
    fee_fix:5,        // sabit ödeme masrafı / iş
    fee_pct:0.02,     // ödeme komisyonu (%)
    P_min:80,         // minimum birim fiyat
    C_admin_job:30,   // iş başı idari gider
    C_license_job:0,  // lisans/paylaşım
    C_pack_unit:8,    // birim ambalaj
    C_ship_var_kg:60  // kargo ₺/kg
  },
  // Kurallar: saatlik gider yapısı
  rulesets:[{
    id:'rs_def', name:'Standart', isActive:true, createdAt:new Date().toISOString(),
    values:{
      t_buffer:0.25,  // boşaltma/soğuma ek süresi (saat)
      s:0.10,         // gözetim oranı (baskı süresinin şu kadarı işçilik)
      r_labor:250,    // işçilik ₺/saat
      p_kWh:4.0,      // enerji ₺/kWh
      C_cap:50000,    // makine capex
      R_resid:5000,   // ömür sonu hurda
      L_hrs:7500,     // ekonomik ömür (saat)
      r_maint_h:1.0,  // bakım ₺/saat
      r_wear_h:0.8,   // yıpranma ₺/saat (kural varsayılanı)
      r_oh_h:4.0      // genel gider ₺/saat
    }
  }],
  materials:[
    { id:'mat_pla', name:'PLA', type:'FDM', p_mat_g:0.35, w_scrap:0.03, color:'#9aa3b2', vendor:'Genel', tags:['PLA'] }
  ],
  printers:[
    { id:'pr_p1s', name:'Bambu P1S', P_avg:120, r_wear_h:0.8, q_fail:0.08, active:true }
  ],
  jobs:[],    // {id,name,client,status,progress,createdAt,startedAt,finishedAt,calcInput,calcResult}
  drafts:[],
  ui:{ logo:null } // base64
};

let state = loadState();

function loadState(){
  try{
    const raw = localStorage.getItem(SAVE_KEY);
    if(raw){
      const s = JSON.parse(raw);
      return migrate(s);
    }
  }catch{}
  localStorage.setItem(SAVE_KEY, JSON.stringify(defaults));
  return structuredClone(defaults);
}
function saveState(){ localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }
function migrate(s){
  // flatten and fill
  if(!s.schema) s.schema=1;
  if(!Array.isArray(s.materials)) s.materials=[];
  if(!Array.isArray(s.printers)) s.printers=[];
  if(!Array.isArray(s.jobs)) s.jobs=[];
  if(!Array.isArray(s.drafts)) s.drafts=[];
  if(!s.profile) s.profile = {...defaults.profile};
  if(!s.commercial) s.commercial = {...defaults.commercial};
  if(!s.rulesets || !s.rulesets.length) s.rulesets = structuredClone(defaults.rulesets);
  if(!s.ui) s.ui = {logo:null};
  s.schema = 3;
  return s;
}
const activeRules = ()=> state.rulesets.find(r=>r.isActive) || state.rulesets[0];

// ---------- Router ----------
const routes = {
  '#/quote'     : renderQuote,
  '#/jobs'      : renderJobs,
  '#/materials' : renderMaterials,
  '#/printers'  : renderPrinters,
  '#/rules'     : renderRules,
  '#/rulesets'  : renderRules,    // tolerate either hash
  '#/commercial': renderCommercial,
  '#/settings'  : renderSettings,
  '#/backups'   : renderBackups
};
function setActiveTab(){
  const hash = location.hash || '#/quote';
  $$('#navTabs a').forEach(a=> a.classList.toggle('active', a.getAttribute('href')===hash));
}
function mount(){
  const hash = location.hash || '#/quote';
  const el = $('#app'); el.innerHTML='';
  (routes[hash]||renderQuote)(el);
  $('#profileChip').textContent = `${state.profile.name} · ${state.profile.locale} · ${state.profile.currency}`;
  setActiveTab();
}
window.addEventListener('hashchange', mount);

// ---------- Hover hint ----------
const hint = $('#hint');
document.addEventListener('mousemove', (e)=>{
  const l = e.target.closest('label');
  const h = l?.dataset?.h;
  if(h){
    hint.textContent = h;
    hint.classList.remove('hidden');
    const x = Math.min(window.innerWidth - 340, e.clientX + 18);
    const y = Math.min(window.innerHeight - 100, e.clientY + 18);
    hint.style.left = x+'px'; hint.style.top = y+'px';
  }else hint.classList.add('hidden');
});

// ---------- Parsers ----------
function parseHours(s){
  if(typeof s==='number') return Number(s)||0;
  if(!s) return 0;
  const m=String(s).trim();
  if(/^\d+(\.\d+)?$/.test(m)) return Number(m);
  const hm=m.match(/(?:(\d+)h)?\s*(?:(\d+)m)?/i);
  if(hm&&(hm[1]||hm[2])) return Number(hm[1]||0)+Number(hm[2]||0)/60;
  const c=m.match(/(\d+):(\d{1,2})/); if(c) return Number(c[1])+Number(c[2])/60;
  return Number(m)||0;
}

// ---------- Calculator ----------
function calcPrice(input){
  const rs = activeRules().values;
  const cm = state.commercial;
  const mat = state.materials.find(m=>m.id===input.materialId);
  const pr  = state.printers.find(p=>p.id===input.printerId);

  const n         = Math.max(1, Number(input.n||1));
  const t_print   = Number(input.t_print||0);
  const m_slicer  = Number(input.m_slicer||0);
  const m_support = Number(input.m_support||0);
  const t_setup   = Number(input.t_setup||0);
  const t_post    = Number(input.t_post||0);
  const mu        = Number(input.mu ?? cm.mu);

  const w_scrap   = Number((mat && mat.w_scrap)!=null ? mat.w_scrap : 0);
  const p_mat_g   = Number((mat && mat.p_mat_g)!=null ? mat.p_mat_g : 0);
  const P_avg     = Number((pr && pr.P_avg)!=null ? pr.P_avg : 0);
  const p_kWh     = Number((rs && rs.p_kWh)!=null ? rs.p_kWh : 0);
  const r_maint_h = Number((rs && rs.r_maint_h)!=null ? rs.r_maint_h : 0);
  const r_wear_rs = Number((rs && rs.r_wear_h)!=null ? rs.r_wear_h : 0);
  const r_wear_pr = Number((pr && pr.r_wear_h)!=null ? pr.r_wear_h : r_wear_rs);
  const r_oh_h    = Number((rs && rs.r_oh_h)!=null ? rs.r_oh_h : 0);
  const s         = Number((rs && rs.s)!=null ? rs.s : 0);
  const r_labor   = Number((rs && rs.r_labor)!=null ? rs.r_labor : 0);
  const t_buffer  = Number((rs && rs.t_buffer)!=null ? rs.t_buffer : 0);

  const t_occ = t_print + t_buffer;

  // Amortisman ~ saatlik makine maliyeti
  const C_cap   = Number((rs && rs.C_cap)!=null ? rs.C_cap : 0);
  const R_resid = Number((rs && rs.R_resid)!=null ? rs.R_resid : 0);
  const L_hrs   = Math.max(1, Number((rs && rs.L_hrs)!=null ? rs.L_hrs : 1));
  const r_machine = (C_cap - R_resid) / L_hrs;

  // Malzeme
  const m_eff = (m_slicer + m_support) * (1 + w_scrap);
  const C_mat = m_eff * p_mat_g;

  // Enerji (kWh)
  const kWh = (P_avg/1000) * t_occ;
  const C_energy = kWh * p_kWh;

  // Saatlik kalemler
  const C_machine = t_occ * r_machine;
  const C_maint   = t_occ * r_maint_h;
  const C_wear    = t_occ * r_wear_pr;
  const C_over    = t_occ * r_oh_h;

  // İşçilik
  const C_labor_print = (s * t_print) * r_labor;
  const C_labor_setup = t_setup * r_labor;
  const C_labor_post_unit = t_post * r_labor;

  // Risk (yeniden baskı riski)
  const q_fail = Number((pr && pr.q_fail)!=null ? pr.q_fail : 0.08);
  const R_fail = 1 / Math.max(0.0001, 1 - q_fail);

  // Üretim ölçeği (riskli)
  const productionScaled = R_fail * (C_mat + C_energy + C_machine + C_maint + C_wear + C_over + C_labor_print);

  // Birim dışı sabitler
  const C_admin_unit = (Number(cm.C_admin_job||0) + Number(cm.C_license_job||0)) / n;
  const C_pack_unit  = Number(cm.C_pack_unit||0);
  const C_ship_unit  = Number(cm.C_ship_var_kg||0) * (m_eff/1000);

  // Pre = maliyet tabanı (birim)
  const pre = productionScaled + (C_labor_setup/n) + C_labor_post_unit + C_admin_unit + C_pack_unit + C_ship_unit;

  // Ticari katmanlar
  const afterMarkup = pre * (1 + mu);
  const afterDisc   = afterMarkup * (1 - Number(cm.disc||0));
  const afterTax    = afterDisc * (1 + Number(cm.tax||0));
  const plusFixed   = afterTax + (Number(cm.fee_fix||0)/n);
  const perUnit     = Math.max(Number(cm.P_min||0), plusFixed) * (1 + Number(cm.fee_pct||0));
  const total       = perUnit * n;

  return {
    lines:{
      C_mat:r2(C_mat), C_energy:r2(C_energy),
      C_machine:r2(C_machine), C_maint:r2(C_maint), C_wear:r2(C_wear), C_over:r2(C_over),
      C_labor_print:r2(C_labor_print), C_labor_setup:r2(C_labor_setup/n), C_labor_post:r2(C_labor_post_unit),
      C_admin:r2(C_admin_unit), C_pack:r2(C_pack_unit), C_ship:r2(C_ship_unit),
      kWh:r4(kWh), kg:r4(m_eff/1000)
    },
    totals:{
      pre:r2(pre),
      afterMarkup:r2(afterMarkup), afterDisc:r2(afterDisc), afterTax:r2(afterTax), afterFixed:r2(plusFixed),
      per:r2(perUnit), total:r2(total)
    },
    meta:{R_fail:r4(R_fail), mu, n, t_occ:r2(t_occ)},
    cur: state.profile.currency
  };
}

// ---------- Quote (Hızlı Teklif) ----------
function renderQuote(root){
  const tpl = $('#tpl-quote') || $('#tpl-quote'.replace('#',''));
  root.appendChild(tpl.content.cloneNode(true));

  const selM = $('#qq_material'), selP = $('#qq_printer');

  // Dropdowns
  selM.innerHTML=''; selP.innerHTML='';
  state.materials.forEach(m=> selM.append(new Option(m.name, m.id)));
  state.printers.forEach(p=> selP.append(new Option(p.name, p.id)));
  selM.value = state.materials[0]?.id || '';
  selP.value = state.printers[0]?.id || '';

  // Defaults
  $('#qq_qty').value = 1;
  $('#qq_tsetup').value = 0.25;
  $('#qq_tpost').value = 0.20;
  $('#qq_markup').value = Math.round(state.commercial.mu*100);
  $('#qq_markup_val').textContent = $('#qq_markup').value+'%';

  // Material swatch
  const matBadge = document.createElement('div');
  matBadge.style.display='inline-flex'; matBadge.style.alignItems='center'; matBadge.style.gap='8px';
  matBadge.innerHTML = `<span class="chip">Renk</span><span id="matSwatch" style="display:inline-block;width:16px;height:16px;border-radius:4px;border:1px solid var(--border)"></span>`;
  $('#qq_material').parentElement.appendChild(matBadge);
  function updateSwatch(){ $('#matSwatch').style.background = (state.materials.find(x=>x.id===selM.value)?.color || '#888'); }
  updateSwatch(); selM.addEventListener('change', updateSwatch);

  // Markup %
  $('#qq_markup').addEventListener('input', e=> $('#qq_markup_val').textContent = e.target.value+'%');

  // PDF button (receipt)
  const sf = $('#summaryFooter');
  const pdfBtn = document.createElement('button');
  pdfBtn.className='btn secondary';
  pdfBtn.id='btnExportQuotePDF';
  pdfBtn.textContent='PDF Olarak Dışa Aktar';
  sf.appendChild(pdfBtn);

  pdfBtn.onclick = ()=>{
    const name = ($('#sj_name')?.value || '').trim();
    const client = ($('#sj_client')?.value || '').trim();
    const input = collectQuoteInput();
    const r = calcPrice(input);
    generateQuotePDF({
      jobName: name || '3B Baskı',
      clientName: client || '',
      unitPrice: Number(r?.totals?.per||0),
      qty: Math.max(1, Number(input?.n||1)),
      total: Number(r?.totals?.total||0)
    });
  };

  // Workflow buttons
  $('#btnStartJob').onclick = ()=>{
    const name = ($('#sj_name').value||'').trim() || `İş ${state.jobs.length+1}`;
    const client = ($('#sj_client').value||'').trim();
    const input = collectQuoteInput();
    const res = calcPrice(input);
    const now = new Date().toISOString();
    state.jobs.unshift({
      id:uuid(), name, client, status:'Açık', progress:0,
      createdAt:now, startedAt:now, finishedAt:null,
      calcInput:input, calcResult:res
    });
    saveState(); location.hash='#/jobs';
  };
  $('#btnSaveDraft').onclick = ()=>{
    const name = ($('#sj_name').value||'Taslak').trim();
    const client = ($('#sj_client').value||'').trim();
    const input = collectQuoteInput(); const res = calcPrice(input);
    state.drafts.unshift({ id:uuid(), name, client, savedAt:new Date().toISOString(), calcInput:input, calcResult:res });
    saveState(); toast('Taslak kaydedildi.');
  };
  $('#btnDuplicate').onclick = ()=>{
    $('#qq_qty').value = Math.max(1, Number($('#qq_qty').value||1) + 1);
    recalc();
  };
  $('#btnResetEssential')?.addEventListener('click', ()=>{
    $('#qq_qty').value=1; $('#qq_tprint').value=''; $('#qq_mslicer').value=''; $('#qq_msupport').value=0;
    $('#qq_tsetup').value=0.25; $('#qq_tpost').value=0.20;
    $('#qq_markup').value=Math.round(state.commercial.mu*100); $('#qq_markup_val').textContent=$('#qq_markup').value+'%';
    recalc();
  });

  // Recalc
  ['input','change'].forEach(ev => $('.pane-form').addEventListener(ev, e=>{
    if(e.target.closest('.form') || e.target.id==='qq_material' || e.target.id==='qq_printer') recalc();
  }));

  function collectQuoteInput(){
    return {
      materialId: selM.value, printerId: selP.value,
      n: Number($('#qq_qty').value||1),
      t_print: parseHours($('#qq_tprint').value),
      m_slicer: Number($('#qq_mslicer').value||0),
      m_support: Number($('#qq_msupport').value||0),
      t_setup: Number($('#qq_tsetup').value||0),
      t_post: Number($('#qq_tpost').value||0),
      mu: Number($('#qq_markup').value)/100
    };
  }

  function recalc(){ drawSummary(calcPrice(collectQuoteInput())); }

  function drawSummary(r){
    const sb=$('#summaryBody'); const foot=$('#summaryFooter');
    sb.innerHTML='';

    const add=(t,v,note='')=>{
      const div=document.createElement('div');
      div.className='summary-line';
      div.innerHTML=`<div><strong>${t}</strong>${note?`<div class="note">${note}</div>`:''}</div><div>${money(v)}</div>`;
      sb.appendChild(div);
    };
    add('Malzeme', r.lines.C_mat, `Etkin kütle: ${numfmt(r.lines.kg)} kg`);
    add('Enerji', r.lines.C_energy, `${r.lines.kWh} kWh`);
    add('Makine', r.lines.C_machine, `İşgal: ${r.meta.t_occ} s`);
    add('Bakım', r.lines.C_maint);
    add('Aşınma', r.lines.C_wear);
    add('Genel Gider', r.lines.C_over);
    add('İşçilik (baskı)', r.lines.C_labor_print);
    add('İşçilik (kurulum/birim)', r.lines.C_labor_setup);
    add('İşçilik (post/birim)', r.lines.C_labor_post);
    add('İdari/birim', r.lines.C_admin);
    add('Paket/birim', r.lines.C_pack);
    add('Kargo/birim', r.lines.C_ship);

    // KPI + totals
    const kpi=document.createElement('div'); kpi.className='kpi';
    kpi.innerHTML = `<span class="chip">Risk: R=${r.meta.R_fail}</span> <span class="chip">Marj: ${(r.meta.mu*100).toFixed(0)}%</span> <span class="chip">Adet: ${r.meta.n}</span>`;
    const t1=document.createElement('div'); t1.className='total'; t1.innerHTML=`<span>Ön Ticari (birim)</span><strong>${money(r.totals.pre)}</strong>`;
    const t2=document.createElement('div'); t2.className='total'; t2.innerHTML=`<span>Birim Fiyat</span><strong>${money(r.totals.per)}</strong>`;
    const t3=document.createElement('div'); t3.className='total'; t3.innerHTML=`<span>Toplam</span><strong>${money(r.totals.total)}</strong>`;

    // Keep existing PDF button at bottom
    foot.innerHTML=''; foot.appendChild(kpi); foot.appendChild(t1); foot.appendChild(t2); foot.appendChild(t3); foot.appendChild(pdfBtn);
  }

  recalc();
}

// ---------- Jobs ----------
function renderJobs(root){
  const tpl = $('#tpl-jobs');
  root.appendChild(tpl.content.cloneNode(true));
  const tb = $('#jobsTable tbody');

  // Small tab buttons (Active/Completed) already in HTML; we just filter by status
  const tabActive = document.createElement('div');
  tabActive.className='controls';
  tabActive.style.margin='0 0 10px 0';
  const btnA = document.createElement('button'); btnA.className='btn ghost'; btnA.textContent='Active';
  const btnC = document.createElement('button'); btnC.className='btn ghost'; btnC.textContent='Completed';
  tabActive.append(btnA, btnC);
  $('#jobsTable').parentElement.prepend(tabActive);

  let showCompleted = false;
  btnA.onclick = ()=>{ showCompleted=false; redraw(); btnA.classList.add('active'); btnC.classList.remove('active'); };
  btnC.onclick = ()=>{ showCompleted=true;  redraw(); btnC.classList.add('active'); btnA.classList.remove('active'); };
  btnA.classList.add('active');

  function kpiChips(){
    // KPI row on right side (above table)
    const wrap = document.createElement('div');
    wrap.className='row space';
    const left = document.createElement('div');
    left.innerHTML = `
      <span class="chip">Açık: <strong>${state.jobs.filter(j=>j.status==='Açık').length}</strong></span>
      <span class="chip">Tamamlanan: <strong>${state.jobs.filter(j=>j.status==='Tamamlandı').length}</strong></span>
      <span class="chip">Taslak: <strong>${state.drafts.length}</strong></span>`;
    const right = document.createElement('div');

    const {count, sumProfit, monthProfit} = aggregateProfits();
    right.innerHTML = `
      <span class="chip">Tamamlanan İş: ${count}</span>
      <span class="chip">Toplam Kâr ${money(sumProfit)}</span>
      <span class="chip">Bu Ay Kâr ${money(monthProfit)}</span>`;
    wrap.append(left, right);
    return wrap;
  }

  function aggregateProfits(){
    const done = state.jobs.filter(j=>j.status==='Tamamlandı' && j.calcResult?.totals);
    const mk = monthKey(new Date());
    let sumProfit=0, monthProfit=0;
    done.forEach(j=>{
      const pre = Number(j.calcResult.totals.pre||0) * Number(j.calcResult.meta?.n||1);
      const total = Number(j.calcResult.totals.total||0);
      const profit = total - pre;
      sumProfit += profit;
      if(j.finishedAt && monthKey(new Date(j.finishedAt))===mk) monthProfit += profit;
    });
    return {count: done.length, sumProfit:r2(sumProfit), monthProfit:r2(monthProfit)};
  }

  function redraw(){
    // header KPIs
    const pane = $('#jobsTable').closest('.pane');
    pane.querySelectorAll('.jobs-kpis').forEach(n=>n.remove());
    const k = kpiChips(); k.classList.add('jobs-kpis'); pane.prepend(k);

    tb.innerHTML='';
    const src = state.jobs.filter(j=> showCompleted ? j.status==='Tamamlandı' : j.status!=='Tamamlandı');

    src.forEach(j=>{
      const tr=document.createElement('tr');
      const started = j.startedAt ? fmtDate(j.startedAt) : '-';
      const finished = j.finishedAt ? fmtDate(j.finishedAt) : '-';
      const progressCell = (j.status==='Tamamlandı')
        ? `<span class="chip">100%</span>`
        : `<input style="vertical-align:middle" type="range" min="0" max="100" value="${j.progress||0}" data-id="${j.id}"><span class="prog" style="margin-left:6px">${j.progress||0}%</span>`;
      tr.innerHTML = `
        <td>${j.status}</td>
        <td>${j.name}</td>
        <td>${j.client||'-'}</td>
        <td>${started}</td>
        <td>${finished}</td>
        <td>${progressCell}</td>
        <td>${money(j.calcResult?.totals?.total||0)}</td>
        <td class="actions">
          ${j.status!=='Tamamlandı'
            ? `<button class="btn secondary" data-done="${j.id}">Tamamla</button>
               <button class="btn ghost" data-cancel="${j.id}">İptal</button>`
            : ''}
          <button class="btn danger ghost" data-del="${j.id}">Sil</button>
        </td>`;
      tb.appendChild(tr);

      // If completed view, also show making cost & profit inline as expandable row
      if(showCompleted && j.calcResult?.totals){
        const preUnit = Number(j.calcResult.totals.pre||0);
        const n = Number(j.calcResult.meta?.n||1);
        const making = preUnit * n;
        const total = Number(j.calcResult.totals.total||0);
        const profit = total - making;
        const tr2 = document.createElement('tr');
        tr2.innerHTML = `
          <td colspan="8" style="background:var(--panel-2);border:1px solid var(--border)">
            <div class="summary-line">
              <div><strong>Üretim Maliyeti</strong></div><div>${money(making)}</div>
            </div>
            <div class="summary-line">
              <div><strong>Satış Tutarı</strong></div><div>${money(total)}</div>
            </div>
            <div class="summary-line">
              <div><strong>Kâr</strong></div><div>${money(profit)}</div>
            </div>
          </td>`;
        tb.appendChild(tr2);
      }
    });

    // Range sliders live update
    $$('input[type="range"][data-id"]').forEach(r=>{
      r.oninput = (e)=>{
        const id=e.target.dataset.id;
        const j=state.jobs.find(x=>x.id===id); if(!j) return;
        j.progress=Number(e.target.value);
        e.target.parentElement.querySelector('.prog').textContent = j.progress+'%';
        saveState();
      };
    });

    // Actions
    $$('button[data-done]').forEach(b=> b.onclick=()=>{
      const j=state.jobs.find(x=>x.id===b.dataset.done); if(!j) return;
      j.status='Tamamlandı'; j.progress=100; j.finishedAt=new Date().toISOString();
      saveState(); redraw();
    });
    $$('button[data-cancel]').forEach(b=> b.onclick=()=>{
      const j=state.jobs.find(x=>x.id===b.dataset.cancel); if(!j) return;
      j.status='İptal'; j.finishedAt=new Date().toISOString();
      saveState(); redraw();
    });
    $$('button[data-del]').forEach(b=> b.onclick=()=>{ state.jobs = state.jobs.filter(x=>x.id!==b.dataset.del); saveState(); redraw(); });
  }

  redraw();
}

// ---------- Materials ----------
function renderMaterials(root){
  root.appendChild($('#tpl-materials').content.cloneNode(true));
  const tbl=$('#materialsTable'); let current=null;

  function draw(){
    tbl.innerHTML=`
      <thead><tr><th>Ad</th><th>Tip</th><th>Fiyat/g</th><th>Fire%</th><th>Tedarikçi</th><th>Etiketler</th><th></th></tr></thead>
      <tbody></tbody>`;
    const body=tbl.querySelector('tbody');
    state.materials.forEach(m=>{
      const tr=document.createElement('tr');
      tr.innerHTML=`<td>${m.name}</td><td>${m.type}</td><td>${m.p_mat_g}</td><td>${Math.round((m.w_scrap||0)*100)}</td><td>${m.vendor||''}</td><td>${(m.tags||[]).join(', ')}</td>
      <td><button class="btn secondary" data-edit="${m.id}">Düzenle</button> <button class="btn danger" data-del="${m.id}">Sil</button></td>`;
      body.appendChild(tr);
    });
    $$('button[data-edit]').forEach(b=> b.onclick=()=> open(b.dataset.edit));
    $$('button[data-del]').forEach(b=> b.onclick=()=>{ state.materials = state.materials.filter(x=>x.id!==b.dataset.del); saveState(); draw(); });
  }
  function open(id){
    current = state.materials.find(x=>x.id===id);
    if(!current) return;
    $('#m_name').value=current.name||'';
    $('#m_type').value=current.type||'FDM';
    $('#m_price').value=current.p_mat_g||0;
    $('#m_waste').value=Math.round((current.w_scrap||0)*100);
    $('#m_vendor').value=current.vendor||'';
    $('#m_tags').value=(current.tags||[]).join(', ');
    $('#m_color').value=current.color||'#999999';
  }
  $('#m_save').onclick=()=>{
    if(!current) return;
    current.name = $('#m_name').value.trim() || current.name;
    current.type = $('#m_type').value;
    current.p_mat_g = Number($('#m_price').value||0);
    current.w_scrap = Number($('#m_waste').value||0)/100;
    current.vendor = $('#m_vendor').value.trim();
    current.tags = $('#m_tags').value.split(',').map(s=>s.trim()).filter(Boolean);
    current.color = $('#m_color').value;
    saveState(); draw(); toast('Malzeme kaydedildi.');
  };
  $('#btnAddMaterial').onclick=()=>{
    const m={id:'mat_'+uuid(), name:'Yeni Malzeme', type:'FDM', p_mat_g:0.30, w_scrap:0.03, vendor:'', tags:[], color:'#999999'};
    state.materials.unshift(m); saveState(); draw(); open(m.id);
  };
  $('#btnExportMaterials').onclick=()=> downloadJSON('materials.json', state.materials);
  $('#fileImportMaterials').onchange=async(e)=>{
    const f=e.target.files[0]; if(!f) return;
    try{ const arr=JSON.parse(await f.text()); if(!Array.isArray(arr)) throw 0; state.materials=arr; saveState(); draw(); toast('Malzemeler içe aktarıldı.'); }
    catch{ alert('JSON geçersiz'); }
    e.target.value='';
  };

  draw(); if(state.materials[0]) open(state.materials[0].id);
}

// ---------- Printers ----------
function renderPrinters(root){
  root.appendChild($('#tpl-printers').content.cloneNode(true));
  const tbl=$('#printersTable'); let current=null;

  function draw(){
    tbl.innerHTML=`
      <thead><tr><th>Ad</th><th>P_avg(W)</th><th>Aşınma(₺/s)</th><th>q_fail</th><th>Aktif</th><th></th></tr></thead>
      <tbody></tbody>`;
    const body=tbl.querySelector('tbody');
    state.printers.forEach(p=>{
      const tr=document.createElement('tr');
      tr.innerHTML=`<td>${p.name}</td><td>${p.P_avg}</td><td>${p.r_wear_h}</td><td>${p.q_fail}</td><td>${p.active?'Evet':'Hayır'}</td>
      <td><button class="btn secondary" data-edit="${p.id}">Düzenle</button> <button class="btn danger" data-del="${p.id}">Sil</button></td>`;
      body.appendChild(tr);
    });
    $$('button[data-edit]').forEach(b=> b.onclick=()=> open(b.dataset.edit));
    $$('button[data-del]').forEach(b=> b.onclick=()=>{ state.printers=state.printers.filter(x=>x.id!==b.dataset.del); saveState(); draw(); });
  }
  function open(id){
    current = state.printers.find(x=>x.id===id);
    if(!current) return;
    $('#p_name').value=current.name||'';
    $('#p_Pavg').value=current.P_avg||0;
    $('#p_wear').value=current.r_wear_h||0;
    $('#p_qfail').value=current.q_fail||0.08;
    $('#p_active').checked=!!current.active;
  }
  $('#p_save').onclick=()=>{
    if(!current) return;
    current.name=$('#p_name').value.trim()||current.name;
    current.P_avg=Number($('#p_Pavg').value||0);
    current.r_wear_h=Number($('#p_wear').value||0);
    current.q_fail=Number($('#p_qfail').value||0);
    current.active=$('#p_active').checked;
    saveState(); draw(); toast('Makine kaydedildi.');
  };
  $('#btnAddPrinter').onclick=()=>{
    const p={id:'pr_'+uuid(), name:'Yeni Makine', P_avg:120, r_wear_h:0.8, q_fail:0.08, active:true};
    state.printers.unshift(p); saveState(); draw(); open(p.id);
  };
  $('#btnExportPrinters').onclick=()=> downloadJSON('printers.json', state.printers);
  $('#fileImportPrinters').onchange=async(e)=>{
    const f=e.target.files[0]; if(!f) return;
    try{ const arr=JSON.parse(await f.text()); if(!Array.isArray(arr)) throw 0; state.printers=arr; saveState(); draw(); toast('Makineler içe aktarıldı.'); }
    catch{ alert('JSON geçersiz'); }
    e.target.value='';
  };

  draw(); if(state.printers[0]) open(state.printers[0].id);
}

// ---------- Rules ----------
function renderRules(root){
  const tpl = $('#tpl-rulesets') || $('#tpl-rules');
  root.appendChild(tpl.content.cloneNode(true));
  const list=$('#rulesetList'); const ed=$('#rulesetEditor');

  const redraw=()=>{
    list.innerHTML='';
    const t=document.createElement('table'); t.className='grid-table';
    t.innerHTML=`<thead><tr><th>Ad</th><th>İşçilik (₺/s)</th><th>kWh</th><th>t_buffer</th><th>Ömür(s)</th><th></th></tr></thead>`;
    const tb=document.createElement('tbody');
    state.rulesets.forEach(r=>{
      const v=r.values;
      const tr=document.createElement('tr');
      tr.innerHTML=`<td>${r.name}${r.isActive?' • Aktif':''}</td><td>${v.r_labor}</td><td>${v.p_kWh}</td><td>${v.t_buffer}</td><td>${v.L_hrs}</td>
        <td><button class="btn secondary" data-edit="${r.id}">Düzenle</button> <button class="btn" data-act="${r.id}">Aktifleştir</button></td>`;
      tb.appendChild(tr);
    });
    t.appendChild(tb); list.appendChild(t);

    $$('button[data-edit]').forEach(b=> b.onclick=()=> open(b.dataset.edit));
    $$('button[data-act]').forEach(b=> b.onclick=()=>{ state.rulesets.forEach(x=>x.isActive=(x.id===b.dataset.act)); saveState(); redraw(); });
  };

  function open(id){
    const r=state.rulesets.find(x=>x.id===id); if(!r) return;
    const v=r.values; ed.classList.remove('hidden');
    ed.innerHTML=`
      <h3>${r.name} — Parametreler</h3>
      <div class="form slim">
        <div class="row"><label data-h="Kural setinin adı.">Ad</label><input id="rs_name" value="${r.name}"></div>
        <div class="row"><label data-h="Saatlik işçilik ücreti.">İşçilik (₺/s)</label><input id="rs_labor" type="number" step="0.01" value="${v.r_labor}"></div>
        <div class="row"><label data-h="Elektrik birim fiyatı.">kWh fiyatı</label><input id="rs_kwh" type="number" step="0.01" value="${v.p_kWh}"></div>
        <div class="row"><label data-h="Baskı esnasında gözetim oranı. 0–1.">Gözetim Oranı s</label><input id="rs_s" type="number" step="0.01" value="${v.s}"><span class="suf">0–1</span></div>
        <div class="row"><label data-h="Boşaltma/ısı düşümü vs. ek süre.">Soğuma/Boşaltma</label><input id="rs_tbuf" type="number" step="0.05" value="${v.t_buffer}"><span class="suf">saat</span></div>
        <hr class="sep" />
        <div class="row"><label data-h="Makinenin satın alma bedeli.">Capex</label><input id="rs_cap" type="number" step="1" value="${v.C_cap}"><span class="suf">₺</span></div>
        <div class="row"><label data-h="Ömür sonu hurda değeri.">Hurda Değeri</label><input id="rs_resid" type="number" step="1" value="${v.R_resid}"><span class="suf">₺</span></div>
        <div class="row"><label data-h="Ekonomik ömür saat.">Ömür (saat)</label><input id="rs_life" type="number" step="1" value="${v.L_hrs}"></div>
        <div class="row"><label data-h="Saatlik bakım gideri.">Bakım (₺/s)</label><input id="rs_maint" type="number" step="0.01" value="${v.r_maint_h}"></div>
        <div class="row"><label data-h="Saatlik yıpranma. Yazıcıya özel yoksa bu kullanılır.">Aşınma (₺/s)</label><input id="rs_wear" type="number" step="0.01" value="${v.r_wear_h}"></div>
        <div class="row"><label data-h="Saatlik genel gider payı.">Genel Gider (₺/s)</label><input id="rs_over" type="number" step="0.01" value="${v.r_oh_h}"></div>
        <div class="row right"><button class="btn" id="rs_save">Kaydet</button></div>
      </div>`;
    $('#rs_save').onclick=()=>{
      r.name=$('#rs_name').value.trim()||r.name;
      Object.assign(v,{
        r_labor:Number($('#rs_labor').value||0),
        p_kWh:Number($('#rs_kwh').value||0),
        s:Number($('#rs_s').value||0),
        t_buffer:Number($('#rs_tbuf').value||0),
        C_cap:Number($('#rs_cap').value||0),
        R_resid:Number($('#rs_resid').value||0),
        L_hrs:Number($('#rs_life').value||1),
        r_maint_h:Number($('#rs_maint').value||0),
        r_wear_h:Number($('#rs_wear').value||0),
        r_oh_h:Number($('#rs_over').value||0),
      });
      saveState(); redraw(); toast('Kural seti kaydedildi.');
    };
  }

  $('#btnNewRuleset')?.addEventListener('click', ()=>{
    state.rulesets.push({id:'rs_'+uuid(), name:'Yeni Kural', isActive:false, createdAt:new Date().toISOString(), values:structuredClone(activeRules().values)});
    saveState(); redraw();
  });

  redraw();
}

// ---------- Commercial ----------
function renderCommercial(root){
  root.appendChild($('#tpl-commercial').content.cloneNode(true));
  const c=state.commercial; const p=state.profile;

  $('#commercialForm').innerHTML=`
    <div class="row"><label data-h="Para birimi çıktı formatını etkiler.">Para Birimi</label><select id="c_cur"><option>TRY</option><option>USD</option><option>EUR</option></select></div>
    <div class="row"><label data-h="Sayı biçimi (tr-TR gibi).">Yerel Ayar</label><input id="c_loc" value="${p.locale}"></div>
    <div class="row"><label data-h="Kâr marjı (pre üzerine).">Kâr Marjı μ</label><input id="c_mu" type="number" step="0.01" value="${c.mu}"></div>
    <div class="row"><label data-h="Uygulanacak indirim.">İndirim</label><input id="c_disc" type="number" step="0.01" value="${c.disc}"></div>
    <div class="row"><label data-h="KDV vb. vergi.">Vergi</label><input id="c_tax" type="number" step="0.01" value="${c.tax}"></div>
    <div class="row"><label data-h="Sabit ödeme masrafı (işe bölünür).">Sabit Masraf / İş</label><input id="c_fix" type="number" step="0.01" value="${c.fee_fix}"></div>
    <div class="row"><label data-h="Ödeme komisyonu yüzdesi.">Ödeme Komisyon %</label><input id="c_pct" type="number" step="0.01" value="${c.fee_pct}"></div>
    <div class="row"><label data-h="Alt sınır: birim fiyat minimumu.">Minimum (birim)</label><input id="c_min" type="number" step="0.01" value="${c.P_min}"></div>
    <div class="row"><label data-h="İş başı idari masraf.">İdari / İş</label><input id="c_admin" type="number" step="0.01" value="${c.C_admin_job}"></div>
    <div class="row"><label data-h="Lisans/abonelik vb. iş başı.">Lisans / İş</label><input id="c_lic" type="number" step="0.01" value="${c.C_license_job}"></div>
    <div class="row"><label data-h="Birim ambalaj.">Paket / Birim</label><input id="c_pack" type="number" step="0.01" value="${c.C_pack_unit}"></div>
    <div class="row"><label data-h="Ağırlığa bağlı kargo (₺/kg).">Kargo (₺/kg)</label><input id="c_ship" type="number" step="0.01" value="${c.C_ship_var_kg}"></div>
    <div class="row right"><button class="btn" id="c_save">Kaydet</button></div>
  `;
  $('#c_cur').value = p.currency || 'TRY';
  $('#c_save').onclick=()=>{
    p.currency = $('#c_cur').value;
    p.locale   = $('#c_loc').value.trim() || p.locale;
    Object.assign(state.commercial,{
      mu:Number($('#c_mu').value||0),
      disc:Number($('#c_disc').value||0),
      tax:Number($('#c_tax').value||0),
      fee_fix:Number($('#c_fix').value||0),
      fee_pct:Number($('#c_pct').value||0),
      P_min:Number($('#c_min').value||0),
      C_admin_job:Number($('#c_admin').value||0),
      C_license_job:Number($('#c_lic').value||0),
      C_pack_unit:Number($('#c_pack').value||0),
      C_ship_var_kg:Number($('#c_ship').value||0),
    });
    saveState(); toast('Ticari ayarlar kaydedildi.');
  };
}

// ---------- Settings ----------
function renderSettings(root){
  root.appendChild($('#tpl-settings').content.cloneNode(true));
  $('#set_currency').value = state.profile.currency || 'TRY';
  $('#set_locale').value = state.profile.locale || 'tr-TR';

  $('#set_logo').onchange = async (e)=>{
    const f=e.target.files[0]; if(!f) return;
    const b64 = await fileToBase64(f);
    state.ui.logo = b64; saveState(); toast('Logo kaydedildi.');
  };
  $('#set_save').onclick = ()=>{
    state.profile.currency = $('#set_currency').value;
    state.profile.locale   = $('#set_locale').value.trim() || state.profile.locale;
    saveState(); toast('Ayarlar kaydedildi.');
  };
}
function fileToBase64(file){
  return new Promise((res,rej)=>{
    const r = new FileReader();
    r.onload = ()=> res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

// ---------- Backups ----------
function renderBackups(root){
  root.appendChild($('#tpl-backups').content.cloneNode(true));
  $('#btnExportAll').onclick=()=> downloadJSON(`pricing_backup_${new Date().toISOString().replace(/[:.]/g,'-')}.json`, state);
  $('#fileImportAll').onchange=async(e)=>{
    const f=e.target.files[0]; if(!f) return;
    try{
      const obj=JSON.parse(await f.text());
      if(!obj || typeof obj!=='object') throw 0;
      state = migrate(obj); saveState(); toast('Yüklendi. Yeniden açılıyor…'); setTimeout(()=>location.reload(), 400);
    }catch{ alert('JSON geçersiz'); }
    e.target.value='';
  };
  $('#btnResetApp').onclick=()=>{ if(confirm('Her şeyi sıfırlamak istiyor musunuz?')){ localStorage.removeItem(SAVE_KEY); location.reload(); } };
}
function downloadJSON(name, data){
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; a.click();
}

// ---------- Toast ----------
function toast(msg){
  const el=document.createElement('div');
  el.textContent=msg;
  Object.assign(el.style,{
    position:'fixed', right:'16px', bottom:'16px', background:'#1F2530',
    border:'1px solid var(--border)', color:'#fff', padding:'8px 12px',
    borderRadius:'10px', zIndex:9999
  });
  document.body.appendChild(el); setTimeout(()=>el.remove(), 1500);
}

// ---------- Quote PDF (clean one-page receipt) ----------
function fmtDateISO(d){
  try{
    const loc = state.profile?.locale || 'tr-TR';
    return new Date(d || Date.now()).toLocaleDateString(loc, { year:'numeric', month:'2-digit', day:'2-digit' });
  }catch{ return new Date().toISOString().slice(0,10); }
}
function newQuoteId(){
  const d = new Date();
  return `Q-${d.getFullYear()}${pad2(d.getMonth()+1)}${pad2(d.getDate())}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
}
function buildReceiptHTML({logo, profile, jobName, clientName, unitPrice, qty, total}){
  const styles = `
  <style>
    @page { size: A4; margin: 16mm; }
    :root{ --ink:#0b1220; --muted:#4a5568; --line:#e3e8f0; }
    *{ box-sizing:border-box; }
    body{ font:13px/1.45 Inter, system-ui, Segoe UI, Roboto, Arial, sans-serif; color:var(--ink); margin:0; }
    .wrap{ max-width:720px; margin:0 auto; }
    header{ display:flex; justify-content:space-between; gap:16px; margin-bottom:18px; border-bottom:1px solid var(--line); padding-bottom:12px; }
    .logo{ width:140px; object-fit:contain; border-radius:6px; }
    .title{ font-size:22px; font-weight:700; margin:0 0 4px; }
    .muted{ color:var(--muted); }
    .grid{ display:grid; grid-template-columns:1fr 1fr; gap:12px; margin:10px 0 18px; }
    .box{ border:1px solid var(--line); border-radius:10px; padding:10px 12px; }
    h4{ margin:0 0 8px; font-size:12px; letter-spacing:.6px; color:#334155; text-transform:uppercase; }
    table{ width:100%; border-collapse:collapse; }
    th,td{ padding:10px 12px; border-bottom:1px solid var(--line); text-align:right; }
    th:first-child, td:first-child{ text-align:left; }
    thead th{ font-size:12px; color:#334155; text-transform:uppercase; letter-spacing:.5px; }
    tfoot td{ border-top:2px solid #0b1220; font-weight:700; }
    .bottom{ display:flex; justify-content:space-between; gap:12px; margin-top:12px; }
    .note{ font-size:12px; color:var(--muted); }
  </style>`;
  const today = fmtDateISO();
  const quoteId = newQuoteId();
  return `
  <!doctype html><html><head><meta charset="utf-8"/><title>Teklif ${quoteId}</title>${styles}</head>
  <body>
    <div class="wrap">
      <header>
        <div>${logo ? `<img class="logo" src="${logo}" alt="Logo">` : ''}</div>
        <div>
          <div class="title">Teklif</div>
          <div class="muted">No: <strong>${quoteId}</strong></div>
          <div class="muted">Tarih: <strong>${today}</strong></div>
        </div>
      </header>
      <div class="grid">
        <div class="box">
          <h4>İş Bilgisi</h4>
          <div><strong>${(jobName||'—')}</strong></div>
        </div>
        <div class="box">
          <h4>Müşteri</h4>
          <div><strong>${(clientName||'—')}</strong></div>
        </div>
      </div>
      <table>
        <thead><tr><th>Kalem</th><th>Birim Fiyat</th><th>Adet</th><th>Tutar</th></tr></thead>
        <tbody><tr><td>3B Baskı Hizmeti</td><td>${money(unitPrice)}</td><td>${qty}</td><td>${money(total)}</td></tr></tbody>
        <tfoot><tr><td>Toplam</td><td></td><td></td><td>${money(total)}</td></tr></tfoot>
      </table>
      <div class="bottom">
        <div class="note">Bu bir teklif dökümüdür. Fiyatlar ${profile?.currency || 'TRY'} cinsindedir. 7 gün geçerlidir.</div>
        <div><div class="muted">Hazırlayan</div><div><strong>${profile?.name || ''}</strong></div></div>
      </div>
    </div>
    <script>
      (function(){
        const imgs = Array.from(document.images);
        if(!imgs.length){ setTimeout(()=>window.print(), 50); return; }
        let n=0; const go=()=>{ if(++n===imgs.length) setTimeout(()=>window.print(), 50); };
        imgs.forEach(i=>{ if(i.complete) go(); else { i.addEventListener('load',go); i.addEventListener('error',go); } });
      })();
      window.onafterprint = ()=> window.close();
    </script>
  </body></html>`;
}
function generateQuotePDF({jobName, clientName, unitPrice, qty, total}){
  const logo = state.ui?.logo || null;
  const profile = state.profile || {};
  const html = buildReceiptHTML({logo, profile, jobName, clientName, unitPrice, qty, total});
  const w = window.open('', '_blank', 'noopener,noreferrer');
  w.document.open(); w.document.write(html); w.document.close();
}

// ---------- Boot ----------
window.addEventListener('DOMContentLoaded', ()=>{
  $('#navTabs').addEventListener('click', (e)=>{ if(e.target.matches('[data-route]')) setActiveTab(); });
  mount();
});
