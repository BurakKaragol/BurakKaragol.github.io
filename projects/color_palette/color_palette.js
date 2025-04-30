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

  // Ensure colorNames matches colors.length
  while (colorNames.length < colors.length) {
    colorNames.push(`Color ${colorNames.length + 1}`);
  }

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
    nameInput.value = colorNames[index] || `Color ${index + 1}`;
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

let showName = true;
let showHex = true;

function showPreview(dataUrlInitial) {
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

  const imgWrapper = document.createElement("div");
  imgWrapper.style.padding = "20px";
  imgWrapper.style.paddingBottom = "10px";
  imgWrapper.style.flexGrow = "1";
  imgWrapper.style.overflow = "auto";

  const img = document.createElement("img");
  img.src = dataUrlInitial;
  img.style.maxWidth = "100%";
  img.style.height = "auto";
  imgWrapper.appendChild(img);

  const toggleWrapper = document.createElement("div");
  toggleWrapper.style.display = "flex";
  toggleWrapper.style.justifyContent = "center";
  toggleWrapper.style.gap = "10px";
  toggleWrapper.style.margin = "10px";
  toggleWrapper.style.marginTop = "0px";

  const nameToggle = document.createElement("button");
  nameToggle.textContent = "Toggle Name";

  const hexToggle = document.createElement("button");
  hexToggle.textContent = "Toggle Hex";

  function styleToggleButton(button) {
    button.style.flex = "1";
    button.style.margin = "10px";
    button.style.padding = "10px 5px";
    button.style.fontSize = "16px";
    button.style.backgroundColor = "#e0e0e0";
    button.style.color = "#333";
    button.style.border = "2px solid #ccc";
    button.style.borderRadius = "8px";
    button.style.cursor = "pointer";
    button.style.transition = "all 0.3s ease";
    button.style.minWidth = "100px";
  }

  function setToggleActive(button, active) {
    if (active) {
      button.style.backgroundColor = "#3b82f6";
      button.style.color = "white";
      button.style.borderColor = "#3b82f6";
    } else {
      button.style.backgroundColor = "#e0e0e0";
      button.style.color = "#333";
      button.style.borderColor = "#ccc";
    }
  }

  styleToggleButton(nameToggle);
  styleToggleButton(hexToggle);

  setToggleActive(nameToggle, showName);
  setToggleActive(hexToggle, showHex);

  nameToggle.addEventListener("click", () => {
    showName = !showName;
    setToggleActive(nameToggle, showName);
    updatePreviewImage(img);
  });

  hexToggle.addEventListener("click", () => {
    showHex = !showHex;
    setToggleActive(hexToggle, showHex);
    updatePreviewImage(img);
  });

  toggleWrapper.appendChild(nameToggle);
  toggleWrapper.appendChild(hexToggle);

  const downloadBtn = document.createElement("button");
  downloadBtn.textContent = "Download PNG";
  downloadBtn.style.width = "calc(100% - 40px)";
  downloadBtn.style.margin = "0 20px 20px 20px";
  downloadBtn.style.padding = "16px 0";
  downloadBtn.style.fontSize = "18px";
  downloadBtn.style.background = "#3b82f6";
  downloadBtn.style.color = "white";
  downloadBtn.style.border = "none";
  downloadBtn.style.borderRadius = "10px";
  downloadBtn.style.cursor = "pointer";
  downloadBtn.style.transition = "background 0.3s ease";

  downloadBtn.addEventListener("mouseenter", () => {
    downloadBtn.style.background = "#1b2b45";
  });

  downloadBtn.addEventListener("mouseleave", () => {
    downloadBtn.style.background = "#3b82f6";
  });

  downloadBtn.addEventListener("click", async () => {
    const blob = await (await fetch(img.src)).blob();
    const fileHandle = await window.showSaveFilePicker({
      suggestedName: "palette.png",
      types: [{ description: "PNG Image", accept: { "image/png": [".png"] } }],
    });
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
    document.body.removeChild(overlay);
  });

  modal.appendChild(imgWrapper);
  modal.appendChild(toggleWrapper);
  modal.appendChild(downloadBtn);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
    }
  });
}

function updatePreviewImage(imgElement) {
  const blockWidth = 100;
  const blockHeight = 500;
  const baseFontSize = 20;
  const bigFontSize = 26;
  const padding_top = blockWidth * 0.75;
  const padding_bottom = blockWidth * 0.25;

  const columnCount = colors.length;
  const canvas = document.createElement("canvas");
  canvas.width = columnCount * blockWidth;
  canvas.height = blockHeight;

  const ctx = canvas.getContext("2d");
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

    const bothVisible = showName && showHex;

    if (bothVisible) {
      ctx.font = `bold ${baseFontSize}px 'Segoe UI', sans-serif`;
      if (showName) ctx.fillText(name, 0, -5);
      if (showHex) ctx.fillText(hex.toUpperCase(), 0, baseFontSize + 5);
    } else {
      ctx.font = `bold ${bigFontSize}px 'Segoe UI', sans-serif`;
      if (showName) ctx.fillText(name, 0, 13);
      if (showHex) ctx.fillText(hex.toUpperCase(), 0, 13);
    }

    ctx.restore();
  }

  imgElement.src = canvas.toDataURL("image/png");
}

