'use strict';

// Challenge-specific APK source generators.
// Each module produces a REAL solvable challenge with the flag embedded in the APK.
// All code targets com.training.vulnapp — toy app only, dummy data only.

const PKG = 'com.training.vulnapp';

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED RESOURCES
// ═══════════════════════════════════════════════════════════════════════════════

function sharedStrings(title) {
  return `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">${(title || 'VulnLab').replace(/"/g, '&quot;')}</string>
</resources>`;
}

function sharedLayout() {
  return `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="24dp">
    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="@string/app_name"
        android:textSize="18sp"
        android:textStyle="bold"
        android:layout_marginBottom="16dp" />
    <EditText
        android:id="@+id/inputField"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:hint="Enter input"
        android:inputType="text"
        android:layout_marginBottom="12dp" />
    <Button
        android:id="@+id/checkButton"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Submit"
        android:layout_marginBottom="16dp" />
    <TextView
        android:id="@+id/resultText"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text=""
        android:textSize="15sp" />
</LinearLayout>`;
}

function buttonLayout(buttonLabel) {
  const label = (buttonLabel || 'Action').replace(/"/g, '&quot;');
  return `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="24dp"
    android:gravity="center_horizontal">
    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="@string/app_name"
        android:textSize="18sp"
        android:textStyle="bold"
        android:layout_marginBottom="24dp" />
    <Button
        android:id="@+id/actionButton"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="${label}"
        android:layout_marginBottom="16dp" />
    <TextView
        android:id="@+id/resultText"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text=""
        android:textSize="15sp"
        android:gravity="center" />
</LinearLayout>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. EXPORTED COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function exportedComponentVuln(flag) {
  const action = `${PKG}.ACTION_OPEN_FLAG`;
  return {
    'AndroidManifest.xml': `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${PKG}">
    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="33" />
    <application android:label="@string/app_name" android:allowBackup="false">
        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- VULNERABLE: SecretFlagActivity is exported — any app can start it -->
        <activity android:name=".SecretFlagActivity" android:exported="true">
            <intent-filter>
                <action android:name="${action}" />
                <category android:name="android.intent.category.DEFAULT" />
            </intent-filter>
        </activity>
    </application>
</manifest>`,

    'src/MainActivity.java': `package ${PKG};
import android.app.Activity;
import android.os.Bundle;
import android.widget.TextView;
public class MainActivity extends Activity {
    @Override protected void onCreate(Bundle s) {
        super.onCreate(s);
        TextView tv = new TextView(this);
        tv.setPadding(48,48,48,48); tv.setTextSize(16);
        tv.setText("VulnLab: Exported Component Challenge\\n\\n" +
            "This app has a hidden exported Activity.\\n" +
            "Find it in AndroidManifest.xml and trigger it with the correct Intent.\\n\\n" +
            "Tools: apktool, jadx, adb");
        setContentView(tv);
    }
}`,

    'src/SecretFlagActivity.java': `package ${PKG};
import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.widget.TextView;
public class SecretFlagActivity extends Activity {
    private static final String REQUIRED_ACTION = "${action}";
    private static final String REQUIRED_KEY    = "unlock";
    private static final String REQUIRED_VALUE  = "training";
    private static final String FLAG = "${flag}";

    @Override protected void onCreate(Bundle s) {
        super.onCreate(s);
        TextView tv = new TextView(this);
        tv.setPadding(48,48,48,48); tv.setTextSize(16);

        Intent intent = getIntent();
        String action  = intent != null ? intent.getAction() : null;
        String unlock  = intent != null ? intent.getStringExtra(REQUIRED_KEY) : null;

        if (REQUIRED_ACTION.equals(action) && REQUIRED_VALUE.equals(unlock)) {
            tv.setText("\\u2705 FLAG RECOVERED!\\n\\n" + FLAG + "\\n\\n" +
                "You successfully triggered the exported component\\nwith the correct Intent action and extras.");
        } else {
            tv.setText("\\u26d4 Access Denied\\n\\nWrong action or missing extras.\\n" +
                "Check AndroidManifest.xml for the correct intent-filter.");
        }
        setContentView(tv);
    }
}`,

    'res/layout/activity_main.xml': `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent" android:layout_height="match_parent">
    <TextView android:id="@+id/tv"
        android:layout_width="match_parent" android:layout_height="match_parent"
        android:padding="24dp" android:textSize="16sp" />
</LinearLayout>`,

    'res/values/strings.xml': sharedStrings('VulnLab Exported'),
  };
}

function exportedComponentPatched(flag) {
  return {
    'AndroidManifest.xml': `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${PKG}">
    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="33" />
    <application android:label="@string/app_name" android:allowBackup="false">
        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
        <!-- FIXED: exported="false" — no external app can start SecretFlagActivity -->
        <activity android:name=".SecretFlagActivity" android:exported="false" />
    </application>
</manifest>`,

    'src/MainActivity.java': `package ${PKG};
import android.app.Activity;
import android.os.Bundle;
import android.widget.TextView;
public class MainActivity extends Activity {
    @Override protected void onCreate(Bundle s) {
        super.onCreate(s);
        TextView tv = new TextView(this);
        tv.setPadding(48,48,48,48); tv.setTextSize(16);
        tv.setText("VulnLab: Exported Component — PATCHED\\n\\n" +
            "SecretFlagActivity is now android:exported=\\"false\\".\\n" +
            "External apps cannot reach it via Intent.\\n\\n" +
            "Try: adb shell am start -n ${PKG}/.SecretFlagActivity\\n" +
            "Expected result: SecurityException or silent failure.");
        setContentView(tv);
    }
}`,

    'src/SecretFlagActivity.java': `package ${PKG};
import android.app.Activity;
import android.os.Bundle;
import android.widget.TextView;
public class SecretFlagActivity extends Activity {
    @Override protected void onCreate(Bundle s) {
        super.onCreate(s);
        TextView tv = new TextView(this);
        tv.setPadding(48,48,48,48);
        tv.setText("This activity is protected (exported=false).\\nExternal apps cannot reach it.");
        setContentView(tv);
    }
}`,

    'res/layout/activity_main.xml': `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent" android:layout_height="match_parent">
    <TextView android:id="@+id/tv"
        android:layout_width="match_parent" android:layout_height="match_parent"
        android:padding="24dp" android:textSize="16sp" />
</LinearLayout>`,

    'res/values/strings.xml': sharedStrings('VulnLab Exported (Patched)'),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. HARDCODED SECRET / SECRET-DUMMY
// ═══════════════════════════════════════════════════════════════════════════════

function secretDummyVuln(flag, unlockCode) {
  return {
    'AndroidManifest.xml': `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${PKG}">
    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="33" />
    <application android:label="@string/app_name" android:allowBackup="false">
        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`,

    'src/TrainingConfig.java': `package ${PKG};
// VULNERABLE: Hardcoded unlock code embedded in APK binary.
// Discoverable with: jadx-gui app.apk → search "TrainingConfig"
// Also visible with: apktool d app.apk → smali/com/training/vulnapp/TrainingConfig.smali
public class TrainingConfig {
    // VULNERABLE: This string literal is stored in DEX bytecode
    private static final String UNLOCK_CODE = "${unlockCode}";
    public static String getUnlockCode() { return UNLOCK_CODE; }
}`,

    'src/MainActivity.java': `package ${PKG};
import android.app.Activity;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
public class MainActivity extends Activity {
    private static final String FLAG = "${flag}";

    @Override protected void onCreate(Bundle s) {
        super.onCreate(s);
        setContentView(R.layout.activity_main);
        EditText input  = (EditText)  findViewById(R.id.inputField);
        TextView result = (TextView)  findViewById(R.id.resultText);
        Button   btn    = (Button)    findViewById(R.id.checkButton);

        // Hint visible in UI: prompt tells student what to look for
        ((TextView)findViewById(R.id.hintText)).setText(
            "Find the unlock code by decompiling this APK with JADX or apktool.\\nHint: look for TrainingConfig");

        btn.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) {
                String entered = input.getText().toString().trim();
                if (TrainingConfig.getUnlockCode().equals(entered)) {
                    result.setText("\\u2705 Correct!\\n\\n" + FLAG + "\\n\\nYou found the hardcoded unlock code.");
                } else {
                    result.setText("\\u274c Wrong code. Decompile the APK to find it.");
                }
            }
        });
    }
}`,

    'res/layout/activity_main.xml': `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent" android:layout_height="match_parent"
    android:orientation="vertical" android:padding="24dp">
    <TextView android:layout_width="wrap_content" android:layout_height="wrap_content"
        android:text="@string/app_name" android:textSize="18sp" android:textStyle="bold"
        android:layout_marginBottom="8dp"/>
    <TextView android:id="@+id/hintText" android:layout_width="match_parent"
        android:layout_height="wrap_content" android:textSize="13sp"
        android:textColor="#888888" android:layout_marginBottom="16dp"/>
    <EditText android:id="@+id/inputField" android:layout_width="match_parent"
        android:layout_height="wrap_content" android:hint="Enter unlock code"
        android:inputType="text" android:layout_marginBottom="12dp"/>
    <Button android:id="@+id/checkButton" android:layout_width="wrap_content"
        android:layout_height="wrap_content" android:text="Unlock" android:layout_marginBottom="16dp"/>
    <TextView android:id="@+id/resultText" android:layout_width="wrap_content"
        android:layout_height="wrap_content" android:text="" android:textSize="15sp"/>
