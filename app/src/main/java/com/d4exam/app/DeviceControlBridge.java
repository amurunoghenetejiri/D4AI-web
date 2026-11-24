package com.d4exam.app;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.hardware.camera2.CameraAccessException;
import android.hardware.camera2.CameraManager;
import android.media.AudioManager;
import android.net.Uri;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.provider.Settings;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.widget.Toast;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.List;

/**
 * JS bridge for D4AI phone-assistant actions (WebView / Code Assist).
 * Exposed as window.D4Device from MainActivity.
 */
public class DeviceControlBridge {
    private final Activity activity;
    private boolean torchOn = false;

    public DeviceControlBridge(Activity activity) {
        this.activity = activity;
    }

    @JavascriptInterface
    public String ping() {
        return "ok";
    }

    @JavascriptInterface
    public String getStatus() {
        try {
            JSONObject o = new JSONObject();
            AudioManager am = (AudioManager) activity.getSystemService(Context.AUDIO_SERVICE);
            int max = am.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
            int cur = am.getStreamVolume(AudioManager.STREAM_MUSIC);
            o.put("volume", cur);
            o.put("volumeMax", max);
            o.put("volumePct", max > 0 ? (int) Math.round(100.0 * cur / max) : 0);
            try {
                int b = Settings.System.getInt(activity.getContentResolver(), Settings.System.SCREEN_BRIGHTNESS);
                o.put("brightness", b);
                o.put("brightnessPct", (int) Math.round(100.0 * b / 255.0));
            } catch (Exception e) {
                o.put("brightness", -1);
            }
            o.put("canWriteSettings", Settings.System.canWrite(activity));
            o.put("torch", torchOn);
            return o.toString();
        } catch (Exception e) {
            return "{\"error\":\"" + e.getMessage() + "\"}";
        }
    }

