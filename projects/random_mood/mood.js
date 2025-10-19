/* ================= Helpers ================= */
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const $ = (sel) => document.querySelector(sel);
const toSlug = (s) =>
  String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function hexToRgb(hex){
  const m = hex.replace('#','').match(/.{1,2}/g);
  if(!m) return {r:0,g:0,b:0};
  const [r,g,b] = m.map(h=>parseInt(h,16));
  return {r,g,b};
}
function relLuminance({r,g,b}){
  const srgb = [r,g,b].map(v=>v/255).map(v => v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4));
  return 0.2126*srgb[0] + 0.7152*srgb[1] + 0.0722*srgb[2];
}
function preferredTextColor(bgHex){
  const L = relLuminance(hexToRgb(bgHex));
  return L > 0.5 ? '#000000' : '#FFFFFF';
}
function mix(hex1, hex2, t=0.5){
  const a = hexToRgb(hex1), b=hexToRgb(hex2);
  const r = Math.round(a.r + (b.r-a.r)*t);
  const g = Math.round(a.g + (b.g-a.g)*t);
  const b2 = Math.round(a.b + (b.b-a.b)*t);
  return '#' + [r,g,b2].map(v=>v.toString(16).padStart(2,'0')).join('');
}
function tryLocalSet(key, val){ try{ localStorage.setItem(key, val); }catch{} }
function tryLocalGet(key){ try{ return localStorage.getItem(key); }catch{ return null; } }

