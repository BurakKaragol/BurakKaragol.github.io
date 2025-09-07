/* ==================== Helpers & Storage ==================== */
const $  = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

const K = { CONFIG:'pomodoro_config_v1', HISTORY:'pomodoro_history_v1', TASKS:'pomodoro_tasks_v1' };
const loadJSON=(k,f)=>{ try{ const s=localStorage.getItem(k); return s?JSON.parse(s):f; }catch{ return f; } };
const saveJSON=(k,d)=> localStorage.setItem(k, JSON.stringify(d));
const nowISO=()=> new Date().toISOString();

const dayKey=(d=new Date())=>{ const tz=new Date(d.getTime()-d.getTimezoneOffset()*60000); return tz.toISOString().slice(0,10); };
const weekKey=(d=new Date())=>{ const t=new Date(d); const first=new Date(t.setDate(t.getDate()-((t.getDay()+6)%7))); return dayKey(first); };

/* ==================== Config & State ==================== */
const defaultConfig = {
  focusMin:25, shortMin:5, longMin:15, cyclesToLong:4,
  autoAdvance:true, softFocus:true, soundOn:true, notifyOn:true,
  soundVolume:0.75,  // default 75%
  soundPreset:'beep'
};
const config = Object.assign({}, defaultConfig, loadJSON(K.CONFIG, {}));

let state = {
  phase:'focus',
  remainingSec:(config.focusMin||25)*60,
  running:false, cycleCount:0,
  rafId:null, lastTime:null, accum:0
};

/* ==================== DOM ==================== */
const body=document.body;
const timerEl=$('#timer'), badgeEl=$('#stateBadge'), cycleInfo=$('#cycleInfo'), barFill=$('#progressFill');
const floatingTime=$('#floatingTime');

const btnStart=$('#btnStart'), btnPause=$('#btnPause'), btnReset=$('#btnReset'), btnSkip=$('#btnSkip'), btnStartOver=$('#btnStartOver');
const continueBtn = $('#btnContinue'); // BIG CTA

const durFocus=$('#durFocus'), durShort=$('#durShort'), durLong=$('#durLong'), cyclesToLong=$('#cyclesToLong');

/* Settings controls */
const autoAdvance=$('#autoAdvance'), softFocus=$('#softFocus'), muteToggle=$('#muteToggle'), notifyToggle=$('#notifyToggle');
const soundPresetSel=$('#soundPreset');
const volumeSlider=$('#volumeSlider'), volumeValue=$('#volumeValue');
const btnTestSound=$('#btnTestSound'), btnTestNotify=$('#btnTestNotify');

/* Tasks */
const taskInput=$('#taskInput'), taskList=$('#taskList');
const tasksProgressFill=$('#tasksProgressFill'), tasksProgressText=$('#tasksProgressText'), tasksCongrats=$('#tasksCongrats');
const clearAllBtn = $('#clearAll');

/* Stats actions */
const exportBtn = $('#exportData');
const clearHistBtn = $('#clearData');

/* Overlay */
const attention=$('#attention-overlay');

/* ==================== Utility ==================== */
const PHASE_LABEL = p => p==='focus' ? 'FOCUS' : (p==='short' ? 'SHORT BREAK' : 'LONG BREAK');

function setTitle(){ document.title = `${formatTime(state.remainingSec)} — ${PHASE_LABEL(state.phase)}`; }
function formatTime(s){ const m=Math.floor(s/60), r=s%60; return `${String(m).padStart(2,'0')}:${String(r).padStart(2,'0')}`; }
function phaseDefaultSec(p){ return (p==='focus'?config.focusMin: p==='short'?config.shortMin:config.longMin)*60; }
function updateBodyClasses(){
  body.classList.toggle('break', state.phase!=='focus');
  body.classList.toggle('focus-active', state.phase==='focus' && state.running);
}

/* ==================== Continue CTA helpers ==================== */
function hideContinue(){
  if(!continueBtn) return;
  continueBtn.hidden = true;
  continueBtn.classList.remove('reveal');
}
function showContinue(){
  if(!continueBtn) return;
  if(config.autoAdvance){ hideContinue(); return; }
  continueBtn.hidden = false;
  // restart the keyframe animation reliably
  continueBtn.classList.remove('reveal');
  void continueBtn.offsetWidth;       // force reflow
  continueBtn.classList.add('reveal');
}
function updateContinueVisibility(){
  const shouldShow = !config.autoAdvance && !state.running && state.remainingSec <= 0;
  if(shouldShow) showContinue(); else hideContinue();
}

/* ==================== Dock toggles ==================== */
/* resolve to the .panel root if a child id was provided */
function panelNodeById(id){
  const el = document.getElementById(id);
  if(!el) return null;
  return el.classList?.contains('panel') ? el : (el.closest('.panel') || el);
}

/* “All” suppression (non-destructive hide) */
const ALL_IDS = ['panel-stats','panel-controls','panel-tasks','settings-panel'];

function allActive(){
  return $('#toggleAllPanels')?.getAttribute('aria-pressed') === 'true';
}
function refreshFloatingTime(){
  const ctrl = $('#panel-controls');
  const shouldShow =
    allActive() ||
    !ctrl ||
    ctrl.classList.contains('collapsed') ||
    ctrl.classList.contains('suppressed');
  if(shouldShow) floatingTime.classList.remove('collapsed');
  else           floatingTime.classList.add('collapsed');
}

/* Individual panel toggles (don’t affect “All” state) */
$$('.dock-btn').forEach(btn=>{
  if(btn.id === 'toggleAllPanels') return;

  btn.addEventListener('click', ()=>{
    const id = btn.getAttribute('data-toggle');
    const panel = id ? panelNodeById(id) : null;
    if(!panel) return;

    const isOpen = !panel.classList.contains('collapsed');

    if(isOpen){
      panel.classList.add('hide-anim');
      setTimeout(()=>{
        panel.classList.remove('hide-anim');
        panel.classList.add('collapsed');
      }, 420);
      btn.setAttribute('aria-pressed','false');
    }else{
      panel.classList.remove('collapsed');
      panel.classList.add('show-anim');
      requestAnimationFrame(()=>{ panel.classList.remove('show-anim'); });
      btn.setAttribute('aria-pressed','true');
    }
    refreshFloatingTime();
  });
});

