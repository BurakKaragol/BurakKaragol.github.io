(function () {
  // ---------- UI helpers ----------
  const screen = document.getElementById('screen');
  const cmd = document.getElementById('cmd');
  const now = () => new Date().toLocaleString();

  function print(text) {
    const el = document.createElement('div');
    el.textContent = String(text);
    screen.appendChild(el);
    screen.scrollTop = screen.scrollHeight;
  }
  function sep() { print(''); }

  // ---------- Game state ----------
  const SAVE_KEY = 'scq_console_v11';

  const stateDefault = {
    cwd: '/',
    unlocked: {
      locked1:false, locked2:false, locked3:false,
      locked4:false, locked5:false, locked6:false,
      locked7:false, locked8:false, locked9:false, locked10:false
    },
    stage: 1,  // 1..10 (after 10, finished)
    notesSeen: []
  };
  let state = { ...stateDefault };
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) state = Object.assign(state, JSON.parse(raw));
  } catch (e) {}

  function persist(){ localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }

  // ---------- File system (fresh 10-level design) ----------
  const FS = {
    '/': { type:'dir', children:[
      'desk',
      'locked1','locked2','locked3','locked4','locked5','locked6','locked7','locked8','locked9','locked10',
      'what_to_do.txt', 'motd.txt', 'ascii_banner.txt'
    ]},

    '/what_to_do.txt': { type:'file', content:
`Hi. You found my tiny hidden console.

This is a little game buried in my site. If you reach the end,
there IS a small reward — something custom from me.

Rules:
- Use: ls, ls -R, pwd, cd <folder>, open <file>, unlock <folder> <password>, clear, help, exit
- Each deeper folder depends on info you found earlier.
- Hints are scattered. Read carefully.` },

    '/motd.txt': { type:'file', content:
`Message of the Day:
"Finish one project before starting three." — Future Burak, every week

Lucky number: 7.` },

    '/ascii_banner.txt': { type:'file', content:
`   ____              _         _       
  / __ )____  _____(_)____   (_)______
 / __  / __ \\/ ___/ / ___/  / / ___/
/ /_/ / /_/ (__  ) (__  )  / (__  ) 
/_____/\\____/____/_/____/  /_/____/  

Hidden console. Minimal adult supervision.` },

    // ----- DESK -----
    '/desk': { type:'dir', children:[
      'projects.txt','todo.txt','picky_things.txt','note_readme.txt',
      'daily_thoughts.txt','ascii_coffee.txt','pin_hunt.txt','ascii_cat.txt'
    ] },

    '/desk/pin_hunt.txt': { type:'file', content:
`PIN HUNT (because why make it easy?)

- First digit: hiding in plain sight inside ascii_coffee.txt
- Second digit: found by reading the rule in todo.txt (count the letters in "TODO")
- Third digit: stolen by a cat — check ascii_cat.txt
- Fourth digit: the message of the day knows a "lucky number" (see /motd.txt)

Assemble them in order.` },

    '/desk/projects.txt': { type:'file', content:
`Fabriception (idle factory builder — still "in progress")
ScreenPad (PyQt6 UI playground — half-baked)
Macropad (hardware exists, software… waiting)
Portfolio Admin Panel (shiny PyQt6 manager, 40% complete)
QR Code Generator (looked cool, got distracted)
Color Palette Editor (premium vibes, under-polished)` },

    '/desk/todo.txt': { type:'file', content:
`Note to self:
- Stop starting new projects before finishing old ones
- Don't ever use 1234 again, it’s embarrassing
- PIN must start with a hint in the coffee file
- Second digit = number of letters in "TODO"
- Third digit = ...where did the cat put it?
- Last digit = I left it in today's message` },

    '/desk/picky_things.txt': { type:'file', content:
`Rules of Burak:
- COFFEE > tea (always)
- TABS, not spaces (but sometimes spaces… don’t tell anyone)
- Don’t forget to buy a new SOLDERing iron tip` },

    '/desk/note_readme.txt': { type:'file', content:
`If you’re snooping, welcome. If you’re Future-Me… go finish Fabriception.` },

    '/desk/daily_thoughts.txt': { type:'file', content:
`Daily Thoughts:
- Why do I have 6 half-finished tools that all almost do the same thing?
- Idea: color picker that picks moods, not colors. (too much?)
- If you're reading this, hydrate.` },

    '/desk/ascii_coffee.txt': { type:'file', content:
` ( (
  ) )
........
|      |]
\\      /
 \`----' 
Coffee first, unlocking later.

Shots: 5` },

    '/desk/ascii_cat.txt': { type:'file', content:
` /\\_/\\
( o.o )   I stole a digit. Catch me if you can!
 > ^ <

Clue:   =^.^=    3    =^.^=
(It's not a trick: the digit is literally 3.)` },

    // ----- LOCKED 1 -----
    '/locked1': { type:'dir', hidden:true, children:[
      'sum_hint.txt','words.txt','shopping_list.txt','ascii_cat_decoy.txt'
    ] },

    '/locked1/sum_hint.txt': { type:'file', content:
`Digits whisper secrets.
Add them up, then count your way down the list.
The word you land on opens the next door.` },

    '/locked1/words.txt': { type:'file', content:
` 1: anchor
 2: comet
 3: pixel
 4: orange
 5: prism
 6: lantern
 7: velvet
 8: canyon
 9: waffle
10: kiwi
11: nebula
12: marble
13: mustard
14: orbit
15: plum
16: quartz
17: rocket
18: cedar
19: pancake
20: dune
21: basil
22: mint
23: apricot
24: denim
25: copper` },

    '/locked1/shopping_list.txt': { type:'file', content:
`Shopping (definitely unrelated):
- bananas (not a hint)
- duct tape
- tiny screws
- more sticky notes` },

    '/locked1/ascii_cat_decoy.txt': { type:'file', content:
`(=^･ω･^=)  This one has no digits. Wrong cat.` },

    // ----- LOCKED 2 -----
    '/locked2': { type:'dir', hidden:true, children:[
      'diary.txt','brain_dump.txt','ascii_duck.txt'
    ] },

    '/locked2/diary.txt': { type:'file', content:
`Future-me, the password is the FIRST LETTERS of the projects I kept starting:
Check /desk/projects.txt in the order listed.
(No tricks. Lowercase them and put them together.)` },

    '/locked2/brain_dump.txt': { type:'file', content:
`Brain Dump:
- If I rename Fabriception again I will lose all momentum.
- New idea: "Skyscraper Potato" — sounds like a band. Not a password.
- Reminder: update README on literally everything.` },

    '/locked2/ascii_duck.txt': { type:'file', content:
`  _
<(o )
 ( .>
^^ ^^  Duck debugging in progress… quack.

hi` },

    // ----- LOCKED 3 -----
    '/locked3': { type:'dir', hidden:true, children:[
      'rules.txt','example.txt','sticky_notes.txt','ascii_robot.txt'
    ] },

    '/locked3/rules.txt': { type:'file', content:
`Use the SHOUTED words from /desk/picky_things.txt,
in order, joined with dashes. Ignore punctuation. Lowercase everything.` },

    '/locked3/example.txt': { type:'file', content:
`Example (not the answer): APPLE-BANANA-CHERRY → apple-banana-cherry` },

    '/locked3/sticky_notes.txt': { type:'file', content:
`Sticky Notes:
- Put tape on the webcam (paranoia level moderate)
- Post-it count this week: 47
- You are doing great. (This is not a clue.)` },

    '/locked3/ascii_robot.txt': { type:'file', content:
`[::]  beep
 |__|  boop
 /__\\  totally helpful robot (not actually)

hi` },

    // ----- LOCKED 4 -----
    '/locked4': { type:'dir', hidden:true, children:[
      'midgame_note.txt','spoilers.txt','ascii_dragon.txt'
    ] },

    '/locked4/midgame_note.txt': { type:'file', content:
`Mid-game checkpoint. No finales here — keep going.` },

    '/locked4/spoilers.txt': { type:'file', content:
`Spoilers:
- The cake is a lie.*
- *But your reward is real.
- Also not a hint.` },

    '/locked4/ascii_dragon.txt': { type:'file', content:
`           / \\  //\\
     |\\___/|      \\\\//
     /O  O  \\__    //
    /     /\\_  \\__//
    \\__  \\_/  /  /
      \\___/\\_/__/  (dramatic but irrelevant)` },

    // ----- LOCKED 5 -----
    '/locked5': { type:'dir', hidden:true, children:[
      'greetings_puzzle.txt','hall_of_fame.txt','ascii_confetti.txt'
    ] },

    '/locked5/greetings_puzzle.txt': { type:'file', content:
`The bird and the bot share something in common.
Find what they BOTH say.

Answer is just the two characters that greet you. Lowercase.` },

    '/locked5/hall_of_fame.txt': { type:'file', content:
`Temporary Hall of Fame placeholder. Not the end.` },

    '/locked5/ascii_confetti.txt': { type:'file', content:
`*  .    *      .  *
   *   .   *  *
 .   *   \\o/   *   .
   *      |      *
 *   .   / \\  .    *
(celebration deferred)` },

    // ----- LOCKED 6 -----
    '/locked6': { type:'dir', hidden:true, children:[
      'helper_hint.txt','credits.txt','ascii_gear.txt'
    ] },

    '/locked6/helper_hint.txt': { type:'file', content:
`Two helpers guided you earlier:

- The debugging bird in one folder
- The totally helpful machine in another

Name them in order, lowercased, no spaces.

(If you forgot: check /locked2/ascii_duck.txt and /locked3/ascii_robot.txt)` },

    '/locked6/credits.txt': { type:'file', content:
`Credits:
- Duck (QA, quacks analyst)
- Robot (beep boop morale officer)
- Coffee (producer)` },

    '/locked6/ascii_gear.txt': { type:'file', content:
`  ___
 / _ \\
| (_) |
 \\___/  grind grind (useless gear)` },

    // ----- LOCKED 7 -----
    '/locked7': { type:'dir', hidden:true, children:[
      'final_prep.txt','camera_note.txt','confetti_plan.txt'
    ] },

    '/locked7/final_prep.txt': { type:'file', content:
`Almost done.

From your sticky notes:
- Secure the webcam with something
- And remember the running total of post-its this week

Join them: the thing + the number (lowercase; number stays digits).` },

    '/locked7/camera_note.txt': { type:'file', content:
`The webcam trick again? Tape works. (See: sticky notes.)` },

    '/locked7/confetti_plan.txt': { type:'file', content:
`Release confetti when someone types the magic word.
(This file does nothing.)` },

    // ----- LOCKED 8 -----
    '/locked8': { type:'dir', hidden:true, children:[
      'number_fusion.txt','ledger.txt','ascii_abacus.txt'
    ] },

    '/locked8/number_fusion.txt': { type:'file', content:
`Remember earlier:
- The index you used for the word list (sum of the Stage-1 PIN digits)
- The weekly post-it count in sticky notes

Fuse them by concatenation: <index><count>` },

    '/locked8/ledger.txt': { type:'file', content:
`Index from Stage-2 was 19. Sticky note count was 47. Do the fusion.` },

    '/locked8/ascii_abacus.txt': { type:'file', content:
`o o o | o o o o |  <-- mathy but useless` },

    // ----- LOCKED 9 -----
    '/locked9': { type:'dir', hidden:true, children:[
      'meta_note.txt','philosophy.txt','todo_again.txt'
    ] },

    '/locked9/meta_note.txt': { type:'file', content:
`If you got here, you clearly get the joke.
The "final password" could be anything you want…
or maybe it’s literally: anythingyouwant` },

    '/locked9/philosophy.txt': { type:'file', content:
`Half-finished projects are Schrödinger’s apps: neither broken nor shipped.` },

    '/locked9/todo_again.txt': { type:'file', content:
`TODO (meta edition):
- Consider finishing things
- Consider considering finishing things
- Consider shipping` },

    // ----- LOCKED 10 -----
    '/locked10': { type:'dir', hidden:true, children:[
      'congratulations.txt','pep_talk.txt','ascii_flag.txt'
    ] },

    '/locked10/congratulations.txt': { type:'file', content:
`You won. just come to me and say the answer is 42. And i owe you a coffee :)` },

    '/locked10/pep_talk.txt': { type:'file', content:
`Future-Me, no more tinkering. Deploy. Celebrate. Repeat.` },

    '/locked10/ascii_flag.txt': { type:'file', content:
` \\o/  victory banner ready
  |   (waiting on the magic word)
 / \\` },
  };

  // ---------- Visibility helpers ----------
  function isLockedFolder(path) {
    return path.startsWith('/locked');
  }
  // Prefix-safe: map path to its top-level key (locked1..locked10)
  function isVisible(path) {
    const first = '/' + path.split('/').filter(Boolean)[0];
    if (first && first.startsWith('/locked')) {
      const key = first.slice(1); // "lockedX"
      return !!state.unlocked[key];
    }
    return true;
  }

  // ---------- FS helpers ----------
  function nodeAt(path){ return FS[path]; }

  function resolvePath(arg){
    if(!arg) return state.cwd;
    if(arg.startsWith('/')) arg = arg.replace(/\/+$/, '');
    const base = state.cwd === '/' ? '' : state.cwd;
    const joined = (arg.startsWith('/') ? '' : base + '/') + arg;
    const parts = joined.split('/').filter(Boolean);
    const out = [];
    for (const p of parts) {
      if (p === '..') out.pop();
      else if (p === '.') continue;
      else out.push(p);
    }
    return '/' + out.join('/');
  }

  // list children; ALWAYS include directories (even when locked),
  // but only include files when visible.
  function listDirRaw(path){
    const node = nodeAt(path);
    if(!node || node.type !== 'dir') return null;

    return (node.children || []).filter(name=>{
      const full = (path==='/'? '/' + name : path + '/' + name);
      const n = nodeAt(full);
      if (!n) return false;
      if (n.type === 'dir') return true;            // always show dirs
      return isVisible(full);                       // hide locked files
    });
  }

  // ---------- Tree rendering ----------
  function sortDirsFirst(dirPath, names){
    const dirNames = [];
    const fileNames = [];
    for(const name of names){
      const full = (dirPath==='/'? '/' + name : dirPath + '/' + name);
      const n = nodeAt(full);
      if(n && n.type==='dir') dirNames.push(name);
      else fileNames.push(name);
    }
    dirNames.sort((a,b)=>a.localeCompare(b));
    fileNames.sort((a,b)=>a.localeCompare(b));
    return [...dirNames, ...fileNames];
  }

  function labelFor(dirPath, name){
    const full = (dirPath==='/'? '/' + name : dirPath + '/' + name);
    const n = nodeAt(full);
    if(!n) return name;
    if(n.type === 'dir'){
      const locked = !isVisible(full) && isLockedFolder(full);
      return name + '/' + (locked ? ' [locked]' : '');
    }
    return name;
  }

  // Build tree lines for one directory. If recursive = true, descend.
  function buildTree(dirPath, recursive=false, prefix=''){
    const names = listDirRaw(dirPath);
    if(names === null) return ['(not a directory)'];
    const sorted = sortDirsFirst(dirPath, names);

    const lines = [];
    sorted.forEach((name, idx)=>{
      const full = (dirPath==='/'? '/' + name : dirPath + '/' + name);
      const isLast = idx === sorted.length - 1;
      const branch = prefix + (isLast ? '└─ ' : '├─ ');
      lines.push(branch + labelFor(dirPath, name));

      const n = nodeAt(full);
      if(recursive && n && n.type === 'dir'){
        const childPrefix = prefix + (isLast ? '   ' : '│  ');
        lines.push(...buildTree(full, true, childPrefix));
      }
    });
    if(!sorted.length) lines.push(prefix + '(empty)');
    return lines;
  }

  // ---------- Secure answers (hash-only) ----------
  // SHA-256 of normalized input (raw for Stage-1 PIN, lower for word answers).
  const ANSWER_CONFIG = {
    '/locked1':  { hash: 'dae89e11241685c65efa5f0ae0828574ab3a20de919325fbf83f9f2ff929dded', norm: 'raw'   }, // 5437
    '/locked2':  { hash: 'a9c1034fb623883b5786268bbde25a871b72c9920a4ff708d516e4852bcf7da0', norm: 'lower' }, // pancake
    '/locked3':  { hash: '4e0fcd08acb1b150fd9237ebbd9c2e3abacc0d030264ee18a68cf41272845c89', norm: 'lower' }, // fsmpqc
    '/locked4':  { hash: '0823962b883f285dcfe9c83e20632db74a11ee861df41e072077f66c6726044a', norm: 'lower' }, // coffee-tabs-solder
    '/locked5':  { hash: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4', norm: 'lower' }, // hi
    '/locked6':  { hash: 'e8974dc678ab763260403410050f2331126a0f62a2b80ee7cfaf8baeaa73ab4b', norm: 'lower' }, // robotduck
    '/locked7':  { hash: '87961caa2b40ac5a460f3e691cff1c66a7a3efca8f00e56ad6feb75393fd833f', norm: 'lower' }, // tape47
    '/locked8':  { hash: '8eec27653c19ed078b2f3bae16ff901d16347d7917d2b8e2317914e2437bf324', norm: 'lower' }, // 1947
    '/locked9':  { hash: '49ff2d138a8ab421d279ed81ee0af26df6439fd0ae4eb6f7369f2111bf2142f1', norm: 'lower' }, // anythingyouwant
    '/locked10': { hash: '08dcde391c03a55a45f823c01f62d2bbf2b28af3b560444a320e017ea2f60847', norm: 'lower' }, // shipit
  };

  async function sha256Hex(text){
    const enc = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    const bytes = Array.from(new Uint8Array(buf));
    return bytes.map(b => b.toString(16).padStart(2,'0')).join('');
  }

  async function matchesHash(input, {hash, norm}){
    const normalized = (norm === 'lower') ? String(input).toLowerCase() : String(input);
    const digest = await sha256Hex(normalized);
    return digest === hash;
  }

  // ---------- Shell commands ----------
  function cmd_help(){
    print(`Commands:
  help
  ls            (tree view of current folder)
  ls -R         (recursive tree from current folder)
  pwd
  cd <folder>   (cd .. to go up; cd.. also works)
  open <file>
  unlock <folder> <password>
  clear | cls   (Ctrl+L also clears)
  exit`);
  }

  function cmd_ls(args=[]){
    const a0 = (args[0] || '').toLowerCase();
    const recursive = (a0 === '-r' || a0 === '-R' || a0 === '/s');
    print('Path: ' + state.cwd);
    const lines = buildTree(state.cwd, recursive, '');
    lines.forEach(print);
  }

  function cmd_pwd(){ print(state.cwd); }

  function cmd_cd(args){
    if(!args[0] && lastRawCommand && lastRawCommand.trim().toLowerCase() === 'cd..'){
      args = ['..'];
    }
    if(!args[0]) return print('Usage: cd <folder>');
    const target = resolvePath(args[0]);
    const node = nodeAt(target);
    if(!node) return print('No such directory');
    if(node.type!=='dir') return print('Not a directory');
    if(!isVisible(target)) return print('Access denied');
    state.cwd = target === '/'? '/' : target;
    persist();
    print('cwd: ' + state.cwd);
  }

  function cmd_open(args){
    if(!args[0]) return print('Usage: open <file>');
    const path = args[0].startsWith('/')? args[0] : (state.cwd === '/'? '/' + args[0] : state.cwd + '/' + args[0]);
    const node = nodeAt(path);
    if(!node) return print('File not found');
    if(node.type !== 'file') return print('Not a file');
    if(!isVisible(path)) return print('Access denied');
    print('--- OPEN: ' + path + ' ---');
    print(node.content);
    if(!state.notesSeen.includes(path)) state.notesSeen.push(path);
    persist();
  }

  async function unlockFolder(folder, password){
    const target = resolvePath(folder);
    const node = nodeAt(target);
    if(!node) { print('No such folder'); return; }
    if(node.type !== 'dir') { print('Not a folder'); return; }
    if (!isLockedFolder(target)) { print('That folder does not require unlocking.'); return; }

    const cfg = ANSWER_CONFIG[target];
    if(!cfg){ print('Nothing to unlock here.'); return; }

    const ok = await matchesHash(password || '', cfg);
    if (ok) {
      if (target === '/locked1')  { state.unlocked.locked1  = true; state.stage = Math.max(state.stage, 2); }
      if (target === '/locked2')  { state.unlocked.locked2  = true; state.stage = Math.max(state.stage, 3); }
      if (target === '/locked3')  { state.unlocked.locked3  = true; state.stage = Math.max(state.stage, 4); }
      if (target === '/locked4')  { state.unlocked.locked4  = true; state.stage = Math.max(state.stage, 5); }
      if (target === '/locked5')  { state.unlocked.locked5  = true; state.stage = Math.max(state.stage, 6); }
      if (target === '/locked6')  { state.unlocked.locked6  = true; state.stage = Math.max(state.stage, 7); }
      if (target === '/locked7')  { state.unlocked.locked7  = true; state.stage = Math.max(state.stage, 8); }
      if (target === '/locked8')  { state.unlocked.locked8  = true; state.stage = Math.max(state.stage, 9); }
      if (target === '/locked9')  { state.unlocked.locked9  = true; state.stage = Math.max(state.stage,10); }
      if (target === '/locked10') { state.unlocked.locked10 = true; state.stage = Math.max(state.stage,11); }
      persist();
      print('✔ Unlocked: ' + target);
    } else {
      print('Incorrect password for ' + target);
    }
  }

  async function cmd_unlock(args){
    if (args.length < 2) { print('Usage: unlock <folder> <password>'); return; }
    const folder = args[0];
    const password = args.slice(1).join(' ').replace(/^"|"$/g,'');
    await unlockFolder(folder, password);
  }

  function cmd_clear(){ screen.innerHTML = ''; }

  function cmd_exit(){
    print('Session ended. Clearing save...');
    localStorage.removeItem(SAVE_KEY);
    state = { ...stateDefault };
    setTimeout(()=>{ screen.innerHTML=''; boot(); initialLs(); }, 300);
  }

  // ---------- Tokenize ----------
  function tokenize(line){
    const parts=[]; let cur=''; let q=false;
    for(let i=0;i<line.length;i++){
      const ch=line[i];
      if(ch === '"'){ q=!q; cur+=ch; continue; }
      if(!q && /\s/.test(ch)){
        if(cur){ parts.push(cur); cur=''; }
        continue;
      }
      cur+=ch;
    }
    if(cur) parts.push(cur);
    return parts;
  }

  // ---------- Autocomplete ----------
  const COMMANDS = ['help','ls','pwd','cd','open','unlock','clear','cls','exit'];

  function commonPrefix(a,b){
    let i=0; while(i<a.length && i<b.length && a[i]===b[i]) i++; return a.slice(0,i);
  }
  function longestCommonPrefix(list){
    if(!list.length) return '';
    return list.reduce((p,c)=>commonPrefix(p,c));
  }

  function visibleChildren(path){
    const node = nodeAt(path);
    if(!node || node.type!=='dir') return [];
    // include directories (even locked), include only visible files
    return (node.children||[]).filter(name=>{
      const full = (path==='/'?'':path) + '/' + name;
      const n = nodeAt(full);
      if(!n) return false;
      if(n.type==='dir') return true;
      return isVisible(full);
    }).map(String);
  }

  function candidatesForPath(rawPath, kind){
    // kind: 'dir' | 'file' | 'any'
    const hasSlash = rawPath.includes('/');
    let dir = state.cwd, base = rawPath;
    if(rawPath.startsWith('/')){
      const idx = rawPath.lastIndexOf('/');
      dir = idx<=0 ? '/' : rawPath.slice(0, idx);
      base = rawPath.slice(idx+1);
      dir = resolvePath(dir || '/');
    } else if (hasSlash){
      const idx = rawPath.lastIndexOf('/');
      const relDir = rawPath.slice(0, idx);
      dir = resolvePath(relDir);
      base = rawPath.slice(idx+1);
    }

    const children = visibleChildren(dir);
    const fulls = children.map(name => (dir==='/' ? '/' + name : dir + '/' + name));

    const filtered = fulls.filter(full=>{
      const n = nodeAt(full);
      if(kind==='dir') return n && n.type==='dir';
      if(kind==='file') return n && n.type==='file' && isVisible(full);
      return !!n && (n.type==='dir' || isVisible(full));
    });

    const prefixFiltered = filtered
      .filter(full => full.toLowerCase().endsWith(('/'+base).toLowerCase()) || full.split('/').pop().toLowerCase().startsWith(base.toLowerCase()))
      .map(full=>{
        if(rawPath.startsWith('/')) return full;
        if (hasSlash) return full.slice((dir==='/'?1:dir.length+1));
        return full.split('/').pop();
      });

    return Array.from(new Set(prefixFiltered));
  }

  function autocomplete(line, caretAtEnd=true){
    if(!caretAtEnd) return { line, changed:false };

    const parts = tokenize(line);
    if(parts.length===0) return { line, changed:false };
    const first = parts[0].toLowerCase();

    // command-only
    if(parts.length===1){
      const hits = COMMANDS.filter(c => c.startsWith(first));
      if(hits.length===1){
        return { line: hits[0], changed: hits[0] !== line };
      }
      if(hits.length>1){
        const lcp = longestCommonPrefix(hits);
        if(lcp && lcp !== first){
          return { line: lcp, changed:true };
        } else {
          print(hits.join('  '));
          return { line, changed:false };
        }
      }
      return { line, changed:false };
    }

    // command + args
    const cmdName = first;
    const rest = parts.slice(1);
    const lastToken = rest[rest.length-1] || '';
    const beforeLast = rest.slice(0, -1);

    let kind = 'any';
    if(cmdName === 'cd') kind = 'dir';
    else if(cmdName === 'open') kind = 'file';
    else if(cmdName === 'unlock') kind = 'dir';

    function restrictUnlock(cands){
      return cands.filter(c => {
        const abs = c.startsWith('/') ? c : resolvePath(c);
        return [
          '/locked1','/locked2','/locked3','/locked4','/locked5',
          '/locked6','/locked7','/locked8','/locked9','/locked10'
        ].includes(abs);
      });
    }

    let cands = candidatesForPath(lastToken, kind);
    if(cmdName === 'unlock') cands = restrictUnlock(cands);

    if(cands.length===0) return { line, changed:false };
    if(cands.length===1){
      const completed = cands[0];
      const newArgs = [...beforeLast, completed];
      const rebuilt = [parts[0], ...newArgs].join(' ');
      return { line: rebuilt, changed: rebuilt !== line };
    }
    const lcp = longestCommonPrefix(cands);
    if(lcp && lcp !== lastToken){
      const newArgs = [...beforeLast, lcp];
      const rebuilt = [parts[0], ...newArgs].join(' ');
      return { line: rebuilt, changed:true };
    } else {
      print(cands.join('  '));
      return { line, changed:false };
    }
  }

  // ---------- Handle input ----------
  let lastTabTime = 0;
  let lastRawCommand = '';

  async function handle(line){
    if(!line.trim()) return;
    lastRawCommand = line;
    print('> ' + line);
    const parts = tokenize(line);
    let name = (parts[0] || '').toLowerCase();
    let args = parts.slice(1).map(s => s.replace(/^"|"$/g,''));

    // Alias: "cd.." => cd ..
    if(name === 'cd..'){ name = 'cd'; args = ['..']; }

    switch(name){
      case 'help':   cmd_help(); break;
      case 'ls':     cmd_ls(args); break;
      case 'pwd':    cmd_pwd(); break;
      case 'cd':     cmd_cd(args); break;
      case 'open':   cmd_open(args); break;
      case 'unlock': await cmd_unlock(args); break; // async for hashing
      case 'clear':  cmd_clear(); break;
      case 'cls':    cmd_clear(); break; // alias
      case 'exit':   cmd_exit(); break;
      default:       print('Unknown command. Try help.');
    }
  }

  // ---------- Boot ----------
  function boot(){
    print('Burak — Secret Console Quest');
    print('Session: ' + now());
    print('Type help for commands.');
    sep();
  }

  function initialLs(){
    print('> ls');
    print('Path: /');
    const lines = buildTree('/', false, '');
    lines.forEach(print);
  }

  // Wire input + keyboard features
  cmd.addEventListener('keydown', async (e)=>{
    if(e.key === 'Enter'){
      const line = cmd.value;
      await handle(line);
      cmd.value = '';
    } else if (e.key === 'c' && e.ctrlKey){
      print('^C');
      cmd.value = '';
    } else if (e.key === 'Tab'){
      e.preventDefault();
      const nowTime = performance.now();
      const double = (nowTime - lastTabTime) < 450;
      lastTabTime = nowTime;

      const { line:newLine, changed } = autocomplete(cmd.value, true);
      if(changed){
        cmd.value = newLine;
      } else if (double){
        autocomplete(cmd.value, true); // list again
      }
    } else if (e.key.toLowerCase() === 'l' && e.ctrlKey){
      // Ctrl+L: clear screen
      e.preventDefault();
      cmd_clear();
    }
  });

  // ---------- Final boot ----------
  boot();
  initialLs();
  persist();
  cmd.focus();
})();
