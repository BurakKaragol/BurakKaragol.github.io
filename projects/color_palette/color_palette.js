// color_palette.js — adds per-block format toggle (HEX/RGB/HSL) for the value field.
// Works with your existing import/export/generation logic.

const paletteContainer = document.getElementById("palette-container");
const generateBtn = document.getElementById("generate-btn");
const exportBtn   = document.getElementById("export-btn");
const importBtn   = document.getElementById("import-btn");
const importFile  = document.getElementById("import-file");
const modePopup   = document.getElementById("palette-mode-popup");

// ---------- State ----------
let colors = ["#A3A380", "#D6CE93", "#EFEBCE", "#D8A48F", "#BB8588"];
let colorNames = colors.map((_, i) => `Color ${i + 1}`);

// NEW: format per color block: "HEX" | "RGB" | "HSL"
let colorFormats = colors.map(() => "HEX");

let dragging = false;
let dragStartX = 0;
let dragIndex = null;
let dragElement = null;
let blockRects = [];

let showName = true; // PNG poster toggles
let showHex  = true;

// ---------- Color helpers ----------
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
  const rgbToHex = (r, g, b) => "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
  const [r1, g1, b1] = hexToRgb(c1);
  const [r2, g2, b2] = hexToRgb(c2);
  const r = Math.round((r1 + r2) / 2);
  const g = Math.round((g1 + g2) / 2);
  const b = Math.round((b1 + b2) / 2);
  return rgbToHex(r, g, b);
}
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function normalizeHex(s) {
  if (!s) return null;
  const m = String(s).trim().match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (!m) return null;
  let h = m[1].toUpperCase();
  if (h.length === 3) h = h.split("").map(ch => ch + ch).join("");
  return `#${h}`;
}
// Conversions
function hexToRgb(hex) {
  hex = normalizeHex(hex);
  if (!hex) return null;
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}
function rgbToHex(r, g, b) {
  const to = (x) => clamp(x|0,0,255).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
}
function rgbToHsl(r, g, b) {
  r/=255; g/=255; b/=255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h, s, l = (max+min)/2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = ((b - r) / d + 2); break;
      default: h = ((r - g) / d + 4); break;
    }
    h *= 60;
  }
  return { h: Math.round(h||0), s: Math.round(s*100), l: Math.round(l*100) };
}
function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s/=100; l/=100;
  if (s === 0) {
    const v = Math.round(l*255);
    return { r:v, g:v, b:v };
  }
  const q = l < .5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hk = h/360;
  const tc = [hk + 1/3, hk, hk - 1/3];
  const rgb = tc.map(t=>{
    t = (t + 1) % 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  }).map(v=>Math.round(v*255));
  return { r:rgb[0], g:rgb[1], b:rgb[2] };
}
function hslToHex(h, s, l) {
  const {r,g,b} = hslToRgb(h,s,l);
  return rgbToHex(r,g,b);
}

// Formatters/parsers for the input field
function formatColor(valueHex, mode) {
  const rgb = hexToRgb(valueHex);
  if (!rgb) return valueHex.toUpperCase();
  if (mode === "HEX") return valueHex.toUpperCase();
  if (mode === "RGB") return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);
  return `hsl(${h}, ${s}%, ${l}%)`;
}
function parseColorInput(text, mode) {
  if (mode === "HEX") {
    const hx = normalizeHex(text);
    return hx;
  }
  if (mode === "RGB") {
    const m = text.trim().match(/^rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$|^(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})$/i);
    if (!m) return null;
    const r = parseInt(m[1] ?? m[4], 10);
    const g = parseInt(m[2] ?? m[5], 10);
    const b = parseInt(m[3] ?? m[6], 10);
    if ([r,g,b].some(v=>isNaN(v) || v<0 || v>255)) return null;
    return rgbToHex(r,g,b);
  }
  if (mode === "HSL") {
    const m = text.trim().match(/^hsl\s*\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)%?\s*,\s*(\d+(?:\.\d+)?)%?\s*\)$|^(-?\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)%?\s*,\s*(\d+(?:\.\d+)?)%?$/i);
    if (!m) return null;
    const h = parseFloat(m[1] ?? m[4]);
    const s = parseFloat(m[2] ?? m[5]);
    const l = parseFloat(m[3] ?? m[6]);
    if ([s,l].some(v=>isNaN(v) || v<0 || v>100) || isNaN(h)) return null;
    return hslToHex(h, s, l);
  }
  return null;
}

