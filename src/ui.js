// All menus and HUD. The game calls these functions; buttons call back into the game API.
import { GAME, WORLDS, LEVELS_PER_WORLD, worldById, todayStr } from './config.js';
import { save, persist, prog, resetSave } from './storage.js';
import { t, tName, lang, applyI18n } from './i18n.js';
import { BALLS, TRAILS, STYLE, PETS, UPGRADES, SPECIAL, DAILY_REWARDS, SPIN_PRIZES, ballById, rareUnlocked, LEGEND_PACK } from './catalog.js';
import { ensureMissions, ACHIEVEMENTS, claimableCount, giftAvailable, giftDay, claimGift, freeSpin, spinWheel, givePrize, openMysteryBox, dailyOffer, ownsWorld, xpNeeded, TITLES, FRAMES, legendPackOwned, buyLegendPack, affordableNew, markSeen } from './progress.js';
import { THEMES } from './world.js';
import { shareText, openUrl } from './native.js';

const $ = (id) => document.getElementById(id);
let api = null;
const PANELS = ['menu', 'levelsPanel', 'shopPanel', 'endlessPanel', 'missionsPanel', 'settingsPanel', 'howtoPanel', 'pausePanel', 'completePanel', 'gameoverPanel', 'profilePanel'];
let current = 'menu', settingsReturn = 'menu';
const hex = (n) => '#' + n.toString(16).padStart(6, '0');
const coinSpan = (n) => `<span class="coin-ico"></span>${n}`;

export function showPanel(id) { PANELS.forEach((p) => $(p).classList.toggle('hidden', p !== id)); current = id; if (id !== 'shopPanel') api?.previewActive(false); }
const click = (el, fn) => (typeof el === 'string' ? $(el) : el).addEventListener('click', () => { api.initAudio(); api.sfx.click(); fn(); });

// ---------------- HUD ----------------
let msgTimer = null;
export function message(text, ms = 1300) {
  const m = $('message'); m.textContent = text; m.classList.remove('hidden');
  m.style.animation = 'none'; void m.offsetWidth; m.style.animation = '';
  clearTimeout(msgTimer); msgTimer = setTimeout(() => m.classList.add('hidden'), ms);
}
export function hudStart(o) {
  showPanel(null); $('hud').classList.remove('hidden');
  $('hudLevel').textContent = o.endless ? '♾️' : `${o.boss ? '👑 ' : ''}${t('lv')} ${o.lvl}`;
  $('progress').classList.toggle('hidden', !!o.endless); $('hudDist').classList.toggle('hidden', !o.endless);
  if (!o.keep) { $('score').textContent = 0; $('progressFill').style.width = '0%'; $('hudDist').textContent = t('distance', { n: 0 }); }
  hudLives(o.lives, o.max); $('powers').innerHTML = '';
  $('controls').classList.toggle('hidden', save.settings.control !== 'joystick');
  $('jumpBtn2').classList.toggle('hidden', !(save.settings.control === 'drag' && save.settings.jump === 'button'));
}
export function hudHide() { $('hud').classList.add('hidden'); $('controls').classList.add('hidden'); $('jumpBtn2').classList.add('hidden'); }
export function hudLives(l, max) { $('lives').textContent = '❤️'.repeat(Math.max(0, l)) + '🤍'.repeat(Math.max(0, max - l)); }
export function hudCoins(n) { $('score').textContent = n; }
export function hudProgress(f) { $('progressFill').style.width = `${f * 100}%`; }
export function hudDistance(m) { $('hudDist').textContent = t('distance', { n: m }); }
export function hudPowers(p, combo = 0) {
  $('powers').innerHTML = Object.keys(p).filter((k) => p[k] > 0.05).map((k) => `<span class="power">${t('p_' + k)} ${Math.ceil(p[k])}s</span>`).join('');
  const c = $('comboPill'); c.classList.toggle('hidden', !combo); if (combo) c.textContent = `🔥 ×${combo}`;
}
export function fps(n) { const f = $('fps'); f.classList.toggle('hidden', !save.settings.showFps); f.textContent = `${n} FPS`; }
export function showTutorial(on) { $('tutorial').classList.toggle('hidden', !on); }
export function showPause(on) { if (on) { showPanel('pausePanel'); $('controls').classList.add('hidden'); } else { showPanel(null); $('controls').classList.toggle('hidden', save.settings.control !== 'joystick'); } }

// ---------------- Popups ----------------
let popupCb = null;
export function popup(icon, title, text, cb) {
  $('popupIcon').innerHTML = icon; $('popupTitle').textContent = title; $('popupText').innerHTML = text || '';
  $('popup').classList.remove('hidden'); popupCb = cb || null;
}
function closePopup() { $('popup').classList.add('hidden'); const cb = popupCb; popupCb = null; cb && cb(); }
function rewardPopup(got) {
  if (!got) return;
  if (got.cat === 'coins') return popup('🪙', t('youWon'), coinSpan(got.n));
  const icon = got.cat === 'ball' ? `<img src="${api.ballThumb(got.item.id)}" width="90">` : (got.item.icon || got.item.emoji || '✨');
  popup(icon, t('youWon'), got.item.name);
}
function rarePopups(rares) { if (rares?.length) setTimeout(() => popup(`<img src="${api.ballThumb(rares[0].id)}" width="90">`, `${t('rare')}!`, rares[0].name), 900); }

