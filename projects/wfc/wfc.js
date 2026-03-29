const canvas = document.getElementById('wfcCanvas');
const ctx = canvas.getContext('2d');

let DIM = 6;
let tileWidth, tileHeight;
let tiles = [];
let grid = [];
let propagationQueue = [];

// App State
let isAutoRunning = false;
let isComplete = false;
let animationSpeed = 5;

const statusLabel = document.getElementById('statusLabel');

// Flowchart helper
function setActiveFlowStep(stepId) {
    document.querySelectorAll('.flow-step').forEach(el => el.classList.remove('active'));
    if (stepId) {
        const el = document.getElementById(stepId);
        if (el) el.classList.add('active');
    }
}

// --- Tile Creation (Cute Pastel Style) ---
class Tile {
    constructor(img, edges) {
        this.img = img;
        this.edges = edges; // [UP, RIGHT, DOWN, LEFT]

        this.up = edges[0];
        this.right = edges[1];
        this.down = edges[2];
        this.left = edges[3];
    }

    rotate(num) {
        const c = document.createElement('canvas');
        c.width = this.img.width;
        c.height = this.img.height;
        const x = c.getContext('2d');
        x.translate(c.width / 2, c.height / 2);
        x.rotate(num * 90 * Math.PI / 180);
        x.translate(-c.width / 2, -c.height / 2);
        x.drawImage(this.img, 0, 0);

        const newEdges = [];
        const len = this.edges.length;
        for (let i = 0; i < len; i++) {
            newEdges[i] = this.edges[(i - num + len) % len];
        }
        return new Tile(c, newEdges);
    }
}

function createCuteTiles() {
    const s = 100; // high res for crispness
    const gen = (drawFn) => {
        const c = document.createElement('canvas');
        c.width = s; c.height = s;
        const x = c.getContext('2d');

        // Base Grass
        x.fillStyle = '#bbf7d0'; // Pastel green
        x.fillRect(0, 0, s, s);

        // Path settings
        x.lineWidth = 36;
        x.strokeStyle = '#fed7aa'; // Pastel peach/dirt
        x.lineCap = 'round';
        x.lineJoin = 'round';

        drawFn(x, s);

        // Add subtle cute details (dots for flowers)
        x.fillStyle = '#fca5a5'; // pink flower
        x.beginPath(); x.arc(s * 0.2, s * 0.2, 4, 0, Math.PI * 2); x.fill();
        x.fillStyle = '#fde047'; // yellow flower
        x.beginPath(); x.arc(s * 0.8, s * 0.8, 5, 0, Math.PI * 2); x.fill();

        return c;
    }

    const blank = gen(() => { });

    const up = gen((x, s) => {
        x.beginPath(); x.moveTo(s / 2, s / 2); x.lineTo(s / 2, 0); x.stroke();
        x.beginPath(); x.arc(s / 2, s / 2, 18, 0, Math.PI * 2); x.fillStyle = '#fed7aa'; x.fill();
    });

    const line = gen((x, s) => {
        x.beginPath(); x.moveTo(s / 2, 0); x.lineTo(s / 2, s); x.stroke();
    });

    const corner = gen((x, s) => {
        x.beginPath(); x.moveTo(s / 2, 0); x.lineTo(s / 2, s / 2); x.lineTo(s, s / 2); x.stroke();
    });

    const tjoin = gen((x, s) => {
        x.beginPath(); x.moveTo(s / 2, 0); x.lineTo(s / 2, s); x.stroke();
        x.beginPath(); x.moveTo(s / 2, s / 2); x.lineTo(s, s / 2); x.stroke();
    });

    const cross = gen((x, s) => {
        x.beginPath(); x.moveTo(s / 2, 0); x.lineTo(s / 2, s); x.stroke();
        x.beginPath(); x.moveTo(0, s / 2); x.lineTo(s, s / 2); x.stroke();
    });

    // Connectors: 0=Grass, 1=Path
    return [
        new Tile(blank, [0, 0, 0, 0]),
        new Tile(up, [1, 0, 0, 0]),
        new Tile(line, [1, 0, 1, 0]),
        new Tile(corner, [1, 1, 0, 0]),
        new Tile(tjoin, [1, 1, 1, 0]),
        new Tile(cross, [1, 1, 1, 1])
    ];
}

