/* =========================================================
   PID Controller Visualization (stacked controls + SP slider)
========================================================= */

// ---------- Utilities ----------
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// ---------- PID Controller ----------
class PID {
  constructor({kp=1,ki=0,kd=0,dt=0.01,tf=0,umin=-Infinity,umax=Infinity,iclamp=Infinity,dOnMeas=true}={}){
    this.kp=kp; this.ki=ki; this.kd=kd; this.dt=dt; this.tf=tf;
    this.umin=umin; this.umax=umax; this.iclamp=Math.abs(iclamp);
    this.dOnMeas=dOnMeas;
    this.integrator=0; this.prevMeas=0; this.prevErr=0; this.dState=0;
  }
  reset(){ this.integrator=0; this.prevMeas=0; this.prevErr=0; this.dState=0; }
  update(setpoint, measurement){
    const e = setpoint - measurement;

    const P = this.kp * e;

    this.integrator += this.ki * e * this.dt;
    this.integrator = clamp(this.integrator, -this.iclamp, this.iclamp);

    const dInput = this.dOnMeas ? (measurement - this.prevMeas) : (e - this.prevErr);
    let D = 0;
    if (this.kd > 0 && this.tf > 0){
      const a = this.tf / (this.tf + this.dt);
      const b = 1 / (this.tf + this.dt);
      this.dState = a*this.dState - this.kd*b*dInput; // minus with dOnMeas
      D = this.dState;
    } else {
      D = this.dOnMeas ? -this.kd * dInput / this.dt : this.kd * dInput / this.dt;
    }

    const u = P + this.integrator + D;
    const uSat = clamp(u, this.umin, this.umax);

    this.prevMeas = measurement;
    this.prevErr = e;
    return uSat;
  }
}

// ---------- Plants ----------
class FirstOrderPlant {
  constructor({K=1, tau=1, y=0, ymin=-Infinity, ymax=Infinity}={}){
    this.K=K; this.tau=tau; this.y=y; this.ymin=ymin; this.ymax=ymax;
  }
  step(u, dt){ const dydt=(-this.y + this.K*u)/this.tau; this.y+=dydt*dt; this.y=clamp(this.y,this.ymin,this.ymax); return this.y; }
  reset(y0=0){ this.y=y0; }
}
class SecondOrderPlant {
  constructor({K=1, w=2.5, z=0.3, y=0, v=0, ymin=-Infinity, ymax=Infinity}={}){
    this.K=K; this.w=w; this.z=z; this.y=y; this.v=v; this.ymin=ymin; this.ymax=ymax;
  }
  step(u, dt){
    const w2=this.w*this.w;
    const a=this.K*w2*u - 2*this.z*this.w*this.v - w2*this.y;
    this.v += a*dt; this.y += this.v*dt; this.y=clamp(this.y,this.ymin,this.ymax);
    return this.y;
  }
  reset(y0=0){ this.y=y0; this.v=0; }
}

