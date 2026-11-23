import * as THREE from 'three';
import './style.css';
import { GAME, TOTAL_LEVELS, themeForLevel } from './config.js';
import { save, persist } from './storage.js';
import { initAudio, sfx, playMusic, applyAudioSettings, suspendAudio, resumeAudio } from './audio.js';
import { vibrate, onBackButton, onAppState, exitApp } from './native.js';
import { generateLevel, segAt } from './levels.js';
import { buildWorld } from './world.js';
import { Particles, Trail } from './effects.js';
import { SKINS, makeSkinMaterial, skinById } from './skins.js';

const $ = (id) => document.getElementById(id);
const R = 0.5, GRAVITY = 24, JUMP_V = 8.6, DRAG_SENS = 9;
const POWER_TIME = { speed: 4, shield: 10, magnet: 8 };
const POWER_LABEL = { speed: '⚡ SPEED', shield: '🛡️ SHIELD', magnet: '🧲 MAGNET' };

// ---------------- Renderer, scene, camera, lights ----------------
const app = $('app');
const renderer = new THREE.WebGLRenderer({ antialias: save.settings.quality === 'high', powerPreference: 'high-performance' });
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
app.prepend(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 900);
const hemi = new THREE.HemisphereLight(0xffffff, 0x445544, 1.8); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 50 });
scene.add(sun, sun.target);
const ballLight = new THREE.PointLight(0xffd9a0, 0, 9); scene.add(ballLight);

function applyQuality() {
  const hi = save.settings.quality === 'high';
  renderer.setPixelRatio(Math.min(devicePixelRatio, hi ? 2 : 1));
  renderer.shadowMap.enabled = hi; sun.castShadow = hi;
}
applyQuality();

// ---------------- Ball ----------------
const ball = new THREE.Mesh(new THREE.SphereGeometry(R, 32, 24), makeSkinMaterial(save.skin));
ball.castShadow = true; scene.add(ball);
const ring = new THREE.Mesh(new THREE.TorusGeometry(R * 1.03, 0.05, 8, 40), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 }));
ring.rotation.x = Math.PI / 2; ball.add(ring);
const shieldBubble = new THREE.Mesh(new THREE.SphereGeometry(R * 1.55, 24, 16), new THREE.MeshBasicMaterial({ color: 0x5ad1ff, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false }));
shieldBubble.visible = false; scene.add(shieldBubble);
const particles = new Particles(scene);
const trail = new Trail(scene);

function applySkin() {
  const old = ball.material; ball.material = makeSkinMaterial(save.skin); old.dispose();
  ring.visible = save.skin === 'classic' || save.skin === 'ocean';
  trail.color.setHex(skinById(save.skin).trail);
}
applySkin();

// ---------------- Game state ----------------
const S = {
  mode: 'menu', n: 1, level: null, world: null, lives: 3, lostLives: 0, coins: 0, coinTotal: 0,
  vx: 0, vy: 0, onGround: true, coyote: 0, desiredX: 0, seg: null, lastGroundY: 0,
  checkpoint: new THREE.Vector3(), invuln: 0, power: { speed: 0, shield: 0, magnet: 0 },
  time: 0, deadTimer: 0, deathReason: '', startZ: 6, hudTimer: 0,
};
const joy = { x: 0, y: 0 };
const keys = { left: false, right: false };
const clock = new THREE.Clock();
let elapsed = 0;

// ---------------- UI helpers ----------------
const PANELS = ['menu', 'levelsPanel', 'shopPanel', 'settingsPanel', 'pausePanel', 'completePanel', 'gameoverPanel'];
function showPanel(id) { PANELS.forEach((p) => $(p).classList.toggle('hidden', p !== id)); }
let msgTimer = null;
function showMessage(text, ms = 1300) {
  const m = $('message'); m.textContent = text; m.classList.remove('hidden');
  m.style.animation = 'none'; void m.offsetWidth; m.style.animation = '';
  clearTimeout(msgTimer); msgTimer = setTimeout(() => m.classList.add('hidden'), ms);
}
function updateWallet() { $('walletMenu').textContent = save.coins; $('walletShop').textContent = save.coins; }
function updateLives() { $('lives').textContent = '❤️'.repeat(Math.max(0, S.lives)) + '🤍'.repeat(Math.max(0, 3 - S.lives)); }
function setHud(visible) {
  $('hud').classList.toggle('hidden', !visible);
  $('controls').classList.toggle('hidden', !(visible && save.settings.control === 'joystick'));
}

