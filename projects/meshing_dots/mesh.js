const canvas = document.getElementById('meshCanvas');
const ctx = canvas.getContext('2d');

let width, height;

// === UI Elements ===
const sliders = {
  pointCount: document.getElementById('pointCount'),
  pointSpeed: document.getElementById('pointSpeed'),
  meshOpacity: document.getElementById('meshOpacity'),
};

const sliderValues = {
  pointCountVal: document.getElementById('pointCountVal'),
  pointSpeedVal: document.getElementById('pointSpeedVal'),
  meshOpacityVal: document.getElementById('meshOpacityVal'),
};

const colorTopLeft = document.getElementById('colorTopLeft');
const colorTopRight = document.getElementById('colorTopRight');
const colorBottomLeft = document.getElementById('colorBottomLeft');
const colorBottomRight = document.getElementById('colorBottomRight');

const pointColorPicker = document.getElementById('pointColor');
const lineColorPicker = document.getElementById('lineColor');
const showEdges = document.getElementById('showEdges');
const showMeshCheckbox = document.getElementById('showMesh');
const resetButton = document.getElementById('resetButton');
const toggleButton = document.getElementById('togglePanel');
const controlsPanel = document.getElementById('controls');

// === Points ===
let points = [];
let solidPoints = [];

function resizeCanvas() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
  createSolidEdgePoints();
}

function createSolidEdgePoints() {
  solidPoints = [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: 0, y: height },
    { x: width, y: height },
    { x: width / 2, y: 0 },
    { x: width / 2, y: height },
    { x: 0, y: height / 2 },
    { x: width, y: height / 2 }
  ];
}

function createPoints(count) {
  points = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.5 + Math.random();
    points.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
    });
  }
}

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

canvas.addEventListener('click', (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  addPoint(x, y);
});

function updatePoints() {
  const speed = parseFloat(sliders.pointSpeed.value);

  for (let p of points) {
    p.x += p.vx * speed;
    p.y += p.vy * speed;

    if (p.x < 0 || p.x > width) p.vx *= -1;
    if (p.y < 0 || p.y > height) p.vy *= -1;
  }
}

function draw() {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, width, height);

  if (showMeshCheckbox.checked && points.length >= 3) {
    const allPoints = [...points, ...solidPoints];
    const coords = allPoints.map(p => [p.x, p.y]);
    const delaunay = Delaunator.from(coords);
    const triangles = delaunay.triangles;

    const meshOpacity = parseFloat(sliders.meshOpacity.value);

    for (let i = 0; i < triangles.length; i += 3) {
      const a = triangles[i];
      const b = triangles[i + 1];
      const c = triangles[i + 2];

      const p1 = allPoints[a];
      const p2 = allPoints[b];
      const p3 = allPoints[c];

      ctx.fillStyle = generateGradientColor(p1, p2, p3, meshOpacity);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.closePath();
      ctx.fill();

      if (showEdges.checked) {
        ctx.strokeStyle = lineColorPicker.value;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }

  // Draw floating points
  for (let p of points) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = pointColorPicker.value;
    ctx.fill();
  }
}

function generateGradientColor(p1, p2, p3, alpha = 1) {
  const cx = (p1.x + p2.x + p3.x) / 3;
  const cy = (p1.y + p2.y + p3.y) / 3;

  const fx = cx / width;
  const fy = cy / height;

  const topLeft = hexToRGB(colorTopLeft.value);
  const topRight = hexToRGB(colorTopRight.value);
  const bottomLeft = hexToRGB(colorBottomLeft.value);
  const bottomRight = hexToRGB(colorBottomRight.value);

  const r = blendBilinear(topLeft.r, topRight.r, bottomLeft.r, bottomRight.r, fx, fy);
  const g = blendBilinear(topLeft.g, topRight.g, bottomLeft.g, bottomRight.g, fx, fy);
  const b = blendBilinear(topLeft.b, topRight.b, bottomLeft.b, bottomRight.b, fx, fy);

  return `rgba(${r},${g},${b},${alpha})`;
}

function hexToRGB(hex) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16)
  };
}

function blendBilinear(tl, tr, bl, br, fx, fy) {
  const top = tl * (1 - fx) + tr * fx;
  const bottom = bl * (1 - fx) + br * fx;
  return Math.round(top * (1 - fy) + bottom * fy);
}

function animate() {
  updatePoints();
  draw();
  requestAnimationFrame(animate);
}

for (const [key, slider] of Object.entries(sliders)) {
  slider.addEventListener('input', () => {
    const valId = key + 'Val';
    sliderValues[valId].innerText = slider.value;

    if (key === 'pointCount') {
      createPoints(parseInt(slider.value));
    }
  });
}

resetButton.addEventListener('click', () => {
  sliders.pointCount.value = 100;
  sliders.pointSpeed.value = 1;
  sliders.meshOpacity.value = 0.5;
  showMeshCheckbox.checked = true;

  colorTopLeft.value = '#ff0000';
  colorTopRight.value = '#00ff00';
  colorBottomLeft.value = '#0000ff';
  colorBottomRight.value = '#ffff00';

  pointColorPicker.value = '#ffffff';
  lineColorPicker.value = '#000000';
  showEdges.checked = false;

  for (const [key, slider] of Object.entries(sliders)) {
    sliderValues[key + 'Val'].innerText = slider.value;
  }

  createPoints(parseInt(sliders.pointCount.value));
});

toggleButton.addEventListener('click', () => {
  const isHidden = controlsPanel.classList.contains('hidden');

  if (isHidden) {
    controlsPanel.classList.remove('hidden');
    toggleButton.innerText = 'Hide Controls';
    toggleButton.classList.remove('minimized');
  } else {
    controlsPanel.classList.add('hidden');
    toggleButton.innerText = 'Show Controls';
    toggleButton.classList.add('minimized');
  }
});

// === Init
window.addEventListener('load', () => {
  resizeCanvas();
  createPoints(parseInt(sliders.pointCount.value));
  animate();
});

window.addEventListener('resize', resizeCanvas);

document.addEventListener('fullscreenchange', () => {
  resizeCanvas();
});
