/**
 * CONFIGURATION
 */
const canvas = document.getElementById('main-canvas');
const ctx = canvas.getContext('2d');
const statusBadge = document.getElementById('status-badge');

const COLORS = {
    BG: '#25252b',
    UNVISITED: '#555560',
    STACK: '#4a90e2',
    DISCARDED: '#3a2a2a',
    PIVOT: '#f1c40f',
    CURRENT: '#ffffff',
    SCAN_LINE: '#ffffff',
    GOOD: '#50c878',
    BAD: '#e74c3c'
};

const STATE = { UNVISITED: 0, STACK: 1, DISCARDED: 2, PIVOT: 3, CURRENT: 4 };

let points = [];
let hullStack = [];
let isRunning = false;
let animationSpeed = 0.05; 

/**
 * SETUP & RESIZING
 */
function resize() {
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = window.innerWidth * 0.6;
    const displayHeight = window.innerHeight * 0.6;

    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    
    ctx.scale(dpr, dpr);
    drawScene();
}
window.addEventListener('resize', resize);


/**
 * MATH
 */
function crossProduct(o, a, b) {
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}

function distSq(p1, p2) { 
    return (p1.x - p2.x)**2 + (p1.y - p2.y)**2; 
}

/**
 * DRAWING
 */
function clear() {
    const w = parseFloat(canvas.style.width);
    const h = parseFloat(canvas.style.height);
    ctx.fillStyle = COLORS.BG;
    ctx.fillRect(0, 0, w, h);
}

