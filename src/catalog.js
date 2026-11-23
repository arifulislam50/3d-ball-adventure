// Everything that can be bought in the shop.
import { save } from './storage.js';

// recipe ids are painted in skins.js. trail = default ribbon colour for the "basic" trail.
export const BALLS = [
  { id: 'classic', name: 'Classic', price: 0, trail: 0xffb52e },
  { id: 'ocean', name: 'Ocean', price: 60, trail: 0x3fb7ff },
  { id: 'tennis', name: 'Tennis', price: 90, trail: 0xd8ff4a },
  { id: 'melon', name: 'Melon', price: 120, trail: 0x6bdc5a },
  { id: 'soccer', name: 'Soccer', price: 180, trail: 0xffffff },
  { id: 'basket', name: 'Basketball', price: 200, trail: 0xff8a3a },
  { id: 'bowling', name: 'Bowling', price: 220, trail: 0x4a6aff },
  { id: 'candy', name: 'Candy Swirl', price: 250, trail: 0xff7ac8 },
  { id: 'lava', name: 'Lava', price: 260, trail: 0xff5a1f },
  { id: 'donut', name: 'Donut', price: 280, trail: 0xff9ad5 },
  { id: 'icy', name: 'Ice', price: 300, trail: 0xbff4ff },
  { id: 'zebra', name: 'Zebra', price: 320, trail: 0xffffff },
  { id: 'galaxy', name: 'Galaxy', price: 340, trail: 0xb57bff },
  { id: 'camo', name: 'Camo', price: 350, trail: 0x7a9a4a },
  { id: 'moon', name: 'Moon', price: 380, trail: 0xdfe4ee },
  { id: 'earth', name: 'Earth', price: 400, trail: 0x4ab3ff },
  { id: 'bubble', name: 'Bubble', price: 420, trail: 0xc8f0ff },
  { id: 'pumpkin', name: 'Pumpkin', price: 400, trail: 0xff8a1a },
  { id: 'gold', name: 'Gold', price: 450, trail: 0xffe066 },
  { id: 'disco', name: 'Disco', price: 450, trail: 0xff4fd8 },
  { id: 'bd', name: 'Bangladesh', price: 500, trail: 0x00a651 },
  { id: 'rainbow', name: 'Rainbow', price: 500, trail: 0xff4f4f },
  { id: 'neon', name: 'Neon', price: 600, trail: 0x2ff7ff },
  { id: 'diamond', name: 'Diamond', price: 1000, trail: 0xc8f6ff },
  { id: 'crystal', name: 'Crystal', price: 1100, trail: 0xc07bff },
  { id: 'fire', name: 'Fire', price: 1200, trail: 0xff6a00 },
  { id: 'cyber', name: 'Cyber', price: 1300, trail: 0x2fff9a },
  { id: 'robot', name: 'Robot', price: 1500, trail: 0x9ab0c8 },
  // Rare: earned, not bought
  { id: 'champion', name: 'Champion', price: 0, rare: 'boss1', trail: 0xffd23a },
  { id: 'phoenix', name: 'Phoenix', price: 0, rare: 'boss5', trail: 0xff3a1a },
  { id: 'streak', name: 'Lucky Seven', price: 0, rare: 'streak7', trail: 0x4ade80 },
  { id: 'starball', name: 'Superstar', price: 0, rare: 'star', trail: 0xfff27a },
  { id: 'comet', name: 'Comet', price: 0, rare: 'endless', trail: 0x8ad8ff },
];

export const TRAILS = [
  { id: 'basic', name: 'Classic', price: 0, mode: 'ribbon', look: 'ball' },
  { id: 'rainbow', name: 'Rainbow', price: 150, mode: 'ribbon', look: 'rainbow' },
  { id: 'firetrail', name: 'Fire', price: 200, mode: 'ribbon', look: 'fire', emoji: null, spark: 0xff7a1a },
  { id: 'frost', name: 'Frost', price: 200, mode: 'ribbon', look: 'ice', spark: 0xbff4ff },
  { id: 'goldtrail', name: 'Gold', price: 250, mode: 'ribbon', look: 'gold', spark: 0xffd23a },
  { id: 'neontrail', name: 'Neon', price: 300, mode: 'ribbon', look: 'neon' },
  { id: 'stars', name: 'Stars', price: 300, mode: 'emoji', emoji: '⭐' },
  { id: 'hearts', name: 'Hearts', price: 300, mode: 'emoji', emoji: '❤️' },
  { id: 'bubbles', name: 'Bubbles', price: 350, mode: 'emoji', emoji: '🫧' },
  { id: 'notes', name: 'Music', price: 400, mode: 'emoji', emoji: '🎵' },
  { id: 'petals', name: 'Petals', price: 450, mode: 'emoji', emoji: '🌸' },
  { id: 'coinsTrail', name: 'Coins', price: 600, mode: 'emoji', emoji: '🪙' },
  { id: 'lightning', name: 'Lightning', price: 800, mode: 'spark', spark: 0x7ad8ff },
];

