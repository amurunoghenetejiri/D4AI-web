# FORCE INSTALL (Code Assist still says Update)

Android only shows **Update** when a package with the SAME id is already on the phone.

This build uses a brand-new package that was never installed before:

- **applicationId:** `com.d4tech.d4ai.run1124`
- **versionCode:** 1
- **App name:** D4AI

## Do this EXACTLY

### 1) Uninstall EVERY old D4AI / D4EXAM app
Phone → Settings → Apps → show all apps → uninstall anything named:
- D4AI
- D4EXAM
- D4 Exam
- any similar name

Also check **Work profile** / **Dual apps** / **Clone apps** and remove those too.

### 2) Pull latest code in Code Assist
Make sure the repo is updated (applicationId must be `com.d4tech.d4ai.run1124`).

### 3) Clean + rebuild
In Code Assist:
1. Close the project
2. Re-open the **android** folder
3. Sync Gradle
4. Build → Rebuild / Clean if available
5. Run ▶

You should see **Install**, not Update.

### 4) If it STILL says Update
That means an old package is still on the device. Try:
1. Settings → Apps → filter by "all" or "disabled"
2. Search "d4" or "exam"
3. Uninstall all matches
4. Restart phone
5. Run again from Code Assist

After a successful install, open the app drawer and look for **D4AI**.
