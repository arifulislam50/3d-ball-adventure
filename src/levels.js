// Procedural but deterministic track generator. The same level always looks
// the same; Endless mode keeps asking the generator for more track.
import { WORLDS, LEVELS_PER_WORLD, difficulty } from './config.js';

function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const lerp = (a, b, t) => a + (b - a) * t;
export function segAt(s, z) {
  const t = (s.z0 - z) / (s.z0 - s.z1);
  return { t, x: lerp(s.cx0, s.cx1, t), y: lerp(s.y0, s.y1, t) };
}

const POWERS = (d) => ['speed', 'shield', 'magnet', 'x2', 'coinrain', ...(d >= 0.06 ? ['double'] : []), ...(d >= 0.12 ? ['fly'] : []), ...(d >= 0.18 ? ['slow'] : []), ...(d >= 0.25 ? ['ghost', 'star'] : [])];

export class TrackGen {
  constructor(seed, theme, d, boss = false) {
    this.r = rng(seed); this.theme = theme; this.d = d; this.boss = boss;
    this.icy = theme === 'ice'; this.z = 10; this.x = 0; this.y = 0; this.sincePower = 0;
    this.out = this.fresh();
  }
  fresh() { return { segs: [], coins: [], gems: [], powerups: [], obstacles: [], pads: [], deco: [], checkpoints: [], chests: [] }; }
  take() { this.decorate(this.out); const o = this.out; this.out = this.fresh(); return o; }
  pick(a) { return a[Math.floor(this.r() * a.length)]; }
  add(len, o = {}) {
    const s = { z0: this.z, z1: this.z - len, cx0: this.x, cx1: this.x + (o.dx || 0), y0: this.y, y1: this.y + (o.dy || 0),
      w: o.w || 4.5, type: o.type || (this.icy ? 'ice' : 'normal'), amp: o.amp || 0, freq: o.freq || 0, phase: this.r() * 6.28, wind: o.wind || 0 };
    this.out.segs.push(s); this.z -= len; this.x += o.dx || 0; this.y += o.dy || 0; return s;
  }
  coinLine(s, count, off = 0) {
    for (let i = 0; i < count; i++) {
      const zz = lerp(s.z0 - 1.5, s.z1 + 1.5, count === 1 ? 0.5 : i / (count - 1)), p = segAt(s, zz);
      this.out.coins.push({ x: p.x + off, y: p.y + 1, z: zz, seg: s.type === 'moving' ? s : null });
    }
  }
  coinArc(len, h = 1.8, count = 4) {
    for (let i = 1; i <= count; i++) { const t = i / (count + 1); this.out.coins.push({ x: this.x, y: this.y + 1 + Math.sin(t * Math.PI) * h, z: this.z - len * t }); }
  }
  width() { return lerp(5.2, 3.4, this.d) + this.r() * 0.8; }
  lane(w) { return this.pick([-1, 0, 1]) * (w / 2 - 1); }
  power(s, zz) {
    const p = segAt(s, zz);
    this.out.powerups.push({ kind: this.pick(POWERS(this.d)), x: p.x, y: p.y + 1.3, z: zz });
  }

  start() { const s = this.add(18, { w: 6, type: 'normal' }); this.coinLine(s, 3, 0); }

