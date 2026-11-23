# D4AI — Code Assist / Android Studio run guide

## Open the project correctly

**Important:** Open the `android/` folder (not the repo root).

1. In Code Assist / Android Studio: **File → Open**
2. Select the `android` folder inside this repo
3. Wait for Gradle Sync

If you see “Configure module” / “need module set up first”:
- Make sure you opened the **android/** directory
- Click **Sync Project with Gradle Files** (elephant icon)
- File → Invalidate Caches → Invalidate and Restart (if still broken)

## What the project contains

- `:app` module — standalone WebView shell
- Loads https://d4ai-app.vercel.app
- `DeviceControlBridge` → `window.D4Device` (volume, brightness, apps, torch, settings)
- No Capacitor / node_modules required for basic run

## Run

1. Connect a phone (USB debugging) or start an emulator
2. Select the `app` run configuration
3. Press Run ▶

## Phone commands (say them in D4AI chat)

- volume to 60 / volume up / volume down
- set brightness to 80
- open WhatsApp / open Chrome
- turn on flashlight / torch off
- open Wi-Fi settings / open data settings / open hotspot
- vibrate

## Memory

D4AI stores conversations and user facts (name, school, likes…) in localStorage.
They survive app restarts. Tell D4AI your name and preferences once — it will remember.

## Rebuild after web changes

The app loads the live site. Web UI updates appear automatically.
Native bridge changes need a new APK / Run.