    @JavascriptInterface
    public String setVolume(int percent) {
        try {
            AudioManager am = (AudioManager) activity.getSystemService(Context.AUDIO_SERVICE);
            int max = am.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
            int pct = Math.max(0, Math.min(100, percent));
            int level = (int) Math.round(max * (pct / 100.0));
            am.setStreamVolume(AudioManager.STREAM_MUSIC, level, AudioManager.FLAG_SHOW_UI);
            return "{\"ok\":true,\"volumePct\":" + pct + "}";
        } catch (Exception e) {
            return fail(e);
        }
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
        } catch (Exception e) {
            return fail(e);
        }
    }

    @JavascriptInterface
    public String setBrightness(int percent) {
        try {
            int pct = Math.max(1, Math.min(100, percent));
            final int value = (int) Math.round(255 * (pct / 100.0));
            if (Settings.System.canWrite(activity)) {
                Settings.System.putInt(activity.getContentResolver(), Settings.System.SCREEN_BRIGHTNESS, value);
                activity.runOnUiThread(() -> {
                    WindowManager.LayoutParams lp = activity.getWindow().getAttributes();
                    lp.screenBrightness = value / 255f;
                    activity.getWindow().setAttributes(lp);
                });
                return "{\"ok\":true,\"brightnessPct\":" + pct + "}";
            }
            // Request write-settings permission then apply window-level brightness as fallback
            activity.runOnUiThread(() -> {
                try {
                    Intent i = new Intent(Settings.ACTION_MANAGE_WRITE_SETTINGS);
                    i.setData(Uri.parse("package:" + activity.getPackageName()));
                    activity.startActivity(i);
                    Toast.makeText(activity, "Allow D4AI to change system settings for brightness", Toast.LENGTH_LONG).show();
                } catch (Exception ignored) {}
                WindowManager.LayoutParams lp = activity.getWindow().getAttributes();
                lp.screenBrightness = value / 255f;
                activity.getWindow().setAttributes(lp);
            });
            return "{\"ok\":true,\"brightnessPct\":" + pct + ",\"needsPermission\":true}";
        } catch (Exception e) {
            return fail(e);
        }
    }

    @JavascriptInterface
    public String openApp(String nameOrPackage) {
        try {
            String q = (nameOrPackage == null ? "" : nameOrPackage).trim().toLowerCase();
            PackageManager pm = activity.getPackageManager();
            if (q.contains(".")) {
                Intent launch = pm.getLaunchIntentForPackage(q);
                if (launch != null) {
                    launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    activity.startActivity(launch);
                    return "{\"ok\":true,\"package\":\"" + q + "\"}";
                }
            }
            // Common aliases
            String pkg = aliasPackage(q);
            if (pkg != null) {
                Intent launch = pm.getLaunchIntentForPackage(pkg);
                if (launch != null) {
                    launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    activity.startActivity(launch);
                    return "{\"ok\":true,\"package\":\"" + pkg + "\"}";
                }
            }
            // Search installed apps by label
            List<android.content.pm.ApplicationInfo> apps = pm.getInstalledApplications(0);
            for (android.content.pm.ApplicationInfo ai : apps) {
                String label = pm.getApplicationLabel(ai).toString().toLowerCase();
                if (label.contains(q) || q.contains(label)) {
                    Intent launch = pm.getLaunchIntentForPackage(ai.packageName);
                    if (launch != null) {
                        launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        activity.startActivity(launch);
                        return "{\"ok\":true,\"package\":\"" + ai.packageName + "\",\"label\":\"" + label + "\"}";
                    }
                }
            }
            return "{\"ok\":false,\"error\":\"App not found: " + q + "\"}";
        } catch (Exception e) {
            return fail(e);
        }
    }

    private String aliasPackage(String q) {
        if (q.matches(".*(whatsapp|wa).*")) return "com.whatsapp";
        if (q.matches(".*(chrome|browser).*")) return "com.android.chrome";
        if (q.matches(".*(youtube|yt).*")) return "com.google.android.youtube";
        if (q.matches(".*(gmail|mail).*")) return "com.google.android.gm";
        if (q.matches(".*(maps|map).*")) return "com.google.android.apps.maps";
        if (q.matches(".*(camera).*")) return "com.android.camera";
        if (q.matches(".*(settings|setting).*")) return "com.android.settings";
        if (q.matches(".*(phone|dialer|call).*")) return "com.android.dialer";
        if (q.matches(".*(messages|sms|message).*")) return "com.google.android.apps.messaging";
        if (q.matches(".*(gallery|photos|photo).*")) return "com.google.android.apps.photos";
        if (q.matches(".*(play store|playstore).*")) return "com.android.vending";
        if (q.matches(".*(facebook|fb).*")) return "com.facebook.katana";
        if (q.matches(".*(instagram|ig).*")) return "com.instagram.android";
        if (q.matches(".*(twitter|x app).*")) return "com.twitter.android";
        if (q.matches(".*(tiktok).*")) return "com.zhiliaoapp.musically";
        return null;
    }

    @JavascriptInterface
    public String openSettings(String panel) {
        try {
            String action = Settings.ACTION_SETTINGS;
            String p = (panel == null ? "" : panel).toLowerCase();
            if (p.contains("wifi") || p.contains("wi-fi")) action = Settings.ACTION_WIFI_SETTINGS;
            else if (p.contains("data") || p.contains("mobile") || p.contains("network")) action = Settings.ACTION_DATA_ROAMING_SETTINGS;
            else if (p.contains("bluetooth") || p.contains("bt")) action = Settings.ACTION_BLUETOOTH_SETTINGS;
            else if (p.contains("display") || p.contains("bright")) action = Settings.ACTION_DISPLAY_SETTINGS;
            else if (p.contains("sound") || p.contains("volume")) action = Settings.ACTION_SOUND_SETTINGS;
            else if (p.contains("location") || p.contains("gps")) action = Settings.ACTION_LOCATION_SOURCE_SETTINGS;
            else if (p.contains("airplane") || p.contains("flight")) action = Settings.ACTION_AIRPLANE_MODE_SETTINGS;
            else if (p.contains("hotspot") || p.contains("tether")) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    action = Settings.Panel.ACTION_INTERNET_CONNECTIVITY;
                } else {
                    action = Settings.ACTION_WIRELESS_SETTINGS;
                }
            }
            Intent i = new Intent(action);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            activity.startActivity(i);
            return "{\"ok\":true,\"panel\":\"" + p + "\"}";
        } catch (Exception e) {
            return fail(e);
        }
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
        } catch (CameraAccessException e) {
            return fail(e);
        } catch (Exception e) {
            return fail(e);
        }
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
        } catch (Exception e) {
            return fail(e);
        }
    }

    @JavascriptInterface
    public String listApps(int limit) {
        try {
            PackageManager pm = activity.getPackageManager();
            JSONArray arr = new JSONArray();
            int n = 0;
            int max = Math.max(5, Math.min(80, limit <= 0 ? 30 : limit));
            for (android.content.pm.ApplicationInfo ai : pm.getInstalledApplications(0)) {
                if (pm.getLaunchIntentForPackage(ai.packageName) == null) continue;
                JSONObject o = new JSONObject();
                o.put("label", pm.getApplicationLabel(ai).toString());
                o.put("package", ai.packageName);
                arr.put(o);
                if (++n >= max) break;
            }
            return arr.toString();
        } catch (Exception e) {
            return "[]";
        }
    }

    private String fail(Exception e) {
        String m = e.getMessage() == null ? "error" : e.getMessage().replace("\"", "'");
        return "{\"ok\":false,\"error\":\"" + m + "\"}";
    }
}