/* All button: add/remove .suppressed to currently-open panels (incl. settings) */
const allBtn = $('#toggleAllPanels');
allBtn?.addEventListener('click', ()=>{
  const active = allActive();
  if(!active){
    ALL_IDS.forEach(id=>{
      const p = panelNodeById(id);
      if(p && !p.classList.contains('collapsed')){
        p.classList.add('suppressed');
      }
    });
    allBtn.setAttribute('aria-pressed','true');
  }else{
    ALL_IDS.forEach(id=>{
      const p = panelNodeById(id);
      if(p){ p.classList.remove('suppressed'); }
    });
    allBtn.setAttribute('aria-pressed','false');
  }
  refreshFloatingTime();
});

/* ==================== Inputs & persistence ==================== */
const SOUND_PRESETS = [
  {id:'beep',     label:'Beep (Soft Arp)'},
  {id:'blip',     label:'Blip (Descending)'},
  {id:'chime',    label:'Chime Duo'},
  {id:'bell',     label:'Calm Bell'},
  {id:'ping',     label:'Friendly Ping'},
  {id:'kalimba',  label:'Kalimba Plucks'},
  {id:'vibes',    label:'Vibraphone Tremolo'},
  {id:'marimba',  label:'Marimba'},
  {id:'wood',     label:'Wood Clicks'},
  {id:'bubble',   label:'Bubbles Up'},
  {id:'digital',  label:'Digital Alert'},
  {id:'harp',     label:'Harp Arp'},
  {id:'softbell', label:'Soft Bell'},
  {id:'glass',    label:'Glass Shimmer'}
];
if(soundPresetSel){
  soundPresetSel.innerHTML='';
  for(const p of SOUND_PRESETS){
    const opt=document.createElement('option'); opt.value=p.id; opt.textContent=p.label; soundPresetSel.appendChild(opt);
  }
  if(!SOUND_PRESETS.some(p=>p.id===config.soundPreset)){ config.soundPreset='beep'; saveJSON(K.CONFIG, config); }
  soundPresetSel.value=config.soundPreset;
}

durFocus.value=config.focusMin; durShort.value=config.shortMin; durLong.value=config.longMin;
cyclesToLong.value=config.cyclesToLong;

autoAdvance.checked=config.autoAdvance; softFocus.checked=config.softFocus;
muteToggle.checked=!!config.soundOn; notifyToggle.checked=!!config.notifyOn;
volumeSlider.value=Math.round((config.soundVolume??0.75)*100);
volumeValue.textContent = `${volumeSlider.value}%`;

[durFocus,durShort,durLong,cyclesToLong].forEach(inp=>{
  inp.addEventListener('change', ()=>{
    config.focusMin=+durFocus.value; config.shortMin=+durShort.value; config.longMin=+durLong.value;
    config.cyclesToLong=+cyclesToLong.value; saveJSON(K.CONFIG, config);
    if(!state.running){ state.remainingSec = phaseDefaultSec(state.phase); renderTime(); renderProgress(); renderCycleInfo(); setTitle(); }
  });
});

[autoAdvance,softFocus,muteToggle,notifyToggle,soundPresetSel].forEach(inp=>{
  inp?.addEventListener('change', ()=>{
    config.autoAdvance=!!autoAdvance.checked; config.softFocus=!!softFocus.checked;
    config.soundOn=!!muteToggle.checked; config.notifyOn=!!notifyToggle.checked;
    if(inp===soundPresetSel) config.soundPreset=soundPresetSel.value;
    saveJSON(K.CONFIG, config);
    updateContinueVisibility(); // reflect auto-advance change immediately
  });
});
volumeSlider.addEventListener('input', ()=>{
  const v = Math.max(0, Math.min(100, +volumeSlider.value));
  config.soundVolume = v/100;
  volumeValue.textContent = `${v}%`;
  saveJSON(K.CONFIG, config);
  applyVolume(); // live change
});

/* ==================== Timer core ==================== */
function setPhase(p){
  state.phase=p; state.remainingSec=phaseDefaultSec(p); state.accum=0;
  badgeEl.textContent = PHASE_LABEL(p);
  renderTime(); renderProgress(); renderCycleInfo(); setTitle(); updateBodyClasses();
  disarmStartOver(); // safety
  hideContinue();
}
function renderCycleInfo(){
  const total=config.cyclesToLong;
  if(state.phase==='focus'){
    const idx=(state.cycleCount % total)+1;
    cycleInfo.textContent=`Pomodoro ${idx}/${total}`;
  }else if(state.phase==='short'){
    let idx=(state.cycleCount % total); if(idx===0) idx=total;
    cycleInfo.textContent=`Break • ${idx}/${total}`;
  }else{
    cycleInfo.textContent='Long Break';
  }
}
function renderTime(){
  const t = formatTime(state.remainingSec);
  timerEl.textContent = t;
  floatingTime.textContent = t;
}
function renderProgress(){
  const total=phaseDefaultSec(state.phase);
  const done=Math.min(1,Math.max(0,1-(state.remainingSec/total)));
  barFill.style.width=`${(done*100).toFixed(1)}%`;
}

function start(){
  if(state.running) return;
  state.running=true; btnStart.disabled=true; btnPause.disabled=false;
  state.lastTime=performance.now(); state.accum=0; updateBodyClasses(); tick();
  disarmStartOver();
  hideContinue();
}
function pause(){
  state.running=false; btnStart.disabled=false; btnPause.disabled=true;
  updateBodyClasses();
  if(state.rafId){ cancelAnimationFrame(state.rafId); state.rafId=null; }
  setTitle();
}
function reset(){ // current phase only
  pause();
  state.remainingSec = phaseDefaultSec(state.phase);
  state.accum = 0;
  renderTime(); renderProgress(); setTitle();
  disarmStartOver();
  hideContinue();
}
function startOver(){ // full reset
  pause();
  state.cycleCount = 0;
  setPhase('focus');
  renderTime(); renderProgress(); renderCycleInfo(); setTitle();
  hideContinue();
}
function skip(){
  const auto = !!config.autoAdvance;
  pause();
  completePhase(false);
  nextPhase();
  disarmStartOver();
  hideContinue();
}