$('gameName').textContent = GAME.name.toUpperCase();
$('gameSub').textContent = GAME.subtitle.toUpperCase();
$('menuFoot').textContent = `3D OFFLINE GAME · v${GAME.version}`;
$('privacyLink').href = GAME.privacyUrl;

// ---------------- World / level management ----------------
function loadWorld(n) {
  if (S.world) S.world.dispose();
  S.n = n; S.level = generateLevel(n);
  S.world = buildWorld(scene, S.level, save.settings.quality);
  const T = S.world.theme;
  hemi.color.setHex(T.hemi[0]); hemi.groundColor.setHex(T.hemi[1]); hemi.intensity = T.hemi[2];
  sun.intensity = T.sun;
  ballLight.intensity = T.night ? 18 : 0;
  const start = S.level.segs[0];
  ball.position.set(start.cx0, start.y0 + R, S.startZ);
  S.checkpoint.copy(ball.position);
  S.desiredX = ball.position.x; S.vx = 0; S.vy = 0; S.onGround = true; S.lastGroundY = start.y0;
  trail.reset(ball.position);
}

function startLevel(n) {
  initAudio();
  n = Math.max(1, Math.min(TOTAL_LEVELS, n));
  loadWorld(n);
  S.lives = 3; S.lostLives = 0; S.coins = 0; S.invuln = 0; S.time = 0;
  S.coinTotal = S.level.coins.length + 5 * S.level.gems.length;
  S.power = { speed: 0, shield: 0, magnet: 0 };
  $('level').textContent = n; $('score').textContent = 0; updateLives();
  showPanel(null); setHud(true);
  playMusic(S.level.theme);
  if (!save.tutorialDone && save.settings.control === 'drag') { S.mode = 'tutorial'; $('tutorial').classList.remove('hidden'); }
  else { S.mode = 'playing'; showMessage(`LEVEL ${n}`); }
}

function goMenu() {
  S.mode = 'menu'; setHud(false); $('tutorial').classList.add('hidden');
  updateWallet(); showPanel('menu');
  loadWorld(Math.min(save.unlocked, TOTAL_LEVELS));
  playMusic(S.level.theme);
}

function pauseGame() {
  if (S.mode !== 'playing') return;
  S.mode = 'paused'; showPanel('pausePanel'); $('controls').classList.add('hidden');
}
function resumeGame() {
  if (S.mode !== 'paused') return;
  S.mode = 'playing'; showPanel(null); setHud(true);
}

// ---------------- Physics helpers ----------------
function groundAt(x, z, bottom) {
  let best = null;
  for (const s of S.level.segs) {
    if (z > s.z0 || z < s.z1) continue;
    const p = segAt(s, z), cx = p.x + (s.offset || 0);
    if (Math.abs(x - cx) > s.w / 2 + R * 0.25) continue;
    if (p.y > bottom + 0.45) continue;
    if (!best || p.y > best.y) best = { y: p.y, seg: s };
  }
  return best;
}

function jump() {
  if (S.mode !== 'playing') return;
  if (S.onGround || S.coyote > 0) {
    S.vy = JUMP_V; S.onGround = false; S.coyote = 0;
    sfx.jump(); vibrate('light');
    particles.emit(new THREE.Vector3(ball.position.x, ball.position.y - R, ball.position.z), S.world.theme.top, 10, 2.5, 0.5, 4, 0.6);
  }
}

function hurt() {
  if (S.invuln > 0) return;
  if (S.power.shield > 0) {
    S.power.shield = 0; S.invuln = 1.2; sfx.shieldBreak(); vibrate('medium');
    particles.emit(ball.position, 0x5ad1ff, 30, 5, 0.7, 2);
    showMessage('🛡️ SHIELD SAVED YOU!');
    return;
  }
  loseLife('hit');
}

function loseLife(reason) {
  S.lives--; S.lostLives++; updateLives();
  S.mode = 'dying'; S.deathReason = reason; S.deadTimer = reason === 'fall' ? 1.0 : 0.9;
  vibrate('heavy');
  if (reason === 'hit') { sfx.hit(); S.vy = 7; particles.emit(ball.position, 0xff5a5a, 30, 6, 0.8, 8); }
  else sfx.fall();
}

