# D4AI - Code Assist / Android Studio

## CRITICAL: How to open the project

You must open the **android** folder only:

1. Code Assist / Android Studio
2. **File -> Open**
3. Navigate into the repo and select the folder named **android**
4. Click OK
5. Wait for Gradle Sync (progress bar at bottom)
6. You should see module **app** in the project panel

If it still says "no module" / "Configure module":

1. Close the project
2. File -> Invalidate Caches -> Invalidate and Restart
3. Open **android** folder again
4. Click **Sync Project with Gradle Files** (elephant icon)

## Run the app

1. Connect phone (USB debugging ON) or start emulator
2. Select **app** in the run configuration dropdown
3. Press the green Run button

App name: **D4AI**
Package: com.d4ai
Loads: https://d4ai-app.vercel.app
Icon: transparent D4AI logo (no black box)

## Phone commands in chat

- volume to 60 / volume up
- set brightness to 80
- open WhatsApp / open Chrome
- turn on flashlight
- open Wi-Fi settings
- vibrate

## Memory

Conversations and facts (name, school, likes) are saved locally and restored after restart.
