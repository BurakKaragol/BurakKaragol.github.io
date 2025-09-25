/* ===== Helpers ===== */
const $  = (s, r=document)=>r.querySelector(s);
const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));

/* ===== Help tooltip (fixed) ===== */
const helpIcon = $('#helpIcon');
const helpTip  = $('#helpTooltip');

function positionHelp(){
  const rect = helpIcon.getBoundingClientRect();
  const margin = 10;
  helpTip.style.left = Math.max(10, Math.min(rect.left, window.innerWidth - helpTip.offsetWidth - 10)) + 'px';
  helpTip.style.top  = (rect.bottom + margin) + 'px';
}
function showHelp(){ positionHelp(); helpTip.hidden = false; }
function hideHelp(){ helpTip.hidden = true; }
['mouseenter','focus'].forEach(ev=> helpIcon.addEventListener(ev, showHelp));
['mouseleave','blur'].forEach(ev=> helpIcon.addEventListener(ev, hideHelp));
window.addEventListener('scroll', ()=> !helpTip.hidden && positionHelp());
window.addEventListener('resize', ()=> !helpTip.hidden && positionHelp());

/* ===== Project metadata ===== */
/* difficulty: 0..100 (we’ll render %), time: human string */
const PROJECTS = {
  "game_idea_generator/": {
    time: "1 day",
    difficulty: 35,
    tags: ["Web", "UI", "Randomizer"],
    long: "Generates unique game prompts by mixing themes, verbs, constraints and win/fail conditions.",
    how: [
      "Seeded RNG ensures reproducible prompts when desired.",
      "Composable data tables for themes, mechanics, constraints.",
      "Exports to clipboard; shareable seed in URL."
    ]
  },
  "sorting_algorithm_visualizer/": {
    time: "2 days",
    difficulty: 55,
    tags: ["Algorithms", "Canvas", "Controls"],
    long: "Interactive visualizer to compare Bubble/Merge/Quick sort step-by-step.",
    how: [
      "Array generator with distributions (random, nearly-sorted, reversed).",
      "Animates swaps/merges; speed & size controls.",
      "Counts comparisons & swaps for quick benchmarking."
    ]
  },
  "path_finding_visualizer/": {
    time: "3 days",
    difficulty: 65,
    tags: ["A*", "Dijkstra", "Grid", "Heuristics"],
    long: "Pathfinding sandbox on a 2D grid with weighted cells and walls.",
    how: [
      "Implements A*, Dijkstra, BFS, DFS.",
      "Heuristics selectable; tie-breaking strategies.",
      "Drag to paint walls/weights; step/auto run modes."
    ]
  },
  "animating_dots/": {
    time: "1 day",
    difficulty: 30,
    tags: ["Particles", "Canvas"],
    long: "Particle field that links neighbors; mouse gravity distorts the network.",
    how: [
      "Spatial hashing to keep O(n) neighbor checks reasonable.",
      "Velocity dampening; device-pixel-ratio aware rendering."
    ]
  },
  "circle_packing/": {
    time: "2 days",
    difficulty: 60,
    tags: ["Image", "Sampling", "Art"],
    long: "Builds circle-packed art from a source image by sampling luminance and placing non-overlapping circles.",
    how: [
      "Poisson-disk style attempts with rejection sampling.",
      "Radius derived from local brightness; optional color pick from image.",
      "Incremental draw for smooth progress."
    ]
  },
  "meshing_dots/": {
    time: "2 days",
    difficulty: 50,
    tags: ["Delaunay", "Triangles"],
    long: "Triangular mesh that morphs with user interaction and palette controls.",
    how: [
      "Delaunay triangulation via incremental insertion.",
      "Edge-based color mapping with noise modulation."
    ]
  },
  "draw_tinker/": {
    time: "1.5 days",
    difficulty: 40,
    tags: ["Drawing", "Blend", "UX"],
    long: "Small playground to draw, merge, and tweak shapes using gesture tools.",
    how: [
      "Canvas tools with hit testing and shape grouping.",
      "Blend modes; export as PNG/SVG."
    ]
  },
  "qr_code/": {
    time: "0.5 day",
    difficulty: 25,
    tags: ["QR", "Encoding"],
    long: "Generates QR codes with size, margin and error-correction options.",
    how: [
      "String → QR matrix using a lightweight encoder.",
      "Canvas rendering; download as PNG/SVG."
    ]
  },
  "color_palette/": {
    time: "1 day",
    difficulty: 35,
    tags: ["Color", "UI"],
    long: "Creates harmonious color palettes using HSL variations and rule presets.",
    how: [
      "Analogous, triadic, tetradic, complementary sets.",
      "Copy hex with one click; export palette as JSON."
    ]
  },
  "maze_generator/": {
    time: "2 days",
    difficulty: 55,
    tags: ["Maze", "Backtracker", "DFS"],
    long: "Generates mazes and includes a simple solver to visualize the path.",
    how: [
      "Recursive backtracker for generation.",
      "DFS/BFS solver; step-by-step visualization."
    ]
  },
  "pomodoro/": {
    time: "1.5 days",
    difficulty: 35,
    tags: ["Productivity", "Timer", "Stats"],
    long: "Distraction-light Pomodoro with tasks, keyboard shortcuts and simple analytics.",
    how: [
      "Task list persistence in localStorage.",
      "Animated focus/short/long cycles; daily stats."
    ]
  },
  "pid_controller/": {
    time: "2.5 days",
    difficulty: 65,
    tags: ["Control", "PID", "Physics"],
    long: "Visualizes a PID controller with presets and live tuning on 2D paths.",
    how: [
      "Discrete PID update with anti-windup.",
      "Targets include circle/square/∞; mouse follow toggle."
    ]
  },
  /* gets injected when unlocked */
  "terminal.html": {
    time: "—",
    difficulty: 70,
    tags: ["Console", "Puzzle", "SHA-256"],
    long: "Hidden console mini-game. Use commands to uncover clues and validate answers (hashed).",
    how: [
      "Answers stored as SHA-256 in code.",
      "Client hashes your guess and compares locally.",
      "Story beats unlock additional commands."
    ]
  }
};

