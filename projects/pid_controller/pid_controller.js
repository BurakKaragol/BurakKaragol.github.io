/* =========================================================
   PID Mouse Follower with Presets, Randomize, Patterns & Trails
========================================================= */

class PID {
  constructor({ kp=1, ki=0, kd=0, dt=1/240, tf=0.02, iclamp=1e6 } = {}) {
    this.kp = kp; this.ki = ki; this.kd = kd;
    this.dt = dt; this.tf = tf; this.iclamp = iclamp;
    this.integrator = 0; this.prevMeas = 0; this.dState = 0;
    this.lastP = 0; this.lastI = 0; this.lastD = 0;
  }
  reset() {
    this.integrator = 0; this.prevMeas = 0; this.dState = 0;
  }
  update(setpoint, meas) {
    const e = setpoint - meas;
    const P = this.kp * e;

    this.integrator += this.ki * e * this.dt;
    this.integrator = Math.max(-this.iclamp, Math.min(this.iclamp, this.integrator));
    const I = this.integrator;

    const dIn = meas - this.prevMeas;
    let D;
    if (this.kd > 0 && this.tf > 0) {
      const a = this.tf / (this.tf + this.dt), b = 1 / (this.tf + this.dt);
      this.dState = a * this.dState - this.kd * b * dIn;
      D = this.dState;
    } else {
      D = -this.kd * dIn / this.dt;
    }

    this.lastP = P; this.lastI = I; this.lastD = D;
    this.prevMeas = meas;
    return P + I + D;
  }
}

const $ = id => document.getElementById(id);
const ui = {
  stage: $('stage'), status: $('status'),
  kp: $('kp'), ki: $('ki'), kd: $('kd'),
  kpNum: $('kp_num'), kiNum: $('ki_num'), kdNum: $('kd_num'),
  tf: $('tf'), iclamp: $('iclamp'),
  reset: $('reset'), random: $('randomize')
};

const ctx = ui.stage.getContext('2d');
let DPR = window.devicePixelRatio || 1;

let target = { x: 0, y: 0, fixed: false };
let dot    = { x: 0, y: 0, vx: 0, vy: 0 };

let pidX = new PID(), pidY = new PID();

const DT         = 1 / 240;
const MAX_ACCEL  = 8000;
const MAX_SPEED  = 2400;
const DRAG       = 0;

let acc = 0;

/* ================= TRAILS ================= */
const DOT_TRAIL_MAX     = 450;   // number of points
const TARGET_TRAIL_MAX  = 450;
const DOT_TRAIL_ALPHA0  = 0.95;  // newest alpha
const TGT_TRAIL_ALPHA0  = 0.85;
const DOT_TRAIL_ALPHA_MIN = 0.02;
const TGT_TRAIL_ALPHA_MIN = 0.02;

const dotTrail = [];     // [{x,y}]
const targetTrail = [];  // [{x,y}]

function pushTrailPoint(arr, x, y, maxLen){
  arr.push({x, y});
  if (arr.length > maxLen) arr.shift();
}
function clearTrails(){
  dotTrail.length = 0;
  targetTrail.length = 0;
}

/* ================= PRESETS ================= */
const PRESETS = {
  soft:   { kp: 5,   ki: 0.2,  kd: 1.4, tf: 0.03,  iclamp: 500 },
  glide:  { kp: 3,   ki: 0.1,  kd: 0.6, tf: 0.04,  iclamp: 600 },
  snappy: { kp: 11,  ki: 0,    kd: 2.8, tf: 0.015, iclamp: 400 },
  aggr:   { kp: 15,  ki: 0.3,  kd: 3.2, tf: 0.012, iclamp: 800 },
  lazy:   { kp: 1.5, ki: 0.05, kd: 0.2, tf: 0.05,  iclamp: 1000 },
  osc:    { kp: 18,  ki: 0,    kd: 0.5, tf: 0.01,  iclamp: 300 },
};
let activePreset = null;

