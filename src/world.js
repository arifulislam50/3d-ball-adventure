// 3D world building: themed environment (sky, water, weather, creatures) and
// track content (platforms, scenery, coins, power-ups, obstacles, pads).
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { segAt } from './levels.js';
import { SPRITE, roundSprite, emojiTexture } from './effects.js';

export const THEMES = {
  meadow: { skyTop: 0x3fa9ff, skyBottom: 0xdaf2ff, fog: 0xc4e8ff, fogFar: 150, hemi: [0xeaf8ff, 0x4f7a45, 1.9], sun: 2.3,
    top: 0x7ed957, side: 0x9a6a3a, bridge: 0xc8955a, water: 0x2f9ee6, island: 0x5cc85a, clouds: true, birds: true, below: 'water' },
  desert: { skyTop: 0xff8a50, skyBottom: 0xffe4b5, fog: 0xffd6a0, fogFar: 150, hemi: [0xfff0d8, 0x9a6a3a, 1.8], sun: 2.4, sunColor: 0xfff1b0,
    top: 0xf2c77b, side: 0xb9773f, bridge: 0x9b6b3e, water: 0xe8b46e, island: 0xe8b46e, clouds: true, birds: true, below: 'dunes' },
  ice: { skyTop: 0x7fbfff, skyBottom: 0xf2f9ff, fog: 0xe6f3ff, fogFar: 130, hemi: [0xffffff, 0x7fa6c8, 2.0], sun: 2.0,
    top: 0xeaf7ff, side: 0x7fb8dc, bridge: 0xa7d4ef, water: 0x6fc2e8, island: 0xf4fbff, clouds: true, ambient: 'snow', below: 'water' },
  city: { skyTop: 0x05071c, skyBottom: 0x3b2370, fog: 0x231a4d, fogFar: 120, hemi: [0x8a7dff, 0x1a1030, 1.1], sun: 0.7,
    top: 0x2f3350, side: 0x1b1d33, bridge: 0x3d2f66, water: 0x0d0f2a, island: 0x2a2d4a, ambient: 'stars', neon: 0xff4fd8, edge: 0x2ff7ff, night: true, below: 'water' },
  candy: { skyTop: 0xff8fcf, skyBottom: 0xfff0fa, fog: 0xffd6ee, fogFar: 140, hemi: [0xfff0fa, 0xb06a8a, 1.9], sun: 2.2,
    top: 0xffb3d9, side: 0x7a3e1e, bridge: 0xffe08a, water: 0x6b3a1e, island: 0xffc6e3, clouds: true, cloudColor: 0xffeaf6, below: 'water' },
  ocean: { skyTop: 0x06325a, skyBottom: 0x2aa7c9, fog: 0x1d7fa8, fogNear: 12, fogFar: 85, hemi: [0x9fe8ff, 0x1a4a6a, 1.7], sun: 1.6, sunColor: 0xbff4ff,
    top: 0xf0d9a0, side: 0xff7f6a, bridge: 0xc8955a, water: 0xd9c18a, island: 0xe8cf95, ambient: 'bubbles', fish: true, below: 'dunes' },
  volcano: { skyTop: 0x1a0505, skyBottom: 0xff5a1f, fog: 0x6a2010, fogFar: 110, hemi: [0xffb38a, 0x3a1010, 1.5], sun: 1.8, sunColor: 0xffb070,
    top: 0x4a3c3c, side: 0x2a2020, bridge: 0x5a3a2a, water: 0xff4a00, lava: true, island: 0x4a3c3c, ambient: 'embers', neon: 0xff5a00, edge: 0xff8a1a, below: 'water' },
  cherry: { skyTop: 0x8fc8ff, skyBottom: 0xffe8f0, fog: 0xffe0ea, fogFar: 140, hemi: [0xfff4f8, 0x6a8a5a, 1.9], sun: 2.2,
    top: 0xf7c6d9, side: 0x8a5a3a, bridge: 0xd23a3a, water: 0x7fc8e8, island: 0x8fd46a, clouds: true, birds: true, ambient: 'petals', below: 'water' },
  forest: { skyTop: 0x0a1a2a, skyBottom: 0x1f5a5a, fog: 0x163f45, fogFar: 110, hemi: [0x8affd8, 0x10202a, 1.3], sun: 0.8,
    top: 0x3f6a4a, side: 0x3a2a1f, bridge: 0x5a4a2a, water: 0x0f2a30, island: 0x2f5a3a, ambient: 'fireflies', stars: true, night: true, edge: 0x8affd8, below: 'water' },
  village: { skyTop: 0x5fb8ff, skyBottom: 0xfff1c8, fog: 0xe8f0d0, fogFar: 150, hemi: [0xfff8e8, 0x4f7a35, 1.9], sun: 2.3, sunColor: 0xfff0c0,
    top: 0x9bd65a, side: 0x8a5a2a, bridge: 0xb08048, water: 0x4aa0c8, island: 0x7cc84a, clouds: true, birds: true, below: 'water', kit: 'village' },
  beach: { skyTop: 0x2fa8ff, skyBottom: 0xe8f8ff, fog: 0xcdeeff, fogFar: 160, hemi: [0xffffff, 0xd9b77a, 1.9], sun: 2.5,
    top: 0xf5deaa, side: 0xd8a860, bridge: 0xa87a4a, water: 0x1fb4d8, island: 0xf5deaa, clouds: true, birds: true, below: 'water', kit: 'beach' },
  sundarbans: { skyTop: 0x6aa8b8, skyBottom: 0xd8e8d0, fog: 0xb8d0b0, fogNear: 20, fogFar: 110, hemi: [0xe8f8e0, 0x2f4a2a, 1.7], sun: 1.8,
    top: 0x6a9a4a, side: 0x5a4028, bridge: 0x7a5a38, water: 0x5a7a5a, island: 0x4a7a3a, birds: true, ambient: 'rain', below: 'water', kit: 'sundarbans' },
  autumn: { skyTop: 0x7ab0e8, skyBottom: 0xffe2b8, fog: 0xf8d8b0, fogFar: 140, hemi: [0xfff0e0, 0x8a5a2a, 1.9], sun: 2.2, sunColor: 0xffe0a0,
    top: 0xd8a040, side: 0x8a4a22, bridge: 0x9a5a2a, water: 0x4a90c0, island: 0xc88a3a, clouds: true, birds: true, ambient: 'leaves', below: 'water', kit: 'autumn' },
  pirate: { skyTop: 0x2a8ae0, skyBottom: 0xfff0d0, fog: 0xd8eef8, fogFar: 150, hemi: [0xffffff, 0x8a6a3a, 1.9], sun: 2.4,
    top: 0xb88a52, side: 0x6a4a2a, bridge: 0x8a5a2a, water: 0x1a8ab8, island: 0xf0d8a0, clouds: true, birds: true, below: 'water', kit: 'pirate' },
  jungle: { skyTop: 0x4a9ad0, skyBottom: 0xd8f0c0, fog: 0x9ad08a, fogNear: 20, fogFar: 110, hemi: [0xe8ffe0, 0x2a5a2a, 1.8], sun: 2.0,
    top: 0x5aa84a, side: 0x6a4a2a, bridge: 0x8a6a3a, water: 0x3a8a6a, island: 0x3a9a3a, birds: true, below: 'water', kit: 'jungle' },
  dino: { skyTop: 0xe88a4a, skyBottom: 0xfff0c0, fog: 0xf0c890, fogFar: 140, hemi: [0xfff0d8, 0x6a5a2a, 1.8], sun: 2.3, sunColor: 0xffd890,
    top: 0x9ab85a, side: 0x7a5a32, bridge: 0x8a6a3a, water: 0x6aa0a8, island: 0x7a9a4a, clouds: true, birds: true, below: 'water', kit: 'dino' },
  halloween: { skyTop: 0x1a0a2a, skyBottom: 0xff7a2a, fog: 0x3a1a3a, fogFar: 110, hemi: [0xffb08a, 0x1a0a2a, 1.3], sun: 1.0, sunColor: 0xfff0c0,
    top: 0x4a3a4a, side: 0x2a1a2a, bridge: 0x5a3a2a, water: 0x1a0a20, island: 0x3a2a3a, ambient: 'stars', neon: 0xff7a1a, edge: 0xff8a1a, night: true, below: 'water', kit: 'halloween' },
  crystal: { skyTop: 0x0a0a2a, skyBottom: 0x3a1a6a, fog: 0x1a1040, fogFar: 110, hemi: [0xb8a8ff, 0x1a1040, 1.3], sun: 0.9,
    top: 0x4a4a7a, side: 0x2a2a4a, bridge: 0x5a4a8a, water: 0x2a1a5a, island: 0x3a3a6a, ambient: 'sparkle', neon: 0xb07aff, edge: 0x5ad1ff, night: true, below: 'water', kit: 'crystal' },
  festive: { skyTop: 0x1a2a5a, skyBottom: 0x8aa8d8, fog: 0xa8c0e0, fogFar: 130, hemi: [0xf0f8ff, 0x4a6a8a, 1.6], sun: 1.2,
    top: 0xf4fbff, side: 0x8a5a3a, bridge: 0xd23a3a, water: 0x6a90b8, island: 0xf4fbff, ambient: 'snow', night: true, edge: 0xffd23a, below: 'water', kit: 'festive' },
  sky: { skyTop: 0x5ab8ff, skyBottom: 0xfff8ff, fog: 0xffffff, fogFar: 160, hemi: [0xffffff, 0xb8c8ff, 2.0], sun: 2.4,
    top: 0xffffff, side: 0xd8e4ff, bridge: 0xffd8f0, water: 0xffffff, island: 0xffffff, clouds: true, cloudColor: 0xffffff, birds: true, below: 'cloud', kit: 'sky', edge: 0xffb3d9 },
  factory: { skyTop: 0x3a4a5a, skyBottom: 0xb8a890, fog: 0x8a8a80, fogFar: 120, hemi: [0xf0e8d8, 0x3a3a3a, 1.6], sun: 1.8,
    top: 0x6a7080, side: 0x3a3e48, bridge: 0x8a6a3a, water: 0x2a3038, island: 0x5a606a, below: 'water', kit: 'factory', edge: 0xffc800, neon: 0xff8a00 },
  arctic: { skyTop: 0x020818, skyBottom: 0x1a5a6a, fog: 0x10303a, fogFar: 130, hemi: [0xa0ffe8, 0x10203a, 1.4], sun: 0.8,
    top: 0xe0f4ff, side: 0x6a9ab8, bridge: 0x9ac8e0, water: 0x0a2a3a, island: 0xf0f8ff, ambient: 'snow', stars: true, aurora: true, night: true, below: 'water', kit: 'arctic', edge: 0x5affc8 },
  rainbow: { skyTop: 0x9a7aff, skyBottom: 0xffe8fa, fog: 0xffe0f8, fogFar: 150, hemi: [0xffffff, 0xb88ad8, 2.0], sun: 2.3,
    top: 0xfff0a0, side: 0xff8ac8, bridge: 0x8ad8ff, water: 0x8ad8ff, island: 0xb8ffb8, clouds: true, cloudColor: 0xfff0ff, ambient: 'sparkle', below: 'water', kit: 'rainbow', edge: 0xffffff },
  moon: { skyTop: 0x000005, skyBottom: 0x101020, fog: 0x050510, fogFar: 170, hemi: [0xd0d8ff, 0x202028, 1.4], sun: 1.9,
    top: 0xb8bcc8, side: 0x6a6e7a, bridge: 0x8a96b0, water: 0x000000, island: 0x9a9ea8, ambient: 'stars', planets: true, night: true, below: 'none', kit: 'moon', gravity: 0.5, edge: 0x8ad8ff },
  space: { skyTop: 0x02010a, skyBottom: 0x1a0f3a, fog: 0x0a0820, fogFar: 170, hemi: [0xa0a8ff, 0x101020, 1.3], sun: 1.7,
    top: 0x7a88a8, side: 0x2a3048, bridge: 0x4a5a7a, water: 0x000000, island: 0x5a5a66, ambient: 'stars', planets: true, neon: 0x5ad1ff, edge: 0x5ad1ff, night: true, below: 'none', gravity: 0.62 },
};

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o });
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const E = (x = 0, y = 0, z = 0) => new THREE.Euler(x, y, z);

