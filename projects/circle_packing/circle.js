const canvas = document.getElementById('circleCanvas');
const ctx = canvas.getContext('2d');
const imageInput = document.getElementById('imageInput');

let circles = [];
let img = null;
let imgData = null;
let pixelColors = [];
let isRunning = false;
let circlesPerFrame = 1;
let growthSpeed = 0.5;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const previewBtn = document.getElementById('previewBtn');
const bgToggle = document.getElementById('bgToggle');

previewBtn.addEventListener('mousedown', () => {
  showPreview = true;
});

previewBtn.addEventListener('mouseup', () => {
  showPreview = false;
});

previewBtn.addEventListener('mouseleave', () => {
  showPreview = false;
});

bgToggle.addEventListener('change', (e) => {
  showBackground = e.target.checked;
});


const startStopBtn = document.getElementById('startStopBtn');
const circleRateSlider = document.getElementById('circleRate');
const circleRateLabel = document.getElementById('circleRateLabel');
const speedRateSlider = document.getElementById('speedRate');
const speedRateLabel = document.getElementById('speedRateLabel');
const resetBtn = document.getElementById('resetBtn');
const downloadBtn = document.getElementById('downloadBtn');
const strokeToggle = document.getElementById('strokeToggle');

let maxRadius = 50;
let showPreview = false;
let showBackground = false;

const maxRadiusSlider = document.getElementById('maxRadius');
const maxRadiusLabel = document.getElementById('maxRadiusLabel');

maxRadiusSlider.addEventListener('input', () => {
  maxRadius = parseInt(maxRadiusSlider.value);
  maxRadiusLabel.textContent = maxRadius;
});

let imageReady = false;
let useStroke = false;

circleRateSlider.addEventListener('input', () => {
  circlesPerFrame = parseInt(circleRateSlider.value);
  circleRateLabel.textContent = circlesPerFrame;
});

speedRateSlider.addEventListener('input', () => {
  growthSpeed = parseFloat(speedRateSlider.value);
  speedRateLabel.textContent = growthSpeed.toFixed(1);
});

startStopBtn.addEventListener('click', () => {
    if (!imageReady) {
      alert("Please upload an image first.");
      return;
    }
  
    isRunning = !isRunning;
    startStopBtn.textContent = isRunning ? 'Stop' : 'Start';
});

resetBtn.addEventListener('click', () => {
    isRunning = false;
    startStopBtn.textContent = isRunning ? 'Stop' : 'Start';
    circles = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});
  
downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'circle-packing.png';
    link.href = canvas.toDataURL();
    link.click();
});
  
strokeToggle.addEventListener('change', (e) => {
    useStroke = e.target.checked;
});  

// Resize canvas when the window changes
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (img) {
        drawImageToHiddenCanvas(img);
    }
});

// Handle image upload
imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
    img = new Image();
    img.onload = () => {
        drawImageToHiddenCanvas(img);
        startPacking();
    };
    img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

// Draw the uploaded image to a hidden canvas and extract pixel data
let imageArea = { x: 0, y: 0, width: 0, height: 0 };

function drawImageToHiddenCanvas(image) {
    startStopBtn.disabled = false;
    const imgAspect = image.width / image.height;
    const canvasAspect = canvas.width / canvas.height;

    let drawWidth, drawHeight, offsetX, offsetY;

    if (imgAspect > canvasAspect) {
        // Image is wider than canvas
        drawWidth = canvas.width;
        drawHeight = canvas.width / imgAspect;
        offsetX = 0;
        offsetY = (canvas.height - drawHeight) / 2;
    } else {
        // Image is taller than canvas
        drawHeight = canvas.height;
        drawWidth = canvas.height * imgAspect;
        offsetX = (canvas.width - drawWidth) / 2;
        offsetY = 0;
    }

    imageArea = {
        x: offsetX,
        y: offsetY,
        width: drawWidth,
        height: drawHeight,
    };

    const hiddenCanvas = document.createElement('canvas');
    hiddenCanvas.width = canvas.width;
    hiddenCanvas.height = canvas.height;
    const hiddenCtx = hiddenCanvas.getContext('2d');

    hiddenCtx.clearRect(0, 0, canvas.width, canvas.height);
    hiddenCtx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);

    imgData = hiddenCtx.getImageData(0, 0, canvas.width, canvas.height);
    pixelColors = imgData.data;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    imageReady = true;
}

// Helper to get color from pixel data
function getColorAt(x, y) {
    if (
        x < imageArea.x || x > imageArea.x + imageArea.width ||
        y < imageArea.y || y > imageArea.y + imageArea.height
    ) {
        return null;
    }

    const index = ((Math.floor(y) * canvas.width) + Math.floor(x)) * 4;
    const r = pixelColors[index];
    const g = pixelColors[index + 1];
    const b = pixelColors[index + 2];
    const a = pixelColors[index + 3];

    if (a === 0) return null;

    return `rgb(${r}, ${g}, ${b})`;
}  

// Circle class
class Circle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 1;
        this.growing = true;
        this.color = getColorAt(x, y);
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

        if (useStroke) {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 0.1;
            ctx.stroke();
        } else {
            ctx.fillStyle = this.color;
            ctx.fill();
        }
    }

    grow() {
        if (this.growing) {
            if (this.edges() || this.collides() || this.radius >= maxRadius) {
                this.growing = false;
            } else {
                this.radius += growthSpeed;
            }
        }
    }

    edges() {
        return (
            this.x + this.radius >= canvas.width ||
            this.x - this.radius <= 0 ||
            this.y + this.radius >= canvas.height ||
            this.y - this.radius <= 0
        );
    }

    collides() {
        for (let other of circles) {
            if (other !== this) {
            const d = Math.hypot(this.x - other.x, this.y - other.y);
            if (d < this.radius + other.radius + 2) {
                return true;
            }
            }
        }
        return false;
    }
}

// Try placing a new circle in a random spot
function addNewCircle() {
    let attempts = 0;
    while (attempts < 100) {
        let x = imageArea.x + Math.random() * imageArea.width;
        let y = imageArea.y + Math.random() * imageArea.height;
        const color = getColorAt(x, y);

        if (color && !isNearOtherCircle(x, y)) {
            const newCircle = new Circle(x, y);
            newCircle.color = color;
            circles.push(newCircle);
            break;
        }
        attempts++;
    }
}  

function isNearOtherCircle(x, y) {
    for (let c of circles) {
        if (Math.hypot(x - c.x, y - c.y) < c.radius + 2) {
            return true;
        }
    }
    return false;
}

// Start the packing loop
function startPacking() {
    circles = [];
    animate();
}

// Main animation loop
function animate(time) {
    requestAnimationFrame(animate);

    if (isRunning) {
        for (let i = 0; i < circlesPerFrame; i++) {
            addNewCircle();
        }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 🌄 Draw background image faintly
    if (img && showBackground) {
        ctx.globalAlpha = 0.07;
        ctx.drawImage(img, imageArea.x, imageArea.y, imageArea.width, imageArea.height);
        ctx.globalAlpha = 1.0;
    }

    for (let circle of circles) {
        circle.grow();
        circle.draw(time);
    }

    // 🔍 Draw image preview on top if holding
    if (img && showPreview) {
        ctx.globalAlpha = 1.0;
        ctx.drawImage(img, imageArea.x, imageArea.y, imageArea.width, imageArea.height);
    }
}
  