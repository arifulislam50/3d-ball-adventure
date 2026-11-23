import * as THREE from 'three';
import './style.css';
import { GAME, WORLDS, LEVELS_PER_WORLD, worldIndex } from './config.js';
import { save, persist, prog } from './storage.js';
import { initAudio, sfx, playMusic, applyAudioSettings, suspendAudio, resumeAudio } from './audio.js';
import { vibrate, onBackButton, onAppState, exitApp } from './native.js';
import { generateLevel, segAt, endlessGen, nextChunk } from './levels.js';
import { buildEnvironment, buildTrack, THEMES } from './world.js';
import { Particles, Trail, SPRITE, emojiTexture } from './effects.js';
import { makeSkinMaterial, hasRing } from './skins.js';
import { ballById, trailById, styleById, petById, powerTime, magnetRadius, coinMult, grantRares } from './catalog.js';
import { track } from './progress.js';
import * as UI from './ui.js';
import { t } from './i18n.js';

const $ = (id) => document.getElementById(id);
const R = 0.5, BASE_G = 24, JUMP_V = 8.6, PAD_V = 15;

// ---------------- Quality ----------------
function resolvedQuality() {
  if (save.settings.battery) return 'low';
  if (save.settings.quality !== 'auto') return save.settings.quality;
  return (navigator.hardwareConcurrency || 4) >= 8 ? 'high' : 'medium';
}
let QUALITY = resolvedQuality();

// ---------------- Renderer, scene, camera, lights ----------------
const app = $('app');
const renderer = new THREE.WebGLRenderer({ antialias: QUALITY === 'high', powerPreference: 'high-performance' });
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

// ---------------- Ball & friends ----------------
const ball = new THREE.Mesh(new THREE.SphereGeometry(R, 32, 24), makeSkinMaterial('classic'));
ball.castShadow = true; scene.add(ball);
const ring = new THREE.Mesh(new THREE.TorusGeometry(R * 1.03, 0.05, 8, 40), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 }));
ring.rotation.x = Math.PI / 2; ball.add(ring);
const shieldBubble = new THREE.Mesh(new THREE.SphereGeometry(R * 1.55, 24, 16), new THREE.MeshBasicMaterial({ color: 0x5ad1ff, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false }));
shieldBubble.visible = false; scene.add(shieldBubble);
const extras = new THREE.Group(); scene.add(extras); // eyes / hat / face: follow the ball without rolling
const eyeSprite = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false })); eyeSprite.scale.set(0.78, 0.39, 1); eyeSprite.position.set(0, 0.06, 0.52);
const faceSprite = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false })); faceSprite.scale.set(0.8, 0.4, 1); faceSprite.position.set(0, 0.02, 0.56);
const hatSprite = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false })); hatSprite.scale.set(0.62, 0.62, 1); hatSprite.position.set(0, R + 0.2, 0.05);
extras.add(eyeSprite, faceSprite, hatSprite);
const pet = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false })); pet.scale.set(0.75, 0.75, 1); scene.add(pet);
const sparks = new Particles(scene, { max: 600 });
let emojiPS = null;
const trail = new Trail(scene);

