// Builds the 3D world for a level: themed sky, water, clouds, birds, scenery,
// track, collectibles, power-ups and obstacles.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { segAt } from './levels.js';

export const THEMES = {
  meadow: { skyTop: 0x3fa9ff, skyBottom: 0xdaf2ff, fog: 0xc4e8ff, fogFar: 150, hemi: [0xeaf8ff, 0x4f7a45, 1.9], sun: 2.3,
    top: 0x7ed957, side: 0x9a6a3a, bridge: 0xc8955a, water: 0x2f9ee6, island: 0x5cc85a, clouds: true, birds: true },
  desert: { skyTop: 0xff8a50, skyBottom: 0xffe4b5, fog: 0xffd6a0, fogFar: 150, hemi: [0xfff0d8, 0x9a6a3a, 1.8], sun: 2.4,
    top: 0xf2c77b, side: 0xb9773f, bridge: 0x9b6b3e, water: 0xe8b46e, island: 0xe8b46e, clouds: true, birds: true, sunColor: 0xfff1b0 },
  ice: { skyTop: 0x7fbfff, skyBottom: 0xf2f9ff, fog: 0xe6f3ff, fogFar: 130, hemi: [0xffffff, 0x7fa6c8, 2.0], sun: 2.0,
    top: 0xeaf7ff, side: 0x7fb8dc, bridge: 0xa7d4ef, water: 0x6fc2e8, island: 0xf4fbff, clouds: true, snow: true },
  city: { skyTop: 0x05071c, skyBottom: 0x3b2370, fog: 0x231a4d, fogFar: 120, hemi: [0x8a7dff, 0x1a1030, 1.1], sun: 0.7,
    top: 0x2f3350, side: 0x1b1d33, bridge: 0x3d2f66, water: 0x0d0f2a, island: 0x2a2d4a, stars: true, neon: true, night: true },
};

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o });

// Merge many static meshes into one draw call per material (good for phones).
class Batch {
  constructor() { this.map = new Map(); }
  add(geo, material, pos, rot = new THREE.Euler(), scale = new THREE.Vector3(1, 1, 1)) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    g.applyMatrix4(new THREE.Matrix4().compose(pos, new THREE.Quaternion().setFromEuler(rot), scale));
    if (!this.map.has(material)) this.map.set(material, []);
    this.map.get(material).push(g);
  }
  build(parent, shadows) {
    for (const [m, list] of this.map) {
      const merged = mergeGeometries(list, false);
      list.forEach((g) => g.dispose());
      const mesh = new THREE.Mesh(merged, m); mesh.receiveShadow = shadows; mesh.castShadow = shadows;
      parent.add(mesh);
    }
  }
}

const G = {
  cyl: new THREE.CylinderGeometry(1, 1, 1, 10),
  cone: new THREE.ConeGeometry(1, 1, 10),
  ico: new THREE.IcosahedronGeometry(1, 1),
  dodec: new THREE.DodecahedronGeometry(1, 0),
  sph: new THREE.SphereGeometry(1, 12, 10),
  box: new THREE.BoxGeometry(1, 1, 1),
  octa: new THREE.OctahedronGeometry(1, 0),
};
const V = (x, y, z) => new THREE.Vector3(x, y, z);

function windowTexture() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 128;
  const g = c.getContext('2d'); g.fillStyle = '#141632'; g.fillRect(0, 0, 64, 128);
  for (let y = 6; y < 128; y += 12) for (let x = 6; x < 64; x += 12) {
    if (Math.random() < 0.55) { g.fillStyle = ['#ffe28a', '#7ff6ff', '#ff9bf0'][Math.floor(Math.random() * 3)]; g.fillRect(x, y, 6, 7); }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function roundSprite(color = '#ffffff', soft = true) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, color); gr.addColorStop(soft ? 0.4 : 0.8, color); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
export const SPRITE = roundSprite();

