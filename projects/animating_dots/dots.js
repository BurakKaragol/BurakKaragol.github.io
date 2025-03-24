const canvas = document.getElementById('dotCanvas');
const ctx = canvas.getContext('2d');

let width, height;
function resizeCanvas() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let mouse = {
    x: 0,
    y: 0,
    leftHeld: false,
    rightHeld: false
};
  
const dotColorPicker = document.getElementById('dotColor');
const lineColorPicker = document.getElementById('lineColor');

// === Slider Elements ===
const sliders = {
  pointCount: document.getElementById('pointCount'),
  pointSpeed: document.getElementById('pointSpeed'),
  windX: document.getElementById('windX'),
  windY: document.getElementById('windY'),
  pointSize: document.getElementById('pointSize'),
  pointOpacity: document.getElementById('pointOpacity'),
  lineDistance: document.getElementById('lineDistance'),
  lineThickness: document.getElementById('lineThickness'),
  lineOpacity: document.getElementById('lineOpacity'),
};

const sliderValues = {
  pointCountVal: document.getElementById('pointCountVal'),
  pointSpeedVal: document.getElementById('pointSpeedVal'),
  windXVal: document.getElementById('windXVal'),
  windYVal: document.getElementById('windYVal'),
  pointSizeVal: document.getElementById('pointSizeVal'),
  pointOpacityVal: document.getElementById('pointOpacityVal'),
  lineDistanceVal: document.getElementById('lineDistanceVal'),
  lineThicknessVal: document.getElementById('lineThicknessVal'),
  lineOpacityVal: document.getElementById('lineOpacityVal'),
};

document.getElementById('resetButton').addEventListener('click', () => {
    // Reset slider values to defaults
    sliders.pointCount.value = 100;
    sliders.pointSpeed.value = 1;
    sliders.windX.value = 0;
    sliders.windY.value = 0;
    sliders.pointSize.value = 3;
    sliders.pointOpacity.value = 1;
    sliders.lineDistance.value = 100;
    sliders.lineThickness.value = 1;
    sliders.lineOpacity.value = 0.5;
  
    // Reset color pickers
    dotColorPicker.value = '#ffffff';
    lineColorPicker.value = '#ffffff';
  
    // Update labels
    for (const [key, slider] of Object.entries(sliders)) {
      const valId = key + 'Val';
      sliderValues[valId].innerText = slider.value;
    }
  
    // Re-create points with default count
    createPoints(parseInt(sliders.pointCount.value));
});
  
canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) mouse.leftHeld = true;       // Left click
    if (e.button === 2) mouse.rightHeld = true;      // Right click
    });
  
  canvas.addEventListener('mouseup', (e) => {
    if (e.button === 0) mouse.leftHeld = false;
    if (e.button === 2) mouse.rightHeld = false;
  });
  
  // Prevent default context menu on right click
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});
  
canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
  
    addPoint(x, y);
});  

// === Point System ===
let points = [];

function addPoint(x, y) {
    const speed = parseFloat(sliders.pointSpeed.value);
    const angle = Math.random() * Math.PI * 2;
    const velocity = speed * 0.5;
  
    points.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
    });

    sliders.pointCount.value = points.length;
    sliderValues.pointCountVal.innerText = points.length;
}
  
function createPoints(count) {
    points = [];
    for (let i = 0; i < count; i++) {
        points.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5),
            vy: (Math.random() - 0.5),
        });
    }
}

createPoints(parseInt(sliders.pointCount.value));

// === Update Points ===
function updatePoints() {
    const speed = parseFloat(sliders.pointSpeed.value);
    const windX = parseFloat(sliders.windX.value);
    const windY = parseFloat(sliders.windY.value);

    const gravityStrength = 10;

    for (let point of points) {
        point.vx += windX * 0.01;
        point.vy -= windY * 0.01;

        point.x += point.vx * speed;
        point.y += point.vy * speed;

        if (point.x < 0 || point.x > width) point.vx *= -1;
        if (point.y < 0 || point.y > height) point.vy *= -1;
    }

    for (let point of points) {
    // Wind
    point.vx += windX * 0.01;
    point.vy -= windY * 0.01;

    // Gravity / Repulsion
    const dx = mouse.x - point.x;
    const dy = mouse.y - point.y;
    const distSq = dx * dx + dy * dy;

    if ((mouse.leftHeld || mouse.rightHeld) && distSq < 100000000) {
        const force = gravityStrength / (distSq + 10); // Avoid division by zero
        const direction = mouse.leftHeld ? 1 : -1;

        point.vx += direction * dx * force;
        point.vy += direction * dy * force;
    }

    point.x += point.vx * speed;
    point.y += point.vy * speed;

    if (point.x < 0 || point.x > width) point.vx *= -1;
    if (point.y < 0 || point.y > height) point.vy *= -1;
    }
}

// === Draw Points & Lines ===
function draw() {
    ctx.clearRect(0, 0, width, height);

    const pointSize = parseFloat(sliders.pointSize.value);
    const pointOpacity = parseFloat(sliders.pointOpacity.value);
    const lineDist = parseFloat(sliders.lineDistance.value);
    const lineThickness = parseFloat(sliders.lineThickness.value);
    const lineOpacity = parseFloat(sliders.lineOpacity.value);

    const lineColor = lineColorPicker.value;
    const dotColor = dotColorPicker.value;

    // Draw Lines
    for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
        const dx = points[i].x - points[j].x;
        const dy = points[i].y - points[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < lineDist) {
            ctx.beginPath();
            ctx.moveTo(points[i].x, points[i].y);
            ctx.lineTo(points[j].x, points[j].y);
            ctx.strokeStyle = hexToRGBA(lineColor, lineOpacity * (1 - dist / lineDist));
            ctx.lineWidth = lineThickness;
            ctx.stroke();
        }
        }
    }

    // Draw Points
    for (let point of points) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, pointSize, 0, Math.PI * 2);
        ctx.fillStyle = hexToRGBA(dotColor, pointOpacity);
        ctx.fill();
    }
}
  
// === Animation Loop ===
function animate() {
    updatePoints();
    draw();
    requestAnimationFrame(animate);
}

function hexToRGBA(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}  

animate();

// === Handle Slider Changes ===
for (const [key, slider] of Object.entries(sliders)) {
    slider.addEventListener('input', () => {
    const valId = key + 'Val';
    sliderValues[valId].innerText = slider.value;

    if (key === 'pointCount') {
        createPoints(parseInt(slider.value));
    }
    });
}