class Batch {
  constructor() { this.map = new Map(); }
  add(geo, material, pos, rot = E(), scale = V(1, 1, 1)) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    g.applyMatrix4(new THREE.Matrix4().compose(pos, new THREE.Quaternion().setFromEuler(rot), scale));
    if (!this.map.has(material)) this.map.set(material, []);
    this.map.get(material).push(g);
  }
  build(parent) {
    const out = [];
    for (const [m, list] of this.map) {
      const merged = mergeGeometries(list, false); list.forEach((g) => g.dispose());
      parent.add(new THREE.Mesh(merged, m)); out.push(merged);
    }
    return out;
  }
}

const G = {
  cyl: new THREE.CylinderGeometry(1, 1, 1, 10), cone: new THREE.ConeGeometry(1, 1, 10), ico: new THREE.IcosahedronGeometry(1, 1),
  dodec: new THREE.DodecahedronGeometry(1, 0), sph: new THREE.SphereGeometry(1, 12, 10), box: new THREE.BoxGeometry(1, 1, 1),
  octa: new THREE.OctahedronGeometry(1, 0), pyr: new THREE.ConeGeometry(1, 1, 4), torus: new THREE.TorusGeometry(1, 0.28, 6, 14), half: new THREE.SphereGeometry(1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), disc: new THREE.CylinderGeometry(1, 1, 1, 18),
};
const SHARED = new Set(Object.values(G));

function windowTexture() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 128;
  const g = c.getContext('2d'); g.fillStyle = '#141632'; g.fillRect(0, 0, 64, 128);
  for (let y = 6; y < 128; y += 12) for (let x = 6; x < 64; x += 12) if (Math.random() < 0.55) { g.fillStyle = ['#ffe28a', '#7ff6ff', '#ff9bf0'][Math.floor(Math.random() * 3)]; g.fillRect(x, y, 6, 7); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// Gold coin face: rim, inner ring and an embossed star.
let faceTex = null, envTex = null;
function coinFace() {
  if (faceTex) return faceTex;
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'), C = 128;
  let gr = g.createRadialGradient(C - 30, C - 30, 10, C, C, 128);
  gr.addColorStop(0, '#fff6c0'); gr.addColorStop(0.45, '#ffd23a'); gr.addColorStop(1, '#d48a00');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  g.lineWidth = 16; g.strokeStyle = '#b97800'; g.beginPath(); g.arc(C, C, 118, 0, 7); g.stroke();
  g.lineWidth = 5; g.strokeStyle = '#fff0a0'; g.beginPath(); g.arc(C, C, 102, 0, 7); g.stroke();
  g.fillStyle = '#c98a00';
  for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; g.beginPath(); g.arc(C + Math.cos(a) * 92, C + Math.sin(a) * 92, 3, 0, 7); g.fill(); }
  const star = (r1, r2) => { g.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? r2 : r1, a = i * Math.PI / 5 - Math.PI / 2; g.lineTo(C + Math.cos(a) * r, C + 6 + Math.sin(a) * r); } g.closePath(); };
  star(66, 28); g.fillStyle = 'rgba(120,70,0,0.55)'; g.save(); g.translate(4, 5); g.fill(); g.restore();
  gr = g.createLinearGradient(C - 60, C - 60, C + 60, C + 60); gr.addColorStop(0, '#fffbe0'); gr.addColorStop(0.5, '#ffd84a'); gr.addColorStop(1, '#e09400');
  star(66, 28); g.fillStyle = gr; g.fill(); g.lineWidth = 5; g.strokeStyle = '#a86e00'; g.stroke();
  g.globalCompositeOperation = 'lighter';
  gr = g.createLinearGradient(40, 40, 140, 140); gr.addColorStop(0, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.beginPath(); g.ellipse(95, 85, 70, 34, -0.7, 0, 7); g.fill();
  faceTex = new THREE.CanvasTexture(c); faceTex.colorSpace = THREE.SRGBColorSpace; faceTex.anisotropy = 4;
  return faceTex;
}
function coinEnv() {
  if (envTex) return envTex;
  const c = document.createElement('canvas'); c.width = 256; c.height = 128;
  const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 128);
  gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.35, '#bfe4ff'); gr.addColorStop(0.5, '#fff4d6'); gr.addColorStop(0.65, '#6b5a3a'); gr.addColorStop(1, '#2a2418');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 128);
  g.fillStyle = '#ffffff'; for (let i = 0; i < 4; i++) g.fillRect(20 + i * 62, 18, 26, 22);
  envTex = new THREE.CanvasTexture(c); envTex.mapping = THREE.EquirectangularReflectionMapping; envTex.colorSpace = THREE.SRGBColorSpace;
  return envTex;
}