function setInputs(p) {
  ui.kp.value = ui.kpNum.value = p.kp;
  ui.ki.value = ui.kiNum.value = p.ki;
  ui.kd.value = ui.kdNum.value = p.kd;
  ui.tf.value = p.tf;
  ui.iclamp.value = p.iclamp;
}

function applyPreset(name) {
  setInputs(PRESETS[name]);
  activePreset = { name, params: { ...PRESETS[name] } };
  refreshPresets();
  reset();
}
function clearPreset() { activePreset = null; refreshPresets(); }
function refreshPresets() {
  document.querySelectorAll('.preset-btn').forEach(b =>
    b.classList.toggle('active', activePreset && b.dataset.preset === activePreset.name)
  );
}
function maybeClear() {
  if (!activePreset) return;
  const p = activePreset.params;
  const eq = (a, b) => +a === +b;
  if (!(eq(ui.kp.value, p.kp) && eq(ui.ki.value, p.ki) && eq(ui.kd.value, p.kd) &&
        eq(ui.tf.value, p.tf) && eq(ui.iclamp.value, p.iclamp))) clearPreset();
}

function randomize() {
  clearPreset();
  const p = {
    kp: (Math.random() * 20).toFixed(2),
    ki: (Math.random() * 5).toFixed(2),
    kd: (Math.random() * 5).toFixed(2),
    tf: (Math.random() * 0.05).toFixed(3),
    iclamp: Math.floor(Math.random() * 1000 + 200)
  };
  setInputs(p);
  reset();
}

/* ================= PATTERNS ================= */
let activePattern = null; // {name, t0}
function setPattern(name) {
  activePattern = { name, t0: performance.now()/1000 };
  refreshPatterns();
}
function clearPattern() { activePattern = null; refreshPatterns(); }
function refreshPatterns() {
  document.querySelectorAll('.pattern-btn').forEach(b =>
    b.classList.toggle('active', activePattern && b.id === "pattern_"+activePattern.name)
  );
}

function updatePatternTarget(t) {
  if (!activePattern) return;
  const elapsed = t - activePattern.t0;
  const w = ui.stage.clientWidth, h = ui.stage.clientHeight;
  const cx = w/2, cy = h/2;
  const r = Math.min(w,h)/3;
  const speed = 1; // cycles per second

  switch(activePattern.name) {
    case 'circle': {
      const ang = elapsed*speed;
      target.x = cx + r * Math.cos(ang);
      target.y = cy + r * Math.sin(ang);
      break;
    }
    case 'square': {
      const T=8; const p=(elapsed*speed)%T; const side=T/4;
      if(p<side){ target.x=cx-r+2*r*(p/side); target.y=cy-r; }
      else if(p<2*side){ target.x=cx+r; target.y=cy-r+2*r*((p-side)/side); }
      else if(p<3*side){ target.x=cx+r-2*r*((p-2*side)/side); target.y=cy+r; }
      else { target.x=cx-r; target.y=cy+r-2*r*((p-3*side)/side); }
      break;
    }
    case 'triangle': {
      const T=6; const p=(elapsed*speed)%T; const side=T/3;
      const pts=[[cx,cy-r],[cx+r,cy+r],[cx-r,cy+r]];
      const s=Math.floor(p/side), u=(p%side)/side;
      const a=pts[s], b=pts[(s+1)%3];
      target.x=a[0]+(b[0]-a[0])*u;
      target.y=a[1]+(b[1]-a[1])*u;
      break;
    }
    case 'infinity': {
      const ang = elapsed*speed;
      target.x = cx + r*Math.sin(ang);
      target.y = cy + r*Math.sin(ang)*Math.cos(ang);
      break;
    }
  }
  target.fixed = true; // patterns always fix target
}