</LinearLayout>`,

    'res/values/strings.xml': sharedStrings('VulnLab Hardcoded Secret'),
  };
}

function secretDummyPatched() {
  return {
    'AndroidManifest.xml': `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${PKG}">
    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="33" />
    <application android:label="@string/app_name" android:allowBackup="false">
        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`,

    'src/TrainingConfig.java': `package ${PKG};
// FIXED: No hardcoded secrets. Unlock code must be verified server-side.
public class TrainingConfig {
    private TrainingConfig() {}
    // No secrets stored here. Authentication moved to backend API.
}`,

    'src/MainActivity.java': `package ${PKG};
import android.app.Activity;
import android.os.Bundle;
import android.widget.TextView;
public class MainActivity extends Activity {
    @Override protected void onCreate(Bundle s) {
        super.onCreate(s);
        TextView tv = new TextView(this);
        tv.setPadding(48,48,48,48); tv.setTextSize(15);
        tv.setText("VulnLab: Hardcoded Secret — PATCHED\\n\\n" +
            "The hardcoded unlock code has been removed from the APK.\\n" +
            "Authentication is now handled server-side.\\n\\n" +
            "Verify: open this APK in JADX and search TrainingConfig\\n" +
            "Expected: no UNLOCK_CODE field found.");
        setContentView(tv);
    }
}`,

    'res/layout/activity_main.xml': `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent" android:layout_height="match_parent">
    <TextView android:id="@+id/tv"
        android:layout_width="match_parent" android:layout_height="match_parent"
        android:padding="24dp" android:textSize="16sp" />