function tick(){
  if(!state.running) return;
  state.rafId=requestAnimationFrame(tick);
  const t=performance.now();
  const dt=(t-(state.lastTime||t))/1000;
  state.lastTime=t; state.accum+=dt;

  if(state.accum>=1){
    const dec=Math.floor(state.accum);
    state.accum-=dec;
    const prev=state.remainingSec;
    state.remainingSec=Math.max(0,state.remainingSec-dec);
    if(state.remainingSec!==prev){ renderTime(); renderProgress(); setTitle(); }
    if(state.remainingSec<=0){
      pause(); completePhase(true); notifyAttention();
      if(config.autoAdvance){
        nextPhase(); // will call start() inside when autoAdvance is true
      }else{
        showContinue(); // user will tap to progress+start
      }
    }
  }
}
function completePhase(naturalEnd){
  const spent = phaseDefaultSec(state.phase) - Math.max(0,state.remainingSec);
  const minValid = naturalEnd ? 15 : 1;
  if(spent>=minValid){ appendHistory({ type:state.phase, seconds:spent, endedAt:nowISO(), natural:!!naturalEnd }); refreshStats(); }
  if(state.phase==='focus') state.cycleCount++;
}
function nextPhase(){
  if(state.phase==='focus'){
    const useLong=(state.cycleCount%config.cyclesToLong)===0;
    setPhase(useLong?'long':'short');
  } else {
    setPhase('focus');
  }
  if(config.autoAdvance) start();
}

/* ==================== Continue CTA binding ==================== */
continueBtn?.addEventListener('click', ()=>{
  hideContinue();
  nextPhase();
  start();
});

/* ==================== Start Over: 2-click confirm ==================== */
function ensureGeneralStyles(){
  if(document.getElementById('generalDangerStyles')) return;
  const css = `
    .btn-danger{
      background:#a73540 !important;
      border-color:#cf5a65 !important;
      color:#fff !important;
      box-shadow:0 0 0 2px rgba(207,90,101,.18) inset;
      transform:translateY(-1px);
    }
    .btn-danger:hover{ filter:brightness(1.04) }
  `;
  const st=document.createElement('style'); st.id='generalDangerStyles'; st.textContent=css; document.head.appendChild(st);
}
ensureGeneralStyles();

let startOverArmed=false, startOverTimer=null;
const START_OVER_ORIG = btnStartOver ? btnStartOver.textContent : 'Start Over';
function disarmStartOver(){
  if(!btnStartOver) return;
  startOverArmed=false;
  btnStartOver.textContent = START_OVER_ORIG;
  btnStartOver.classList.remove('btn-danger');
  if(startOverTimer){ clearTimeout(startOverTimer); startOverTimer=null; }
}
btnStartOver?.addEventListener('click', ()=>{
  if(!startOverArmed){
    startOverArmed = true;
    btnStartOver.textContent = 'Sure ?';
    btnStartOver.classList.add('btn-danger');
    if(startOverTimer) clearTimeout(startOverTimer);
    startOverTimer = setTimeout(disarmStartOver, 2600);
    return;
  }
  disarmStartOver();
  startOver();
});

/* ==================== Clear All tasks: 2-click confirm ==================== */
let clearAllArmed = false, clearAllTimer = null;
const CLEAR_ALL_LABEL = clearAllBtn ? clearAllBtn.textContent : 'Clear All';
function disarmClearAll(){
  if(!clearAllBtn) return;
  clearAllArmed = false;
  clearAllBtn.textContent = CLEAR_ALL_LABEL;
  clearAllBtn.classList.remove('btn-danger');
  if(clearAllTimer){ clearTimeout(clearAllTimer); clearAllTimer=null; }
}
clearAllBtn?.addEventListener('click', ()=>{
  if(!clearAllArmed){
    clearAllArmed = true;
    clearAllBtn.textContent = 'Sure ?';
    clearAllBtn.classList.add('btn-danger');
    clearAllTimer = setTimeout(disarmClearAll, 2600);
    return;
  }
  disarmClearAll();
  saveTasks([]);     // wipe storage
  renderTasks();     // refresh progress & UI
});

/* ==================== Audio & Notifications (VARIED, CUTE MELODIES) ==================== */
let audio = { ctx: null, master:null, comp: null, makeup: null, wet: null, delay: null, fb: null, damp: null };

/* perceptual slider → gain mapping */
function volToGain(v){ return Math.max(0.0001, Math.pow(v, 1.4)); }
function applyVolume(){
  if(audio.master){ audio.master.gain.value = volToGain(config.soundVolume ?? 0.75); }
}

async function ensureAudio() {
  if (!audio.ctx) {
    audio.ctx = new (window.AudioContext || window.webkitAudioContext)();

    // Master gain
    audio.master = audio.ctx.createGain();
    audio.master.gain.value = volToGain(config.soundVolume ?? 0.75);

    // Gentle limiter
    audio.comp = audio.ctx.createDynamicsCompressor();
    audio.comp.threshold.value = -12;
    audio.comp.knee.value = 18;
    audio.comp.ratio.value = 4;
    audio.comp.attack.value = 0.003;
    audio.comp.release.value = 0.22;

    // Makeup gain (~ +6 dB)
    audio.makeup = audio.ctx.createGain(); audio.makeup.gain.value = 2.0;

    // Echo bus (subtle, damped)
    audio.wet   = audio.ctx.createGain();  audio.wet.gain.value = 0.20;
    audio.delay = audio.ctx.createDelay(); audio.delay.delayTime.value = 0.19;
    audio.fb    = audio.ctx.createGain();  audio.fb.gain.value = 0.25;
    audio.damp  = audio.ctx.createBiquadFilter(); audio.damp.type='lowpass'; audio.damp.frequency.value=2300; audio.damp.Q.value=0.6;
    audio.wet.connect(audio.delay); audio.delay.connect(audio.damp); audio.damp.connect(audio.fb);
    audio.fb.connect(audio.delay);
    audio.damp.connect(audio.master);

    // Main chain
    audio.master.connect(audio.comp);
    audio.comp.connect(audio.makeup);
    audio.makeup.connect(audio.ctx.destination);
  }
  if (audio.ctx.state === 'suspended') {
    try { await audio.ctx.resume(); } catch {}
  }
  applyVolume();
  return audio.ctx;
}

