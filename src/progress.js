// Daily missions, achievements, daily gift, lucky spin, mystery box, daily offer.
import { save, persist } from './storage.js';
import { todayStr, dateSeed, WORLDS } from './config.js';
import { BALLS, TRAILS, STYLE, PETS, DAILY_REWARDS, SPIN_PRIZES, grantRares } from './catalog.js';

const MISSION_POOL = [
  { id: 'coins', targets: [80, 150, 250], reward: [60, 100, 150] },
  { id: 'levels', targets: [2, 3, 5], reward: [60, 100, 150] },
  { id: 'jumps', targets: [30, 60, 100], reward: [50, 80, 120] },
  { id: 'power', targets: [3, 5, 8], reward: [60, 90, 130] },
  { id: 'nodeath', targets: [1, 2, 3], reward: [80, 130, 180] },
  { id: 'endless', targets: [300, 600, 1000], reward: [70, 110, 160] },
  { id: 'stars3', targets: [1, 2, 3], reward: [80, 120, 170] },
];

export function ensureMissions() {
  const today = todayStr();
  if (save.missions.date === today && save.missions.list.length) return;
  let seed = dateSeed(today);
  const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296);
  const pool = [...MISSION_POOL], list = [];
  while (list.length < 3) {
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
    if (m.claimed) continue;
    if (m.id === event) m.progress = event === 'endless' ? Math.max(m.progress, amount) : Math.min(m.target, m.progress + amount);
  }
}

export const ACHIEVEMENTS = [
  ...[500, 5000, 25000].map((n, i) => ({ id: `coins${i}`, key: 'a_coins', n, stat: () => save.stats.coins, reward: [100, 300, 800][i] })),
  ...[10, 50, 120].map((n, i) => ({ id: `levels${i}`, key: 'a_levels', n, stat: () => save.stats.levels, reward: [100, 300, 800][i] })),
  ...[10, 40, 100].map((n, i) => ({ id: `stars${i}`, key: 'a_stars', n, stat: () => save.stats.threeStars, reward: [150, 400, 900][i] })),
  ...[1, 5, 10].map((n, i) => ({ id: `boss${i}`, key: 'a_bosses', n, stat: () => save.stats.bosses, reward: [150, 500, 1000][i] })),
  ...[500, 2000, 5000].map((n, i) => ({ id: `endless${i}`, key: 'a_endless', n, stat: () => save.stats.endlessBest, reward: [100, 400, 1000][i] })),
  ...[500, 3000].map((n, i) => ({ id: `jumps${i}`, key: 'a_jumps', n, stat: () => save.stats.jumps, reward: [100, 400][i] })),
  ...[4, 10].map((n, i) => ({ id: `worlds${i}`, key: 'a_worlds', n, stat: () => save.worlds.length, reward: [200, 1000][i] })),
  ...[10, 25].map((n, i) => ({ id: `balls${i}`, key: 'a_balls', n, stat: () => save.owned.ball.length, reward: [200, 800][i] })),
  ...[7, 30].map((n, i) => ({ id: `streak${i}`, key: 'a_streak', n, stat: () => save.daily.best, reward: [200, 1000][i] })),
  ...[5, 25].map((n, i) => ({ id: `perfect${i}`, key: 'a_nodeath', n, stat: () => save.stats.nodeath, reward: [150, 600][i] })),
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
