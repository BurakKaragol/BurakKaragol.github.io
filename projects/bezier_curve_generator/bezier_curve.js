// Canvas selection and context initialization
const canvas = document.getElementById('canvasElement');
const ctx = canvas.getContext('2d');

// HUD elements
const hudDegree = document.getElementById('hudDegree');
const hudT = document.getElementById('hudT');
const tSlider = document.getElementById('tSlider');
const tValDisplay = document.getElementById('tValDisplay');
const speedSlider = document.getElementById('speedSlider');
const speedDisplay = document.getElementById('speedDisplay');
const playBtn = document.getElementById('playBtn');
const resetBtn = document.getElementById('resetBtn');
const presetsGrid = document.getElementById('presetsGrid');

// Display toggles
const chkPolygon = document.getElementById('chkPolygon');
const chkLines = document.getElementById('chkLines');
const chkPoints = document.getElementById('chkPoints');
const chkCurve = document.getElementById('chkCurve');
const chkRepeat = document.getElementById('chkRepeat');
const opacitySlider = document.getElementById('opacitySlider');
const opacityDisplay = document.getElementById('opacityDisplay');

// Simulation settings
let points = [];
let t = 0.5;
let isAnimating = false;
let speed = 1.0;
let lastTime = 0;
let helperOpacity = 0.6;

// Mouse tracking state
let draggedPoint = null;
let hoveredPoint = null;
const POINT_RADIUS = 10;
const HOVER_RADIUS = 15;

// Color palette for intermediate lerp levels (using vibrant theme colors)
const LEVEL_COLORS = [
    '#3da9fc', // Level 0 (Cyan / Control polygon)
    '#ff8c00', // Level 1 (Orange)
    '#ff007f', // Level 2 (Pink / Rose)
    '#00e676', // Level 3 (Green)
    '#a855f7', // Level 4 (Purple)
    '#ec4899', // Level 5 (Magenta)
    '#eab308'  // Level 6+ (Yellow)
];

// Presets definitions (normalized relative to canvas size [800x600])
const PRESETS = {
    cubic: [
        { x: 150, y: 450 },
        { x: 250, y: 150 },
        { x: 550, y: 150 },
        { x: 650, y: 450 }
    ],
    quartic: [
        { x: 100, y: 400 },
        { x: 250, y: 100 },
        { x: 400, y: 500 },
        { x: 550, y: 100 },
        { x: 700, y: 400 }
    ],
    loop: [
        { x: 150, y: 450 },
        { x: 650, y: 150 },
        { x: 650, y: 450 },
        { x: 150, y: 150 }
    ],
    flower: [
        { x: 400, y: 100 },
        { x: 650, y: 200 },
        { x: 200, y: 450 },
        { x: 600, y: 450 },
        { x: 150, y: 200 },
        { x: 400, y: 100 }
    ],
    empty: []
};

// Initialize canvas sizing
function resizeCanvas() {
    const rect = canvas.parentNode.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    // If setting up first time or resetting, load presets or update absolute coordinates
    if (points.length === 0) {
        loadPreset('cubic');
    }
}
window.addEventListener('resize', resizeCanvas);

// Load preset coordinates and scale them to current canvas size
function loadPreset(key) {
    const baseWidth = 800;
    const baseHeight = 600;
    const rawCoords = PRESETS[key] || [];
    
    points = rawCoords.map(pt => ({
        x: (pt.x / baseWidth) * canvas.width,
        y: (pt.y / baseHeight) * canvas.height
    }));
    
    updateMathFormula();
    draw();
}

// Compute De Casteljau interpolation stack hierarchy at current parameter t
function getBezierLevels(pts, tVal) {
    let levels = [pts];
    while (levels[levels.length - 1].length > 1) {
        let current = levels[levels.length - 1];
        let next = [];
        for (let i = 0; i < current.length - 1; i++) {
            next.push({
                x: (1 - tVal) * current[i].x + tVal * current[i + 1].x,
                y: (1 - tVal) * current[i].y + tVal * current[i + 1].y
            });
        }
        levels.push(next);
    }
    return levels;
}

