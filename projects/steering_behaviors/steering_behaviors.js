// ==========================================
// STEERING & ECO-EVOLUTION SANDBOX ENGINE
// High Performance Spatial Hash (3,000+ Boids)
// ==========================================

const canvas = document.getElementById('simulationCanvas');
const ctx = canvas.getContext('2d');

let width, height;

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight - 70; // account for header
    if (spatialGrid) {
        spatialGrid.resize(width, height, config.perceptionRadius);
    }
}
window.addEventListener('resize', resize);

// --- Configuration Parameters ---
const config = {
    separationWeight: 1.5,
    alignmentWeight: 1.0,
    cohesionWeight: 1.0,
    maxSpeed: 4.0,
    maxForce: 0.05,
    perceptionRadius: 50,
    flowFieldScale: 0.005,
    flowSpeed: 1.0,
    pathRadius: 25,
    showPerception: false,
    showVisionCone: false,
    showFlowField: false,
    showGrid: false,
    showVectors: false,
    boidColor: '#3da9fc',
    predatorColor: '#ff3b30'
};

// ==========================================
// 1. FAST VECTOR MATH UTILITY
// ==========================================
class Vector {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    set(x, y) { this.x = x; this.y = y; return this; }
    add(v) { this.x += v.x; this.y += v.y; return this; }
    sub(v) { this.x -= v.x; this.y -= v.y; return this; }
    mult(n) { this.x *= n; this.y *= n; return this; }
    div(n) { if (n !== 0) { this.x /= n; this.y /= n; } return this; }
    magSq() { return this.x * this.x + this.y * this.y; }
    mag() { return Math.sqrt(this.magSq()); }
    
    setMag(n) {
        const m = this.mag();
        if (m !== 0) this.mult(n / m);
        return this;
    }

    limit(max) {
        if (this.magSq() > max * max) this.setMag(max);
        return this;
    }

    normalize() {
        const m = this.mag();
        if (m !== 0) this.div(m);
        return this;
    }

    copy() { return new Vector(this.x, this.y); }
    heading() { return Math.atan2(this.y, this.x); }

    static dist(v1, v2) { return Math.hypot(v1.x - v2.x, v1.y - v2.y); }
    static distSq(v1, v2) {
        const dx = v1.x - v2.x, dy = v1.y - v2.y;
        return dx * dx + dy * dy;
    }
    static sub(v1, v2) { return new Vector(v1.x - v2.x, v1.y - v2.y); }
    static fromAngle(angle) { return new Vector(Math.cos(angle), Math.sin(angle)); }
}

// ==========================================
// 2. SPATIAL HASH GRID (O(N) Lookups)
// ==========================================
class SpatialHashGrid {
    constructor(width, height, cellSize = 60) {
        this.width = width;
        this.height = height;
        this.cellSize = cellSize;
        this.cols = Math.max(1, Math.ceil(width / cellSize));
        this.rows = Math.max(1, Math.ceil(height / cellSize));
        this.buckets = new Array(this.cols * this.rows);
        this.clear();
    }
    
    resize(width, height, cellSize = 60) {
        this.width = width;
        this.height = height;
        this.cellSize = Math.max(20, cellSize);
        this.cols = Math.max(1, Math.ceil(width / this.cellSize));
        this.rows = Math.max(1, Math.ceil(height / this.cellSize));
        this.buckets = new Array(this.cols * this.rows);
        this.clear();
    }

    clear() {
        for (let i = 0; i < this.buckets.length; i++) {
            if (!this.buckets[i]) this.buckets[i] = [];
            else this.buckets[i].length = 0;
        }
    }

    getKey(x, y) {
        let col = Math.floor(x / this.cellSize);
        let row = Math.floor(y / this.cellSize);
        if (col < 0) col = 0;
        if (col >= this.cols) col = this.cols - 1;
        if (row < 0) row = 0;
        if (row >= this.rows) row = this.rows - 1;
        return row * this.cols + col;
    }

    insert(entity) {
        const key = this.getKey(entity.position.x, entity.position.y);
        this.buckets[key].push(entity);
    }

    query(x, y, radius, outNeighbors = []) {
        outNeighbors.length = 0;
        const radSq = radius * radius;
        const minCol = Math.max(0, Math.floor((x - radius) / this.cellSize));
        const maxCol = Math.min(this.cols - 1, Math.floor((x + radius) / this.cellSize));
        const minRow = Math.max(0, Math.floor((y - radius) / this.cellSize));
        const maxRow = Math.min(this.rows - 1, Math.floor((y + radius) / this.cellSize));

        for (let r = minRow; r <= maxRow; r++) {
            for (let c = minCol; c <= maxCol; c++) {
                const bucket = this.buckets[r * this.cols + c];
                if (!bucket) continue;
                for (let i = 0; i < bucket.length; i++) {
                    const e = bucket[i];
                    const dx = e.position.x - x;
                    const dy = e.position.y - y;
                    if (dx * dx + dy * dy <= radSq) {
                        outNeighbors.push(e);
                    }
                }
            }
        }
        return outNeighbors;
    }

    drawGrid(ctx) {
        ctx.save();
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
        ctx.lineWidth = 1;
        for (let c = 0; c <= this.cols; c++) {
            ctx.beginPath();
            ctx.moveTo(c * this.cellSize, 0);
            ctx.lineTo(c * this.cellSize, this.height);
            ctx.stroke();
        }
        for (let r = 0; r <= this.rows; r++) {
            ctx.beginPath();
            ctx.moveTo(0, r * this.cellSize);
            ctx.lineTo(this.width, r * this.cellSize);
            ctx.stroke();
        }
        ctx.restore();
    }
}

