// Ball materials. Every pattern is painted on a canvas: no image files needed.
import * as THREE from 'three';

const cache = new Map();
function tex(key, draw, w = 512, h = 256) {
  if (cache.has(key)) return cache.get(key);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  cache.set(key, t);
  return t;
}
const rnd = (() => { let s = 12345; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.4, ...o });
const blob = (g, x, y, r) => { g.beginPath(); for (let i = 0; i <= 12; i++) { const a = i / 12 * Math.PI * 2, rr = r * (0.7 + rnd() * 0.5); g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.8); } g.fill(); };
const star = (g, x, y, r1, r2) => { g.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? r2 : r1, a = i * Math.PI / 5 - Math.PI / 2; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); g.fill(); };

const R = {
  classic: () => std({ color: 0xffb52e, roughness: 0.35 }),
  ocean: () => std({ color: 0x3fb7ff, roughness: 0.25, metalness: 0.1 }),
  tennis: () => std({ roughness: 0.9, map: tex('tennis', (g, w, h) => {
    g.fillStyle = '#d4f53c'; g.fillRect(0, 0, w, h); g.strokeStyle = '#fff'; g.lineWidth = 9;
    for (const off of [0, Math.PI]) { g.beginPath(); for (let x = 0; x <= w; x += 4) g.lineTo(x, h / 2 + Math.sin(x / w * Math.PI * 4 + off) * h * 0.28); g.stroke(); }
  }) }),
  melon: () => std({ roughness: 0.45, map: tex('melon', (g, w, h) => {
    g.fillStyle = '#9be37f'; g.fillRect(0, 0, w, h); g.fillStyle = '#2e8b3a';
    for (let i = 0; i < 12; i++) { g.beginPath(); const x = i * w / 12; g.moveTo(x, 0); for (let y = 0; y <= h; y += 16) g.lineTo(x + Math.sin(y * 0.08 + i) * 6, y); g.lineTo(x + 18, h); g.lineTo(x + 18, 0); g.fill(); }
  }) }),
  soccer: () => std({ roughness: 0.5, map: tex('soccer', (g, w, h) => {
    g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = '#1b1b1b';
    const pent = (cx, cy, r) => { g.beginPath(); for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5 - Math.PI / 2; g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } g.fill(); };
    for (let row = 0; row < 3; row++) for (let i = 0; i < 6; i++) pent(i * w / 6 + (row % 2) * w / 12 + 40, 45 + row * 85, 26);
  }) }),
  basket: () => std({ roughness: 0.75, map: tex('basket', (g, w, h) => {
    g.fillStyle = '#e8732a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#2a1206'; g.lineWidth = 6;
    [w / 4, w * 3 / 4].forEach((x) => { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); });
    g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke();
    for (const cx of [0, w / 2, w]) { g.beginPath(); g.ellipse(cx, h / 2, w / 8, h / 2.3, 0, 0, 7); g.stroke(); }
  }) }),
  bowling: () => std({ roughness: 0.08, metalness: 0.2, map: tex('bowling', (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#2a3cff'); gr.addColorStop(1, '#5a1aa8'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#0a0a18'; [[220, 70], [262, 64], [244, 108]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 12, 0, 7); g.fill(); });
  }) }),
  candy: () => std({ roughness: 0.25, map: tex('candy', (g, w, h) => {
    g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = '#ff4f9a';
    for (let i = -8; i < 16; i++) { g.beginPath(); g.moveTo(i * 40, 0); g.lineTo(i * 40 + 20, 0); g.lineTo(i * 40 + 20 + h, h); g.lineTo(i * 40 + h, h); g.fill(); }
  }) }),
  lava: () => std({ roughness: 0.7, emissive: 0xffffff, emissiveIntensity: 0.9,
    map: tex('lavaBase', (g, w, h) => { g.fillStyle = '#2a0800'; g.fillRect(0, 0, w, h); }),
    emissiveMap: tex('lavaGlow', (g, w, h) => {
      g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.strokeStyle = '#ff6a1a'; g.lineWidth = 5; g.shadowColor = '#ffcc33'; g.shadowBlur = 10;
      for (let i = 0; i < 40; i++) { g.beginPath(); let x = rnd() * w, y = rnd() * h; g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (rnd() - 0.5) * 70; y += (rnd() - 0.5) * 50; g.lineTo(x, y); } g.stroke(); }
    }) }),
  donut: () => std({ roughness: 0.5, map: tex('donut', (g, w, h) => {
    g.fillStyle = '#e0a45a'; g.fillRect(0, 0, w, h); g.fillStyle = '#ff8fc8';
    g.beginPath(); g.moveTo(0, 0); for (let x = 0; x <= w; x += 8) g.lineTo(x, h * 0.55 + Math.sin(x * 0.07) * 10); g.lineTo(w, 0); g.fill();
    const cols = ['#fff', '#ffe14a', '#4ad6ff', '#7ee37a', '#ff5a5a'];
    for (let i = 0; i < 140; i++) { g.save(); g.translate(rnd() * w, rnd() * h * 0.5); g.rotate(rnd() * 3); g.fillStyle = cols[i % 5]; g.fillRect(-5, -1.5, 10, 3); g.restore(); }
  }) }),
  icy: () => std({ color: 0xbff4ff, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.82, emissive: 0x2a6a80, emissiveIntensity: 0.3 }),
  zebra: () => std({ roughness: 0.6, map: tex('zebra', (g, w, h) => {
    g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = '#111';
    for (let i = 0; i < 18; i++) { const x = i * w / 18; g.beginPath(); g.moveTo(x, 0); for (let y = 0; y <= h; y += 10) g.lineTo(x + Math.sin(y * 0.05 + i * 1.7) * 9, y); for (let y = h; y >= 0; y -= 10) g.lineTo(x + 10 + Math.sin(y * 0.05 + i) * 7, y); g.fill(); }
  }) }),
  galaxy: () => std({ roughness: 0.3, emissive: 0xffffff, emissiveIntensity: 0.6,
    map: tex('galaxyBase', (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#1a0b3a'); gr.addColorStop(0.5, '#5b2a9e'); gr.addColorStop(1, '#0e1a4a'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }),
    emissiveMap: tex('galaxyStars', (g, w, h) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); for (let i = 0; i < 260; i++) { g.fillStyle = `hsl(${200 + rnd() * 100},100%,${70 + rnd() * 30}%)`; g.beginPath(); g.arc(rnd() * w, rnd() * h, rnd() * 2.2, 0, 7); g.fill(); } }) }),
  camo: () => std({ roughness: 0.85, map: tex('camo', (g, w, h) => {
    g.fillStyle = '#7a8a4a'; g.fillRect(0, 0, w, h);
    ['#4f5f2a', '#a89a6a', '#3a2f1f', '#6a7a3a'].forEach((c) => { g.fillStyle = c; for (let i = 0; i < 26; i++) blob(g, rnd() * w, rnd() * h, 14 + rnd() * 20); });
  }) }),
  moon: () => std({ roughness: 0.95, map: tex('moon', (g, w, h) => {
    g.fillStyle = '#c9ccd4'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) { const x = rnd() * w, y = rnd() * h, r = 3 + rnd() * 16; g.fillStyle = 'rgba(90,95,110,.45)'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2; g.beginPath(); g.arc(x - 1, y - 1, r, 3.6, 5.6); g.stroke(); }
  }) }),
  earth: () => std({ roughness: 0.6, map: tex('earth', (g, w, h) => {
    g.fillStyle = '#1f6fd6'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#3fae55'; for (let i = 0; i < 14; i++) blob(g, rnd() * w, 30 + rnd() * (h - 60), 18 + rnd() * 30);
    g.fillStyle = '#b98a4a'; for (let i = 0; i < 6; i++) blob(g, rnd() * w, 60 + rnd() * (h - 120), 10 + rnd() * 12);
    g.fillStyle = '#fff'; g.fillRect(0, 0, w, 14); g.fillRect(0, h - 14, w, 14);
    g.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 18; i++) blob(g, rnd() * w, rnd() * h, 6 + rnd() * 10);
  }) }),
  bubble: () => std({ roughness: 0, metalness: 0.3, transparent: true, opacity: 0.5, emissive: 0x335566, emissiveIntensity: 0.4, map: tex('bubble', (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, 0); ['#ff9af0', '#9adfff', '#b5ff9a', '#fff59a', '#ff9af0'].forEach((c, i) => gr.addColorStop(i / 4, c)); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }) }),
  pumpkin: () => std({ roughness: 0.6, map: tex('pumpkin', (g, w, h) => {
    g.fillStyle = '#ff8a1a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c85a00'; g.lineWidth = 8;
    for (let i = 0; i < 10; i++) { g.beginPath(); g.moveTo(i * w / 10, 0); g.lineTo(i * w / 10, h); g.stroke(); }
  }) }),
  gold: () => std({ color: 0xffd23a, roughness: 0.18, metalness: 0.9 }),
  disco: () => std({ roughness: 0.15, metalness: 0.85, map: tex('disco', (g, w, h) => {
    for (let y = 0; y < h; y += 16) for (let x = 0; x < w; x += 16) { const v = 150 + rnd() * 105; g.fillStyle = `rgb(${v},${v},${v + rnd() * 30})`; g.fillRect(x, y, 15, 15); }
  }), emissive: 0x552255, emissiveIntensity: 0.3 }),
  bd: () => std({ roughness: 0.5, map: tex('bd', (g, w, h) => { g.fillStyle = '#006a4e'; g.fillRect(0, 0, w, h); g.fillStyle = '#f42a41'; g.beginPath(); g.arc(w * 0.45, h / 2, 55, 0, 7); g.fill(); g.beginPath(); g.arc(w * 0.95, h / 2, 55, 0, 7); g.fill(); }) }),
  rainbow: () => std({ roughness: 0.3, map: tex('rainbow', (g, w, h) => { const c = ['#ff4f4f', '#ff9a3a', '#ffe14a', '#5ad65a', '#3fb7ff', '#5a5aff', '#b05aff']; c.forEach((col, i) => { g.fillStyle = col; g.fillRect(0, i * h / 7, w, h / 7 + 1); }); }) }),
  neon: () => std({ color: 0x0a3a5a, roughness: 0.2, emissive: 0x2ff7ff, emissiveIntensity: 1.1 }),
  diamond: () => std({ color: 0xd8fbff, roughness: 0.04, metalness: 0.95, flatShading: true, emissive: 0x3a6a7a, emissiveIntensity: 0.35 }),
  crystal: () => std({ color: 0xc07bff, roughness: 0.05, metalness: 0.3, flatShading: true, transparent: true, opacity: 0.85, emissive: 0x4a1a7a, emissiveIntensity: 0.6 }),
  fire: () => std({ roughness: 0.6, emissive: 0xffffff, emissiveIntensity: 1, map: tex('fireBase', (g, w, h) => { g.fillStyle = '#5a0a00'; g.fillRect(0, 0, w, h); }),
    emissiveMap: tex('fireGlow', (g, w, h) => {
      const gr = g.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, '#ffef6a'); gr.addColorStop(0.5, '#ff7a1a'); gr.addColorStop(1, '#a81a00'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(255,240,140,.6)'; for (let i = 0; i < 30; i++) { const x = rnd() * w; g.beginPath(); g.moveTo(x - 10, h); g.quadraticCurveTo(x + (rnd() - 0.5) * 30, h * 0.4, x, h * (0.1 + rnd() * 0.3)); g.quadraticCurveTo(x + 8, h * 0.5, x + 12, h); g.fill(); }
    }) }),
  cyber: () => std({ roughness: 0.3, metalness: 0.5, emissive: 0xffffff, emissiveIntensity: 1, map: tex('cyberBase', (g, w, h) => { g.fillStyle = '#0a1418'; g.fillRect(0, 0, w, h); }),
    emissiveMap: tex('cyberGlow', (g, w, h) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.strokeStyle = '#2fff9a'; g.lineWidth = 3; for (let x = 0; x < w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y < h; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } g.fillStyle = '#2fff9a'; for (let i = 0; i < 40; i++) g.fillRect(Math.floor(rnd() * 16) * 32 - 3, Math.floor(rnd() * 8) * 32 - 3, 7, 7); }) }),
  robot: () => std({ roughness: 0.35, metalness: 0.8, map: tex('robot', (g, w, h) => {
    g.fillStyle = '#9aa8ba'; g.fillRect(0, 0, w, h); g.strokeStyle = '#5a6678'; g.lineWidth = 4;
    for (let x = 0; x < w; x += 64) for (let y = 0; y < h; y += 64) { g.strokeRect(x + 2, y + 2, 60, 60); g.fillStyle = '#4a5466'; [[8, 8], [56, 8], [8, 56], [56, 56]].forEach(([a, b]) => { g.beginPath(); g.arc(x + a, y + b, 3, 0, 7); g.fill(); }); }
    g.fillStyle = '#1a2a3a'; g.fillRect(180, 100, 150, 40); g.fillStyle = '#2ff7ff'; g.fillRect(195, 112, 40, 16); g.fillRect(275, 112, 40, 16);
  }) }),
  champion: () => std({ color: 0xffd23a, metalness: 0.9, roughness: 0.2, map: tex('champ', (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); ['#ff3a5a', '#3ad1ff', '#4ade80'].forEach((c, k) => { g.fillStyle = c; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(i * w / 6 + k * 28 + 20, h / 2 + (k - 1) * 40, 12, 0, 7); g.fill(); } }); }), emissive: 0x5a3a00, emissiveIntensity: 0.4 }),
  phoenix: () => std({ roughness: 0.4, emissive: 0xffffff, emissiveIntensity: 0.7, map: tex('phx', (g, w, h) => { g.fillStyle = '#a81a00'; g.fillRect(0, 0, w, h); }),
    emissiveMap: tex('phxGlow', (g, w, h) => { g.fillStyle = '#3a0500'; g.fillRect(0, 0, w, h); for (let i = 0; i < 80; i++) { const x = rnd() * w, y = rnd() * h; const gr = g.createLinearGradient(x, y, x + 30, y - 30); gr.addColorStop(0, '#ff3a1a'); gr.addColorStop(1, '#ffd23a'); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, 26, 9, -0.8, 0, 7); g.fill(); } }) }),
  streak: () => std({ roughness: 0.4, map: tex('streak', (g, w, h) => { g.fillStyle = '#22a85a'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = 'bold 70px sans-serif'; g.textAlign = 'center'; for (let i = 0; i < 4; i++) g.fillText('7', 64 + i * 128, h / 2 + 25); }) }),
  starball: () => std({ roughness: 0.3, emissive: 0x5a4a00, emissiveIntensity: 0.6, map: tex('starb', (g, w, h) => { g.fillStyle = '#ffd23a'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff6c0'; for (let i = 0; i < 26; i++) star(g, rnd() * w, rnd() * h, 16, 7); }) }),
  comet: () => std({ roughness: 0.2, emissive: 0xffffff, emissiveIntensity: 0.8, map: tex('cometB', (g, w, h) => { g.fillStyle = '#123a6a'; g.fillRect(0, 0, w, h); }),
    emissiveMap: tex('cometG', (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#000'); gr.addColorStop(0.5, '#8ad8ff'); gr.addColorStop(1, '#000'); g.fillStyle = gr; g.fillRect(0, h * 0.3, w, h * 0.4); }) }),
};


// ---- More balls ----
const stripes = (key, cols, vertical = true) => tex(key, (g, w, h) => { const n = cols.length * 2; for (let i = 0; i < n; i++) { g.fillStyle = cols[i % cols.length]; vertical ? g.fillRect(i * w / n, 0, w / n + 1, h) : g.fillRect(0, i * h / n, w, h / n + 1); } });
const dots = (key, bg, dot, r = 14, n = 40) => tex(key, (g, w, h) => { g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = dot; for (let i = 0; i < n; i++) { g.beginPath(); g.arc((i * 97) % w, (i * 53 + (i % 3) * 30) % h, r, 0, 7); g.fill(); } });
const glowTex = (key, bg, draw) => ({ map: tex(key + 'B', (g, w, h) => { g.fillStyle = bg; g.fillRect(0, 0, w, h); }), emissiveMap: tex(key + 'G', (g, w, h) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); draw(g, w, h); }) });
Object.assign(R, {
  cricket: () => std({ roughness: 0.5, map: tex('cricket', (g, w, h) => { g.fillStyle = '#b8141e'; g.fillRect(0, 0, w, h); g.strokeStyle = '#fff'; g.lineWidth = 4; g.setLineDash([8, 6]); for (const y of [h / 2 - 8, h / 2 + 8]) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } }) }),
  beachball: () => std({ roughness: 0.35, map: stripes('beach', ['#ff4a4a', '#ffffff', '#3fb7ff', '#ffe14a', '#4ade80', '#ffffff']) }),
  smiley: () => std({ roughness: 0.4, map: tex('smiley', (g, w, h) => { g.fillStyle = '#ffd23a'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a1a0a'; for (const cx of [w * 0.25, w * 0.75]) { g.beginPath(); g.ellipse(cx - 22, h * 0.42, 9, 15, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(cx + 22, h * 0.42, 9, 15, 0, 0, 7); g.fill(); g.lineWidth = 8; g.strokeStyle = '#2a1a0a'; g.beginPath(); g.arc(cx, h * 0.5, 40, 0.3, Math.PI - 0.3); g.stroke(); } }) }),
  volley: () => std({ roughness: 0.5, map: stripes('volley', ['#ffffff', '#3a8aff', '#ffd23a'], false) }),
  eightball: () => std({ roughness: 0.08, metalness: 0.1, map: tex('eight', (g, w, h) => { g.fillStyle = '#111'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.beginPath(); g.arc(w / 2, h / 2, 34, 0, 7); g.fill(); g.fillStyle = '#111'; g.font = 'bold 44px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('8', w / 2, h / 2 + 2); }) }),
  polka: () => std({ roughness: 0.4, map: dots('polka', '#ff5a8a', '#ffffff', 12, 60) }),
  ladybug: () => std({ roughness: 0.3, map: tex('lady', (g, w, h) => { g.fillStyle = '#e8141e'; g.fillRect(0, 0, w, h); g.fillStyle = '#111'; g.fillRect(w / 2 - 4, 0, 8, h); for (let i = 0; i < 14; i++) { g.beginPath(); g.arc((i * 83) % w, (i * 41) % h, 16, 0, 7); g.fill(); } }) }),
  cookie: () => std({ roughness: 0.9, map: dots('cookie', '#d8a05a', '#4a2a12', 10, 50) }),
  checker: () => std({ roughness: 0.4, map: tex('checker', (g, w, h) => { for (let y = 0; y < 8; y++) for (let x = 0; x < 16; x++) { g.fillStyle = (x + y) % 2 ? '#111' : '#fff'; g.fillRect(x * w / 16, y * h / 8, w / 16 + 1, h / 8 + 1); } }) }),
  jelly: () => std({ color: 0x6aff8a, roughness: 0.05, transparent: true, opacity: 0.7, emissive: 0x1a8a3a, emissiveIntensity: 0.4 }),
  marble: () => std({ roughness: 0.03, metalness: 0.1, transparent: true, opacity: 0.85, map: tex('marble', (g, w, h) => { g.fillStyle = '#dff6ff'; g.fillRect(0, 0, w, h); g.strokeStyle = '#2a8aff'; g.lineWidth = 14; g.beginPath(); for (let x = 0; x <= w; x += 8) g.lineTo(x, h / 2 + Math.sin(x * 0.03) * 60); g.stroke(); g.strokeStyle = '#ff4a8a'; g.lineWidth = 8; g.beginPath(); for (let x = 0; x <= w; x += 8) g.lineTo(x, h / 2 + Math.cos(x * 0.025) * 50); g.stroke(); }) }),
  copper: () => std({ color: 0xd8824a, metalness: 0.9, roughness: 0.25 }),
  sunball: () => std({ roughness: 0.5, emissive: 0xffffff, emissiveIntensity: 0.8, ...glowTex('sun', '#c86a00', (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ffe14a'); gr.addColorStop(0.5, '#ff9a1a'); gr.addColorStop(1, '#ffe14a'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,200,.5)'; for (let i = 0; i < 40; i++) { g.beginPath(); g.arc(rnd() * w, rnd() * h, 6 + rnd() * 14, 0, 7); g.fill(); } }) }),
  plasma: () => std({ roughness: 0.2, emissive: 0xffffff, emissiveIntensity: 1, ...glowTex('plasma', '#1a0a2a', (g, w, h) => { for (let i = 0; i < 30; i++) { g.strokeStyle = `hsl(${280 + rnd() * 80},100%,65%)`; g.lineWidth = 3; g.beginPath(); let x = rnd() * w, y = rnd() * h; g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (rnd() - 0.5) * 80; y += (rnd() - 0.5) * 60; g.lineTo(x, y); } g.stroke(); } }) }),
  dragonscale: () => std({ roughness: 0.3, metalness: 0.5, emissive: 0xffffff, emissiveIntensity: 0.5, ...glowTex('dragon', '#0a4a2a', (g, w, h) => { for (let y = 0; y < h + 20; y += 20) for (let x = 0; x < w + 20; x += 24) { g.strokeStyle = '#3aff8a'; g.lineWidth = 2.5; g.beginPath(); g.arc(x + (y / 20 % 2) * 12, y, 12, 0, Math.PI); g.stroke(); } }) }),
  aurora: () => std({ roughness: 0.15, emissive: 0xffffff, emissiveIntensity: 0.9, ...glowTex('aurora', '#06121a', (g, w, h) => { ['#3affb0', '#5ad1ff', '#b07aff'].forEach((c, i) => { g.strokeStyle = c; g.lineWidth = 18; g.globalAlpha = 0.7; g.beginPath(); for (let x = 0; x <= w; x += 8) g.lineTo(x, h * (0.3 + i * 0.2) + Math.sin(x * 0.02 + i) * 30); g.stroke(); }); g.globalAlpha = 1; }) }),
  royal: () => std({ roughness: 0.2, metalness: 0.6, emissive: 0xffffff, emissiveIntensity: 0.5, ...glowTex('royal', '#3a0a5a', (g, w, h) => { g.strokeStyle = '#ffd23a'; g.lineWidth = 3; for (let x = 0; x < w; x += 32) for (let y = 0; y < h; y += 32) { g.beginPath(); g.moveTo(x + 16, y + 4); g.lineTo(x + 28, y + 16); g.lineTo(x + 16, y + 28); g.lineTo(x + 4, y + 16); g.closePath(); g.stroke(); } }) }),
  kingdiamond: () => std({ color: 0xe8fcff, roughness: 0.02, metalness: 1, flatShading: true, emissive: 0x5ad1ff, emissiveIntensity: 0.45 }),
  blackhole: () => std({ roughness: 0.1, emissive: 0xffffff, emissiveIntensity: 1, ...glowTex('bh', '#000000', (g, w, h) => { for (let i = 0; i < 6; i++) { g.strokeStyle = `rgba(${150 + i * 15},${80 + i * 10},255,${0.9 - i * 0.12})`; g.lineWidth = 10 - i; g.beginPath(); g.ellipse(w / 2, h / 2, 60 + i * 30, 14 + i * 8, 0.2, 0, 7); g.stroke(); } }) }),
  phoenixfire: () => std({ roughness: 0.4, emissive: 0xffffff, emissiveIntensity: 1.1, ...glowTex('pfire', '#5a0a00', (g, w, h) => { for (let i = 0; i < 70; i++) { const x = rnd() * w, y = rnd() * h, gr = g.createLinearGradient(x, y + 20, x, y - 30); gr.addColorStop(0, '#ff2a00'); gr.addColorStop(1, '#ffe14a'); g.fillStyle = gr; g.beginPath(); g.moveTo(x - 10, y + 20); g.quadraticCurveTo(x, y - 40, x + 10, y + 20); g.fill(); } }) }),
  thunder: () => std({ roughness: 0.2, metalness: 0.4, emissive: 0xffffff, emissiveIntensity: 1, ...glowTex('thunder', '#0a1a3a', (g, w, h) => { g.strokeStyle = '#bff4ff'; g.lineWidth = 4; g.shadowColor = '#7ad8ff'; g.shadowBlur = 10; for (let i = 0; i < 14; i++) { let x = rnd() * w, y = 0; g.beginPath(); g.moveTo(x, y); while (y < h) { x += (rnd() - 0.5) * 40; y += 20; g.lineTo(x, y); } g.stroke(); } }) }),
  goldcrown: () => std({ color: 0xffd23a, metalness: 1, roughness: 0.12, emissive: 0x6a4a00, emissiveIntensity: 0.5, map: tex('gcrown', (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = '#d4142a'; for (let i = 0; i < 8; i++) { g.beginPath(); g.arc(i * w / 8 + 32, h / 2, 10, 0, 7); g.fill(); } g.fillStyle = '#2a8aff'; for (let i = 0; i < 8; i++) { g.beginPath(); g.arc(i * w / 8, h / 2 - 50, 7, 0, 7); g.fill(); g.beginPath(); g.arc(i * w / 8, h / 2 + 50, 7, 0, 7); g.fill(); } }) }),
  nebula: () => std({ roughness: 0.25, emissive: 0xffffff, emissiveIntensity: 0.9, ...glowTex('nebula', '#0a0420', (g, w, h) => { ['#ff7ad8', '#7a5aff', '#3ad1ff'].forEach((c) => { for (let i = 0; i < 14; i++) { const gr = g.createRadialGradient(0, 0, 0, 0, 0, 50); gr.addColorStop(0, c); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.save(); g.translate(rnd() * w, rnd() * h); g.fillStyle = gr; g.fillRect(-50, -50, 100, 100); g.restore(); } }); g.fillStyle = '#fff'; for (let i = 0; i < 120; i++) g.fillRect(rnd() * w, rnd() * h, 1.5, 1.5); }) }),
  rainbowstar: () => std({ roughness: 0.2, emissive: 0xffffff, emissiveIntensity: 0.8, ...glowTex('rstar', '#222', (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0); ['#ff4f4f', '#ffb52e', '#ffe14a', '#5ad65a', '#3fb7ff', '#b05aff', '#ff4f4f'].forEach((c, i) => gr.addColorStop(i / 6, c)); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; for (let i = 0; i < 24; i++) star(g, rnd() * w, rnd() * h, 12, 5); }) }),
  treasure: () => std({ color: 0xffd23a, metalness: 0.9, roughness: 0.25, map: dots('treasure', '#ffffff', '#ffb52e', 8, 70) }),
  veteran: () => std({ roughness: 0.4, map: stripes('veteran', ['#1a3a8a', '#ffd23a', '#1a3a8a', '#ffffff'], false) }),
  combo: () => std({ roughness: 0.3, emissive: 0xffffff, emissiveIntensity: 0.7, ...glowTex('combo', '#3a0a00', (g, w, h) => { g.fillStyle = '#ff8a1a'; g.font = 'bold 46px sans-serif'; g.textAlign = 'center'; for (let i = 0; i < 4; i++) g.fillText('×3', 64 + i * 128, h / 2 + 16); }) }),
});

export function makeSkinMaterial(id) { return (R[id] || R.classic)(); }
export const hasRing = (id) => id === 'classic' || id === 'ocean';
