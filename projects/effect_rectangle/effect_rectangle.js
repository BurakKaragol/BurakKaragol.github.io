// HTML elements
const videoElement = document.getElementById('videoElement');
const canvasElement = document.getElementById('canvasElement');
const canvasCtx = canvasElement.getContext('2d');
const loadingText = document.getElementById('loading');
const recordBtn = document.getElementById('recordBtn');
const recordBtnText = document.getElementById('recordBtnText');
const recTimer = document.getElementById('recTimer');
const recEngineLabel = document.getElementById('recEngine');
const activeEffectLabel = document.getElementById('activeEffectLabel');
const chkFrame = document.getElementById('chkFrame');
const chkEffect = document.getElementById('chkEffect');

// Create a hidden canvas entirely for processing and MediaRecorder/WebCodecs input
const recordingCanvas = document.createElement('canvas');
const recCtx = recordingCanvas.getContext('2d');



// List of effects (CSS filter strings, custom canvas scripts, or shaders)
const EFFECTS = [
    { name: "Normal", type: "css", filter: "none" },
    { name: "Grayscale", type: "css", filter: "grayscale(100%)" },
    { name: "Retro Vintage", type: "css", filter: "contrast(140%) brightness(110%) sepia(50%)" },
    { name: "Inverted", type: "css", filter: "invert(100%)" },
    { name: "Monochrome Red", type: "css", filter: "contrast(150%) brightness(90%) sepia(100%) hue-rotate(-50deg) saturate(600%)" },
    { name: "Monochrome Green", type: "css", filter: "contrast(150%) brightness(90%) sepia(100%) hue-rotate(60deg) saturate(600%)" },
    { name: "Monochrome Blue", type: "css", filter: "contrast(150%) brightness(90%) sepia(100%) hue-rotate(180deg) saturate(600%)" },
    { name: "Faux Thermal", type: "css", filter: "sepia(100%) hue-rotate(180deg) saturate(300%)" },
    { name: "True Thermal", type: "custom", fn: applyTrueThermal },
    { name: "FLIR Ironbow", type: "custom", fn: applyIronbow },
    { name: "Cyber Hologram", type: "hologram" },
    { name: "RGB Glitch", type: "custom", fn: applyRGBSplit },
    { name: "Night Vision", type: "custom", fn: applyNightVision },
    { name: "Solarize", type: "custom", fn: applySolarize },
    { name: "Sobel Edges", type: "custom", fn: applySobel },
    { name: "8-Bit Retro", type: "pixelate" },
    { name: "B&W Threshold", type: "custom", fn: applyBinary },
    { name: "Engraved Emboss", type: "custom", fn: applyEmboss },
    { name: "Classic Movie", type: "film" },
    { name: "Pencil Sketch", type: "custom", fn: applySketch },
    { name: "Analog CRT", type: "crt" },
    { name: "Cyberpunk", type: "duotone" },
    { name: "ASCII Art", type: "ascii" },
    { name: "Comic Halftone", type: "halftone" },
    { name: "Cinematic Lomo", type: "vignette" },
    { name: "Rainbow Cycle", type: "rainbow" }
];
let currentEffectIndex = 0;
let lastToggleTime = 0;

// Recording variables
let isRecording = false;
let recordedChunks = [];
let mediaRecorder = null;
let useWebCodecs = false;

// WebCodecs variables
let muxer = null;
let encoder = null;
let recordingStartTime = 0;
let recordedFramesCount = 0;

// Timer variables
let timerInterval = null;
let timerStart = 0;

// Flash feedback
let isFlashing = false;
let flashStartTime = 0;

