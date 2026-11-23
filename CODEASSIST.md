# Run D4AI in Code Assist / Android Studio

## Recommended (works best)
1. **Open the `android` folder** as the project (not the whole Git repo root).
2. Wait for Gradle sync.
3. Select module **app** → Run.

- **App name:** D4AI  
- **applicationId:** `com.d4ai`  
- **Splash:** native `SplashActivity` (neon logo + progress) → `MainActivity` (loads https://d4ai-app.vercel.app/)

## Kotlin sources
- `android/app/src/main/java/com/d4exam/app/SplashActivity.kt`
- `android/app/src/main/java/com/d4exam/app/MainActivity.kt`

Java helpers (bridge / services) can stay alongside Kotlin in the same package.
