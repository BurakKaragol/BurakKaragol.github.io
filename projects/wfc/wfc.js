const canvas = document.getElementById('wfcCanvas');
const ctx = canvas.getContext('2d');

let DIM = 20;
let tiles = [];
let grid = [];
let tileWidth, tileHeight;
let isLooping = false;
let isComplete = false;

// Config
const STATUS = document.getElementById('status');

// --- Tile Definition ---
// EDGES: [UP, RIGHT, DOWN, LEFT]
// 0: Empty, 1: Pipe
class Tile {
    constructor(img, edges) {
        this.img = img;
        this.edges = edges;
        this.up = edges[0];
        this.right = edges[1];
        this.down = edges[2];
        this.left = edges[3];
    }

    rotate(num) {
        const newImg = rotateImage(this.img, num);
        const newEdges = [];
        const len = this.edges.length;
        for (let i = 0; i < len; i++) {
            newEdges[i] = this.edges[(i - num + len) % len];
        }
        return new Tile(newImg, newEdges);
    }
}

// Procedurally generate tile images
function createTileImages() {
    const s = 40; // Source size
    const gen = (drawFn) => {
        const c = document.createElement('canvas');
        c.width = s; c.height = s;
        const x = c.getContext('2d');
        x.lineWidth = 4;
        x.strokeStyle = '#00f0ff';
        x.lineCap = 'butt'; // Butt cap for clean joins
        x.shadowBlur = 4;
        x.shadowColor = '#00f0ff';
        drawFn(x, s);
        return c;
    }

    const blank = gen((x, s) => { });
    const up = gen((x, s) => {
        x.beginPath(); x.moveTo(s / 2, s / 2); x.lineTo(s / 2, 0); x.stroke();
        // Dot center
        x.beginPath(); x.arc(s / 2, s / 2, 2, 0, Math.PI * 2); x.fillStyle = '#00f0ff'; x.fill();
    });
    // Line (Up-Down)
    const line = gen((x, s) => {
        x.beginPath(); x.moveTo(s / 2, 0); x.lineTo(s / 2, s); x.stroke();
    });
    // Corner (Up-Right)
    const corner = gen((x, s) => {
        x.beginPath(); x.moveTo(s / 2, 0); x.lineTo(s / 2, s / 2); x.lineTo(s, s / 2); x.stroke();
        x.beginPath(); x.arc(s / 2, s / 2, 2, 0, Math.PI * 2); x.fillStyle = '#00f0ff'; x.fill();
    });
    // T (Up-Right-Down)
    const tjoin = gen((x, s) => {
        x.beginPath(); x.moveTo(s / 2, 0); x.lineTo(s / 2, s); x.stroke();
        x.beginPath(); x.moveTo(s / 2, s / 2); x.lineTo(s, s / 2); x.stroke();
        x.beginPath(); x.arc(s / 2, s / 2, 2, 0, Math.PI * 2); x.fillStyle = '#00f0ff'; x.fill();
    });
    // Cross (All)
    const cross = gen((x, s) => {
        x.beginPath(); x.moveTo(s / 2, 0); x.lineTo(s / 2, s); x.stroke();
        x.beginPath(); x.moveTo(0, s / 2); x.lineTo(s, s / 2); x.stroke();
        x.beginPath(); x.arc(s / 2, s / 2, 3, 0, Math.PI * 2); x.fillStyle = '#fff'; x.fill();
    });

    return [
        new Tile(blank, [0, 0, 0, 0]),
        new Tile(up, [1, 0, 0, 0]),
        new Tile(line, [1, 0, 1, 0]),
        new Tile(corner, [1, 1, 0, 0]),
        new Tile(tjoin, [1, 1, 1, 0]),
        new Tile(cross, [1, 1, 1, 1])
    ];

}

function rotateImage(img, num) {
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext('2d');
    ctx.translate(c.width / 2, c.height / 2);
    ctx.rotate(num * 90 * Math.PI / 180);
    ctx.translate(-c.width / 2, -c.height / 2);
    ctx.drawImage(img, 0, 0);
    return c;
}

// --- Cell Class ---
class Cell {
    constructor(val) {
        this.collapsed = false;
        this.options = new Array(val).fill(0).map((_, i) => i); // Indices of all possible tiles
    }
}

// --- Logic ---
function initTiles() {
    tiles = [];
    const baseTiles = createTileImages();
    // Rotate and push unique
    // Blank (0 rotation needed really, but loop logic handles it)
    tiles.push(baseTiles[0]);

    // Up (needs 4 rotations)
    for (let i = 0; i < 4; i++) tiles.push(baseTiles[1].rotate(i));

    // Line (needs 2 rotations: Vertical, Horizontal)
    tiles.push(baseTiles[2]);
    tiles.push(baseTiles[2].rotate(1));

    // Corner (needs 4 rotations)
    for (let i = 0; i < 4; i++) tiles.push(baseTiles[3].rotate(i));

    // T (needs 4 rotations)
    for (let i = 0; i < 4; i++) tiles.push(baseTiles[4].rotate(i));

    // Cross (1 rotation)
    tiles.push(baseTiles[5]);

    console.log(`Generated ${tiles.length} unique tiles`);
}