// ======================= ENVIRONMENT =======================
export function buildEnvironment(scene, themeId, quality) {
  const T = THEMES[themeId] || THEMES.meadow;
  const root = new THREE.Group(); scene.add(root);
  const anim = [], disposables = [];
  const low = quality === 'low';

  scene.background = new THREE.Color(T.skyBottom);
  scene.fog = new THREE.Fog(T.fog, T.fogNear || 30, T.fogFar);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(T.skyTop) }, bottom: { value: new THREE.Color(T.skyBottom) } },
    vertexShader: 'varying vec3 vp; void main(){ vp = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 bottom; varying vec3 vp; void main(){ float h = clamp(vp.y*1.4+0.15,0.0,1.0); gl_FragColor = vec4(mix(bottom, top, pow(h,0.8)),1.0); }',
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 24, 12), skyMat); sky.renderOrder = -1; root.add(sky);
  disposables.push(sky.geometry, skyMat);
  anim.push((dt, t, b) => sky.position.copy(b));

  if (themeId !== 'ocean') {
    const sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: roundSprite(T.night ? '#f4f1ff' : '#fff6c8', !T.night), color: T.sunColor || 0xffffff, fog: false, depthWrite: false }));
    sunSprite.scale.set(T.night ? 22 : 46, T.night ? 22 : 46, 1); root.add(sunSprite); disposables.push(sunSprite.material);
    anim.push((dt, t, b) => sunSprite.position.set(b.x - 60, b.y + 70, b.z - 260));
  }
  if (T.planets) {
    [[0xff9a5a, 26, -90, 60, true], [0x5ad1ff, 14, 80, 40, false], [0xc07bff, 9, 40, 90, false]].forEach(([col, r, x, y, ring]) => {
      const g = new THREE.Group();
      const p = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 16), new THREE.MeshStandardMaterial({ color: col, roughness: 0.8, fog: false, emissive: col, emissiveIntensity: 0.15 }));
      g.add(p); disposables.push(p.geometry, p.material);
      if (ring) { const rg = new THREE.Mesh(new THREE.RingGeometry(r * 1.4, r * 2.1, 48), new THREE.MeshBasicMaterial({ color: 0xffd9a0, side: THREE.DoubleSide, transparent: true, opacity: 0.6, fog: false })); rg.rotation.x = 1.2; g.add(rg); disposables.push(rg.geometry, rg.material); }
      root.add(g); anim.push((dt, t, b) => { g.position.set(b.x + x, b.y + y, b.z - 280); p.rotation.y += dt * 0.05; });
    });
  }

  if (T.below !== 'none') {
    const seg = low ? 20 : 40;
    const waterGeo = new THREE.PlaneGeometry(360, 360, seg, seg); waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({ color: T.water, roughness: T.below === 'dunes' || T.below === 'cloud' ? 1 : 0.25, metalness: T.night ? 0.6 : 0.1, flatShading: true,
      emissive: T.lava ? 0xff3a00 : 0x000000, emissiveIntensity: T.lava ? 0.8 : 0 });
    const water = new THREE.Mesh(waterGeo, waterMat); water.position.y = -9; root.add(water); disposables.push(waterGeo, waterMat);
    const wpos = waterGeo.attributes.position, base = Float32Array.from(wpos.array), dunes = T.below === 'dunes';
    anim.push((dt, t, b) => {
      water.position.x = Math.round(b.x / 9) * 9; water.position.z = Math.round(b.z / 9) * 9;
      for (let i = 0; i < wpos.count; i++) {
        const x = base[i * 3] + water.position.x, z = base[i * 3 + 2] + water.position.z;
        wpos.array[i * 3 + 1] = dunes ? Math.sin(x * 0.05) * Math.cos(z * 0.04) * 3.6 : Math.sin(x * 0.18 + t * 1.3) * Math.cos(z * 0.15 + t * 1.1) * (T.lava ? 0.7 : 0.45);
      }
      wpos.needsUpdate = true;
    });
  }

  if (T.clouds) {
    const cloudMat = new THREE.MeshStandardMaterial({ color: T.cloudColor || 0xffffff, roughness: 1, transparent: true, opacity: 0.92 });
    const cg = new THREE.IcosahedronGeometry(1, 1); disposables.push(cloudMat, cg);
    for (let i = 0; i < (low ? 8 : 14); i++) {
      const c = new THREE.Group();
      for (let k = 0; k < 4; k++) { const m = new THREE.Mesh(cg, cloudMat); m.scale.setScalar(2 + Math.random() * 2.2); m.position.set(k * 2.6 - 4, Math.random() * 1.2, Math.random() * 2); c.add(m); }
      c.position.set((Math.random() - 0.5) * 140, 10 + Math.random() * 18, 10 - Math.random() * 200);
      const sp = 0.6 + Math.random(); root.add(c);
      anim.push((dt, t, b) => { c.position.x += sp * dt; if (c.position.x > b.x + 80) c.position.x = b.x - 80; if (c.position.z > b.z + 30) c.position.z -= 200; });
    }
  }

  if (T.birds || T.fish) {
    for (let i = 0; i < (low ? 4 : 8); i++) {
      const g = new THREE.Group(); let flap;
      if (T.birds) {
        const m = mat(themeId === 'desert' ? 0x5a3a2a : 0x2b2b3a, { roughness: 1 }); const wg = new THREE.BoxGeometry(1.1, 0.06, 0.35); disposables.push(m, wg);
        const lp = new THREE.Group(), rp = new THREE.Group(), l = new THREE.Mesh(wg, m), r = new THREE.Mesh(wg, m);
        l.position.x = -0.5; r.position.x = 0.5; lp.add(l); rp.add(r); g.add(lp, rp);
        flap = (t, ph) => { const f = Math.sin(t * 9 + ph) * 0.6; lp.rotation.z = f; rp.rotation.z = -f; };
      } else {
        const m = mat([0xffa63a, 0xff5a8a, 0x5ad1ff, 0xffe14a][i % 4], { roughness: 0.5 }); disposables.push(m);
        const body = new THREE.Mesh(G.sph, m); body.scale.set(0.6, 0.35, 0.22);
        const tail = new THREE.Mesh(G.cone, m); tail.scale.set(0.25, 0.35, 0.1); tail.rotation.z = Math.PI / 2; tail.position.x = -0.7;
        g.add(body, tail); flap = (t, ph) => { tail.rotation.y = Math.sin(t * 8 + ph) * 0.5; };
      }
      g.position.set((Math.random() - 0.5) * 60, (T.fish ? 2 : 8) + Math.random() * 8, -20 - Math.random() * 120);
      const sp = 3 + Math.random() * 2, ph = Math.random() * 6; root.add(g);
      anim.push((dt, t, b) => { flap(t, ph); g.position.x += sp * dt; if (g.position.x > b.x + 50) g.position.x = b.x - 50; if (g.position.z > b.z + 20) g.position.z -= 150; });
    }
  }

  if (T.aurora) {
    const cols = [0x3affb0, 0x5ad1ff, 0xb07aff];
    cols.forEach((col, i) => {
      const g = new THREE.PlaneGeometry(260, 26, 40, 1), m = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false, fog: false });
      const mesh = new THREE.Mesh(g, m); root.add(mesh); disposables.push(g, m);
      const pos = g.attributes.position, base = Float32Array.from(pos.array);
      anim.push((dt, t, b) => {
        mesh.position.set(b.x, b.y + 55 + i * 8, b.z - 200 - i * 20);
        for (let k = 0; k < pos.count; k++) pos.array[k * 3 + 2] = base[k * 3 + 2] + Math.sin(base[k * 3] * 0.03 + t * 0.5 + i) * 18;
        pos.needsUpdate = true; m.opacity = 0.2 + Math.sin(t * 0.7 + i) * 0.08;
      });
    });
  }
  const amb = [T.ambient, T.stars && T.ambient !== 'stars' ? 'stars' : null].filter(Boolean);
  for (const kind of amb) {
    const count = low ? 220 : (kind === 'stars' ? 500 : 420);
    const g = new THREE.BufferGeometry(), arr = new Float32Array(count * 3), skyK = kind === 'stars';
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * (skyK ? 400 : 80);
      arr[i * 3 + 1] = skyK ? 40 + Math.random() * 120 : Math.random() * 30 - 6;
      arr[i * 3 + 2] = skyK ? -Math.random() * 300 : -Math.random() * 80;
    }
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const look = { snow: [0xffffff, 0.35, SPRITE, false], stars: [0xffffff, 1.4, SPRITE, false], bubbles: [0xdff8ff, 0.4, roundSprite('rgba(230,250,255,0.9)', false), false],
      embers: [0xff8a2a, 0.3, SPRITE, true], petals: [0xffffff, 0.55, emojiTexture('🌸', 64), false], fireflies: [0xfff27a, 0.45, SPRITE, true],
      rain: [0xa8c8ff, 0.18, SPRITE, false], leaves: [0xffffff, 0.6, emojiTexture('🍁', 64), false], sparkle: [0xfff0ff, 0.35, SPRITE, true] }[kind];
    const m = new THREE.PointsMaterial({ color: look[0], size: look[1], map: look[2], transparent: true, depthWrite: false, fog: !skyK, blending: look[3] ? THREE.AdditiveBlending : THREE.NormalBlending, alphaTest: kind === 'petals' || kind === 'leaves' ? 0.1 : 0 });
    const pts = new THREE.Points(g, m); root.add(pts); disposables.push(g, m);
    anim.push((dt, t, b) => {
      pts.position.set(b.x, skyK ? 0 : b.y, b.z + (skyK ? 60 : 20));
      if (skyK) return;
      for (let i = 0; i < count; i++) {
        const k = i * 3;
        if (kind === 'snow' || kind === 'petals' || kind === 'leaves' || kind === 'rain') { arr[k + 1] -= dt * (kind === 'rain' ? 18 : kind === 'snow' ? 2.2 : 1.4); if (kind !== 'rain') arr[k] += Math.sin(t + i) * dt * 0.6; if (arr[k + 1] < -6) arr[k + 1] = 25; }
        else if (kind === 'bubbles' || kind === 'embers') { arr[k + 1] += dt * (kind === 'bubbles' ? 1.6 : 2.4); arr[k] += Math.sin(t * 2 + i) * dt * 0.3; if (arr[k + 1] > 25) arr[k + 1] = -6; }
        else { arr[k] += Math.sin(t * 0.8 + i) * dt * 0.8; arr[k + 1] += Math.cos(t * 0.7 + i * 1.3) * dt * 0.5; }
      }
      g.attributes.position.needsUpdate = true;
      if (kind === 'fireflies' || kind === 'sparkle') m.opacity = 0.6 + Math.sin(t * 3) * 0.3;
    });
  }

  return {
    root, anim, theme: T, themeId,
    dispose() { scene.remove(root); root.traverse((o) => { if ((o.isMesh || o.isPoints) && !SHARED.has(o.geometry)) o.geometry?.dispose(); }); disposables.forEach((d) => d.dispose && d.dispose()); },
  };
}

