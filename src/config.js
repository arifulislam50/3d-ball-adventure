// Central place for name/branding and world list.
export const GAME = {
  name: 'Marblo',
  subtitle: 'Island Roll',
  version: '2.0.0',
  appId: 'com.arifulislam50.marblo',
  privacyUrl: 'https://arifulislam50.github.io/3d-ball-adventure/privacy-policy.html',
  storeUrl: 'https://play.google.com/store/apps/details?id=com.arifulislam50.marblo',
  contactUrl: 'https://github.com/arifulislam50/3d-ball-adventure/issues',
};

export const LEVELS_PER_WORLD = 12; // level 12 of every world is a BOSS level

export const WORLDS = [
  { id: 'meadow', price: 0, icon: '🌿', name: { en: 'Green Meadow', bn: 'সবুজ মাঠ' } },
  { id: 'desert', price: 0, icon: '🏜️', name: { en: 'Sunset Desert', bn: 'মরুভূমি' } },
  { id: 'ice', price: 300, icon: '❄️', name: { en: 'Frozen Peaks', bn: 'বরফের পাহাড়' } },
  { id: 'city', price: 500, icon: '🌃', name: { en: 'Neon City', bn: 'নিয়ন শহর' } },
  { id: 'candy', price: 700, icon: '🍬', name: { en: 'Candy Land', bn: 'ক্যান্ডি ল্যান্ড' } },
  { id: 'ocean', price: 900, icon: '🌊', name: { en: 'Under the Sea', bn: 'সমুদ্রের নিচে' } },
  { id: 'volcano', price: 1200, icon: '🌋', name: { en: 'Volcano', bn: 'আগ্নেয়গিরি' } },
  { id: 'cherry', price: 1500, icon: '🌸', name: { en: 'Cherry Garden', bn: 'চেরি বাগান' } },
  { id: 'forest', price: 1800, icon: '🍄', name: { en: 'Magic Forest', bn: 'জাদুর বন' } },
  { id: 'space', price: 2500, icon: '🚀', name: { en: 'Outer Space', bn: 'মহাকাশ' } },
];
export const worldIndex = (id) => Math.max(0, WORLDS.findIndex((w) => w.id === id));
export const worldById = (id) => WORLDS[worldIndex(id)];

// Difficulty 0..1: later worlds are harder, and it rises inside each world.
export const difficulty = (wi, lvl) => Math.min(1, 0.65 * (wi / (WORLDS.length - 1)) + 0.35 * ((lvl - 1) / (LEVELS_PER_WORLD - 1)));

export const todayStr = (d = new Date()) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
export const dateSeed = (s = todayStr()) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