// --- Side Scroller Tiles (Gravity Based) ---
// Connector Edge Meanings:
// 0: Sky (empty air)
// 1: Grassy Top Surface Horizontal
// 2: Dirt Body
// 3: Water Surface Horizontal
// 4: Deep Water
// 5: Cliff L Vertical (Grass L, Sky R)
// 6: Cliff R Vertical (Sky L, Grass R)
// 7: Underwater L Vertical (Grass/Dirt L, Water R)
// 8: Underwater R Vertical (Water L, Grass/Dirt R)
// 9: Inner Corner L (Dirt Bottom/Left, Sky Top Right)
// 10: Inner Corner R (Dirt Bottom/Right, Sky Top Left)
function createPlatformerTiles() {
    const s = 100;
    const gen = (drawFn) => {
        const c = document.createElement('canvas');
        c.width = s; c.height = s;
        const x = c.getContext('2d');
        drawFn(x, s);
        return c;
    };

    const skyColor = '#bae6fd'; // pastel sky
    const dirtColor = '#78350f'; // dirt brown
    const grassColor = '#22c55e'; // vivid green
    const waterSurfColor = '#38bdf8'; // light blue
    const waterDeepColor = '#0284c7'; // deep blue

    const drawSky = (x, s) => {
        x.fillStyle = skyColor; x.fillRect(0, 0, s, s);
        x.fillStyle = 'rgba(255,255,255,0.3)';
        x.beginPath(); x.arc(s * 0.2, s * 0.2, 10, 0, Math.PI * 2); x.fill();
        x.beginPath(); x.arc(s * 0.35, s * 0.2, 12, 0, Math.PI * 2); x.fill();
    };

    const drawDirt = (x, s) => {
        x.fillStyle = dirtColor; x.fillRect(0, 0, s, s);
        x.fillStyle = '#451a03'; // dark specs
        x.fillRect(s * 0.2, s * 0.4, 15, 10);
        x.fillRect(s * 0.7, s * 0.8, 20, 15);
        x.fillRect(s * 0.8, s * 0.2, 12, 12);
    };

    const drawGrass = (x, s) => {
        drawDirt(x, s);
        x.fillStyle = skyColor; x.fillRect(0, 0, s, s / 3);
        x.fillStyle = grassColor; x.fillRect(0, s / 3, s, s / 5);
        x.beginPath(); x.moveTo(0, s / 3);
        x.lineTo(s * 0.2, s / 3 - 8); x.lineTo(s * 0.4, s / 3);
        x.lineTo(s * 0.6, s / 3 - 12); x.lineTo(s * 0.8, s / 3 - 4);
        x.lineTo(s, s / 3); x.fillStyle = grassColor; x.fill();
    };

    // 1. Sky
    const t01 = gen(drawSky);

    // 2. Surface Grass
    const t02 = gen(drawGrass);

    // 3. Deep Dirt
    const t03 = gen(drawDirt);

    // 4. Water Surf
    const t04 = gen((x, s) => {
        x.fillStyle = skyColor; x.fillRect(0, 0, s, s / 3);
        x.fillStyle = waterSurfColor; x.fillRect(0, s / 3, s, s * 2 / 3);
        x.fillStyle = 'rgba(255,255,255,0.4)';
        x.fillRect(s * 0.2, s / 3 + 10, 20, 3);
        x.fillRect(s * 0.6, s / 3 + 20, 15, 3);
    });

    // 5. Water Deep
    const t05 = gen((x, s) => {
        x.fillStyle = waterDeepColor; x.fillRect(0, 0, s, s);
        x.fillStyle = 'rgba(255,255,255,0.2)';
        x.beginPath(); x.arc(s * 0.3, s * 0.5, 4, 0, Math.PI * 2); x.fill();
        x.beginPath(); x.arc(s * 0.7, s * 0.8, 6, 0, Math.PI * 2); x.fill();
    });

    // 6. Cliff L (Grass L, Sky R)
    const t06 = gen((x, s) => {
        drawSky(x, s);
        x.fillStyle = dirtColor; x.fillRect(0, s / 3, s / 2, s * 2 / 3);
        x.fillStyle = grassColor; x.fillRect(0, s / 3, s / 2, s / 5);
        x.fillRect(s / 2 - 5, s / 3, 5, s / 5 + 10);
    });

    // 7. Cliff Body L (Dirt L, Sky R)
    const t07 = gen((x, s) => {
        drawSky(x, s);
        x.fillStyle = dirtColor; x.fillRect(0, 0, s / 2, s);
    });

    // 8. Cliff R (Sky L, Grass R)
    const t08 = gen((x, s) => {
        drawSky(x, s);
        x.fillStyle = dirtColor; x.fillRect(s / 2, s / 3, s / 2, s * 2 / 3);
        x.fillStyle = grassColor; x.fillRect(s / 2, s / 3, s / 2, s / 5);
        x.fillRect(s / 2, s / 3, 5, s / 5 + 10);
    });

    // 9. Cliff Body R (Sky L, Dirt R)
    const t09 = gen((x, s) => {
        drawSky(x, s);
        x.fillStyle = dirtColor; x.fillRect(s / 2, 0, s / 2, s);
    });

    // 10. Shore L (Grass L, Water Surf R)
    const t10 = gen((x, s) => {
        x.fillStyle = skyColor; x.fillRect(0, 0, s, s / 3);
        x.fillStyle = dirtColor; x.fillRect(0, s / 3, s / 2, s * 2 / 3);
        x.fillStyle = grassColor; x.fillRect(0, s / 3, s / 2, s / 5);
        x.fillStyle = waterSurfColor; x.fillRect(s / 2, s / 3, s / 2, s * 2 / 3);
    });

    // 11. Underwater L (Dirt L, Water Deep R)
    const t11 = gen((x, s) => {
        x.fillStyle = waterDeepColor; x.fillRect(s / 2, 0, s / 2, s);
        x.fillStyle = dirtColor; x.fillRect(0, 0, s / 2, s);
    });

    // 12. Shore R (Water Surf L, Grass R)
    const t12 = gen((x, s) => {
        x.fillStyle = skyColor; x.fillRect(0, 0, s, s / 3);
        x.fillStyle = waterSurfColor; x.fillRect(0, s / 3, s / 2, s * 2 / 3);
        x.fillStyle = dirtColor; x.fillRect(s / 2, s / 3, s / 2, s * 2 / 3);
        x.fillStyle = grassColor; x.fillRect(s / 2, s / 3, s / 2, s / 5);
    });

    // 13. Underwater R (Water Deep L, Dirt R)
    const t13 = gen((x, s) => {
        x.fillStyle = waterDeepColor; x.fillRect(0, 0, s / 2, s);
        x.fillStyle = dirtColor; x.fillRect(s / 2, 0, s / 2, s);
    });

    // 14. Inner Corner L (Bottom of Cliff L connecting to Surface Grass)
    // Sky is top right. Wall is left. Ground is bottom right.
    const t14 = gen((x, s) => {
        drawSky(x, s);
        x.fillStyle = dirtColor;
        x.fillRect(0, 0, s / 2, s); // left wall block
        x.fillRect(s / 2, s / 3, s / 2, s * 2 / 3); // floor right block
        x.fillStyle = grassColor;
        // Inner elbow patch
        x.beginPath(); x.moveTo(s / 2, 0); x.lineTo(s * 0.6, 0);
        x.lineTo(s * 0.6, s / 3); x.lineTo(s, s / 3); x.lineTo(s, s / 3 + s / 5);
        x.lineTo(s / 2, s / 3 + s / 5); x.fill();
        x.fillRect(s / 2 - 5, 0, 5, s / 3 + s / 5); // vertical trim
    });

    // 15. Inner Corner R (Bottom of Cliff R connecting to Surface Grass)
    // Sky is top left. Wall is right. Ground is bottom left.
    const t15 = gen((x, s) => {
        drawSky(x, s);
        x.fillStyle = dirtColor;
        x.fillRect(s / 2, 0, s / 2, s); // right wall block
        x.fillRect(0, s / 3, s / 2, s * 2 / 3); // floor left block
        x.fillStyle = grassColor;
        // Inner elbow patch
        x.beginPath(); x.moveTo(s / 2, 0); x.lineTo(s * 0.4, 0);
        x.lineTo(s * 0.4, s / 3); x.lineTo(0, s / 3); x.lineTo(0, s / 3 + s / 5);
        x.lineTo(s / 2, s / 3 + s / 5); x.fill();
        x.fillRect(s / 2, 0, 5, s / 3 + s / 5); // vertical trim
    });

    // EDGES: UP, RIGHT, DOWN, LEFT
    return [
        new Tile(t01, [0, 0, 0, 0]),
        new Tile(t02, [0, 1, 2, 1]),
        new Tile(t03, [2, 2, 2, 2]),
        new Tile(t04, [0, 3, 4, 3]),
        new Tile(t05, [4, 4, 4, 4]),

        new Tile(t06, [0, 0, 5, 1]),   // Top of Left Cliff
        new Tile(t07, [5, 0, 5, 2]),   // Body of Left Cliff
        new Tile(t14, [5, 1, 2, 2]),   // Bottom of Left Cliff (Inner Corner)

        new Tile(t08, [0, 1, 6, 0]),   // Top of Right Cliff
        new Tile(t09, [6, 2, 6, 0]),   // Body of Right Cliff
        new Tile(t15, [6, 2, 2, 1]),   // Bottom of Right Cliff (Inner Corner)

        new Tile(t10, [0, 3, 7, 1]),
        new Tile(t11, [7, 4, 7, 2]),

        new Tile(t12, [0, 1, 8, 3]),
        new Tile(t13, [8, 2, 8, 4])
    ];
}