// ---------- Plotter ----------
class Plot {
  constructor(canvas){
    this.canvas=canvas; this.ctx=canvas.getContext('2d');
    this.margin=38; this.history=[]; this.maxPoints=6000; this.xSpan=10;
    this.yMin=-2; this.yMax=2;
  }
  setWindow(xSpan){ this.xSpan=xSpan; }
  setYRange(min,max){ this.yMin=min; this.yMax=max; }
  clearData(){ this.history.length=0; }
  push(t, sp, pv, u){ this.history.push({t,sp,pv,u}); if(this.history.length>this.maxPoints) this.history.shift(); }
  draw(){
    const c=this.canvas, ctx=this.ctx, w=c.width, h=c.height;
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle='#0b1014'; ctx.fillRect(0,0,w,h);

    const m=this.margin, x0=m, y0=m, x1=w-m, y1=h-m;
    ctx.strokeStyle='#2b333a'; ctx.strokeRect(x0,y0,x1-x0,y1-y0);

    const T=this.history.length?this.history[this.history.length-1].t:0;
    const xmin=Math.max(0,T-this.xSpan), xmax=xmin+this.xSpan;

    // grid
    ctx.globalAlpha=.25; ctx.strokeStyle='#2b333a'; ctx.beginPath();
    const xGrid=8,yGrid=6;
    for(let i=0;i<=xGrid;i++){ const x=x0+(i/xGrid)*(x1-x0); ctx.moveTo(x,y0); ctx.lineTo(x,y1); }
    for(let j=0;j<=yGrid;j++){ const y=y0+(j/yGrid)*(y1-y0); ctx.moveTo(x0,y); ctx.lineTo(x1,y); }
    ctx.stroke(); ctx.globalAlpha=1;

    ctx.fillStyle='#9aa6b2'; ctx.font='11px Inter, Arial';
    ctx.fillText(`t: ${xmin.toFixed(1)} → ${xmax.toFixed(1)} s`, x0, y0-6);
    ctx.fillText(`y: [${this.yMin.toFixed(2)}, ${this.yMax.toFixed(2)}]`, x0+170, y0-6);

    const xmap=t=>x0+(t-xmin)/(xmax-xmin)*(x1-x0);
    const ymap=v=>y1-(v-this.yMin)/(this.yMax-this.yMin)*(y1-y0);

    const series=(key,color)=>{ ctx.strokeStyle=color; ctx.beginPath(); let on=false;
      for(const p of this.history){ if(p.t<xmin||p.t>xmax) continue; const x=xmap(p.t), y=ymap(p[key]); if(!on){ctx.moveTo(x,y); on=true;} else ctx.lineTo(x,y); }
      ctx.stroke();
    };
    series('sp','#ffb74d'); series('pv','#3da9fc'); series('u','#4caf50');
  }
}

// ---------- Metrics ----------
class Metrics {
  constructor(){ this.reset(); }
  reset(){ this.ISE=0; this.IAE=0; this.maxOvershoot=0; this.settled=false; }
  update(sp,pv,dt){ const e=sp-pv; this.ISE+=e*e*dt; this.IAE+=Math.abs(e)*dt; }
  computeOvershoot(sp,pv){ if(sp!==0){ const os=Math.max(0,(pv-sp)/Math.abs(sp)*100); if(os>this.maxOvershoot) this.maxOvershoot=os; } }
  checkSettled(window){
    if(window.length<60) return false;
    const last=window.slice(-60), sp=last[last.length-1].sp||0;
    const band=Math.max(0.02*Math.max(1,Math.abs(sp)),0.01);
    this.settled=last.every(p=>Math.abs(p.pv-sp)<=band);
    return this.settled;
  }
}

// ---------- UI ----------
const $ = id => document.getElementById(id);

const ui = {
  // sim
  dt:$('dt'), duration:$('duration'), setpoint:$('setpoint'), initialPV:$('initialPV'), fps:$('fps'),
  // pid
  kp:$('kp'), ki:$('ki'), kd:$('kd'),
  kpNum:$('kp_num'), kiNum:$('ki_num'), kdNum:$('kd_num'),
  tf:$('tf'), umin:$('umin'), umax:$('umax'), iclamp:$('iclamp'),
  dOnMeas:$('d_on_meas'),
  // plant
  plantModel:$('plantModel'),
  p1K:$('p1_K'), p1Tau:$('p1_tau'),
  p2K:$('p2_K'), p2w:$('p2_w'), p2z:$('p2_z'),
  ymin:$('ymin'), ymax:$('ymax'),
  // disturbance
  dEnable:$('d_enable'), dTime:$('d_time'), dMag:$('d_mag'),
  // buttons
  startPause:$('startPause'), reset:$('reset'), export:$('export'),
  presetZN:$('presetZN'), presetSoft:$('presetSoft'),
  // plot & status
  plot:$('plot'), status:$('status'), metrics:$('metrics'),
  // SP slider
  spSlider:$('sp_slider'), spLabel:$('sp_value'),
  // plant subpanels
  pFirst: document.querySelector('.plant.first'),
  pSecond: document.querySelector('.plant.second'),
};

let pid, plant, plot, metrics;
let running=false, t=0, sp=1, y=0, u=0;
let dtSim=0.01, duration=60;
let lastFrame=0, frameInterval=1000/60;
let historyRef=[];