function currentAmp() {
  const v = Math.max(0, Math.min(1, config.soundVolume ?? 0.75));
  return 0.08 + 0.72 * Math.pow(v, 0.75);
}
const MIDI = (n)=> 440 * Math.pow(2, (n - 69) / 12);
const LPF_BASE = 2600;

/* ---------- Timbres ---------- */
function voice(midi, {
  type='sine', detuneCents=0, start=audio.ctx.currentTime+0.01,
  len=0.55, A=0.010, D=0.080, S=0.65, R=0.40, amp=currentAmp(),
  lpfHz=LPF_BASE, send=0.18
}={}){
  const o = audio.ctx.createOscillator();
  const g = audio.ctx.createGain();
  const lpf = audio.ctx.createBiquadFilter();
  o.type=type; o.frequency.value=MIDI(midi); o.detune.value=detuneCents;
  lpf.type='lowpass'; lpf.frequency.value=lpfHz; lpf.Q.value=0.7;

  o.connect(g); g.connect(lpf); lpf.connect(audio.master);
  const sg=audio.ctx.createGain(); sg.gain.value=send; lpf.connect(sg); sg.connect(audio.wet);

  const t0=start, tA=t0+A, tD=tA+D, tS=t0+len, tR=tS+R;
  g.gain.setValueAtTime(0.000001,t0);
  g.gain.exponentialRampToValueAtTime(amp,tA);
  g.gain.exponentialRampToValueAtTime(Math.max(amp*S,0.0002),tD);
  g.gain.setValueAtTime(Math.max(amp*S,0.0002),tS);
  g.gain.exponentialRampToValueAtTime(0.000001,tR);

  o.start(t0); o.stop(tR+0.02);
}
function shimmer(midi, t, opts={}){ voice(midi,{type:'triangle',detuneCents:-4,start:t,...opts}); voice(midi,{type:'sine',detuneCents:+4,start:t,...opts}); }
function tremoloVoice(midi, t, {rate=6, depth=0.5, ...opts}={}){
  const o = audio.ctx.createOscillator();
  const g = audio.ctx.createGain();
  const lfo = audio.ctx.createOscillator();
  const lfoGain = audio.ctx.createGain();
  const lpf = audio.ctx.createBiquadFilter();
  o.type='triangle'; o.frequency.value=MIDI(midi);
  lpf.type='lowpass'; lpf.frequency.value=2400; lpf.Q.value=0.7;

  lfo.type='sine'; lfo.frequency.value=rate; lfoGain.gain.value=depth;

  o.connect(g); g.connect(lpf); lpf.connect(audio.master);
  const sg=audio.ctx.createGain(); sg.gain.value=(opts.send??0.18); lpf.connect(sg); sg.connect(audio.wet);

  const t0=t, A=(opts.A??0.010), D=(opts.D??0.080), S=(opts.S??0.65), R=(opts.R??0.45),
        len=(opts.len??0.7), amp=(opts.amp??currentAmp());
  const tA=t0+A, tD=tA+D, tS=t0+len, tR=tS+R;

  g.gain.setValueAtTime(0.000001,t0);
  g.gain.exponentialRampToValueAtTime(amp,tA);
  g.gain.exponentialRampToValueAtTime(Math.max(amp*S,0.0002),tD);
  g.gain.setValueAtTime(Math.max(amp*S,0.0002),tS);
  g.gain.exponentialRampToValueAtTime(0.000001,tR);

  lfo.connect(lfoGain); lfoGain.connect(g.gain);
  lfo.start(t0); lfo.stop(tR+0.02);

  o.start(t0); o.stop(tR+0.02);
}
function fmVoice(midi, t, {modRatio=2, index=30, ...opts}={}){
  const car = audio.ctx.createOscillator();
  const mod = audio.ctx.createOscillator();
  const modGain = audio.ctx.createGain();
  const g = audio.ctx.createGain();
  const lpf = audio.ctx.createBiquadFilter();
  const f = MIDI(midi);
  car.type='sine'; car.frequency.value=f;
  mod.type='sine'; mod.frequency.value=f*modRatio;
  modGain.gain.value=index; mod.connect(modGain); modGain.connect(car.frequency);
  lpf.type='lowpass'; lpf.frequency.value=2400; lpf.Q.value=0.7;

  car.connect(g); g.connect(lpf); lpf.connect(audio.master);
  const sg=audio.ctx.createGain(); sg.gain.value=(opts.send??0.18); lpf.connect(sg); sg.connect(audio.wet);

  const t0=t, A=(opts.A??0.008), D=(opts.D??0.08), S=(opts.S??0.6), R=(opts.R??0.45),
        len=(opts.len??0.55), amp=(opts.amp??currentAmp());
  const tA=t0+A, tD=tA+D, tS=t0+len, tR=tS+R;

  g.gain.setValueAtTime(0.000001,t0);
  g.gain.exponentialRampToValueAtTime(amp,tA);
  g.gain.exponentialRampToValueAtTime(Math.max(amp*S,0.0002),tD);
  g.gain.setValueAtTime(Math.max(amp*S,0.0002),tS);
  g.gain.exponentialRampToValueAtTime(0.000001,tR);

  car.start(t0); mod.start(t0);
  car.stop(tR+0.02); mod.stop(tR+0.02);
}
function noiseBuffer(dur=0.25){
  const sr=audio.ctx.sampleRate, n=Math.max(1,Math.floor(sr*dur));
  const buf=audio.ctx.createBuffer(1,n,sr), data=buf.getChannelData(0);
  for(let i=0;i<n;i++) data[i]=Math.random()*2-1;
  return buf;
}
function pluckVoice(midi, t, {bpQ=12, ...opts}={}){
  const src = audio.ctx.createBufferSource();
  src.buffer = noiseBuffer(0.08);
  const bpf = audio.ctx.createBiquadFilter(); bpf.type='bandpass'; bpf.frequency.value=MIDI(midi); bpf.Q.value=bpQ;
  const g = audio.ctx.createGain();
  const lpf = audio.ctx.createBiquadFilter(); lpf.type='lowpass'; lpf.frequency.value=2200; lpf.Q.value=0.5;

  src.connect(bpf); bpf.connect(g); g.connect(lpf); lpf.connect(audio.master);
  const sg=audio.ctx.createGain(); sg.gain.value=(opts.send??0.20); lpf.connect(sg); sg.connect(audio.wet);

  const A=(opts.A??0.004), D=(opts.D??0.10), S=(opts.S??0.45), R=(opts.R??0.35),
        len=(opts.len??0.50), amp=(opts.amp??currentAmp());
  const t0=t, tA=t0+A, tD=tA+D, tS=t0+len, tR=tS+R;

  g.gain.setValueAtTime(0.000001,t0);
  g.gain.exponentialRampToValueAtTime(amp,tA);
  g.gain.exponentialRampToValueAtTime(Math.max(amp*S,0.0002),tD);
  g.gain.setValueAtTime(Math.max(amp*S,0.0002),tS);
  g.gain.exponentialRampToValueAtTime(0.000001,tR);

  src.start(t0); src.stop(tR+0.02);
}
function glissVoice(midiStart, midiEnd, t, opts={}){
  const o = audio.ctx.createOscillator();
  const g = audio.ctx.createGain();
  const lpf = audio.ctx.createBiquadFilter();
  o.type='sine'; o.frequency.setValueAtTime(MIDI(midiStart), t);
  lpf.type='lowpass'; lpf.frequency.value=2400; lpf.Q.value=0.7;

  o.connect(g); g.connect(lpf); lpf.connect(audio.master);
  const sg=audio.ctx.createGain(); sg.gain.value=(opts.send??0.22); lpf.connect(sg); sg.connect(audio.wet);

  const A=(opts.A??0.006), D=(opts.D??0.06), S=(opts.S??0.55), R=(opts.R??0.30),
        len=(opts.len??0.40), amp=(opts.amp??currentAmp());
  const t0=t, tA=t0+A, tD=tA+D, tS=t0+len, tR=tS+R;

  o.frequency.exponentialRampToValueAtTime(Math.max(1, MIDI(midiEnd)), tS);
  g.gain.setValueAtTime(0.000001,t0);
  g.gain.exponentialRampToValueAtTime(amp,tA);
  g.gain.exponentialRampToValueAtTime(Math.max(amp*S,0.0002),tD);
  g.gain.setValueAtTime(Math.max(amp*S,0.0002),tS);
  g.gain.exponentialRampToValueAtTime(0.000001,tR);

  o.start(t0); o.stop(tR+0.02);
}