// ==========================================
// 3. PERLIN NOISE VECTOR FIELD
// ==========================================
class PerlinNoise {
    constructor() {
        this.p = new Uint8Array(512);
        const permutation = [
            151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,
            8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,
            35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,
            134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,
            55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,
            18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,
            250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,
            189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,
            172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,
            228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,
            107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,
            138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180
        ];
        for (let i = 0; i < 256; i++) {
            this.p[i] = permutation[i];
            this.p[256 + i] = permutation[i];
        }
    }

    fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    lerp(t, a, b) { return a + t * (b - a); }
    grad(hash, x, y, z) {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    noise(x, y, z = 0) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        const Z = Math.floor(z) & 255;
        x -= Math.floor(x);
        y -= Math.floor(y);
        z -= Math.floor(z);
        const u = this.fade(x);
        const v = this.fade(y);
        const w = this.fade(z);

        const A = this.p[X] + Y, AA = this.p[A] + Z, AB = this.p[A + 1] + Z;
        const B = this.p[X + 1] + Y, BA = this.p[B] + Z, BB = this.p[B + 1] + Z;

        return this.lerp(w,
            this.lerp(v,
                this.lerp(u, this.grad(this.p[AA], x, y, z), this.grad(this.p[BA], x - 1, y, z)),
                this.lerp(u, this.grad(this.p[AB], x, y - 1, z), this.grad(this.p[BB], x - 1, y - 1, z))
            ),
            this.lerp(v,
                this.lerp(u, this.grad(this.p[AA + 1], x, y, z - 1), this.grad(this.p[BA + 1], x - 1, y, z - 1)),
                this.lerp(u, this.grad(this.p[AB + 1], x, y - 1, z - 1), this.grad(this.p[BB + 1], x - 1, y - 1, z - 1))
            )
        );
    }

    getVector(x, y, z = 0) {
        // Map noise (-1 to 1) to angle (0 to 4*PI)
        const angle = this.noise(x, y, z) * Math.PI * 4;
        return Vector.fromAngle(angle);
    }
}

// ==========================================
// 4. INTERACTIVE SPLINE PATH SYSTEM
// ==========================================
class SplinePath {
    constructor(radius = 25) {
        this.points = [];
        this.radius = radius;
    }

    addPoint(x, y) {
        if (this.points.length > 0) {
            const last = this.points[this.points.length - 1];
            if (Vector.dist(last, { x, y }) < 18) return;
        }
        this.points.push(new Vector(x, y));
    }

    clear() {
        this.points.length = 0;
    }

    createDefaultLoop(w, h) {
        this.clear();
        const cx = w / 2, cy = h / 2;
        const rx = w * 0.35, ry = h * 0.3;
        for (let a = 0; a < Math.PI * 2; a += 0.2) {
            this.points.push(new Vector(cx + Math.cos(a) * rx, cy + Math.sin(a * 2) * ry));
        }
    }

    show(ctx) {
        if (this.points.length < 2) return;
        
        ctx.save();
        // Path Corridor
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(this.points[i].x, this.points[i].y);
        }
        ctx.strokeStyle = 'rgba(61, 169, 252, 0.12)';
        ctx.lineWidth = this.radius * 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        // Path Centerline
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(this.points[i].x, this.points[i].y);
        }
        ctx.strokeStyle = 'rgba(61, 169, 252, 0.8)';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();
    }
}

// ==========================================
// 5. PROCEDURAL WEB AUDIO SYNTHESIZER
// ==========================================
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.enabled = false;
        this.droneOsc = null;
        this.droneGain = null;
        this.filter = null;
        this.masterGain = null;
    }

    init() {
        if (this.ctx) return;
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();

        this.filter = this.ctx.createBiquadFilter();
        this.filter.type = 'lowpass';
        this.filter.frequency.value = 400;

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.1;

        this.filter.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);

        this.droneOsc = this.ctx.createOscillator();
        this.droneOsc.type = 'triangle';
        this.droneOsc.frequency.value = 110;

        this.droneGain = this.ctx.createGain();
        this.droneGain.gain.value = 0.05;

        this.droneOsc.connect(this.droneGain);
        this.droneGain.connect(this.filter);
        this.droneOsc.start();
    }

    toggle() {
        if (!this.ctx) this.init();
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        this.enabled = !this.enabled;
        if (this.masterGain) {
            this.masterGain.gain.setTargetAtTime(this.enabled ? 0.1 : 0, this.ctx.currentTime, 0.05);
        }
        return this.enabled;
    }

    updateFlockAcoustics(alignmentRatio, panicRatio) {
        if (!this.enabled || !this.ctx) return;
        const now = this.ctx.currentTime;
        const baseFreq = 110 + alignmentRatio * 55;
        this.droneOsc.frequency.setTargetAtTime(baseFreq, now, 0.2);
        
        const targetCutoff = 350 + panicRatio * 1800;
        this.filter.frequency.setTargetAtTime(targetCutoff, now, 0.15);
    }

    playEatChime(isPredator = false) {
        if (!this.enabled || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        if (isPredator) {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(160, now);
            osc.frequency.exponentialRampToValueAtTime(35, now + 0.2);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        } else {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(520 + Math.random() * 200, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        }
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.3);
    }
}

