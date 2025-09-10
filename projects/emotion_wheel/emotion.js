/* ===========================================================
 *  Emotion Wheel — Step / All-at-once toggle + TR/EN + Restart
 *  All mode: ONLY OUTER RING selectable; inner rings lightly dimmed.
 *  Selecting a leaf highlights the full path (no expansion animation).
 *  Fit-aware labels (no clipping): auto shrink/wrap (2 lines max).
 *  Exact arc partition (no micro gaps).
 *  Keeps your ROOTS EXACTLY as provided.
 * =========================================================*/

/* ---------- YOUR EXACT ROOTS (DO NOT CHANGE) ---------- */
const ROOTS = [
  /* ——— Mutlu (your exact edit) ——— */
  {
    key: 'mutlu',
    label: 'Mutlu',
    color: '#F3D356',
    children: [
      { label: 'Eğlenceli',       children: ['Uyarılmış', 'Yüzsüz'] },
      { label: 'Memnun',          children: ['Özgür', 'Neşe Dolu'] },
      { label: 'İlgili',          children: ['Meraklı', 'Meraklı'] },
      { label: 'Gurur Duymak',    children: ['Başarılı', 'Kendınden Emin'] },
      { label: 'Kabul Edilmiş',   children: ['Saygın', 'Değerli'] },
      { label: 'Güçlü',           children: ['Cesur', 'Yaratıcı'] },
      { label: 'Barışçıl',        children: ['Sevgi Dolu', 'Müteşekkir'] },
      { label: 'Güvenen',         children: ['Hassas', 'Samimi'] },
      { label: 'İyimser',         children: ['Umutlu', 'Esinlenilmiş'] },
    ],
  },

  /* ——— Üzgün ——— */
  {
    key: 'üzgün',
    label: 'Üzgün',
    color: '#6AB5F5',
    children: [
      { label: 'Yalnız',          children: ['Yalıtılmış', 'Terk Edilmiş'] },
      { label: 'Hassas',          children: ['Mağdur', 'Kırılgan'] },
      { label: 'Çaresiz',         children: ['Yas', 'Güçsüz'] },
      { label: 'Suçlu',           children: ['Utanmış', 'Pişman'] },
      { label: 'Bunalımlı',       children: ['Boş / Anlamsız', 'Kalitesiz'] },
      { label: 'Acıtmak',         children: ['Hayal Kırıklığına Uğramış', 'Utanmış'] },
    ],
  },

  /* ——— Korkmuş (key is "korkunç" in your data) ——— */
  {
    key: 'korkunç',
    label: 'Korkunç',
    color: '#BDE1A5',
    children: [
      { label: 'Korkmuş',        children: ['Çaresiz', 'Korkmuş'] },
      { label: 'Endişeli',       children: ['Ezilmiş', 'Endişeli'] },
      { label: 'Güvensiz',       children: ['Yetersiz', 'Kalitesiz'] },
      { label: 'Zayıf',          children: ['Değersiz', 'Önemsiz'] },
      { label: 'Reddedilmiş',    children: ['Hariç Tutulmuş', 'Zulüm Gören'] },
      { label: 'Tehdit Altında', children: ['Gergin', 'Maruz Kalan'] },
    ],
  },

  /* ——— Sinirli ——— */
  {
    key: 'sinirli',
    label: 'Sinirli',
    color: '#F1999B',
    children: [
      { label: 'Hayal Kırıklığına Uğramış',   children: ['İhanete Uğramış', 'Kırgın'] },
      { label: 'Aşağılanmış',                 children: ['Saygısızlık', 'Alay Konusu'] },
      { label: 'Acı',                         children: ['Kızgın', 'İhlal Edilmiş'] },
      { label: 'Kızgın',                      children: ['Çok Öfkeli', 'Kıskanç'] },
      { label: 'Agresif',                     children: ['Kışkırtılmış', 'Düşmanca'] },
      { label: 'Hüsrana Uğramış',             children: ['Çileden Çıkmış', 'Sinirli'] },
      { label: 'Mesafe',                      children: ['Geri Çekilmiş', 'Hissiz'] },
      { label: 'Kritik',                      children: ['Şüpheci', 'Küçümseyen'] },
    ],
  },

  /* ——— İğrenmiş ——— */
  {
    key: 'iğrenmiş',
    label: 'İğrenmiş',
    color: '#A1A6AC',
    children: [
      { label: 'Onaylanmıyor',                children: ['Yargılayıcı', 'Utanmış'] },
      { label: 'Hayal Kırıklığına Uğramış',   children: ['Dehşete Düşmüş', 'İsyan Etti'] },
      { label: 'Berbat',                      children: ['Mide Bulantısı', 'İğrenç'] },
      { label: 'İtilmiş',                     children: ['Dehşete Düşmüş', 'Tereddütlü'] },
    ],
  },

  /* ——— Kötü ——— */
  {
    key: 'kötü',
    label: 'Kötü',
    color: '#9ED4CC',
    children: [
      { label: 'Yorgun',          children: ['Odaklanmamış', 'Uykulu'] },
      { label: 'Stresli',         children: ['Kontrol Dışı', 'Boğulmuş'] },
      { label: 'Meşgul',          children: ['Acele', 'Baskılı'] },
      { label: 'Sıkılmış',        children: ['Duyarsız', 'İlgisiz'] },
    ],
  },

  /* ——— Şaşırmış ——— */
  {
    key: 'şaşırmış',
    label: 'Şaşırmış',
    color: '#C3A8E4',
    children: [
      { label: 'Şaşkın',            children: ['Şok Olmuş', 'Dehşete Düşmüş'] },
      { label: 'Kafası Karışmış',   children: ['Hayal Aleminden Çıkmış', 'Şaşkın'] },
      { label: 'Hayret',            children: ['Hayret', 'Hayranlık'] },
      { label: 'Heyecanlı',         children: ['İstekli', 'Enerjik'] },
    ],
  }
];