function start() {
    DIM = parseInt(document.getElementById('dimSlider').value);

    // Resize canvas to fit window but keep aspect ratio or simple square
    const size = Math.min(window.innerWidth, window.innerHeight) * 0.9;
    canvas.width = size;
    canvas.height = size;
    tileWidth = canvas.width / DIM;
    tileHeight = canvas.height / DIM;

    // Grid
    grid = [];
    for (let i = 0; i < DIM * DIM; i++) {
        grid[i] = new Cell(tiles.length);
    }

    isLooping = true;
    isComplete = false;
    STATUS.innerText = "GENERATING...";
    STATUS.className = "status running";

    loop();
}

function loop() {
    if (!isLooping) return;

    // Draw
    draw();

    // Pick cell with least entropy
    let gridCopy = grid.slice();
    gridCopy = gridCopy.filter(a => !a.collapsed);

    if (gridCopy.length === 0) {
        isLooping = false;
        isComplete = true;
        STATUS.innerText = "COMPLETE";
        STATUS.className = "status done";
        draw(); // Final draw
        return;
    }

    gridCopy.sort((a, b) => a.options.length - b.options.length);
    const len = gridCopy[0].options.length;

    // Found empty possibilities? Stuck.
    if (len === 0) {
        isLooping = false;
        STATUS.innerText = "FAILED (Contradiction)";
        STATUS.className = "status fail";
        return;
    }

    const stopIndex = gridCopy.findIndex(a => a.options.length > len);

    // Random pick among lowest entropy
    const target = gridCopy[Math.floor(Math.random() * (stopIndex > -1 ? stopIndex : gridCopy.length))];
    target.collapsed = true;
    const pick = target.options[Math.floor(Math.random() * target.options.length)];
    target.options = [pick];

    // Propagation
    const stack = [grid.indexOf(target)];

    while (stack.length > 0) {
        let currentIdx = stack.pop();
        let currentCell = grid[currentIdx];
        let currentOptions = currentCell.options;

        const x = currentIdx % DIM;
        const y = Math.floor(currentIdx / DIM);

        // Neighbors: Up, Right, Down, Left
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
                        let nTile = tiles[nOpt];
                        let nEdge = nTile.edges[n.opp]; // Connector looking back at current

                        // Check if ANY current available tile has a matching edge
                        return currentOptions.some(cOpt => {
                            let cTile = tiles[cOpt];
                            let cEdge = cTile.edges[n.dir]; // Connector looking at neighbor
                            return cEdge === nEdge;
                        });
                    });

                    if (neighbor.options.length === 0) {
                        // Contradiction
                        isLooping = false;
                        STATUS.innerText = "FAILED (Contradiction)";
                        STATUS.className = "status fail";
                        return;
                    }

                    if (neighbor.options.length < originalLen) {
                        stack.push(neighborIdx);
                    }
                }
            }
        }
    }

    // Speed control
    const fps = parseInt(document.getElementById('speedSlider').value);
    if (fps >= 60) requestAnimationFrame(loop);
    else setTimeout(loop, 1000 / fps);
}

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const w = tileWidth;
    const h = tileHeight;

    for (let i = 0; i < grid.length; i++) {
        let cell = grid[i];
        let x = (i % DIM) * w;
        let y = Math.floor(i / DIM) * h;

        if (cell.collapsed) {
            let index = cell.options[0];
            ctx.drawImage(tiles[index].img, x, y, w, h);
        } else {
            // Draw entropy shade or grid outline
            ctx.strokeStyle = '#222';
            ctx.strokeRect(x, y, w, h);

            // Opacity based on remaining options
            ctx.fillStyle = `rgba(0, 240, 255, ${1 - (cell.options.length / tiles.length)})`;
            ctx.fillRect(x + w * 0.4, y + h * 0.4, w * 0.2, h * 0.2);
        }
    }
}


// Init
initTiles();
document.getElementById('startBtn').onclick = start;
document.getElementById('resetBtn').onclick = () => { isLooping = false; start(); };
document.getElementById('dimSlider').oninput = function () { document.getElementById('dimVal').innerText = this.value; };
document.getElementById('speedSlider').oninput = function () { document.getElementById('speedVal').innerText = this.value; };
window.addEventListener('resize', () => { if (isLooping && !isComplete) start(); }); // Mobile rotation

// Auto start
setTimeout(start, 500);