// ==========================================
// 6. GENETICS & DNA CLASS
// ==========================================
class DNA {
    constructor(parentDNA = null) {
        if (parentDNA) {
            // Inherit with mutation (+- 10%)
            this.speed = Math.max(2.0, Math.min(8.0, parentDNA.speed + (Math.random() - 0.5) * 0.5));
            this.perception = Math.max(20, Math.min(100, parentDNA.perception + (Math.random() - 0.5) * 6));
            this.fear = Math.max(0.5, Math.min(4.0, parentDNA.fear + (Math.random() - 0.5) * 0.3));
            this.force = Math.max(0.03, Math.min(0.12, parentDNA.force + (Math.random() - 0.5) * 0.01));
            this.generation = parentDNA.generation + 1;
        } else {
            // Base archetype
            this.speed = 3.5 + Math.random() * 1.5;
            this.perception = 40 + Math.random() * 25;
            this.fear = 1.5 + Math.random() * 1.0;
            this.force = 0.05 + Math.random() * 0.02;
            this.generation = 1;
        }
    }
}

// ==========================================
// 7. FOOD & NUTRIENTS CLASS
// ==========================================
class Food {
    constructor(x, y) {
        this.position = new Vector(x, y);
        this.nutrition = 45;
        this.pulse = Math.random() * Math.PI * 2;
    }

    update() {
        this.pulse += 0.05;
    }

    show(ctx) {
        ctx.save();
        const r = 3 + Math.sin(this.pulse) * 1;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, r, 0, Math.PI * 2);
        ctx.fillStyle = '#00e676';
        ctx.shadowColor = '#00e676';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
    }
}

// ==========================================
// 8. OBSTACLE & PARTICLE CLASSES
// ==========================================
class Obstacle {
    constructor(x, y, r = 40) {
        this.position = new Vector(x, y);
        this.r = r;
    }

    show(ctx) {
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }
}

class Particle {
    constructor(x, y, color) {
        this.position = new Vector(x, y);
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3.5 + 1;
        this.velocity = new Vector(Math.cos(angle) * speed, Math.sin(angle) * speed);
        this.alpha = 1.0;
        this.color = color;
    }

    update() {
        this.position.add(this.velocity);
        this.alpha -= 0.03;
    }

    show(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }
}

// ==========================================
// 9. HIGH-PERFORMANCE BOID AGENT CLASS
// ==========================================
class Boid {
    constructor(x, y, isPredator = false, parentDNA = null) {
        this.position = new Vector(x, y);
        this.velocity = new Vector(Math.random() - 0.5, Math.random() - 0.5);
        this.acceleration = new Vector(0, 0);
        this.isPredator = isPredator;
        
        // Genetics & Energy
        this.dna = new DNA(parentDNA);
        this.energy = 100;
        this.isPanicked = false;
        
        // Set initial momentum
        this.velocity.setMag(this.dna.speed * 0.7);

        // Motion trail history (subtle 5-point buffer)
        this.history = [];
        this.wanderAngle = Math.random() * Math.PI * 2;

        // Debug vectors
        this.debugAlignment = new Vector();
        this.debugCohesion = new Vector();
        this.debugSeparation = new Vector();
    }

    edges() {
        if (this.position.x > width) this.position.x = 0;
        else if (this.position.x < 0) this.position.x = width;
        if (this.position.y > height) this.position.y = 0;
        else if (this.position.y < 0) this.position.y = height;
    }

    // Classic Seek
    seek(target) {
        const desired = Vector.sub(target, this.position);
        desired.setMag(this.dna.speed);
        const steer = Vector.sub(desired, this.velocity);
        steer.limit(this.dna.force);
        return steer;
    }

    // Classic Flee
    flee(target) {
        const desired = Vector.sub(this.position, target);
        desired.setMag(this.dna.speed);
        const steer = Vector.sub(desired, this.velocity);
        steer.limit(this.dna.force);
        return steer;
    }

    // Smooth Arrive
    arrive(target, slowdownRadius = 120) {
        const desired = Vector.sub(target, this.position);
        const d = desired.mag();
        if (d < slowdownRadius) {
            const m = (d / slowdownRadius) * this.dna.speed;
            desired.setMag(m);
        } else {
            desired.setMag(this.dna.speed);
        }
        const steer = Vector.sub(desired, this.velocity);
        steer.limit(this.dna.force);
        return steer;
    }

    // Smooth Organic Wander
    wander() {
        const circleCenter = this.velocity.copy().setMag(60);
        this.wanderAngle += (Math.random() - 0.5) * 0.3;
        const displacement = Vector.fromAngle(this.wanderAngle).mult(15);
        const wanderForce = circleCenter.add(displacement);
        wanderForce.limit(this.dna.force);
        return wanderForce;
    }

    // Spline Path Following Math
    followPath(path) {
        if (!path || path.points.length < 2) return new Vector();

        // 1. Predict position ahead
        const predict = this.velocity.copy().setMag(30);
        const predictPos = this.position.copy().add(predict);

        let normalPoint = null;
        let target = null;
        let worldRecord = Infinity;

        for (let i = 0; i < path.points.length - 1; i++) {
            const a = path.points[i];
            const b = path.points[i + 1];
            const normal = getNormalPoint(predictPos, a, b);

            // Check if normal falls outside segment
            if (normal.x < Math.min(a.x, b.x) || normal.x > Math.max(a.x, b.x) ||
                normal.y < Math.min(a.y, b.y) || normal.y > Math.max(a.y, b.y)) {
                normal.set(b.x, b.y);
            }

            const d = Vector.dist(predictPos, normal);
            if (d < worldRecord) {
                worldRecord = d;
                normalPoint = normal;
                // Target is ahead along segment direction
                const dir = Vector.sub(b, a).setMag(35);
                target = normal.copy().add(dir);
            }
        }

        if (worldRecord > path.radius && target) {
            return this.seek(target);
        }
        return new Vector();
    }