/* ================= Data ================= */
const MOODS = [
  // ---- Base emotions (core) ----
  {id:'admiration', emoji:'👏', title:'Admiration', motto:'Good work inspires good work.', bg1:'#0E1116', bg2:'#1A2230', accent:'#A7F3D0'},
  {id:'affection', emoji:'💞', title:'Affection', motto:'Kindness compounds.', bg1:'#1A0E15', bg2:'#2A1620', accent:'#F472B6'},
  {id:'amused', emoji:'😄', title:'Amused', motto:'Tiny jokes, big lifts.', bg1:'#1B140A', bg2:'#2A1D10', accent:'#FACC15'},
  {id:'angry', emoji:'😡', title:'Angry', motto:'Use the fire, don’t burn.', bg1:'#1A0E0E', bg2:'#2B1414', accent:'#F97316'},
  {id:'anxious', emoji:'😬', title:'Anxious', motto:'Name it, shrink it.', bg1:'#0D131A', bg2:'#182232', accent:'#7DD3FC'},
  {id:'ashamed', emoji:'😳', title:'Ashamed', motto:'Own, learn, move on.', bg1:'#120C0C', bg2:'#211717', accent:'#F59E0B'},
  {id:'bored', emoji:'🥱', title:'Bored', motto:'Curiosity cures.', bg1:'#0F1114', bg2:'#171A1F', accent:'#9CA3AF'},
  {id:'cheerful', emoji:'😃', title:'Cheerful', motto:'Small sparks, bright day.', bg1:'#1C1208', bg2:'#2B1A0C', accent:'#FDE047'},
  {id:'confident', emoji:'🦁', title:'Confident', motto:'Stand tall, ship small.', bg1:'#0F1518', bg2:'#1A232A', accent:'#34D399'},
  {id:'confused', emoji:'🤔', title:'Confused', motto:'Questions find doors.', bg1:'#111227', bg2:'#1A1E36', accent:'#C4B5FD'},
  {id:'content', emoji:'🙂', title:'Content', motto:'Enough is a strategy.', bg1:'#101414', bg2:'#192121', accent:'#67E8F9'},
  {id:'depressed', emoji:'😞', title:'Depressed', motto:'Tiny steps still count.', bg1:'#0B1016', bg2:'#141C28', accent:'#A5B4FC'},
  {id:'disgust', emoji:'🤢', title:'Disgust', motto:'Filter and focus.', bg1:'#0D1912', bg2:'#153124', accent:'#22C55E'},
  {id:'embarrassed', emoji:'😅', title:'Embarrassed', motto:'Laugh, learn, continue.', bg1:'#1A0E10', bg2:'#28161A', accent:'#F472B6'},
  {id:'energetic', emoji:'⚡', title:'Energetic', motto:'Go all in, always.', bg1:'#061225', bg2:'#0D2142', accent:'#22D3EE'},
  {id:'exhausted', emoji:'🥵', title:'Exhausted', motto:'Rest is fuel.', bg1:'#1A0F0B', bg2:'#2A1B14', accent:'#F59E0B'},
  {id:'excited', emoji:'🤩', title:'Excited', motto:'Momentum loves action.', bg1:'#0B0F1A', bg2:'#152236', accent:'#60A5FA'},
  {id:'fearful', emoji:'😨', title:'Fearful', motto:'Courage in tiny doses.', bg1:'#0B0E19', bg2:'#151C2B', accent:'#93C5FD'},
  {id:'frustrated', emoji:'😠', title:'Frustrated', motto:'Break it into bricks.', bg1:'#170D0D', bg2:'#231313', accent:'#EF4444'},
  {id:'grateful', emoji:'🙏', title:'Grateful', motto:'Notice the quiet wins.', bg1:'#161309', bg2:'#242014', accent:'#FCD34D'},
  {id:'guilty', emoji:'😔', title:'Guilty', motto:'Repair beats regret.', bg1:'#0D0D12', bg2:'#171823', accent:'#93C5FD'},
  {id:'happy', emoji:'😊', title:'Happy', motto:'Smiles build bridges.', bg1:'#1C0F19', bg2:'#2A1822', accent:'#F9A8D4'},
  {id:'hopeful', emoji:'🌤️', title:'Hopeful', motto:'Better is built.', bg1:'#0E1116', bg2:'#1B2636', accent:'#A7F3D0'},
  {id:'hurt', emoji:'💔', title:'Hurt', motto:'Name the pain, mend.', bg1:'#1A0D10', bg2:'#28171A', accent:'#FB7185'},
  {id:'jealous', emoji:'🟢', title:'Jealous', motto:'Turn envy into effort.', bg1:'#0B120B', bg2:'#142014', accent:'#84CC16'},
  {id:'joyful', emoji:'🎉', title:'Joyful', motto:'Celebrate small wins.', bg1:'#1A0E1F', bg2:'#27142D', accent:'#F472B6'},
  {id:'lonely', emoji:'🫥', title:'Lonely', motto:'Reach out one step.', bg1:'#0A0D12', bg2:'#141A22', accent:'#7DD3FC'},
  {id:'melancholy', emoji:'🎻', title:'Melancholy', motto:'Beauty in blue.', bg1:'#0E141F', bg2:'#1A2536', accent:'#60A5FA'},
  {id:'nostalgic', emoji:'📼', title:'Nostalgic', motto:'Yesterday hums softly.', bg1:'#201818', bg2:'#2C2020', accent:'#FBBF24'},
  {id:'peaceful', emoji:'🕊️', title:'Peaceful', motto:'Silence says enough.', bg1:'#0F172A', bg2:'#0B1021', accent:'#93C5FD'},
  {id:'proud', emoji:'🦚', title:'Proud', motto:'Own your arc.', bg1:'#141209', bg2:'#211E13', accent:'#F59E0B'},
  {id:'relaxed', emoji:'🫶', title:'Relaxed', motto:'Soft edges, clear mind.', bg1:'#0E1B1B', bg2:'#1A2A2A', accent:'#67E8F9'},
  {id:'sad', emoji:'😢', title:'Sad', motto:'Rain today, bloom tomorrow.', bg1:'#0C111A', bg2:'#17212C', accent:'#60A5FA'},
  {id:'satisfied', emoji:'😌', title:'Satisfied', motto:'Enough feels good.', bg1:'#101516', bg2:'#1B2324', accent:'#A7F3D0'},
  {id:'scared', emoji:'😱', title:'Scared', motto:'Bravery is a verb.', bg1:'#0C0F1C', bg2:'#181E2C', accent:'#FDE68A'},
  {id:'shy', emoji:'🥺', title:'Shy', motto:'Quiet courage counts.', bg1:'#151017', bg2:'#221B24', accent:'#F4A3C7'},
  {id:'stressed', emoji:'😫', title:'Stressed', motto:'Reduce scope, breathe.', bg1:'#1A0F11', bg2:'#25171A', accent:'#FB7185'},
  {id:'surprised', emoji:'😮', title:'Surprised', motto:'New routes revealed.', bg1:'#0D0E12', bg2:'#191C24', accent:'#FDE047'},
  {id:'tired', emoji:'😴', title:'Tired', motto:'Sleep is strategy.', bg1:'#0A0A1A', bg2:'#161638', accent:'#A5B4FC'},
  {id:'tranquil', emoji:'🌿', title:'Tranquil', motto:'Quiet protects creativity.', bg1:'#0B201B', bg2:'#14332C', accent:'#34D399'},
  {id:'worried', emoji:'😟', title:'Worried', motto:'Plan, then proceed.', bg1:'#0D131A', bg2:'#182232', accent:'#93C5FD'},

  // ---- Original productivity/theme set (refined colors where needed) ----
  {id:'determined', emoji:'🔥', title:'Determined', motto:'Build without compromise.', bg1:'#0E1C22', bg2:'#234455', accent:'#F59E0B'},
  {id:'calm', emoji:'🌧️', title:'Calm', motto:'Rain means recharge.', bg1:'#0E1624', bg2:'#1B2838', accent:'#38BDF8'},
  {id:'curious', emoji:'💫', title:'Curious', motto:'The unknown is calling.', bg1:'#0C1224', bg2:'#172447', accent:'#A78BFA'},
  {id:'focus', emoji:'🎯', title:'Focus', motto:'One task. Full attention.', bg1:'#0F1720', bg2:'#0B1021', accent:'#22D3EE'},
  {id:'playful', emoji:'🛼', title:'Playful', motto:'Tiny risks, big smiles.', bg1:'#1B1A2A', bg2:'#3B1F2B', accent:'#F472B6'},
  {id:'zen', emoji:'🍃', title:'Zen', motto:'Less, but better.', bg1:'#082521', bg2:'#103E37', accent:'#34D399'},
  {id:'bold', emoji:'🦾', title:'Bold', motto:'Walk through the wall.', bg1:'#2D1E2F', bg2:'#1B0E14', accent:'#F43F5E'},
  {id:'optimist', emoji:'🔆', title:'Optimist', motto:'Cracks let light in.', bg1:'#1A1604', bg2:'#2E2608', accent:'#FCD34D'},
  {id:'maker', emoji:'🛠️', title:'Maker', motto:'Make something today.', bg1:'#0E1B1B', bg2:'#1A2A2A', accent:'#67E8F9'},
  {id:'reflect', emoji:'🪞', title:'Reflect', motto:'Look back. Move on.', bg1:'#111827', bg2:'#1F2937', accent:'#93C5FD'},
  {id:'brave', emoji:'🗻', title:'Brave', motto:'Summits need courage.', bg1:'#120D18', bg2:'#2B1539', accent:'#E879F9'},
  {id:'cozy', emoji:'☕', title:'Cozy', motto:'One warm sip at a time.', bg1:'#20160F', bg2:'#2E2018', accent:'#D6B48C'},
  {id:'electric', emoji:'⚡', title:'Electric', motto:'Spark is enough.', bg1:'#030818', bg2:'#0B1730', accent:'#22D3EE'},
  {id:'flow', emoji:'🌊', title:'Flow', motto:'Resistance off. Flow on.', bg1:'#0B1021', bg2:'#0F172A', accent:'#60A5FA'},
  {id:'order', emoji:'🧭', title:'Order', motto:'Systems always win.', bg1:'#0F1215', bg2:'#141A20', accent:'#34E0B6'},
  {id:'deep-focus', emoji:'🔥🧠', title:'Deep Focus', motto:'Blocks click in place.', bg1:'#1C0C0C', bg2:'#2A0F0F', accent:'#FB7185'},
  {id:'adventurous', emoji:'🧭', title:'Adventurous', motto:'The map is not the land.', bg1:'#0A1C15', bg2:'#123427', accent:'#52B788'},
  {id:'gritty', emoji:'🧱', title:'Gritty', motto:'Show up. Again.', bg1:'#161006', bg2:'#2A1E12', accent:'#D97706'},
  {id:'minimal', emoji:'⚪', title:'Minimal', motto:'Subtract the noise.', bg1:'#0B0B0B', bg2:'#141414', accent:'#E5E7EB'},
  {id:'optimistic-tech', emoji:'🤖', title:'Optimistic Tech', motto:'Tools that uplift.', bg1:'#0A1229', bg2:'#0E1C3D', accent:'#00D4FF'},
  {id:'warmth', emoji:'🕯️', title:'Warmth', motto:'Gentle light over time.', bg1:'#2A1A12', bg2:'#3A2518', accent:'#EAB308'},
  {id:'rainy-cafe', emoji:'🌧️☕', title:'Rainy Café', motto:'Ideas drip like rain.', bg1:'#0B1B2B', bg2:'#102539', accent:'#8FBCE6'},
  {id:'sunrise', emoji:'🌅', title:'Sunrise', motto:'Soft start. Bright day.', bg1:'#1A1021', bg2:'#2C1C35', accent:'#F59E0B'},
  {id:'midnight', emoji:'🌌', title:'Midnight', motto:'Quiet fuels clarity.', bg1:'#030712', bg2:'#0B132B', accent:'#7DD3FC'},
  {id:'lime-energy', emoji:'🟢', title:'Lime Energy', motto:'Fresh and focused.', bg1:'#081308', bg2:'#0E1D0E', accent:'#84CC16'},
  {id:'royal', emoji:'👑', title:'Royal', motto:'Dignity in details.', bg1:'#1A1033', bg2:'#261350', accent:'#C084FC'},
  {id:'steel', emoji:'🛡️', title:'Steel', motto:'Strong yet polished.', bg1:'#0E1116', bg2:'#1A2430', accent:'#9CA3AF'},
  {id:'ember', emoji:'🧯', title:'Ember', motto:'Glow, don’t burn.', bg1:'#1A0B0B', bg2:'#2B1111', accent:'#F87171'},
  {id:'oceanic', emoji:'🐬', title:'Oceanic', motto:'Deep breath. Dive in.', bg1:'#06121C', bg2:'#0B2234', accent:'#38BDF8'},
  {id:'forest', emoji:'🌲', title:'Forest', motto:'Quiet roots, loud growth.', bg1:'#0A1A12', bg2:'#143B2A', accent:'#34D399'},
  {id:'neon-city', emoji:'🌃', title:'Neon City', motto:'Night lights, bright mind.', bg1:'#0B0010', bg2:'#190028', accent:'#F472B6'},
  {id:'sunlit-desk', emoji:'🪟', title:'Sunlit Desk', motto:'Dust motes, new notes.', bg1:'#1E1912', bg2:'#2B261E', accent:'#FCD34D'},
  {id:'tinker', emoji:'🔧', title:'Tinker', motto:'Turn bolts, turn thoughts.', bg1:'#111111', bg2:'#1B1B1B', accent:'#60A5FA'},
  {id:'serene', emoji:'🕊️', title:'Serene', motto:'Quiet protects creativity.', bg1:'#0F172A', bg2:'#0B1021', accent:'#93C5FD'},
  {id:'study', emoji:'📚', title:'Study', motto:'Pages build pillars.', bg1:'#0D1321', bg2:'#1B2A41', accent:'#E5E7EB'},
  {id:'ship-it', emoji:'🚀', title:'Ship It', motto:'Small. Done. Shipped.', bg1:'#0B0F1A', bg2:'#121A2C', accent:'#22D3EE'},
  {id:'precision', emoji:'📏', title:'Precision', motto:'Measure twice. Cut once.', bg1:'#0E0E10', bg2:'#14161A', accent:'#34E0B6'},
  {id:'coffee-power', emoji:'🫘', title:'Coffee Power', motto:'Ideas per milligram.', bg1:'#1E140E', bg2:'#2D1C14', accent:'#D6B48C'},

  // ---- Extended creative/productivity themes (refined) ----
  {id:'creative', emoji:'🎨', title:'Creative', motto:'Colors over chaos.', bg1:'#1B0E24', bg2:'#31183C', accent:'#F472B6'},
  {id:'productive', emoji:'💼', title:'Productive', motto:'Discipline fuels art.', bg1:'#101418', bg2:'#1E2328', accent:'#22D3EE'},
  {id:'sleepy', emoji:'😴', title:'Sleepy', motto:'Recharge the human battery.', bg1:'#0A0A1A', bg2:'#161638', accent:'#A5B4FC'},
  {id:'romantic', emoji:'💖', title:'Romantic', motto:'Love tunes the soul.', bg1:'#1E0D1A', bg2:'#321328', accent:'#FB7185'},
  {id:'inspired', emoji:'💡', title:'Inspired', motto:'Ideas strike silently.', bg1:'#141414', bg2:'#232323', accent:'#FCD34D'},
  {id:'motivated', emoji:'🚴‍♂️', title:'Motivated', motto:'Momentum is magic.', bg1:'#0B1A1A', bg2:'#152C2C', accent:'#34D399'},
  {id:'lazy', emoji:'😌', title:'Lazy', motto:'Slow can be smart.', bg1:'#171109', bg2:'#241A12', accent:'#D6B48C'},
  {id:'nostalgic-vibes', emoji:'📻', title:'Retro', motto:'Pixels never die.', bg1:'#1C0B0B', bg2:'#2E1414', accent:'#F59E0B'},
  {id:'dreamy', emoji:'☁️', title:'Dreamy', motto:'Float through thoughts.', bg1:'#0D1221', bg2:'#182443', accent:'#93C5FD'},
  {id:'futuristic', emoji:'🛸', title:'Futuristic', motto:'Forward is the only way.', bg1:'#010A18', bg2:'#08182E', accent:'#22D3EE'},
  {id:'mystic', emoji:'🔮', title:'Mystic', motto:'Vibes before logic.', bg1:'#120E1A', bg2:'#21182C', accent:'#C084FC'},
  {id:'adrenaline', emoji:'🏎️', title:'Adrenaline', motto:'Speed tastes like fire.', bg1:'#150C0C', bg2:'#2A1616', accent:'#EF4444'},
  {id:'mystery', emoji:'🕵️‍♂️', title:'Mystery', motto:'Every clue whispers.', bg1:'#0F0F17', bg2:'#1A1A29', accent:'#8EA8FF'},
  {id:'focus-pro', emoji:'🧘‍♂️', title:'Focus Pro', motto:'Balance, breathe, build.', bg1:'#101010', bg2:'#1A1A1A', accent:'#10B981'},
  {id:'moonlight', emoji:'🌕', title:'Moonlight', motto:'Calm minds glow.', bg1:'#0B0B14', bg2:'#1A1A28', accent:'#FDE68A'},
  {id:'fireplace', emoji:'🔥🏠', title:'Fireplace', motto:'Warmth within walls.', bg1:'#1A0C0C', bg2:'#2B1A1A', accent:'#F97316'},
  {id:'storm', emoji:'🌩️', title:'Storm', motto:'Thunder clears the air.', bg1:'#0B0E18', bg2:'#182235', accent:'#93C5FD'},
  {id:'galaxy', emoji:'🌌', title:'Galaxy', motto:'You are stardust.', bg1:'#070B1A', bg2:'#0E162B', accent:'#7DD3FC'},
  {id:'tech', emoji:'💻', title:'Tech', motto:'Code > chaos.', bg1:'#0C0C0C', bg2:'#181818', accent:'#00D4FF'},
  {id:'artisan', emoji:'🧵', title:'Artisan', motto:'Craft your calm.', bg1:'#1B1B12', bg2:'#2A2A1C', accent:'#D6B48C'},
  {id:'explorer', emoji:'🧭', title:'Explorer', motto:'Maps are just hints.', bg1:'#081C15', bg2:'#0B2F26', accent:'#52B788'},
  {id:'bookworm', emoji:'📖', title:'Bookworm', motto:'Stories shape us.', bg1:'#1A140C', bg2:'#2A2016', accent:'#EAB308'},
  {id:'scientific', emoji:'🔬', title:'Scientific', motto:'Curiosity engineered.', bg1:'#0A101A', bg2:'#152238', accent:'#22D3EE'},
  {id:'logical', emoji:'📐', title:'Logical', motto:'Patterns in everything.', bg1:'#0E0E10', bg2:'#14161A', accent:'#34E0B6'},
  {id:'musical', emoji:'🎶', title:'Musical', motto:'Life in tempo.', bg1:'#1A0C14', bg2:'#2B1220', accent:'#F472B6'},
  {id:'cinematic', emoji:'🎬', title:'Cinematic', motto:'Every frame a story.', bg1:'#0D0D0D', bg2:'#1A1A1A', accent:'#FDE047'},
  {id:'gamer', emoji:'🎮', title:'Gamer', motto:'Next level thinking.', bg1:'#0B0F1A', bg2:'#121A2C', accent:'#22D3EE'},
  {id:'builder', emoji:'🏗️', title:'Builder', motto:'One block at a time.', bg1:'#121212', bg2:'#1F1F1F', accent:'#F59E0B'},
  {id:'inventor', emoji:'⚙️', title:'Inventor', motto:'Turn ideas into metal.', bg1:'#0E0E0E', bg2:'#181818', accent:'#60A5FA'},
  {id:'philosopher', emoji:'🧠', title:'Philosopher', motto:'Thoughts make worlds.', bg1:'#0A0A0A', bg2:'#161616', accent:'#FDE68A'},
  {id:'chef', emoji:'👨‍🍳', title:'Chef', motto:'Spice is attitude.', bg1:'#1C1410', bg2:'#2B1C18', accent:'#F59E0B'},
  {id:'traveler', emoji:'✈️', title:'Traveler', motto:'Move to learn.', bg1:'#0B1021', bg2:'#162447', accent:'#38BDF8'},
  {id:'writer', emoji:'✍️', title:'Writer', motto:'Ink the invisible.', bg1:'#121212', bg2:'#1F1F1F', accent:'#FCD34D'},
  {id:'architect', emoji:'🏛️', title:'Architect', motto:'Order within beauty.', bg1:'#0E0E10', bg2:'#14161A', accent:'#34E0B6'},
  {id:'teacher', emoji:'🍎', title:'Teacher', motto:'Pass the spark.', bg1:'#1E1A14', bg2:'#2A231C', accent:'#F59E0B'},
  {id:'gardener', emoji:'🌻', title:'Gardener', motto:'Grow slow, bloom bright.', bg1:'#0A1A12', bg2:'#143B2A', accent:'#34D399'},
  {id:'painter', emoji:'🖌️', title:'Painter', motto:'Every color a memory.', bg1:'#1B1A2A', bg2:'#3B1F2B', accent:'#F472B6'},
  {id:'dream-builder', emoji:'🏰', title:'Dream Builder', motto:'Imagination is the blueprint.', bg1:'#110A20', bg2:'#1E1534', accent:'#C4B5FD'},
  {id:'zen-coder', emoji:'💻🍃', title:'Zen Coder', motto:'Breathe. Type. Ship.', bg1:'#0E1B1B', bg2:'#1B2A2A', accent:'#67E8F9'},
  {id:'cosmic', emoji:'🪐', title:'Cosmic', motto:'Spin in silence.', bg1:'#060818', bg2:'#101831', accent:'#A78BFA'},
  {id:'seasonal-fall', emoji:'🍂', title:'Autumn', motto:'Change is the only constant.', bg1:'#1E140A', bg2:'#2C1B0E', accent:'#D97706'},
  {id:'seasonal-winter', emoji:'❄️', title:'Winter', motto:'Stillness teaches.', bg1:'#0B0B14', bg2:'#1B1F2B', accent:'#BFDBFE'},
  {id:'seasonal-spring', emoji:'🌸', title:'Spring', motto:'Hope blooms again.', bg1:'#0E1A12', bg2:'#1A3020', accent:'#86EFAC'},
  {id:'seasonal-summer', emoji:'🌞', title:'Summer', motto:'Shine without fear.', bg1:'#1A100A', bg2:'#2C1A12', accent:'#FACC15'},
  {id:'lunar', emoji:'🌙', title:'Lunar', motto:'Soft power.', bg1:'#0B0B14', bg2:'#171C2C', accent:'#E5E7EB'},
  {id:'solar', emoji:'☀️', title:'Solar', motto:'Light is logic.', bg1:'#1C1C0A', bg2:'#2B2B14', accent:'#FACC15'},
  {id:'snowy', emoji:'☃️', title:'Snowy', motto:'Cold keeps clarity.', bg1:'#10131E', bg2:'#1C2233', accent:'#E5E7EB'},
  {id:'rainbow', emoji:'🌈', title:'Rainbow', motto:'Diversity is harmony.', bg1:'#140A18', bg2:'#24122A', accent:'#F472B6'},
  {id:'coffee-break', emoji:'☕', title:'Coffee Break', motto:'Reset. Sip. Repeat.', bg1:'#1E140E', bg2:'#2D1C14', accent:'#D6B48C'},
  {id:'campfire', emoji:'🔥⛺', title:'Campfire', motto:'Talks under stars.', bg1:'#1A0C0C', bg2:'#2B1812', accent:'#F97316'},
  {id:'coastal', emoji:'🏖️', title:'Coastal', motto:'Waves wash worries.', bg1:'#061521', bg2:'#0C283C', accent:'#38BDF8'},
  {id:'forest-hike', emoji:'🌲🥾', title:'Forest Hike', motto:'Step by step.', bg1:'#0A1A12', bg2:'#133325', accent:'#34D399'},
  {id:'night-owl', emoji:'🦉', title:'Night Owl', motto:'Silence sharpens focus.', bg1:'#0B0B14', bg2:'#17182A', accent:'#A5B4FC'},
  {id:'early-bird', emoji:'🐦', title:'Early Bird', motto:'Begin before the noise.', bg1:'#1A1012', bg2:'#2A1A1C', accent:'#FCD34D'},
  {id:'photon', emoji:'💡⚡', title:'Photon', motto:'Speed of inspiration.', bg1:'#0E1116', bg2:'#1F2937', accent:'#FDE68A'},
  {id:'nebula', emoji:'🌠', title:'Nebula', motto:'Dreams in pixels.', bg1:'#0A0A18', bg2:'#17172E', accent:'#C4B5FD'},
  {id:'artisan-tech', emoji:'🧰💻', title:'Artisan Tech', motto:'Craft meets code.', bg1:'#0E0E0E', bg2:'#1C1C1C', accent:'#67E8F9'}
];

