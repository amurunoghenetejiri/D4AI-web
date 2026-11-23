package com.d4exam.app;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.hardware.camera2.CameraManager;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.provider.Settings;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.widget.Toast;
import org.json.JSONObject;

/** JS bridge window.D4Device for D4AI phone controls. */
public class DeviceControlBridge {
    private final Activity activity;
    private boolean torchOn = false;

    public DeviceControlBridge(Activity activity) { this.activity = activity; }

    @JavascriptInterface public String ping() { return "ok"; }

    @JavascriptInterface
    public String getStatus() {
        try {
            JSONObject o = new JSONObject();
            AudioManager am = (AudioManager) activity.getSystemService(Context.AUDIO_SERVICE);
            int max = am.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
            int cur = am.getStreamVolume(AudioManager.STREAM_MUSIC);
            o.put("volumePct", max > 0 ? (int) Math.round(100.0 * cur / max) : 0);
            try {
                int b = Settings.System.getInt(activity.getContentResolver(), Settings.System.SCREEN_BRIGHTNESS);
                o.put("brightnessPct", (int) Math.round(100.0 * b / 255.0));
            } catch (Exception e) { o.put("brightnessPct", -1); }
            o.put("canWriteSettings", Settings.System.canWrite(activity));
            o.put("torch", torchOn);
            return o.toString();
        } catch (Exception e) { return "{\"error\":\"" + safe(e) + "\"}"; }
    }

    @JavascriptInterface
    public String setVolume(int percent) {
        try {
            AudioManager am = (AudioManager) activity.getSystemService(Context.AUDIO_SERVICE);
            int max = am.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
            int pct = Math.max(0, Math.min(100, percent));
            am.setStreamVolume(AudioManager.STREAM_MUSIC, (int) Math.round(max * pct / 100.0), AudioManager.FLAG_SHOW_UI);
            return "{\"ok\":true,\"volumePct\":" + pct + "}";
        } catch (Exception e) { return fail(e); }
    }

    @JavascriptInterface
    public String adjustVolume(int delta) {
        try {
            AudioManager am = (AudioManager) activity.getSystemService(Context.AUDIO_SERVICE);
            int max = am.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
            int cur = am.getStreamVolume(AudioManager.STREAM_MUSIC);
            int next = Math.max(0, Math.min(max, cur + delta));
            am.setStreamVolume(AudioManager.STREAM_MUSIC, next, AudioManager.FLAG_SHOW_UI);
            int pct = max > 0 ? (int) Math.round(100.0 * next / max) : 0;
            return "{\"ok\":true,\"volumePct\":" + pct + "}";
        } catch (Exception e) { return fail(e); }
    }

    @JavascriptInterface
    public String setBrightness(int percent) {
        try {
            int pct = Math.max(1, Math.min(100, percent));
            final int value = (int) Math.round(255 * pct / 100.0);
            final boolean can = Settings.System.canWrite(activity);
            if (can) {
                Settings.System.putInt(activity.getContentResolver(), Settings.System.SCREEN_BRIGHTNESS, value);
            } else {
                activity.runOnUiThread(() -> {
                    try {
                        Intent i = new Intent(Settings.ACTION_MANAGE_WRITE_SETTINGS);
                        i.setData(Uri.parse("package:" + activity.getPackageName()));
                        activity.startActivity(i);
                        Toast.makeText(activity, "Allow D4AI to change system settings", Toast.LENGTH_LONG).show();
                    } catch (Exception ignored) {}
                });
            }
            activity.runOnUiThread(() -> {
                WindowManager.LayoutParams lp = activity.getWindow().getAttributes();
                lp.screenBrightness = value / 255f;
                activity.getWindow().setAttributes(lp);
            });
            return "{\"ok\":true,\"brightnessPct\":" + pct + ",\"needsPermission\":" + (!can) + "}";
        } catch (Exception e) { return fail(e); }
    }