/* ================= HELPERS ================= */
function sizeCanvas() {
  const r = ui.stage.getBoundingClientRect();
  DPR = window.devicePixelRatio || 1;
  ui.stage.width = Math.floor(r.width * DPR);
  ui.stage.height = Math.floor(r.height * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  clearTrails(); // keep visuals clean on resize
}
function centerTarget() {
  target.x = ui.stage.clientWidth / 2;
  target.y = ui.stage.clientHeight / 2;
}
function reset() {
  dot.x = ui.stage.clientWidth * 0.25;
  dot.y = ui.stage.clientHeight * 0.5;
  dot.vx = dot.vy = 0;
  if (!target.fixed && !activePattern) centerTarget();

  pidX = new PID({ kp:+ui.kp.value, ki:+ui.ki.value, kd:+ui.kd.value, dt:DT, tf:+ui.tf.value, iclamp:+ui.iclamp.value });
  pidY = new PID({ kp:+ui.kp.value, ki:+ui.ki.value, kd:+ui.kd.value, dt:DT, tf:+ui.tf.value, iclamp:+ui.iclamp.value });

  clearTrails();
}
function mousePos(e) {
  const r = ui.stage.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

/* ================= POINTER ================= */
function wirePointer() {
  ui.stage.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    clearPattern(); // cancel pattern on click
    if (!target.fixed) {
      const p = mousePos(e);
      target.x = p.x; target.y = p.y; target.fixed = true;
    } else {
      target.fixed = false;
    }
  });
  ui.stage.addEventListener('pointermove', e => {
    if (!target.fixed && !activePattern) {
      const p = mousePos(e);
      target.x = p.x; target.y = p.y;
    }
  });
  ui.stage.addEventListener('dblclick', () => { clearPattern(); target.fixed = false; centerTarget(); clearTrails(); });
  ui.stage.addEventListener('pointerleave', () => { if (!target.fixed && !activePattern) { centerTarget(); clearTrails(); } });
}

/* ================= UI ================= */
function bindTwoWay(r, n) {
  const f = (s, d) => () => { d.value = s.value; maybeClear(); reset(); };
  r.addEventListener('input', f(r, n));
  n.addEventListener('input', f(n, r));
}
function wireUI() {
  bindTwoWay(ui.kp, ui.kpNum); bindTwoWay(ui.ki, ui.kiNum); bindTwoWay(ui.kd, ui.kdNum);
  [ui.tf, ui.iclamp].forEach(el => el.addEventListener('input', () => { maybeClear(); reset(); }));

  Object.keys(PRESETS).forEach(name => {
    const b = document.querySelector(`[data-preset="${name}"]`);
    if (b) b.addEventListener('click', () => applyPreset(name));
  });

  ui.random.addEventListener('click', randomize);
  ui.reset.addEventListener('click', reset);

  // Pattern buttons
  document.getElementById('pattern_circle')  ?.addEventListener('click',()=>{ setPattern('circle');   clearTrails(); });
  document.getElementById('pattern_square')  ?.addEventListener('click',()=>{ setPattern('square');   clearTrails(); });
  document.getElementById('pattern_triangle')?.addEventListener('click',()=>{ setPattern('triangle'); clearTrails(); });
  document.getElementById('pattern_infinity')?.addEventListener('click',()=>{ setPattern('infinity'); clearTrails(); });

  window.addEventListener('keydown', e => {
    if (e.key.toLowerCase() === 'c') { clearPattern(); target.fixed = false; centerTarget(); clearTrails(); }
  });
}

/* ================= SIMULATION ================= */
function simStep(dt) {
  const ax = Math.max(-MAX_ACCEL, Math.min(MAX_ACCEL, pidX.update(target.x, dot.x)));
  const ay = Math.max(-MAX_ACCEL, Math.min(MAX_ACCEL, pidY.update(target.y, dot.y)));
  dot.vx += (ax - DRAG * dot.vx) * dt;
  dot.vy += (ay - DRAG * dot.vy) * dt;

  const spd = Math.hypot(dot.vx, dot.vy);
  if (spd > MAX_SPEED) { const s = MAX_SPEED / spd; dot.vx *= s; dot.vy *= s; }

  dot.x += dot.vx * dt; dot.y += dot.vy * dt;

  // clamp to canvas
  dot.x = Math.max(0, Math.min(dot.x, ui.stage.clientWidth));
  dot.y = Math.max(0, Math.min(dot.y, ui.stage.clientHeight));

  // record trails (after movement)
  pushTrailPoint(dotTrail, dot.x, dot.y, DOT_TRAIL_MAX);
  pushTrailPoint(targetTrail, target.x, target.y, TARGET_TRAIL_MAX);
}