/* ---------- Sequencing ---------- */
function playSequence(steps, { tempo=132, start=audio.ctx.currentTime+0.01, amp=currentAmp() }={}){
  const spb = 60/tempo; let t = start;
  for(const step of steps){
    const [notes, beats=1, vel=1, shape={}, engine='shimmer'] = step;
    const len = Math.max(0.25, beats*spb*0.9);
    const base = { len, amp: amp * vel, ...shape };
    const play = (n)=>{
      if(engine==='trem')      tremoloVoice(n, t, base);
      else if(engine==='fm')   fmVoice(n, t, base);
      else if(engine==='pluck')pluckVoice(n, t, base);
      else if(engine==='gliss'){ glissVoice(n, (shape.end ?? n+2), t, base); }
      else shimmer(n, t, base);
    };
    if(Array.isArray(notes)){ for(const m of notes) play(m); } else play(notes);
    t += beats*spb;
  }
}

/* ---------- Presets ---------- */
function playSound(preset=(config.soundPreset||'beep'), { preview=false }={}){
  if(!config.soundOn && !preview) return;
  if(!audio.ctx) return;
  const t0 = audio.ctx.currentTime + 0.01;
  const N = { C5:72, D5:74, E5:76, F5:77, G5:79, A5:81, B5:83, C6:84, D6:86, E6:88, G6:91 };

  switch(preset){
    case 'blip':
      playSequence([[N.C6,.5,1,{lpfHz:2300}],[N.G5,.5,.95,{lpfHz:2200}],[N.E5,.5,.9,{lpfHz:2100}],[N.C5,1,.85,{lpfHz:2000,R:.55,send:.22}]],{tempo:138,start:t0}); break;
    case 'chime':
      playSequence([[[N.E5,N.C5],.5,.95,{lpfHz:2400}],[[N.G5,N.E5],.5,.95,{lpfHz:2400}],[N.C6,.5,1,{lpfHz:2500}],[N.G5,.5,.95,{lpfHz:2300}],[N.E5,.75,.9,{lpfHz:2200,R:.6,send:.24}]],{tempo:126,start:t0}); break;
    case 'bell':
      playSequence([[N.C5,.5,.95,{lpfHz:2200,R:.8,send:.28}],[N.G5,.5,.95,{lpfHz:2300,R:.75}],[N.E5,.5,.95,{lpfHz:2300,R:.75}],[N.C6,.75,1,{lpfHz:2500,R:.85}]],{tempo:120,start:t0}); break;
    case 'ping':
      playSequence([[N.D5,.5,.95,{lpfHz:2300}],[N.G5,.5,1,{lpfHz:2400}],[N.E5,.5,.95,{lpfHz:2300}],[N.C5,.75,.9,{lpfHz:2200,R:.55,send:.22}]],{tempo:132,start:t0}); break;
    case 'beep':
      playSequence([[N.C5,.5,.95,{lpfHz:2300}],[N.E5,.5,.95,{lpfHz:2350}],[N.G5,.5,1,{lpfHz:2400}],[N.C6,.75,1,{lpfHz:2500,R:.5,send:.24}]],{tempo:138,start:t0}); break;

    case 'kalimba':
      playSequence([[N.C5,.5,1,{lpfHz:2100},'pluck'],[N.E5,.5,.95,{lpfHz:2100},'pluck'],[N.G5,.5,.95,{lpfHz:2100},'pluck'],[N.C6,.75,1,{lpfHz:2200,R:.5,send:.24},'pluck']],{tempo:132,start:t0}); break;
    case 'vibes':
      playSequence([[[N.C5,N.E5],.5,.95,{lpfHz:2400},'trem'],[[N.G5,N.C6],.5,1,{lpfHz:2450},'trem'],[N.E5,.75,.9,{lpfHz:2350,R:.6,send:.26},'trem']],{tempo:112,start:t0}); break;
    case 'marimba':
      playSequence([[N.E5,.5,1,{lpfHz:2000},'pluck'],[N.C5,.5,.95,{lpfHz:2000},'pluck'],[N.G5,.5,.95,{lpfHz:2000},'pluck'],[N.C6,.75,1,{lpfHz:2100,R:.55},'pluck']],{tempo:128,start:t0}); break;
    case 'wood':
      playSequence([[N.C5,.33,1,{lpfHz:1800,len:.35,R:.25,send:.12},'pluck'],[N.E5,.33,.9,{lpfHz:1800,len:.35,R:.25,send:.12},'pluck'],[N.G5,.5,.9,{lpfHz:1800,len:.4,R:.28,send:.12},'pluck']],{tempo:140,start:t0}); break;
    case 'bubble':
      playSequence([[N.C5,.5,1,{lpfHz:2400,end:N.E5,len:.45,R:.35},'gliss'],[N.D5,.5,.95,{lpfHz:2400,end:N.F5,len:.45,R:.35},'gliss'],[N.E5,.75,.95,{lpfHz:2400,end:N.G5,len:.5,R:.4,send:.26},'gliss']],{tempo:124,start:t0}); break;
    case 'digital':
      playSequence([[N.C5,.4,1,{lpfHz:2600},'fm'],[N.G5,.4,.95,{lpfHz:2600},'fm'],[N.E5,.5,.95,{lpfHz:2600},'fm'],[N.C6,.75,1,{lpfHz:2600,R:.45,send:.22},'fm']],{tempo:150,start:t0}); break;
    case 'harp':
      playSequence([[N.C5,.5,.95,{lpfHz:2400}],[N.E5,.5,.95,{lpfHz:2400}],[N.G5,.5,1,{lpfHz:2450}],[N.B5,.5,.95,{lpfHz:2500}],[N.C6,.75,1,{lpfHz:2500,R:.6,send:.28}]],{tempo:116,start:t0}); break;
    case 'softbell':
      playSequence([[N.G5,.5,1,{lpfHz:2300,R:.7}],[N.C6,.75,1,{lpfHz:2400,R:.8}]],{tempo:108,start:t0}); break;
    case 'glass':
      playSequence([[N.E6,.5,.9,{lpfHz:2700}],[N.B5,.5,1,{lpfHz:2700}],[N.G6,.75,.95,{lpfHz:2700,R:.6,send:.26}]],{tempo:122,start:t0}); break;

    default: playSound('beep',{preview});
  }
}