const LSK = 'mood_machine:last';

/* ============== Export Presets ============== */
const PRESET_GROUPS = [
  { label: "Landscape", items: [
      {key:"landscape-1080", w:1920, h:1080, label:"1920×1080 (FHD)"},
      {key:"landscape-1440", w:2560, h:1440, label:"2560×1440 (QHD)"},
      {key:"landscape-2160", w:3840, h:2160, label:"3840×2160 (4K)"}
  ]},
  { label: "Portrait", items: [
      {key:"portrait-1080", w:1080, h:1920, label:"1080×1920"},
      {key:"portrait-1440", w:1440, h:2560, label:"1440×2560"},
      {key:"portrait-2160", w:2160, h:3840, label:"2160×3840"}
  ]},
  { label: "Square", items: [
      {key:"square-1080", w:1080, h:1080, label:"1080×1080"},
      {key:"square-2048", w:2048, h:2048, label:"2048×2048"}
  ]},
  { label: "Story / Reels", items: [
      {key:"story-1080", w:1080, h:1920, label:"1080×1920"},
      {key:"portrait-45", w:1080, h:1350, label:"4:5 (1080×1350)"}
  ]},
  { label: "Custom", items: [{key:"custom", w:null, h:null, label:"Custom…"}] }
];

/* ================= DOM ================= */
const elEmoji = $('#emoji');
const elTitle = $('#title');
const elMotto = $('#motto');
const elRandom = $('#randomBtn');
const elSlug = $('#slugPill');
const elTime = $('#timePill');
const elSave = $('#saveStatus');
const elPalette = $('#palettePreview');