function respawn() {
  if (S.lives <= 0) return gameOver();
  ball.position.copy(S.checkpoint);
  S.desiredX = ball.position.x; S.vx = 0; S.vy = 0; S.onGround = true; S.invuln = 2; S.power.speed = 0;
  S.lastGroundY = S.checkpoint.y - R;
  for (const o of S.world.obstacles) if (o.type === 'boulder') { o.active = false; o.cur = o.home; }
  trail.reset(ball.position);
  S.mode = 'playing';
  showMessage(S.lives === 1 ? 'LAST LIFE!' : `${S.lives} LIVES LEFT`);
}

function gameOver() {
  S.mode = 'gameover'; sfx.lose(); setHud(false);
  save.coins += S.coins; persist();
  $('gameoverText').textContent = S.coins ? `You still keep ${S.coins} coins.` : "Don't give up!";
  showPanel('gameoverPanel');
}

function completeLevel() {
  S.mode = 'complete'; setHud(false); sfx.win(); vibrate('medium');
  const ratio = S.coinTotal ? S.coins / S.coinTotal : 1;
  const stars = 1 + (ratio >= 0.5 ? 1 : 0) + (ratio >= 0.8 && S.lostLives === 0 ? 1 : 0);
  const bonus = 10;
  save.stars[S.n] = Math.max(save.stars[S.n] || 0, stars);
  save.unlocked = Math.max(save.unlocked, Math.min(TOTAL_LEVELS, S.n + 1));
  save.coins += S.coins + bonus; persist();
  for (let i = 0; i < 4; i++) particles.emit(new THREE.Vector3(ball.position.x + (i - 1.5), ball.position.y + 2, ball.position.z - 2), [0xffd23a, 0xff5a8a, 0x5ad1ff, 0x7ee37a][i], 25, 6, 1.2, 5);
  const spans = $('starRow').children;
  [...spans].forEach((s) => s.classList.remove('on'));
  for (let i = 0; i < stars; i++) setTimeout(() => { spans[i].classList.add('on'); sfx.star(i); }, 400 + i * 350);
  const last = S.n >= TOTAL_LEVELS;
  $('completeText').textContent = last
    ? `You beat all ${TOTAL_LEVELS} levels! +${S.coins + bonus} coins`
    : `+${S.coins + bonus} coins (${S.coins}/${S.coinTotal} collected)`;
  $('nextBtn').textContent = last ? 'PLAY FROM LEVEL 1' : 'NEXT LEVEL';
  showPanel('completePanel');
}

// ---------------- Main update ----------------
const tmpV = new THREE.Vector3(), axis = new THREE.Vector3(), quat = new THREE.Quaternion(), dummy = new THREE.Object3D();

function update(dt) {
  elapsed += dt;
  const W = S.world, L = S.level;
  W.anim.forEach((f) => f(dt, elapsed, ball.position));

  if (S.mode === 'playing') updatePlay(dt);
  else if (S.mode === 'dying') {
    S.vy -= GRAVITY * dt; ball.position.y += S.vy * dt;
    if (S.deathReason === 'hit') ball.position.z += 3 * dt;
    S.deadTimer -= dt; if (S.deadTimer <= 0) respawn();
  }

  // Coins spin, gems & power-ups bob (also visible on menu background)
  W.coins.forEach((c, i) => {
    dummy.position.copy(c.pos);
    if (c.seg && !c.taken && !c.magnet) dummy.position.x = c.home.x + (c.seg.offset || 0);
    dummy.position.y += Math.sin(elapsed * 3 + i) * 0.1;
    dummy.rotation.set(Math.PI / 2, 0, elapsed * 3 + i);
    dummy.scale.setScalar(c.taken ? 0 : 1);
    dummy.updateMatrix(); W.coinMesh.setMatrixAt(i, dummy.matrix);
  });
  W.coinMesh.instanceMatrix.needsUpdate = true;
  W.gems.forEach((g) => { g.mesh.rotation.y += dt * 2; g.mesh.visible = !g.taken; });
  W.powerups.forEach((p, i) => { p.mesh.rotation.y += dt * 2.4; p.mesh.position.y = p.y + Math.sin(elapsed * 3 + i) * 0.15; p.mesh.visible = !p.taken; });

  particles.update(dt);
  trail.strength = S.power.speed > 0 ? 0.6 : 0.28;
  trail.update(ball.position, R);
  shieldBubble.position.copy(ball.position);
  shieldBubble.visible = S.power.shield > 0 && (S.power.shield > 2 || Math.sin(elapsed * 20) > 0);
  ball.visible = !(S.invuln > 0 && S.mode === 'playing' && Math.sin(elapsed * 30) > 0.3);
  ballLight.position.set(ball.position.x, ball.position.y + 1.5, ball.position.z + 1);

  // Sun follows the ball so shadows stay sharp
  sun.position.set(ball.position.x - 6, ball.position.y + 14, ball.position.z + 8);
  sun.target.position.copy(ball.position);

  updateCamera(dt);
}

