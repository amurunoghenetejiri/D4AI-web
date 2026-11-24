# Code Assist — make D4AI RUN

## Option A (best)
1. Delete the old project from Code Assist
2. Clone again: `https://github.com/amurunoghenetejiri/D4EXAM-D4AI.git`
3. After clone, **File → Open** the folder named **`android`**  
   Full path example: `.../codeassist/projects/D4EXAM-D4AI/android`
4. Wait until the yellow banner **“Opened for editing only” disappears** and Gradle finishes
5. Tap the green **▶ Run** — configuration must say **app**

## Option B
Open the whole repo if Option A fails — root `settings.gradle` also includes `:app`.

## You must see
- Module **app**
- Launcher activity **SplashActivity**
- applicationId **com.d4ai**

If you still see “Nothing to run”, the IDE never loaded Gradle. Close project → Open **android** folder only → Sync.
