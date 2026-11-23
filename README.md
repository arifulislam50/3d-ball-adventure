# Marblo: Island Roll 🟠

A mobile 3D rolling-ball adventure built with **Three.js + Vite + Capacitor 8** (Android).

## Features
- Ball rolls by itself: **drag** to steer, **tap** / swipe up / button to jump (joystick mode in Settings)
- **120 levels in 10 worlds** (Meadow, Desert, Ice, Neon City, Candy, Ocean, Volcano, Cherry, Magic Forest, Space); level 12 of each world is a **boss** level with meteors
- **Endless mode** with best distance
- Obstacles: bumpers, spikes, hammers, boulders, lasers, crumbling tiles, wind, meteors; jump pads and speed strips
- Power-ups: speed, shield, magnet, double jump, slow-mo, ghost, x2 coins
- 3 lives, checkpoints, 1-3 stars, best times, continue tickets
- Shop: 33 balls (5 rare), worlds, 13 trails, eyes/hats/glasses, pets, upgrades, daily gift, lucky spin, mystery box, daily offer
- Daily missions, 25 achievements, statistics
- Full settings (sound volumes, vibration, controls, sensitivity, difficulty, graphics, FPS, camera, battery saver, big text…) and **English / বাংলা**
- Synthesized music per world, haptics, Android back button, auto-pause

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
