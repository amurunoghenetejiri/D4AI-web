package com.d4ai.app

import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.TypedValue
import android.view.Gravity
import android.widget.LinearLayout
import android.widget.TextView
import androidx.activity.ComponentActivity

/**
 * Minimal splash — no R, no AppCompat theme (prevents open crash).
 */
class SplashActivity : ComponentActivity() {

    private val handler = Handler(Looper.getMainLooper())

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        try {
            if (android.os.Build.VERSION.SDK_INT >= 21) {
                window.statusBarColor = Color.parseColor("#050b18")
                window.navigationBarColor = Color.parseColor("#050b18")
            }
        } catch (_: Exception) { }

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(Color.parseColor("#050b18"))
            setPadding(48, 48, 48, 48)
        }

        val title = TextView(this).apply {
            text = "D4AI"
            setTextColor(Color.WHITE)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 32f)
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
        }
        val brand = TextView(this).apply {
            text = "D 4 T E C H"
            setTextColor(Color.parseColor("#8BA3C7"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
            gravity = Gravity.CENTER
            setPadding(0, 16, 0, 0)
        }
        val motto = TextView(this).apply {
            text = "Creating Solutions. Innovating Lives."
            setTextColor(Color.parseColor("#8BA3C7"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 13f)
            gravity = Gravity.CENTER
            setPadding(0, 12, 0, 0)
        }

        root.addView(title)
        root.addView(brand)
        root.addView(motto)
        setContentView(root)

        handler.postDelayed({
            try {
                startActivity(Intent(this@SplashActivity, MainActivity::class.java))
            } catch (_: Exception) { }
            try { finish() } catch (_: Exception) { }
        }, 1200)
    }

    override fun onDestroy() {
        handler.removeCallbacksAndMessages(null)
        super.onDestroy()
    }
}
