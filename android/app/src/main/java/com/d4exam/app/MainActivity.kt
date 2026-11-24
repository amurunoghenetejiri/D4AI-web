package com.d4exam.app

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
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
 * D4AI shell — loads https://d4ai-app.vercel.app
 * Requests phone-assistant permissions on launch (camera, mic, notifications, etc.)
 */
class MainActivity : AppCompatActivity() {

    companion object {
        const val APP_URL = "https://d4ai-app.vercel.app/"
    }

    private lateinit var web: WebView

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { /* results ignored — user can grant later via settings */ }

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
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
            }
        }

        try {
            web.addJavascriptInterface(DeviceControlBridge(this), "D4Device")
        } catch (_: Exception) { }

        web.webChromeClient = WebChromeClient()
        web.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean = false

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
        )
        if (Build.VERSION.SDK_INT >= 33) {
            candidates.add(Manifest.permission.POST_NOTIFICATIONS)
            candidates.add(Manifest.permission.READ_MEDIA_IMAGES)
        } else {
            candidates.add(Manifest.permission.READ_EXTERNAL_STORAGE)
        }
        if (Build.VERSION.SDK_INT >= 26) {
            // CALL_PHONE is dangerous — request only if declared
            candidates.add(Manifest.permission.CALL_PHONE)
        }
        for (p in candidates) {
            if (ContextCompat.checkSelfPermission(this, p) != PackageManager.PERMISSION_GRANTED) {
                needed.add(p)
            }
        }
        if (needed.isNotEmpty()) {
            permissionLauncher.launch(needed.toTypedArray())
        }
    }

    /** Opens system screens for WRITE_SETTINGS and SYSTEM_ALERT_WINDOW (overlay). */
    private fun maybeRequestSpecialPermissions() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (!Settings.System.canWrite(this)) {
                    // User must grant from system UI — bridge can open this again
                    val intent = Intent(Settings.ACTION_MANAGE_WRITE_SETTINGS).apply {
                        data = Uri.parse("package:$packageName")
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    // Don't auto-open every launch — only if never asked
                    val prefs = getSharedPreferences("d4ai_perms", MODE_PRIVATE)
                    if (!prefs.getBoolean("asked_write_settings", false)) {
                        prefs.edit().putBoolean("asked_write_settings", true).apply()
                        startActivity(intent)
                    }
                }
                if (!Settings.canDrawOverlays(this)) {
                    val prefs = getSharedPreferences("d4ai_perms", MODE_PRIVATE)
                    if (!prefs.getBoolean("asked_overlay", false)) {
                        prefs.edit().putBoolean("asked_overlay", true).apply()
                        val intent = Intent(
                            Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                            Uri.parse("package:$packageName")
                        ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        startActivity(intent)
                    }
                }
            }
        } catch (_: Exception) { }
    }

    override fun onDestroy() {
        try {
            web.destroy()
        } catch (_: Exception) { }
        super.onDestroy()
    }
}