// Custom drawn accessories (eyes, glasses, mustache, horns)
const accCache = new Map();
function accTexture(id) {
  if (accCache.has(id)) return accCache.get(id);
  const item = styleById(id);
  if (id === 'hat_horns' || item?.slot === 'hat') {
    if (id !== 'hat_horns') { const tx = emojiTexture(item.icon, 128); accCache.set(id, tx); return tx; }
  }
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d');
  const eye = (x, fn) => { g.save(); g.translate(x, 64); fn(); g.restore(); };
  if (id === 'eyes_cute' || id === 'eyes_angry') {
    [80, 176].forEach((x, i) => eye(x, () => {
      g.fillStyle = '#fff'; g.beginPath(); g.ellipse(0, 0, 34, 42, 0, 0, 7); g.fill(); g.lineWidth = 4; g.strokeStyle = '#222'; g.stroke();
      g.fillStyle = '#1b1b2f'; g.beginPath(); g.ellipse(4, 10, 19, 23, 0, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(10, 2, 7, 0, 7); g.fill();
      if (id === 'eyes_angry') { g.fillStyle = '#1b1b2f'; g.beginPath(); const s = i ? -1 : 1; g.moveTo(-40, -48 + (s > 0 ? 0 : 22)); g.lineTo(40, -48 + (s > 0 ? 22 : 0)); g.lineTo(40, -60); g.lineTo(-40, -60); g.fill(); }
    }));
  } else if (id === 'eyes_sleepy') {
    [80, 176].forEach((x) => eye(x, () => { g.lineWidth = 9; g.strokeStyle = '#1b1b2f'; g.lineCap = 'round'; g.beginPath(); g.arc(0, -6, 26, 0.2, Math.PI - 0.2); g.stroke(); }));
    g.fillStyle = '#5ad1ff'; g.font = 'bold 30px sans-serif'; g.fillText('z', 216, 30); g.font = 'bold 22px sans-serif'; g.fillText('z', 236, 14);
  } else if (id === 'eyes_star') {
    [80, 176].forEach((x) => eye(x, () => { g.fillStyle = '#ffd23a'; g.strokeStyle = '#a86e00'; g.lineWidth = 4; g.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 16 : 40, a = i * Math.PI / 5 - Math.PI / 2; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill(); g.stroke(); }));
  } else if (id === 'face_shades') {
    g.fillStyle = '#111'; [70, 186].forEach((x) => { g.beginPath(); g.ellipse(x, 60, 50, 34, 0, 0, 7); g.fill(); }); g.fillRect(110, 46, 36, 10);
    g.fillStyle = 'rgba(255,255,255,.35)'; [55, 171].forEach((x) => { g.beginPath(); g.ellipse(x, 48, 16, 8, -0.4, 0, 7); g.fill(); });
  } else if (id === 'face_nerd') {
    g.strokeStyle = '#2a2a2a'; g.lineWidth = 9; [76, 180].forEach((x) => { g.beginPath(); g.arc(x, 60, 38, 0, 7); g.stroke(); }); g.beginPath(); g.moveTo(114, 56); g.lineTo(142, 56); g.stroke();
  } else if (id === 'face_stache') {
    g.fillStyle = '#3a2416'; g.beginPath(); g.moveTo(128, 70); g.bezierCurveTo(100, 60, 60, 66, 40, 96); g.bezierCurveTo(80, 92, 110, 100, 128, 84); g.bezierCurveTo(146, 100, 176, 92, 216, 96); g.bezierCurveTo(196, 66, 156, 60, 128, 70); g.fill();
  } else if (id === 'hat_horns') {
    g.fillStyle = '#d4142a'; [[70, -1], [186, 1]].forEach(([x, s]) => { g.beginPath(); g.moveTo(x - 30, 120); g.quadraticCurveTo(x - s * 10, 50, x + s * 30, 6); g.quadraticCurveTo(x + s * 10, 70, x + 30, 120); g.fill(); });
  }
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; accCache.set(id, tx); return tx;
}

function applyLook() {
  const old = ball.material; ball.material = makeSkinMaterial(save.equip.ball); old.dispose();
  ball.userData.baseOpacity = ball.material.opacity; ball.userData.baseTransparent = ball.material.transparent;
  ring.visible = hasRing(save.equip.ball);
  const tr = trailById(save.equip.trail);
  trail.look = tr.look || 'ball'; trail.color.setHex(ballById(save.equip.ball).trail);
  trail.mesh.visible = save.settings.trailFx;
  if (emojiPS) { scene.remove(emojiPS.points); emojiPS.points.geometry.dispose(); emojiPS.mat.dispose(); emojiPS = null; }
  if (tr.emoji) emojiPS = new Particles(scene, { map: emojiTexture(tr.emoji, 96), additive: false, max: 160 });
  const e = save.equip;
  eyeSprite.visible = !!e.eyes; if (e.eyes) eyeSprite.material.map = accTexture(e.eyes);
  faceSprite.visible = !!e.face; if (e.face) faceSprite.material.map = accTexture(e.face);
  hatSprite.visible = !!e.hat; if (e.hat) { hatSprite.material.map = accTexture(e.hat); hatSprite.scale.set(e.hat === 'hat_horns' ? 0.8 : 0.62, e.hat === 'hat_horns' ? 0.4 : 0.62, 1); hatSprite.position.y = e.hat === 'hat_horns' ? R + 0.08 : R + 0.2; }
  [eyeSprite, faceSprite, hatSprite].forEach((s) => (s.material.needsUpdate = true));
  pet.visible = !!e.pet; if (e.pet) { pet.material.map = emojiTexture(petById(e.pet).icon, 128); pet.material.needsUpdate = true; }
  setParticleScale();
}

// ---------------- Game state ----------------
const S = {
  mode: 'loading', worldId: 'meadow', lvl: 1, endless: false, level: null, env: null, contents: [], gen: null,
  lives: 3, maxLives: 3, lostLives: 0, coinsF: 0, coinTotal: 0, gemTaken: false,
  vx: 0, vy: 0, onGround: true, coyote: 0, usedDouble: false, desiredX: 0, seg: null, lastGroundY: 0,
  checkpoint: new THREE.Vector3(), lastSafe: new THREE.Vector3(), invuln: 0,
  power: { speed: 0, shield: 0, magnet: 0, double: 0, slow: 0, ghost: 0, x2: 0 },
  time: 0, wt: 0, deadTimer: 0, deathReason: '', startZ: 6, hudTimer: 0, speedNow: 7, gravity: BASE_G,
  introT: 0, shake: 0, continues: 0, meteorT: 2, trailT: 0, distance: 0,
};
const meteors = [];
const joy = { x: 0, y: 0 }, keys = { left: false, right: false };
const clock = new THREE.Clock();
let elapsed = 0, sparkleTimer = 0;

// ---------------- World loading ----------------
function clearWorld() {
  S.contents.forEach((c) => c.dispose()); S.contents = [];
  if (S.env) S.env.dispose(); S.env = null;
  meteors.forEach((m) => { m.active = false; m.g.visible = false; });
}
function setupEnv(themeId) {
  S.env = buildEnvironment(scene, themeId, QUALITY);
  const T = S.env.theme;
  hemi.color.setHex(T.hemi[0]); hemi.groundColor.setHex(T.hemi[1]); hemi.intensity = T.hemi[2];
  sun.intensity = T.sun; ballLight.intensity = T.night ? 18 : 0;
  S.gravity = BASE_G * (T.gravity || 1);
}
function placeBallAt(x, y, z) {
  ball.position.set(x, y, z); S.desiredX = x; S.vx = 0; S.vy = 0; S.onGround = true; S.lastGroundY = y - R;
  trail.reset(ball.position); pet.position.set(x + 0.9, y + 1, z + 0.6);
}
function loadLevelWorld(worldId, lvl) {
  clearWorld();
  S.worldId = worldId; S.lvl = lvl; S.endless = false;
  S.level = generateLevel(worldId, lvl);
  setupEnv(worldId);
  S.contents.push(buildTrack(scene, S.level, worldId, QUALITY));
  const st = S.level.segs[0];
  placeBallAt(st.cx0, st.y0 + R, S.startZ);
  S.checkpoint.copy(ball.position); S.lastSafe.copy(ball.position);
}

function diffMods() {
  const d = save.settings.difficulty;
  return { speed: d === 'easy' ? 0.85 : d === 'hard' ? 1.12 : 1, lives: d === 'easy' ? 1 : d === 'hard' ? -1 : 0, coins: d === 'hard' ? 1.2 : 1 };
}

function resetRunState() {
  const dm = diffMods();
  S.maxLives = S.endless ? 1 : Math.max(1, 3 + (save.upgrades.lives || 0) + dm.lives);
  S.lives = S.maxLives; S.lostLives = 0; S.coinsF = 0; S.invuln = 0; S.time = 0; S.wt = 0; S.continues = 0; S.distance = 0;
  S.power = { speed: 0, shield: 0, magnet: 0, double: 0, slow: 0, ghost: 0, x2: 0 };
  S.meteorT = 2.5; sparks.clear();
  if (save.items.startShield > 0) { save.items.startShield--; S.power.shield = powerTime('shield'); persist(); }
}

export function startLevel(worldId, lvl) {
  initAudio();
  lvl = Math.max(1, Math.min(LEVELS_PER_WORLD, lvl));
  save.lastWorld = worldId; persist();
  loadLevelWorld(worldId, lvl);
  resetRunState();
  S.coinTotal = S.level.coins.length + 5 * S.level.gems.length;
  UI.hudStart({ endless: false, lvl, boss: S.level.boss, lives: S.lives, max: S.maxLives });
  playMusic(worldId);
  if (!save.tutorialDone && save.settings.control === 'drag') { S.mode = 'tutorial'; UI.showTutorial(true); }
  else beginIntro();
}

function beginIntro() {
  S.mode = 'intro'; S.introT = S.endless ? 0.9 : 1.7;
  UI.message(S.endless ? t('endlessTitle') : (S.level.boss ? t('bossLevel') : t('level', { n: S.lvl })), 1500);
}
export function skipIntro() { if (S.mode === 'intro') S.introT = 0; }
export function tutorialDone() { save.tutorialDone = true; persist(); UI.showTutorial(false); beginIntro(); }

export function startEndless(worldId) {
  initAudio();
  clearWorld();
  S.worldId = worldId; S.endless = true; S.level = { speed: 7.5, icy: worldId === 'ice', boss: false, theme: worldId };
  setupEnv(worldId);
  S.gen = endlessGen(worldId);
  appendChunk(); appendChunk();
  const st = S.contents[0].segs[0];
  placeBallAt(st.cx0, st.y0 + R, S.startZ);
  S.checkpoint.copy(ball.position); S.lastSafe.copy(ball.position);
  resetRunState();
  UI.hudStart({ endless: true, lives: S.lives, max: S.maxLives });
  playMusic(worldId);
  beginIntro();
}
function appendChunk() {
  const data = nextChunk(S.gen, Math.max(0, S.startZ - S.gen.z));
  S.contents.push(buildTrack(scene, data, S.worldId, QUALITY));
}

export function showMenuScene() {
  S.mode = 'menu';
  loadLevelWorld(save.lastWorld || 'meadow', Math.min(prog(save.lastWorld || 'meadow').unlocked, LEVELS_PER_WORLD));
  playMusic(S.worldId);
}

export function pauseGame() { if (S.mode === 'playing' || S.mode === 'intro') { S.prevMode = S.mode; S.mode = 'paused'; UI.showPause(true); } }
export function resumeGame() { if (S.mode === 'paused') { S.mode = S.prevMode || 'playing'; UI.showPause(false); } }

// ---------------- Physics helpers ----------------
function* allSegs() { for (const c of S.contents) yield* c.segs; }
function groundAt(x, z, bottom) {
  let best = null;
  for (const s of allSegs()) {
    if (z > s.z0 || z < s.z1 || s.fallen) continue;
    const p = segAt(s, z), cx = p.x + (s.offset || 0);
    if (Math.abs(x - cx) > s.w / 2 + R * 0.25) continue;
    if (p.y > bottom + 0.45) continue;
    if (!best || p.y > best.y) best = { y: p.y, seg: s, cx };
  }
  return best;
}

export function jump() {
  if (S.mode !== 'playing') return;
  if (S.onGround || S.coyote > 0) {
    S.vy = JUMP_V; S.onGround = false; S.coyote = 0; S.usedDouble = false;
    sfx.jump(); vibrate('light'); save.stats.jumps++; track('jumps');
    sparks.emit(new THREE.Vector3(ball.position.x, ball.position.y - R, ball.position.z), S.env.theme.top, 10, 2.5, 0.5, 4, 0.6, 0.35);
  } else if (S.power.double > 0 && !S.usedDouble) {
    S.vy = Math.max(S.vy, JUMP_V * 0.92); S.usedDouble = true; sfx.double(); save.stats.jumps++; track('jumps');
    sparks.emit(ball.position, 0xffffff, 16, 3, 0.5, 2, 1, 0.3);
  }
}

function hurt() {
  if (S.invuln > 0 || S.power.ghost > 0) return;
  if (S.power.shield > 0) {
    S.power.shield = 0; S.invuln = 1.2; sfx.shieldBreak(); vibrate('medium');
    sparks.emit(ball.position, 0x5ad1ff, 30, 5, 0.7, 2); UI.message(t('shieldSaved'));
    return;
  }
  loseLife('hit');
}

function loseLife(reason) {
  S.lives--; S.lostLives++; UI.hudLives(S.lives, S.maxLives);
  S.mode = 'dying'; S.deathReason = reason; S.deadTimer = reason === 'fall' ? 1.0 : 0.9;
  vibrate('heavy'); if (save.settings.shake) S.shake = 0.4;
  if (reason === 'hit') { sfx.hit(); S.vy = 7; save.stats.hits++; sparks.emit(ball.position, 0xff5a5a, 30, 6, 0.8, 8); }
  else { sfx.fall(); save.stats.falls++; }
}

function resetHazards() {
  for (const s of allSegs()) if (s.type === 'crumble') { s.triggered = 0; s.fallen = false; }
  for (const c of S.contents) for (const o of c.obstacles) if (o.type === 'boulder') { o.active = false; o.cur = o.home; }
  meteors.forEach((m) => { m.active = false; m.g.visible = false; });
}

function respawn() {
  if (S.lives <= 0) return runOver();
  resetHazards();
  const p = S.endless ? S.lastSafe : S.checkpoint;
  placeBallAt(p.x, p.y, p.z);
  S.invuln = 2; S.power.speed = 0; S.mode = 'playing';
  UI.message(S.lives === 1 ? t('lastLife') : t('livesLeft', { n: S.lives }));
}

function coinsEarned() { return Math.floor(S.coinsF); }

function runOver() {
  S.mode = 'gameover'; sfx.lose();
  UI.hudHide();
  if (S.endless) {
    const dist = Math.floor(S.distance), best = save.stats.endlessBest, isBest = dist > best;
    save.stats.endlessBest = Math.max(best, dist); track('endless', dist);
    save.coins += coinsEarned(); S.coinsF = 0; const rares = grantRares(); persist();
    UI.showGameOver({ endless: true, dist, best: save.stats.endlessBest, isBest, coins: coinsEarned(), continues: S.continues, rares });
  } else {
    save.coins += coinsEarned(); const c = coinsEarned(); S.coinsF = 0; persist();
    UI.showGameOver({ endless: false, coins: c, continues: S.continues });
  }
}

export function continueRun(useTicket) {
  if (S.mode !== 'gameover') return false;
  const cost = 50 * (S.continues + 1);
  if (useTicket) { if (save.items.tickets <= 0) return false; save.items.tickets--; }
  else { if (save.coins < cost) return false; save.coins -= cost; }
  S.continues++; persist();
  S.lives = 1; UI.hudStart({ endless: S.endless, lvl: S.lvl, boss: S.level.boss, lives: 1, max: S.maxLives, keep: true });
  UI.hudLives(1, S.maxLives);
  resetHazards();
  const p = S.endless ? S.lastSafe : S.checkpoint;
  placeBallAt(p.x, p.y, p.z); S.invuln = 2.5; S.mode = 'playing';
  return true;
}
export const continueCost = () => 50 * (S.continues + 1);

export function skipLevel() {
  if (save.items.skip <= 0 || S.endless) return false;
  save.items.skip--;
  const p = prog(S.worldId); p.unlocked = Math.max(p.unlocked, Math.min(LEVELS_PER_WORLD, S.lvl + 1)); persist();
  startLevel(S.worldId, Math.min(LEVELS_PER_WORLD, S.lvl + 1));
  return true;
}

function completeLevel() {
  S.mode = 'complete'; UI.hudHide(); sfx.win(); vibrate('medium');
  const L = S.level, earned = coinsEarned();
  const ratio = S.coinTotal ? earned / (S.coinTotal * coinMult() * diffMods().coins) : 1;
  const stars = 1 + (ratio >= 0.5 ? 1 : 0) + (ratio >= 0.8 && S.lostLives === 0 ? 1 : 0);
  const bonus = L.boss ? 100 : 10;
  const p = prog(S.worldId), prev = p.stars[S.lvl] || 0;
  p.stars[S.lvl] = Math.max(prev, stars);
  const time = Math.round(S.time * 10) / 10, oldBest = p.best[S.lvl], record = !oldBest || time < oldBest;
  if (record) p.best[S.lvl] = time;
  p.unlocked = Math.max(p.unlocked, Math.min(LEVELS_PER_WORLD, S.lvl + 1));
  save.coins += earned + bonus;
  save.stats.levels++; track('levels');
  if (S.lostLives === 0) { save.stats.nodeath++; track('nodeath'); }
  if (stars === 3) { track('stars3'); if (prev < 3) save.stats.threeStars++; }
  if (L.boss) save.stats.bosses++;
  const rares = grantRares();
  persist();
  for (let i = 0; i < 4; i++) sparks.emit(new THREE.Vector3(ball.position.x + (i - 1.5), ball.position.y + 2, ball.position.z - 2), [0xffd23a, 0xff5a8a, 0x5ad1ff, 0x7ee37a][i], 25, 6, 1.2, 5, 1, 0.45);
  UI.showComplete({ stars, earned, bonus, collected: S.coinTotal, boss: L.boss, time, best: p.best[S.lvl], record: record && !!oldBest, worldId: S.worldId, lvl: S.lvl, rares });
}

// ---------------- Meteors (boss levels) ----------------
const meteorRock = new THREE.DodecahedronGeometry(0.7, 1);
const meteorMat = new THREE.MeshStandardMaterial({ color: 0x5a2a1a, emissive: 0xff5a00, emissiveIntensity: 0.9, roughness: 0.8 });
const ringGeo = new THREE.RingGeometry(0.9, 1.25, 32); ringGeo.rotateX(-Math.PI / 2);
for (let i = 0; i < 6; i++) {
  const g = new THREE.Group(), rock = new THREE.Mesh(meteorRock, meteorMat);
  const ringM = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xff2a2a, transparent: true, opacity: 0.7, depthWrite: false }));
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: SPRITE, color: 0xff7a1a, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); glow.scale.set(2.4, 2.4, 1); rock.add(glow);
  g.add(rock, ringM); g.visible = false; scene.add(g);
  meteors.push({ g, rock, ring: ringM, active: false, t: 0, target: new THREE.Vector3() });
}
function updateMeteors(dt) {
  if (!S.level?.boss) return;
  S.meteorT -= dt;
  if (S.meteorT <= 0) {
    S.meteorT = 1.7 - S.level.d * 0.6 + Math.random() * 0.5;
    const z = ball.position.z - (S.speedNow * 1.3 + 3);
    const g = groundAt(ball.position.x, z, 99) || null;
    let seg = null; for (const s of allSegs()) if (z <= s.z0 && z >= s.z1 && !s.fallen) seg = s;
    const m = meteors.find((q) => !q.active);
    if (seg && m) {
      const p = segAt(seg, z);
      m.target.set(p.x + (seg.offset || 0) + (Math.random() - 0.5) * (seg.w - 1), p.y, z);
      if (Math.random() < 0.45) m.target.x = ball.position.x + (Math.random() - 0.5) * 0.6; // aim at the player sometimes
      m.active = true; m.t = 0; m.g.visible = true; m.ring.position.copy(m.target).y += 0.04;
    }
    void g;
  }
  for (const m of meteors) {
    if (!m.active) continue;
    m.t += dt / 1.3;
    const k = Math.min(1, m.t);
    m.rock.position.set(m.target.x + 6 * (1 - k), m.target.y + 0.7 + 26 * (1 - k) * (1 - k), m.target.z - 9 * (1 - k));
    m.rock.rotation.x += dt * 5; m.ring.material.opacity = 0.4 + Math.sin(m.t * 30) * 0.3; m.ring.scale.setScalar(1.2 - k * 0.3);
    if (k >= 1) {
      m.active = false; m.g.visible = false;
      sparks.emit(m.target.clone().setY(m.target.y + 0.5), 0xff7a1a, 30, 6, 0.8, 8, 1, 0.5); sfx.meteor();
      const d = Math.hypot(ball.position.x - m.target.x, ball.position.z - m.target.z);
      if (d < 6 && save.settings.shake) S.shake = Math.max(S.shake, 0.25 * (1 - d / 6) + 0.05);
      if (d < 1.4 && ball.position.y - R < m.target.y + 1.3 && S.mode === 'playing') hurt();
    }
  }
}

