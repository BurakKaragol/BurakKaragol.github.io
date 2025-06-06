const genres = [
    { name: "Reverse Horror", icon: "fa-ghost" },
    { name: "Time-Loop Shooter", icon: "fa-redo" },
    { name: "Reality-Bending Puzzle", icon: "fa-brain" },
    { name: "Survival Cooking", icon: "fa-utensils" },
    { name: "Mad Scientist RPG", icon: "fa-flask" },
    { name: "Stealth Parkour", icon: "fa-running" },
    { name: "Social Engineering Sim", icon: "fa-comments" },
    { name: "Evolutionary Battle Royale", icon: "fa-dna" },
    { name: "Mecha Card Game", icon: "fa-robot" },
    { name: "Gravity-Shift Platformer", icon: "fa-arrows-alt" },
    { name: "AI Dungeon Crawler", icon: "fa-microchip" },
    { name: "Ghost Detective", icon: "fa-user-secret" },
    { name: "Musical Combat RPG", icon: "fa-music" },
    { name: "Kaiju Management Sim", icon: "fa-dragon" },
    { name: "Bullet Hell Gardening", icon: "fa-seedling" },
    { name: "Post-Apocalyptic Zoo Tycoon", icon: "fa-radiation" },
    { name: "Glitch-Based Horror", icon: "fa-exclamation-triangle" },
    { name: "Magic Skateboarding", icon: "fa-skating" },
    { name: "Virtual Reality Board Game", icon: "fa-chess" },
    { name: "Multiverse Strategy", icon: "fa-infinity" },
    { name: "Lovecraftian Farming Sim", icon: "fa-seedling" },
    { name: "Rogue AI Simulator", icon: "fa-robot" },
    { name: "Space Pirate Heist", icon: "fa-user-astronaut" },
    { name: "Underwater Cyberpunk", icon: "fa-water" },
    { name: "Dinosaur Racing", icon: "fa-horse-head" },
    { name: "Puzzle FPS", icon: "fa-crosshairs" },
    { name: "Physics-Based Magic", icon: "fa-magic" },
    { name: "Dream Explorer", icon: "fa-moon" },
    { name: "Vampire Politics RPG", icon: "fa-user-tie" },
    { name: "Music-Driven Bullet Hell", icon: "fa-headphones" },
    { name: "Kaiju Fighting Simulator", icon: "fa-fist-raised" },
    { name: "Reverse Tower Defense", icon: "fa-shield-alt" },
    { name: "AI-Powered NPC Dating Sim", icon: "fa-heart" },
    { name: "Glitchpunk RPG", icon: "fa-virus" },
    { name: "Steampunk Detective Mystery", icon: "fa-user-secret" },
    { name: "Holographic Fighting Game", icon: "fa-chess-rook" },
    { name: "Mimic Survival Horror", icon: "fa-skull-crossbones" },
    { name: "Living Dungeon Crawler", icon: "fa-dungeon" },
    { name: "Space Colony Builder", icon: "fa-globe" },
    { name: "Soul-Switching RPG", icon: "fa-exchange-alt" },
    { name: "AI vs Humans War Strategy", icon: "fa-robot" },
    { name: "Monster Breeding Roguelike", icon: "fa-egg" },
    { name: "Alchemy-Based RPG", icon: "fa-flask" },
    { name: "Fantasy Parkour RPG", icon: "fa-dungeon" },
    { name: "Cybernetic Horror Survival", icon: "fa-biohazard" },
    { name: "Black Hole Physics Puzzle", icon: "fa-dot-circle" },
    { name: "Mafia Negotiation Sim", icon: "fa-user-secret" },
    { name: "Mutation-Based FPS", icon: "fa-bong" }
];