// ======================= TRACK CONTENT =======================
const matCache = new Map();
function themeMats(themeId) {
  if (matCache.has(themeId)) return matCache.get(themeId);
  const T = THEMES[themeId];
  const M = {
    side: mat(T.side, T.neon ? { emissive: T.neon, emissiveIntensity: 0.3 } : {}),
    normal: mat(T.top, { roughness: 0.75 }), ice: mat(T.top, { roughness: 0.08, metalness: 0.2 }),
    bridge: mat(T.bridge, { roughness: 0.9 }),
    moving: mat(T.night ? 0x2ff7ff : 0xffcf4a, { roughness: 0.6, emissive: T.night ? 0x2ff7ff : 0x000000, emissiveIntensity: 0.4 }),
    crumble: mat(0xc9a36a, { roughness: 1 }),
    edge: mat(T.edge || 0xffffff, T.edge ? { emissive: T.edge, emissiveIntensity: 0.9 } : { roughness: 0.5 }),
    island: mat(T.island), dirt: mat(T.side), trunk: mat(0x8b5737), leafA: mat(0x3fb36a), leafB: mat(0x6bd36a),
    flowerR: mat(0xff6b8a), flowerY: mat(0xffe14a), cactus: mat(0x3f9e4f), rock: mat(themeId === 'desert' ? 0xd49a5a : 0x9aa3ad),
    pyramid: mat(0xe0b06a), snow: mat(0xffffff, { roughness: 0.6 }), pine: mat(0x2f7d5a), crystal: mat(0x9ee8ff, { emissive: 0x58d0ff, emissiveIntensity: 0.6, roughness: 0.2 }),
    carrot: mat(0xff8a1a), building: new THREE.MeshStandardMaterial({ map: windowTexture(), emissive: 0xffffff, roughness: 0.7, emissiveIntensity: 0.9 }),
    stick: mat(0xffffff, { roughness: 0.4 }), candyA: mat(0xff4f9a, { roughness: 0.3 }), candyB: mat(0x4ad6ff, { roughness: 0.3 }), candyC: mat(0xffe14a, { roughness: 0.3 }), candyD: mat(0x7ee37a, { roughness: 0.3 }),
    cupcake: mat(0xffd1e8), cream: mat(0xfff6f0), cherryR: mat(0xd4142a, { roughness: 0.3 }),
    coral: mat(0xff7f6a), coralB: mat(0xffb04a), weed: mat(0x2fae6a), shell: mat(0xffe8d6),
    darkrock: mat(0x2a2222), glow: mat(0xff5a00, { emissive: 0xff5a00, emissiveIntensity: 1.2 }), deadtree: mat(0x3a2a22),
    pinkA: mat(0xffb3d1), pinkB: mat(0xff8fbf), torii: mat(0xd23a3a), lantern: mat(0xffd27a, { emissive: 0xffa03a, emissiveIntensity: 0.9 }),
    mushStem: mat(0xf2ead8), mushA: mat(0x8affd8, { emissive: 0x3affc0, emissiveIntensity: 0.9 }), mushB: mat(0xd28aff, { emissive: 0xa03aff, emissiveIntensity: 0.9 }), darkPine: mat(0x173a2a),
    asteroid: mat(0x6a6a78, { roughness: 1 }),
  };
  M.building.emissiveMap = M.building.map;
  matCache.set(themeId, M);
  return M;
}

const cmCache = new Map();
const cm = (hex, o = {}) => { const k = hex + JSON.stringify(o); if (!cmCache.has(k)) cmCache.set(k, mat(hex, o)); return cmCache.get(k); };
const glowM = (hex, i = 0.9) => cm(hex, { emissive: hex, emissiveIntensity: i, roughness: 0.4 });