// ---------- Render palette ----------
function renderPalette() {
  paletteContainer.innerHTML = "";

  while (colorNames.length < colors.length) colorNames.push(`Color ${colorNames.length + 1}`);
  while (colorFormats.length < colors.length) colorFormats.push("HEX");

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
    nameInput.addEventListener("input", () => { colorNames[index] = nameInput.value; });

    // VALUE FIELD (format-aware)
    const valueInput = document.createElement("input");
    valueInput.className = "hex-code"; // keep class for styling
    valueInput.value = formatColor(color, colorFormats[index]);

    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.className = "color-picker";
    colorInput.value = color;

    // Format chip
    const formatChip = document.createElement("div");
    formatChip.className = "format-chip";
    formatChip.textContent = colorFormats[index];
    formatChip.addEventListener("click", (e) => {
      e.stopPropagation();
      const next = colorFormats[index] === "HEX" ? "RGB" : colorFormats[index] === "RGB" ? "HSL" : "HEX";
      colorFormats[index] = next;
      formatChip.textContent = next;
      valueInput.value = formatColor(colors[index], next);
    });

    // Edit in the field (parse by current mode)
    valueInput.addEventListener("input", () => {
      const parsed = parseColorInput(valueInput.value, colorFormats[index]);
      if (parsed) {
        colors[index] = parsed;
        block.style.backgroundColor = parsed;
        colorInput.value = parsed;
        const newContrast = getContrast(parsed);
        valueInput.style.color = newContrast;
        nameInput.style.color = newContrast;
      }
    });

    // Clicking focuses and still opens the native color picker (existing UX)
    valueInput.addEventListener("focus", () => {
      colorInput.value = colors[index];
      setTimeout(() => colorInput.click(), 0);
    });

    // Picker → update and reflect in current format
    colorInput.addEventListener("input", () => {
      const val = colorInput.value.toUpperCase();
      colors[index] = val;
      block.style.backgroundColor = val;
      valueInput.value = formatColor(val, colorFormats[index]);
      const newContrast = getContrast(val);
      valueInput.style.color = newContrast;
      nameInput.style.color = newContrast;
    });

    controls.appendChild(nameInput);
    controls.appendChild(valueInput);
    controls.appendChild(colorInput);
    block.appendChild(controls);
    block.appendChild(formatChip);
    wrapper.appendChild(block);

    // Remove
    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-btn";
    removeBtn.textContent = "🗑️";
    removeBtn.title = "Remove Color";
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (colors.length > 2) {
        colors.splice(index, 1);
        colorNames.splice(index, 1);
        colorFormats.splice(index, 1);
        renderPalette();
      } else {
        alert("You must keep at least 2 colors.");
      }
    });
    block.appendChild(removeBtn);

    // Insert (blend)
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
    wrapper.addEventListener("mouseleave", () => insertBtn.classList.remove("show"));
    insertBtn.addEventListener("click", () => {
      const insertIndex = parseInt(insertBtn.dataset.index);
      const c1 = colors[insertIndex - 1] || colors[0];
      const c2 = colors[insertIndex] || c1;
      const mixed = mixColors(c1, c2);
      colors.splice(insertIndex, 0, mixed);
      colorNames.splice(insertIndex, 0, "New Color");
      colorFormats.splice(insertIndex, 0, "HEX");
      renderPalette();
    });

    // Drag
    block.addEventListener("mousedown", (e) => {
      if (e.target.tagName === "INPUT" || e.target.classList.contains("remove-btn") || e.target.classList.contains("format-chip")) return;
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
    if (i < dragIndex && dragCenterX < rect.left + threshold) newIndex = Math.min(newIndex, i);
    if (i > dragIndex && dragCenterX > rect.right - threshold) newIndex = Math.max(newIndex, i);
  }

  children.forEach((el, i) => {
    if (i === dragIndex) return;
    let offset = 0;
    if (dragIndex < newIndex && i > dragIndex && i <= newIndex) offset = -dragElement.offsetWidth;
    else if (dragIndex > newIndex && i >= newIndex && i < dragIndex) offset = dragElement.offsetWidth;
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
    if (i < dragIndex && dragCenterX < rect.left + threshold) newIndex = Math.min(newIndex, i);
    if (i > dragIndex && dragCenterX > rect.right - threshold) newIndex = Math.max(newIndex, i);
  }

  if (newIndex !== dragIndex) {
    const c  = colors.splice(dragIndex, 1)[0];
    const n  = colorNames.splice(dragIndex, 1)[0];
    const fm = colorFormats.splice(dragIndex, 1)[0];
    colors.splice(newIndex, 0, c);
    colorNames.splice(newIndex, 0, n);
    colorFormats.splice(newIndex, 0, fm);
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

// ---------- Export Center (PNG/Text/ACO/ASE) ----------
exportBtn?.addEventListener("click", () => openExportCenter("PNG"));

function openExportCenter(defaultTab = "PNG") {
  const overlay = document.createElement("div");
  styleOverlay(overlay);

  const modal = document.createElement("div");
  Object.assign(modal.style, {
    background: "#0f1b2d", color: "#fff", borderRadius: "12px", border: "2px solid #fff",
    width: "min(960px, 92vw)", maxHeight: "90vh",
    display: "flex", flexDirection: "column", overflow: "hidden"
  });

  const tabs = ["PNG", "Text", "ACO", "ASE"];
  const tabBar = document.createElement("div");
  Object.assign(tabBar.style, { display: "flex", borderBottom: "1px solid #244", background: "#0b1526" });
  const tabBtns = new Map();
  tabs.forEach(t => {
    const b = document.createElement("button");
    b.textContent = t;
    Object.assign(b.style, tabBtnStyle(false));
    b.addEventListener("click", () => switchTab(t));
    tabBar.appendChild(b);
    tabBtns.set(t, b);
  });

  const content = document.createElement("div");
  Object.assign(content.style, { padding: "12px", overflow: "auto", flex: "1 1 auto" });

  const footer = document.createElement("div");
  Object.assign(footer.style, { padding: "10px", borderTop: "1px solid #244", display: "flex", justifyContent: "flex-end", gap: "8px" });
  const closeBtn = document.createElement("button");
  stylePrimaryBtn(closeBtn, false);
  closeBtn.textContent = "Close";
  closeBtn.addEventListener("click", () => document.body.removeChild(overlay));
  footer.appendChild(closeBtn);

  modal.appendChild(tabBar);
  modal.appendChild(content);
  modal.appendChild(footer);
  overlay.appendChild(modal);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) document.body.removeChild(overlay); });
  document.body.appendChild(overlay);

  function switchTab(name) {
    tabs.forEach(t => Object.assign(tabBtns.get(t).style, tabBtnStyle(t === name)));
    content.innerHTML = "";
    if (name === "PNG")  buildPngTab(content);
    if (name === "Text") buildTextTab(content);
    if (name === "ACO")  buildAcoTab(content);
    if (name === "ASE")  buildAseTab(content);
  }
  switchTab(defaultTab);
}

