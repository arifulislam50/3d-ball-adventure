// Persistent progress (localStorage inside the Android WebView).
const KEY = 'marblo-save-v2';

const defaultLang = () => ((navigator.language || '').toLowerCase().startsWith('bn') ? 'bn' : 'en');

export const defaults = () => ({
  coins: 0,
  worlds: ['meadow', 'desert'],
  progress: {}, // progress[worldId] = { unlocked, stars: {lvl: n}, best: {lvl: seconds} }
  owned: { ball: ['classic'], trail: ['basic'], style: [], pet: [] },
  equip: { ball: 'classic', trail: 'basic', eyes: null, hat: null, face: null, back: null, pet: null },
  upgrades: { shield: 0, magnet: 0, speed: 0, double: 0, combo: 0, lives: 0, coinValue: 0, freeShield: 0 },
  items: { tickets: 1, startShield: 0, skip: 0 },
  daily: { last: '', streak: 0, best: 0 },
  spin: { last: '' },
  missions: { date: '', list: [] },
  achievements: {},
  seen: {},
  chests: {},
  profile: { name: '', xp: 0, level: 1, title: 'rookie', frame: 'none', claimedLevel: 1 },
  worldPlays: {},
  stats: { time: 0, coins: 0, jumps: 0, falls: 0, hits: 0, levels: 0, bosses: 0, threeStars: 0, endlessBest: 0, powerups: 0, nodeath: 0, chests: 0, bestCombo: 0, bestLevelCoins: 0, fastest: 0, purchases: 0 },
  lastWorld: 'meadow',
  tutorialDone: false,
  settings: {
    music: true, sfx: true, musicVol: 0.7, sfxVol: 0.8, vibe: true, vibeStrength: 'normal',
    control: 'drag', sens: 9, jump: 'tap', difficulty: 'normal', ballSpeed: 'normal',
    quality: 'auto', fps: 60, shadows: true, trailFx: true, particles: true, camera: 'normal', shake: true,
    showFps: false, battery: false, bigText: false, lang: defaultLang(),
  },
});

function merge(base, extra) {
  for (const k in extra) {
    if (extra[k] && typeof extra[k] === 'object' && !Array.isArray(extra[k]) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) merge(base[k], extra[k]);
    else base[k] = extra[k];
  }
  return base;
}

function load() {
  const data = defaults();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const m = merge(data, JSON.parse(raw));
      for (const w in m.progress) m.progress[w].unlocked = Math.min(6, m.progress[w].unlocked || 1);
      return m;
    }
    // Migrate version 1 saves
    const v1 = JSON.parse(localStorage.getItem('marblo-save-v1') || 'null');
    if (v1) {
      data.coins = v1.coins || 0;
      data.owned.ball = Array.from(new Set(['classic', ...(v1.owned || [])]));
      data.equip.ball = v1.skin || 'classic';
      data.tutorialDone = !!v1.tutorialDone;
      Object.assign(data.settings, { music: v1.settings?.music ?? true, sfx: v1.settings?.sfx ?? true, vibe: v1.settings?.vibe ?? true, control: v1.settings?.control || 'drag' });
      const stars = {};
      for (let i = 1; i <= 12; i++) if (v1.stars?.[i]) stars[i] = v1.stars[i];
      data.progress.meadow = { unlocked: Math.min(12, v1.unlocked || 1), stars, best: {} };
    } else {
      const old = Number(localStorage.getItem('ba-score') || 0);
      if (old > 0) data.coins = old;
    }
  } catch (e) { /* storage unavailable: play without saving */ }
  return data;
}

export const save = load();

export function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { /* ignore */ }
}

export function resetSave() {
  const keepSettings = { ...save.settings };
  const fresh = defaults();
  for (const k of Object.keys(save)) delete save[k];
  Object.assign(save, fresh, { settings: keepSettings });
  persist();
}

export function prog(worldId) {
  if (!save.progress[worldId]) save.progress[worldId] = { unlocked: 1, stars: {}, best: {} };
  return save.progress[worldId];
}
