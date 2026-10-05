// Select HTML Elements
const canvas = document.getElementById('canvasElement');
const ctx = canvas.getContext('2d');

const numInput = document.getElementById('numInput');
const modeSelect = document.getElementById('modeSelect');
const inputHelper = document.getElementById('inputHelper');
const sizeSlider = document.getElementById('sizeSlider');
const sizeDisplay = document.getElementById('sizeDisplay');
const spacingSlider = document.getElementById('spacingSlider');
const spacingDisplay = document.getElementById('spacingDisplay');
const strokeSlider = document.getElementById('strokeSlider');
const strokeDisplay = document.getElementById('strokeDisplay');
const colorSelect = document.getElementById('colorSelect');

const downloadPng = document.getElementById('downloadPng');
const downloadSvg = document.getElementById('downloadSvg');

const accordionHeader = document.getElementById('accordionHeader');
const accordionContent = document.getElementById('accordionContent');

// Settings variables
let glyphHeight = parseInt(sizeSlider.value);
let spacing = parseInt(spacingSlider.value);
let strokeWidth = parseInt(strokeSlider.value);
let strokeColor = colorSelect.value;

// Reference sheet accordion toggle
accordionHeader.addEventListener('click', () => {
    accordionHeader.classList.toggle('active');
    if (accordionHeader.classList.contains('active')) {
        accordionContent.style.maxHeight = accordionContent.scrollHeight + "px";
    } else {
        accordionContent.style.maxHeight = "0";
    }
});

// Setup canvas bounds
function resizeCanvas() {
    const rect = canvas.parentNode.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    draw();
}
window.addEventListener('resize', resizeCanvas);

// Parse input integers or text based on active mode
function parseInput() {
    const text = numInput.value;
    const mode = modeSelect.value;
    const parsed = [];
    
    if (mode === 'numbers') {
        const parts = text.trim().split(/\s+/);
        parts.forEach(part => {
            if (part === '') return;
            const val = parseInt(part, 10);
            if (!isNaN(val) && val >= 0 && val <= 9999) {
                parsed.push({ value: val, label: val.toString() });
            }
        });
    } else if (mode === 'alphabet') {
        // Map letters A-Z (case insensitive) to 1-26. Space is 0.
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char === ' ' || char === '\n' || char === '\t') {
                parsed.push({ value: 0, label: ' ' });
            } else {
                const code = char.toUpperCase().charCodeAt(0);
                if (code >= 65 && code <= 90) { // A-Z
                    const val = code - 64;
                    parsed.push({ value: val, label: char });
                }
            }
        }
    } else if (mode === 'ascii') {
        // Map every character to its ASCII code
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const val = char.charCodeAt(0);
            if (val >= 0 && val <= 9999) {
                parsed.push({ value: val, label: char === ' ' ? ' ' : char });
            }
        }
    }
    
    return parsed;
}

// Draw a quadrant segment using coordinate mirroring variables
function drawQuadrant(cx, cy, h, digit, mirrorX, mirrorY) {
    if (digit === 0) return;
    
    const top = cy + (h / 2) * mirrorY;
    const middle = cy;
    const w = h * 0.35 * mirrorX;
    const dy = h * 0.12 * mirrorY;
    const targetX = cx + w;
    
    ctx.beginPath();
    
    if (digit === 1 || digit === 5 || digit === 7 || digit === 9) {
        ctx.moveTo(cx, top);
        ctx.lineTo(targetX, top);
    }
    if (digit === 2 || digit === 8) {
        ctx.moveTo(cx, top - dy);
        ctx.lineTo(targetX, top - dy);
    }
    if (digit === 3) {
        ctx.moveTo(cx, top);
        ctx.lineTo(targetX, middle);
    }
    if (digit === 4 || digit === 5) {
        ctx.moveTo(cx, middle);
        ctx.lineTo(targetX, top);
    }
    if (digit === 6 || digit === 7 || digit === 8 || digit === 9) {
        ctx.moveTo(targetX, top);
        ctx.lineTo(targetX, middle);
    }
    if (digit === 9) {
        ctx.moveTo(cx, middle);
        ctx.lineTo(targetX, middle);
    }
    
    ctx.stroke();
}

