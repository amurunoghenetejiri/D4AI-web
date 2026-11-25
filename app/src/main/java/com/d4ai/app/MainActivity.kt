package com.d4ai.app

import android.Manifest
import android.annotation.SuppressLint
import android.content.pm.PackageManager
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.view.ViewGroup
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat

/**
 * Crash-hardened D4AI shell.
 * Uses ComponentActivity (no AppCompat theme requirement).
 */
class MainActivity : ComponentActivity() {

    companion object {
        const val APP_URL = "https://d4ai-app.vercel.app/"
    }

    private var web: WebView? = null

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { }

    @SuppressLint("SetJavaScriptEnabled", "AddJavascriptInterface")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                window.statusBarColor = Color.parseColor("#050b18")
                window.navigationBarColor = Color.parseColor("#050b18")
            }
        } catch (_: Exception) { }

        val root = FrameLayout(this).apply {
            setBackgroundColor(Color.parseColor("#050b18"))
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        }
        setContentView(root)

        try {
            val wv = WebView(this).apply {
                setBackgroundColor(Color.parseColor("#050b18"))
                layoutParams = FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT
                )
            }
            web = wv
            root.addView(wv)

            wv.settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                try { databaseEnabled = true } catch (_: Exception) { }
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
                wv.addJavascriptInterface(DeviceControlBridge(this), "D4Device")
            } catch (_: Exception) { }

            wv.webChromeClient = object : WebChromeClient() {
                override fun onPermissionRequest(request: PermissionRequest?) {
                    try {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                            request?.grant(request.resources)
                        }
                    } catch (_: Exception) { }
                }
            }

            wv.webViewClient = object : WebViewClient() {
                override fun onPageFinished(view: WebView?, url: String?) {
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
                        try {
                            view?.loadUrl("file:///android_asset/public/offline.html")
                        } catch (_: Exception) {
                            try {
                                view?.loadData(
                                    "<html><body style='background:#050b18;color:#fff;font-family:sans-serif;padding:24px'>" +
                                        "<h2>D4AI</h2><p>Offline. Check internet and try again.</p></body></html>",
                                    "text/html",
                                    "UTF-8"
                                )
                            } catch (_: Exception) { }
                        }
                    }
                }
            }

            try {
                wv.loadUrl(APP_URL)
            } catch (_: Exception) {
                try {
                    wv.loadData(
                        "<html><body style='background:#050b18;color:#fff;padding:24px'><h2>D4AI</h2><p>Could not load. Check network.</p></body></html>",
                        "text/html",
                        "UTF-8"
                    )
                } catch (_: Exception) { }
            }
        } catch (e: Exception) {
            // Absolute last resort — still show something instead of crash
            try {
                val fallback = android.widget.TextView(this).apply {
                    text = "D4AI\n\nWebView unavailable on this device.\n" + (e.message ?: "")
                    setTextColor(Color.WHITE)
                    setPadding(48, 48, 48, 48)
                }
                root.addView(fallback)
            } catch (_: Exception) { }
        }

        // Permissions AFTER UI is up — never block open
        try {
            root.post { requestStartupPermissions() }
        } catch (_: Exception) {
            try { requestStartupPermissions() } catch (_: Exception) { }
        }

        try {
            onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
                override fun handleOnBackPressed() {
                    val w = web
                    if (w != null && w.canGoBack()) w.goBack()
                    else finish()
                }
            })
        } catch (_: Exception) { }
    }

    private fun requestStartupPermissions() {
        try {
            val needed = mutableListOf<String>()
            if (Build.VERSION.SDK_INT >= 33) {
                if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                    != PackageManager.PERMISSION_GRANTED
                ) {
                    needed.add(Manifest.permission.POST_NOTIFICATIONS)
                }
            }
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
                != PackageManager.PERMISSION_GRANTED
            ) {
                needed.add(Manifest.permission.RECORD_AUDIO)
            }
            if (needed.isNotEmpty()) {
                permissionLauncher.launch(needed.toTypedArray())
            }
        } catch (_: Exception) { }
    }

    fun requestFeaturePermissions(feature: String) {
        try {
            val needed = mutableListOf<String>()
            when (feature.lowercase()) {
                "camera" -> needed.add(Manifest.permission.CAMERA)
                "mic", "audio", "voice" -> needed.add(Manifest.permission.RECORD_AUDIO)
                "contacts" -> needed.add(Manifest.permission.READ_CONTACTS)
                "phone", "call" -> {
                    needed.add(Manifest.permission.CALL_PHONE)
                    needed.add(Manifest.permission.READ_PHONE_STATE)
                }
                "location" -> {
                    needed.add(Manifest.permission.ACCESS_FINE_LOCATION)
                    needed.add(Manifest.permission.ACCESS_COARSE_LOCATION)
                }
                "storage", "files" -> {
                    if (Build.VERSION.SDK_INT >= 33) {
                        needed.add(Manifest.permission.READ_MEDIA_IMAGES)
                        needed.add(Manifest.permission.READ_MEDIA_VIDEO)
                        needed.add(Manifest.permission.READ_MEDIA_AUDIO)
                    } else {
                        needed.add(Manifest.permission.READ_EXTERNAL_STORAGE)
                        if (Build.VERSION.SDK_INT <= 28) {
                            needed.add(Manifest.permission.WRITE_EXTERNAL_STORAGE)
                        }
                    }
                }
                "sms" -> {
                    needed.add(Manifest.permission.SEND_SMS)
                    needed.add(Manifest.permission.READ_SMS)
                }
                "bluetooth" -> {
                    if (Build.VERSION.SDK_INT >= 31) {
                        needed.add(Manifest.permission.BLUETOOTH_CONNECT)
                        needed.add(Manifest.permission.BLUETOOTH_SCAN)
                    }
                }
                "all" -> {
                    needed.add(Manifest.permission.CAMERA)
                    needed.add(Manifest.permission.RECORD_AUDIO)
                    needed.add(Manifest.permission.READ_CONTACTS)
                    needed.add(Manifest.permission.CALL_PHONE)
                    if (Build.VERSION.SDK_INT >= 33) {
                        needed.add(Manifest.permission.POST_NOTIFICATIONS)
                        needed.add(Manifest.permission.READ_MEDIA_IMAGES)
                    }
                }
            }
            val filtered = needed.filter {
                ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
            }
            if (filtered.isNotEmpty()) {
                permissionLauncher.launch(filtered.toTypedArray())
            }
        } catch (_: Exception) { }
    }

    fun openOverlaySettings() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) {
                startActivity(
                    android.content.Intent(
                        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:$packageName")
                    ).addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
                )
            }
        } catch (_: Exception) { }
    }

    fun openWriteSettings() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.System.canWrite(this)) {
                startActivity(
                    android.content.Intent(Settings.ACTION_MANAGE_WRITE_SETTINGS).apply {
                        data = Uri.parse("package:$packageName")
                        addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                )
            }
        } catch (_: Exception) { }
    }

    override fun onDestroy() {
        try {
            web?.destroy()
        } catch (_: Exception) { }
        web = null
        super.onDestroy()
    }
}