</LinearLayout>`,

    'res/values/strings.xml': sharedStrings('VulnLab Secret (Patched)'),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. CLEARTEXT CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

function cleartextConfigVuln(flag) {
  return {
    'AndroidManifest.xml': `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${PKG}">
    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="33" />
    <uses-permission android:name="android.permission.INTERNET"/>
    <application android:label="@string/app_name" android:allowBackup="false"
        android:networkSecurityConfig="@xml/network_security_config"
        android:usesCleartextTraffic="true">
        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`,

    'src/NetworkClient.java': `package ${PKG};
// VULNERABLE: Cleartext HTTP endpoint and flag in MOCK_RESPONSE
// Findable with: jadx app.apk → NetworkClient → BASE_URL + MOCK_RESPONSE
// Also flagged by MobSF and apktool network config analysis
public class NetworkClient {
    // VULNERABLE: HTTP (not HTTPS) endpoint
    private static final String BASE_URL = "http://training.local/api";
    // VULNERABLE: Mock response contains the flag — real server response would be similar
    private static final String MOCK_RESPONSE =
        "{\\"status\\":\\"ok\\",\\"flag\\":\\"${flag}\\",\\"endpoint\\":\\"http://training.local/api/flag\\"}";

    public static String getBaseUrl()     { return BASE_URL; }
    public static String getMockResponse(){ return MOCK_RESPONSE; }
}`,

    'src/MainActivity.java': `package ${PKG};
import android.app.Activity;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
public class MainActivity extends Activity {
    @Override protected void onCreate(Bundle s) {
        super.onCreate(s);
        setContentView(R.layout.activity_main);
        TextView result = (TextView) findViewById(R.id.resultText);
        Button   btn    = (Button)   findViewById(R.id.actionButton);
        result.setText("Press the button to fetch data from training.local\\n" +
            "(check AndroidManifest.xml and NetworkClient.java for the endpoint)");
        btn.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) {
                // Simulated network call — real call would expose plaintext traffic
                android.util.Log.d("NETWORK", "Fetching from: " + NetworkClient.getBaseUrl() + "/flag");
                android.util.Log.d("NETWORK", "Response: " + NetworkClient.getMockResponse());
                // UI does not show the flag — student must find it via static analysis
                result.setText("Request sent to: " + NetworkClient.getBaseUrl() + "\\n" +
                    "(Connection failed — no real server)\\n\\nUse JADX to inspect NetworkClient.java");
            }
        });
    }
}`,

    'res/layout/activity_main.xml': buttonLayout('Fetch from training.local'),
    'res/values/strings.xml': sharedStrings('VulnLab Cleartext'),
    'res/xml/network_security_config.xml': `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- VULNERABLE: Cleartext allowed for all domains -->
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors><certificates src="system"/></trust-anchors>
    </base-config>
    <!-- Also explicitly allows cleartext to training.local -->
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">training.local</domain>
    </domain-config>
</network-security-config>`,
  };
}

function cleartextConfigPatched() {
  return {
    'AndroidManifest.xml': `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${PKG}">
    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="33" />
    <uses-permission android:name="android.permission.INTERNET"/>
    <application android:label="@string/app_name" android:allowBackup="false"
        android:networkSecurityConfig="@xml/network_security_config">
        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`,

    'src/NetworkClient.java': `package ${PKG};
// FIXED: HTTPS endpoint, no mock response containing flag
public class NetworkClient {
    private static final String BASE_URL = "https://training.local/api";
    public static String getBaseUrl() { return BASE_URL; }
}`,

    'src/MainActivity.java': `package ${PKG};
import android.app.Activity;
import android.os.Bundle;
import android.widget.TextView;
public class MainActivity extends Activity {
    @Override protected void onCreate(Bundle s) {
        super.onCreate(s);
        TextView tv = new TextView(this);
        tv.setPadding(48,48,48,48); tv.setTextSize(15);
        tv.setText("VulnLab: Cleartext Config — PATCHED\\n\\n" +
            "Network endpoint changed from http:// to https://\\n" +
            "cleartextTrafficPermitted=false in network_security_config.xml\\n\\n" +
            "Verify: open APK in jadx → NetworkClient → BASE_URL starts with https://");
        setContentView(tv);
    }
}`,

    'res/layout/activity_main.xml': `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent" android:layout_height="match_parent">
    <TextView android:id="@+id/tv"
        android:layout_width="match_parent" android:layout_height="match_parent"
        android:padding="24dp" android:textSize="16sp" />