function buildPngTab(container) {
  const imgWrapper = document.createElement("div");
  Object.assign(imgWrapper.style, { padding: "12px", display: "flex", justifyContent: "center" });

  const img = document.createElement("img");
  Object.assign(img.style, { maxWidth: "100%", height: "auto", borderRadius: "8px", border: "1px solid #244" });
  updatePreviewImage(img);
  imgWrapper.appendChild(img);

  const toggles = document.createElement("div");
  Object.assign(toggles.style, { display: "flex", gap: "8px", justifyContent: "center", margin: "8px 0 16px" });
  const nameBtn = document.createElement("button");
  const hexBtn  = document.createElement("button");
  styleToggleButton(nameBtn); styleToggleButton(hexBtn);
  nameBtn.textContent = "Show Names";
  hexBtn.textContent  = "Show HEX";
  setToggleActive(nameBtn, showName);
  setToggleActive(hexBtn,  showHex);
  nameBtn.addEventListener("click", () => { showName = !showName; setToggleActive(nameBtn, showName); updatePreviewImage(img); });
  hexBtn.addEventListener("click",  () => { showHex  = !showHex;  setToggleActive(hexBtn,  showHex);  updatePreviewImage(img); });
  toggles.append(nameBtn, hexBtn); // ensure visible

  const actions = document.createElement("div");
  Object.assign(actions.style, { display: "flex", gap: "12px", justifyContent: "center" });

  const downloadPosterBtn = document.createElement("button");
  stylePrimaryBtn(downloadPosterBtn, true);
  downloadPosterBtn.textContent = "Download PNG (Poster)";
  downloadPosterBtn.addEventListener("click", async () => {
    const blob = await (await fetch(img.src)).blob();
    await saveBlob(blob, "palette.png", "image/png", ".png");
  });

  const downloadStripeBtn = document.createElement("button");
  stylePrimaryBtn(downloadStripeBtn, true);
  downloadStripeBtn.textContent = "Download PNG (1px Stripe)";
  downloadStripeBtn.addEventListener("click", async () => {
    const dataUrl = buildStripe1pxDataURL(colors);
    const blob = await (await fetch(dataUrl)).blob();
    await saveBlob(blob, "palette_stripe_1px.png", "image/png", ".png");
  });

  actions.append(downloadPosterBtn, downloadStripeBtn);
  container.append(imgWrapper, toggles, actions);
}
function buildStripe1pxDataURL(hexes) {
  const w = Math.max(1, hexes.length);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = 1;
  const ctx = canvas.getContext("2d");
  for (let i = 0; i < w; i++) { ctx.fillStyle = hexes[i]; ctx.fillRect(i, 0, 1, 1); }
  return canvas.toDataURL("image/png");
}
function buildTextTab(container) {
  const textBlocks = buildTextExports(colors, colorNames);
  function addBlock(title, contentStr) {
    const sec = document.createElement("section");
    const head = document.createElement("div");
    head.textContent = title;
    Object.assign(head.style, { fontWeight: "700", marginBottom: "6px" });
    const tools = document.createElement("div");
    Object.assign(tools.style, { display: "flex", gap: "8px", marginBottom: "6px" });
    const copyBtn = document.createElement("button");
    styleSmallBtn(copyBtn);
    copyBtn.textContent = "Copy";
    const ta = document.createElement("textarea");
    Object.assign(ta.style, {
      width: "100%", height: "140px", resize: "vertical",
      background: "#0b1526", color: "#e5e7eb", border: "1px solid #244", borderRadius: "8px",
      padding: "10px", fontFamily: "ui-monospace, Menlo, Consolas, monospace"
    });
    ta.value = contentStr;
    copyBtn.addEventListener("click", () => { ta.select(); document.execCommand("copy"); copyBtn.textContent = "Copied!"; setTimeout(()=>copyBtn.textContent="Copy", 1200); });
    tools.appendChild(copyBtn);
    sec.append(head, tools, ta);
    container.appendChild(sec);
  }
  addBlock("Plain HEX (one per line)", textBlocks.hexPerLine);
  addBlock("CSV (name,hex)", textBlocks.csv);
  addBlock("Name + HEX (aligned)", textBlocks.pretty);
  addBlock("JSON (array of { name, hex })", textBlocks.jsonNameHex);
  addBlock("JSON (array of hex)", textBlocks.jsonHexOnly);
}
function buildAcoTab(container) {
  const info = document.createElement("div");
  info.textContent = "Export Adobe Color Swatch (.aco) with Unicode names (v1+v2).";
  info.style.marginBottom = "10px";
  const btn = document.createElement("button");
  stylePrimaryBtn(btn, true);
  btn.textContent = "Download .aco";
  btn.addEventListener("click", async () => {
    const buffer = buildAcoBuffer(colors, colorNames);
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    await saveBlob(blob, "palette.aco", "application/octet-stream", ".aco");
  });
  container.append(info, btn);
}
function buildAseTab(container) {
  const info = document.createElement("div");
  info.textContent = "Export Adobe Swatch Exchange (.ase) – RGB swatches in a single group.";
  info.style.marginBottom = "10px";
  const btn = document.createElement("button");
  stylePrimaryBtn(btn, true);
  btn.textContent = "Download .ase";
  btn.addEventListener("click", async () => {
    const buffer = buildAseBuffer(colors, colorNames);
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    await saveBlob(blob, "palette.ase", "application/octet-stream", ".ase");
  });
  container.append(info, btn);
}