    // Avoid Obstacles
    avoid(obstacles) {
        const steer = new Vector();
        let total = 0;
        for (let i = 0; i < obstacles.length; i++) {
            const obs = obstacles[i];
            const d = Vector.dist(this.position, obs.position);
            const safety = obs.r + (this.isPredator ? 35 : 25);
            if (d < safety) {
                const diff = Vector.sub(this.position, obs.position).setMag(this.dna.speed);
                const weight = (safety - d) / safety;
                diff.mult(weight * 2.0);
                steer.add(diff);
                total++;
            }
        }
        if (total > 0) steer.limit(this.dna.force * 2.0);
        return steer;
    }

    // Spatial-partitioned Flocking
    flock(neighbors, mode, mousePos, obstacles, path, perlin, flowTime) {
        // Obstacle avoidance applies universally
        if (obstacles.length > 0) {
            this.acceleration.add(this.avoid(obstacles));
        }

        // 1. Predator Autonomous AI
        if (this.isPredator) {
            let targetBoid = null;
            let closestDistSq = Infinity;
            
            for (let i = 0; i < neighbors.length; i++) {
                const other = neighbors[i];
                if (!other.isPredator) {
                    const dSq = Vector.distSq(this.position, other.position);
                    if (dSq < closestDistSq) {
                        closestDistSq = dSq;
                        targetBoid = other;
                    }
                }
            }

            if (targetBoid) {
                this.acceleration.add(this.seek(targetBoid.position));
                // Catch Prey Condition
                if (closestDistSq < 144) { // 12px
                    for (let i = 0; i < 15; i++) {
                        particles.push(new Particle(targetBoid.position.x, targetBoid.position.y, config.boidColor));
                    }
                    const idx = flock.indexOf(targetBoid);
                    if (idx > -1) flock.splice(idx, 1);
                    soundEngine.playEatChime(true);
                    this.energy = Math.min(200, this.energy + 70);
                    updateBoidCountUI();
                }
            } else {
                this.acceleration.add(this.wander());
            }
            return;
        }

        // 2. Normal Boid Simulation Modes
        switch(mode) {
            case 'evolution': {
                // Seek nearest food nutrient
                let closestFood = null;
                let minFoodDistSq = Infinity;
                const visSq = this.dna.perception * this.dna.perception;

                for (let i = 0; i < foodItems.length; i++) {
                    const f = foodItems[i];
                    const dSq = Vector.distSq(this.position, f.position);
                    if (dSq < visSq && dSq < minFoodDistSq) {
                        minFoodDistSq = dSq;
                        closestFood = f;
                    }
                }

                if (closestFood) {
                    const seekFood = this.seek(closestFood.position).mult(1.2);
                    this.acceleration.add(seekFood);
                    // Eat food
                    if (minFoodDistSq < 144) {
                        this.energy += closestFood.nutrition;
                        const fIdx = foodItems.indexOf(closestFood);
                        if (fIdx > -1) foodItems.splice(fIdx, 1);
                        soundEngine.playEatChime(false);
                    }
                } else {
                    this.acceleration.add(this.wander().mult(0.6));
                }

                // Check for predators
                let nearestPred = null;
                let minPredDSq = Infinity;
                for (let i = 0; i < neighbors.length; i++) {
                    const other = neighbors[i];
                    if (other.isPredator) {
                        const dSq = Vector.distSq(this.position, other.position);
                        if (dSq < minPredDSq) {
                            minPredDSq = dSq;
                            nearestPred = other;
                        }
                    }
                }

                if (nearestPred && minPredDSq < visSq * 1.5) {
                    const panic = this.flee(nearestPred.position).mult(this.dna.fear);
                    this.acceleration.add(panic);
                    this.isPanicked = true;
                } else {
                    this.isPanicked = false;
                }

                // Separation to prevent clumping
                this.acceleration.add(this.computeSeparation(neighbors).mult(1.5));
                break;
            }

            case 'flowfield': {
                if (perlin) {
                    const flowVec = perlin.getVector(
                        this.position.x * config.flowFieldScale, 
                        this.position.y * config.flowFieldScale, 
                        flowTime
                    );
                    flowVec.setMag(this.dna.speed);
                    const steer = Vector.sub(flowVec, this.velocity).limit(this.dna.force);
                    this.acceleration.add(steer.mult(config.flowSpeed));
                }
                this.acceleration.add(this.computeSeparation(neighbors).mult(1.0));
                break;
            }

            case 'path': {
                if (path) {
                    this.acceleration.add(this.followPath(path));
                }
                this.acceleration.add(this.computeSeparation(neighbors).mult(1.4));
                break;
            }

            case 'seek': {
                if (mousePos) {
                    this.acceleration.add(this.seek(mousePos).mult(0.6));
                    this.acceleration.add(this.computeSeparation(neighbors).mult(1.5));
                }
                break;
            }

            case 'flee': {
                if (mousePos) {
                    this.acceleration.add(this.flee(mousePos).mult(0.6));
                    this.acceleration.add(this.computeSeparation(neighbors).mult(1.2));
                }
                break;
            }

            case 'arrive': {
                if (mousePos) {
                    this.acceleration.add(this.arrive(mousePos).mult(0.6));
                    this.acceleration.add(this.computeSeparation(neighbors).mult(1.5));
                }
                break;
            }

            case 'wander': {
                this.acceleration.add(this.wander());
                this.acceleration.add(this.computeSeparation(neighbors).mult(1.2));
                break;
            }

            case 'flocking':
            default: {
                const ali = this.computeAlignment(neighbors);
                const coh = this.computeCohesion(neighbors);
                const sep = this.computeSeparation(neighbors);

                if (config.showVectors) {
                    this.debugAlignment = ali.copy().mult(300);
                    this.debugCohesion = coh.copy().mult(300);
                    this.debugSeparation = sep.copy().mult(300);
                }

                ali.mult(config.alignmentWeight);
                coh.mult(config.cohesionWeight);
                sep.mult(config.separationWeight);

                this.acceleration.add(ali);
                this.acceleration.add(coh);
                this.acceleration.add(sep);

                // Panic flee from predators
                let nearestPred = null;
                let minPredDSq = Infinity;
                for (let i = 0; i < neighbors.length; i++) {
                    const other = neighbors[i];
                    if (other.isPredator) {
                        const dSq = Vector.distSq(this.position, other.position);
                        if (dSq < minPredDSq) {
                            minPredDSq = dSq;
                            nearestPred = other;
                        }
                    }
                }

                if (nearestPred && minPredDSq < (config.perceptionRadius * 1.5) ** 2) {
                    const panic = this.flee(nearestPred.position).mult(2.2);
                    this.acceleration.add(panic);
                    this.isPanicked = true;
                } else {
                    this.isPanicked = false;
                }
                break;
            }
        }
    }