/* ===== Grid interactions ===== */
const grid = $('#projectsGrid');
const modal = $('#modal'),
      dlgTitle = $('#dlgTitle'),
      dlgDesc  = $('#dlgDesc'),
      dlgHero  = $('#dlgHero'),
      dlgMeta  = $('#dlgMeta'),
      dlgOpen  = $('#dlgOpen'),
      dlgTime  = $('#dlgTime'),
      dlgDiffBar   = $('#dlgDiffBar'),
      dlgDiffLabel = $('#dlgDiffLabel'),
      dlgLong  = $('#dlgLong'),
      dlgHow   = $('#dlgHow');

grid.addEventListener('click', (e)=>{
  const card = e.target.closest('.card');
  if (!card) return;

  if (e.target.matches('.btn.primary,a.btn.primary')) return; // Open handled by link

  if (e.target.matches('[data-details]')) { openDetails(card); return; }

  const url = card.getAttribute('data-url');
  if (url) location.href = url;
});

function fillTags(tags=[]) {
  dlgMeta.innerHTML = '';
  tags.forEach(t=>{
    const span=document.createElement('span');
    span.className='tag';
    span.textContent=t;
    dlgMeta.appendChild(span);
  });
}

function setDifficulty(pct){
  const p = Math.max(0, Math.min(100, +pct||0));
  dlgDiffBar.style.width = p + '%';
  // hue from green (90) to red (0)
  const hue = Math.round(90 - 0.9*p);
  dlgDiffBar.style.background = `linear-gradient(90deg, hsl(${hue} 85% 55%), hsl(${Math.max(hue-15,0)} 80% 52%))`;
  dlgDiffLabel.textContent = p <= 20 ? 'Very easy'
                    : p <= 40 ? 'Easy'
                    : p <= 60 ? 'Medium'
                    : p <= 80 ? 'Hard'
                              : 'Very hard';
}

function openDetails(card){
  const title = $('.title', card).textContent.trim();
  const desc  = $('.desc', card).textContent.trim();
  const url   = card.getAttribute('data-url') || $('.btn.primary', card)?.getAttribute('href') || '#';
  const bgImg = $('.thumb', card).style.backgroundImage;

  // metadata lookup
  const meta = PROJECTS[url] || PROJECTS[url.replace('./','')] || PROJECTS[url.replace(/\/$/,'/')] || {
    time: '—',
    difficulty: 40,
    tags: [],
    long: title + ' — more details coming soon.',
    how: []
  };

  // Fill modal
  dlgTitle.textContent = title;
  dlgDesc.textContent  = desc;
  dlgHero.style.background = bgImg || "linear-gradient(180deg,#0e141a,#0b1014)";
  dlgHero.style.backgroundSize = 'cover';
  dlgHero.style.backgroundPosition = 'center';
  dlgOpen.href = url;

  dlgTime.textContent = meta.time || '—';
  setDifficulty(meta.difficulty ?? 40);
  fillTags(meta.tags);

  dlgLong.textContent = meta.long || '';
  dlgHow.innerHTML = '';
  (meta.how || []).forEach(li=>{
    const el=document.createElement('li'); el.textContent=li; dlgHow.appendChild(el);
  });

  modal.classList.add('open');
  modal.setAttribute('aria-hidden','false');
}