const nativeMoodSelect = $('#moodSelect');
const moodSelectUI = $('#moodSelectUI');
const moodTrigger = $('#moodTrigger');
const moodListbox = $('#moodListbox');
const moodCurrentEmoji = $('#moodCurrentEmoji');
const moodCurrentText  = $('#moodCurrentText');

const modal = $('#exportModal');
const closeModalBtn = $('#closeModal');

const nativeFormatSelect = $('#formatSelect');
const formatSelectUI   = $('#formatSelectUI');
const formatTrigger    = $('#formatTrigger');
const formatListbox    = $('#formatListbox');
const formatCurrentTxt = $('#formatCurrentText');

const customDims = $('#customDims');
const customW = $('#customW');
const customH = $('#customH');
const optDate = $('#optDate');
const optTime = $('#optTime');

const previewCanvas = $('#previewCanvas');
const refreshPreviewBtn = $('#refreshPreview');
const downloadBtn = $('#downloadBtn');

const shareBtn = $('#shareBtn');
const previewBtn = $('#previewBtn');

/* ================= State ================= */
let mouseX = 0.5, mouseY = 0.2;
let currentMood = MOODS.find(m=>m.id==='flow') || MOODS[0];

let moodFocusIndex = -1;
let formatFocusIndex = -1;

