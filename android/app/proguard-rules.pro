# D4AI proguard rules
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keep class com.d4exam.app.DeviceControlBridge { *; }