/* ---------- TR→EN dictionary aligned to your labels ---------- */
const TR2EN = {
  'Mutlu':'Happy','Üzgün':'Sad','Korkunç':'Fearful','Sinirli':'Angry','İğrenmiş':'Disgusted','Kötü':'Bad','Şaşırmış':'Surprised',
  'Eğlenceli':'Playful','Uyarılmış':'Aroused','Yüzsüz':'Cheeky','Memnun':'Content','Özgür':'Free','Neşe Dolu':'Joyful','İlgili':'Interested','Meraklı':'Curious',
  'Gurur Duymak':'Proud','Başarılı':'Successful','Kendınden Emin':'Confident','Kabul Edilmiş':'Accepted','Saygın':'Respected','Değerli':'Valuable',
  'Güçlü':'Powerful','Cesur':'Brave','Yaratıcı':'Creative','Barışçıl':'Peaceful','Sevgi Dolu':'Loving','Müteşekkir':'Grateful','Güvenen':'Trusting',
  'Hassas':'Sensitive','Samimi':'Sincere','İyimser':'Optimistic','Umutlu':'Hopeful','Esinlenilmiş':'Inspired',
  'Yalnız':'Lonely','Yalıtılmış':'Isolated','Terk Edilmiş':'Abandoned','Mağdur':'Victimized','Kırılgan':'Fragile','Çaresiz':'Helpless','Yas':'Grieving','Güçsüz':'Powerless',
  'Suçlu':'Guilty','Utanmış':'Ashamed','Pişman':'Regretful','Bunalımlı':'Depressed','Boş / Anlamsız':'Empty / Meaningless','Kalitesiz':'Worthless',
  'Acıtmak':'Hurt','Hayal Kırıklığına Uğramış':'Disappointed',
  'Korkmuş':'Scared','Endişeli':'Anxious','Güvensiz':'Insecure','Zayıf':'Weak','Ezilmiş':'Crushed','Yetersiz':'Insufficient','Değersiz':'Worthless','Önemsiz':'Insignificant',
  'Reddedilmiş':'Rejected','Hariç Tutulmuş':'Excluded','Zulüm Gören':'Persecuted','Tehdit Altında':'Threatened','Gergin':'Tense','Maruz Kalan':'Exposed',
  'Aşağılanmış':'Humiliated','Saygısızlık':'Disrespected','Alay Konusu':'Ridiculed','Acı':'Pain','Kızgın':'Angry','İhlal Edilmiş':'Violated',
  'Çok Öfkeli':'Furious','Kıskanç':'Jealous','Agresif':'Aggressive','Kışkırtılmış':'Provoked','Düşmanca':'Hostile',
  'Hüsrana Uğramış':'Frustrated','Çileden Çıkmış':'Enraged','Sinirli':'Annoyed','Mesafe':'Distant','Geri Çekilmiş':'Withdrawn','Hissiz':'Numb',
  'Kritik':'Critical','Şüpheci':'Skeptical','Küçümseyen':'Contemptuous',
  'Onaylanmıyor':'Disapproving','Yargılayıcı':'Judgmental','Dehşete Düşmüş':'Horrified','İsyan Etti':'Revolted',
  'Berbat':'Awful','Mide Bulantısı':'Nauseated','İğrenç':'Disgusting','İtilmiş':'Repelled','Tereddütlü':'Hesitant',
  'Yorgun':'Tired','Odaklanmamış':'Unfocused','Uykulu':'Sleepy','Stresli':'Stressed','Kontrol Dışı':'Out of control','Boğulmuş':'Overwhelmed',
  'Meşgul':'Busy','Acele':'Hurried','Baskılı':'Pressured','Sıkılmış':'Bored','Duyarsız':'Insensitive','İlgisiz':'Indifferent',
  'Şaşkın':'Surprised','Şok Olmuş':'Shocked','Kafası Karışmış':'Confused','Hayal Aleminden Çıkmış':'Out of daydream','Hayret':'Astonished','Hayranlık':'Admiration',
  'Heyecanlı':'Excited','İstekli':'Eager','Enerjik':'Energetic'
};