</LinearLayout>`,

    'res/values/strings.xml': sharedStrings('VulnLab Cleartext (Patched)'),
    'res/xml/network_security_config.xml': `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- FIXED: Cleartext disabled globally -->
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors><certificates src="system"/></trust-anchors>
    </base-config>
</network-security-config>`,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. SENSITIVE LOGS
// ═══════════════════════════════════════════════════════════════════════════════

function sensitiveLogsVuln(flag) {
  return {
    'AndroidManifest.xml': `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${PKG}">
    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="33" />
    <application android:label="@string/app_name" android:allowBackup="false">
        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`,

    'src/TrainingLogger.java': `package ${PKG};
import android.util.Log;
// VULNERABLE: Sensitive data logged with a persistent tag
// Capturable with: adb logcat -s VULNLAB
public class TrainingLogger {
    public static final String TAG = "VULNLAB";
    private static final String FLAG = "${flag}";
    private static final String TOKEN_PREFIX = "TKN-TRAINING-";

    public static void logTokenGeneration(String userId) {
        String token = TOKEN_PREFIX + Integer.toHexString(userId.hashCode()).toUpperCase();
        // VULNERABLE: Token and flag written to shared logcat buffer
        Log.d(TAG, "=== VulnLab Training Token Generation ===");
        Log.d(TAG, "user_id=" + userId);
        Log.d(TAG, "training_token=" + token);
        Log.d(TAG, "flag=" + FLAG);
        Log.d(TAG, "==========================================");
    }
}`,

    'src/MainActivity.java': `package ${PKG};
import android.app.Activity;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
public class MainActivity extends Activity {
    @Override protected void onCreate(Bundle s) {
        super.onCreate(s);
        setContentView(R.layout.activity_main);
        TextView result = (TextView) findViewById(R.id.resultText);
        Button   btn    = (Button)   findViewById(R.id.actionButton);
        result.setText("Press the button to generate a training token.\\n\\n" +
            "Watch logcat while pressing:\\n  adb logcat -s VULNLAB");
        btn.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) {
                // UI shows generic message — flag is only in logcat
                TrainingLogger.logTokenGeneration("student-001");
                result.setText("\\u2705 Training token generated.\\n\\n" +
                    "(Check logcat — the flag was logged, not shown here)\\n" +
                    "Command: adb logcat -s VULNLAB");
            }
        });
    }
}`,

    'res/layout/activity_main.xml': buttonLayout('Generate Training Token'),
    'res/values/strings.xml': sharedStrings('VulnLab Sensitive Logs'),
  };
}

function sensitiveLogsPatched() {
  return {
    'AndroidManifest.xml': `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${PKG}">
    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="33" />
    <application android:label="@string/app_name" android:allowBackup="false">
        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`,

    'src/TrainingLogger.java': `package ${PKG};
import android.util.Log;
// FIXED: No sensitive values in logs. Only action descriptions logged.
public class TrainingLogger {
    private static final String TAG = "VULNLAB";
    public static void logTokenGeneration(String userId) {
        // FIXED: Log only that the action happened — no token, no flag
        Log.d(TAG, "Token generation requested for user: [REDACTED]");
        Log.d(TAG, "Token issued successfully.");
    }
}`,

    'src/MainActivity.java': `package ${PKG};
import android.app.Activity;
import android.os.Bundle;
import android.widget.TextView;
public class MainActivity extends Activity {
    @Override protected void onCreate(Bundle s) {
        super.onCreate(s);
        TextView tv = new TextView(this);
        tv.setPadding(48,48,48,48); tv.setTextSize(15);
        tv.setText("VulnLab: Sensitive Logs — PATCHED\\n\\n" +
            "Sensitive data is no longer written to logcat.\\n" +
            "Logs contain only action descriptions, not values.\\n\\n" +
            "Verify: adb logcat -s VULNLAB\\nPress button → no flag appears.");
        setContentView(tv);
    }
}`,

    'res/layout/activity_main.xml': `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent" android:layout_height="match_parent">
    <TextView android:id="@+id/tv"
        android:layout_width="match_parent" android:layout_height="match_parent"
        android:padding="24dp" android:textSize="16sp" />
</LinearLayout>`,

    'res/values/strings.xml': sharedStrings('VulnLab Logs (Patched)'),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. INSECURE FILE PERMISSION
// ═══════════════════════════════════════════════════════════════════════════════

function filePermissionVuln(flag) {
  return {
    'AndroidManifest.xml': `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${PKG}">
    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="33" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
    <application android:label="@string/app_name" android:allowBackup="false"
        android:debuggable="true">
        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`,

    'src/MainActivity.java': `package ${PKG};
import android.app.Activity;
import android.os.Bundle;
import android.os.Environment;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import java.io.File;
import java.io.FileOutputStream;
public class MainActivity extends Activity {
    private static final String FLAG = "${flag}";

