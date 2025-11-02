// 3D Print Pricing — Pure JS SPA (Final)
// Burak-ready: i18n (TR/EN), Quick Quote → Start Job, Drafts, Jobs, Archive,
// inline editors for Materials/Printers, tooltips, revenue summary.

/*************************
 * Tiny Utilities
 *************************/
const $  = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
const nf  = (max=2) => new Intl.NumberFormat(undefined, { maximumFractionDigits: max });
const fmt = nf(2);
const round2 = n => Math.round((n + Number.EPSILON) * 100) / 100;
const round4 = n => Math.round((n + Number.EPSILON) * 10000) / 10000;
const uuid   = () => (crypto.randomUUID ? crypto.randomUUID() : 'id_' + Date.now());

/*************************
 * i18n
 *************************/
const I18N = {
  'tr-TR': {
    tabs: { quote:'Hızlı Teklif', jobs:'İşler', archive:'Geçmiş', rules:'Kurallar', materials:'Malzemeler', printers:'Makineler', commercial:'Ticari', backups:'Yedekler' },
    quote: {
      startJob:'İşi Başlat', saveDraft:'Taslak Kaydet', jobName:'İş Adı', client:'Müşteri',
      qty:'Adet', tprint:'Baskı Süresi', mass:'Parça Ağırlığı (g)', support:'Destek (g)',
      tsetup:'Kurulum (saat)', tpost:'Post-proc. (saat)', markup:'Kâr Oranı',
      essential:'Temel Girdiler', duplicate:'+1 Adet', reset:'Sıfırla'
    },
    lines: {
      material:'Malzeme', energy:'Enerji', machine:'Makine', maint:'Bakım', wear:'Aşınma', overhead:'Genel Gider',
      laborPrint:'İşçilik (baskı)', laborSetupPerUnit:'İşçilik (kurulum / birim)', laborPostPerUnit:'İşçilik (post / birim)',
      adminUnit:'İdari / birim', packUnit:'Paket / birim', shipUnit:'Kargo / birim',
      precomm:'Ön Ticari (birim)', perunit:'Son (birim)', finalx:'Toplam × Adet', risk:'Risk R_fail', markup:'Kâr', qty:'Adet'
    },
    notes: {
      material:'Atık/fire dahil efektif kütle × birim fiyat.',
      energy:'Ortalama güç × (baskı + soğuma) × kWh fiyatı.',
      machine:'Amortisman oranı × işgal süresi.',
      maint:'Saatlik bakım × işgal süresi.',
      wear:'Nozul/PEI/vat/filtre vb.',
      overhead:'Tesis genel giderleri.',
      laborPrint:'Gözetim oranı × baskı süresi × saatlik ücret.',
      laborSetup:'Kurulum işçiliği / birim.',
      laborPost:'Post-proc işçiliği / birim.',
      admin:'İdari/lisans (iş başına / birim).',
      pack:'Kutu/poşet vb.',
      ship:'Kg başına değişken kargo.',
      precomm:'Üretim kalemlerinin toplamı.',
      perunit:'Kâr, indirim, vergi ve işlem kesintileri sonrası.',
      finalx:'Birim × adet.'
    },
    jobs: {
      title:'İşler', name:'Ad', client:'Müşteri', status:'Durum', started:'Başlangıç', qty:'Adet',
      perUnit:'Birim', total:'Toplam', progress:'İlerleme', complete:'Tamamla', cancel:'İptal',
      noJobs:'Henüz iş yok.', done:'Tamamlandı', open:'Açık', draft:'Taslak'
    },
    archive: {
      title:'Geçmiş', noDone:'Tamamlanmış iş yok.',
      summary:'Özet', count:'İş Sayısı', income:'Gelir', cost:'Maliyet', profit:'Kâr'
    },
    common: { yes:'Evet', no:'Hayır', edit:'Düzenle', delete:'Sil', save:'Kaydet', currency:'Para Birimi', locale:'Dil/Bölge' },
    toast: { saved:'Kaydedildi.', started:'İş başlatıldı.', draft:'Taslak kaydedildi.', completed:'İş tamamlandı.', cancelled:'İş iptal edildi.' }
  },
  'en-US': {
    tabs: { quote:'Quick Quote', jobs:'Jobs', archive:'Archive', rules:'Rules', materials:'Materials', printers:'Printers', commercial:'Commercial', backups:'Backups' },
    quote: {
      startJob:'Start Job', saveDraft:'Save Draft', jobName:'Job Name', client:'Client',
      qty:'Qty', tprint:'Print Time', mass:'Part Mass (g)', support:'Support (g)',
      tsetup:'Setup (h)', tpost:'Post-proc. (h)', markup:'Markup',
      essential:'Essentials', duplicate:'+1 Qty', reset:'Reset'
    },
    lines: {
      material:'Material', energy:'Energy', machine:'Machine', maint:'Maint', wear:'Wear', overhead:'Overhead',
      laborPrint:'Labor (print)', laborSetupPerUnit:'Labor (setup / unit)', laborPostPerUnit:'Labor (post / unit)',
      adminUnit:'Admin / unit', packUnit:'Packaging / unit', shipUnit:'Shipping / unit',
      precomm:'Pre-commercial (unit)', perunit:'Final (unit)', finalx:'Final × Qty', risk:'Risk R_fail', markup:'Markup', qty:'Qty'
    },
    notes: {
      material:'Effective mass incl. scrap × price per g.',
      energy:'Avg power × (print + buffer) × kWh price.',
      machine:'Amortization rate × occupied time.',
      maint:'Per-hour maintenance × occupied time.',
      wear:'Nozzles/PEI/vats/filters etc.',
      overhead:'Facility overhead.',
      laborPrint:'Supervision fraction × print time × labor rate.',
      laborSetup:'Setup labor / unit.',
      laborPost:'Post-processing per unit.',
      admin:'Admin/license per job / unit.',
      pack:'Box/bag etc.',
      ship:'Variable shipping by kg.',
      precomm:'Sum of production components.',
      perunit:'After markup, discount, tax, fees.',
      finalx:'Unit × qty.'
    },
    jobs: {
      title:'Jobs', name:'Name', client:'Client', status:'Status', started:'Started', qty:'Qty',
      perUnit:'Per-Unit', total:'Total', progress:'Progress', complete:'Complete', cancel:'Cancel',
      noJobs:'No jobs yet.', done:'Done', open:'Open', draft:'Draft'
    },
    archive: {
      title:'Previous Works', noDone:'No completed jobs yet.',
      summary:'Summary', count:'Jobs', income:'Income', cost:'Cost', profit:'Profit'
    },
    common: { yes:'Yes', no:'No', edit:'Edit', delete:'Delete', save:'Save', currency:'Currency', locale:'Locale' },
    toast: { saved:'Saved.', started:'Job started.', draft:'Draft saved.', completed:'Job completed.', cancelled:'Job cancelled.' }
  }
};
const lang = () => (state?.profile?.locale?.startsWith('tr') ? 'tr-TR' : 'en-US');
const T = (path) => path.split('.').reduce((o,k)=>o&&o[k], I18N[lang()]);