    computeAlignment(neighbors) {
        const steering = new Vector();
        let count = 0;
        const radSq = this.dna.perception * this.dna.perception;

        for (let i = 0; i < neighbors.length; i++) {
            const other = neighbors[i];
            if (other !== this && !other.isPredator) {
                steering.add(other.velocity);
                count++;
            }
        }
        if (count > 0) {
            steering.div(count);
            steering.setMag(this.dna.speed);
            steering.sub(this.velocity);
            steering.limit(this.dna.force);
        }
        return steering;
    }

    computeCohesion(neighbors) {
        const steering = new Vector();
        let count = 0;

        for (let i = 0; i < neighbors.length; i++) {
            const other = neighbors[i];
            if (other !== this && !other.isPredator) {
                steering.add(other.position);
                count++;
            }
        }
        if (count > 0) {
            steering.div(count);
            steering.sub(this.position);
            steering.setMag(this.dna.speed);
            steering.sub(this.velocity);
            steering.limit(this.dna.force);
        }
        return steering;
    }

    computeSeparation(neighbors) {
        const steering = new Vector();
        let count = 0;

        for (let i = 0; i < neighbors.length; i++) {
            const other = neighbors[i];
            if (other !== this) {
                const dSq = Vector.distSq(this.position, other.position);
                if (dSq > 0) {
                    const diff = Vector.sub(this.position, other.position);
                    const weight = other.isPredator ? 6.0 : 1.0;
                    diff.div(dSq); // Inverse square law
                    diff.mult(weight);
                    steering.add(diff);
                    count++;
                }
            }
        }
        if (count > 0) {
            steering.setMag(this.dna.speed);
            steering.sub(this.velocity);
            steering.limit(this.dna.force);
        }
        return steering;
    }

    update(mode) {
        this.position.add(this.velocity);
        this.velocity.add(this.acceleration);
        
        let maxLimit = this.dna.speed;
        if (this.isPredator) {
            maxLimit = this.dna.speed * 1.15;
        } else if (this.isPanicked) {
            maxLimit = this.dna.speed * 1.35;
        }
        
        this.velocity.limit(maxLimit);
        this.acceleration.mult(0); // Reset

        // Energy Metabolism in Evolution Mode
        if (mode === 'evolution') {
            this.energy -= (0.05 + (this.dna.speed / 8.0) * 0.04);
        }

        // Keep motion trail (5 past vectors)
        if (flock.length < 800) {
            this.history.push(this.position.copy());
            if (this.history.length > 5) this.history.shift();
        }

        this.edges();
    }

    show(ctx) {
        // Render Trail
        if (this.history.length > 1 && flock.length < 800) {
            ctx.beginPath();
            ctx.moveTo(this.history[0].x, this.history[0].y);
            for (let i = 1; i < this.history.length; i++) {
                if (Vector.distSq(this.history[i], this.history[i-1]) < 10000) {
                    ctx.lineTo(this.history[i].x, this.history[i].y);
                } else {
                    ctx.moveTo(this.history[i].x, this.history[i].y);
                }
            }
            ctx.strokeStyle = this.isPredator ? 'rgba(255, 59, 48, 0.12)' : 'rgba(61, 169, 252, 0.08)';
            ctx.lineWidth = this.isPredator ? 3 : 1.5;
            ctx.stroke();
        }

        const angle = this.velocity.heading();

        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(angle);

        ctx.beginPath();
        if (this.isPredator) {
            ctx.moveTo(14, 0);
            ctx.lineTo(-8, 6);
            ctx.lineTo(-4, 0);
            ctx.lineTo(-8, -6);
            ctx.fillStyle = config.predatorColor;
        } else {
            // Genetic color tinting in evolution mode
            if (sandboxModeSelect.value === 'evolution') {
                const speedHue = Math.min(280, Math.max(160, 160 + (this.dna.speed - 3) * 35));
                ctx.fillStyle = `hsl(${speedHue}, 85%, 60%)`;
            } else {
                ctx.fillStyle = config.boidColor;
            }
            ctx.moveTo(8, 0);
            ctx.lineTo(-5, 4);
            ctx.lineTo(-5, -4);
        }
        ctx.closePath();
        ctx.fill();

        // Predator Vision Cone Overlay
        if (this.isPredator && config.showVisionCone) {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, 120, -Math.PI / 4, Math.PI / 4);
            ctx.closePath();
            ctx.fillStyle = 'rgba(255, 59, 48, 0.06)';
            ctx.fill();
        }