// ---------- Build / Reset ----------
function buildPID(){
  pid = new PID({
    kp:+ui.kp.value, ki:+ui.ki.value, kd:+ui.kd.value,
    dt:+ui.dt.value, tf:+ui.tf.value,
    umin:+ui.umin.value, umax:+ui.umax.value,
    iclamp:+ui.iclamp.value, dOnMeas:ui.dOnMeas.checked
  });
}
function buildPlant(){
  const ymin=+ui.ymin.value, ymax=+ui.ymax.value;
  if(ui.plantModel.value==='first'){
    plant=new FirstOrderPlant({K:+ui.p1K.value, tau:+ui.p1Tau.value, y:+ui.initialPV.value, ymin, ymax});
    ui.pFirst.classList.remove('hidden'); ui.pSecond.classList.add('hidden');
  } else {
    plant=new SecondOrderPlant({K:+ui.p2K.value, w:+ui.p2w.value, z:+ui.p2z.value, y:+ui.initialPV.value, ymin, ymax});
    ui.pFirst.classList.add('hidden'); ui.pSecond.classList.remove('hidden');
  }
}
function resetSim(){
  dtSim=+ui.dt.value;
  duration=+ui.duration.value;
  sp=+ui.setpoint.value;
  y=+ui.initialPV.value;
  t=0; u=0; running=false;
  ui.startPause.textContent='Start';

  buildPID(); buildPlant();

  plot.clearData();
  plot.setWindow(Math.min(20,duration));
  const ymax=Math.max(2, Math.abs(sp)*1.5+1);
  plot.setYRange(-ymax, ymax);

  // sync SP slider to y-range & current SP
  ui.spSlider.min=(-ymax).toFixed(2);
  ui.spSlider.max=(+ymax).toFixed(2);
  ui.spSlider.value=sp.toFixed(2);
  ui.spLabel.textContent=`SP: ${(+ui.spSlider.value).toFixed(2)}`;

  metrics.reset(); historyRef=[];
  drawFrame(true);
}

// ---------- Sim loop ----------
function stepSim(){
  const d=(ui.dEnable.checked && t>=+ui.dTime.value)? +ui.dMag.value : 0;
  u=pid.update(sp,y);
  y=plant.step(u + d, dtSim);
  t+=dtSim;
  metrics.update(sp,y,dtSim);
  metrics.computeOvershoot(sp,y);
  historyRef.push({t,sp,pv:y});
  if(historyRef.length>3000) historyRef.shift();
}
function drawFrame(force=false){
  const now=performance.now();
  if(!force){
    const fpsCap=+ui.fps.value || 60;
    frameInterval=1000/Math.max(30, Math.min(120, fpsCap));
    if(now-lastFrame<frameInterval) return;
  }
  lastFrame=now;

  plot.push(t, sp, y, u);
  plot.draw();

  ui.status.textContent=`t = ${t.toFixed(2)} s | PV = ${y.toFixed(3)} | u = ${u.toFixed(3)}`;
  const settled=metrics.checkSettled(plot.history);
  ui.metrics.textContent=`ISE: ${metrics.ISE.toFixed(3)} | IAE: ${metrics.IAE.toFixed(3)} | Overshoot: ${metrics.maxOvershoot.toFixed(1)}% | Settled: ${settled ? 'Yes' : '—'}`;
}
function loop(){
  if(running){
    let simTime=0, frameSec=frameInterval/1000;
    while(simTime<frameSec){
      stepSim(); simTime+=dtSim;
      if(t>=duration){ running=false; ui.startPause.textContent='Start'; break; }
    }
  }
  drawFrame();
  requestAnimationFrame(loop);
}