// Evaluate only the final curve coordinate at parameter t
function evaluateBezier(pts, tVal) {
    if (pts.length === 0) return null;
    let temp = [...pts];
    while (temp.length > 1) {
        let next = [];
        for (let i = 0; i < temp.length - 1; i++) {
            next.push({
                x: (1 - tVal) * temp[i].x + tVal * temp[i + 1].x,
                y: (1 - tVal) * temp[i].y + tVal * temp[i + 1].y
            });
        }
        temp = next;
    }
    return temp[0];
}

// Update Equation LaTeX string in sidebar
function updateMathFormula() {
    const n = points.length - 1;
    let formula = '';
    
    if (n < 0) {
        formula = 'No control nodes placed. Double click canvas to add.';
        hudDegree.innerText = 'Order: 0';
    } else if (n === 0) {
        formula = '\\[B(t) = P_0\\]';
        hudDegree.innerText = 'Order: 0 (Constant)';
    } else if (n === 1) {
        formula = '\\[B(t) = (1-t) P_0 + t P_1\\]';
        hudDegree.innerText = 'Order: 1 (Linear)';
    } else if (n === 2) {
        formula = '\\[B(t) = (1-t)^2 P_0 + 2(1-t)t P_1 + t^2 P_2\\]';
        hudDegree.innerText = 'Order: 2 (Quadratic)';
    } else if (n === 3) {
        formula = '\\[B(t) = (1-t)^3 P_0 + 3(1-t)^2 t P_1 + 3(1-t) t^2 P_2 + t^3 P_3\\]';
        hudDegree.innerText = 'Order: 3 (Cubic)';
    } else if (n === 4) {
        formula = '\\[B(t) = (1-t)^4 P_0 + 4(1-t)^3 t P_1 + 6(1-t)^2 t^2 P_2 + 4(1-t) t^3 P_3 + t^4 P_4\\]';
        hudDegree.innerText = 'Order: 4 (Quartic)';
    } else {
        formula = '\\[B(t) = \\sum_{i=0}^{' + n + '} \\binom{' + n + '}{i} (1-t)^{' + n + '-i} t^i P_i\\]';
        hudDegree.innerText = `Order: ${n} (High-degree)`;
    }
    
    document.getElementById('formulaBox').innerHTML = formula;
    if (window.MathJax) {
        MathJax.typesetPromise([document.getElementById('formulaBox')]);
    }
}