// Detect WebCodecs and Mp4Muxer support
function detectRecordingEngine() {
    const hasWebCodecs = typeof VideoEncoder !== 'undefined' && typeof VideoFrame !== 'undefined';
    const hasMuxer = typeof Mp4Muxer !== 'undefined';
    
    if (hasWebCodecs && hasMuxer) {
        useWebCodecs = true;
        recEngineLabel.textContent = "WebCodecs (MP4)";
        recEngineLabel.style.backgroundColor = "rgba(0, 230, 118, 0.15)";
        recEngineLabel.style.color = "var(--success-color)";
    } else {
        useWebCodecs = false;
        recEngineLabel.textContent = "MediaRecorder (Fallback)";
        recEngineLabel.style.backgroundColor = "rgba(255, 152, 0, 0.15)";
        recEngineLabel.style.color = "#ffa726";
    }
}
detectRecordingEngine();

const filterGrid = document.getElementById('filterSelectorGrid');
const filterBtnElements = [];

// Dynamically generate filter selection buttons
EFFECTS.forEach((eff, idx) => {
    const btn = document.createElement('button');
    btn.className = `filter-btn${idx === 0 ? ' active' : ''}`;
    btn.textContent = eff.name;
    btn.dataset.index = idx;
    btn.addEventListener('click', () => {
        setActiveEffect(idx);
    });
    filterGrid.appendChild(btn);
    filterBtnElements.push(btn);
});

function setActiveEffect(idx) {
    currentEffectIndex = idx;
    filterBtnElements.forEach((btn, bIdx) => {
        if (bIdx === idx) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    activeEffectLabel.textContent = `Effect: ${EFFECTS[idx].name}`;
}

// Flash feedback trigger
function triggerFlash() {
    isFlashing = true;
    flashStartTime = Date.now();
    
    // UI Flash visual effect class
    canvasElement.parentElement.classList.add('flash-active');
    
    // Quick flash timeout
    setTimeout(() => {
        canvasElement.parentElement.classList.remove('flash-active');
        isFlashing = false;
    }, 150);
}

// Distance helper
function calculateDistance(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

// Build quadrilateral path
function buildFramePath(ctx, h1Index, h2Index, h2Thumb, h1Thumb) {
    ctx.beginPath();
    ctx.moveTo(h1Index.x, h1Index.y);
    ctx.lineTo(h2Index.x, h2Index.y);
    ctx.lineTo(h2Thumb.x, h2Thumb.y);
    ctx.lineTo(h1Thumb.x, h1Thumb.y);
    ctx.closePath();
}



// Download Helper
function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

// Recording Timer
function startTimer() {
    timerStart = Date.now();
    timerInterval = setInterval(() => {
        const elapsed = Date.now() - timerStart;
        const seconds = Math.floor(elapsed / 1000);
        const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
        const ss = String(seconds % 60).padStart(2, '0');
        recTimer.textContent = `${mm}:${ss}`;
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    recTimer.textContent = "00:00";
}

// Recording controls
recordBtn.addEventListener('click', () => {
    if (!isRecording) {
        startRecording();
    } else {
        stopRecording();
    }
});

async function startRecording() {
    const width = videoElement.videoWidth || 1280;
    const height = videoElement.videoHeight || 720;

    recordedChunks = [];
    isRecording = true;
    recordBtn.classList.add('recording');
    recordBtnText.textContent = "Stop & Save";
    startTimer();

    if (useWebCodecs) {
        try {
            // Setup mp4-muxer
            muxer = new Mp4Muxer.Muxer({
                target: new Mp4Muxer.ArrayBufferTarget(),
                video: {
                    codec: 'avc',
                    width: width,
                    height: height
                },
                fastStart: 'in-memory'
            });

            // Setup VideoEncoder
            encoder = new VideoEncoder({
                output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
                error: (e) => {
                    console.error("WebCodecs VideoEncoder error:", e);
                    fallbackToMediaRecorderStream();
                }
            });

            encoder.configure({
                codec: 'avc1.42E01E', // Profile Baseline
                width: width,
                height: height,
                bitrate: 2.5e6, // 2.5 Mbps
                framerate: 30
            });

            recordingStartTime = performance.now();
            recordedFramesCount = 0;
        } catch (err) {
            console.warn("WebCodecs initialization failed, falling back to MediaRecorder", err);
            useWebCodecs = false;
            fallbackToMediaRecorderStream();
        }
    } else {
        fallbackToMediaRecorderStream();
    }
}

function fallbackToMediaRecorderStream() {
    const stream = recordingCanvas.captureStream(30);
    let options = {};
    let mime = 'video/webm';
    let ext = 'webm';

    if (MediaRecorder.isTypeSupported('video/mp4')) {
        options = { mimeType: 'video/mp4;codecs=avc1' };
        mime = 'video/mp4';
        ext = 'mp4';
    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
        options = { mimeType: 'video/webm;codecs=vp9' };
    }

    try {
        mediaRecorder = new MediaRecorder(stream, options);
    } catch (e) {
        mediaRecorder = new MediaRecorder(stream);
    }

    mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };

    mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: mime });
        downloadBlob(blob, `ar-effect-rectangle-export.${ext}`);
    };

    mediaRecorder.start();
}

async function stopRecording() {
    isRecording = false;
    recordBtn.classList.remove('recording');
    recordBtnText.textContent = "Record Session";
    stopTimer();

    if (useWebCodecs) {
        if (encoder) {
            await encoder.flush();
            encoder.close();
            encoder = null;
        }
        if (muxer) {
            muxer.finalize();
            const buffer = muxer.target.buffer;
            const blob = new Blob([buffer], { type: 'video/mp4' });
            downloadBlob(blob, 'ar-effect-rectangle-export.mp4');
            muxer = null;
        }
    } else {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
    }
}

// Offscreen canvas for custom pixel-manipulation filters
const offscreenCanvas = document.createElement('canvas');
const offscreenCtx = offscreenCanvas.getContext('2d');

// B&W High-Contrast Threshold filter
function applyBinary(data) {
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const v = (0.2126 * r + 0.7152 * g + 0.0722 * b >= 128) ? 255 : 0;
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v;
    }
}

