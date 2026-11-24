# Marblo: Island Roll 🟠

A mobile 3D rolling-ball adventure built with **Three.js + Vite + Capacitor 8** (Android).

## Features
- Ball rolls by itself: **drag** to steer, **tap** / swipe up / button to jump (joystick mode in Settings); ball speed setting
- **150 levels in 25 worlds** (6 levels each, a new world every 6 levels), incl. Bangla Village, Sundarbans and Cox's Bazar; level 6 of each world is a **boss** level with meteors; levels last ~40-60 s with 3 checkpoints
- **Endless mode** with best distance
- 14 hazards: bumpers, saws, spikes, pop-up spikes, sweepers, walls with an opening, crushers, cannons, hammers, boulders, lasers, crumbling tiles, wind, meteors; jump pads and speed strips
- 10 power-ups: speed, shield, magnet, double jump, slow-mo, ghost, x2 coins, super star, fly, coin rain
- Coin combos, hidden treasure chest in every level, x2 / x3 / x5 bonus gates at the finish, 3 lives, stars, best times, continue tickets, help after 3 failures, hints in the first levels
- Shop: 60 balls (10 legendary, 8 rare), 25 worlds, 25 trails, 30 style items (eyes, hats, glasses, wings/cape/jetpack), 12 pets, 8 upgrades, Legend Pack, daily gift, lucky spin, mystery box, daily offer, live 3D preview
- Profile: name, XP & level, titles, frames, records, collection, share
- 5 daily missions, 69 achievements, statistics
- Full settings and **English / বাংলা**; generated music for every world (faster on boss levels); haptics; Android back button; auto-pause; far-away track hidden for speed

## Project layout
| Path | What |
| --- | --- |
| `src/` | Game code: `main.js` (game loop & physics), `ui.js` (menus), `levels.js` (level generator), `world.js` (3D worlds), `catalog.js` (shop items), `progress.js` (missions, gifts), `i18n.js` (English/Bangla), `skins.js`, `effects.js`, `audio.js` |
| `src/config.js` | **Game name, version, privacy URL** – change branding here |
| `android/` | Native Android project (icons, splash, signing, version code) |
| `assets/` | Source images for the app icon & splash |
| `store/` | Play Store graphics, screenshots and listing text |
| `docs/` | Privacy policy (served by GitHub Pages) |
| `codemagic.yaml` | Cloud build: signed **AAB** (Play Store) + **APK** (phone) |

## Build on Codemagic (phone only)
1. codemagic.io → this repo → **Start new build**.
2. First time: workflow **Android Release (quick, creates new key)**. Download the `.apk` to test, and **save** `marblo-upload-key.jks` + `KEYSTORE-INFO.txt` safely.
3. Upload the `.jks` in Codemagic → Team settings → codemagic.yaml settings → Code signing identities → Android keystores, reference name **`ball_keystore`**.
4. From then on use **Android Release (signed with ball_keystore)**. Upload the `.aab` to Google Play.

## Local development (computer with Node 22)
```bash
npm install
npm run dev            # play in the browser
npm run build && npx cap sync android
```
Regenerate icons after changing `assets/`: `npx @capacitor/assets generate --android`

## Play Store
See `store/listing.md` for the store texts, graphics and App-content answers.
