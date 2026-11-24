// Daily missions, achievements, daily gift, lucky spin, mystery box, daily offer.
import { save, persist } from './storage.js';
import { todayStr, dateSeed, WORLDS } from './config.js';
import { BALLS, TRAILS, STYLE, PETS, DAILY_REWARDS, SPIN_PRIZES, grantRares } from './catalog.js';

const MISSION_POOL = [
  { id: 'coins', targets: [100, 200, 350], reward: [60, 100, 150] },
  { id: 'levels', targets: [2, 3, 5], reward: [60, 100, 150] },
  { id: 'jumps', targets: [30, 60, 100], reward: [50, 80, 120] },
  { id: 'power', targets: [3, 5, 8], reward: [60, 90, 130] },
  { id: 'nodeath', targets: [1, 2, 3], reward: [80, 130, 180] },
  { id: 'endless', targets: [400, 800, 1500], reward: [70, 110, 160] },
  { id: 'stars3', targets: [1, 2, 3], reward: [80, 120, 170] },
  { id: 'combo', targets: [10, 20, 30], reward: [70, 110, 160] },
  { id: 'chest', targets: [1, 2, 3], reward: [80, 130, 200] },
  { id: 'boss', targets: [1, 1, 2], reward: [120, 120, 250] },
];

export function ensureMissions() {
  const today = todayStr();
  if (save.missions.date === today && save.missions.list.length >= 5) return;
  let seed = dateSeed(today);
  const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296);
  const pool = [...MISSION_POOL], list = [];
  while (list.length < 5) {
    const m = pool.splice(Math.floor(rnd() * pool.length), 1)[0], tier = Math.floor(rnd() * 3);
    list.push({ id: m.id, target: m.targets[tier], reward: m.reward[tier], progress: 0, claimed: false });
  }
  save.missions = { date: today, list };
  persist();
}

// Called by the game when something happens.
export function track(event, amount = 1) {
  ensureMissions();
  for (const m of save.missions.list) {
    if (m.claimed || m.id !== event) continue;
    m.progress = event === 'endless' || event === 'combo' ? Math.max(m.progress, amount) : Math.min(m.target, m.progress + amount);
  }
}

// 60 achievements built from tiers
const tiers = (id, key, stat, ns, rewards) => ns.map((n, i) => ({ id: `${id}${i}`, key, n, stat, reward: rewards[i] }));
const S = () => save.stats;
export const ACHIEVEMENTS = [
  ...tiers('coins', 'a_coins', () => S().coins, [500, 2500, 10000, 25000, 60000, 150000], [100, 250, 500, 900, 1500, 3000]),
  ...tiers('levels', 'a_levels', () => S().levels, [10, 30, 60, 100, 150], [100, 250, 500, 900, 2000]),
  ...tiers('stars', 'a_stars', () => S().threeStars, [10, 30, 60, 100, 150], [150, 300, 600, 1000, 2500]),
  ...tiers('boss', 'a_bosses', () => S().bosses, [1, 5, 10, 18, 25], [150, 400, 800, 1500, 3000]),
  ...tiers('endless', 'a_endless', () => S().endlessBest, [500, 1500, 3000, 6000, 10000], [100, 300, 600, 1200, 2500]),
  ...tiers('jumps', 'a_jumps', () => S().jumps, [300, 1500, 5000, 15000], [100, 300, 700, 1500]),
  ...tiers('worlds', 'a_worlds', () => save.worlds.length, [4, 8, 14, 20, 25], [200, 500, 1000, 2000, 5000]),
  ...tiers('balls', 'a_balls', () => save.owned.ball.length, [5, 15, 30, 45, 60], [100, 300, 700, 1500, 4000]),
  ...tiers('trails', 'a_trails', () => save.owned.trail.length, [3, 10, 25], [100, 400, 1500]),
  ...tiers('pets', 'a_pets', () => save.owned.pet.length, [1, 5, 12], [150, 500, 2000]),
  ...tiers('streak', 'a_streak', () => save.daily.best, [3, 7, 14, 30], [100, 250, 600, 1500]),
  ...tiers('perfect', 'a_nodeath', () => S().nodeath, [5, 20, 50, 100], [150, 400, 900, 2000]),
  ...tiers('chests', 'a_chests', () => S().chests || 0, [1, 10, 40, 100], [100, 300, 800, 2000]),
  ...tiers('combo', 'a_combo', () => S().bestCombo || 0, [10, 25, 50], [100, 300, 800]),
  ...tiers('plevel', 'a_plevel', () => save.profile.level, [5, 10, 20, 35, 50], [200, 400, 800, 1500, 3000]),
  ...tiers('power', 'a_power', () => S().powerups, [25, 100, 300], [100, 300, 800]),
];