// Sobel Edge Detection filter convolving standard kernels
function applySobel(data, width, height) {
    const grayscale = new Uint8Array(width * height);
    for (let i = 0; i < data.length; i += 4) {
        grayscale[i / 4] = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
    }
    
    const output = new Uint8ClampedArray(data.length);
    
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = y * width + x;
            
            // Horizontal gradient (Sobel kernel X)
            const gx = 
                -1 * grayscale[idx - width - 1] + 1 * grayscale[idx - width + 1] +
                -2 * grayscale[idx - 1]         + 2 * grayscale[idx + 1] +
                -1 * grayscale[idx + width - 1] + 1 * grayscale[idx + width + 1];
                
            // Vertical gradient (Sobel kernel Y)
            const gy = 
                -1 * grayscale[idx - width - 1] - 2 * grayscale[idx - width] - 1 * grayscale[idx - width + 1] +
                1 * grayscale[idx + width - 1] + 2 * grayscale[idx + width] + 1 * grayscale[idx + width + 1];
                
            const mag = Math.min(255, Math.sqrt(gx * gx + gy * gy));
            const outIdx = idx * 4;
            
            output[outIdx] = mag * 0.15;    // R: Glowing cyan hue
            output[outIdx + 1] = mag * 0.85; // G
            output[outIdx + 2] = mag;       // B
            output[outIdx + 3] = 255;       // A
        }
    }
    
    for (let i = 0; i < data.length; i++) {
        data[i] = output[i];
    }
}

// True Thermal Map convolving classic JET palette
function applyTrueThermal(data) {
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        
        let tr, tg, tb;
        if (gray < 64) {
            tr = 0;
            tg = gray * 4;
            tb = 255;
        } else if (gray < 128) {
            tr = 0;
            tg = 255;
            tb = 255 - (gray - 64) * 4;
        } else if (gray < 192) {
            tr = (gray - 128) * 4;
            tg = 255;
            tb = 0;
        } else {
            tr = 255;
            tg = 255 - (gray - 192) * 4;
            tb = 0;
        }
        data[i] = tr;
        data[i + 1] = tg;
        data[i + 2] = tb;
    }
}

