// Ball skins for the shop. Textures are drawn on a canvas (no image files).
import * as THREE from 'three';

export const SKINS = [
  { id: 'classic', name: 'Classic', price: 0, trail: 0xffb52e, css: 'radial-gradient(circle at 35% 30%,#fff3b0,#ffb52e 45%,#d46b00)' },
  { id: 'ocean', name: 'Ocean', price: 60, trail: 0x3fb7ff, css: 'radial-gradient(circle at 35% 30%,#e0f7ff,#3fb7ff 45%,#0d5fb0)' },
  { id: 'melon', name: 'Melon', price: 120, trail: 0x6bdc5a, css: 'repeating-linear-gradient(90deg,#2e9e3e 0 8px,#9be37f 8px 16px)' },
  { id: 'soccer', name: 'Soccer', price: 180, trail: 0xffffff, css: 'radial-gradient(circle at 50% 50%,#222 0 18%,#fff 19%)' },
  { id: 'lava', name: 'Lava', price: 260, trail: 0xff5a1f, css: 'radial-gradient(circle at 40% 35%,#ffcf4a,#ff5a1f 40%,#3a0a00)' },
  { id: 'galaxy', name: 'Galaxy', price: 340, trail: 0xb57bff, css: 'radial-gradient(circle at 35% 30%,#d8b8ff,#5b2a9e 45%,#120a2a)' },
  { id: 'gold', name: 'Gold', price: 450, trail: 0xffe066, css: 'radial-gradient(circle at 35% 30%,#fffbe0,#ffd23a 40%,#a87400)' },
  { id: 'neon', name: 'Neon', price: 600, trail: 0x2ff7ff, css: 'radial-gradient(circle at 50% 50%,#bfffff,#2ff7ff 45%,#0a3a5a)' },
];

function canvasTex(draw, w = 512, h = 256) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

export function makeSkinMaterial(id) {
  switch (id) {
    case 'ocean': return new THREE.MeshStandardMaterial({ color: 0x3fb7ff, roughness: 0.25, metalness: 0.1 });
    case 'melon': return new THREE.MeshStandardMaterial({ roughness: 0.45, map: canvasTex((g, w, h) => {
      g.fillStyle = '#9be37f'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#2e8b3a';
      for (let i = 0; i < 12; i++) { g.beginPath(); const x = i * w / 12; g.moveTo(x, 0);
        for (let y = 0; y <= h; y += 16) g.lineTo(x + Math.sin(y * 0.08 + i) * 6, y);
        g.lineTo(x + 18, h); g.lineTo(x + 18, 0); g.fill(); }
    }) });
    case 'soccer': return new THREE.MeshStandardMaterial({ roughness: 0.5, map: canvasTex((g, w, h) => {
      g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = '#1b1b1b';
      const pent = (cx, cy, r) => { g.beginPath(); for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5 - Math.PI / 2; g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } g.fill(); };
      for (let row = 0; row < 3; row++) for (let i = 0; i < 6; i++) pent(i * w / 6 + (row % 2) * w / 12 + 40, 45 + row * 85, 26);
    }) });
    case 'lava': return new THREE.MeshStandardMaterial({ roughness: 0.7, emissive: 0xffffff, emissiveIntensity: 0.9,
      map: canvasTex((g, w, h) => { g.fillStyle = '#2a0800'; g.fillRect(0, 0, w, h); }),
      emissiveMap: canvasTex((g, w, h) => {
        g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.strokeStyle = '#ff6a1a'; g.lineWidth = 5; g.shadowColor = '#ffcc33'; g.shadowBlur = 10;
        for (let i = 0; i < 40; i++) { g.beginPath(); let x = Math.random() * w, y = Math.random() * h; g.moveTo(x, y);
          for (let k = 0; k < 5; k++) { x += (Math.random() - 0.5) * 70; y += (Math.random() - 0.5) * 50; g.lineTo(x, y); } g.stroke(); }
      }) });
    case 'galaxy': return new THREE.MeshStandardMaterial({ roughness: 0.3, emissive: 0xffffff, emissiveIntensity: 0.6,
      map: canvasTex((g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#1a0b3a'); gr.addColorStop(0.5, '#5b2a9e'); gr.addColorStop(1, '#0e1a4a'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }),
      emissiveMap: canvasTex((g, w, h) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
        for (let i = 0; i < 260; i++) { g.fillStyle = `hsl(${200 + Math.random() * 100},100%,${70 + Math.random() * 30}%)`; const r = Math.random() * 2.2; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, r, 0, 7); g.fill(); } }) });
    case 'gold': return new THREE.MeshStandardMaterial({ color: 0xffd23a, roughness: 0.18, metalness: 0.9 });
    case 'neon': return new THREE.MeshStandardMaterial({ color: 0x0a3a5a, roughness: 0.2, emissive: 0x2ff7ff, emissiveIntensity: 1.1 });
    default: return new THREE.MeshStandardMaterial({ color: 0xffb52e, roughness: 0.35 });
  }
}

export const skinById = (id) => SKINS.find((s) => s.id === id) || SKINS[0];