// ---------- Export helpers ----------
function updatePreviewImage(imgElement) {
  const blockWidth = 100;
  const blockHeight = 500;
  const baseFontSize = 20;
  const bigFontSize  = 26;
  const padding_top = blockWidth * 0.75;
  const padding_bottom = blockWidth * 0.25;

  const columnCount = colors.length;
  const canvas = document.createElement("canvas");
  canvas.width = columnCount * blockWidth;
  canvas.height = blockHeight;

  const ctx = canvas.getContext("2d");
  ctx.textAlign = "left"; ctx.textBaseline = "top";

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
      if (showHex)  ctx.fillText(hex.toUpperCase(), 0, baseFontSize + 5);
    } else {
      ctx.font = `bold ${bigFontSize}px 'Segoe UI', sans-serif`;
      const y = 13;
      if (showName) ctx.fillText(name, 0, y);
      if (showHex)  ctx.fillText(hex.toUpperCase(), 0, y);
    }
    ctx.restore();
  }
  imgElement.src = canvas.toDataURL("image/png");
}
function buildTextExports(hexes, names) {
  const localNames = names.length === hexes.length ? names.slice() : hexes.map((_, i) => `Color ${i+1}`);
  const hexPerLine  = hexes.join("\n");
  const csv         = hexes.map((h, i) => `"${localNames[i].replace(/"/g, '""')}",${h.toUpperCase()}`).join("\n");
  const maxName     = Math.max(...localNames.map(n => n.length));
  const pretty      = hexes.map((h, i) => `${localNames[i].padEnd(maxName)}    ${h.toUpperCase()}`).join("\n");
  const jsonNameHex = JSON.stringify(hexes.map((h, i) => ({ name: localNames[i], hex: h.toUpperCase() })), null, 2);
  const jsonHexOnly = JSON.stringify(hexes.map(h => h.toUpperCase()), null, 2);
  return { hexPerLine, csv, pretty, jsonNameHex, jsonHexOnly };
}
async function saveBlob(blob, suggestedName, mime, ext) {
  if ('showSaveFilePicker' in window) {
    const handle = await window.showSaveFilePicker({
      suggestedName,
      types: [{ description: suggestedName, accept: { [mime]: [ext] } }]
    });
    const w = await handle.createWritable();
    await w.write(blob); await w.close();
  } else {
    const a = document.createElement("a");
    a.download = suggestedName;
    a.href = URL.createObjectURL(blob);
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(a.href);
    document.body.removeChild(a);
  }
}

// ---------- ACO (export + parse) ----------
function hexToRgbArray(hex) {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex);
  if (!m) return [0, 0, 0];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}