// ---------------- Main update ----------------
const tmpV = new THREE.Vector3(), axis = new THREE.Vector3(), quat = new THREE.Quaternion(), dummy = new THREE.Object3D();

function update(dt) {
  elapsed += dt;
  const slow = S.power.slow > 0 ? 0.6 : 1;
  const wdt = (S.mode === 'paused' ? 0 : dt * slow);
  S.wt += wdt;
  if (S.env) S.env.anim.forEach((f) => f(dt, elapsed, ball.position));
  for (const c of S.contents) c.anim.forEach((f) => f(wdt, S.wt, ball.position));

  if (S.mode === 'playing') { updatePlay(dt, slow); updateMeteors(dt * slow); }
  else if (S.mode === 'intro') { S.introT -= dt; if (S.introT <= 0) S.mode = 'playing'; }
  else if (S.mode === 'dying') {
    S.vy -= S.gravity * dt; ball.position.y += S.vy * dt;
    if (S.deathReason === 'hit') ball.position.z += 3 * dt;
    S.deadTimer -= dt; if (S.deadTimer <= 0) respawn();
  }

  updateCollectibles(dt);
  sparks.update(dt); if (emojiPS) emojiPS.update(dt);
  trail.strength = S.power.speed > 0 ? 0.6 : (emojiPS ? 0.14 : 0.28);
  trail.update(ball.position, R, elapsed);
  shieldBubble.position.copy(ball.position);
  shieldBubble.visible = S.power.shield > 0 && (S.power.shield > 2 || Math.sin(elapsed * 20) > 0);
  ball.visible = !(S.invuln > 0 && S.mode === 'playing' && Math.sin(elapsed * 30) > 0.3);
  const ghost = S.power.ghost > 0;
  ball.material.transparent = ghost || ball.userData.baseTransparent; ball.material.opacity = ghost ? 0.4 : ball.userData.baseOpacity;
  extras.position.copy(ball.position); extras.visible = ball.visible;
  // Pet follows with a little lag and bobs
  tmpV.set(ball.position.x + 0.95, ball.position.y + 0.95 + Math.sin(elapsed * 4) * 0.15, ball.position.z + 0.5);
  pet.position.lerp(tmpV, 1 - Math.pow(0.002, dt));
  ballLight.position.set(ball.position.x, ball.position.y + 1.5, ball.position.z + 1);
  sun.position.set(ball.position.x - 6, ball.position.y + 14, ball.position.z + 8);
  sun.target.position.copy(ball.position);
  updateCamera(dt);
}

