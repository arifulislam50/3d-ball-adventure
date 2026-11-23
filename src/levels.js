// Procedural but deterministic level layouts: every level is different,
// and the same level always looks the same.
import { TOTAL_LEVELS, themeForLevel } from './config.js';

function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const lerp = (a, b, t) => a + (b - a) * t;

// Position on a segment at world z.
export function segAt(s, z) {
  const t = (s.z0 - z) / (s.z0 - s.z1);
  return { t, x: lerp(s.cx0, s.cx1, t), y: lerp(s.y0, s.y1, t) };
}

export function generateLevel(n) {
  const r = rng(n * 9973 + 17);
  const pick = (arr) => arr[Math.floor(r() * arr.length)];
  const theme = themeForLevel(n);
  const d = (n - 1) / (TOTAL_LEVELS - 1); // difficulty 0..1
  const speed = 7 + d * 5;
  const targetLen = 140 + n * 9;
  const icy = theme === 'ice';

  const segs = [], coins = [], gems = [], powerups = [], obstacles = [], deco = [];
  let z = 10, x = 0, y = 0;

  const add = (len, o = {}) => {
    const s = { z0: z, z1: z - len, cx0: x, cx1: x + (o.dx || 0), y0: y, y1: y + (o.dy || 0),
      w: o.w || 4.5, type: o.type || (icy ? 'ice' : 'normal'), amp: o.amp || 0, freq: o.freq || 0, phase: r() * 6.28 };
    segs.push(s); z -= len; x += o.dx || 0; y += o.dy || 0; return s;
  };
  const coinLine = (s, count, off = 0) => {
    for (let i = 0; i < count; i++) {
      const zz = lerp(s.z0 - 1.5, s.z1 + 1.5, count === 1 ? 0.5 : i / (count - 1));
      const p = segAt(s, zz);
      coins.push({ x: p.x + off, y: p.y + 1, z: zz, seg: s.type === 'moving' ? s : null });
    }
  };
  const coinArc = (z0, len, x0, y0, count = 4) => {
    for (let i = 1; i <= count; i++) {
      const t = i / (count + 1);
      coins.push({ x: x0, y: y0 + 1 + Math.sin(t * Math.PI) * 1.8, z: z0 - len * t });
    }
  };
  const width = () => lerp(5.2, 3.4, d) + r() * 0.8;
  const lane = (w) => pick([-1, 0, 1]) * (w / 2 - 1);

  // Start platform
  const start = add(18, { w: 6, type: 'normal' });
  coinLine(start, 3, 0);

  const pieces = [
    { min: 1, w: 3, fn: () => { // straight with optional bumper/spikes
      const w = width(), s = add(12 + r() * 6, { w });
      coinLine(s, 5, lane(w));
      if (n >= 1 && r() < 0.45 + d * 0.3) obstacles.push({ type: 'bumper', seg: s, z: lerp(s.z0, s.z1, 0.5), range: w / 2 - 0.7, speed: 1.2 + d * 1.6, phase: r() * 6 });
      else if (n >= 3 && r() < 0.6) {
        const zz = lerp(s.z0, s.z1, 0.6), p = segAt(s, zz), lanes = [-1, 0, 1], free = pick(lanes);
        lanes.filter((l) => l !== free).forEach((l) => obstacles.push({ type: 'spike', x: p.x + l * (w / 3), y: p.y, z: zz }));
      }
    } },
    { min: 2, w: 2, fn: () => { // narrow bridge
      const s = add(9 + r() * 5, { w: 2.3, type: 'bridge' }); coinLine(s, 4, 0);
    } },
    { min: 2, w: 2, fn: () => { // jump gap
      const g = 2.2 + d * 1.8 + r() * 0.6;
      coinArc(z, g, x, y, 4); z -= g;
      const s = add(9, { w: 4.5 }); coinLine(s, 3, 0);
    } },
    { min: 3, w: 2, fn: () => { // zig-zag
      const w = width() - 0.3, dx1 = (r() < 0.5 ? -1 : 1) * (1.5 + r() * 1.8);
      const a = add(11, { w, dx: dx1 }); coinLine(a, 4, 0);
      const b = add(11, { w, dx: -dx1 }); coinLine(b, 4, 0);
    } },
    { min: 4, w: 1.5, fn: () => { // ramp up, plateau, down
      const w = width(), h = 1.4 + r() * 1.2;
      coinLine(add(9, { w, dy: h }), 3, 0);
      const top = add(7, { w }); coinLine(top, 3, lane(w));
      if (r() < 0.5) powerups.push({ kind: pick(['speed', 'shield', 'magnet']), x: segAt(top, lerp(top.z0, top.z1, 0.5)).x, y: y + 1.3, z: lerp(top.z0, top.z1, 0.5) });
      coinLine(add(9, { w, dy: -h }), 3, 0);
    } },
    { min: 5, w: 1.5, fn: () => { // swinging hammer
      const s = add(15, { w: 4.2 }); coinLine(s, 5, 0);
      const zz = lerp(s.z0, s.z1, 0.5);
      obstacles.push({ type: 'hammer', x: segAt(s, zz).x, y: segAt(s, zz).y, z: zz, speed: 1.6 + d * 1.3, phase: r() * 6 });
    } },
    { min: 6, w: 1.4, fn: () => { // moving platforms
      for (let i = 0; i < 3; i++) {
        z -= 1.3;
        const s = add(4.5, { w: 3, type: 'moving', amp: 1.1 + d, freq: 1.1 + d * 0.8 }); coinLine(s, 2, 0);
      }
      z -= 1.3; add(8, { w: 4.5 });
    } },
    { min: 8, w: 1.2, fn: () => { // rolling boulder
      const w = 4.4, s = add(26, { w }); coinLine(s, 6, lane(w));
      obstacles.push({ type: 'boulder', seg: s, x: segAt(s, s.z1 + 2).x + lane(w) * 0.6, z: s.z1 + 2, speed: 5 + d * 3 });
    } },
  ];

  let sincePower = 0;
  while (10 - z < targetLen) {
    const avail = pieces.filter((p) => n >= p.min);
    const total = avail.reduce((a, p) => a + p.w, 0);
    let k = r() * total, chosen = avail[0];
    for (const p of avail) { k -= p.w; if (k <= 0) { chosen = p; break; } }
    chosen.fn();
    sincePower++;
    if (sincePower >= 4 && r() < 0.5) {
      const s = add(8, { w: 4.5 });
      const zz = lerp(s.z0, s.z1, 0.5);
      powerups.push({ kind: pick(['speed', 'shield', 'magnet']), x: segAt(s, zz).x, y: y + 1.3, z: zz });
      sincePower = 0;
    }
  }
  const end = add(16, { w: 7, type: 'normal' });
  const finishZ = end.z0 - 8;
  gems.push({ x: end.cx0, y: y + 1.2, z: end.z0 - 3 });

  // Checkpoints at roughly 1/3 and 2/3 of the run, on wide static segments.
  const checkpoints = [];
  for (const frac of [0.34, 0.67]) {
    const want = 10 - (10 - finishZ) * frac;
    let best = null;
    for (const s of segs) if (s.type !== 'moving' && s.w >= 3.5 && s.y0 === s.y1 && s.z0 < 0) {
      if (!best || Math.abs(s.z0 - want) < Math.abs(best.z0 - want)) best = s;
    }
    if (best && !checkpoints.find((c) => c.seg === best)) checkpoints.push({ seg: best, x: best.cx0, y: best.y0, z: best.z0 - 1.5 });
  }

  // Scenery positions beside the track.
  for (const s of segs) {
    for (let zz = s.z0; zz > s.z1; zz -= 7) {
      const p = segAt(s, zz);
      for (const side of [-1, 1]) if (r() < 0.75) deco.push({ x: p.x + side * (s.w / 2 + 3 + r() * 4), y: p.y - 0.6 - r() * 1.5, z: zz + r() * 3, r: r(), side });
    }
  }

  return { n, theme, speed, segs, coins, gems, powerups, obstacles, checkpoints, deco, finishZ, icy, length: 10 - finishZ };
}