const settings = [
    { name: "A city floating in a gas giant’s clouds", icon: "fa-cloud" },
    { name: "A world inside a constantly shifting Rubik’s Cube", icon: "fa-cube" },
    { name: "A carnival run by ghosts", icon: "fa-masks-theater" },
    { name: "An underwater neon-lit cyberpunk metropolis", icon: "fa-water" },
    { name: "A dying world where gravity constantly changes", icon: "fa-arrows-alt-v" },
    { name: "A giant spaceship controlled by rogue AI", icon: "fa-rocket" },
    { name: "A digital prison where every action is monitored", icon: "fa-lock" },
    { name: "A 1980s-style VR simulation gone wrong", icon: "fa-vr-cardboard" },
    { name: "An island constantly shifting in time", icon: "fa-clock" },
    { name: "A casino in the middle of a warzone", icon: "fa-coins" },
    { name: "A massive underground labyrinth city", icon: "fa-dungeon" },
    { name: "A utopian world ruled by AI overlords", icon: "fa-microchip" },
    { name: "A floating fortress drifting through the void", icon: "fa-fort-awesome" },
    { name: "A haunted train that never stops moving", icon: "fa-train" },
    { name: "A battlefield where time loops endlessly", icon: "fa-redo" },
    { name: "A world made entirely of shifting sand dunes", icon: "fa-mountain" },
    { name: "A ruined cyber-temple guarded by ancient robots", icon: "fa-robot" },
    { name: "A post-apocalyptic shopping mall society", icon: "fa-store" },
    { name: "A hidden valley untouched by time", icon: "fa-tree" },
    { name: "A never-ending storm covering the planet", icon: "fa-bolt" },
    { name: "A space station taken over by alien fungi", icon: "fa-spider" },
    { name: "A library where books rewrite reality", icon: "fa-book" },
    { name: "A moon-sized theme park abandoned for centuries", icon: "fa-moon" },
    { name: "A desert where the laws of physics glitch randomly", icon: "fa-bug" },
    { name: "A volcanic fortress inside an active lava field", icon: "fa-fire" },
    { name: "A frozen kingdom where fire is illegal", icon: "fa-snowflake" },
    { name: "A cyberpunk mega-city built inside a dead god’s body", icon: "fa-skull-crossbones" },
    { name: "A floating kingdom of airships locked in war", icon: "fa-ship" },
    { name: "A secret world beneath the ocean’s crust", icon: "fa-water" },
    { name: "A dimension where dreams and reality overlap", icon: "fa-bed" },
    { name: "A wasteland where you can only travel by teleportation", icon: "fa-broadcast-tower" },
    { name: "A dying star used as a power source for civilization", icon: "fa-sun" },
    { name: "A jungle world filled with massive mutated creatures", icon: "fa-leaf" },
    { name: "A corporate-controlled dystopian shopping complex", icon: "fa-shopping-cart" },
    { name: "A mystical realm that only exists during eclipses", icon: "fa-eye" },
    { name: "A frozen city trapped in an eternal blizzard", icon: "fa-cloud-meatball" },
    { name: "A prison colony where inmates have developed superpowers", icon: "fa-hammer" },
    { name: "A swamp town where people trade in memories", icon: "fa-exchange-alt" },
    { name: "A planet where gravity constantly shifts direction", icon: "fa-arrows-alt" },
    { name: "A giant organic spaceship made of living tissue", icon: "fa-heart" },
    { name: "A shattered dimension where reality is unstable", icon: "fa-random" },
    { name: "A haunted cyber-mansion filled with AI ghosts", icon: "fa-ghost" },
    { name: "A massive underground machine city abandoned by its creators", icon: "fa-industry" },
    { name: "A floating island where the laws of physics change daily", icon: "fa-globe" },
    { name: "A cursed battlefield where fallen soldiers return as wraiths", icon: "fa-skull" },
    { name: "A city built around the skeleton of a long-dead dragon", icon: "fa-dragon" },
    { name: "A cosmic highway where alien outlaws race for survival", icon: "fa-road" },
    { name: "A giant amusement park where attractions come to life", icon: "fa-smile" }
];

