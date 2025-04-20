const paletteContainer = document.getElementById("palette-container");
const generateBtn = document.getElementById("generate-btn");
const exportBtn = document.getElementById("export-btn");

let colors = ["#A3A380", "#D6CE93", "#EFEBCE", "#D8A48F", "#BB8588"];
let colorNames = colors.map((_, i) => `Color ${i + 1}`);

let dragging = false;
let dragStartX = 0;
let dragIndex = null;
let dragElement = null;
let blockRects = [];

function generateRandomColor() {
  return "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
}

function getContrast(hex) {
  const c = hex.substring(1);
  const rgb = parseInt(c, 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = rgb & 0xff;
  const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
  return brightness > 160 ? "#000" : "#FFF";
}

function mixColors(c1, c2) {
  const hexToRgb = (hex) => hex.match(/\w\w/g).map((x) => parseInt(x, 16));
  const rgbToHex = (r, g, b) =>
    "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");

  const [r1, g1, b1] = hexToRgb(c1);
  const [r2, g2, b2] = hexToRgb(c2);
  const r = Math.round((r1 + r2) / 2);
  const g = Math.round((g1 + g2) / 2);
  const b = Math.round((b1 + b2) / 2);
  return rgbToHex(r, g, b);
}

function renderPalette() {
  paletteContainer.innerHTML = "";

  colors.forEach((color, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "block-wrapper";
    wrapper.dataset.index = index;

    const block = document.createElement("div");
    block.className = "color-block";
    block.style.backgroundColor = color;

    const contrast = getContrast(color);

    const controls = document.createElement("div");
    controls.className = "color-controls";
    controls.style.color = contrast;

    const nameInput = document.createElement("input");
    nameInput.className = "color-name";
    nameInput.value = colorNames[index];
    nameInput.addEventListener("input", () => {
      colorNames[index] = nameInput.value;
    });

    const hexInput = document.createElement("input");
    hexInput.className = "hex-code";
    hexInput.value = color;

    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.className = "color-picker";
    colorInput.value = color;

    hexInput.addEventListener("input", () => {
      const val = hexInput.value.toUpperCase();
      if (/^#([0-9A-F]{3}){1,2}$/i.test(val)) {
        colors[index] = val;
        block.style.backgroundColor = val;
        colorInput.value = val;
        const newContrast = getContrast(val);
        hexInput.style.color = newContrast;
        nameInput.style.color = newContrast;
      }
    });

    hexInput.addEventListener("focus", () => {
      colorInput.value = hexInput.value;
      setTimeout(() => colorInput.click(), 0);
    });

    colorInput.addEventListener("input", () => {
      const val = colorInput.value.toUpperCase();
      colors[index] = val;
      block.style.backgroundColor = val;
      hexInput.value = val;
      const newContrast = getContrast(val);
      hexInput.style.color = newContrast;
      nameInput.style.color = newContrast;
    });

    controls.appendChild(nameInput);
    controls.appendChild(hexInput);
    controls.appendChild(colorInput);
    block.appendChild(controls);
    wrapper.appendChild(block);

    // 🗑️ Remove button
    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-btn";
    removeBtn.textContent = "🗑️";
    removeBtn.title = "Remove Color";

    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (colors.length > 2) {
        colors.splice(index, 1);
        colorNames.splice(index, 1);
        renderPalette();
      } else {
        alert("You must keep at least 2 colors.");
      }
    });
    block.appendChild(removeBtn);

    // ➕ Insert button (left/right based on mouse)
    const insertBtn = document.createElement("div");
    insertBtn.className = "insert-btn";
    insertBtn.textContent = "+";

    wrapper.appendChild(insertBtn);

    wrapper.addEventListener("mousemove", (e) => {
      const rect = wrapper.getBoundingClientRect();
      const isLeft = e.clientX < rect.left + rect.width / 2;
      insertBtn.classList.add("show");
      insertBtn.classList.toggle("left", isLeft);
      insertBtn.classList.toggle("right", !isLeft);
      insertBtn.dataset.index = isLeft ? index : index + 1;
    });

    wrapper.addEventListener("mouseleave", () => {
      insertBtn.classList.remove("show");
    });

    insertBtn.addEventListener("click", () => {
      const insertIndex = parseInt(insertBtn.dataset.index);
      const c1 = colors[insertIndex - 1] || colors[0];
      const c2 = colors[insertIndex] || c1;
      const mixed = mixColors(c1, c2);
      colors.splice(insertIndex, 0, mixed);
      colorNames.splice(insertIndex, 0, "New Color");
      renderPalette();
    });

    // 🧲 Drag Logic
    block.addEventListener("mousedown", (e) => {
      if (e.target.tagName === "INPUT" || e.target.classList.contains("remove-btn")) return;

      dragging = true;
      dragIndex = index;
      dragStartX = e.clientX;
      dragElement = wrapper;
      blockRects = [...paletteContainer.children].map((el) => el.getBoundingClientRect());

      dragElement.classList.add("dragging");
      dragElement.style.zIndex = "10";

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });

    paletteContainer.appendChild(wrapper);
  });
}