function loadTileset(type) {
    tiles = [];
    if (type === 'topdown') {
        const bt = createCuteTiles();
        tiles.push(bt[0]); // blank
        for (let i = 0; i < 4; i++) tiles.push(bt[1].rotate(i)); // up
        tiles.push(bt[2]); tiles.push(bt[2].rotate(1)); // line vertical & horizontal
        for (let i = 0; i < 4; i++) tiles.push(bt[3].rotate(i)); // corner
        for (let i = 0; i < 4; i++) tiles.push(bt[4].rotate(i)); // tjoin
        tiles.push(bt[5]); // cross
    } else if (type === 'sidescroller') {
        // No rotations used, strictly 3 tiles with exact gravity definitions.
        tiles = createPlatformerTiles();
    }
}

// --- Grid Logic ---
class Cell {
    constructor(numTiles) {
        this.collapsed = false;
        this.options = Array.from({ length: numTiles }, (_, i) => i);
        this.animating = 0; // frames remaining for flash
        this.animColor = '#3b82f6';
    }
}

function resetGrid() {
    DIM = parseInt(document.getElementById('sSize').value);

    const wrap = document.querySelector('.canvas-wrap');
    const maxSize = Math.min(wrap.clientWidth - 40, wrap.clientHeight - 40);

    // Snap to exact multiple for crisp rendering
    canvas.width = Math.floor(maxSize / DIM) * DIM;
    canvas.height = canvas.width;

    tileWidth = canvas.width / DIM;
    tileHeight = canvas.height / DIM;

    grid = [];
    for (let i = 0; i < DIM * DIM; i++) {
        grid.push(new Cell(tiles.length));
    }

    propagationQueue = [];
    isAutoRunning = false;
    isComplete = false;

    updateStatus("READY", "ready");
    setActiveFlowStep('step-idle');
}