export function buildWorld(scene, level, quality) {
  const T = THEMES[level.theme];
  const shadows = quality === 'high';
  const root = new THREE.Group(); scene.add(root);
  const anim = []; // functions (dt, t, ballPos)
  const disposables = [];

  // ---------- Sky ----------
  scene.background = new THREE.Color(T.skyBottom);
  scene.fog = new THREE.Fog(T.fog, 30, T.fogFar);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(T.skyTop) }, bottom: { value: new THREE.Color(T.skyBottom) } },
    vertexShader: 'varying vec3 vp; void main(){ vp = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 bottom; varying vec3 vp; void main(){ float h = clamp(vp.y*1.4+0.15,0.0,1.0); gl_FragColor = vec4(mix(bottom, top, pow(h,0.8)),1.0); }',
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 24, 12), skyMat); sky.renderOrder = -1; root.add(sky);
  disposables.push(sky.geometry, skyMat);

  // Sun or moon
  const sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: roundSprite(T.night ? '#f4f1ff' : '#fff6c8', !T.night), color: T.sunColor || 0xffffff, fog: false, depthWrite: false }));
  sunSprite.scale.set(T.night ? 22 : 46, T.night ? 22 : 46, 1);
  root.add(sunSprite);
  anim.push((dt, t, b) => sunSprite.position.set(b.x - 60, b.y + 70, b.z - 260));

  // ---------- Water / ground far below ----------
  const seg = quality === 'high' ? 48 : 24;
  const waterGeo = new THREE.PlaneGeometry(360, 360, seg, seg); waterGeo.rotateX(-Math.PI / 2);
  const waterMat = new THREE.MeshStandardMaterial({ color: T.water, roughness: level.theme === 'desert' ? 1 : 0.25, metalness: T.night ? 0.6 : 0.1, flatShading: true });
  const water = new THREE.Mesh(waterGeo, waterMat); water.position.y = -9; root.add(water);
  disposables.push(waterGeo, waterMat);
  const wpos = waterGeo.attributes.position, base = Float32Array.from(wpos.array);
  const waveAmp = level.theme === 'desert' ? 1.2 : 0.45;
  anim.push((dt, t, b) => {
    water.position.x = Math.round(b.x / 7.5) * 7.5; water.position.z = Math.round(b.z / 7.5) * 7.5;
    for (let i = 0; i < wpos.count; i++) {
      const x = base[i * 3] + water.position.x, z = base[i * 3 + 2] + water.position.z;
      wpos.array[i * 3 + 1] = level.theme === 'desert'
        ? Math.sin(x * 0.05) * Math.cos(z * 0.04) * waveAmp * 3
        : Math.sin(x * 0.18 + t * 1.3) * Math.cos(z * 0.15 + t * 1.1) * waveAmp;
    }
    wpos.needsUpdate = true;
  });

  // ---------- Clouds ----------
  if (T.clouds) {
    const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0.92, fog: true });
    disposables.push(cloudMat);
    for (let i = 0; i < 14; i++) {
      const c = new THREE.Group();
      for (let k = 0; k < 4; k++) { const m = new THREE.Mesh(G.ico, cloudMat); m.scale.setScalar(2 + Math.random() * 2.2); m.position.set(k * 2.6 - 4, Math.random() * 1.2, Math.random() * 2); c.add(m); }
      c.position.set((Math.random() - 0.5) * 140, 10 + Math.random() * 18, 10 - Math.random() * 200);
      c.userData.speed = 0.6 + Math.random();
      root.add(c);
      anim.push((dt, t, b) => {
        c.position.x += c.userData.speed * dt;
        if (c.position.x > b.x + 80) c.position.x = b.x - 80;
        if (c.position.z > b.z + 30) c.position.z -= 200;
      });
    }
  }

  // ---------- Birds ----------
  if (T.birds) {
    const birdMat = mat(level.theme === 'desert' ? 0x5a3a2a : 0x2b2b3a, { roughness: 1 });
    disposables.push(birdMat);
    for (let i = 0; i < 7; i++) {
      const bird = new THREE.Group();
      const wingGeo = new THREE.BoxGeometry(1.1, 0.06, 0.35); disposables.push(wingGeo);
      const l = new THREE.Mesh(wingGeo, birdMat), r = new THREE.Mesh(wingGeo, birdMat);
      l.position.x = -0.5; r.position.x = 0.5;
      const lp = new THREE.Group(), rp = new THREE.Group(); lp.add(l); rp.add(r); bird.add(lp, rp);
      bird.position.set((Math.random() - 0.5) * 60, 8 + Math.random() * 8, -20 - Math.random() * 120);
      const sp = 3 + Math.random() * 2, ph = Math.random() * 6;
      root.add(bird);
      anim.push((dt, t, b) => {
        const f = Math.sin(t * 9 + ph) * 0.6; lp.rotation.z = f; rp.rotation.z = -f;
        bird.position.x += sp * dt; bird.position.y += Math.sin(t + ph) * 0.01;
        if (bird.position.x > b.x + 50) bird.position.x = b.x - 50;
        if (bird.position.z > b.z + 20) bird.position.z -= 150;
      });
    }
  }

  // ---------- Snow / stars ----------
  if (T.snow || T.stars) {
    const count = T.snow ? 700 : 500;
    const g = new THREE.BufferGeometry(), arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 80;
      arr[i * 3 + 1] = T.snow ? Math.random() * 30 - 5 : 40 + Math.random() * 120;
      arr[i * 3 + 2] = T.snow ? -Math.random() * 80 : -Math.random() * 300;
    }
    if (T.stars) for (let i = 0; i < count; i++) arr[i * 3] *= 5;
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const m = new THREE.PointsMaterial({ map: SPRITE, size: T.snow ? 0.35 : 1.4, transparent: true, depthWrite: false, fog: !T.stars, color: 0xffffff });
    const pts = new THREE.Points(g, m); root.add(pts); disposables.push(g, m);
    anim.push((dt, t, b) => {
      pts.position.set(b.x, T.snow ? b.y : 0, b.z + (T.snow ? 20 : 60));
      if (T.snow) {
        for (let i = 0; i < count; i++) {
          arr[i * 3 + 1] -= dt * 2.2; arr[i * 3] += Math.sin(t + i) * dt * 0.3;
          if (arr[i * 3 + 1] < -6) arr[i * 3 + 1] = 25;
        }
        g.attributes.position.needsUpdate = true;
      }
    });
  }

  // ---------- Track ----------
  const TH = 1.2;
  const sideMat = mat(T.side, T.neon ? { emissive: 0xff4fd8, emissiveIntensity: 0.35 } : {});
  const topMats = {
    normal: mat(T.top, { roughness: 0.75 }),
    ice: mat(T.top, { roughness: 0.08, metalness: 0.2 }),
    bridge: mat(T.bridge, { roughness: 0.9 }),
    moving: mat(T.neon ? 0x2ff7ff : 0xffcf4a, { roughness: 0.6, emissive: T.neon ? 0x2ff7ff : 0x000000, emissiveIntensity: 0.4 }),
  };
  const edgeMat = mat(T.neon ? 0x2ff7ff : 0xffffff, T.neon ? { emissive: 0x2ff7ff, emissiveIntensity: 1 } : { roughness: 0.5 });
  disposables.push(sideMat, edgeMat, ...Object.values(topMats));
  const movers = [];
  for (const s of level.segs) {
    const L = s.z0 - s.z1, curved = s.cx0 !== s.cx1 || s.y0 !== s.y1;
    const geo = new THREE.BoxGeometry(s.w, TH, L, 1, 1, curved ? 8 : 1);
    geo.translate(0, -TH / 2, 0);
    const p = geo.attributes.position, zc = (s.z0 + s.z1) / 2;
    for (let i = 0; i < p.count; i++) {
      const wz = p.getZ(i) + zc, info = segAt(s, wz);
      p.setXYZ(i, p.getX(i) + info.x, p.getY(i) + info.y, wz);
    }
    geo.computeVertexNormals();
    const top = topMats[s.type] || topMats.normal;
    const mesh = new THREE.Mesh(geo, [sideMat, sideMat, top, sideMat, sideMat, sideMat]);
    mesh.receiveShadow = shadows; root.add(mesh); disposables.push(geo);
    // Thin edge rails make the path easier to read.
    for (const side of [-1, 1]) {
      const eg = new THREE.BoxGeometry(0.14, 0.12, L, 1, 1, curved ? 8 : 1); eg.translate(0, 0.02, 0);
      const ep = eg.attributes.position;
      for (let i = 0; i < ep.count; i++) { const wz = ep.getZ(i) + zc, info = segAt(s, wz); ep.setXYZ(i, ep.getX(i) + info.x + side * (s.w / 2 - 0.07), ep.getY(i) + info.y, wz); }
      eg.computeVertexNormals();
      const e = new THREE.Mesh(eg, edgeMat); mesh.add(e); disposables.push(eg);
    }
    if (s.type === 'moving') movers.push({ s, mesh });
  }
  anim.push((dt, t) => { for (const m of movers) { const v = Math.sin(t * m.s.freq + m.s.phase) * m.s.amp; m.s.delta = v - (m.s.offset || 0); m.s.offset = v; m.mesh.position.x = v; } });

  // ---------- Scenery (batched) ----------
  const batch = new Batch();
  const M = {
    island: mat(T.island), dirt: mat(T.side), trunk: mat(0x8b5737), leafA: mat(0x3fb36a), leafB: mat(0x6bd36a),
    flowerR: mat(0xff6b8a), flowerY: mat(0xffe14a), cactus: mat(0x3f9e4f), rock: mat(level.theme === 'desert' ? 0xd49a5a : 0x9aa3ad),
    pyramid: mat(0xe0b06a), snow: mat(0xffffff, { roughness: 0.6 }), pine: mat(0x2f7d5a), crystal: mat(0x9ee8ff, { emissive: 0x58d0ff, emissiveIntensity: 0.6, roughness: 0.2 }),
    carrot: mat(0xff8a1a), building: new THREE.MeshStandardMaterial({ map: windowTexture(), emissive: 0xffffff, emissiveMap: null, roughness: 0.7 }),
  };
  M.building.emissiveMap = M.building.map; M.building.emissiveIntensity = 0.9;
  disposables.push(...Object.values(M));
  for (const p of level.deco) {
    const { x, y, z, r } = p;
    if (level.theme === 'city') {
      const h = 6 + r * 22, w = 2.5 + r * 2.5;
      const bx = x + p.side * (4 + r * 8);
      batch.add(G.box, M.building, V(bx, -9 + h / 2 + y, z), new THREE.Euler(), V(w, h, w));
      continue;
    }
    // little floating island
    batch.add(G.cyl, M.island, V(x, y, z), new THREE.Euler(), V(1.6, 0.35, 1.6));
    batch.add(G.cone, M.dirt, V(x, y - 1.1, z), new THREE.Euler(Math.PI, 0, 0), V(1.55, 1.9, 1.55));
    const ty = y + 0.17;
    if (level.theme === 'meadow') {
      if (r < 0.55) { batch.add(G.cyl, M.trunk, V(x, ty + 0.65, z), undefined, V(0.18, 1.3, 0.18)); batch.add(G.ico, r < 0.3 ? M.leafA : M.leafB, V(x, ty + 1.75, z), undefined, V(0.95, 0.95, 0.95)); }
      else if (r < 0.8) { for (let k = 0; k < 3; k++) { batch.add(G.cyl, M.leafA, V(x + k * 0.4 - 0.4, ty + 0.25, z), undefined, V(0.04, 0.5, 0.04)); batch.add(G.sph, k % 2 ? M.flowerR : M.flowerY, V(x + k * 0.4 - 0.4, ty + 0.55, z), undefined, V(0.17, 0.17, 0.17)); } }
      else batch.add(G.ico, M.leafB, V(x, ty + 0.4, z), undefined, V(0.7, 0.55, 0.7));
    } else if (level.theme === 'desert') {
      if (r < 0.5) { batch.add(G.cyl, M.cactus, V(x, ty + 0.9, z), undefined, V(0.28, 1.8, 0.28)); batch.add(G.cyl, M.cactus, V(x + 0.45, ty + 1.1, z), undefined, V(0.16, 0.7, 0.16)); batch.add(G.cyl, M.cactus, V(x - 0.4, ty + 1.3, z), undefined, V(0.15, 0.6, 0.15)); }
      else if (r < 0.85) batch.add(G.dodec, M.rock, V(x, ty + 0.4, z), new THREE.Euler(r * 3, r * 5, 0), V(0.7, 0.55, 0.6));
      else { const big = p.side * 18; batch.add(G.cone, M.pyramid, V(x + big, -6, z - 20), new THREE.Euler(0, Math.PI / 4, 0), V(9, 12, 9)); }
    } else if (level.theme === 'ice') {
      if (r < 0.55) { batch.add(G.cyl, M.trunk, V(x, ty + 0.3, z), undefined, V(0.14, 0.6, 0.14)); batch.add(G.cone, M.pine, V(x, ty + 1.2, z), undefined, V(0.8, 1.4, 0.8)); batch.add(G.cone, M.snow, V(x, ty + 1.75, z), undefined, V(0.5, 0.7, 0.5)); }
      else if (r < 0.75) { batch.add(G.sph, M.snow, V(x, ty + 0.45, z), undefined, V(0.48, 0.48, 0.48)); batch.add(G.sph, M.snow, V(x, ty + 1.1, z), undefined, V(0.32, 0.32, 0.32)); batch.add(G.cone, M.carrot, V(x, ty + 1.1, z + 0.4), new THREE.Euler(Math.PI / 2, 0, 0), V(0.06, 0.3, 0.06)); }
      else batch.add(G.octa, M.crystal, V(x, ty + 0.7, z), new THREE.Euler(0, r * 6, 0), V(0.4, 0.8, 0.4));
    }
  }
  batch.build(root, false);

  // ---------- Coins (instanced: one draw call) ----------
  const coinGeo = new THREE.TorusGeometry(0.3, 0.1, 8, 18);
  const coinMat = mat(0xffd935, { roughness: 0.3, metalness: 0.5, emissive: 0x8a6a00, emissiveIntensity: 0.35 });
  const coinMesh = new THREE.InstancedMesh(coinGeo, coinMat, Math.max(1, level.coins.length));
  coinMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  root.add(coinMesh); disposables.push(coinGeo, coinMat);
  const coins = level.coins.map((c) => ({ ...c, home: new THREE.Vector3(c.x, c.y, c.z), pos: new THREE.Vector3(c.x, c.y, c.z), taken: false }));

  // ---------- Gem ----------
  const gemGeo = new THREE.OctahedronGeometry(0.45);
  const gemMat = mat(0x35e6df, { roughness: 0.15, metalness: 0.2, emissive: 0x1aa6a0, emissiveIntensity: 0.6 });
  disposables.push(gemGeo, gemMat);
  const gems = level.gems.map((g) => { const m = new THREE.Mesh(gemGeo, gemMat); m.position.set(g.x, g.y, g.z); m.castShadow = shadows; root.add(m); return { mesh: m, taken: false }; });

  // ---------- Power-ups ----------
  const powerMats = {
    speed: mat(0xffe34a, { emissive: 0xffb000, emissiveIntensity: 0.8 }),
    shield: mat(0x5ad1ff, { emissive: 0x2a8cff, emissiveIntensity: 0.8, transparent: true, opacity: 0.9 }),
    magnet: mat(0xff4a5a, { emissive: 0xc81e3a, emissiveIntensity: 0.6 }),
  };
  disposables.push(...Object.values(powerMats));
  const powerups = level.powerups.map((p) => {
    const g = new THREE.Group();
    if (p.kind === 'speed') { const a = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.7, 3), powerMats.speed); a.rotation.x = -Math.PI / 2; const b = a.clone(); b.position.z = 0.35; g.add(a, b); }
    else if (p.kind === 'shield') g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 1), powerMats.shield));
    else { const u = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.12, 8, 16, Math.PI), powerMats.magnet); u.rotation.z = Math.PI; g.add(u); }
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: SPRITE, color: p.kind === 'speed' ? 0xffd34a : p.kind === 'shield' ? 0x5ad1ff : 0xff5a6a, transparent: true, opacity: 0.55, depthWrite: false }));
    halo.scale.set(1.8, 1.8, 1); g.add(halo);
    g.position.set(p.x, p.y, p.z); root.add(g);
    return { ...p, mesh: g, taken: false };
  });

  // ---------- Obstacles ----------
  const red = mat(0xff5a5a, { roughness: 0.5 }), metal = mat(0x8a93a6, { metalness: 0.7, roughness: 0.35 }), dark = mat(0x3a3f4f), stone = mat(0x8c7b6b, { roughness: 1 });
  disposables.push(red, metal, dark, stone);
  const obstacles = level.obstacles.map((o) => {
    const ob = { ...o };
    if (o.type === 'bumper') {
      ob.mesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.9), red);
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.16, 0.92), mat(0xffffff)); ob.mesh.add(stripe);
    } else if (o.type === 'spike') {
      ob.mesh = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.9, 8), metal); ob.mesh.position.set(o.x, o.y + 0.45, o.z);
      const baseM = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.1, 10), dark); baseM.position.y = -0.45; ob.mesh.add(baseM);
    } else if (o.type === 'hammer') {
      ob.len = 3.6; ob.mesh = new THREE.Group();
      const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 4.6, 8), dark); postL.position.set(-2.6, 2.3, 0);
      const postR = postL.clone(); postR.position.x = 2.6;
      const beam = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.25, 0.25), dark); beam.position.y = 4.6;
      ob.pivot = new THREE.Group(); ob.pivot.position.y = 4.6;
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, ob.len, 6), metal); arm.position.y = -ob.len / 2;
      const head = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.3, 14), red); head.rotation.x = Math.PI / 2; head.position.y = -ob.len;
      ob.pivot.add(arm, head); ob.mesh.add(postL, postR, beam, ob.pivot);
      ob.mesh.position.set(o.x, o.y, o.z);
    } else if (o.type === 'boulder') {
      ob.mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.85, 1), stone);
      ob.home = o.z; ob.cur = o.z; ob.active = false;
    }
    ob.mesh.traverse((m) => { if (m.isMesh) m.castShadow = shadows; });
    root.add(ob.mesh);
    return ob;
  });

  // ---------- Checkpoint flags & finish gate ----------
  const flagMat = mat(0x4ade80, { emissive: 0x16a34a, emissiveIntensity: 0.3 });
  disposables.push(flagMat);
  const checkpoints = level.checkpoints.map((c) => {
    const g = new THREE.Group();
    for (const sx of [-1, 1]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.4, 6), mat(0xffffff)); pole.position.set(sx * (c.seg.w / 2 - 0.2), 1.2, 0);
      const flag = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.04), flagMat); flag.position.set(sx * (c.seg.w / 2 - 0.2) - sx * 0.38, 2.1, 0);
      g.add(pole, flag);
    }
    g.position.set(c.x, c.y, c.z); root.add(g);
    return { ...c, mesh: g, reached: false, flagMat };
  });

  const finish = new THREE.Group();
  const end = level.segs[level.segs.length - 1];
  const archMat = mat(0x8d65ff, { emissive: 0x5b2aff, emissiveIntensity: 0.4 });
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xfff2a0, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false });
  disposables.push(archMat, glowMat);
  for (const sx of [-1.6, 1.6]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 3.2, 10), archMat); p.position.set(sx, 1.6, 0); finish.add(p); }
  const topBar = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.35, 0.35), mat(0xffe35b, { emissive: 0xffb000, emissiveIntensity: 0.5 })); topBar.position.y = 3.2; finish.add(topBar);
  const portal = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 3.0), glowMat); portal.position.y = 1.55; finish.add(portal);
  finish.position.set(end.cx1, end.y1, level.finishZ); root.add(finish);
  anim.push((dt, t) => { glowMat.opacity = 0.25 + Math.sin(t * 4) * 0.12; });

  return {
    root, anim, coins, coinMesh, gems, powerups, obstacles, checkpoints, finish, theme: T,
    dispose() {
      scene.remove(root);
      const shared = new Set(Object.values(G));
      root.traverse((o) => { if ((o.isMesh || o.isPoints) && !shared.has(o.geometry)) o.geometry?.dispose(); });
      disposables.forEach((d) => d.dispose && d.dispose());
    },
  };
}