async function notifyAttention() {
  const ov = $('#attention-overlay');
  ov.classList.remove('show'); void ov.offsetWidth; ov.classList.add('show');
  try { await ensureAudio(); } catch {}
  playSound(config.soundPreset, { preview:false });

  if (config.notifyOn && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification('Timer finished', { body:`Phase ended: ${PHASE_LABEL(state.phase)}`, silent:!config.soundOn });
    } else if (Notification.permission !== 'denied') {
      try { await Notification.requestPermission(); } catch {}
    }
  }
  let flashes=0; const int=setInterval(()=>{ document.title=flashes%2?'⏰ TIME!':'—'; if(++flashes>8){ clearInterval(int); setTitle(); } },400);
}

/* Test buttons */
btnTestSound?.addEventListener('click', async () => { try { await ensureAudio(); playSound(config.soundPreset, { preview:true }); } catch {} });
btnTestNotify?.addEventListener('click', async ()=>{ try{ if('Notification' in window){ if(Notification.permission!=='granted'){ await Notification.requestPermission(); } if(Notification.permission==='granted'){ new Notification('Test Notification',{ body:'Looks good!', silent:true }); } } }catch{} });

/* ==================== History & Stats ==================== */
function appendHistory(entry){
  const hist=loadJSON(K.HISTORY,[]); hist.push(entry);
  const cutoff=Date.now()-1000*60*60*24*180; saveJSON(K.HISTORY, hist.filter(h=>new Date(h.endedAt).getTime()>=cutoff));
}
function aggregate(){
  const hist=loadJSON(K.HISTORY,[]);
  const today=dayKey(), weekStart=weekKey();
  let todayFocus=0,todayBreak=0,focusCount=0,weekFocus=0,weekBreak=0;
  const recent=hist.slice(-50).reverse();
  for(const h of hist){
    const dKey=dayKey(new Date(h.endedAt)), wKey=weekKey(new Date(h.endedAt)), isFocus=(h.type==='focus');
    if(dKey===today){ if(isFocus){ todayFocus+=h.seconds; focusCount++; } else { todayBreak+=h.seconds; } }
    if(wKey===weekStart){ if(isFocus) weekFocus+=h.seconds; else weekBreak+=h.seconds; }
  }
  return { todayFocusMin:Math.round(todayFocus/60), todayBreakMin:Math.round(todayBreak/60), todayFocusCount:focusCount, weekFocusMin:Math.round(weekFocus/60), weekBreakMin:Math.round(weekBreak/60), recent };
}
function refreshStats(){
  const a=aggregate();
  $('#statFocusCount').textContent=a.todayFocusCount;
  $('#statFocusMinutes').textContent=a.todayFocusMin;
  $('#statBreakMinutes').textContent=a.todayFocusMin ? a.todayBreakMin : a.todayBreakMin;
  $('#statWeekFocus').textContent=a.weekFocusMin;
  $('#statWeekBreak').textContent=a.weekBreakMin;
  const list=$('#historyList'); list.innerHTML='';
  for(const h of a.recent){
    const li=document.createElement('li');
    const label=h.type==='focus'?'Focus':(h.type==='short'?'Short':'Long');
    const mins=Math.round(h.seconds/60); const when=new Date(h.endedAt).toLocaleString();
    li.innerHTML=`<span>${label}</span><span>${mins} min</span><span>${when}</span>`;
    list.appendChild(li);
  }
}
refreshStats();