function updateCollectibles(dt) {
  for (const W of S.contents) {
    W.coins.forEach((c, i) => {
      let scale = 1, glow = 1;
      dummy.position.copy(c.pos);
      if (c.seg && !c.taken && !c.magnet) dummy.position.x = c.home.x + (c.seg.offset || 0);
      dummy.position.y += Math.sin(elapsed * 3 + i * 0.7) * 0.1;
      let spin = elapsed * 2.6 + i * 0.5;
      if (c.taken) {
        c.pop = Math.max(0, c.pop - dt);
        const k = 1 - c.pop / 0.35;
        dummy.position.y += k * 1.2; spin += k * 12;
        scale = c.pop > 0 ? (k < 0.5 ? 1 + k * 0.8 : (1 - k) * 2.8) : 0; glow = scale * 1.6;
      }
      dummy.rotation.set(0, spin, 0); dummy.scale.setScalar(scale); dummy.updateMatrix(); W.coinMesh.setMatrixAt(i, dummy.matrix);
      dummy.quaternion.copy(camera.quaternion); dummy.scale.setScalar(glow * (0.85 + Math.sin(elapsed * 4 + i) * 0.15)); dummy.updateMatrix(); W.coinGlow.setMatrixAt(i, dummy.matrix);
    });
    W.coinMesh.instanceMatrix.needsUpdate = true; W.coinGlow.instanceMatrix.needsUpdate = true;
    W.gems.forEach((g) => { g.mesh.rotation.y += dt * 2; g.mesh.visible = !g.taken; });
    W.powerups.forEach((p, i) => { p.mesh.rotation.y += dt * 1.5; p.mesh.position.y = p.y + Math.sin(elapsed * 3 + i) * 0.15; p.mesh.visible = !p.taken; });
  }
  sparkleTimer -= dt;
  if (sparkleTimer <= 0 && S.contents.length && save.settings.particles) {
    sparkleTimer = 0.12;
    const W = S.contents[Math.floor(Math.random() * S.contents.length)];
    const c = W.coins[Math.floor(Math.random() * W.coins.length)];
    if (c && !c.taken && Math.abs(c.pos.z - ball.position.z) < 30) sparks.emit(tmpV.set(c.pos.x + (Math.random() - 0.5) * 0.5, c.pos.y + 0.25, c.pos.z), 0xffffff, 1, 0.4, 0.45, 0, 1, 0.25);
  }
}