function onMouseMove(e) {
  if (!dragging || !dragElement) return;

  const deltaX = e.clientX - dragStartX;
  dragElement.style.transform = `translateX(${deltaX}px)`;

  const dragCenterX = dragElement.getBoundingClientRect().left + dragElement.offsetWidth / 2;
  const children = [...paletteContainer.children];

  let newIndex = dragIndex;

  for (let i = 0; i < children.length; i++) {
    if (i === dragIndex) continue;
    const rect = blockRects[i];
    const threshold = rect.width * 0.8;

    if (i < dragIndex && dragCenterX < rect.left + threshold) {
      newIndex = Math.min(newIndex, i);
    }
    if (i > dragIndex && dragCenterX > rect.right - threshold) {
      newIndex = Math.max(newIndex, i);
    }
  }

  children.forEach((el, i) => {
    if (i === dragIndex) return;

    let offset = 0;
    if (dragIndex < newIndex && i > dragIndex && i <= newIndex) {
      offset = -dragElement.offsetWidth;
    } else if (dragIndex > newIndex && i >= newIndex && i < dragIndex) {
      offset = dragElement.offsetWidth;
    }
    el.style.transform = `translateX(${offset}px)`;
  });
}

function onMouseUp() {
  if (!dragging || !dragElement) return;

  const dragCenterX = dragElement.getBoundingClientRect().left + dragElement.offsetWidth / 2;
  const children = [...paletteContainer.children];
  let newIndex = dragIndex;

  for (let i = 0; i < children.length; i++) {
    if (i === dragIndex) continue;
    const rect = blockRects[i];
    const threshold = rect.width * 0.8;

    if (i < dragIndex && dragCenterX < rect.left + threshold) {
      newIndex = Math.min(newIndex, i);
    }
    if (i > dragIndex && dragCenterX > rect.right - threshold) {
      newIndex = Math.max(newIndex, i);
    }
  }

  if (newIndex !== dragIndex) {
    const c = colors.splice(dragIndex, 1)[0];
    const n = colorNames.splice(dragIndex, 1)[0];
    colors.splice(newIndex, 0, c);
    colorNames.splice(newIndex, 0, n);
  }

  dragging = false;
  dragElement.classList.remove("dragging");
  dragElement.style.transform = "";
  dragElement.style.zIndex = "";

  [...paletteContainer.children].forEach((el) => (el.style.transform = ""));
  dragElement = null;
  dragIndex = null;
  blockRects = [];

  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);

  renderPalette();
}

generateBtn.addEventListener("click", () => {
  colors = colors.map(() => generateRandomColor());
  colorNames = colors.map((_, i) => `Color ${i + 1}`);
  renderPalette();
});

exportBtn.addEventListener("click", () => {
  const data = colors.map((color, i) => ({
    name: colorNames[i],
    hex: color
  }));
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "palette.json";
  a.click();
});

renderPalette();