let mx = -1, my = -1;
let hoveredCellIdx = -1;
let hoveredOptionIdx = -1;

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mx = e.clientX - rect.left;
    my = e.clientY - rect.top;

    const cx = Math.floor(mx / tileWidth);
    const cy = Math.floor(my / tileHeight);

    if (cx >= 0 && cx < DIM && cy >= 0 && cy < DIM) {
        hoveredCellIdx = cx + cy * DIM;

        let cell = grid[hoveredCellIdx];
        if (!cell.collapsed) {
            const cols = Math.ceil(Math.sqrt(tiles.length));
            const iconSize = (tileWidth - 10) / cols;

            const localX = mx - cx * tileWidth - 5;
            const localY = my - cy * tileHeight - 5;

            const ocol = Math.floor(localX / iconSize);
            const orow = Math.floor(localY / iconSize);
            const optIdx = ocol + orow * cols;

            if (cell.options.includes(optIdx)) {
                hoveredOptionIdx = optIdx;
            } else {
                hoveredOptionIdx = -1;
            }
        } else {
            hoveredOptionIdx = -1;
        }
    } else {
        hoveredCellIdx = -1;
        hoveredOptionIdx = -1;
    }
});

canvas.addEventListener('mouseleave', () => {
    hoveredCellIdx = -1;
    hoveredOptionIdx = -1;
});

