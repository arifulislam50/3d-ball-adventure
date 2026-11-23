// All sound is synthesized with Web Audio: no audio files, no licensing issues.
import { save } from './storage.js';

let ctx = null, master, sfxGain, musicGain, noiseBuf;
let musicTimer = null, nextNoteTime = 0, step = 0, song = null;

const sfxLevel = () => (save.settings.sfx ? 0.65 * (save.settings.sfxVol ?? 0.8) : 0);
const musicLevel = () => (save.settings.music ? 0.24 * (save.settings.musicVol ?? 0.7) : 0);

export function initAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
  sfxGain = ctx.createGain(); sfxGain.gain.value = sfxLevel(); sfxGain.connect(master);
  musicGain = ctx.createGain(); musicGain.gain.value = musicLevel(); musicGain.connect(master);
  if (song) startScheduler();
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
}

export function applyAudioSettings() {
  if (!ctx) return;
  sfxGain.gain.setTargetAtTime(sfxLevel(), ctx.currentTime, 0.05);
  musicGain.gain.setTargetAtTime(musicLevel(), ctx.currentTime, 0.05);
}

export function suspendAudio() { if (ctx && ctx.state === 'running') ctx.suspend(); }
export function resumeAudio() { if (ctx && ctx.state === 'suspended') ctx.resume(); }

function tone(freq, dur, { type = 'sine', vol = 0.4, slide = 0, delay = 0, out = sfxGain, attack = 0.005 } = {}) {
  if (!ctx) return;
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.02);
}

function noise(dur, { vol = 0.3, freq = 1200, delay = 0 } = {}) {
  if (!ctx) return;
  const t = ctx.currentTime + delay;
  const s = ctx.createBufferSource(); s.buffer = noiseBuf;
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(sfxGain); s.start(t); s.stop(t + dur);
}

export const sfx = {
  coin: () => { tone(988, 0.08, { type: 'square', vol: 0.18 }); tone(1319, 0.14, { type: 'square', vol: 0.18, delay: 0.06 }); },
  gem: () => [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.16, { type: 'triangle', vol: 0.3, delay: i * 0.06 })),
  jump: () => tone(320, 0.18, { type: 'sine', vol: 0.35, slide: 420 }),
  land: () => noise(0.08, { vol: 0.25, freq: 500 }),
  hit: () => { noise(0.3, { vol: 0.5, freq: 900 }); tone(140, 0.35, { type: 'sawtooth', vol: 0.25, slide: -80 }); },
  fall: () => tone(600, 0.6, { type: 'triangle', vol: 0.3, slide: -480 }),
  power: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, { type: 'square', vol: 0.15, delay: i * 0.05 })),
  shieldBreak: () => { tone(1200, 0.2, { type: 'triangle', vol: 0.25, slide: -700 }); noise(0.15, { vol: 0.2, freq: 3000 }); },
  checkpoint: () => { tone(660, 0.12, { type: 'triangle', vol: 0.3 }); tone(990, 0.2, { type: 'triangle', vol: 0.3, delay: 0.1 }); },
  win: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i > 3 ? 0.35 : 0.15, { type: 'square', vol: 0.18, delay: i * 0.11 })),
  lose: () => [392, 330, 262, 196].forEach((f, i) => tone(f, 0.25, { type: 'triangle', vol: 0.3, delay: i * 0.16 })),
  click: () => tone(1500, 0.04, { type: 'square', vol: 0.08 }),
  buy: () => [880, 1109, 1319].forEach((f, i) => tone(f, 0.12, { type: 'triangle', vol: 0.3, delay: i * 0.07 })),
  star: (i) => tone(880 + i * 220, 0.2, { type: 'triangle', vol: 0.3 }),
  boost: () => { tone(400, 0.25, { type: 'sawtooth', vol: 0.15, slide: 900 }); noise(0.2, { vol: 0.15, freq: 4000 }); },
  pad: () => { tone(200, 0.35, { type: 'square', vol: 0.18, slide: 900 }); tone(500, 0.3, { type: 'sine', vol: 0.2, slide: 1200, delay: 0.05 }); },
  crumble: () => noise(0.35, { vol: 0.3, freq: 700 }),
  meteor: () => { noise(0.5, { vol: 0.5, freq: 500 }); tone(90, 0.5, { type: 'sawtooth', vol: 0.3, slide: -50 }); },
  double: () => tone(520, 0.15, { type: 'triangle', vol: 0.3, slide: 600 }),
  tick: () => tone(1800, 0.025, { type: 'square', vol: 0.06 }),
  gift: () => [659, 784, 988, 1319, 1568].forEach((f, i) => tone(f, 0.18, { type: 'triangle', vol: 0.25, delay: i * 0.08 })),
  error: () => tone(180, 0.18, { type: 'square', vol: 0.15 }),
};