/*************************
 * Store (localStorage)
 *************************/
const SAVE_KEY = 'pp_app_v2';
const defaultState = {
  schema: 2,
  profile: { name: 'Default', currency: 'TRY', locale: 'tr-TR' },
  commercial: { mu: 0.30, disc: 0.00, tax: 0.20, fee_fix: 5, fee_pct: 0.02, P_min: 80, C_admin_job: 30, C_license_job: 0, C_pack_unit: 8, C_ship_var_kg: 60 },
  rulesets: [
    { id: 'rs_v1_0', name: 'Default v1.0', createdAt: new Date().toISOString(), isActive: true,
      values: { t_buffer: 0.25, s: 0.10, r_labor: 250, p_kWh: 4.0, C_cap: 50000, R_resid: 5000, L_hrs: 7500, r_maint_h: 1.0, r_wear_h: 0.8, r_oh_h: 4.0 } }
  ],
  materials: [ { id: 'mat_pla_basic', name: 'PLA Basic', type: 'FDM', p_mat_g: 0.35, w_scrap: 0.03, color: '#9AB', vendor: 'Generic', tags: ['PLA'] } ],
  printers:  [ { id: 'pr_p1s', name: 'Bambu P1S', P_avg: 120, r_wear_h: 0.8, q_fail: 0.08, active: true, notes: '' } ],
  jobs: [],
  drafts: []
};

let state = load();
function load(){
  try { const raw = localStorage.getItem(SAVE_KEY); if (raw) return migrate(JSON.parse(raw)); } catch(e){}
  localStorage.setItem(SAVE_KEY, JSON.stringify(defaultState));
  return structuredClone(defaultState);
}
function save(){ localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }
function migrate(s){
  if (!s.schema) s.schema = 1;
  if (!Array.isArray(s.jobs))   s.jobs = [];
  if (!Array.isArray(s.drafts)) s.drafts = [];
  if (!s.profile)  s.profile = { name:'Default', currency:'TRY', locale:'tr-TR' };
  if (!s.commercial) s.commercial = structuredClone(defaultState.commercial);
  if (!s.rulesets)   s.rulesets = structuredClone(defaultState.rulesets);
  if (!s.materials)  s.materials = structuredClone(defaultState.materials);
  if (!s.printers)   s.printers = structuredClone(defaultState.printers);
  s.schema = 2;
  return s;
}

const activeRuleset = () => state.rulesets.find(r=>r.isActive) || state.rulesets[0];

/*************************
 * Router
 *************************/
const routes = {
  '#/quote': renderQuote,
  '#/jobs': renderJobs,
  '#/archive': renderArchive,
  '#/rulesets': renderRulesets,
  '#/materials': renderMaterials,
  '#/printers': renderPrinters,
  '#/commercial': renderCommercial,
  '#/backups': renderBackups,
};

function ensureNavLinks(){
  const bar = $('#navTabs'); if (!bar) return;
  // Update text if exists
  bar.querySelector('a[href="#/quote"]') && (bar.querySelector('a[href="#/quote"]').textContent = T('tabs.quote'));
  // Insert Jobs as 2nd tab if missing
  if (!bar.querySelector('a[href="#/jobs"]')){
    const a = document.createElement('a'); a.href='#/jobs'; a.dataset.route='true'; a.textContent=T('tabs.jobs');
    const second = bar.querySelectorAll('a')[1] || null;
    bar.insertBefore(a, second);
  } else { bar.querySelector('a[href="#/jobs"]').textContent = T('tabs.jobs'); }
  // Insert Archive as 3rd tab if missing
  if (!bar.querySelector('a[href="#/archive"]')){
    const a = document.createElement('a'); a.href='#/archive'; a.dataset.route='true'; a.textContent=T('tabs.archive');
    const third = bar.querySelectorAll('a')[2] || null;
    bar.insertBefore(a, third);
  } else { bar.querySelector('a[href="#/archive"]').textContent = T('tabs.archive'); }
  // Other tabs rename (if present)
  bar.querySelector('a[href="#/rulesets"]') && (bar.querySelector('a[href="#/rulesets"]').textContent = T('tabs.rules'));
  bar.querySelector('a[href="#/materials"]') && (bar.querySelector('a[href="#/materials"]').textContent = T('tabs.materials'));
  bar.querySelector('a[href="#/printers"]') && (bar.querySelector('a[href="#/printers"]').textContent = T('tabs.printers'));
  bar.querySelector('a[href="#/commercial"]') && (bar.querySelector('a[href="#/commercial"]').textContent = T('tabs.commercial'));
  bar.querySelector('a[href="#/backups"]') && (bar.querySelector('a[href="#/backups"]').textContent = T('tabs.backups'));
}

function setActiveTab(){
  const hash = location.hash || '#/quote';
  $$('#navTabs a').forEach(a=> a.classList.toggle('active', a.getAttribute('href')===hash));
}
window.addEventListener('hashchange', mount);

function mount(){
  ensureNavLinks();
  setActiveTab();
  const el = $('#app'); el.innerHTML = '';
  (routes[location.hash] || renderQuote)(el);
  $('#profileChip') && ($('#profileChip').textContent = `${state.profile.name} · ${state.profile.locale} · ${state.profile.currency || 'TRY'}`);
}