function collectCoin(c) {
  c.taken = true; c.pop = 0.35;
  const v = coinMult() * (S.power.x2 > 0 ? 2 : 1) * diffMods().coins;
  S.coinsF += v; save.stats.coins += 1; track('coins'); sfx.coin();
  sparks.emit(c.pos, 0xffd23a, 12, 3.2, 0.55, 4, 1, 0.32); sparks.emit(c.pos, 0xffffff, 6, 2, 0.35, 0, 1, 0.25);
}

function updatePlay(dt, slow) {
  const L = S.level, bp = ball.position;
  S.time += dt;
  save.stats.time += dt;
  const joystick = save.settings.control === 'joystick';
  let speed = (S.endless ? 7.5 + Math.min(5.5, S.distance / 350) : L.speed) * diffMods().speed;
  if (S.power.speed > 0) speed *= 1.55;
  if (joystick) speed *= 1 + joy.y * 0.35;
  speed *= slow === 1 ? 1 : 0.7;
  S.speedNow = speed;
  bp.z -= speed * dt;

  // Steering
  const icy = (L.icy || S.worldId === 'ice') && S.onGround;
  if (keys.left) S.desiredX -= 7 * dt;
  if (keys.right) S.desiredX += 7 * dt;
  if (joystick) {
    S.vx = THREE.MathUtils.damp(S.vx, joy.x * 7, icy ? 2.5 : 8, dt);
    if (keys.left || keys.right) S.vx = (keys.right - keys.left) * 7;
  } else {
    S.desiredX = THREE.MathUtils.clamp(S.desiredX, bp.x - 4, bp.x + 4);
    S.vx = THREE.MathUtils.damp(S.vx, THREE.MathUtils.clamp((S.desiredX - bp.x) * 14, -13, 13), icy ? 3 : 18, dt);
  }
  bp.x += S.vx * dt;
  if (joystick) S.desiredX = bp.x;

  // Wind & moving platforms
  for (const s of allSegs()) if (s.wind && bp.z <= s.z0 && bp.z >= s.z1) { bp.x += s.wind * dt; S.desiredX += s.wind * dt; }
  if (S.onGround && S.seg && S.seg.type === 'moving') { bp.x += S.seg.delta || 0; S.desiredX += S.seg.delta || 0; }

  // Vertical
  const wasGround = S.onGround;
  S.vy -= S.gravity * dt; bp.y += S.vy * dt;
  const g = groundAt(bp.x, bp.z, bp.y - R), bottom = bp.y - R;
  if (g && S.vy <= 0 && (bottom <= g.y || (wasGround && bottom - g.y < 0.3))) {
    if (!wasGround && S.vy < -5) { sfx.land(); sparks.emit(new THREE.Vector3(bp.x, g.y, bp.z), S.env.theme.top, 8, 2, 0.4, 3, 0.5, 0.35); }
    bp.y = g.y + R; S.vy = 0; S.onGround = true; S.coyote = 0.12; S.seg = g.seg; S.lastGroundY = g.y; S.usedDouble = false;
    const s = g.seg;
    if (s.type === 'crumble' && !s.triggered) s.triggered = S.wt;
    if ((s.type === 'normal' || s.type === 'ice' || s.type === 'bridge') && !s.wind && s.w >= 3) S.lastSafe.set(g.cx, g.y + R, Math.min(s.z0 - 0.5, bp.z + 1));
  } else { S.onGround = false; S.coyote -= dt; }
  if (bp.y < S.lastGroundY - 6) { loseLife('fall'); return; }

  // Crumbling tiles fall shortly after being touched
  for (const s of allSegs()) if (s.type === 'crumble' && s.triggered && !s.fallen && S.wt - s.triggered > 0.5) {
    s.fallen = true; sfx.crumble(); sparks.emit(tmpV.set(segAt(s, (s.z0 + s.z1) / 2).x, s.y0, (s.z0 + s.z1) / 2), 0xc9a36a, 14, 2, 0.6, 6, 0.5, 0.4);
  }

  // Roll
  tmpV.set(S.vx, 0, -speed);
  axis.set(tmpV.z, 0, -tmpV.x).normalize();
  quat.setFromAxisAngle(axis, tmpV.length() * dt / R); ball.quaternion.premultiply(quat);

  // Trail particles
  S.trailT -= dt;
  const tr = trailById(save.equip.trail);
  if (S.trailT <= 0 && save.settings.trailFx) {
    S.trailT = 0.06;
    const back = tmpV.set(bp.x + (Math.random() - 0.5) * 0.4, bp.y - 0.1, bp.z + 0.6);
    if (emojiPS && Math.random() < 0.6) emojiPS.emit(back.setY(bp.y - 0.25), 0xffffff, 1, 0.4, 0.7, -0.5, 0.6, 0.28);
    if (tr.spark) sparks.emit(back, tr.spark, tr.mode === 'spark' ? 4 : 2, tr.mode === 'spark' ? 2.5 : 1, 0.4, 0, 1, 0.22);
  }

  // Collectibles
  const petOn = !!save.equip.pet, mag = S.power.magnet > 0, magR = magnetRadius();
  for (const W of S.contents) {
    for (const c of W.coins) {
      if (c.taken) continue;
      if (Math.abs(c.pos.z - bp.z) > magR + 2) continue;
      if (c.seg && !c.magnet) c.pos.x = c.home.x + (c.seg.offset || 0);
      if (mag && c.pos.distanceTo(bp) < magR) { c.magnet = true; c.pos.lerp(bp, Math.min(1, dt * 9)); }
      if (c.pos.distanceTo(bp) < 0.9 || (petOn && c.pos.distanceTo(pet.position) < 1.6)) collectCoin(c);
    }
    for (const gm of W.gems) if (!gm.taken && gm.mesh.position.distanceTo(bp) < 1.1) {
      gm.taken = true; S.coinsF += 5 * coinMult(); sfx.gem(); vibrate('light');
      sparks.emit(gm.mesh.position, 0x35e6df, 30, 5, 0.9, 3, 1, 0.4); UI.message('💎 +5');
    }
    for (const p of W.powerups) if (!p.taken && p.mesh.position.distanceTo(bp) < 1.2) {
      p.taken = true; S.power[p.kind] = powerTime(p.kind); sfx.power(); vibrate('light');
      save.stats.powerups++; track('power');
      sparks.emit(p.mesh.position, 0xffffff, 26, 5, 0.8, 2, 1, 0.35); UI.message(t('p_' + p.kind) + '!');
    }
    for (const pad of W.pads) {
      if (pad.type === 'jump' && S.vy <= 1 && bp.y - R < pad.y + 1.3 && Math.hypot(pad.x - bp.x, pad.z - bp.z) < 0.95 && (!pad.used || S.wt - pad.used > 1)) {
        // launch just high enough to clear the gap at the current speed (with a margin)
        pad.used = S.wt;
        S.vy = THREE.MathUtils.clamp(S.gravity * ((pad.gap + 3) / Math.max(4, speed)) / 2, PAD_V * 0.8, 24); S.onGround = false; S.coyote = 0; sfx.pad(); vibrate('medium');
        sparks.emit(tmpV.set(pad.x, pad.y + 0.3, pad.z), 0x7eff6a, 24, 4, 0.6, 3, 1, 0.35);
      } else if (pad.type === 'boost' && Math.abs(pad.x - bp.x) < 0.95 && Math.abs(pad.z - bp.z) < 1.6 && bp.y - R < pad.y + 0.4) {
        if (!pad.used || S.wt - pad.used > 1.5) { pad.used = S.wt; sfx.boost(); }
        S.power.speed = Math.max(S.power.speed, 1.6);
      }
    }
  }
  UI.hudCoins(coinsEarned());

  // Obstacles
  const ot = S.wt;
  for (const W of S.contents) for (const o of W.obstacles) {
    if (Math.abs(o.z - bp.z) > 40 && o.type !== 'boulder') continue;
    let hit = false;
    if (o.type === 'bumper') {
      const p = segAt(o.seg, o.z);
      o.mesh.position.set(p.x + Math.sin(ot * o.speed + o.phase) * o.range, p.y + 0.4, o.z);
      hit = Math.abs(o.mesh.position.x - bp.x) < 0.6 + R * 0.85 && Math.abs(o.z - bp.z) < 0.45 + R * 0.85 && bp.y - R < p.y + 0.8;
    } else if (o.type === 'spike') {
      hit = Math.hypot(o.x - bp.x, o.z - bp.z) < 0.55 + R * 0.6 && bp.y - R < o.y + 0.75;
    } else if (o.type === 'hammer') {
      const a = Math.sin(ot * o.speed + o.phase) * 1.15; o.pivot.rotation.z = a;
      tmpV.set(o.x + Math.sin(a) * o.len, o.y + 4.6 - Math.cos(a) * o.len, o.z);
      hit = tmpV.distanceTo(bp) < R + 0.62;
    } else if (o.type === 'boulder') {
      if (!o.active && bp.z > o.home && bp.z - o.home < 38) { o.active = true; o.cur = o.home; }
      if (o.active) { o.cur += o.speed * dt * slow; if (o.cur > o.seg.z0 + 1) { o.active = false; o.cur = o.home; } }
      const p = segAt(o.seg, Math.min(o.cur, o.seg.z0));
      o.mesh.position.set(o.x, p.y + 0.85, o.cur); o.mesh.rotation.x += (o.active ? o.speed : 0) * dt / 0.85; o.mesh.visible = o.active;
      hit = o.active && o.mesh.position.distanceTo(bp) < R + 0.8;
    } else if (o.type === 'laser') {
      const on = ((ot + o.phase) % o.period) < o.period * 0.55;
      o.beam.visible = on; o.glow.visible = on;
      hit = on && Math.abs(o.z - bp.z) < 0.3 + R * 0.6 && bp.y - R < o.y + 0.62 && Math.abs(o.x - bp.x) < o.w / 2;
    }
    if (hit) { hurt(); if (S.mode !== 'playing') return; }
  }

  // Checkpoints
  for (const W of S.contents) for (const c of W.checkpoints) if (!c.reached && bp.z < c.z) {
    c.reached = true; S.checkpoint.set(c.x, c.y + R, c.z);
    c.flagMat.color.setHex(0xffd23a); c.flagMat.emissive.setHex(0xffa000);
    sfx.checkpoint(); UI.message(t('checkpoint'));
    sparks.emit(tmpV.set(c.x, c.y + 2, c.z), 0x4ade80, 24, 4, 0.8, 4, 1, 0.35);
  }

  // Timers
  for (const k in S.power) S.power[k] = Math.max(0, S.power[k] - dt);
  S.invuln = Math.max(0, S.invuln - dt);

  // Endless: build ahead, drop behind
  if (S.endless) {
    S.distance = Math.max(S.distance, S.startZ - bp.z);
    while (S.gen.z > bp.z - 170) appendChunk();
    while (S.contents.length > 1 && S.contents[0].minZ > bp.z + 30) S.contents.shift().dispose();
  }

  // HUD
  S.hudTimer -= dt;
  if (S.hudTimer <= 0) {
    S.hudTimer = 0.2;
    UI.hudPowers(S.power);
    if (S.endless) UI.hudDistance(Math.floor(S.distance));
    else UI.hudProgress(THREE.MathUtils.clamp((S.startZ - bp.z) / (S.startZ - L.finishZ), 0, 1));
  }
  if (!S.endless && bp.z < L.finishZ) completeLevel();
}