        ctx.restore();

        // Debug Overlays
        if (config.showPerception && !this.isPredator && flock.length < 500) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, this.dna.perception, 0, Math.PI * 2);
            ctx.stroke();
        }

        if (config.showVectors && !this.isPredator && flock.length < 300) {
            this.drawDebugVector(ctx, this.debugAlignment, '#4CAF50');
            this.drawDebugVector(ctx, this.debugCohesion, '#2196F3');
            this.drawDebugVector(ctx, this.debugSeparation, '#ff3b30');
        }
    }

    drawDebugVector(ctx, v, color) {
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

// Point-to-segment projection for Path Following
function getNormalPoint(p, a, b) {
    const ap = Vector.sub(p, a);
    const ab = Vector.sub(b, a);
    ab.normalize();
    const dot = ap.x * ab.x + ap.y * ab.y;
    ab.mult(dot);
    return a.copy().add(ab);
}

// ==========================================
// 10. SIMULATION INSTANCES & STATE
// ==========================================
const spatialGrid = new SpatialHashGrid(window.innerWidth, window.innerHeight - 70, config.perceptionRadius);
const perlinEngine = new PerlinNoise();
const soundEngine = new SoundEngine();
const splinePath = new SplinePath(config.pathRadius);

const flock = [];
const obstacles = [];
const particles = [];
const foodItems = [];

let mousePosition = null;
let isDrawingPath = false;
let flowTime = 0;
let neighborQueryBuffer = [];

// DOM Elements Selection
const audioToggleBtn = document.getElementById('audioToggleBtn');
const audioIcon = document.getElementById('audioIcon');
const audioLabel = document.getElementById('audioLabel');

const sandboxModeSelect = document.getElementById('sandboxMode');
const evolutionStatsSection = document.getElementById('evolutionStatsSection');
const genBadge = document.getElementById('genBadge');
const ecoPopDisplay = document.getElementById('ecoPopDisplay');
const ecoSpeedDisplay = document.getElementById('ecoSpeedDisplay');
const ecoVisionDisplay = document.getElementById('ecoVisionDisplay');
const ecoFearDisplay = document.getElementById('ecoFearDisplay');

const pathControlsSection = document.getElementById('pathControlsSection');
const pathDrawingPrompt = document.getElementById('pathDrawingPrompt');
const drawPathBtn = document.getElementById('drawPathBtn');
const clearPathBtn = document.getElementById('clearPathBtn');
const pathRadiusSlider = document.getElementById('pathRadiusSlider');
const pathRadiusVal = document.getElementById('pathRadiusVal');

const clickModeSelect = document.getElementById('clickMode');
const countSlider = document.getElementById('countSlider');
const countVal = document.getElementById('countVal');
const speedSlider = document.getElementById('speedSlider');
const speedVal = document.getElementById('speedVal');
const percSlider = document.getElementById('percSlider');
const percVal = document.getElementById('percVal');

const flowStrengthGroup = document.getElementById('flowStrengthGroup');
const flowStrengthSlider = document.getElementById('flowStrengthSlider');
const flowStrengthVal = document.getElementById('flowStrengthVal');

const showPercChk = document.getElementById('showPercChk');
const showVisionConeChk = document.getElementById('showVisionConeChk');
const showFlowFieldChk = document.getElementById('showFlowFieldChk');
const showGridChk = document.getElementById('showGridChk');
const showVectorsChk = document.getElementById('showVectorsChk');

const boidColorInput = document.getElementById('boidColor');
const predatorColorInput = document.getElementById('predatorColor');

const resetBtn = document.getElementById('resetBtn');
const clearPredatorsBtn = document.getElementById('clearPredatorsBtn');
const clearObstaclesBtn = document.getElementById('clearObstaclesBtn');

// Initialize Population
function initFlock() {
    const predators = flock.filter(b => b.isPredator);
    flock.length = 0;
    predators.forEach(p => flock.push(p));

    const targetBoids = parseInt(countSlider.value);
    for (let i = 0; i < targetBoids; i++) {
        flock.push(new Boid(Math.random() * width, Math.random() * height));
    }

    // Seed Food
    foodItems.length = 0;
    if (sandboxModeSelect.value === 'evolution') {
        for (let i = 0; i < 70; i++) {
            foodItems.push(new Food(Math.random() * width, Math.random() * height));
        }
    }
}

function updateBoidCountUI() {
    const count = flock.filter(b => !b.isPredator).length;
    countSlider.value = count;
    countVal.innerText = count;
}

// Update Evolution Live HUD
function updateEvolutionHUD() {
    if (sandboxModeSelect.value !== 'evolution') return;
    const boids = flock.filter(b => !b.isPredator);
    if (boids.length === 0) {
        ecoPopDisplay.innerText = `0 / ${foodItems.length}`;
        return;
    }

    let totalSpeed = 0, totalVision = 0, totalFear = 0, maxGen = 1;
    for (let i = 0; i < boids.length; i++) {
        const d = boids[i].dna;
        totalSpeed += d.speed;
        totalVision += d.perception;
        totalFear += d.fear;
        if (d.generation > maxGen) maxGen = d.generation;
    }

    genBadge.innerText = `Gen ${maxGen}`;
    ecoPopDisplay.innerText = `${boids.length} / ${foodItems.length}`;
    ecoSpeedDisplay.innerText = (totalSpeed / boids.length).toFixed(2);
    ecoVisionDisplay.innerText = `${Math.round(totalVision / boids.length)}px`;
    ecoFearDisplay.innerText = `${(totalFear / boids.length).toFixed(2)}x`;
}

// Main Loop
function animate() {
    // Semi-transparent clearing for motion blur
    ctx.fillStyle = 'rgba(11, 15, 20, 0.4)';
    ctx.fillRect(0, 0, width, height);

    const mode = sandboxModeSelect.value;
    flowTime += 0.003 * config.flowSpeed;

    // Draw Spatial Hash Grid
    if (config.showGrid) spatialGrid.drawGrid(ctx);

    // Draw Flow Field Streamlines Overlay
    if (config.showFlowField) {
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 255, 196, 0.15)';
        ctx.lineWidth = 1;
        const step = 45;
        for (let x = 20; x < width; x += step) {
            for (let y = 20; y < height; y += step) {
                const v = perlinEngine.getVector(x * config.flowFieldScale, y * config.flowFieldScale, flowTime).setMag(15);
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + v.x, y + v.y);
                ctx.stroke();
            }
        }
        ctx.restore();
    }

    // Draw Path
    if (mode === 'path') splinePath.show(ctx);

    // Draw Obstacles
    for (let i = 0; i < obstacles.length; i++) obstacles[i].show(ctx);

    // Evolution Ecosystem Food Management
    if (mode === 'evolution') {
        // Spawn replenishing food
        if (foodItems.length < 80 && Math.random() < 0.3) {
            foodItems.push(new Food(Math.random() * width, Math.random() * height));
        }
        for (let i = 0; i < foodItems.length; i++) {
            foodItems[i].update();
            foodItems[i].show(ctx);
        }
    }

    // Insert all agents into Spatial Hash Grid
    spatialGrid.clear();
    for (let i = 0; i < flock.length; i++) {
        spatialGrid.insert(flock[i]);
    }

    let totalAlign = 0, panickedCount = 0;

    // Update and Draw Agents
    for (let i = flock.length - 1; i >= 0; i--) {
        const agent = flock[i];
        
        // Spatial hash query
        const neighbors = spatialGrid.query(
            agent.position.x, 
            agent.position.y, 
            agent.dna.perception, 
            neighborQueryBuffer
        );

        agent.flock(neighbors, mode, mousePosition, obstacles, splinePath, perlinEngine, flowTime);
        agent.update(mode);
        agent.show(ctx);

        if (agent.isPanicked) panickedCount++;

        // Evolution Reproduction & Starvation
        if (mode === 'evolution' && !agent.isPredator) {
            // Reproduction (Mitosis)
            if (agent.energy > 180 && flock.length < 500) {
                agent.energy = 90;
                const child = new Boid(
                    agent.position.x + (Math.random() - 0.5) * 10,
                    agent.position.y + (Math.random() - 0.5) * 10,
                    false,
                    agent.dna
                );
                flock.push(child);
                updateBoidCountUI();
            }
            // Starvation death
            if (agent.energy <= 0) {
                for (let p = 0; p < 6; p++) {
                    particles.push(new Particle(agent.position.x, agent.position.y, '#94a3b8'));
                }
                flock.splice(i, 1);
                updateBoidCountUI();
            }
        }
    }

    // Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].show(ctx);
        if (particles[i].alpha <= 0) particles.splice(i, 1);
    }

    // Audio Engine Reactive Update
    if (soundEngine.enabled && flock.length > 0) {
        const panicRatio = Math.min(1.0, panickedCount / Math.max(1, flock.length * 0.3));
        soundEngine.updateFlockAcoustics(0.7, panicRatio);
    }

    // Update Evolution HUD
    updateEvolutionHUD();

    requestAnimationFrame(animate);
}