// ---------------- Menu ----------------
function updateWallets() { document.querySelectorAll('.walletAmt').forEach((e) => (e.textContent = save.coins)); }
function updateDots() {
  $('shopDot').classList.toggle('hidden', !(giftAvailable() || freeSpin()));
  $('missionDot').classList.toggle('hidden', claimableCount() === 0);
  $('shopNew').classList.toggle('hidden', !affordableNew() || !$('shopDot').classList.contains('hidden'));
}
export function goMenu() {
  hudHide(); showTutorial(false); updateWallets(); updateDots(); showPanel('menu'); api.showMenuScene();
}

// ---------------- Level select ----------------
let selWorld = 'meadow';
function worldBg(id) { const T = THEMES[id]; return `linear-gradient(180deg, ${hex(T.skyTop)}, ${hex(T.top)})`; }
function buildLevels() {
  const tabs = $('worldTabs'); tabs.innerHTML = '';
  WORLDS.forEach((w) => {
    const b = document.createElement('button'), owned = ownsWorld(w.id);
    b.className = `wtab${w.id === selWorld ? ' on' : ''}${owned ? '' : ' locked'}`; b.style.background = worldBg(w.id);
    b.innerHTML = `<b>${owned ? w.icon : '🔒'}</b>${tName(w.name)}`;
    click(b, () => { selWorld = w.id; buildLevels(); }); tabs.appendChild(b);
  });
  const w = worldById(selWorld); $('worldTitle').textContent = `${w.icon} ${tName(w.name)}`;
  const grid = $('levelGrid'), lockBox = $('worldLocked');
  grid.innerHTML = '';
  if (!ownsWorld(selWorld)) {
    grid.classList.add('hidden'); lockBox.classList.remove('hidden');
    lockBox.innerHTML = `<div class="big-emoji">${w.icon}</div><b>${t('buyWorld', { w: tName(w.name) })}</b>`;
    const btn = document.createElement('button'); btn.className = 'main-btn small-btn'; btn.innerHTML = coinSpan(w.price); btn.disabled = save.coins < w.price;
    click(btn, () => buy(w.price, () => { save.worlds.push(w.id); }, () => buildLevels())); lockBox.appendChild(btn);
    return;
  }
  grid.classList.remove('hidden'); lockBox.classList.add('hidden');
  const p = prog(selWorld);
  for (let i = 1; i <= LEVELS_PER_WORLD; i++) {
    const b = document.createElement('button'), locked = i > p.unlocked, st = p.stars[i] || 0;
    b.className = `lvl${locked ? ' locked' : ''}${i === LEVELS_PER_WORLD ? ' boss' : ''}`; b.style.background = worldBg(selWorld);
    b.innerHTML = locked ? '🔒' : `${i}<small>${'★'.repeat(st)}${'☆'.repeat(3 - st)}</small>`;
    if (!locked) click(b, () => api.startLevel(selWorld, i));
    grid.appendChild(b);
  }
  setTimeout(() => tabs.querySelector('.on')?.scrollIntoView({ inline: 'center', block: 'nearest' }), 0);
}