// Scenery recipes for the newer worlds. (b = batch, ty = top of the little island)
function kitItem(b, kit, x, ty, z, r, side) {
  const tree = (trunk, leaf, leaf2, h = 1.3, s = 0.95) => { b.add(G.cyl, cm(trunk), V(x, ty + h / 2, z), E(), V(0.16, h, 0.16)); b.add(G.ico, cm(leaf), V(x, ty + h + 0.4, z), E(), V(s, s * 0.9, s)); if (leaf2) b.add(G.ico, cm(leaf2), V(x + 0.35, ty + h + 0.15, z + 0.2), E(), V(s * 0.55, s * 0.5, s * 0.55)); };
  const palm = (h = 2.2) => { for (let i = 0; i < 4; i++) b.add(G.cyl, cm(0x9a6a3a), V(x + i * 0.08, ty + i * h / 4 + h / 8, z), E(0, 0, -0.08 * i), V(0.12, h / 4 + 0.05, 0.12)); for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; b.add(G.cone, cm(0x2fa84a), V(x + 0.3 + Math.cos(a) * 0.55, ty + h + 0.05, z + Math.sin(a) * 0.55), E(Math.sin(a) * 1.2, 0, -Math.cos(a) * 1.2), V(0.18, 1.1, 0.05)); } };
  const house = (wall, roof) => { b.add(G.box, cm(wall), V(x, ty + 0.4, z), E(), V(1.1, 0.8, 0.9)); b.add(G.pyr, cm(roof), V(x, ty + 1.05, z), E(0, Math.PI / 4, 0), V(0.95, 0.6, 0.95)); b.add(G.box, cm(0x5a3a1a), V(x, ty + 0.25, z + 0.46), E(), V(0.25, 0.45, 0.02)); };
  const rock = (col, s = 0.6) => b.add(G.dodec, cm(col, { roughness: 1 }), V(x, ty + s * 0.6, z), E(r * 3, r * 5, 0), V(s, s * 0.8, s * 0.9));
  const crystal = (col, s = 0.5) => { b.add(G.octa, glowM(col, 0.7), V(x, ty + s * 1.4, z), E(0, r * 6, 0.2), V(s * 0.6, s * 1.6, s * 0.6)); b.add(G.octa, glowM(col, 0.7), V(x + 0.35, ty + s * 0.8, z + 0.2), E(0, r * 3, -0.4), V(s * 0.35, s, s * 0.35)); };
  const pumpkin = () => { b.add(G.sph, cm(0xff8a1a, { roughness: 0.6 }), V(x, ty + 0.35, z), E(), V(0.5, 0.38, 0.5)); b.add(G.cyl, cm(0x3a6a2a), V(x, ty + 0.78, z), E(), V(0.05, 0.18, 0.05)); };
  const gift = (col, rib) => { b.add(G.box, cm(col, { roughness: 0.4 }), V(x, ty + 0.3, z), E(0, r * 3, 0), V(0.6, 0.6, 0.6)); b.add(G.box, cm(rib), V(x, ty + 0.3, z), E(0, r * 3, 0), V(0.64, 0.62, 0.12)); b.add(G.box, cm(rib), V(x, ty + 0.3, z), E(0, r * 3, 0), V(0.12, 0.62, 0.64)); };
  const mush = (cap) => { b.add(G.cyl, cm(0xf2ead8), V(x, ty + 0.35, z), E(), V(0.12, 0.7, 0.12)); b.add(G.half, glowM(cap, 0.6), V(x, ty + 0.7, z), E(), V(0.5, 0.35, 0.5)); };
  const pine = (leaf, snow) => { b.add(G.cyl, cm(0x6a4a2a), V(x, ty + 0.3, z), E(), V(0.13, 0.6, 0.13)); b.add(G.cone, cm(leaf), V(x, ty + 1.2, z), E(), V(0.8, 1.6, 0.8)); if (snow) b.add(G.cone, cm(0xffffff), V(x, ty + 1.8, z), E(), V(0.45, 0.6, 0.45)); };
  switch (kit) {
    case 'village':
      if (r < 0.3) house(0xd8b078, 0x8a5a2a);
      else if (r < 0.55) tree(0x7a4a22, 0x3f9a3a, 0x5ab84a, 1.5);
      else if (r < 0.8) for (let k = 0; k < 5; k++) b.add(G.cone, cm(k % 2 ? 0x9ad65a : 0x7cc84a), V(x + (k - 2) * 0.28, ty + 0.3, z + (k % 2) * 0.25), E(), V(0.1, 0.6, 0.1));
      else { b.add(G.box, cm(0x8a5a2a), V(x + side * 2, -8.4, z), E(), V(0.8, 0.3, 2.4)); b.add(G.cyl, cm(0x6a4a2a), V(x + side * 2, -7.6, z), E(), V(0.05, 1.4, 0.05)); b.add(G.box, cm(0xfff4d8), V(x + side * 2, -7.4, z + 0.3), E(), V(0.04, 0.8, 0.6)); }
      break;
    case 'beach':
      if (r < 0.45) palm();
      else if (r < 0.65) { b.add(G.cyl, cm(0xff5a5a), V(x, ty + 0.9, z), E(), V(0.04, 1.8, 0.04)); b.add(G.cone, cm(0xffe14a), V(x, ty + 1.7, z), E(), V(0.9, 0.35, 0.9)); }
      else if (r < 0.85) { b.add(G.half, cm(0xffe8d6), V(x, ty, z), E(), V(0.4, 0.25, 0.3)); b.add(G.sph, cm(0xff8a5a), V(x + 0.5, ty + 0.15, z), E(), V(0.18, 0.08, 0.18)); }
      else b.add(G.sph, cm(0xffffff), V(x, ty + 0.25, z), E(), V(0.25, 0.25, 0.25));
      break;
    case 'sundarbans':
      if (r < 0.6) { for (let k = 0; k < 4; k++) b.add(G.cyl, cm(0x5a3a22), V(x + Math.cos(k * 1.6) * 0.3, ty + 0.25, z + Math.sin(k * 1.6) * 0.3), E(Math.sin(k * 1.6) * 0.5, 0, -Math.cos(k * 1.6) * 0.5), V(0.05, 0.6, 0.05)); tree(0x4a3020, 0x2a6a2a, 0x3a7a3a, 1.2, 1.05); }
      else if (r < 0.85) for (let k = 0; k < 4; k++) b.add(G.cone, cm(0x3a8a3a), V(x + (k - 1.5) * 0.3, ty + 0.4, z), E(0, 0, (k - 1.5) * 0.2), V(0.08, 0.8, 0.08));
      else rock(0x5a5a4a);
      break;
    case 'autumn':
      if (r < 0.65) tree(0x6a3a1a, r < 0.3 ? 0xe85a1a : 0xffa62a, 0xd8381a, 1.4);
      else if (r < 0.85) b.add(G.ico, cm(0xd88a2a), V(x, ty + 0.3, z), E(), V(0.55, 0.35, 0.55));
      else pumpkin();
      break;
    case 'pirate':
      if (r < 0.4) palm(2);
      else if (r < 0.65) { b.add(G.cyl, cm(0x8a5a2a), V(x, ty + 0.35, z), E(), V(0.3, 0.7, 0.3)); b.add(G.torus, cm(0x4a3a2a), V(x, ty + 0.2, z), E(Math.PI / 2), V(0.3, 0.3, 0.3)); }
      else if (r < 0.85) { b.add(G.box, cm(0x7a4a1a), V(x, ty + 0.25, z), E(), V(0.7, 0.45, 0.45)); b.add(G.box, cm(0xffd23a, { metalness: 0.7, roughness: 0.3 }), V(x, ty + 0.36, z), E(), V(0.72, 0.08, 0.47)); }
      else { const sx = x + side * 6; b.add(G.box, cm(0x6a3a1a), V(sx, -8, z), E(), V(1.6, 1, 5)); b.add(G.cyl, cm(0x4a2a12), V(sx, -5.5, z), E(), V(0.1, 4, 0.1)); b.add(G.box, cm(0x1a1a1a), V(sx, -5, z + 0.1), E(), V(0.05, 2, 2.2)); }
      break;
    case 'jungle':
      if (r < 0.45) tree(0x5a3a1a, 0x1f8a3a, 0x2fae4a, 2, 1.2);
      else if (r < 0.8) for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; b.add(G.cone, cm(0x2fae4a), V(x + Math.cos(a) * 0.3, ty + 0.5, z + Math.sin(a) * 0.3), E(Math.sin(a) * 0.7, 0, -Math.cos(a) * 0.7), V(0.15, 1.2, 0.05)); }
      else { b.add(G.sph, cm(0xff4a8a), V(x, ty + 0.3, z), E(), V(0.2, 0.2, 0.2)); b.add(G.sph, cm(0xffd23a), V(x + 0.3, ty + 0.25, z + 0.1), E(), V(0.18, 0.18, 0.18)); }
      break;
    case 'dino':
      if (r < 0.35) { for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; b.add(G.cone, cm(0x4a8a2a), V(x + Math.cos(a) * 0.25, ty + 0.5, z + Math.sin(a) * 0.25), E(Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9), V(0.18, 1.1, 0.05)); } }
      else if (r < 0.6) { b.add(G.sph, cm(0xf0e8c8), V(x, ty + 0.35, z), E(), V(0.28, 0.38, 0.28)); b.add(G.sph, cm(0xd8e8a8), V(x + 0.4, ty + 0.3, z + 0.1), E(), V(0.22, 0.3, 0.22)); }
      else if (r < 0.85) rock(0x8a7a5a, 0.7);
      else { const vx = x + side * 16; b.add(G.cone, cm(0x5a4a3a), V(vx, -4, z - 18), E(), V(8, 10, 8)); b.add(G.sph, glowM(0xff5a00, 1), V(vx, 1, z - 18), E(), V(1.5, 0.6, 1.5)); }
      break;
    case 'halloween':
      if (r < 0.4) pumpkin();
      else if (r < 0.6) { b.add(G.box, cm(0x8a8a90), V(x, ty + 0.4, z), E(0, 0, (r - 0.5) * 0.6), V(0.5, 0.8, 0.15)); b.add(G.cyl, cm(0x8a8a90), V(x, ty + 0.8, z), E(Math.PI / 2), V(0.25, 0.15, 0.25)); }
      else if (r < 0.85) { b.add(G.cyl, cm(0x2a1a1a), V(x, ty + 0.8, z), E(), V(0.1, 1.6, 0.1)); b.add(G.cyl, cm(0x2a1a1a), V(x + 0.3, ty + 1.2, z), E(0, 0, -0.9), V(0.05, 0.7, 0.05)); b.add(G.cyl, cm(0x2a1a1a), V(x - 0.25, ty + 1.4, z), E(0, 0, 0.8), V(0.05, 0.6, 0.05)); }
      else house(0x3a2a3a, 0x1a0a1a);
      break;
    case 'crystal': crystal([0x5ad1ff, 0xb07aff, 0xff7ad8, 0x7affb0][Math.floor(r * 40) % 4], 0.6 + r * 0.4); break;
    case 'festive':
      if (r < 0.45) { pine(0x1f7a3a, true); b.add(G.sph, glowM(0xffd23a, 1), V(x, ty + 2.3, z), E(), V(0.12, 0.12, 0.12)); b.add(G.sph, glowM(0xff3a3a, 0.9), V(x + 0.3, ty + 1.2, z + 0.3), E(), V(0.08, 0.08, 0.08)); }
      else if (r < 0.75) gift([0xff3a5a, 0x3a8aff, 0x4ade80][Math.floor(r * 30) % 3], 0xffd23a);
      else { b.add(G.sph, cm(0xffffff), V(x, ty + 0.45, z), E(), V(0.45, 0.45, 0.45)); b.add(G.sph, cm(0xffffff), V(x, ty + 1.05, z), E(), V(0.3, 0.3, 0.3)); b.add(G.cone, cm(0xd4142a), V(x, ty + 1.45, z), E(), V(0.22, 0.4, 0.22)); }
      break;
    case 'sky':
      for (let k = 0; k < 3; k++) b.add(G.ico, cm(0xffffff, { roughness: 1 }), V(x + (k - 1) * 0.7, ty + 0.2 + (k % 2) * 0.2, z), E(), V(0.6, 0.5, 0.6));
      if (r > 0.7) b.add(G.torus, cm([0xff7a7a, 0xffd23a, 0x7ad8ff][Math.floor(r * 30) % 3], { emissive: 0xffffff, emissiveIntensity: 0.15 }), V(x + side * 3, ty + 1, z), E(0, Math.PI / 2, 0), V(1.4, 1.4, 1.4));
      break;
    case 'factory':
      if (r < 0.4) { b.add(G.disc, cm(0x8a8e98, { metalness: 0.7, roughness: 0.35 }), V(x, ty + 0.7, z), E(Math.PI / 2, 0, 0), V(0.6, 0.15, 0.6)); for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; b.add(G.box, cm(0x8a8e98, { metalness: 0.7 }), V(x + Math.cos(a) * 0.68, ty + 0.7 + Math.sin(a) * 0.68, z), E(0, 0, a), V(0.18, 0.15, 0.15)); } }
      else if (r < 0.7) { b.add(G.cyl, cm(0x5a606a, { metalness: 0.5 }), V(x, ty + 1.2, z), E(), V(0.3, 2.4, 0.3)); b.add(G.cyl, glowM(0xffc800, 0.6), V(x, ty + 2.45, z), E(), V(0.32, 0.1, 0.32)); }
      else { b.add(G.box, cm(0xffc800), V(x, ty + 0.3, z), E(), V(0.6, 0.6, 0.6)); b.add(G.box, cm(0x1a1a1a), V(x, ty + 0.3, z), E(), V(0.62, 0.15, 0.62)); }
      break;
    case 'arctic':
      if (r < 0.45) b.add(G.octa, cm(0xd8f4ff, { roughness: 0.2 }), V(x, ty + 0.6, z), E(0, r * 5, 0), V(0.6, 0.9, 0.6));
      else if (r < 0.75) pine(0x2a5a4a, true);
      else { b.add(G.sph, cm(0x1a1a2a), V(x, ty + 0.35, z), E(), V(0.25, 0.35, 0.22)); b.add(G.sph, cm(0xffffff), V(x, ty + 0.33, z + 0.08), E(), V(0.18, 0.28, 0.16)); b.add(G.cone, cm(0xffa020), V(x, ty + 0.55, z + 0.25), E(Math.PI / 2), V(0.05, 0.12, 0.05)); }
      break;
    case 'rainbow':
      if (r < 0.4) tree(0xffffff, [0xff8ad8, 0x8ad8ff, 0xfff08a, 0xb8ff8a][Math.floor(r * 40) % 4], 0xffffff, 1.2);
      else if (r < 0.7) { b.add(G.cyl, cm(0xffffff), V(x, ty + 0.6, z), E(), V(0.05, 1.2, 0.05)); b.add(G.disc, cm([0xff4f9a, 0x4ad6ff, 0xffe14a][Math.floor(r * 30) % 3]), V(x, ty + 1.3, z), E(Math.PI / 2, 0, 0), V(0.45, 0.1, 0.45)); }
      else crystal(0xff9af0, 0.5);
      break;
    case 'moon':
      if (r < 0.6) { rock(0x9a9ea8, 0.5 + r * 0.6); }
      else if (r < 0.8) { b.add(G.cyl, cm(0xdddddd), V(x, ty + 0.7, z), E(), V(0.03, 1.4, 0.03)); b.add(G.box, cm(0x3a6aff), V(x + 0.25, ty + 1.2, z), E(), V(0.5, 0.3, 0.02)); }
      else { b.add(G.half, cm(0xe8ecf4, { metalness: 0.4, roughness: 0.4 }), V(x, ty, z), E(), V(0.8, 0.6, 0.8)); b.add(G.sph, glowM(0x5ad1ff, 0.8), V(x, ty + 0.65, z), E(), V(0.08, 0.08, 0.08)); }
      break;
  }
}

