(() => {
  // ---------- Utilities ----------
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const k = (r, c) => `${r},${c}`;
  const now = () => performance.now();
  const $ = (sel) => document.querySelector(sel);

  let colStart = '#3da9fc', colEnd = '#e85dff';
  const readCSSColors = () => {
    try {
      const css = getComputedStyle(document.documentElement);
      colStart = (css.getPropertyValue('--replay-start') || '#3da9fc').trim();
      colEnd   = (css.getPropertyValue('--replay-end')   || '#e85dff').trim();
    } catch {}
  };

  const fmt = (ms) => {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const x = Math.floor(ms % 1000);
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(x).padStart(3,'0')}`;
  };

  const toRGB = (c) => {
    c = (c||'').trim();
    if (c.startsWith('#')) {
      const h = c.slice(1);
      const v = h.length === 3
        ? h.split('').map(ch => parseInt(ch+ch,16))
        : [h.slice(0,2),h.slice(2,4),h.slice(4,6)].map(x => parseInt(x,16));
      return {r:v[0]||0, g:v[1]||0, b:v[2]||0, a:1};
    }
    const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([.\d]+))?\)/i);
    if (m) return {r:+m[1], g:+m[2], b:+m[3], a:+(m[4] ?? 1)};
    return {r:61,g:169,b:252,a:1};
  };
  const lerp=(a,b,t)=>a+(b-a)*t;
  const lerpRGB=(c0,c1,t)=>({ r:Math.round(lerp(c0.r,c1.r,t)), g:Math.round(lerp(c0.g,c1.g,t)), b:Math.round(lerp(c0.b,c1.b,t)), a:lerp(c0.a,c1.a,t) });
  const rgbStr=(c)=>`rgba(${c.r},${c.g},${c.b},${c.a})`;
  const popcount4 = (m) => ((m&1)?1:0)+((m&2)?1:0)+((m&4)?1:0)+((m&8)?1:0);

  // ---------- Maze ----------
  class Maze {
    constructor(rows, cols) {
      this.rows = rows|0;
      this.cols = cols|0;
      this.grid = new Array(this.rows * this.cols).fill(0).map(() => ({ walls: 1|2|4|8, visited:false }));
      this.start = { r:0, c:0 };
      this.goal  = { r:this.rows-1, c:this.cols-1 };
    }
    idx(r,c){ return r*this.cols + c; }
    inBounds(r,c){ return r>=0 && c>=0 && r<this.rows && c<this.cols; }
    neighbors(r,c){
      return [
        {dir:1, dr:-1, dc: 0, r:r-1, c:c}, // N
        {dir:2, dr: 0, dc:+1, r:r, c:c+1}, // E
        {dir:4, dr:+1, dc: 0, r:r+1, c:c}, // S
        {dir:8, dr: 0, dc:-1, r:r, c:c-1}, // W
      ].filter(n => this.inBounds(n.r,n.c));
    }
    carve(a,b,dir){
      const ai = this.idx(a.r,a.c), bi = this.idx(b.r,b.c);
      const opp = {1:4,2:8,4:1,8:2}[dir];
      this.grid[ai].walls &= ~dir;
      this.grid[bi].walls &= ~opp;
    }
    generateRB(straightness=0.45, seedStart={r:0,c:0}){
      this.grid.forEach(c => { c.visited=false; c.walls=1|2|4|8; });
      const st = { r:seedStart?.r??0, c:seedStart?.c??0, prevDir:0 };
      const stack=[st];
      this.grid[this.idx(st.r,st.c)].visited=true;
      while(stack.length){
        const cur=stack[stack.length-1];
        const nbrs=this.neighbors(cur.r,cur.c).filter(n=>!this.grid[this.idx(n.r,n.c)].visited);
        if(!nbrs.length){ stack.pop(); continue; }
        const weights = nbrs.map(n => n.dir===cur.prevDir ? (1+straightness*3) : 1);
        let pick = Math.random()*weights.reduce((a,b)=>a+b,0);
        let chosen=nbrs[0];
        for(let i=0;i<nbrs.length;i++){ pick-=weights[i]; if(pick<=0){ chosen=nbrs[i]; break; } }
        this.carve({r:cur.r,c:cur.c},{r:chosen.r,c:chosen.c},chosen.dir);
        this.grid[this.idx(chosen.r,chosen.c)].visited=true;
        stack.push({r:chosen.r,c:chosen.c,prevDir:chosen.dir});
      }
      this.start = {r:0,c:0};
      this.goal  = {r:this.rows-1,c:this.cols-1};
    }
    braid(percent=30){
      if(percent<=0) return;
      const chance=percent/100;
      const isDeadEnd=(r,c)=> (4 - popcount4(this.grid[this.idx(r,c)].walls))===1;
      for(let r=0;r<this.rows;r++){
        for(let c=0;c<this.cols;c++){
          if(!isDeadEnd(r,c) || Math.random()>chance) continue;
          const cell=this.grid[this.idx(r,c)];
          const dirs=[];
          if(cell.walls&1) dirs.push({dir:1,dr:-1,dc: 0});
          if(cell.walls&2) dirs.push({dir:2,dr: 0,dc:+1});
          if(cell.walls&4) dirs.push({dir:4,dr:+1,dc: 0});
          if(cell.walls&8) dirs.push({dir:8,dr: 0,dc:-1});
          if(!dirs.length) continue;
          const choice=dirs[(Math.random()*dirs.length)|0];
          const nr=r+choice.dr, nc=c+choice.dc;
          if(this.inBounds(nr,nc)) this.carve({r,c},{r:nr,c:nc},choice.dir);
        }
      }
    }
    canMove(r,c,dr,dc){
      const cell=this.grid[this.idx(r,c)];
      if(dr===-1 && (cell.walls&1)) return false;
      if(dc===+1 && (cell.walls&2)) return false;
      if(dr===+1 && (cell.walls&4)) return false;
      if(dc===-1 && (cell.walls&8)) return false;
      return this.inBounds(r+dr,c+dc);
    }
    shortestPath(from=this.start,to=this.goal){
      const q=[from], prev=new Map(), seen=new Set([k(from.r,from.c)]);
      while(q.length){
        const cur=q.shift();
        if(cur.r===to.r && cur.c===to.c) break;
        const push=(dr,dc)=>{
          if(!this.canMove(cur.r,cur.c,dr,dc)) return;
          const nr=cur.r+dr, nc=cur.c+dc, kk=k(nr,nc);
          if(seen.has(kk)) return;
          seen.add(kk); prev.set(kk,cur); q.push({r:nr,c:nc});
        };
        push(-1,0); push(0,1); push(1,0); push(0,-1);
      }
      const out=[]; let cur=to, startKey=k(from.r,from.c);
      while(cur && k(cur.r,cur.c)!==startKey){ out.push({r:cur.r,c:cur.c}); cur=prev.get(k(cur.r,cur.c)); }
      if(cur) out.push({r:from.r,c:from.c});
      out.reverse(); return out;
    }
  }

  // ---------- Game ----------
  class Game {
    constructor(canvas, timeLabel, bestLabel) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.timeLabel = timeLabel;
      this.bestLabel = bestLabel;

      this.rows = 21;
      this.cols = 31;
      this.cell = 24;
      this.padding = 12;

      this.maze = new Maze(this.rows, this.cols);
      this.player = { r:0, c:0 };
      this.trail = [];
      this.showTrail = true;
      this.startedAt = null;
      this.endedAt = null;

      this.replaying = false;
      this.replayData = null;
      this._replayStart = 0;
      this.replayVisible = false;

      this.showSolve = false;
      this.solvePath = [];

      this.bestMs = null; // <-- best time for current maze instance

      this._raf = null;
      this._lastTick = 0;

      this.resize();
      window.addEventListener('resize', () => { this.resize(); this.render(); });

      // boot calls newMaze(true) later
    }

    sizeToFit() {
      const stage = document.getElementById('stage');
      const w = Math.max(200, (stage?.clientWidth || 0) - 24);
      const h = Math.max(200, (stage?.clientHeight || 0) - 24);
      const cellW = Math.max(8, Math.floor((w - 2*this.padding) / Math.max(1,this.cols)));
      const cellH = Math.max(8, Math.floor((h - 2*this.padding) / Math.max(1,this.rows)));
      this.cell = clamp(Math.min(cellW, cellH), 8, 48);
      this.canvas.width  = this.cols * this.cell + 2*this.padding;
      this.canvas.height = this.rows * this.cell + 2*this.padding;
    }
    resize(){ this.sizeToFit(); }

    replayWidth(){ return Math.max(2, this.cell*0.22); }

    _readParams(){
      const rv = parseInt($('#rows')?.value ?? '21',10);
      const cv = parseInt($('#cols')?.value ?? '31',10);
      this.rows = clamp(isNaN(rv)?21:rv, 5, 200);
      this.cols = clamp(isNaN(cv)?31:cv, 5, 200);

      const loopsEl = $('#loops'), straightEl = $('#straight');
      const loops = clamp(parseInt(loopsEl?.value ?? '30',10) || 0, 0, 100);
      const straight = clamp(parseInt(straightEl?.value ?? '45',10) || 0, 0, 100);
      return { loops, straightness: straight/100 };
    }

    // New layout (may also change size); resets BEST (per your earlier request)
    newMaze(resetSize=false) {
      if (resetSize) {
        const prevR = this.rows, prevC = this.cols;
        this._readParams();
        if (this.rows !== prevR || this.cols !== prevC) this.sizeToFit();
      } else {
        this._readParams(); // ensure we use latest hardness values
      }
      this.maze = new Maze(this.rows, this.cols);

      const { loops, straightness } = this._readParams();
      this.maze.generateRB(straightness);
      this.maze.braid(loops);

      this.bestMs = null; // reset best on new maze
      this._updateBestLabel();

      this._resetRunState(true); // place player at start, clear timer/trail, hide replay
      this.render();
    }

    // Replay the SAME layout; DO NOT reset best
    replayMaze() {
      this._resetRunState(true); // keep maze, reset player/timer/trail
      this.render();
    }

    _resetRunState(hideReplay=false) {
      this.player = { r:this.maze.start.r, c:this.maze.start.c };
      this.trail = [{ r:this.player.r, c:this.player.c, t:0 }];
      this.startedAt = null;
      this.endedAt = null;

      // keep last run data so you can still watch it if you want
      if (hideReplay) this.replayVisible = false;

      this.showSolve = this.showSolve; // leave toggle as-is
      this._updateTimerLabel(0);
    }

    _updateTimerLabel(ms){ this.timeLabel.textContent = fmt(ms); }
    _updateBestLabel(){ this.bestLabel.textContent = (this.bestMs==null ? '—' : fmt(this.bestMs)); }

    startIfNeeded(){ if(!this.startedAt && !this.replaying) this.startedAt = now(); }

    tryMove(dr,dc){
      if(this.endedAt || this.replaying) return;
      this.startIfNeeded();
      const { r,c } = this.player;
      if(!this.maze.canMove(r,c,dr,dc)) return;
      this.player.r += dr; this.player.c += dc;
      const t = this.startedAt ? now() - this.startedAt : 0;
      const last = this.trail[this.trail.length-1];
      if(!last || last.r!==this.player.r || last.c!==this.player.c){
        this.trail.push({ r:this.player.r, c:this.player.c, t });
      }
      if(this.player.r===this.maze.goal.r && this.player.c===this.maze.goal.c){
        this.endedAt = now();
        const duration = this.endedAt - this.startedAt;
        // update best (for this maze instance only)
        if (this.bestMs==null || duration < this.bestMs) {
          this.bestMs = duration; this._updateBestLabel();
        }
        // store last run for watch
        const path = this.trail.map(p => ({ r:p.r, c:p.c, tRel:p.t }));
        const total = path.length ? path[path.length-1].tRel : duration;
        this.replayData = { path, duration: total };
        this.replayVisible = false;
        setTimeout(()=>this.playReplay(), 350);
      }
    }

    playReplay(){
      if(!this.replayData) return;
      this.replaying = true;
      this.replayVisible = true;
      this._replayStart = now();
    }

    toggleSolve(){
      this.showSolve = !this.showSolve;
      this.solvePath = this.showSolve ? this.maze.shortestPath(this.maze.start, this.maze.goal) : [];
    }

    handleKey(e, down=true){
      if(!down) return;
      const k = e.key.toLowerCase();
      if (k==='arrowup' || k==='w') this.tryMove(-1,0);
      else if (k==='arrowdown' || k==='s') this.tryMove(+1,0);
      else if (k==='arrowleft' || k==='a') this.tryMove(0,-1);
      else if (k==='arrowright'|| k==='d') this.tryMove(0,+1);
      else if (k==='r') this.replayMaze();           // <- Replay Maze (same layout)
      else if (k==='n') this.newMaze(true);          // New Maze (potentially new size)
      else if (k===' ') { if(this.replayData) this.playReplay(); } // Watch last run
      else if (k==='t') { this.showTrail = !this.showTrail; $('#toggle-trail').checked = this.showTrail; }
    }

    loop(ts=0){
      this._raf = requestAnimationFrame(this.loop.bind(this));
      const dt = ts - this._lastTick;
      this._lastTick = ts;
      this.update(dt);
      this.render();
    }

    update(){
      if(!this.startedAt || this.endedAt || this.replaying){
        if(this.replaying && this.replayData){
          const tRel = now() - this._replayStart;
          if(tRel >= this.replayData.duration + 8){
            this.replaying = false; // keep full line visible
          }
        }
        return;
      }
      this._updateTimerLabel(now() - this.startedAt);
    }

    _cellCenter(rc){
      const s=this.cell, offX=this.padding, offY=this.padding;
      return { x: offX + (rc.c + 0.5)*s, y: offY + (rc.r + 0.5)*s };
    }

    _strokeReplayGradient(path, tRel, width){
      if(!path || !path.length) return;
      const T = Math.max(1, this.replayData?.duration || 1);
      const c0 = toRGB(colStart), c1 = toRGB(colEnd);

      const pts=[{r:path[0].r, c:path[0].c, tRel:path[0].tRel??0}];
      let i=0;
      while(i+1<path.length && path[i+1].tRel<=tRel){ pts.push(path[i+1]); i++; }
      if(i+1<path.length){
        const a=path[i], b=path[i+1];
        const segDur=Math.max(1,(b.tRel-a.tRel));
        const t=clamp((tRel-a.tRel)/segDur,0,1);
        pts.push({ r:a.r+(b.r-a.r)*t, c:a.c+(b.c-a.c)*t, tRel });
      }

      const ctx=this.ctx;
      ctx.save();
      ctx.lineWidth=width; ctx.lineCap='round'; ctx.lineJoin='round';
      for(let j=0;j<pts.length-1;j++){
        const A=pts[j], B=pts[j+1];
        const uA=Math.max(0,Math.min(1,(A.tRel??0)/T));
        const uB=Math.max(0,Math.min(1,(B.tRel??tRel)/T));
        const colA=rgbStr(lerpRGB(c0,c1,uA)), colB=rgbStr(lerpRGB(c0,c1,uB));
        const aPx=this._cellCenter(A), bPx=this._cellCenter(B);
        ctx.strokeStyle=colA; ctx.beginPath(); ctx.moveTo(aPx.x,aPx.y); ctx.lineTo(bPx.x,bPx.y); ctx.stroke();
        ctx.strokeStyle=colB; ctx.beginPath(); ctx.moveTo(aPx.x,aPx.y); ctx.lineTo(bPx.x,bPx.y); ctx.stroke();
      }
      ctx.restore();
    }

    render(){
      const ctx=this.ctx, W=this.canvas.width, H=this.canvas.height;
      ctx.clearRect(0,0,W,H);

      const offX=this.padding, offY=this.padding, s=this.cell;

      // bg
      ctx.fillStyle='rgba(255,255,255,0.02)';
      ctx.fillRect(offX-1, offY-1, this.cols*s+2, this.rows*s+2);

      // walls
      ctx.strokeStyle=(getComputedStyle(document.documentElement).getPropertyValue('--wall')||'#2b3246').trim();
      ctx.lineWidth=Math.max(2, Math.floor(s*0.12));
      ctx.lineCap='square';
      for(let r=0;r<this.rows;r++){
        for(let c=0;c<this.cols;c++){
          const cell=this.maze.grid[this.maze.idx(r,c)];
          const x=offX+c*s, y=offY+r*s;
          ctx.beginPath();
          if(cell.walls&1){ ctx.moveTo(x,y); ctx.lineTo(x+s,y); }
          if(cell.walls&2){ ctx.moveTo(x+s,y); ctx.lineTo(x+s,y+s); }
          if(cell.walls&4){ ctx.moveTo(x,y+s); ctx.lineTo(x+s,y+s); }
          if(cell.walls&8){ ctx.moveTo(x,y); ctx.lineTo(x,y+s); }
          ctx.stroke();
        }
      }

      // goal
      ctx.fillStyle=(getComputedStyle(document.documentElement).getPropertyValue('--good')||'#38d39f').trim();
      const gx=offX+this.maze.goal.c*s, gy=offY+this.maze.goal.r*s;
      ctx.fillRect(gx+s*0.25, gy+s*0.25, s*0.5, s*0.5);

      // solve
      if(this.showSolve && this.solvePath.length){
        const col=(getComputedStyle(document.documentElement).getPropertyValue('--solve')||'rgba(56,211,159,0.75)').trim();
        ctx.save();
        ctx.strokeStyle=col; ctx.lineWidth=Math.max(2,s*0.18);
        ctx.lineCap='round'; ctx.lineJoin='round';
        ctx.beginPath();
        const p0=this._cellCenter(this.solvePath[0]); ctx.moveTo(p0.x,p0.y);
        for(let i=1;i<this.solvePath.length;i++){ const p=this._cellCenter(this.solvePath[i]); ctx.lineTo(p.x,p.y); }
        ctx.stroke(); ctx.restore();
      }

      // trail
      if(this.showTrail){
        const trailCol=(getComputedStyle(document.documentElement).getPropertyValue('--trail')||'rgba(61,169,252,0.18)').trim();
        ctx.fillStyle=trailCol; const rTrail=this.replayWidth()/2;
        for(const p of this.trail){ const {x,y}=this._cellCenter(p); ctx.beginPath(); ctx.arc(x,y,rTrail,0,Math.PI*2); ctx.fill(); }
      }

      // replay line
      let playerR=this.player.r, playerC=this.player.c;
      if(this.replayData && this.replayVisible){
        const tRel=this.replaying ? (now()-this._replayStart) : this.replayData.duration;
        this._strokeReplayGradient(this.replayData.path, tRel, this.replayWidth());
        if(this.replaying){
          const path=this.replayData.path;
          if(path.length){
            let i=0; while(i+1<path.length && path[i+1].tRel<=tRel) i++;
            const a=path[i], b=path[Math.min(i+1, path.length-1)];
            const segDur=Math.max(1,(b.tRel-a.tRel));
            const t=clamp((tRel-a.tRel)/segDur,0,1);
            playerC=a.c+(b.c-a.c)*t; playerR=a.r+(b.r-a.r)*t;
          }
        }
      }

      // player
      const cx=offX+(playerC+0.5)*s, cy=offY+(playerR+0.5)*s;
      const grd=ctx.createLinearGradient(cx - s*0.3, cy - s*0.3, cx + s*0.3, cy + s*0.3);
      grd.addColorStop(0,'#e85dff'); grd.addColorStop(1,'#9b4dff');
      ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(cx,cy,s*0.3,0,Math.PI*2); ctx.fill();

      // border
      ctx.strokeStyle='#0c0f18'; ctx.lineWidth=1;
      ctx.strokeRect(offX-0.5, offY-0.5, this.cols*s+1, this.rows*s+1);
    }
  }

  // ---------- Boot ----------
  function boot(){
    readCSSColors();

    const canvas = $('#maze');
    const timeEl = $('#time');
    const bestEl = $('#best');
    const game = new Game(canvas, timeEl, bestEl);

    // Buttons
    $('#btn-new')?.addEventListener('click', () => game.newMaze(true));
    $('#btn-retry')?.addEventListener('click', () => game.replayMaze());
    $('#btn-solve')?.addEventListener('click', () => game.toggleSolve());
    $('#btn-watch')?.addEventListener('click', () => game.playReplay());

    // Keyboard
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
      game.handleKey(e, true);
    });

    // Trail toggle
    $('#toggle-trail')?.addEventListener('change', (e) => { game.showTrail = e.target.checked; });

    // Sliders + readouts
    const loops = $('#loops');
    const straight = $('#straight');
    const loopsVal = $('#loopsVal');
    const straightVal = $('#straightVal');
    const syncRanges = () => { if(loopsVal) loopsVal.textContent = loops?.value ?? '0'; if(straightVal) straightVal.textContent = straight?.value ?? '0'; };
    loops?.addEventListener('input', syncRanges);
    straight?.addEventListener('input', syncRanges);
    syncRanges();

    // Hardness presets → update sliders + regenerate current size/layout
    const PRESETS = {
      easy:      { loops: 60, straight: 70 },
      normal:    { loops: 30, straight: 45 },
      twisty:    { loops: 20, straight: 10 },
      hard:      { loops: 10, straight: 0  },
      labyrinth: { loops: 70, straight: 20 },
    };
    const applyPreset = (name) => {
      const p = PRESETS[name] || PRESETS.normal;
      if (loops)    { loops.value = String(p.loops);    loops.dispatchEvent(new Event('input', {bubbles:true})); }
      if (straight) { straight.value = String(p.straight); straight.dispatchEvent(new Event('input', {bubbles:true})); }
      game.newMaze(false); // new layout with same size; best resets
    };
    $('#hard')?.addEventListener('change', (e) => applyPreset(e.target.value));

    // Touch D-pad
    document.querySelectorAll('.dpad button[data-move]').forEach(btn => {
      const mv = btn.dataset.move;
      const go = () => {
        if (mv==='up') game.tryMove(-1,0);
        if (mv==='down') game.tryMove(+1,0);
        if (mv==='left') game.tryMove(0,-1);
        if (mv==='right') game.tryMove(0,+1);
      };
      btn.addEventListener('click', go);
      btn.addEventListener('pointerdown', (e) => { e.preventDefault(); go(); });
    });

    // Focus canvas on click/tap
    document.getElementById('stage')?.addEventListener('pointerdown', () => window.focus(), {passive:true});

    // Clamp size fields
    const clampInput = (el, lo, hi) => { el.value = Math.max(lo, Math.min(hi, parseInt(el.value||0,10))); };
    $('#rows')?.addEventListener('change', (e) => clampInput(e.target, 5, 200));
    $('#cols')?.addEventListener('change', (e) => clampInput(e.target, 5, 200));

    // Initial generation
    game.newMaze(true);
    game.loop();
  }

  if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