/*************************
 * Calculator (master equation)
 *************************/
function calcPrice(input){
  const rs = activeRuleset().values;
  const comm = state.commercial;
  const mat = state.materials.find(m=>m.id===input.materialId);
  const prn = state.printers.find(p=>p.id===input.printerId);

  const n = Math.max(1, Number(input.n||1));
  const t_print = Number(input.t_print||0);
  const m_slicer = Number(input.m_slicer||0);
  const m_support = Number(input.m_support||0);
  const t_setup = Number(input.t_setup||0);
  const t_post = Number(input.t_post||0);
  const mu = Number(input.mu ?? comm.mu);

  const w_scrap = Number(mat?.w_scrap || 0);
  const p_mat_g = Number(mat?.p_mat_g || 0);
  const P_avg   = Number(prn?.P_avg || 0);
  const p_kWh   = Number(rs.p_kWh || 0);
  const r_wear_h= Number(rs.r_wear_h ?? prn?.r_wear_h ?? 0);
  const r_maint_h=Number(rs.r_maint_h || 0);
  const r_oh_h  = Number(rs.r_oh_h || 0);
  const s       = Number(rs.s || 0);
  const r_labor = Number(rs.r_labor || 0);

  const t_buffer = Number(rs.t_buffer || 0);
  const t_occ = t_print + t_buffer;

  const r_machine = (Number(rs.C_cap||0) - Number(rs.R_resid||0)) / Math.max(1, Number(rs.L_hrs||1));

  const m_eff = (m_slicer + m_support) * (1 + w_scrap);
  const C_mat = m_eff * p_mat_g;

  const kWh = (P_avg/1000) * t_occ;
  const C_energy = kWh * p_kWh;

  const C_machine = t_occ * r_machine;
  const C_maint  = t_occ * r_maint_h;
  const C_wear   = t_occ * (prn?.r_wear_h ?? r_wear_h);
  const C_over   = t_occ * r_oh_h;

  const C_labor_print = (s * t_print) * r_labor;
  const C_labor_setup = t_setup * r_labor;
  const C_labor_post_unit = t_post * r_labor;

  const q_fail = Number(prn?.q_fail ?? 0.08);
  const R_fail = 1 / Math.max(0.0001, (1 - q_fail));
  const qf = 1.0;

  const productionScaled = R_fail * qf * (C_mat + C_energy + C_machine + C_maint + C_wear + C_over + C_labor_print);

  const C_admin_unit = (Number(comm.C_admin_job||0) + Number(comm.C_license_job||0)) / n;
  const C_pack_unit  = Number(comm.C_pack_unit||0);
  const C_ship_unit  = Number(comm.C_ship_var_kg||0) * (m_eff/1000);
  const adders = (C_labor_setup / n) + C_labor_post_unit + C_admin_unit + C_pack_unit + C_ship_unit;

  const preCommercial = productionScaled + adders;

  const disc    = Number(comm.disc||0);
  const tax     = Number(comm.tax||0);
  const fee_fix = Number(comm.fee_fix||0)/n;
  const fee_pct = Number(comm.fee_pct||0);
  const P_min   = Number(comm.P_min||0);

  const afterMarkup = preCommercial * (1 + mu);
  const afterDisc   = afterMarkup * (1 - disc);
  const afterTax    = afterDisc * (1 + tax);
  const plusFixed   = afterTax + fee_fix;
  const perUnit     = Math.max(P_min, plusFixed) * (1 + fee_pct);

  return {
    currency: state.profile.currency || 'TRY',
    lines: {
      materialCost: round2(C_mat),
      electricityCost: round2(C_energy),
      machine: round2(C_machine), maint: round2(C_maint), wear: round2(C_wear), overhead: round2(C_over),
      laborPrint: round2(C_labor_print), laborSetupPerUnit: round2(C_labor_setup/n), laborPostPerUnit: round2(C_labor_post_unit),
      adminUnit: round2(C_admin_unit), packUnit: round2(C_pack_unit), shipUnit: round2(C_ship_unit),
      kWh: round4(kWh), kgUsed: round4(m_eff/1000), mEff: round2(m_eff)
    },
    totals: {
      preCommercial: round2(preCommercial),
      afterMarkup: round2(afterMarkup), afterDisc: round2(afterDisc), afterTax: round2(afterTax), afterFixed: round2(plusFixed),
      perUnit: round2(perUnit), total: round2(perUnit * n)
    },
    meta: { R_fail: round4(R_fail), q_fail, mu, n, t_occ: round2(t_occ) }
  };
}

/*************************
 * Quick Quote + Start Job
 *************************/
