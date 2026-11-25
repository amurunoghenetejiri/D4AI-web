package com.d4ai.app

import android.animation.ObjectAnimator
import android.animation.ValueAnimator
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.animation.AccelerateDecelerateInterpolator
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

/**
 * Programmatic splash — no R.layout / R.id (avoids Code Assist unresolved R).
 */
class SplashActivity : AppCompatActivity() {

    private val handler = Handler(Looper.getMainLooper())

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        try {
            window.statusBarColor = Color.parseColor("#050b18")
            window.navigationBarColor = Color.parseColor("#050b18")
        } catch (_: Exception) { }

        val bg = Color.parseColor("#050b18")
        val cyan = Color.parseColor("#22d3ee")
        val muted = Color.parseColor("#8BA3C7")

        val root = FrameLayout(this).apply {
            setBackgroundColor(bg)
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        }

        val col = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.WRAP_CONTENT,
                Gravity.CENTER
            )
        }

        val dp = resources.displayMetrics.density
        fun d(v: Int) = (v * dp).toInt()

        // Outer glow ring
        val ringOuter = View(this).apply {
            layoutParams = LinearLayout.LayoutParams(d(160), d(160)).apply {
                gravity = Gravity.CENTER_HORIZONTAL
            }
            background = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setStroke(d(2), Color.parseColor("#5522d3ee"))
                setColor(Color.TRANSPARENT)
            }
            alpha = 0.4f
        }

        val logoWrap = FrameLayout(this).apply {
            layoutParams = LinearLayout.LayoutParams(d(140), d(140)).apply {
                gravity = Gravity.CENTER_HORIZONTAL
                topMargin = -d(150)
            }
        }

        val logo = ImageView(this).apply {
            layoutParams = FrameLayout.LayoutParams(d(110), d(110), Gravity.CENTER)
            scaleType = ImageView.ScaleType.FIT_CENTER
            try {
                // Prefer drawable logo if present
                val id = resources.getIdentifier("d4ai_logo", "drawable", packageName)
                if (id != 0) setImageResource(id)
                else {
                    val mid = resources.getIdentifier("ic_launcher", "mipmap", packageName)
                    if (mid != 0) setImageResource(mid)
                }
            } catch (_: Exception) { }
        }

        logoWrap.addView(logo)

        val title = TextView(this).apply {
            text = "D4AI"
            setTextColor(Color.WHITE)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 28f)
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { topMargin = d(12); gravity = Gravity.CENTER_HORIZONTAL }
        }

        val brand = TextView(this).apply {
            text = "D 4 T E C H"
            setTextColor(muted)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 11f)
            letterSpacing = 0.25f
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { topMargin = d(6); gravity = Gravity.CENTER_HORIZONTAL }
        }

        val motto = TextView(this).apply {
            text = "Creating Solutions. Innovating Lives."
            setTextColor(muted)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { topMargin = d(8); gravity = Gravity.CENTER_HORIZONTAL }
        }

        val progress = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal).apply {
            max = 100
            progress = 10
            layoutParams = LinearLayout.LayoutParams(d(120), d(4)).apply {
                topMargin = d(28)
                gravity = Gravity.CENTER_HORIZONTAL
            }
        }

        // Stack: ring space then content
        val stack = FrameLayout(this).apply {
            layoutParams = LinearLayout.LayoutParams(d(160), d(160)).apply {
                gravity = Gravity.CENTER_HORIZONTAL
            }
        }
        stack.addView(ringOuter, FrameLayout.LayoutParams(d(160), d(160), Gravity.CENTER))
        stack.addView(logoWrap.apply {
            layoutParams = FrameLayout.LayoutParams(d(140), d(140), Gravity.CENTER)
        })

        col.addView(stack)
        col.addView(title)
        col.addView(brand)
        col.addView(motto)
        col.addView(progress)
        root.addView(col)
        setContentView(root)

        try {
            ObjectAnimator.ofFloat(logo, View.SCALE_X, 1f, 1.06f, 1f).apply {
                duration = 1800; repeatCount = ValueAnimator.INFINITE
                interpolator = AccelerateDecelerateInterpolator(); start()
            }
            ObjectAnimator.ofFloat(logo, View.SCALE_Y, 1f, 1.06f, 1f).apply {
                duration = 1800; repeatCount = ValueAnimator.INFINITE
                interpolator = AccelerateDecelerateInterpolator(); start()
            }
            ObjectAnimator.ofFloat(ringOuter, View.ALPHA, 0.35f, 0.85f, 0.35f).apply {
                duration = 2000; repeatCount = ValueAnimator.INFINITE; start()
            }
            ObjectAnimator.ofInt(progress, "progress", 8, 100).apply {
                duration = 1600
                interpolator = AccelerateDecelerateInterpolator()
                start()
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