/* ================= RENDERING ================= */
function drawGrid(){
  ctx.strokeStyle = '#2b333a'; ctx.globalAlpha = 0.25;
  ctx.beginPath();
  for (let x=0;x<=ui.stage.clientWidth;x+=40){ctx.moveTo(x,0);ctx.lineTo(x,ui.stage.clientHeight);}
  for (let y=0;y<=ui.stage.clientHeight;y+=40){ctx.moveTo(0,y);ctx.lineTo(ui.stage.clientWidth,y);}
  ctx.stroke(); ctx.globalAlpha = 1;
}

function drawTrail(points, baseColor, alpha0, alphaMin){
  if (points.length < 2) return;
  // Parse baseColor (expects #RRGGBB)
  const r = parseInt(baseColor.slice(1,3),16);
  const g = parseInt(baseColor.slice(3,5),16);
  const b = parseInt(baseColor.slice(5,7),16);

  // Draw as multiple short segments fading out
  for (let i=1;i<points.length;i++){
    const p0 = points[i-1], p1 = points[i];
    const t  = i / (points.length-1);           // 0..1 old->new
    const a  = alphaMin + (alpha0 - alphaMin) * t;
    ctx.strokeStyle = `rgba(${r},${g},${b},${a.toFixed(3)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();
  }
}

function render() {
  ctx.clearRect(0, 0, ui.stage.clientWidth, ui.stage.clientHeight);

  // grid
  drawGrid();

  // trails (draw target trail first, then dot trail)
  drawTrail(targetTrail, '#ffb74d', TGT_TRAIL_ALPHA0, TGT_TRAIL_ALPHA_MIN);
  drawTrail(dotTrail,    '#3da9fc', DOT_TRAIL_ALPHA0, DOT_TRAIL_ALPHA_MIN);

  // target crosshair
  ctx.strokeStyle = '#ffb74d'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(target.x-12,target.y);ctx.lineTo(target.x+12,target.y);
  ctx.moveTo(target.x,target.y-12);ctx.lineTo(target.x,target.y+12);ctx.stroke();

  // line to target
  ctx.strokeStyle = '#3da9fc'; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(dot.x,dot.y); ctx.lineTo(target.x,target.y); ctx.stroke();

  // follower dot
  ctx.fillStyle = '#3da9fc';
  ctx.beginPath();
  ctx.arc(dot.x,dot.y,8,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#2f82c4'; ctx.stroke();

  const P=Math.hypot(pidX.lastP,pidY.lastP),
        I=Math.hypot(pidX.lastI,pidY.lastI),
        D=Math.hypot(pidX.lastD,pidY.lastD),
        U=Math.hypot(pidX.lastP+pidX.lastI+pidX.lastD,pidY.lastP+pidY.lastI+pidY.lastD);

  ui.status.textContent =
    `P=${P.toFixed(1)} I=${I.toFixed(1)} D=${D.toFixed(1)} | |u|=${U.toFixed(1)} | `+
    (activePattern ? `Pattern: ${activePattern.name}` : `Target ${target.fixed?'fixed':'follow'}`);
}

/* ================= LOOP ================= */
let last=performance.now();
function frame(now){
  const dt=(now-last)*0.001; last=now; acc+=dt;
  const t = now/1000;
  if(activePattern) updatePatternTarget(t);

  while(acc>=DT){simStep(DT); acc-=DT;}
  render(); requestAnimationFrame(frame);
}

/* ================= BOOT ================= */
function start(){
  sizeCanvas();
  wireUI();
  wirePointer();
  centerTarget();
  dot.x=ui.stage.clientWidth*0.25; dot.y=ui.stage.clientHeight*0.5;
  reset();
  refreshPresets();
  refreshPatterns();
  requestAnimationFrame(frame);
}
window.addEventListener('resize',()=>{
  sizeCanvas();
  if(!target.fixed && !activePattern) centerTarget();
});
document.addEventListener('DOMContentLoaded', start);