exportBtn?.addEventListener('click', ()=>{
  const data={config, history:loadJSON(K.HISTORY,[]), tasks:loadJSON(K.TASKS,[])};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob); const a=document.createElement('a');
  a.href=url; a.download=`pomodoro_data_${Date.now()}.json`; a.click(); URL.revokeObjectURL(url);
});

/* ----- Clear History (two-click confirm) ----- */
let clearHistArmed = false, clearHistTimer = null;
const CLEAR_HIST_LABEL = clearHistBtn ? clearHistBtn.textContent : 'Clear History';
function disarmClearHistory(){
  if (!clearHistBtn) return;
  clearHistArmed = false;
  clearHistBtn.textContent = CLEAR_HIST_LABEL;
  clearHistBtn.classList.remove('btn-danger');
  if (clearHistTimer){ clearTimeout(clearHistTimer); clearHistTimer = null; }
}
clearHistBtn?.addEventListener('click', ()=>{
  if(!clearHistArmed){
    clearHistArmed = true;
    clearHistBtn.textContent = 'Sure ?';
    clearHistBtn.classList.add('btn-danger');
    clearHistTimer = setTimeout(disarmClearHistory, 2600);
    return;
  }
  disarmClearHistory();
  saveJSON(K.HISTORY, []);
  refreshStats();
});

/* ==================== Tasks (+progress) ==================== */
function ensureTaskButtonStyles(){
  if(document.getElementById('taskActionsStyles')) return;
  const css = `
  .tasks .actions{display:flex;gap:6px}
  .task-btn{
    background:#202832;border:1px solid #2b333c;color:#E6EDF3;
    width:34px;height:30px;border-radius:10px;display:inline-flex;
    align-items:center;justify-content:center;font-weight:900;cursor:pointer;
    transition:transform .12s ease, background .2s ease, box-shadow .2s ease; user-select:none;
  }
  .task-btn:hover{transform:translateY(-1px)}
  .task-btn:active{background:color-mix(in oklab, var(--progress-color) 50%, #202832);box-shadow:0 0 0 3px color-mix(in oklab, var(--progress-color) 30%, transparent) inset}
  .task-btn svg{width:16px;height:16px;opacity:.92}
  `;
  const style=document.createElement('style');
  style.id='taskActionsStyles'; style.textContent=css;
  document.head.appendChild(style);
}
ensureTaskButtonStyles();

function ensureContinueStyles(){
  if(document.getElementById('continueStyles')) return;
  const css = `
    /* Keep hidden robustly */
    #btnContinue[hidden]{ display:none !important; }

    /* Big CTA — align with your .btn/.btn-primary look */
    .btn-continue{
      background: var(--btn-primary-bg, #2b86ff);
      color: var(--btn-primary-fg, #ffffff);
      border: 1px solid var(--btn-primary-border, #4896ff);
      border-radius: 14px;
      height: 56px;
      font-weight: 800;
      letter-spacing: .02em;
      box-shadow: 0 6px 22px rgba(0,0,0,.22), inset 0 0 0 2px rgba(255,255,255,.06);
      transition: transform .16s ease, box-shadow .2s ease, filter .2s ease, opacity .18s ease;
      width: 100%;
      opacity: .98;
    }
    .btn-continue:hover{ transform: translateY(-1px); box-shadow: 0 8px 26px rgba(0,0,0,.28), inset 0 0 0 2px rgba(255,255,255,.10); }
    .btn-continue:active{ transform: translateY(0); box-shadow: 0 0 0 rgba(0,0,0,0.0), inset 0 0 0 2px rgba(255,255,255,.12); }

    /* Respect focus mode’s gray-ish palette */
    .focus-active .btn-continue{
      filter: grayscale(.35) saturate(.85) brightness(.95);
      background: var(--btn-primary-bg-focus, #3a4656);
      border-color: var(--btn-primary-border-focus, #4b5666);
      color: var(--btn-primary-fg-focus, #E6EDF3);
    }

    /* Nice reveal motion when shown via JS */
    .btn-continue.reveal{ transform: translateY(-2px); opacity: 1; }
  `;
  const st=document.createElement('style');
  st.id='continueStyles';
  st.textContent=css;
  document.head.appendChild(st);
}
ensureContinueStyles();

function iconUp(){return `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 14l5-5 5 5H7z"/></svg>`}
function iconDown(){return `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 10l5 5 5-5H7z"/></svg>`}
function iconX(){return `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.3 5.71L12 12l6.3 6.29-1.41 1.42L10.59 13.4 4.3 19.71 2.89 18.3 9.18 12 2.89 5.71 4.3 4.29l6.29 6.3 6.29-6.3z"/></svg>`}

function loadTasks(){ return loadJSON(K.TASKS,[]); }
function saveTasks(t){ saveJSON(K.TASKS,t); }

function updateTasksProgress(tasks){
  const total = tasks.length;
  const done  = tasks.filter(t=>t.done).length;
  const pct   = total? Math.round(done/total*100) : 0;
  tasksProgressFill.style.width = `${pct}%`;
  tasksProgressText.textContent = `${done}/${total}`;
  tasksCongrats.hidden = !(total>0 && done===total);
}