function decoItem(batch, M, themeId, p) {
  const { x, y, z, r } = p;
  const kit = THEMES[themeId].kit;
  if (kit) {
    if (kit !== 'moon' && kit !== 'sky') { batch.add(G.cyl, M.island, V(x, y, z), E(), V(1.6, 0.35, 1.6)); batch.add(G.cone, M.dirt, V(x, y - 1.1, z), E(Math.PI, 0, 0), V(1.55, 1.9, 1.55)); }
    else if (kit === 'moon') batch.add(G.dodec, M.island, V(x, y - 0.4, z), E(r, r * 2, 0), V(1.5, 0.7, 1.4));
    kitItem(batch, kit, x, y + 0.17, z, r, p.side);
    return;
  }
  if (themeId === 'city') { const h = 6 + r * 22, w = 2.5 + r * 2.5; batch.add(G.box, M.building, V(x + p.side * (4 + r * 8), -9 + h / 2 + y, z), E(), V(w, h, w)); return; }
  if (themeId === 'space') { batch.add(G.dodec, M.asteroid, V(x + p.side * r * 4, y + r * 3, z), E(r * 5, r * 3, r), V(0.6 + r * 1.4, 0.5 + r, 0.6 + r * 1.2)); return; }
  batch.add(G.cyl, M.island, V(x, y, z), E(), V(1.6, 0.35, 1.6));
  batch.add(G.cone, M.dirt, V(x, y - 1.1, z), E(Math.PI, 0, 0), V(1.55, 1.9, 1.55));
  const ty = y + 0.17;
  switch (themeId) {
    case 'meadow':
      if (r < 0.55) { batch.add(G.cyl, M.trunk, V(x, ty + 0.65, z), E(), V(0.18, 1.3, 0.18)); batch.add(G.ico, r < 0.3 ? M.leafA : M.leafB, V(x, ty + 1.75, z), E(), V(0.95, 0.95, 0.95)); }
      else if (r < 0.8) for (let k = 0; k < 3; k++) { batch.add(G.cyl, M.leafA, V(x + k * 0.4 - 0.4, ty + 0.25, z), E(), V(0.04, 0.5, 0.04)); batch.add(G.sph, k % 2 ? M.flowerR : M.flowerY, V(x + k * 0.4 - 0.4, ty + 0.55, z), E(), V(0.17, 0.17, 0.17)); }
      else batch.add(G.ico, M.leafB, V(x, ty + 0.4, z), E(), V(0.7, 0.55, 0.7));
      break;
    case 'desert':
      if (r < 0.5) { batch.add(G.cyl, M.cactus, V(x, ty + 0.9, z), E(), V(0.28, 1.8, 0.28)); batch.add(G.cyl, M.cactus, V(x + 0.45, ty + 1.1, z), E(), V(0.16, 0.7, 0.16)); batch.add(G.cyl, M.cactus, V(x - 0.4, ty + 1.3, z), E(), V(0.15, 0.6, 0.15)); }
      else if (r < 0.85) batch.add(G.dodec, M.rock, V(x, ty + 0.4, z), E(r * 3, r * 5, 0), V(0.7, 0.55, 0.6));
      else batch.add(G.cone, M.pyramid, V(x + p.side * 18, -6, z - 20), E(0, Math.PI / 4, 0), V(9, 12, 9));
      break;
    case 'ice':
      if (r < 0.55) { batch.add(G.cyl, M.trunk, V(x, ty + 0.3, z), E(), V(0.14, 0.6, 0.14)); batch.add(G.cone, M.pine, V(x, ty + 1.2, z), E(), V(0.8, 1.4, 0.8)); batch.add(G.cone, M.snow, V(x, ty + 1.75, z), E(), V(0.5, 0.7, 0.5)); }
      else if (r < 0.75) { batch.add(G.sph, M.snow, V(x, ty + 0.45, z), E(), V(0.48, 0.48, 0.48)); batch.add(G.sph, M.snow, V(x, ty + 1.1, z), E(), V(0.32, 0.32, 0.32)); batch.add(G.cone, M.carrot, V(x, ty + 1.1, z + 0.4), E(Math.PI / 2), V(0.06, 0.3, 0.06)); }
      else batch.add(G.octa, M.crystal, V(x, ty + 0.7, z), E(0, r * 6, 0), V(0.4, 0.8, 0.4));
      break;
    case 'candy': {
      const cols = [M.candyA, M.candyB, M.candyC, M.candyD], c = cols[Math.floor(r * 40) % 4];
      if (r < 0.45) { batch.add(G.cyl, M.stick, V(x, ty + 0.8, z), E(), V(0.06, 1.6, 0.06)); batch.add(G.disc, c, V(x, ty + 1.7, z), E(Math.PI / 2, 0, 0), V(0.6, 0.12, 0.6)); }
      else if (r < 0.75) { batch.add(G.cyl, M.cupcake, V(x, ty + 0.3, z), E(), V(0.45, 0.6, 0.45)); batch.add(G.half, M.cream, V(x, ty + 0.6, z), E(), V(0.5, 0.45, 0.5)); batch.add(G.sph, M.cherryR, V(x, ty + 1.1, z), E(), V(0.13, 0.13, 0.13)); }
      else for (let k = 0; k < 3; k++) batch.add(G.half, cols[k % 4], V(x + k * 0.5 - 0.5, ty, z + (k % 2) * 0.3), E(), V(0.28, 0.35, 0.28));
      break;
    }
    case 'ocean':
      if (r < 0.45) for (let k = 0; k < 3; k++) batch.add(G.cyl, k % 2 ? M.coralB : M.coral, V(x + (k - 1) * 0.3, ty + 0.6, z), E(0, 0, (k - 1) * 0.4), V(0.09, 1.2 + k * 0.2, 0.09));
      else if (r < 0.8) for (let k = 0; k < 3; k++) batch.add(G.cone, M.weed, V(x + (k - 1) * 0.35, ty + 1, z + (k % 2) * 0.2), E(0, 0, (k - 1) * 0.15), V(0.12, 2 + k * 0.3, 0.12));
      else batch.add(G.half, M.shell, V(x, ty, z), E(), V(0.45, 0.3, 0.35));
      break;
    case 'volcano':
      if (r < 0.4) batch.add(G.dodec, M.darkrock, V(x, ty + 0.4, z), E(r * 3, r * 5, 0), V(0.7, 0.55, 0.6));
      else if (r < 0.7) { batch.add(G.cyl, M.deadtree, V(x, ty + 0.8, z), E(0, 0, 0.1), V(0.1, 1.6, 0.1)); batch.add(G.cyl, M.deadtree, V(x + 0.3, ty + 1.2, z), E(0, 0, -0.8), V(0.06, 0.7, 0.06)); }
      else { batch.add(G.cone, M.darkrock, V(x + p.side * 14, -5, z - 15), E(), V(7, 10, 7)); batch.add(G.sph, M.glow, V(x + p.side * 14, 0.2, z - 15), E(), V(1.6, 0.8, 1.6)); }
      break;
    case 'cherry':
      if (r < 0.6) { batch.add(G.cyl, M.trunk, V(x, ty + 0.65, z), E(), V(0.15, 1.3, 0.15)); batch.add(G.ico, M.pinkA, V(x, ty + 1.7, z), E(), V(0.95, 0.8, 0.95)); batch.add(G.ico, M.pinkB, V(x + 0.4, ty + 1.5, z + 0.2), E(), V(0.55, 0.5, 0.55)); }
      else if (r < 0.85) { batch.add(G.cyl, M.trunk, V(x, ty + 0.4, z), E(), V(0.05, 0.8, 0.05)); batch.add(G.box, M.lantern, V(x, ty + 0.95, z), E(), V(0.35, 0.45, 0.35)); }
      else { const tx = x + p.side * 3; batch.add(G.cyl, M.torii, V(tx - 1, ty + 1.3, z), E(), V(0.12, 2.6, 0.12)); batch.add(G.cyl, M.torii, V(tx + 1, ty + 1.3, z), E(), V(0.12, 2.6, 0.12)); batch.add(G.box, M.torii, V(tx, ty + 2.6, z), E(), V(2.8, 0.18, 0.25)); batch.add(G.box, M.torii, V(tx, ty + 2.2, z), E(), V(2.3, 0.12, 0.18)); }
      break;
    case 'forest':
      if (r < 0.5) { const m = r < 0.25 ? M.mushA : M.mushB; batch.add(G.cyl, M.mushStem, V(x, ty + 0.35, z), E(), V(0.12, 0.7, 0.12)); batch.add(G.half, m, V(x, ty + 0.7, z), E(), V(0.5, 0.35, 0.5)); batch.add(G.cyl, M.mushStem, V(x + 0.5, ty + 0.2, z + 0.2), E(), V(0.07, 0.4, 0.07)); batch.add(G.half, m, V(x + 0.5, ty + 0.4, z + 0.2), E(), V(0.26, 0.2, 0.26)); }
      else if (r < 0.85) { batch.add(G.cyl, M.trunk, V(x, ty + 0.4, z), E(), V(0.14, 0.8, 0.14)); batch.add(G.cone, M.darkPine, V(x, ty + 1.6, z), E(), V(0.8, 2.2, 0.8)); }
      else batch.add(G.octa, M.mushA, V(x, ty + 0.6, z), E(0, r * 6, 0), V(0.3, 0.6, 0.3));
      break;
  }
}