function buildAcoBuffer(hexes, names) {
  const n = hexes.length;
  const safeNames = (names && names.length === n) ? names : hexes.map((_, i) => `Color ${i+1}`);

  const v1Size = 4 + n * 10;
  let v2RecordsSize = 0;
  const nameWordLengths = safeNames.map(name => name.length + 1);
  for (let i = 0; i < n; i++) v2RecordsSize += 10 + 2 + 2 * nameWordLengths[i];
  const v2Size = 4 + v2RecordsSize;

  const totalSize = v1Size + v2Size;
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);

  let off = 0;
  const writeU16 = (v) => { view.setUint16(off, v, false); off += 2; };

  // v1
  writeU16(1); writeU16(n);
  for (let i = 0; i < n; i++) {
    const [r, g, b] = hexToRgbArray(hexes[i]);
    writeU16(0);
    writeU16(r * 257);
    writeU16(g * 257);
    writeU16(b * 257);
    writeU16(0);
  }

  // v2
  writeU16(2); writeU16(n);
  for (let i = 0; i < n; i++) {
    const [r, g, b] = hexToRgbArray(hexes[i]);
    writeU16(0);
    writeU16(r * 257);
    writeU16(g * 257);
    writeU16(b * 257);
    writeU16(0);

    const name = String(safeNames[i]);
    const lenWithNull = name.length + 1;
    writeU16(lenWithNull);
    for (let c = 0; c < name.length; c++) { view.setUint16(off, name.charCodeAt(c), false); off += 2; }
    writeU16(0);
  }
  return buffer;
}
async function parseAcoFile(file) {
  const buf = await file.arrayBuffer();
  const view = new DataView(buf);
  let off = 0;
  function readU16() { const v = view.getUint16(off, false); off += 2; return v; }

  let v1Colors = [];
  let v2Colors = [];

  while (off + 4 <= view.byteLength) {
    const version = readU16();
    const count = readU16();
    if (version !== 1 && version !== 2) break;
    for (let i = 0; i < count; i++) {
      if (off + 10 > view.byteLength) break;
      const space = readU16();
      const c1 = readU16();
      const c2 = readU16();
      const c3 = readU16();
      const _  = readU16();
      let hex = "#000000";
      if (space === 0) { // RGB
        const r = Math.round(c1 / 257);
        const g = Math.round(c2 / 257);
        const b = Math.round(c3 / 257);
        hex = "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("").toUpperCase();
      }
      if (version === 1) {
        v1Colors.push({ hex, name: null });
      } else {
        if (off + 2 > view.byteLength) { v2Colors.push({ hex, name: null }); continue; }
        const nameLen = readU16();
        const end = off + nameLen * 2;
        let name = "";
        for (let pos = off; pos + 1 < end - 2; pos += 2) {
          const code = view.getUint16(pos, false);
          name += String.fromCharCode(code);
        }
        off = end;
        v2Colors.push({ hex, name: name || null });
      }
    }
  }

  const use = (v2Colors.length ? v2Colors : v1Colors);
  const hexes = use.map(x => x.hex);
  const names = use.map((x, i) => x.name || `Color ${i + 1}`);
  return { hexes, names };
}