// ---------------- Camera ----------------
const camTarget = new THREE.Vector3(), lookTarget = new THREE.Vector3();
const CAM = { near: [2.7, 6.2], normal: [3.3, 7.6], far: [4.3, 9.8] };
function updateCamera(dt) {
  const b = ball.position;
  if (S.mode === 'menu' || S.mode === 'loading') {
    const a = elapsed * 0.12;
    camTarget.set(b.x + Math.sin(a) * 10, b.y + 4.5, b.z + Math.cos(a) * 10 - 4);
    camera.position.lerp(camTarget, 1 - Math.pow(0.02, dt)); camera.lookAt(b.x, b.y + 0.5, b.z - 4);
    return;
  }
  if (S.mode === 'dying' && S.deathReason === 'fall') { camera.lookAt(b.x * 0.5 + camera.position.x * 0.5, b.y, b.z - 3); return; }
  const [h, back] = CAM[save.settings.camera] || CAM.normal;
  const baseY = Math.max(b.y, S.lastGroundY + R - 1);
  camTarget.set(b.x * 0.75, baseY + h, b.z + back);
  if (S.mode === 'intro') {
    const k = 1 - Math.max(0, S.introT) / (S.endless ? 0.9 : 1.7), e = k * k * (3 - 2 * k);
    tmpV.set(b.x + 6, b.y + 13, b.z - 18).lerp(camTarget, e);
    camera.position.copy(tmpV);
  } else camera.position.lerp(camTarget, 1 - Math.pow(0.0005, dt));
  lookTarget.set(b.x * 0.9, (S.mode === 'dying' ? b.y : baseY) + 0.3, b.z - 5);
  camera.lookAt(lookTarget);
  if (S.shake > 0) { S.shake = Math.max(0, S.shake - dt); const a = S.shake * 0.6; camera.position.x += (Math.random() - 0.5) * a; camera.position.y += (Math.random() - 0.5) * a; }
  const fov = S.power.speed > 0 && S.mode === 'playing' ? 70 : 60;
  if (Math.abs(camera.fov - fov) > 0.1) { camera.fov = THREE.MathUtils.damp(camera.fov, fov, 4, dt); camera.updateProjectionMatrix(); setParticleScale(); }
}

