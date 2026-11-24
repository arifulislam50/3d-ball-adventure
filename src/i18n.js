// English / Bangla text. t('key', {n: 5}) replaces {n}.
import { save } from './storage.js';

const S = {
  en: {
    play: 'PLAY', levels: 'LEVELS', shop: 'SHOP', settings: 'SETTINGS', endless: 'ENDLESS', missions: 'MISSIONS',
    back: '◀ BACK', offline: '3D OFFLINE GAME', paused: 'PAUSED', resume: 'RESUME', restart: 'RESTART LEVEL', mainMenu: 'MAIN MENU',
    levelComplete: 'LEVEL COMPLETE!', bossDefeated: 'BOSS DEFEATED!', nextLevel: 'NEXT LEVEL', playAgain: 'PLAY AGAIN', share: '📤 SHARE',
    outOfLives: 'OUT OF LIVES', tryAgain: 'TRY AGAIN', dontGiveUp: "Don't give up!", keepCoins: 'You keep {n} coins.',
    continueTicket: '🎟️ CONTINUE ({n} left)', continueCoins: 'CONTINUE · {n}', skipLevel: '⏭️ SKIP LEVEL ({n})',
    level: 'LEVEL {n}', bossLevel: '👑 BOSS LEVEL', lv: 'LV', checkpoint: '🚩 CHECKPOINT', livesLeft: '{n} LIVES LEFT', lastLife: 'LAST LIFE!',
    shieldSaved: '🛡️ SHIELD SAVED YOU!', newRecord: '🏅 NEW RECORD!', time: 'Time {t}s', best: 'Best {t}s',
    coinsGained: '+{n} coins ({c}/{t} collected)', allDone: 'World complete! +{n} coins',
    tapStart: 'Tap to start', tutSteer: '<b>Drag left / right</b> to steer', tutJump: '<b>Tap</b> to jump',
    p_speed: '⚡ SPEED', p_shield: '🛡️ SHIELD', p_magnet: '🧲 MAGNET', p_double: '🪽 DOUBLE JUMP', p_slow: '🐢 SLOW-MO', p_ghost: '👻 GHOST', p_x2: '✖️2 COINS',
    // levels
    world: 'WORLD', locked: 'LOCKED', buyWorld: 'Unlock {w}', boss: 'BOSS',
    // shop
    t_balls: 'BALLS', t_worlds: 'WORLDS', t_trails: 'TRAILS', t_style: 'STYLE', t_upgrades: 'UPGRADES', t_special: 'SPECIAL',
    equip: 'EQUIP', equipped: 'EQUIPPED', remove: 'REMOVE', owned: 'OWNED', max: 'MAX', rare: 'RARE', offer: '🔥 TODAY\'S OFFER', offerEnds: 'ends in {t}', new: 'NEW',
    notEnough: 'Not enough coins', bought: 'Unlocked!', eyes: 'Eyes', hats: 'Hats', face: 'Face', pets: 'Pets',
    u_shield: '🛡️ Shield time', u_magnet: '🧲 Magnet power', u_speed: '⚡ Speed boost time', u_lives: '❤️ Extra life', u_coinValue: '🪙 Coin value',
    dailyGift: '🎁 DAILY GIFT', claim: 'CLAIM', claimed: 'CLAIMED', dayN: 'Day {n}', comeBack: 'Come back tomorrow!',
    spin: '🎡 LUCKY SPIN', spinFree: 'FREE SPIN', spinCost: 'SPIN · {n}', mystery: '📦 MYSTERY BOX', tickets: '🎟️ Continue tickets ×3', startShield: '🛡️ Start shield ×3', skipTicket: '⏭️ Level skip', youHave: 'You have {n}',
    youWon: 'YOU WON!', ok: 'OK', reward: 'REWARD', rareHow: 'How to get: {h}',
    rare_boss1: 'Beat any boss', rare_boss5: 'Beat 5 bosses', rare_streak7: '7-day gift streak', rare_star: '3 stars on 30 levels', rare_endless: 'Endless 2000 m',
    // endless
    endlessTitle: 'ENDLESS RUN', bestDist: 'Best: {n} m', chooseWorld: 'Choose a world', start: 'START', distance: '{n} m', newBest: '🏅 NEW BEST!', runOver: 'RUN OVER',
    // missions
    t_daily: 'DAILY', t_achieve: 'ACHIEVEMENTS', resetIn: 'New missions in {t}',
    m_coins: 'Collect {n} coins', m_levels: 'Complete {n} levels', m_jumps: 'Jump {n} times', m_power: 'Pick up {n} power-ups', m_nodeath: 'Finish {n} levels without losing a life', m_endless: 'Run {n} m in Endless', m_stars3: 'Get 3 stars {n} times',
    a_coins: 'Collect {n} coins in total', a_levels: 'Complete {n} levels', a_stars: 'Get 3 stars on {n} levels', a_bosses: 'Defeat {n} bosses', a_endless: 'Run {n} m in Endless', a_jumps: 'Jump {n} times', a_worlds: 'Own {n} worlds', a_balls: 'Own {n} balls', a_streak: 'Daily gift streak of {n}', a_nodeath: '{n} perfect levels (no life lost)',
    // settings
    s_sound: 'SOUND', s_controls: 'CONTROLS', s_graphics: 'GRAPHICS', s_language: 'LANGUAGE', s_more: 'MORE ▾', s_less: 'LESS ▴',
    music: '🎵 Music', sfx: '🔊 Sound effects', musicVol: 'Music volume', sfxVol: 'Effects volume', vibe: '📳 Vibration', vibeStrength: 'Vibration strength',
    controls: '🎮 Controls', sens: 'Drag sensitivity', jumpBy: 'Jump with', difficultyLbl: '🎯 Difficulty', quality: '✨ Graphics', fps: 'Frame rate', camera: '🎥 Camera', language: '🌐 Language',
    shadows: 'Shadows', trailFx: 'Ball trail', particles: 'Sparkles & particles', shake: 'Screen shake', showFps: 'Show FPS', battery: '🔋 Battery saver', bigText: 'Bigger text',
    stats: '📊 STATISTICS', st_time: 'Play time', st_coins: 'Coins collected', st_jumps: 'Jumps', st_falls: 'Falls', st_levels: 'Levels completed', st_bosses: 'Bosses defeated', st_endless: 'Best endless run',
    howTo: '❓ How to play', tutorialAgain: '🔁 Show tutorial again', rate: '⭐ Rate the game', shareGame: '📤 Share with friends', contact: '✉️ Report a problem', privacy: '🔒 Privacy policy',
    resetProgress: '⚠️ Reset progress', resetConfirm: 'Tap again to ERASE everything', resetDone: 'Progress reset', credits: 'Made by Ariful Islam · v{v}',
    on: 'ON', off: 'OFF', drag: 'DRAG', joystick: 'JOYSTICK', tap: 'TAP', swipe: 'SWIPE', button: 'BUTTON', easy: 'EASY', normal: 'NORMAL', hard: 'HARD',
    low: 'LOW', medium: 'MEDIUM', high: 'HIGH', auto: 'AUTO', near: 'NEAR', far: 'FAR', light: 'LIGHT', strong: 'STRONG',
    howToText: '<p>🟠 The ball rolls by itself. <b>Drag</b> left/right to steer, <b>tap</b> or swipe up to jump.</p><p>🪙 Collect coins and the 💎 gem at the end. More coins = more ⭐ stars.</p><p>🚩 Checkpoints save your place. You have ❤️ 3 lives.</p><p>⚡ Speed · 🛡️ Shield · 🧲 Magnet · 🪽 Double jump · 🐢 Slow-mo · 👻 Ghost · ✖️2 Coins · 🌟 Super star · 🎈 Fly · 🪙 Coin rain</p><p>🔥 Grab coins quickly for a COMBO. 🧰 Each level hides one treasure chest up high. 🚪 Roll through ×2 / ×3 / ×5 gates at the finish.</p><p>🟢 Jump pads launch you high. 🟡 Arrows give a speed boost.</p><p>⚠️ Watch out: bumpers, saws, spikes, sweepers, walls, crushers, cannons, hammers, boulders, lasers, crumbling tiles, wind and meteors (boss levels).</p><p>🛒 Spend coins on balls, worlds, trails, hats, pets and upgrades.</p>',
    tips: ['Tip: a Shield blocks one hit, even a meteor!', 'Tip: tap with a second finger to jump while steering.', 'Tip: 3 stars need 80% of coins and no lives lost.', 'Tip: Lasers turn off and on, wait or jump over them.', 'Tip: Crumbling tiles fall soon after you touch them. Keep moving!', 'Tip: Upgrades make power-ups last longer.', 'Tip: The daily gift gets bigger every day in a row.', 'Tip: In space you can jump much higher.', 'Tip: Pets collect coins near them for you.'],
    helpShield: '🛡️ A free shield to help you!', levelUp: '⭐ PROFILE LEVEL {n}!', combo: '🔥 COMBO ×{n}', chestFound: '🧰 TREASURE! +{n}',
    hintJump: '👆 TAP TO JUMP!', hintDodge: '↔️ DRAG TO DODGE!', hintPower: '⭐ GRAB THE POWER-UP!',
    p_star: '🌟 SUPER STAR', p_fly: '🎈 FLY', p_coinrain: '🪙 COIN RAIN',
    u_double: '🪽 Double jump time', u_combo: '🔥 Combo window', u_freeShield: '🛡️ Free shield every level',
    a_trails: 'Own {n} trails', a_pets: 'Own {n} pets', a_chests: 'Find {n} treasure chests', a_combo: 'Reach a {n} coin combo', a_plevel: 'Reach profile level {n}', a_power: 'Pick up {n} power-ups',
    m_combo: 'Reach a {n} coin combo', m_chest: 'Find {n} treasure chests', m_boss: 'Defeat {n} boss',
    rare_chests: 'Find 20 treasure chests', rare_level20: 'Reach profile level 20', rare_combo: 'Reach a 30 coin combo',
    slow: 'SLOW', fast: 'FAST', ballSpeed: '⚡ Ball speed', backSlot: 'Back', legendary: 'LEGENDARY',
    legendPack: '🏆 LEGEND PACK', legendPackSub: 'Aurora ball + Comet trail + Golden Dragon pet',
    gateBonus: 'Bonus gate ×{n}!', bestComboTxt: 'Best combo: {n}',
    profile: 'PROFILE', yourName: 'Your name', namePh: 'Type your name', title: 'Title', frame: 'Frame', xp: 'XP {a} / {b}',
    records: '🏅 RECORDS', collection: '🎒 COLLECTION', r_combo: 'Best combo', r_endless: 'Best endless run', r_streak: 'Longest daily streak', r_chests: 'Chests found', r_levels: 'Levels completed', r_plays: 'Favourite world',
    c_balls: 'Balls', c_trails: 'Trails', c_style: 'Style items', c_pets: 'Pets', c_worlds: 'Worlds', shareProfile: '📤 SHARE PROFILE', locked: 'LOCKED', unlockAt: 'Level {n}',
    ti_rookie: 'New Roller', ti_roller: 'Island Roller', ti_coinking: 'Coin King', ti_jumper: 'Sky Jumper', ti_hunter: 'Boss Hunter', ti_runner: 'Endless Runner', ti_explorer: 'World Explorer', ti_collector: 'Collector', ti_treasure: 'Treasure Hunter', ti_legend: 'Legend',
    profileShare: '🟠 {name} · LV {lvl} · {title} — {lv} levels, {coins} coins, best run {run} m in Marblo: Island Roll!',
    loading: 'Loading…',
    shareText: 'I am playing Marblo: Island Roll! 🟠 Can you beat my score of {n}?',
  },
  bn: {
    play: 'খেলুন', levels: 'লেভেল', shop: 'দোকান', settings: 'সেটিংস', endless: 'অসীম দৌড়', missions: 'মিশন',
    back: '◀ ফিরে যান', offline: '৩ডি অফলাইন গেম', paused: 'থামানো আছে', resume: 'চালিয়ে যান', restart: 'আবার শুরু', mainMenu: 'মূল মেনু',
    levelComplete: 'লেভেল শেষ!', bossDefeated: 'বস হেরে গেছে!', nextLevel: 'পরের লেভেল', playAgain: 'আবার খেলুন', share: '📤 শেয়ার',
    outOfLives: 'জীবন শেষ', tryAgain: 'আবার চেষ্টা', dontGiveUp: 'হাল ছাড়বেন না!', keepCoins: '{n}টা কয়েন আপনার থাকছে।',
    continueTicket: '🎟️ চালিয়ে যান ({n}টা আছে)', continueCoins: 'চালিয়ে যান · {n}', skipLevel: '⏭️ লেভেল বাদ দিন ({n})',
    level: 'লেভেল {n}', bossLevel: '👑 বস লেভেল', lv: 'লেভেল', checkpoint: '🚩 চেকপয়েন্ট', livesLeft: '{n}টা জীবন বাকি', lastLife: 'শেষ জীবন!',
    shieldSaved: '🛡️ শিল্ড বাঁচিয়ে দিল!', newRecord: '🏅 নতুন রেকর্ড!', time: 'সময় {t} সে.', best: 'সেরা {t} সে.',
    coinsGained: '+{n} কয়েন ({c}/{t} ধরেছেন)', allDone: 'জগৎ শেষ! +{n} কয়েন',
    tapStart: 'শুরু করতে ট্যাপ করুন', tutSteer: '<b>আঙুল ডানে-বামে টানুন</b> বল সরাতে', tutJump: '<b>ট্যাপ করুন</b> লাফ দিতে',
    p_speed: '⚡ গতি', p_shield: '🛡️ শিল্ড', p_magnet: '🧲 চুম্বক', p_double: '🪽 ডাবল লাফ', p_slow: '🐢 ধীর গতি', p_ghost: '👻 ভূত', p_x2: '✖️২ কয়েন',
    world: 'জগৎ', locked: 'বন্ধ', buyWorld: '{w} খুলুন', boss: 'বস',
    t_balls: 'বল', t_worlds: 'জগৎ', t_trails: 'লেজ', t_style: 'সাজ', t_upgrades: 'আপগ্রেড', t_special: 'বিশেষ',
    equip: 'লাগান', equipped: 'লাগানো', remove: 'খুলুন', owned: 'কেনা', max: 'সর্বোচ্চ', rare: 'দুর্লভ', offer: '🔥 আজকের অফার', offerEnds: 'শেষ হবে {t}', new: 'নতুন',
    notEnough: 'যথেষ্ট কয়েন নেই', bought: 'খুলে গেছে!', eyes: 'চোখ', hats: 'টুপি', face: 'মুখ', pets: 'পোষা প্রাণী',
    u_shield: '🛡️ শিল্ডের সময়', u_magnet: '🧲 চুম্বকের শক্তি', u_speed: '⚡ গতির সময়', u_lives: '❤️ বাড়তি জীবন', u_coinValue: '🪙 কয়েনের মান',
    dailyGift: '🎁 দৈনিক উপহার', claim: 'নিন', claimed: 'নেওয়া হয়েছে', dayN: 'দিন {n}', comeBack: 'কাল আবার আসুন!',
    spin: '🎡 লাকি স্পিন', spinFree: 'ফ্রি স্পিন', spinCost: 'স্পিন · {n}', mystery: '📦 রহস্য বাক্স', tickets: '🎟️ চালিয়ে যাওয়ার টিকিট ×৩', startShield: '🛡️ শুরুতে শিল্ড ×৩', skipTicket: '⏭️ লেভেল বাদের টিকিট', youHave: 'আছে {n}টা',
    youWon: 'আপনি জিতেছেন!', ok: 'ঠিক আছে', reward: 'পুরস্কার', rareHow: 'কীভাবে পাবেন: {h}',
    rare_boss1: 'যেকোনো বস হারান', rare_boss5: '৫টা বস হারান', rare_streak7: 'টানা ৭ দিন উপহার নিন', rare_star: '৩০টা লেভেলে ৩ স্টার', rare_endless: 'অসীম দৌড়ে ২০০০ মি.',
    endlessTitle: 'অসীম দৌড়', bestDist: 'সেরা: {n} মি.', chooseWorld: 'একটা জগৎ বাছুন', start: 'শুরু', distance: '{n} মি.', newBest: '🏅 নতুন সেরা!', runOver: 'দৌড় শেষ',
    t_daily: 'দৈনিক', t_achieve: 'অর্জন', resetIn: 'নতুন মিশন {t} পরে',
    m_coins: '{n}টা কয়েন ধরুন', m_levels: '{n}টা লেভেল শেষ করুন', m_jumps: '{n} বার লাফ দিন', m_power: '{n}টা পাওয়ার-আপ নিন', m_nodeath: 'জীবন না হারিয়ে {n}টা লেভেল শেষ করুন', m_endless: 'অসীম দৌড়ে {n} মি. যান', m_stars3: '{n} বার ৩ স্টার পান',
    a_coins: 'মোট {n}টা কয়েন ধরুন', a_levels: '{n}টা লেভেল শেষ করুন', a_stars: '{n}টা লেভেলে ৩ স্টার', a_bosses: '{n}টা বস হারান', a_endless: 'অসীম দৌড়ে {n} মি.', a_jumps: '{n} বার লাফ দিন', a_worlds: '{n}টা জগতের মালিক হন', a_balls: '{n}টা বলের মালিক হন', a_streak: 'টানা {n} দিন উপহার', a_nodeath: '{n}টা নিখুঁত লেভেল',
    s_sound: 'শব্দ', s_controls: 'কন্ট্রোল', s_graphics: 'গ্রাফিক্স', s_language: 'ভাষা', s_more: 'আরো ▾', s_less: 'কম ▴',
    music: '🎵 মিউজিক', sfx: '🔊 সাউন্ড ইফেক্ট', musicVol: 'মিউজিকের ভলিউম', sfxVol: 'ইফেক্টের ভলিউম', vibe: '📳 ভাইব্রেশন', vibeStrength: 'ভাইব্রেশনের জোর',
    controls: '🎮 কন্ট্রোল', sens: 'টানার সংবেদনশীলতা', jumpBy: 'লাফ দেবেন', difficultyLbl: '🎯 কঠিনতা', quality: '✨ গ্রাফিক্স', fps: 'ফ্রেম রেট', camera: '🎥 ক্যামেরা', language: '🌐 ভাষা',
    shadows: 'ছায়া', trailFx: 'বলের লেজ', particles: 'ঝিকমিক ও পার্টিকেল', shake: 'স্ক্রিন কাঁপা', showFps: 'FPS দেখান', battery: '🔋 ব্যাটারি সেভার', bigText: 'বড় লেখা',
    stats: '📊 পরিসংখ্যান', st_time: 'খেলার সময়', st_coins: 'মোট কয়েন', st_jumps: 'লাফ', st_falls: 'পড়ে যাওয়া', st_levels: 'শেষ করা লেভেল', st_bosses: 'হারানো বস', st_endless: 'সেরা অসীম দৌড়',
    howTo: '❓ কীভাবে খেলবেন', tutorialAgain: '🔁 টিউটোরিয়াল আবার দেখুন', rate: '⭐ রেটিং দিন', shareGame: '📤 বন্ধুদের সাথে শেয়ার', contact: '✉️ সমস্যা জানান', privacy: '🔒 প্রাইভেসি পলিসি',
    resetProgress: '⚠️ সব প্রগ্রেস মুছুন', resetConfirm: 'সব মুছতে আবার ট্যাপ করুন', resetDone: 'প্রগ্রেস মুছে ফেলা হয়েছে', credits: 'বানিয়েছেন আরিফুল ইসলাম · v{v}',
    on: 'চালু', off: 'বন্ধ', drag: 'টানা', joystick: 'জয়স্টিক', tap: 'ট্যাপ', swipe: 'সোয়াইপ', button: 'বাটন', easy: 'সহজ', normal: 'সাধারণ', hard: 'কঠিন',
    low: 'কম', medium: 'মাঝারি', high: 'বেশি', auto: 'অটো', near: 'কাছে', far: 'দূরে', light: 'হালকা', strong: 'জোরে',
    howToText: '<p>🟠 বল নিজেই গড়ায়। আঙুল <b>ডানে-বামে টানুন</b>, লাফ দিতে <b>ট্যাপ</b> করুন বা উপরে সোয়াইপ করুন।</p><p>🪙 কয়েন আর শেষে 💎 রত্ন ধরুন। বেশি কয়েন = বেশি ⭐ স্টার।</p><p>🚩 চেকপয়েন্ট আপনার জায়গা সেভ করে। ❤️ ৩টা জীবন আছে।</p><p>⚡ গতি · 🛡️ শিল্ড · 🧲 চুম্বক · 🪽 ডাবল লাফ · 🐢 ধীর গতি · 👻 ভূত · ✖️২ কয়েন · 🌟 সুপার স্টার · 🎈 উড়ে যাওয়া · 🪙 কয়েন বৃষ্টি</p><p>🔥 দ্রুত পরপর কয়েন ধরলে কম্বো। 🧰 প্রতি লেভেলে উঁচুতে একটা গুপ্তধনের সিন্দুক লুকানো। 🚪 শেষে ×২ / ×৩ / ×৫ গেটের ভেতর দিয়ে যান।</p><p>🟢 জাম্প প্যাড অনেক উঁচুতে ছুড়ে দেয়। 🟡 তীর চিহ্নে গতি বাড়ে।</p><p>⚠️ সাবধান: বাম্পার, করাত, কাঁটা, ঘুরন্ত দণ্ড, দেয়াল, চাপা দেওয়া ব্লক, কামান, হাতুড়ি, পাথর, লেজার, ভাঙা টাইল, বাতাস আর উল্কা (বস লেভেলে)।</p><p>🛒 কয়েন দিয়ে বল, জগৎ, লেজ, টুপি, পোষা প্রাণী আর আপগ্রেড কিনুন।</p>',
    tips: ['টিপস: শিল্ড একটা আঘাত আটকায়, উল্কাও!', 'টিপস: বল সরানোর সময় অন্য আঙুলে ট্যাপ করে লাফ দিন।', 'টিপস: ৩ স্টারের জন্য ৮০% কয়েন আর কোনো জীবন না হারানো লাগবে।', 'টিপস: লেজার জ্বলে-নেভে, অপেক্ষা করুন বা লাফিয়ে পার হন।', 'টিপস: ভাঙা টাইল ছোঁয়ার একটু পরেই পড়ে যায়, থামবেন না!', 'টিপস: আপগ্রেড করলে পাওয়ার-আপ বেশিক্ষণ থাকে।', 'টিপস: টানা প্রতিদিন উপহার নিলে উপহার বড় হয়।', 'টিপস: মহাকাশে অনেক উঁচুতে লাফানো যায়।', 'টিপস: পোষা প্রাণী আশেপাশের কয়েন এনে দেয়।'],
    helpShield: '🛡️ সাহায্যের জন্য একটা ফ্রি শিল্ড!', levelUp: '⭐ প্রোফাইল লেভেল {n}!', combo: '🔥 কম্বো ×{n}', chestFound: '🧰 গুপ্তধন! +{n}',
    hintJump: '👆 লাফ দিতে ট্যাপ করুন!', hintDodge: '↔️ টেনে সরে যান!', hintPower: '⭐ পাওয়ার-আপটা নিন!',
    p_star: '🌟 সুপার স্টার', p_fly: '🎈 উড়ে যাওয়া', p_coinrain: '🪙 কয়েন বৃষ্টি',
    u_double: '🪽 ডাবল লাফের সময়', u_combo: '🔥 কম্বোর সময়', u_freeShield: '🛡️ প্রতি লেভেলে ফ্রি শিল্ড',
    a_trails: '{n}টা লেজের মালিক হন', a_pets: '{n}টা পোষা প্রাণীর মালিক হন', a_chests: '{n}টা গুপ্তধনের সিন্দুক খুঁজুন', a_combo: '{n} কয়েনের কম্বো করুন', a_plevel: 'প্রোফাইল লেভেল {n}-এ পৌঁছান', a_power: '{n}টা পাওয়ার-আপ নিন',
    m_combo: '{n} কয়েনের কম্বো করুন', m_chest: '{n}টা গুপ্তধনের সিন্দুক খুঁজুন', m_boss: '{n}টা বস হারান',
    rare_chests: '২০টা গুপ্তধনের সিন্দুক খুঁজুন', rare_level20: 'প্রোফাইল লেভেল ২০', rare_combo: '৩০ কয়েনের কম্বো',
    slow: 'ধীর', fast: 'দ্রুত', ballSpeed: '⚡ বলের গতি', backSlot: 'পিঠে', legendary: 'লেজেন্ডারি',
    legendPack: '🏆 লেজেন্ড প্যাক', legendPackSub: 'অরোরা বল + ধূমকেতু লেজ + সোনালি ড্রাগন',
    gateBonus: 'বোনাস গেট ×{n}!', bestComboTxt: 'সেরা কম্বো: {n}',
    profile: 'প্রোফাইল', yourName: 'আপনার নাম', namePh: 'নাম লিখুন', title: 'উপাধি', frame: 'ফ্রেম', xp: 'XP {a} / {b}',
    records: '🏅 রেকর্ড', collection: '🎒 সংগ্রহ', r_combo: 'সেরা কম্বো', r_endless: 'সেরা অসীম দৌড়', r_streak: 'সবচেয়ে লম্বা স্ট্রিক', r_chests: 'পাওয়া সিন্দুক', r_levels: 'শেষ করা লেভেল', r_plays: 'প্রিয় জগৎ',
    c_balls: 'বল', c_trails: 'লেজ', c_style: 'সাজ', c_pets: 'পোষা প্রাণী', c_worlds: 'জগৎ', shareProfile: '📤 প্রোফাইল শেয়ার', locked: 'বন্ধ', unlockAt: 'লেভেল {n}',
    ti_rookie: 'নতুন খেলোয়াড়', ti_roller: 'দ্বীপের গড়ানো', ti_coinking: 'কয়েন রাজা', ti_jumper: 'আকাশ লাফানো', ti_hunter: 'বস শিকারি', ti_runner: 'অসীম দৌড়বিদ', ti_explorer: 'জগৎ ভ্রমণকারী', ti_collector: 'সংগ্রাহক', ti_treasure: 'গুপ্তধন শিকারি', ti_legend: 'কিংবদন্তি',
    profileShare: '🟠 {name} · লেভেল {lvl} · {title} — Marblo: Island Roll-এ {lv}টা লেভেল, {coins} কয়েন, সেরা দৌড় {run} মি.!',
    loading: 'লোড হচ্ছে…',
    shareText: 'আমি Marblo: Island Roll খেলছি! 🟠 আমার {n} স্কোর ভাঙতে পারবেন?',
  },
};

export const lang = () => (save.settings.lang === 'bn' ? 'bn' : 'en');
export function t(key, vars = {}) {
  let s = S[lang()][key] ?? S.en[key] ?? key;
  if (typeof s === 'string') for (const k in vars) s = s.split(`{${k}}`).join(vars[k]);
  return s;
}
export const tName = (obj) => (obj && typeof obj === 'object' ? obj[lang()] || obj.en : obj);
// Translate all elements marked data-i18n="key" (and data-i18n-html for HTML strings).
export function applyI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
  document.documentElement.lang = lang();
}
