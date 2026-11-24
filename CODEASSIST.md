# D4AI — Run on Code Assist

## Open THIS folder only
```
D4EXAM-D4AI/android
```
Not the repo root. The root is a web project and shows “Nothing to run”.

## Steps
1. Git pull latest `main`
2. Code Assist → **Open** → choose **`android`**
3. Wait for Gradle sync (JDK 17)
4. Select run config **app**
5. Run / Install

## What you get
- Package id: `com.d4ai`
- Splash → WebView D4AI (`https://d4ai-app.vercel.app/`)
- Native TTS bridge: `D4Device.speak(text, rate, pitch)`

## If “Nothing to run”
- You opened the wrong folder (must be `android`)
- Re-sync Gradle
- Ensure `android/app/src/main/AndroidManifest.xml` has launcher activity `SplashActivity`
