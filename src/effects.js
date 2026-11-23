// Particles (sparkles, dust, emoji trails, weather) and the ball's light trail.
import * as THREE from 'three';

export function roundSprite(color = '#ffffff', soft = true) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, color); gr.addColorStop(soft ? 0.4 : 0.8, color); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
export const SPRITE = roundSprite();

const emojiCache = new Map();
export function emojiTexture(emoji, size = 96) {
  const key = emoji + size;
  if (emojiCache.has(key)) return emojiCache.get(key);
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d');
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `${Math.floor(size * 0.8)}px "Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji",sans-serif`;
  g.fillText(emoji, size / 2, size / 2 + size * 0.05);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  emojiCache.set(key, t);
  return t;
}

const VS = `attribute float size; attribute float alpha; attribute vec3 color; uniform float scale;
varying float vA; varying vec3 vC;
void main(){ vA = alpha; vC = color; vec4 mv = modelViewMatrix * vec4(position, 1.0);
 gl_PointSize = size * scale / max(0.1, -mv.z); gl_Position = projectionMatrix * mv; }`;
const FS = `uniform sampler2D map; varying float vA; varying vec3 vC;
void main(){ vec4 t = texture2D(map, gl_PointCoord); gl_FragColor = vec4(t.rgb * vC, t.a * vA); if (gl_FragColor.a < 0.01) discard; }`;

export class Particles {
  constructor(scene, { map = SPRITE, additive = true, max = 500 } = {}) {
    this.max = max; this.i = 0;
    this.pos = new Float32Array(max * 3); this.col = new Float32Array(max * 3); this.size = new Float32Array(max); this.alpha = new Float32Array(max);
    this.vel = new Float32Array(max * 3); this.life = new Float32Array(max); this.maxLife = new Float32Array(max); this.grav = new Float32Array(max); this.size0 = new Float32Array(max); this.grow = new Float32Array(max);
    const g = new THREE.BufferGeometry();
    const attr = (a, n) => new THREE.BufferAttribute(a, n).setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('position', attr(this.pos, 3)); g.setAttribute('color', attr(this.col, 3)); g.setAttribute('size', attr(this.size, 1)); g.setAttribute('alpha', attr(this.alpha, 1));
    this.mat = new THREE.ShaderMaterial({ uniforms: { map: { value: map }, scale: { value: 400 } }, vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending });
    this.points = new THREE.Points(g, this.mat); this.points.frustumCulled = false; this.points.renderOrder = 5;
    scene.add(this.points);
    this.enabled = true;
  }
  setScale(px) { this.mat.uniforms.scale.value = px; }
  emit(p, color, count = 12, speed = 3, life = 0.7, gravity = 6, up = 1, size = 0.35, grow = 0) {
    if (!this.enabled) return;
    const c = color instanceof THREE.Color ? color : new THREE.Color(color);
    for (let n = 0; n < count; n++) {
      const k = this.i; this.i = (this.i + 1) % this.max;
      this.pos[k * 3] = p.x; this.pos[k * 3 + 1] = p.y; this.pos[k * 3 + 2] = p.z;
      const a = Math.random() * Math.PI * 2, e = Math.random() * up;
      this.vel[k * 3] = Math.cos(a) * speed * (0.4 + Math.random() * 0.6);
      this.vel[k * 3 + 1] = e * speed;
      this.vel[k * 3 + 2] = Math.sin(a) * speed * (0.4 + Math.random() * 0.6);
      this.col[k * 3] = c.r; this.col[k * 3 + 1] = c.g; this.col[k * 3 + 2] = c.b;
      this.life[k] = this.maxLife[k] = life * (0.6 + Math.random() * 0.6); this.grav[k] = gravity;
      this.size0[k] = size * (0.7 + Math.random() * 0.6); this.grow[k] = grow;
    }
  }
  update(dt) {
    for (let k = 0; k < this.max; k++) {
      if (this.life[k] <= 0) { this.alpha[k] = 0; continue; }
      this.life[k] -= dt;
      this.vel[k * 3 + 1] -= this.grav[k] * dt;
      for (let j = 0; j < 3; j++) this.pos[k * 3 + j] += this.vel[k * 3 + j] * dt;
      const f = Math.max(0, this.life[k] / this.maxLife[k]);
      this.alpha[k] = Math.min(1, f * 1.6);
      this.size[k] = this.size0[k] * (1 + this.grow[k] * (1 - f));
    }
    const a = this.points.geometry.attributes;
    a.position.needsUpdate = a.alpha.needsUpdate = a.size.needsUpdate = a.color.needsUpdate = true;
  }
  clear() { this.life.fill(0); this.alpha.fill(0); }
}

export class Trail {
  constructor(scene, n = 26) {
    this.n = n; this.hist = Array.from({ length: n }, () => new THREE.Vector3());
    this.geo = new THREE.BufferGeometry();
    this.posArr = new Float32Array(n * 2 * 3); this.colArr = new Float32Array(n * 2 * 3);
    const idx = [];
    for (let i = 0; i < n - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    this.geo.setIndex(idx);
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.posArr, 3).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('color', new THREE.BufferAttribute(this.colArr, 3).setUsage(THREE.DynamicDrawUsage));
    this.mesh = new THREE.Mesh(this.geo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    this.mesh.frustumCulled = false; scene.add(this.mesh);
    this.color = new THREE.Color(0xffb52e); this.strength = 0.3; this.look = 'ball';
    this.tmp = new THREE.Color();
  }
  reset(p) { this.hist.forEach((h) => h.copy(p)); }
  colorAt(i, t) {
    const f = i / this.n, c = this.tmp;
    switch (this.look) {
      case 'rainbow': return c.setHSL((f * 1.2 + t * 0.6) % 1, 1, 0.55);
      case 'fire': return c.setRGB(1, 0.85 - f * 0.75, 0.2 - f * 0.2);
      case 'ice': return c.setRGB(0.75 - f * 0.5, 0.95 - f * 0.2, 1);
      case 'gold': return c.setRGB(1, 0.82 - f * 0.25, 0.25);
      case 'neon': return c.setHSL(0.5 + Math.sin(t * 4 + f * 6) * 0.08, 1, 0.55);
      default: return c.copy(this.color);
    }
  }
  update(p, radius, t) {
    for (let i = this.n - 1; i > 0; i--) this.hist[i].copy(this.hist[i - 1]);
    this.hist[0].copy(p);
    const boost = this.look === 'ball' ? 1 : 1.6;
    for (let i = 0; i < this.n; i++) {
      const h = this.hist[i], f = 1 - i / this.n, w = radius * 0.6 * f;
      this.posArr.set([h.x - w, h.y - radius * 0.9, h.z, h.x + w, h.y - radius * 0.9, h.z], i * 6);
      const s = this.strength * boost * f * f, c = this.colorAt(i, t);
      this.colArr.set([c.r * s, c.g * s, c.b * s, c.r * s, c.g * s, c.b * s], i * 6);
    }
    this.geo.attributes.position.needsUpdate = true; this.geo.attributes.color.needsUpdate = true;
  }
}
