package com.walkstory.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivity";
    private Handler handler = new Handler(Looper.getMainLooper());
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // 초기 Intent에서 URL 처리 (Bridge가 준비된 후)
        handler.postDelayed(new Runnable() {
            @Override
            public void run() {
                handleIntent(getIntent());
            }
        }, 500);
    }
    
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        
        // 새로운 Intent에서 URL 처리 (앱이 이미 실행 중일 때)
        handleIntent(intent);
    }
    
    private void handleIntent(Intent intent) {
        if (intent == null) {
            return;
        }
        
        Uri data = intent.getData();
        if (data != null) {
            String scheme = data.getScheme();
            String host = data.getHost();
            
            Log.d(TAG, "Received intent with scheme: " + scheme + ", host: " + host);
            
            // walkstory://oauth URL 처리
            if ("walkstory".equals(scheme) && "oauth".equals(host)) {
                String fullUrl = data.toString();
                Log.d(TAG, "OAuth callback URL: " + fullUrl);
                
                // Bridge가 준비될 때까지 대기 후 JavaScript로 URL 전달
                sendUrlToJavaScript(fullUrl);
            }
        }
    }
    
    private void sendUrlToJavaScript(String url) {
        if (bridge == null || bridge.getWebView() == null) {
            // Bridge가 아직 준비되지 않았으면 잠시 후 재시도
            handler.postDelayed(new Runnable() {
                @Override
                public void run() {
                    sendUrlToJavaScript(url);
                }
            }, 200);
            return;
        }
        
        WebView webView = bridge.getWebView();
        if (webView == null) {
            return;
        }
        
        webView.post(new Runnable() {
            @Override
            public void run() {
                // URL을 이스케이프하여 JavaScript에 안전하게 전달
                String escapedUrl = url.replace("'", "\\'").replace("\n", "\\n").replace("\r", "\\r");
                
                // JavaScript 함수 호출하여 URL 처리
                String jsCode = String.format(
                    "(function() { " +
                    "  if (typeof window.handleOAuthCallback === 'function') { " +
                    "    window.handleOAuthCallback('%s'); " +
                    "  } else { " +
                    "    console.log('OAuth callback URL received:', '%s'); " +
                    "    setTimeout(function() { " +
                    "      if (typeof window.handleOAuthCallback === 'function') { " +
                    "        window.handleOAuthCallback('%s'); " +
                    "      } else { " +
                    "        window.location.href = '%s'; " +
                    "      } " +
                    "    }, 100); " +
                    "  } " +
                    "})();",
                    escapedUrl, escapedUrl, escapedUrl, escapedUrl
                );
                
                webView.evaluateJavascript(jsCode, null);
                Log.d(TAG, "Sent OAuth callback URL to JavaScript");
            }
        });
    }
}
