package com.d4exam.app

import android.annotation.SuppressLint
import android.graphics.Color
import android.os.Bundle
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity

/**
 * D4AI shell — loads standalone D4AI web (https://d4ai-app.vercel.app).
 * Package / applicationId: com.d4ai (Play) with Java package com.d4exam.app for R.
 */
class MainActivity : AppCompatActivity() {

    companion object {
        const val APP_URL = "https://d4ai-app.vercel.app/"
    }

    private lateinit var web: WebView

    @SuppressLint("SetJavaScriptEnabled", "AddJavascriptInterface")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        window.statusBarColor = Color.parseColor("#050b18")
        window.navigationBarColor = Color.parseColor("#050b18")

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
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
                mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
            }
        }

        try {
            web.addJavascriptInterface(DeviceControlBridge(this), "D4Device")
        } catch (_: Exception) {
            /* optional bridge */
        }

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
                if (::web.isInitialized && web.canGoBack()) web.goBack() else finish()
            }
        })
    }

    override fun onDestroy() {
        if (::web.isInitialized) {
            web.destroy()
        }
        super.onDestroy()
    }
}