// Draw grids, polygons, lines, tracing trail, and points
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 1. Draw grid lines (Blueprint aesthetic)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.lineWidth = 1;
    const gridSpacing = 40;
    for (let x = 0; x < canvas.width; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    if (points.length === 0) return;

    const showPolygon = chkPolygon.checked;
    const showLines = chkLines.checked;
    const showPoints = chkPoints.checked;
    const showCurve = chkCurve.checked;

    // 2. Pre-evaluate levels hierarchy using De Casteljau
    const levels = getBezierLevels(points, t);

    // 3. Draw traced curves (progressive & faint guideline)
    if (showCurve && points.length > 1) {
        const steps = 150;

        // Draw thin background guideline curve from 0 to 1
        ctx.strokeStyle = 'rgba(0, 255, 196, 0.08)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        let first = true;
        for (let i = 0; i <= steps; i++) {
            const stepT = i / steps;
            const pt = evaluateBezier(points, stepT);
            if (pt) {
                if (first) {
                    ctx.moveTo(pt.x, pt.y);
                    first = false;
                } else {
                    ctx.lineTo(pt.x, pt.y);
                }
            }
        }
        ctx.stroke();

        // Draw bold progressive curve from 0 to current t
        if (t > 0.001) {
            ctx.beginPath();
            first = true;
            const currentSteps = Math.ceil(steps * t);
            for (let i = 0; i <= currentSteps; i++) {
                const stepT = (i / currentSteps) * t;
                const pt = evaluateBezier(points, stepT);
                if (pt) {
                    if (first) {
                        ctx.moveTo(pt.x, pt.y);
                        first = false;
                    } else {
                        ctx.lineTo(pt.x, pt.y);
                    }
                }
            }
            ctx.strokeStyle = '#00ffc4';
            ctx.lineWidth = 4.5;
            ctx.shadowBlur = 12;
            ctx.shadowColor = 'rgba(0, 255, 196, 0.6)';
            ctx.stroke();
            ctx.shadowBlur = 0; // Reset shadow
        }
    }

    // Apply helper opacity to intermediate items
    ctx.save();
    ctx.globalAlpha = helperOpacity;

    // 4. Draw control polygon (dashed lines connecting control points)
    if (showPolygon && points.length > 1) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
        ctx.setLineDash([]); // Reset dash
    }

    // 5. Draw intermediate construction lines
    if (showLines) {
        for (let l = 1; l < levels.length - 1; l++) {
            const levelPoints = levels[l];
            const color = LEVEL_COLORS[l % LEVEL_COLORS.length];
            
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(levelPoints[0].x, levelPoints[0].y);
            for (let i = 1; i < levelPoints.length; i++) {
                ctx.lineTo(levelPoints[i].x, levelPoints[i].y);
            }
            ctx.stroke();
        }
    }

    // 6. Draw intermediate nodes (lerped dots)
    if (showPoints) {
        for (let l = 1; l < levels.length - 1; l++) {
            const levelPoints = levels[l];
            const color = LEVEL_COLORS[l % LEVEL_COLORS.length];
            
            ctx.fillStyle = color;
            for (let i = 0; i < levelPoints.length; i++) {
                ctx.beginPath();
                ctx.arc(levelPoints[i].x, levelPoints[i].y, 4, 0, 2 * Math.PI);
                ctx.fill();
            }
        }
    }

    ctx.restore(); // Reset globalAlpha back to 1.0

    // 7. Draw final tracing target point (flashing bloom dot)
    const finalPt = levels[levels.length - 1][0];
    if (finalPt) {
        ctx.fillStyle = '#ff007f';
        ctx.beginPath();
        ctx.arc(finalPt.x, finalPt.y, 7, 0, 2 * Math.PI);
        ctx.fill();
        
        // Pulse ring
        const ringRadius = 7 + Math.sin(Date.now() / 150) * 4;
        ctx.strokeStyle = 'rgba(255, 0, 127, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(finalPt.x, finalPt.y, ringRadius, 0, 2 * Math.PI);
        ctx.stroke();
    }

    // 8. Draw primary control points (draggable handles)
    for (let i = 0; i < points.length; i++) {
        const pt = points[i];
        const isHovered = (hoveredPoint === pt);
        const isDragged = (draggedPoint === pt);
        
        ctx.fillStyle = isDragged ? 'var(--primary-color)' : (isHovered ? 'rgba(61, 169, 252, 0.3)' : 'rgba(255, 255, 255, 0.05)');
        ctx.strokeStyle = isHovered || isDragged ? 'var(--accent-color)' : 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = isHovered || isDragged ? 2.5 : 1.5;
        
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, POINT_RADIUS, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        // Glowing center core for drag handles
        ctx.fillStyle = isHovered || isDragged ? 'var(--accent-color)' : 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 3, 0, 2 * Math.PI);
        ctx.fill();

        // Label P0, P1, etc.
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '11px JetBrains Mono, monospace';
        ctx.fillText(`P${i}`, pt.x - 6, pt.y - 16);
    }
}

// Animation loop
function animate(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const elapsed = timestamp - lastTime;
    lastTime = timestamp;
    
    if (isAnimating) {
        // Increment t based on elapsed time and speed slider
        t += (elapsed / 6000) * speed;
        if (t >= 1.0) {
            if (chkRepeat.checked) {
                t = 0; // Loop around to beginning
            } else {
                t = 1.0;
                isAnimating = false;
                playBtn.innerHTML = '<i class="fa-solid fa-play"></i> Play';
                playBtn.classList.remove('danger');
                playBtn.classList.add('primary');
            }
        }
        
        // Sync HUD & slider values
        tSlider.value = t;
        tValDisplay.innerText = t.toFixed(2);
        hudT.innerText = t.toFixed(3);
        
        draw();
    }
    
    requestAnimationFrame(animate);
}

// Coordinate detection helpers
function getMousePos(evt) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