  pieces() {
    const d = this.d, R = () => this.r(), O = this.out.obstacles;
    const obstacleBoost = this.boss ? 0.25 : 0;
    return [
      { min: 0, w: 3, fn: () => { // straight with bumper / spikes / boost
        const w = this.width(), s = this.add(12 + R() * 6, { w }); this.coinLine(s, 5, this.lane(w));
        const roll = R();
        if (roll < 0.45 + d * 0.3 + obstacleBoost) O.push({ type: 'bumper', seg: s, z: lerp(s.z0, s.z1, 0.5), range: w / 2 - 0.7, speed: 1.2 + d * 1.6, phase: R() * 6 });
        else if (d >= 0.06 && roll < 0.85) {
          const zz = lerp(s.z0, s.z1, 0.6), p = segAt(s, zz), free = this.pick([-1, 0, 1]);
          [-1, 0, 1].filter((l) => l !== free).forEach((l) => O.push({ type: 'spike', x: p.x + l * (w / 3), y: p.y, z: zz }));
        } else { const zz = lerp(s.z0, s.z1, 0.3), p = segAt(s, zz); this.out.pads.push({ type: 'boost', x: p.x, y: p.y, z: zz }); }
      } },
      { min: 0.03, w: 2, fn: () => { const s = this.add(9 + R() * 5, { w: 2.3, type: 'bridge' }); this.coinLine(s, 4, 0); } },
      { min: 0.03, w: 2, fn: () => { // jump gap
        const g = 2.2 + d * 1.8 + R() * 0.6; this.coinArc(g); this.z -= g;
        const s = this.add(9, { w: 4.5 }); this.coinLine(s, 3, 0);
      } },
      { min: 0.08, w: 2, fn: () => { // zig-zag
        const w = this.width() - 0.3, dx = (R() < 0.5 ? -1 : 1) * (1.5 + R() * 1.8);
        this.coinLine(this.add(11, { w, dx }), 4, 0); this.coinLine(this.add(11, { w, dx: -dx }), 4, 0);
      } },
      { min: 0.1, w: 1.5, fn: () => { // jump pad + big gap
        const s = this.add(9, { w: 4.2 }); const pz = s.z1 + 3, p = segAt(s, pz);
        const g = 6 + R() * 2.5;
        this.out.pads.push({ type: 'jump', x: p.x, y: p.y, z: pz, gap: g + 3 }); this.coinLine(s, 2, 0);
        this.coinArc(g, 4.2, 6); this.z -= g;
        this.coinLine(this.add(10, { w: 4.8 }), 3, 0);
      } },
      { min: 0.12, w: 1.5, fn: () => { // ramp
        const w = this.width(), h = 1.4 + R() * 1.2;
        this.coinLine(this.add(9, { w, dy: h }), 3, 0);
        const top = this.add(7, { w }); this.coinLine(top, 3, this.lane(w));
        if (R() < 0.5) this.power(top, lerp(top.z0, top.z1, 0.5));
        this.coinLine(this.add(9, { w, dy: -h }), 3, 0);
      } },
      { min: 0.15, w: 1.3, fn: () => { // laser gate
        const s = this.add(14, { w: 4.4 }); this.coinLine(s, 5, 0);
        const zz = lerp(s.z0, s.z1, 0.5), p = segAt(s, zz);
        O.push({ type: 'laser', x: p.x, y: p.y, z: zz, w: s.w, period: 2.6 - d * 0.6, phase: R() * 3 });
      } },
      { min: 0.18, w: 1.5, fn: () => { // swinging hammer
        const s = this.add(15, { w: 4.2 }); this.coinLine(s, 5, 0);
        const zz = lerp(s.z0, s.z1, 0.5), p = segAt(s, zz);
        O.push({ type: 'hammer', x: p.x, y: p.y, z: zz, speed: 1.6 + d * 1.3, phase: R() * 6 });
      } },
      { min: 0.2, w: 1.3, fn: () => { // crumbling tiles
        const n = 4 + Math.floor(R() * 3);
        for (let i = 0; i < n; i++) { const s = this.add(3, { w: 3.6, type: 'crumble' }); this.coinLine(s, 1, 0); this.z -= 0.12; }
        this.add(6, { w: 4.5 });
      } },
      { min: 0.25, w: 1.4, fn: () => { // moving platforms
        // the three platforms move together (like a swinging bridge) so a jump between them is always fair
        const amp = 0.9 + d * 0.8, freq = 1.1 + d * 0.7, ph = R() * 6.28;
        for (let i = 0; i < 3; i++) { this.z -= 0.8; const s = this.add(4.5, { w: 3.2, type: 'moving', amp, freq }); s.phase = ph; this.coinLine(s, 2, 0); }
        this.z -= 0.8; this.add(8, { w: 4.5 });
      } },
      { min: 0.3, w: 1.2, fn: () => { // rolling boulder
        const w = 4.4, s = this.add(26, { w }); this.coinLine(s, 6, this.lane(w));
        O.push({ type: 'boulder', seg: s, x: segAt(s, s.z1 + 2).x + this.lane(w) * 0.6, z: s.z1 + 2, speed: 5 + d * 3 });
      } },
      { min: 0.1, w: 1.3, fn: () => { // spinning saw sliding sideways
        const w = this.width(), s = this.add(13, { w }); this.coinLine(s, 4, this.lane(w));
        O.push({ type: 'saw', seg: s, z: lerp(s.z0, s.z1, 0.55), range: w / 2 - 0.6, speed: 1.4 + d * 1.8, phase: R() * 6 });
      } },
      { min: 0.12, w: 1.2, fn: () => { // low sweeper bar rotating: jump over it
        const s = this.add(14, { w: 4.6 }); this.coinLine(s, 4, 0);
        const zz = lerp(s.z0, s.z1, 0.5), p = segAt(s, zz);
        O.push({ type: 'sweeper', x: p.x, y: p.y, z: zz, len: 2.1, speed: (R() < 0.5 ? -1 : 1) * (1.4 + d * 1.4), phase: R() * 6 });
      } },
      { min: 0.15, w: 1.2, fn: () => { // wall with one opening
        const w = 4.6, s = this.add(13, { w }); const zz = lerp(s.z0, s.z1, 0.55), p = segAt(s, zz), hole = this.pick([-1, 0, 1]);
        this.coinLine(s, 4, hole * (w / 3));
        O.push({ type: 'wall', x: p.x, y: p.y, z: zz, w, hole: hole * (w / 3) });
      } },
      { min: 0.18, w: 1.2, fn: () => { // spikes popping out of the floor
        const s = this.add(14, { w: 4.4 }); this.coinLine(s, 5, 0);
        const zz = lerp(s.z0, s.z1, 0.5), p = segAt(s, zz);
        O.push({ type: 'popspikes', x: p.x, y: p.y, z: zz, w: s.w, period: 2.4 - d * 0.5, phase: R() * 3 });
      } },
      { min: 0.22, w: 1.1, fn: () => { // crusher block slamming down
        const w = 4.2, s = this.add(14, { w }); this.coinLine(s, 5, 0);
        const zz = lerp(s.z0, s.z1, 0.5), p = segAt(s, zz), lane = this.pick([-1, 0, 1]) * 1.2;
        O.push({ type: 'crusher', x: p.x + lane, y: p.y, z: zz, period: 2.6 - d * 0.6, phase: R() * 3 });
      } },
      { min: 0.28, w: 1.1, fn: () => { // cannon shooting balls across the track
        const w = 4.4, s = this.add(15, { w }); this.coinLine(s, 5, 0);
        const zz = lerp(s.z0, s.z1, 0.5), p = segAt(s, zz), side = R() < 0.5 ? -1 : 1;
        O.push({ type: 'cannon', x: p.x, y: p.y, z: zz, w, side, period: 2.2 - d * 0.5, phase: R() * 2 });
      } },
      { min: 0.35, w: 1.2, fn: () => { // wind zone
        const dir = R() < 0.5 ? -1 : 1, s = this.add(16, { w: 4.8, wind: dir * (2.2 + d * 2) }); this.coinLine(s, 6, -dir * 1.2);
      } },
    ];
  }