function renderTasks(){
  const tasks=loadTasks(); taskList.innerHTML='';
  for(const t of tasks){
    const li=document.createElement('li'); li.className=t.done?'done':'';
    li.innerHTML=`
      <input type="checkbox" ${t.done?'checked':''} aria-label="Toggle complete"/>
      <div class="title">${escapeHtml(t.title)}</div>
      <div class="actions">
        <button class="task-btn" title="Move up"   data-act="up"   aria-label="Move up">${iconUp()}</button>
        <button class="task-btn" title="Move down" data-act="down" aria-label="Move down">${iconDown()}</button>
        <button class="task-btn" title="Delete"    data-act="del"  aria-label="Delete">${iconX()}</button>
      </div>`;
    li.querySelector('input').addEventListener('change',e=>{ t.done=e.target.checked; saveTasks(tasks); renderTasks(); });
    li.querySelector('[data-act="del"]').addEventListener('click',()=>{ const i=tasks.indexOf(t); tasks.splice(i,1); saveTasks(tasks); renderTasks(); } );
    li.querySelector('[data-act="up"]').addEventListener('click',()=>{ const i=tasks.indexOf(t); if(i>0){ [tasks[i-1],tasks[i]]=[tasks[i],tasks[i-1]]; saveTasks(tasks); renderTasks(); } });
    li.querySelector('[data-act="down"]').addEventListener('click',()=>{ const i=tasks.indexOf(t); if(i<tasks.length-1){ [tasks[i+1],tasks[i]]=[tasks[i],tasks[i+1]]; saveTasks(tasks); renderTasks(); } });
    taskList.appendChild(li);
  }
  updateTasksProgress(tasks);
}
function escapeHtml(s){ return s.replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }
taskInput?.addEventListener('keydown', e=>{
  if(e.key==='Enter'){
    const v=taskInput.value.trim();
    if(v){ const tasks=loadTasks(); tasks.push({title:v,done:false}); saveTasks(tasks); taskInput.value=''; renderTasks(); }
  }
});
$('#clearDone')?.addEventListener('click', ()=>{ const tasks=loadTasks().filter(t=>!t.done); saveTasks(tasks); renderTasks(); });
renderTasks();

/* ==================== Background (drifting + slow color change) ==================== */
const canvas=$('#bg'); const ctx=canvas.getContext('2d',{alpha:true});
let DPR=Math.max(1,Math.min(2,window.devicePixelRatio||1)), W=0,H=0;

function resize(){ DPR=Math.max(1,Math.min(2,window.devicePixelRatio||1)); W=canvas.clientWidth; H=canvas.clientHeight; canvas.width=Math.floor(W*DPR); canvas.height=Math.floor(H*DPR); }
new ResizeObserver(resize).observe(canvas); resize(); window.addEventListener('resize', resize);

// Tunables for bigger & more transparent shapes
const SHAPE_COUNT = 180;
const SIZE_MIN = 20;
const SIZE_MAX = 92;   // ~2x previous
const ALPHA_MIN = 0.18;
const ALPHA_MAX = 0.65;

const rng=(a,b)=> a+Math.random()*(b-a);
function makeShape(){
  const t=Math.random(), type=t<.34?'circle':(t<.67?'triangle':'square');
  const size=rng(SIZE_MIN,SIZE_MAX);
  return {
    type, size,
    x:rng(0,W), y:rng(0,H),
    vx:rng(-.12,.12), vy:rng(-.12,.12),
    rot:rng(0,Math.PI*2), vr:rng(-.0025,.0025),
    spd:rng(.35,1.25),
    h:rng(0,360), s:rng(55,85), l:rng(45,65), dh:rng(-0.05,0.05),
    alpha:rng(ALPHA_MIN,ALPHA_MAX)
  };
}
const shapes=[]; (function seed(n=SHAPE_COUNT){ for(let i=0;i<n;i++) shapes.push(makeShape()); })();

function draw(){
  ctx.setTransform(DPR,0,0,DPR,0,0);
  ctx.globalCompositeOperation='source-over';

  // subtle motion trail background
  ctx.fillStyle='rgba(10,13,16,.26)';
  ctx.fillRect(0,0,W,H);

  const base = (state.phase==='focus' && state.running) ? (config.softFocus ? 0.35 : 0.2) : 1.0;

  for(const s of shapes){
    s.x += s.vx * s.spd * base;
    s.y += s.vy * s.spd * base;
    s.rot += s.vr * base;

    // slow color drift
    s.h += s.dh; if(s.h<0) s.h+=360; if(s.h>=360) s.h-=360;

    // wrap edges
    if(s.x<-60) s.x=W+60; if(s.x>W+60) s.x=-60;
    if(s.y<-60) s.y=H+60; if(s.y>H+60) s.y=-60;

    // alpha with focus-dimming multiplier
    const phaseMul = (state.phase==='focus' && state.running) ? 0.75 : 1;
    const a = Math.max(0.06, Math.min(1, s.alpha * phaseMul));

    ctx.save();
    ctx.translate(s.x,s.y);
    ctx.rotate(s.rot);

    // soft edges / transparent feel
    ctx.globalAlpha = a;
    ctx.shadowBlur = s.size * 0.35;
    ctx.shadowColor = `hsla(${s.h.toFixed(1)} ${s.s}% ${s.l}% / ${Math.min(0.5, a*0.6)})`;
    ctx.fillStyle = `hsla(${s.h.toFixed(1)} ${s.s}% ${s.l}% / ${a})`;

    const h=s.size/2;
    if(s.type==='circle'){ ctx.beginPath(); ctx.arc(0,0,h,0,Math.PI*2); ctx.fill(); }
    else if(s.type==='square'){ ctx.fillRect(-h,-h,s.size,s.size); }
    else{ ctx.beginPath(); ctx.moveTo(-h,h); ctx.lineTo(0,-h); ctx.lineTo(h,h); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  }
  requestAnimationFrame(draw);
}
requestAnimationFrame(draw);

/* ==================== Bindings & Boot ==================== */
btnStart.addEventListener('click', start);
btnPause.addEventListener('click', pause);
btnReset.addEventListener('click', reset);
btnSkip .addEventListener('click', skip);
// Start Over handled above (2-click confirm)

continueBtn?.addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' ') { e.preventDefault(); continueBtn.click(); } });

window.addEventListener('keydown', e=>{
  if(e.target.closest('input,textarea')) return;
  if(e.code==='Space'){ e.preventDefault(); state.running?pause():start(); }
  if(e.key.toLowerCase()==='r'){ reset(); }
  if(e.key.toLowerCase()==='s'){ skip(); }
});

setPhase('focus');       // colorful at start (not running)
setTitle();
hideContinue();
setInterval(()=>{ if(state.running) setTitle(); }, 10000);

if('Notification' in window && Notification.permission==='default'){
  const ask=()=>{ Notification.requestPermission().catch(()=>{}); window.removeEventListener('click', ask); };
  window.addEventListener('click', ask);
}
