/**
 * ============================================================================
 * PROCEDURAL ANIMATION & CREATURE KINEMATICS SANDBOX
 * 
 * Implements 2D Chain Simulations, Distance Constraints, Angle Clamping,
 * Lateral Head Oscillations, Curvature-Driven Fins, and Multi-Legged IK Gaits.
 * 
 * Direct mathematical implementation based on Argonaut's Procedural Animation.
 * Author: Burak Karagol
 * ============================================================================
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. VECTOR2D & MATHEMATICAL UTILITIES
     ========================================================================== */

  class Vec2 {
    constructor(x = 0, y = 0) {
      this.x = x;
      this.y = y;
    }

    set(x, y) {
      this.x = x;
      this.y = y;
      return this;
    }

    copy() {
      return new Vec2(this.x, this.y);
    }

    add(v) {
      this.x += v.x;
      this.y += v.y;
      return this;
    }

    sub(v) {
      this.x -= v.x;
      this.y -= v.y;
      return this;
    }

    mult(n) {
      this.x *= n;
      this.y *= n;
      return this;
    }

    div(n) {
      if (n !== 0) {
        this.x /= n;
        this.y /= n;
      }
      return this;
    }

    mag() {
      return Math.hypot(this.x, this.y);
    }

    magSq() {
      return this.x * this.x + this.y * this.y;
    }

    heading() {
      return Math.atan2(this.y, this.x);
    }

    dist(v) {
      return Math.hypot(this.x - v.x, this.y - v.y);
    }

    normalize() {
      const m = this.mag();
      if (m > 1e-6) this.div(m);
      return this;
    }

    setMag(len) {
      return this.normalize().mult(len);
    }

    limit(max) {
      const mSq = this.magSq();
      if (mSq > max * max) {
        this.div(Math.sqrt(mSq)).mult(max);
      }
      return this;
    }

    lerp(v, amt) {
      this.x += (v.x - this.x) * amt;
      this.y += (v.y - this.y) * amt;
      return this;
    }

    rotate(angle) {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const nx = this.x * cos - this.y * sin;
      const ny = this.x * sin + this.y * cos;
      this.x = nx;
      this.y = ny;
      return this;
    }

    dot(v) {
      return this.x * v.x + this.y * v.y;
    }

    static add(a, b) {
      return new Vec2(a.x + b.x, a.y + b.y);
    }

    static sub(a, b) {
      return new Vec2(a.x - b.x, a.y - b.y);
    }

    static mult(a, n) {
      return new Vec2(a.x * n, a.y * n);
    }

    static dist(a, b) {
      return Math.hypot(a.x - b.x, a.y - b.y);
    }

    static fromAngle(angle, len = 1) {
      return new Vec2(Math.cos(angle) * len, Math.sin(angle) * len);
    }

    static lerp(a, b, amt) {
      return new Vec2(a.x + (b.x - a.x) * amt, a.y + (b.y - a.y) * amt);
    }
  }

  // Normalizes an angle into [-PI, PI]
  function normalizeAngle(a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  }

  // Clamps difference between target and reference angle to maxDiff
  function clampAngleDiff(refAngle, targetAngle, maxDiff) {
    const diff = normalizeAngle(targetAngle - refAngle);
    const clampedDiff = Math.max(-maxDiff, Math.min(maxDiff, diff));
    return refAngle + clampedDiff;
  }

  // Smooth angular interpolation
  function lerpAngle(a, b, t) {
    const diff = normalizeAngle(b - a);
    return a + diff * t;
  }

  // Compact 2D Perlin Noise
  class SimpleNoise {
    constructor() {
      this.p = new Uint8Array(512);
      const perm = [
        151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,
        37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,
        57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,
        166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,
        102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,
        116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,
        118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,
        119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,
        110,79,113,224,232,178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,
        191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,
        84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,
        128,195,78,66,215,61,156,180
      ];
      for (let i = 0; i < 256; i++) {
        this.p[i] = perm[i];
        this.p[256 + i] = perm[i];
      }
    }

    fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    lerp(t, a, b) { return a + t * (b - a); }
    grad(hash, x, y) {
      const h = hash & 7;
      const u = h < 4 ? x : y;
      const v = h < 4 ? y : x;
      return ((h & 1) ? -u : u) + ((h & 2) ? -2.0 * v : 2.0 * v);
    }

    noise2D(x, y) {
      const X = Math.floor(x) & 255;
      const Y = Math.floor(y) & 255;
      x -= Math.floor(x);
      y -= Math.floor(y);
      const u = this.fade(x);
      const v = this.fade(y);
      const A = this.p[X] + Y;
      const B = this.p[X + 1] + Y;
      return this.lerp(
        v,
        this.lerp(u, this.grad(this.p[A], x, y), this.grad(this.p[B], x - 1, y)),
        this.lerp(u, this.grad(this.p[A + 1], x, y - 1), this.grad(this.p[B + 1], x - 1, y - 1))
      );
    }
  }

  const perlin = new SimpleNoise();

  /* ==========================================================================
     2. EXACT ANALYTICAL INVERSE KINEMATICS SOLVER (Law of Cosines)
     ========================================================================== */

  /**
   * 100% Reliable 2-Bone Analytical IK using Law of Cosines.
   * Guarantees exact segment lengths without popping, jitter, or flipping.
   */
  function solveTwoBoneIK(root, target, l1, l2, bendSign) {
    const dir = Vec2.sub(target, root);
    const dist = dir.mag();
    const maxReach = (l1 + l2) * 0.999;
    const clampedDist = Math.max(0.1, Math.min(maxReach, dist));
    const baseAngle = dir.heading();

    // Law of Cosines for shoulder-knee-target triangle
    const cosBeta = (l1 * l1 + clampedDist * clampedDist - l2 * l2) / (2 * l1 * clampedDist);
    const beta = Math.acos(Math.max(-1, Math.min(1, cosBeta)));
    const kneeAngle = baseAngle + bendSign * beta;

    const knee = Vec2.add(root, Vec2.fromAngle(kneeAngle, l1));
    let foot;
    if (dist >= maxReach) {
      foot = Vec2.add(root, Vec2.fromAngle(baseAngle, maxReach));
    } else {
      foot = target.copy();
    }

    return [root.copy(), knee, foot];
  }

  /**
   * 3-Bone IK Solver (Shoulder -> Knee -> Ankle -> Foot/Claw)
   */
  function solveThreeBoneIK(root, target, l1, l2, l3, bendSign, footDirAngle) {
    const ankleTarget = Vec2.sub(target, Vec2.fromAngle(footDirAngle, l3));
    const twoBone = solveTwoBoneIK(root, ankleTarget, l1, l2, bendSign);
    return [twoBone[0], twoBone[1], twoBone[2], target.copy()];
  }

  /* ==========================================================================
     3. PROCEDURAL WEB AUDIO SYNTHESIZER
     ========================================================================== */

  class AudioSynth {
    constructor() {
      this.ctx = null;
      this.enabled = false;
      this.masterGain = null;
      this.ambientGain = null;
      this.lastStepTime = 0;
    }

    init() {
      if (this.ctx) return;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);
      this.startAmbient();
    }

    toggle() {
      if (!this.ctx) this.init();
      if (!this.ctx) return false;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      this.enabled = !this.enabled;
      if (this.masterGain) {
        this.masterGain.gain.setTargetAtTime(this.enabled ? 0.35 : 0.0, this.ctx.currentTime, 0.05);
      }
      return this.enabled;
    }

    startAmbient() {
      if (!this.ctx) return;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(110, this.ctx.currentTime);
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(164.81, this.ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(250, this.ctx.currentTime);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(this.ambientGain);

      osc1.start();
      osc2.start();
    }

    playFootstep(freq = 180, duration = 0.04) {
      if (!this.enabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      if (now - this.lastStepTime < 0.05) return;
      this.lastStepTime = now;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      const pitch = freq * (0.9 + Math.random() * 0.2);
      osc.frequency.setValueAtTime(pitch, now);
      osc.frequency.exponentialRampToValueAtTime(pitch * 0.3, now + duration);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + duration);
    }

    playSwimWoosh() {
      if (!this.enabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.12);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(320, now);
      filter.frequency.exponentialRampToValueAtTime(140, now + 0.12);
      filter.Q.setValueAtTime(2.5, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start(now);
    }

    playStrike() {
      if (!this.enabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.18);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.18);
    }

    playChime(note = 523.25) {
      if (!this.enabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note, now);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.3);
    }
  }

  const audio = new AudioSynth();

  /* ==========================================================================
     4. SPINE CHAIN WITH DISTANCE & ANGLE CONSTRAINTS
     ========================================================================== */

  class SpineChain {
    constructor(segmentLengths, radii, maxAngle = Math.PI / 6) {
      this.numJoints = segmentLengths.length + 1;
      this.lengths = segmentLengths;
      this.radii = radii;
      this.maxAngle = maxAngle;
      
      this.joints = [];
      this.segmentAngles = [];
      
      let cumulativeX = 0;
      for (let i = 0; i < this.numJoints; i++) {
        this.joints.push(new Vec2(-cumulativeX, 0));
        this.segmentAngles.push(Math.PI);
        if (i < segmentLengths.length) cumulativeX += segmentLengths[i];
      }
    }

    resolveConstraints(headPos, headAngle) {
      // 1. Anchor Head P_0
      this.joints[0].set(headPos.x, headPos.y);

      // Tailward reference angle from Head into first segment
      const tailwardHeadAngle = normalizeAngle(headAngle + Math.PI);
      this.segmentAngles[0] = tailwardHeadAngle;

      // 2. Cascade down the spine from P_1 to P_{N-1}
      for (let i = 1; i < this.numJoints; i++) {
        const prev = this.joints[i - 1];
        const curr = this.joints[i];
        const targetDist = this.lengths[i - 1];

        // Angle from parent P_{i-1} to child P_i
        const desiredAngle = Math.atan2(curr.y - prev.y, curr.x - prev.x);
        const refAngle = this.segmentAngles[i - 1];
        const constrainedAngle = clampAngleDiff(refAngle, desiredAngle, this.maxAngle);

        // Position joint at fixed distance
        curr.x = prev.x + Math.cos(constrainedAngle) * targetDist;
        curr.y = prev.y + Math.sin(constrainedAngle) * targetDist;
        this.segmentAngles[i] = constrainedAngle;
      }
    }

    getContourPoints(scale = 1.0) {
      const leftPoints = [];
      const rightPoints = [];
      const normals = [];
      const tangents = [];

      for (let i = 0; i < this.numJoints; i++) {
        let t;
        if (i === 0) {
          t = Vec2.sub(this.joints[0], this.joints[1]).normalize();
        } else if (i === this.numJoints - 1) {
          t = Vec2.sub(this.joints[i - 1], this.joints[i]).normalize();
        } else {
          t = Vec2.sub(this.joints[i - 1], this.joints[i + 1]).normalize();
        }

        const n = new Vec2(-t.y, t.x);
        tangents.push(t);
        normals.push(n);

        const r = (this.radii[i] || 10) * scale;
        const left = Vec2.add(this.joints[i], Vec2.mult(n, r));
        const right = Vec2.sub(this.joints[i], Vec2.mult(n, r));

        leftPoints.push(left);
        rightPoints.push(right);
      }

      return { leftPoints, rightPoints, tangents, normals };
    }

    getCurvature(i) {
      if (i < 1 || i >= this.numJoints) return 0;
      const headForward = normalizeAngle(this.segmentAngles[0] + Math.PI);
      const segmentForward = normalizeAngle(this.segmentAngles[i] + Math.PI);
      return normalizeAngle(headForward - segmentForward);
    }
  }

  /* ==========================================================================
     5. STEPPING GAIT & LEG IK CONTROLLER (Stance Phase Locking)
     ========================================================================== */

  class SteppingLeg {
    constructor(options) {
      this.anchorJointIndex = options.anchorJointIndex || 0;
      this.side = options.side || 1; // -1: Left, +1: Right
      this.offsetDist = options.offsetDist || 20;
      this.offsetAngle = options.offsetAngle || Math.PI / 2;
      this.segmentLengths = options.segmentLengths || [24, 22];
      this.stepGroup = options.stepGroup || 0;
      this.strideRadius = options.strideRadius || 36;
      this.liftHeight = options.liftHeight || 16;
      this.bendDirection = options.bendDirection || 1;
      this.toeCount = options.toeCount || 4;
      this.toeLength = options.toeLength || 8;

      // World Ground Coordinates (Foot stays fixed in world coordinates when planted)
      this.currentFoot = new Vec2();
      this.targetFoot = new Vec2();
      this.stepStartFoot = new Vec2();
      this.isStepping = false;
      this.stepProgress = 1.0;
      this.stepDuration = 0.12; // Snappy step duration in seconds
      this.jointPositions = [];
      this.initialized = false;
    }

    getRestAnchor(spineJoint, spineNormal, spineTangent, bodyRadius = 15) {
      const latVec = Vec2.mult(spineNormal, this.side * (bodyRadius + this.offsetDist * Math.sin(this.offsetAngle)));
      const lonVec = Vec2.mult(spineTangent, this.offsetDist * Math.cos(this.offsetAngle));
      return Vec2.add(spineJoint, Vec2.add(latVec, lonVec));
    }

    updateGait(dt, shoulderPos, restAnchor, velocity, canStep) {
      if (!this.initialized) {
        this.currentFoot.set(restAnchor.x, restAnchor.y);
        this.targetFoot.set(restAnchor.x, restAnchor.y);
        this.initialized = true;
      }

      const speed = velocity.mag();

      // Dynamic step duration smoothly adapted to velocity
      this.stepDuration = Math.max(0.09, Math.min(0.30, 0.42 / Math.max(0.6, speed)));

      // 1. Check Stride Trigger in World Space
      const distFromRest = Vec2.dist(this.currentFoot, restAnchor);
      if (!this.isStepping && distFromRest > this.strideRadius && canStep) {
        this.isStepping = true;
        this.stepProgress = 0.0;
        this.stepStartFoot.set(this.currentFoot.x, this.currentFoot.y);
        
        // Predict landing spot ahead in creature movement direction
        const leadDist = Math.max(10, this.strideRadius * 0.85);
        const velDir = speed > 0.01 ? velocity.copy().normalize() : Vec2.fromAngle(0);
        this.targetFoot = Vec2.add(restAnchor, Vec2.mult(velDir, leadDist));
        audio.playFootstep(160 + (this.side > 0 ? 20 : 0));
      }

      // 2. Swing Phase Interpolation (Smooth Parabolic Step Arc)
      if (this.isStepping) {
        this.stepProgress += dt / this.stepDuration;
        if (this.stepProgress >= 1.0) {
          this.stepProgress = 1.0;
          this.isStepping = false;
          this.currentFoot.set(this.targetFoot.x, this.targetFoot.y);
        } else {
          // Smooth ease-in-out
          const p = this.stepProgress;
          const t = p * p * (3 - 2 * p);
          this.currentFoot = Vec2.lerp(this.stepStartFoot, this.targetFoot, t);
        }
      }

      // 3. Parabolic 3D Lift Height
      const lift = this.isStepping ? 4 * this.liftHeight * this.stepProgress * (1 - this.stepProgress) : 0;
      const footRenderPos = new Vec2(this.currentFoot.x, this.currentFoot.y - lift * 0.65);

      // 4. Solve Exact Analytical IK
      const bendSign = this.side * this.bendDirection;
      if (this.segmentLengths.length === 2) {
        this.jointPositions = solveTwoBoneIK(
          shoulderPos,
          footRenderPos,
          this.segmentLengths[0],
          this.segmentLengths[1],
          bendSign
        );
      } else if (this.segmentLengths.length === 3) {
        const footHeading = Vec2.sub(this.targetFoot, this.stepStartFoot).heading();
        this.jointPositions = solveThreeBoneIK(
          shoulderPos,
          footRenderPos,
          this.segmentLengths[0],
          this.segmentLengths[1],
          this.segmentLengths[2],
          bendSign,
          footHeading
        );
      }
    }
  }

  /* ==========================================================================
     6. CREATURE DEFINITIONS & VIBRANT / MONOTONE PALETTES
     ========================================================================== */

  const PALETTES = {
    vibrant: {
      primary: '#ff4757',
      secondary: '#ffa502',
      accent: '#ffffff',
      dark: '#1e272e',
      outline: 'rgba(255, 255, 255, 0.4)',
      glow: 'rgba(255, 71, 87, 0.5)',
      belly: '#ffeaa7'
    },
    emerald: {
      primary: '#05c46b',
      secondary: '#0be881',
      accent: '#ffdd59',
      dark: '#0d2b1d',
      outline: 'rgba(255, 255, 255, 0.35)',
      glow: 'rgba(5, 196, 107, 0.5)',
      belly: '#dff9fb'
    },
    abyssal: {
      primary: '#3c40c6',
      secondary: '#0fbcf9',
      accent: '#ff5e57',
      dark: '#0a0b1e',
      outline: 'rgba(15, 188, 249, 0.45)',
      glow: 'rgba(15, 188, 249, 0.6)',
      belly: '#dff9fb'
    },
    solar: {
      primary: '#ff3838',
      secondary: '#ff9f1a',
      accent: '#fff200',
      dark: '#2d0e0e',
      outline: 'rgba(255, 255, 255, 0.4)',
      glow: 'rgba(255, 159, 26, 0.55)',
      belly: '#fffa65'
    },
    obsidian: {
      primary: '#2c3440',
      secondary: '#181e26',
      accent: '#64748b',
      dark: '#0c1015',
      outline: 'rgba(255, 255, 255, 0.25)',
      glow: 'rgba(100, 116, 139, 0.25)',
      belly: '#1f252e'
    },
    ivory: {
      primary: '#e2e8f0',
      secondary: '#cbd5e1',
      accent: '#94a3b8',
      dark: '#1e293b',
      outline: 'rgba(30, 41, 59, 0.65)',
      glow: 'rgba(226, 232, 240, 0.35)',
      belly: '#f8fafc'
    }
  };

  /**
   * Silky Smooth, Perfectly Symmetrical Closed Contour Hull (Zero Scalloping / Zero Bumps)
   */
  function drawSmoothContour(ctx, pts, contour, snoutLen, tailLen, scale, fillStyle, strokeStyle, alpha = 0.95) {
    const left = contour.leftPoints;
    const right = contour.rightPoints;
    const t0 = contour.tangents[0];
    const tn = contour.tangents[pts.length - 1];
    const n = pts.length;

    const snoutTip = Vec2.add(pts[0], Vec2.mult(t0, snoutLen * scale));
    const tailTip = Vec2.sub(pts[n - 1], Vec2.mult(tn, tailLen * scale));

    // Assemble ordered perimeter loop
    const poly = [snoutTip, ...left, tailTip];
    for (let i = right.length - 1; i >= 0; i--) {
      poly.push(right[i]);
    }

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(poly[0].x, poly[0].y);

    // Smooth Catmull-Rom cubic bezier path
    const m = poly.length;
    for (let i = 0; i < m; i++) {
      const p0 = poly[(i - 1 + m) % m];
      const p1 = poly[i];
      const p2 = poly[(i + 1) % m];
      const p3 = poly[(i + 2) % m];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }
    ctx.closePath();

    ctx.fillStyle = fillStyle;
    ctx.globalAlpha = alpha;
    ctx.fill();

    if (strokeStyle) {
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = 1.4 * scale;
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * BASE CREATURE CONTROLLER
   */
  class Creature {
    constructor(type) {
      this.type = type;
      this.pos = new Vec2(window.innerWidth * 0.4, window.innerHeight * 0.5);
      this.vel = new Vec2(0, 0);
      this.acc = new Vec2(0, 0);
      this.heading = 0;
      this.turnRate = 0.08;
      this.maxSpeed = 3.5;
      this.scale = 1.0;
      this.swimPhase = 0;
      this.spatialFrequency = 0.030; // Default spatial wave frequency (rad/px)
      this.paletteKey = 'vibrant';
      this.tongueProgress = 0;
      this.isStriking = false;
      this.strikeCooldown = 0;
    }

    getPalette() {
      return PALETTES[this.paletteKey] || PALETTES.vibrant;
    }

    updatePhysics(targetPos, dt, speedMultiplier = 1.0, isHunting = false) {
      const desired = Vec2.sub(targetPos, this.pos);
      const dist = desired.mag();

      let targetSpeed = this.maxSpeed * speedMultiplier;

      // Only slow down when hovering over a stationary cursor in cursor mode
      if (!isHunting) {
        const slowingRadius = 90;
        if (dist < slowingRadius) {
          targetSpeed *= Math.max(0.0, dist / slowingRadius);
        }
      }

      if (dist > (isHunting ? 5 : 10)) {
        desired.normalize().mult(targetSpeed * (this.isStriking ? 1.6 : 1.0));
        const steerLimit = isHunting ? 0.38 : 0.22;
        const steer = Vec2.sub(desired, this.vel).limit(steerLimit);
        this.acc.add(steer);
      } else if (!isHunting) {
        this.vel.mult(0.85);
      }

      this.vel.add(this.acc);
      this.vel.limit(this.maxSpeed * speedMultiplier * (this.isStriking ? 1.8 : 1.0));
      
      const prevPos = this.pos.copy();
      this.pos.add(Vec2.mult(this.vel, dt * 60));
      this.acc.set(0, 0);

      // Distance moved this frame
      const movedDist = Vec2.dist(this.pos, prevPos);

      // Smooth heading steering with maximum angular turn rate (prevents tail-chasing death spirals)
      if (this.vel.mag() > 0.08) {
        const targetHeading = this.vel.heading();
        const maxTurnPerFrame = isHunting ? 0.090 : 0.060; // Sharper responsiveness when striking prey
        const diff = normalizeAngle(targetHeading - this.heading);
        const clampedDiff = Math.max(-maxTurnPerFrame, Math.min(maxTurnPerFrame, diff * this.turnRate * (isHunting ? 2.0 : 1.5)));
        this.heading = normalizeAngle(this.heading + clampedDiff);
      }

      // Motion Phase accumulated strictly proportional to distance moved (calibrated per creature)
      this.swimPhase += movedDist * this.spatialFrequency;

      if (this.isStriking) {
        this.strikeCooldown -= dt;
        if (this.strikeCooldown <= 0) this.isStriking = false;
      }
    }
  }

  /**
   * 1. KOI / BETTA FISH (Calm, Fluid Lateral Head Undulation & Curvature Fins)
   */
  class FishCreature extends Creature {
    constructor() {
      super('fish');
      const segmentLengths = [22, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9];
      const radii = [14, 18, 21, 23, 22, 20, 18, 15, 13, 11, 8, 6, 4, 3];
      this.spine = new SpineChain(segmentLengths, radii, Math.PI / 6);
      this.spatialFrequency = 0.028; // One graceful wave per ~225px of movement
      this.legs = [];
    }

    update(targetPos, dt, params, isHunting = false) {
      this.maxSpeed = params.speed * 1.05;
      this.scale = params.scale;
      this.spine.maxAngle = params.angleLimit;

      this.updatePhysics(targetPos, dt, 1.0, isHunting);

      // Graceful, speed-proportional Lateral Head Sway
      const speedRatio = Math.min(1.0, this.vel.mag() / 2.2);
      const lateralAmp = 4.2 * speedRatio * params.undulationAmp;
      const angleAmp = 0.18 * speedRatio * params.undulationAmp;

      const norm = new Vec2(-Math.sin(this.heading), Math.cos(this.heading));
      const headOffset = Vec2.mult(norm, Math.sin(this.swimPhase) * lateralAmp);
      const headPos = Vec2.add(this.pos, headOffset);
      const headAngle = this.heading + Math.cos(this.swimPhase) * angleAmp;

      this.spine.resolveConstraints(headPos, headAngle);

      if (Math.sin(this.swimPhase) > 0.95 && speedRatio > 0.6) {
        audio.playSwimWoosh();
      }
    }

    draw(ctx, renderMode, debugOpts) {
      const p = this.getPalette();
      const contour = this.spine.getContourPoints(this.scale);
      const pts = this.spine.joints;

      // 1. Dorsal & Ventral Fin Ribbons
      this.drawDorsalFin(ctx, pts, contour, p);
      this.drawVentralFin(ctx, pts, contour, p);

      // 2. Caudal Tail Fin
      this.drawCaudalFin(ctx, pts, p, renderMode);

      // 3. Body Hull
      if (renderMode === 'organic' || renderMode === 'xray') {
        const grad = ctx.createLinearGradient(
          pts[0].x, pts[0].y,
          pts[pts.length - 1].x, pts[pts.length - 1].y
        );
        grad.addColorStop(0, p.primary);
        grad.addColorStop(0.5, p.secondary);
        grad.addColorStop(1, p.accent);

        const alpha = renderMode === 'xray' ? 0.35 : 0.95;
        drawSmoothContour(ctx, pts, contour, 14, 6, this.scale, grad, p.outline, alpha);

        // Scales
        this.drawScales(ctx, pts, p);

        // Eyes
        this.drawEyes(ctx, pts[0], contour.tangents[0], contour.normals[0], 6 * this.scale, 11 * this.scale, p);
      }

      // 4. Prominent Outward-Fanning Pectoral Fins (Drawn on top of body flanks)
      const curv = this.spine.getCurvature(2);
      this.drawPectoralFin(ctx, pts[2], contour.normals[2], contour.tangents[2], -1, curv, p);
      this.drawPectoralFin(ctx, pts[2], contour.normals[2], contour.tangents[2], 1, curv, p);
    }

    drawPectoralFin(ctx, joint, normal, tangent, side, curvature, p) {
      ctx.save();
      const finLen = 38 * this.scale;
      const bodyR = (this.spine.radii[2] || 20) * this.scale;
      const root = Vec2.add(joint, Vec2.mult(normal, side * bodyR * 0.9));

      // Flaring angle outward from the body: ~105 degrees from forward heading
      const forwardAngle = tangent.heading();
      const finTurnFlare = (side === -1) ? -curvature * 1.3 : curvature * 1.3;
      const finAngle = forwardAngle + side * (Math.PI * 0.58 + Math.max(-0.4, Math.min(0.5, finTurnFlare)));

      const tip = Vec2.add(root, Vec2.fromAngle(finAngle, finLen));
      const midCtrl = Vec2.add(root, Vec2.fromAngle(finAngle - side * 0.45, finLen * 0.75));
      const trailingRoot = Vec2.sub(root, Vec2.mult(tangent, 10 * this.scale));

      ctx.beginPath();
      ctx.moveTo(root.x, root.y);
      ctx.quadraticCurveTo(midCtrl.x, midCtrl.y, tip.x, tip.y);
      ctx.quadraticCurveTo(tip.x - normal.x * side * 10, tip.y - normal.y * side * 10, trailingRoot.x, trailingRoot.y);
      ctx.closePath();

      const finGrad = ctx.createLinearGradient(root.x, root.y, tip.x, tip.y);
      finGrad.addColorStop(0, p.secondary);
      finGrad.addColorStop(0.7, p.primary);
      finGrad.addColorStop(1, 'rgba(255, 255, 255, 0.4)');

      ctx.fillStyle = finGrad;
      ctx.globalAlpha = 0.88;
      ctx.fill();
      ctx.strokeStyle = p.outline;
      ctx.lineWidth = 1.3 * this.scale;
      ctx.stroke();

      // Fin ray details
      for (let r = 0.25; r <= 0.75; r += 0.25) {
        const rayTip = Vec2.lerp(midCtrl, tip, r);
        ctx.beginPath();
        ctx.moveTo(root.x, root.y);
        ctx.lineTo(rayTip.x, rayTip.y);
        ctx.strokeStyle = p.accent;
        ctx.lineWidth = 0.8;
        ctx.globalAlpha = 0.5;
        ctx.stroke();
      }

      ctx.restore();
    }

    drawDorsalFin(ctx, pts, contour, p) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(pts[3].x, pts[3].y);
      for (let i = 4; i <= 7; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.strokeStyle = p.accent;
      ctx.lineWidth = 3.5 * this.scale;
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.7;
      ctx.stroke();
      ctx.restore();
    }

    drawVentralFin(ctx, pts, contour, p) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(pts[8].x, pts[8].y);
      ctx.lineTo(pts[10].x, pts[10].y);
      ctx.strokeStyle = p.secondary;
      ctx.lineWidth = 2.5 * this.scale;
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.6;
      ctx.stroke();
      ctx.restore();
    }

    drawCaudalFin(ctx, pts, p, renderMode) {
      ctx.save();
      const n = pts.length;
      const tailRoot = pts[n - 1];
      const prev = pts[n - 2];
      const tailAngle = Math.atan2(tailRoot.y - prev.y, tailRoot.x - prev.x);
      const finRays = 7;
      const maxRayLen = 48 * this.scale;

      const rayTips = [];
      for (let r = 0; r < finRays; r++) {
        const spread = (r / (finRays - 1) - 0.5) * 1.3;
        const rayLen = maxRayLen * (1.0 - Math.abs(spread) * 0.35);
        const angle = tailAngle + spread;
        const rayTip = Vec2.add(tailRoot, Vec2.fromAngle(angle, rayLen));
        rayTips.push(rayTip);
      }

      ctx.beginPath();
      ctx.moveTo(tailRoot.x, tailRoot.y);
      ctx.lineTo(rayTips[0].x, rayTips[0].y);
      for (let r = 1; r < rayTips.length; r++) {
        const mid = Vec2.lerp(rayTips[r - 1], rayTips[r], 0.5);
        ctx.quadraticCurveTo(rayTips[r - 1].x, rayTips[r - 1].y, mid.x, mid.y);
      }
      ctx.lineTo(rayTips[rayTips.length - 1].x, rayTips[rayTips.length - 1].y);
      ctx.closePath();

      const grad = ctx.createRadialGradient(
        tailRoot.x, tailRoot.y, 5,
        tailRoot.x, tailRoot.y, maxRayLen
      );
      grad.addColorStop(0, p.primary);
      grad.addColorStop(0.6, p.secondary);
      grad.addColorStop(1, 'rgba(255, 255, 255, 0.1)');

      ctx.fillStyle = grad;
      ctx.globalAlpha = renderMode === 'xray' ? 0.4 : 0.9;
      ctx.fill();
      ctx.strokeStyle = p.outline;
      ctx.lineWidth = 1.2 * this.scale;
      ctx.stroke();

      for (const tip of rayTips) {
        ctx.beginPath();
        ctx.moveTo(tailRoot.x, tailRoot.y);
        ctx.lineTo(tip.x, tip.y);
        ctx.strokeStyle = p.accent;
        ctx.lineWidth = 0.9;
        ctx.globalAlpha = 0.5;
        ctx.stroke();
      }
      ctx.restore();
    }

    drawScales(ctx, pts, p) {
      ctx.save();
      ctx.fillStyle = p.accent;
      ctx.globalAlpha = 0.35;
      for (let i = 2; i < pts.length - 3; i += 2) {
        const joint = pts[i];
        const r = this.spine.radii[i] * 0.4 * this.scale;
        ctx.beginPath();
        ctx.arc(joint.x, joint.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    drawEyes(ctx, headPos, tangent, normal, forwardOffset, sideOffset, p) {
      ctx.save();
      const leftEye = Vec2.add(headPos, Vec2.add(Vec2.mult(tangent, forwardOffset), Vec2.mult(normal, sideOffset)));
      const rightEye = Vec2.add(headPos, Vec2.add(Vec2.mult(tangent, forwardOffset), Vec2.mult(normal, -sideOffset)));

      [leftEye, rightEye].forEach(eye => {
        ctx.beginPath();
        ctx.arc(eye.x, eye.y, 4.5 * this.scale, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = p.accent;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.strokeStyle = p.dark;
        ctx.lineWidth = 0.8;
        ctx.stroke();

        const pupilOffset = Vec2.mult(tangent, 1.6 * this.scale);
        ctx.beginPath();
        ctx.arc(eye.x + pupilOffset.x, eye.y + pupilOffset.y, 2.2 * this.scale, 0, Math.PI * 2);
        ctx.fillStyle = p.dark;
        ctx.fill();
      });
      ctx.restore();
    }
  }

  /**
   * 2. GECKO LIZARD (Anatomically Correct Limbs & Diagonal Quadruped Trot)
   */
  class LizardCreature extends Creature {
    constructor() {
      super('lizard');
      const segmentLengths = [
        18, 16, 17, 18, 19, 18, 17, 16, 16, 15,
        15, 14, 13, 12, 11, 10, 9, 8, 7
      ];
      const radii = [
        13, 11, 14, 17, 18, 18, 17, 16, 15, 13,
        11, 9, 8, 7, 6, 5, 4, 3, 2, 2
      ];
      this.spine = new SpineChain(segmentLengths, radii, Math.PI / 5.5);

      // Anatomically Correct Lizard Limbs:
      // Front Legs: Elbows point OUTWARD & BACKWARD toward tail (bendDirection: -1)
      // Hind Legs: Knees point OUTWARD & FORWARD toward head (bendDirection: 1)
      this.spatialFrequency = 0.040;
      this.legs = [
        // Front Left (Shoulder joint 3, Group 0)
        new SteppingLeg({
          anchorJointIndex: 3,
          side: -1,
          offsetDist: 20,
          offsetAngle: Math.PI / 2.2,
          segmentLengths: [22, 20, 8],
          stepGroup: 0,
          strideRadius: 36,
          liftHeight: 16,
          bendDirection: -1
        }),
        // Front Right (Shoulder joint 3, Group 1)
        new SteppingLeg({
          anchorJointIndex: 3,
          side: 1,
          offsetDist: 20,
          offsetAngle: Math.PI / 2.2,
          segmentLengths: [22, 20, 8],
          stepGroup: 1,
          strideRadius: 36,
          liftHeight: 16,
          bendDirection: -1
        }),
        // Back Left (Hip joint 8, Group 1)
        new SteppingLeg({
          anchorJointIndex: 8,
          side: -1,
          offsetDist: 20,
          offsetAngle: Math.PI / 1.8,
          segmentLengths: [24, 22, 8],
          stepGroup: 1,
          strideRadius: 38,
          liftHeight: 16,
          bendDirection: 1
        }),
        // Back Right (Hip joint 8, Group 0)
        new SteppingLeg({
          anchorJointIndex: 8,
          side: 1,
          offsetDist: 20,
          offsetAngle: Math.PI / 1.8,
          segmentLengths: [24, 22, 8],
          stepGroup: 0,
          strideRadius: 38,
          liftHeight: 16,
          bendDirection: 1
        })
      ];
    }

    update(targetPos, dt, params, isHunting = false) {
      this.maxSpeed = params.speed;
      this.scale = params.scale;
      this.spine.maxAngle = params.angleLimit;

      this.updatePhysics(targetPos, dt, 1.0, isHunting);

      // Physical Lateral Head Sway synced with trotting gait
      const speedRatio = Math.min(1.0, this.vel.mag() / 2.2);
      const lateralAmp = 3.0 * speedRatio * params.undulationAmp;
      const angleAmp = 0.12 * speedRatio * params.undulationAmp;

      const norm = new Vec2(-Math.sin(this.heading), Math.cos(this.heading));
      const headOffset = Vec2.mult(norm, Math.sin(this.swimPhase) * lateralAmp);
      const headPos = Vec2.add(this.pos, headOffset);
      const headAngle = this.heading + Math.cos(this.swimPhase) * angleAmp;

      this.spine.resolveConstraints(headPos, headAngle);

      const contour = this.spine.getContourPoints(this.scale);
      const pts = this.spine.joints;

      // Group 0 and Group 1 alternate strictly
      const group0Stepping = this.legs.some(l => l.stepGroup === 0 && l.isStepping);
      const group1Stepping = this.legs.some(l => l.stepGroup === 1 && l.isStepping);

      this.legs.forEach(leg => {
        leg.strideRadius = params.stepRadius * this.scale;
        leg.liftHeight = params.stepLift * this.scale;
        const jIdx = leg.anchorJointIndex;
        const shoulderCenter = pts[jIdx];
        const normal = contour.normals[jIdx];
        const tangent = contour.tangents[jIdx];
        const bodyR = (this.spine.radii[jIdx] || 15) * this.scale;
        
        const shoulder = Vec2.add(shoulderCenter, Vec2.mult(normal, leg.side * bodyR));
        const restAnchor = leg.getRestAnchor(shoulderCenter, normal, tangent, bodyR);

        const canStep = (leg.stepGroup === 0 && !group1Stepping) || (leg.stepGroup === 1 && !group0Stepping);
        leg.updateGait(dt, shoulder, restAnchor, this.vel, canStep);
      });

      if (Math.random() < 0.015 && this.tongueProgress <= 0) {
        this.tongueProgress = 1.0;
      }
      if (this.tongueProgress > 0) {
        this.tongueProgress -= dt * 3.0;
      }
    }

    draw(ctx, renderMode, debugOpts) {
      const p = this.getPalette();
      const contour = this.spine.getContourPoints(this.scale);
      const pts = this.spine.joints;

      this.legs.forEach(leg => {
        this.drawLeg(ctx, leg, p, renderMode);
      });

      if (renderMode === 'organic' || renderMode === 'xray') {
        const grad = ctx.createLinearGradient(
          pts[0].x, pts[0].y,
          pts[pts.length - 1].x, pts[pts.length - 1].y
        );
        grad.addColorStop(0, p.primary);
        grad.addColorStop(0.5, p.secondary);
        grad.addColorStop(1, p.accent);

        const alpha = renderMode === 'xray' ? 0.35 : 0.95;
        drawSmoothContour(ctx, pts, contour, 16, 4, this.scale, grad, p.outline, alpha);

        this.drawSpineSpots(ctx, pts, p);

        if (this.tongueProgress > 0) {
          this.drawTongue(ctx, pts[0], contour.tangents[0], p);
        }

        this.drawLizardEyes(ctx, pts[0], contour.tangents[0], contour.normals[0], 5 * this.scale, 8 * this.scale, p);
      }
    }

    drawLeg(ctx, leg, p, renderMode) {
      const joints = leg.jointPositions;
      if (!joints || joints.length < 2) return;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(joints[0].x, joints[0].y);
      for (let i = 1; i < joints.length; i++) {
        ctx.lineTo(joints[i].x, joints[i].y);
      }
      ctx.strokeStyle = p.primary;
      ctx.lineWidth = 5 * this.scale;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = renderMode === 'xray' ? 0.4 : 0.95;
      ctx.stroke();

      ctx.strokeStyle = p.outline;
      ctx.lineWidth = 1.0 * this.scale;
      ctx.stroke();

      const foot = leg.currentFoot;
      const prevJoint = joints[joints.length - 2] || joints[0];
      const footAngle = Math.atan2(foot.y - prevJoint.y, foot.x - prevJoint.x);

      ctx.fillStyle = p.accent;
      ctx.beginPath();
      ctx.arc(foot.x, foot.y, 4 * this.scale, 0, Math.PI * 2);
      ctx.fill();

      // Splayed toes
      for (let t = -1.5; t <= 1.5; t += 0.75) {
        const toeAngle = footAngle + t * 0.35;
        const toeEnd = Vec2.add(foot, Vec2.fromAngle(toeAngle, leg.toeLength * this.scale));
        ctx.beginPath();
        ctx.moveTo(foot.x, foot.y);
        ctx.lineTo(toeEnd.x, toeEnd.y);
        ctx.strokeStyle = p.secondary;
        ctx.lineWidth = 2 * this.scale;
        ctx.stroke();
      }
      ctx.restore();
    }

    drawSpineSpots(ctx, pts, p) {
      ctx.save();
      ctx.fillStyle = p.accent;
      ctx.globalAlpha = 0.4;
      for (let i = 2; i < pts.length - 2; i += 2) {
        ctx.beginPath();
        ctx.arc(pts[i].x, pts[i].y, 2.8 * this.scale, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    drawTongue(ctx, headPos, tangent, p) {
      ctx.save();
      const len = 22 * this.scale * Math.sin(this.tongueProgress * Math.PI);
      const tongueRoot = Vec2.add(headPos, Vec2.mult(tangent, 15 * this.scale));
      const tongueTip = Vec2.add(tongueRoot, Vec2.mult(tangent, len));
      const forkL = Vec2.add(tongueTip, Vec2.fromAngle(tangent.heading() - 0.4, 5 * this.scale));
      const forkR = Vec2.add(tongueTip, Vec2.fromAngle(tangent.heading() + 0.4, 5 * this.scale));

      ctx.beginPath();
      ctx.moveTo(tongueRoot.x, tongueRoot.y);
      ctx.lineTo(tongueTip.x, tongueTip.y);
      ctx.lineTo(forkL.x, forkL.y);
      ctx.moveTo(tongueTip.x, tongueTip.y);
      ctx.lineTo(forkR.x, forkR.y);
      ctx.strokeStyle = '#ff4757';
      ctx.lineWidth = 1.8 * this.scale;
      ctx.stroke();
      ctx.restore();
    }

    drawLizardEyes(ctx, headPos, tangent, normal, forwardOffset, sideOffset, p) {
      ctx.save();
      const leftEye = Vec2.add(headPos, Vec2.add(Vec2.mult(tangent, forwardOffset), Vec2.mult(normal, sideOffset)));
      const rightEye = Vec2.add(headPos, Vec2.add(Vec2.mult(tangent, forwardOffset), Vec2.mult(normal, -sideOffset)));

      [leftEye, rightEye].forEach(eye => {
        ctx.beginPath();
        ctx.arc(eye.x, eye.y, 4 * this.scale, 0, Math.PI * 2);
        ctx.fillStyle = '#ffdd59';
        ctx.fill();
        ctx.strokeStyle = p.dark;
        ctx.lineWidth = 0.8;
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(eye.x, eye.y, 1.2 * this.scale, 3.4 * this.scale, tangent.heading(), 0, Math.PI * 2);
        ctx.fillStyle = p.dark;
        ctx.fill();
      });
      ctx.restore();
    }
  }

  /**
   * 3. SAND VIPER (45-Joint Serpenoid Wave Locomotion)
   */
  class SnakeCreature extends Creature {
    constructor() {
      super('snake');
      const numSegments = 45;
      const segmentLengths = [];
      const radii = [];

      for (let i = 0; i < numSegments; i++) {
        segmentLengths.push(11);
        if (i === 0) radii.push(13);
        else if (i === 1) radii.push(16);
        else if (i === 2) radii.push(18);
        else if (i < 6) radii.push(12);
        else if (i < 28) radii.push(15);
        else radii.push(Math.max(2, 15 - (i - 28) * 0.8));
      }
      radii.push(2);

      this.spine = new SpineChain(segmentLengths, radii, Math.PI / 8);
      this.spatialFrequency = 0.018; // Smooth, continuous S-curve wave
      this.legs = [];
    }

    update(targetPos, dt, params, isHunting = false) {
      this.maxSpeed = params.speed * 1.05;
      this.scale = params.scale;
      this.spine.maxAngle = params.angleLimit * 0.85;

      this.updatePhysics(targetPos, dt, 1.0, isHunting);

      // Natural, speed-scaled Serpenoid S-Curve Undulation
      const speedRatio = Math.min(1.0, this.vel.mag() / 2.2);
      const lateralAmp = 8.5 * speedRatio * params.undulationAmp;
      const angleAmp = 0.26 * speedRatio * params.undulationAmp;

      const norm = new Vec2(-Math.sin(this.heading), Math.cos(this.heading));
      const headOffset = Vec2.mult(norm, Math.sin(this.swimPhase) * lateralAmp);
      const headPos = Vec2.add(this.pos, headOffset);
      const headAngle = this.heading + Math.cos(this.swimPhase) * angleAmp;

      this.spine.resolveConstraints(headPos, headAngle);

      if (Math.random() < 0.02 && this.tongueProgress <= 0) {
        this.tongueProgress = 1.0;
      }
      if (this.tongueProgress > 0) {
        this.tongueProgress -= dt * 3.2;
      }
    }

    draw(ctx, renderMode, debugOpts) {
      const p = this.getPalette();
      const contour = this.spine.getContourPoints(this.scale);
      const pts = this.spine.joints;

      if (renderMode === 'organic' || renderMode === 'xray') {
        const grad = ctx.createLinearGradient(
          pts[0].x, pts[0].y,
          pts[pts.length - 1].x, pts[pts.length - 1].y
        );
        grad.addColorStop(0, p.primary);
        grad.addColorStop(0.5, p.secondary);
        grad.addColorStop(1, p.accent);

        const alpha = renderMode === 'xray' ? 0.35 : 0.95;
        drawSmoothContour(ctx, pts, contour, 15, 3, this.scale, grad, p.outline, alpha);

        this.drawDiamondbackPattern(ctx, pts, contour, p);

        if (this.tongueProgress > 0) {
          this.drawTongue(ctx, pts[0], contour.tangents[0], p);
        }

        this.drawViperEyes(ctx, pts[0], contour.tangents[0], contour.normals[0], 5 * this.scale, 9 * this.scale, p);
      }
    }

    drawDiamondbackPattern(ctx, pts, contour, p) {
      ctx.save();
      ctx.fillStyle = p.accent;
      ctx.globalAlpha = 0.5;
      for (let i = 4; i < pts.length - 6; i += 3) {
        const j = pts[i];
        const n = contour.normals[i];
        const t = contour.tangents[i];
        const r = this.spine.radii[i] * 0.7 * this.scale;

        ctx.beginPath();
        ctx.moveTo(j.x + t.x * r, j.y + t.y * r);
        ctx.lineTo(j.x + n.x * r * 0.7, j.y + n.y * r * 0.7);
        ctx.lineTo(j.x - t.x * r, j.y - t.y * r);
        ctx.lineTo(j.x - n.x * r * 0.7, j.y - n.y * r * 0.7);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    drawTongue(ctx, headPos, tangent, p) {
      ctx.save();
      const len = 26 * this.scale * Math.sin(this.tongueProgress * Math.PI);
      const tongueRoot = Vec2.add(headPos, Vec2.mult(tangent, 14 * this.scale));
      const tongueTip = Vec2.add(tongueRoot, Vec2.mult(tangent, len));
      const forkL = Vec2.add(tongueTip, Vec2.fromAngle(tangent.heading() - 0.45, 6 * this.scale));
      const forkR = Vec2.add(tongueTip, Vec2.fromAngle(tangent.heading() + 0.45, 6 * this.scale));

      ctx.beginPath();
      ctx.moveTo(tongueRoot.x, tongueRoot.y);
      ctx.lineTo(tongueTip.x, tongueTip.y);
      ctx.lineTo(forkL.x, forkL.y);
      ctx.moveTo(tongueTip.x, tongueTip.y);
      ctx.lineTo(forkR.x, forkR.y);
      ctx.strokeStyle = '#ff3838';
      ctx.lineWidth = 1.8 * this.scale;
      ctx.stroke();
      ctx.restore();
    }

    drawViperEyes(ctx, headPos, tangent, normal, forwardOffset, sideOffset, p) {
      ctx.save();
      const leftEye = Vec2.add(headPos, Vec2.add(Vec2.mult(tangent, forwardOffset), Vec2.mult(normal, sideOffset)));
      const rightEye = Vec2.add(headPos, Vec2.add(Vec2.mult(tangent, forwardOffset), Vec2.mult(normal, -sideOffset)));

      [leftEye, rightEye].forEach(eye => {
        ctx.beginPath();
        ctx.arc(eye.x, eye.y, 4 * this.scale, 0, Math.PI * 2);
        ctx.fillStyle = '#fffa65';
        ctx.fill();
        ctx.strokeStyle = p.dark;
        ctx.lineWidth = 0.8;
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(eye.x, eye.y, 1.0 * this.scale, 3.5 * this.scale, tangent.heading(), 0, Math.PI * 2);
        ctx.fillStyle = p.dark;
        ctx.fill();
      });
      ctx.restore();
    }
  }

  /**
   * 4. SHADOW SPIDER (8-Legged Anatomical IK & Alternating Tetrapod Gait)
   */
  class SpiderCreature extends Creature {
    constructor() {
      super('spider');
      const segmentLengths = [14, 14, 16, 12, 14, 15, 14, 12, 10];
      const radii = [12, 15, 16, 8, 17, 21, 20, 16, 9];
      this.spine = new SpineChain(segmentLengths, radii, Math.PI / 6);
      this.spatialFrequency = 0.045;

      // Anatomical 8-Legged Spider Armature:
      // Front 2 Pairs bend FORWARD/OUTWARD (bendDirection: -1)
      // Rear 2 Pairs bend BACKWARD/OUTWARD (bendDirection: 1)
      // Alternating Tetrapod Gait (Group 0: L1, R2, L3, R4 | Group 1: R1, L2, R3, L4)
      this.legs = [
        // L1 (Front-Left, Group 0)
        new SteppingLeg({ anchorJointIndex: 1, side: -1, offsetDist: 16, offsetAngle: Math.PI / 4.0, segmentLengths: [28, 24, 16], stepGroup: 0, strideRadius: 32, liftHeight: 18, bendDirection: -1 }),
        // R1 (Front-Right, Group 1)
        new SteppingLeg({ anchorJointIndex: 1, side: 1, offsetDist: 16, offsetAngle: Math.PI / 4.0, segmentLengths: [28, 24, 16], stepGroup: 1, strideRadius: 32, liftHeight: 18, bendDirection: -1 }),
        // L2 (Mid-Front-Left, Group 1)
        new SteppingLeg({ anchorJointIndex: 2, side: -1, offsetDist: 18, offsetAngle: Math.PI / 2.6, segmentLengths: [32, 28, 18], stepGroup: 1, strideRadius: 34, liftHeight: 18, bendDirection: -1 }),
        // R2 (Mid-Front-Right, Group 0)
        new SteppingLeg({ anchorJointIndex: 2, side: 1, offsetDist: 18, offsetAngle: Math.PI / 2.6, segmentLengths: [32, 28, 18], stepGroup: 0, strideRadius: 34, liftHeight: 18, bendDirection: -1 }),
        // L3 (Mid-Rear-Left, Group 0)
        new SteppingLeg({ anchorJointIndex: 2, side: -1, offsetDist: 18, offsetAngle: Math.PI / 1.6, segmentLengths: [32, 28, 18], stepGroup: 0, strideRadius: 34, liftHeight: 18, bendDirection: 1 }),
        // R3 (Mid-Rear-Right, Group 1)
        new SteppingLeg({ anchorJointIndex: 2, side: 1, offsetDist: 18, offsetAngle: Math.PI / 1.6, segmentLengths: [32, 28, 18], stepGroup: 1, strideRadius: 34, liftHeight: 18, bendDirection: 1 }),
        // L4 (Rear-Left, Group 1)
        new SteppingLeg({ anchorJointIndex: 3, side: -1, offsetDist: 16, offsetAngle: Math.PI / 1.25, segmentLengths: [36, 32, 20], stepGroup: 1, strideRadius: 36, liftHeight: 20, bendDirection: 1 }),
        // R4 (Rear-Right, Group 0)
        new SteppingLeg({ anchorJointIndex: 3, side: 1, offsetDist: 16, offsetAngle: Math.PI / 1.25, segmentLengths: [36, 32, 20], stepGroup: 0, strideRadius: 36, liftHeight: 20, bendDirection: 1 })
      ];
    }

    update(targetPos, dt, params, isHunting = false) {
      this.maxSpeed = params.speed * 1.1;
      this.scale = params.scale;
      this.spine.maxAngle = params.angleLimit;

      this.updatePhysics(targetPos, dt, 1.0, isHunting);
      this.spine.resolveConstraints(this.pos, this.heading);

      const contour = this.spine.getContourPoints(this.scale);
      const pts = this.spine.joints;

      // Alternating Tetrapod Gait: Group 0 steps while Group 1 holds ground, and vice versa
      const group0Stepping = this.legs.some(l => l.stepGroup === 0 && l.isStepping);
      const group1Stepping = this.legs.some(l => l.stepGroup === 1 && l.isStepping);

      this.legs.forEach(leg => {
        leg.strideRadius = params.stepRadius * 0.85 * this.scale;
        leg.liftHeight = params.stepLift * this.scale;
        const jIdx = leg.anchorJointIndex;
        const shoulderCenter = pts[jIdx];
        const normal = contour.normals[jIdx];
        const tangent = contour.tangents[jIdx];
        const bodyR = (this.spine.radii[jIdx] || 15) * this.scale;
        
        const shoulder = Vec2.add(shoulderCenter, Vec2.mult(normal, leg.side * bodyR));
        const restAnchor = leg.getRestAnchor(shoulderCenter, normal, tangent, bodyR);

        const canStep = (leg.stepGroup === 0 && !group1Stepping) || (leg.stepGroup === 1 && !group0Stepping);
        leg.updateGait(dt, shoulder, restAnchor, this.vel, canStep);
      });
    }

    draw(ctx, renderMode, debugOpts) {
      const p = this.getPalette();
      const contour = this.spine.getContourPoints(this.scale);
      const pts = this.spine.joints;

      this.legs.forEach(leg => {
        this.drawSpiderLeg(ctx, leg, p, renderMode);
      });

      if (renderMode === 'organic' || renderMode === 'xray') {
        ctx.save();

        // Cephalothorax
        ctx.beginPath();
        ctx.ellipse(pts[1].x, pts[1].y, 16 * this.scale, 14 * this.scale, contour.tangents[1].heading(), 0, Math.PI * 2);
        ctx.fillStyle = p.primary;
        ctx.globalAlpha = renderMode === 'xray' ? 0.4 : 0.95;
        ctx.fill();
        ctx.strokeStyle = p.outline;
        ctx.lineWidth = 1.4 * this.scale;
        ctx.stroke();

        // Pedicel
        ctx.beginPath();
        ctx.moveTo(pts[2].x, pts[2].y);
        ctx.lineTo(pts[4].x, pts[4].y);
        ctx.strokeStyle = p.dark;
        ctx.lineWidth = 5 * this.scale;
        ctx.stroke();

        // Abdomen
        const abdCenter = pts[5];
        ctx.beginPath();
        ctx.ellipse(abdCenter.x, abdCenter.y, 22 * this.scale, 18 * this.scale, contour.tangents[5].heading(), 0, Math.PI * 2);
        const abdGrad = ctx.createRadialGradient(
          abdCenter.x, abdCenter.y, 4,
          abdCenter.x, abdCenter.y, 22 * this.scale
        );
        abdGrad.addColorStop(0, p.secondary);
        abdGrad.addColorStop(0.7, p.primary);
        abdGrad.addColorStop(1, p.dark);

        ctx.fillStyle = abdGrad;
        ctx.fill();
        ctx.strokeStyle = p.outline;
        ctx.lineWidth = 1.4 * this.scale;
        ctx.stroke();

        // Eyes
        this.drawSpiderEyes(ctx, pts[0], contour.tangents[0], contour.normals[0], p);

        // Pedipalps
        this.drawPedipalps(ctx, pts[0], contour.tangents[0], p);

        ctx.restore();
      }
    }

    drawSpiderLeg(ctx, leg, p, renderMode) {
      const joints = leg.jointPositions;
      if (!joints || joints.length < 2) return;

      ctx.save();
      for (let i = 0; i < joints.length - 1; i++) {
        ctx.beginPath();
        ctx.moveTo(joints[i].x, joints[i].y);
        ctx.lineTo(joints[i + 1].x, joints[i + 1].y);
        ctx.strokeStyle = i === 0 ? p.primary : (i === 1 ? p.secondary : p.accent);
        ctx.lineWidth = Math.max(1.5, (4 - i * 1.0) * this.scale);
        ctx.lineCap = 'round';
        ctx.globalAlpha = renderMode === 'xray' ? 0.4 : 0.95;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(joints[i].x, joints[i].y, 2.4 * this.scale, 0, Math.PI * 2);
        ctx.fillStyle = p.dark;
        ctx.fill();
      }

      const foot = leg.currentFoot;
      ctx.beginPath();
      ctx.arc(foot.x, foot.y, 2.2 * this.scale, 0, Math.PI * 2);
      ctx.fillStyle = p.accent;
      ctx.fill();

      ctx.restore();
    }

    drawSpiderEyes(ctx, headPos, tangent, normal, p) {
      ctx.save();
      const eyePositions = [
        { u: 0.6, v: 0.2, r: 2.2 },
        { u: 0.6, v: -0.2, r: 2.2 },
        { u: 0.3, v: 0.5, r: 1.6 },
        { u: 0.3, v: -0.5, r: 1.6 },
        { u: 0.0, v: 0.7, r: 1.4 },
        { u: 0.0, v: -0.7, r: 1.4 },
        { u: -0.3, v: 0.4, r: 1.2 },
        { u: -0.3, v: -0.4, r: 1.2 }
      ];

      const t = Vec2.mult(tangent, 10 * this.scale);
      const n = Vec2.mult(normal, 10 * this.scale);

      eyePositions.forEach(e => {
        const eyePos = Vec2.add(headPos, Vec2.add(Vec2.mult(t, e.u), Vec2.mult(n, e.v)));
        ctx.beginPath();
        ctx.arc(eyePos.x, eyePos.y, e.r * this.scale, 0, Math.PI * 2);
        ctx.fillStyle = p.accent;
        ctx.shadowColor = p.accent;
        ctx.shadowBlur = 4;
        ctx.fill();
      });
      ctx.restore();
    }

    drawPedipalps(ctx, headPos, tangent, p) {
      ctx.save();
      const wave = Math.sin(this.swimPhase * 1.5) * 0.2;
      const baseAngle = tangent.heading();
      [-1, 1].forEach(side => {
        const angle = baseAngle + side * 0.4 + wave * side;
        const p1 = Vec2.add(headPos, Vec2.fromAngle(angle, 10 * this.scale));
        const p2 = Vec2.add(p1, Vec2.fromAngle(angle - side * 0.3, 8 * this.scale));

        ctx.beginPath();
        ctx.moveTo(headPos.x, headPos.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = p.accent;
        ctx.lineWidth = 1.6 * this.scale;
        ctx.stroke();
      });
      ctx.restore();
    }
  }

  /**
   * 5. ARMORED CENTIPEDE (24 Chitin Segments, 48 Legs)
   */
  class CentipedeCreature extends Creature {
    constructor() {
      super('centipede');
      const numSegments = 24;
      const segmentLengths = [];
      const radii = [];

      for (let i = 0; i < numSegments; i++) {
        segmentLengths.push(14);
        if (i === 0) radii.push(12);
        else if (i === numSegments - 1) radii.push(7);
        else radii.push(11);
      }
      radii.push(6);

      this.spine = new SpineChain(segmentLengths, radii, Math.PI / 7);
      this.spatialFrequency = 0.024;

      this.legs = [];
      for (let i = 1; i <= numSegments; i++) {
        this.legs.push(new SteppingLeg({
          anchorJointIndex: i,
          side: -1,
          offsetDist: 14,
          offsetAngle: Math.PI / 2,
          segmentLengths: [15, 14],
          stepGroup: i % 2,
          strideRadius: 24,
          liftHeight: 10,
          bendDirection: -1
        }));
        this.legs.push(new SteppingLeg({
          anchorJointIndex: i,
          side: 1,
          offsetDist: 14,
          offsetAngle: Math.PI / 2,
          segmentLengths: [15, 14],
          stepGroup: (i + 1) % 2,
          strideRadius: 24,
          liftHeight: 10,
          bendDirection: -1
        }));
      }
    }

    update(targetPos, dt, params, isHunting = false) {
      this.maxSpeed = params.speed * 0.95;
      this.scale = params.scale;
      this.spine.maxAngle = params.angleLimit * 0.8;

      this.updatePhysics(targetPos, dt, 1.0, isHunting);

      // Physical Lateral Head Sway
      const speedRatio = Math.min(1.0, this.vel.mag() / 2.2);
      const lateralAmp = 4.0 * speedRatio * params.undulationAmp;
      const angleAmp = 0.14 * speedRatio * params.undulationAmp;

      const norm = new Vec2(-Math.sin(this.heading), Math.cos(this.heading));
      const headOffset = Vec2.mult(norm, Math.sin(this.swimPhase) * lateralAmp);
      const headPos = Vec2.add(this.pos, headOffset);
      const headAngle = this.heading + Math.cos(this.swimPhase) * angleAmp;

      this.spine.resolveConstraints(headPos, headAngle);

      const contour = this.spine.getContourPoints(this.scale);
      const pts = this.spine.joints;

      this.legs.forEach(leg => {
        leg.strideRadius = params.stepRadius * 0.7 * this.scale;
        leg.liftHeight = params.stepLift * 0.75 * this.scale;
        const jIdx = leg.anchorJointIndex;
        if (jIdx >= pts.length) return;
        const shoulderCenter = pts[jIdx];
        const normal = contour.normals[jIdx] || new Vec2(0, 1);
        const tangent = contour.tangents[jIdx] || new Vec2(1, 0);
        const bodyR = (this.spine.radii[jIdx] || 10) * this.scale;
        
        const shoulder = Vec2.add(shoulderCenter, Vec2.mult(normal, leg.side * bodyR));
        const restAnchor = leg.getRestAnchor(shoulderCenter, normal, tangent, bodyR);

        const phaseTrigger = Math.sin(this.swimPhase * 1.2 + jIdx * 0.35);
        const canStep = phaseTrigger > 0.4;
        leg.updateGait(dt, shoulder, restAnchor, this.vel, canStep);
      });
    }

    draw(ctx, renderMode, debugOpts) {
      const p = this.getPalette();
      const contour = this.spine.getContourPoints(this.scale);
      const pts = this.spine.joints;

      this.legs.forEach(leg => {
        const joints = leg.jointPositions;
        if (!joints || joints.length < 2) return;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(joints[0].x, joints[0].y);
        ctx.lineTo(joints[1].x, joints[1].y);
        ctx.lineTo(joints[2].x, joints[2].y);
        ctx.strokeStyle = p.accent;
        ctx.lineWidth = 2.0 * this.scale;
        ctx.globalAlpha = renderMode === 'xray' ? 0.35 : 0.85;
        ctx.stroke();
        ctx.restore();
      });

      if (renderMode === 'organic' || renderMode === 'xray') {
        ctx.save();
        for (let i = pts.length - 1; i >= 0; i--) {
          const j = pts[i];
          const r = (this.spine.radii[i] || 10) * this.scale;
          const normal = contour.normals[i];
          const tangent = contour.tangents[i];

          ctx.beginPath();
          ctx.ellipse(j.x, j.y, r * 1.25, r * 0.95, tangent.heading(), 0, Math.PI * 2);
          ctx.fillStyle = i % 2 === 0 ? p.primary : p.secondary;
          ctx.globalAlpha = renderMode === 'xray' ? 0.4 : 0.95;
          ctx.fill();

          ctx.strokeStyle = p.outline;
          ctx.lineWidth = 1.2 * this.scale;
          ctx.stroke();

          if (i > 0 && i < pts.length - 1) {
            [-1, 1].forEach(side => {
              const spineTip = Vec2.add(j, Vec2.mult(normal, side * (r + 4 * this.scale)));
              ctx.beginPath();
              ctx.moveTo(j.x + normal.x * side * r, j.y + normal.y * side * r);
              ctx.lineTo(spineTip.x, spineTip.y);
              ctx.strokeStyle = p.accent;
              ctx.lineWidth = 1.4 * this.scale;
              ctx.stroke();
            });
          }
        }

        this.drawAntennae(ctx, pts[0], contour.tangents[0], p);
        this.drawCerci(ctx, pts[pts.length - 1], contour.tangents[pts.length - 1], p);

        ctx.restore();
      }
    }

    drawAntennae(ctx, headPos, tangent, p) {
      ctx.save();
      const wave = Math.sin(this.swimPhase * 0.8) * 0.25;
      const baseA = tangent.heading();
      [-1, 1].forEach(side => {
        const a1 = baseA + side * 0.5 + wave;
        const p1 = Vec2.add(headPos, Vec2.fromAngle(a1, 18 * this.scale));
        const p2 = Vec2.add(p1, Vec2.fromAngle(a1 + side * 0.2, 16 * this.scale));

        ctx.beginPath();
        ctx.moveTo(headPos.x, headPos.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = p.accent;
        ctx.lineWidth = 1.6 * this.scale;
        ctx.stroke();
      });
      ctx.restore();
    }

    drawCerci(ctx, tailPos, tangent, p) {
      ctx.save();
      const baseA = tangent.heading() + Math.PI;
      [-1, 1].forEach(side => {
        const a1 = baseA + side * 0.35;
        const p1 = Vec2.add(tailPos, Vec2.fromAngle(a1, 20 * this.scale));
        ctx.beginPath();
        ctx.moveTo(tailPos.x, tailPos.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.strokeStyle = p.primary;
        ctx.lineWidth = 1.5 * this.scale;
        ctx.stroke();
      });
      ctx.restore();
    }
  }

  /**
   * 6. ABYSSAL MANTA RAY (Majestic Gliding & Dual Wing Flapping)
   */
  class MantaCreature extends Creature {
    constructor() {
      super('manta');
      const segmentLengths = [20, 20, 20, 18, 16, 15, 14, 14, 13, 12, 12, 11, 10, 10, 9, 9, 8];
      const radii = [14, 20, 26, 28, 25, 20, 16, 12, 8, 5, 4, 3, 3, 2, 2, 2, 2, 1];
      this.spine = new SpineChain(segmentLengths, radii, Math.PI / 6.5);
      this.spatialFrequency = 0.015; // Slow, majestic flap per ~420px of gliding
      this.legs = [];
    }

    update(targetPos, dt, params, isHunting = false) {
      this.maxSpeed = params.speed * 1.0;
      this.scale = params.scale;
      this.spine.maxAngle = params.angleLimit;

      this.updatePhysics(targetPos, dt, 1.0, isHunting);
      this.spine.resolveConstraints(this.pos, this.heading);
    }

    draw(ctx, renderMode, debugOpts) {
      const p = this.getPalette();
      const contour = this.spine.getContourPoints(this.scale);
      const pts = this.spine.joints;

      this.drawMantaWings(ctx, pts, contour, p, renderMode);

      if (renderMode === 'organic' || renderMode === 'xray') {
        ctx.save();
        // Cephalic Horns
        [-1, 1].forEach(side => {
          const hornRoot = Vec2.add(pts[0], Vec2.mult(contour.normals[0], side * 12 * this.scale));
          const hornTip = Vec2.add(hornRoot, Vec2.fromAngle(contour.tangents[0].heading() + side * 0.3, 16 * this.scale));
          ctx.beginPath();
          ctx.moveTo(hornRoot.x, hornRoot.y);
          ctx.quadraticCurveTo(hornRoot.x, hornRoot.y, hornTip.x, hornTip.y);
          ctx.strokeStyle = p.primary;
          ctx.lineWidth = 3 * this.scale;
          ctx.stroke();
        });

        // Glowing Bioluminescent Nodes
        for (let i = 1; i < 9; i++) {
          const glowAlpha = 0.5 + 0.5 * Math.sin(this.swimPhase * 0.6 - i * 0.3);
          ctx.beginPath();
          ctx.arc(pts[i].x, pts[i].y, (4 - i * 0.3) * this.scale, 0, Math.PI * 2);
          ctx.fillStyle = p.accent;
          ctx.shadowColor = p.accent;
          ctx.shadowBlur = 8;
          ctx.globalAlpha = glowAlpha;
          ctx.fill();
        }
        ctx.restore();
      }
    }

    drawMantaWings(ctx, pts, contour, p, renderMode) {
      ctx.save();
      const maxWingSpan = 85 * this.scale;

      [-1, 1].forEach(side => {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);

        const wingPoints = [];
        for (let i = 1; i < 9; i++) {
          // Slow graceful flapping wave tied to distance traveled
          const flap = Math.sin(this.swimPhase * 0.8 - i * 0.25) * (i * 2.0 * this.scale);
          const span = maxWingSpan * Math.sin((i / 9) * Math.PI);
          const norm = contour.normals[i];
          const wingPt = Vec2.add(pts[i], Vec2.mult(norm, side * (span + flap)));
          wingPoints.push(wingPt);
        }

        ctx.lineTo(wingPoints[0].x, wingPoints[0].y);
        for (let w = 1; w < wingPoints.length; w++) {
          const mid = Vec2.lerp(wingPoints[w - 1], wingPoints[w], 0.5);
          ctx.quadraticCurveTo(wingPoints[w - 1].x, wingPoints[w - 1].y, mid.x, mid.y);
        }

        ctx.lineTo(pts[9].x, pts[9].y);
        ctx.closePath();

        const grad = ctx.createRadialGradient(
          pts[2].x, pts[2].y, 10,
          pts[2].x + side * maxWingSpan * 0.5, pts[2].y, maxWingSpan
        );
        grad.addColorStop(0, p.primary);
        grad.addColorStop(0.6, p.secondary);
        grad.addColorStop(1, 'rgba(0, 242, 254, 0.15)');

        ctx.fillStyle = grad;
        ctx.globalAlpha = renderMode === 'xray' ? 0.35 : 0.85;
        ctx.fill();
        ctx.strokeStyle = p.outline;
        ctx.lineWidth = 1.5 * this.scale;
        ctx.stroke();
      });
      ctx.restore();
    }
  }

  /* ==========================================================================
     7. INTERACTIVE ENTITIES (PREY, FOOD, OBSTACLES, BIOME PARTICLES)
     ========================================================================== */

  class PreyCritter {
    constructor(x, y, biome = 'ocean') {
      this.pos = new Vec2(x, y);
      this.vel = Vec2.fromAngle(Math.random() * Math.PI * 2, 0.45);
      this.acc = new Vec2();
      this.biome = biome;
      this.alive = true;
      this.fleeRadius = 65;
      this.wanderAngle = Math.random() * Math.PI * 2;
      this.maxSpeed = 0.55;
      this.swimPhase = Math.random() * 10;
      
      // Teeny procedural mini-spine (4 tiny segments)
      this.spineLengths = [5, 4.5, 4, 3.5];
      this.spineRadii = [3.2, 2.8, 2.0, 1.2];
      this.joints = [];
      let cx = 0;
      for (let i = 0; i <= this.spineLengths.length; i++) {
        this.joints.push(new Vec2(x - cx, y));
        if (i < this.spineLengths.length) cx += this.spineLengths[i];
      }
    }

    update(creaturePos, obstacles, bounds) {
      if (!this.alive) return;

      const distToPredator = Vec2.dist(this.pos, creaturePos);
      let targetSpeed = this.maxSpeed;

      if (distToPredator < this.fleeRadius) {
        // Gentle panicked flutter, noticeably slower than predator
        const fleeDir = Vec2.sub(this.pos, creaturePos).normalize().mult(1.15);
        const steer = Vec2.sub(fleeDir, this.vel).limit(0.12);
        this.acc.add(steer);
        targetSpeed = 1.15;
      } else {
        // Calm, lazy micro-drift
        this.wanderAngle += (Math.random() - 0.5) * 0.2;
        const wanderVec = Vec2.fromAngle(this.wanderAngle, 0.45);
        this.acc.add(wanderVec);
      }

      obstacles.forEach(obs => {
        const d = Vec2.dist(this.pos, obs.pos);
        if (d < obs.radius + 20) {
          const push = Vec2.sub(this.pos, obs.pos).normalize().mult(1.0);
          this.acc.add(push);
        }
      });

      // Soft margin bounce
      const m = 35;
      if (this.pos.x < m) this.acc.add(new Vec2(0.8, 0));
      if (this.pos.x > bounds.w - m) this.acc.add(new Vec2(-0.8, 0));
      if (this.pos.y < m) this.acc.add(new Vec2(0, 0.8));
      if (this.pos.y > bounds.h - m) this.acc.add(new Vec2(0, -0.8));

      this.vel.add(this.acc).limit(targetSpeed);
      const prevPos = this.pos.copy();
      this.pos.add(this.vel);
      this.acc.set(0, 0);

      const movedDist = Vec2.dist(this.pos, prevPos);
      this.swimPhase += movedDist * 0.15;

      // Resolve mini procedural spine chain
      this.joints[0].set(this.pos.x, this.pos.y);
      for (let i = 1; i < this.joints.length; i++) {
        const p = this.joints[i - 1];
        const c = this.joints[i];
        const angle = Math.atan2(c.y - p.y, c.x - p.x);
        const dist = this.spineLengths[i - 1];
        c.set(p.x + Math.cos(angle) * dist, p.y + Math.sin(angle) * dist);
      }

      if (distToPredator < 28) {
        this.alive = false;
        audio.playStrike();
      }
    }

    draw(ctx) {
      if (!this.alive) return;
      ctx.save();

      const heading = this.vel.heading();
      const n = this.joints.length;

      // Biome color styling
      let glowColor = '#00f2fe';
      let bodyColor = '#4facfe';
      let finColor = 'rgba(0, 242, 254, 0.6)';

      if (this.biome === 'terrarium') {
        glowColor = '#2ed573';
        bodyColor = '#7bed9f';
        finColor = 'rgba(46, 213, 115, 0.6)';
      } else if (this.biome === 'desert') {
        glowColor = '#ffa502';
        bodyColor = '#ffc048';
        finColor = 'rgba(255, 165, 2, 0.6)';
      } else if (this.biome === 'cyber') {
        glowColor = '#ff007f';
        bodyColor = '#ff477e';
        finColor = 'rgba(255, 0, 127, 0.6)';
      }

      // Draw mini spine body
      ctx.beginPath();
      ctx.moveTo(this.joints[0].x, this.joints[0].y);
      for (let i = 1; i < n; i++) {
        ctx.lineTo(this.joints[i].x, this.joints[i].y);
      }
      ctx.strokeStyle = bodyColor;
      ctx.lineWidth = 3.0;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Tiny head bulb
      ctx.beginPath();
      ctx.arc(this.joints[0].x, this.joints[0].y, 3.0, 0, Math.PI * 2);
      ctx.fillStyle = glowColor;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 6;
      ctx.fill();

      // Tiny fin fluttering
      const finWave = Math.sin(this.swimPhase * 2.0) * 0.4;
      const normal = new Vec2(-Math.sin(heading), Math.cos(heading));
      [-1, 1].forEach(side => {
        const finRoot = Vec2.add(this.joints[1], Vec2.mult(normal, side * 2.5));
        const finTip = Vec2.add(finRoot, Vec2.fromAngle(heading + side * (1.8 + finWave), 4));
        ctx.beginPath();
        ctx.moveTo(finRoot.x, finRoot.y);
        ctx.lineTo(finTip.x, finTip.y);
        ctx.strokeStyle = finColor;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      });

      // Teeny eyes
      const eyeL = Vec2.add(this.joints[0], Vec2.fromAngle(heading - 0.7, 2.2));
      const eyeR = Vec2.add(this.joints[0], Vec2.fromAngle(heading + 0.7, 2.2));
      [eyeL, eyeR].forEach(e => {
        ctx.beginPath();
        ctx.arc(e.x, e.y, 0.9, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      });

      ctx.restore();
    }
  }

  class FoodPellet {
    constructor(x, y) {
      this.pos = new Vec2(x, y);
      this.radius = 6;
      this.alive = true;
      this.pulse = 0;
    }

    update(dt, creaturePos) {
      this.pulse += dt * 4;
      if (Vec2.dist(this.pos, creaturePos) < 18) {
        this.alive = false;
        audio.playChime(659.25);
      }
    }

    draw(ctx) {
      ctx.save();
      const r = this.radius + Math.sin(this.pulse) * 1.5;
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, r, 0, Math.PI * 2);
      ctx.fillStyle = '#ffaa00';
      ctx.shadowColor = '#ffaa00';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.restore();
    }
  }

  class Obstacle {
    constructor(x, y, radius = 35) {
      this.pos = new Vec2(x, y);
      this.radius = radius;
    }

    draw(ctx) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(this.pos.x - 6, this.pos.y - 6, 4, 0, Math.PI * 2);
      ctx.arc(this.pos.x + 8, this.pos.y + 4, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  class BiomeEnvironment {
    constructor(type = 'ocean') {
      this.type = type;
      this.particles = [];
      this.time = 0;
      this.initParticles();
    }

    setBiome(type) {
      this.type = type;
      this.initParticles();
    }

    initParticles() {
      this.particles = [];
      const count = 45;
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          vx: (Math.random() - 0.5) * 0.6,
          vy: -0.4 - Math.random() * 0.6,
          radius: 1 + Math.random() * 3,
          alpha: 0.2 + Math.random() * 0.5,
          phase: Math.random() * Math.PI * 2
        });
      }
    }

    update(dt, w, h) {
      this.time += dt;
      this.particles.forEach(p => {
        p.x += p.vx + Math.sin(this.time + p.phase) * 0.3;
        p.y += p.vy;
        if (p.y < 0) { p.y = h; p.x = Math.random() * w; }
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
      });
    }

    draw(ctx, w, h) {
      let bgGrad;
      if (this.type === 'ocean') {
        bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, '#040b14');
        bgGrad.addColorStop(1, '#021e28');
      } else if (this.type === 'terrarium') {
        bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, '#060d09');
        bgGrad.addColorStop(1, '#0e2316');
      } else if (this.type === 'desert') {
        bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, '#120b06');
        bgGrad.addColorStop(1, '#2c1808');
      } else {
        bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, '#05070a');
        bgGrad.addColorStop(1, '#0b121e');
      }

      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      if (this.type === 'cyber') {
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 242, 254, 0.06)';
        ctx.lineWidth = 1;
        const gridSize = 50;
        for (let x = 0; x < w; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }
        for (let y = 0; y < h; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
        ctx.restore();
      }

      ctx.save();
      this.particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.type === 'ocean' ? 'rgba(0, 242, 254, ' + p.alpha + ')' :
                        (this.type === 'terrarium' ? 'rgba(46, 213, 115, ' + p.alpha + ')' :
                        (this.type === 'desert' ? 'rgba(240, 147, 43, ' + p.alpha + ')' :
                        'rgba(255, 0, 127, ' + p.alpha + ')'));
        ctx.fill();
      });
      ctx.restore();
    }
  }

  /* ==========================================================================
     8. DEBUG X-RAY & MATH OVERLAY RENDERERS
     ========================================================================== */

  function drawDebugOverlays(ctx, creature, opts) {
    const spine = creature.spine;
    const pts = spine.joints;
    const contour = spine.getContourPoints(creature.scale);

    // 1. Spine Skeleton & Joint Pivots
    if (opts.renderMode === 'skeleton' || opts.renderMode === 'xray' || opts.renderMode === 'fabrik') {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.strokeStyle = '#3da9fc';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      pts.forEach((j, i) => {
        ctx.beginPath();
        ctx.arc(j.x, j.y, i === 0 ? 5 : 3.5, 0, Math.PI * 2);
        ctx.fillStyle = i === 0 ? '#ff4757' : '#00e676';
        ctx.fill();
      });
      ctx.restore();
    }

    // 2. Angle Constraint Limit Arcs
    if (opts.showAngleLimits) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 170, 0, 0.7)';
      ctx.lineWidth = 1.5;
      for (let i = 1; i < pts.length; i++) {
        const j = pts[i - 1];
        const refA = spine.segmentAngles[i - 1];
        ctx.beginPath();
        ctx.arc(j.x, j.y, 16, refA - spine.maxAngle, refA + spine.maxAngle);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 3. Foot Target Anchors & Stride Trajectories
    if (opts.showFootprints && creature.legs && creature.legs.length > 0) {
      ctx.save();
      creature.legs.forEach(leg => {
        const jIdx = leg.anchorJointIndex;
        if (jIdx >= pts.length) return;
        const shoulderCenter = pts[jIdx];
        const bodyR = (spine.radii[jIdx] || 15) * creature.scale;
        const restAnchor = leg.getRestAnchor(shoulderCenter, contour.normals[jIdx], contour.tangents[jIdx], bodyR);

        ctx.beginPath();
        ctx.arc(restAnchor.x, restAnchor.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 230, 118, 0.6)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(restAnchor.x, restAnchor.y, leg.strideRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 230, 118, 0.25)';
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        if (leg.isStepping) {
          ctx.beginPath();
          ctx.moveTo(leg.stepStartFoot.x, leg.stepStartFoot.y);
          ctx.lineTo(leg.targetFoot.x, leg.targetFoot.y);
          ctx.strokeStyle = '#ff4757';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });
      ctx.restore();
    }

    // 4. Tangents & Orthogonal Normals
    if (opts.showNormals || opts.renderMode === 'mesh') {
      ctx.save();
      pts.forEach((j, i) => {
        const n = contour.normals[i];
        const t = contour.tangents[i];
        const r = (spine.radii[i] || 10) * creature.scale;

        ctx.beginPath();
        ctx.moveTo(j.x - n.x * r, j.y - n.y * r);
        ctx.lineTo(j.x + n.x * r, j.y + n.y * r);
        ctx.strokeStyle = 'rgba(0, 242, 254, 0.7)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(j.x, j.y);
        ctx.lineTo(j.x + t.x * 12, j.y + t.y * 12);
        ctx.strokeStyle = 'rgba(46, 213, 115, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
      ctx.restore();
    }

    // 5. Velocity Lead Vector
    if (opts.showVelocityLead) {
      ctx.save();
      const lead = Vec2.mult(creature.vel, 14);
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      ctx.lineTo(pts[0].x + lead.x, pts[0].y + lead.y);
      ctx.strokeStyle = '#ff4757';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(pts[0].x + lead.x, pts[0].y + lead.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ff4757';
      ctx.fill();
      ctx.restore();
    }
  }

  /* ==========================================================================
     9. APPLICATION MASTER CONTROLLER
     ========================================================================== */

  class App {
    constructor() {
      this.canvas = document.getElementById('simCanvas');
      this.ctx = this.canvas.getContext('2d');

      this.creatureType = 'fish';
      this.creatures = {
        fish: new FishCreature(),
        lizard: new LizardCreature(),
        snake: new SnakeCreature(),
        spider: new SpiderCreature(),
        centipede: new CentipedeCreature(),
        manta: new MantaCreature()
      };
      this.activeCreature = this.creatures.fish;

      this.biome = new BiomeEnvironment('ocean');
      this.preyList = [];
      this.foodList = [];
      this.obstacles = [
        new Obstacle(window.innerWidth * 0.25, window.innerHeight * 0.35, 38),
        new Obstacle(window.innerWidth * 0.65, window.innerHeight * 0.6, 45)
      ];

      this.mouse = new Vec2(window.innerWidth * 0.5, window.innerHeight * 0.5);
      this.isMouseDown = false;
      this.activeTool = 'food';
      this.controlMode = 'cursor';
      this.keys = {};
      this.wanderTime = 0;
      this.wanderWaypoint = null;
      this.wanderWaypointTimer = 0;

      this.params = {
        speed: 3.5,
        angleLimit: Math.PI / 5.5,
        stepRadius: 36,
        stepLift: 16,
        undulationAmp: 1.0,
        scale: 1.0
      };

      this.debugOpts = {
        renderMode: 'organic',
        showAngleLimits: false,
        showFootprints: true,
        showNormals: false,
        showVelocityLead: false
      };

      this.lastFrameTime = performance.now();
      this.fps = 60;
      this.frameCount = 0;
      this.fpsTimer = performance.now();

      this.initDom();
      this.bindEvents();
      this.resize();
      this.animate();
    }

    initDom() {
      this.hudCreatureName = document.getElementById('hudCreatureName');
      this.hudFps = document.getElementById('hudFps');
      this.hudJoints = document.getElementById('hudJoints');
      this.hudLegs = document.getElementById('hudLegs');
      this.hudGait = document.getElementById('hudGait');
      this.instructionText = document.getElementById('instructionText');

      this.speedSlider = document.getElementById('speedSlider');
      this.speedVal = document.getElementById('speedVal');
      this.angleLimitSlider = document.getElementById('angleLimitSlider');
      this.angleLimitVal = document.getElementById('angleLimitVal');
      this.stepRadiusSlider = document.getElementById('stepRadiusSlider');
      this.stepRadiusVal = document.getElementById('stepRadiusVal');
      this.stepLiftSlider = document.getElementById('stepLiftSlider');
      this.stepLiftVal = document.getElementById('stepLiftVal');
      this.undulationSlider = document.getElementById('undulationSlider');
      this.undulationVal = document.getElementById('undulationVal');
      this.scaleSlider = document.getElementById('scaleSlider');
      this.scaleVal = document.getElementById('scaleVal');

      this.controlModeSelect = document.getElementById('controlModeSelect');
      this.renderModeSelect = document.getElementById('renderModeSelect');
      this.keyboardPrompt = document.getElementById('keyboardPrompt');
      this.audioToggleBtn = document.getElementById('audioToggleBtn');
      this.audioIcon = document.getElementById('audioIcon');
      this.audioLabel = document.getElementById('audioLabel');

      this.theoryModal = document.getElementById('theoryModal');
    }

    bindEvents() {
      window.addEventListener('resize', () => this.resize());

      this.canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
      this.canvas.addEventListener('pointermove', (e) => this.onPointerMove(e));
      window.addEventListener('pointerup', () => { this.isMouseDown = false; });

      window.addEventListener('keydown', (e) => {
        this.keys[e.key.toLowerCase()] = true;
        if (e.key >= '1' && e.key <= '6') {
          const types = ['fish', 'lizard', 'snake', 'spider', 'centipede', 'manta'];
          this.switchCreature(types[parseInt(e.key) - 1]);
        }
      });
      window.addEventListener('keyup', (e) => {
        this.keys[e.key.toLowerCase()] = false;
      });

      document.querySelectorAll('.creature-card').forEach(card => {
        card.addEventListener('click', () => {
          const type = card.dataset.creature;
          this.switchCreature(type);
        });
      });

      document.querySelectorAll('.biome-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.biome-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const bType = btn.dataset.biome;
          this.biome.setBiome(bType);
          audio.playChime(440);
        });
      });

      document.querySelectorAll('.segment-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.segment-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.activeTool = btn.dataset.tool;
        });
      });

      this.controlModeSelect.addEventListener('change', (e) => {
        this.controlMode = e.target.value;
        this.keyboardPrompt.classList.toggle('hidden', this.controlMode !== 'keyboard');
        if (this.controlMode === 'hunt' && this.preyList.length === 0) {
          this.spawnPrey(3);
        }
      });

      this.renderModeSelect.addEventListener('change', (e) => {
        this.debugOpts.renderMode = e.target.value;
      });

      document.getElementById('showAngleLimitsChk').addEventListener('change', (e) => {
        this.debugOpts.showAngleLimits = e.target.checked;
      });
      document.getElementById('showFootprintsChk').addEventListener('change', (e) => {
        this.debugOpts.showFootprints = e.target.checked;
      });
      document.getElementById('showNormalsChk').addEventListener('change', (e) => {
        this.debugOpts.showNormals = e.target.checked;
      });
      document.getElementById('showVelocityLeadChk').addEventListener('change', (e) => {
        this.debugOpts.showVelocityLead = e.target.checked;
      });

      this.speedSlider.addEventListener('input', (e) => {
        this.params.speed = parseFloat(e.target.value);
        this.speedVal.textContent = this.params.speed.toFixed(1);
      });
      this.angleLimitSlider.addEventListener('input', (e) => {
        const deg = parseInt(e.target.value);
        this.params.angleLimit = (deg * Math.PI) / 180;
        this.angleLimitVal.textContent = deg + '°';
      });
      this.stepRadiusSlider.addEventListener('input', (e) => {
        this.params.stepRadius = parseFloat(e.target.value);
        this.stepRadiusVal.textContent = this.params.stepRadius + 'px';
      });
      this.stepLiftSlider.addEventListener('input', (e) => {
        this.params.stepLift = parseFloat(e.target.value);
        this.stepLiftVal.textContent = this.params.stepLift + 'px';
      });
      this.undulationSlider.addEventListener('input', (e) => {
        this.params.undulationAmp = parseFloat(e.target.value);
        this.undulationVal.textContent = this.params.undulationAmp.toFixed(1) + 'x';
      });
      this.scaleSlider.addEventListener('input', (e) => {
        this.params.scale = parseFloat(e.target.value);
        this.scaleVal.textContent = this.params.scale.toFixed(2) + 'x';
      });

      document.getElementById('resetDefaultsBtn').addEventListener('click', () => {
        this.speedSlider.value = 3.5;
        this.angleLimitSlider.value = 32;
        this.stepRadiusSlider.value = 36;
        this.stepLiftSlider.value = 16;
        this.undulationSlider.value = 1.0;
        this.scaleSlider.value = 1.0;
        this.speedSlider.dispatchEvent(new Event('input'));
        this.angleLimitSlider.dispatchEvent(new Event('input'));
        this.stepRadiusSlider.dispatchEvent(new Event('input'));
        this.stepLiftSlider.dispatchEvent(new Event('input'));
        this.undulationSlider.dispatchEvent(new Event('input'));
        this.scaleSlider.dispatchEvent(new Event('input'));
      });

      document.querySelectorAll('.palette-swatch').forEach(swatch => {
        swatch.addEventListener('click', () => {
          document.querySelectorAll('.palette-swatch').forEach(s => s.classList.remove('active'));
          swatch.classList.add('active');
          const pKey = swatch.dataset.palette;
          Object.values(this.creatures).forEach(c => c.paletteKey = pKey);
          audio.playChime(587.33);
        });
      });

      document.getElementById('spawnPreyBtn').addEventListener('click', () => this.spawnPrey(3));
      document.getElementById('clearEntitiesBtn').addEventListener('click', () => {
        this.preyList = [];
        this.foodList = [];
        this.obstacles = [];
      });

      this.audioToggleBtn.addEventListener('click', () => {
        const active = audio.toggle();
        this.audioToggleBtn.classList.toggle('active', active);
        this.audioIcon.className = active ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
        this.audioLabel.textContent = active ? 'Audio: On' : 'Audio: Off';
      });

      const openTheory = () => this.theoryModal.classList.add('show');
      const closeTheory = () => this.theoryModal.classList.remove('show');
      document.getElementById('theoryToggleBtn').addEventListener('click', openTheory);
      document.getElementById('theoryCloseBtn').addEventListener('click', closeTheory);
      document.getElementById('theoryBackdrop').addEventListener('click', closeTheory);
      document.getElementById('theoryGotItBtn').addEventListener('click', closeTheory);
    }

    resize() {
      const rect = this.canvas.parentElement.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.width = rect.width;
      this.height = rect.height;
    }

    switchCreature(type) {
      if (!this.creatures[type]) return;
      this.creatureType = type;
      const prevPos = this.activeCreature.pos.copy();
      this.activeCreature = this.creatures[type];
      this.activeCreature.pos.set(prevPos.x, prevPos.y);

      // Re-initialize feet positions to avoid stretching on switch
      if (this.activeCreature.legs) {
        const contour = this.activeCreature.spine.getContourPoints(this.activeCreature.scale);
        this.activeCreature.legs.forEach(leg => {
          const jIdx = leg.anchorJointIndex;
          if (jIdx < this.activeCreature.spine.joints.length) {
            const center = this.activeCreature.spine.joints[jIdx];
            const bodyR = (this.activeCreature.spine.radii[jIdx] || 15) * this.activeCreature.scale;
            const rest = leg.getRestAnchor(center, contour.normals[jIdx], contour.tangents[jIdx], bodyR);
            leg.currentFoot.set(rest.x, rest.y);
            leg.targetFoot.set(rest.x, rest.y);
            leg.isStepping = false;
          }
        });
      }

      document.querySelectorAll('.creature-card').forEach(card => {
        card.classList.toggle('active', card.dataset.creature === type);
      });

      const names = {
        fish: 'Koi Fish',
        lizard: 'Gecko Lizard',
        snake: 'Sand Viper',
        spider: 'Shadow Spider',
        centipede: 'Armored Centipede',
        manta: 'Abyssal Manta'
      };
      this.hudCreatureName.textContent = names[type];
      this.hudJoints.textContent = this.activeCreature.spine.numJoints;
      this.hudLegs.textContent = this.activeCreature.legs ? this.activeCreature.legs.length : 0;
      this.hudGait.textContent = this.activeCreature.legs && this.activeCreature.legs.length > 0 ? 'Analytical IK Gait' : 'Traveling Wave';

      audio.playChime(523.25);
    }

    spawnPrey(count = 1) {
      for (let i = 0; i < count; i++) {
        const x = 50 + Math.random() * (this.width - 100);
        const y = 50 + Math.random() * (this.height - 100);
        this.preyList.push(new PreyCritter(x, y, this.biome.type));
      }
      audio.playChime(783.99);
    }

    onPointerDown(e) {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.mouse.set(x, y);
      this.isMouseDown = true;

      if (this.activeTool === 'food') {
        this.foodList.push(new FoodPellet(x, y));
        audio.playChime(659.25);
      } else if (this.activeTool === 'prey') {
        this.preyList.push(new PreyCritter(x, y, this.biome.type));
        audio.playChime(783.99);
      } else if (this.activeTool === 'obstacle') {
        this.obstacles.push(new Obstacle(x, y, 32 + Math.random() * 20));
      }
    }

    onPointerMove(e) {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.mouse.set(x, y);
    }

    pickNewWanderWaypoint() {
      const margin = 140;
      const minX = margin;
      const maxX = Math.max(minX + 100, this.width - margin);
      const minY = margin;
      const maxY = Math.max(minY + 100, this.height - margin);

      const curPos = this.activeCreature.pos;
      const heading = this.activeCreature.heading;

      // Try candidate points projected in a gentle forward arc (+- 65 degrees from current heading)
      let bestPoint = null;
      for (let attempt = 0; attempt < 12; attempt++) {
        const angleOffset = (Math.random() - 0.5) * (Math.PI * 0.7);
        const candAngle = heading + angleOffset;
        const candDist = 240 + Math.random() * 320;
        const candX = curPos.x + Math.cos(candAngle) * candDist;
        const candY = curPos.y + Math.sin(candAngle) * candDist;

        if (candX >= minX && candX <= maxX && candY >= minY && candY <= maxY) {
          bestPoint = new Vec2(candX, candY);
          break;
        }
      }

      // Fallback: pick any open point in safe bounds
      if (!bestPoint) {
        bestPoint = new Vec2(
          minX + Math.random() * (maxX - minX),
          minY + Math.random() * (maxY - minY)
        );
      }

      this.wanderWaypoint = bestPoint;
      this.wanderWaypointTimer = 5.0 + Math.random() * 3.5;
    }

    getTargetPosition(dt) {
      // 1. Priority: Food Pellets
      if (this.foodList.length > 0) {
        let nearest = this.foodList[0];
        let minDist = Vec2.dist(this.activeCreature.pos, nearest.pos);
        for (let i = 1; i < this.foodList.length; i++) {
          const d = Vec2.dist(this.activeCreature.pos, this.foodList[i].pos);
          if (d < minDist) {
            minDist = d;
            nearest = this.foodList[i];
          }
        }
        return { pos: nearest.pos.copy(), isHunting: true };
      }

      // 2. Prey Hunting & Predator Attraction
      const alivePrey = this.preyList.filter(p => p.alive);
      if (alivePrey.length > 0) {
        let nearest = null;
        let minDist = Infinity;
        for (let i = 0; i < alivePrey.length; i++) {
          const d = Vec2.dist(this.activeCreature.pos, alivePrey[i].pos);
          if (d < minDist) {
            minDist = d;
            nearest = alivePrey[i];
          }
        }

        // Always hunt in 'hunt' mode, or if prey is within detection radius (240px) in any mode
        const isHuntMode = this.controlMode === 'hunt';
        const isPreyNearby = minDist < 240;

        if (nearest && (isHuntMode || isPreyNearby)) {
          if (minDist < 70 && !this.activeCreature.isStriking) {
            this.activeCreature.isStriking = true;
            this.activeCreature.strikeCooldown = 0.4;
          }
          return { pos: nearest.pos.copy(), isHunting: true };
        }
      }

      // 3. Autonomous Wander Mode
      if (this.controlMode === 'wander') {
        if (!this.wanderWaypoint) {
          this.pickNewWanderWaypoint();
        }

        this.wanderWaypointTimer -= dt;
        const distToWaypoint = Vec2.dist(this.activeCreature.pos, this.wanderWaypoint);

        // When the creature arrives within 85px of the waypoint or timer expires,
        // seamlessly transition to the next forward destination!
        if (distToWaypoint < 85 || this.wanderWaypointTimer <= 0) {
          this.pickNewWanderWaypoint();
        }

        return { pos: this.wanderWaypoint.copy(), isHunting: false };
      }

      if (this.controlMode === 'keyboard') {
        const dir = new Vec2();
        if (this.keys['w'] || this.keys['arrowup']) dir.y -= 1;
        if (this.keys['s'] || this.keys['arrowdown']) dir.y += 1;
        if (this.keys['a'] || this.keys['arrowleft']) dir.x -= 1;
        if (this.keys['d'] || this.keys['arrowright']) dir.x += 1;

        const isSprinting = this.keys['shift'];
        const sprintMultiplier = isSprinting ? 2.0 : 1.0;

        if (dir.magSq() > 0) {
          dir.normalize().mult(80 * sprintMultiplier);
          return { pos: Vec2.add(this.activeCreature.pos, dir), isHunting: true };
        }
        return { pos: this.activeCreature.pos.copy(), isHunting: false };
      }

      return { pos: this.mouse.copy(), isHunting: false };
    }

    animate() {
      requestAnimationFrame(() => this.animate());

      const now = performance.now();
      const dt = Math.min((now - this.lastFrameTime) / 1000, 0.1);
      this.lastFrameTime = now;

      this.frameCount++;
      if (now - this.fpsTimer >= 500) {
        this.fps = Math.round((this.frameCount * 1000) / (now - this.fpsTimer));
        this.hudFps.textContent = this.fps;
        this.frameCount = 0;
        this.fpsTimer = now;
      }

      this.biome.update(dt, this.width, this.height);

      const targetData = this.getTargetPosition(dt);
      const targetPos = targetData.pos || targetData;
      const isHunting = !!targetData.isHunting;

      this.obstacles.forEach(obs => {
        const d = Vec2.dist(this.activeCreature.pos, obs.pos);
        if (d < obs.radius + 25) {
          const push = Vec2.sub(this.activeCreature.pos, obs.pos).normalize().mult(4.0);
          this.activeCreature.pos.add(push);
        }
      });

      this.activeCreature.update(targetPos, dt, this.params, isHunting);

      this.preyList.forEach(p => p.update(this.activeCreature.pos, this.obstacles, { w: this.width, h: this.height }));
      this.preyList = this.preyList.filter(p => p.alive);

      this.foodList.forEach(f => f.update(dt, this.activeCreature.pos));
      this.foodList = this.foodList.filter(f => f.alive);

      this.biome.draw(this.ctx, this.width, this.height);
      this.obstacles.forEach(obs => obs.draw(this.ctx));
      this.foodList.forEach(f => f.draw(this.ctx));
      this.preyList.forEach(p => p.draw(this.ctx));

      this.activeCreature.draw(this.ctx, this.debugOpts.renderMode, this.debugOpts);

      drawDebugOverlays(this.ctx, this.activeCreature, this.debugOpts);
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    new App();
  });
})();