// ==========================================
// 11. EVENT LISTENERS & UI WIRING
// ==========================================

// Audio Synth Toggle
audioToggleBtn.addEventListener('click', () => {
    const isMuted = !soundEngine.toggle();
    if (!isMuted) {
        audioToggleBtn.classList.add('active');
        audioIcon.className = 'fa-solid fa-volume-high';
        audioLabel.innerText = 'Audio: On';
    } else {
        audioToggleBtn.classList.remove('active');
        audioIcon.className = 'fa-solid fa-volume-xmark';
        audioLabel.innerText = 'Audio: Off';
    }
});

// Mode Selector Switching
sandboxModeSelect.addEventListener('change', (e) => {
    const mode = e.target.value;

    // Toggle Evolution Dashboard
    if (mode === 'evolution') {
        evolutionStatsSection.classList.remove('hidden');
        if (foodItems.length === 0) {
            for (let i = 0; i < 70; i++) foodItems.push(new Food(Math.random() * width, Math.random() * height));
        }
    } else {
        evolutionStatsSection.classList.add('hidden');
    }

    // Toggle Path Controls
    if (mode === 'path') {
        pathControlsSection.classList.remove('hidden');
        if (splinePath.points.length === 0) splinePath.createDefaultLoop(width, height);
    } else {
        pathControlsSection.classList.add('hidden');
    }

    // Toggle Flow Field Controls
    if (mode === 'flowfield') {
        flowStrengthGroup.classList.remove('hidden');
    } else {
        flowStrengthGroup.classList.add('hidden');
    }
});