function drawPoint(p) {
    const radius = (p.state === STATE.UNVISITED) ? 4 : 6;
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    
    if (p.state === STATE.PIVOT) ctx.fillStyle = COLORS.PIVOT;
    else if (p.state === STATE.STACK) ctx.fillStyle = COLORS.STACK;
    else if (p.state === STATE.DISCARDED) ctx.fillStyle = COLORS.DISCARDED;
    else if (p.state === STATE.CURRENT) ctx.fillStyle = COLORS.CURRENT;
    else ctx.fillStyle = COLORS.UNVISITED;

    ctx.fill();
    ctx.closePath();

    if (p.state === STATE.STACK || p.state === STATE.PIVOT) {
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}

function drawLine(p1, p2, color, width = 2, dashed = false) {
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    if(dashed) ctx.setLineDash([6, 6]);
    else ctx.setLineDash([]);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawTurnCheck(prev, curr, next, isLeft) {
    const color = isLeft ? COLORS.GOOD : COLORS.BAD;

    // 1. Extension line (where we would have gone)
    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;
    // Length of extension
    const extEnd = { x: curr.x + dx * 0.5, y: curr.y + dy * 0.5 };
    
    drawLine(curr, extEnd, 'rgba(255,255,255,0.3)', 1, true);

    // 2. The check line
    drawLine(curr, next, color, 3);

    // 3. Label
    ctx.font = "bold 14px Inter, sans-serif";
    ctx.fillStyle = color;
    ctx.fillText(isLeft ? "L" : "R", next.x + 10, next.y - 10);
    
    // 4. Arc
    ctx.beginPath();
    ctx.moveTo(curr.x, curr.y);
    const angle1 = Math.atan2(dy, dx);
    const angle2 = Math.atan2(next.y - curr.y, next.x - curr.x);
    ctx.arc(curr.x, curr.y, 20, angle1, angle2, !isLeft);
    ctx.fillStyle = isLeft ? "rgba(80, 200, 120, 0.2)" : "rgba(231, 76, 60, 0.2)";
    ctx.fill();
}

function drawScene(scanLine = null, checkData = null) {
    clear();

    // Draw Hull Connections
    if (hullStack.length > 1) {
        ctx.beginPath();
        ctx.moveTo(hullStack[0].x, hullStack[0].y);
        for (let i = 1; i < hullStack.length; i++) {
            ctx.lineTo(hullStack[i].x, hullStack[i].y);
        }
        ctx.strokeStyle = COLORS.STACK;
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    // Draw Points
    points.forEach(p => drawPoint(p));

    // Draw Active Scanner Line (Lerping)
    if (scanLine) {
        drawLine(scanLine.from, scanLine.to, COLORS.SCAN_LINE, 1, true);
        // Draw endpoints of the scanner to make it clear
        ctx.beginPath();
        ctx.arc(scanLine.from.x, scanLine.from.y, 3, 0, Math.PI*2);
        ctx.arc(scanLine.to.x, scanLine.to.y, 3, 0, Math.PI*2);
        ctx.fillStyle = COLORS.SCAN_LINE;
        ctx.fill();
    }

    // Draw Turn Logic Overlay
    if (checkData) {
        drawTurnCheck(checkData.prev, checkData.curr, checkData.next, checkData.isLeft);
    }
}


/**
 * ANIMATION HELPERS
 */
const wait = (ms) => new Promise(r => setTimeout(r, ms));

// UPDATED: Now supports moving BOTH ends of the line
function animateLineTransition(startFrom, endFrom, startTo, endTo) {
    return new Promise(resolve => {
        let t = 0;
        function loop() {
            t += animationSpeed;
            if (t >= 1) t = 1;

            // Interpolate Origin
            const originX = lerp(startFrom.x, endFrom.x, t);
            const originY = lerp(startFrom.y, endFrom.y, t);
            
            // Interpolate Target
            const targetX = lerp(startTo.x, endTo.x, t);
            const targetY = lerp(startTo.y, endTo.y, t);

            drawScene({ 
                from: {x: originX, y: originY}, 
                to: {x: targetX, y: targetY} 
            });

            if (t < 1) requestAnimationFrame(loop);
            else resolve();
        }
        loop();
    });
}

/**
 * LOGIC
 */
async function runScan() {
    if (points.length < 3) return;
    isRunning = true;
    toggleUI(false);

    // Sort
    points.sort((a, b) => (b.y - a.y) || (a.x - b.x));
    const pivot = points[0];
    pivot.state = STATE.PIVOT;

    let others = points.slice(1);
    others.sort((a, b) => {
        const val = crossProduct(pivot, a, b);
        if (Math.abs(val) < 1e-9) return (distSq(pivot, a) - distSq(pivot, b));
        return val > 0 ? -1 : 1; 
    });
    points = [pivot, ...others];

    // Init Stack
    hullStack = [points[0], points[1]];
    points[0].state = STATE.STACK;
    points[1].state = STATE.STACK;
    
    // Track where the scanner currently is visually
    let currentScannerOrigin = points[0]; // Not used logic-wise, but for animation continuity
    let currentScannerTarget = points[1];

    drawScene();
    await wait(300);

    for (let i = 2; i < points.length; i++) {
        let next = points[i];
        next.state = STATE.CURRENT;
        statusBadge.textContent = `Checking Point ${i}`;
        statusBadge.style.color = COLORS.CURRENT;

        // 1. ANIMATE: Move scanner TARGET to the new candidate
        // Origin stays at Top of Stack. Target moves from Previous Point -> New Candidate
        const topOfStack = hullStack[hullStack.length - 1];
        
        await animateLineTransition(
            topOfStack, topOfStack,        // Origin stays fixed
            currentScannerTarget, next     // Target moves
        );
        currentScannerTarget = next;

        while (hullStack.length > 1) {
            const top = hullStack[hullStack.length - 1];
            const nextToTop = hullStack[hullStack.length - 2];
            
            // CHECK
            const isLeft = crossProduct(nextToTop, top, next) > 0;
            
            statusBadge.textContent = isLeft ? "Left Turn (Keep)" : "Right Turn (Backtrack)";
            statusBadge.style.color = isLeft ? COLORS.GOOD : COLORS.BAD;

            drawScene(null, { prev: nextToTop, curr: top, next: next, isLeft: isLeft });
            await wait(isLeft ? 400 : 800); 

            if (!isLeft) {
                // BACKTRACK LOGIC
                
                // 1. Mark as discarded
                top.state = STATE.DISCARDED;
                hullStack.pop();
                
                // 2. ANIMATE: Move scanner ORIGIN backwards
                // The line was anchored at 'top' (the bad point).
                // It must slide back to be anchored at 'nextToTop' (the new valid point).
                // The target end stays fixed on 'next'.
                
                // Note: We need to redraw the scene without the popped point first (so the hull lines update)
                // but keep the scanner line for the animation
                
                await animateLineTransition(
                    top, nextToTop,    // Origin slides BACK
                    next, next         // Target stays fixed
                );
                
                // Re-loop: Now 'nextToTop' is the new 'top', and we check again.
            } else {
                break; 
            }
        }

        hullStack.push(next);
        next.state = STATE.STACK;
    }

    // Close
    statusBadge.textContent = "Finished";
    statusBadge.style.color = COLORS.STACK;
    
    // Close the loop
    if (hullStack.length > 0) {
        const start = hullStack[hullStack.length-1];
        const end = hullStack[0];
        await animateLineTransition(start, start, start, end);
    }

    drawScene();
    isRunning = false;
    toggleUI(true);
}

// Utils & Inputs
function generate() {
    if(isRunning) return;
    points = [];
    hullStack = [];
    statusBadge.textContent = "Ready";
    statusBadge.style.color = "#999";
    
    const w = parseFloat(canvas.style.width);
    const h = parseFloat(canvas.style.height);
    const pad = 40;

    for(let i=0; i<30; i++) {
        points.push({
            x: Math.random() * (w - pad*2) + pad,
            y: Math.random() * (h - pad*2) + pad,
            state: STATE.UNVISITED
        });
    }
    drawScene();
}

function toggleUI(enabled) {
    document.getElementById('btn-gen').disabled = !enabled;
    document.getElementById('btn-run').disabled = !enabled;
    document.getElementById('btn-reset').disabled = !enabled;
}

document.getElementById('btn-gen').addEventListener('click', generate);
document.getElementById('btn-run').addEventListener('click', runScan);
document.getElementById('btn-reset').addEventListener('click', () => { points = []; hullStack = []; drawScene(); });
document.getElementById('speed-range').addEventListener('input', e => { animationSpeed = parseInt(e.target.value) / 500; });
canvas.addEventListener('mousedown', e => {
    if(isRunning) return;
    const rect = canvas.getBoundingClientRect();
    points.push({ x: e.clientX - rect.left, y: e.clientY - rect.top, state: STATE.UNVISITED });
    drawScene();
});

resize();
generate();