// ---------- ASE (export + parse) ----------
function float32ToBytesBE(f) {
  const buf = new ArrayBuffer(4);
  new DataView(buf).setFloat32(0, f, false);
  return new Uint8Array(buf);
}
function u16BE(n) {
  const buf = new ArrayBuffer(2);
  new DataView(buf).setUint16(0, n, false);
  return new Uint8Array(buf);
}
function u32BE(n) {
  const buf = new ArrayBuffer(4);
  new DataView(buf).setUint32(0, n, false);
  return new Uint8Array(buf);
}
function utf16beBytes(str, includeNull = true) {
  const len = str.length + (includeNull ? 1 : 0);
  const bytes = new Uint8Array(len * 2);
  let off = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    bytes[off++] = (code >> 8) & 0xff;
    bytes[off++] = code & 0xff;
  }
  if (includeNull) { bytes[off++] = 0; bytes[off++] = 0; }
  return bytes;
}
function buildAseBuffer(hexes, names) {
  const n = hexes.length;
  const safeNames = (names && names.length === n) ? names : hexes.map((_, i) => `Color ${i+1}`);

  const blocks = [];

  // Group Start (0xC001)
  (function addGroupStart() {
    const groupName = "Palette";
    const nameBytes = utf16beBytes(groupName, true);
    const blockContent = new Uint8Array([
      ...u16BE(groupName.length + 1),
      ...nameBytes
    ]);
    const header = new Uint8Array([
      ...u16BE(0xC001),
      ...u32BE(blockContent.length)
    ]);
    blocks.push(new Uint8Array([...header, ...blockContent]));
  })();

  // Color Entries (0x0001)
  for (let i = 0; i < n; i++) {
    const name = String(safeNames[i]);
    const [r, g, b] = hexToRgbArray(hexes[i]);
    const rf = r / 255, gf = g / 255, bf = b / 255;

    const nameBytes = utf16beBytes(name, true);
    const colorModel = new TextEncoder().encode("RGB ");
    const floats = new Uint8Array([
      ...float32ToBytesBE(rf),
      ...float32ToBytesBE(gf),
      ...float32ToBytesBE(bf)
    ]);
    const colorType = u16BE(2); // Normal

    const blockContent = new Uint8Array([
      ...u16BE(name.length + 1),
      ...nameBytes,
      ...colorModel,
      ...floats,
      ...colorType
    ]);

    const header = new Uint8Array([
      ...u16BE(0x0001),
      ...u32BE(blockContent.length)
    ]);
    blocks.push(new Uint8Array([...header, ...blockContent]));
  }

  // Group End (0xC002)
  (function addGroupEnd() {
    const header = new Uint8Array([...u16BE(0xC002), ...u32BE(0)]);
    blocks.push(header);
  })();

  const signature = new TextEncoder().encode("ASEF");
  const versionMajor = u16BE(1);
  const versionMinor = u16BE(0);
  const blockCount = u32BE(blocks.length);

  const totalLen = 4 + 2 + 2 + 4 + blocks.reduce((sum, b) => sum + b.length, 0);
  const output = new Uint8Array(totalLen);
  let off = 0;

  output.set(signature, off); off += 4;
  output.set(versionMajor, off); off += 2;
  output.set(versionMinor, off); off += 2;
  output.set(blockCount, off); off += 4;
  for (const b of blocks) { output.set(b, off); off += b.length; }

  return output.buffer;
}
async function parseAseFile(file) {
  const buf = await file.arrayBuffer();
  const view = new DataView(buf);
  let off = 0;

  function readU16() { const v = view.getUint16(off, false); off += 2; return v; }
  function readU32() { const v = view.getUint32(off, false); off += 4; return v; }
  function readUTF16BEStringUnits(units) {
    let s = "";
    for (let i = 0; i < units - 1; i++) { const code = view.getUint16(off, false); off += 2; s += String.fromCharCode(code); }
    off += 2; return s;
  }
  function readBytes(n) { const a = new Uint8Array(buf, off, n); off += n; return a; }
  function readFloat32() { const v = view.getFloat32(off, false); off += 4; return v; }

  const sig = new TextDecoder().decode(readBytes(4));
  if (sig !== "ASEF") throw new Error("Not an ASE file");
  const _vMaj = readU16(); const _vMin = readU16();
  const blockCount = readU32();

  const out = [];
  for (let bi = 0; bi < blockCount; bi++) {
    const blockType = readU16();
    const blockLen  = readU32();
    const blockEnd  = off + blockLen;

    if (blockType === 0x0001) {
      const nameUnits = readU16();
      const name = readUTF16BEStringUnits(nameUnits);
      const modelBytes = readBytes(4);
      const model = new TextDecoder().decode(modelBytes);
      let r = 0, g = 0, b = 0;

      if (model === "RGB ") {
        r = clamp(Math.round(readFloat32() * 255), 0, 255);
        g = clamp(Math.round(readFloat32() * 255), 0, 255);
        b = clamp(Math.round(readFloat32() * 255), 0, 255);
      } else if (model === "CMYK") {
        const c = readFloat32(); const m = readFloat32(); const y = readFloat32(); const k = readFloat32();
        const R = (1 - Math.min(1, c * (1 - k) + k));
        const G = (1 - Math.min(1, m * (1 - k) + k));
        const B = (1 - Math.min(1, y * (1 - k) + k));
        r = clamp(Math.round(R * 255), 0, 255);
        g = clamp(Math.round(G * 255), 0, 255);
        b = clamp(Math.round(B * 255), 0, 255);
      } else if (model === "Gray") {
        const v = readFloat32();
        r = g = b = clamp(Math.round(v * 255), 0, 255);
      } else {
        const remaining = blockEnd - off;
        const floats = Math.floor((remaining - 2) / 4);
        for (let i = 0; i < floats; i++) readFloat32();
      }

      const _colorType = readU16();
      const hex = "#" + [r, g, b].map(x => x.toString(16).padStart(2, "0")).join("").toUpperCase();
      out.push({ hex, name: name || null });
    } else {
      off = blockEnd;
    }
  }

  const hexes = out.map(x => x.hex);
  const names = out.map((x, i) => x.name || `Color ${i + 1}`);
  return { hexes, names };
}

// ---------- Import (TXT/JSON/ACO/ASE) ----------
importBtn?.addEventListener("click", () => openImportDialog());