export const STYLE = [
  { id: 'eyes_cute', slot: 'eyes', name: 'Cute eyes', price: 80, icon: '🥺' },
  { id: 'eyes_angry', slot: 'eyes', name: 'Angry eyes', price: 120, icon: '😠' },
  { id: 'eyes_sleepy', slot: 'eyes', name: 'Sleepy eyes', price: 120, icon: '😴' },
  { id: 'eyes_star', slot: 'eyes', name: 'Star eyes', price: 200, icon: '🤩' },
  { id: 'hat_top', slot: 'hat', name: 'Top hat', price: 250, icon: '🎩' },
  { id: 'hat_crown', slot: 'hat', name: 'Crown', price: 600, icon: '👑' },
  { id: 'hat_cap', slot: 'hat', name: 'Cap', price: 180, icon: '🧢' },
  { id: 'hat_grad', slot: 'hat', name: 'Graduate', price: 300, icon: '🎓' },
  { id: 'hat_phones', slot: 'hat', name: 'Headphones', price: 350, icon: '🎧' },
  { id: 'hat_horns', slot: 'hat', name: 'Devil horns', price: 400, icon: '😈' },
  { id: 'face_shades', slot: 'face', name: 'Sunglasses', price: 220, icon: '😎' },
  { id: 'face_nerd', slot: 'face', name: 'Glasses', price: 160, icon: '🤓' },
  { id: 'face_stache', slot: 'face', name: 'Mustache', price: 140, icon: '🥸' },
];

export const PETS = [
  { id: 'pet_chick', name: 'Chick', price: 800, icon: '🐤' },
  { id: 'pet_cat', name: 'Cat', price: 1000, icon: '🐱' },
  { id: 'pet_dog', name: 'Puppy', price: 1000, icon: '🐶' },
  { id: 'pet_fly', name: 'Butterfly', price: 1300, icon: '🦋' },
  { id: 'pet_dragon', name: 'Dragon', price: 2000, icon: '🐲' },
];

export const UPGRADES = [
  { id: 'shield', costs: [100, 250, 500, 1000, 2000] },
  { id: 'magnet', costs: [100, 250, 500, 1000, 2000] },
  { id: 'speed', costs: [100, 250, 500, 1000, 2000] },
  { id: 'lives', costs: [800, 2000] },
  { id: 'coinValue', costs: [1000, 2500] },
];
export const upgradeLevel = (id) => save.upgrades[id] || 0;

// Values used by the game
export const powerTime = (kind) => {
  const u = save.upgrades;
  return { speed: 4 + u.speed, shield: 10 + 3 * u.shield, magnet: 8 + 2 * u.magnet, double: 8, slow: 5, ghost: 5, x2: 10 }[kind];
};
export const magnetRadius = () => 6 + 0.6 * save.upgrades.magnet;
export const coinMult = () => [1, 1.5, 2][save.upgrades.coinValue || 0];

export const SPECIAL = { tickets: 120, startShield: 150, skip: 200, mystery: 300, spin: 50 };
export const DAILY_REWARDS = [50, 75, 100, 150, 200, 300, 500];
export const SPIN_PRIZES = [
  { type: 'coins', n: 20, w: 22, label: '20' }, { type: 'coins', n: 50, w: 20, label: '50' },
  { type: 'coins', n: 100, w: 14, label: '100' }, { type: 'ticket', n: 1, w: 12, label: '🎟️' },
  { type: 'coins', n: 200, w: 8, label: '200' }, { type: 'box', n: 1, w: 8, label: '📦' },
  { type: 'shield', n: 1, w: 12, label: '🛡️' }, { type: 'coins', n: 500, w: 4, label: '500' },
];

export const rareUnlocked = (cond) => {
  const s = save.stats;
  return { boss1: s.bosses >= 1, boss5: s.bosses >= 5, streak7: save.daily.best >= 7, star: s.threeStars >= 30, endless: s.endlessBest >= 2000 }[cond];
};

// Make sure earned rare balls are added to the collection.
export function grantRares() {
  const got = [];
  for (const b of BALLS) if (b.rare && rareUnlocked(b.rare) && !save.owned.ball.includes(b.id)) { save.owned.ball.push(b.id); got.push(b); }
  return got;
}

export const ballById = (id) => BALLS.find((b) => b.id === id) || BALLS[0];
export const trailById = (id) => TRAILS.find((b) => b.id === id) || TRAILS[0];
export const styleById = (id) => STYLE.find((b) => b.id === id);
export const petById = (id) => PETS.find((b) => b.id === id);
