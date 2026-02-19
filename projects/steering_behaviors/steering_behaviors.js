const canvas = document.getElementById('simulationCanvas');
const ctx = canvas.getContext('2d');

let width, height;

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// --- Configuration ---
const config = {
    separationWeight: 1.5,
    alignmentWeight: 1.0,
    cohesionWeight: 1.0,
    maxSpeed: 4,
    maxForce: 0.1,
    perceptionRadius: 50,
    showPerception: false,
    showAlignment: false,
    showCohesion: false,
    showSeparation: false,
    boidColor: '#58a6ff',
    predatorColor: '#ff4d4d'
};

// --- Vector Utility ---
class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(v) { this.x += v.x; this.y += v.y; return this; }
    sub(v) { this.x -= v.x; this.y -= v.y; return this; }
    mult(n) { this.x *= n; this.y *= n; return this; }
    div(n) { this.x /= n; this.y /= n; return this; }

    mag() { return Math.sqrt(this.x * this.x + this.y * this.y); }

    setMag(n) {
        const m = this.mag();
        if (m !== 0) this.mult(n / m);
        return this;
    }

    limit(max) {
        if (this.mag() > max) this.setMag(max);
        return this;
    }

    static dist(v1, v2) {
        const dx = v1.x - v2.x;
        const dy = v1.y - v2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    copy() { return new Vector(this.x, this.y); }
}

// --- Boid Class ---
class Boid {
    constructor(x, y, isPredator = false) {
        this.position = new Vector(x, y);
        this.velocity = new Vector(Math.random() - 0.5, Math.random() - 0.5);
        this.velocity.setMag(Math.random() * 2 + 2);
        this.acceleration = new Vector(0, 0);
        this.isPredator = isPredator;

        // Caching forces for debug visualization
        this.debugAlignment = new Vector(0, 0);
        this.debugCohesion = new Vector(0, 0);
        this.debugSeparation = new Vector(0, 0);
    }

    edges() {
        if (this.position.x > width) this.position.x = 0;
        else if (this.position.x < 0) this.position.x = width;
        if (this.position.y > height) this.position.y = 0;
        else if (this.position.y < 0) this.position.y = height;
    }

    align(boids) {
        let steering = new Vector(0, 0);
        let total = 0;
        for (let other of boids) {
            let d = Vector.dist(this.position, other.position);
            if (other !== this && d < config.perceptionRadius && !other.isPredator) {
                steering.add(other.velocity);
                total++;
            }
        }
        if (total > 0) {
            steering.div(total);
            steering.setMag(config.maxSpeed);
            steering.sub(this.velocity);
            steering.limit(config.maxForce);
        }
        return steering;
    }

    cohesion(boids) {
        let steering = new Vector(0, 0);
        let total = 0;
        for (let other of boids) {
            let d = Vector.dist(this.position, other.position);
            if (other !== this && d < config.perceptionRadius && !other.isPredator) {
                steering.add(other.position);
                total++;
            }
        }
        if (total > 0) {
            steering.div(total);
            steering.sub(this.position);
            steering.setMag(config.maxSpeed);
            steering.sub(this.velocity);
            steering.limit(config.maxForce);
        }
        return steering;
    }

    separation(boids) {
        let steering = new Vector(0, 0);
        let total = 0;
        for (let other of boids) {
            let d = Vector.dist(this.position, other.position);
            if (other !== this && d < config.perceptionRadius) {
                let diff = this.position.copy().sub(other.position);

                // Stronger separation from predators
                let weight = other.isPredator ? 8 : 1;

                diff.div(d * d); // Inversely proportional to distance
                diff.mult(weight);
                steering.add(diff);
                total++;
            }
        }
        if (total > 0) {
            steering.div(total);
            steering.setMag(config.maxSpeed);
            steering.sub(this.velocity);
            steering.limit(config.maxForce);
        }
        return steering;
    }

    flock(boids) {
        if (this.isPredator) {
            // Basic predator momentum
            return;
        }

        let alignment = this.align(boids);
        let cohesion = this.cohesion(boids);
        let separation = this.separation(boids);

        // Store for debug drawing (before weighting)
        this.debugAlignment = alignment.copy().mult(500); // Scale up for visibility
        this.debugCohesion = cohesion.copy().mult(500);
        this.debugSeparation = separation.copy().mult(500);

        alignment.mult(config.alignmentWeight);
        cohesion.mult(config.cohesionWeight);
        separation.mult(config.separationWeight);

        this.acceleration.add(alignment);
        this.acceleration.add(cohesion);
        this.acceleration.add(separation);
    }