function openImportDialog() {
  const overlay = document.createElement("div");
  styleOverlay(overlay);

  const modal = document.createElement("div");
  Object.assign(modal.style, {
    background: "#0f1b2d", color: "#fff", borderRadius: "12px", border: "2px solid #fff",
    width: "min(820px, 92vw)", maxHeight: "90vh",
    display: "flex", flexDirection: "column", overflow: "hidden"
  });

  const header = document.createElement("div");
  header.innerHTML = "<strong>Import Palette</strong>";
  Object.assign(header.style, { padding: "14px 16px", borderBottom: "1px solid #244" });

  const body = document.createElement("div");
  Object.assign(body.style, { padding: "12px", display: "grid", gridTemplateColumns: "1fr", gap: "12px", overflow: "auto" });

  const tips = document.createElement("div");
  tips.innerHTML = `
    <div style="opacity:.9;line-height:1.5">
      <b>Paste formats (Text/JSON):</b><br/>
      • <code>#AABBCC</code> (lines or comma/semicolon-separated)<br/>
      • <code>Name, #AABBCC</code> or <code>Name: #AABBCC</code><br/>
      • JSON array of hexes: <code>["#112233","#445566"]</code><br/>
      • JSON array of objects: <code>[{ "name":"Blue","hex":"#1E90FF" }]</code><br/><br/>
      <b>Files:</b> .json, .txt, .aco, .ase
    </div>
  `;

  const ta = document.createElement("textarea");
  Object.assign(ta.style, {
    width: "100%", height: "220px", resize: "vertical",
    background: "#0b1526", color: "#e5e7eb", border: "1px solid #244", borderRadius: "8px",
    padding: "10px", fontFamily: "ui-monospace, Menlo, Consolas, monospace"
  });
  ta.placeholder = `#0EA5E9
Slate: #1E293B
["#111827", "#0EA5E9"]
[{"name":"Sky","hex":"#0EA5E9"},{"name":"Slate","hex":"#1E293B"}]`;

  const row = document.createElement("div");
  Object.assign(row.style, { display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" });

  const appendLabel = document.createElement("label");
  appendLabel.style.display = "flex";
  appendLabel.style.alignItems = "center";
  appendLabel.style.gap = "6px";
  const appendCb = document.createElement("input");
  appendCb.type = "checkbox";
  appendLabel.append(appendCb, document.createTextNode("Append (otherwise replace)"));

  const fileBtn = document.createElement("button");
  fileBtn.textContent = "Upload .json/.txt/.aco/.ase";
  stylePrimaryBtn(fileBtn, false);
  fileBtn.addEventListener("click", () => {
    importFile.value = "";
    importFile.setAttribute("accept", ".json,.txt,.aco,.ase");
    importFile.click();
  });

  importFile.onchange = async () => {
    const f = importFile.files?.[0];
    if (!f) return;
    const ext = (f.name.split(".").pop() || "").toLowerCase();
    try {
      if (ext === "aco") {
        const parsed = await parseAcoFile(f);
        ta.value = JSON.stringify(parsed, null, 2);
      } else if (ext === "ase") {
        const parsed = await parseAseFile(f);
        ta.value = JSON.stringify(parsed, null, 2);
      } else {
        ta.value = await f.text();
      }
    } catch (e) {
      alert("Could not read file: " + e.message);
    }
  };

  row.append(appendLabel, fileBtn);

  const errorMsg = document.createElement("div");
  Object.assign(errorMsg.style, { color: "#f87171", minHeight: "1.2em", fontWeight: "600" });

  body.append(tips, ta, row, errorMsg);

  const footer = document.createElement("div");
  Object.assign(footer.style, { padding: "12px", borderTop: "1px solid #244", display: "flex", justifyContent: "flex-end", gap: "8px" });

  const cancel = document.createElement("button");
  cancel.textContent = "Cancel";
  stylePrimaryBtn(cancel, false);
  cancel.addEventListener("click", () => document.body.removeChild(overlay));

  const apply = document.createElement("button");
  apply.textContent = "Import";
  stylePrimaryBtn(apply, true);

  const doImport = () => {
    const raw = ta.value;
    parsePaletteInputFlexible(raw).then(parsed => {
      if (!parsed || parsed.hexes.length < 2) {
        errorMsg.textContent = "Provide at least 2 valid colors or a supported file content.";
        return;
      }
      if (appendCb.checked) {
        colors = colors.concat(parsed.hexes);
        colorNames = colorNames.concat(parsed.names);
        colorFormats = colorFormats.concat(parsed.hexes.map(()=>"HEX"));
      } else {
        colors = parsed.hexes;
        colorNames = parsed.names;
        colorFormats = colors.map(()=>"HEX");
      }
      renderPalette();
      document.body.removeChild(overlay);
    }).catch(err => {
      errorMsg.textContent = err?.message || "Import failed.";
    });
  };

  apply.addEventListener("click", doImport);
  ta.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); doImport(); }
  });

  const overlay_modal = overlay.firstChild;
  overlay_modal.append(header, body, footer);
  overlay.addEventListener("click", e => { if (e.target === overlay) document.body.removeChild(overlay); });
  document.body.appendChild(overlay);
}
async function parsePaletteInputFlexible(raw) {
  if (!raw || !raw.trim()) return null;
  try {
    const j = JSON.parse(raw);
    if (j && Array.isArray(j.hexes)) {
      const hexes = j.hexes.map(normalizeHex).filter(Boolean);
      const names = (Array.isArray(j.names) && j.names.length === hexes.length) ? j.names.slice() : hexes.map((_, i) => `Color ${i + 1}`);
      return { hexes, names };
    }
    if (Array.isArray(j)) {
      if (j.length && typeof j[0] === "string") {
        const hexes = j.map(normalizeHex).filter(Boolean);
        const names = hexes.map((_, i) => `Color ${i + 1}`);
        return { hexes, names };
      }
      if (j.length && typeof j[0] === "object") {
        const pairs = j.map(obj => {
          const hx = normalizeHex(obj.hex || obj.color || obj.colour);
          const nm = String(obj.name || "").trim();
          if (!hx) return null;
          return { hex: hx, name: nm || null };
        }).filter(Boolean);
        const hexes = pairs.map(p => p.hex);
        const names = pairs.map((p, i) => p.name || `Color ${i + 1}`);
        return { hexes, names };
      }
    }
  } catch (_e) { /* not JSON */ }

  const tokens = raw.split(/\r?\n|,|;/g).map(s => s.trim()).filter(Boolean);
  const hexes = [], names = [];
  for (const t of tokens) {
    const m = t.match(/^(.*?)(?:[:\-–—]\s*|\s+)?(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3})$/);
    if (m) {
      const hx = normalizeHex(m[2]);
      if (hx) { hexes.push(hx); names.push(m[1].trim() || `Color ${hexes.length}`); }
    } else {
      const hxOnly = normalizeHex(t);
      if (hxOnly) { hexes.push(hxOnly); names.push(`Color ${hexes.length}`); }
    }
  }
  if (hexes.length) return { hexes, names };
  return null;
}