// ---------------- Shop ----------------
let shopTab = 'balls';
function buy(price, give, after) {
  if (save.coins < price) { api.sfx.error(); message(t('notEnough')); return false; }
  save.coins -= price; give(); persist(); api.sfx.buy(); api.vibrate('light'); updateWallets(); after && after();
  return true;
}
function preview(cfg = {}) { api.previewSet({ ball: save.equip.ball, eyes: save.equip.eyes, hat: save.equip.hat, face: save.equip.face, back: save.equip.back, ...cfg }); }
function trailSwatch(tr) {
  if (tr.emoji) return `<div class="ico" style="background:rgba(255,255,255,.15)">${tr.emoji}</div>`;
  const g = { ball: '#ffb52e,#ffe28a', rainbow: '#ff4f4f,#ffe14a,#5ad65a,#3fb7ff,#b05aff', fire: '#fff27a,#ff7a1a,#c81a00', ice: '#ffffff,#8ad8ff', gold: '#fff6c0,#ffd23a,#c89400', neon: '#2ff7ff,#ff4fd8' }[tr.look] || '#7ad8ff,#ffffff';
  return `<div class="ico" style="background:linear-gradient(135deg,${g})">${tr.mode === 'spark' ? '⚡' : ''}</div>`;
}
function itemCard({ thumb, name, owned, equipped, price, rare, rareHow, onBuy, onEquip, onPreview, removable, legend }) {
  const d = document.createElement('div'); d.className = `item${equipped ? ' equipped' : ''}${legend ? ' legend' : ''}`;
  d.innerHTML = `${rare ? `<span class="rare">${t('rare')}</span>` : ''}${legend ? `<span class="leg">${t('legendary')}</span>` : ''}${thumb}<b>${name}</b>`;
  const b = document.createElement('button');
  if (equipped) { b.textContent = removable ? t('remove') : t('equipped'); b.className = removable ? 'equip' : 'on'; if (removable) click(b, onEquip); }
  else if (owned) { b.textContent = t('equip'); b.className = 'equip'; click(b, onEquip); }
  else if (rare) { b.textContent = '🔒'; b.disabled = true; const how = document.createElement('span'); how.className = 'how'; how.textContent = rareHow; d.appendChild(how); }
  else { b.innerHTML = coinSpan(price); if (save.coins < price) b.disabled = true; click(b, onBuy); }
  d.appendChild(b);
  if (onPreview) d.addEventListener('click', (e) => { if (e.target !== b) onPreview(); });
  return d;
}
function buildOffer() {
  const o = dailyOffer(), box = $('offer');
  if (!o) { box.classList.add('hidden'); return; }
  box.classList.remove('hidden');
  const now = new Date(), end = new Date(now); end.setHours(24, 0, 0, 0);
  const left = Math.max(0, end - now), h = Math.floor(left / 3600000), m = Math.floor(left / 60000) % 60;
  const img = o.cat === 'ball' ? `<img src="${api.ballThumb(o.item.id)}">` : `<div class="oi">${o.item.emoji || '✨'}</div>`;
  box.innerHTML = `${img}<div class="ot">${t('offer')}: ${o.item.name} <s style="opacity:.7">${o.item.price}</s><small>⏱ ${t('offerEnds', { t: `${h}h ${m}m` })}</small></div>`;
  const b = document.createElement('button'); b.innerHTML = coinSpan(o.price); box.appendChild(b);
  click(b, () => buy(o.price, () => { save.owned[o.cat].push(o.item.id); save.equip[o.cat] = o.item.id; }, () => { api.applyLook(); buildShop(); }));
}
function buildShop() {
  updateWallets(); buildOffer(); preview();
  const tabs = $('shopTabs'); tabs.innerHTML = '';
  ['balls', 'worlds', 'trails', 'style', 'upgrades', 'special'].forEach((k) => {
    const b = document.createElement('button'); b.className = `tab${shopTab === k ? ' on' : ''}`;
    b.textContent = t('t_' + k) + (k === 'special' && (giftAvailable() || freeSpin()) ? ' 🔴' : '');
    click(b, () => { shopTab = k; buildShop(); }); tabs.appendChild(b);
  });
  const grid = $('shopGrid'); grid.innerHTML = ''; grid.classList.toggle('wide', shopTab === 'upgrades' || shopTab === 'special');
  const re = () => { api.applyLook(); buildShop(); };
  if (shopTab === 'balls') {
    for (const b of BALLS) {
      const owned = save.owned.ball.includes(b.id);
      grid.appendChild(itemCard({ thumb: `<img src="${api.ballThumb(b.id)}" loading="lazy">`, name: b.name, owned, equipped: save.equip.ball === b.id, price: b.price, legend: b.legendary,
        rare: !!b.rare && !owned, rareHow: b.rare ? t('rare_' + b.rare) : '',
        onBuy: () => buy(b.price, () => { save.owned.ball.push(b.id); save.equip.ball = b.id; }, re),
        onEquip: () => { save.equip.ball = b.id; persist(); re(); }, onPreview: () => preview({ ball: b.id }) }));
    }
  } else if (shopTab === 'worlds') {
    for (const w of WORLDS) {
      const owned = ownsWorld(w.id);
      grid.appendChild(itemCard({ thumb: `<div class="ico" style="background:${worldBg(w.id)}">${w.icon}</div>`, name: tName(w.name), owned, equipped: false, price: w.price,
        onBuy: () => buy(w.price, () => save.worlds.push(w.id), () => { buildShop(); message(`${w.icon} ${t('bought')}`); }),
        onEquip: () => { selWorld = w.id; buildLevels(); showPanel('levelsPanel'); } }));
      if (owned) grid.lastChild.querySelector('button').textContent = '▶';
    }
  } else if (shopTab === 'trails') {
    for (const tr of TRAILS) {
      const owned = save.owned.trail.includes(tr.id);
      grid.appendChild(itemCard({ thumb: trailSwatch(tr), name: tr.name, owned, equipped: save.equip.trail === tr.id, price: tr.price,
        onBuy: () => buy(tr.price, () => { save.owned.trail.push(tr.id); save.equip.trail = tr.id; }, re),
        onEquip: () => { save.equip.trail = tr.id; persist(); re(); }, legend: tr.price >= 2000 }));
    }
  } else if (shopTab === 'style') {
    const groups = [['eyes', t('eyes')], ['hat', t('hats')], ['face', t('face')], ['back', t('backSlot')]];
    for (const [slot, label] of groups) {
      const h = document.createElement('div'); h.className = 'subhead'; h.textContent = label; grid.appendChild(h);
      for (const s of STYLE.filter((x) => x.slot === slot)) {
        const owned = save.owned.style.includes(s.id), eq = save.equip[slot] === s.id;
        grid.appendChild(itemCard({ thumb: `<div class="ico" style="background:rgba(255,255,255,.15)">${s.icon}</div>`, name: s.name, owned, equipped: eq, price: s.price, removable: true, legend: s.price >= 1500,
          onBuy: () => buy(s.price, () => { save.owned.style.push(s.id); save.equip[slot] = s.id; }, re),
          onEquip: () => { save.equip[slot] = eq ? null : s.id; persist(); re(); }, onPreview: () => preview({ [slot]: s.id }) }));
      }
    }
    const h = document.createElement('div'); h.className = 'subhead'; h.textContent = t('pets'); grid.appendChild(h);
    for (const p of PETS) {
      const owned = save.owned.pet.includes(p.id), eq = save.equip.pet === p.id;
      grid.appendChild(itemCard({ thumb: `<div class="ico" style="background:rgba(255,255,255,.15)">${p.icon}</div>`, name: p.name, owned, equipped: eq, price: p.price, removable: true, legend: p.price >= 3000,
        onBuy: () => buy(p.price, () => { save.owned.pet.push(p.id); save.equip.pet = p.id; }, re),
        onEquip: () => { save.equip.pet = eq ? null : p.id; persist(); re(); } }));
    }
  } else if (shopTab === 'upgrades') {
    for (const u of UPGRADES) {
      const lvl = save.upgrades[u.id] || 0, max = u.costs.length, row = document.createElement('div'); row.className = 'row';
      row.innerHTML = `<div class="rt">${t('u_' + u.id)}<div class="pips">${u.costs.map((_, i) => `<i class="${i < lvl ? 'on' : ''}"></i>`).join('')}</div></div>`;
      const b = document.createElement('button');
      if (lvl >= max) { b.textContent = t('max'); b.className = 'done'; }
      else { const c = u.costs[lvl]; b.innerHTML = coinSpan(c); b.disabled = save.coins < c; click(b, () => buy(c, () => { save.upgrades[u.id] = lvl + 1; }, buildShop)); }
      row.appendChild(b); grid.appendChild(row);
    }
  } else if (shopTab === 'special') {
    const addRow = (icon, title, sub, btnHtml, onClick, cls = '', disabled = false) => {
      const row = document.createElement('div'); row.className = 'row';
      row.innerHTML = `<div class="ri">${icon}</div><div class="rt">${title}<small>${sub}</small></div>`;
      const b = document.createElement('button'); b.innerHTML = btnHtml; if (cls) b.className = cls; b.disabled = disabled;
      if (onClick && !disabled) click(b, onClick);
      row.appendChild(b); grid.appendChild(row);
    };
    const gday = giftDay();
    addRow('🎁', t('dailyGift'), `${t('dayN', { n: gday })} · ${coinSpan(DAILY_REWARDS[gday - 1])}${gday === 7 ? ' + 📦' : ''}`, giftAvailable() ? t('claim') : t('claimed'),
      () => { const r = claimGift(); if (r) { api.sfx.gift(); popup('🎁', t('dailyGift'), `${t('dayN', { n: r.day })}: ${coinSpan(r.coins)}`, () => r.box && rewardPopup(r.box)); buildShop(); updateDots(); } }, giftAvailable() ? 'green' : 'done', !giftAvailable());
    addRow('🎡', t('spin'), '', freeSpin() ? t('spinFree') : t('spinCost', { n: SPECIAL.spin }), openSpin, freeSpin() ? 'green' : '');
    addRow('🏆', t('legendPack'), `${t('legendPackSub')}`, legendPackOwned() ? '✔' : coinSpan(SPECIAL.legendPack),
      () => { if (buyLegendPack()) { api.sfx.buy(); api.applyLook(); updateWallets(); popup(`<img src="${api.ballThumb(LEGEND_PACK.ball)}" width="90">`, t('legendPack'), t('legendPackSub')); buildShop(); } else { api.sfx.error(); message(t('notEnough')); } },
      legendPackOwned() ? 'done' : '', legendPackOwned());
    addRow('📦', t('mystery'), '', coinSpan(SPECIAL.mystery), () => buy(SPECIAL.mystery, () => {}, () => { const got = openMysteryBox(); rewardPopup(got); api.applyLook(); buildShop(); }));
    addRow('🎟️', t('tickets'), t('youHave', { n: save.items.tickets }), coinSpan(SPECIAL.tickets), () => buy(SPECIAL.tickets, () => { save.items.tickets += 3; }, buildShop));
    addRow('🛡️', t('startShield'), t('youHave', { n: save.items.startShield }), coinSpan(SPECIAL.startShield), () => buy(SPECIAL.startShield, () => { save.items.startShield += 3; }, buildShop));
    addRow('⏭️', t('skipTicket'), t('youHave', { n: save.items.skip }), coinSpan(SPECIAL.skip), () => buy(SPECIAL.skip, () => { save.items.skip += 1; }, buildShop));
  }
}

