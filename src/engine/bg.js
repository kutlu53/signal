// Procedural cinematic backgrounds (placeholder art until real illustrations arrive).
// Each preset = parallax layers + ambient effects. Replace layer draw() calls with
// image layers later; the parallax/effects pipeline stays the same.

const SIGNAL = '#38e8d8';

function rnd(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

export class Background {
  constructor(canvas) {
    this.c = canvas; this.ctx = canvas.getContext('2d');
    this.preset = 'black'; this.t = 0; this.px = 0; this.py = 0; this.tx = 0; this.ty = 0;
    this.signal = 0; this.signalTarget = 0; this.reduce = false; this.vars = {}; // per-scene variables from JSON (e.g. clock: "07:45")
    this.dark = 0; this.darkTarget = 0;
    this.drops = Array.from({ length: 260 }, () => ({ x: Math.random(), y: Math.random(), v: 0.6 + Math.random() * 0.8, l: 10 + Math.random() * 18 }));
    this.dust = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), vx: (Math.random() - .5) * .02, vy: (Math.random() - .5) * .02, r: 1 + Math.random() * 2 }));
    this.noise = document.createElement('canvas'); this.noise.width = 160; this.noise.height = 90;
    window.addEventListener('pointermove', e => { this.tx = (e.clientX / innerWidth - .5); this.ty = (e.clientY / innerHeight - .5); });
    window.addEventListener('resize', () => this.resize()); this.resize();
    this.last = performance.now(); requestAnimationFrame(ts => this.frame(ts));
  }
  resize() { const d = Math.min(devicePixelRatio || 1, 2); this.c.width = innerWidth * d; this.c.height = innerHeight * d; this.ctx.setTransform(d, 0, 0, d, 0, 0); }
  set(preset) { this.preset = preset; }
  setSignal(v) { this.signalTarget = v; }
  fadeTo(v) { this.darkTarget = v; }

  frame(ts) {
    const dt = Math.min(0.05, (ts - this.last) / 1000); this.last = ts; this.t += dt;
    this.px += (this.tx - this.px) * dt * 2; this.py += (this.ty - this.py) * dt * 2;
    this.signal += (this.signalTarget - this.signal) * dt * 3;
    this.dark += (this.darkTarget - this.dark) * dt * 1.5;
    const w = innerWidth, h = innerHeight, ctx = this.ctx;
    ctx.clearRect(0, 0, w, h);
    const fn = PRESETS[this.preset] || PRESETS.black;
    fn(ctx, w, h, this.t, this);
    if (this.signal > 0.01) this.drawSignal(ctx, w, h);
    // vignette
    const g = ctx.createRadialGradient(w / 2, h / 2, h * .3, w / 2, h / 2, h * .95);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.55)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    if (this.dark > 0.01) { ctx.fillStyle = `rgba(0,0,0,${this.dark})`; ctx.fillRect(0, 0, w, h); }
    requestAnimationFrame(t2 => this.frame(t2));
  }

  // parallax helper: offset for a layer depth (0 far .. 1 near)
  par(depth, w, h) { const amp = this.reduce ? 0 : 1; const drift = Math.sin(this.t * .08) * 12 * amp; return [(-this.px * 40 * depth + drift * depth) * amp, -this.py * 20 * depth * amp]; }

  rain(ctx, w, h, strength = 1, wind = 0.25) {
    if (this.reduce) return;
    ctx.strokeStyle = 'rgba(190,210,255,.28)'; ctx.lineWidth = 1; ctx.beginPath();
    const n = Math.floor(this.drops.length * strength);
    for (let i = 0; i < n; i++) { const d = this.drops[i]; d.y += d.v * 0.016 * 1.4; d.x += wind * 0.016 * .3; if (d.y > 1.05) { d.y = -0.05; d.x = Math.random(); } if (d.x > 1.05) d.x = -0.05;
      const x = d.x * w, y = d.y * h; ctx.moveTo(x, y); ctx.lineTo(x - wind * d.l, y + d.l); }
    ctx.stroke();
  }
  dustMotes(ctx, w, h, color = 'rgba(242,179,91,.35)') {
    ctx.fillStyle = color;
    for (const p of this.dust) { if (!this.reduce) { p.x += p.vx * .016; p.y += p.vy * .016; } if (p.x < 0 || p.x > 1) p.vx *= -1; if (p.y < 0 || p.y > 1) p.vy *= -1;
      ctx.beginPath(); ctx.arc(p.x * w, p.y * h, p.r, 0, 7); ctx.fill(); }
  }
  flicker(base = 1, speed = 1) { if (this.reduce) return base; const t = this.t * speed; const f = Math.sin(t * 17) * .5 + Math.sin(t * 29.3) * .3 + (Math.sin(t * 3) > .95 ? -.6 : 0); return Math.max(.15, base + f * .25); }
  glow(ctx, x, y, r, color, a = 1) { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, color.replace('A', a)); g.addColorStop(1, color.replace('A', 0)); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); }
  staticNoise(ctx, w, h, a) {
    if (a <= 0.01) return; const n = this.noise, nc = n.getContext('2d'); const img = nc.createImageData(n.width, n.height);
    for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 255; img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255; }
    nc.putImageData(img, 0, 0); ctx.save(); ctx.globalAlpha = a * .25; ctx.imageSmoothingEnabled = false; ctx.drawImage(n, 0, 0, w, h); ctx.restore();
  }
  drawSignal(ctx, w, h) {
    const a = this.signal; this.staticNoise(ctx, w, h, a * .6);
    ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = SIGNAL; ctx.lineWidth = 2; ctx.shadowColor = SIGNAL; ctx.shadowBlur = 18;
    const cy = h * .42; ctx.beginPath();
    for (let x = 0; x <= w; x += 4) { const u = x / w; const env = Math.exp(-Math.pow((u - .5) * 3, 2)); const y = cy + Math.sin(u * 40 + this.t * 9) * 28 * env + Math.sin(u * 97 - this.t * 23) * 10 * env + (Math.random() - .5) * 6 * env; x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    ctx.stroke(); ctx.restore();
  }
}

function sky(ctx, w, h, top, bottom) { const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, top); g.addColorStop(1, bottom); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); }
function buildings(ctx, w, h, seed, baseY, color, maxH, lit) {
  const r = rnd(seed); ctx.fillStyle = color; let x = -20;
  while (x < w + 40) { const bw = 30 + r() * 80, bh = maxH * (.3 + r() * .7); ctx.fillRect(x, baseY - bh, bw, bh + 200);
    if (lit) { for (let wy = baseY - bh + 12; wy < baseY - 10; wy += 16) for (let wx = x + 6; wx < x + bw - 8; wx += 12) if (r() < lit) { ctx.fillStyle = `rgba(242,179,91,${.25 + r() * .5})`; ctx.fillRect(wx, wy, 5, 7); ctx.fillStyle = color; } }
    x += bw + 4 + r() * 14; }
}

const PRESETS = {
  black(ctx, w, h) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h); },

  // Night, rain, taxi at the school gate, attic window flickers.
  gate_night(ctx, w, h, t, bg) {
    sky(ctx, w, h, '#060a18', '#141c38');
    let [ox, oy] = bg.par(.2, w, h); ctx.save(); ctx.translate(ox, oy); buildings(ctx, w, h, 7, h * .62, '#0e1430', h * .35, .08); ctx.restore();
    [ox, oy] = bg.par(.5, w, h); ctx.save(); ctx.translate(ox, oy);
    // school building
    const bx = w * .25, bw = w * .5, by = h * .3; ctx.fillStyle = '#1a2142'; ctx.fillRect(bx, by, bw, h);
    ctx.beginPath(); ctx.moveTo(bx - 20, by); ctx.lineTo(bx + bw / 2, by - h * .14); ctx.lineTo(bx + bw + 20, by); ctx.closePath(); ctx.fill();
    // attic window (flicker)
    const f = bg.flicker(.9, 1.3); bg.glow(ctx, bx + bw / 2, by - h * .05, 70, 'rgba(56,232,216,A)', f * .5);
    ctx.fillStyle = `rgba(56,232,216,${f})`; ctx.fillRect(bx + bw / 2 - 12, by - h * .07, 24, 28);
    // windows rows
    for (let r = 0; r < 3; r++) for (let c = 0; c < 7; c++) { const lit = (r * 7 + c) % 5 === 1; ctx.fillStyle = lit ? 'rgba(242,179,91,.55)' : '#0b1026'; ctx.fillRect(bx + 30 + c * (bw - 60) / 7, by + 40 + r * 70, 24, 36); }
    // door glow
    bg.glow(ctx, bx + bw / 2, h * .72, 90, 'rgba(242,179,91,A)', .5); ctx.fillStyle = '#f2b35b'; ctx.fillRect(bx + bw / 2 - 18, h * .62, 36, 60);
    ctx.restore();
    // ground + puddle reflection
    ctx.fillStyle = '#0a0e1e'; ctx.fillRect(0, h * .72, w, h);
    ctx.fillStyle = 'rgba(56,232,216,.08)'; ctx.fillRect(w * .45, h * .78, w * .1, 3);
    // taxi headlights
    [ox, oy] = bg.par(.9, w, h); const tx = w * .12 + ox, ty = h * .8 + oy; ctx.fillStyle = '#0d1020'; ctx.fillRect(tx - 60, ty - 30, 160, 50);
    bg.glow(ctx, tx + 100, ty - 8, 140, 'rgba(255,230,160,A)', .8); bg.glow(ctx, tx + 100, ty + 10, 140, 'rgba(255,230,160,A)', .8);
    bg.rain(ctx, w, h, 1, .3);
  },

  // Reception desk, warm lamp, rain on the window behind.
  desk(ctx, w, h, t, bg) {
    sky(ctx, w, h, '#1b1a2c', '#2a2238');
    let [ox, oy] = bg.par(.2, w, h); ctx.fillStyle = '#0a0e22'; ctx.fillRect(w * .55 + ox, h * .12 + oy, w * .32, h * .4); ctx.save(); ctx.beginPath(); ctx.rect(w * .55 + ox, h * .12 + oy, w * .32, h * .4); ctx.clip(); bg.rain(ctx, w, h, .6, .2); ctx.restore();
    ctx.strokeStyle = '#3a3150'; ctx.lineWidth = 6; ctx.strokeRect(w * .55 + ox, h * .12 + oy, w * .32, h * .4);
    [ox, oy] = bg.par(.6, w, h); bg.glow(ctx, w * .25 + ox, h * .3 + oy, 260, 'rgba(242,179,91,A)', bg.flicker(.55, .3));
    ctx.fillStyle = '#4a3a2a'; ctx.fillRect(0, h * .62 + oy, w, h); ctx.fillStyle = '#6a5236'; ctx.fillRect(0, h * .62 + oy, w, 14);
    ctx.fillStyle = '#2a2015'; ctx.fillRect(w * .22 + ox, h * .18 + oy, 8, h * .44); ctx.fillStyle = '#f2b35b'; ctx.beginPath(); ctx.moveTo(w * .17 + ox, h * .3 + oy); ctx.lineTo(w * .35 + ox, h * .3 + oy); ctx.lineTo(w * .31 + ox, h * .2 + oy); ctx.lineTo(w * .21 + ox, h * .2 + oy); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e7dcc3'; ctx.fillRect(w * .4 + ox, h * .66 + oy, 90, 60); ctx.fillStyle = '#d6c7a3'; ctx.fillRect(w * .42 + ox, h * .68 + oy, 86, 60);
  },

  // Dorm room: bunk silhouettes, moonlight window, rain.
  dorm(ctx, w, h, t, bg) {
    sky(ctx, w, h, '#070a18', '#10142a');
    let [ox, oy] = bg.par(.2, w, h); const wx = w * .62 + ox, wy = h * .14 + oy, ww = w * .24, wh = h * .36;
    ctx.fillStyle = '#121a3a'; ctx.fillRect(wx, wy, ww, wh); ctx.save(); ctx.beginPath(); ctx.rect(wx, wy, ww, wh); ctx.clip(); bg.rain(ctx, w, h, .7, .25); ctx.restore();
    bg.glow(ctx, wx + ww / 2, wy + wh / 2, 320, 'rgba(120,150,255,A)', .25); ctx.strokeStyle = '#1e2a55'; ctx.lineWidth = 5; ctx.strokeRect(wx, wy, ww, wh); ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.moveTo(wx, wy + wh / 2); ctx.lineTo(wx + ww, wy + wh / 2); ctx.stroke();
    [ox, oy] = bg.par(.6, w, h); ctx.fillStyle = '#0b0f20'; ctx.fillRect(w * .08 + ox, h * .22 + oy, w * .34, 14); ctx.fillRect(w * .08 + ox, h * .5 + oy, w * .34, 14); ctx.fillRect(w * .08 + ox, h * .22 + oy, 10, h * .5); ctx.fillRect(w * .41 + ox, h * .22 + oy, 10, h * .5);
    ctx.fillStyle = '#17203d'; ctx.fillRect(w * .09 + ox, h * .36 + oy, w * .32, 50); ctx.fillRect(w * .09 + ox, h * .62 + oy, w * .32, 50);
    ctx.fillStyle = '#0a0d1c'; ctx.fillRect(0, h * .74 + oy, w, h);
    // ceiling crack light (the signal above)
    bg.glow(ctx, w * .5, 0, 220, 'rgba(56,232,216,A)', bg.flicker(.12, .6) * bg.signal + .03);
  },

  // Attic: beams, dust, lantern, old radio.
  attic(ctx, w, h, t, bg) {
    sky(ctx, w, h, '#120f14', '#1f1813');
    let [ox, oy] = bg.par(.3, w, h); ctx.strokeStyle = '#2b2119'; ctx.lineWidth = 26; ctx.beginPath();
    for (let i = 0; i < 6; i++) { const x = (i / 5) * w + ox; ctx.moveTo(x, oy); ctx.lineTo(w / 2 + ox, -h * .2 + oy); } ctx.stroke();
    ctx.fillStyle = '#17120f'; ctx.fillRect(0, h * .7 + oy, w, h);
    [ox, oy] = bg.par(.6, w, h);
    // lantern
    const f = bg.flicker(.9, 1); bg.glow(ctx, w * .18 + ox, h * .25 + oy, 420, 'rgba(242,179,91,A)', f * .55); ctx.fillStyle = `rgba(255,220,150,${f})`; ctx.beginPath(); ctx.arc(w * .18 + ox, h * .25 + oy, 10, 0, 7); ctx.fill();
    ctx.strokeStyle = '#3a2d22'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(w * .18 + ox, oy); ctx.lineTo(w * .18 + ox, h * .25 + oy); ctx.stroke();
    // boxes
    ctx.fillStyle = '#2a2018'; ctx.fillRect(w * .7 + ox, h * .5 + oy, 140, 110); ctx.fillRect(w * .78 + ox, h * .38 + oy, 100, 70); ctx.fillStyle = '#211913'; ctx.fillRect(w * .05 + ox, h * .55 + oy, 120, 90);
    // table + radio
    [ox, oy] = bg.par(.9, w, h); ctx.fillStyle = '#2d2219'; ctx.fillRect(w * .32 + ox, h * .56 + oy, w * .36, 16); ctx.fillRect(w * .34 + ox, h * .56 + oy, 10, h * .3); ctx.fillRect(w * .64 + ox, h * .56 + oy, 10, h * .3);
    const rx = w * .5 + ox, ry = h * .56 + oy; ctx.fillStyle = '#3b2a1e'; ctx.fillRect(rx - 70, ry - 90, 140, 90); ctx.fillStyle = '#1a1210'; ctx.fillRect(rx - 60, ry - 80, 70, 50);
    const dial = bg.signal; bg.glow(ctx, rx + 35, ry - 45, 60 + dial * 120, 'rgba(56,232,216,A)', .25 + dial * .7); ctx.fillStyle = `rgba(56,232,216,${.5 + dial * .5})`; ctx.beginPath(); ctx.arc(rx + 35, ry - 45, 14, 0, 7); ctx.fill();
    ctx.strokeStyle = '#6b5a44'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(rx + 50, ry - 90); ctx.lineTo(rx + 110, ry - 170); ctx.stroke();
    bg.dustMotes(ctx, w, h);
  },

  // Morning corridor: light shafts, lockers.
  corridor(ctx, w, h, t, bg) {
    sky(ctx, w, h, '#2d3b5c', '#8ea2c7');
    let [ox, oy] = bg.par(.3, w, h);
    for (let i = 0; i < 5; i++) { const x = w * (.1 + i * .2) + ox; ctx.fillStyle = '#dfe9ff'; ctx.fillRect(x, h * .12 + oy, w * .09, h * .3); ctx.save(); ctx.globalAlpha = .18; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(x, h * .42 + oy); ctx.lineTo(x + w * .09, h * .42 + oy); ctx.lineTo(x + w * .2, h + oy); ctx.lineTo(x - w * .02, h + oy); ctx.closePath(); ctx.fill(); ctx.restore(); }
    ctx.fillStyle = '#4a5878'; ctx.fillRect(0, h * .68 + oy, w, h);
    [ox, oy] = bg.par(.7, w, h); for (let i = 0; i < 9; i++) { ctx.fillStyle = i % 2 ? '#3b6b8f' : '#35607f'; ctx.fillRect(w * .02 + i * 60 + ox, h * .36 + oy, 52, h * .32); ctx.fillStyle = '#263f55'; ctx.fillRect(w * .02 + i * 60 + 38 + ox, h * .5 + oy, 6, 12); }
    bg.dustMotes(ctx, w, h, 'rgba(255,255,255,.35)');
  },

  // Rooftop door with a glowing lock.
  rooftop_door(ctx, w, h, t, bg) {
    sky(ctx, w, h, '#0c0f20', '#1a1a2e');
    let [ox, oy] = bg.par(.4, w, h); ctx.fillStyle = '#15121c'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#2b2436'; ctx.lineWidth = 2; for (let y = 0; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y + oy); ctx.lineTo(w, y + oy); ctx.stroke(); }
    [ox, oy] = bg.par(.7, w, h); const dx = w / 2 - 110 + ox, dy = h * .12 + oy; ctx.fillStyle = '#3a2f26'; ctx.fillRect(dx, dy, 220, h * .66); ctx.fillStyle = '#2a211b'; ctx.fillRect(dx + 20, dy + 20, 180, h * .6);
    const p = bg.flicker(.7, .8) * (1 - bg.signal) + bg.signal; bg.glow(ctx, dx + 170, dy + h * .36, 90, 'rgba(56,232,216,A)', p * .7); ctx.fillStyle = SIGNAL; ctx.beginPath(); ctx.arc(dx + 170, dy + h * .36, 9, 0, 7); ctx.fill();
    ctx.fillStyle = '#0d0b12'; ctx.fillRect(0, h * .78 + oy, w, h);
    bg.dustMotes(ctx, w, h);
  },

  // Common room, daytime, friends.
  common(ctx, w, h, t, bg) {
    sky(ctx, w, h, '#3a4466', '#b9c6e2');
    let [ox, oy] = bg.par(.2, w, h); ctx.fillStyle = '#e8f0ff'; ctx.fillRect(w * .1 + ox, h * .1 + oy, w * .8, h * .34); ctx.strokeStyle = '#5a6a90'; ctx.lineWidth = 8; ctx.strokeRect(w * .1 + ox, h * .1 + oy, w * .8, h * .34);
    [ox, oy] = bg.par(.6, w, h); ctx.fillStyle = '#5a4a3a'; ctx.fillRect(0, h * .66 + oy, w, h); ctx.fillStyle = '#7f6a52'; ctx.fillRect(w * .2 + ox, h * .5 + oy, w * .6, 22); ctx.fillStyle = '#c23b3b'; ctx.fillRect(w * .05 + ox, h * .52 + oy, w * .12, h * .2); ctx.fillStyle = '#2f7b6b'; ctx.fillRect(w * .83 + ox, h * .52 + oy, w * .12, h * .2);
    bg.dustMotes(ctx, w, h, 'rgba(255,255,255,.3)');
  },

  // Dorm, morning: sunlight through the window, bunks, a wall clock (bg.vars.clock = "06:30", bg.vars.alarm shakes it).
  dorm_morning(ctx, w, h, t, bg) {
    sky(ctx, w, h, '#2b3350', '#6f7fa8');
    let [ox, oy] = bg.par(.2, w, h); const wx = w * .62 + ox, wy = h * .14 + oy, ww = w * .24, wh = h * .36;
    ctx.fillStyle = '#ffe9b8'; ctx.fillRect(wx, wy, ww, wh); bg.glow(ctx, wx + ww / 2, wy + wh / 2, 380, 'rgba(255,220,150,A)', .45);
    ctx.save(); ctx.globalAlpha = .16; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(wx, wy + wh); ctx.lineTo(wx + ww, wy + wh); ctx.lineTo(wx + ww - w * .25, h); ctx.lineTo(wx - w * .3, h); ctx.closePath(); ctx.fill(); ctx.restore();
    ctx.strokeStyle = '#3b4670'; ctx.lineWidth = 5; ctx.strokeRect(wx, wy, ww, wh); ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.moveTo(wx, wy + wh / 2); ctx.lineTo(wx + ww, wy + wh / 2); ctx.stroke();
    [ox, oy] = bg.par(.6, w, h);
    ctx.fillStyle = '#1b2240'; ctx.fillRect(w * .08 + ox, h * .22 + oy, w * .34, 14); ctx.fillRect(w * .08 + ox, h * .5 + oy, w * .34, 14); ctx.fillRect(w * .08 + ox, h * .22 + oy, 10, h * .5); ctx.fillRect(w * .41 + ox, h * .22 + oy, 10, h * .5);
    ctx.fillStyle = '#3a4a7a'; ctx.fillRect(w * .09 + ox, h * .36 + oy, w * .32, 50); ctx.fillRect(w * .09 + ox, h * .62 + oy, w * .32, 50);
    ctx.fillStyle = '#2a2a3c'; ctx.fillRect(0, h * .74 + oy, w, h);
    const shake = bg.vars.alarm && !bg.reduce ? Math.sin(t * 60) * 3 : 0;
    clockFace(ctx, w * .52 + ox + shake, h * .2 + oy, Math.min(w, h) * .07, bg.vars.clock);
    bg.dustMotes(ctx, w, h, 'rgba(255,255,255,.3)');
  },

  // Classroom: board, desks, window, clock. Day and night variants.
  classroom(ctx, w, h, t, bg) { classroom(ctx, w, h, t, bg, false); },
  classroom_night(ctx, w, h, t, bg) { classroom(ctx, w, h, t, bg, true); },

  // Library: shelves, banker's lamp, big open yearbook on the table (bg.vars.book), erased photo flickers (bg.vars.erased). Day and night.
  library(ctx, w, h, t, bg) { library(ctx, w, h, t, bg, false); },
  library_night(ctx, w, h, t, bg) { library(ctx, w, h, t, bg, true); },

  // Radio tower at night: lattice mast, blinking red light, small station building. bg.vars.pulse = signal rings from the top.
  tower_night(ctx, w, h, t, bg) { tower(ctx, w, h, t, bg); },
  // Inside the tower control room: consoles with blinking LEDs, big window on the mast, desk with the logbook (bg.vars.book).
  tower_room(ctx, w, h, t, bg) { towerRoom(ctx, w, h, t, bg); },

  // Top-down table with the old floor plan on paper (bg.vars.room0 = a room glows that is not in the building).
  plan_table(ctx, w, h, t, bg) { planTable(ctx, w, h, t, bg); },
  // Neighbourhood street at dusk: terraced houses, a cottage, a block of flats, street lamps.
  street(ctx, w, h, t, bg) { street(ctx, w, h, t, bg); },
  // Hidden room: dark, a big wall map with glowing marks (bg.vars.pins), a lantern.
  hidden_room(ctx, w, h, t, bg) { hiddenRoom(ctx, w, h, t, bg); },

  // Night market on the pier: lantern strings, striped stalls, crowd silhouettes, water (bg.vars.star = a turquoise point in the sky).
  market(ctx, w, h, t, bg) { market(ctx, w, h, t, bg); },
  // Looking up from the pier: stars, a pulsing turquoise star with rings (bg.vars.star), lanterns at the bottom edge.
  pier_sky(ctx, w, h, t, bg) { pierSky(ctx, w, h, t, bg); },

  // Campfire at the forest edge: pines, stars, flames, a radio by the fire (bg.vars.eyes = animal eyes blink in the dark).
  camp(ctx, w, h, t, bg) { camp(ctx, w, h, t, bg); },
  // Coast at dusk: sea with waves, beach, rocks, turtle tracks, a sign post.
  coast(ctx, w, h, t, bg) { coast(ctx, w, h, t, bg); },

  // Attic with a skylight full of stars; the old radio (bg.vars.radio = rings, bg.vars.beam = a signal beam up through the skylight).
  attic_sky(ctx, w, h, t, bg) { atticSky(ctx, w, h, t, bg, false); },
  // The same attic in 2056: holographic panels, teal light, the radio on a pedestal.
  future_attic(ctx, w, h, t, bg) { atticSky(ctx, w, h, t, bg, true); },
};

