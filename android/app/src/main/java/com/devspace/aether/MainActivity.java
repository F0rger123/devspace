package com.devspace.aether;

import android.annotation.SuppressLint;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

    private WebView webView;
    public static final String NOTIFICATION_CHANNEL_ID = "devspace_notifications";

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        createNotificationChannel();

        webView = new WebView(this);
        setContentView(webView);

        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        webSettings.setMediaPlaybackRequiresUserGesture(false);

        // Native Android Bridge Interface for Haptics, Notifications, and System calls
        webView.addJavascriptInterface(new AndroidNativeInterface(this), "AndroidNative");

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                // Auto-grant audio/mic permissions for Aether voice assistant
                runOnUiThread(() -> request.grant(request.getResources()));
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (url.startsWith("devspace://") || url.startsWith("intent://")) {
                    handleCustomScheme(url);
                    return true;
                }
                return false;
            }
        });

        // Handle incoming deep links on initial launch
        Intent intent = getIntent();
        String targetUrl = "https://ais-dev-3kik42vq3fw4lyryeckdeg-164818161298.us-west2.run.app";
        if (intent != null && intent.getData() != null) {
            Uri data = intent.getData();
            if ("devspace".equals(data.getScheme())) {
                String path = data.getPath() != null ? data.getPath() : "";
                targetUrl += "/#" + path;
            } else {
                targetUrl = data.toString();
            }
        }

        webView.loadUrl(targetUrl);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        if (intent != null && intent.getData() != null) {
            Uri data = intent.getData();
            if ("devspace".equals(data.getScheme())) {
                String path = data.getPath() != null ? data.getPath() : "";
                String js = "window.dispatchEvent(new CustomEvent('devspaceDeepLink', { detail: { url: '" + data.toString() + "' } }));";
                webView.evaluateJavascript(js, null);
            }
        }
    }

    private void handleCustomScheme(String url) {
        try {
            Uri uri = Uri.parse(url);
            String js = "window.dispatchEvent(new CustomEvent('devspaceDeepLink', { detail: { url: '" + url + "' } }));";
            webView.evaluateJavascript(js, null);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            CharSequence name = "DevSpace Notifications";
            String description = "Workspace and Aether proactive notifications";
            int importance = NotificationManager.IMPORTANCE_HIGH;
            NotificationChannel channel = new NotificationChannel(NOTIFICATION_CHANNEL_ID, name, importance);
            channel.setDescription(description);
            channel.enableVibration(true);

            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(channel);
            }
        }
    }

    public static class AndroidNativeInterface {
        private final Context context;

        public AndroidNativeInterface(Context context) {
            this.context = context;
        }

        @JavascriptInterface
        public void triggerHaptic(String type) {
            Vibrator v = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
            if (v != null && v.hasVibrator()) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    int effect = VibrationEffect.DEFAULT_AMPLITUDE;
                    long duration = 40;
                    if ("light".equals(type)) duration = 20;
                    else if ("heavy".equals(type)) duration = 80;
                    else if ("success".equals(type)) duration = 60;
                    v.vibrate(VibrationEffect.createOneShot(duration, effect));
                } else {
                    v.vibrate(40);
                }
            }
        }

        @JavascriptInterface
        public String getPlatformInfo() {
            return "{\"platform\":\"android\",\"versionCode\":250,\"versionName\":\"2.5.0\",\"sdk\":" + Build.VERSION.SDK_INT + "}";
        }
    }
}