// ---- Profile: XP, levels, titles, frames ----
export const xpNeeded = (lvl) => 100 + 40 * lvl;
export function addXP(n) {
  const p = save.profile, ups = [];
  p.xp += n;
  while (p.xp >= xpNeeded(p.level)) { p.xp -= xpNeeded(p.level); p.level++; ups.push(p.level); save.coins += 25 * p.level; }
  if (ups.length) { grantRares(); persist(); }
  return ups;
}
export const TITLES = [
  { id: 'rookie', key: 'ti_rookie', ok: () => true },
  { id: 'roller', key: 'ti_roller', ok: () => S().levels >= 10 },
  { id: 'coinking', key: 'ti_coinking', ok: () => S().coins >= 5000 },
  { id: 'jumper', key: 'ti_jumper', ok: () => S().jumps >= 1500 },
  { id: 'hunter', key: 'ti_hunter', ok: () => S().bosses >= 5 },
  { id: 'runner', key: 'ti_runner', ok: () => S().endlessBest >= 2000 },
  { id: 'explorer', key: 'ti_explorer', ok: () => save.worlds.length >= 10 },
  { id: 'collector', key: 'ti_collector', ok: () => save.owned.ball.length >= 20 },
  { id: 'treasure', key: 'ti_treasure', ok: () => (S().chests || 0) >= 20 },
  { id: 'legend', key: 'ti_legend', ok: () => save.profile.level >= 40 },
];
export const FRAMES = [
  { id: 'none', lvl: 1, css: 'rgba(255,255,255,.35)' },
  { id: 'silver', lvl: 5, css: 'linear-gradient(135deg,#f4f4f4,#9aa4b0,#f4f4f4)' },
  { id: 'gold', lvl: 10, css: 'linear-gradient(135deg,#fff3b0,#ffb52e,#c87a00)' },
  { id: 'fire', lvl: 20, css: 'linear-gradient(135deg,#ffe14a,#ff5a1a,#a81a00)' },
  { id: 'ocean', lvl: 25, css: 'linear-gradient(135deg,#bff4ff,#3fb7ff,#1a4aa8)' },
  { id: 'rainbow', lvl: 30, css: 'conic-gradient(#ff4f4f,#ffe14a,#5ad65a,#3fb7ff,#b05aff,#ff4f4f)' },
  { id: 'galaxy', lvl: 40, css: 'conic-gradient(#1a0b3a,#b07aff,#3fb7ff,#ff7ad8,#1a0b3a)' },
];

export function claimableCount() {
  ensureMissions();
  let n = save.missions.list.filter((m) => !m.claimed && m.progress >= m.target).length;
  n += ACHIEVEMENTS.filter((a) => !save.achievements[a.id] && a.stat() >= a.n).length;
  return n;
}

// ---- Daily gift ----
const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return todayStr(d); };
export const giftAvailable = () => save.daily.last !== todayStr();
export function giftDay() { // the streak day the next claim will be (1..7 cycle)
  const streak = save.daily.last === yesterday() ? save.daily.streak + 1 : (save.daily.last === todayStr() ? save.daily.streak : 1);
  return ((streak - 1) % 7) + 1;
}
export function claimGift() {
  if (!giftAvailable()) return null;
  const streak = save.daily.last === yesterday() ? save.daily.streak + 1 : 1;
  const day = ((streak - 1) % 7) + 1, coins = DAILY_REWARDS[day - 1];
  save.daily = { last: todayStr(), streak, best: Math.max(save.daily.best || 0, streak) };
  save.coins += coins;
  let box = null; if (day === 7) box = openMysteryBox(true);
  grantRares(); persist();
  return { coins, day, box };
}

