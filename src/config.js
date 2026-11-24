// Central place for name/branding and world list.
export const GAME = {
  name: 'Marblo',
  subtitle: 'Island Roll',
  version: '3.0.0',
  appId: 'com.arifulislam50.marblo',
  privacyUrl: 'https://arifulislam50.github.io/3d-ball-adventure/privacy-policy.html',
  storeUrl: 'https://play.google.com/store/apps/details?id=com.arifulislam50.marblo',
  contactUrl: 'https://github.com/arifulislam50/3d-ball-adventure/issues',
};

export const LEVELS_PER_WORLD = 6; // level 6 of every world is a BOSS level

// 25 worlds x 6 levels = 150 levels. A new world every 6 levels.
export const WORLDS = [
  { id: 'meadow', price: 0, icon: '🌿', name: { en: 'Green Meadow', bn: 'সবুজ মাঠ' } },
  { id: 'desert', price: 0, icon: '🏜️', name: { en: 'Sunset Desert', bn: 'মরুভূমি' } },
  { id: 'village', price: 250, icon: '🌾', name: { en: 'Bangla Village', bn: 'বাংলার গ্রাম' } },
  { id: 'ice', price: 400, icon: '❄️', name: { en: 'Frozen Peaks', bn: 'বরফের পাহাড়' } },
  { id: 'beach', price: 550, icon: '🏖️', name: { en: "Cox's Bazar Beach", bn: 'কক্সবাজার সৈকত' } },
  { id: 'city', price: 700, icon: '🌃', name: { en: 'Neon City', bn: 'নিয়ন শহর' } },
  { id: 'candy', price: 850, icon: '🍬', name: { en: 'Candy Land', bn: 'ক্যান্ডি ল্যান্ড' } },
  { id: 'sundarbans', price: 1000, icon: '🐅', name: { en: 'Sundarbans', bn: 'সুন্দরবন' } },
  { id: 'ocean', price: 1200, icon: '🌊', name: { en: 'Under the Sea', bn: 'সমুদ্রের নিচে' } },
  { id: 'autumn', price: 1400, icon: '🍁', name: { en: 'Autumn Hills', bn: 'শরতের পাহাড়' } },
  { id: 'volcano', price: 1600, icon: '🌋', name: { en: 'Volcano', bn: 'আগ্নেয়গিরি' } },
  { id: 'pirate', price: 1800, icon: '🏴‍☠️', name: { en: 'Pirate Island', bn: 'জলদস্যুর দ্বীপ' } },
  { id: 'cherry', price: 2000, icon: '🌸', name: { en: 'Cherry Garden', bn: 'চেরি বাগান' } },
  { id: 'jungle', price: 2300, icon: '🌴', name: { en: 'Deep Jungle', bn: 'গভীর জঙ্গল' } },
  { id: 'forest', price: 2600, icon: '🍄', name: { en: 'Magic Forest', bn: 'জাদুর বন' } },
  { id: 'dino', price: 3000, icon: '🦖', name: { en: 'Dino Valley', bn: 'ডাইনোসর উপত্যকা' } },
  { id: 'halloween', price: 3400, icon: '🎃', name: { en: 'Spooky Night', bn: 'ভূতুড়ে রাত' } },
  { id: 'crystal', price: 3800, icon: '💎', name: { en: 'Crystal Caves', bn: 'ক্রিস্টাল গুহা' } },
  { id: 'festive', price: 4300, icon: '🎄', name: { en: 'Winter Festival', bn: 'শীতের উৎসব' } },
  { id: 'sky', price: 4800, icon: '☁️', name: { en: 'Sky Kingdom', bn: 'মেঘের রাজ্য' } },
  { id: 'factory', price: 5400, icon: '🤖', name: { en: 'Robot Factory', bn: 'রোবট কারখানা' } },
  { id: 'arctic', price: 6000, icon: '🌌', name: { en: 'Aurora Arctic', bn: 'মেরুজ্যোতি' } },
  { id: 'rainbow', price: 7000, icon: '🌈', name: { en: 'Rainbow Land', bn: 'রংধনুর দেশ' } },
  { id: 'moon', price: 8500, icon: '🌕', name: { en: 'Moon Base', bn: 'চাঁদের ঘাঁটি' } },
  { id: 'space', price: 10000, icon: '🚀', name: { en: 'Outer Space', bn: 'মহাকাশ' } },
];
export const worldIndex = (id) => Math.max(0, WORLDS.findIndex((w) => w.id === id));
export const worldById = (id) => WORLDS[worldIndex(id)];

// Difficulty 0..1: later worlds are harder, and it rises inside each world.
export const difficulty = (wi, lvl) => Math.min(1, 0.7 * (wi / (WORLDS.length - 1)) + 0.3 * ((lvl - 1) / (LEVELS_PER_WORLD - 1)));

export const todayStr = (d = new Date()) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
export const dateSeed = (s = todayStr()) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
