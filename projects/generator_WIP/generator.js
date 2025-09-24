/* ---------- Utilities ---------- */
class RNG{
  constructor(seedStr){ this.seed = RNG.hash(seedStr || (Math.random()*1e9).toFixed(0)); }
  static hash(s){
    // xmur3-ish
    let h=1779033703^s.length; 
    for(let i=0;i<s.length;i++){ h=Math.imul(h^s.charCodeAt(i),3432918353); h=h<<13|h>>>19; }
    return ()=>{ 
      h=Math.imul(h^h>>>16,2246822507); 
      h=Math.imul(h^h>>>13,3266489909); 
      h^=h>>>16; 
      return (h>>>0)/4294967296; 
    };
  }
  next(){ return this.seed(); }
  int(a,b){ return a + Math.floor(this.next()*(b-a+1)); }
  pick(arr){ return arr[this.int(0,arr.length-1)]; }
  shuffle(arr){ for(let i=arr.length-1;i>0;i--){ const j=this.int(0,i); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }
}

/* ---------- Generator ---------- */
class CityGen{
  constructor(rng, opts={}){
    this.rng=rng;
    this.opts=Object.assign({
      width:1200, height:800, grid:20,
      roadChance:0.8, // lower = more roads carved
      treeCount:220, trees:true, grass:true, roads:true,
      bbox:false, mesh:false
    }, opts);
  }
  generate(){
    const {width,height,grid}=this.opts;
    const cols=Math.floor(width/grid), rows=Math.floor(height/grid);
    // Grid of cells: 1=solid grass; 0=road carved
    const cells=Array.from({length:rows},()=>Array(cols).fill(1));
    // Seed road anchors on a jittered lattice
    const anchors=[];
    for(let y=2;y<rows-2;y+=this.rng.int(2,4)){
      for(let x=2;x<cols-2;x+=this.rng.int(2,5)){
        if(this.rng.next()<0.85) anchors.push([x,y]);
      }
    }
    // Carve roads using a simple growing-tree from random anchors
    const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
    const inside=(x,y)=>x>0&&y>0&&x<cols-1&&y<rows-1;
    const stack=[];
    if(anchors.length===0) anchors.push([this.rng.int(2,cols-3), this.rng.int(2,rows-3)]);
    stack.push(...this.rng.shuffle(anchors).slice(0,8));
    while(stack.length){
      const [cx,cy]=stack.pop();
      if(!inside(cx,cy)) continue;
      cells[cy][cx]=0;
      // Bias to extend straight occasionally
      const tryDirs=this.rng.shuffle(dirs.slice());
      for(const [dx,dy] of tryDirs){
        const nx=cx+dx, ny=cy+dy;
        if(!inside(nx,ny)) continue;
        // keep some solidity; avoid over-carving
        if(cells[ny][nx]===1 && this.rng.next()>this.opts.roadChance){
          cells[ny][nx]=0;
          stack.push([nx,ny]);
          // widen some roads
          if(this.rng.next()<0.25 && inside(nx+dy,ny+dx)) cells[ny+dx][nx+dy]=0;
        }
      }
    }
    // Extract road segments (cell centers) for rendering
    const roads=[];
    for(let y=0;y<rows;y++) for(let x=0;x<cols;x++) if(cells[y][x]===0) roads.push([x,y]);

    // Derive blocks: simple rectangles where 2x2 of grass forms a lot; later subdivide to buildings
    const lots=[];
    for(let y=0;y<rows-1;y++){
      for(let x=0;x<cols-1;x++){
        if(cells[y][x]&&cells[y][x+1]&&cells[y+1][x]&&cells[y+1][x+1]){
          lots.push({x,y,w:2,h:2});
        }
      }
    }
    // Grow lots outward a bit (greedy merge)
    const occ=new Set();
    const key=(x,y)=>x+','+y;
    const merged=[];
    for(const l of lots){ occ.add(key(l.x,l.y)); }
    for(const l of lots){
      if(!occ.has(key(l.x,l.y))) continue;
      let {x,y,w,h}=l;
      // expand horizontally
      while(true){
        let canRight=true;
        for(let yy=0;yy<h;yy++){
          const k=key(x+w, y+yy);
          if(!occ.has(k)) { canRight=false; break; }
        }
        if(!canRight) break;
        for(let yy=0;yy<h;yy++) occ.delete(key(x+w, y+yy));
        w++;
      }
      // expand vertically
      while(true){
        let canDown=true;
        for(let xx=0;xx<w;xx++){
          const k=key(x+xx, y+h);
          if(!occ.has(k)) { canDown=false; break; }
        }
        if(!canDown) break;
        for(let xx=0;xx<w;xx++) occ.delete(key(x+xx, y+h));
        h++;
      }
      occ.delete(key(x,y));
      merged.push({x,y,w,h});
    }
    // Place buildings along lot edges
    const buildings=[];
    const g=this.opts.grid;
    for(const L of merged){
      const px=L.x*g, py=L.y*g, pw=L.w*g, ph=L.h*g;
      const perim=[
        {x:px+2, y:py+2, w:pw-4, h:6},                 // top strip
        {x:px+2, y:py+ph-8, w:pw-4, h:6},              // bottom strip
        {x:px+2, y:py+8, w:6, h:ph-16},                // left
        {x:px+pw-8, y:py+8, w:6, h:ph-16},             // right
      ];
      for(const strip of perim){
        const step = 16 + this.rng.int(-4,6);
        for(let sx=strip.x; sx<strip.x+strip.w-10; sx+=step){
          const bw = this.rng.int(10,14);
          const bh = this.rng.int(10, this.rng.next()<0.2? 22 : 16);
          buildings.push({x:sx, y:strip.y, w:bw, h:bh});
        }
      }
    }

    // Trees via dart throws on grass cells at safe distance from roads
    const treePts=[];
    const isRoad=(cx,cy)=> (cx>=0&&cy>=0&&cx<cols&&cy<rows) ? cells[cy][cx]===0 : false;
    const cellToPx=(cx,cy)=>[cx*grid+grid/2, cy*grid+grid/2];
    const keepDist=18;
    const taken=[];
    for(let i=0;i<this.opts.treeCount;i++){
      const cx=this.rng.int(1,cols-2), cy=this.rng.int(1,rows-2);
      if(isRoad(cx,cy) || isRoad(cx+1,cy)||isRoad(cx-1,cy)||isRoad(cx,cy+1)||isRoad(cx,cy-1)) continue;
      const [x,y]=cellToPx(cx,cy);
      let ok=true;
      for(const p of taken){ const dx=x-p[0], dy=y-p[1]; if(dx*dx+dy*dy<keepDist*keepDist){ ok=false; break; } }
      if(!ok) continue;
      taken.push([x,y]); treePts.push({x,y,r:3+this.rng.int(-1,2)});
    }

    this.data={cells,roads,buildings,treePts,cols,rows};
    return this.data;
  }
}

/* ---------- Renderer ---------- */
class Renderer{
  constructor(canvas, gen, state){ 
    this.cv=canvas; this.cx=canvas.getContext('2d'); this.gen=gen; this.state=state; 
  }
  resize(){ 
    const dpr=window.devicePixelRatio||1; 
    const {width,height}=this.gen.opts; 
    this.cv.width=width*dpr; this.cv.height=height*dpr; 
    this.cv.style.width=width+'px'; this.cv.style.height=height+'px'; 
    this.cx.setTransform(dpr,0,0,dpr,0,0); 
  }
  draw(){
    const {width,height,grid}=this.gen.opts; 
    const {cells,roads,buildings,treePts,cols,rows}=this.gen.data;
    const c=this.cx; c.clearRect(0,0,width,height);
    // background
    c.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--panel'); 
    c.fillRect(0,0,width,height);
    // grass
    if(this.state.flags.grass){
      c.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--grass'); 
      c.fillRect(0,0,width,height);
    }
    // roads
    if(this.state.flags.roads){
      c.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--road');
      for(const [x,y] of roads){ c.fillRect(x*grid, y*grid, grid, grid); }
    }
    // lots mesh (optional)
    if(this.state.flags.mesh){
      c.strokeStyle='rgba(61,169,252,0.25)'; c.lineWidth=1;
      for(let y=0;y<=rows;y++){ c.beginPath(); c.moveTo(0,y*grid+.5); c.lineTo(width,y*grid+.5); c.stroke(); }
      for(let x=0;x<=cols;x++){ c.beginPath(); c.moveTo(x*grid+.5,0); c.lineTo(x*grid+.5,height); c.stroke(); }
    }
    // buildings
    c.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--bld');
    c.strokeStyle=getComputedStyle(document.documentElement).getPropertyValue('--bld-br'); c.lineWidth=1;
    for(const b of buildings){ c.fillRect(b.x,b.y,b.w,b.h); c.strokeRect(b.x+.5,b.y+.5,b.w-1,b.h-1); }
    // trees
    if(this.state.flags.trees){
      c.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--tree');
      for(const t of treePts){ c.beginPath(); c.arc(t.x,t.y,t.r,0,Math.PI*2); c.fill(); }
    }
    // bbox
    if(this.state.flags.bbox){
      c.strokeStyle='rgba(255,255,255,.35)'; c.lineWidth=2; c.strokeRect(8.5,8.5,width-17,height-17);
    }
  }
}

/* ---------- UI ---------- */
class UI{
  constructor(){
    this.canvas=document.getElementById('canvas');
    // initial state
    this.state={
      seed:String(Math.floor(Math.random()*1e9)),
      style:1,
      flags:{grass:true,trees:true,roads:true,bbox:false,mesh:false}
    };
    this.rng=new RNG(this.state.seed);
    this.gen=new CityGen(this.rng,{ width: Math.max(960, window.innerWidth), height: Math.max(600, window.innerHeight-48) });
    this.gen.generate();
    this.ren=new Renderer(this.canvas,this.gen,this.state);
    this.ren.resize(); this.ren.draw();
    this.legendSeed=document.getElementById('legend-seed');
    this.legendStyle=document.getElementById('legend-style');
    this.legendSeed.textContent=this.state.seed; this.legendStyle.textContent=this.state.style;
    this.bind();
  }
  bind(){
    // context menu
    const menu=document.getElementById('menu');
    const showMenu=(x,y)=>{ menu.style.left=x+'px'; menu.style.top=y+'px'; menu.style.display='block'; this.syncChecks(); };
    const hideMenu=()=>menu.style.display='none';
    window.addEventListener('contextmenu',e=>{ e.preventDefault(); showMenu(e.clientX,e.clientY); });
    window.addEventListener('click',()=>hideMenu());
    menu.addEventListener('click',e=>{
      const li=e.target.closest('li'); if(!li||!li.dataset.cmd) return;
      const cmd=li.dataset.cmd;
      if(cmd==='new') this.regen();
      else if(cmd==='export') this.exportPNG();
      else if(cmd==='toggle-grass') this.toggle('grass');
      else if(cmd==='toggle-trees') this.toggle('trees');
      else if(cmd==='toggle-roads') this.toggle('roads');
      else if(cmd==='toggle-bbox') this.toggle('bbox');
      else if(cmd==='toggle-mesh') this.toggle('mesh');
      else if(cmd.startsWith('style-')){ const s=+cmd.split('-')[1]; this.applyStyle(s); }
      this.ren.draw();
    });
    // hotkeys
    window.addEventListener('keydown',e=>{
      if(e.key==='Enter'){ this.regen(); this.ren.draw(); }
      else if(e.key.toLowerCase()==='x'){ this.exportPNG(); }
      else if(e.key.toLowerCase()==='g'){ this.toggle('grass'); this.ren.draw(); }
      else if(e.key.toLowerCase()==='t'){ this.toggle('trees'); this.ren.draw(); }
      else if(e.key.toLowerCase()==='r'){ this.toggle('roads'); this.ren.draw(); }
      else if(e.key.toLowerCase()==='b'){ this.toggle('bbox'); this.ren.draw(); }
      else if(e.key.toLowerCase()==='m'){ this.toggle('mesh'); this.ren.draw(); }
      else if(['1','2','3','4'].includes(e.key)){ this.applyStyle(+e.key); this.ren.draw(); }
      else if(e.key==='Tab'){ e.preventDefault(); this.openModal(); }
    });
    window.addEventListener('resize',()=>{
      this.gen.opts.width=Math.max(960, window.innerWidth);
      this.gen.opts.height=Math.max(600, window.innerHeight-48);
      this.ren.resize(); this.ren.draw();
    });
    // modal
    const modal=document.getElementById('modal');
    document.getElementById('cancel').onclick=()=> modal.style.display='none';
    document.getElementById('apply').onclick=()=>{
      const seedVal=document.getElementById('seed').value.trim();
      const sty=+document.getElementById('style').value;
      if(seedVal) this.state.seed=seedVal;
      this.applyStyle(sty);
      this.regen(); this.ren.draw();
      modal.style.display='none';
    };
  }
  syncChecks(){
    document.getElementById('chk-grass').textContent=this.state.flags.grass?'●':'○';
    document.getElementById('chk-trees').textContent=this.state.flags.trees?'●':'○';
    document.getElementById('chk-roads').textContent=this.state.flags.roads?'●':'○';
    document.getElementById('chk-bbox').textContent=this.state.flags.bbox?'●':'○';
    document.getElementById('chk-mesh').textContent=this.state.flags.mesh?'●':'○';
  }
  toggle(name){ this.state.flags[name]=!this.state.flags[name]; this.syncChecks(); }
  applyStyle(n){
    this.state.style=n; this.legendStyle.textContent=n;
    // style presets: tweak CSS vars (palette & building/road tones)
    const root=document.documentElement.style;
    if(n===1){ root.setProperty('--road','#2A2F35'); root.setProperty('--bld','#1E242A'); root.setProperty('--bld-br','#37414A'); root.setProperty('--tree','#2E6E3F'); root.setProperty('--grass','#0F1713'); }
    if(n===2){ root.setProperty('--road','#242733'); root.setProperty('--bld','#151a22'); root.setProperty('--bld-br','#2e3946'); root.setProperty('--tree','#2a5b8f'); root.setProperty('--grass','#0d131a'); }
    if(n===3){ root.setProperty('--road','#2f2a35'); root.setProperty('--bld','#1d1a22'); root.setProperty('--bld-br','#40314a'); root.setProperty('--tree','#5a2f6e'); root.setProperty('--grass','#130f17'); }
    if(n===4){ root.setProperty('--road','#263229'); root.setProperty('--bld','#152019'); root.setProperty('--bld-br','#2b4031'); root.setProperty('--tree','#3a7a46'); root.setProperty('--grass','#0e1511'); }
  }
  regen(){
    this.rng=new RNG(this.state.seed);
    this.gen.rng=this.rng; this.gen.generate(); this.legendSeed.textContent=this.state.seed;
  }
  exportPNG(){
    const url=this.canvas.toDataURL('image/png');
    const a=document.createElement('a'); a.href=url; a.download=`urban_${this.state.seed}_style${this.state.style}.png`; a.click();
  }
  openModal(){
    const modal=document.getElementById('modal');
    modal.style.display='grid';
    document.getElementById('seed').value=this.state.seed;
    document.getElementById('style').value=String(this.state.style);
    document.getElementById('tags').value='';
  }
}

window.addEventListener('load',()=>{ window.APP=new UI(); });