    @JavascriptInterface
    public String openApp(String nameOrPackage) {
        try {
            String q = nameOrPackage == null ? "" : nameOrPackage.trim().toLowerCase();
            PackageManager pm = activity.getPackageManager();
            String pkg = alias(q);
            if (pkg == null && q.contains(".")) pkg = q;
            if (pkg != null) {
                Intent launch = pm.getLaunchIntentForPackage(pkg);
                if (launch != null) {
                    launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    activity.startActivity(launch);
                    return "{\"ok\":true,\"package\":\"" + pkg + "\"}";
                }
            }
            for (android.content.pm.ApplicationInfo ai : pm.getInstalledApplications(0)) {
                String label = pm.getApplicationLabel(ai).toString().toLowerCase();
                if (label.contains(q)) {
                    Intent launch = pm.getLaunchIntentForPackage(ai.packageName);
                    if (launch != null) {
                        launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        activity.startActivity(launch);
                        return "{\"ok\":true,\"package\":\"" + ai.packageName + "\"}";
                    }
                }
            }
            return "{\"ok\":false,\"error\":\"App not found\"}";
        } catch (Exception e) { return fail(e); }
    }

    private String alias(String q) {
        if (q.matches(".*(whatsapp).*")) return "com.whatsapp";
        if (q.matches(".*(chrome|browser).*")) return "com.android.chrome";
        if (q.matches(".*(youtube).*")) return "com.google.android.youtube";
        if (q.matches(".*(gmail|mail).*")) return "com.google.android.gm";
        if (q.matches(".*(maps).*")) return "com.google.android.apps.maps";
        if (q.matches(".*(settings).*")) return "com.android.settings";
        if (q.matches(".*(phone|dialer).*")) return "com.android.dialer";
        if (q.matches(".*(instagram).*")) return "com.instagram.android";
        if (q.matches(".*(facebook).*")) return "com.facebook.katana";
        if (q.matches(".*(tiktok).*")) return "com.zhiliaoapp.musically";
        if (q.matches(".*(twitter|x app).*")) return "com.twitter.android";
        return null;
    }

    @JavascriptInterface
    public String openSettings(String panel) {
        try {
            String p = panel == null ? "" : panel.toLowerCase();
            String action = Settings.ACTION_SETTINGS;
            if (p.contains("wifi")) action = Settings.ACTION_WIFI_SETTINGS;
            else if (p.contains("data") || p.contains("mobile")) action = Settings.ACTION_DATA_ROAMING_SETTINGS;
            else if (p.contains("bluetooth")) action = Settings.ACTION_BLUETOOTH_SETTINGS;
            else if (p.contains("display") || p.contains("bright")) action = Settings.ACTION_DISPLAY_SETTINGS;
            else if (p.contains("sound") || p.contains("volume")) action = Settings.ACTION_SOUND_SETTINGS;
            else if (p.contains("location")) action = Settings.ACTION_LOCATION_SOURCE_SETTINGS;
            else if (p.contains("airplane") || p.contains("flight")) action = Settings.ACTION_AIRPLANE_MODE_SETTINGS;
            else if (p.contains("hotspot") || p.contains("tether")) {
                action = Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q
                    ? Settings.Panel.ACTION_INTERNET_CONNECTIVITY
                    : Settings.ACTION_WIRELESS_SETTINGS;
            }
            Intent i = new Intent(action);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            activity.startActivity(i);
            return "{\"ok\":true,\"panel\":\"" + p + "\"}";
        } catch (Exception e) { return fail(e); }
    }

    @JavascriptInterface
    public String setTorch(boolean on) {
        try {
            CameraManager cm = (CameraManager) activity.getSystemService(Context.CAMERA_SERVICE);
            String[] ids = cm.getCameraIdList();
            if (ids.length == 0) return "{\"ok\":false,\"error\":\"No camera\"}";
            cm.setTorchMode(ids[0], on);
            torchOn = on;
            return "{\"ok\":true,\"torch\":" + on + "}";
        } catch (Exception e) { return fail(e); }
    }

    @JavascriptInterface
    public String vibrate(int ms) {
        try {
            Vibrator v = (Vibrator) activity.getSystemService(Context.VIBRATOR_SERVICE);
            if (v == null) return "{\"ok\":false}";
            int d = Math.max(50, Math.min(2000, ms <= 0 ? 200 : ms));
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                v.vibrate(VibrationEffect.createOneShot(d, VibrationEffect.DEFAULT_AMPLITUDE));
            } else {
                v.vibrate(d);
            }
            return "{\"ok\":true}";
        } catch (Exception e) { return fail(e); }
    }

    private String safe(Exception e) {
        return e.getMessage() == null ? "error" : e.getMessage().replace("\"", "'");
    }
    private String fail(Exception e) { return "{\"ok\":false,\"error\":\"" + safe(e) + "\"}"; }
}
