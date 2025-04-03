import { Point, Line } from './modules/shapes.js';
import { snapToGrid, drawGrid } from './modules/utils.js';
import { setupUI } from './modules/ui.js';

const canvas = document.getElementById('drawCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// STATE
let objects = [];
let currentMode = 'select';
let selected = null;
let multiSelected = [];
let dragging = false;
let dragStart = { x: 0, y: 0 };
let dragOffsets = [];
let showGrid = true;
let enableSnap = false;

// Drawing Line
let isDrawingLine = false;
let lineStart = null;
let startPointRef = null;
let currentMouse = { x: 0, y: 0 };

// Selection Box
let isSelecting = false;
let selectionBox = null;

// Defaults
let defaultColors = {
  point: '#00ff88',
  line: '#ffaa00'
};

// DOM
const clearBtn = document.getElementById('clearAll');
const propPanel = document.getElementById('propertiesPanel');
const propX = document.getElementById('propX');
const propY = document.getElementById('propY');
const propColor = document.getElementById('propColor');
const openDefaultsBtn = document.getElementById('openDefaults');
const defaultsPanel = document.getElementById('defaultsPanel');
const defaultPointColor = document.getElementById('defaultPointColor');
const defaultLineColor = document.getElementById('defaultLineColor');
const multiColorInput = document.getElementById('multiColorInput');
const multiColorLabel = document.getElementById('multiColorLabel');

// UI SETUP
setupUI(mode => currentMode = mode, () => showGrid = !showGrid, () => enableSnap = !enableSnap);

// Defaults Panel
// Make the button toggle the visibility of the Defaults Panel
openDefaultsBtn.addEventListener('click', () => {
    const isOpen = !defaultsPanel.classList.contains('hidden');
  
    if (isOpen) {
      defaultsPanel.classList.add('hidden');
    } else {
      defaultPointColor.value = defaultColors.point;
      defaultLineColor.value = defaultColors.line;
      defaultsPanel.classList.remove('hidden');
    }
  });
defaultPointColor.addEventListener('input', () => defaultColors.point = defaultPointColor.value);
defaultLineColor.addEventListener('input', () => defaultColors.line = defaultLineColor.value);

function updatePropertyPanel() {
    if (multiSelected.length === 1) {
      selected = multiSelected[0];
  
      if (selected instanceof Point) {
        propX.parentElement.style.display = '';
        propY.parentElement.style.display = '';
        propX.value = Math.round(selected.x);
        propY.value = Math.round(selected.y);
        propColor.value = selected.color;
      } else {
        propX.parentElement.style.display = 'none';
        propY.parentElement.style.display = 'none';
        propColor.value = selected.color;
      }
  
      propColor.parentElement.style.display = '';
      multiColorLabel.classList.add('hidden');
      propPanel.classList.remove('hidden');
  
    } else if (multiSelected.length > 1) {
      selected = null;
      propX.parentElement.style.display = 'none';
      propY.parentElement.style.display = 'none';
      propColor.parentElement.style.display = 'none';
  
      const first = multiSelected.find(obj => 'color' in obj);
      multiColorInput.value = first?.color || '#ffffff';
  
      multiColorLabel.classList.remove('hidden');
      propPanel.classList.remove('hidden');
  
    } else {
      selected = null;
      propPanel.classList.add('hidden');
    }
  }
  

// Clear with confirmation
let clearConfirm = false;
let clearTimer = null;
clearBtn.addEventListener('click', () => {
  if (!clearConfirm) {
    clearBtn.classList.add('confirming');
    clearBtn.textContent = 'Click again to confirm';
    clearConfirm = true;
    clearTimer = setTimeout(() => {
      clearBtn.textContent = 'Clear Everything';
      clearBtn.classList.remove('confirming');
      clearConfirm = false;
    }, 2000);
    return;
  }

  clearConfirm = false;
  clearBtn.textContent = 'Clear Everything';
  clearBtn.classList.remove('confirming');
  clearTimeout(clearTimer);
  objects = [];
  selected = null;
  multiSelected = [];
  propPanel.classList.add('hidden');
});

// MOUSE EVENTS
canvas.addEventListener('mousedown', e => {
  const x = e.clientX;
  const y = e.clientY;
  const pos = enableSnap ? snapToGrid(x, y, 20) : { x, y };
  const shift = e.shiftKey;

  if (currentMode === 'select') {
    let hit = objects.find(obj => obj instanceof Point && obj.isHit(x, y)) ||
              objects.find(obj => obj instanceof Line && obj.isHit(x, y));

    if (hit) {
      const alreadySelected = multiSelected.includes(hit);
      if (shift && !alreadySelected) multiSelected.push(hit);
      else if (!shift) multiSelected = [hit];

      selected = hit;
      dragging = true;
      dragStart = { x, y };

      if (!multiSelected.includes(hit)) multiSelected.push(hit);

      dragOffsets = multiSelected.map(obj => ({
        obj,
        dx: x - (obj.x ?? 0),
        dy: y - (obj.y ?? 0)
      }));

      if (hit instanceof Point) {
        propX.parentElement.style.display = '';
        propY.parentElement.style.display = '';
        propX.value = Math.round(hit.x);
        propY.value = Math.round(hit.y);
        propColor.value = hit.color;
      } else {
        propX.parentElement.style.display = 'none';
        propY.parentElement.style.display = 'none';
        propColor.value = hit.color;
      }

      propPanel.classList.remove('hidden');
      return;
    }

    isSelecting = true;
    selectionBox = { startX: x, startY: y, x, y };
    if (!shift) multiSelected = [];
    selected = null;
    propPanel.classList.add('hidden');
    return;
  }

  if (currentMode === 'point') {
    const hitPoint = objects.find(obj => obj instanceof Point && obj.isHit(x, y));
    if (hitPoint) {
      currentMode = 'select';
      document.querySelectorAll('.modeBtn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.mode === 'select') btn.classList.add('active');
      });
      selected = hitPoint;
      multiSelected = [hitPoint];
      dragging = true;
      dragStart = { x, y };
      dragOffsets = [{ obj: hitPoint, dx: x - hitPoint.x, dy: y - hitPoint.y }];
      propX.value = Math.round(hitPoint.x);
      propY.value = Math.round(hitPoint.y);
      propColor.value = hitPoint.color;
      propPanel.classList.remove('hidden');
      return;
    }

    const hitLine = objects.find(obj => obj instanceof Line && obj.isHit(x, y));
    if (hitLine) {
      const newPoint = new Point(pos.x, pos.y);
      newPoint.color = defaultColors.point;
      const index = objects.indexOf(hitLine);
      objects.splice(index, 1);
      const l1 = new Line(hitLine.p1, newPoint);
      const l2 = new Line(newPoint, hitLine.p2);
      l1.color = hitLine.color;
      l2.color = hitLine.color;
      objects.push(newPoint, l1, l2);
      return;
    }

    const newPoint = new Point(pos.x, pos.y);
    newPoint.color = defaultColors.point;
    objects.push(newPoint);
  }

  if (currentMode === 'line') {
    isDrawingLine = true;
    const hitPoint = objects.find(obj => obj instanceof Point && obj.isHit(x, y));
    const hitLine = objects.find(obj => obj instanceof Line && obj.isHit(x, y));

    if (hitPoint) {
      startPointRef = hitPoint;
      lineStart = { x: hitPoint.x, y: hitPoint.y };
    } else if (hitLine) {
      const splitPoint = new Point(pos.x, pos.y);
      splitPoint.color = defaultColors.point;
      const index = objects.indexOf(hitLine);
      objects.splice(index, 1);
      const l1 = new Line(hitLine.p1, splitPoint);
      const l2 = new Line(splitPoint, hitLine.p2);
      l1.color = hitLine.color;
      l2.color = hitLine.color;
      objects.push(splitPoint, l1, l2);
      startPointRef = splitPoint;
      lineStart = pos;
    } else {
      const newPoint = new Point(pos.x, pos.y);
      newPoint.color = defaultColors.point;
      objects.push(newPoint);
      startPointRef = newPoint;
      lineStart = pos;
    }
  }
});