function findPointAt(pos) {
    for (let i = 0; i < points.length; i++) {
        const pt = points[i];
        const dist = Math.hypot(pt.x - pos.x, pt.y - pos.y);
        if (dist <= HOVER_RADIUS) {
            return pt;
        }
    }
    return null;
}

// Mouse Event listeners
canvas.addEventListener('mousedown', (evt) => {
    if (evt.button === 0) { // Left click drag
        const mousePos = getMousePos(evt);
        const pt = findPointAt(mousePos);
        if (pt) {
            draggedPoint = pt;
        }
    }
});

canvas.addEventListener('mousemove', (evt) => {
    const mousePos = getMousePos(evt);
    
    if (draggedPoint) {
        // Update drag handle coordinate (clamp to margins)
        draggedPoint.x = Math.max(20, Math.min(canvas.width - 20, mousePos.x));
        draggedPoint.y = Math.max(20, Math.min(canvas.height - 20, mousePos.y));
        draw();
    } else {
        // Check hover states
        const pt = findPointAt(mousePos);
        if (pt !== hoveredPoint) {
            hoveredPoint = pt;
            canvas.style.cursor = hoveredPoint ? 'pointer' : 'default';
            draw();
        }
    }
});

canvas.addEventListener('mouseup', () => {
    draggedPoint = null;
});

canvas.addEventListener('mouseleave', () => {
    draggedPoint = null;
    hoveredPoint = null;
    draw();
});

// Double click to add point
canvas.addEventListener('dblclick', (evt) => {
    evt.preventDefault();
    const mousePos = getMousePos(evt);
    
    // Add point if we did not double click close to an existing point
    if (!findPointAt(mousePos)) {
        points.push({ x: mousePos.x, y: mousePos.y });
        updateMathFormula();
        draw();
    }
});

// Right click to delete point
canvas.addEventListener('contextmenu', (evt) => {
    evt.preventDefault();
    const mousePos = getMousePos(evt);
    const pt = findPointAt(mousePos);
    
    if (pt) {
        points = points.filter(p => p !== pt);
        hoveredPoint = null;
        updateMathFormula();
        draw();
    }
});

// Sliders controls inputs
tSlider.addEventListener('input', (evt) => {
    t = parseFloat(evt.target.value);
    tValDisplay.innerText = t.toFixed(2);
    hudT.innerText = t.toFixed(3);
    draw();
});

speedSlider.addEventListener('input', (evt) => {
    speed = parseFloat(evt.target.value);
    speedDisplay.innerText = speed.toFixed(1) + 'x';
});

// Sidebar buttons logic
playBtn.addEventListener('click', () => {
    isAnimating = !isAnimating;
    if (isAnimating) {
        playBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
        playBtn.classList.remove('primary');
        playBtn.classList.add('danger');
    } else {
        playBtn.innerHTML = '<i class="fa-solid fa-play"></i> Play';
        playBtn.classList.remove('danger');
        playBtn.classList.add('primary');
    }
});

resetBtn.addEventListener('click', () => {
    t = 0;
    tSlider.value = 0;
    tValDisplay.innerText = '0.00';
    hudT.innerText = '0.000';
    
    isAnimating = false;
    playBtn.innerHTML = '<i class="fa-solid fa-play"></i> Play';
    playBtn.classList.remove('danger');
    playBtn.classList.add('primary');
    
    draw();
});

// Toggles checkboxes redraws
[chkPolygon, chkLines, chkPoints, chkCurve].forEach(chk => {
    chk.addEventListener('change', draw);
});

// Opacity slider input listener
opacitySlider.addEventListener('input', (evt) => {
    helperOpacity = parseFloat(evt.target.value);
    opacityDisplay.innerText = Math.round(helperOpacity * 100) + '%';
    draw();
});

// Presets buttons event listeners
presetsGrid.addEventListener('click', (evt) => {
    const btn = evt.target.closest('.preset-btn');
    if (!btn) return;
    
    // Toggle active classes
    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    const key = btn.dataset.preset;
    loadPreset(key);
});

// Initial boot configurations
resizeCanvas();
requestAnimationFrame(animate);