/* ===========================================================
 *  Infrastructure / rendering helpers
 * =========================================================*/
const TAU = Math.PI * 2, DEG = 180 / Math.PI;

function polar(cx, cy, r, a){ return [cx + r*Math.cos(a), cy + r*Math.sin(a)]; }
function arcPath(innerR, outerR, startA, endA){
  if(endA - startA >= TAU) endA = startA + TAU - 1e-6;
  const large = (endA - startA) > Math.PI ? 1 : 0;
  const [x0,y0] = polar(0,0, outerR, startA);
  const [x1,y1] = polar(0,0, outerR, endA);
  const [x2,y2] = polar(0,0, innerR, endA);
  const [x3,y3] = polar(0,0, innerR, startA);
  return `M ${x0} ${y0} A ${outerR} ${outerR} 0 ${large} 1 ${x1} ${y1} L ${x2} ${y2} A ${innerR} ${innerR} 0 ${large} 0 ${x3} ${y3} Z`;
}
function midAngle(a0,a1){ return (a0+a1)/2; }
function svg(tag, attrs){ const el=document.createElementNS('http://www.w3.org/2000/svg',tag); if(attrs) for(const k in attrs) el.setAttribute(k,attrs[k]); return el; }
function shade(hex, amt){
  const c = hex.replace('#',''); let r=parseInt(c.slice(0,2),16), g=parseInt(c.slice(2,4),16), b=parseInt(c.slice(4,6),16);
  const tgt = amt >= 0 ? 255 : 0, t = Math.abs(amt), mix=v=>Math.round(v+(tgt-v)*t);
  return `#${[mix(r),mix(g),mix(b)].map(v=>v.toString(16).padStart(2,'0')).join('')}`;
}
function luminance(hex){
  const c = hex.replace('#','');
  const [r,g,b] = [0,2,4].map(i => parseInt(c.slice(i,i+2),16)/255).map(v=> v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4));
  return 0.2126*r + 0.7152*g + 0.0722*b;
}
function contrastTextColor(bgHex){ return luminance(bgHex) > 0.5 ? '#0b0f14' : '#f8fbff'; }
function L(tr){ return (window.LANG==='TR' || !TR2EN[tr]) ? tr : TR2EN[tr]; }

/* ---------- DOM ---------- */
const wheel = document.getElementById('wheel');
const rings = [null, document.getElementById('g-ring-1'), document.getElementById('g-ring-2'), document.getElementById('g-ring-3')];
const crumbsEl = document.getElementById('crumbs');
const centerTitle = document.getElementById('centerTitle');
const btnBack = document.getElementById('btnBack');
const legendEl = document.getElementById('legend');
const btnLang = document.getElementById('btnLang');
const btnRestart = document.getElementById('btnRestart');
const btnMode = document.getElementById('btnMode'); // mode toggle

/* ---------- Radii (responsive; slightly smaller to avoid legend overlap) ---------- */
let radii = { 1:{in:140,out:320}, 2:{in:330,out:440}, 3:{in:450,out:520} };
function computeRadii(){
  const bbox = wheel.getBoundingClientRect();
  const R = Math.min(bbox.width, bbox.height) * 0.42;  // was 0.45 → leave room for legend
  const gap = Math.max(10, R*0.02);
  const ringW = Math.max(70, Math.min( R/3 - gap, 140 ));
  radii = {
    1: { in: R - 3*ringW - 2*gap, out: R - 2*ringW - 2*gap },
    2: { in: R - 2*ringW - gap,   out: R - ringW - gap     },
    3: { in: R - ringW,           out: R                   }
  };
}

/* ---------- State ---------- */
window.LANG = window.LANG || 'TR';
const state = { level:1, path:[], highlightPath:null, mode:'step' }; // 'step' | 'all'

/* ---------- Angles helpers (exact, gap-free) ---------- */
const EPS = 1e-9;
function partitionAngles(a0, a1, n) {
  const span = a1 - a0;
  const step = span / n;
  const out = new Array(n);
  let s = a0;
  for (let i = 0; i < n; i++) {
    const e = (i === n - 1) ? a1 : a0 + (i + 1) * step; // lock last to a1
    out[i] = { a0: s, a1: e };
    s = e;
  }
  return out;
}
function ringAngles(count, start=-Math.PI/2, end=start+TAU){ return partitionAngles(start, end, count); }
function ringSubdivide(a0,a1,count){ return partitionAngles(a0, a1, count); }

