# Marblo: Island Roll 🟠

A mobile 3D rolling-ball adventure built with **Three.js + Vite + Capacitor 8** (Android).

## Features
- Ball rolls by itself: **drag left/right** to steer, **tap** (or swipe up) to jump. The classic joystick is still available in Settings.
- Real falling off edges and gaps, with **3 lives**, checkpoints and **1–3 star** ratings
- **24 levels**, every layout different: narrow bridges, gaps, zig-zags, ramps, moving platforms
- Obstacles: sliding bumpers, spikes, swinging hammers, rolling boulders
- Power-ups: ⚡ speed boost, 🛡️ shield, 🧲 coin magnet
- 4 worlds, changing every 3 levels: Meadow → Desert → Ice → Neon City
- Light trail, coin sparkles, jump dust, clouds, birds, waves, snow, stars
- Synthesized sound effects + music for each world (on/off)
- Ball shop with 8 skins bought with coins, level select, saved progress, vibration (on/off)
- Android back button, auto-pause when the app is in the background, low graphics mode

## Project layout
| Path | What |
| --- | --- |
| `src/` | Game code (`main.js` game loop & UI, `levels.js` level generator, `world.js` 3D world, `audio.js`, `skins.js`, `effects.js`) |
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