function updatePlay(dt) {
  const L = S.level, W = S.world;
  S.time += dt;
  const joystick = save.settings.control === 'joystick';
  let speed = L.speed * (S.power.speed > 0 ? 1.55 : 1);
  if (joystick) speed *= 1 + joy.y * 0.35;

  // Forward auto-roll
  ball.position.z -= speed * dt;

  // Steering
  const icy = L.icy && S.onGround;
  if (keys.left) S.desiredX -= 7 * dt;
  if (keys.right) S.desiredX += 7 * dt;
  if (joystick) {
    S.vx = THREE.MathUtils.damp(S.vx, joy.x * 7, icy ? 2.5 : 8, dt);
    if (keys.left || keys.right) S.vx = (keys.right - keys.left) * 7;
  } else {
    S.desiredX = THREE.MathUtils.clamp(S.desiredX, ball.position.x - 4, ball.position.x + 4);
    const target = THREE.MathUtils.clamp((S.desiredX - ball.position.x) * 14, -13, 13);
    S.vx = THREE.MathUtils.damp(S.vx, target, icy ? 3 : 18, dt);
  }
  ball.position.x += S.vx * dt;
  if (joystick) S.desiredX = ball.position.x;

  // Ride moving platforms
  if (S.onGround && S.seg && S.seg.type === 'moving') { ball.position.x += S.seg.delta || 0; S.desiredX += S.seg.delta || 0; }

  // Vertical motion & ground
  const wasGround = S.onGround;
  S.vy -= GRAVITY * dt; ball.position.y += S.vy * dt;
  const g = groundAt(ball.position.x, ball.position.z, ball.position.y - R);
  const bottom = ball.position.y - R;
  if (g && S.vy <= 0 && (bottom <= g.y || (wasGround && bottom - g.y < 0.3))) {
    if (!wasGround && S.vy < -5) { sfx.land(); particles.emit(new THREE.Vector3(ball.position.x, g.y, ball.position.z), W.theme.top, 8, 2, 0.4, 3, 0.5); }
    ball.position.y = g.y + R; S.vy = 0; S.onGround = true; S.coyote = 0.12; S.seg = g.seg; S.lastGroundY = g.y;
  } else {
    S.onGround = false; S.coyote -= dt;
  }
  if (ball.position.y < S.lastGroundY - 6) { loseLife('fall'); return; }

  // Rolling rotation
  tmpV.set(S.vx, 0, -speed);
  const dist = tmpV.length() * dt;
  axis.set(tmpV.z, 0, -tmpV.x).normalize();
  quat.setFromAxisAngle(axis, dist / R); ball.quaternion.premultiply(quat);

  // Coins
  const bp = ball.position;
  W.coins.forEach((c) => {
    if (c.taken) return;
    if (c.seg && !c.magnet) c.pos.x = c.home.x + (c.seg.offset || 0);
    if (S.power.magnet > 0 && c.pos.distanceTo(bp) < 6) { c.magnet = true; c.pos.lerp(bp, Math.min(1, dt * 9)); }
    if (c.pos.distanceTo(bp) < 0.9) {
      c.taken = true; S.coins++; sfx.coin();
      particles.emit(c.pos, 0xffd23a, 10, 3, 0.5, 4);
    }
  });
  W.gems.forEach((gm) => {
    if (!gm.taken && gm.mesh.position.distanceTo(bp) < 1.1) {
      gm.taken = true; S.coins += 5; sfx.gem(); vibrate('light');
      particles.emit(gm.mesh.position, 0x35e6df, 30, 5, 0.9, 3); showMessage('💎 +5');
    }
  });
  W.powerups.forEach((p) => {
    if (!p.taken && p.mesh.position.distanceTo(bp) < 1.2) {
      p.taken = true; S.power[p.kind] = POWER_TIME[p.kind]; sfx.power(); vibrate('light');
      particles.emit(p.mesh.position, p.kind === 'speed' ? 0xffd34a : p.kind === 'shield' ? 0x5ad1ff : 0xff5a6a, 26, 5, 0.8, 2);
      showMessage(POWER_LABEL[p.kind] + '!');
    }
  });
  $('score').textContent = S.coins;

  // Obstacles
  const t = elapsed;
  for (const o of W.obstacles) {
    let hit = false;
    if (o.type === 'bumper') {
      const p = segAt(o.seg, o.z);
      o.mesh.position.set(p.x + Math.sin(t * o.speed + o.phase) * o.range, p.y + 0.4, o.z);
      hit = Math.abs(o.mesh.position.x - bp.x) < 0.6 + R * 0.85 && Math.abs(o.z - bp.z) < 0.45 + R * 0.85 && bp.y - R < p.y + 0.8;
    } else if (o.type === 'spike') {
      hit = Math.hypot(o.x - bp.x, o.z - bp.z) < 0.55 + R * 0.6 && bp.y - R < o.y + 0.75;
    } else if (o.type === 'hammer') {
      const a = Math.sin(t * o.speed + o.phase) * 1.15; o.pivot.rotation.z = a;
      tmpV.set(o.x + Math.sin(a) * o.len, o.y + 4.6 - Math.cos(a) * o.len, o.z);
      hit = tmpV.distanceTo(bp) < R + 0.62;
    } else if (o.type === 'boulder') {
      if (!o.active && bp.z > o.home && bp.z - o.home < 38) { o.active = true; o.cur = o.home; }
      if (o.active) { o.cur += o.speed * dt; if (o.cur > o.seg.z0 + 1) { o.active = false; o.cur = o.home; } }
      const zz = Math.min(o.cur, o.seg.z0), p = segAt(o.seg, zz);
      o.mesh.position.set(o.x, p.y + 0.85, o.cur); o.mesh.rotation.x += (o.active ? o.speed : 0) * dt / 0.85;
      o.mesh.visible = o.active;
      hit = o.active && o.mesh.position.distanceTo(bp) < R + 0.8;
    }
    if (hit) { hurt(); if (S.mode !== 'playing') return; }
  }

  // Checkpoints
  for (const c of W.checkpoints) {
    if (!c.reached && bp.z < c.z) {
      c.reached = true; S.checkpoint.set(c.x, c.y + R, c.z);
      c.flagMat.color.setHex(0xffd23a); c.flagMat.emissive.setHex(0xffa000);
      sfx.checkpoint(); showMessage('🚩 CHECKPOINT');
      particles.emit(tmpV.set(c.x, c.y + 2, c.z), 0x4ade80, 24, 4, 0.8, 4);
    }
  }

  // Timers
  for (const k in S.power) S.power[k] = Math.max(0, S.power[k] - dt);
  S.invuln = Math.max(0, S.invuln - dt);

  // HUD
  const prog = THREE.MathUtils.clamp((S.startZ - bp.z) / (S.startZ - L.finishZ), 0, 1);
  $('progressFill').style.width = `${prog * 100}%`;
  S.hudTimer -= dt;
  if (S.hudTimer <= 0) {
    S.hudTimer = 0.2;
    $('powers').innerHTML = Object.keys(S.power).filter((k) => S.power[k] > 0).map((k) => `<span class="power">${POWER_LABEL[k]} ${Math.ceil(S.power[k])}s</span>`).join('');
  }

  if (bp.z < L.finishZ) completeLevel();
}

