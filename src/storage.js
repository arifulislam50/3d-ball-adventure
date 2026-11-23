// Persistent progress (localStorage inside the Android WebView).
const KEY = 'marblo-save-v1';

const defaults = () => ({
  coins: 0,
  unlocked: 1,
  stars: {},
  skin: 'classic',
  owned: ['classic'],
  tutorialDone: false,
  settings: { music: true, sfx: true, vibe: true, control: 'drag', quality: 'high' },
});

function load() {
  let data = defaults();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      data = { ...data, ...saved, settings: { ...data.settings, ...(saved.settings || {}) } };
    } else {
      // Migrate the score from the first version of the game.
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