const mechanics = [
    { name: "Time manipulation", icon: "fa-clock" },
    { name: "Physics-based puzzles", icon: "fa-cogs" },
    { name: "Stealth with dynamic light and shadow", icon: "fa-user-secret" },
    { name: "Parkour movement system", icon: "fa-running" },
    { name: "Resource management and crafting", icon: "fa-boxes" },
    { name: "Tactical combat with cover system", icon: "fa-bullseye" },
    { name: "Procedural level generation", icon: "fa-dice-d20" },
    { name: "Turn-based strategy combat", icon: "fa-chess" },
    { name: "Inventory-based magic system", icon: "fa-magic" },
    { name: "Environmental destruction", icon: "fa-hammer" },
    { name: "Character fusion to gain new abilities", icon: "fa-users" },
    { name: "Shape-shifting into different forms", icon: "fa-exchange-alt" },
    { name: "Hacking minigames for infiltration", icon: "fa-terminal" },
    { name: "AI-controlled NPC squads that adapt to the player", icon: "fa-robot" },
    { name: "Rhythm-based combat and movement", icon: "fa-music" },
    { name: "Weapon crafting with randomized modifiers", icon: "fa-wrench" },
    { name: "Augmentations that change gameplay", icon: "fa-microchip" },
    { name: "Voice commands to control in-game actions", icon: "fa-microphone" },
    { name: "Gravity control to navigate environments", icon: "fa-arrows-alt-v" },
    { name: "Merging weapons to create unique attacks", icon: "fa-link" },
    { name: "Dynamic dialogue system that changes based on actions", icon: "fa-comments" },
    { name: "AI-generated levels that evolve over time", icon: "fa-code" },
    { name: "Bullet time combat for dodging attacks", icon: "fa-stopwatch" },
    { name: "Elemental interaction between environment and combat", icon: "fa-fire" },
    { name: "Stealing abilities from enemies", icon: "fa-hand-paper" },
    { name: "Mimicry: Copy enemy attacks and moves", icon: "fa-theater-masks" },
    { name: "Memory-based puzzles where clues disappear", icon: "fa-brain" },
    { name: "A karma system that alters gameplay", icon: "fa-balance-scale" },
    { name: "Using portals to teleport through levels", icon: "fa-exchange-alt" },
    { name: "Limb-targeting system in combat", icon: "fa-biohazard" },
    { name: "Character aging affects abilities and stats", icon: "fa-hourglass-half" },
    { name: "Vehicle-based combat and exploration", icon: "fa-car" },
    { name: "Disguise mechanics to avoid detection", icon: "fa-mask" },
    { name: "Climbing and free movement exploration", icon: "fa-mountain" },
    { name: "Mind control to take over NPCs", icon: "fa-eye" },
    { name: "Metamorphosis: Change character form mid-game", icon: "fa-spider" },
    { name: "Rewinding objects to previous states", icon: "fa-history" },
    { name: "Non-lethal combat options with pacifist paths", icon: "fa-peace" },
    { name: "Survival mechanics like hunger, thirst, and fatigue", icon: "fa-utensils" },
    { name: "One-hit-death mechanics for intense gameplay", icon: "fa-skull" },
    { name: "Mind-reading to influence NPC choices", icon: "fa-brain" },
    { name: "Wall-running and acrobatics", icon: "fa-shoe-prints" },
    { name: "Companion system where allies learn from you", icon: "fa-dog" },
    { name: "A second-screen mechanic for secret actions", icon: "fa-tablet-alt" },
    { name: "Mixing potions to create unpredictable effects", icon: "fa-flask" },
    { name: "Physics-based grappling hook traversal", icon: "fa-anchor" },
    { name: "Building and fortification mechanics", icon: "fa-hard-hat" },
    { name: "Randomized superpowers every time you die", icon: "fa-radiation" },
    { name: "Player actions rewrite the game’s code", icon: "fa-code-branch" }
];