    @Override protected void onCreate(Bundle s) {
        super.onCreate(s);
        setContentView(R.layout.activity_main);
        TextView result = (TextView) findViewById(R.id.resultText);
        Button   btn    = (Button)   findViewById(R.id.actionButton);
        result.setText("Press the button to initialize device storage.\\n\\n" +
            "After pressing, check:\\n" +
            "  adb shell cat /sdcard/vulnlab/training_flag.txt\\n" +
            "or use run-as (debuggable app):\\n" +
            "  adb shell run-as ${PKG} \\\\\\n" +
            "    cat /data/data/${PKG}/files/training_flag.txt");

        btn.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) {
                writeFlags();
                result.setText("\\u2705 Storage initialized.\\n\\n" +
                    "Check external storage and internal files:\\n" +
                    "adb shell cat /sdcard/vulnlab/training_flag.txt");
            }
        });
    }

    private void writeFlags() {
        // VULNERABLE path 1: World-readable external storage
        try {
            File dir = new File(Environment.getExternalStorageDirectory(), "vulnlab");
            dir.mkdirs();
            File f = new File(dir, "training_flag.txt");
            FileOutputStream fos = new FileOutputStream(f);
            fos.write(("VulnLab Training Data\\nflag=" + FLAG + "\\n").getBytes());
            fos.close();
            android.util.Log.d("FILE", "Written to external: " + f.getAbsolutePath());
        } catch (Exception e) {
            android.util.Log.e("FILE", "External write failed: " + e.getMessage());
        }
        // VULNERABLE path 2: Internal file with MODE_WORLD_READABLE (deprecated)
        try {
            @SuppressWarnings("deprecation")
            FileOutputStream fos = openFileOutput("training_flag.txt", MODE_WORLD_READABLE);
            fos.write(("flag=" + FLAG + "\\n").getBytes());
            fos.close();
        } catch (Exception e) {
            android.util.Log.e("FILE", "Internal write: " + e.getMessage());
        }
    }
}`,

    'res/layout/activity_main.xml': buttonLayout('Initialize Storage'),
    'res/values/strings.xml': sharedStrings('VulnLab File Permission'),
  };
}

function filePermissionPatched() {
  return {
    'AndroidManifest.xml': `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${PKG}">
    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="33" />
    <application android:label="@string/app_name" android:allowBackup="false"
        android:debuggable="false">
        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`,

    'src/MainActivity.java': `package ${PKG};
import android.app.Activity;
import android.os.Bundle;
import android.widget.TextView;
import java.io.FileOutputStream;
public class MainActivity extends Activity {
    @Override protected void onCreate(Bundle s) {
        super.onCreate(s);
        // FIXED: Sensitive data uses MODE_PRIVATE in internal storage only
        try {
            FileOutputStream fos = openFileOutput("training_data.txt", MODE_PRIVATE);
            fos.write("secure data\\n".getBytes());
            fos.close();
        } catch (Exception ignored) {}
        TextView tv = new TextView(this);
        tv.setPadding(48,48,48,48); tv.setTextSize(15);
        tv.setText("VulnLab: File Permission — PATCHED\\n\\n" +
            "Sensitive files now use MODE_PRIVATE (internal storage only).\\n" +
            "No external storage write. android:debuggable=false.\\n\\n" +
            "Verify: adb shell cat /sdcard/vulnlab/training_flag.txt → not found\\n" +
            "adb shell run-as ${PKG} → fails (not debuggable)");
        setContentView(tv);
    }
}`,

    'res/layout/activity_main.xml': `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent" android:layout_height="match_parent">
    <TextView android:id="@+id/tv"
        android:layout_width="match_parent" android:layout_height="match_parent"
        android:padding="24dp" android:textSize="16sp" />
</LinearLayout>`,

    'res/values/strings.xml': sharedStrings('VulnLab File Perm (Patched)'),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 6. WEAK INPUT VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

function weakValidationVuln(flag) {
  return {
    'AndroidManifest.xml': `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${PKG}">
    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="33" />
    <application android:label="@string/app_name" android:allowBackup="false">
        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`,

    'src/ValidationGate.java': `package ${PKG};
// VULNERABLE: Overly permissive validation logic.
// The intended check is "admin" but the logic has a bypass condition.
// Find it using jadx — look at ValidationGate.isValidInput()
public class ValidationGate {
    private static final String ADMIN_CODE = "admin";

    // VULNERABLE: Accepts admin OR any input longer than 0 chars that contains only digits
    // OR any input ending in '!' — these are bypassable conditions
    public static boolean isValidInput(String input) {
        if (input == null || input.isEmpty()) return false;
        if (ADMIN_CODE.equalsIgnoreCase(input)) return true;
        // VULNERABLE: Numeric bypass — any all-digit input works
        if (input.matches("[0-9]+")) return true;
        // VULNERABLE: Exclamation bypass — any input ending in '!' works
        if (input.endsWith("!")) return true;
        return false;
    }
}`,

    'src/MainActivity.java': `package ${PKG};
import android.app.Activity;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
public class MainActivity extends Activity {
    private static final String FLAG = "${flag}";

