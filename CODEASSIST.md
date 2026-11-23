# D4AI - Code Assist

## Fix "Opened for editing only / no modules"

1. Close the project completely
2. Pull latest from GitHub (gradle-wrapper.jar was missing before)
3. In Code Assist: File -> Open
4. Select the folder named **android** (inside D4EXAM-D4AI)
5. When you see the yellow "Gradle compatibility mode" bar, tap the **checkmark / Re-sync** button
6. Wait until sync finishes - the **app** module should appear
7. Tap Run (green triangle)

If still no module:
- File -> Invalidate Caches -> Restart
- Open **android** again
- Tap the refresh icon on the yellow banner

## Features
- Transparent D4AI app icon
- Settings with 10 voices (tap to preview, select to use)
- Device control bridge
- Conversation memory
