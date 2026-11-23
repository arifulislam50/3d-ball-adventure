// Central place for name/branding so it is easy to change later.
export const GAME = {
  name: 'Marblo',
  subtitle: 'Island Roll',
  version: '1.0.0',
  privacyUrl: 'https://arifulislam50.github.io/3d-ball-adventure/privacy-policy.html',
};

export const TOTAL_LEVELS = 24;
export const THEMES_ORDER = ['meadow', 'desert', 'ice', 'city'];
// A new theme every 3 levels, cycling: 1-3 meadow, 4-6 desert, 7-9 ice, 10-12 city, 13-15 meadow ...
export const themeForLevel = (n) => THEMES_ORDER[Math.floor((n - 1) / 3) % THEMES_ORDER.length];