canvas.addEventListener('mousemove', e => {
  const x = e.clientX;
  const y = e.clientY;
  currentMouse = { x, y };

  if (dragging && multiSelected.length) {
    for (let i = 0; i < multiSelected.length; i++) {
      const { obj, dx, dy } = dragOffsets[i];
      if (obj instanceof Point) {
        const pos = enableSnap ? snapToGrid(x - dx, y - dy, 20) : { x: x - dx, y: y - dy };
        obj.x = pos.x;
        obj.y = pos.y;
      }
    }
    if (multiSelected.length === 1) {
      propX.value = Math.round(multiSelected[0].x);
      propY.value = Math.round(multiSelected[0].y);
    }
  }

  if (isSelecting && selectionBox) {
    selectionBox.x = x;
    selectionBox.y = y;
  }
});

canvas.addEventListener('mouseup', e => {
  dragging = false;

  if (isSelecting && selectionBox) {
    const { startX, startY, x, y } = selectionBox;
    const [minX, maxX] = [Math.min(startX, x), Math.max(startX, x)];
    const [minY, maxY] = [Math.min(startY, y), Math.max(startY, y)];
    const newSelections = objects.filter(obj => {
        if (obj instanceof Point) {
          return obj.x >= minX && obj.x <= maxX && obj.y >= minY && obj.y <= maxY;
        } else if (obj instanceof Line) {
          const { x1, y1, x2, y2 } = obj.bounds();
          return (
            x1 >= minX && x2 <= maxX &&
            y1 >= minY && y2 <= maxY
          );
        }
        return false;
      });          
    for (const p of newSelections) {
      if (!multiSelected.includes(p)) multiSelected.push(p);
    }
    isSelecting = false;
    selectionBox = null;
    updatePropertyPanel();
  }

  if (!isSelecting && !isDrawingLine && multiSelected.length > 0) {
    resolvePointCollisions(multiSelected);
  }

  updatePropertyPanel();

  if (isDrawingLine && lineStart && startPointRef) {
    const x = e.clientX;
    const y = e.clientY;
    const pos = enableSnap ? snapToGrid(x, y, 20) : { x, y };
    const dist = Math.hypot(pos.x - lineStart.x, pos.y - lineStart.y);

    if (dist < 5) return;

    let endPointRef = null;
    const hitPoint = objects.find(obj => obj instanceof Point && obj.isHit(x, y));
    const hitLine = objects.find(obj => obj instanceof Line && obj.isHit(x, y));

    if (hitPoint) {
      endPointRef = hitPoint;
    } else if (hitLine) {
      const split = new Point(pos.x, pos.y);
      split.color = defaultColors.point;
      const i = objects.indexOf(hitLine);
      if (i !== -1) objects.splice(i, 1);
      const l1 = new Line(hitLine.p1, split);
      const l2 = new Line(split, hitLine.p2);
      l1.color = hitLine.color;
      l2.color = hitLine.color;
      objects.push(split, l1, l2);
      endPointRef = split;
    } else {
      const np = new Point(pos.x, pos.y);
      np.color = defaultColors.point;
      objects.push(np);
      endPointRef = np;
    }

    const line = new Line(startPointRef, endPointRef);
    line.color = defaultColors.line;
    objects.push(line);

    isDrawingLine = false;
    startPointRef = null;
    lineStart = null;
  }
});

