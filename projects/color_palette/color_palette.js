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

async function downloadCanvasAsPNG(canvas, suggestedName = "palette.png") {
  if ('showSaveFilePicker' in window) {
    const fileHandle = await window.showSaveFilePicker({
      suggestedName,
      types: [
        {
          description: "PNG Image",
          accept: { "image/png": [".png"] },
        },
      ],
    });

    const writable = await fileHandle.createWritable();
    const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
    await writable.write(blob);
    await writable.close();
  } else {
    const link = document.createElement("a");
    link.download = suggestedName;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }
}

exportBtn.addEventListener("click", async () => {
  const blockWidth = 100;
  const blockHeight = 500;
  const fontSize = 20;
  const padding_top = blockWidth * 0.75;
  const padding_bottom = blockWidth * 0.25;

  const columnCount = colors.length;
  const canvas = document.createElement("canvas");
  canvas.width = columnCount * blockWidth;
  canvas.height = blockHeight;

  const ctx = canvas.getContext("2d");

  ctx.font = `bold ${fontSize}px 'Segoe UI', sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  for (let i = 0; i < columnCount; i++) {
    const hex = colors[i];
    const name = colorNames[i] || `Color ${i + 1}`;
    const x = i * blockWidth;

    ctx.fillStyle = hex;
    ctx.fillRect(x, 0, blockWidth, blockHeight);

    const contrast = getContrast(hex);

    ctx.save();
    ctx.translate(x + blockWidth - padding_top, blockHeight - padding_bottom);
    ctx.rotate(-Math.PI / 2);

    ctx.fillStyle = contrast;
    ctx.fillText(name, 0, 0);
    ctx.fillText(hex.toUpperCase(), 0, fontSize + 8);

    ctx.restore();
  }

  const imgDataUrl = canvas.toDataURL("image/png");

  showPreview(imgDataUrl);
});

function showPreview(dataUrl) {
  // Create overlay
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = 0;
  overlay.style.left = 0;
  overlay.style.width = "100vw";
  overlay.style.height = "100vh";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = 1000;

  // Create modal box
  const modal = document.createElement("div");
  modal.style.background = "#0f1b2d";
  modal.style.padding = "0";
  modal.style.borderRadius = "10px";
  modal.style.textAlign = "center";
  modal.style.maxWidth = "90vw";
  modal.style.maxHeight = "90vh";
  modal.style.display = "flex";
  modal.style.flexDirection = "column";
  modal.style.overflow = "hidden";

  // Image inside modal
  const imgWrapper = document.createElement("div");
  imgWrapper.style.padding = "20px";
  imgWrapper.style.flexGrow = "1";
  imgWrapper.style.overflow = "auto";

  const img = document.createElement("img");
  img.src = dataUrl;
  img.style.maxWidth = "100%";
  img.style.height = "auto";
  imgWrapper.appendChild(img);

  // Download button bar
  const downloadBtn = document.createElement("button");
  downloadBtn.textContent = "Download PNG";
  downloadBtn.style.width = "100%";
  downloadBtn.style.padding = "16px 0";
  downloadBtn.style.fontSize = "18px";
  downloadBtn.style.width = "calc(100% - 40px)";
  downloadBtn.style.margin = "0 20px 20px 20px";
  downloadBtn.style.borderRadius = "10px";
  downloadBtn.style.background = "#3b82f6";
  downloadBtn.style.color = "white";
  downloadBtn.style.border = "none";
  downloadBtn.style.cursor = "pointer";
  downloadBtn.style.transition = "background 0.3s ease";

  // Hover animation
  downloadBtn.addEventListener("mouseenter", () => {
    downloadBtn.style.background = "#1b2b45"; // lighter hover
  });
  downloadBtn.addEventListener("mouseleave", () => {
    downloadBtn.style.background = "#3b82f6"; // back to normal
  });

  // Download action
  downloadBtn.addEventListener("click", async () => {
    const blob = await (await fetch(dataUrl)).blob();
    const fileHandle = await window.showSaveFilePicker({
      suggestedName: "palette.png",
      types: [{ description: "PNG Image", accept: { "image/png": [".png"] } }]
    });
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
    document.body.removeChild(overlay);
  });

  // Close overlay on outside click
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
    }
  });

  modal.appendChild(imgWrapper);
  modal.appendChild(downloadBtn);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

renderPalette();