    @Override protected void onCreate(Bundle s) {
        super.onCreate(s);
        setContentView(R.layout.activity_main);
        EditText input  = (EditText)  findViewById(R.id.inputField);
        TextView result = (TextView)  findViewById(R.id.resultText);
        Button   btn    = (Button)    findViewById(R.id.checkButton);

        ((android.widget.TextView)findViewById(R.id.hintText)).setText(
            "Decompile with JADX → find ValidationGate.isValidInput()\\n" +
            "The admin code is not the only way in.");

        btn.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) {
                String entered = input.getText().toString();
                android.util.Log.d("VALIDATION", "Input received: [" + entered + "]");
                if (ValidationGate.isValidInput(entered)) {
                    result.setText("\\u2705 Access granted!\\n\\n" + FLAG + "\\n\\n" +
                        "You found a bypass condition in ValidationGate.isValidInput()");
                } else {
                    result.setText("\\u274c Access denied.\\n\\nHint: check ValidationGate.java for bypass conditions.");
                }
            }
        });
    }
}`,

    'res/layout/activity_main.xml': `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent" android:layout_height="match_parent"
    android:orientation="vertical" android:padding="24dp">
    <TextView android:layout_width="wrap_content" android:layout_height="wrap_content"
        android:text="@string/app_name" android:textSize="18sp" android:textStyle="bold"
        android:layout_marginBottom="8dp"/>
    <TextView android:id="@+id/hintText" android:layout_width="match_parent"
        android:layout_height="wrap_content" android:textSize="13sp"
        android:textColor="#888888" android:layout_marginBottom="16dp"/>
    <EditText android:id="@+id/inputField" android:layout_width="match_parent"
        android:layout_height="wrap_content" android:hint="Enter admin code"
        android:inputType="text" android:layout_marginBottom="12dp"/>
    <Button android:id="@+id/checkButton" android:layout_width="wrap_content"
        android:layout_height="wrap_content" android:text="Submit" android:layout_marginBottom="16dp"/>
    <TextView android:id="@+id/resultText" android:layout_width="wrap_content"
        android:layout_height="wrap_content" android:text="" android:textSize="15sp"/>
</LinearLayout>`,

    'res/values/strings.xml': sharedStrings('VulnLab Input Validation'),
  };
}

function weakValidationPatched() {
  return {
    'AndroidManifest.xml': `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${PKG}">
    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="33" />
    <application android:label="@string/app_name" android:allowBackup="false">
        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`,

    'src/ValidationGate.java': `package ${PKG};
import java.util.regex.Pattern;
// FIXED: Single strict check — no bypass conditions
public class ValidationGate {
    private static final Pattern STRICT = Pattern.compile("^[a-zA-Z0-9_\\\\-]{8,32}$");
    public static boolean isValidInput(String input) {
        if (input == null || input.isEmpty()) return false;
        return STRICT.matcher(input).matches();
        // Note: actual auth is backend-side — client validation is format-only
    }
}`,

    'src/MainActivity.java': `package ${PKG};
import android.app.Activity;
import android.os.Bundle;
import android.widget.TextView;
public class MainActivity extends Activity {
    @Override protected void onCreate(Bundle s) {
        super.onCreate(s);
        TextView tv = new TextView(this);
        tv.setPadding(48,48,48,48); tv.setTextSize(15);
        tv.setText("VulnLab: Input Validation — PATCHED\\n\\n" +
            "ValidationGate.isValidInput() now has a single strict regex.\\n" +
            "No numeric bypass, no exclamation bypass.\\n\\n" +
            "Verify with JADX: ValidationGate.isValidInput() uses Pattern.matches only.");
        setContentView(tv);
    }
}`,

    'res/layout/activity_main.xml': `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent" android:layout_height="match_parent">
    <TextView android:id="@+id/tv"
        android:layout_width="match_parent" android:layout_height="match_parent"
        android:padding="24dp" android:textSize="16sp" />
</LinearLayout>`,

    'res/values/strings.xml': sharedStrings('VulnLab Validation (Patched)'),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 7. INSECURE DEBUG MODE
// ═══════════════════════════════════════════════════════════════════════════════

function debugModeVuln(flag) {
  return {
    'AndroidManifest.xml': `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${PKG}">
    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="33" />
    <!-- VULNERABLE: debuggable=true on a production app enables adb sandbox access -->
    <application android:label="@string/app_name" android:allowBackup="false"
        android:debuggable="true">
        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`,

    'src/MainActivity.java': `package ${PKG};
import android.app.Activity;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
public class MainActivity extends Activity {
    private static final String FLAG = "${flag}";
    private static final String PREF_FILE = "vulnlab_prefs";
    private static final String PREF_KEY  = "training_flag";