canvas.addEventListener('mousedown', () => {
    if (hoveredCellIdx !== -1 && hoveredOptionIdx !== -1 && !isAutoRunning && !isComplete) {
        let cell = grid[hoveredCellIdx];
        if (!cell.collapsed) {
            cell.options = [hoveredOptionIdx];
            cell.collapsed = true;
            cell.animating = 45; // Flash duration
            cell.animColor = '#d946ef'; // pink highlight for user click

            propagationQueue.push(hoveredCellIdx);
            updateStatus("PROPAGATING...", "working");
            setActiveFlowStep('step-collapse');
        }
    }
});

function propagateStep() {
    if (propagationQueue.length === 0) return false;

    setActiveFlowStep('step-propagate');

    let currentIdx = propagationQueue.shift();
    let currentCell = grid[currentIdx];
    let currentOptions = currentCell.options;

    const x = currentIdx % DIM;
    const y = Math.floor(currentIdx / DIM);

    const neighbors = [
        { dx: 0, dy: -1, dir: 0, opp: 2 }, // Up
        { dx: 1, dy: 0, dir: 1, opp: 3 }, // Right
        { dx: 0, dy: 1, dir: 2, opp: 0 }, // Down
        { dx: -1, dy: 0, dir: 3, opp: 1 }  // Left
    ];

    for (let n of neighbors) {
        let nx = x + n.dx;
        let ny = y + n.dy;

        if (nx >= 0 && nx < DIM && ny >= 0 && ny < DIM) {
            let neighborIdx = nx + ny * DIM;
            let neighbor = grid[neighborIdx];

            if (!neighbor.collapsed) {
                let originalLen = neighbor.options.length;

                neighbor.options = neighbor.options.filter(nOpt => {
                    let nEdge = tiles[nOpt].edges[n.opp];
                    return currentOptions.some(cOpt => tiles[cOpt].edges[n.dir] === nEdge);
                });

                if (neighbor.options.length === 0) {
                    updateStatus("CONTRADICTION", "failed");
                    isAutoRunning = false;
                    propagationQueue = [];

                    // Mark contradiction clearly
                    neighbor.animating = 100;
                    neighbor.animColor = '#ef4444'; // red
                    return false;
                }

                if (neighbor.options.length < originalLen) {
                    neighbor.animating = 30; // Flash for update
                    neighbor.animColor = '#3b82f6'; // blue

                    if (neighbor.options.length === 1 && !neighbor.collapsed) {
                        neighbor.collapsed = true;
                        neighbor.animColor = '#10b981'; // green for auto-collapse
                        neighbor.animating = 45;
                    }

                    if (!propagationQueue.includes(neighborIdx)) {
                        propagationQueue.push(neighborIdx);
                    }
                }
            }
        }
    }

    return true;
}

function checkComplete() {
    setActiveFlowStep('step-check');

    if (grid.every(c => c.collapsed || c.options.length === 0)) {
        isComplete = true;
        isAutoRunning = false;

        let hasFail = grid.some(c => c.options.length === 0);
        if (hasFail) updateStatus("FAILED", "failed");
        else updateStatus("COMPLETE", "done");
    } else if (propagationQueue.length === 0 && !isAutoRunning) {
        updateStatus("READY", "ready");
        setTimeout(() => setActiveFlowStep('step-idle'), 500);
    }
}

function autoPick() {
    setActiveFlowStep('step-entropy');

    let uncollapsed = grid.map((c, i) => ({ c, i })).filter(o => !o.c.collapsed);
    if (uncollapsed.length === 0) return;

    uncollapsed.sort((a, b) => a.c.options.length - b.c.options.length);
    let minLen = uncollapsed[0].c.options.length;
    let minCells = uncollapsed.filter(o => o.c.options.length === minLen);

    let target = minCells[Math.floor(Math.random() * minCells.length)];
    let pick = target.c.options[Math.floor(Math.random() * target.c.options.length)];

    target.c.options = [pick];
    target.c.collapsed = true;
    target.c.animating = 45;
    target.c.animColor = '#10b981'; // green for ai pick

    propagationQueue.push(target.i);
    updateStatus("AUTO RUNNING...", "working");

    setTimeout(() => setActiveFlowStep('step-collapse'), 200);
}