// Chromatic Aberration horizontal RGB split
function applyRGBSplit(data, width, height) {
    const shift = 10;
    const original = new Uint8ClampedArray(data);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const redX = Math.max(0, x - shift);
            const blueX = Math.min(width - 1, x + shift);
            
            const redIdx = (y * width + redX) * 4;
            const blueIdx = (y * width + blueX) * 4;
            
            data[idx] = original[redIdx];
            data[idx + 2] = original[blueIdx + 2];
        }
    }
}

// Night Vision Green Goggles with static noise
function applyNightVision(data) {
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        const noise = (Math.random() - 0.5) * 45;
        const greenVal = Math.min(255, Math.max(0, gray + 25 + noise));
        
        data[i] = greenVal * 0.1;
        data[i + 1] = greenVal;
        data[i + 2] = greenVal * 0.15;
    }
}

// Metal / Engraved Emboss filter convolving emboss kernel
function applyEmboss(data, width, height) {
    const grayscale = new Uint8Array(width * height);
    for (let i = 0; i < data.length; i += 4) {
        grayscale[i / 4] = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
    }
    
    const output = new Uint8ClampedArray(data.length);
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = y * width + x;
            const val = 
                -2 * grayscale[idx - width - 1] - 1 * grayscale[idx - width] +
                -1 * grayscale[idx - 1]         + 1 * grayscale[idx]         + 1 * grayscale[idx + 1] +
                1 * grayscale[idx + width]      + 2 * grayscale[idx + width + 1] + 128;
            
            const v = Math.min(255, Math.max(0, val));
            const outIdx = idx * 4;
            output[outIdx] = v;
            output[outIdx + 1] = v;
            output[outIdx + 2] = v;
            output[outIdx + 3] = 255;
        }
    }
    for (let i = 0; i < data.length; i++) {
        data[i] = output[i];
    }
}

// Solarization filter (inverts midtones/highlights)
function applySolarize(data) {
    for (let i = 0; i < data.length; i += 4) {
        data[i] = data[i] > 120 ? 255 - data[i] : data[i];
        data[i + 1] = data[i + 1] > 120 ? 255 - data[i + 1] : data[i + 1];
        data[i + 2] = data[i + 2] > 120 ? 255 - data[i + 2] : data[i + 2];
    }
}

// FLIR Ironbow thermal map color palette
function applyIronbow(data) {
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        
        let tr, tg, tb;
        if (gray < 64) {
            tr = gray * 2;
            tg = 0;
            tb = gray * 4;
        } else if (gray < 128) {
            tr = 128 + (gray - 64) * 2;
            tg = (gray - 64) * 2;
            tb = 255 - (gray - 64) * 4;
        } else if (gray < 192) {
            tr = 255;
            tg = 128 + (gray - 128) * 2;
            tb = 0;
        } else {
            tr = 255;
            tg = 255;
            tb = (gray - 192) * 4;
        }
        data[i] = tr;
        data[i + 1] = tg;
        data[i + 2] = tb;
    }
}