/* ============== Build: Mood controls (alphabetical) ============== */
function populateMoodControls(){
  const sorted = [...MOODS].sort((a,b)=> a.title.localeCompare(b.title));
  // native
  nativeMoodSelect.innerHTML = '';
  sorted.forEach(m=>{
    const opt = document.createElement('option');
    opt.value = m.id; opt.textContent = `${m.emoji} ${m.title}`;
    nativeMoodSelect.appendChild(opt);
  });
  // custom list
  moodListbox.innerHTML = '';
  sorted.forEach((m,i)=>{
    const li = document.createElement('li');
    li.className = 'selectui-option';
    li.setAttribute('role','option');
    li.setAttribute('tabindex','-1');
    li.dataset.id = m.id;
    li.innerHTML = `<span class="emo">${m.emoji}</span><span class="txt">${m.title}</span>`;
    li.addEventListener('click', ()=>{ setMoodById(m.id); closeMoodUI(); moodTrigger.focus(); });
    li.addEventListener('mouseenter', ()=> moodFocusIndex = i);
    moodListbox.appendChild(li);
  });

  nativeMoodSelect.value = currentMood.id;
  moodCurrentEmoji.textContent = currentMood.emoji;
  moodCurrentText.textContent = currentMood.title;
  markSelected(moodListbox, currentMood.id);
}