const twists = [
    { name: "You can only attack while jumping", icon: "fa-arrows-alt-v" },
    { name: "Enemies evolve over time", icon: "fa-dna" },
    { name: "Your character ages as you play", icon: "fa-hourglass-half" },
    { name: "You must control two characters simultaneously", icon: "fa-user-friends" },
    { name: "The world resets every 10 minutes", icon: "fa-redo" },
    { name: "Your abilities change based on the environment", icon: "fa-cloud" },
    { name: "NPCs remember your past actions permanently", icon: "fa-memory" },
    { name: "Your character can merge with enemies", icon: "fa-users" },
    { name: "Every level is a different genre", icon: "fa-random" },
    { name: "Your weapons degrade but evolve into something new", icon: "fa-tools" },
    { name: "The main character has no memory of past levels", icon: "fa-brain" },
    { name: "The game’s rules change every 5 minutes", icon: "fa-random" },
    { name: "Defeated bosses become your allies", icon: "fa-handshake" },
    { name: "The final boss is actually your past self", icon: "fa-user" },
    { name: "The game resets every time you die, but changes slightly", icon: "fa-sync" },
    { name: "You are playing in a simulation controlled by an unknown force", icon: "fa-terminal" },
    { name: "The world is actually inside a giant creature", icon: "fa-dragon" },
    { name: "Every choice permanently alters the world", icon: "fa-balance-scale" },
    { name: "Your character is being controlled by another entity", icon: "fa-gamepad" },
    { name: "You have to betray your allies to win", icon: "fa-user-secret" },
    { name: "You can only see enemies when you close your eyes", icon: "fa-eye-slash" },
    { name: "Every enemy is actually another player from a parallel world", icon: "fa-globe" },
    { name: "The final level is a recreation of the first, but distorted", icon: "fa-infinity" },
    { name: "Your health is shared with all NPCs in the game", icon: "fa-heartbeat" },
    { name: "You can rewind time, but it costs years of your character’s life", icon: "fa-clock" },
    { name: "The protagonist isn’t the real hero—someone else is", icon: "fa-user-ninja" },
    { name: "Enemies can learn and adapt to your playstyle", icon: "fa-brain" },
    { name: "Every action drains your energy, even walking", icon: "fa-battery-empty" },
    { name: "The game keeps deleting parts of the world as you progress", icon: "fa-eraser" },
    { name: "You can hear the villain’s thoughts throughout the game", icon: "fa-comment-alt" },
    { name: "The final boss is controlled by an AI adapting to you in real-time", icon: "fa-robot" },
    { name: "You must type commands to change the world", icon: "fa-keyboard" },
    { name: "Your character is the villain, but doesn’t know it", icon: "fa-skull-crossbones" },
    { name: "There is only one enemy, but it’s always watching you", icon: "fa-eye" },
    { name: "You don’t control the character directly, just their subconscious", icon: "fa-brain" },
    { name: "Every time you respawn, the world gets more difficult", icon: "fa-arrow-up" },
    { name: "The game tricks you into thinking you’re doing good, but you’re not", icon: "fa-smile-wink" },
    { name: "Your real-world microphone affects the game’s events", icon: "fa-microphone" },
    { name: "The HUD lies to you", icon: "fa-exclamation-triangle" },
    { name: "Your character speaks in riddles, making NPCs misunderstand you", icon: "fa-comment-dots" },
    { name: "There is no final boss, only a never-ending journey", icon: "fa-road" },
    { name: "Your movement controls are reversed every few minutes", icon: "fa-random" },
    { name: "Saving the game costs something important", icon: "fa-save" },
    { name: "You are being hunted by something that never stops", icon: "fa-spider" },
    { name: "If you stand still for too long, you start hallucinating", icon: "fa-eye-dropper" },
    { name: "You can only see in color when holding a certain object", icon: "fa-palette" },
    { name: "The game breaks the fourth wall constantly", icon: "fa-door-open" },
    { name: "There is a secret ending that can only be unlocked by never fighting", icon: "fa-peace" }
];

const lockState = {
    genre: false,
    setting: false,
    mechanic: false,
    twist: false
};

function toggleLock(section) {
    lockState[section] = !lockState[section];
    const icon = document.getElementById(`${section}-lock`);
    icon.className = `fa-solid ${lockState[section] ? 'fa-lock' : 'fa-lock-open'} lock-icon`;
}

// Setup lock toggles
["genre", "setting", "mechanic", "twist"].forEach(section => {
    document.getElementById(`${section}-lock`).addEventListener("click", () => toggleLock(section));
});

function rollSection(section, dataArray, iconId, textId, lockCheck, delay = 1000) {
    if (lockCheck[section]) return;

    let counter = 0;
    const interval = 75;
    const totalRolls = Math.floor(delay / interval);
    const intervalId = setInterval(() => {
        const item = dataArray[Math.floor(Math.random() * dataArray.length)];
        document.getElementById(iconId).className = `fa-solid ${item.icon}`;
        document.getElementById(textId).textContent = item.name;
        counter++;
        if (counter >= totalRolls) clearInterval(intervalId);
    }, interval);
}

document.getElementById("generate-idea-btn").addEventListener("click", () => {
    rollSection("genre", genres, "genre-icon", "genre-text", lockState, 1000);
    rollSection("setting", settings, "setting-icon", "setting-text", lockState, 1100);
    rollSection("mechanic", mechanics, "mechanic-icon", "mechanic-text", lockState, 1200);
    rollSection("twist", twists, "twist-icon", "twist-text", lockState, 1300);
});

// Select the generate button
const generateButton = document.getElementById("generate-idea-btn");

// Button Click Effect - Temporary Press Animation
generateButton.addEventListener("mousedown", () => {
    generateButton.classList.add("active");
});

generateButton.addEventListener("mouseup", () => {
    generateButton.classList.remove("active");
});