// ---------------- Lucky spin ----------------
let spinning = false, wheelAngle = 0;
function buildWheel() {
  const n = SPIN_PRIZES.length, cols = ['#ff5a8a', '#ffb52e', '#5ad1ff', '#7ee37a', '#b05aff', '#ff7a3a', '#3fb7ff', '#ffd23a'];
  const w = $('wheel');
  w.style.background = `conic-gradient(${SPIN_PRIZES.map((p, i) => `${cols[i % cols.length]} ${i * 360 / n}deg ${(i + 1) * 360 / n}deg`).join(',')})`;
  w.innerHTML = SPIN_PRIZES.map((p, i) => { const a = (i + 0.5) * 360 / n; return `<span style="transform:translate(-50%,-50%) rotate(${a}deg) translateY(-84px) rotate(${-a}deg)">${p.type === 'coins' ? '🪙' + p.label : p.label}</span>`; }).join('');
}
function openSpin() { buildWheel(); updateSpinBtn(); $('spinPop').classList.remove('hidden'); }
function updateSpinBtn() { $('spinGo').innerHTML = freeSpin() ? t('spinFree') : t('spinCost', { n: SPECIAL.spin }); }
function doSpin() {
  if (spinning) return;
  if (!freeSpin()) { if (save.coins < SPECIAL.spin) { api.sfx.error(); message(t('notEnough')); return; } save.coins -= SPECIAL.spin; }
  else save.spin.last = todayStr();
  persist(); updateWallets();
  spinning = true;
  const idx = spinWheel(), n = SPIN_PRIZES.length, seg = 360 / n;
  const target = 360 - (idx + 0.5) * seg;
  wheelAngle += 360 * 5 + ((target - (wheelAngle % 360)) + 360) % 360;
  $('wheel').style.transform = `rotate(${wheelAngle}deg)`;
  let ticks = 0; const tk = setInterval(() => { api.sfx.tick(); if (++ticks > 24) clearInterval(tk); }, 120);
  setTimeout(() => {
    spinning = false; const p = SPIN_PRIZES[idx], got = givePrize(p); persist(); updateWallets(); updateSpinBtn(); api.sfx.gift();
    if (got) rewardPopup(got);
    else popup(p.type === 'coins' ? '🪙' : p.label, t('youWon'), p.type === 'coins' ? coinSpan(p.n) : p.type === 'ticket' ? t('tickets').replace('×3', '×1') : t('startShield').replace('×3', '×1'));
    if (current === 'shopPanel') buildShop(); updateDots();
  }, 3300);
}

