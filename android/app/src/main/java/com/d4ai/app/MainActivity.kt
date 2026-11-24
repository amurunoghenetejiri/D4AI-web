package com.d4ai.app

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat

/**
 * Standalone D4AI shell — independent of D4EXAM (package com.d4ai.app).
 * Loads https://d4ai-app.vercel.app and exposes DeviceControlBridge as window.D4Device.
 */
class MainActivity : AppCompatActivity() {

    companion object {
        const val APP_URL = "https://d4ai-app.vercel.app/"
    }

    private lateinit var web: WebView

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { }

    @SuppressLint("SetJavaScriptEnabled", "AddJavascriptInterface")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        window.statusBarColor = Color.parseColor("#050b18")
        window.navigationBarColor = Color.parseColor("#050b18")

        requestRuntimePermissions()
        maybeRequestSpecialPermissions()

        web = WebView(this).apply {
            setBackgroundColor(Color.parseColor("#050b18"))
        }
        setContentView(web)

        web.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            loadWithOverviewMode = true
            useWideViewPort = true
            mediaPlaybackRequiresUserGesture = false
            allowFileAccess = true
            javaScriptCanOpenWindowsAutomatically = true
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
            }
        }

        try {
            web.addJavascriptInterface(DeviceControlBridge(this), "D4Device")
        } catch (_: Exception) { }

        web.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: PermissionRequest?) {
                // Grant mic/camera to WebView when user already allowed app-level perms
                try {
                    request?.grant(request.resources)
                } catch (_: Exception) {
                    request?.deny()
                }
            }
        }

        web.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean = false

            override fun onPageFinished(view: WebView?, url: String?) {
                // Mark native shell so web skips second splash / pending spinner
                try {
                    view?.evaluateJavascript(
                        "window.__D4_NATIVE__=true;window.D4Android=window.D4Android||{native:true};",
                        null
                    )
                } catch (_: Exception) { }
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                if (request?.isForMainFrame == true) {
                    view?.loadUrl("file:///android_asset/public/offline.html")
                }
            }
        }

        web.loadUrl(APP_URL)

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (::web.isInitialized && web.canGoBack()) web.goBack()
                else finish()
            }
        })
    }

    private fun requestRuntimePermissions() {
        val needed = mutableListOf<String>()
        val candidates = mutableListOf(
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.CAMERA,
            Manifest.permission.VIBRATE,
            Manifest.permission.READ_CONTACTS,
            Manifest.permission.CALL_PHONE,
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION,
            Manifest.permission.BLUETOOTH_CONNECT,
            Manifest.permission.BLUETOOTH_SCAN,
            Manifest.permission.READ_PHONE_STATE,
            Manifest.permission.SEND_SMS,
            Manifest.permission.READ_SMS,
            Manifest.permission.RECEIVE_SMS,
            Manifest.permission.READ_CALENDAR,
            Manifest.permission.WRITE_CALENDAR,
        )
        if (Build.VERSION.SDK_INT >= 33) {
            candidates.add(Manifest.permission.POST_NOTIFICATIONS)
            candidates.add(Manifest.permission.READ_MEDIA_IMAGES)
            candidates.add(Manifest.permission.READ_MEDIA_VIDEO)
            candidates.add(Manifest.permission.READ_MEDIA_AUDIO)
            candidates.add(Manifest.permission.NEARBY_WIFI_DEVICES)
        } else {
            candidates.add(Manifest.permission.READ_EXTERNAL_STORAGE)
            if (Build.VERSION.SDK_INT <= 28) {
                candidates.add(Manifest.permission.WRITE_EXTERNAL_STORAGE)
            }
        }
        if (Build.VERSION.SDK_INT >= 31) {
            candidates.add(Manifest.permission.BLUETOOTH_ADVERTISE)
        }
        for (p in candidates) {
            try {
                if (ContextCompat.checkSelfPermission(this, p) != PackageManager.PERMISSION_GRANTED) {
                    needed.add(p)
                }
            } catch (_: Exception) { }
        }
        if (needed.isNotEmpty()) {
            permissionLauncher.launch(needed.toTypedArray())
        }
    }

    private fun maybeRequestSpecialPermissions() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val prefs = getSharedPreferences("d4ai_perms", MODE_PRIVATE)
                if (!Settings.System.canWrite(this) && !prefs.getBoolean("asked_write_settings", false)) {
                    prefs.edit().putBoolean("asked_write_settings", true).apply()
                    startActivity(
                        Intent(Settings.ACTION_MANAGE_WRITE_SETTINGS).apply {
                            data = Uri.parse("package:$packageName")
                            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        }
                    )
                }
                if (!Settings.canDrawOverlays(this) && !prefs.getBoolean("asked_overlay", false)) {
                    prefs.edit().putBoolean("asked_overlay", true).apply()
                    startActivity(
                        Intent(
                            Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                            Uri.parse("package:$packageName")
                        ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    )
                }
            }
        } catch (_: Exception) { }
    }

    override fun onDestroy() {
        try { web.destroy() } catch (_: Exception) { }
        super.onDestroy()
    }
}
