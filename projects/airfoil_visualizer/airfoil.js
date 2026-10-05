/**
 * =========================================================================
 * AIRFOIL & FLOWFIELD VISUALIZER
 * 2D Aerodynamics, Potential Flow & NACA Kinematics Engine
 * =========================================================================
 */

(() => {
  'use strict';

  // --- DOM Elements ---
  const canvas = document.getElementById('simCanvas');
  const ctx = canvas.getContext('2d');
  const polarCanvas = document.getElementById('polarCanvas');
  const polarCtx = polarCanvas.getContext('2d');
  const viewport = document.getElementById('viewport');

  // Telemetry Labels
  const valCL = document.getElementById('valCL');
  const valCD = document.getElementById('valCD');
  const valLD = document.getElementById('valLD');
  const valAoaTop = document.getElementById('valAoaTop');
  const stallAlert = document.getElementById('stallAlert');

  // Controls
  const nacaInput = document.getElementById('nacaInput');
  const sliderCamber = document.getElementById('sliderCamber');
  const sliderCamberPos = document.getElementById('sliderCamberPos');
  const sliderThickness = document.getElementById('sliderThickness');
  const sliderFlap = document.getElementById('sliderFlap');
  const chkSlat = document.getElementById('chkSlat');
  const sliderAoa = document.getElementById('sliderAoa');
  const sliderSpeed = document.getElementById('sliderSpeed');
  const sliderDensity = document.getElementById('sliderDensity');

  // Value Display Spans
  const valCamber = document.getElementById('valCamber');
  const valCamberPos = document.getElementById('valCamberPos');
  const valThickness = document.getElementById('valThickness');
  const valFlap = document.getElementById('valFlap');
  const valAoa = document.getElementById('valAoa');
  const valSpeed = document.getElementById('valSpeed');
  const valDensity = document.getElementById('valDensity');

  // Breakdown Spans
  const forceLift = document.getElementById('forceLift');
  const forceDrag = document.getElementById('forceDrag');
  const dynPressure = document.getElementById('dynPressure');
  const forceCm = document.getElementById('forceCm');
  const polarStatus = document.getElementById('polarStatus');

  // Toggles
  const chkVectors = document.getElementById('chkVectors');
  const chkCamberLine = document.getElementById('chkCamberLine');
  const chkChordLine = document.getElementById('chkChordLine');
  const chkVortices = document.getElementById('chkVortices');

  const btnPlayPause = document.getElementById('btnPlayPause');
  const btnSnapshot = document.getElementById('btnSnapshot');
  const btnReset = document.getElementById('btnReset');
  const colorbarCard = document.getElementById('colorbarCard');
  const cbTitle = document.getElementById('cbTitle');
  const cbGradient = document.getElementById('cbGradient');
  const cbMin = document.getElementById('cbMin');
  const cbMax = document.getElementById('cbMax');

  // --- Simulation State ---
  const state = {
    // NACA parameters (fractional: 0..1)
    m: 0.02, // max camber
    p: 0.40, // max camber pos
    t: 0.12, // max thickness
    flapDeg: 0,
    hasSlat: false,

    // Flight conditions
    aoaDeg: 5.0,
    speed: 60.0, // m/s
    density: 1.225, // kg/m^3
    chord: 1.0, // meters (reference)
    span: 1.0,  // meters (unit 2D span)

    // Flow view mode: 'streamlines', 'particles', 'pressure', 'velocity'
    flowMode: 'streamlines',
    paused: false,

    // Calculated Aerodynamics
    CL: 0,
    CD: 0,
    CM: 0,
    isStalled: false,
    stallAoaDeg: 15.0,

    // View Transform
    zoom: 1.0,
    panX: 0,
    panY: 0,
    isDraggingAoa: false,
    dragStartY: 0,
    dragStartAoa: 0
  };

  // Preset Configurations
  const PRESETS = {
    cruise: { naca: '2412', m: 0.02, p: 0.40, t: 0.12, flap: 0, slat: false, aoa: 3.5, speed: 85 },
    takeoff: { naca: '4412', m: 0.04, p: 0.40, t: 0.12, flap: 25, slat: true, aoa: 8.0, speed: 45 },
    stall: { naca: '0012', m: 0.00, p: 0.40, t: 0.12, flap: 0, slat: false, aoa: 18.5, speed: 50 },
    aerobatic: { naca: '0012', m: 0.00, p: 0.40, t: 0.12, flap: 0, slat: false, aoa: 0.0, speed: 90 },
    glider: { naca: '6412', m: 0.06, p: 0.40, t: 0.12, flap: 5, slat: false, aoa: 5.5, speed: 30 },
    supersonic: { naca: '0006', m: 0.00, p: 0.40, t: 0.06, flap: 0, slat: false, aoa: 2.0, speed: 130 }
  };

  // --- Geometry Cache ---
  let foilPoints = { upper: [], lower: [], camber: [], all: [] };
  let slatPoints = [];
  let chordLenPixels = 320;
  let animTime = 0;

  // Particle System
  const NUM_SMOKE_STREAMS = 32;
  const PARTICLES_PER_STREAM = 28;
  let particles = [];

  function initParticles() {
    particles = [];
    for (let s = 0; s < NUM_SMOKE_STREAMS; s++) {
      const yFrac = (s / (NUM_SMOKE_STREAMS - 1) - 0.5) * 2.2;
      for (let p = 0; p < PARTICLES_PER_STREAM; p++) {
        const xFrac = -2.2 + (p / PARTICLES_PER_STREAM) * 4.4;
        particles.push({
          x: xFrac,
          y: yFrac,
          baseY: yFrac,
          age: Math.random() * 100,
          speedOffset: 0.95 + Math.random() * 0.1
        });
      }
    }
  }

  // --- NACA 4-Digit Generator ---
  function computeAirfoilGeometry() {
    const N = 80;
    const upper = [];
    const lower = [];
    const camber = [];

    const m = state.m;
    const p = state.p;
    const t = state.t;
    const flapAngleRad = (state.flapDeg * Math.PI) / 180;
    const flapHingeX = 0.75;

    for (let i = 0; i <= N; i++) {
      // Cosine point distribution (dense at leading edge)
      const beta = (i / N) * Math.PI;
      const x = 0.5 * (1 - Math.cos(beta));

      // NACA 4-digit thickness formula
      const yt = 5 * t * (
        0.2969 * Math.sqrt(Math.max(0, x)) -
        0.1260 * x -
        0.3516 * Math.pow(x, 2) +
        0.2843 * Math.pow(x, 3) -
        0.1015 * Math.pow(x, 4)
      );

      // Camber line & slope
      let yc = 0;
      let dyc = 0;
      if (p > 0 && m > 0) {
        if (x < p) {
          yc = (m / (p * p)) * (2 * p * x - x * x);
          dyc = ((2 * m) / (p * p)) * (p - x);
        } else {
          yc = (m / Math.pow(1 - p, 2)) * ((1 - 2 * p) + 2 * p * x - x * x);
          dyc = ((2 * m) / Math.pow(1 - p, 2)) * (p - x);
        }
      }

      const theta = Math.atan(dyc);
      let xu = x - yt * Math.sin(theta);
      let yu = yc + yt * Math.cos(theta);
      let xl = x + yt * Math.sin(theta);
      let yl = yc - yt * Math.cos(theta);
      let xc = x;

      // Kinematic Flap Deflection (Aft of 75% chord)
      if (state.flapDeg > 0) {
        let hingeYc = 0;
        if (p > 0 && m > 0) {
          hingeYc = flapHingeX < p 
            ? (m / (p * p)) * (2 * p * flapHingeX - flapHingeX * flapHingeX)
            : (m / Math.pow(1 - p, 2)) * ((1 - 2 * p) + 2 * p * flapHingeX - flapHingeX * flapHingeX);
        }

        if (x >= flapHingeX) {
          // Rotate upper point
          const dxu = xu - flapHingeX;
          const dyu = yu - hingeYc;
          xu = flapHingeX + dxu * Math.cos(flapAngleRad) + dyu * Math.sin(flapAngleRad);
          yu = hingeYc - dxu * Math.sin(flapAngleRad) + dyu * Math.cos(flapAngleRad);

          // Rotate lower point
          const dxl = xl - flapHingeX;
          const dyl = yl - hingeYc;
          xl = flapHingeX + dxl * Math.cos(flapAngleRad) + dyl * Math.sin(flapAngleRad);
          yl = hingeYc - dxl * Math.sin(flapAngleRad) + dyl * Math.cos(flapAngleRad);

          // Rotate camber point
          const dxc = xc - flapHingeX;
          const dyc_val = yc - hingeYc;
          xc = flapHingeX + dxc * Math.cos(flapAngleRad) + dyc_val * Math.sin(flapAngleRad);
          yc = hingeYc - dxc * Math.sin(flapAngleRad) + dyc_val * Math.cos(flapAngleRad);
        }
      }

      upper.push({ x: xu - 0.25, y: yu }); // Shift origin to 25% chord (aerodynamic center)
      lower.push({ x: xl - 0.25, y: yl });
      camber.push({ x: xc - 0.25, y: yc });
    }

    // Combine into closed polygon
    const all = [...upper, ...lower.reverse()];
    foilPoints = { upper, lower: lower.reverse(), camber, all };

    // Leading-Edge Slat Geometry
    slatPoints = [];
    if (state.hasSlat) {
      const slatLen = 0.14;
      const slatThick = t * 0.7;
      const slatGapX = -0.06;
      const slatGapY = 0.05;
      for (let i = 0; i <= 20; i++) {
        const s = (i / 20) * slatLen;
        const sx = -0.25 + slatGapX + s;
        const sy = slatGapY - Math.sin((i / 20) * Math.PI) * slatThick;
        slatPoints.push({ x: sx, y: sy });
      }
    }
  }

  // --- Aerodynamic Solver (Thin Airfoil + Kirchhoff Stall Separation) ---
  function computeAeroCoefficients() {
    const alphaRad = (state.aoaDeg * Math.PI) / 180;
    
    // Slat increases stall angle by ~6 degrees
    state.stallAoaDeg = state.hasSlat ? 21.0 : 15.0;
    const stallRad = (state.stallAoaDeg * Math.PI) / 180;

    // Zero-lift angle of attack approx: alpha0 = -1.15 * m * (100 in degrees)
    const alpha0Rad = -1.15 * state.m * (180 / Math.PI) * (Math.PI / 180) * 1.7;

    // Flap contribution
    const dCL_flap = (state.flapDeg / 40.0) * 0.95;
    const dCD_flap = Math.pow(state.flapDeg / 40.0, 2) * 0.045;

    // Linear Thin Airfoil Lift: 2 * pi * (alpha - alpha0)
    const liftSlope = 2 * Math.PI * 0.96; // 2D viscous correction ~ 0.96
    const CL_linear = liftSlope * (alphaRad - alpha0Rad) + dCL_flap;

    // Stall / Flow Separation Model
    const absAoa = Math.abs(alphaRad);
    if (absAoa > stallRad) {
      state.isStalled = true;
      const stallExcess = absAoa - stallRad;
      const sign = Math.sign(alphaRad);
      // Stalled lift drops and follows flat-plate crossflow ~ 2 * sin(alpha) * cos(alpha)
      const CL_max = liftSlope * (stallRad - alpha0Rad) + dCL_flap;
      state.CL = (CL_max * Math.exp(-stallExcess * 2.8) + 1.2 * Math.sin(2 * alphaRad)) * 0.5 * sign;
    } else {
      state.isStalled = false;
      state.CL = CL_linear;
    }

    // Drag Polar: CD = CD0 + CD_induced + CD_stall
    const CD0 = 0.0065 + 0.035 * state.t + dCD_flap;
    const CD_ind = Math.pow(state.CL, 2) / (Math.PI * 0.88 * 8.0); // 2D effective aspect ratio
    const CD_stall = state.isStalled ? 1.6 * Math.pow(Math.sin(alphaRad), 2) : 0;
    state.CD = CD0 + CD_ind + CD_stall;

    // Pitching Moment about c/4
    state.CM = -(Math.PI / 2) * state.m - (state.flapDeg / 40.0) * 0.08;

    // Dynamic Pressure: q = 0.5 * rho * V^2
    const q = 0.5 * state.density * Math.pow(state.speed, 2);
    const S = state.chord * state.span;
    const L_newtons = state.CL * q * S;
    const D_newtons = state.CD * q * S;
    const LD_ratio = state.CD > 0.0001 ? state.CL / state.CD : 0;

    // Update UI DOM
    valCL.innerText = state.CL.toFixed(2);
    valCD.innerText = state.CD.toFixed(3);
    valLD.innerText = isFinite(LD_ratio) ? LD_ratio.toFixed(1) : '—';
    valAoaTop.innerText = state.aoaDeg.toFixed(1) + '°';

    stallAlert.hidden = !state.isStalled;
    polarStatus.innerText = state.isStalled ? '⚠️ Stalled (Separated)' : 'Linear Flow';
    polarStatus.style.color = state.isStalled ? 'var(--accent-red)' : 'var(--accent-green)';

    forceLift.innerText = Math.round(L_newtons).toLocaleString() + ' N';
    forceDrag.innerText = Math.round(D_newtons).toLocaleString() + ' N';
    dynPressure.innerText = Math.round(q).toLocaleString() + ' Pa';
    forceCm.innerText = state.CM.toFixed(3);
  }

  // --- Flow Velocity Vector Calculator ---
  // Calculates local (u, v) normalized to freestream V_inf at world coordinate (wx, wy)
  function getFlowVelocity(wx, wy) {
    const alphaRad = (state.aoaDeg * Math.PI) / 180;
    const cosA = Math.cos(-alphaRad);
    const sinA = Math.sin(-alphaRad);

    // Transform world point into airfoil frame
    const fx = wx * cosA - wy * sinA;
    const fy = wx * sinA + wy * cosA;

    // Freestream in airfoil frame
    let u_f = cosA;
    let v_f = -sinA;

    // Circulation vortex at aerodynamic center (x=0 in shifted coordinates)
    const gamma = state.CL * 0.5;
    const r2 = fx * fx + fy * fy + 0.008; // smoothing kernel to prevent singularity
    const u_circ = -(gamma * fy) / (2 * Math.PI * r2);
    const v_circ = +(gamma * fx) / (2 * Math.PI * r2);

    // Source-sink doublet for thickness displacement
    const doubletStrength = state.t * 0.35;
    const u_thick = doubletStrength * (fx * fx - fy * fy) / (2 * Math.PI * Math.pow(r2, 1.2));
    const v_thick = doubletStrength * (2 * fx * fy) / (2 * Math.PI * Math.pow(r2, 1.2));

    let u_tot_f = u_f + u_circ + u_thick;
    let v_tot_f = v_f + v_circ + v_thick;

    // Unsteady Wake Vortex Shedding when stalled
    if (state.isStalled && fx > 0.4) {
      const wakeFreq = 12.0;
      const wakeDecay = Math.max(0, 1.0 - (fx - 0.4) * 0.3);
      const wakeAmp = Math.min(0.8, (Math.abs(state.aoaDeg) - state.stallAoaDeg) * 0.08);
      const vortex = Math.sin(animTime * wakeFreq - fx * 8.0) * wakeAmp * wakeDecay;
      v_tot_f += vortex;
      u_tot_f *= (0.4 + 0.3 * Math.cos(animTime * wakeFreq));
    }

    // Transform back to world frame
    const u_w = u_tot_f * Math.cos(alphaRad) - v_tot_f * Math.sin(alphaRad);
    const v_w = u_tot_f * Math.sin(alphaRad) + v_tot_f * Math.cos(alphaRad);

    const speedMag = Math.sqrt(u_w * u_w + v_w * v_w);
    const Cp = 1.0 - speedMag * speedMag;

    return { u: u_w, v: v_w, speed: speedMag, Cp };
  }

  // --- Color Interpolation Helper ---
  function getCpColor(Cp) {
    // Cp ranges from -2.5 (suction blue/cyan) to +1.0 (stagnation red/orange)
    const norm = Math.max(0, Math.min(1, (Cp + 2.0) / 3.0));
    if (norm < 0.25) {
      // Deep Blue to Cyan
      const f = norm / 0.25;
      return `rgb(0, ${Math.round(150 + f * 105)}, 255)`;
    } else if (norm < 0.5) {
      // Cyan to Green
      const f = (norm - 0.25) / 0.25;
      return `rgb(0, 255, ${Math.round(255 * (1 - f))})`;
    } else if (norm < 0.75) {
      // Green to Yellow
      const f = (norm - 0.5) / 0.25;
      return `rgb(${Math.round(255 * f)}, 255, 0)`;
    } else {
      // Yellow to Red
      const f = (norm - 0.75) / 0.25;
      return `rgb(255, ${Math.round(255 * (1 - f * 0.8))}, 0)`;
    }
  }

  function getVelocityColor(vel) {
    // Vel / V_inf ranges from 0.0 (blue) to 2.2 (red/orange)
    const norm = Math.max(0, Math.min(1, vel / 2.0));
    const r = Math.round(Math.min(255, norm * 350));
    const g = Math.round(Math.sin(norm * Math.PI) * 220);
    const b = Math.round(Math.max(0, (1 - norm * 1.5) * 255));
    return `rgb(${r}, ${g}, ${b})`;
  }

  // --- Canvas Rendering Loop ---
  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = viewport.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.resetTransform();
    ctx.scale(dpr, dpr);
    chordLenPixels = Math.min(rect.width * 0.42, 380);
  }

  function render(timestamp) {
    if (!state.paused) {
      animTime += 0.016;
    }

    const w = viewport.clientWidth;
    const h = viewport.clientHeight;

    ctx.clearRect(0, 0, w, h);

    // Coordinate Center (Airfoil Aerodynamic Center at 38% width, 50% height)
    const centerX = w * 0.38 + state.panX;
    const centerY = h * 0.50 + state.panY;
    const scale = chordLenPixels * state.zoom;

    // 1. Draw Aerodynamic Tunnel Grid
    drawGrid(w, h);

    // 2. Draw Flow Field based on selected mode
    if (state.flowMode === 'pressure' || state.flowMode === 'velocity') {
      drawScalarField(centerX, centerY, scale, w, h);
    } else if (state.flowMode === 'streamlines') {
      drawStreamlines(centerX, centerY, scale, w, h);
    } else if (state.flowMode === 'particles') {
      drawParticles(centerX, centerY, scale, w, h);
    }

    // 3. Draw Airfoil Solid Geometry & High-Lift Devices
    drawAirfoil(centerX, centerY, scale);

    // 4. Draw Aerodynamic Reference Lines (Camber, Chord, CP)
    drawReferenceLines(centerX, centerY, scale);

    // 5. Draw Dynamic Aerodynamic Force Vectors (L, D, R)
    if (chkVectors.checked) {
      drawForceVectors(centerX, centerY, scale);
    }

    // 6. Update Polar Mini Curve
    drawPolarCurve();

    requestAnimationFrame(render);
  }

  // --- Background Wind Tunnel Grid ---
  function drawGrid(w, h) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const step = 40;
    for (let x = 0; x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }

  // --- Streamline Smoke Tracers ---
  function drawStreamlines(cx, cy, scale, w, h) {
    const numLines = 26;
    const alphaRad = (state.aoaDeg * Math.PI) / 180;

    ctx.lineWidth = 1.6;

    for (let i = 0; i < numLines; i++) {
      const y0Norm = (i / (numLines - 1) - 0.5) * 1.8;
      let wx = -1.6;
      let wy = y0Norm;

      ctx.beginPath();
      let started = false;

      const steps = 110;
      const dt = 0.035;

      for (let s = 0; s < steps; s++) {
        const vel = getFlowVelocity(wx, wy);
        
        // Convert world to canvas screen
        const sx = cx + wx * scale;
        const sy = cy - wy * scale; // invert Y for screen coords

        if (!started) {
          ctx.moveTo(sx, sy);
          started = true;
        } else {
          ctx.lineTo(sx, sy);
        }

        // Advance Euler integration
        wx += vel.u * dt;
        wy -= vel.v * dt;

        if (sx > w + 50 || sy < -50 || sy > h + 50) break;
      }

      // Streamline color modulation
      const distFromCenter = Math.abs(y0Norm);
      const alpha = Math.max(0.2, 0.8 - distFromCenter * 0.4);
      ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
      ctx.stroke();
    }
  }

  // --- Smoke Particle Streaks ---
  function drawParticles(cx, cy, scale, w, h) {
    const dt = 0.016;

    particles.forEach(p => {
      if (!state.paused) {
        const vel = getFlowVelocity(p.x, p.y);
        p.x += vel.u * (state.speed / 50.0) * dt * p.speedOffset;
        p.y -= vel.v * (state.speed / 50.0) * dt * p.speedOffset;

        // Reset particle when it leaves right boundary
        if (p.x > 2.2) {
          p.x = -2.0 - Math.random() * 0.4;
          p.y = p.baseY + (Math.random() - 0.5) * 0.05;
        }
      }

      const sx = cx + p.x * scale;
      const sy = cy - p.y * scale;

      const vel = getFlowVelocity(p.x, p.y);
      const streakLen = Math.max(4, vel.speed * 8);

      ctx.fillStyle = state.isStalled && p.x > 0.3 
        ? 'rgba(248, 113, 113, 0.7)' 
        : 'rgba(241, 245, 249, 0.75)';

      ctx.beginPath();
      ctx.arc(sx, sy, 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx - vel.u * streakLen, sy + vel.v * streakLen);
      ctx.stroke();
    });
  }

  // --- Scalar Field (Pressure Cp & Velocity) ---
  function drawScalarField(cx, cy, scale, w, h) {
    const step = 14;
    const isPressure = state.flowMode === 'pressure';

    for (let px = 0; px < w; px += step) {
      for (let py = 0; py < h; py += step) {
        const wx = (px - cx) / scale;
        const wy = (cy - py) / scale;

        // Don't draw scalar points inside the airfoil envelope
        if (isInsideAirfoil(wx, wy)) continue;

        const flow = getFlowVelocity(wx, wy);
        ctx.fillStyle = isPressure ? getCpColor(flow.Cp) : getVelocityColor(flow.speed);
        ctx.fillRect(px - step / 2, py - step / 2, step, step);
      }
    }
  }

  function isInsideAirfoil(wx, wy) {
    const alphaRad = (state.aoaDeg * Math.PI) / 180;
    const cosA = Math.cos(-alphaRad);
    const sinA = Math.sin(-alphaRad);
    const fx = wx * cosA - wy * sinA + 0.25;
    const fy = wx * sinA + wy * cosA;

    if (fx < 0 || fx > 1.0) return false;
    const t = state.t;
    const yt = 5 * t * (0.2969 * Math.sqrt(fx) - 0.1260 * fx - 0.3516 * fx * fx + 0.2843 * Math.pow(fx, 3) - 0.1015 * Math.pow(fx, 4));
    return Math.abs(fy) < yt * 1.05;
  }

  // --- Airfoil Drawing ---
  function drawAirfoil(cx, cy, scale) {
    const alphaRad = (state.aoaDeg * Math.PI) / 180;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(alphaRad); // Rotate around aerodynamic center (origin)

    // Airfoil Solid Fill
    ctx.beginPath();
    foilPoints.all.forEach((pt, i) => {
      const px = pt.x * scale;
      const py = -pt.y * scale;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();

    // Dark sleek titanium skin with glowing neon boundary
    ctx.fillStyle = '#0F1722';
    ctx.fill();

    ctx.strokeStyle = state.isStalled ? '#F87171' : '#38BDF8';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = state.isStalled ? 'rgba(248, 113, 113, 0.6)' : 'rgba(56, 189, 248, 0.5)';
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Slat Drawing
    if (state.hasSlat && slatPoints.length > 0) {
      ctx.beginPath();
      slatPoints.forEach((pt, i) => {
        const px = pt.x * scale;
        const py = -pt.y * scale;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.fillStyle = '#162334';
      ctx.fill();
      ctx.strokeStyle = '#34D399';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.restore();
  }

  // --- Reference Lines ---
  function drawReferenceLines(cx, cy, scale) {
    const alphaRad = (state.aoaDeg * Math.PI) / 180;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(alphaRad);

    // Chord Line (Dashed)
    if (chkChordLine.checked) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(-0.25 * scale, 0);
      ctx.lineTo(0.75 * scale, 0);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Camber Line
    if (chkCamberLine.checked && foilPoints.camber.length > 0) {
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      foilPoints.camber.forEach((pt, i) => {
        const px = pt.x * scale;
        const py = -pt.y * scale;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
    }

    // Center of Pressure Marker (Circle with cross)
    if (chkChordLine.checked) {
      const cpX = (0.25 - (state.CM / (state.CL || 0.01))) - 0.25;
      const clampedCpX = Math.max(-0.25, Math.min(0.75, cpX)) * scale;
      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.arc(clampedCpX, 0, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // --- Dynamic Aero Force Vectors (L, D, R) ---
  function drawForceVectors(cx, cy, scale) {
    const vectorScale = scale * 0.45;
    const alphaRad = (state.aoaDeg * Math.PI) / 180;

    // Origin of forces is at Center of Pressure (CP)
    const cpShift = Math.max(-0.25, Math.min(0.75, 0.25 - (state.CM / (state.CL || 0.01)) - 0.25));
    const originX = cx + (cpShift * Math.cos(alphaRad)) * scale;
    const originY = cy + (cpShift * Math.sin(alphaRad)) * scale;

    const liftMag = state.CL * vectorScale;
    const dragMag = state.CD * vectorScale * 6.0; // Visual boost to make drag clearly perceptible

    // Lift Vector (Perpendicular to freestream: upward in wind frame)
    const liftX = originX;
    const liftY = originY - liftMag;

    // Drag Vector (Parallel to freestream: downstream to the right)
    const dragX = originX + dragMag;
    const dragY = originY;

    // Resultant Aerodynamic Force Vector
    const resX = originX + dragMag;
    const resY = originY - liftMag;

    // 1. Draw Lift Vector (Green)
    drawArrow(originX, originY, liftX, liftY, '#34D399', `L: ${valCL.innerText}`);

    // 2. Draw Drag Vector (Red)
    drawArrow(originX, originY, dragX, dragY, '#F87171', `D: ${valCD.innerText}`);

    // 3. Draw Resultant Vector (Yellow dashed)
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(resX, resY);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawArrow(x1, y1, x2, y2, color, label) {
    const headLen = 10;
    const angle = Math.atan2(y2 - y1, x2 - x1);

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;

    // Line
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Arrow Head
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;

    // Label
    ctx.font = '600 11px JetBrains Mono';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(label, x2 + 6, y2 - 4);
  }

  // --- Mini Polar Graph (CL vs AOA) ---
  function drawPolarCurve() {
    const pw = polarCanvas.width;
    const ph = polarCanvas.height;

    polarCtx.clearRect(0, 0, pw, ph);

    // Axes
    polarCtx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    polarCtx.lineWidth = 1;
    polarCtx.beginPath();
    polarCtx.moveTo(20, ph / 2);
    polarCtx.lineTo(pw - 10, ph / 2); // AOA axis (zero CL)
    polarCtx.moveTo(pw / 2, 8);
    polarCtx.lineTo(pw / 2, ph - 8); // CL axis (zero AOA)
    polarCtx.stroke();

    // Plot CL curve across AOA: -15 deg to +25 deg
    polarCtx.strokeStyle = '#38BDF8';
    polarCtx.lineWidth = 1.8;
    polarCtx.beginPath();

    const minAoa = -15;
    const maxAoa = 25;
    const stallLimit = state.hasSlat ? 21 : 15;

    for (let a = minAoa; a <= maxAoa; a += 1) {
      const aRad = (a * Math.PI) / 180;
      const alpha0Rad = -1.15 * state.m * (180 / Math.PI) * (Math.PI / 180) * 1.7;
      const dCL_f = (state.flapDeg / 40.0) * 0.95;

      let cl = 0;
      if (Math.abs(a) > stallLimit) {
        const excess = Math.abs(aRad) - (stallLimit * Math.PI) / 180;
        const clMax = 2 * Math.PI * 0.96 * ((stallLimit * Math.PI) / 180 - alpha0Rad) + dCL_f;
        cl = (clMax * Math.exp(-excess * 2.8) + 1.2 * Math.sin(2 * aRad)) * 0.5 * Math.sign(a);
      } else {
        cl = 2 * Math.PI * 0.96 * (aRad - alpha0Rad) + dCL_f;
      }

      // Map (a, cl) to canvas pixels
      const px = 20 + ((a - minAoa) / (maxAoa - minAoa)) * (pw - 30);
      const py = (ph / 2) - (cl / 2.2) * (ph * 0.42);

      if (a === minAoa) polarCtx.moveTo(px, py);
      else polarCtx.lineTo(px, py);
    }
    polarCtx.stroke();

    // Current Operating Point Dot
    const currPx = 20 + ((state.aoaDeg - minAoa) / (maxAoa - minAoa)) * (pw - 30);
    const currPy = (ph / 2) - (state.CL / 2.2) * (ph * 0.42);

    polarCtx.fillStyle = state.isStalled ? '#F87171' : '#34D399';
    polarCtx.shadowColor = polarCtx.fillStyle;
    polarCtx.shadowBlur = 6;
    polarCtx.beginPath();
    polarCtx.arc(currPx, currPy, 4, 0, Math.PI * 2);
    polarCtx.fill();
    polarCtx.shadowBlur = 0;
  }

  // --- Interaction & Event Listeners ---
  function updateFromSliders() {
    state.m = parseFloat(sliderCamber.value) / 100.0;
    state.p = parseFloat(sliderCamberPos.value) / 100.0;
    state.t = parseFloat(sliderThickness.value) / 100.0;
    state.flapDeg = parseFloat(sliderFlap.value);
    state.hasSlat = chkSlat.checked;
    state.aoaDeg = parseFloat(sliderAoa.value);
    state.speed = parseFloat(sliderSpeed.value);
    state.density = parseFloat(sliderDensity.value);

    // Update text indicators
    valCamber.innerText = sliderCamber.value + ' %';
    valCamberPos.innerText = sliderCamberPos.value + ' %';
    valThickness.innerText = sliderThickness.value + ' %';
    valFlap.innerText = sliderFlap.value + '°';
    valAoa.innerText = state.aoaDeg.toFixed(1) + '°';
    valSpeed.innerText = Math.round(state.speed) + ' m/s';
    valDensity.innerText = state.density.toFixed(3) + ' kg/m³';

    // Sync NACA 4-digit text
    const mDigit = Math.round(state.m * 100);
    const pDigit = Math.round(state.p * 10);
    const tDigits = String(Math.round(state.t * 100)).padStart(2, '0');
    nacaInput.value = `${mDigit}${pDigit}${tDigits}`;

    computeAirfoilGeometry();
    computeAeroCoefficients();
  }

  // Sliders binding
  [sliderCamber, sliderCamberPos, sliderThickness, sliderFlap, sliderAoa, sliderSpeed, sliderDensity].forEach(el => {
    el.addEventListener('input', updateFromSliders);
  });
  chkSlat.addEventListener('change', updateFromSliders);

  // NACA input parse
  nacaInput.addEventListener('change', () => {
    const code = nacaInput.value.trim();
    if (code.length === 4 && /^\d{4}$/.test(code)) {
      const mVal = parseInt(code[0], 10);
      const pVal = parseInt(code[1], 10) * 10;
      const tVal = parseInt(code.slice(2), 10);

      sliderCamber.value = mVal;
      sliderCamberPos.value = Math.max(10, Math.min(90, pVal));
      sliderThickness.value = Math.max(4, Math.min(30, tVal));
      updateFromSliders();
    }
  });

  // Flow View Mode Pills
  const modePills = document.querySelectorAll('.mode-pill');
  modePills.forEach(pill => {
    pill.addEventListener('click', () => {
      modePills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.flowMode = pill.getAttribute('data-flow');

      // Update Colorbar visibility
      if (state.flowMode === 'pressure') {
        colorbarCard.hidden = false;
        cbTitle.innerText = 'Pressure Coefficient (Cp)';
        cbGradient.style.background = 'linear-gradient(to right, #0044FF, #00D4FF, #00FF88, #FFEE00, #FF3300)';
        cbMin.innerText = '-2.0 (Suction)';
        cbMax.innerText = '+1.0 (Stag.)';
      } else if (state.flowMode === 'velocity') {
        colorbarCard.hidden = false;
        cbTitle.innerText = 'Local Velocity Ratio (V / V_∞)';
        cbGradient.style.background = 'linear-gradient(to right, #0000FF, #00FF00, #FFFF00, #FF0000)';
        cbMin.innerText = '0.0 (Stagnant)';
        cbMax.innerText = '2.0 (Accelerated)';
      } else {
        colorbarCard.hidden = true;
      }
    });
  });

  // Preset Buttons
  const presetBtns = document.querySelectorAll('.preset-btn');
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      presetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const pKey = btn.getAttribute('data-preset');
      const p = PRESETS[pKey];
      if (p) {
        sliderCamber.value = p.m * 100;
        sliderCamberPos.value = p.p * 100;
        sliderThickness.value = p.t * 100;
        sliderFlap.value = p.flap;
        chkSlat.checked = p.slat;
        sliderAoa.value = p.aoa;
        sliderSpeed.value = p.speed;
        updateFromSliders();
      }
    });
  });

  // Action Buttons
  btnPlayPause.addEventListener('click', () => {
    state.paused = !state.paused;
    btnPlayPause.innerHTML = state.paused ? '<i class="fa-solid fa-play"></i>' : '<i class="fa-solid fa-pause"></i>';
  });

  btnReset.addEventListener('click', () => {
    const defaultBtn = document.querySelector('.preset-btn[data-preset="cruise"]');
    if (defaultBtn) defaultBtn.click();
    state.zoom = 1.0;
    state.panX = 0;
    state.panY = 0;
  });

  btnSnapshot.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `NACA_${nacaInput.value}_Alpha_${state.aoaDeg.toFixed(1)}deg.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  });

  // Interactive Drag on Canvas to change Angle of Attack
  viewport.addEventListener('mousedown', (e) => {
    state.isDraggingAoa = true;
    state.dragStartY = e.clientY;
    state.dragStartAoa = state.aoaDeg;
  });

  window.addEventListener('mousemove', (e) => {
    if (state.isDraggingAoa) {
      const deltaY = state.dragStartY - e.clientY;
      const newAoa = Math.max(-15, Math.min(25, state.dragStartAoa + deltaY * 0.15));
      sliderAoa.value = newAoa;
      updateFromSliders();
    }
  });

  window.addEventListener('mouseup', () => {
    state.isDraggingAoa = false;
  });

  // Wheel Zoom
  viewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomDelta = e.deltaY * -0.001;
    state.zoom = Math.max(0.6, Math.min(2.5, state.zoom + zoomDelta));
  }, { passive: false });

  // Window Resize
  window.addEventListener('resize', resizeCanvas);

  // --- Initial Start ---
  resizeCanvas();
  initParticles();
  updateFromSliders();
  requestAnimationFrame(render);

})();