    @Override protected void onCreate(Bundle s) {
        super.onCreate(s);
        setContentView(R.layout.activity_main);

        // VULNERABLE: Flag stored in SharedPreferences, accessible via adb on debuggable app
        SharedPreferences prefs = getSharedPreferences(PREF_FILE, MODE_PRIVATE);
        prefs.edit().putString(PREF_KEY, FLAG).apply();

        android.util.Log.d("DEBUG_MODE", "App started in debug mode");
        android.util.Log.d("DEBUG_MODE", "SharedPreferences path: /data/data/${PKG}/shared_prefs/" + PREF_FILE + ".xml");
        android.util.Log.d("DEBUG_MODE", "Use: adb shell run-as " + "${PKG}" + " cat shared_prefs/vulnlab_prefs.xml");

        TextView result = (TextView) findViewById(R.id.resultText);
        Button   btn    = (Button)   findViewById(R.id.actionButton);
        result.setText("App running. android:debuggable=true.\\n\\n" +
            "Access the flag via adb sandbox:\\n" +
            "  adb shell run-as ${PKG}\\n" +
            "  cat /data/data/${PKG}/shared_prefs/vulnlab_prefs.xml\\n\\n" +
            "Or with JDWP debugger attach.");
        btn.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) {
                // Shows partial flag hint — full flag accessible via adb
                result.setText("Debug info:\\n" +
                    "Flag stored in SharedPreferences key: " + PREF_KEY + "\\n" +
                    "File: /data/data/${PKG}/shared_prefs/vulnlab_prefs.xml\\n" +
                    "Command: adb shell run-as ${PKG} " +
                    "cat /data/data/${PKG}/shared_prefs/vulnlab_prefs.xml");
            }
        });
    }
}`,

    'res/layout/activity_main.xml': buttonLayout('Show Debug Info'),
    'res/values/strings.xml': sharedStrings('VulnLab Debug Mode'),
  };
}

function debugModePatched() {
  return {
    'AndroidManifest.xml': `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${PKG}">
    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="33" />
    <!-- FIXED: debuggable attribute removed (defaults to false in release) -->
    <application android:label="@string/app_name" android:allowBackup="false">
        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`,

    'src/MainActivity.java': `package ${PKG};
import android.app.Activity;
import android.os.Bundle;
import android.widget.TextView;
public class MainActivity extends Activity {
    @Override protected void onCreate(Bundle s) {
        super.onCreate(s);
        TextView tv = new TextView(this);
        tv.setPadding(48,48,48,48); tv.setTextSize(15);
        tv.setText("VulnLab: Debug Mode — PATCHED\\n\\n" +
            "android:debuggable removed from manifest.\\n" +
            "SharedPreferences no longer stores the flag.\\n\\n" +
            "Verify:\\n  adb shell run-as ${PKG}\\n  → Error: unknown package\\n" +
            "(run-as requires debuggable=true)");
        setContentView(tv);
    }
}`,

    'res/layout/activity_main.xml': `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent" android:layout_height="match_parent">
    <TextView android:id="@+id/tv"
        android:layout_width="match_parent" android:layout_height="match_parent"
        android:padding="24dp" android:textSize="16sp" />
</LinearLayout>`,

    'res/values/strings.xml': sharedStrings('VulnLab Debug (Patched)'),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 8. VULNERABLE JNI NATIVE CHECK
// ═══════════════════════════════════════════════════════════════════════════════

function jniVuln(flag, nativeCode) {
  return {
    'AndroidManifest.xml': `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${PKG}">
    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="33" />
    <application android:label="@string/app_name" android:allowBackup="false">
        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`,

    'src/NativeGate.java': `package ${PKG};
// NativeGate.java — JNI wrapper class
// VULNERABLE: Native library contains a hardcoded string.
// Recoverable with: strings lib/arm64-v8a/libnativecheck.so | grep TRAINING
// Or: Ghidra / radare2 / rabin2 analysis of the .so file
public class NativeGate {
    static {
        System.loadLibrary("nativecheck");
    }
    public native boolean checkCode(String input);
}`,

    'src/MainActivity.java': `package ${PKG};
import android.app.Activity;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
public class MainActivity extends Activity {
    private static final String FLAG = "${flag}";
    private NativeGate gate;

    @Override protected void onCreate(Bundle s) {
        super.onCreate(s);
        setContentView(R.layout.activity_main);
        gate = new NativeGate();

        EditText input  = (EditText)  findViewById(R.id.inputField);
        TextView result = (TextView)  findViewById(R.id.resultText);
        Button   btn    = (Button)    findViewById(R.id.checkButton);

        ((android.widget.TextView)findViewById(R.id.hintText)).setText(
            "The unlock code is inside libnativecheck.so\\n" +
            "Extract APK → find .so → run: strings libnativecheck.so | grep TRAINING");

        btn.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) {
                String entered = input.getText().toString().trim();
                boolean ok = gate.checkCode(entered);
                android.util.Log.d("JNI", "checkCode called, result=" + ok);
                if (ok) {
                    result.setText("\\u2705 Native gate unlocked!\\n\\n" + FLAG + "\\n\\n" +
                        "You recovered the native unlock code from libnativecheck.so");
                } else {
                    result.setText("\\u274c Wrong code.\\n\\nExtract the APK and analyze the native library:\\n" +
                        "unzip vuln.apk -d extracted\\nstrings extracted/lib/arm64-v8a/libnativecheck.so | grep TRAINING");
                }
            }
        });
    }
}`,

    'res/layout/activity_main.xml': `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent" android:layout_height="match_parent"
    android:orientation="vertical" android:padding="24dp">
    <TextView android:layout_width="wrap_content" android:layout_height="wrap_content"
        android:text="@string/app_name" android:textSize="18sp" android:textStyle="bold"
        android:layout_marginBottom="8dp"/>
    <TextView android:id="@+id/hintText" android:layout_width="match_parent"
        android:layout_height="wrap_content" android:textSize="13sp"
        android:textColor="#888888" android:layout_marginBottom="16dp"/>
    <EditText android:id="@+id/inputField" android:layout_width="match_parent"
        android:layout_height="wrap_content" android:hint="Enter native unlock code"
        android:inputType="text" android:layout_marginBottom="12dp"/>
    <Button android:id="@+id/checkButton" android:layout_width="wrap_content"
        android:layout_height="wrap_content" android:text="Submit" android:layout_marginBottom="16dp"/>
    <TextView android:id="@+id/resultText" android:layout_width="wrap_content"
        android:layout_height="wrap_content" android:text="" android:textSize="15sp"/>