/* ---------- Crumbs & legend ---------- */
function setCrumbs(){
  if(state.mode==='all'){
    const base = window.LANG==='TR'?'Tümü görünüm':'Full view';
    if(state.highlightPath){
      const [ri,si,li]=state.highlightPath;
      const root=ROOTS[ri], sub=root.children[si], leaf=sub.children[li];
      crumbsEl.innerHTML = `${L(root.label)} › ${L(sub.label)} › <b>${L(leaf)}</b>`;
      centerTitle.textContent = L(leaf);
    }else{
      crumbsEl.innerHTML = `<b>${base}</b>`;
      centerTitle.textContent = window.LANG==='TR'?'Duygu Çarkı':'Emotion Wheel';
    }
    return;
  }
  if(state.path.length===0){
    crumbsEl.innerHTML = `<b>${window.LANG==='TR'?'Hepsi':'All'}</b>`;
    centerTitle.textContent = window.LANG==='TR'?'Duygu Çarkı':'Emotion Wheel';
    return;
  }
  const names=[]; let n=ROOTS[state.path[0]]; names.push(L(n.label));
  if(state.path.length>=2){ n=n.children[state.path[1]]; names.push(L(n.label)); }
  if(state.path.length>=3){ names.push(L(n.children[state.path[2]])); }
  crumbsEl.innerHTML = names.map((x,i)=> i===names.length-1?`<b>${x}</b>`:x).join(' › ');
  centerTitle.textContent = names[names.length-1];
}
function buildLegend(){
  legendEl.innerHTML='';
  ROOTS.forEach(r=>{
    const chip=document.createElement('span'); chip.className='chip';
    const dot=document.createElement('span'); dot.className='dot'; dot.style.background=r.color;
    const t=document.createElement('span'); t.textContent=L(r.label);
    chip.append(dot,t); legendEl.appendChild(chip);
  });
}

/* ===========================================================
 *  Fit-aware labels (no clipping): shrink & wrap (2 lines)
 * =========================================================*/
function addLabel(g, textTR, rMid, a0, a1, opts = {}) {
  // options: { full, color, dim, level }
  const full = !!opts.full;
  const text = L(textTR);
  const level = opts.level ?? 1; // 1,2,3
  const aCenter = full ? (-Math.PI / 2) : midAngle(a0, a1);
  const [tx, ty] = polar(0, 0, rMid, aCenter);

  const t = svg('text', {
    class: 'label',
    x: tx,
    y: ty,
    'text-anchor': 'middle',
    'dominant-baseline': 'middle'
  });

  // Keep upright when rotated around the circle
  if (!full) {
    const deg = aCenter * DEG;
    const needsFlip = deg > 90 && deg < 270;
    const rot = needsFlip ? deg + 180 : deg;
    t.setAttribute('transform', `rotate(${rot} ${tx} ${ty})`);
  }

  const color = opts.color || '#e6edf3';
  t.setAttribute('fill', color);
  t.setAttribute('stroke', '#000');
  t.setAttribute('stroke-width', 1.6);
  t.setAttribute('stroke-opacity', 0.18);
  if (opts.dim) t.classList.add('dim');

  // Fit constraints for this wedge
  const delta = Math.max(0.06, a1 - a0); // avoid 0
  const chord = 2 * rMid * Math.sin(delta / 2);
  const maxW = Math.max(18, chord * 0.86);  // side padding
  const ring = radii[level];
  const ringThickness = (ring.out - ring.in);
  const maxH = Math.max(12, ringThickness * (full ? 0.60 : 0.68));

  fitTextInto(t, text, maxW, maxH);

  g.appendChild(t);
  return t;
}
function fitTextInto(textEl, content, maxW, maxH) {
  // base size proportional to height, then shrink
  let fontSize = Math.min(20, Math.max(11, Math.floor(maxH * 0.42)));
  const minSize = 9;

  const tryLayout = (txt, twoLines) => {
    textEl.innerHTML = '';
    textEl.setAttribute('font-size', fontSize);

    if (!twoLines) {
      textEl.textContent = txt;
    } else {
      const parts = splitTwoLines(txt);
      const t1 = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
      const t2 = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
      t1.setAttribute('x', textEl.getAttribute('x'));
      t1.setAttribute('dy', `-${Math.round(fontSize * 0.52)}`);
      t1.textContent = parts[0];
      t2.setAttribute('x', textEl.getAttribute('x'));
      t2.setAttribute('dy', `${Math.round(fontSize * 1.08)}`);
      t2.textContent = parts[1] || '';
      textEl.appendChild(t1);
      textEl.appendChild(t2);
    }

    const box = textEl.getBBox();
    return (box.width <= maxW + 0.5 && box.height <= maxH + 0.5);
  };

  // 1) Single-line shrinking
  while (fontSize >= minSize) {
    if (tryLayout(content, false)) return;
    fontSize -= 1;
  }
  // 2) Two-line shrinking
  fontSize = Math.max(minSize, Math.floor(maxH * 0.45));
  while (fontSize >= minSize) {
    if (tryLayout(content, true)) return;
    fontSize -= 1;
  }
  // 3) Fallback: truncated single line
  textEl.innerHTML = '';
  textEl.setAttribute('font-size', minSize);
  textEl.textContent = ellipsize(content, Math.max(3, Math.floor(maxW / (minSize * 0.6))));
}
function splitTwoLines(txt) {
  const s = txt.trim();
  const i = s.indexOf(' ');
  if (i === -1) return [s, ''];
  const mid = Math.floor(s.length / 2);
  let best = i, pos = i;
  while (pos !== -1) {
    if (Math.abs(pos - mid) < Math.abs(best - mid)) best = pos;
    pos = s.indexOf(' ', pos + 1);
  }
  return [s.slice(0, best), s.slice(best + 1)];
}
function ellipsize(s, maxChars) {
  const t = s.trim();
  return t.length <= maxChars ? t : t.slice(0, Math.max(0, maxChars - 1)) + '…';
}