/* ============== Build: Format controls ============== */
function populateFormatControls(){
  nativeFormatSelect.innerHTML = '';
  PRESET_GROUPS.forEach(group=>{
    const og = document.createElement('optgroup');
    og.label = group.label;
    group.items.forEach(it=>{
      const o = document.createElement('option');
      o.value = it.key; o.textContent = it.label;
      o.dataset.w = it.w ?? '';
      o.dataset.h = it.h ?? '';
      og.appendChild(o);
    });
    nativeFormatSelect.appendChild(og);
  });
  nativeFormatSelect.value = 'landscape-1080';

  formatListbox.innerHTML = '';
  PRESET_GROUPS.forEach(group=>{
    const header = document.createElement('li');
    header.className = 'selectui-option';
    header.setAttribute('aria-disabled','true');
    header.style.opacity = .6;
    header.style.cursor = 'default';
    header.innerHTML = `<span class="txt" style="font-weight:700">${group.label}</span>`;
    formatListbox.appendChild(header);

    group.items.forEach(it=>{
      const li = document.createElement('li');
      li.className = 'selectui-option';
      li.setAttribute('role','option');
      li.setAttribute('tabindex','-1');
      li.dataset.key = it.key;
      li.dataset.w = it.w ?? '';
      li.dataset.h = it.h ?? '';
      li.innerHTML = `<span class="txt">${it.label}</span>`;
      li.addEventListener('click', ()=>{
        setFormatByKey(it.key);
        closeFormatDropdown();
        formatTrigger.focus();
      });
      li.addEventListener('mouseenter', ()=> formatFocusIndex = getFormatItems().indexOf(li));
      formatListbox.appendChild(li);
    });
  });

  setFormatByKey('landscape-1080', true);
}

function getFormatOpt(key){
  return [...nativeFormatSelect.options].find(o=>o.value===key);
}
function getFormatItems(){ return [...formatListbox.querySelectorAll('li[role="option"]')]; }
function setFormatByKey(key, silent=false){
  const opt = getFormatOpt(key);
  if(!opt) return;
  nativeFormatSelect.value = key;
  formatCurrentTxt.textContent = opt.textContent;
  customDims.hidden = key!=='custom';
  const items = getFormatItems();
  items.forEach(li => li.setAttribute('aria-selected', li.dataset.key===key?'true':'false'));
  if(!silent) renderPreview();
}
function parseFormatValue(){
  const key = nativeFormatSelect.value;
  if(key==='custom'){
    return {key, w: Number(customW.value)||1200, h: Number(customH.value)||1200};
  }
  const opt = getFormatOpt(key);
  const w = Number(opt?.dataset.w || 0) || 1920;
  const h = Number(opt?.dataset.h || 0) || 1080;
  return {key, w, h};
}

/* ============== Apply Mood ============== */
function applyMood(m){
  currentMood = m;

  const mid = mix(m.bg1, m.bg2, .5);
  const textOnMid = preferredTextColor(mid);
  const textOnAccent = preferredTextColor(m.accent);

  document.documentElement.style.setProperty('--bg1', m.bg1);
  document.documentElement.style.setProperty('--bg2', m.bg2);
  document.documentElement.style.setProperty('--accent', m.accent);
  document.documentElement.style.setProperty('--text', textOnMid);
  document.documentElement.style.setProperty('--ring', textOnAccent);

  const x = clamp(mouseX, 0, 1);
  const y = clamp(mouseY, 0, 1);
  const cx = 50 + (x - 0.5) * 80;
  const cy = 50 + (y - 0.5) * 80;
  document.body.style.background =
    `radial-gradient(120% 120% at ${cx}% ${cy}%, ${m.bg2}, ${m.bg1}) fixed`;

  elEmoji.textContent = m.emoji;
  elEmoji.setAttribute('aria-label', `${m.title} mood`);
  elTitle.textContent = m.title;
  elMotto.textContent = m.motto;

  const slug = `mood/${toSlug(m.id)}`;
  elSlug.textContent = slug;

  const dots = elPalette.querySelectorAll('.dot');
  if(dots.length===3){
    dots[0].style.background = m.bg1;
    dots[1].style.background = m.bg2;
    dots[2].style.background = m.accent;
  }

  elRandom.style.color = preferredTextColor(m.accent);

  tryLocalSet(LSK, m.id);
  elSave.textContent = 'Saved';
  elTime.textContent = `⏱ ${new Date().toLocaleTimeString()}`;

  nativeMoodSelect.value = m.id;
  moodCurrentEmoji.textContent = m.emoji;
  moodCurrentText.textContent = m.title;
  markSelected(moodListbox, m.id);
}

function setMoodById(id){ const m = MOODS.find(mm=>mm.id===id); if(m) applyMood(m); }
function pickRandom(){ return MOODS[Math.floor(Math.random()*MOODS.length)]; }