function setParticleScale() {
  const px = renderer.domElement.height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
  sparks.setScale(px); if (emojiPS) emojiPS.setScale(px);
}

// ---------------- Input ----------------
const canvas = renderer.domElement;
let drag = null;
addEventListener('pointerdown', () => initAudio(), true);
canvas.addEventListener('pointerdown', (e) => {
  if (S.mode === 'intro') { skipIntro(); return; }
  if (S.mode !== 'playing' || save.settings.control !== 'drag') return;
  if (drag) { jump(); return; }
  drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, last: e.clientX, t0: performance.now(), moved: false, jumped: false };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  S.desiredX += (e.clientX - drag.last) * ((save.settings.sens || 9) / innerWidth);
  drag.last = e.clientX;
  if (Math.abs(e.clientX - drag.x0) > 12) drag.moved = true;
  if (save.settings.jump !== 'button' && !drag.jumped && drag.y0 - e.clientY > 55) { drag.jumped = true; jump(); }
});
const endDrag = (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  if (save.settings.jump === 'tap' && !drag.moved && !drag.jumped && performance.now() - drag.t0 < 280) jump();
  drag = null;
};
canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag);

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

addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
  if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
  if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') jump();
  if (e.key === 'Escape' || e.key === 'p') (S.mode === 'paused' ? resumeGame() : pauseGame());
});
addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
  if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
});