function renderQuote(root){
  const tpl = $('#tpl-quote');
  root.appendChild(tpl.content.cloneNode(true));

  $('#quoteTitle')?.insertAdjacentHTML('afterbegin', `<span class="chip">${T('quote.essential')}</span>`);

  // Populate selects
  const selMat = $('#qq_material');
  const selPrn = $('#qq_printer');
  state.materials.forEach(m=> selMat.append(new Option(m.name, m.id)));
  state.printers.forEach(p=> selPrn.append(new Option(p.name, p.id)));

  // Defaults from latest draft or job
  const last = state.drafts[0]?.calcInput || state.jobs[0]?.calcInput;
  selMat.value = last?.materialId || state.materials[0]?.id;
  selPrn.value = last?.printerId || state.printers[0]?.id;

  $('#qq_qty').value      = last?.n || 1;
  $('#qq_tprint').value   = last?.t_print ?? '';
  $('#qq_mslicer').value  = last?.m_slicer ?? '';
  $('#qq_msupport').value = last?.m_support ?? 0;
  $('#qq_tsetup').value   = last?.t_setup ?? activeRuleset().values?.t_setup ?? 0.25;
  $('#qq_tpost').value    = last?.t_post ?? 0.20;
  const mu = Math.round((last?.mu ?? state.commercial.mu) * 100);
  $('#qq_markup').value = mu; $('#qq_markup_val').textContent = `${mu}%`;

  // Start Job mini panel
  const sj = document.createElement('div');
  sj.className = 'panel startJob';
  sj.innerHTML = `
    <div class="panel-header"><h3>${T('quote.startJob')}</h3></div>
    <div class="panel-body">
      <div class="grid">
        <div class="row"><label>${T('quote.jobName')}</label><input id="sj_name" placeholder="RC Jant v2"></div>
        <div class="row"><label>${T('quote.client')}</label><input id="sj_client" placeholder="Porima"></div>
      </div>
      <div class="actions" style="margin-top:8px">
        <button class="btn" id="btnStartJob">${T('quote.startJob')}</button>
        <button class="btn secondary" id="btnSaveDraft">${T('quote.saveDraft')}</button>
      </div>
    </div>`;
  ($('#quoteWrap')||root).appendChild(sj);

  const recalc = () => renderSummary(calcPrice(collectQQ()));
  ['change','input'].forEach(evt=> root.addEventListener(evt, e=>{ if (e.target.closest('.form')) recalc(); }));

  // Start Job
  $('#btnStartJob').onclick = ()=>{
    const name = ($('#sj_name').value||'').trim();
    const client = ($('#sj_client').value||'').trim();
    if (!name){ toast('↳ '+T('quote.jobName')); return; }
    const input = collectQQ(); const res = calcPrice(input);
    const now = new Date().toISOString();
    state.jobs.unshift({ id: uuid(), createdAt: now, startedAt: now, name, client, status: 'Open', progress: 0, calcInput: input, calcResult: res });
    save(); toast(T('toast.started')); location.hash = '#/jobs';
  };

  // Save Draft (kept outside Jobs)
  $('#btnSaveDraft').onclick = ()=>{
    const input = collectQQ(); const res = calcPrice(input);
    const name   = ($('#sj_name')?.value || '').trim() || `Draft ${state.drafts.length+1}`;
    const client = ($('#sj_client')?.value || '').trim() || '';
    state.drafts.unshift({ id: uuid(), savedAt: new Date().toISOString(), name, client, calcInput: input, calcResult: res });
    save(); toast(T('toast.draft'));
  };

  $('#qq_markup').addEventListener('input', e=> $('#qq_markup_val').textContent = e.target.value + '%');
  $('#btnDuplicate')?.addEventListener('click', ()=>{ const input=collectQQ(); $('#qq_qty').value=Number(input.n||1)+1; recalc(); });
  $('#btnResetEssential')?.addEventListener('click', ()=>{
    $('#qq_qty').value=1; $('#qq_tprint').value=''; $('#qq_mslicer').value=''; $('#qq_msupport').value=0;
    $('#qq_tsetup').value=0.25; $('#qq_tpost').value=0.20;
    $('#qq_markup').value=Math.round(state.commercial.mu*100);
    $('#qq_markup_val').textContent=Math.round(state.commercial.mu*100)+'%';
    recalc();
  });

  recalc();
}

function parseHours(s){
  if (typeof s === 'number') return Number(s||0);
  if (!s) return 0;
  const m = String(s).trim();
  if (/^\d+(\.\d+)?$/.test(m)) return Number(m);
  const hm = m.match(/(?:(\d+)h)?\s*(?:(\d+)m)?/i);
  if (hm && (hm[1]||hm[2])) return Number(hm[1]||0) + Number(hm[2]||0)/60;
  const colon = m.match(/(\d+):(\d{1,2})/);
  if (colon) return Number(colon[1]) + Number(colon[2])/60;
  return Number(m)||0;
}
function collectQQ(){
  return {
    materialId: $('#qq_material').value,
    printerId:  $('#qq_printer').value,
    n: Number($('#qq_qty').value || 1),
    t_print: parseHours($('#qq_tprint').value),
    m_slicer: Number($('#qq_mslicer').value || 0),
    m_support: Number($('#qq_msupport').value || 0),
    t_setup: Number($('#qq_tsetup').value || 0),
    t_post:  Number($('#qq_tpost').value || 0),
    mu: Number($('#qq_markup').value)/100,
  };
}
function addSummaryLine(host, label, value, note=''){
  const line = document.createElement('div');
  line.className = 'summary-line';
  line.title = note;
  line.innerHTML = `<div><strong>${label}</strong>${note?`<div class="note">${note}</div>`:''}</div><div>${fmt.format(value)} ${state.profile.currency||'TRY'}</div>`;
  host.appendChild(line);
}
function renderSummary(r){
  const sb = $('#summaryBody'); const sf = $('#summaryFooter'); sb.innerHTML='';
  const L=r.lines, Tt=r.totals, M=r.meta, LBL=T('lines'), NT=T('notes');
  addSummaryLine(sb, LBL.material,   L.materialCost,        NT.material);
  addSummaryLine(sb, LBL.energy,     L.electricityCost,     NT.energy);
  addSummaryLine(sb, LBL.machine,    L.machine,             NT.machine);
  addSummaryLine(sb, LBL.maint,      L.maint,               NT.maint);
  addSummaryLine(sb, LBL.wear,       L.wear,                NT.wear);
  addSummaryLine(sb, LBL.overhead,   L.overhead,            NT.overhead);
  addSummaryLine(sb, LBL.laborPrint, L.laborPrint,          NT.laborPrint);
  addSummaryLine(sb, LBL.laborSetupPerUnit, L.laborSetupPerUnit, NT.laborSetup);
  addSummaryLine(sb, LBL.laborPostPerUnit,  L.laborPostPerUnit,  NT.laborPost);
  addSummaryLine(sb, LBL.adminUnit,  L.adminUnit,           NT.admin);
  addSummaryLine(sb, LBL.packUnit,   L.packUnit,            NT.pack);
  addSummaryLine(sb, LBL.shipUnit,   L.shipUnit,            NT.ship);

  sf.innerHTML = `
    <div class="kpi">
      <span class="chip" title="1/(1-q_fail)">${T('lines.risk')}: ${M.R_fail}</span>
      <span class="chip">${T('lines.markup')}: ${(M.mu*100).toFixed(0)}%</span>
      <span class="chip">${T('lines.qty')}: ${M.n}</span>
    </div>
    <div class="total" title="${NT.precomm}"><span>${T('lines.precomm')}</span><strong>${fmt.format(Tt.preCommercial)} ${r.currency}</strong></div>
    <div class="total" title="${NT.perunit}"><span>${T('lines.perunit')}</span><strong>${fmt.format(Tt.perUnit)} ${r.currency}</strong></div>
    <div class="total" title="${NT.finalx}"><span>${T('lines.finalx')}</span><strong>${fmt.format(Tt.total)} ${r.currency}</strong></div>
  `;
}