function markSelected(listboxEl, idOrKey){
  [...listboxEl.querySelectorAll('[role="option"]')].forEach(li=>{
    const key = li.dataset.id || li.dataset.key;
    li.setAttribute('aria-selected', key===idOrKey ? 'true' : 'false');
  });
}

/* ============== SelectUI toggle/keyboard ============== */
function openMoodUI(){
  moodSelectUI.setAttribute('aria-expanded','true');
  moodListbox.focus({preventScroll:true});
  const items = [...moodListbox.querySelectorAll('[role="option"]')];
  const idx = items.findIndex(li=>li.dataset.id===currentMood.id);
  moodFocusIndex = idx>=0?idx:0;
  focusListItem(moodListbox, moodFocusIndex);
}
function closeMoodUI(){ moodSelectUI.setAttribute('aria-expanded','false'); }
function openFormatDropdown(){
  formatSelectUI.setAttribute('aria-expanded','true');
  const items = getFormatItems();
  formatFocusIndex = Math.max(0, items.findIndex(li=>li.getAttribute('aria-selected')==='true'));
  focusListItem(formatListbox, formatFocusIndex);
  formatListbox.focus({preventScroll:true});
}
function closeFormatDropdown(){ formatSelectUI.setAttribute('aria-expanded','false'); }

function focusListItem(listbox, idx){
  const items = [...listbox.querySelectorAll('[role="option"]')];
  if(!items.length) return;
  idx = (idx + items.length) % items.length;
  items.forEach(el=>el.classList.remove('focus'));
  const el = items[idx];
  el.classList.add('focus');
  el.scrollIntoView({block:'nearest'});
  if(listbox===moodListbox) moodFocusIndex = idx; else formatFocusIndex = idx;
}

/* ============== Export drawing ============== */
function wrapText(ctx, text, maxWidth){
  const words = String(text).split(' ');
  const lines = [];
  let line = '';
  for(let i=0;i<words.length;i++){
    const test = (line?line+' ':'')+words[i];
    if(ctx.measureText(test).width<=maxWidth) line = test;
    else{ if(line) lines.push(line); line = words[i]; }
  }
  if(line) lines.push(line);
  return lines;
}

// Dinamik font ayarı (başlığın tek satıra sığması için)
function fitTextSize(ctx, text, maxWidth, baseSize){
  let size = baseSize;
  ctx.font = `800 ${size}px ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial`;
  if (ctx.measureText(text).width <= maxWidth) return size;
  // küçülterek ara
  while (size > baseSize * 0.55 && ctx.measureText(text).width > maxWidth){
    size -= Math.ceil(baseSize * 0.02);
    ctx.font = `800 ${size}px ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial`;
  }
  return size;
}

/** opts: {w,h, showDate, showTime} */
function drawMoodToCanvas(mood, opts={}){
  const dpr = 2;
  const W = Math.max(256, opts.w || 1920);
  const H = Math.max(256, opts.h || 1080);

  const canvas = document.createElement('canvas');
  canvas.width = W*dpr; canvas.height = H*dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  // Background gradient + vignette
  const grad = ctx.createLinearGradient(0,0,W,H);
  grad.addColorStop(0, mood.bg2);
  grad.addColorStop(1, mood.bg1);
  ctx.fillStyle = grad; ctx.fillRect(0,0,W,H);

  const vg = ctx.createRadialGradient(W*0.5, H*0.35, 0, W*0.5, H*0.35, Math.max(W,H)*0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.18)');
  ctx.fillStyle = vg; ctx.fillRect(0,0,W,H);

  const mid = mix(mood.bg1, mood.bg2, .5);
  const FG = preferredTextColor(mid);

  // Layout scale
  const minD = Math.min(W,H);
  const pad = minD*0.08;
  const left = pad;
  const boxW = W - pad*2;

  // Emoji
  ctx.textBaseline = 'top';
  ctx.fillStyle = FG;
  const emojiSize = minD*0.18;
  ctx.font = `bold ${emojiSize}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji", system-ui, sans-serif`;
  ctx.fillText(mood.emoji, left, pad);

  // Title (emoji ile arayı artır)
  const titleBase = minD*0.11;
  const titleX = left + emojiSize + Math.max(pad*0.5, minD*0.06);
  const titleY = pad + emojiSize*0.08;

  // Başlık genişliği: sağ taraf sınırı boxW
  let titleSize = fitTextSize(ctx, mood.title, boxW - (emojiSize + Math.max(pad*0.5, minD*0.06)), titleBase);
  ctx.font = `800 ${titleSize}px ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial`;
  ctx.fillStyle = FG;
  ctx.fillText(mood.title, titleX, titleY);

  // Motto
  const mottoX = left;
  const mottoY = pad + emojiSize + pad*0.7;
  const mottoSize = minD*0.038;
  const mottoLH = mottoSize*1.35;
  ctx.font = `600 ${mottoSize}px ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial`;
  ctx.fillStyle = FG;
  wrapText(ctx, mood.motto, boxW).forEach((ln,i)=> ctx.fillText(ln, mottoX, mottoY + i*mottoLH));

  // Date / Time (arkasız)
  const parts = [];
  const now = new Date();
  if (opts.showDate) parts.push(now.toLocaleDateString());
  if (opts.showTime) parts.push(now.toLocaleTimeString());
  if (parts.length){
    const ts = parts.join(' • ');
    const tsSize = minD*0.03;
    ctx.font = `600 ${tsSize}px ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial`;
    ctx.fillStyle = FG;
    ctx.fillText(ts, pad, H - pad - tsSize*0.2);
  }

  return canvas;
}

function renderPreview(){
  const {w, h} = parseFormatValue();
  const full = drawMoodToCanvas(currentMood, {
    w, h,
    showDate: !!optDate.checked,
    showTime: !!optTime.checked
  });

  const ctx = previewCanvas.getContext('2d');
  const maxW = previewCanvas.width, maxH = previewCanvas.height;
  ctx.clearRect(0,0,maxW,maxH);
  const ratio = Math.min(maxW/full.width, maxH/full.height);
  const drawW = full.width * ratio;
  const drawH = full.height * ratio;
  const dx = (maxW - drawW)/2;
  const dy = (maxH - drawH)/2;
  ctx.drawImage(full, dx, dy, drawW, drawH);

  previewCanvas._lastFullCanvas = full;
}