/* ---------- Label helpers used by step mode ---------- */
function keepOnlyLabel(g, index){
  const labels = Array.from(g.querySelectorAll('text.label'));
  labels.forEach((el,i)=>{ if(i!==index) el.remove(); });
}
function moveLabelToTop(g, index, level, color){
  const labels = Array.from(g.querySelectorAll('text.label')); const el = labels[index]; if(!el) return;
  const rMid = (radii[level].in + radii[level].out)/2; const a = -Math.PI/2; const [tx,ty] = polar(0,0,rMid,a);
  el.setAttribute('x', tx); el.setAttribute('y', ty); el.removeAttribute('transform'); if(color) el.setAttribute('fill', color);
}

/* ===========================================================
 *  STEP MODE (progressive)
 * =========================================================*/
function drawRing1_All(){
  rings[1].innerHTML=''; rings[2].innerHTML=''; rings[3].innerHTML='';
  rings[1].style.pointerEvents='auto'; rings[2].classList.add('fade'); rings[3].classList.add('fade');
  const angles = ringAngles(ROOTS.length);
  ROOTS.forEach((root, i)=>{
    const {a0,a1} = angles[i];
    const p = svg('path',{
      class:'arc',
      fill:root.color,
      d:arcPath(radii[1].in, radii[1].out, a0, a1)
    });
    p.addEventListener('click', ()=> focusTo(1,i,{a0,a1,color:root.color}));
    rings[1].appendChild(p);
    addLabel(rings[1], root.label, (radii[1].in+radii[1].out)/2, a0, a1, {color:contrastTextColor(root.color), level:1});
  });
}
function drawRing2_ForRoot(ri){
  rings[2].innerHTML=''; rings[2].classList.remove('fade'); rings[2].style.pointerEvents='auto';
  const root = ROOTS[ri]; const angles = ringAngles(root.children.length);
  root.children.forEach((sub, si)=>{
    const {a0,a1}=angles[si]; const fill = shade(root.color,.12);
    const p = svg('path',{class:'arc', fill, d:arcPath(radii[2].in, radii[2].out, a0, a1)});
    p.addEventListener('click', ()=> focusTo(2,si,{a0,a1,color:fill, rootColor:root.color}));
    rings[2].appendChild(p);
    addLabel(rings[2], sub.label, (radii[2].in+radii[2].out)/2, a0, a1, {color:contrastTextColor(fill), level:2});
  });
}
function drawRing3_ForSub(ri, si){
  rings[3].innerHTML=''; rings[3].classList.remove('fade'); rings[3].style.pointerEvents='auto';
  const root = ROOTS[ri]; const sub = root.children[si]; const angles = ringAngles(sub.children.length);
  sub.children.forEach((leaf, li)=>{
    const {a0,a1}=angles[li]; const fill = shade(root.color,.28);
    const p = svg('path',{class:'arc', fill, d:arcPath(radii[3].in, radii[3].out, a0, a1)});
    p.addEventListener('click', ()=> onLeaf(ri,si,li));
    rings[3].appendChild(p);
    addLabel(rings[3], leaf, (radii[3].in+radii[3].out)/2, a0, a1, {color:contrastTextColor(fill), level:3});
  });
}
function animateArcToFull(pathEl, innerR, outerR, a0, a1, duration=360){
  return new Promise(resolve=>{
    const start = performance.now(); const from = {a0, a1}, to = {a0:-Math.PI/2, a1:-Math.PI/2 + TAU - 1e-6};
    const ease = x => x<.5 ? 4*x*x*x : 1 - Math.pow(-2*x+2,3)/2;
    function frame(t){
      const k = Math.min(1, (t-start)/duration), e = ease(k);
      const s = from.a0 + (to.a0-from.a0)*e, eA = from.a1 + (to.a1-from.a1)*e;
      pathEl.setAttribute('d', arcPath(innerR, outerR, s, eA));
      if(k<1) requestAnimationFrame(frame); else resolve();
    }
    requestAnimationFrame(frame);
  });
}
function focusTo(level, index, info){
  state.mode='step';
  state.level = level;
  state.path = state.path.slice(0, level-1).concat([index]);
  state.highlightPath = null;
  setCrumbs();
  btnBack.style.display='block';

  const g = rings[level];
  const arcs = Array.from(g.querySelectorAll('path.arc'));
  const sel = arcs[index];

  // Remove sibling arcs, and keep only the selected label (this fixes step mode)
  arcs.forEach((p,i)=>{ if(i!==index) p.remove(); });
  keepOnlyLabel(g, index);           // <— crucial
  g.classList.add('locked');

  animateArcToFull(sel, radii[level].in, radii[level].out, info.a0, info.a1, 360)
  .then(()=>{
    const solidColor = (level===1) ? info.color : (level===2) ? shade(info.rootColor || info.color, .12) : info.color;
    sel.setAttribute('fill', solidColor);
    moveLabelToTop(g, 0, level, contrastTextColor(solidColor)); // index now 0 after keepOnlyLabel
    if(level===1){ drawRing2_ForRoot(state.path[0]); rings[1].style.pointerEvents='none'; }
    else if(level===2){ drawRing3_ForSub(state.path[0], state.path[1]); rings[2].style.pointerEvents='none'; }
  });
}
function onLeaf(ri, si, li){ state.highlightPath = [ri,si,li]; showFinalVisual(); }