/*************************
 * Jobs (Open/Draft) — Cancel/Delete & Complete
 *************************/
function renderJobs(root){
  const p = document.createElement('div'); p.className='panel';
  p.innerHTML = `<div class="panel-header"><h2>${T('jobs.title')}</h2></div><div id="jobsWrap"></div>`;
  root.appendChild(p);
  const wrap = $('#jobsWrap');

  function draw(){
    wrap.innerHTML='';
    const rows = state.jobs.filter(j=> j.status!=='Done');
    if (!rows.length){ wrap.innerHTML = `<div class="muted">${T('jobs.noJobs')}</div>`; return; }
    const tbl = document.createElement('table');
    tbl.innerHTML = `<thead><tr>
      <th>#</th><th>${T('jobs.name')}</th><th>${T('jobs.client')}</th><th>${T('jobs.status')}</th><th>${T('jobs.started')}</th><th>${T('jobs.qty')}</th><th>${T('jobs.perUnit')}</th><th>${T('jobs.total')}</th><th>${T('jobs.progress')}</th><th></th>
    </tr></thead>`;
    const tb = document.createElement('tbody');

    rows.forEach((j,idx)=>{
      const t = j.calcResult?.totals || {}; const cur = state.profile.currency || 'TRY';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${idx+1}</td>
        <td><input class="cellInput" value="${j.name||''}" data-fld="name" data-id="${j.id}"/></td>
        <td><input class="cellInput" value="${j.client||''}" data-fld="client" data-id="${j.id}"/></td>
        <td>${j.status}</td>
        <td>${j.startedAt? new Date(j.startedAt).toLocaleString() : (j.createdAt? new Date(j.createdAt).toLocaleString() : '-')}</td>
        <td>${j.calcInput?.n||1}</td>
        <td>${fmt.format(t.perUnit||0)} ${cur}</td>
        <td><strong>${fmt.format(t.total||0)} ${cur}</strong></td>
        <td>
          <input class="progressRange" type="range" min="0" max="100" step="1" value="${j.progress||0}" data-prog="${j.id}"/>
          <span class="progVal">${j.progress||0}%</span>
        </td>
        <td>
          <button class="btn" data-complete="${j.id}">${T('jobs.complete')}</button>
          <button class="btn danger" data-cancel="${j.id}">${T('jobs.cancel')}</button>
        </td>`;
      tb.appendChild(tr);
    });
    tbl.appendChild(tb); wrap.appendChild(tbl);

    $$('input[data-fld]').forEach(inp=> inp.addEventListener('input', (e)=>{
      const id = e.target.dataset.id; const fld = e.target.dataset.fld;
      const job = state.jobs.find(x=>x.id===id); if (!job) return;
      job[fld] = e.target.value; save();
    }));
    $$('input[data-prog]').forEach(inp=> inp.addEventListener('input', (e)=>{
      const id = e.target.dataset.prog; const job = state.jobs.find(x=>x.id===id); if (!job) return;
      job.progress = Number(e.target.value||0);
      e.target.parentElement.querySelector('.progVal').textContent = job.progress + '%';
      save();
    }));
    $$('button[data-complete]').forEach(b=> b.onclick = ()=>{
      const job = state.jobs.find(x=>x.id===b.dataset.complete); if (!job) return;
      job.status='Done'; job.completedAt = new Date().toISOString(); save(); draw(); toast(T('toast.completed'));
    });
    $$('button[data-cancel]').forEach(b=> b.onclick = ()=>{
      if (!confirm(T('jobs.cancel')+'?')) return;
      state.jobs = state.jobs.filter(x=>x.id!==b.dataset.cancel); save(); draw(); toast(T('toast.cancelled'));
    });
  }
  draw();
}

/*************************
 * Archive (Completed)
 *************************/
function renderArchive(root){
  const panel = document.createElement('div'); panel.className='panel';
  panel.innerHTML = `<div class="panel-header"><h2>${T('archive.title')}</h2></div><div id="archWrap"></div>`;
  root.appendChild(panel);
  const wrap = $('#archWrap'); wrap.innerHTML='';

  const done = state.jobs.filter(j=>j.status==='Done');
  if (!done.length){ wrap.innerHTML = `<div class="muted">${T('archive.noDone')}</div>`; return; }

  const tbl = document.createElement('table');
  tbl.innerHTML = `<thead><tr>
    <th>#</th><th>${T('jobs.name')}</th><th>${T('jobs.client')}</th><th>${T('jobs.qty')}</th><th>${T('jobs.perUnit')}</th><th>${T('jobs.total')}</th><th>${T('jobs.started')}</th><th>End</th>
  </tr></thead>`;
  const tb = document.createElement('tbody');

  let sumIncome=0, sumCost=0;
  done.forEach((j,idx)=>{
    const t = j.calcResult?.totals || {}; const cur = state.profile.currency || 'TRY';
    const precomm = j.calcResult?.totals?.preCommercial || 0;
    const qty = j.calcInput?.n || 1;
    const income = t.total || 0;
    const cost   = precomm * qty; // cost proxy
    sumIncome += income; sumCost += cost;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${idx+1}</td>
      <td>${j.name||''}</td>
      <td>${j.client||''}</td>
      <td>${qty}</td>
      <td>${fmt.format(t.perUnit||0)} ${cur}</td>
      <td><strong>${fmt.format(income)} ${cur}</strong></td>
      <td>${j.startedAt? new Date(j.startedAt).toLocaleString() : '-'}</td>
      <td>${j.completedAt? new Date(j.completedAt).toLocaleString() : '-'}</td>`;
    tb.appendChild(tr);
  });
  tbl.appendChild(tb); wrap.appendChild(tbl);

  const summary = document.createElement('div'); summary.className='panel';
  const profit = sumIncome - sumCost;
  summary.innerHTML = `
    <div class="panel-header"><h3>${T('archive.summary')}</h3></div>
    <div class="panel-body kpi">
      <span class="chip">${T('archive.count')}: ${done.length}</span>
      <span class="chip">${T('archive.income')}: ${fmt.format(sumIncome)} ${state.profile.currency||'TRY'}</span>
      <span class="chip">${T('archive.cost')}: ${fmt.format(sumCost)} ${state.profile.currency||'TRY'}</span>
      <span class="chip"><strong>${T('archive.profit')}: ${fmt.format(profit)} ${state.profile.currency||'TRY'}</strong></span>
    </div>`;
  wrap.appendChild(summary);
}

/*************************
 * Rulesets
 *************************/
function renderRulesets(root){
  const tpl = $('#tpl-rulesets');
  root.appendChild(tpl.content.cloneNode(true));
  const list = $('#rulesetList');
  const editor = $('#rulesetEditor');
  const renderList = () => {
    list.innerHTML = '';
    const t = document.createElement('table');
    t.innerHTML = `<thead><tr><th>Name</th><th>Active</th><th>Labor</th><th>kWh</th><th>t_buffer</th><th>Amort (h)</th><th></th></tr></thead>`;
    const tb = document.createElement('tbody');
    state.rulesets.forEach(rs=>{
      const v = rs.values;
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${rs.name}</td><td>${rs.isActive?T('common.yes'):T('common.no')}</td><td>${v.r_labor}</td><td>${v.p_kWh}</td><td>${v.t_buffer}</td><td>${v.L_hrs}</td>
        <td><button class="btn secondary" data-edit="${rs.id}">${T('common.edit')}</button> <button class="btn" data-activate="${rs.id}">Activate</button></td>`;
      tb.appendChild(tr);
    });
    t.appendChild(tb); list.appendChild(t);

    $$('button[data-edit]').forEach(b=> b.onclick = ()=> openEditor(b.dataset.edit));
    $$('button[data-activate]').forEach(b=> b.onclick = ()=> { state.rulesets.forEach(r=> r.isActive = (r.id===b.dataset.activate)); save(); renderList(); toast('OK'); });
  };

  function editorRow(label, id, value, type='text', step='any'){
    return `<div class="row" title="${label}"><label for="${id}">${label}</label><input id="${id}" ${type==='number'?`type="number" step="${step}"`:''} value="${value ?? ''}"></div>`;
  }
  function openEditor(id){
    const rs = state.rulesets.find(r=>r.id===id); if (!rs) return;
    editor.classList.remove('hidden');
    const v = rs.values;
    editor.innerHTML = `
      <h3>${T('common.edit')}: ${rs.name}</h3>
      <div class="grid editor">
        ${editorRow('Name','rs_name', rs.name)}
        ${editorRow('Labor rate (₺/h)','rs_r_labor', v.r_labor, 'number', '0.01')}
        ${editorRow('kWh price','rs_p_kWh', v.p_kWh, 'number', '0.01')}
        ${editorRow('t_buffer (h)','rs_t_buffer', v.t_buffer, 'number', '0.01')}
        ${editorRow('Supervision s (0–1)','rs_s', v.s, 'number', '0.01')}
        <hr class="sep" />
        ${editorRow('Capex (₺)','rs_C_cap', v.C_cap, 'number', '1')}
        ${editorRow('Residual (₺)','rs_R_resid', v.R_resid, 'number', '1')}
        ${editorRow('Life (hours)','rs_L_hrs', v.L_hrs, 'number', '1')}
        ${editorRow('Maint (₺/h)','rs_r_maint_h', v.r_maint_h, 'number', '0.01')}
        ${editorRow('Wear (₺/h)','rs_r_wear_h', v.r_wear_h, 'number', '0.01')}
        ${editorRow('Overhead (₺/h)','rs_r_oh_h', v.r_oh_h, 'number', '0.01')}
      </div>
      <div class="actions" style="margin-top:10px">
        <button class="btn" id="rs_save">${T('common.save')}</button>
        <button class="btn danger" id="rs_delete">${T('common.delete')}</button>
      </div>`;
    $('#rs_save').onclick = ()=>{
      rs.name = $('#rs_name').value.trim() || rs.name;
      Object.assign(v, {
        r_labor: Number($('#rs_r_labor').value||0),
        p_kWh: Number($('#rs_p_kWh').value||0),
        t_buffer: Number($('#rs_t_buffer').value||0),
        s: Number($('#rs_s').value||0),
        C_cap: Number($('#rs_C_cap').value||0),
        R_resid: Number($('#rs_R_resid').value||0),
        L_hrs: Number($('#rs_L_hrs').value||1),
        r_maint_h: Number($('#rs_r_maint_h').value||0),
        r_wear_h: Number($('#rs_r_wear_h').value||0),
        r_oh_h: Number($('#rs_r_oh_h').value||0),
      });
      save(); renderList(); toast(T('toast.saved'));
    };
    $('#rs_delete').onclick = ()=>{
      if (!confirm(T('common.delete')+'?')) return;
      state.rulesets = state.rulesets.filter(x=>x.id!==rs.id);
      if (!state.rulesets.length) state.rulesets.push(structuredClone(defaultState.rulesets[0]));
      save(); renderList(); editor.classList.add('hidden');
    };
  }
  $('#btnNewRuleset').onclick = ()=>{
    state.rulesets.push({ id: 'rs_'+uuid(), name: 'New Ruleset', createdAt: new Date().toISOString(), isActive:false, values: structuredClone(activeRuleset().values)});
    save(); renderList();
  };
  renderList();
}

/*************************
 * Materials — inline side editor
 *************************/
function renderMaterials(root){
  const tpl = $('#tpl-materials'); root.appendChild(tpl.content.cloneNode(true));
  const tbl = $('#materialsTable');
  const side = document.createElement('div');
  side.className='panel'; side.innerHTML = `<div class="panel-header"><h3>${T('common.edit')} — ${T('tabs.materials')}</h3></div><div id="matEditor" class="panel-body muted">—</div>`;
  tbl.parentElement.appendChild(side);

  function draw(){
    tbl.innerHTML = '';
    const t = document.createElement('table');
    t.innerHTML = `<thead><tr><th>Name</th><th>Type</th><th>₺/g</th><th>Waste%</th><th>Vendor</th><th>Tags</th><th></th></tr></thead>`;
    const tb = document.createElement('tbody');
    state.materials.forEach(m=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td><button class="link" data-open="${m.id}">${m.name}</button></td><td>${m.type}</td><td>${m.p_mat_g}</td><td>${Math.round((m.w_scrap||0)*100)}</td><td>${m.vendor||''}</td><td>${(m.tags||[]).join(', ')}</td>
        <td><button class="btn secondary" data-open="${m.id}">${T('common.edit')}</button> <button class="btn danger" data-del="${m.id}">${T('common.delete')}</button></td>`;
      tb.appendChild(tr);
    });
    t.appendChild(tb); tbl.appendChild(t);
    $$('button[data-open], .link[data-open]').forEach(b=> b.onclick = ()=> openEditor(b.dataset.open));
    $$('button[data-del]').forEach(b=> b.onclick = ()=> delMaterial(b.dataset.del));
  }
  const row = (label,id,val,type='text',step='any') => `<div class="row" title="${label}"><label for="${id}">${label}</label><input id="${id}" ${type==='number'?`type="number" step="${step}"`:''} value="${val??''}"></div>`;
  function openEditor(id){
    const m = state.materials.find(x=>x.id===id); if (!m) return;
    const host = $('#matEditor'); host.classList.remove('muted');
    host.innerHTML = `
      ${row('Name','m_name',m.name)}
      ${row('Type','m_type',m.type)}
      ${row('Price/g','m_price',m.p_mat_g,'number','0.01')}
      ${row('Waste%','m_waste',Math.round((m.w_scrap||0)*100),'number','1')}
      ${row('Vendor','m_vendor',m.vendor)}
      ${row('Tags','m_tags',(m.tags||[]).join(', '))}
      ${row('Color','m_color',m.color)}
      <div class="actions" style="margin-top:10px"><button class="btn" id="m_save">${T('common.save')}</button></div>`;
    $('#m_save').onclick = ()=>{
      Object.assign(m, {
        name: $('#m_name').value.trim()||m.name,
        type: $('#m_type').value.trim()||m.type,
        p_mat_g: Number($('#m_price').value||0),
        w_scrap: Number($('#m_waste').value||0)/100,
        vendor: $('#m_vendor').value.trim()||'',
        tags: ($('#m_tags').value||'').split(',').map(s=>s.trim()).filter(Boolean),
        color: $('#m_color').value||m.color
      });
      save(); draw(); toast(T('toast.saved'));
    };
  }
  function delMaterial(id){ if (!confirm(T('common.delete')+'?')) return; state.materials = state.materials.filter(x=>x.id!==id); save(); draw(); }
  $('#btnAddMaterial').onclick = ()=>{ state.materials.unshift({ id:'mat_'+uuid(), name:'New Material', type:'FDM', p_mat_g:0.30, w_scrap:0.03, vendor:'', tags:[] }); save(); draw(); };
  $('#btnExportMaterials').onclick = ()=> downloadJSON('materials.json', state.materials);
  $('#fileImportMaterials').onchange = async (e)=>{
    const f=e.target.files[0]; if(!f) return; const text=await f.text();
    try { const arr=JSON.parse(text); if(!Array.isArray(arr)) throw 0; state.materials=arr; save(); draw(); toast('OK'); } catch{ alert('Invalid JSON'); }
    e.target.value='';
  };
  draw();
}

/*************************
 * Printers — inline side editor
 *************************/
function renderPrinters(root){
  const tpl = $('#tpl-printers'); root.appendChild(tpl.content.cloneNode(true));
  const tbl = $('#printersTable');
  const side = document.createElement('div');
  side.className='panel'; side.innerHTML = `<div class="panel-header"><h3>${T('common.edit')} — ${T('tabs.printers')}</h3></div><div id="prnEditor" class="panel-body muted">—</div>`;
  tbl.parentElement.appendChild(side);

  function draw(){
    tbl.innerHTML = '';
    const t = document.createElement('table');
    t.innerHTML = `<thead><tr><th>Name</th><th>P_avg (W)</th><th>Wear (₺/h)</th><th>q_fail</th><th>Active</th><th></th></tr></thead>`;
    const tb = document.createElement('tbody');
    state.printers.forEach(p=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><button class="link" data-open="${p.id}">${p.name}</button></td>
        <td>${p.P_avg}</td><td>${p.r_wear_h}</td><td>${p.q_fail}</td><td>${p.active?T('common.yes'):T('common.no')}</td>
        <td><button class="btn secondary" data-open="${p.id}">${T('common.edit')}</button> <button class="btn danger" data-del="${p.id}">${T('common.delete')}</button></td>`;
      tb.appendChild(tr);
    });
    t.appendChild(tb); tbl.appendChild(t);
    $$('button[data-open], .link[data-open]').forEach(b=> b.onclick = ()=> openEditor(b.dataset.open));
    $$('button[data-del]').forEach(b=> b.onclick = ()=> delPrinter(b.dataset.del));
  }
  const row = (label,id,val,type='text',step='any') => `<div class="row" title="${label}"><label for="${id}">${label}</label><input id="${id}" ${type==='number'?`type="number" step="${step}"`:''} value="${val??''}"></div>`;
  function openEditor(id){
    const p = state.printers.find(x=>x.id===id); if (!p) return;
    const host = $('#prnEditor'); host.classList.remove('muted');
    host.innerHTML = `
      ${row('Name','p_name',p.name)}
      ${row('Average Power (W)','p_pavg',p.P_avg,'number','1')}
      ${row('Wear (₺/h)','p_wear',p.r_wear_h,'number','0.01')}
      ${row('q_fail','p_qfail',p.q_fail,'number','0.01')}
      <div class="row"><label>Active</label>
        <select id="p_active"><option value="true"${p.active?' selected':''}>${T('common.yes')}</option><option value="false"${!p.active?' selected':''}>${T('common.no')}</option></select>
      </div>
      ${row('Notes','p_notes',p.notes||'')}
      <div class="actions" style="margin-top:10px"><button class="btn" id="p_save">${T('common.save')}</button></div>`;
    $('#p_save').onclick = ()=>{
      Object.assign(p, {
        name: $('#p_name').value.trim()||p.name,
        P_avg: Number($('#p_pavg').value||0),
        r_wear_h: Number($('#p_wear').value||0),
        q_fail: Number($('#p_qfail').value||0),
        active: $('#p_active').value==='true',
        notes: $('#p_notes').value||''
      });
      save(); draw(); toast(T('toast.saved'));
    };
  }
  function delPrinter(id){ if (!confirm(T('common.delete')+'?')) return; state.printers = state.printers.filter(x=>x.id!==id); save(); draw(); }
  $('#btnAddPrinter').onclick = ()=>{ state.printers.unshift({ id:'pr_'+uuid(), name:'New Printer', P_avg:120, r_wear_h:0.8, q_fail:0.08, active:true }); save(); draw(); };
  $('#btnExportPrinters').onclick = ()=> downloadJSON('printers.json', state.printers);
  $('#fileImportPrinters').onchange = async (e)=>{
    const f=e.target.files[0]; if(!f) return; const text=await f.text();
    try { const arr=JSON.parse(text); if(!Array.isArray(arr)) throw 0; state.printers=arr; save(); draw(); toast('OK'); } catch{ alert('Invalid JSON'); }
    e.target.value='';
  };
  draw();
}

/*************************
 * Commercial
 *************************/
function renderCommercial(root){
  const tpl = $('#tpl-commercial'); root.appendChild(tpl.content.cloneNode(true));
  const el = $('#commercialForm'); const c=state.commercial; const p=state.profile;
  el.innerHTML = `
    <div class="row"><label>${T('common.currency')}</label>
      <select id="c_currency"><option>TRY</option><option>USD</option><option>EUR</option></select>
    </div>
    <div class="row"><label>${T('common.locale')}</label><input id="c_locale" value="${p.locale}" /></div>
    <div class="row"><label>Markup μ</label><input id="c_mu" type="number" step="0.01" value="${c.mu}"></div>
    <div class="row"><label>Discount</label><input id="c_disc" type="number" step="0.01" value="${c.disc}"></div>
    <div class="row"><label>Tax</label><input id="c_tax" type="number" step="0.01" value="${c.tax}"></div>
    <div class="row"><label>Fixed fee / job</label><input id="c_fee_fix" type="number" step="0.01" value="${c.fee_fix}"></div>
    <div class="row"><label>Processor %</label><input id="c_fee_pct" type="number" step="0.01" value="${c.fee_pct}"></div>
    <div class="row"><label>Minimum (per unit)</label><input id="c_pmin" type="number" step="0.01" value="${c.P_min}"></div>
    <div class="row"><label>Admin / job</label><input id="c_admin" type="number" step="0.01" value="${c.C_admin_job}"></div>
    <div class="row"><label>License / job</label><input id="c_license" type="number" step="0.01" value="${c.C_license_job}"></div>
    <div class="row"><label>Packaging / unit</label><input id="c_pack" type="number" step="0.01" value="${c.C_pack_unit}"></div>
    <div class="row"><label>Shipping (₺/kg)</label><input id="c_shipkg" type="number" step="0.01" value="${c.C_ship_var_kg}"></div>
    <div class="row"><button class="btn" id="c_save">${T('common.save')}</button></div>
  `;
  $('#c_currency').value = p.currency || 'TRY';
  $('#c_save').onclick = ()=>{
    p.currency = $('#c_currency').value; p.locale = $('#c_locale').value.trim()||p.locale;
    Object.assign(state.commercial, {
      mu: Number($('#c_mu').value||0), disc: Number($('#c_disc').value||0), tax: Number($('#c_tax').value||0),
      fee_fix: Number($('#c_fee_fix').value||0), fee_pct: Number($('#c_fee_pct').value||0), P_min: Number($('#c_pmin').value||0),
      C_admin_job: Number($('#c_admin').value||0), C_license_job: Number($('#c_license').value||0), C_pack_unit: Number($('#c_pack').value||0), C_ship_var_kg: Number($('#c_shipkg').value||0)
    });
    save(); mount(); toast(T('toast.saved'));
  };
}

/*************************
 * Backups
 *************************/
function renderBackups(root){
  const tpl = $('#tpl-backups'); root.appendChild(tpl.content.cloneNode(true));
  $('#btnExportAll').onclick = ()=> downloadJSON(`pricing_backup_${new Date().toISOString().replace(/[:.]/g,'-')}.json`, state);
  $('#fileImportAll').onchange = async (e)=>{
    const f = e.target.files[0]; if (!f) return; const text = await f.text();
    try { const obj = JSON.parse(text); if (!obj || typeof obj!=='object') throw 0; state = migrate(obj); save(); toast('Imported. Reloading…'); setTimeout(()=>location.reload(), 400); } catch{ alert('Invalid JSON'); }
    e.target.value='';
  };
  $('#btnResetApp').onclick = ()=>{ if (confirm('Reset everything?')){ localStorage.removeItem(SAVE_KEY); location.reload(); } };
}

/*************************
 * Helpers
 *************************/
function toast(msg){
  const el = document.createElement('div');
  el.textContent = msg; Object.assign(el.style, { position:'fixed', right:'16px', bottom:'16px', background:'#1F2530', border:'1px solid var(--border)', color:'#fff', padding:'8px 12px', borderRadius:'10px', zIndex:9999 });
  document.body.appendChild(el); setTimeout(()=>el.remove(), 1400);
}
function downloadJSON(name, data){ const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; a.click(); }

/*************************
 * Boot
 *************************/
window.addEventListener('DOMContentLoaded', ()=>{
  $('#navTabs').addEventListener('click', (e)=>{ if (e.target.matches('[data-route]')) setActiveTab(); });
  mount();
});