// ---------------- Settings that affect rendering ----------------
export function applyGraphics() {
  QUALITY = resolvedQuality();
  renderer.setPixelRatio(Math.min(devicePixelRatio, QUALITY === 'high' ? 2 : QUALITY === 'medium' ? 1.5 : 1));
  const sh = QUALITY === 'high' && save.settings.shadows;
  renderer.shadowMap.enabled = sh; sun.castShadow = sh;
  sparks.enabled = save.settings.particles;
  trail.mesh.visible = save.settings.trailFx;
  renderer.setSize(innerWidth, innerHeight);
  setParticleScale();
}
export function reloadScene() { if (S.mode === 'menu') showMenuScene(); }

// ---------------- Shop 3D preview / thumbnails ----------------
let thumb = null;
function thumbRig() {
  if (thumb) return thumb;
  const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  r.setPixelRatio(1); r.setSize(160, 160);
  const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(35, 1, 0.1, 20); cam.position.set(0, 0.35, 2.4); cam.lookAt(0, 0.05, 0);
  sc.add(new THREE.HemisphereLight(0xffffff, 0x445566, 2.2)); const dl = new THREE.DirectionalLight(0xffffff, 2.2); dl.position.set(-2, 3, 3); sc.add(dl);
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 24), makeSkinMaterial('classic'));
  const rg = new THREE.Mesh(new THREE.TorusGeometry(0.515, 0.05, 8, 40), new THREE.MeshStandardMaterial({ color: 0xffffff })); rg.rotation.x = Math.PI / 2; b.add(rg);
  const eyes = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true })); eyes.scale.set(0.78, 0.39, 1); eyes.position.set(0, 0.06, 0.52);
  const face = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true })); face.scale.set(0.8, 0.4, 1); face.position.set(0, 0.02, 0.56);
  const hat = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true })); hat.scale.set(0.62, 0.62, 1); hat.position.set(0, 0.7, 0.05);
  sc.add(b, eyes, face, hat);
  thumb = { r, sc, cam, b, rg, eyes, face, hat, cfg: null, spin: 0 };
  return thumb;
}
function setThumb(cfg) {
  const T = thumbRig();
  if (!T.cfg || T.cfg.ball !== cfg.ball) { const old = T.b.material; T.b.material = makeSkinMaterial(cfg.ball); old.dispose(); T.rg.visible = hasRing(cfg.ball); }
  for (const [slot, spr] of [['eyes', T.eyes], ['face', T.face], ['hat', T.hat]]) {
    spr.visible = !!cfg[slot]; if (cfg[slot]) { spr.material.map = accTexture(cfg[slot]); spr.material.needsUpdate = true; }
  }
  if (cfg.hat === 'hat_horns') { T.hat.scale.set(0.8, 0.4, 1); T.hat.position.y = 0.58; } else { T.hat.scale.set(0.62, 0.62, 1); T.hat.position.y = 0.7; }
  T.cfg = { ...cfg };
}
const thumbCache = new Map();
export function ballThumb(id) {
  if (thumbCache.has(id)) return thumbCache.get(id);
  const T = thumbRig(), prev = T.cfg, rot = T.b.rotation.clone();
  setThumb({ ball: id }); T.b.rotation.set(0.3, 0.6, 0); T.r.render(T.sc, T.cam);
  const url = T.r.domElement.toDataURL(); thumbCache.set(id, url);
  if (prev) setThumb(prev); T.b.rotation.copy(rot);
  return url;
}
let previewOn = false;
export function previewCanvas() { return thumbRig().r.domElement; }
export function previewSet(cfg) { setThumb(cfg); }
export function previewActive(on) { previewOn = on; }

// ---------------- App lifecycle ----------------
onBackButton(() => UI.backPressed());
onAppState(() => { pauseGame(); suspendAudio(); }, () => resumeAudio());
export { exitApp };

// ---------------- Loop ----------------
let acc = 0, fpsFrames = 0, fpsT = 0;
function animate() {
  requestAnimationFrame(animate);
  const raw = clock.getDelta();
  if (document.hidden) return;
  const cap = save.settings.battery || save.settings.fps === 30;
  acc += raw;
  if (cap && acc < 1 / 31) return;
  const dt = Math.min(acc, 1 / 20); acc = 0;
  update(dt);
  renderer.render(scene, camera);
  if (previewOn && thumb) { thumb.spin += dt; thumb.b.rotation.set(0.25, thumb.spin * 1.2, 0); thumb.r.render(thumb.sc, thumb.cam); }
  fpsFrames++; fpsT += dt;
  if (fpsT >= 0.5) { UI.fps(Math.round(fpsFrames / fpsT)); fpsFrames = 0; fpsT = 0; }
}
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); setParticleScale(); });

// ---------------- Boot ----------------
const API = {
  startLevel, startEndless, showMenuScene, pauseGame, resumeGame, continueRun, continueCost, skipLevel, skipIntro, tutorialDone,
  applyLook, applyGraphics, applyAudioSettings, reloadScene, ballThumb, previewCanvas, previewSet, previewActive, exitApp,
  state: S, initAudio, sfx, vibrate, jump,
};
UI.init(API);
applyGraphics();
applyLook();
showMenuScene();
UI.bootDone();
animate();
window.__game = { S, API, save, update, jump, groundAt, ball, ballZ: () => ball.position.z, THEMES, WORLDS, worldIndex, GAME };