let lastTime = 0;
function drawLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;

    animationSpeed = parseInt(document.getElementById('sSpeed').value);

    if (isAutoRunning && propagationQueue.length === 0 && !isComplete) {
        autoPick();
    }

    // Time-based step logic
    // Speed 1: ~500ms per step
    // Speed 5: ~100ms per step
    // Speed 10: instant (process multiple per frame)

    let timePerStep = (11 - animationSpeed) * 50;

    if (animationSpeed >= 10) {
        // process 10 steps per frame
        for (let i = 0; i < 10; i++) {
            if (propagationQueue.length > 0) propagateStep();
        }
        lastTime = timestamp;
    } else {
        if (dt > timePerStep && propagationQueue.length > 0) {
            let steps = Math.floor(dt / timePerStep);
            for (let i = 0; i < steps; i++) {
                if (propagationQueue.length > 0) propagateStep();
            }
            lastTime = timestamp;
        }
    }

    if (propagationQueue.length === 0 && !isComplete && !isAutoRunning) {
        checkComplete();
    }

    // --- Rendering ---
    ctx.fillStyle = '#0a0a0b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const iconCols = Math.ceil(Math.sqrt(tiles.length));
    const iconSize = (tileWidth - 10) / iconCols;

    for (let i = 0; i < grid.length; i++) {
        let cell = grid[i];
        let x = (i % DIM) * tileWidth;
        let y = Math.floor(i / DIM) * tileHeight;

        if (cell.collapsed) {
            ctx.drawImage(tiles[cell.options[0]].img, x, y, tileWidth, tileHeight);
        } else {
            // Uncollapsed Cell Background
            ctx.fillStyle = '#18181b';
            ctx.fillRect(x, y, tileWidth, tileHeight);

            ctx.strokeStyle = '#27272a';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, tileWidth, tileHeight);

            // Draw mini options
            for (let o = 0; o < cell.options.length; o++) {
                let optIdx = cell.options[o];
                let ox = x + 5 + (optIdx % iconCols) * iconSize;
                let oy = y + 5 + Math.floor(optIdx / iconCols) * iconSize;

                ctx.globalAlpha = 0.4;
                ctx.drawImage(tiles[optIdx].img, ox, oy, iconSize - 2, iconSize - 2);
                ctx.globalAlpha = 1.0;

                // Highlight hovered
                if (i === hoveredCellIdx && optIdx === hoveredOptionIdx && !isAutoRunning) {
                    ctx.strokeStyle = '#d946ef';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(ox, oy, iconSize - 2, iconSize - 2);

                    // Show full opacity
                    ctx.drawImage(tiles[optIdx].img, ox, oy, iconSize - 2, iconSize - 2);
                }
            }

            // Cell overall highlight
            if (i === hoveredCellIdx && hoveredOptionIdx === -1 && !isAutoRunning) {
                ctx.fillStyle = 'rgba(255,255,255,0.05)';
                ctx.fillRect(x, y, tileWidth, tileHeight);
            }
        }

        // --- Animation Overlays ---
        if (cell.animating > 0) {
            ctx.fillStyle = cell.animColor;
            ctx.globalAlpha = cell.animating / 45; // fade out
            ctx.fillRect(x, y, tileWidth, tileHeight);
            ctx.globalAlpha = 1.0;

            ctx.strokeStyle = cell.animColor;
            ctx.lineWidth = 3;
            ctx.strokeRect(x + 1.5, y + 1.5, tileWidth - 3, tileHeight - 3);

            cell.animating -= 1;
        }
    }

    requestAnimationFrame(drawLoop);
}

function updateStatus(text, type) {
    statusLabel.innerText = text;
    statusLabel.className = `status-indicator ${type}`;
}

document.getElementById('sTileset').onchange = (e) => {
    loadTileset(e.target.value);
    resetGrid();
};
document.getElementById('sSize').oninput = e => { document.getElementById('lblSize').innerText = e.target.value; resetGrid(); };
document.getElementById('sSpeed').oninput = e => { document.getElementById('lblSpeed').innerText = e.target.value; };

document.getElementById('btnAutoStart').onclick = () => { isAutoRunning = !isAutoRunning; checkComplete(); };
document.getElementById('btnStep').onclick = () => {
    if (propagationQueue.length > 0) propagateStep();
    else autoPick();
};
document.getElementById('btnClear').onclick = resetGrid;

window.addEventListener('resize', () => { setTimeout(resetGrid, 100); });

// Start
loadTileset(document.getElementById('sTileset').value || 'topdown');
resetGrid();
requestAnimationFrame(drawLoop);