// Path Drawing triggers
drawPathBtn.addEventListener('click', () => {
    splinePath.clear();
    isDrawingPath = true;
    pathDrawingPrompt.classList.remove('hidden');
});

clearPathBtn.addEventListener('click', () => {
    splinePath.clear();
    isDrawingPath = false;
    pathDrawingPrompt.classList.add('hidden');
});

pathRadiusSlider.addEventListener('input', (e) => {
    config.pathRadius = splinePath.radius = parseInt(e.target.value);
    pathRadiusVal.innerText = `${config.pathRadius}px`;
});

// Agent Count Slider
countSlider.addEventListener('input', function () {
    const targetCount = parseInt(this.value);
    countVal.innerText = targetCount;
    
    const normalBoids = flock.filter(b => !b.isPredator);
    if (targetCount > normalBoids.length) {
        const diff = targetCount - normalBoids.length;
        for (let i = 0; i < diff; i++) {
            flock.push(new Boid(Math.random() * width, Math.random() * height));
        }
    } else if (targetCount < normalBoids.length) {
        const diff = normalBoids.length - targetCount;
        let removed = 0;
        for (let i = flock.length - 1; i >= 0; i--) {
            if (!flock[i].isPredator) {
                flock.splice(i, 1);
                removed++;
                if (removed >= diff) break;
            }
        }
    }
});

// Speed & Perception Sliders
speedSlider.addEventListener('input', (e) => {
    config.maxSpeed = parseFloat(e.target.value);
    speedVal.innerText = config.maxSpeed.toFixed(1);
    flock.forEach(b => b.dna.speed = config.maxSpeed);
});

percSlider.addEventListener('input', (e) => {
    config.perceptionRadius = parseInt(e.target.value);
    percVal.innerText = `${config.perceptionRadius}px`;
    spatialGrid.resize(width, height, config.perceptionRadius);
    flock.forEach(b => b.dna.perception = config.perceptionRadius);
});

flowStrengthSlider.addEventListener('input', (e) => {
    config.flowSpeed = parseFloat(e.target.value);
    flowStrengthVal.innerText = `${config.flowSpeed.toFixed(1)}x`;
});

// Debug Overlays Toggles
showPercChk.addEventListener('change', (e) => config.showPerception = e.target.checked);
showVisionConeChk.addEventListener('change', (e) => config.showVisionCone = e.target.checked);
showFlowFieldChk.addEventListener('change', (e) => config.showFlowField = e.target.checked);
showGridChk.addEventListener('change', (e) => config.showGrid = e.target.checked);
showVectorsChk.addEventListener('change', (e) => config.showVectors = e.target.checked);

// Colors Pickers
boidColorInput.addEventListener('input', (e) => config.boidColor = e.target.value);
predatorColorInput.addEventListener('input', (e) => config.predatorColor = e.target.value);

// Reset Actions
resetBtn.addEventListener('click', () => {
    obstacles.length = 0;
    particles.length = 0;
    flock.length = 0;
    foodItems.length = 0;
    initFlock();
    updateBoidCountUI();
});

clearPredatorsBtn.addEventListener('click', () => {
    for (let i = flock.length - 1; i >= 0; i--) {
        if (flock[i].isPredator) flock.splice(i, 1);
    }
});

clearObstaclesBtn.addEventListener('click', () => {
    obstacles.length = 0;
});

// Canvas Mouse Interactions
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    mousePosition = new Vector(x, y);

    if (isDrawingPath) {
        splinePath.addPoint(x, y);
    }
});

canvas.addEventListener('mouseleave', () => {
    mousePosition = null;
    if (isDrawingPath) {
        isDrawingPath = false;
        pathDrawingPrompt.classList.add('hidden');
    }
});

canvas.addEventListener('mouseup', () => {
    if (isDrawingPath) {
        isDrawingPath = false;
        pathDrawingPrompt.classList.add('hidden');
    }
});

canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Avoid spawning behind sidebar controls
    const sidebar = document.querySelector('.control-panel');
    const sideRect = sidebar.getBoundingClientRect();
    if (e.clientX >= sideRect.left && e.clientX <= sideRect.right &&
        e.clientY >= sideRect.top && e.clientY <= sideRect.bottom) {
        return;
    }

    if (sandboxModeSelect.value === 'path' && isDrawingPath) {
        splinePath.addPoint(x, y);
        return;
    }

    const clickMode = clickModeSelect.value;
    if (clickMode === 'predator') {
        flock.push(new Boid(x, y, true));
    } else if (clickMode === 'obstacle') {
        obstacles.push(new Obstacle(x, y));
    } else if (clickMode === 'food') {
        for (let i = 0; i < 8; i++) {
            foodItems.push(new Food(x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 30));
        }
    }
});

// ==========================================
// 12. BOOTSTRAP
// ==========================================
resize();
initFlock();
animate();
