// Particle bursts (coin sparkle, jump dust, hits) and the ball's light trail.
import * as THREE from 'three';
import { SPRITE } from './world.js';

export class Particles {
  constructor(scene, max = 400) {
    this.max = max; this.i = 0;
    this.pos = new Float32Array(max * 3); this.col = new Float32Array(max * 3);
    this.vel = new Float32Array(max * 3); this.life = new Float32Array(max); this.maxLife = new Float32Array(max);
    this.base = new Float32Array(max * 3); this.grav = new Float32Array(max);
    for (let k = 0; k < max; k++) this.pos[k * 3 + 1] = -999;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('color', new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage));
    this.points = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.32, map: SPRITE, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.points.frustumCulled = false;
    scene.add(this.points);
  }
  emit(p, color, count = 12, speed = 3, life = 0.7, gravity = 6, up = 1) {
    const c = new THREE.Color(color);
    for (let n = 0; n < count; n++) {
      const k = this.i; this.i = (this.i + 1) % this.max;
      this.pos[k * 3] = p.x; this.pos[k * 3 + 1] = p.y; this.pos[k * 3 + 2] = p.z;
      const a = Math.random() * Math.PI * 2, e = Math.random() * up;
      this.vel[k * 3] = Math.cos(a) * speed * (0.4 + Math.random() * 0.6);
      this.vel[k * 3 + 1] = e * speed;
      this.vel[k * 3 + 2] = Math.sin(a) * speed * (0.4 + Math.random() * 0.6);
      this.base[k * 3] = c.r; this.base[k * 3 + 1] = c.g; this.base[k * 3 + 2] = c.b;
      this.life[k] = this.maxLife[k] = life * (0.6 + Math.random() * 0.6); this.grav[k] = gravity;
    }
  }
  update(dt) {
    for (let k = 0; k < this.max; k++) {
      if (this.life[k] <= 0) continue;
      this.life[k] -= dt;
      if (this.life[k] <= 0) { this.pos[k * 3 + 1] = -999; continue; }
      this.vel[k * 3 + 1] -= this.grav[k] * dt;
      for (let j = 0; j < 3; j++) this.pos[k * 3 + j] += this.vel[k * 3 + j] * dt;
      const f = this.life[k] / this.maxLife[k];
      for (let j = 0; j < 3; j++) this.col[k * 3 + j] = this.base[k * 3 + j] * f;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.geometry.attributes.color.needsUpdate = true;
  }
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
    this.color = new THREE.Color(0xffb52e); this.strength = 0.6;
  }
  reset(p) { this.hist.forEach((h) => h.copy(p)); }
  update(p, radius) {
    for (let i = this.n - 1; i > 0; i--) this.hist[i].copy(this.hist[i - 1]);
    this.hist[0].copy(p);
    for (let i = 0; i < this.n; i++) {
      const h = this.hist[i], f = 1 - i / this.n, w = radius * 0.6 * f;
      this.posArr.set([h.x - w, h.y - radius * 0.9, h.z, h.x + w, h.y - radius * 0.9, h.z], i * 6);
      const c = this.strength * f * f;
      this.colArr.set([this.color.r * c, this.color.g * c, this.color.b * c, this.color.r * c, this.color.g * c, this.color.b * c], i * 6);
    }
    this.geo.attributes.position.needsUpdate = true; this.geo.attributes.color.needsUpdate = true;
  }
}
