// Native Android helpers through Capacitor (safe no-ops in a normal browser).
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { App } from '@capacitor/app';
import { save } from './storage.js';

const native = Capacitor.isNativePlatform();

export function vibrate(kind = 'light') {
  if (!save.settings.vibe) return;
  try {
    if (native) {
      if (kind === 'heavy') Haptics.vibrate({ duration: 220 });
      else Haptics.impact({ style: kind === 'medium' ? ImpactStyle.Medium : ImpactStyle.Light });
    } else if (navigator.vibrate) {
      navigator.vibrate(kind === 'heavy' ? 200 : kind === 'medium' ? 60 : 25);
    }
  } catch (e) { /* ignore */ }
}

export function onBackButton(handler) {
  if (native) App.addListener('backButton', handler);
}

export function onAppState(onPause, onResume) {
  if (native) {
    App.addListener('pause', onPause);
    App.addListener('resume', onResume);
  }
  document.addEventListener('visibilitychange', () => (document.hidden ? onPause() : onResume()));
}

export function exitApp() {
  if (native) App.exitApp();
}