  run(len) {
    const target = this.z - len, all = this.pieces();
    while (this.z > target) {
      const avail = all.filter((p) => this.d >= p.min);
      const total = avail.reduce((a, p) => a + p.w, 0);
      let k = this.r() * total, chosen = avail[0];
      for (const p of avail) { k -= p.w; if (k <= 0) { chosen = p; break; } }
      chosen.fn();
      this.sincePower++;
      if (this.sincePower >= 4 && this.r() < 0.5) {
        const s = this.add(8, { w: 4.5 }); this.power(s, lerp(s.z0, s.z1, 0.5)); this.sincePower = 0;
      }
    }
  }

  decorate(out) {
    const r = this.r;
    for (const s of out.segs) for (let zz = s.z0; zz > s.z1; zz -= 7) {
      const p = segAt(s, zz);
      for (const side of [-1, 1]) if (r() < 0.75) out.deco.push({ x: p.x + side * (s.w / 2 + 3 + r() * 4), y: p.y - 0.6 - r() * 1.5, z: zz + r() * 3, r: r(), side });
    }
  }
}

export const levelSpeed = (d, boss) => 8.3 + d * 6 + (boss ? 0.4 : 0);

export function generateLevel(worldId, lvl) {
  const wi = WORLDS.findIndex((w) => w.id === worldId), boss = lvl === LEVELS_PER_WORLD;
  const d = difficulty(wi, lvl);
  const gen = new TrackGen((wi + 1) * 7919 + lvl * 131, worldId, d, boss);
  gen.start();
  // roughly 40-60 seconds of rolling (bosses longer)
  gen.run(levelSpeed(d, boss) * (40 + 18 * d) * (boss ? 1.3 : 1));
  const end = gen.add(16, { w: 7, type: 'normal' });
  gen.out.gems.push({ x: end.cx0, y: gen.y + 1.2, z: end.z0 - 3 });
  const finishZ = end.z0 - 8;
  // Checkpoints at roughly 1/3 and 2/3
  for (const frac of [0.25, 0.5, 0.75]) {
    const want = 10 - (10 - finishZ) * frac; let best = null;
    for (const s of gen.out.segs) if (s.type !== 'moving' && s.type !== 'crumble' && !s.wind && s.w >= 3.5 && s.y0 === s.y1 && s.z0 < 0) {
      if (!best || Math.abs(s.z0 - want) < Math.abs(best.z0 - want)) best = s;
    }
    if (best && !gen.out.checkpoints.find((c) => c.seg === best)) gen.out.checkpoints.push({ seg: best, x: best.cx0, y: best.y0, z: best.z0 - 1.5 });
  }
  // One hidden treasure chest floating above a straight part of the track: jump to grab it.
  const straights = gen.out.segs.filter((s) => (s.type === 'normal' || s.type === 'ice') && s.z0 < -40 && s.z1 > finishZ + 30 && s.cx0 === s.cx1 && s.y0 === s.y1 && !s.wind && s.z0 - s.z1 > 10);
  if (straights.length) {
    const s = straights[Math.floor(gen.r() * straights.length)], zz = lerp(s.z0, s.z1, 0.5);
    gen.out.chests.push({ x: s.cx0 + gen.pick([-1, 1]) * (s.w / 2 - 0.9), y: s.y0 + 2.4, z: zz });
  }
  const gates = [2, 3, 5]; for (let i = 2; i > 0; i--) { const j = Math.floor(gen.r() * (i + 1)); [gates[i], gates[j]] = [gates[j], gates[i]]; }
  gen.out.gates = gates;
  const data = gen.take();
  return { ...data, gates, worldId, lvl, boss, d, theme: worldId, speed: levelSpeed(d, boss), finishZ, icy: worldId === 'ice' || worldId === 'arctic', length: 10 - finishZ };
}

// Endless: one generator that keeps producing chunks, harder the further you go.
export function endlessGen(worldId) {
  const gen = new TrackGen((Date.now() & 0xffff) + 99, worldId, 0.08, false);
  gen.start();
  return gen;
}
export function nextChunk(gen, distance) {
  gen.d = Math.min(1, 0.08 + distance / 3000);
  gen.run(70);
  return gen.take();
}