const camTarget = new THREE.Vector3(), lookTarget = new THREE.Vector3();
function updateCamera(dt) {
  const b = ball.position;
  if (S.mode === 'menu') {
    const a = elapsed * 0.12;
    camTarget.set(b.x + Math.sin(a) * 10, b.y + 4.5, b.z + Math.cos(a) * 10 - 4);
    camera.position.lerp(camTarget, 1 - Math.pow(0.02, dt));
    camera.lookAt(b.x, b.y + 0.5, b.z - 4);
    return;
  }
  if (S.mode === 'dying' && S.deathReason === 'fall') { camera.lookAt(b.x * 0.5 + camera.position.x * 0.5, b.y, b.z - 3); return; }
  const baseY = S.mode === 'dying' && S.deathReason === 'fall' ? S.lastGroundY + R : Math.max(b.y, S.lastGroundY + R - 1);
  camTarget.set(b.x * 0.75, baseY + 3.3, b.z + 7.6);
  camera.position.lerp(camTarget, 1 - Math.pow(0.0005, dt));
  lookTarget.set(b.x * 0.9, (S.mode === 'dying' ? b.y : baseY) + 0.3, b.z - 5);
  camera.lookAt(lookTarget);
  const fov = S.power.speed > 0 && S.mode === 'playing' ? 70 : 60;
  if (Math.abs(camera.fov - fov) > 0.1) { camera.fov = THREE.MathUtils.damp(camera.fov, fov, 4, dt); camera.updateProjectionMatrix(); }
}