/* ---------- Final visual (3 full donuts) ---------- */
function showFinalVisual(){
  rings[1].innerHTML=''; rings[2].innerHTML=''; rings[3].innerHTML='';
  rings[1].style.pointerEvents='none'; rings[2].style.pointerEvents='none'; rings[3].style.pointerEvents='none';
  const [ri, si, li] = state.highlightPath; const root = ROOTS[ri], sub = root.children[si], leaf = sub.children[li];
  const a0 = -Math.PI/2, a1 = a0 + TAU - 1e-6;
  const c1=shade(root.color,-.06), c2=shade(root.color,.04), c3=shade(root.color,.18);

  const p1 = svg('path',{class:'arc', fill:c1, d:arcPath(radii[1].in, radii[1].out, a0, a1)}); rings[1].appendChild(p1);
  addLabel(rings[1], root.label, (radii[1].in+radii[1].out)/2, a0, a1, {full:true, color:contrastTextColor(c1), level:1});
  const p2 = svg('path',{class:'arc', fill:c2, d:arcPath(radii[2].in, radii[2].out, a0, a1)}); rings[2].appendChild(p2);
  addLabel(rings[2], sub.label, (radii[2].in+radii[2].out)/2, a0, a1, {full:true, color:contrastTextColor(c2), level:2});
  const p3 = svg('path',{class:'arc', fill:c3, d:arcPath(radii[3].in, radii[3].out, a0, a1)}); rings[3].appendChild(p3);
  addLabel(rings[3], leaf, (radii[3].in+radii[3].out)/2, a0, a1, {full:true, color:contrastTextColor(c3), level:3});

  centerTitle.textContent = L(leaf); btnBack.style.display='block';
}

/* ---------- Back & Restart (fixed labels on rebuild) ---------- */
btnBack.addEventListener('click', goBack);
document.addEventListener('keydown', e=>{ if(e.key==='Escape') goBack(); });

function goBack(){
  if(state.mode==='all'){
    state.highlightPath = null;
    renderCurrent();
    return;
  }
  if(state.highlightPath){
    const [ri, si] = state.path; state.highlightPath = null;
    drawRing1_All();

    // Lock L1 to selected
    const arcs1 = rings[1].querySelectorAll('path.arc');
    arcs1.forEach((p,i)=>{ if(i!==ri) p.remove(); });
    keepOnlyLabel(rings[1], ri);
    const a1 = rings[1].querySelector('path.arc');
    a1.setAttribute('d', arcPath(radii[1].in, radii[1].out, -Math.PI/2, -Math.PI/2+TAU-1e-6));
    a1.setAttribute('fill', ROOTS[ri].color);
    rings[1].style.pointerEvents='none';
    moveLabelToTop(rings[1], 0, 1, contrastTextColor(ROOTS[ri].color));

    drawRing2_ForRoot(ri);

    // Lock L2 to selected
    const arcs2 = rings[2].querySelectorAll('path.arc');
    arcs2.forEach((p,i)=>{ if(i!==si) p.remove(); });
    keepOnlyLabel(rings[2], si);
    const a2 = rings[2].querySelector('path.arc');
    a2.setAttribute('d', arcPath(radii[2].in, radii[2].out, -Math.PI/2, -Math.PI/2+TAU-1e-6));
    a2.setAttribute('fill', shade(ROOTS[ri].color,.12));
    rings[2].style.pointerEvents='none';
    moveLabelToTop(rings[2], 0, 2, contrastTextColor(shade(ROOTS[ri].color,.12)));

    drawRing3_ForSub(ri, si);
    state.level=3; setCrumbs(); return;
  }
  if(state.level===3){
    const ri = state.path[0]; rings[3].innerHTML='';
    drawRing2_ForRoot(ri); rings[2].style.pointerEvents='auto';

    // Keep L1 locked & label correct
    const arcs1 = rings[1].querySelectorAll('path.arc');
    const idx1 = state.path[0];
    arcs1.forEach((p,i)=>{ if(i!==idx1) p.remove(); });
    keepOnlyLabel(rings[1], idx1);
    const a1 = rings[1].querySelector('path.arc');
    a1.setAttribute('d', arcPath(radii[1].in, radii[1].out, -Math.PI/2, -Math.PI/2+TAU-1e-6));
    a1.setAttribute('fill', ROOTS[idx1].color);
    rings[1].style.pointerEvents='none';
    moveLabelToTop(rings[1], 0, 1, contrastTextColor(ROOTS[idx1].color));

    state.level=2; state.path.pop(); setCrumbs(); return;
  }
  if(state.level===2){
    drawRing1_All(); state.level=1; state.path=[]; setCrumbs(); btnBack.style.display='none'; return;
  }
  drawRing1_All(); setCrumbs(); btnBack.style.display='none';
}