// ---------- Generate modes ----------
generateBtn.addEventListener("click", () => {
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
    colorFormats = colors.map(()=>"HEX");
    renderPalette();
    modePopup.classList.add("hidden");
  });
});

function hslToHexUI(h, s, l) { // small wrapper for UI gen
  return hslToHex(h, s, l);
}
function hslToHexGen(h, s, l) {
  return hslToHexUI(h, s, l);
}
function generatePaletteFromMode(count, mode) {
  const baseHue = Math.floor(Math.random() * 360);
  const grayLightCount = Math.max(1, Math.floor(count * 0.15));
  const grayDarkCount  = Math.max(1, Math.floor(count * 0.15));
  const accentCount    = count - grayLightCount - grayDarkCount;

  const grayLights = [];
  const grayDarks  = [];
  const accents    = [];

  const createNeutral = (light = true) => {
    const h = Math.floor(Math.random() * 30);
    const s = 4 + Math.random() * 8;
    const l = light ? 85 + Math.random() * 10 : 5 + Math.random() * 15;
    return hslToHexGen(h, s, l);
  };
  const createAccent = (i) => {
    let h = baseHue;
    let s = 60 + Math.random() * 20;
    let l = 45 + Math.random() * 10;
    const spread = 15;

    if (mode === "analogous")          h = (baseHue + i * spread + Math.random() * 5 - 2.5) % 360;
    else if (mode === "complementary") h = (baseHue + (i % 2 === 0 ? 0 : 180) + Math.floor(i / 2) * spread) % 360;
    else if (mode === "monochromatic") { h = baseHue; l = 30 + i * (40 / Math.max(accentCount, 1)); }
    else if (mode === "triadic")       { const offset = (i % 3) * 120; h = (baseHue + offset + Math.floor(i / 3) * spread) % 360; }
    else if (mode === "tetradic")      { const base = (i % 4) * 90; const shift = Math.floor(i / 4) * spread; h = (baseHue + base + shift) % 360; }

    return hslToHexGen(h, s, l);
  };

  for (let i = 0; i < grayDarkCount; i++)  grayDarks.push(createNeutral(false));
  for (let i = 0; i < grayLightCount; i++) grayLights.push(createNeutral(true));
  for (let i = 0; i < accentCount; i++)    accents.push(createAccent(i));

  const groupSize = { analogous: 5, complementary: 2, triadic: 3, tetradic: 4, monochromatic: accentCount }[mode] || 3;
  const sortedAccents = groupAndSortAccents(accents, groupSize);
  const finalPalette = [...grayDarks, ...grayLights, ...sortedAccents];
  colorNames = finalPalette.map((_, i) => `Color ${i + 1}`);
  return finalPalette;
}
function groupAndSortAccents(accents, groupSize) {
  const groups = [];
  for (let i = 0; i < accents.length; i++) {
    const gi = Math.floor(i / groupSize);
    if (!groups[gi]) groups[gi] = [];
    groups[gi].push(accents[i]);
  }
  return groups.flatMap(g => g.sort((a, b) => getHueFromHex(a) - getHueFromHex(b)));
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

// ---------- Style helpers ----------
function styleOverlay(overlay) {
  Object.assign(overlay.style, {
    position: "fixed", inset: "0", background: "rgba(0,0,0,0.7)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
  });
}
function stylePrimaryBtn(btn, filled = true) {
  Object.assign(btn.style, filled ? {
    padding: "12px 16px", borderRadius: "8px", border: "1px solid #3b82f6",
    background: "#3b82f6", color: "#fff", cursor: "pointer", fontWeight: "700"
  } : {
    padding: "12px 16px", borderRadius: "8px", border: "1px solid #3b82f6",
    background: "transparent", color: "#fff", cursor: "pointer", fontWeight: "700"
  });
}
function styleSmallBtn(btn) {
  Object.assign(btn.style, {
    padding: "8px 10px", borderRadius: "8px", border: "1px solid #3b82f6",
    background: "#3b82f6", color: "#fff", cursor: "pointer", fontWeight: "600"
  });
}
function styleToggleButton(button) {
  Object.assign(button.style, {
    padding: "8px 16px", borderRadius: "8px", backgroundColor: "#e0e0e0",
    color: "#333", border: "2px solid #ccc", cursor: "pointer",
    fontWeight: "600", minWidth: "120px"
  });
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
function tabBtnStyle(active) {
  return active ? {
    padding: "12px 16px", border: "0", cursor: "pointer",
    background: "#173055", color: "#fff", fontWeight: "700"
  } : {
    padding: "12px 16px", border: "0", cursor: "pointer",
    background: "transparent", color: "#cbd5e1", fontWeight: "600"
  };
}

// ---------- Initial render ----------
renderPalette();