// ---------- Background music: tiny step sequencer, one mood per theme ----------
const SONGS = {
  meadow: { bpm: 112, root: 60, scale: [0, 2, 4, 7, 9], wave: 'triangle',
    melody: [0, 2, 4, 2, 3, 4, 2, -1, 0, 2, 4, 5, 4, 2, 1, -1], bass: [0, 0, 5, 5, 3, 3, 4, 4] },
  desert: { bpm: 100, root: 57, scale: [0, 1, 4, 5, 7, 8, 10], wave: 'sawtooth',
    melody: [0, 1, 2, -1, 3, 2, 1, 0, 4, -1, 3, 2, 1, 2, 0, -1], bass: [0, 0, 3, 3, 4, 4, 0, 0] },
  ice: { bpm: 92, root: 64, scale: [0, 2, 3, 7, 9], wave: 'sine',
    melody: [4, -1, 3, 2, -1, 0, 1, -1, 2, 3, 4, -1, 3, 1, 0, -1], bass: [0, 0, 2, 2, 3, 3, 1, 1] },
  candy: { bpm: 128, root: 67, scale: [0, 2, 4, 5, 7, 9, 11], wave: 'square',
    melody: [0, 2, 4, 2, 4, 6, 4, -1, 5, 4, 2, 0, 1, 2, 0, -1], bass: [0, 0, 3, 3, 4, 4, 0, 0] },
  ocean: { bpm: 84, root: 62, scale: [0, 2, 3, 5, 7, 9, 10], wave: 'sine',
    melody: [0, -1, 2, 4, -1, 3, 2, -1, 4, -1, 6, 5, -1, 4, 2, -1], bass: [0, 0, 5, 5, 3, 3, 4, 4] },
  volcano: { bpm: 132, root: 52, scale: [0, 1, 3, 5, 7, 8, 10], wave: 'sawtooth',
    melody: [0, 0, 1, 0, 3, 2, 1, 0, 4, 4, 5, 4, 3, 1, 0, -1], bass: [0, 0, 0, 0, 5, 5, 3, 3] },
  cherry: { bpm: 96, root: 69, scale: [0, 2, 3, 7, 8], wave: 'triangle',
    melody: [0, 1, 2, -1, 4, 3, 2, -1, 1, 2, 3, 4, 2, -1, 0, -1], bass: [0, 0, 2, 2, 3, 3, 1, 1] },
  forest: { bpm: 90, root: 57, scale: [0, 2, 3, 5, 7, 8, 11], wave: 'sine',
    melody: [4, 2, 0, -1, 3, 1, -1, 2, 4, 5, 4, 2, 0, -1, 1, -1], bass: [0, 0, 3, 3, 5, 5, 4, 4] },
  space: { bpm: 104, root: 60, scale: [0, 2, 4, 6, 7, 9, 11], wave: 'sine',
    melody: [0, 4, 7, 4, 6, 4, 2, -1, 0, 4, 8, 7, 6, 4, 2, -1], bass: [0, 0, 4, 4, 5, 5, 3, 3] },
  city: { bpm: 124, root: 55, scale: [0, 3, 5, 7, 10], wave: 'square',
    melody: [0, 0, 2, 3, 4, 3, 2, 0, 1, 1, 3, 4, 5, 4, 3, 1], bass: [0, 0, 0, 0, 3, 3, 2, 2] },
};
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
const noteOf = (s, deg, oct = 0) => {
  const len = s.scale.length;
  const o = Math.floor(deg / len), i = ((deg % len) + len) % len;
  return midi(s.root + s.scale[i] + 12 * (o + oct));
};

export function playMusic(theme) {
  song = SONGS[theme] || SONGS.meadow;
  if (ctx) startScheduler();
}
function startScheduler() {
  if (musicTimer) return;
  nextNoteTime = ctx.currentTime + 0.1; step = 0;
  musicTimer = setInterval(scheduler, 60);
}
export function stopMusic() { clearInterval(musicTimer); musicTimer = null; }

function scheduler() {
  if (!ctx || !song) return;
  const eighth = 60 / song.bpm / 2;
  while (nextNoteTime < ctx.currentTime + 0.25) {
    const delay = nextNoteTime - ctx.currentTime;
    const m = song.melody[step % song.melody.length];
    if (m >= 0) tone(noteOf(song, m, 1), eighth * 0.9, { type: song.wave, vol: 0.18, delay, out: musicGain, attack: 0.01 });
    if (step % 2 === 0) {
      const b = song.bass[(step / 2) % song.bass.length];
      tone(noteOf(song, b, -1), eighth * 1.8, { type: 'triangle', vol: 0.32, delay, out: musicGain, attack: 0.01 });
    }
    if (step % 4 === 2) tone(90, 0.06, { type: 'sine', vol: 0.18, delay, out: musicGain, slide: -40 });
    nextNoteTime += eighth; step++;
  }
}