// ---------------- Endless ----------------
let endlessWorld = null;
function buildEndless() {
  $('endlessBest').textContent = t('bestDist', { n: save.stats.endlessBest });
  if (!endlessWorld || !ownsWorld(endlessWorld)) endlessWorld = ownsWorld(save.lastWorld) ? save.lastWorld : 'meadow';
  const box = $('endlessWorlds'); box.innerHTML = '';
  WORLDS.filter((w) => ownsWorld(w.id)).forEach((w) => {
    const b = document.createElement('button'); b.className = `chip${w.id === endlessWorld ? ' on' : ''}`; b.style.background = worldBg(w.id);
    b.innerHTML = `${w.icon} ${tName(w.name)}`; click(b, () => { endlessWorld = w.id; buildEndless(); }); box.appendChild(b);
  });
}

// ---------------- Missions ----------------
let mTab = 'daily';
function buildMissions() {
  ensureMissions();
  document.querySelectorAll('[data-mtab]').forEach((b) => b.classList.toggle('on', b.dataset.mtab === mTab));
  const list = $('missionList'); list.innerHTML = '';
  const now = new Date(), end = new Date(now); end.setHours(24, 0, 0, 0); const left = end - now;
  $('missionReset').textContent = mTab === 'daily' ? t('resetIn', { t: `${Math.floor(left / 3600000)}h ${Math.floor(left / 60000) % 60}m` }) : '';
  const row = (text, prog, target, reward, claimed, onClaim) => {
    const r = document.createElement('div'); r.className = 'row'; const f = Math.min(1, prog / target);
    r.innerHTML = `<div class="rt">${text}<small>${Math.min(prog, target)} / ${target}</small><div class="bar"><i style="width:${f * 100}%"></i></div></div>`;
    const b = document.createElement('button');
    if (claimed) { b.textContent = '✔'; b.className = 'done'; }
    else if (prog >= target) { b.innerHTML = `${t('claim')} ${coinSpan(reward)}`; b.className = 'green'; click(b, onClaim); }
    else { b.innerHTML = coinSpan(reward); b.className = 'done'; }
    r.appendChild(b); list.appendChild(r);
  };
  const rewardCoins = (n) => { save.coins += n; persist(); api.sfx.gift(); api.vibrate('light'); updateWallets(); updateDots(); buildMissions(); message(`+${n} 🪙`); };
  if (mTab === 'daily') save.missions.list.forEach((m) => row(t('m_' + m.id, { n: m.target }), m.progress, m.target, m.reward, m.claimed, () => { m.claimed = true; rewardCoins(m.reward); }));
  else ACHIEVEMENTS.forEach((a) => row(t(a.key, { n: a.n }), a.stat(), a.n, a.reward, !!save.achievements[a.id], () => { save.achievements[a.id] = true; rewardCoins(a.reward); }));
}

