package com.moranjianghu.game;

import android.content.pm.ApplicationInfo;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.os.Bundle;
import android.webkit.WebView;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private void configureWindowSurface() {
        getWindow().setBackgroundDrawable(new ColorDrawable(Color.BLACK));
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().setNavigationBarColor(Color.BLACK);
        getWindow().getDecorView().setBackgroundColor(Color.BLACK);
    }

    private void applyImmersiveMode() {
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        WindowInsetsControllerCompat controller =
            WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        if (controller == null) {
            return;
        }

        controller.setSystemBarsBehavior(
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        );
        controller.hide(WindowInsetsCompat.Type.systemBars());
    }

    private boolean isAppDebuggable() {
        return (getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0;
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        WebView.setWebContentsDebuggingEnabled(isAppDebuggable());
        registerPlugin(ApkUpdaterPlugin.class);
        registerPlugin(NativeChatStreamerPlugin.class);
        registerPlugin(SaveLoadDebugLoggerPlugin.class);
        super.onCreate(savedInstanceState);
        configureWindowSurface();
        applyImmersiveMode();
    }

    @Override
    public void onResume() {
        super.onResume();
        configureWindowSurface();
        applyImmersiveMode();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            applyImmersiveMode();
        }
    }
}