function restartWheel(){
  state.mode='step'; state.level=1; state.path=[]; state.highlightPath=null;
  btnBack.style.display='none';
  rings[1].style.pointerEvents='auto'; rings[2].style.pointerEvents='auto'; rings[3].style.pointerEvents='auto';
  drawRing1_All(); setCrumbs();
}
if(btnRestart){ btnRestart.addEventListener('click', restartWheel); }

/* ===========================================================
 *  ALL-AT-ONCE MODE — only outer ring clickable, inner dimmed
 * =========================================================*/
function drawAllRings(){
  rings[1].innerHTML=''; rings[2].innerHTML=''; rings[3].innerHTML='';
  // remove any fade from step mode
  rings[1].classList.remove('fade');
  rings[2].classList.remove('fade');
  rings[3].classList.remove('fade');

  // Only outer ring interactive
  rings[1].style.pointerEvents='none';
  rings[2].style.pointerEvents='none';
  rings[3].style.pointerEvents='auto';

  // L1 (dim-strong)
  const L1 = ringAngles(ROOTS.length);
  ROOTS.forEach((root, ri)=>{
    const {a0,a1}=L1[ri];
    const p=svg('path',{
      class:'arc dim-strong',
      fill:root.color,
      d:arcPath(radii[1].in,radii[1].out,a0,a1)
    });
    p.dataset.slot=`l1-${ri}`;
    rings[1].appendChild(p);
    addLabel(rings[1], root.label,(radii[1].in+radii[1].out)/2,a0,a1,{color:contrastTextColor(root.color), dim:true, level:1});
  });

  // L2 (dim)
  ROOTS.forEach((root, ri)=>{
    const angles2=ringSubdivide(L1[ri].a0,L1[ri].a1,root.children.length);
    root.children.forEach((sub, si)=>{
      const {a0,a1}=angles2[si]; const fill=shade(root.color,.12);
      const p=svg('path',{
        class:'arc dim',
        fill,
        d:arcPath(radii[2].in,radii[2].out,a0,a1)
      });
      p.dataset.slot=`l2-${ri}-${si}`;
      rings[2].appendChild(p);
      addLabel(rings[2], sub.label,(radii[2].in+radii[2].out)/2,a0,a1,{color:contrastTextColor(fill), dim:true, level:2});
    });
  });

  // L3 (interactive, full opacity) — add hairline stroke to hide anti-alias seams
  ROOTS.forEach((root, ri)=>{
    const angles2=ringSubdivide(L1[ri].a0,L1[ri].a1,root.children.length);
    root.children.forEach((sub, si)=>{
      const angles3=ringSubdivide(angles2[si].a0,angles2[si].a1,sub.children.length);
      sub.children.forEach((leaf, li)=>{
        const {a0,a1}=angles3[li]; const fill=shade(root.color,.28);
        const p=svg('path',{
          class:'arc',
          fill,
          d:arcPath(radii[3].in,radii[3].out,a0,a1),
          'stroke-linejoin':'round',
          'stroke':'rgba(0,0,0,0.15)',
          'stroke-width':'0.25'
        });
        p.dataset.level='3'; p.dataset.ri=ri; p.dataset.si=si; p.dataset.li=li;
        p.addEventListener('click', onAllClickLeaf);
        rings[3].appendChild(p);
        addLabel(rings[3], leaf,(radii[3].in+radii[3].out)/2,a0,a1,{color:contrastTextColor(fill), level:3});
      });
    });
  });

  // Re-apply highlight if any
  if(state.highlightPath){ highlightPathInAll(state.highlightPath[0],state.highlightPath[1],state.highlightPath[2]); }
}
function clearHighlights(){
  [...rings[1].querySelectorAll('path.arc'),
   ...rings[2].querySelectorAll('path.arc'),
   ...rings[3].querySelectorAll('path.arc')].forEach(p=>p.classList.remove('highlight'));
}
function highlightPathInAll(ri,si,li){
  clearHighlights();
  const l1 = rings[1].querySelector(`path.arc[data-slot="l1-${ri}"]`);
  if(l1) l1.classList.add('highlight');
  const offset = ROOTS.slice(0,ri).reduce((a,r)=>a+r.children.length,0);
  const l2 = rings[2].querySelectorAll('path.arc')[offset+si];
  if(l2) l2.classList.add('highlight');

  let idx3 = 0;
  for(let r=0;r<ri;r++) ROOTS[r].children.forEach(sub=> idx3 += sub.children.length);
  for(let s=0;s<si;s++) idx3 += ROOTS[ri].children[s].children.length;
  const l3 = rings[3].querySelectorAll('path.arc')[idx3+li];
  if(l3) l3.classList.add('highlight');

  const root=ROOTS[ri], sub=root.children[si], leaf=sub.children[li];
  crumbsEl.innerHTML=`${L(root.label)} › ${L(sub.label)} › <b>${L(leaf)}</b>`;
  centerTitle.textContent=L(leaf);
}
function onAllClickLeaf(e){
  const el=e.currentTarget;
  const ri=+el.dataset.ri, si=+el.dataset.si, li=+el.dataset.li;
  state.highlightPath=[ri,si,li];
  highlightPathInAll(ri,si,li);
}