// ---------------- Settings ----------------
let showMore = false, resetArmed = 0;
function buildSettings() {
  const body = $('settingsBody'), s = save.settings; body.innerHTML = '';
  const sec = (k) => { const d = document.createElement('div'); d.className = 'sec'; d.textContent = t(k); body.appendChild(d); };
  const row = (label, el) => { const d = document.createElement('div'); d.className = 'setting'; d.innerHTML = `<span>${label}</span>`; d.appendChild(el); body.appendChild(d); };
  const after = (k) => {
    persist();
    if (['music', 'sfx', 'musicVol', 'sfxVol'].includes(k)) api.applyAudioSettings();
    if (['quality', 'shadows', 'particles', 'trailFx', 'battery'].includes(k)) { api.applyGraphics(); if (k === 'quality' || k === 'battery') api.reloadScene(); }
    if (k === 'vibe' && s.vibe) api.vibrate('medium');
    if (k === 'lang') { applyI18n(); goMenuTexts(); }
    if (k === 'bigText') document.body.classList.toggle('big', s.bigText);
    if (k === 'showFps') $('fps').classList.toggle('hidden', !s.showFps);
  };
  const toggle = (k, label) => { const b = document.createElement('button'); b.className = `toggle${s[k] ? ' on' : ''}`; b.textContent = s[k] ? t('on') : t('off'); click(b, () => { s[k] = !s[k]; after(k); buildSettings(); }); row(label, b); };
  const choice = (k, label, opts, labels) => { const b = document.createElement('button'); b.className = 'choice'; b.textContent = labels ? labels[opts.indexOf(s[k])] ?? s[k] : t(String(s[k])); click(b, () => { s[k] = opts[(opts.indexOf(s[k]) + 1) % opts.length]; after(k); buildSettings(); }); row(label, b); };
  const slider = (k, label, min, max, step) => { const i = document.createElement('input'); i.type = 'range'; i.min = min; i.max = max; i.step = step; i.value = s[k]; i.addEventListener('input', () => { s[k] = Number(i.value); after(k); }); row(label, i); };
  const link = (label, fn, cls = '') => { const b = document.createElement('button'); b.className = `linkbtn ${cls}`; b.textContent = label; click(b, fn); body.appendChild(b); return b; };

  sec('s_language'); choice('lang', t('language'), ['en', 'bn'], ['English', 'বাংলা']);
  sec('s_sound'); toggle('music', t('music')); slider('musicVol', t('musicVol'), 0, 1, 0.05); toggle('sfx', t('sfx')); slider('sfxVol', t('sfxVol'), 0, 1, 0.05); toggle('vibe', t('vibe'));
  sec('s_controls'); choice('control', t('controls'), ['drag', 'joystick']); slider('sens', t('sens'), 5, 14, 0.5); choice('jump', t('jumpBy'), ['tap', 'swipe', 'button']); choice('difficulty', t('difficultyLbl'), ['easy', 'normal', 'hard']); choice('ballSpeed', t('ballSpeed'), ['slow', 'normal', 'fast']);
  sec('s_graphics'); choice('quality', t('quality'), ['auto', 'low', 'medium', 'high']); toggle('battery', t('battery'));
  const more = link(showMore ? t('s_less') : t('s_more'), () => { showMore = !showMore; buildSettings(); }); more.style.textAlign = 'center';
  if (showMore) {
    choice('vibeStrength', t('vibeStrength'), ['light', 'normal', 'strong']);
    choice('fps', t('fps'), [60, 30], ['60', '30']); choice('camera', t('camera'), ['near', 'normal', 'far']);
    toggle('shadows', t('shadows')); toggle('trailFx', t('trailFx')); toggle('particles', t('particles')); toggle('shake', t('shake')); toggle('showFps', t('showFps')); toggle('bigText', t('bigText'));
    sec('stats');
    const st = save.stats, g = document.createElement('div'); g.className = 'statgrid';
    const hrs = Math.floor(st.time / 3600), mins = Math.floor(st.time / 60) % 60;
    [[t('st_time'), `${hrs}h ${mins}m`], [t('st_coins'), st.coins], [t('st_jumps'), st.jumps], [t('st_falls'), st.falls], [t('st_levels'), st.levels], [t('st_bosses'), st.bosses], [t('st_endless'), `${st.endlessBest} m`]]
      .forEach(([a, b]) => { g.innerHTML += `<span>${a}</span><b>${b}</b>`; });
    body.appendChild(g);
    link(t('howTo'), () => showPanel('howtoPanel'));
    link(t('tutorialAgain'), () => { save.tutorialDone = false; persist(); message('✔'); });
    link(t('rate'), () => openUrl(GAME.storeUrl));
    link(t('shareGame'), () => doShare(save.stats.levels));
    link(t('contact'), () => openUrl(GAME.contactUrl));
    link(t('privacy'), () => openUrl(GAME.privacyUrl));
    link(resetArmed && Date.now() - resetArmed < 3000 ? t('resetConfirm') : t('resetProgress'), () => {
      if (resetArmed && Date.now() - resetArmed < 3000) { resetSave(); resetArmed = 0; message(t('resetDone')); api.applyLook(); updateWallets(); updateDots(); }
      else resetArmed = Date.now();
      buildSettings();
    }, 'danger');
    const c = document.createElement('p'); c.className = 'credits'; c.textContent = t('credits', { v: GAME.version }); body.appendChild(c);
  }
}

async function doShareText(text) { const r = await shareText(GAME.name, text, GAME.storeUrl); if (r === 'copied') message('📋 ✔'); }