    update() {
        this.position.add(this.velocity);
        this.velocity.add(this.acceleration);
        this.velocity.limit(this.isPredator ? config.maxSpeed * 1.2 : config.maxSpeed);
        this.acceleration.mult(0); // Reset acceleration
        this.edges();
    }

    show() {
        // Draw Triangle
        const angle = Math.atan2(this.velocity.y, this.velocity.x);

        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(angle);

        ctx.beginPath();
        if (this.isPredator) {
            // Larger, sharper triangle
            ctx.moveTo(15, 0);
            ctx.lineTo(-10, 8);
            ctx.lineTo(-5, 0);
            ctx.lineTo(-10, -8);
            ctx.fillStyle = config.predatorColor;
        } else {
            // Normal boid
            ctx.moveTo(10, 0);
            ctx.lineTo(-6, 5);
            ctx.lineTo(-6, -5);
            ctx.fillStyle = config.boidColor;
        }
        ctx.closePath();

        ctx.fill();
        ctx.restore();

        // Optional: Show perception radius
        if (config.showPerception && !this.isPredator) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, config.perceptionRadius, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Debug Vectors
        if (!this.isPredator) {
            if (config.showAlignment) this.drawVector(this.debugAlignment, '#4CAF50');
            if (config.showCohesion) this.drawVector(this.debugCohesion, '#2196F3');
            if (config.showSeparation) this.drawVector(this.debugSeparation, '#f44336');
        }
    }

    drawVector(v, color) {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(v.x, v.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
    }
}

// --- Main execution ---
const flock = [];

function init() {
    flock.length = 0;
    const count = parseInt(document.getElementById('countSlider').value);
    for (let i = 0; i < count; i++) {
        flock.push(new Boid(Math.random() * width, Math.random() * height));
    }
}

function animate() {
    ctx.clearRect(0, 0, width, height);

    for (let boid of flock) {
        boid.edges();
        boid.flock(flock);
        boid.update();
        boid.show();
    }

    requestAnimationFrame(animate);
}

// --- Event Listeners ---
document.getElementById('countSlider').oninput = function () {
    const newCount = parseInt(this.value);
    document.getElementById('countVal').innerText = newCount;

    if (newCount > flock.length) {
        for (let i = flock.length; i < newCount; i++) {
            flock.push(new Boid(Math.random() * width, Math.random() * height));
        }
    } else {
        // Remove boids (end of array)
        flock.splice(newCount);
    }
};

document.getElementById('sepSlider').oninput = function () {
    config.separationWeight = parseFloat(this.value);
    document.getElementById('sepVal').innerText = this.value;
};
document.getElementById('aliSlider').oninput = function () {
    config.alignmentWeight = parseFloat(this.value);
    document.getElementById('aliVal').innerText = this.value;
};
document.getElementById('cohSlider').oninput = function () {
    config.cohesionWeight = parseFloat(this.value);
    document.getElementById('cohVal').innerText = this.value;
};
document.getElementById('speedSlider').oninput = function () {
    config.maxSpeed = parseFloat(this.value);
    document.getElementById('speedVal').innerText = this.value;
};
document.getElementById('percSlider').oninput = function () {
    config.perceptionRadius = parseFloat(this.value);
    document.getElementById('percVal').innerText = this.value;
};

// Toggle Checkboxes
document.getElementById('showPercChk').onchange = function () { config.showPerception = this.checked; };
document.getElementById('showAliChk').onchange = function () { config.showAlignment = this.checked; };
document.getElementById('showCohChk').onchange = function () { config.showCohesion = this.checked; };
document.getElementById('showSepChk').onchange = function () { config.showSeparation = this.checked; };

// Colors
document.getElementById('boidColor').oninput = function () { config.boidColor = this.value; };
document.getElementById('predatorColor').oninput = function () { config.predatorColor = this.value; };

document.getElementById('resetBtn').onclick = init;

// Spawn predator on click
canvas.addEventListener('mousedown', (e) => {
    flock.push(new Boid(e.clientX, e.clientY, true));
});


init();
animate();