export function buildTrack(parent, data, themeId, quality) {
  const T = THEMES[themeId], M = themeMats(themeId);
  const shadows = quality === 'high';
  const root = new THREE.Group(); parent.add(root);
  const anim = [], disposables = [];

  // ---- Platforms ----
  const TH = 1.2, segMeshes = [];
  for (const s of data.segs) {
    const L = s.z0 - s.z1, curved = s.cx0 !== s.cx1 || s.y0 !== s.y1;
    const geo = new THREE.BoxGeometry(s.w, TH, L, 1, 1, curved ? 8 : 1); geo.translate(0, -TH / 2, 0);
    const p = geo.attributes.position, zc = (s.z0 + s.z1) / 2;
    for (let i = 0; i < p.count; i++) { const wz = p.getZ(i) + zc, info = segAt(s, wz); p.setXYZ(i, p.getX(i) + info.x, p.getY(i) + info.y, wz); }
    geo.computeVertexNormals();
    const top = M[s.type] || M.normal;
    const mesh = new THREE.Mesh(geo, [M.side, M.side, top, M.side, M.side, M.side]);
    mesh.receiveShadow = shadows; root.add(mesh); disposables.push(geo);
    if (s.type !== 'crumble') for (const side of [-1, 1]) {
      const eg = new THREE.BoxGeometry(0.14, 0.12, L, 1, 1, curved ? 8 : 1); eg.translate(0, 0.02, 0);
      const ep = eg.attributes.position;
      for (let i = 0; i < ep.count; i++) { const wz = ep.getZ(i) + zc, info = segAt(s, wz); ep.setXYZ(i, ep.getX(i) + info.x + side * (s.w / 2 - 0.07), ep.getY(i) + info.y, wz); }
      eg.computeVertexNormals(); mesh.add(new THREE.Mesh(eg, M.edge)); disposables.push(eg);
    }
    s.mesh = mesh; segMeshes.push(s);
    if (s.wind) for (let k = 0; k < 5; k++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiTexture('💨', 64), transparent: true, opacity: 0.85, depthWrite: false }));
      sp.scale.set(0.9, 0.9, 1); if (s.wind < 0) sp.material.rotation = Math.PI; root.add(sp); disposables.push(sp.material);
      const zz = s.z0 - (k + 0.5) * L / 5, info = segAt(s, zz), ph = k / 5;
      anim.push((dt, t) => { const f = (t * 0.5 + ph) % 1; sp.position.set(info.x + Math.sign(s.wind) * (f - 0.5) * s.w, info.y + 0.8 + Math.sin(t * 3 + k) * 0.2, zz); });
    }
  }
  anim.push((dt, t) => {
    for (const s of segMeshes) {
      if (s.type === 'moving') { const v = Math.sin(t * s.freq + s.phase) * s.amp; s.delta = v - (s.offset || 0); s.offset = v; s.mesh.position.x = v; }
      else if (s.type === 'crumble') {
        if (s.fallen) { s.fallV = (s.fallV || 0) + 25 * dt; s.mesh.position.y -= s.fallV * dt; s.mesh.visible = s.mesh.position.y > -20; }
        else if (s.triggered) s.mesh.position.x = Math.sin(t * 60) * 0.05;
        else { s.mesh.position.set(0, 0, 0); s.mesh.visible = true; s.fallV = 0; }
      }
    }
  });

  // ---- Scenery ----
  const batch = new Batch();
  for (const p of data.deco) decoItem(batch, M, themeId, p);
  disposables.push(...batch.build(root));

  // ---- Coins: shiny gold discs with a star emblem + soft glow ----
  const coinGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.09, 32, 1); coinGeo.rotateX(Math.PI / 2);
  const env = coinEnv();
  const coinEdge = new THREE.MeshStandardMaterial({ color: 0xffc928, metalness: 0.9, roughness: 0.22, envMap: env, envMapIntensity: 1.1, emissive: 0x6a4200, emissiveIntensity: 0.12 });
  const coinFaceMat = new THREE.MeshStandardMaterial({ map: coinFace(), metalness: 0.65, roughness: 0.28, envMap: env, envMapIntensity: 1.0, emissive: 0x7a5200, emissiveIntensity: 0.1 });
  const count = Math.max(1, data.coins.length);
  const coinMesh = new THREE.InstancedMesh(coinGeo, [coinEdge, coinFaceMat, coinFaceMat], count);
  coinMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); coinMesh.castShadow = shadows; coinMesh.frustumCulled = false;
  const glowGeo = new THREE.PlaneGeometry(1.05, 1.05);
  const glowMat = new THREE.MeshBasicMaterial({ map: SPRITE, color: T.night ? 0xffc23a : 0xffe27a, transparent: true, opacity: T.night ? 0.16 : 0.1, blending: THREE.AdditiveBlending, depthWrite: false });
  const coinGlow = new THREE.InstancedMesh(glowGeo, glowMat, count); coinGlow.instanceMatrix.setUsage(THREE.DynamicDrawUsage); coinGlow.frustumCulled = false;
  root.add(coinMesh, coinGlow); disposables.push(coinGeo, coinEdge, coinFaceMat, glowGeo, glowMat);
  const coins = data.coins.map((c) => ({ ...c, home: V(c.x, c.y, c.z), pos: V(c.x, c.y, c.z), taken: false, pop: 0 }));

  // ---- Gem ----
  const gemGeo = new THREE.OctahedronGeometry(0.45);
  const gemMat = mat(0x35e6df, { roughness: 0.15, metalness: 0.2, emissive: 0x1aa6a0, emissiveIntensity: 0.6 });
  disposables.push(gemGeo, gemMat);
  const gems = data.gems.map((g) => { const m = new THREE.Mesh(gemGeo, gemMat); m.position.set(g.x, g.y, g.z); root.add(m); return { mesh: m, taken: false }; });

  // ---- Power-ups ----
  const PCOL = { speed: 0xffd34a, shield: 0x5ad1ff, magnet: 0xff5a6a, double: 0xffffff, slow: 0x7ee37a, ghost: 0xc8b8ff, x2: 0xffb52e };
  const PEMO = { speed: '⚡', shield: '🛡️', magnet: '🧲', double: '🪽', slow: '🐢', ghost: '👻', x2: '✖️' };
  const bubbleGeo = new THREE.SphereGeometry(0.55, 20, 14); disposables.push(bubbleGeo);
  const powerups = data.powerups.map((p) => {
    const g = new THREE.Group();
    const bm = new THREE.MeshStandardMaterial({ color: PCOL[p.kind], transparent: true, opacity: 0.35, roughness: 0.1, emissive: PCOL[p.kind], emissiveIntensity: 0.5, depthWrite: false });
    const icon = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiTexture(PEMO[p.kind], 96), depthWrite: false })); icon.scale.set(0.75, 0.75, 1);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: SPRITE, color: PCOL[p.kind], transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending })); halo.scale.set(2, 2, 1);
    g.add(new THREE.Mesh(bubbleGeo, bm), halo, icon); disposables.push(bm, icon.material, halo.material);
    g.position.set(p.x, p.y, p.z); root.add(g);
    return { ...p, mesh: g, taken: false };
  });

  // ---- Pads ----
  const pads = data.pads.map((p) => {
    let mesh;
    if (p.type === 'jump') {
      mesh = new THREE.Group();
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.85, 0.16, 20), mat(0x2a8a3a)); base.position.y = 0.08;
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.06, 20), mat(0x7eff6a, { emissive: 0x3aff3a, emissiveIntensity: 0.7 })); top.position.y = 0.18;
      const arrow = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiTexture('⏫', 64), depthWrite: false })); arrow.scale.set(0.7, 0.7, 1); arrow.position.y = 0.8;
      mesh.add(base, top, arrow); disposables.push(base.geometry, base.material, top.geometry, top.material, arrow.material);
      anim.push((dt, t) => { arrow.position.y = 0.8 + Math.sin(t * 6) * 0.15; });
    } else {
      const c = document.createElement('canvas'); c.width = 64; c.height = 128; const g = c.getContext('2d');
      g.fillStyle = '#2a2a2a'; g.fillRect(0, 0, 64, 128); g.fillStyle = '#ffd23a';
      for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(8, 40 + i * 36); g.lineTo(32, 16 + i * 36); g.lineTo(56, 40 + i * 36); g.lineTo(56, 52 + i * 36); g.lineTo(32, 28 + i * 36); g.lineTo(8, 52 + i * 36); g.fill(); }
      const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
      const m = new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.6, roughness: 0.6 });
      mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 3), m); mesh.rotation.x = -Math.PI / 2; mesh.position.y = 0.03;
      disposables.push(mesh.geometry, m, tex);
    }
    const g = new THREE.Group(); g.add(mesh); g.position.set(p.x, p.y, p.z); root.add(g);
    return { ...p, mesh: g };
  });

  // ---- Obstacles ----
  const red = mat(0xff5a5a, { roughness: 0.5 }), white = mat(0xffffff), metal = mat(0x8a93a6, { metalness: 0.7, roughness: 0.35 }), dark = mat(0x3a3f4f), stone = mat(0x8c7b6b, { roughness: 1 });
  const laserMat = new THREE.MeshBasicMaterial({ color: 0xff2a3a, transparent: true, opacity: 0.9 });
  disposables.push(red, white, metal, dark, stone, laserMat);
  const obstacles = data.obstacles.map((o) => {
    const ob = { ...o };
    if (o.type === 'bumper') {
      ob.mesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.9), red); ob.mesh.add(new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.16, 0.92), white));
      const bp = segAt(o.seg, o.z); ob.mesh.position.set(bp.x, bp.y + 0.4, o.z);
    } else if (o.type === 'spike') {
      ob.mesh = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.9, 8), metal); ob.mesh.position.set(o.x, o.y + 0.45, o.z);
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.1, 10), dark); b.position.y = -0.45; ob.mesh.add(b);
    } else if (o.type === 'hammer') {
      ob.len = 3.6; ob.mesh = new THREE.Group();
      const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 4.6, 8), dark); postL.position.set(-2.6, 2.3, 0);
      const postR = postL.clone(); postR.position.x = 2.6;
      const beam = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.25, 0.25), dark); beam.position.y = 4.6;
      ob.pivot = new THREE.Group(); ob.pivot.position.y = 4.6;
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, ob.len, 6), metal); arm.position.y = -ob.len / 2;
      const head = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.3, 14), red); head.rotation.x = Math.PI / 2; head.position.y = -ob.len;
      ob.pivot.add(arm, head); ob.mesh.add(postL, postR, beam, ob.pivot); ob.mesh.position.set(o.x, o.y, o.z);
    } else if (o.type === 'boulder') {
      ob.mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.85, 1), stone); ob.home = o.z; ob.cur = o.z; ob.active = false;
      ob.mesh.visible = false; ob.mesh.position.set(o.x, segAt(o.seg, o.z).y + 0.85, o.z);
    } else if (o.type === 'laser') {
      ob.mesh = new THREE.Group();
      for (const sx of [-1, 1]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.2, 0.25), dark); post.position.set(sx * (o.w / 2 + 0.05), 0.6, 0);
        const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), laserMat); lamp.position.set(sx * (o.w / 2 + 0.05), 1.25, 0);
        ob.mesh.add(post, lamp);
      }
      ob.beam = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, o.w, 8), laserMat); ob.beam.rotation.z = Math.PI / 2; ob.beam.position.y = 0.45;
      ob.glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: SPRITE, color: 0xff3a3a, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }));
      ob.glow.scale.set(o.w, 0.8, 1); ob.glow.position.y = 0.45;
      ob.mesh.add(ob.beam, ob.glow); disposables.push(ob.glow.material);
      ob.mesh.position.set(o.x, o.y, o.z);
    }
    else if (o.type === 'saw') {
      ob.mesh = new THREE.Group();
      const blade = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.08, 16), metal); blade.rotation.x = Math.PI / 2;
      for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2, tooth = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.22, 4), metal); tooth.position.set(Math.cos(a) * 0.6, Math.sin(a) * 0.6, 0); tooth.rotation.z = a - Math.PI / 2; blade.add(tooth); }
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.12, 10), red); hub.rotation.x = Math.PI / 2;
      ob.blade = new THREE.Group(); ob.blade.add(blade, hub); ob.blade.position.y = 0.5; ob.mesh.add(ob.blade);
      const sp = segAt(o.seg, o.z); ob.mesh.position.set(sp.x, sp.y, o.z);
    } else if (o.type === 'sweeper') {
      ob.mesh = new THREE.Group();
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.6, 10), dark); post.position.y = 0.3;
      ob.bar = new THREE.Group(); ob.bar.position.y = 0.38;
      const bar = new THREE.Mesh(new THREE.BoxGeometry(o.len * 2, 0.22, 0.22), red); bar.add(new THREE.Mesh(new THREE.BoxGeometry(o.len * 2 + 0.02, 0.08, 0.24), white));
      ob.bar.add(bar); ob.mesh.add(post, ob.bar); ob.mesh.position.set(o.x, o.y, o.z);
    } else if (o.type === 'wall') {
      ob.mesh = new THREE.Group();
      const holeW = 1.6, left = o.hole - holeW / 2 + o.w / 2, right = o.w / 2 - (o.hole + holeW / 2);
      const wm = mat(0xc8584a, { roughness: 0.9 }), cap = mat(0xffffff);
      if (left > 0.05) { const l = new THREE.Mesh(new THREE.BoxGeometry(left, 1.4, 0.4), wm); l.position.set(-o.w / 2 + left / 2, 0.7, 0); ob.mesh.add(l); }
      if (right > 0.05) { const r2 = new THREE.Mesh(new THREE.BoxGeometry(right, 1.4, 0.4), wm); r2.position.set(o.w / 2 - right / 2, 0.7, 0); ob.mesh.add(r2); }
      const top = new THREE.Mesh(new THREE.BoxGeometry(o.w, 0.3, 0.44), cap); top.position.y = 2.1; ob.mesh.add(top);
      const arrow = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiTexture('⬇️', 64), depthWrite: false })); arrow.scale.set(0.6, 0.6, 1); arrow.position.set(o.hole, 1.6, 0); ob.mesh.add(arrow);
      disposables.push(wm, cap, arrow.material); ob.mesh.position.set(o.x, o.y, o.z);
    } else if (o.type === 'popspikes') {
      ob.mesh = new THREE.Group();
      const plate = new THREE.Mesh(new THREE.BoxGeometry(o.w - 0.2, 0.06, 1.2), dark); plate.position.y = 0.03; ob.mesh.add(plate);
      ob.spikes = new THREE.Group();
      for (let i = 0; i < Math.floor(o.w / 0.6); i++) for (const zz of [-0.3, 0.3]) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.6, 6), metal); c.position.set(-o.w / 2 + 0.4 + i * 0.6, 0.3, zz); ob.spikes.add(c); }
      ob.mesh.add(ob.spikes); ob.mesh.position.set(o.x, o.y, o.z);
    } else if (o.type === 'crusher') {
      ob.mesh = new THREE.Group();
      const frameM = dark;
      for (const sx of [-0.9, 0.9]) { const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 4, 0.15), frameM); p2.position.set(sx, 2, 0); ob.mesh.add(p2); }
      const beam = new THREE.Mesh(new THREE.BoxGeometry(2, 0.2, 0.3), frameM); beam.position.y = 4; ob.mesh.add(beam);
      ob.block = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1, 1.3), mat(0x7a7e8a, { metalness: 0.5, roughness: 0.5 }));
      const face = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiTexture('😠', 64), depthWrite: false })); face.scale.set(0.7, 0.7, 1); face.position.z = 0.7; ob.block.add(face); disposables.push(face.material);
      ob.block.position.y = 3.3; ob.mesh.add(ob.block);
      ob.shadow = new THREE.Mesh(new THREE.CircleGeometry(0.8, 16), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3, depthWrite: false })); ob.shadow.rotation.x = -Math.PI / 2; ob.shadow.position.y = 0.03; ob.mesh.add(ob.shadow);
      ob.mesh.position.set(o.x, o.y, o.z);
    } else if (o.type === 'cannon') {
      ob.mesh = new THREE.Group();
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.6), dark); base.position.set(o.side * (o.w / 2 + 0.5), 0.2, 0);
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.9, 12), mat(0x2a2a2a, { metalness: 0.6 })); barrel.rotation.z = Math.PI / 2; barrel.position.set(o.side * (o.w / 2 + 0.3), 0.55, 0);
      ob.ball = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), mat(0x1a1a1a, { metalness: 0.5, roughness: 0.4 })); ob.ball.visible = false;
      ob.mesh.add(base, barrel, ob.ball); ob.mesh.position.set(o.x, o.y, o.z);
    }
    ob.mesh.traverse((m) => { if (m.isMesh) m.castShadow = shadows; });
    root.add(ob.mesh);
    return ob;
  });

  // ---- Hidden treasure chests ----
  const chests = (data.chests || []).map((c) => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.5), mat(0x8a4a1a, { roughness: 0.7 }));
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.7, 12, 1, false, 0, Math.PI), mat(0x9a5a22, { roughness: 0.7 })); lid.rotation.z = Math.PI / 2; lid.position.y = 0.22;
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.08, 0.52), mat(0xffd23a, { metalness: 0.8, roughness: 0.3 })); band.position.y = 0.05;
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: SPRITE, color: 0xffe27a, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false })); halo.scale.set(1.6, 1.6, 1);
    g.add(body, lid, band, halo); disposables.push(body.geometry, body.material, lid.geometry, lid.material, band.geometry, band.material, halo.material);
    g.position.set(c.x, c.y, c.z); root.add(g);
    return { ...c, mesh: g, taken: false };
  });

  // ---- Checkpoints ----
  const checkpoints = data.checkpoints.map((c) => {
    const g = new THREE.Group(), fm = mat(0x4ade80, { emissive: 0x16a34a, emissiveIntensity: 0.3 }); disposables.push(fm);
    for (const sx of [-1, 1]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.4, 6), white); pole.position.set(sx * (c.seg.w / 2 - 0.2), 1.2, 0);
      const flag = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.04), fm); flag.position.set(sx * (c.seg.w / 2 - 0.2) - sx * 0.38, 2.1, 0);
      g.add(pole, flag);
    }
    g.position.set(c.x, c.y, c.z); root.add(g);
    return { ...c, mesh: g, reached: false, flagMat: fm };
  });

  // ---- Finish gate (levels only) ----
  let finish = null;
  if (data.finishZ !== undefined) {
    finish = new THREE.Group();
    const end = data.segs[data.segs.length - 1];
    const archMat = mat(data.boss ? 0xffd23a : 0x8d65ff, { emissive: data.boss ? 0xff9a00 : 0x5b2aff, emissiveIntensity: 0.4 });
    const glowMat2 = new THREE.MeshBasicMaterial({ color: 0xfff2a0, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false });
    const barMat = mat(0xffe35b, { emissive: 0xffb000, emissiveIntensity: 0.5 });
    disposables.push(archMat, glowMat2, barMat);
    // Three bonus gates: roll through one to multiply the finish bonus
    const mults = data.gates || [2, 5, 3], cols = { 2: 0x4ade80, 3: 0x3fb7ff, 5: 0xffb52e };
    for (const sx of [-3.45, -1.15, 1.15, 3.45]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 3, 10), archMat); p.position.set(sx, 1.5, 0); finish.add(p); }
    const topBar = new THREE.Mesh(new THREE.BoxGeometry(7.1, 0.3, 0.3), barMat); topBar.position.y = 3; finish.add(topBar);
    mults.forEach((m, i) => {
      const gm = new THREE.MeshBasicMaterial({ color: cols[m] || 0xffffff, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false });
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 2.8), gm); pane.position.set((i - 1) * 2.3, 1.45, 0); finish.add(pane);
      const c = document.createElement('canvas'); c.width = 128; c.height = 64; const g2 = c.getContext('2d');
      g2.fillStyle = '#fff'; g2.font = 'bold 52px sans-serif'; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.lineWidth = 6; g2.strokeStyle = 'rgba(0,0,0,.45)';
      g2.strokeText('×' + m, 64, 34); g2.fillText('×' + m, 64, 34);
      const tx = new THREE.CanvasTexture(c); const lbl = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, depthWrite: false })); lbl.scale.set(1.3, 0.65, 1); lbl.position.set((i - 1) * 2.3, 2.4, 0.1); finish.add(lbl);
      disposables.push(gm, tx, lbl.material);
    });
    if (data.boss) { const crown = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiTexture('👑', 96) })); crown.scale.set(1.4, 1.4, 1); crown.position.y = 4.2; finish.add(crown); disposables.push(crown.material); }
    finish.position.set(end.cx1, end.y1, data.finishZ); root.add(finish);
  }

  return {
    root, anim, segs: data.segs, coins, coinMesh, coinGlow, gems, powerups, pads, obstacles, checkpoints, finish, chests, gates: data.gates || [2, 5, 3],
    minZ: data.segs.length ? data.segs[data.segs.length - 1].z1 : 0,
    dispose() { parent.remove(root); root.traverse((o) => { if ((o.isMesh || o.isPoints) && !SHARED.has(o.geometry)) o.geometry?.dispose(); }); disposables.forEach((d) => d.dispose && d.dispose()); },
  };
}