function buildProfile() {
  const p = save.profile, st = save.stats;
  $('profName').value = p.name || ''; $('profName').placeholder = t('namePh');
  const fr = FRAMES.find((f) => f.id === p.frame) || FRAMES[0];
  $('profAvatar').style.background = fr.css;
  $('profAvatar').innerHTML = `<img src="${api.ballThumb(save.equip.ball)}">`;
  $('profTitle').textContent = '🏷️ ' + t(TITLES.find((x) => x.id === p.title)?.key || 'ti_rookie');
  $('profLv').textContent = `${t('lv')} ${p.level}`;
  $('profXpTxt').textContent = t('xp', { a: p.xp, b: xpNeeded(p.level) });
  $('profXp').style.width = `${Math.min(100, p.xp / xpNeeded(p.level) * 100)}%`;
  const body = $('profBody'); body.innerHTML = '';
  const sec = (k) => { const d = document.createElement('div'); d.className = 'sec'; d.textContent = t(k); body.appendChild(d); };
  // titles
  sec('title'); let box = document.createElement('div'); box.className = 'opts'; body.appendChild(box);
  TITLES.forEach((ti) => { const b = document.createElement('button'), ok = ti.ok(); b.className = `opt${p.title === ti.id ? ' on' : ''}`; b.textContent = (ok ? '' : '🔒 ') + t(ti.key); b.disabled = !ok; click(b, () => { p.title = ti.id; persist(); buildProfile(); }); box.appendChild(b); });
  // frames
  sec('frame'); box = document.createElement('div'); box.className = 'opts'; body.appendChild(box);
  FRAMES.forEach((f) => { const b = document.createElement('button'), ok = p.level >= f.lvl; b.className = `opt fr${p.frame === f.id ? ' on' : ''}`; b.style.background = f.css; b.title = ok ? '' : t('unlockAt', { n: f.lvl }); b.disabled = !ok; if (!ok) b.textContent = '🔒'; click(b, () => { p.frame = f.id; persist(); buildProfile(); }); box.appendChild(b); });
  // records
  sec('records');
  const fav = Object.entries(save.worldPlays || {}).sort((a, b) => b[1] - a[1])[0];
  const favW = fav ? worldById(fav[0]) : null;
  const g = document.createElement('div'); g.className = 'statgrid';
  [[t('r_levels'), st.levels], [t('r_combo'), st.bestCombo || 0], [t('r_endless'), `${st.endlessBest} m`], [t('r_streak'), `🔥 ${save.daily.best || 0}`], [t('r_chests'), `🧰 ${st.chests || 0}`], [t('r_plays'), favW ? `${favW.icon} ${tName(favW.name)}` : '—']]
    .forEach(([a, b]) => { g.innerHTML += `<span>${a}</span><b>${b}</b>`; });
  body.appendChild(g);
  // collection
  sec('collection');
  const c = document.createElement('div'); c.className = 'statgrid';
  [[t('c_balls'), `${save.owned.ball.length} / ${BALLS.length}`], [t('c_trails'), `${save.owned.trail.length} / ${TRAILS.length}`], [t('c_style'), `${save.owned.style.length} / ${STYLE.length}`], [t('c_pets'), `${save.owned.pet.length} / ${PETS.length}`], [t('c_worlds'), `${WORLDS.filter((w) => ownsWorld(w.id)).length} / ${WORLDS.length}`]]
    .forEach(([a, b]) => { c.innerHTML += `<span>${a}</span><b>${b}</b>`; });
  body.appendChild(c);
}

async function doShare(score) {
  const r = await shareText(GAME.name, t('shareText', { n: score }), GAME.storeUrl);
  if (r === 'copied') message('📋 ✔');
}

// ---------------- Complete / game over ----------------
export function showComplete(o) {
  $('completeIcon').textContent = o.boss ? '👑' : '🏆';
  $('completeTitle').textContent = o.boss ? t('bossDefeated') : t('levelComplete');
  const spans = $('starRow').children; [...spans].forEach((s) => s.classList.remove('on'));
  for (let i = 0; i < o.stars; i++) setTimeout(() => { spans[i].classList.add('on'); api.sfx.star(i); }, 400 + i * 350);
  $('completeText').innerHTML = (o.boss ? t('allDone', { n: o.earned + o.bonus }) : t('coinsGained', { n: o.earned + o.bonus, c: o.earned, t: o.collected }))
    + (o.gateMult > 1 ? `<br>🚪 ${t('gateBonus', { n: o.gateMult })}` : '') + (o.combo >= 5 ? ` · 🔥 ${t('bestComboTxt', { n: o.combo })}` : '');
  $('completeTime').textContent = `${t('time', { t: o.time })} · ${o.record ? t('newRecord') : t('best', { t: o.best })}`;
  const lastInWorld = o.lvl >= LEVELS_PER_WORLD;
  const wi = WORLDS.findIndex((w) => w.id === o.worldId), nextW = WORLDS[wi + 1];
  $('nextBtn').textContent = lastInWorld ? (nextW ? `${nextW.icon} ${tName(nextW.name)}` : t('playAgain')) : t('nextLevel');
  $('nextBtn').onclick = () => {
    api.sfx.click();
    if (!lastInWorld) return api.startLevel(o.worldId, o.lvl + 1);
    if (nextW && ownsWorld(nextW.id)) return api.startLevel(nextW.id, prog(nextW.id).unlocked);
    if (nextW) { goMenu(); selWorld = nextW.id; buildLevels(); showPanel('levelsPanel'); return; }
    api.startLevel(o.worldId, 1);
  };
  $('replayBtn').onclick = () => { api.sfx.click(); api.startLevel(o.worldId, o.lvl); };
  $('shareBtn').onclick = () => { api.sfx.click(); doShare(o.earned + o.bonus); };
  showPanel('completePanel'); rarePopups(o.rares); updateDots();
}

export function showGameOver(o) {
  $('goIcon').textContent = o.endless ? (o.isBest ? '🏅' : '♾️') : '💥';
  $('goTitle').textContent = o.endless ? t('runOver') : t('outOfLives');
  $('gameoverText').innerHTML = o.endless
    ? `${t('distance', { n: o.dist })} ${o.isBest ? '· ' + t('newBest') : ''}<br>${t('bestDist', { n: o.best })} · +${o.coins} 🪙`
    : (o.coins ? t('keepCoins', { n: o.coins }) : t('dontGiveUp'));
  const tk = $('contTicket'), cc = $('contCoins'), sk = $('skipBtn');
  tk.classList.toggle('hidden', save.items.tickets <= 0); tk.textContent = t('continueTicket', { n: save.items.tickets });
  const cost = api.continueCost(); cc.innerHTML = t('continueCoins', { n: `<span class="coin-ico"></span>${cost}` }); cc.disabled = save.coins < cost;
  sk.classList.toggle('hidden', o.endless || save.items.skip <= 0); sk.textContent = t('skipLevel', { n: save.items.skip });
  const tips = t('tips'); $('goTip').textContent = tips[Math.floor(Math.random() * tips.length)];
  showPanel('gameoverPanel'); rarePopups(o.rares);
}

