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
 * Standalone D4AI shell — package com.d4ai.assistant
 * Loads the web app and exposes DeviceControlBridge as window.D4Device.
 */
class MainActivity : AppCompatActivity() {

    companion object {
        const val APP_URL = "https://d4ai-app.vercel.app/"
    }

    private lateinit var web: WebView

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { /* results ignored — features re-check when needed */ }

    @SuppressLint("SetJavaScriptEnabled", "AddJavascriptInterface")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        try {
            window.statusBarColor = Color.parseColor("#050b18")
            window.navigationBarColor = Color.parseColor("#050b18")
        } catch (_: Exception) { }

        // Notifications on open; other runtime perms when needed
        requestStartupPermissions()

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
                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                        request?.grant(request.resources)
                    }
                } catch (_: Exception) { }
            }
        }

        web.webViewClient = object : WebViewClient() {
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
                    } catch (_: Exception) { }
                }
            }
        }

        try {
            web.loadUrl(APP_URL)
        } catch (_: Exception) {
            try {
                web.loadUrl("file:///android_asset/public/offline.html")
            } catch (_: Exception) { }
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (::web.isInitialized && web.canGoBack()) web.goBack()
                else finish()
            }
        })
    }

    /** Ask notification (+ mic optional) at startup. Heavy perms requested on demand. */
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
            // Mic helps voice note immediately
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

    /** Call from bridge when a feature needs camera/contacts/storage/etc. */
    fun requestFeaturePermissions(feature: String) {
        try {
            val needed = mutableListOf<String>()
            when (feature.lowercase()) {
                "camera" -> {
                    needed.add(Manifest.permission.CAMERA)
                }
                "mic", "audio", "voice" -> {
                    needed.add(Manifest.permission.RECORD_AUDIO)
                }
                "contacts" -> {
                    needed.add(Manifest.permission.READ_CONTACTS)
                }
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
                    needed.add(Manifest.permission.ACCESS_FINE_LOCATION)
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
                    Intent(
                        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:$packageName")
                    ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                )
            }
        } catch (_: Exception) { }
    }

    fun openWriteSettings() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.System.canWrite(this)) {
                startActivity(
                    Intent(Settings.ACTION_MANAGE_WRITE_SETTINGS).apply {
                        data = Uri.parse("package:$packageName")
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                )
            }
        } catch (_: Exception) { }
    }

    override fun onDestroy() {
        try {
            if (::web.isInitialized) web.destroy()
        } catch (_: Exception) { }
        super.onDestroy()
    }
}