// ---------------- Input: drag to steer, tap to jump ----------------
const canvas = renderer.domElement;
let drag = null;
addEventListener('pointerdown', () => initAudio(), true);
canvas.addEventListener('pointerdown', (e) => {
  if (S.mode !== 'playing' || save.settings.control !== 'drag') return;
  if (drag) { jump(); return; } // second finger = jump
  drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, last: e.clientX, t0: performance.now(), moved: false, jumped: false };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  S.desiredX += (e.clientX - drag.last) * (DRAG_SENS / innerWidth);
  drag.last = e.clientX;
  if (Math.abs(e.clientX - drag.x0) > 12) drag.moved = true;
  if (!drag.jumped && drag.y0 - e.clientY > 55) { drag.jumped = true; jump(); } // swipe up = jump
});
const endDrag = (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  if (!drag.moved && !drag.jumped && performance.now() - drag.t0 < 280) jump();
  drag = null;
};
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);

// Joystick mode (the original controls, kept as an option)
const joyEl = $('joystick'), stick = $('stick'); let joyPointer = null;
function joyMove(e) {
  const r = joyEl.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  let dx = e.clientX - cx, dy = e.clientY - cy; const max = 35, l = Math.hypot(dx, dy) || 1;
  if (l > max) { dx = dx / l * max; dy = dy / l * max; }
  joy.x = dx / max; joy.y = -dy / max; stick.style.transform = `translate(${dx}px,${dy}px)`;
}
joyEl.addEventListener('pointerdown', (e) => { joyPointer = e.pointerId; joyEl.setPointerCapture(joyPointer); joyMove(e); });
joyEl.addEventListener('pointermove', (e) => { if (e.pointerId === joyPointer) joyMove(e); });
const joyEnd = () => { joyPointer = null; joy.x = 0; joy.y = 0; stick.style.transform = 'translate(0,0)'; };
joyEl.addEventListener('pointerup', joyEnd); joyEl.addEventListener('pointercancel', joyEnd);
$('jumpBtn').addEventListener('pointerdown', (e) => { e.preventDefault(); jump(); });

// Keyboard (for testing on a computer)
addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
  if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
  if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') jump();
  if (e.key === 'Escape' || e.key === 'p') S.mode === 'playing' ? pauseGame() : resumeGame();
});
addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
  if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
});

$('tutorial').addEventListener('pointerdown', () => {
  $('tutorial').classList.add('hidden'); save.tutorialDone = true; persist();
  S.mode = 'playing'; showMessage(`LEVEL ${S.n}`);
});

// ---------------- Buttons ----------------
const click = (id, fn) => $(id).addEventListener('click', () => { initAudio(); sfx.click(); fn(); });
click('playBtn', () => startLevel(Math.min(save.unlocked, TOTAL_LEVELS)));
click('levelsBtn', () => { buildLevelGrid(); showPanel('levelsPanel'); });
click('shopBtn', () => { buildShop(); showPanel('shopPanel'); });
click('settingsBtn', () => { renderSettings(); showPanel('settingsPanel'); });
document.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', () => { sfx.click(); updateWallet(); showPanel('menu'); }));
click('pauseBtn', pauseGame);
click('resumeBtn', resumeGame);
click('restartBtn', () => startLevel(S.n));
click('homeBtn', goMenu);
click('nextBtn', () => startLevel(S.n >= TOTAL_LEVELS ? 1 : S.n + 1));
click('replayBtn', () => startLevel(S.n));
click('menuBtn', goMenu);
click('retryBtn', () => startLevel(S.n));
click('goMenuBtn', goMenu);