// ---------------- Back button ----------------
export function backPressed() {
  if (!$('popup').classList.contains('hidden')) return closePopup();
  if (!$('spinPop').classList.contains('hidden')) { if (!spinning) $('spinPop').classList.add('hidden'); return; }
  const S = api.state;
  if (S.mode === 'playing' || S.mode === 'intro') return api.pauseGame();
  if (current === 'settingsPanel' && settingsReturn === 'pausePanel') return showPanel('pausePanel');
  if (S.mode === 'paused') return api.resumeGame();
  if (S.mode === 'tutorial' || S.mode === 'complete' || S.mode === 'gameover') return goMenu();
  if (current === 'howtoPanel') return showPanel('settingsPanel');
  if (current && current !== 'menu') { updateWallets(); updateDots(); return showPanel('menu'); }
  api.exitApp();
}

function goMenuTexts() {
  $('gameName').textContent = GAME.name.toUpperCase(); $('gameSub').textContent = GAME.subtitle.toUpperCase();
  $('menuFoot').textContent = `${t('offline')} · v${GAME.version}`;
}

// ---------------- Init ----------------
export function init(a) {
  api = a;
  applyI18n(); goMenuTexts();
  document.body.classList.toggle('big', !!save.settings.bigText);
  const tips = t('tips'); $('loadTip').textContent = tips[Math.floor(Math.random() * tips.length)];
  $('previewBox').appendChild(api.previewCanvas());

  click('playBtn', () => { const w = ownsWorld(save.lastWorld) ? save.lastWorld : 'meadow'; api.startLevel(w, prog(w).unlocked); });
  click('levelsBtn', () => { selWorld = ownsWorld(save.lastWorld) ? save.lastWorld : 'meadow'; buildLevels(); showPanel('levelsPanel'); });
  click('shopBtn', () => { buildShop(); showPanel('shopPanel'); api.previewActive(true); markSeen(); });
  click('profileBtn', () => { buildProfile(); showPanel('profilePanel'); });
  click('profShare', () => { const p = save.profile; doShareText(t('profileShare', { name: p.name || 'Player', lvl: p.level, title: t(TITLES.find((x) => x.id === p.title)?.key || 'ti_rookie'), lv: save.stats.levels, coins: save.stats.coins, run: save.stats.endlessBest })); });
  $('profName').addEventListener('change', () => { save.profile.name = $('profName').value.trim().slice(0, 16); persist(); });
  $('profName').addEventListener('pointerdown', (e) => e.stopPropagation());
  click('endlessBtn', () => { buildEndless(); showPanel('endlessPanel'); });
  click('missionsBtn', () => { buildMissions(); showPanel('missionsPanel'); });
  click('settingsBtn', () => { settingsReturn = 'menu'; buildSettings(); showPanel('settingsPanel'); });
  click('pauseSettings', () => { settingsReturn = 'pausePanel'; buildSettings(); showPanel('settingsPanel'); });
  document.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', () => {
    api.sfx.click(); updateWallets(); updateDots();
    if (current === 'settingsPanel' && settingsReturn === 'pausePanel') return showPanel('pausePanel');
    showPanel('menu');
  }));
  click('howtoBack', () => showPanel('settingsPanel'));
  document.querySelectorAll('[data-mtab]').forEach((b) => click(b, () => { mTab = b.dataset.mtab; buildMissions(); }));
  click('endlessStart', () => api.startEndless(endlessWorld || 'meadow'));
  click('pauseBtn', () => api.pauseGame());
  click('resumeBtn', () => api.resumeGame());
  click('restartBtn', () => (api.state.endless ? api.startEndless(api.state.worldId) : api.startLevel(api.state.worldId, api.state.lvl)));
  click('homeBtn', goMenu);
  click('menuBtn', goMenu);
  click('retryBtn', () => (api.state.endless ? api.startEndless(api.state.worldId) : api.startLevel(api.state.worldId, api.state.lvl)));
  click('goMenuBtn', goMenu);
  click('contTicket', () => { if (!api.continueRun(true)) message(t('notEnough')); });
  click('contCoins', () => { if (!api.continueRun(false)) message(t('notEnough')); });
  click('skipBtn', () => api.skipLevel());
  click('popupOk', closePopup);
  click('spinGo', doSpin);
  click('spinClose', () => { if (!spinning) $('spinPop').classList.add('hidden'); });
  $('tutorial').addEventListener('pointerdown', () => api.tutorialDone());
  $('jumpBtn2').addEventListener('pointerdown', (e) => { e.preventDefault(); api.jump(); });
}

export function bootDone() {
  updateWallets(); updateDots();
  setTimeout(() => {
    $('loading').classList.add('fade'); showPanel('menu');
    setTimeout(() => $('loading').classList.add('hidden'), 450);
    // Daily gift reminder on first open of the day
    if (giftAvailable() && save.stats.levels > 0) setTimeout(() => message(t('dailyGift') + ' 🎁', 2200), 800);
  }, 1100);
}
export { lang };
