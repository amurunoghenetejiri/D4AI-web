package com.d4ai.app

import android.animation.ObjectAnimator
import android.animation.ValueAnimator
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.animation.AccelerateDecelerateInterpolator
import android.widget.ImageView
import android.widget.ProgressBar
import androidx.appcompat.app.AppCompatActivity

/** Native D4AI splash → MainActivity */
class SplashActivity : AppCompatActivity() {

    private val handler = Handler(Looper.getMainLooper())

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        try {
            setContentView(R.layout.activity_splash)
        } catch (_: Exception) {
            // Layout missing — go straight to main
            startActivity(Intent(this, MainActivity::class.java))
            finish()
            return
        }

        try {
            val logo = findViewById<ImageView>(R.id.logo)
            val ringOuter = findViewById<View>(R.id.ringOuter)
            val ringMid = findViewById<View>(R.id.ringMid)
            val progress = findViewById<ProgressBar>(R.id.progress)

            logo?.let {
                ObjectAnimator.ofFloat(it, View.SCALE_X, 1f, 1.06f, 1f).apply {
                    duration = 1800; repeatCount = ValueAnimator.INFINITE
                    interpolator = AccelerateDecelerateInterpolator(); start()
                }
                ObjectAnimator.ofFloat(it, View.SCALE_Y, 1f, 1.06f, 1f).apply {
                    duration = 1800; repeatCount = ValueAnimator.INFINITE
                    interpolator = AccelerateDecelerateInterpolator(); start()
                }
            }
            ringOuter?.let {
                ObjectAnimator.ofFloat(it, View.ALPHA, 0.35f, 0.85f, 0.35f).apply {
                    duration = 2000; repeatCount = ValueAnimator.INFINITE; start()
                }
            }
            ringMid?.let {
                ObjectAnimator.ofFloat(it, View.ALPHA, 0.5f, 1f, 0.5f).apply {
                    duration = 1600; repeatCount = ValueAnimator.INFINITE; start()
                }
            }
            progress?.let {
                ObjectAnimator.ofInt(it, "progress", 8, 100).apply {
                    duration = 1600
                    interpolator = AccelerateDecelerateInterpolator()
                    start()
                }
            }
        } catch (_: Exception) { }

        handler.postDelayed({
            try {
                startActivity(Intent(this, MainActivity::class.java))
                overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
            } catch (_: Exception) { }
            finish()
        }, 1700)
    }

    override fun onDestroy() {
        handler.removeCallbacksAndMessages(null)
        super.onDestroy()
    }
}