function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n =>
    Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))))
      .toString(16)
      .padStart(2, "0");
  return `#${f(0)}${f(8)}${f(4)}`;
}

function generatePaletteFromMode(count, mode) {
  const baseHue = Math.floor(Math.random() * 360);
  const grayLightCount = Math.max(1, Math.floor(count * 0.15));
  const grayDarkCount = Math.max(1, Math.floor(count * 0.15));
  const accentCount = count - grayLightCount - grayDarkCount;

  const grayLights = [];
  const grayDarks = [];
  const accents = [];

  const createNeutral = (light = true) => {
    const h = Math.floor(Math.random() * 30);
    const s = 4 + Math.random() * 8;
    const l = light
      ? 85 + Math.random() * 10
      : 5 + Math.random() * 15;
    return hslToHex(h, s, l);
  };

  const createAccent = (i) => {
    let h = baseHue;
    let s = 60 + Math.random() * 20;
    let l = 45 + Math.random() * 10;
    const spread = 15;

    if (mode === "analogous") {
      h = (baseHue + i * spread + Math.random() * 5 - 2.5) % 360;
    } else if (mode === "complementary") {
      h = (baseHue + (i % 2 === 0 ? 0 : 180) + Math.floor(i / 2) * spread) % 360;
    } else if (mode === "monochromatic") {
      h = baseHue;
      l = 30 + i * (40 / Math.max(accentCount, 1));
    } else if (mode === "triadic") {
      const offset = (i % 3) * 120;
      h = (baseHue + offset + Math.floor(i / 3) * spread) % 360;
    } else if (mode === "tetradic") {
      const base = (i % 4) * 90;
      const shift = Math.floor(i / 4) * spread;
      h = (baseHue + base + shift) % 360;
    }

    return hslToHex(h, s, l);
  };

  // Generate grays
  for (let i = 0; i < grayDarkCount; i++) grayDarks.push(createNeutral(false));
  for (let i = 0; i < grayLightCount; i++) grayLights.push(createNeutral(true));
  for (let i = 0; i < accentCount; i++) accents.push(createAccent(i));

  const groupSize = {
    analogous: 5,
    complementary: 2,
    triadic: 3,
    tetradic: 4,
    monochromatic: accentCount
  }[mode] || 3;

  const sortedAccents = groupAndSortAccents(accents, groupSize);

  const finalPalette = [...grayDarks, ...grayLights, ...sortedAccents];
  colorNames = finalPalette.map((_, i) => `Color ${i + 1}`);
  return finalPalette;
}

function groupAndSortAccents(accents, groupSize) {
  const groups = [];

  for (let i = 0; i < accents.length; i++) {
    const groupIndex = Math.floor(i / groupSize);
    if (!groups[groupIndex]) groups[groupIndex] = [];
    groups[groupIndex].push(accents[i]);
  }

  return groups.flatMap(group =>
    group.sort((a, b) => getHueFromHex(a) - getHueFromHex(b))
  );
}

function getHueFromHex(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0;

  if (max !== min) {
    if (max === r) h = (60 * ((g - b) / (max - min)) + 360) % 360;
    else if (max === g) h = (60 * ((b - r) / (max - min)) + 120) % 360;
    else h = (60 * ((r - g) / (max - min)) + 240) % 360;
  }

  return h;
}

function getLightnessFromHex(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  return ((max + min) / 2) * 100;
}

const modePopup = document.getElementById("palette-mode-popup");

generateBtn.addEventListener("click", (e) => {
  const rect = generateBtn.getBoundingClientRect();
  modePopup.style.top = `${rect.bottom + window.scrollY + 5}px`;
  modePopup.style.left = `${rect.left + window.scrollX}px`;
  modePopup.classList.toggle("hidden");
});

document.addEventListener("click", (e) => {
  if (!modePopup.contains(e.target) && e.target !== generateBtn) {
    modePopup.classList.add("hidden");
  }
});

modePopup.querySelectorAll("button").forEach((btn) => {
  btn.addEventListener("click", () => {
    const mode = btn.dataset.mode;
    colors = generatePaletteFromMode(colors.length, mode);
    colorNames = colors.map((_, i) => `Color ${i + 1}`);
    renderPalette();
    modePopup.classList.add("hidden");
  });
});

renderPalette();