modal.addEventListener('click', (e)=>{ if (e.target.hasAttribute('data-close')) closeModal(); });
function closeModal(){ modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); }

/* ===== Secret 12-key puzzle ===== */
const SECRET_STORAGE_KEY = 'secret_project_unlocked_opt1_details_v1';
const ARROWS = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
const SEQ_LENGTH = 12;

const head = $('#secretHead');  // boxed 4
const tail = $('#secretTail');  // inline icons 5..12
const wrap = $('#secretWrap');

// Build first 4 slots
const headSlots = [];
for (let i=0;i<4;i++){
  const slot = document.createElement('div');
  slot.className = 'slot';
  const icon = document.createElement('span');
  icon.className = 'icon';
  slot.appendChild(icon);
  head.appendChild(slot);
  headSlots.push(icon);
}

// Random pattern
function genPattern(n=SEQ_LENGTH){
  return Array.from({length:n}, ()=> ARROWS[Math.floor(Math.random()*ARROWS.length)]);
}
const pattern = genPattern();

// Optional: store SHA-256 of the pattern string
(async function storeHash(){
  const txt = pattern.map(k=>k.replace('Arrow','')).join(',');
  const enc = new TextEncoder().encode(txt);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  const hex = [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
  // console.log('pattern hash:', hex);
})();

function arrowSpan(key, wrong=false){
  const s = document.createElement('span');
  s.className = `icon key-${key.replace('Arrow','').toLowerCase()} show${wrong?' wrong':''}`;
  return s;
}

let progress = 0;
let resetTimer = null;

function resetPuzzle(){
  clearTimeout(resetTimer);
  progress = 0;
  headSlots.forEach(icon=>{ icon.className = 'icon'; icon.removeAttribute('style'); });
  tail.innerHTML = '';
}

function flashError(){
  wrap.classList.remove('shake'); void wrap.offsetWidth; wrap.classList.add('shake');
}

function revealAt(ix, key, wrong){
  if (ix < 4){
    const el = headSlots[ix];
    el.className = `icon key-${key.replace('Arrow','').toLowerCase()} show${wrong?' wrong':''}`;
    el.removeAttribute('style');
  } else {
    tail.appendChild(arrowSpan(key, wrong));
  }
}

function onComplete(){
  try{ localStorage.setItem(SECRET_STORAGE_KEY,'1'); }catch{}
  injectSecretCard();
}

window.addEventListener('keydown', (e)=>{
  if (!ARROWS.includes(e.key)) return;
  e.preventDefault();

  const expected = pattern[progress];
  if (e.key === expected){
    revealAt(progress, e.key, false);
    progress++;
    if (progress === SEQ_LENGTH) onComplete();
  } else {
    revealAt(progress, e.key, true);
    flashError();
    clearTimeout(resetTimer);
    resetTimer = setTimeout(resetPuzzle, 450);
  }
});

// Inject hidden project on success (or if previously unlocked)
function injectSecretCard(){
  if (grid.querySelector('[data-secret="1"]')) return;

  const card = document.createElement('article');
  card.className = 'card';
  card.dataset.secret = '1';
  card.setAttribute('data-url', 'terminal.html');

  const thumb = document.createElement('div');
  thumb.className = 'thumb';
  thumb.style.background = "radial-gradient(120% 120% at 10% 10%, rgba(61,169,252,.18), transparent 40%), linear-gradient(180deg,#0e141a,#0b1014)";

  const body = document.createElement('div');
  body.className = 'body';

  const h3 = document.createElement('h3');
  h3.className = 'title';
  h3.textContent = 'Secret Console';

  const p = document.createElement('p');
  p.className = 'desc';
  p.textContent = 'A terminal mini-puzzle. Explore, decode, submit.';

  const actions = document.createElement('div');
  actions.className = 'actions';

  const aOpen = document.createElement('a');
  aOpen.className = 'btn primary';
  aOpen.href = 'terminal.html';
  aOpen.textContent = 'Open';

  const btnDet = document.createElement('button');
  btnDet.className = 'btn';
  btnDet.textContent = 'Details';
  btnDet.setAttribute('data-details', '');

  actions.appendChild(aOpen); actions.appendChild(btnDet);
  body.appendChild(h3); body.appendChild(p); body.appendChild(actions);
  card.appendChild(thumb); card.appendChild(body);
  grid.appendChild(card);
}

try{ if (localStorage.getItem(SECRET_STORAGE_KEY)==='1') injectSecretCard(); }catch{}
resetPuzzle();
