# D4AI on Code Assist / Android Studio

## Run the app
1. Open the **`android`** folder as the Android project (recommended), **or** open the repo root (root `settings.gradle` includes `:app` → `android/app`).
2. Sync Gradle → select **app** → Run on a device/emulator.
3. The shell loads **https://d4ai-app.vercel.app** and exposes **`window.D4Device`** for phone controls.

## IDs
- **applicationId:** `com.d4ai`
- **Java package:** `com.d4exam.app` (`android/app/src/main/java/com/d4exam/app/`)

## Phone assistant (native bridge)
From chat, try:
- `volume up` / `volume down` / `set volume to 50`
- `set brightness to 70`
- `open WhatsApp` / `open Chrome`
- `open wifi settings` / `open data settings` / `open hotspot settings`
- `turn on flashlight` / `vibrate`

**Note:** Android does not allow third-party apps to silently toggle Wi‑Fi, mobile data, or hotspot on modern versions. D4AI opens the right Settings panel so you can switch them in one tap.

## Memory
Chats and user facts (name, school, etc.) are stored on-device (`localStorage` in the WebView) and restore after you reopen the app.