// Fine pencil sketch convolving inverted Sobel outline gradients
function applySketch(data, width, height) {
    const grayscale = new Uint8Array(width * height);
    for (let i = 0; i < data.length; i += 4) {
        grayscale[i / 4] = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
    }
    
    const output = new Uint8ClampedArray(data.length);
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = y * width + x;
            
            const gx = 
                -1 * grayscale[idx - width - 1] + 1 * grayscale[idx - width + 1] +
                -2 * grayscale[idx - 1]         + 2 * grayscale[idx + 1] +
                -1 * grayscale[idx + width - 1] + 1 * grayscale[idx + width + 1];
                
            const gy = 
                -1 * grayscale[idx - width - 1] - 2 * grayscale[idx - width] - 1 * grayscale[idx - width + 1] +
                1 * grayscale[idx + width - 1] + 2 * grayscale[idx + width] + 1 * grayscale[idx + width + 1];
                
            const mag = Math.sqrt(gx * gx + gy * gy);
            const sketchVal = Math.min(255, Math.max(0, 255 - mag * 1.5));
            
            const outIdx = idx * 4;
            output[outIdx] = sketchVal;
            output[outIdx + 1] = sketchVal;
            output[outIdx + 2] = sketchVal;
            output[outIdx + 3] = 255;
        }
    }
    for (let i = 0; i < data.length; i++) {
        data[i] = output[i];
    }
}

// Apply visual filters inside the clipped canvas paths
function applyVisualEffect(ctx, image, width, height) {
    const eff = EFFECTS[currentEffectIndex];
    ctx.save();
    ctx.clip();
    
    if (eff.type === 'css') {
        if (eff.filter !== 'none') {
            ctx.filter = eff.filter;
        }
        ctx.drawImage(image, 0, 0, width, height);
        ctx.filter = 'none';
    } else if (eff.type === 'hologram') {
        ctx.drawImage(image, 0, 0, width, height);
        
        ctx.fillStyle = 'rgba(61, 169, 252, 0.15)';
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let y = 0; y < height; y += 6) {
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
        }
        ctx.stroke();
    } else if (eff.type === 'pixelate') {
        const pixelSize = 12;
        const w = Math.max(1, Math.ceil(width / pixelSize));
        const h = Math.max(1, Math.ceil(height / pixelSize));
        
        offscreenCanvas.width = w;
        offscreenCanvas.height = h;
        
        offscreenCtx.drawImage(image, 0, 0, w, h);
        
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(offscreenCanvas, 0, 0, w, h, 0, 0, width, height);
        ctx.imageSmoothingEnabled = true;
    } else if (eff.type === 'ascii') {
        offscreenCanvas.width = width;
        offscreenCanvas.height = height;
        offscreenCtx.drawImage(image, 0, 0, width, height);
        const imgData = offscreenCtx.getImageData(0, 0, width, height);
        const data = imgData.data;
        
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);
        
        ctx.fillStyle = '#00ff00';
        ctx.font = '9px monospace';
        const chars = '@#*+=:-. ';
        const cellSize = 8;
        
        for (let y = 0; y < height; y += cellSize) {
            for (let x = 0; x < width; x += cellSize) {
                const idx = (y * width + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                const brightness = 0.2126 * r + 0.7152 * g + 0.0722 * b;
                const charIdx = Math.floor((brightness / 255) * (chars.length - 1));
                ctx.fillText(chars[charIdx], x, y + cellSize);
            }
        }
    } else if (eff.type === 'halftone') {
        offscreenCanvas.width = width;
        offscreenCanvas.height = height;
        offscreenCtx.drawImage(image, 0, 0, width, height);
        const imgData = offscreenCtx.getImageData(0, 0, width, height);
        const data = imgData.data;
        
        ctx.fillStyle = '#fbf0d9';
        ctx.fillRect(0, 0, width, height);
        
        ctx.fillStyle = '#111111';
        const dotSize = 8;
        for (let y = 0; y < height; y += dotSize) {
            for (let x = 0; x < width; x += dotSize) {
                const idx = (y * width + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                const brightness = 0.2126 * r + 0.7152 * g + 0.0722 * b;
                const radius = (1 - brightness / 255) * (dotSize / 2) * 1.2;
                if (radius > 0.5) {
                    ctx.beginPath();
                    ctx.arc(x + dotSize/2, y + dotSize/2, radius, 0, 2*Math.PI);
                    ctx.fill();
                }
            }
        }
    } else if (eff.type === 'vignette') {
        ctx.filter = 'contrast(150%) saturate(140%)';
        ctx.drawImage(image, 0, 0, width, height);
        ctx.filter = 'none';
        
        const grad = ctx.createRadialGradient(width/2, height/2, Math.min(width, height) * 0.2, width/2, height/2, Math.max(width, height) * 0.7);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.8)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
    } else if (eff.type === 'rainbow') {
        const angle = (Date.now() / 12) % 360;
        ctx.filter = `hue-rotate(${angle}deg) saturate(200%) contrast(120%)`;
        ctx.drawImage(image, 0, 0, width, height);
        ctx.filter = 'none';
    } else if (eff.type === 'crt') {
        ctx.filter = 'contrast(130%) brightness(105%) saturate(120%)';
        ctx.drawImage(image, 0, 0, width, height);
        ctx.filter = 'none';
        
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let y = 0; y < height; y += 4) {
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
        }
        ctx.stroke();
        
        if (Math.random() < 0.15) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.fillRect(0, Math.random() * height, width, Math.random() * 15);
        }
    } else if (eff.type === 'film') {
        ctx.filter = 'sepia(80%) contrast(120%) brightness(95%)';
        ctx.drawImage(image, 0, 0, width, height);
        ctx.filter = 'none';
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.lineWidth = 0.8;
        if (Math.random() < 0.25) {
            ctx.beginPath();
            const sx = Math.random() * width;
            ctx.moveTo(sx, 0);
            ctx.lineTo(sx + (Math.random() - 0.5) * 15, height);
            ctx.stroke();
        }
        if (Math.random() < 0.35) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
            ctx.beginPath();
            ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 2 + 0.5, 0, 2 * Math.PI);
            ctx.fill();
        }
    } else if (eff.type === 'duotone') {
        ctx.filter = 'grayscale(100%) contrast(125%)';
        ctx.drawImage(image, 0, 0, width, height);
        ctx.filter = 'none';
        
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, '#00ffff'); // Cyan
        grad.addColorStop(1, '#ff00ff'); // Magenta
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
    } else if (eff.type === 'custom') {
        offscreenCanvas.width = width;
        offscreenCanvas.height = height;
        offscreenCtx.drawImage(image, 0, 0, width, height);
        
        const imgData = offscreenCtx.getImageData(0, 0, width, height);
        eff.fn(imgData.data, width, height);
        offscreenCtx.putImageData(imgData, 0, 0);
        
        ctx.drawImage(offscreenCanvas, 0, 0);
    }
    
    ctx.restore();
}

