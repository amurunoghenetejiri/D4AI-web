# D4AI — Code Assist Install (IMPORTANT)

## Why you saw "Update not installed"

The old package id conflicted with a previous install (different signature / suffix).
This build uses a **new** package id: **com.d4ai.assistant**

That forces a fresh **Install**, not Update.

## Steps (do in order)

1. On your phone: **Uninstall any old D4AI / D4EXAM** apps from Settings → Apps
2. Pull latest code in Code Assist
3. Open the **android** folder only
4. Sync Gradle
5. Run ▶ on your phone

You should see **Install** (not Update). After install, **D4AI** appears in the app drawer.

## Permissions requested

On first open the app asks for:
- Microphone
- Camera
- Notifications
- Photos (if needed)
- Display over other apps (system screen)
- Modify system settings / brightness (system screen)

## Package

- applicationId: `com.d4ai.assistant`
- App name: D4AI
- Loads: https://d4ai-app.vercel.app