// Generate segment path string for XML/SVG export
function getQuadrantSVG(cx, cy, h, digit, mirrorX, mirrorY, color, sw) {
    if (digit === 0) return '';
    
    const top = cy + (h / 2) * mirrorY;
    const middle = cy;
    const w = h * 0.35 * mirrorX;
    const dy = h * 0.12 * mirrorY;
    const targetX = cx + w;
    
    let lines = '';
    
    if (digit === 1 || digit === 5 || digit === 7 || digit === 9) {
        lines += `<line x1="${cx}" y1="${top}" x2="${targetX}" y2="${top}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" />`;
    }
    if (digit === 2 || digit === 8) {
        lines += `<line x1="${cx}" y1="${top - dy}" x2="${targetX}" y2="${top - dy}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" />`;
    }
    if (digit === 3) {
        lines += `<line x1="${cx}" y1="${top}" x2="${targetX}" y2="${middle}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" />`;
    }
    if (digit === 4 || digit === 5) {
        lines += `<line x1="${cx}" y1="${middle}" x2="${targetX}" y2="${top}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" />`;
    }
    if (digit === 6 || digit === 7 || digit === 8 || digit === 9) {
        lines += `<line x1="${targetX}" y1="${top}" x2="${targetX}" y2="${middle}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" />`;
    }
    if (digit === 9) {
        lines += `<line x1="${cx}" y1="${middle}" x2="${targetX}" y2="${middle}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" />`;
    }
    return lines;
}

// Core draw function
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw subtle blueprint grids
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
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

    const items = parseInput();
    if (items.length === 0) {
        // Draw empty helper state info
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.font = '16px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Type characters or numbers to generate glyphs', canvas.width / 2, canvas.height / 2);
        return;
    }

    // Configure lines rendering
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Calculate layout horizontal offsets to center the glyph group
    const cy = canvas.height / 2;
    const startX = canvas.width / 2 - (items.length - 1) * spacing / 2;

    items.forEach((item, index) => {
        const cx = startX + index * spacing;
        const topY = cy - glyphHeight / 2;
        const bottomY = cy + glyphHeight / 2;
        const num = item.value;

        // Draw central vertical stem
        ctx.beginPath();
        ctx.moveTo(cx, topY);
        ctx.lineTo(cx, bottomY);
        ctx.stroke();

        // Calculate digit values
        const units = num % 10;
        const tens = Math.floor(num / 10) % 10;
        const hundreds = Math.floor(num / 100) % 10;
        const thousands = Math.floor(num / 1000) % 10;

        // 1. Units (Top Right)
        drawQuadrant(cx, cy, glyphHeight, units, 1, -1);
        // 2. Tens (Top Left)
        drawQuadrant(cx, cy, glyphHeight, tens, -1, -1);
        // 3. Hundreds (Bottom Right)
        drawQuadrant(cx, cy, glyphHeight, hundreds, 1, 1);
        // 4. Thousands (Bottom Left)
        drawQuadrant(cx, cy, glyphHeight, thousands, -1, 1);
        
        // Render digit tag label below the glyph
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '13px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(item.label, cx, bottomY + 30);
    });
}