function downloadFromPreview(){
  const c = previewCanvas._lastFullCanvas;
  if(!c){ renderPreview(); return downloadFromPreview(); }
  const a = document.createElement('a');
  a.href = c.toDataURL('image/png');
  a.download = `mood-${currentMood.id}-${nativeFormatSelect.value}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/* ================= Events ================= */
// Random
elRandom.addEventListener('click', ()=>{
  const m = pickRandom();
  elRandom.setAttribute('aria-pressed','true');
  applyMood(m);
  setTimeout(()=> elRandom.setAttribute('aria-pressed','false'), 140);
});
window.addEventListener('keydown', (e)=>{
  if(e.code==='Space'){ e.preventDefault(); elRandom.click(); }
});

// Gradient parallax
window.addEventListener('pointermove', (e)=>{
  mouseX = e.clientX / window.innerWidth;
  mouseY = e.clientY / window.innerHeight;
  applyMood(currentMood);
},{passive:true});

// Mood selects
nativeMoodSelect.addEventListener('change', (e)=> setMoodById(e.target.value));
moodTrigger.addEventListener('click', ()=>{
  const expanded = moodSelectUI.getAttribute('aria-expanded')==='true';
  expanded ? closeMoodUI() : openMoodUI();
});
document.addEventListener('click', (e)=>{ if(!moodSelectUI.contains(e.target)) closeMoodUI(); });
moodSelectUI.addEventListener('keydown', (e)=>{
  const expanded = moodSelectUI.getAttribute('aria-expanded')==='true';
  if(!expanded && (e.key==='ArrowDown'||e.key==='Enter'||e.key===' ')){ e.preventDefault(); openMoodUI(); return; }
  if(!expanded) return;

  const items = [...moodListbox.querySelectorAll('[role="option"]')];
  switch(e.key){
    case 'ArrowDown': e.preventDefault(); focusListItem(moodListbox, moodFocusIndex+1); break;
    case 'ArrowUp':   e.preventDefault(); focusListItem(moodListbox, moodFocusIndex-1); break;
    case 'Home':      e.preventDefault(); focusListItem(moodListbox, 0); break;
    case 'End':       e.preventDefault(); focusListItem(moodListbox, items.length-1); break;
    case 'Enter':
    case ' ': {
      e.preventDefault();
      const el = items[moodFocusIndex];
      if(el){ setMoodById(el.dataset.id); closeMoodUI(); moodTrigger.focus(); }
      break;
    }
    case 'Escape': e.preventDefault(); closeMoodUI(); moodTrigger.focus(); break;
  }
});

// Share
shareBtn.addEventListener('click', async ()=>{
  const url = new URL(location.href);
  url.searchParams.set('m', currentMood.id);
  try{ await navigator.clipboard.writeText(url.toString()); elSave.textContent = 'Link copied!'; }
  catch{ elSave.textContent = 'Copy failed'; }
});

// Modal open/close (format değiştirmek ASLA kapatmaz)
previewBtn.addEventListener('click', ()=>{
  modal.classList.add('show');
  modal.setAttribute('aria-hidden','false');
  renderPreview();
});
closeModalBtn.addEventListener('click', ()=>{ modal.classList.remove('show'); modal.setAttribute('aria-hidden','true'); });
modal.addEventListener('click', (e)=>{ if(e.target.hasAttribute('data-close')) { modal.classList.remove('show'); modal.setAttribute('aria-hidden','true'); }});

// Format SelectUI open/close & keyboard
formatTrigger.addEventListener('click', ()=>{
  const expanded = formatSelectUI.getAttribute('aria-expanded')==='true';
  expanded ? closeFormatDropdown() : openFormatDropdown();
});
document.addEventListener('click', (e)=>{ if(!formatSelectUI.contains(e.target)) closeFormatDropdown(); });
formatSelectUI.addEventListener('keydown', (e)=>{
  const expanded = formatSelectUI.getAttribute('aria-expanded')==='true';
  if(!expanded && (e.key==='ArrowDown'||e.key==='Enter'||e.key===' ')){ e.preventDefault(); openFormatDropdown(); return; }
  if(!expanded) return;

  const items = getFormatItems();
  switch(e.key){
    case 'ArrowDown': e.preventDefault(); focusListItem(formatListbox, formatFocusIndex+1); break;
    case 'ArrowUp':   e.preventDefault(); focusListItem(formatListbox, formatFocusIndex-1); break;
    case 'Home':      e.preventDefault(); focusListItem(formatListbox, 0); break;
    case 'End':       e.preventDefault(); focusListItem(formatListbox, items.length-1); break;
    case 'Enter':
    case ' ': {
      e.preventDefault();
      const el = items[formatFocusIndex];
      if(el){ setFormatByKey(el.dataset.key); closeFormatDropdown(); formatTrigger.focus(); }
      break;
    }
    case 'Escape': e.preventDefault(); closeFormatDropdown(); formatTrigger.focus(); break;
  }
});

// Native format select (fallback, modal KAPANMAZ)
nativeFormatSelect.addEventListener('change', ()=>{ setFormatByKey(nativeFormatSelect.value); });

// Modal controls
[customW, customH, optDate, optTime].forEach(el=>{
  el.addEventListener('input', renderPreview);
  el.addEventListener('change', renderPreview);
});
refreshPreviewBtn.addEventListener('click', renderPreview);
downloadBtn.addEventListener('click', downloadFromPreview);

/* ================= Init ================= */
(function init(){
  const last = tryLocalGet(LSK);
  if(last && MOODS.find(m=>m.id===last)) currentMood = MOODS.find(m=>m.id===last);

  populateMoodControls();
  populateFormatControls();
  applyMood(currentMood);
})();