// MediaPipe Results Processing
function onResults(results) {
    // Hide loader
    if (loadingText.style.display !== 'none') {
        loadingText.style.display = 'none';
    }

    const width = videoElement.videoWidth || 640;
    const height = videoElement.videoHeight || 480;

    // Sync canvas resolutions
    if (canvasElement.width !== width || canvasElement.height !== height) {
        canvasElement.width = width;
        canvasElement.height = height;
        recordingCanvas.width = width;
        recordingCanvas.height = height;
    }

    canvasCtx.save();
    recCtx.save();

    // Reset filters to avoid state leaks in browsers where save/restore doesn't track it
    canvasCtx.filter = 'none';
    recCtx.filter = 'none';

    // 1. Draw raw video feed onto both contexts
    canvasCtx.drawImage(results.image, 0, 0, width, height);
    recCtx.drawImage(results.image, 0, 0, width, height);

    // 2. Process hands
    if (results.multiHandLandmarks && results.multiHandLandmarks.length === 2) {
        const hand1 = results.multiHandLandmarks[0];
        const hand2 = results.multiHandLandmarks[1];

        // Frame corners: Hand 1 Index (8) & Thumb (4), Hand 2 Index (8) & Thumb (4)
        const h1Index = { x: hand1[8].x * width, y: hand1[8].y * height };
        const h1Thumb = { x: hand1[4].x * width, y: hand1[4].y * height };
        const h2Index = { x: hand2[8].x * width, y: hand2[8].y * height };
        const h2Thumb = { x: hand2[4].x * width, y: hand2[4].y * height };

        // Check for pinches on both hands (index tip + thumb tip)
        const dist1 = calculateDistance(hand1[8], hand1[4]);
        const dist2 = calculateDistance(hand2[8], hand2[4]);
        const pinchThreshold = 0.045; // Normalized coordinate distance threshold

        const isHand1Pinching = dist1 < pinchThreshold;
        const isHand2Pinching = dist2 < pinchThreshold;

        const now = Date.now();
        const isDualPinch = isHand1Pinching && isHand2Pinching;

        // Toggle effect on dual pinch
        if (isDualPinch && (now - lastToggleTime > 800)) {
            const nextIdx = (currentEffectIndex + 1) % EFFECTS.length;
            setActiveEffect(nextIdx);
            lastToggleTime = now;
            triggerFlash();
        }

        // Apply visual framing & effects inside the frame
        if (!isFlashing) {
            // Setup framing paths
            buildFramePath(canvasCtx, h1Index, h2Index, h2Thumb, h1Thumb);
            buildFramePath(recCtx, h1Index, h2Index, h2Thumb, h1Thumb);

            // A. VISIBLE DISPLAY
            applyVisualEffect(canvasCtx, results.image, width, height);

            // Draw outline on visible display
            buildFramePath(canvasCtx, h1Index, h2Index, h2Thumb, h1Thumb);
            canvasCtx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            canvasCtx.lineWidth = 3.5;
            canvasCtx.lineJoin = 'round';
            canvasCtx.shadowBlur = 10;
            canvasCtx.shadowColor = 'rgba(61, 169, 252, 0.5)';
            canvasCtx.stroke();
            canvasCtx.shadowBlur = 0; // reset

            // B. RECORDING CANVAS (Configurable by checkboxes)
            if (chkEffect.checked) {
                applyVisualEffect(recCtx, results.image, width, height);
            }

            if (chkFrame.checked) {
                buildFramePath(recCtx, h1Index, h2Index, h2Thumb, h1Thumb);
                recCtx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                recCtx.lineWidth = 3.5;
                recCtx.lineJoin = 'round';
                recCtx.shadowBlur = 10;
                recCtx.shadowColor = 'rgba(61, 169, 252, 0.5)';
                recCtx.stroke();
                recCtx.shadowBlur = 0;
            }
        } else {
            // Flash state (white screen within frame)
            canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            buildFramePath(canvasCtx, h1Index, h2Index, h2Thumb, h1Thumb);
            canvasCtx.fill();

            if (chkEffect.checked) {
                recCtx.fillStyle = 'rgba(255, 255, 255, 0.85)';
                buildFramePath(recCtx, h1Index, h2Index, h2Thumb, h1Thumb);
                recCtx.fill();
            }
        }
    }

    canvasCtx.restore();
    recCtx.restore();

    // 3. Process video encoding for WebCodecs
    if (isRecording && useWebCodecs && encoder) {
        const timestampMs = performance.now() - recordingStartTime;
        const timestampUs = Math.round(timestampMs * 1000);
        
        try {
            const frame = new VideoFrame(recordingCanvas, { timestamp: timestampUs });
            const isKeyframe = (recordedFramesCount % 30 === 0);
            encoder.encode(frame, { keyFrame: isKeyframe });
            frame.close();
            recordedFramesCount++;
        } catch (e) {
            console.error("Failed to capture and encode VideoFrame", e);
        }
    }
}

// MediaPipe Hands Init
const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.65,
    minTrackingConfidence: 0.65
});

hands.onResults(onResults);

// Camera Init
const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({ image: videoElement });
    },
    width: 1280,
    height: 720
});

// Start camera stream
camera.start().catch(err => {
    console.error("Camera start failed: ", err);
    alert("Could not access camera. Please ensure camera is connected and page is loaded under a secure context (https/localhost).");
});