function clockFace(ctx, x, y, r, text) {
  ctx.fillStyle = '#f4f1e8'; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.strokeStyle = '#2a2a33'; ctx.lineWidth = 3; ctx.stroke();
  const m = /^(\d+):(\d+)$/.exec(text || '');
  if (m) {
    const hh = +m[1], mm = +m[2], ma = (mm / 60) * Math.PI * 2 - Math.PI / 2, ha = ((hh % 12) / 12 + mm / 720) * Math.PI * 2 - Math.PI / 2;
    ctx.strokeStyle = '#2a2a33'; ctx.lineCap = 'round'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(ha) * r * .5, y + Math.sin(ha) * r * .5); ctx.stroke();
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(ma) * r * .78, y + Math.sin(ma) * r * .78); ctx.stroke();
  }
  if (text) { ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.font = `${Math.round(r * .7)}px Consolas, monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(text, x, y + r + 8); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left'; }
}

function classroom(ctx, w, h, t, bg, night) {
  sky(ctx, w, h, night ? '#0a0e1e' : '#4b5f8a', night ? '#151a30' : '#9fb2d6');
  let [ox, oy] = bg.par(.2, w, h);
  const wx = w * .74 + ox, wy = h * .12 + oy, ww = w * .18, wh = h * .4;
  ctx.fillStyle = night ? '#121a3a' : '#dbe9ff'; ctx.fillRect(wx, wy, ww, wh); ctx.strokeStyle = night ? '#1e2a55' : '#5a6a90'; ctx.lineWidth = 6; ctx.strokeRect(wx, wy, ww, wh); ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.stroke();
  if (night) bg.glow(ctx, wx + ww / 2, wy + wh / 2, 300, 'rgba(120,150,255,A)', .2);
  const bx = w * .1 + ox, by = h * .14 + oy, bw = w * .5, bh = h * .36;
  ctx.fillStyle = night ? '#101a18' : '#1f4a3c'; ctx.fillRect(bx, by, bw, bh); ctx.strokeStyle = night ? '#2a2420' : '#6b5236'; ctx.lineWidth = 10; ctx.strokeRect(bx, by, bw, bh);
  ctx.strokeStyle = night ? 'rgba(255,255,255,.08)' : 'rgba(255,255,255,.35)'; ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(bx + 30, by + 40 + i * 34); ctx.lineTo(bx + 30 + bw * (.3 + ((i * 37) % 50) / 100), by + 40 + i * 34); ctx.stroke(); }
  if (night) bg.glow(ctx, bx + bw / 2, by + bh / 2, 260, 'rgba(56,232,216,A)', bg.signal * .5);
  clockFace(ctx, (bx + bw + wx) / 2, by + Math.min(w, h) * .06, Math.min(w, h) * .045, bg.vars.clock);
  [ox, oy] = bg.par(.6, w, h); ctx.fillStyle = night ? '#1a1612' : '#8a6a4a'; ctx.fillRect(0, h * .62 + oy, w, h);
  for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) {
    const dx = w * (.08 + c * .23) + ox + r * 30, dy = h * (.6 + r * .14) + oy;
    ctx.fillStyle = night ? '#2a2420' : '#c9a876'; ctx.fillRect(dx, dy, w * .16, 14); ctx.fillStyle = night ? '#1d1a16' : '#8c7250'; ctx.fillRect(dx + 8, dy + 14, 6, 50); ctx.fillRect(dx + w * .16 - 14, dy + 14, 6, 50);
  }
  bg.dustMotes(ctx, w, h, night ? 'rgba(242,179,91,.35)' : 'rgba(255,255,255,.3)');
}

function library(ctx, w, h, t, bg, night) {
  sky(ctx, w, h, night ? '#0b0a14' : '#3a2f28', night ? '#15121c' : '#5a4a3c');
  let [ox, oy] = bg.par(.2, w, h);
  const pal = night ? ['#2a2235', '#1f2a2f', '#2d2320', '#262a3a', '#2a2020'] : ['#8a3b3b', '#3b6b8f', '#c9a83c', '#2f7b6b', '#6b4a8a'];
  for (let r = 0; r < 4; r++) {
    const y = h * (.06 + r * .15) + oy; const rr = rnd(r * 13 + 5); let x = ox - 10;
    while (x < w + 20) { const bw = 10 + rr() * 14, bh = h * .07 + rr() * h * .04; ctx.fillStyle = pal[Math.floor(rr() * 5) % 5]; ctx.fillRect(x, y + h * .11 - bh, bw, bh); x += bw + 2; }
    ctx.fillStyle = night ? '#1a1410' : '#4a3626'; ctx.fillRect(0, y + h * .11, w, 9);
  }
  [ox, oy] = bg.par(.5, w, h);
  if (!night) { ctx.save(); ctx.globalAlpha = .14; ctx.fillStyle = '#ffe9b8'; ctx.beginPath(); ctx.moveTo(w * .55 + ox, oy - 10); ctx.lineTo(w * .75 + ox, oy - 10); ctx.lineTo(w * .95 + ox, h); ctx.lineTo(w * .35 + ox, h); ctx.closePath(); ctx.fill(); ctx.restore(); }
  // table
  ctx.fillStyle = night ? '#241a14' : '#5c3f2a'; ctx.fillRect(w * .18 + ox, h * .68 + oy, w * .64, 16); ctx.fillRect(w * .21 + ox, h * .68 + oy, 12, h * .3); ctx.fillRect(w * .77 + ox, h * .68 + oy, 12, h * .3);
  // banker's lamp
  const f = bg.flicker(night ? .9 : .5, .5); bg.glow(ctx, w * .28 + ox, h * .62 + oy, night ? 340 : 170, 'rgba(242,200,120,A)', f * (night ? .6 : .3));
  ctx.fillStyle = '#b08d3c'; ctx.fillRect(w * .28 + ox - 3, h * .56 + oy, 6, h * .12); ctx.fillStyle = '#2f6b4a'; ctx.beginPath(); ctx.ellipse(w * .28 + ox, h * .56 + oy, 44, 13, 0, Math.PI, 0); ctx.fill();
  // open yearbook
  if (bg.vars.book) {
    const bx = w * .55 + ox, by = h * .66 + oy, pw = Math.min(170, w * .17);
    ctx.fillStyle = '#efe4c8'; ctx.beginPath(); ctx.moveTo(bx - pw, by + 2); ctx.quadraticCurveTo(bx - pw / 2, by - 16, bx, by - 6); ctx.quadraticCurveTo(bx + pw / 2, by - 16, bx + pw, by + 2); ctx.lineTo(bx + pw, by + 12); ctx.lineTo(bx - pw, by + 12); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c9b990'; ctx.fillRect(bx - 1, by - 8, 2, 18);
    ctx.fillStyle = '#8a8a8a';
    for (let i = 0; i < 4; i++) { ctx.fillRect(bx - pw + 14 + i * (pw / 4.4), by - 10 + (i % 2), pw / 6, 9); ctx.fillRect(bx + 12 + i * (pw / 4.4), by - 10 + ((i + 1) % 2), pw / 6, 9); }
    if (bg.vars.erased) { const a = bg.flicker(.85, 2); const ex = bx + 12 + 2 * (pw / 4.4), ey = by - 11; ctx.fillStyle = `rgba(56,232,216,${a * .85})`; ctx.fillRect(ex - 1, ey, pw / 6 + 2, 11); bg.glow(ctx, ex + pw / 12, ey + 5, 70, 'rgba(56,232,216,A)', a * .6); }
  }
  ctx.fillStyle = night ? '#0d0b10' : '#2a2018'; ctx.fillRect(0, h * .84 + oy, w, h);
  bg.dustMotes(ctx, w, h);
}

function mast(ctx, x, baseY, height, color, t, bg) {
  ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.beginPath();
  const top = baseY - height, wBase = height * .16;
  ctx.moveTo(x - wBase, baseY); ctx.lineTo(x - 4, top); ctx.moveTo(x + wBase, baseY); ctx.lineTo(x + 4, top);
  for (let i = 0; i < 9; i++) { const u = i / 9, y = baseY - u * height, hw = wBase * (1 - u) + 4; ctx.moveTo(x - hw, y); ctx.lineTo(x + hw, y); const hw2 = wBase * (1 - (i + 1) / 9) + 4, y2 = baseY - (i + 1) / 9 * height; ctx.moveTo(x - hw, y); ctx.lineTo(x + hw2, y2); }
  ctx.stroke();
  const on = bg.reduce ? 1 : (Math.sin(t * 2.2) > 0 ? 1 : .15);
  bg.glow(ctx, x, top - 6, 60 + on * 30, 'rgba(255,60,60,A)', on * .7); ctx.fillStyle = `rgba(255,70,70,${on})`; ctx.beginPath(); ctx.arc(x, top - 6, 5, 0, 7); ctx.fill();
  if (bg.vars.pulse && !bg.reduce) { ctx.strokeStyle = SIGNAL; for (let k = 0; k < 3; k++) { const p = ((t * .5 + k / 3) % 1); ctx.globalAlpha = (1 - p) * .7; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, top - 6, 10 + p * 160, 0, 7); ctx.stroke(); } ctx.globalAlpha = 1; }
}

function tower(ctx, w, h, t, bg) {
  sky(ctx, w, h, '#05071a', '#141a3a');
  // stars
  const r = rnd(42); ctx.fillStyle = 'rgba(255,255,255,.6)'; for (let i = 0; i < 70; i++) { const sx = r() * w, sy = r() * h * .5; if (!bg.reduce && Math.sin(t * 3 + i) < -.8) continue; ctx.fillRect(sx, sy, 1.5, 1.5); }
  let [ox, oy] = bg.par(.2, w, h);
  ctx.fillStyle = '#0a0e24'; ctx.beginPath(); ctx.moveTo(0, h * .7 + oy); ctx.quadraticCurveTo(w * .3, h * .55 + oy, w * .6, h * .66 + oy); ctx.quadraticCurveTo(w * .85, h * .74 + oy, w, h * .62 + oy); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
  [ox, oy] = bg.par(.5, w, h);
  mast(ctx, w * .66 + ox, h * .68 + oy, h * .58, '#3a4470', t, bg);
  // station building
  ctx.fillStyle = '#141a33'; ctx.fillRect(w * .52 + ox, h * .6 + oy, w * .12, h * .1); ctx.fillStyle = `rgba(242,179,91,${bg.flicker(.8, .3)})`; ctx.fillRect(w * .55 + ox, h * .63 + oy, 18, 14); bg.glow(ctx, w * .555 + ox, h * .64 + oy, 80, 'rgba(242,179,91,A)', .4);
  ctx.fillStyle = '#070a18'; ctx.fillRect(0, h * .7 + oy, w, h);
  // path lights
  for (let i = 0; i < 5; i++) { const lx = w * (.1 + i * .1) + ox, ly = h * (.95 - i * .055) + oy; bg.glow(ctx, lx, ly, 40, 'rgba(242,179,91,A)', .35); }
  bg.rain(ctx, w, h, .4, .2);
}

function towerRoom(ctx, w, h, t, bg) {
  sky(ctx, w, h, '#0a0d1c', '#141a30');
  let [ox, oy] = bg.par(.2, w, h);
  // window with the mast outside
  const wx = w * .3 + ox, wy = h * .1 + oy, ww = w * .4, wh = h * .4;
  ctx.fillStyle = '#05071a'; ctx.fillRect(wx, wy, ww, wh); ctx.save(); ctx.beginPath(); ctx.rect(wx, wy, ww, wh); ctx.clip(); mast(ctx, wx + ww * .55, wy + wh + 40, wh * 1.1, '#2a3360', t, bg); bg.rain(ctx, w, h, .4, .2); ctx.restore();
  ctx.strokeStyle = '#2a3356'; ctx.lineWidth = 6; ctx.strokeRect(wx, wy, ww, wh);
  [ox, oy] = bg.par(.6, w, h);
  // consoles
  ctx.fillStyle = '#1b2140'; ctx.fillRect(0, h * .58 + oy, w, h * .16); ctx.fillStyle = '#10142a'; ctx.fillRect(0, h * .74 + oy, w, h);
  const r = rnd(9); for (let i = 0; i < 40; i++) { const lx = w * .03 + i * (w * .94 / 40) + ox, ly = h * .62 + ((i * 7) % 3) * 18 + oy; const on = bg.reduce ? .8 : (Math.sin(t * (1 + r() * 3) + i) > 0 ? 1 : .2); ctx.fillStyle = ['rgba(56,232,216,', 'rgba(242,179,91,', 'rgba(255,80,80,'][i % 3] + on + ')'; ctx.fillRect(lx, ly, 6, 6); }
  // dials
  for (let i = 0; i < 3; i++) { const dx = w * (.15 + i * .35) + ox, dy = h * .66 + oy; ctx.fillStyle = '#0b0e1e'; ctx.beginPath(); ctx.arc(dx, dy, 16, 0, 7); ctx.fill(); ctx.strokeStyle = SIGNAL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(dx, dy); const a = -2.2 + bg.signal * 2 + Math.sin(t * 2 + i) * .15; ctx.lineTo(dx + Math.cos(a) * 12, dy + Math.sin(a) * 12); ctx.stroke(); }
  // desk + logbook + mic
  [ox, oy] = bg.par(.9, w, h); ctx.fillStyle = '#2a2235'; ctx.fillRect(w * .1 + ox, h * .8 + oy, w * .8, 14);
  if (bg.vars.book) { ctx.fillStyle = '#efe4c8'; ctx.fillRect(w * .55 + ox, h * .76 + oy, 110, 40); ctx.fillStyle = '#c9b990'; ctx.fillRect(w * .55 + ox + 54, h * .76 + oy, 2, 40); ctx.strokeStyle = '#9a8a60'; ctx.lineWidth = 1; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(w * .55 + ox + 8, h * .76 + oy + 8 + i * 8); ctx.lineTo(w * .55 + ox + 48, h * .76 + oy + 8 + i * 8); ctx.stroke(); } }
  ctx.fillStyle = '#3a3a4a'; ctx.fillRect(w * .3 + ox, h * .7 + oy, 6, h * .1); ctx.fillStyle = '#555'; ctx.beginPath(); ctx.ellipse(w * .3 + ox + 3, h * .69 + oy, 10, 14, 0, 0, 7); ctx.fill();
  bg.glow(ctx, w * .5, h * .3, 300, 'rgba(56,232,216,A)', bg.signal * .3);
  bg.dustMotes(ctx, w, h);
}

function planTable(ctx, w, h, t, bg) {
  sky(ctx, w, h, '#3a2a1c', '#241a10');
  ctx.strokeStyle = 'rgba(0,0,0,.15)'; ctx.lineWidth = 1; for (let y = 0; y < h; y += 28) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  let [ox, oy] = bg.par(.5, w, h); bg.glow(ctx, w * .5 + ox, h * .45 + oy, 420, 'rgba(242,200,120,A)', bg.flicker(.45, .3));
  const pw = Math.min(w * .7, 640), ph = pw * .62, px = w / 2 - pw / 2 + ox, py = h / 2 - ph / 2 + oy;
  ctx.save(); ctx.translate(px + pw / 2, py + ph / 2); ctx.rotate(-.03); ctx.translate(-(px + pw / 2), -(py + ph / 2));
  ctx.fillStyle = '#efe4c8'; ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 24; ctx.fillRect(px, py, pw, ph); ctx.shadowBlur = 0;
  ctx.strokeStyle = '#4a3a2a'; ctx.lineWidth = 3;
  const cell = (c, r, cw, rh) => [px + pw * .06 + (c - 1) * (pw * .88 / 6), py + ph * .1 + (r - 1) * (ph * .8 / 4), cw * (pw * .88 / 6), rh * (ph * .8 / 4)];
  [[1, 1, 2, 2], [3, 1, 1, 1], [4, 1, 3, 1], [4, 2, 3, 1], [1, 3, 2, 2], [3, 3, 1, 1], [3, 4, 1, 1], [4, 3, 2, 2], [6, 3, 1, 2]].forEach(([c, r, cw, rh]) => { const [x, y, ww, hh] = cell(c, r, cw, rh); ctx.strokeRect(x, y, ww, hh); });
  if (bg.vars.room0) { const [x, y, ww, hh] = cell(3, 2, 1, 1); const a = bg.flicker(.9, 1.5); ctx.fillStyle = `rgba(56,232,216,${a * .5})`; ctx.fillRect(x, y, ww, hh); ctx.strokeStyle = SIGNAL; ctx.strokeRect(x, y, ww, hh); bg.glow(ctx, x + ww / 2, y + hh / 2, 120, 'rgba(56,232,216,A)', a * .6); }
  ctx.restore();
  ctx.save(); ctx.translate(px + pw + 30, py + ph * .3); ctx.rotate(.6); ctx.fillStyle = '#e2b544'; ctx.fillRect(-6, 0, 12, 140); ctx.fillStyle = '#f3d9c4'; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(0, -16); ctx.lineTo(6, 0); ctx.fill(); ctx.restore();
  bg.dustMotes(ctx, w, h);
}

function houseRow(ctx, x, y, n, wEach, hEach, color, roof) {
  for (let i = 0; i < n; i++) {
    const hx = x + i * wEach; ctx.fillStyle = color; ctx.fillRect(hx, y - hEach, wEach - 2, hEach);
    ctx.fillStyle = roof; ctx.beginPath(); ctx.moveTo(hx - 4, y - hEach); ctx.lineTo(hx + wEach / 2 - 1, y - hEach - 36); ctx.lineTo(hx + wEach + 2, y - hEach); ctx.fill();
    ctx.fillStyle = 'rgba(242,179,91,.7)'; ctx.fillRect(hx + wEach * .2, y - hEach * .7, wEach * .2, hEach * .22); ctx.fillRect(hx + wEach * .6, y - hEach * .7, wEach * .2, hEach * .22);
    ctx.fillStyle = '#2a2018'; ctx.fillRect(hx + wEach * .42, y - hEach * .35, wEach * .16, hEach * .35);
  }
}

function street(ctx, w, h, t, bg) {
  sky(ctx, w, h, '#2a1f4a', '#c2694a');
  let [ox, oy] = bg.par(.2, w, h);
  ctx.fillStyle = '#1e1a33'; ctx.fillRect(w * .72 + ox, h * .18 + oy, w * .18, h * .5);
  for (let r = 0; r < 7; r++) for (let c = 0; c < 4; c++) { ctx.fillStyle = (r * 4 + c) % 3 ? 'rgba(242,179,91,.6)' : '#0d0b18'; ctx.fillRect(w * .735 + ox + c * (w * .04), h * .21 + oy + r * (h * .065), w * .02, h * .035); }
  [ox, oy] = bg.par(.5, w, h);
  houseRow(ctx, w * .05 + ox, h * .68 + oy, 3, w * .13, h * .26, '#5a3a3a', '#3a2424');
  const cx = w * .5 + ox; ctx.fillStyle = '#6b5a3a'; ctx.fillRect(cx, h * .5 + oy, w * .16, h * .18);
  ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.moveTo(cx - 10, h * .5 + oy); ctx.lineTo(cx + w * .08, h * .38 + oy); ctx.lineTo(cx + w * .16 + 10, h * .5 + oy); ctx.fill(); ctx.fillStyle = '#2a2018'; ctx.fillRect(cx + w * .11, h * .4 + oy, 10, 30);
  ctx.fillStyle = 'rgba(242,179,91,.7)'; ctx.fillRect(cx + w * .03, h * .55 + oy, w * .03, h * .05); ctx.fillStyle = '#2a2018'; ctx.fillRect(cx + w * .09, h * .58 + oy, w * .03, h * .1);
  ctx.fillStyle = '#1a1420'; ctx.fillRect(0, h * .68 + oy, w, h); ctx.fillStyle = '#2a2230'; ctx.fillRect(0, h * .74 + oy, w, 6);
  [ox, oy] = bg.par(.8, w, h);
  for (let i = 0; i < 3; i++) { const lx = w * (.2 + i * .3) + ox, ly = h * .5 + oy; ctx.fillStyle = '#111'; ctx.fillRect(lx - 2, ly, 4, h * .24); bg.glow(ctx, lx, ly, 90, 'rgba(242,200,120,A)', bg.flicker(.6, .4 + i)); ctx.fillStyle = '#ffe9b8'; ctx.beginPath(); ctx.arc(lx, ly, 5, 0, 7); ctx.fill(); }
  bg.dustMotes(ctx, w, h, 'rgba(255,255,255,.2)');
}

function hiddenRoom(ctx, w, h, t, bg) {
  sky(ctx, w, h, '#0b0909', '#1a1412');
  let [ox, oy] = bg.par(.3, w, h); ctx.strokeStyle = 'rgba(255,255,255,.04)'; ctx.lineWidth = 1; for (let y = 0; y < h; y += 30) { ctx.beginPath(); ctx.moveTo(0, y + oy); ctx.lineTo(w, y + oy); ctx.stroke(); }
  const f = bg.flicker(.8, .9); bg.glow(ctx, w * .15 + ox, h * .3 + oy, 360, 'rgba(242,179,91,A)', f * .5); ctx.fillStyle = `rgba(255,220,150,${f})`; ctx.beginPath(); ctx.arc(w * .15 + ox, h * .3 + oy, 8, 0, 7); ctx.fill();
  [ox, oy] = bg.par(.6, w, h);
  const mx = w * .3 + ox, my = h * .12 + oy, mw = w * .45, mh = h * .5;
  ctx.fillStyle = '#d9c9a0'; ctx.fillRect(mx, my, mw, mh); ctx.strokeStyle = '#8a7a50'; ctx.lineWidth = 2;
  const r = rnd(21); ctx.beginPath(); for (let i = 0; i < 14; i++) { ctx.moveTo(mx + r() * mw, my + r() * mh); ctx.lineTo(mx + r() * mw, my + r() * mh); } ctx.stroke();
  ctx.strokeStyle = '#6a8ab0'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(mx, my + mh * .7); ctx.quadraticCurveTo(mx + mw * .4, my + mh * .4, mx + mw, my + mh * .6); ctx.stroke();
  const pins = [[.2, .3], [.55, .25], [.7, .65], [.35, .75], [.85, .4]];
  pins.forEach(([px, py], i) => { const x = mx + px * mw, y = my + py * mh; if (bg.vars.pins) { const a = .5 + .5 * Math.sin(t * 3 + i); bg.glow(ctx, x, y, 50, 'rgba(56,232,216,A)', a * .6 * (bg.signal + .3)); } ctx.fillStyle = '#c23b3b'; ctx.beginPath(); ctx.arc(x, y, 6, 0, 7); ctx.fill(); });
  if (bg.vars.pins) { ctx.strokeStyle = 'rgba(56,232,216,.6)'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.beginPath(); pins.forEach(([px, py], i) => { const x = mx + px * mw, y = my + py * mh; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke(); ctx.setLineDash([]); }
  ctx.fillStyle = '#2a2018'; ctx.fillRect(w * .78 + ox, h * .55 + oy, 120, 100); ctx.fillRect(w * .06 + ox, h * .6 + oy, 100, 80);
  ctx.fillStyle = '#0d0a08'; ctx.fillRect(0, h * .74 + oy, w, h);
  bg.dustMotes(ctx, w, h);
}

function lanterns(ctx, w, y0, t, bg, n = 12, amp = 6) {
  ctx.strokeStyle = 'rgba(255,255,255,.15)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, y0); ctx.quadraticCurveTo(w / 2, y0 + 40, w, y0); ctx.stroke();
  for (let i = 0; i < n; i++) { const u = (i + .5) / n, x = u * w, y = y0 + 40 * 4 * u * (1 - u) + (bg.reduce ? 0 : Math.sin(t * 1.5 + i) * amp); const col = i % 3 === 0 ? 'rgba(255,90,60,A)' : i % 3 === 1 ? 'rgba(242,179,91,A)' : 'rgba(255,220,120,A)';
    bg.glow(ctx, x, y + 12, 60, col, .5 + .2 * Math.sin(t * 2 + i)); ctx.fillStyle = col.replace('A', .95); ctx.beginPath(); ctx.ellipse(x, y + 12, 9, 12, 0, 0, 7); ctx.fill(); }
}

function market(ctx, w, h, t, bg) {
  sky(ctx, w, h, '#0c0a24', '#2a1a3a');
  const r = rnd(77); ctx.fillStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < 50; i++) ctx.fillRect(r() * w, r() * h * .3, 1.5, 1.5);
  if (bg.vars.star) { const a = .5 + .5 * Math.sin(t * 2); bg.glow(ctx, w * .62, h * .12, 90, 'rgba(56,232,216,A)', a * .8); ctx.fillStyle = SIGNAL; ctx.beginPath(); ctx.arc(w * .62, h * .12, 3, 0, 7); ctx.fill(); }
  let [ox, oy] = bg.par(.2, w, h); buildings(ctx, w, h, 5, h * .5 + oy, '#141230', h * .25, .1);
  [ox, oy] = bg.par(.5, w, h);
  // stalls (striped canopies)
  for (let i = 0; i < 4; i++) { const sx = w * (.08 + i * .23) + ox, sy = h * .42 + oy, sw = w * .18, sh = h * .22;
    bg.glow(ctx, sx + sw / 2, sy + sh * .5, 160, 'rgba(242,179,91,A)', bg.flicker(.45, .5 + i));
    ctx.fillStyle = '#2a1f33'; ctx.fillRect(sx, sy + 20, sw, sh); ctx.fillStyle = '#3a2a2a'; ctx.fillRect(sx - 6, sy + sh * .6, sw + 12, sh * .4);
    for (let k = 0; k < 6; k++) { ctx.fillStyle = k % 2 ? '#c23b3b' : '#efe4c8'; ctx.fillRect(sx - 8 + k * (sw + 16) / 6, sy, (sw + 16) / 6, 22); }
    ctx.fillStyle = 'rgba(255,220,150,.9)'; ctx.fillRect(sx + sw * .3, sy + 34, sw * .4, 10); }
  lanterns(ctx, w, h * .2 + oy, t, bg);
  // ground + crowd + water
  ctx.fillStyle = '#17132a'; ctx.fillRect(0, h * .64 + oy, w, h);
  [ox, oy] = bg.par(.8, w, h); ctx.fillStyle = '#07061a';
  for (let i = 0; i < 9; i++) { const cx = w * (.05 + i * .11) + ox + Math.sin(t * .7 + i) * 4 * (bg.reduce ? 0 : 1), cy = h * .78 + oy; ctx.beginPath(); ctx.arc(cx, cy - 34, 12, 0, 7); ctx.fill(); ctx.fillRect(cx - 16, cy - 24, 32, 60); }
  ctx.fillStyle = '#0a0f2a'; ctx.fillRect(0, h * .86 + oy, w, h); ctx.fillStyle = 'rgba(242,179,91,.12)'; for (let i = 0; i < 6; i++) ctx.fillRect(w * (.1 + i * .15) + Math.sin(t + i) * 6, h * .9 + oy + i * 4, 60, 2);
}

function pierSky(ctx, w, h, t, bg) {
  sky(ctx, w, h, '#02030c', '#141a3a');
  const r = rnd(99); for (let i = 0; i < 160; i++) { const x = r() * w, y = r() * h * .85, s = r(); ctx.fillStyle = `rgba(255,255,255,${.3 + .6 * s})`; ctx.fillRect(x, y, s > .8 ? 2 : 1.2, s > .8 ? 2 : 1.2); }
  // milky band
  ctx.save(); ctx.globalAlpha = .08; ctx.fillStyle = '#9ab0ff'; ctx.beginPath(); ctx.moveTo(0, h * .6); ctx.quadraticCurveTo(w * .5, h * .1, w, h * .5); ctx.lineTo(w, h * .7); ctx.quadraticCurveTo(w * .5, h * .3, 0, h * .8); ctx.fill(); ctx.restore();
  if (bg.vars.star) { const x = w * .58, y = h * .3, a = .5 + .5 * Math.sin(t * 2.5); bg.glow(ctx, x, y, 140, 'rgba(56,232,216,A)', a * .9); ctx.fillStyle = SIGNAL; ctx.beginPath(); ctx.arc(x, y, 4, 0, 7); ctx.fill();
    if (!bg.reduce) { ctx.strokeStyle = SIGNAL; for (let k = 0; k < 3; k++) { const p = ((t * .4 + k / 3) % 1); ctx.globalAlpha = (1 - p) * .6 * (bg.signal + .3); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 8 + p * 220, 0, 7); ctx.stroke(); } ctx.globalAlpha = 1; } }
  let [ox, oy] = bg.par(.6, w, h); lanterns(ctx, w, h * .86 + oy, t, bg, 14, 3);
  ctx.fillStyle = '#05060f'; ctx.fillRect(0, h * .95 + oy, w, h);
}

function pines(ctx, w, baseY, n, hMin, hMax, color, seed, ox) {
  const r = rnd(seed); ctx.fillStyle = color;
  for (let i = 0; i < n; i++) { const x = (i / n) * w + r() * 30 + ox, hh = hMin + r() * (hMax - hMin), ww = hh * .45; ctx.beginPath(); ctx.moveTo(x, baseY - hh); ctx.lineTo(x + ww / 2, baseY - hh * .55); ctx.lineTo(x + ww * .3, baseY - hh * .55); ctx.lineTo(x + ww * .6, baseY - hh * .2); ctx.lineTo(x + ww * .4, baseY - hh * .2); ctx.lineTo(x + ww * .7, baseY); ctx.lineTo(x - ww * .7, baseY); ctx.lineTo(x - ww * .4, baseY - hh * .2); ctx.lineTo(x - ww * .6, baseY - hh * .2); ctx.lineTo(x - ww * .3, baseY - hh * .55); ctx.lineTo(x - ww / 2, baseY - hh * .55); ctx.closePath(); ctx.fill(); }
}

function camp(ctx, w, h, t, bg) {
  sky(ctx, w, h, '#03061a', '#0e1a3a');
  const r = rnd(31); ctx.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 120; i++) { const x = r() * w, y = r() * h * .55; if (!bg.reduce && Math.sin(t * 2 + i * 1.7) < -.85) continue; ctx.fillRect(x, y, 1.4, 1.4); }
  let [ox, oy] = bg.par(.2, w, h); ctx.fillStyle = '#070c22'; ctx.beginPath(); ctx.moveTo(0, h * .6 + oy); ctx.quadraticCurveTo(w * .25, h * .42 + oy, w * .5, h * .55 + oy); ctx.quadraticCurveTo(w * .75, h * .66 + oy, w, h * .5 + oy); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();
  [ox, oy] = bg.par(.4, w, h); pines(ctx, w, h * .72 + oy, 14, h * .18, h * .34, '#050913', 3, ox);
  if (bg.vars.eyes) { const rr = rnd(8); for (let i = 0; i < 4; i++) { const ex = w * (.1 + rr() * .8) + ox, ey = h * (.5 + rr() * .15) + oy; const on = bg.reduce ? 1 : (Math.sin(t * 1.3 + i * 2) > -.3 ? 1 : 0); ctx.fillStyle = `rgba(242,179,91,${on})`; ctx.beginPath(); ctx.arc(ex, ey, 2.2, 0, 7); ctx.arc(ex + 9, ey, 2.2, 0, 7); ctx.fill(); } }
  ctx.fillStyle = '#0a0d16'; ctx.fillRect(0, h * .72 + oy, w, h);
  [ox, oy] = bg.par(.8, w, h);
  // campfire
  const fx = w * .5 + ox, fy = h * .84 + oy, f = bg.flicker(.9, 1.6);
  bg.glow(ctx, fx, fy - 10, 360, 'rgba(255,150,60,A)', f * .55); bg.glow(ctx, fx, fy - 20, 120, 'rgba(255,220,120,A)', f * .8);
  ctx.fillStyle = '#3a2416'; ctx.save(); ctx.translate(fx, fy); ctx.rotate(.4); ctx.fillRect(-50, -6, 100, 12); ctx.rotate(-.8); ctx.fillRect(-50, -6, 100, 12); ctx.restore();
  for (let k = 0; k < 3; k++) { const s = bg.reduce ? 1 : (1 + .25 * Math.sin(t * 9 + k * 2)), hh = (46 - k * 12) * s, ww = 22 - k * 5; ctx.fillStyle = ['rgba(255,110,40,.9)', 'rgba(255,180,60,.9)', 'rgba(255,240,170,.95)'][k]; ctx.beginPath(); ctx.moveTo(fx - ww, fy - 4); ctx.quadraticCurveTo(fx - ww * .6, fy - hh * .6, fx + (bg.reduce ? 0 : Math.sin(t * 7 + k) * 4), fy - hh); ctx.quadraticCurveTo(fx + ww * .6, fy - hh * .6, fx + ww, fy - 4); ctx.closePath(); ctx.fill(); }
  if (!bg.reduce) { ctx.fillStyle = 'rgba(255,200,100,.8)'; for (let i = 0; i < 8; i++) { const p = (t * .5 + i / 8) % 1; ctx.fillRect(fx + Math.sin(i * 5 + t) * 20 * p, fy - 30 - p * 160, 2, 2); } }
  // logs to sit on
  ctx.fillStyle = '#2a1c12'; ctx.fillRect(w * .18 + ox, h * .86 + oy, w * .18, 16); ctx.fillRect(w * .64 + ox, h * .86 + oy, w * .18, 16);
  // radio by the fire
  ctx.fillStyle = '#3b2a1e'; ctx.fillRect(w * .66 + ox, h * .8 + oy, 44, 28); ctx.fillStyle = `rgba(56,232,216,${.4 + bg.signal * .6})`; ctx.beginPath(); ctx.arc(w * .66 + ox + 32, h * .8 + oy + 12, 4, 0, 7); ctx.fill(); bg.glow(ctx, w * .66 + ox + 32, h * .8 + oy + 12, 40 + bg.signal * 80, 'rgba(56,232,216,A)', .2 + bg.signal * .6);
}

function coast(ctx, w, h, t, bg) {
  sky(ctx, w, h, '#2a2050', '#e08a5a');
  bg.glow(ctx, w * .7, h * .5, 220, 'rgba(255,200,140,A)', .6); ctx.fillStyle = '#ffd9a8'; ctx.beginPath(); ctx.arc(w * .7, h * .5, 26, 0, 7); ctx.fill();
  let [ox, oy] = bg.par(.2, w, h);
  // sea
  const sea = ctx.createLinearGradient(0, h * .52, 0, h * .75); sea.addColorStop(0, '#5a4a7a'); sea.addColorStop(1, '#1e2a5a'); ctx.fillStyle = sea; ctx.fillRect(0, h * .52 + oy, w, h * .25);
  ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.5; for (let i = 0; i < 6; i++) { const y = h * (.56 + i * .035) + oy; ctx.beginPath(); for (let x = 0; x <= w; x += 8) ctx.lineTo(x, y + Math.sin(x * .03 + t * 1.2 + i) * 3 * (bg.reduce ? 0 : 1)); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,200,140,.25)'; ctx.fillRect(w * .66, h * .53 + oy, 60, h * .2);
  // beach
  [ox, oy] = bg.par(.6, w, h); ctx.fillStyle = '#c9a876'; ctx.beginPath(); ctx.moveTo(0, h * .72 + oy); ctx.quadraticCurveTo(w * .5, h * .66 + oy, w, h * .74 + oy); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.moveTo(0, h * .72 + oy); ctx.quadraticCurveTo(w * .5, h * .66 + oy + Math.sin(t) * 3, w, h * .74 + oy); ctx.lineTo(w, h * .76 + oy); ctx.quadraticCurveTo(w * .5, h * .68 + oy + Math.sin(t) * 3, 0, h * .74 + oy); ctx.fill();
  // rocks + turtle tracks
  ctx.fillStyle = '#5a4a3a'; ctx.beginPath(); ctx.ellipse(w * .12 + ox, h * .8 + oy, 50, 22, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(w * .2 + ox, h * .84 + oy, 30, 14, 0, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.12)'; for (let i = 0; i < 12; i++) { ctx.fillRect(w * .55 + ox + i * 14, h * .8 + oy + i * 5, 6, 3); ctx.fillRect(w * .57 + ox + i * 14, h * .8 + oy + i * 5 + 6, 6, 3); }
  // sign post
  [ox, oy] = bg.par(.9, w, h); const sx = w * .8 + ox, sy = h * .9 + oy; ctx.fillStyle = '#4a3a2a'; ctx.fillRect(sx - 4, sy - 120, 8, 120); ctx.fillStyle = '#efe4c8'; ctx.fillRect(sx - 60, sy - 140, 120, 50); ctx.strokeStyle = '#4a3a2a'; ctx.lineWidth = 3; ctx.strokeRect(sx - 60, sy - 140, 120, 50);
  ctx.fillStyle = '#2f7b6b'; ctx.beginPath(); ctx.ellipse(sx, sy - 115, 22, 12, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#1f5a4a'; ctx.beginPath(); ctx.arc(sx + 24, sy - 115, 6, 0, 7); ctx.fill();
  bg.dustMotes(ctx, w, h, 'rgba(255,255,255,.25)');
}

function atticSky(ctx, w, h, t, bg, future) {
  sky(ctx, w, h, future ? '#0a1424' : '#120f14', future ? '#102a30' : '#1f1813');
  let [ox, oy] = bg.par(.3, w, h);
  // skylight with stars
  const sx = w * .36 + ox, sy = h * .06 + oy, sw = w * .28, sh = h * .3;
  ctx.fillStyle = '#03061a'; ctx.fillRect(sx, sy, sw, sh);
  const r = rnd(12); ctx.fillStyle = 'rgba(255,255,255,.8)'; for (let i = 0; i < 60; i++) { const x = sx + r() * sw, y = sy + r() * sh; if (!bg.reduce && Math.sin(t * 2 + i * 1.3) < -.85) continue; ctx.fillRect(x, y, 1.5, 1.5); }
  if (bg.vars.beam) { ctx.save(); ctx.globalAlpha = .25 * bg.signal; ctx.fillStyle = SIGNAL; ctx.beginPath(); ctx.moveTo(w * .5 + ox - 30, h * .56 + oy); ctx.lineTo(sx + sw * .35, sy); ctx.lineTo(sx + sw * .65, sy); ctx.lineTo(w * .5 + ox + 30, h * .56 + oy); ctx.fill(); ctx.restore(); }
  ctx.strokeStyle = future ? '#2a6a70' : '#3a2d22'; ctx.lineWidth = 8; ctx.strokeRect(sx, sy, sw, sh); ctx.beginPath(); ctx.moveTo(sx + sw / 2, sy); ctx.lineTo(sx + sw / 2, sy + sh); ctx.stroke();
  // beams
  ctx.strokeStyle = future ? '#1a3a44' : '#2b2119'; ctx.lineWidth = 22; ctx.beginPath();
  for (let i = 0; i < 6; i++) { const x = (i / 5) * w + ox; if (i === 2 || i === 3) continue; ctx.moveTo(x, oy); ctx.lineTo(w / 2 + ox, -h * .2 + oy); } ctx.stroke();
  ctx.fillStyle = future ? '#0c1c24' : '#17120f'; ctx.fillRect(0, h * .7 + oy, w, h);
  [ox, oy] = bg.par(.6, w, h);
  if (future) {
    // holographic panels
    for (let i = 0; i < 3; i++) { const px = w * (.06 + i * .3) + ox + (i === 1 ? w * .32 : 0), py = h * .32 + oy, pw = w * .2, ph = h * .22; if (i === 1) continue;
      ctx.fillStyle = 'rgba(56,232,216,.08)'; ctx.fillRect(px, py, pw, ph); ctx.strokeStyle = 'rgba(56,232,216,.5)'; ctx.lineWidth = 1; ctx.strokeRect(px, py, pw, ph);
      ctx.fillStyle = 'rgba(56,232,216,.35)'; for (let k = 0; k < 5; k++) ctx.fillRect(px + 10, py + 12 + k * 16, pw * (.3 + ((k * 37 + i * 11) % 50) / 100), 4);
      if (!bg.reduce) { const scan = ((t * .3 + i * .4) % 1) * ph; ctx.fillStyle = 'rgba(56,232,216,.25)'; ctx.fillRect(px, py + scan, pw, 2); } }
    bg.glow(ctx, w * .5 + ox, h * .5 + oy, 400, 'rgba(56,232,216,A)', .2 + bg.signal * .3);
  } else {
    const f = bg.flicker(.9, 1); bg.glow(ctx, w * .14 + ox, h * .28 + oy, 380, 'rgba(242,179,91,A)', f * .5); ctx.fillStyle = `rgba(255,220,150,${f})`; ctx.beginPath(); ctx.arc(w * .14 + ox, h * .28 + oy, 10, 0, 7); ctx.fill();
    ctx.strokeStyle = '#3a2d22'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(w * .14 + ox, oy); ctx.lineTo(w * .14 + ox, h * .28 + oy); ctx.stroke();
    ctx.fillStyle = '#2a2018'; ctx.fillRect(w * .72 + ox, h * .5 + oy, 140, 110); ctx.fillRect(w * .8 + ox, h * .38 + oy, 100, 70); ctx.fillStyle = '#211913'; ctx.fillRect(w * .05 + ox, h * .55 + oy, 120, 90);
  }
  // table + radio (pedestal in the future)
  [ox, oy] = bg.par(.9, w, h);
  ctx.fillStyle = future ? '#15323a' : '#2d2219'; ctx.fillRect(w * .32 + ox, h * .56 + oy, w * .36, 16); ctx.fillRect(w * .34 + ox, h * .56 + oy, 10, h * .3); ctx.fillRect(w * .64 + ox, h * .56 + oy, 10, h * .3);
  const rx = w * .5 + ox, ry = h * .56 + oy; ctx.fillStyle = future ? '#1e4a52' : '#3b2a1e'; ctx.fillRect(rx - 70, ry - 90, 140, 90); ctx.fillStyle = '#0a1210'; ctx.fillRect(rx - 60, ry - 80, 70, 50);
  const dial = bg.vars.radio ? Math.max(bg.signal, .5) : bg.signal; bg.glow(ctx, rx + 35, ry - 45, 60 + dial * 140, 'rgba(56,232,216,A)', .25 + dial * .7); ctx.fillStyle = `rgba(56,232,216,${.5 + dial * .5})`; ctx.beginPath(); ctx.arc(rx + 35, ry - 45, 14, 0, 7); ctx.fill();
  ctx.strokeStyle = future ? '#5ad0c8' : '#6b5a44'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(rx + 50, ry - 90); ctx.lineTo(rx + 110, ry - 170); ctx.stroke();
  if (bg.vars.radio && !bg.reduce) { ctx.strokeStyle = SIGNAL; for (let k = 0; k < 3; k++) { const p = ((t * .6 + k / 3) % 1); ctx.globalAlpha = (1 - p) * .5; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(rx + 35, ry - 45, 16 + p * 120, 0, 7); ctx.stroke(); } ctx.globalAlpha = 1; }
  bg.dustMotes(ctx, w, h, future ? 'rgba(56,232,216,.35)' : 'rgba(242,179,91,.35)');
}

// ---------------------------------------------------------------------------------------------------------------------
// Illustrated scene pass: the same language as the character art — bold soft ink outlines, flat colour, one shade layer.
// These override the first-draft presets of the same name. Helpers: box / poly / circ draw a filled shape with an ink stroke.
const INK = '#1a1f3a';
function ink(ctx, lw = 3) { ctx.strokeStyle = INK; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; }
function box(ctx, x, y, w, h, fill, lw = 3) { ctx.fillStyle = fill; ctx.fillRect(x, y, w, h); if (lw) { ink(ctx, lw); ctx.strokeRect(x, y, w, h); } }
function poly(ctx, pts, fill, lw = 3) { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (lw) { ink(ctx, lw); ctx.stroke(); } }
function circ(ctx, x, y, r, fill, lw = 3) { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (lw) { ink(ctx, lw); ctx.stroke(); } }
function line(ctx, x1, y1, x2, y2, lw = 2, color = INK) { ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
function shadeRect(ctx, x, y, w, h, a = .18) { ctx.fillStyle = `rgba(26,31,58,${a})`; ctx.fillRect(x, y, w, h); }
function moon(ctx, x, y, r, bg) { bg.glow(ctx, x, y, r * 5, 'rgba(200,215,255,A)', .35); circ(ctx, x, y, r, '#eef1ff', 3); ctx.fillStyle = 'rgba(26,31,58,.12)'; circ(ctx, x - r * .3, y - r * .2, r * .22, 'rgba(26,31,58,.12)', 0); circ(ctx, x + r * .35, y + r * .3, r * .16, 'rgba(26,31,58,.12)', 0); }
function planks(ctx, w, y0, h, color, n = 9) { ctx.fillStyle = color; ctx.fillRect(0, y0, w, h); for (let i = 1; i < n; i++) line(ctx, 0, y0 + (h / n) * i, w, y0 + (h / n) * i, 1.5, 'rgba(26,31,58,.35)'); }
function radioBody(ctx, x, y, s, bg) { // x,y = bottom centre; s = scale (1 = 160px wide)
  const w = 160 * s, h = 96 * s, l = x - w / 2, t = y - h;
  box(ctx, l, t, w, h, '#6b4a30'); shadeRect(ctx, l + w * .7, t, w * .3, h, .22);
  box(ctx, l + 12 * s, t + 14 * s, 78 * s, 56 * s, '#2a2238'); for (let i = 0; i < 6; i++) line(ctx, l + (18 + i * 12) * s, t + 20 * s, l + (18 + i * 12) * s, t + 64 * s, 2.5 * s, 'rgba(255,255,255,.25)');
  const dial = Math.max(.15, bg.signal); bg.glow(ctx, l + 124 * s, t + 34 * s, (50 + dial * 120) * s, 'rgba(56,232,216,A)', .25 + dial * .7);
  box(ctx, l + 100 * s, t + 16 * s, 48 * s, 30 * s, `rgba(56,232,216,${.35 + dial * .6})`); line(ctx, l + 104 * s, t + 31 * s, l + 144 * s, t + 31 * s, 2 * s, '#0b3b38'); line(ctx, l + (110 + dial * 30) * s, t + 20 * s, l + (110 + dial * 30) * s, t + 42 * s, 3 * s, '#c23b3b');
  circ(ctx, l + 112 * s, t + 68 * s, 9 * s, '#e8c872'); circ(ctx, l + 138 * s, t + 68 * s, 9 * s, '#e8c872'); line(ctx, l + 112 * s, t + 68 * s, l + 112 * s, t + 61 * s, 2 * s); line(ctx, l + 138 * s, t + 68 * s, l + 144 * s, t + 64 * s, 2 * s);
  line(ctx, l + w - 14 * s, t, l + w + 50 * s, t - 90 * s, 3 * s); circ(ctx, l + w + 50 * s, t - 90 * s, 4 * s, '#e8c872');
  box(ctx, l + 20 * s, y, w - 40 * s, 6 * s, '#3a2a1e');
}

Object.assign(PRESETS, {
  // Night, rain, taxi at the school gate, attic window flickers. (illustrated)
  gate_night(ctx, w, h, t, bg) {
    sky(ctx, w, h, '#060a1a', '#1a2246');
    moon(ctx, w * .82, h * .16, 34, bg);
    let [ox, oy] = bg.par(.15, w, h); ctx.save(); ctx.translate(ox, oy); buildings(ctx, w, h, 7, h * .6, '#0e1430', h * .32, .08); ctx.restore();
    [ox, oy] = bg.par(.4, w, h); ctx.save(); ctx.translate(ox, oy);
    const bx = w * .22, bw = w * .56, by = h * .34, bh = h * .4;
    box(ctx, bx, by, bw, bh, '#232a4f'); shadeRect(ctx, bx + bw * .72, by, bw * .28, bh, .25);
    poly(ctx, [[bx - 24, by], [bx + bw / 2, by - h * .12], [bx + bw + 24, by]], '#1a2042'); line(ctx, bx + bw / 2, by - h * .12, bx + bw / 2, by - h * .12 + 6, 3);
    // tower + attic window
    box(ctx, bx + bw / 2 - 44, by - h * .2, 88, h * .2 + 10, '#2a3160'); poly(ctx, [[bx + bw / 2 - 56, by - h * .2], [bx + bw / 2, by - h * .3], [bx + bw / 2 + 56, by - h * .2]], '#1a2042');
    const f = bg.flicker(.9, 1.3); bg.glow(ctx, bx + bw / 2, by - h * .12, 90, 'rgba(56,232,216,A)', f * .6); circ(ctx, bx + bw / 2, by - h * .12, 16, `rgba(56,232,216,${.5 + f * .5})`); line(ctx, bx + bw / 2 - 16, by - h * .12, bx + bw / 2 + 16, by - h * .12, 2); line(ctx, bx + bw / 2, by - h * .12 - 16, bx + bw / 2, by - h * .12 + 16, 2);
    // windows
    for (let r = 0; r < 3; r++) for (let c = 0; c < 7; c++) { const lit = (r * 7 + c) % 5 === 1; const wx = bx + 30 + c * (bw - 60) / 7, wy = by + 30 + r * (bh / 3.3); box(ctx, wx, wy, 26, 38, lit ? '#f2b35b' : '#0b1026', 2.5); line(ctx, wx + 13, wy, wx + 13, wy + 38, 1.5, 'rgba(26,31,58,.6)'); if (lit) bg.glow(ctx, wx + 13, wy + 19, 40, 'rgba(242,179,91,A)', .35); }
    // door + steps
    bg.glow(ctx, bx + bw / 2, by + bh - 20, 110, 'rgba(242,179,91,A)', .6); box(ctx, bx + bw / 2 - 26, by + bh - 70, 52, 70, '#f2b35b'); line(ctx, bx + bw / 2, by + bh - 70, bx + bw / 2, by + bh, 2);
    box(ctx, bx + bw / 2 - 40, by + bh, 80, 10, '#3a3f66'); box(ctx, bx + bw / 2 - 52, by + bh + 10, 104, 10, '#2f3458');
    ctx.restore();
    // ground, wet
    ctx.fillStyle = '#0c1024'; ctx.fillRect(0, h * .74, w, h); line(ctx, 0, h * .74, w, h * .74, 3);
    ctx.fillStyle = 'rgba(56,232,216,.12)'; ctx.beginPath(); ctx.ellipse(w * .5, h * .82, 90, 10, 0, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(242,179,91,.14)'; ctx.beginPath(); ctx.ellipse(w * .3, h * .9, 120, 12, 0, 0, 7); ctx.fill();
    // gate pillars + bars (foreground)
    [ox, oy] = bg.par(.8, w, h); ctx.save(); ctx.translate(ox, oy);
    for (const px of [w * .1, w * .9]) { box(ctx, px - 22, h * .38, 44, h * .38, '#2a2238'); box(ctx, px - 28, h * .36, 56, 12, '#3a3150'); bg.glow(ctx, px, h * .3, 70, 'rgba(242,200,120,A)', bg.flicker(.7, .5)); circ(ctx, px, h * .3, 9, '#ffe9b8'); line(ctx, px, h * .36, px, h * .32, 3); }
    for (let i = 0; i < 9; i++) { const gx = w * .1 + 22 + (i + 1) * ((w * .8 - 44) / 10); line(ctx, gx, h * .5, gx, h * .76, 3); circ(ctx, gx, h * .5, 4, '#2a2238', 2); }
    line(ctx, w * .1 + 22, h * .58, w * .9 - 22, h * .58, 4); line(ctx, w * .1 + 22, h * .74, w * .9 - 22, h * .74, 4);
    // taxi + suitcase
    const tx = w * .12, ty = h * .84; poly(ctx, [[tx - 70, ty], [tx - 60, ty - 34], [tx - 30, ty - 52], [tx + 50, ty - 52], [tx + 80, ty - 32], [tx + 95, ty - 30], [tx + 95, ty], ], '#e8c872'); box(ctx, tx - 32, ty - 48, 34, 20, '#1a2042', 2.5); box(ctx, tx + 8, ty - 48, 34, 20, '#1a2042', 2.5); box(ctx, tx - 10, ty - 62, 36, 12, '#2a2238'); ctx.fillStyle = INK; ctx.font = '9px Consolas, monospace'; ctx.fillText('TAXI', tx - 3, ty - 53);
    circ(ctx, tx - 40, ty, 12, '#2a2238'); circ(ctx, tx + 60, ty, 12, '#2a2238'); bg.glow(ctx, tx + 100, ty - 18, 150, 'rgba(255,230,160,A)', .8); circ(ctx, tx + 92, ty - 18, 6, '#fff6d8');
    box(ctx, tx + 120, ty - 30, 40, 30, '#8a3b5a'); box(ctx, tx + 132, ty - 38, 16, 8, '#2a2238', 2);
    ctx.restore();
    bg.rain(ctx, w, h, 1, .3);
  },

  // Dorm room: bunk bed, moonlit window, rain, a desk and a poster. (illustrated)
  dorm(ctx, w, h, t, bg) {
    sky(ctx, w, h, '#0e1230', '#161b3c');
    for (let x = 0; x < w; x += 44) line(ctx, x, 0, x, h * .74, 1, 'rgba(255,255,255,.04)');
    let [ox, oy] = bg.par(.2, w, h); const wx = w * .6 + ox, wy = h * .12 + oy, ww = w * .26, wh = h * .38;
    box(ctx, wx, wy, ww, wh, '#0a1030'); ctx.save(); ctx.beginPath(); ctx.rect(wx, wy, ww, wh); ctx.clip(); moon(ctx, wx + ww * .7, wy + wh * .3, 26, bg); bg.rain(ctx, w, h, .7, .25); ctx.restore();
    ink(ctx, 4); ctx.strokeRect(wx, wy, ww, wh); line(ctx, wx + ww / 2, wy, wx + ww / 2, wy + wh, 4); line(ctx, wx, wy + wh / 2, wx + ww, wy + wh / 2, 4);
    bg.glow(ctx, wx + ww / 2, wy + wh / 2, 320, 'rgba(120,150,255,A)', .22);
    // curtains
    for (const [cx, dir] of [[wx - 30, 1], [wx + ww + 30, -1]]) { poly(ctx, [[cx - 14 * dir, wy - 10], [cx + 26 * dir, wy - 10], [cx + 34 * dir, wy + wh + 20], [cx - 20 * dir, wy + wh + 20]], '#6b3a4a'); for (let k = 0; k < 3; k++) line(ctx, cx + (k * 10 - 6) * dir, wy, cx + (k * 12 - 4) * dir, wy + wh + 16, 1.5, 'rgba(26,31,58,.5)'); }
    box(ctx, wx - 44, wy - 16, ww + 88, 8, '#3a3150');
    // poster (signal wave)
    [ox, oy] = bg.par(.4, w, h); box(ctx, w * .08 + ox, h * .12 + oy, 110, 80, '#efe4c8'); ctx.strokeStyle = '#38e8d8'; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= 90; i += 3) ctx.lineTo(w * .08 + ox + 10 + i, h * .12 + oy + 44 + Math.sin(i * .4) * 12); ctx.stroke(); ctx.fillStyle = INK; ctx.font = 'bold 10px Segoe UI, sans-serif'; ctx.fillText('SIGNAL', w * .08 + ox + 30, h * .12 + oy + 72);
    // bunk bed
    [ox, oy] = bg.par(.6, w, h); const bx = w * .1 + ox, by = h * .2 + oy, bw = w * .36, bh = h * .52;
    box(ctx, bx, by, 12, bh, '#2a2238'); box(ctx, bx + bw - 12, by, 12, bh, '#2a2238');
    for (const yy of [by + bh * .34, by + bh * .82]) { box(ctx, bx, yy, bw, 16, '#3a3150'); box(ctx, bx + 12, yy - 40, bw - 24, 40, '#f6f1ea'); box(ctx, bx + 80, yy - 40, bw - 92, 40, '#4a5a9a'); shadeRect(ctx, bx + 80, yy - 40, bw - 92, 10, .2); for (let k = 0; k < 4; k++) line(ctx, bx + 100 + k * 50, yy - 36, bx + 118 + k * 50, yy - 4, 1.5, 'rgba(255,255,255,.3)'); box(ctx, bx + 20, yy - 52, 56, 22, '#efe4c8', 2.5); }
    for (let k = 0; k < 5; k++) line(ctx, bx + bw - 26, by + 40 + k * 40, bx + bw - 12, by + 40 + k * 40, 3); line(ctx, bx + bw - 26, by + 20, bx + bw - 26, by + bh, 3);
    // desk + chair + books
    const dx = w * .62 + ox, dy = h * .62 + oy; box(ctx, dx, dy, w * .26, 10, '#5a3a2a'); box(ctx, dx + 8, dy + 10, 8, h * .16, '#3a2a1e'); box(ctx, dx + w * .26 - 16, dy + 10, 8, h * .16, '#3a2a1e');
    box(ctx, dx + 20, dy - 28, 16, 28, '#c23b3b', 2.5); box(ctx, dx + 36, dy - 22, 14, 22, '#2f7b6b', 2.5); box(ctx, dx + 50, dy - 34, 12, 34, '#e8c872', 2.5);
    box(ctx, dx + w * .17, dy - 46, 30, 8, '#2a2238', 2.5); line(ctx, dx + w * .17 + 15, dy - 38, dx + w * .17 + 15, dy, 4, '#8a8fa8'); poly(ctx, [[dx + w * .17 - 10, dy - 46], [dx + w * .17 + 40, dy - 46], [dx + w * .17 + 32, dy - 62], [dx + w * .17 - 2, dy - 62]], '#f2b35b');
    // floor + rug
    planks(ctx, w, h * .74 + oy, h * .26, '#2a2a3c'); line(ctx, 0, h * .74 + oy, w, h * .74 + oy, 3);
    ctx.fillStyle = '#8a3b5a'; ctx.beginPath(); ctx.ellipse(w * .5, h * .9 + oy, 180, 34, 0, 0, 7); ctx.fill(); ink(ctx, 3); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(w * .5, h * .9 + oy, 140, 24, 0, 0, 7); ctx.stroke();
    bg.glow(ctx, w * .5, 0, 220, 'rgba(56,232,216,A)', bg.flicker(.12, .6) * bg.signal + .03);
  },

  // Attic: rafters, round window, boxes, lantern, the old radio on a table. (illustrated)
  attic(ctx, w, h, t, bg) {
    sky(ctx, w, h, '#15111a', '#2a2018');
    let [ox, oy] = bg.par(.25, w, h);
    // round window with moonlight
    const rx = w * .5 + ox, ry = h * .22 + oy; bg.glow(ctx, rx, ry, 260, 'rgba(200,215,255,A)', .25); circ(ctx, rx, ry, 56, '#0a1030', 5); line(ctx, rx - 56, ry, rx + 56, ry, 4); line(ctx, rx, ry - 56, rx, ry + 56, 4); ctx.save(); ctx.beginPath(); ctx.arc(rx, ry, 54, 0, 7); ctx.clip(); moon(ctx, rx + 18, ry - 12, 18, bg); ctx.restore();
    ctx.save(); ctx.globalAlpha = .08; ctx.fillStyle = '#cfe0ff'; poly(ctx, [[rx - 56, ry], [rx + 56, ry], [rx + 200, h], [rx - 200, h]], '#cfe0ff', 0); ctx.restore();
    // rafters
    for (let i = 0; i < 7; i++) { const x = (i / 6) * w + ox; poly(ctx, [[x - 14, oy], [x + 14, oy], [w / 2 + ox + 14, -h * .25 + oy], [w / 2 + ox - 14, -h * .25 + oy]], '#3a2a1e'); }
    poly(ctx, [[0, h * .7 + oy], [w, h * .7 + oy], [w, h * .7 + oy + 14], [0, h * .7 + oy + 14]], '#2a1f16');
    // cobweb
    ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 1; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + 90 * Math.cos(k * .3), oy + 90 * Math.sin(k * .3)); ctx.stroke(); } for (let r = 20; r < 90; r += 22) { ctx.beginPath(); ctx.arc(ox, oy, r, 0, 1.3); ctx.stroke(); }
    [ox, oy] = bg.par(.5, w, h);
    // lantern
    const f = bg.flicker(.9, 1); const lx = w * .16 + ox, ly = h * .3 + oy; line(ctx, lx, oy - 10, lx, ly - 30, 3); for (let k = 0; k < 4; k++) circ(ctx, lx, oy + 10 + k * 14, 4, null, 2);
    bg.glow(ctx, lx, ly, 440, 'rgba(242,179,91,A)', f * .55); box(ctx, lx - 16, ly - 30, 32, 8, '#2a2238'); poly(ctx, [[lx - 14, ly - 22], [lx + 14, ly - 22], [lx + 10, ly + 22], [lx - 10, ly + 22]], `rgba(255,220,150,${.6 + f * .3})`); poly(ctx, [[lx - 6, ly + 14], [lx, ly - 6], [lx + 6, ly + 14]], '#ffd37a', 0); box(ctx, lx - 12, ly + 22, 24, 6, '#2a2238');
    // boxes + trunk
    box(ctx, w * .7 + ox, h * .5 + oy, 150, 120, '#5a3a2a'); line(ctx, w * .7 + ox + 75, h * .5 + oy, w * .7 + ox + 75, h * .5 + oy + 120, 2); box(ctx, w * .7 + ox + 20, h * .5 + oy + 30, 50, 30, '#efe4c8', 2);
    box(ctx, w * .78 + ox, h * .38 + oy, 110, 72, '#6b4a30'); shadeRect(ctx, w * .78 + ox, h * .38 + oy, 110, 14, .25); line(ctx, w * .78 + ox, h * .38 + oy + 36, w * .78 + ox + 110, h * .38 + oy + 36, 2, 'rgba(242,179,91,.6)');
    box(ctx, w * .04 + ox, h * .54 + oy, 130, 96, '#2f7b6b'); ctx.fillStyle = INK; ctx.font = 'bold 12px Segoe UI, sans-serif'; ctx.fillText('1996', w * .04 + ox + 46, h * .54 + oy + 54); for (let k = 0; k < 3; k++) line(ctx, w * .04 + ox, h * .54 + oy + 20 + k * 28, w * .04 + ox + 130, h * .54 + oy + 20 + k * 28, 2, 'rgba(26,31,58,.5)');
    // table + stool + radio
    [ox, oy] = bg.par(.9, w, h); const tx = w * .5 + ox, ty = h * .6 + oy;
    planks(ctx, w, h * .7 + oy + 14, h * .3, '#1f1712', 7);
    box(ctx, tx - w * .19, ty, w * .38, 16, '#4a3222'); box(ctx, tx - w * .17, ty + 16, 12, h * .26, '#3a2a1e'); box(ctx, tx + w * .17 - 12, ty + 16, 12, h * .26, '#3a2a1e'); line(ctx, tx - w * .17 + 12, ty + 40, tx + w * .17 - 12, ty + 40, 3);
    radioBody(ctx, tx, ty, 1, bg);
    circ(ctx, tx + w * .26, ty + 30, 26, '#5a3a2a'); box(ctx, tx + w * .26 - 20, ty + 40, 8, h * .2, '#3a2a1e', 2.5); box(ctx, tx + w * .26 + 12, ty + 40, 8, h * .2, '#3a2a1e', 2.5);
    bg.dustMotes(ctx, w, h);
  },
});

// Illustrated pass, part 2: school interiors.
function noticeBoard(ctx, x, y, w, h) {
  box(ctx, x, y, w, h, '#8a6a4a'); box(ctx, x + 8, y + 8, w - 16, h - 16, '#c9a876', 2);
  const papers = [['#efe4c8', .12, .18, .3, .34], ['#f6f1ea', .5, .14, .34, .4], ['#38e8d8', .2, .6, .26, .26], ['#f2b35b', .56, .62, .3, .24]];
  papers.forEach(([c, px, py, pw, ph]) => { box(ctx, x + w * px, y + h * py, w * pw, h * ph, c, 2); circ(ctx, x + w * px + w * pw / 2, y + h * py + 4, 3, '#c23b3b', 1.5); for (let k = 1; k < 3; k++) line(ctx, x + w * px + 8, y + h * py + 10 + k * 8, x + w * (px + pw) - 8, y + h * py + 10 + k * 8, 1.5, 'rgba(26,31,58,.35)'); });
}
function plant(ctx, x, y, s = 1) {
  box(ctx, x - 16 * s, y - 24 * s, 32 * s, 24 * s, '#c23b3b'); for (let k = 0; k < 5; k++) { ctx.save(); ctx.translate(x, y - 24 * s); ctx.rotate((k - 2) * .45); ctx.beginPath(); ctx.ellipse(0, -26 * s, 9 * s, 26 * s, 0, 0, 7); ctx.fillStyle = k % 2 ? '#2f7b6b' : '#3f9b7b'; ctx.fill(); ink(ctx, 2.5); ctx.stroke(); ctx.restore(); }
}
function deskLamp(ctx, x, y, bg, on = true) {
  box(ctx, x - 14, y - 6, 28, 6, '#2a2238', 2.5); line(ctx, x, y - 6, x + 10, y - 44, 4, '#8a8fa8'); poly(ctx, [[x - 14, y - 44], [x + 34, y - 44], [x + 26, y - 60], [x - 6, y - 60]], '#2f7b6b');
  if (on) { bg.glow(ctx, x + 10, y - 30, 120, 'rgba(242,200,120,A)', .5); line(ctx, x - 10, y - 43, x + 30, y - 43, 3, '#ffe9b8'); }
}
function chair(ctx, x, y, s = 1, color = '#5a3a2a') { box(ctx, x - 16 * s, y - 40 * s, 32 * s, 8 * s, color, 2.5); line(ctx, x - 12 * s, y - 32 * s, x - 12 * s, y, 3 * s); line(ctx, x + 12 * s, y - 32 * s, x + 12 * s, y, 3 * s); box(ctx, x - 14 * s, y - 80 * s, 6 * s, 40 * s, color, 2.5); box(ctx, x - 14 * s, y - 80 * s, 28 * s, 8 * s, color, 2.5); }

Object.assign(PRESETS, {
  // Reception: notice board, clock, rainy window, counter with lamp, bell and plant.
  desk(ctx, w, h, t, bg) {
    sky(ctx, w, h, '#2a2340', '#3a2f48'); for (let x = 0; x < w; x += 36) line(ctx, x, 0, x, h * .62, 1, 'rgba(255,255,255,.04)');
    let [ox, oy] = bg.par(.2, w, h);
    const wx = w * .62 + ox, wy = h * .12 + oy, ww = w * .26, wh = h * .36; box(ctx, wx, wy, ww, wh, '#0a0e22'); ctx.save(); ctx.beginPath(); ctx.rect(wx, wy, ww, wh); ctx.clip(); moon(ctx, wx + ww * .3, wy + wh * .3, 20, bg); bg.rain(ctx, w, h, .6, .2); ctx.restore(); ink(ctx, 4); ctx.strokeRect(wx, wy, ww, wh); line(ctx, wx + ww / 2, wy, wx + ww / 2, wy + wh, 4);
    noticeBoard(ctx, w * .08 + ox, h * .12 + oy, w * .3, h * .3); clockFace(ctx, w * .47 + ox, h * .2 + oy, Math.min(w, h) * .045, bg.vars.clock); box(ctx, w * .43 + ox, h * .36 + oy, 100, 28, '#2a2238'); ctx.fillStyle = '#f2b35b'; ctx.font = 'bold 12px Segoe UI, sans-serif'; ctx.fillText('RECEPTION', w * .43 + ox + 12, h * .36 + oy + 19);
    [ox, oy] = bg.par(.6, w, h); planks(ctx, w, h * .62 + oy, h * .4, '#3a2a1e', 6); line(ctx, 0, h * .62 + oy, w, h * .62 + oy, 3);
    // counter
    box(ctx, w * .14 + ox, h * .66 + oy, w * .62, h * .34, '#6b4a30'); shadeRect(ctx, w * .14 + ox, h * .66 + oy + 12, w * .62, h * .34, .18); box(ctx, w * .12 + ox, h * .62 + oy, w * .66, 16, '#8a6a4a'); for (let k = 0; k < 4; k++) line(ctx, w * .14 + ox + (k + 1) * w * .124, h * .68 + oy, w * .14 + ox + (k + 1) * w * .124, h + oy, 2, 'rgba(26,31,58,.4)');
    deskLamp(ctx, w * .26 + ox, h * .62 + oy, bg); circ(ctx, w * .56 + ox, h * .6 + oy, 9, '#e8c872'); box(ctx, w * .56 + ox - 12, h * .6 + oy + 6, 24, 5, '#2a2238', 2); box(ctx, w * .4 + ox, h * .58 + oy, 70, 26, '#efe4c8', 2); line(ctx, w * .4 + ox + 8, h * .58 + oy + 9, w * .4 + ox + 60, h * .58 + oy + 9, 1.5, 'rgba(26,31,58,.4)'); line(ctx, w * .4 + ox + 8, h * .58 + oy + 17, w * .4 + ox + 50, h * .58 + oy + 17, 1.5, 'rgba(26,31,58,.4)');
    plant(ctx, w * .86 + ox, h * .62 + oy, 1.2);
    bg.glow(ctx, w * .26 + ox, h * .4 + oy, 300, 'rgba(242,179,91,A)', bg.flicker(.35, .3));
  },

  // Morning corridor: windows with light shafts, lockers, ceiling lights, a notice board.
  corridor(ctx, w, h, t, bg) {
    sky(ctx, w, h, '#4a5f8f', '#9fb2d6');
    let [ox, oy] = bg.par(.3, w, h);
    for (let i = 0; i < 4; i++) { const x = w * (.1 + i * .24) + ox; box(ctx, x, h * .1 + oy, w * .12, h * .3, '#e8f2ff', 4); line(ctx, x + w * .06, h * .1 + oy, x + w * .06, h * .4 + oy, 3); ctx.save(); ctx.globalAlpha = .16; poly(ctx, [[x, h * .4 + oy], [x + w * .12, h * .4 + oy], [x + w * .22, h + oy], [x - .02 * w, h + oy]], '#fff', 0); ctx.restore(); }
    for (let i = 0; i < 3; i++) { const x = w * (.2 + i * .3) + ox; box(ctx, x - 40, oy + 10, 80, 10, '#f6f1ea', 2.5); bg.glow(ctx, x, oy + 15, 90, 'rgba(255,255,255,A)', .2); }
    planks(ctx, w, h * .66 + oy, h * .34, '#5a6a8a', 5); line(ctx, 0, h * .66 + oy, w, h * .66 + oy, 3);
    [ox, oy] = bg.par(.7, w, h);
    for (let i = 0; i < 10; i++) { const lx = w * .02 + i * 66 + ox, ly = h * .34 + oy; box(ctx, lx, ly, 58, h * .32, i % 2 ? '#3b6b8f' : '#35607f'); for (let k = 0; k < 3; k++) line(ctx, lx + 12, ly + 14 + k * 7, lx + 46, ly + 14 + k * 7, 2, 'rgba(26,31,58,.5)'); box(ctx, lx + 40, ly + h * .16, 6, 14, '#e8c872', 2); if (i === 4) { box(ctx, lx + 6, ly + 60, 46, 30, '#f2b35b', 2); } }
    noticeBoard(ctx, w * .72 + ox, h * .08 + oy, w * .2, h * .2); plant(ctx, w * .96 + ox, h * .66 + oy, 1);
    bg.dustMotes(ctx, w, h, 'rgba(255,255,255,.35)');
  },

  // Rooftop door: brick wall, riveted metal door, glowing lock, steps, pipe.
  rooftop_door(ctx, w, h, t, bg) {
    sky(ctx, w, h, '#0c0f20', '#1a1a2e');
    let [ox, oy] = bg.par(.4, w, h); ctx.fillStyle = '#2a2235'; ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 28) { line(ctx, 0, y + oy, w, y + oy, 1.5, 'rgba(26,31,58,.6)'); for (let x = (y / 28) % 2 ? 0 : 30; x < w; x += 60) line(ctx, x + ox, y + oy, x + ox, y + 28 + oy, 1.5, 'rgba(26,31,58,.6)'); }
    line(ctx, w * .12 + ox, 0, w * .12 + ox, h * .78 + oy, 10, '#3a3150'); line(ctx, w * .12 + ox, 0, w * .12 + ox, h * .78 + oy, 3); circ(ctx, w * .12 + ox, h * .3 + oy, 10, '#3a3150'); circ(ctx, w * .12 + ox, h * .56 + oy, 10, '#3a3150');
    [ox, oy] = bg.par(.7, w, h); const dx = w / 2 - 120 + ox, dy = h * .1 + oy, dw = 240, dh = h * .68;
    box(ctx, dx - 14, dy - 14, dw + 28, dh + 14, '#3a3150'); box(ctx, dx, dy, dw, dh, '#4a3f5a'); shadeRect(ctx, dx + dw * .7, dy, dw * .3, dh, .2);
    for (let k = 0; k < 8; k++) { circ(ctx, dx + 14, dy + 16 + k * (dh / 8), 4, '#8a8fa8', 1.5); circ(ctx, dx + dw - 14, dy + 16 + k * (dh / 8), 4, '#8a8fa8', 1.5); }
    box(ctx, dx + 40, dy + 30, dw - 80, dh * .3, '#3a3150'); ctx.fillStyle = '#e8c872'; ctx.font = 'bold 20px Consolas, monospace'; ctx.fillText('ROOF', dx + 84, dy + 30 + dh * .17);
    const p = bg.flicker(.7, .8) * (1 - bg.signal) + bg.signal; box(ctx, dx + dw - 70, dy + dh * .5, 50, 60, '#1a1f3a'); bg.glow(ctx, dx + dw - 45, dy + dh * .5 + 30, 90, 'rgba(56,232,216,A)', p * .7); circ(ctx, dx + dw - 45, dy + dh * .5 + 30, 11, `rgba(56,232,216,${.5 + p * .5})`); box(ctx, dx + 30, dy + dh * .5 + 20, 60, 10, '#8a8fa8', 2);
    box(ctx, dx - 40, dy + dh, dw + 80, 16, '#3a3150'); box(ctx, dx - 60, dy + dh + 16, dw + 120, 16, '#2a2238');
    ctx.fillStyle = '#0d0b12'; ctx.fillRect(0, h * .82 + oy, w, h); line(ctx, 0, h * .82 + oy, w, h * .82 + oy, 3);
    bg.dustMotes(ctx, w, h);
  },

  // Common room, daytime: big window, sofa with cushions, armchair, coffee table, bookshelf, rug.
  common(ctx, w, h, t, bg) {
    sky(ctx, w, h, '#4a5f8f', '#b9c6e2');
    let [ox, oy] = bg.par(.2, w, h); const wx = w * .3 + ox, wy = h * .08 + oy, ww = w * .4, wh = h * .36;
    box(ctx, wx, wy, ww, wh, '#cfe6ff', 5); line(ctx, wx + ww / 2, wy, wx + ww / 2, wy + wh, 5); line(ctx, wx, wy + wh / 2, wx + ww, wy + wh / 2, 5);
    ctx.save(); ctx.beginPath(); ctx.rect(wx, wy, ww, wh); ctx.clip(); ctx.fillStyle = '#fff'; for (const [cx, cy, r] of [[wx + ww * .25, wy + wh * .3, 22], [wx + ww * .35, wy + wh * .26, 28], [wx + ww * .75, wy + wh * .6, 20], [wx + ww * .86, wy + wh * .58, 26]]) circ(ctx, cx + Math.sin(t * .2) * 6, cy, r, '#fff', 2); ctx.restore();
    for (let x = 0; x < w; x += 40) line(ctx, x, 0, x, h * .66, 1, 'rgba(255,255,255,.08)');
    // bookshelf
    box(ctx, w * .04 + ox, h * .14 + oy, w * .18, h * .5, '#6b4a30'); for (let r = 0; r < 3; r++) { const sy = h * .14 + oy + 16 + r * (h * .5 / 3); line(ctx, w * .04 + ox, sy + h * .12, w * .22 + ox, sy + h * .12, 3); const rr = rnd(r + 40); let bx = w * .05 + ox; while (bx < w * .2 + ox) { const bw = 8 + rr() * 10; box(ctx, bx, sy, bw, h * .12, ['#c23b3b', '#3b6b8f', '#e8c872', '#2f7b6b', '#8a7fe8'][Math.floor(rr() * 5)], 2); bx += bw + 2; } }
    [ox, oy] = bg.par(.6, w, h); planks(ctx, w, h * .66 + oy, h * .34, '#6b4a30', 6); line(ctx, 0, h * .66 + oy, w, h * .66 + oy, 3);
    ctx.fillStyle = '#38e8d8'; ctx.beginPath(); ctx.ellipse(w * .5 + ox, h * .86 + oy, 220, 40, 0, 0, 7); ctx.fill(); ink(ctx, 3); ctx.stroke();
    // sofa
    const sx = w * .3 + ox, sy = h * .5 + oy; box(ctx, sx, sy, w * .4, h * .2, '#c23b3b'); box(ctx, sx - 24, sy + 20, 24, h * .18, '#a83232'); box(ctx, sx + w * .4, sy + 20, 24, h * .18, '#a83232'); box(ctx, sx + 10, sy + h * .1, w * .4 - 20, h * .1, '#d84444'); box(ctx, sx + 30, sy + 30, 60, 40, '#f2b35b', 2.5); box(ctx, sx + w * .4 - 90, sy + 30, 60, 40, '#38e8d8', 2.5);
    // armchair + table
    box(ctx, w * .78 + ox, h * .54 + oy, w * .16, h * .16, '#2f7b6b'); box(ctx, w * .76 + ox, h * .6 + oy, 20, h * .12, '#256b5b'); box(ctx, w * .94 + ox, h * .6 + oy, 20, h * .12, '#256b5b');
    box(ctx, w * .4 + ox, h * .74 + oy, w * .2, 10, '#8a6a4a'); line(ctx, w * .42 + ox, h * .74 + oy + 10, w * .42 + ox, h * .84 + oy, 4); line(ctx, w * .58 + ox, h * .74 + oy + 10, w * .58 + ox, h * .84 + oy, 4); box(ctx, w * .46 + ox, h * .74 + oy - 16, 14, 16, '#f6f1ea', 2); box(ctx, w * .52 + ox, h * .74 + oy - 16, 14, 16, '#e8c872', 2);
    plant(ctx, w * .12 + ox, h * .66 + oy, 1.4);
    bg.dustMotes(ctx, w, h, 'rgba(255,255,255,.3)');
  },

  // Dorm, morning: same room in sunlight with the wall clock (bg.vars.clock, bg.vars.alarm shakes it).
  dorm_morning(ctx, w, h, t, bg) {
    sky(ctx, w, h, '#3a4a7a', '#8fa0c8');
    for (let x = 0; x < w; x += 44) line(ctx, x, 0, x, h * .74, 1, 'rgba(255,255,255,.06)');
    let [ox, oy] = bg.par(.2, w, h); const wx = w * .6 + ox, wy = h * .12 + oy, ww = w * .26, wh = h * .38;
    box(ctx, wx, wy, ww, wh, '#ffe9b8', 4); bg.glow(ctx, wx + ww / 2, wy + wh / 2, 420, 'rgba(255,220,150,A)', .5); line(ctx, wx + ww / 2, wy, wx + ww / 2, wy + wh, 4); line(ctx, wx, wy + wh / 2, wx + ww, wy + wh / 2, 4);
    ctx.save(); ctx.globalAlpha = .18; poly(ctx, [[wx, wy + wh], [wx + ww, wy + wh], [wx + ww - w * .25, h], [wx - w * .3, h]], '#fff', 0); ctx.restore();
    for (const [cx, dir] of [[wx - 30, 1], [wx + ww + 30, -1]]) { poly(ctx, [[cx - 14 * dir, wy - 10], [cx + 26 * dir, wy - 10], [cx + 34 * dir, wy + wh + 20], [cx - 20 * dir, wy + wh + 20]], '#8a3b5a'); for (let k = 0; k < 3; k++) line(ctx, cx + (k * 10 - 6) * dir, wy, cx + (k * 12 - 4) * dir, wy + wh + 16, 1.5, 'rgba(26,31,58,.4)'); }
    box(ctx, wx - 44, wy - 16, ww + 88, 8, '#3a3150');
    const shake = bg.vars.alarm && !bg.reduce ? Math.sin(t * 60) * 3 : 0; clockFace(ctx, w * .5 + ox + shake, h * .2 + oy, Math.min(w, h) * .07, bg.vars.clock);
    [ox, oy] = bg.par(.6, w, h); const bx = w * .1 + ox, by = h * .2 + oy, bw = w * .36, bh = h * .52;
    box(ctx, bx, by, 12, bh, '#3a3150'); box(ctx, bx + bw - 12, by, 12, bh, '#3a3150');
    for (const yy of [by + bh * .34, by + bh * .82]) { box(ctx, bx, yy, bw, 16, '#4a3f66'); box(ctx, bx + 12, yy - 40, bw - 24, 40, '#f6f1ea'); box(ctx, bx + 80, yy - 40, bw - 92, 40, '#5a6ab0'); for (let k = 0; k < 4; k++) line(ctx, bx + 100 + k * 50, yy - 36, bx + 118 + k * 50, yy - 4, 1.5, 'rgba(255,255,255,.3)'); box(ctx, bx + 20, yy - 52, 56, 22, '#efe4c8', 2.5); }
    for (let k = 0; k < 5; k++) line(ctx, bx + bw - 26, by + 40 + k * 40, bx + bw - 12, by + 40 + k * 40, 3); line(ctx, bx + bw - 26, by + 20, bx + bw - 26, by + bh, 3);
    // alarm clock on a stool
    const ax = bx + bw + 50, ay = by + bh; box(ctx, ax - 22, ay - 30, 44, 30, '#5a3a2a'); circ(ctx, ax, ay - 48, 16, '#f6f1ea'); line(ctx, ax, ay - 48, ax, ay - 58, 2); line(ctx, ax, ay - 48, ax + 7, ay - 44, 2); circ(ctx, ax - 10, ay - 62, 5, '#e8c872', 2); circ(ctx, ax + 10, ay - 62, 5, '#e8c872', 2);
    planks(ctx, w, h * .74 + oy, h * .26, '#5a4a6a', 7); line(ctx, 0, h * .74 + oy, w, h * .74 + oy, 3);
    ctx.fillStyle = '#8a3b5a'; ctx.beginPath(); ctx.ellipse(w * .5, h * .9 + oy, 180, 34, 0, 0, 7); ctx.fill(); ink(ctx, 3); ctx.stroke();
    bg.dustMotes(ctx, w, h, 'rgba(255,255,255,.35)');
  },

  classroom(ctx, w, h, t, bg) { classroomInk(ctx, w, h, t, bg, false); },
  classroom_night(ctx, w, h, t, bg) { classroomInk(ctx, w, h, t, bg, true); },
  library(ctx, w, h, t, bg) { libraryInk(ctx, w, h, t, bg, false); },
  library_night(ctx, w, h, t, bg) { libraryInk(ctx, w, h, t, bg, true); },
});

function classroomInk(ctx, w, h, t, bg, night) {
  sky(ctx, w, h, night ? '#0a0e1e' : '#4b5f8a', night ? '#151a30' : '#9fb2d6');
  let [ox, oy] = bg.par(.2, w, h);
  const wx = w * .74 + ox, wy = h * .12 + oy, ww = w * .18, wh = h * .4;
  box(ctx, wx, wy, ww, wh, night ? '#0a1030' : '#dbe9ff', 5); line(ctx, wx + ww / 2, wy, wx + ww / 2, wy + wh, 5); if (night) { ctx.save(); ctx.beginPath(); ctx.rect(wx, wy, ww, wh); ctx.clip(); moon(ctx, wx + ww * .6, wy + wh * .25, 18, bg); ctx.restore(); bg.glow(ctx, wx + ww / 2, wy + wh / 2, 300, 'rgba(120,150,255,A)', .2); }
  const bx = w * .1 + ox, by = h * .14 + oy, bw = w * .5, bh = h * .36;
  box(ctx, bx - 10, by - 10, bw + 20, bh + 20, '#6b4a30'); box(ctx, bx, by, bw, bh, night ? '#101a18' : '#1f4a3c', 2.5);
  ctx.strokeStyle = night ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.55)'; ctx.lineWidth = 2.5; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(bx + 30, by + 40 + i * 34); ctx.lineTo(bx + 30 + bw * (.3 + ((i * 37) % 50) / 100), by + 40 + i * 34); ctx.stroke(); }
  ctx.strokeStyle = night ? 'rgba(56,232,216,.25)' : '#38e8d8'; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= 120; i += 4) ctx.lineTo(bx + bw - 160 + i, by + bh - 40 + Math.sin(i * .3) * 10); ctx.stroke();
  box(ctx, bx, by + bh + 10, bw, 8, '#8a6a4a', 2); box(ctx, bx + 20, by + bh + 2, 30, 8, '#f6f1ea', 2);
  if (night) bg.glow(ctx, bx + bw / 2, by + bh / 2, 260, 'rgba(56,232,216,A)', bg.signal * .5);
  clockFace(ctx, (bx + bw + wx) / 2, by + Math.min(w, h) * .06, Math.min(w, h) * .045, bg.vars.clock);
  box(ctx, w * .66 + ox, h * .34 + oy, 70, 50, '#efe4c8', 2.5); ctx.fillStyle = '#3b6b8f'; ctx.beginPath(); ctx.ellipse(w * .66 + ox + 35, h * .34 + oy + 25, 24, 16, 0, 0, 7); ctx.fill();
  [ox, oy] = bg.par(.6, w, h); planks(ctx, w, h * .62 + oy, h * .38, night ? '#1a1612' : '#8a6a4a', 6); line(ctx, 0, h * .62 + oy, w, h * .62 + oy, 3);
  for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) {
    const dx = w * (.08 + c * .23) + ox + r * 30, dy = h * (.6 + r * .14) + oy; const col = night ? '#2a2420' : '#c9a876';
    chair(ctx, dx + w * .08, dy + 70, .9, night ? '#1d1a16' : '#8c7250'); box(ctx, dx, dy, w * .16, 14, col); box(ctx, dx + 8, dy + 14, 6, 50, night ? '#1d1a16' : '#8c7250', 2); box(ctx, dx + w * .16 - 14, dy + 14, 6, 50, night ? '#1d1a16' : '#8c7250', 2);
    if (!night && (r + c) % 2) box(ctx, dx + 20, dy - 8, 30, 8, ['#c23b3b', '#3b6b8f', '#e8c872'][c % 3], 2);
  }
  bg.dustMotes(ctx, w, h, night ? 'rgba(242,179,91,.35)' : 'rgba(255,255,255,.3)');
}

function libraryInk(ctx, w, h, t, bg, night) {
  sky(ctx, w, h, night ? '#0b0a14' : '#3a2f28', night ? '#15121c' : '#5a4a3c');
  let [ox, oy] = bg.par(.2, w, h);
  const pal = night ? ['#2a2235', '#1f2a2f', '#2d2320', '#262a3a', '#2a2020'] : ['#8a3b3b', '#3b6b8f', '#c9a83c', '#2f7b6b', '#6b4a8a'];
  for (let r = 0; r < 4; r++) {
    const y = h * (.06 + r * .15) + oy; const rr = rnd(r * 13 + 5); let x = ox - 10;
    while (x < w + 20) { const bw = 10 + rr() * 14, bh = h * .07 + rr() * h * .04; box(ctx, x, y + h * .11 - bh, bw, bh, pal[Math.floor(rr() * 5) % 5], 1.5); if (rr() > .6) line(ctx, x + bw / 2, y + h * .11 - bh + 6, x + bw / 2, y + h * .11 - 6, 1, 'rgba(255,255,255,.25)'); x += bw + 2; }
    box(ctx, 0, y + h * .11, w, 9, night ? '#1a1410' : '#4a3626', 2);
  }
  [ox, oy] = bg.par(.5, w, h);
  if (!night) { ctx.save(); ctx.globalAlpha = .14; poly(ctx, [[w * .55 + ox, oy - 10], [w * .75 + ox, oy - 10], [w * .95 + ox, h], [w * .35 + ox, h]], '#ffe9b8', 0); ctx.restore(); }
  // ladder
  line(ctx, w * .06 + ox, h * .1 + oy, w * .06 + ox, h * .68 + oy, 4, '#8a6a4a'); line(ctx, w * .1 + ox, h * .1 + oy, w * .1 + ox, h * .68 + oy, 4, '#8a6a4a'); for (let k = 0; k < 7; k++) line(ctx, w * .06 + ox, h * .14 + oy + k * h * .08, w * .1 + ox, h * .14 + oy + k * h * .08, 3, '#8a6a4a');
  planks(ctx, w, h * .84 + oy, h * .16, night ? '#0d0b10' : '#2a2018', 4);
  // table
  box(ctx, w * .18 + ox, h * .68 + oy, w * .64, 16, night ? '#241a14' : '#5c3f2a'); box(ctx, w * .21 + ox, h * .84 + oy - h * .16, 12, h * .16, night ? '#1a1410' : '#4a3222', 2.5); box(ctx, w * .77 + ox, h * .84 + oy - h * .16, 12, h * .16, night ? '#1a1410' : '#4a3222', 2.5);
  const f = bg.flicker(night ? .9 : .5, .5); bg.glow(ctx, w * .28 + ox, h * .62 + oy, night ? 340 : 170, 'rgba(242,200,120,A)', f * (night ? .6 : .3));
  line(ctx, w * .28 + ox, h * .56 + oy, w * .28 + ox, h * .68 + oy, 6, '#b08d3c'); ctx.fillStyle = '#2f6b4a'; ctx.beginPath(); ctx.ellipse(w * .28 + ox, h * .56 + oy, 44, 13, 0, Math.PI, 0); ctx.fill(); ink(ctx, 3); ctx.stroke(); box(ctx, w * .28 + ox - 16, h * .68 + oy - 4, 32, 6, '#b08d3c', 2);
  if (bg.vars.book) {
    const bx = w * .55 + ox, by = h * .66 + oy, pw = Math.min(170, w * .17);
    poly(ctx, [[bx - pw, by + 2], [bx - pw / 2, by - 16], [bx, by - 6], [bx + pw / 2, by - 16], [bx + pw, by + 2], [bx + pw, by + 12], [bx - pw, by + 12]], '#efe4c8'); line(ctx, bx, by - 6, bx, by + 12, 2);
    for (let i = 0; i < 4; i++) { box(ctx, bx - pw + 14 + i * (pw / 4.4), by - 10 + (i % 2), pw / 6, 9, '#8a8a8a', 1.5); box(ctx, bx + 12 + i * (pw / 4.4), by - 10 + ((i + 1) % 2), pw / 6, 9, '#8a8a8a', 1.5); }
    if (bg.vars.erased) { const a = bg.flicker(.85, 2); const ex = bx + 12 + 2 * (pw / 4.4), ey = by - 11; ctx.fillStyle = `rgba(56,232,216,${a * .85})`; ctx.fillRect(ex - 1, ey, pw / 6 + 2, 11); bg.glow(ctx, ex + pw / 12, ey + 5, 70, 'rgba(56,232,216,A)', a * .6); }
  }
  plant(ctx, w * .9 + ox, h * .68 + oy, 1); chair(ctx, w * .5 + ox, h * .9 + oy, 1.1, night ? '#241a14' : '#5c3f2a');
  bg.dustMotes(ctx, w, h);
}

// Illustrated pass, part 3: outdoors, tower, market, camp, coast, attic variants.
function mastInk(ctx, x, baseY, height, t, bg) {
  const top = baseY - height, wBase = height * .16;
  ink(ctx, 3.5); ctx.beginPath(); ctx.moveTo(x - wBase, baseY); ctx.lineTo(x - 5, top); ctx.moveTo(x + wBase, baseY); ctx.lineTo(x + 5, top);
  for (let i = 0; i < 9; i++) { const u = i / 9, y = baseY - u * height, hw = wBase * (1 - u) + 5, hw2 = wBase * (1 - (i + 1) / 9) + 5, y2 = baseY - (i + 1) / 9 * height; ctx.moveTo(x - hw, y); ctx.lineTo(x + hw, y); ctx.moveTo(x - hw, y); ctx.lineTo(x + hw2, y2); } ctx.stroke();
  ctx.strokeStyle = '#8a8fa8'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - wBase + 2, baseY); ctx.lineTo(x - 3, top); ctx.moveTo(x + wBase - 2, baseY); ctx.lineTo(x + 3, top); ctx.stroke();
  const on = bg.reduce ? 1 : (Math.sin(t * 2.2) > 0 ? 1 : .15); bg.glow(ctx, x, top - 8, 60 + on * 30, 'rgba(255,60,60,A)', on * .7); circ(ctx, x, top - 8, 6, `rgba(255,70,70,${on})`, 2);
  if (bg.vars.pulse && !bg.reduce) { ctx.strokeStyle = SIGNAL; for (let k = 0; k < 3; k++) { const p = ((t * .5 + k / 3) % 1); ctx.globalAlpha = (1 - p) * .7; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, top - 8, 10 + p * 160, 0, 7); ctx.stroke(); } ctx.globalAlpha = 1; }
}
function stars(ctx, w, hMax, n, seed, t, bg) { const r = rnd(seed); for (let i = 0; i < n; i++) { const x = r() * w, y = r() * hMax, s = r(); if (!bg.reduce && Math.sin(t * 2 + i * 1.7) < -.85) continue; ctx.fillStyle = `rgba(255,255,255,${.4 + .6 * s})`; ctx.fillRect(x, y, s > .85 ? 2.5 : 1.5, s > .85 ? 2.5 : 1.5); } }
function crowd(ctx, w, y, n, ox, t, bg) { for (let i = 0; i < n; i++) { const cx = w * (.05 + i * (.9 / n)) + ox + (bg.reduce ? 0 : Math.sin(t * .7 + i) * 4); const col = ['#1a1f3a', '#242a4a', '#1e2240'][i % 3]; circ(ctx, cx, y - 36, 13, col, 2.5); poly(ctx, [[cx - 18, y + 30], [cx - 16, y - 24], [cx + 16, y - 24], [cx + 18, y + 30]], col, 2.5); } }

Object.assign(PRESETS, {
  // Radio tower at night: mast, station building, fence, path lights.
  tower_night(ctx, w, h, t, bg) {
    sky(ctx, w, h, '#05071a', '#141a3a'); stars(ctx, w, h * .5, 80, 42, t, bg); moon(ctx, w * .18, h * .18, 30, bg);
    let [ox, oy] = bg.par(.2, w, h); poly(ctx, [[0, h * .7 + oy], [w * .3, h * .55 + oy], [w * .6, h * .66 + oy], [w * .85, h * .74 + oy], [w, h * .62 + oy], [w, h], [0, h]], '#0a0e24', 3);
    [ox, oy] = bg.par(.5, w, h);
    mastInk(ctx, w * .66 + ox, h * .68 + oy, h * .58, t, bg);
    box(ctx, w * .5 + ox, h * .58 + oy, w * .14, h * .12, '#1e2548'); poly(ctx, [[w * .49 + ox, h * .58 + oy], [w * .57 + ox, h * .52 + oy], [w * .65 + ox, h * .58 + oy]], '#2a3160'); box(ctx, w * .53 + ox, h * .61 + oy, 22, 16, '#f2b35b', 2.5); bg.glow(ctx, w * .54 + ox, h * .62 + oy, 80, 'rgba(242,179,91,A)', bg.flicker(.5, .3)); box(ctx, w * .59 + ox, h * .62 + oy, 16, h * .08, '#0b1026', 2.5); box(ctx, w * .57 + ox, h * .5 + oy, 6, 20, '#8a8fa8', 2);
    ctx.fillStyle = '#070a18'; ctx.fillRect(0, h * .7 + oy, w, h); line(ctx, 0, h * .7 + oy, w, h * .7 + oy, 3);
    for (let i = 0; i < 12; i++) { const fx = w * .42 + ox + i * (w * .3 / 12); line(ctx, fx, h * .68 + oy, fx, h * .74 + oy, 2.5, '#3a4470'); } line(ctx, w * .42 + ox, h * .7 + oy, w * .72 + ox, h * .7 + oy, 2.5, '#3a4470');
    [ox, oy] = bg.par(.8, w, h); for (let i = 0; i < 5; i++) { const lx = w * (.1 + i * .1) + ox, ly = h * (.95 - i * .055) + oy; line(ctx, lx, ly, lx, ly - 24, 3); bg.glow(ctx, lx, ly - 26, 46, 'rgba(242,179,91,A)', .4); circ(ctx, lx, ly - 26, 5, '#ffe9b8', 2); }
    bg.rain(ctx, w, h, .4, .2);
  },

  // Tower control room: consoles with screens, dials, big window on the mast, desk with logbook and mic.
  tower_room(ctx, w, h, t, bg) {
    sky(ctx, w, h, '#0a0d1c', '#141a30');
    let [ox, oy] = bg.par(.2, w, h); const wx = w * .3 + ox, wy = h * .1 + oy, ww = w * .4, wh = h * .4;
    box(ctx, wx, wy, ww, wh, '#05071a', 5); ctx.save(); ctx.beginPath(); ctx.rect(wx, wy, ww, wh); ctx.clip(); stars(ctx, ww, wh, 30, 7, t, bg); mastInk(ctx, wx + ww * .55, wy + wh + 40, wh * 1.1, t, bg); bg.rain(ctx, w, h, .4, .2); ctx.restore(); ink(ctx, 5); ctx.strokeRect(wx, wy, ww, wh); line(ctx, wx + ww / 2, wy, wx + ww / 2, wy + wh, 5);
    box(ctx, w * .06 + ox, h * .14 + oy, w * .18, h * .3, '#1e2548'); for (let k = 0; k < 4; k++) { box(ctx, w * .08 + ox, h * .17 + oy + k * h * .07, w * .14, h * .05, k % 2 ? '#0b1026' : '#0f1a30', 2); ctx.strokeStyle = k % 2 ? '#38e8d8' : '#f2b35b'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let i = 0; i <= w * .12; i += 4) ctx.lineTo(w * .09 + ox + i, h * .17 + oy + k * h * .07 + h * .025 + Math.sin(i * .15 + t * 3 + k) * 6); ctx.stroke(); }
    box(ctx, w * .76 + ox, h * .14 + oy, w * .18, h * .3, '#1e2548'); clockFace(ctx, w * .85 + ox, h * .22 + oy, Math.min(w, h) * .04, bg.vars.clock); box(ctx, w * .78 + ox, h * .32 + oy, w * .14, h * .08, '#0b1026', 2); ctx.fillStyle = '#38e8d8'; ctx.font = 'bold 14px Consolas, monospace'; ctx.fillText('104.5 FM', w * .79 + ox + 6, h * .32 + oy + h * .05);
    [ox, oy] = bg.par(.6, w, h);
    box(ctx, 0, h * .58 + oy, w, h * .16, '#1b2140', 3); planks(ctx, w, h * .74 + oy, h * .26, '#10142a', 4); line(ctx, 0, h * .74 + oy, w, h * .74 + oy, 3);
    const r = rnd(9); for (let i = 0; i < 40; i++) { const lx = w * .03 + i * (w * .94 / 40) + ox, ly = h * .62 + ((i * 7) % 3) * 18 + oy; const on = bg.reduce ? .8 : (Math.sin(t * (1 + r() * 3) + i) > 0 ? 1 : .2); ctx.fillStyle = ['rgba(56,232,216,', 'rgba(242,179,91,', 'rgba(255,80,80,'][i % 3] + on + ')'; ctx.fillRect(lx, ly, 7, 7); ink(ctx, 1); ctx.strokeRect(lx, ly, 7, 7); }
    for (let i = 0; i < 3; i++) { const dx = w * (.15 + i * .35) + ox, dy = h * .66 + oy; circ(ctx, dx, dy, 18, '#0b0e1e'); const a = -2.2 + bg.signal * 2 + Math.sin(t * 2 + i) * .15; line(ctx, dx, dy, dx + Math.cos(a) * 13, dy + Math.sin(a) * 13, 2.5, SIGNAL); }
    [ox, oy] = bg.par(.9, w, h); box(ctx, w * .1 + ox, h * .8 + oy, w * .8, 14, '#2a2235');
    if (bg.vars.book) { box(ctx, w * .55 + ox, h * .76 + oy, 112, 40, '#efe4c8'); line(ctx, w * .55 + ox + 56, h * .76 + oy, w * .55 + ox + 56, h * .76 + oy + 40, 2); for (let i = 0; i < 4; i++) line(ctx, w * .55 + ox + 8, h * .76 + oy + 8 + i * 8, w * .55 + ox + 48, h * .76 + oy + 8 + i * 8, 1.5, 'rgba(26,31,58,.4)'); }
    box(ctx, w * .3 + ox, h * .7 + oy, 6, h * .1, '#3a3a4a', 2); ctx.fillStyle = '#555'; ctx.beginPath(); ctx.ellipse(w * .3 + ox + 3, h * .69 + oy, 10, 14, 0, 0, 7); ctx.fill(); ink(ctx, 2.5); ctx.stroke();
    bg.glow(ctx, w * .5, h * .3, 300, 'rgba(56,232,216,A)', bg.signal * .3); bg.dustMotes(ctx, w, h);
  },

  // Table top with the old floor plan, pencil, mug, magnifier.
  plan_table(ctx, w, h, t, bg) {
    planks(ctx, w, 0, h, '#3a2a1c', 8);
    let [ox, oy] = bg.par(.5, w, h); bg.glow(ctx, w * .5 + ox, h * .45 + oy, 420, 'rgba(242,200,120,A)', bg.flicker(.45, .3));
    const pw = Math.min(w * .7, 640), ph = pw * .62, px = w / 2 - pw / 2 + ox, py = h / 2 - ph / 2 + oy;
    ctx.save(); ctx.translate(px + pw / 2, py + ph / 2); ctx.rotate(-.03); ctx.translate(-(px + pw / 2), -(py + ph / 2));
    ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 24; box(ctx, px, py, pw, ph, '#efe4c8'); ctx.shadowBlur = 0;
    ctx.fillStyle = '#4a3a2a'; ctx.font = 'bold 12px Consolas, monospace'; ctx.fillText('NORTHGATE · DORM HOUSE · 1896', px + 16, py + 22);
    const cell = (c, r, cw, rh) => [px + pw * .06 + (c - 1) * (pw * .88 / 6), py + ph * .12 + (r - 1) * (ph * .78 / 4), cw * (pw * .88 / 6), rh * (ph * .78 / 4)];
    [[1, 1, 2, 2], [3, 1, 1, 1], [4, 1, 3, 1], [4, 2, 3, 1], [1, 3, 2, 2], [3, 3, 1, 1], [3, 4, 1, 1], [4, 3, 2, 2], [6, 3, 1, 2]].forEach(([c, r, cw, rh]) => { const [x, y, ww, hh] = cell(c, r, cw, rh); ink(ctx, 3); ctx.strokeRect(x, y, ww, hh); line(ctx, x + ww * .3, y, x + ww * .5, y, 6, '#efe4c8'); });
    if (bg.vars.room0) { const [x, y, ww, hh] = cell(3, 2, 1, 1); const a = bg.flicker(.9, 1.5); ctx.fillStyle = `rgba(56,232,216,${a * .5})`; ctx.fillRect(x, y, ww, hh); ctx.strokeStyle = SIGNAL; ctx.lineWidth = 3; ctx.strokeRect(x, y, ww, hh); bg.glow(ctx, x + ww / 2, y + hh / 2, 120, 'rgba(56,232,216,A)', a * .6); }
    ctx.restore();
    ctx.save(); ctx.translate(px + pw + 30, py + ph * .3); ctx.rotate(.6); box(ctx, -6, 0, 12, 140, '#e2b544', 2.5); poly(ctx, [[-6, 0], [0, -16], [6, 0]], '#f3d9c4', 2.5); box(ctx, -6, 128, 12, 12, '#c23b3b', 2.5); ctx.restore();
    box(ctx, px - 90, py + ph - 60, 50, 56, '#2f7b6b'); ctx.beginPath(); ctx.arc(px - 40, py + ph - 32, 14, -1.3, 1.3); ink(ctx, 4); ctx.stroke(); ctx.fillStyle = '#5a3a2a'; ctx.beginPath(); ctx.ellipse(px - 65, py + ph - 60, 25, 8, 0, 0, 7); ctx.fill(); ink(ctx, 2.5); ctx.stroke();
    circ(ctx, px + pw - 60, py + ph + 40, 26, 'rgba(200,230,255,.35)', 4); line(ctx, px + pw - 42, py + ph + 58, px + pw - 10, py + ph + 90, 8, INK);
    bg.dustMotes(ctx, w, h);
  },

  // Neighbourhood street at dusk: terraced houses, cottage with smoke, block of flats, lamps, bench.
  street(ctx, w, h, t, bg) {
    sky(ctx, w, h, '#2a1f4a', '#c2694a');
    let [ox, oy] = bg.par(.2, w, h);
    box(ctx, w * .72 + ox, h * .18 + oy, w * .18, h * .5, '#262040'); for (let r = 0; r < 7; r++) for (let c = 0; c < 4; c++) box(ctx, w * .735 + ox + c * (w * .04), h * .21 + oy + r * (h * .065), w * .02, h * .035, (r * 4 + c) % 3 ? '#f2b35b' : '#0d0b18', 1.5); box(ctx, w * .7 + ox, h * .16 + oy, w * .22, 8, '#3a3150', 2);
    [ox, oy] = bg.par(.5, w, h);
    for (let i = 0; i < 3; i++) { const hx = w * .05 + ox + i * w * .13, hy = h * .68 + oy, hw = w * .13, hh = h * .26; box(ctx, hx, hy - hh, hw - 2, hh, i % 2 ? '#5a3a3a' : '#6b4a3a'); poly(ctx, [[hx - 4, hy - hh], [hx + hw / 2 - 1, hy - hh - 36], [hx + hw + 2, hy - hh]], '#3a2424'); box(ctx, hx + hw * .2, hy - hh * .7, hw * .2, hh * .22, '#f2b35b', 2); box(ctx, hx + hw * .6, hy - hh * .7, hw * .2, hh * .22, '#f2b35b', 2); box(ctx, hx + hw * .42, hy - hh * .35, hw * .16, hh * .35, ['#c23b3b', '#2f7b6b', '#3b6b8f'][i], 2.5); }
    const cx = w * .5 + ox; box(ctx, cx, h * .5 + oy, w * .16, h * .18, '#8a6a4a'); poly(ctx, [[cx - 10, h * .5 + oy], [cx + w * .08, h * .38 + oy], [cx + w * .16 + 10, h * .5 + oy]], '#3a2a1a'); box(ctx, cx + w * .11, h * .4 + oy, 12, 30, '#2a2018', 2.5);
    if (!bg.reduce) for (let k = 0; k < 3; k++) { const p = ((t * .25 + k / 3) % 1); circ(ctx, cx + w * .116 + Math.sin(p * 6) * 6, h * .38 + oy - p * 60, 5 + p * 8, `rgba(255,255,255,${.4 * (1 - p)})`, 0); }
    box(ctx, cx + w * .03, h * .55 + oy, w * .03, h * .05, '#f2b35b', 2); box(ctx, cx + w * .09, h * .58 + oy, w * .03, h * .1, '#2a2018', 2.5); circ(ctx, cx + w * .035, h * .57 + oy, 16, '#2f7b6b', 2.5);
    ctx.fillStyle = '#1a1420'; ctx.fillRect(0, h * .68 + oy, w, h); line(ctx, 0, h * .68 + oy, w, h * .68 + oy, 3); box(ctx, 0, h * .74 + oy, w, 8, '#2a2230', 2); ctx.setLineDash([20, 16]); line(ctx, 0, h * .9 + oy, w, h * .9 + oy, 3, '#8a8fa8'); ctx.setLineDash([]);
    [ox, oy] = bg.par(.8, w, h); for (let i = 0; i < 3; i++) { const lx = w * (.2 + i * .3) + ox, ly = h * .5 + oy; box(ctx, lx - 3, ly, 6, h * .24, '#111', 2.5); bg.glow(ctx, lx, ly, 90, 'rgba(242,200,120,A)', bg.flicker(.6, .4 + i)); circ(ctx, lx, ly, 7, '#ffe9b8', 2.5); }
    box(ctx, w * .36 + ox, h * .7 + oy, 80, 8, '#5a3a2a'); box(ctx, w * .36 + ox, h * .64 + oy, 80, 6, '#5a3a2a'); line(ctx, w * .37 + ox, h * .64 + oy, w * .37 + ox, h * .78 + oy, 3); line(ctx, w * .42 + ox + 24, h * .64 + oy, w * .42 + ox + 24, h * .78 + oy, 3);
    bg.dustMotes(ctx, w, h, 'rgba(255,255,255,.2)');
  },

  // Hidden room: wall map with pins and string, crates, lantern, chair.
  hidden_room(ctx, w, h, t, bg) {
    sky(ctx, w, h, '#0b0909', '#1a1412');
    let [ox, oy] = bg.par(.3, w, h); for (let y = 0; y < h; y += 30) line(ctx, 0, y + oy, w, y + oy, 1, 'rgba(255,255,255,.04)');
    const f = bg.flicker(.8, .9); const lx = w * .15 + ox, ly = h * .3 + oy; line(ctx, lx, oy - 10, lx, ly - 30, 3); bg.glow(ctx, lx, ly, 360, 'rgba(242,179,91,A)', f * .5); box(ctx, lx - 14, ly - 30, 28, 8, '#2a2238'); poly(ctx, [[lx - 12, ly - 22], [lx + 12, ly - 22], [lx + 9, ly + 20], [lx - 9, ly + 20]], `rgba(255,220,150,${.6 + f * .3})`); poly(ctx, [[lx - 5, ly + 12], [lx, ly - 4], [lx + 5, ly + 12]], '#ffd37a', 0);
    [ox, oy] = bg.par(.6, w, h); const mx = w * .3 + ox, my = h * .12 + oy, mw = w * .45, mh = h * .5;
    box(ctx, mx - 8, my - 8, mw + 16, mh + 16, '#5a3a2a'); box(ctx, mx, my, mw, mh, '#d9c9a0', 2);
    const r = rnd(21); ctx.strokeStyle = '#8a7a50'; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i < 14; i++) { ctx.moveTo(mx + r() * mw, my + r() * mh); ctx.lineTo(mx + r() * mw, my + r() * mh); } ctx.stroke();
    ctx.strokeStyle = '#6a8ab0'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(mx, my + mh * .7); ctx.quadraticCurveTo(mx + mw * .4, my + mh * .4, mx + mw, my + mh * .6); ctx.stroke(); ctx.fillStyle = '#4a3a2a'; ctx.font = 'bold 11px Consolas, monospace'; ctx.fillText('PIER 7', mx + mw * .78, my + mh * .56); ctx.fillText('NORTHGATE', mx + mw * .12, my + mh * .26);
    const pins = [[.2, .3], [.55, .25], [.7, .65], [.35, .75], [.85, .4]];
    if (bg.vars.pins) { ctx.strokeStyle = 'rgba(56,232,216,.7)'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.beginPath(); pins.forEach(([px, py], i) => { const x = mx + px * mw, y = my + py * mh; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke(); ctx.setLineDash([]); }
    pins.forEach(([px, py], i) => { const x = mx + px * mw, y = my + py * mh; if (bg.vars.pins) { const a = .5 + .5 * Math.sin(t * 3 + i); bg.glow(ctx, x, y, 50, 'rgba(56,232,216,A)', a * .6 * (bg.signal + .3)); } circ(ctx, x, y, 7, '#c23b3b', 2.5); });
    box(ctx, w * .78 + ox, h * .55 + oy, 120, 100, '#5a3a2a'); line(ctx, w * .78 + ox, h * .55 + oy + 50, w * .78 + ox + 120, h * .55 + oy + 50, 2); box(ctx, w * .06 + ox, h * .6 + oy, 100, 80, '#4a3222'); line(ctx, w * .06 + ox + 50, h * .6 + oy, w * .06 + ox + 50, h * .6 + oy + 80, 2);
    planks(ctx, w, h * .74 + oy, h * .26, '#0d0a08', 5); line(ctx, 0, h * .74 + oy, w, h * .74 + oy, 3); chair(ctx, w * .3 + ox, h * .9 + oy, 1.1, '#4a3222');
    bg.dustMotes(ctx, w, h);
  },

  // Night market on the pier: lantern strings, striped stalls with signs, crowd, water.
  market(ctx, w, h, t, bg) {
    sky(ctx, w, h, '#0c0a24', '#2a1a3a'); stars(ctx, w, h * .3, 50, 77, t, bg);
    if (bg.vars.star) { const a = .5 + .5 * Math.sin(t * 2); bg.glow(ctx, w * .62, h * .12, 90, 'rgba(56,232,216,A)', a * .8); circ(ctx, w * .62, h * .12, 3, SIGNAL, 0); }
    let [ox, oy] = bg.par(.2, w, h); buildings(ctx, w, h, 5, h * .5 + oy, '#141230', h * .25, .1);
    [ox, oy] = bg.par(.5, w, h);
    const dishes = ['🫓', '🌮', '🧆', '🍝'];
    for (let i = 0; i < 4; i++) { const sx = w * (.08 + i * .23) + ox, sy = h * .42 + oy, sw = w * .18, sh = h * .22;
      bg.glow(ctx, sx + sw / 2, sy + sh * .5, 160, 'rgba(242,179,91,A)', bg.flicker(.45, .5 + i));
      box(ctx, sx, sy + 20, sw, sh, '#2a1f33'); box(ctx, sx - 6, sy + sh * .6, sw + 12, sh * .4, '#5a3a2a'); line(ctx, sx - 6, sy + sh * .6 + 10, sx + sw + 6, sy + sh * .6 + 10, 2, 'rgba(255,255,255,.2)');
      for (let k = 0; k < 6; k++) box(ctx, sx - 8 + k * (sw + 16) / 6, sy, (sw + 16) / 6, 22, k % 2 ? '#c23b3b' : '#efe4c8', 2); box(ctx, sx + sw * .25, sy + 34, sw * .5, 22, '#f6f1ea', 2); ctx.font = '16px "Segoe UI Emoji", sans-serif'; ctx.fillText(dishes[i], sx + sw * .5 - 8, sy + 51);
      box(ctx, sx + sw * .3, sy + sh * .62, 12, 12, '#e8c872', 2); box(ctx, sx + sw * .55, sy + sh * .62, 12, 12, '#c23b3b', 2); }
    lanterns(ctx, w, h * .2 + oy, t, bg);
    ctx.fillStyle = '#17132a'; ctx.fillRect(0, h * .64 + oy, w, h); line(ctx, 0, h * .64 + oy, w, h * .64 + oy, 3);
    [ox, oy] = bg.par(.8, w, h); crowd(ctx, w, h * .78 + oy, 9, ox, t, bg);
    box(ctx, 0, h * .86 + oy, w, h, '#0a0f2a', 0); line(ctx, 0, h * .86 + oy, w, h * .86 + oy, 3); for (let i = 0; i < 6; i++) { line(ctx, w * (.1 + i * .15) + Math.sin(t + i) * 6, h * .9 + oy + i * 4, w * (.1 + i * .15) + 60 + Math.sin(t + i) * 6, h * .9 + oy + i * 4, 2, 'rgba(242,179,91,.25)'); }
    box(ctx, w * .84 + ox, h * .5 + oy, 90, 40, '#2a2238'); ctx.fillStyle = '#38e8d8'; ctx.font = 'bold 14px Consolas, monospace'; ctx.fillText('PIER 7', w * .84 + ox + 18, h * .5 + oy + 26); line(ctx, w * .885 + ox, h * .5 + oy + 40, w * .885 + ox, h * .64 + oy, 4);
  },

  // Looking up from the pier: stars, milky band, pulsing star, railing and lanterns at the bottom.
  pier_sky(ctx, w, h, t, bg) {
    sky(ctx, w, h, '#02030c', '#141a3a'); stars(ctx, w, h * .85, 180, 99, t, bg);
    ctx.save(); ctx.globalAlpha = .08; poly(ctx, [[0, h * .6], [w * .5, h * .1], [w, h * .5], [w, h * .7], [w * .5, h * .3], [0, h * .8]], '#9ab0ff', 0); ctx.restore();
    if (bg.vars.star) { const x = w * .58, y = h * .3, a = .5 + .5 * Math.sin(t * 2.5); bg.glow(ctx, x, y, 140, 'rgba(56,232,216,A)', a * .9); circ(ctx, x, y, 5, SIGNAL, 0); if (!bg.reduce) { ctx.strokeStyle = SIGNAL; for (let k = 0; k < 3; k++) { const p = ((t * .4 + k / 3) % 1); ctx.globalAlpha = (1 - p) * .6 * (bg.signal + .3); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 8 + p * 220, 0, 7); ctx.stroke(); } ctx.globalAlpha = 1; } }
    let [ox, oy] = bg.par(.6, w, h); lanterns(ctx, w, h * .84 + oy, t, bg, 14, 3);
    line(ctx, 0, h * .93 + oy, w, h * .93 + oy, 5, '#2a2238'); for (let i = 0; i < 12; i++) line(ctx, w * (.04 + i * .085), h * .93 + oy, w * (.04 + i * .085), h + oy, 3, '#2a2238'); ctx.fillStyle = '#05060f'; ctx.fillRect(0, h * .97 + oy, w, h);
  },

  // Campfire at the forest edge: pines, tent, logs, flames, radio, eyes in the dark.
  camp(ctx, w, h, t, bg) {
    sky(ctx, w, h, '#03061a', '#0e1a3a'); stars(ctx, w, h * .55, 120, 31, t, bg); moon(ctx, w * .84, h * .14, 24, bg);
    let [ox, oy] = bg.par(.2, w, h); poly(ctx, [[0, h * .6 + oy], [w * .25, h * .42 + oy], [w * .5, h * .55 + oy], [w * .75, h * .66 + oy], [w, h * .5 + oy], [w, h], [0, h]], '#070c22', 3);
    [ox, oy] = bg.par(.4, w, h); pines(ctx, w, h * .72 + oy, 14, h * .18, h * .34, '#050913', 3, ox); ink(ctx, 2); // outline pines lightly
    if (bg.vars.eyes) { const rr = rnd(8); for (let i = 0; i < 4; i++) { const ex = w * (.1 + rr() * .8) + ox, ey = h * (.5 + rr() * .15) + oy; const on = bg.reduce ? 1 : (Math.sin(t * 1.3 + i * 2) > -.3 ? 1 : 0); circ(ctx, ex, ey, 2.5, `rgba(242,179,91,${on})`, 0); circ(ctx, ex + 10, ey, 2.5, `rgba(242,179,91,${on})`, 0); } }
    ctx.fillStyle = '#0a0d16'; ctx.fillRect(0, h * .72 + oy, w, h); line(ctx, 0, h * .72 + oy, w, h * .72 + oy, 3);
    // tent
    [ox, oy] = bg.par(.6, w, h); poly(ctx, [[w * .74 + ox, h * .74 + oy], [w * .86 + ox, h * .56 + oy], [w * .98 + ox, h * .74 + oy]], '#2f7b6b'); poly(ctx, [[w * .82 + ox, h * .74 + oy], [w * .86 + ox, h * .62 + oy], [w * .9 + ox, h * .74 + oy]], '#0a0d16', 2.5);
    [ox, oy] = bg.par(.8, w, h); const fx = w * .5 + ox, fy = h * .84 + oy, f = bg.flicker(.9, 1.6);
    bg.glow(ctx, fx, fy - 10, 360, 'rgba(255,150,60,A)', f * .55); bg.glow(ctx, fx, fy - 20, 120, 'rgba(255,220,120,A)', f * .8);
    for (const [cx, cy, cw] of [[w * .22, h * .86, w * .18], [w * .64, h * .86, w * .18]]) { box(ctx, cx + ox, cy + oy, cw, 18, '#4a3222'); circ(ctx, cx + ox, cy + oy + 9, 9, '#6b4a30', 2.5); }
    for (const rot of [.4, -.4]) { ctx.save(); ctx.translate(fx, fy); ctx.rotate(rot); box(ctx, -50, -7, 100, 14, '#5a3a2a', 2.5); ctx.restore(); }
    for (let k = 0; k < 3; k++) { const s = bg.reduce ? 1 : (1 + .25 * Math.sin(t * 9 + k * 2)), hh = (50 - k * 13) * s, ww = 24 - k * 5; ctx.beginPath(); ctx.moveTo(fx - ww, fy - 4); ctx.quadraticCurveTo(fx - ww * .6, fy - hh * .6, fx + (bg.reduce ? 0 : Math.sin(t * 7 + k) * 4), fy - hh); ctx.quadraticCurveTo(fx + ww * .6, fy - hh * .6, fx + ww, fy - 4); ctx.closePath(); ctx.fillStyle = ['#ff6e28', '#ffb43c', '#fff0aa'][k]; ctx.fill(); if (k === 0) { ink(ctx, 2.5); ctx.stroke(); } }
    if (!bg.reduce) { ctx.fillStyle = 'rgba(255,200,100,.8)'; for (let i = 0; i < 8; i++) { const p = (t * .5 + i / 8) % 1; ctx.fillRect(fx + Math.sin(i * 5 + t) * 20 * p, fy - 30 - p * 160, 2, 2); } }
    radioBody(ctx, w * .72 + ox, h * .86 + oy, .36, bg);
  },

  // Coast at dusk: sun, sea with waves, beach, rocks, turtle tracks, sign with a turtle.
  coast(ctx, w, h, t, bg) {
    sky(ctx, w, h, '#2a2050', '#e08a5a'); bg.glow(ctx, w * .7, h * .5, 220, 'rgba(255,200,140,A)', .6); circ(ctx, w * .7, h * .5, 28, '#ffd9a8', 3);
    let [ox, oy] = bg.par(.2, w, h); const sea = ctx.createLinearGradient(0, h * .52, 0, h * .75); sea.addColorStop(0, '#5a4a7a'); sea.addColorStop(1, '#1e2a5a'); ctx.fillStyle = sea; ctx.fillRect(0, h * .52 + oy, w, h * .25); line(ctx, 0, h * .52 + oy, w, h * .52 + oy, 2.5);
    ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 2; for (let i = 0; i < 6; i++) { const y = h * (.56 + i * .035) + oy; ctx.beginPath(); for (let x = 0; x <= w; x += 8) ctx.lineTo(x, y + Math.sin(x * .03 + t * 1.2 + i) * 3 * (bg.reduce ? 0 : 1)); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,200,140,.25)'; ctx.fillRect(w * .66, h * .53 + oy, 60, h * .2); poly(ctx, [[w * .3 + ox, h * .58 + oy], [w * .33 + ox, h * .55 + oy], [w * .36 + ox, h * .58 + oy]], '#f6f1ea', 2);
    [ox, oy] = bg.par(.6, w, h); ctx.fillStyle = '#c9a876'; ctx.beginPath(); ctx.moveTo(0, h * .72 + oy); ctx.quadraticCurveTo(w * .5, h * .66 + oy, w, h * .74 + oy); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill(); ink(ctx, 3); ctx.beginPath(); ctx.moveTo(0, h * .72 + oy); ctx.quadraticCurveTo(w * .5, h * .66 + oy, w, h * .74 + oy); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.beginPath(); ctx.moveTo(0, h * .72 + oy); ctx.quadraticCurveTo(w * .5, h * .66 + oy + Math.sin(t) * 3, w, h * .74 + oy); ctx.lineTo(w, h * .76 + oy); ctx.quadraticCurveTo(w * .5, h * .68 + oy + Math.sin(t) * 3, 0, h * .74 + oy); ctx.fill();
    for (const [rx, ry, rw, rh] of [[w * .12, h * .8, 50, 22], [w * .2, h * .84, 30, 14]]) { ctx.beginPath(); ctx.ellipse(rx + ox, ry + oy, rw, rh, 0, 0, 7); ctx.fillStyle = '#5a4a3a'; ctx.fill(); ink(ctx, 3); ctx.stroke(); }
    ctx.fillStyle = 'rgba(26,31,58,.2)'; for (let i = 0; i < 12; i++) { ctx.fillRect(w * .55 + ox + i * 14, h * .8 + oy + i * 5, 6, 3); ctx.fillRect(w * .57 + ox + i * 14, h * .8 + oy + i * 5 + 6, 6, 3); }
    [ox, oy] = bg.par(.9, w, h); const sx = w * .8 + ox, sy = h * .9 + oy; box(ctx, sx - 5, sy - 120, 10, 120, '#5a3a2a'); box(ctx, sx - 62, sy - 142, 124, 54, '#efe4c8'); ctx.fillStyle = '#2f7b6b'; ctx.beginPath(); ctx.ellipse(sx - 6, sy - 115, 22, 13, 0, 0, 7); ctx.fill(); ink(ctx, 2.5); ctx.stroke(); circ(ctx, sx + 20, sy - 115, 7, '#1f5a4a', 2.5); for (const [lx, ly] of [[-22, -104], [8, -104], [-20, -128], [6, -128]]) circ(ctx, sx + lx, sy + ly, 4, '#1f5a4a', 1.5);
    box(ctx, w * .08 + ox, h * .92 + oy, 30, 24, '#c23b3b'); ctx.beginPath(); ctx.arc(w * .08 + ox + 15, h * .92 + oy, 14, Math.PI, 0); ink(ctx, 3); ctx.stroke();
    bg.dustMotes(ctx, w, h, 'rgba(255,255,255,.25)');
  },

  attic_sky(ctx, w, h, t, bg) { atticSkyInk(ctx, w, h, t, bg, false); },
  future_attic(ctx, w, h, t, bg) { atticSkyInk(ctx, w, h, t, bg, true); },
});

function atticSkyInk(ctx, w, h, t, bg, future) {
  sky(ctx, w, h, future ? '#0a1424' : '#15111a', future ? '#102a30' : '#2a2018');
  let [ox, oy] = bg.par(.3, w, h);
  const sx = w * .36 + ox, sy = h * .06 + oy, sw = w * .28, sh = h * .3;
  box(ctx, sx, sy, sw, sh, '#03061a', 0); ctx.save(); ctx.beginPath(); ctx.rect(sx, sy, sw, sh); ctx.clip(); stars(ctx, w, h, 160, 12, t, bg); ctx.restore();
  if (bg.vars.beam) { ctx.save(); ctx.globalAlpha = .25 * bg.signal; poly(ctx, [[w * .5 + ox - 30, h * .56 + oy], [sx + sw * .35, sy], [sx + sw * .65, sy], [w * .5 + ox + 30, h * .56 + oy]], SIGNAL, 0); ctx.restore(); }
  ink(ctx, 8); ctx.strokeStyle = future ? '#2a6a70' : '#3a2d22'; ctx.strokeRect(sx, sy, sw, sh); line(ctx, sx + sw / 2, sy, sx + sw / 2, sy + sh, 8, future ? '#2a6a70' : '#3a2d22'); ink(ctx, 3); ctx.strokeRect(sx, sy, sw, sh);
  for (let i = 0; i < 7; i++) { const x = (i / 6) * w + ox; if (i === 2 || i === 3) continue; poly(ctx, [[x - 14, oy], [x + 14, oy], [w / 2 + ox + 14, -h * .25 + oy], [w / 2 + ox - 14, -h * .25 + oy]], future ? '#1a3a44' : '#3a2a1e'); }
  [ox, oy] = bg.par(.6, w, h);
  if (future) {
    for (let i = 0; i < 2; i++) { const px = w * (.06 + i * .7) + ox, py = h * .32 + oy, pw = w * .2, ph = h * .22; box(ctx, px, py, pw, ph, 'rgba(56,232,216,.08)', 0); ctx.strokeStyle = 'rgba(56,232,216,.7)'; ctx.lineWidth = 2; ctx.strokeRect(px, py, pw, ph); ctx.fillStyle = 'rgba(56,232,216,.4)'; for (let k = 0; k < 5; k++) ctx.fillRect(px + 10, py + 12 + k * 16, pw * (.3 + ((k * 37 + i * 11) % 50) / 100), 4); if (!bg.reduce) { const scan = ((t * .3 + i * .4) % 1) * ph; ctx.fillStyle = 'rgba(56,232,216,.3)'; ctx.fillRect(px, py + scan, pw, 2); } circ(ctx, px + pw - 14, py + 14, 5, SIGNAL, 0); }
    bg.glow(ctx, w * .5 + ox, h * .5 + oy, 400, 'rgba(56,232,216,A)', .2 + bg.signal * .3);
  } else {
    const f = bg.flicker(.9, 1); const lx = w * .14 + ox, ly = h * .28 + oy; line(ctx, lx, oy - 10, lx, ly - 30, 3); bg.glow(ctx, lx, ly, 380, 'rgba(242,179,91,A)', f * .5); box(ctx, lx - 14, ly - 30, 28, 8, '#2a2238'); poly(ctx, [[lx - 12, ly - 22], [lx + 12, ly - 22], [lx + 9, ly + 20], [lx - 9, ly + 20]], `rgba(255,220,150,${.6 + f * .3})`); poly(ctx, [[lx - 5, ly + 12], [lx, ly - 4], [lx + 5, ly + 12]], '#ffd37a', 0);
    box(ctx, w * .72 + ox, h * .5 + oy, 140, 110, '#5a3a2a'); line(ctx, w * .72 + ox + 70, h * .5 + oy, w * .72 + ox + 70, h * .5 + oy + 110, 2); box(ctx, w * .8 + ox, h * .38 + oy, 100, 70, '#6b4a30'); box(ctx, w * .05 + ox, h * .55 + oy, 120, 90, '#2f7b6b'); ctx.fillStyle = INK; ctx.font = 'bold 12px Segoe UI, sans-serif'; ctx.fillText('1996', w * .05 + ox + 42, h * .55 + oy + 52);
  }
  [ox, oy] = bg.par(.9, w, h); planks(ctx, w, h * .7 + oy, h * .3, future ? '#0c1c24' : '#1f1712', 7); line(ctx, 0, h * .7 + oy, w, h * .7 + oy, 3);
  const tx = w * .5 + ox, ty = h * .58 + oy;
  if (future) { box(ctx, tx - 60, ty, 120, h * .3, '#15323a'); ctx.strokeStyle = 'rgba(56,232,216,.6)'; ctx.lineWidth = 2; ctx.strokeRect(tx - 50, ty + 12, 100, h * .3 - 24); }
  else { box(ctx, tx - w * .19, ty, w * .38, 16, '#4a3222'); box(ctx, tx - w * .17, ty + 16, 12, h * .26, '#3a2a1e', 2.5); box(ctx, tx + w * .17 - 12, ty + 16, 12, h * .26, '#3a2a1e', 2.5); }
  const old = bg.signal; if (bg.vars.radio) bg.signal = Math.max(bg.signal, .5); radioBody(ctx, tx, ty, 1, bg); bg.signal = old;
  if (bg.vars.radio && !bg.reduce) { ctx.strokeStyle = SIGNAL; for (let k = 0; k < 3; k++) { const p = ((t * .6 + k / 3) % 1); ctx.globalAlpha = (1 - p) * .5; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(tx + 44, ty - 62, 16 + p * 120, 0, 7); ctx.stroke(); } ctx.globalAlpha = 1; }
  bg.dustMotes(ctx, w, h, future ? 'rgba(56,232,216,.35)' : 'rgba(242,179,91,.35)');
}

// Season 2 scenes.
function snowfall(ctx, w, h, t, bg, n = 140) {
  if (bg.reduce) return; const r = rnd(5); ctx.fillStyle = 'rgba(255,255,255,.85)';
  for (let i = 0; i < n; i++) { const sx = r() * w, sy = r() * h, sp = .3 + r() * .7, sz = 1.5 + r() * 2.5; const y = (sy + t * 40 * sp) % h, x = sx + Math.sin(t * .8 + i) * 14; ctx.beginPath(); ctx.arc(x, y, sz, 0, 7); ctx.fill(); }
}

Object.assign(PRESETS, {
  // A boarding school in the snow at night: long building with lit windows, pines, flagpole, snowfall (bg.vars.signal = turquoise window).
  snow_school(ctx, w, h, t, bg) {
    sky(ctx, w, h, '#0a1030', '#2a3a6a'); stars(ctx, w, h * .4, 60, 17, t, bg); moon(ctx, w * .14, h * .18, 28, bg);
    let [ox, oy] = bg.par(.2, w, h); poly(ctx, [[0, h * .62 + oy], [w * .3, h * .5 + oy], [w * .6, h * .6 + oy], [w, h * .54 + oy], [w, h], [0, h]], '#e8eefc', 3);
    pines(ctx, w, h * .64 + oy, 10, h * .14, h * .26, '#0d1430', 23, ox - 300); pines(ctx, w, h * .64 + oy, 6, h * .14, h * .24, '#0d1430', 29, ox + w * .55);
    [ox, oy] = bg.par(.5, w, h); const bx = w * .22 + ox, by = h * .36 + oy, bw = w * .56, bh = h * .3;
    box(ctx, bx, by, bw, bh, '#4a3a5a'); shadeRect(ctx, bx + bw * .75, by, bw * .25, bh, .22); box(ctx, bx - 10, by - 14, bw + 20, 18, '#f6f1ea'); poly(ctx, [[bx - 14, by - 10], [bx + bw / 2, by - h * .1], [bx + bw + 14, by - 10]], '#2a2238');
    box(ctx, bx + bw / 2 - 30, by - h * .16, 60, h * .16, '#5a4a6a'); poly(ctx, [[bx + bw / 2 - 36, by - h * .16], [bx + bw / 2, by - h * .24], [bx + bw / 2 + 36, by - h * .16]], '#2a2238'); clockFace(ctx, bx + bw / 2, by - h * .1, 16, '');
    for (let r = 0; r < 2; r++) for (let c = 0; c < 9; c++) { const wx = bx + 24 + c * (bw - 48) / 9, wy = by + 24 + r * (bh / 2.2); const sig = bg.vars.signal && r === 0 && c === 6; box(ctx, wx, wy, 26, 34, sig ? SIGNAL : (r * 9 + c) % 4 ? '#f2b35b' : '#0b1026', 2.5); if (sig) bg.glow(ctx, wx + 13, wy + 17, 90, 'rgba(56,232,216,A)', bg.flicker(.8, 1.2)); }
    box(ctx, bx + bw / 2 - 22, by + bh - 50, 44, 50, '#2a2238'); bg.glow(ctx, bx + bw / 2, by + bh - 20, 90, 'rgba(242,179,91,A)', .5);
    line(ctx, bx - 60, by - 20, bx - 60, by + bh, 4, '#8a8fa8'); box(ctx, bx - 60, by - 20, 36, 22, '#c23b3b', 2); circ(ctx, bx - 60, by - 24, 4, '#e8c872', 1.5);
    ctx.fillStyle = '#f3f6ff'; ctx.fillRect(0, h * .66 + oy, w, h); line(ctx, 0, h * .66 + oy, w, h * .66 + oy, 3);
    ctx.strokeStyle = 'rgba(26,31,58,.15)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(w * .5 + ox, h * .66 + oy); ctx.quadraticCurveTo(w * .4 + ox, h * .85 + oy, w * .3 + ox, h + oy); ctx.moveTo(w * .54 + ox, h * .66 + oy); ctx.quadraticCurveTo(w * .46 + ox, h * .85 + oy, w * .38 + ox, h + oy); ctx.stroke();
    snowfall(ctx, w, h, t, bg);
  },
});

Object.assign(PRESETS, {
  // Computer lab: rows of monitors glowing, a projector screen (bg.vars.screen = text), keyboards, a server rack with LEDs.
  lab(ctx, w, h, t, bg) {
    sky(ctx, w, h, '#101428', '#1a2040'); for (let x = 0; x < w; x += 40) line(ctx, x, 0, x, h * .6, 1, 'rgba(255,255,255,.04)');
    let [ox, oy] = bg.par(.2, w, h);
    const px = w * .3 + ox, py = h * .08 + oy, pw = w * .4, ph = h * .34; box(ctx, px - 8, py - 8, pw + 16, ph + 16, '#2a2238'); box(ctx, px, py, pw, ph, '#f6f1ea', 2);
    ctx.fillStyle = '#1a1f3a'; ctx.font = 'bold 16px Consolas, monospace'; ctx.fillText(bg.vars.screen || 'NORTHGATE · HOMEPAGE', px + 16, py + 30); for (let k = 0; k < 4; k++) line(ctx, px + 16, py + 52 + k * 18, px + 16 + pw * (.3 + ((k * 29) % 50) / 100), py + 52 + k * 18, 3, 'rgba(26,31,58,.35)');
    circ(ctx, px + pw - 30, py + ph - 30, 14, SIGNAL, 2.5); ctx.strokeStyle = '#38e8d8'; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= pw * .5; i += 4) ctx.lineTo(px + 16 + i, py + ph - 30 + Math.sin(i * .2 + t * 3) * 8); ctx.stroke();
    bg.glow(ctx, px + pw / 2, py + ph / 2, 300, 'rgba(255,255,255,A)', .12);
    // server rack
    box(ctx, w * .84 + ox, h * .12 + oy, w * .1, h * .46, '#1e2548'); for (let k = 0; k < 8; k++) { box(ctx, w * .85 + ox, h * .14 + oy + k * h * .055, w * .08, h * .04, '#0b1026', 1.5); for (let j = 0; j < 3; j++) { const on = bg.reduce ? 1 : (Math.sin(t * (2 + j) + k) > 0 ? 1 : .2); ctx.fillStyle = ['rgba(56,232,216,', 'rgba(242,179,91,', 'rgba(255,80,80,'][j] + on + ')'; ctx.fillRect(w * .855 + ox + j * 10, h * .15 + oy + k * h * .055, 6, 6); } }
    clockFace(ctx, w * .12 + ox, h * .16 + oy, Math.min(w, h) * .04, bg.vars.clock);
    [ox, oy] = bg.par(.6, w, h); planks(ctx, w, h * .6 + oy, h * .4, '#2a2a3c', 5); line(ctx, 0, h * .6 + oy, w, h * .6 + oy, 3);
    for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) {
      const dx = w * (.06 + c * .24) + ox + r * 24, dy = h * (.58 + r * .16) + oy;
      box(ctx, dx, dy, w * .18, 12, '#4a4a6a'); box(ctx, dx + 8, dy + 12, 6, 44, '#3a3a5a', 2); box(ctx, dx + w * .18 - 14, dy + 12, 6, 44, '#3a3a5a', 2);
      box(ctx, dx + w * .04, dy - 54, w * .1, 50, '#1a1f3a'); box(ctx, dx + w * .045, dy - 50, w * .09, 40, (r + c) % 3 ? '#143a44' : '#1e4a52', 1.5); bg.glow(ctx, dx + w * .09, dy - 30, 70, 'rgba(56,232,216,A)', .2 + .1 * Math.sin(t + c));
      for (let k = 0; k < 3; k++) line(ctx, dx + w * .055, dy - 42 + k * 10, dx + w * .055 + w * (.02 + ((k * 7 + c * 3) % 5) / 100), dy - 42 + k * 10, 2, 'rgba(56,232,216,.6)');
      box(ctx, dx + w * .085, dy - 4, 10, 4, '#2a2238', 1.5); box(ctx, dx + w * .02, dy - 10, w * .06, 8, '#2a2238', 2); for (let k = 0; k < 5; k++) line(ctx, dx + w * .025 + k * (w * .011), dy - 8, dx + w * .025 + k * (w * .011), dy - 4, 1.5, 'rgba(255,255,255,.3)');
    }
    bg.dustMotes(ctx, w, h, 'rgba(56,232,216,.25)');
  },
});

Object.assign(PRESETS, {
  // School nurse's office: bed with a curtain, eye chart, first-aid cabinet, scales, a plant.
  nurse(ctx, w, h, t, bg) {
    sky(ctx, w, h, '#dfe9ee', '#b9ccd6'); for (let x = 0; x < w; x += 40) line(ctx, x, 0, x, h * .62, 1, 'rgba(26,31,58,.06)');
    let [ox, oy] = bg.par(.2, w, h);
    const wx = w * .68 + ox, wy = h * .1 + oy, ww = w * .22, wh = h * .34; box(ctx, wx, wy, ww, wh, '#eaf4ff', 4); line(ctx, wx + ww / 2, wy, wx + ww / 2, wy + wh, 4); line(ctx, wx, wy + wh / 2, wx + ww, wy + wh / 2, 4);
    // eye chart
    box(ctx, w * .08 + ox, h * .1 + oy, w * .14, h * .34, '#f6f1ea'); ctx.fillStyle = '#1a1f3a'; ctx.textAlign = 'center'; const rows = ['E', 'F P', 'T O Z', 'L P E D', 'P E C F D']; rows.forEach((r, i) => { ctx.font = `bold ${26 - i * 4}px Consolas, monospace`; ctx.fillText(r, w * .15 + ox, h * .16 + oy + i * h * .06); }); ctx.textAlign = 'left';
    // cabinet with cross
    box(ctx, w * .5 + ox, h * .12 + oy, w * .14, h * .22, '#f6f1ea'); line(ctx, w * .57 + ox, h * .12 + oy, w * .57 + ox, h * .34 + oy, 2.5); box(ctx, w * .55 + ox, h * .19 + oy, w * .04, h * .08, '#c23b3b', 0); box(ctx, w * .54 + ox, h * .21 + oy, w * .06, h * .04, '#c23b3b', 0); circ(ctx, w * .55 + ox, h * .3 + oy, 2, INK, 0); circ(ctx, w * .59 + ox, h * .3 + oy, 2, INK, 0);
    box(ctx, w * .28 + ox, h * .44 + oy, w * .14, 6, '#8a6a4a', 2); box(ctx, w * .29 + ox, h * .44 + oy - 22, 12, 22, '#c23b3b', 2); box(ctx, w * .315 + ox, h * .44 + oy - 18, 10, 18, '#3b6b8f', 2); box(ctx, w * .335 + ox, h * .44 + oy - 26, 14, 26, '#e8c872', 2); box(ctx, w * .36 + ox, h * .44 + oy - 14, 18, 14, '#f6f1ea', 2);
    [ox, oy] = bg.par(.6, w, h); planks(ctx, w, h * .62 + oy, h * .38, '#9fb0b8', 6); line(ctx, 0, h * .62 + oy, w, h * .62 + oy, 3);
    // bed + curtain rail
    const bx = w * .08 + ox, by = h * .6 + oy; box(ctx, bx, by, w * .36, h * .14, '#f6f1ea'); box(ctx, bx, by + h * .14, w * .36, 10, '#8a8fa8'); box(ctx, bx + 8, by + h * .14 + 10, 8, h * .12, '#8a8fa8', 2); box(ctx, bx + w * .36 - 16, by + h * .14 + 10, 8, h * .12, '#8a8fa8', 2); box(ctx, bx + 12, by + 10, 56, 24, '#dfe9ee', 2); box(ctx, bx + 90, by + 6, w * .36 - 100, h * .12, '#38e8d8', 2.5);
    line(ctx, bx - 10, h * .08 + oy, bx + w * .4, h * .08 + oy, 4, '#8a8fa8'); poly(ctx, [[bx + w * .3, h * .08 + oy], [bx + w * .42, h * .08 + oy], [bx + w * .44, h * .74 + oy], [bx + w * .28, h * .74 + oy]], '#9ad0c0'); for (let k = 0; k < 4; k++) line(ctx, bx + w * .31 + k * w * .03, h * .1 + oy, bx + w * .3 + k * w * .035, h * .72 + oy, 1.5, 'rgba(26,31,58,.25)');
    // desk + scales + plant
    box(ctx, w * .56 + ox, h * .66 + oy, w * .3, 12, '#8a6a4a'); box(ctx, w * .58 + ox, h * .66 + oy + 12, 8, h * .16, '#5a3a2a', 2); box(ctx, w * .84 + ox, h * .66 + oy + 12, 8, h * .16, '#5a3a2a', 2);
    box(ctx, w * .6 + ox, h * .66 + oy - 30, 36, 30, '#f6f1ea'); circ(ctx, w * .6 + ox + 18, h * .66 + oy - 16, 9, '#dfe9ee', 2); line(ctx, w * .6 + ox + 18, h * .66 + oy - 16, w * .6 + ox + 24, h * .66 + oy - 22, 2);
    box(ctx, w * .7 + ox, h * .66 + oy - 40, 30, 40, '#f6f1ea'); box(ctx, w * .705 + ox, h * .66 + oy - 36, 20, 14, '#1a1f3a', 1.5); ctx.fillStyle = SIGNAL; ctx.font = 'bold 9px Consolas, monospace'; ctx.fillText('36.6', w * .707 + ox, h * .66 + oy - 26);
    box(ctx, w * .9 + ox, h * .78 + oy, 60, 10, '#8a8fa8'); box(ctx, w * .91 + ox, h * .7 + oy, 48, h * .08, '#f6f1ea'); plant(ctx, w * .95 + ox, h * .62 + oy, 1.1);
    bg.dustMotes(ctx, w, h, 'rgba(255,255,255,.4)');
  },
});

Object.assign(PRESETS, {
  // Mountain school in Japan at dusk: layered mountains, a wooden school with a curved roof, a big tree with a treehouse,
  // paper lanterns (bg.vars.lit), falling leaves.
  mountain_school(ctx, w, h, t, bg) {
    sky(ctx, w, h, '#2a2a5a', '#e9a06a'); bg.glow(ctx, w * .78, h * .42, 160, 'rgba(255,220,170,A)', .5); circ(ctx, w * .78, h * .42, 22, '#ffd9a8', 3);
    let [ox, oy] = bg.par(.1, w, h);
    for (let k = 0; k < 3; k++) { const col = ['#4a3f6a', '#3a3358', '#2a2846'][k], base = h * (.5 + k * .06) + oy; ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, base); for (let x = 0; x <= w; x += 20) ctx.lineTo(x, base - Math.abs(Math.sin(x * (.004 + k * .002) + k)) * h * (.22 - k * .05) - Math.sin(x * .02) * 8); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill(); ink(ctx, 2); ctx.beginPath(); ctx.moveTo(0, base); for (let x = 0; x <= w; x += 20) ctx.lineTo(x, base - Math.abs(Math.sin(x * (.004 + k * .002) + k)) * h * (.22 - k * .05) - Math.sin(x * .02) * 8); ctx.stroke(); }
    [ox, oy] = bg.par(.5, w, h);
    // school
    const sx = w * .12 + ox, sy = h * .5 + oy, sw = w * .4, sh = h * .18;
    box(ctx, sx, sy, sw, sh, '#6b4a30'); for (let k = 0; k < 6; k++) box(ctx, sx + 20 + k * (sw - 40) / 6, sy + 24, (sw - 40) / 6 - 10, sh * .5, bg.vars.lit ? '#f2b35b' : '#2a2238', 2);
    poly(ctx, [[sx - 30, sy], [sx + 10, sy - h * .08], [sx + sw - 10, sy - h * .08], [sx + sw + 30, sy]], '#2a2238'); ctx.beginPath(); ctx.moveTo(sx - 30, sy); ctx.quadraticCurveTo(sx - 10, sy - 20, sx + 10, sy - h * .08); ink(ctx, 3); ctx.stroke(); ctx.beginPath(); ctx.moveTo(sx + sw + 30, sy); ctx.quadraticCurveTo(sx + sw + 10, sy - 20, sx + sw - 10, sy - h * .08); ctx.stroke();
    box(ctx, sx + sw * .45, sy + sh - 36, 36, 36, '#2a2238', 2.5); if (bg.vars.lit) for (let k = 0; k < 3; k++) { const lx = sx + 40 + k * (sw - 80) / 2, ly = sy - h * .02; line(ctx, lx, ly - 10, lx, ly, 2); bg.glow(ctx, lx, ly + 12, 50, 'rgba(255,120,80,A)', .5 + .2 * Math.sin(t * 2 + k)); box(ctx, lx - 9, ly, 18, 24, '#e2554f', 2); line(ctx, lx - 9, ly + 8, lx + 9, ly + 8, 1.5); line(ctx, lx - 9, ly + 16, lx + 9, ly + 16, 1.5); }
    // big tree + treehouse
    const tx = w * .76 + ox, ty = h * .68 + oy; box(ctx, tx - 16, ty - h * .3, 32, h * .3, '#4a3222'); line(ctx, tx - 4, ty - h * .3, tx - 60, ty - h * .42, 10, '#4a3222'); line(ctx, tx + 4, ty - h * .3, tx + 70, ty - h * .4, 10, '#4a3222');
    for (const [cx, cy, r] of [[tx - 60, ty - h * .46, 60], [tx + 10, ty - h * .5, 70], [tx + 75, ty - h * .44, 55], [tx - 20, ty - h * .38, 50], [tx + 50, ty - h * .36, 50]]) circ(ctx, cx, cy, r, '#c25a3b', 3);
    box(ctx, tx - 44, ty - h * .34, 88, h * .1, '#8a6a4a'); poly(ctx, [[tx - 52, ty - h * .34], [tx, ty - h * .41], [tx + 52, ty - h * .34]], '#5a3a2a'); box(ctx, tx - 8, ty - h * .3, 18, h * .06, bg.vars.lit ? '#f2b35b' : '#2a2238', 2); for (let k = 0; k < 4; k++) line(ctx, tx - 20, ty - h * .22 + k * h * .05, tx + 4, ty - h * .22 + k * h * .05, 3, '#8a6a4a'); line(ctx, tx - 20, ty - h * .24, tx - 20, ty - h * .04, 3, '#8a6a4a'); line(ctx, tx + 4, ty - h * .24, tx + 4, ty - h * .04, 3, '#8a6a4a');
    if (bg.vars.lit) bg.glow(ctx, tx, ty - h * .28, 90, 'rgba(242,179,91,A)', .45);
    ctx.fillStyle = '#3a4a3a'; ctx.fillRect(0, h * .68 + oy, w, h); line(ctx, 0, h * .68 + oy, w, h * .68 + oy, 3); ctx.fillStyle = '#5a6a5a'; ctx.beginPath(); ctx.moveTo(w * .3 + ox, h * .68 + oy); ctx.quadraticCurveTo(w * .5 + ox, h * .8 + oy, w * .46 + ox, h + oy); ctx.lineTo(w * .56 + ox, h + oy); ctx.quadraticCurveTo(w * .56 + ox, h * .8 + oy, w * .36 + ox, h * .68 + oy); ctx.fill(); ink(ctx, 2); ctx.stroke();
    if (!bg.reduce) { const r = rnd(66); for (let i = 0; i < 14; i++) { const p = (t * .12 + r()) % 1; const lx = r() * w + Math.sin(t + i) * 30, ly = p * h; ctx.save(); ctx.translate(lx, ly); ctx.rotate(t * 2 + i); ctx.fillStyle = i % 2 ? '#c25a3b' : '#e8c872'; ctx.beginPath(); ctx.ellipse(0, 0, 6, 3, 0, 0, 7); ctx.fill(); ctx.restore(); } }
  },
});

Object.assign(PRESETS, {
  // Bus stop in the rain at dusk: shelter with a timetable, a bus arriving (bg.vars.bus), a pharmacy and a café across the road,
  // a cyclist, an e-scooter, puddles.
  bus_stop(ctx, w, h, t, bg) {
    sky(ctx, w, h, '#2a2a5a', '#5a4a7a');
    let [ox, oy] = bg.par(.2, w, h); buildings(ctx, w, h, 11, h * .5 + oy, '#1e1a38', h * .28, .12);
    // shops across the road
    const px = w * .06 + ox, py = h * .3 + oy; box(ctx, px, py, w * .22, h * .22, '#efe4c8'); box(ctx, px, py, w * .22, 30, '#2f7b6b'); ctx.fillStyle = '#f6f1ea'; ctx.font = 'bold 14px Segoe UI, sans-serif'; ctx.fillText('PHARMACY', px + 14, py + 21); box(ctx, px + w * .08, py + 2, 22, 26, '#2f7b6b', 0); ctx.fillStyle = '#f6f1ea'; ctx.fillRect(px + w * .08 + 9, py + 6, 4, 18); ctx.fillRect(px + w * .08 + 2, py + 13, 18, 4); box(ctx, px + 10, py + 44, w * .08, h * .14, '#cfe6ff', 2); box(ctx, px + w * .13, py + 44, w * .07, h * .14, '#5a3a2a', 2);
    const cx = w * .32 + ox; box(ctx, cx, py, w * .18, h * .22, '#8a3b5a'); box(ctx, cx, py, w * .18, 30, '#e8c872'); ctx.fillStyle = INK; ctx.fillText('CAFÉ', cx + 14, py + 21); box(ctx, cx + 10, py + 44, w * .14, h * .12, '#ffe9b8', 2); bg.glow(ctx, cx + w * .09, py + h * .1, 90, 'rgba(242,179,91,A)', .4); circ(ctx, cx + w * .05, py + h * .1, 10, '#fff6d8', 2); line(ctx, cx + w * .05 + 10, py + h * .1 - 4, cx + w * .05 + 16, py + h * .1 - 2, 2);
    ctx.fillStyle = '#1a1420'; ctx.fillRect(0, h * .52 + oy, w, h); line(ctx, 0, h * .52 + oy, w, h * .52 + oy, 3); box(ctx, 0, h * .56 + oy, w, 8, '#2a2230', 2); ctx.setLineDash([20, 16]); line(ctx, 0, h * .74 + oy, w, h * .74 + oy, 3, '#8a8fa8'); ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(242,179,91,.14)'; ctx.beginPath(); ctx.ellipse(w * .3, h * .8 + oy, 100, 8, 0, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(56,232,216,.1)'; ctx.beginPath(); ctx.ellipse(w * .7, h * .9 + oy, 80, 7, 0, 0, 7); ctx.fill();
    [ox, oy] = bg.par(.5, w, h);
    // bus
    if (bg.vars.bus) { const bx = w * .55 + ox + (bg.reduce ? 0 : Math.sin(t * .6) * 8), by = h * .66 + oy; box(ctx, bx, by - h * .22, w * .36, h * .22, '#e8c872'); for (let k = 0; k < 5; k++) box(ctx, bx + 14 + k * (w * .36 - 28) / 5, by - h * .19, (w * .36 - 28) / 5 - 8, h * .09, '#1a2042', 2); box(ctx, bx + w * .36 - 40, by - h * .1, 30, h * .1, '#1a2042', 2); box(ctx, bx + 10, by - h * .22 - 12, w * .1, 12, '#2a2238', 2); ctx.fillStyle = '#f2b35b'; ctx.font = 'bold 10px Consolas, monospace'; ctx.fillText('7 · NORTHGATE', bx + 16, by - h * .22 - 3); circ(ctx, bx + 40, by, 14, '#2a2238'); circ(ctx, bx + w * .36 - 40, by, 14, '#2a2238'); bg.glow(ctx, bx + w * .36 + 10, by - 24, 120, 'rgba(255,230,160,A)', .6); }
    // shelter
    const sx = w * .1 + ox, sy = h * .5 + oy; box(ctx, sx, sy - 10, w * .24, 12, '#2a2238'); box(ctx, sx + 6, sy, 6, h * .24, '#2a2238', 2); box(ctx, sx + w * .24 - 12, sy, 6, h * .24, '#2a2238', 2); box(ctx, sx + 14, sy + 4, w * .24 - 28, h * .16, 'rgba(200,230,255,.25)', 2);
    box(ctx, sx + 24, sy + 14, 70, 60, '#f6f1ea', 2); ctx.fillStyle = INK; ctx.font = 'bold 9px Consolas, monospace'; ctx.fillText('BUS 7', sx + 30, sy + 28); for (let k = 0; k < 3; k++) line(ctx, sx + 30, sy + 38 + k * 10, sx + 84, sy + 38 + k * 10, 1.5, 'rgba(26,31,58,.4)');
    box(ctx, sx + 20, sy + h * .16, w * .24 - 40, 8, '#5a3a2a'); line(ctx, sx + 26, sy + h * .16 + 8, sx + 26, sy + h * .24, 3); line(ctx, sx + w * .24 - 26, sy + h * .16 + 8, sx + w * .24 - 26, sy + h * .24, 3);
    circ(ctx, sx + w * .24 + 20, sy - 30, 12, '#c23b3b', 2.5); ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Segoe UI, sans-serif'; ctx.fillText('B', sx + w * .24 + 15, sy - 26); line(ctx, sx + w * .24 + 20, sy - 18, sx + w * .24 + 20, sy + h * .24, 3);
    // e-scooter + bike
    [ox, oy] = bg.par(.8, w, h); const ex = w * .42 + ox, ey = h * .92 + oy; circ(ctx, ex, ey, 8, '#2a2238'); circ(ctx, ex + 50, ey, 8, '#2a2238'); line(ctx, ex + 4, ey - 6, ex + 48, ey - 6, 4, '#38e8d8'); line(ctx, ex + 48, ey - 6, ex + 56, ey - 60, 4, '#38e8d8'); line(ctx, ex + 46, ey - 60, ex + 66, ey - 60, 4, '#38e8d8');
    const bx2 = w * .86 + ox, by2 = h * .9 + oy; circ(ctx, bx2, by2, 14, null, 2.5); circ(ctx, bx2 + 50, by2, 14, null, 2.5); line(ctx, bx2, by2, bx2 + 24, by2 - 24, 3, '#c23b3b'); line(ctx, bx2 + 24, by2 - 24, bx2 + 50, by2, 3, '#c23b3b'); line(ctx, bx2 + 24, by2 - 24, bx2 + 12, by2 - 34, 3, '#c23b3b'); line(ctx, bx2 + 50, by2, bx2 + 44, by2 - 36, 3, '#c23b3b');
    bg.rain(ctx, w, h, .8, .25);
  },
});

Object.assign(PRESETS, {
  // Supermarket: aisle with shelves of colourful goods, a world-food sign with flags, a checkout with a cashier light,
  // a trolley in the foreground, fluorescent lights.
  supermarket(ctx, w, h, t, bg) {
    sky(ctx, w, h, '#e9eef7', '#cfd8e6');
    let [ox, oy] = bg.par(.2, w, h);
    for (let i = 0; i < 4; i++) { box(ctx, w * (.08 + i * .24) + ox, 8 + oy, w * .14, 10, '#f6f1ea', 2); bg.glow(ctx, w * (.15 + i * .24) + ox, 14 + oy, 120, 'rgba(255,255,255,A)', .35); }
    box(ctx, w * .3 + ox, h * .08 + oy, w * .4, 44, '#2f7b6b'); ctx.fillStyle = '#f6f1ea'; ctx.font = 'bold 18px Segoe UI, sans-serif'; ctx.fillText('WORLD FOOD', w * .34 + ox, h * .08 + oy + 29); ['🇹🇷', '🇮🇹', '🇯🇵', '🇲🇽', '🇪🇬'].forEach((f, k) => { ctx.font = '18px "Segoe UI Emoji", sans-serif'; ctx.fillText(f, w * .52 + ox + k * 30, h * .08 + oy + 30); });
    // shelves
    [ox, oy] = bg.par(.4, w, h); const pal = ['#c23b3b', '#e8c872', '#2f7b6b', '#3b6b8f', '#8a7fe8', '#f2b35b', '#e2554f'];
    for (let r = 0; r < 3; r++) { const y = h * (.2 + r * .15) + oy; box(ctx, w * .04 + ox, y + h * .1, w * .92, 10, '#8a8fa8', 2); const rr = rnd(r * 7 + 3); let x = w * .06 + ox; while (x < w * .94 + ox) { const bw = 16 + rr() * 18, bh = h * .05 + rr() * h * .05; box(ctx, x, y + h * .1 - bh, bw, bh, pal[Math.floor(rr() * pal.length)], 1.5); if (rr() > .5) box(ctx, x + 3, y + h * .1 - bh + 4, bw - 6, bh * .3, 'rgba(255,255,255,.6)', 0); x += bw + 4; } }
    box(ctx, w * .04 + ox, h * .2 + oy - 10, 8, h * .5, '#5a6a8a', 2); box(ctx, w * .96 + ox - 8, h * .2 + oy - 10, 8, h * .5, '#5a6a8a', 2);
    for (let k = 0; k < 4; k++) { box(ctx, w * (.1 + k * .24) + ox, h * .62 + oy, 44, 18, '#f6f1ea', 1.5); ctx.fillStyle = '#c23b3b'; ctx.font = 'bold 10px Consolas, monospace'; ctx.fillText(['₺12', '€3', '¥400', '$2'][k], w * (.1 + k * .24) + ox + 8, h * .62 + oy + 13); }
    // floor
    [ox, oy] = bg.par(.6, w, h); ctx.fillStyle = '#dfe6ee'; ctx.fillRect(0, h * .68 + oy, w, h); line(ctx, 0, h * .68 + oy, w, h * .68 + oy, 3); for (let x = -40; x < w; x += 60) line(ctx, x + ox, h * .68 + oy, x - 60 + ox, h + oy, 1, 'rgba(26,31,58,.12)'); for (let y = h * .72; y < h; y += 30) line(ctx, 0, y + oy, w, y + oy, 1, 'rgba(26,31,58,.12)');
    // checkout
    box(ctx, w * .7 + ox, h * .66 + oy, w * .26, h * .14, '#3b6b8f'); box(ctx, w * .72 + ox, h * .66 + oy - 50, 40, 50, '#1a1f3a', 2); box(ctx, w * .725 + ox, h * .66 + oy - 46, 30, 22, '#38e8d8', 1.5); line(ctx, w * .9 + ox, h * .66 + oy, w * .9 + ox, h * .5 + oy, 4, '#8a8fa8'); circ(ctx, w * .9 + ox, h * .5 + oy, 10, `rgba(242,179,91,${bg.flicker(.9, .5)})`, 2); ctx.fillStyle = '#f6f1ea'; ctx.font = 'bold 12px Segoe UI, sans-serif'; ctx.fillText('CASHIER', w * .73 + ox, h * .66 + oy + 40);
    // trolley
    [ox, oy] = bg.par(.9, w, h); const tx = w * .14 + ox, ty = h * .9 + oy; ink(ctx, 3); ctx.strokeStyle = '#8a8fa8'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(tx, ty - 90); ctx.lineTo(tx + 20, ty - 90); ctx.lineTo(tx + 34, ty - 30); ctx.lineTo(tx + 130, ty - 30); ctx.lineTo(tx + 140, ty - 80); ctx.lineTo(tx + 34, ty - 80); ctx.stroke(); for (let k = 1; k < 5; k++) line(ctx, tx + 34 + k * 20, ty - 80, tx + 34 + k * 20, ty - 30, 2, '#8a8fa8'); circ(ctx, tx + 44, ty - 12, 9, '#2a2238'); circ(ctx, tx + 124, ty - 12, 9, '#2a2238'); line(ctx, tx + 44, ty - 30, tx + 44, ty - 20, 3, '#8a8fa8'); line(ctx, tx + 124, ty - 30, tx + 124, ty - 20, 3, '#8a8fa8');
    box(ctx, tx + 50, ty - 100, 24, 22, '#c23b3b', 2); box(ctx, tx + 80, ty - 96, 30, 18, '#e8c872', 2); circ(ctx, tx + 112, ty - 92, 10, '#2f7b6b', 2);
    bg.dustMotes(ctx, w, h, 'rgba(255,255,255,.5)');
  },
});

Object.assign(PRESETS, {
  // School rooftop at noon: solar panels, wind turbines on the hills (spinning), rain barrels, a vegetable bed, the signal mast.
  // bg.vars.dry = brown hills and a low river (the problem); otherwise green.
  green_roof(ctx, w, h, t, bg) {
    const dry = bg.vars.dry; sky(ctx, w, h, dry ? '#c9a06a' : '#5aa0d8', dry ? '#e8d2a8' : '#cfe6ff');
    bg.glow(ctx, w * .82, h * .14, 160, 'rgba(255,240,200,A)', .7); circ(ctx, w * .82, h * .14, 26, '#fff6d8', 3);
    let [ox, oy] = bg.par(.15, w, h);
    poly(ctx, [[0, h * .5 + oy], [w * .2, h * .36 + oy], [w * .45, h * .46 + oy], [w * .7, h * .34 + oy], [w, h * .44 + oy], [w, h * .6 + oy], [0, h * .6 + oy]], dry ? '#b08a50' : '#5a9a5a', 3);
    for (let k = 0; k < 3; k++) { const tx = w * (.2 + k * .25) + ox, ty = h * (.36 + (k % 2) * .08) + oy, r = 34; line(ctx, tx, ty, tx, ty + 70, 5, '#f6f1ea'); line(ctx, tx, ty, tx, ty + 70, 2); circ(ctx, tx, ty, 5, '#f6f1ea', 2); for (let b = 0; b < 3; b++) { const a = (bg.reduce ? 0 : t * 1.5) + b * Math.PI * 2 / 3 + k; ctx.save(); ctx.translate(tx, ty); ctx.rotate(a); poly(ctx, [[0, 0], [6, -r * .4], [0, -r], [-6, -r * .4]], '#f6f1ea', 2); ctx.restore(); } }
    // river
    ctx.fillStyle = dry ? '#8aa0b0' : '#3b6b8f'; ctx.beginPath(); ctx.moveTo(w * .5 + ox, h * .6 + oy); ctx.quadraticCurveTo(w * .62 + ox, h * .5 + oy, w * .74 + ox, h * .56 + oy); ctx.lineTo(w * .78 + ox, h * .6 + oy); ctx.quadraticCurveTo(w * .62 + ox, h * (dry ? .55 : .53) + oy, w * .56 + ox, h * .6 + oy); ctx.fill();
    // roof
    [ox, oy] = bg.par(.5, w, h); box(ctx, 0, h * .6 + oy, w, h, '#8a8fa8', 0); line(ctx, 0, h * .6 + oy, w, h * .6 + oy, 3); box(ctx, 0, h * .6 + oy, w, 16, '#5a6a8a', 2);
    for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) { const px = w * (.06 + c * .17) + ox + r * 30, py = h * (.68 + r * .12) + oy; poly(ctx, [[px, py + 40], [px + w * .14, py + 40], [px + w * .14 + 16, py], [px + 16, py]], '#1a2a5a', 3); for (let k = 1; k < 4; k++) line(ctx, px + 4 + k * (w * .14 / 4), py + 40, px + 20 + k * (w * .14 / 4), py, 1.5, 'rgba(120,160,255,.6)'); line(ctx, px + 8, py + 20, px + w * .14 + 8, py + 20, 1.5, 'rgba(120,160,255,.6)'); }
    // rain barrels + vegetable bed
    for (let k = 0; k < 2; k++) { const bx = w * .78 + ox + k * 60, by = h * .74 + oy; box(ctx, bx, by, 44, 56, '#2f7b6b'); ctx.fillStyle = '#256b5b'; ctx.beginPath(); ctx.ellipse(bx + 22, by, 22, 7, 0, 0, 7); ctx.fill(); ink(ctx, 2.5); ctx.stroke(); line(ctx, bx, by + 18, bx + 44, by + 18, 2, 'rgba(26,31,58,.4)'); line(ctx, bx, by + 38, bx + 44, by + 38, 2, 'rgba(26,31,58,.4)'); }
    box(ctx, w * .76 + ox, h * .86 + oy, w * .2, 40, '#5a3a2a'); box(ctx, w * .765 + ox, h * .86 + oy + 4, w * .19, 32, '#6b4a30', 0); for (let k = 0; k < 6; k++) { const vx = w * .78 + ox + k * (w * .18 / 6); for (let j = 0; j < 3; j++) { ctx.save(); ctx.translate(vx + 10, h * .86 + oy + 6); ctx.rotate((j - 1) * .5); ctx.beginPath(); ctx.ellipse(0, -10, 4, 10, 0, 0, 7); ctx.fillStyle = '#3f9b7b'; ctx.fill(); ink(ctx, 1.5); ctx.stroke(); ctx.restore(); } }
    // signal mast on the roof
    line(ctx, w * .05 + ox, h * .6 + oy, w * .05 + ox, h * .3 + oy, 4, '#5a6a8a'); line(ctx, w * .05 + ox, h * .6 + oy, w * .05 + ox, h * .3 + oy, 1.5); circ(ctx, w * .05 + ox, h * .3 + oy, 6, `rgba(56,232,216,${.5 + bg.signal * .5})`, 2); bg.glow(ctx, w * .05 + ox, h * .3 + oy, 60 + bg.signal * 100, 'rgba(56,232,216,A)', .3 + bg.signal * .5);
    if (!bg.reduce && !dry) { ctx.fillStyle = 'rgba(255,255,255,.8)'; for (let i = 0; i < 2; i++) { const bx = w * (.3 + i * .3) + Math.sin(t * .4 + i) * 40, by = h * .2 + Math.cos(t * .3 + i) * 10; for (const [dx, dy, r] of [[0, 0, 22], [-24, 8, 16], [26, 8, 16], [-4, 12, 14]]) circ(ctx, bx + dx, by + dy, r, '#fff', 2); } }
    bg.dustMotes(ctx, w, h, 'rgba(255,255,255,.45)');
  },
});

Object.assign(PRESETS, {
  // School observatory at night: a dome with an open slit, a big telescope, a star chart on the wall, a desk with a laptop,
  // through the slit: stars, the Milky Way and a moving light (bg.vars.ship).
  observatory(ctx, w, h, t, bg) {
    sky(ctx, w, h, '#0a0c1e', '#141a3a');
    let [ox, oy] = bg.par(.2, w, h);
    // dome interior (big arc) with open slit
    ctx.fillStyle = '#1a1f3a'; ctx.beginPath(); ctx.arc(w * .5 + ox, h * .75 + oy, w * .55, Math.PI, 0); ctx.fill(); ink(ctx, 3); ctx.beginPath(); ctx.arc(w * .5 + ox, h * .75 + oy, w * .55, Math.PI, 0); ctx.stroke();
    for (let k = 1; k < 6; k++) { ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(w * .5 + ox, h * .75 + oy, w * .55 * (k / 6), Math.PI, 0); ctx.stroke(); }
    const sx = w * .42 + ox, sw = w * .16; ctx.save(); ctx.beginPath(); ctx.rect(sx, 0, sw, h * .75 + oy); ctx.clip(); sky(ctx, w, h, '#02030c', '#0a1030'); stars(ctx, w, h * .75, 120, 55, t, bg); ctx.save(); ctx.globalAlpha = .12; poly(ctx, [[sx, h * .5], [sx + sw, h * .1], [sx + sw, h * .3], [sx, h * .7]], '#9ab0ff', 0); ctx.restore();
    if (bg.vars.ship) { const p = ((t * .08) % 1); const lx = sx + p * sw, ly = h * .12 + Math.sin(p * 6) * 20; bg.glow(ctx, lx, ly, 60, 'rgba(56,232,216,A)', .8); circ(ctx, lx, ly, 3, SIGNAL, 0); line(ctx, lx - 30, ly + 4, lx, ly, 2, 'rgba(56,232,216,.5)'); }
    ctx.restore(); line(ctx, sx, 0, sx, h * .75 + oy, 4, '#2a3356'); line(ctx, sx + sw, 0, sx + sw, h * .75 + oy, 4, '#2a3356');
    // star chart
    box(ctx, w * .06 + ox, h * .22 + oy, w * .22, h * .3, '#0b1026'); const r = rnd(44); ctx.fillStyle = '#e8c872'; for (let i = 0; i < 24; i++) { const cx = w * .07 + ox + r() * w * .2, cy = h * .23 + oy + r() * h * .28; ctx.beginPath(); ctx.arc(cx, cy, 1.5 + r() * 1.5, 0, 7); ctx.fill(); } ctx.strokeStyle = 'rgba(232,200,114,.5)'; ctx.lineWidth = 1; ctx.beginPath(); for (let i = 0; i < 6; i++) ctx.lineTo(w * .08 + ox + i * w * .035, h * .3 + oy + Math.sin(i * 1.3) * h * .08); ctx.stroke(); ctx.fillStyle = '#f6f1ea'; ctx.font = 'bold 10px Consolas, monospace'; ctx.fillText('SKY CHART · 2100', w * .07 + ox + 6, h * .22 + oy + h * .3 - 8);
    [ox, oy] = bg.par(.5, w, h); planks(ctx, w, h * .75 + oy, h * .25, '#10142a', 4); line(ctx, 0, h * .75 + oy, w, h * .75 + oy, 3);
    // telescope
    const tx = w * .5 + ox, ty = h * .72 + oy; ctx.save(); ctx.translate(tx, ty); ctx.rotate(-.9); box(ctx, -18, -h * .5, 36, h * .5, '#f6f1ea'); box(ctx, -22, -h * .5, 44, 30, '#8a8fa8', 2.5); box(ctx, -12, -20, 24, 20, '#2a2238', 2.5); ctx.restore(); line(ctx, tx - 50, ty, tx, ty - 60, 6, '#8a8fa8'); line(ctx, tx + 50, ty, tx, ty - 60, 6, '#8a8fa8'); line(ctx, tx, ty - 60, tx, ty + 10, 6, '#8a8fa8'); box(ctx, tx - 60, ty, 120, 12, '#5a6a8a');
    // desk + laptop
    box(ctx, w * .7 + ox, h * .68 + oy, w * .24, 10, '#5a3a2a'); box(ctx, w * .72 + ox, h * .78 + oy, 8, h * .14, '#3a2a1e', 2); box(ctx, w * .9 + ox, h * .78 + oy, 8, h * .14, '#3a2a1e', 2); box(ctx, w * .76 + ox, h * .68 + oy - 34, 60, 34, '#2a2238'); box(ctx, w * .765 + ox, h * .68 + oy - 30, 50, 26, '#143a44', 1.5); ctx.strokeStyle = '#38e8d8'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let i = 0; i <= 44; i += 3) ctx.lineTo(w * .77 + ox + i, h * .68 + oy - 17 + Math.sin(i * .3 + t * 3) * 6); ctx.stroke(); bg.glow(ctx, w * .79 + ox, h * .64 + oy, 70, 'rgba(56,232,216,A)', .3);
    ctx.fillStyle = '#e8c872'; ctx.font = 'bold 11px Consolas, monospace'; ctx.textAlign = 'left'; ctx.fillText(bg.vars.clock || '', w * .74 + ox, h * .68 + oy + 24);
    bg.dustMotes(ctx, w, h, 'rgba(56,232,216,.3)');
  },
});