/* ===========================================================
 *  MODE TOGGLE + LANG/RESIZE/RESTART glue
 * =========================================================*/
function renderCurrent(){
  if(state.mode==='all'){ drawAllRings(); setCrumbs(); btnBack.style.display='none'; return; }
  if(state.highlightPath){ showFinalVisual(); return; }
  if(state.level===1 && state.path.length===0){ drawRing1_All(); setCrumbs(); return; }

  // Rebuild to deepest level (step) — make sure we keep correct labels
  drawRing1_All();
  if(state.path.length>=1){
    const ri = state.path[0];
    rings[1].querySelectorAll('path.arc').forEach((p,i)=>{ if(i!==ri) p.remove(); });
    keepOnlyLabel(rings[1], ri);
    const s1 = rings[1].querySelector('path.arc');
    if(s1){
      s1.setAttribute('d', arcPath(radii[1].in, radii[1].out, -Math.PI/2, -Math.PI/2+TAU-1e-6));
      s1.setAttribute('fill', ROOTS[ri].color);
      rings[1].style.pointerEvents='none';
      moveLabelToTop(rings[1], 0, 1, contrastTextColor(ROOTS[ri].color));
    }
    drawRing2_ForRoot(ri);
  }
  if(state.path.length>=2){
    const [ri, si] = state.path;
    rings[2].querySelectorAll('path.arc').forEach((p,i)=>{ if(i!==si) p.remove(); });
    keepOnlyLabel(rings[2], si);
    const s2 = rings[2].querySelector('path.arc');
    if(s2){
      s2.setAttribute('d', arcPath(radii[2].in, radii[2].out, -Math.PI/2, -Math.PI/2+TAU-1e-6));
      s2.setAttribute('fill', shade(ROOTS[ri].color,.12));
      rings[2].style.pointerEvents='none';
      moveLabelToTop(rings[2], 0, 2, contrastTextColor(shade(ROOTS[ri].color,.12)));
    }
    drawRing3_ForSub(ri, si); state.level = 3;
  }else{
    state.level = Math.max(1, state.path.length);
  }
  setCrumbs();
}

/* Buttons */
if(btnMode){
  btnMode.addEventListener('click', ()=>{
    state.mode = (state.mode==='all') ? 'step' : 'all';
    btnMode.textContent = (state.mode==='all') ? (window.LANG==='TR'?'Adım Adım':'Step') : (window.LANG==='TR'?'Tümü':'All');
    btnMode.title = btnMode.textContent;
    if(state.mode==='all'){ state.path=[]; state.level=1; state.highlightPath=null; }
    renderCurrent();
  });
  btnMode.textContent = window.LANG==='TR' ? 'Tümü' : 'All';
  btnMode.title = btnMode.textContent;
}
const ro = new ResizeObserver(()=>{ computeRadii(); renderCurrent(); });
ro.observe(document.getElementById('app'));
if(btnLang){
  btnLang.addEventListener('click', ()=>{
    window.LANG = (window.LANG==='TR') ? 'EN' : 'TR';
    btnLang.textContent = window.LANG;
    if(btnRestart){ btnRestart.textContent = (window.LANG==='TR') ? 'Sıfırla' : 'Restart'; btnRestart.title = btnRestart.textContent; }
    if(btnMode){ btnMode.textContent = (state.mode==='all') ? (window.LANG==='TR'?'Adım Adım':'Step') : (window.LANG==='TR'?'Tümü':'All'); btnMode.title = btnMode.textContent; }
    buildLegend(); renderCurrent(); setCrumbs();
  });
}
if(btnRestart){ btnRestart.addEventListener('click', restartWheel); }

/* Init */
(function init(){
  buildLegend(); computeRadii(); setCrumbs(); drawRing1_All();
  if(btnLang) btnLang.textContent = window.LANG;
  if(btnRestart){ btnRestart.textContent = (window.LANG==='TR') ? 'Sıfırla' : 'Restart'; btnRestart.title = btnRestart.textContent; }
  if(btnMode){ btnMode.textContent = window.LANG==='TR' ? 'Tümü' : 'All'; btnMode.title = btnMode.textContent; }
  window.EmotionWheel = { get state(){ return {...state}; }, restart: restartWheel, render: renderCurrent };
})();