// ---------- Bindings ----------
function bindTwoWay(range, number){
  const sync=(src,dst)=>()=>{ dst.value=src.value; buildPID(); };
  range.addEventListener('input', sync(range, number));
  number.addEventListener('input', sync(number, range));
}
function wireInputs(){
  bindTwoWay(ui.kp, ui.kpNum);
  bindTwoWay(ui.ki, ui.kiNum);
  bindTwoWay(ui.kd, ui.kdNum);

  ['kp','ki','kd','kpNum','kiNum','kdNum','tf','umin','umax','iclamp']
    .forEach(id=> (ui[id]||{}).addEventListener?.('input', buildPID));
  ui.dOnMeas.addEventListener('change', buildPID);

  ui.plantModel.addEventListener('change', buildPlant);
  ['p1K','p1Tau','p2K','p2w','p2z','ymin','ymax']
    .forEach(id=> (ui[id]||{}).addEventListener?.('input', buildPlant));

  // Sim + disturbance (live-read where needed)
  ;['dt','duration','initialPV','fps','d_enable','d_time','d_mag'].forEach(id=>{
    const el=$(id); el && el.addEventListener('input', ()=>{});
  });

  // Setpoint number <-> slider sync
  ui.setpoint.addEventListener('input', ()=>{
    sp=+ui.setpoint.value;
    if (sp < +ui.spSlider.min) ui.spSlider.min = sp.toFixed(2);
    if (sp > +ui.spSlider.max) ui.spSlider.max = sp.toFixed(2);
    ui.spSlider.value = sp.toFixed(2);
    ui.spLabel.textContent = `SP: ${sp.toFixed(2)}`;
  });
  ui.spSlider.addEventListener('input', ()=>{
    sp=+ui.spSlider.value;
    ui.setpoint.value=sp.toFixed(2);
    ui.spLabel.textContent=`SP: ${sp.toFixed(2)}`;
  });

  ui.startPause.addEventListener('click', ()=>{ running=!running; ui.startPause.textContent=running?'Pause':'Start'; });
  ui.reset.addEventListener('click', resetSim);
  ui.presetZN.addEventListener('click', ()=>{ ui.kp.value=ui.kpNum.value=2.0; ui.ki.value=ui.kiNum.value=1.2; ui.kd.value=ui.kdNum.value=0.1; buildPID(); });
  ui.presetSoft.addEventListener('click', ()=>{ ui.kp.value=ui.kpNum.value=1.0; ui.ki.value=ui.kiNum.value=0.3; ui.kd.value=ui.kdNum.value=0.05; buildPID(); });
  ui.export.addEventListener('click', ()=>{
    if(!plot.history.length) return;
    const rows=[['t','SP','PV','u']];
    for(const p of plot.history){ rows.push([p.t.toFixed(5), p.sp.toFixed(6), p.pv.toFixed(6), p.u.toFixed(6)]); }
    const csv=rows.map(r=>r.join(',')).join('\n');
    const blob=new Blob([csv],{type:'text/csv'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='pid_data.csv'; a.click(); URL.revokeObjectURL(a.href);
  });
}

// Tabs — robust delegation and clean initial state
function wireTabs(){
  const panes = {
    sim: document.getElementById('pane-sim'),
    pid: document.getElementById('pane-pid'),
    plant: document.getElementById('pane-plant'),
    dist: document.getElementById('pane-dist'),
    legend: document.getElementById('pane-legend'),
  };

  const tabbar = document.querySelector('.tabs');
  if (!tabbar) return;

  // Only one pane visible on start
  Object.values(panes).forEach(p => p.classList.remove('show'));
  panes.sim.classList.add('show');
  tabbar.querySelectorAll('.tab').forEach(t=>{
    const on = t.dataset.tab === 'sim';
    t.classList.toggle('active', on);
    t.setAttribute('aria-selected', on ? 'true' : 'false');
  });

  // Delegated click
  tabbar.addEventListener('click', (e)=>{
    const btn = e.target.closest('.tab');
    if (!btn) return;
    const key = btn.dataset.tab;
    if (!key || !panes[key]) return;

    tabbar.querySelectorAll('.tab').forEach(t=>{
      const on = t === btn;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });

    Object.values(panes).forEach(p => p.classList.remove('show'));
    panes[key].classList.add('show');
  });
}

// Canvas resize (HiDPI)
function onResizeCanvas(){
  const dpr=window.devicePixelRatio||1;
  const rect=ui.plot.getBoundingClientRect();
  ui.plot.width=Math.floor(rect.width*dpr);
  ui.plot.height=Math.floor(rect.height*dpr);
  plot.draw();
}
window.addEventListener('resize', onResizeCanvas, {passive:true});

// ---------- Boot ----------
let plotRef;
document.addEventListener('DOMContentLoaded', ()=>{
  wireTabs();
  wireInputs();
  plotRef=new Plot(ui.plot); plot=plotRef; metrics=new Metrics();
  resetSim();
  onResizeCanvas();
  requestAnimationFrame(loop);
});