function buildLevelGrid() {
  const grid = $('levelGrid'); grid.innerHTML = '';
  for (let i = 1; i <= TOTAL_LEVELS; i++) {
    const b = document.createElement('button');
    const locked = i > save.unlocked, st = save.stars[i] || 0;
    b.className = `lvl ${themeForLevel(i)}${locked ? ' locked' : ''}`;
    b.innerHTML = locked ? '🔒' : `${i}<small>${'★'.repeat(st)}${'☆'.repeat(3 - st)}</small>`;
    if (!locked) b.addEventListener('click', () => { sfx.click(); startLevel(i); });
    grid.appendChild(b);
  }
}

function buildShop() {
  updateWallet();
  const grid = $('shopGrid'); grid.innerHTML = '';
  for (const s of SKINS) {
    const owned = save.owned.includes(s.id), equipped = save.skin === s.id;
    const card = document.createElement('div');
    card.className = `skin${equipped ? ' equipped' : ''}`;
    card.innerHTML = `<div class="ball" style="background:${s.css}"></div><b>${s.name}</b>`;
    const btn = document.createElement('button');
    if (equipped) { btn.textContent = 'EQUIPPED'; btn.className = 'on'; }
    else if (owned) { btn.textContent = 'EQUIP'; btn.className = 'equip'; btn.onclick = () => { sfx.click(); save.skin = s.id; persist(); applySkin(); buildShop(); }; }
    else {
      btn.innerHTML = `<span class="coin-ico"></span>${s.price}`;
      btn.disabled = save.coins < s.price;
      btn.onclick = () => {
        if (save.coins < s.price) return;
        save.coins -= s.price; save.owned.push(s.id); save.skin = s.id; persist();
        sfx.buy(); vibrate('light'); applySkin(); buildShop();
      };
    }
    card.appendChild(btn); grid.appendChild(card);
  }
}

function renderSettings() {
  document.querySelectorAll('[data-set]').forEach((b) => { const on = save.settings[b.dataset.set]; b.classList.toggle('on', on); b.textContent = on ? 'ON' : 'OFF'; });
  document.querySelector('[data-choice="control"]').textContent = save.settings.control === 'drag' ? 'DRAG' : 'JOYSTICK';
  document.querySelector('[data-choice="quality"]').textContent = save.settings.quality === 'high' ? 'HIGH' : 'LOW';
}
document.querySelectorAll('[data-set]').forEach((b) => b.addEventListener('click', () => {
  const k = b.dataset.set; save.settings[k] = !save.settings[k]; persist();
  initAudio(); applyAudioSettings(); if (k === 'vibe' && save.settings.vibe) vibrate('medium');
  sfx.click(); renderSettings();
}));
document.querySelector('[data-choice="control"]').addEventListener('click', () => {
  save.settings.control = save.settings.control === 'drag' ? 'joystick' : 'drag'; persist(); sfx.click(); renderSettings();
});
document.querySelector('[data-choice="quality"]').addEventListener('click', () => {
  save.settings.quality = save.settings.quality === 'high' ? 'low' : 'high'; persist(); sfx.click(); applyQuality(); renderSettings();
  loadWorld(S.n);
});

// ---------------- Android back button & app lifecycle ----------------
onBackButton(() => {
  if (S.mode === 'playing') return pauseGame();
  if (S.mode === 'paused') return resumeGame();
  if (S.mode === 'tutorial' || S.mode === 'complete' || S.mode === 'gameover') return goMenu();
  const open = PANELS.find((p) => !$(p).classList.contains('hidden'));
  if (open && open !== 'menu') { updateWallet(); return showPanel('menu'); }
  exitApp();
});
onAppState(() => { pauseGame(); suspendAudio(); }, () => resumeAudio());

// ---------------- Loop ----------------
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 1 / 30);
  if (document.hidden) return;
  update(dt);
  renderer.render(scene, camera);
}
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

goMenu();
animate();
// Expose for automated testing in a browser
window.__game = { S, startLevel, jump, save, update, groundAt, ballZ: () => ball.position.z, ball };
