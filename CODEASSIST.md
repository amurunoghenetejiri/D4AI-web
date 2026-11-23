# Run D4AI on Code Assist

## MUST DO THIS
1. Clone / pull **D4EXAM-D4AI**
2. In Code Assist: **Open folder → select the `android` directory only**
   (path like `.../D4EXAM-D4AI/android`)
3. Wait for Gradle sync
4. Run configuration: **app**
5. Install on device

Do **not** open the repo root (it has a website `package.json` and confuses Code Assist → “Nothing to run”).

## What builds
- Module: `:app`
- applicationId: `com.d4ai`
- SplashActivity → MainActivity (loads https://d4ai-app.vercel.app/)

## If sync fails
- JDK 17
- Internet for Gradle deps
- File → Invalidate caches / re-sync Gradle
