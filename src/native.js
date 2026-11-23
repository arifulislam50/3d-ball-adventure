// Native Android helpers through Capacitor (safe no-ops in a normal browser).
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { App } from '@capacitor/app';
import { Share } from '@capacitor/share';
import { save } from './storage.js';

const native = Capacitor.isNativePlatform();

export function vibrate(kind = 'light') {
  if (!save.settings.vibe) return;
  const st = save.settings.vibeStrength || 'normal';
  const level = { light: 0, medium: 1, heavy: 2 }[kind] + (st === 'light' ? -1 : st === 'strong' ? 1 : 0);
  try {
    if (native) {
      if (level >= 2) Haptics.vibrate({ duration: level >= 3 ? 320 : 200 });
      else if (level >= 0) Haptics.impact({ style: level === 1 ? ImpactStyle.Medium : ImpactStyle.Light });
    } else if (navigator.vibrate && level >= 0) navigator.vibrate([20, 50, 180, 320][level]);
  } catch (e) { /* ignore */ }
}

export function onBackButton(handler) { if (native) App.addListener('backButton', handler); }

export function onAppState(onPause, onResume) {
  if (native) { App.addListener('pause', onPause); App.addListener('resume', onResume); }
  document.addEventListener('visibilitychange', () => (document.hidden ? onPause() : onResume()));
}

export function exitApp() { if (native) App.exitApp(); }

export async function shareText(title, text, url) {
  try {
    if (native) { await Share.share({ title, text, url, dialogTitle: title }); return true; }
    if (navigator.share) { await navigator.share({ title, text, url }); return true; }
    await navigator.clipboard?.writeText(`${text} ${url}`);
    return 'copied';
  } catch (e) { return false; }
}

export function openUrl(url) { window.open(url, '_blank'); }