// Generate entire SVG XML content string
function generateSVG() {
    const items = parseInput();
    if (items.length === 0) return null;

    const h = glyphHeight;
    const s = spacing;
    const sw = strokeWidth;
    const color = strokeColor;

    // Pad margins around bounding box
    const totalW = items.length * s + 100;
    const totalH = h + 150;
    const cy = totalH / 2;
    const startX = totalW / 2 - (items.length - 1) * s / 2;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${totalH}" width="${totalW}" height="${totalH}">\n`;
    svg += `  <rect width="100%" height="100%" fill="#090c10" />\n`;

    items.forEach((item, index) => {
        const cx = startX + index * s;
        const topY = cy - h / 2;
        const bottomY = cy + h / 2;
        const num = item.value;

        // Central stem
        svg += `  <line x1="${cx}" y1="${topY}" x2="${cx}" y2="${bottomY}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" />\n`;

        const units = num % 10;
        const tens = Math.floor(num / 10) % 10;
        const hundreds = Math.floor(num / 100) % 10;
        const thousands = Math.floor(num / 1000) % 10;

        // Add segment lines
        svg += `  ` + getQuadrantSVG(cx, cy, h, units, 1, -1, color, sw) + `\n`;
        svg += `  ` + getQuadrantSVG(cx, cy, h, tens, -1, -1, color, sw) + `\n`;
        svg += `  ` + getQuadrantSVG(cx, cy, h, hundreds, 1, 1, color, sw) + `\n`;
        svg += `  ` + getQuadrantSVG(cx, cy, h, thousands, -1, 1, color, sw) + `\n`;

        // Add text tag below stem
        const escapedLabel = item.label.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        svg += `  <text x="${cx}" y="${bottomY + 30}" fill="rgba(255,255,255,0.4)" font-family="monospace" font-size="13" text-anchor="middle">${escapedLabel}</text>\n`;
    });

    svg += `</svg>`;
    return svg;
}

// Download helpers
downloadSvg.addEventListener('click', () => {
    const svgContent = generateSVG();
    if (!svgContent) return;

    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cistercian_numerals.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
});

downloadPng.addEventListener('click', () => {
    const svgContent = generateSVG();
    if (!svgContent) return;

    const img = new Image();
    // Parse values to size bounding boxes
    const s = spacing;
    const items = parseInput();
    const totalW = items.length * s + 100;
    const totalH = glyphHeight + 150;

    img.width = totalW;
    img.height = totalH;

    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
        // Render SVG to temporary canvas
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = totalW;
        tempCanvas.height = totalH;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(img, 0, 0);

        // Download PNG
        const pngUrl = tempCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = 'cistercian_numerals.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    img.src = url;
});

// Event Listeners for settings inputs
numInput.addEventListener('input', draw);

sizeSlider.addEventListener('input', (evt) => {
    glyphHeight = parseInt(evt.target.value);
    sizeDisplay.innerText = glyphHeight + 'px';
    draw();
});

spacingSlider.addEventListener('input', (evt) => {
    spacing = parseInt(evt.target.value);
    spacingDisplay.innerText = spacing + 'px';
    draw();
});

strokeSlider.addEventListener('input', (evt) => {
    strokeWidth = parseInt(evt.target.value);
    strokeDisplay.innerText = strokeWidth + 'px';
    draw();
});

colorSelect.addEventListener('change', (evt) => {
    strokeColor = evt.target.value;
    draw();
});

// Mode selection change updates input placeholder & defaults
modeSelect.addEventListener('change', () => {
    const mode = modeSelect.value;
    if (mode === 'numbers') {
        numInput.placeholder = "Enter integers between 0 and 9999 (e.g. 1993 4723 9433)...";
        numInput.value = "1993 4723 6859 7085 9433";
        inputHelper.innerText = "Type space-separated values to display multiple glyphs side-by-side. Numbers must be in the range 0 - 9999.";
    } else if (mode === 'alphabet') {
        numInput.placeholder = "Enter words to translate to Cistercian alphabet runes (e.g. HELLO)...";
        numInput.value = "CISTERCIAN";
        inputHelper.innerText = "Type text. Each letter (A-Z) corresponds to a glyph (1-26). Space is drawn as a plain stem (0).";
    } else if (mode === 'ascii') {
        numInput.placeholder = "Enter text/sentences to map to ASCII glyphs (e.g. Hi!)...";
        numInput.value = "Hello World!";
        inputHelper.innerText = "Translates each character of the text into its ASCII decimal value (32 - 126) and renders them in order.";
    }
    draw();
});

// Initial boot configurations
resizeCanvas();