// ---- Lucky spin ----
export const freeSpin = () => save.spin.last !== todayStr();
export function spinWheel() {
  const total = SPIN_PRIZES.reduce((a, p) => a + p.w, 0);
  let k = Math.random() * total, idx = 0;
  for (let i = 0; i < SPIN_PRIZES.length; i++) { k -= SPIN_PRIZES[i].w; if (k <= 0) { idx = i; break; } }
  return idx;
}
export function givePrize(p) {
  if (p.type === 'coins') save.coins += p.n;
  else if (p.type === 'ticket') save.items.tickets += p.n;
  else if (p.type === 'shield') save.items.startShield += p.n;
  else if (p.type === 'box') return openMysteryBox(true);
  persist();
  return null;
}

// ---- Mystery box: a random item you do not own yet ----
export function openMysteryBox(free = false) {
  const pool = [
    ...BALLS.filter((b) => !b.rare && b.price && b.price <= 1500 && !save.owned.ball.includes(b.id)).map((b) => ({ cat: 'ball', item: b })),
    ...TRAILS.filter((b) => b.price && !save.owned.trail.includes(b.id)).map((b) => ({ cat: 'trail', item: b })),
    ...STYLE.filter((b) => !save.owned.style.includes(b.id)).map((b) => ({ cat: 'style', item: b })),
    ...PETS.filter((b) => b.price <= 1300 && !save.owned.pet.includes(b.id)).map((b) => ({ cat: 'pet', item: b })),
  ];
  if (!pool.length) { save.coins += 300; persist(); return { cat: 'coins', n: 300 }; }
  const got = pool[Math.floor(Math.random() * pool.length)];
  save.owned[got.cat].push(got.item.id);
  persist();
  return got;
}

// ---- Daily offer: one item 30% off ----
export function dailyOffer() {
  const items = [...BALLS.filter((b) => !b.rare && b.price >= 200 && !save.owned.ball.includes(b.id)).map((b) => ({ cat: 'ball', item: b })),
    ...TRAILS.filter((b) => b.price >= 200 && !save.owned.trail.includes(b.id)).map((b) => ({ cat: 'trail', item: b }))];
  if (!items.length) return null;
  const o = items[dateSeed() % items.length];
  return { ...o, price: Math.round(o.item.price * 0.7 / 10) * 10 };
}

export const ownsWorld = (id) => save.worlds.includes(id) || WORLDS.find((w) => w.id === id)?.price === 0;

// ---- Legend pack ----
import { SPECIAL, LEGEND_PACK } from './catalog.js';
export const legendPackOwned = () => save.owned.ball.includes(LEGEND_PACK.ball) && save.owned.trail.includes(LEGEND_PACK.trail) && save.owned.pet.includes(LEGEND_PACK.pet);
export function buyLegendPack() {
  if (legendPackOwned() || save.coins < SPECIAL.legendPack) return false;
  save.coins -= SPECIAL.legendPack;
  for (const [cat, id] of [['ball', LEGEND_PACK.ball], ['trail', LEGEND_PACK.trail], ['pet', LEGEND_PACK.pet]]) if (!save.owned[cat].includes(id)) save.owned[cat].push(id);
  Object.assign(save.equip, { ball: LEGEND_PACK.ball, trail: LEGEND_PACK.trail, pet: LEGEND_PACK.pet });
  persist(); return true;
}

// Is there something new the player can afford? (shows a "NEW" mark on the shop button)
export function affordableNew() {
  const items = [...BALLS.filter((b) => !b.rare && b.price && !save.owned.ball.includes(b.id)), ...TRAILS.filter((b) => b.price && !save.owned.trail.includes(b.id))];
  return items.some((i) => i.price <= save.coins && !save.seen[i.id]);
}
export function markSeen() { for (const i of [...BALLS, ...TRAILS]) if (i.price <= save.coins) save.seen[i.id] = true; persist(); }