multiColorInput.addEventListener('input', () => {
    const color = multiColorInput.value;
  
    for (const shape of multiSelected) {
      if (shape instanceof Point || shape instanceof Line) {
        shape.color = color;
      }
    }
  
    requestAnimationFrame(animate);
  });  

// PROPERTIES PANEL
propColor.addEventListener('input', () => {
  if (selected) selected.color = propColor.value;
});
[propX, propY].forEach(input => {
  input.addEventListener('input', () => {
    if (selected instanceof Point) {
      selected.x = parseFloat(propX.value) || selected.x;
      selected.y = parseFloat(propY.value) || selected.y;
    }
  });
});

// COLLISIONS
function resolvePointCollisions(points) {
  for (const point of points) {
    const other = objects.find(p => p instanceof Point && p !== point && p.isHit(point.x, point.y));
    if (other) {
      mergePoints(point, other);
      continue;
    }
    const line = objects.find(l => l instanceof Line && l.isHit(point.x, point.y));
    if (line) {
      const i = objects.indexOf(line);
      if (i !== -1) objects.splice(i, 1);
      const l1 = new Line(line.p1, point);
      const l2 = new Line(point, line.p2);
      l1.color = line.color;
      l2.color = line.color;
      objects.push(l1, l2);
    }
  }
}

function mergePoints(from, to) {
  const lines = objects.filter(obj => obj instanceof Line && (obj.p1 === from || obj.p2 === from));
  for (const l of lines) {
    if (l.p1 === from) l.p1 = to;
    if (l.p2 === from) l.p2 = to;
  }

  const uniqueLines = [];
  for (const obj of objects) {
    if (obj instanceof Line) {
      const dup = uniqueLines.some(l =>
        (l.p1 === obj.p1 && l.p2 === obj.p2) || (l.p1 === obj.p2 && l.p2 === obj.p1)
      );
      if (!dup) uniqueLines.push(obj);
    }
  }

  objects = objects.filter(obj => !(obj instanceof Line));
  objects.push(...uniqueLines);

  const i = objects.indexOf(from);
  if (i !== -1) objects.splice(i, 1);
}

// RENDER
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (showGrid) drawGrid(ctx, canvas.width, canvas.height, 20);

  for (const obj of objects) {
    if (obj instanceof Line) obj.draw(ctx);
  }

  for (const obj of objects) {
    if (obj instanceof Point) {
      obj.draw(ctx);
      if ((obj === selected || multiSelected.includes(obj)) && obj.drawOutline) {
        obj.drawOutline(ctx);
      }
    }
  }

  if (isDrawingLine && lineStart) {
    ctx.strokeStyle = defaultColors.line;
    ctx.beginPath();
    ctx.moveTo(lineStart.x, lineStart.y);
    ctx.lineTo(currentMouse.x, currentMouse.y);
    ctx.stroke();

    ctx.fillStyle = defaultColors.point;
    ctx.beginPath();
    ctx.arc(lineStart.x, lineStart.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(currentMouse.x, currentMouse.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  if (isSelecting && selectionBox) {
    const { startX, startY, x, y } = selectionBox;
    ctx.setLineDash([4, 2]);
    ctx.strokeStyle = '#00ff88';
    ctx.strokeRect(startX, startY, x - startX, y - startY);
    ctx.setLineDash([]);
  }

  requestAnimationFrame(animate);
}

animate();