</LinearLayout>`,

    'res/values/strings.xml': sharedStrings('VulnLab JNI Challenge'),

    // C source — compiled to libnativecheck.so by apkBuilderService
    'jni/native-check.c': `/* native-check.c — Educational toy for com.training.vulnapp ONLY
 * WARNING: Do not copy this pattern into real applications.
 * VULNERABLE: Hardcoded native code string is extractable with strings/Ghidra.
 * Compile: aarch64-linux-android21-clang -shared -fPIC -o libnativecheck.so native-check.c
 */
#include <jni.h>
#include <string.h>

/* VULNERABLE: This string is stored in the .rodata section of the .so file.
 * Extract with: strings libnativecheck.so | grep TRAINING
 * Or: Ghidra → defined strings → search NATIVE */
static const char* NATIVE_CODE = "${nativeCode}";

JNIEXPORT jboolean JNICALL
Java_com_training_vulnapp_NativeGate_checkCode(
        JNIEnv* env, jobject obj, jstring inputStr) {
    if (inputStr == NULL) return JNI_FALSE;
    const char* input = (*env)->GetStringUTFChars(env, inputStr, NULL);
    if (input == NULL) return JNI_FALSE;
    jboolean result = (strcmp(input, NATIVE_CODE) == 0) ? JNI_TRUE : JNI_FALSE;
    (*env)->ReleaseStringUTFChars(env, inputStr, input);
    return result;
}
`,
  };
}

function jniPatched() {
  return {
    'AndroidManifest.xml': `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${PKG}">
    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="33" />
    <application android:label="@string/app_name" android:allowBackup="false">
        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`,

    'src/NativeGate.java': `package ${PKG};
// PATCHED: Native library no longer contains a recoverable secret.
// checkCode always returns false — real validation is server-side.
public class NativeGate {
    static { System.loadLibrary("nativecheck"); }
    public native boolean checkCode(String input);
}`,

    'src/MainActivity.java': `package ${PKG};
import android.app.Activity;
import android.os.Bundle;
import android.widget.TextView;
public class MainActivity extends Activity {
    @Override protected void onCreate(Bundle s) {
        super.onCreate(s);
        TextView tv = new TextView(this);
        tv.setPadding(48,48,48,48); tv.setTextSize(15);
        tv.setText("VulnLab: JNI Native Check — PATCHED\\n\\n" +
            "The hardcoded native code has been removed.\\n" +
            "The native function always returns false.\\n" +
            "Real validation must happen server-side.\\n\\n" +
            "Verify: extract APK → strings lib/arm64-v8a/libnativecheck.so\\n" +
            "Expected: no NATIVE-TRAINING string found.");
        setContentView(tv);
    }
}`,

    'res/layout/activity_main.xml': `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent" android:layout_height="match_parent">
    <TextView android:id="@+id/tv"
        android:layout_width="match_parent" android:layout_height="match_parent"
        android:padding="24dp" android:textSize="16sp" />
</LinearLayout>`,

    'res/values/strings.xml': sharedStrings('VulnLab JNI (Patched)'),

    'jni/native-check.c': `/* native-check.c — PATCHED version
 * No hardcoded secret. Function always returns false (server validates).
 */
#include <jni.h>
JNIEXPORT jboolean JNICALL
Java_com_training_vulnapp_NativeGate_checkCode(
        JNIEnv* env, jobject obj, jstring inputStr) {
    (void)env; (void)obj; (void)inputStr;
    return JNI_FALSE; /* always reject — server-side validation required */
}
`,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════════

function getChallengeFiles(moduleId, fixMode, flag, challengeConfig) {
  const cfg = challengeConfig || {};
  switch (moduleId) {
    case 'exported-component':
      return fixMode ? exportedComponentPatched(flag) : exportedComponentVuln(flag);
    case 'secret-dummy':
      return fixMode ? secretDummyPatched() : secretDummyVuln(flag, cfg.unlockCode || 'BLUE-TRAINING-000');
    case 'cleartext-config':
      return fixMode ? cleartextConfigPatched() : cleartextConfigVuln(flag);
    case 'sensitive-logs':
      return fixMode ? sensitiveLogsPatched() : sensitiveLogsVuln(flag);
    case 'insecure-file-permission':
      return fixMode ? filePermissionPatched() : filePermissionVuln(flag);
    case 'weak-input-validation':
      return fixMode ? weakValidationPatched() : weakValidationVuln(flag);
    case 'insecure-debug-mode':
      return fixMode ? debugModePatched() : debugModeVuln(flag);
    case 'vulnerable-jni-native-check':
      return fixMode ? jniPatched() : jniVuln(flag, cfg.nativeCode || 'NATIVE-TRAINING-000');
    default:
      throw new Error(`No challenge template for module: ${moduleId}`);
  }
}

module.exports = { getChallengeFiles };
