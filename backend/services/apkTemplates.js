'use strict';

const PKG = 'com.training.vulnapp';

// ─── Android Manifest ────────────────────────────────────────────────────────

function generateManifest(modules, fixMode) {
  const ids = new Set(modules.map(m => m.id));
  const isExported  = ids.has('exported-component');
  const isCleartext = ids.has('cleartext-config');
  const isDebug     = ids.has('insecure-debug-mode');

  const appAttrs = [`android:label="@string/app_name"`, `android:allowBackup="false"`];
  if (isDebug && !fixMode)  appAttrs.unshift(`android:debuggable="true"`);
  if (isCleartext && !fixMode) {
    appAttrs.push(`android:networkSecurityConfig="@xml/network_security_config"`);
    appAttrs.push(`android:usesCleartextTraffic="true"`);
  }
  if (isCleartext && fixMode) {
    appAttrs.push(`android:networkSecurityConfig="@xml/network_security_config"`);
  }

  const extraActivities = !isExported ? '' : (!fixMode
    ? `\n\n        <!-- VULNERABLE: AdminActivity exported — any app can launch it -->\n        <activity android:name=".AdminActivity" android:exported="true" />`
    : `\n\n        <!-- FIXED: AdminActivity not exported -->\n        <activity android:name=".AdminActivity" android:exported="false" />`);

  return `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${PKG}">

    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="33" />

    <application
        ${appAttrs.join('\n        ')}>

        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>${extraActivities}

    </application>
</manifest>`;
}

// ─── Resources ───────────────────────────────────────────────────────────────

function generateMainLayout() {
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

function generateStrings(appName) {
  const name = (appName || 'VulnTraining Lab').replace(/"/g, '&quot;');
  return `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">${name}</string>
</resources>`;
}

function generateNetworkConfig(fixMode) {
  return fixMode
    ? `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- FIXED: All traffic must use HTTPS -->
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
</network-security-config>`
    : `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- VULNERABLE: Allows unencrypted HTTP for all domains -->
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
</network-security-config>`;
}

// ─── Java Sources ─────────────────────────────────────────────────────────────

function generateMainActivity(modules, fixMode) {
  const ids = new Set(modules.map(m => m.id));

  // Priority order for primary demo in handleInput
  const isJni        = ids.has('vulnerable-jni-native-check');
  const isValidation = ids.has('weak-input-validation');
  const isLogs       = ids.has('sensitive-logs');
  const isSecret     = ids.has('secret-dummy');
  const isFilePerm   = ids.has('insecure-file-permission');

  let extraImports = '';
  let staticFields = '';
  let handleBody   = '';

  if (isJni) {
    if (!fixMode) {
      staticFields = `
    // VULNERABLE: Simulated hardcoded token (real version in native-lib.cpp uses strcmp)
    // Findable with: jadx app.apk | grep DUMMY  or  strings libtraining.so
    private static final String DUMMY_TOKEN = "TRAINING-DUMMY-TOKEN-2024-FAKE";

    // In the real vulnerable APK this calls JNI C++ — simulated here for compilation
    public boolean checkLicense(String input) {
        return DUMMY_TOKEN.equals(input);
    }

    // Java wrapper — this is the Frida hook point
    public boolean checkLicenseWrapper(String input) {
        android.util.Log.d("LICENSE", "checkLicenseWrapper input: " + input);
        return checkLicense(input);
    }`;
      handleBody = `
        boolean granted = checkLicenseWrapper(input);
        resultText.setText(granted ? "Access granted" : "Access denied");`;
    } else {
      staticFields = `
    // FIXED: Native code validates format only — no hardcoded secret
    public boolean checkLicenseFormat(String input) {
        if (input == null || input.length() < 10 || input.length() > 50) return false;
        for (char c : input.toCharArray()) {
            if (!Character.isLetterOrDigit(c) && c != '-') return false;
        }
        return true;
    }`;
      handleBody = `
        if (!checkLicenseFormat(input)) {
            resultText.setText("Invalid format");
            return;
        }
        // Backend verification required — stub for training lab
        resultText.setText("Format valid. Backend verification required.");`;
    }
  } else if (isValidation) {
    extraImports = '\nimport java.util.regex.Pattern;';
    if (!fixMode) {
      handleBody = `
        // VULNERABLE: SQL injection via string concatenation
        // Try input: ' OR '1'='1
        String query = "SELECT * FROM users WHERE username = '" + input + "'";
        android.util.Log.d("SQL", "Query: " + query);
        resultText.setText("Query:\\n" + query);`;
    } else {
      staticFields = `
    private static final int MAX_LEN = 32;
    private static final Pattern SAFE = Pattern.compile("^[a-zA-Z0-9_\\.\\-]+$");`;
      handleBody = `
        if (input == null || input.isEmpty()) { resultText.setText("Empty input"); return; }
        if (input.length() > MAX_LEN)         { resultText.setText("Too long"); return; }
        if (!SAFE.matcher(input).matches())    { resultText.setText("Invalid characters"); return; }
        // FIXED: parameterized query — db.rawQuery("SELECT * FROM users WHERE username=?", new String[]{input})
        resultText.setText("Input valid. Safe parameterized query would run.");`;
    }
  } else if (isLogs) {
    if (!fixMode) {
      handleBody = `
        String username = input;
        String password  = "dummy-password-training-input";
        // VULNERABLE: Sensitive data in logcat
        android.util.Log.d("LOGIN", "User: " + username);
        android.util.Log.d("LOGIN", "Password: " + password);
        String token = "FAKE-TOKEN-" + username.hashCode();
        android.util.Log.v("AUTH",  "Token: " + token);
        resultText.setText("Logged in as: " + username + "\\n(check logcat for leaked data)");`;
    } else {
      handleBody = `
        // FIXED: No sensitive values in logs
        android.util.Log.d("LOGIN", "Login attempt received");
        boolean ok = !input.isEmpty();
        android.util.Log.d("AUTH", ok ? "Authentication succeeded" : "Authentication failed");
        resultText.setText(ok ? "Welcome" : "Invalid input");`;
    }
  } else if (isSecret) {
    if (!fixMode) {
      staticFields = `
    // VULNERABLE: Hardcoded dummy credentials — extractable by jadx or apktool
    private static final String API_KEY     = "DUMMY-FAKE-KEY-1234567890ABCDEF";
    private static final String DB_PASS    = "dummy-db-password-training-9876";
    private static final String ADMIN_TOKEN = "fake-admin-token-training-only-00";`;
      handleBody = `
        android.util.Log.d("AUTH", "Connecting with key: " + API_KEY);
        resultText.setText("Key (first 12): " + API_KEY.substring(0, 12) + "...\\n(check logcat for full key)");`;
    } else {
      handleBody = `
        // FIXED: No hardcoded secrets. Key from build configuration.
        android.util.Log.d("AUTH", "Connecting to server");
        resultText.setText("Key from BuildConfig (no hardcoded secrets)");`;
    }
  } else if (isFilePerm) {
    extraImports = '\nimport java.io.FileOutputStream;';
    if (!fixMode) {
      handleBody = `
        // VULNERABLE: World-readable file — any app can read this
        try {
            @SuppressWarnings("deprecation")
            FileOutputStream fos = openFileOutput("training_data.txt", MODE_WORLD_READABLE);
            fos.write(("Data: " + input).getBytes());
            fos.close();
            android.util.Log.d("FILE", "Saved (world-readable): " + input);
            resultText.setText("Saved with MODE_WORLD_READABLE\\n(any app can read this file)");
        } catch (Exception e) {
            resultText.setText("Error: " + e.getMessage());
        }`;
    } else {
      handleBody = `
        // FIXED: MODE_PRIVATE — only this app can read the file
        try {
            FileOutputStream fos = openFileOutput("training_data.txt", MODE_PRIVATE);
            fos.write(("Data: " + input).getBytes());
            fos.close();
            android.util.Log.d("FILE", "Saved with private mode");
            resultText.setText("Saved (MODE_PRIVATE — secure)");
        } catch (Exception e) {
            resultText.setText("Write failed");
        }`;
    }
  } else {
    // Manifest-based modules (exported-component, cleartext-config, debug-mode)
    handleBody = `
        resultText.setText("Vulnerability is in AndroidManifest.xml or config.\\nDecompile with apktool to inspect.");`;
  }

  return `// MainActivity.java — VulnTraining Lab Generator
// WARNING: Educational toy. Fake data only. Do not use against real systems.
package ${PKG};

import android.app.Activity;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;${extraImports}

public class MainActivity extends Activity {
${staticFields}
    private EditText inputField;
    private TextView resultText;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        inputField = (EditText) findViewById(R.id.inputField);
        resultText = (TextView) findViewById(R.id.resultText);
        Button btn = (Button)   findViewById(R.id.checkButton);

        btn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                handleInput(inputField.getText().toString().trim());
            }
        });
    }

    private void handleInput(String input) {${handleBody}
    }
}
`;
}

function generateAdminActivity(fixMode) {
  const note = fixMode
    ? 'Admin Panel\\n(FIXED: android:exported=false — external apps cannot reach this)'
    : 'ADMIN PANEL ACCESSED\\n(VULNERABLE: android:exported=true — any app launched this!)';
  return `// AdminActivity.java — demonstrates exported component vulnerability
package ${PKG};

import android.app.Activity;
import android.os.Bundle;
import android.widget.TextView;

public class AdminActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        TextView tv = new TextView(this);
        tv.setText("${note}");
        tv.setPadding(48, 48, 48, 48);
        tv.setTextSize(16);
        setContentView(tv);
    }
}
`;
}

// ─── JNI / Native files ───────────────────────────────────────────────────────

function generateNativeLibCpp(fixMode) {
  if (!fixMode) {
    return `// native-lib.cpp (Vulnerable — educational toy only)
// WARNING: This is a toy example for com.training.vulnapp local lab only.
// Do not copy patterns from this file into real applications.
#include <jni.h>
#include <string.h>

// VULNERABLE: Hardcoded dummy token in native code
// Findable with: strings libtraining.so | grep TRAINING
// Reversible with: Ghidra, radare2, objdump
static const char* DUMMY_TOKEN = "TRAINING-DUMMY-TOKEN-2024-FAKE";

extern "C" JNIEXPORT jboolean JNICALL
Java_com_training_vulnapp_MainActivity_checkLicense(
        JNIEnv* env, jobject /* this */, jstring input) {

    const char* cstr = env->GetStringUTFChars(input, nullptr);
    if (!cstr) return JNI_FALSE;

    // VULNERABLE: strcmp against hardcoded dummy value
    // Runtime hook (Frida) can return JNI_TRUE before this line
    int match = strcmp(cstr, DUMMY_TOKEN);
    env->ReleaseStringUTFChars(input, cstr);
    return (match == 0) ? JNI_TRUE : JNI_FALSE;
}
`;
  }
  return `// native-lib.cpp (Fixed — format validation only)
// FIXED: No hardcoded secret. Native code validates format only.
// Real authorization decision happens server-side.
#include <jni.h>
#include <string>

extern "C" JNIEXPORT jboolean JNICALL
Java_com_training_vulnapp_MainActivity_checkLicenseFormat(
        JNIEnv* env, jobject /* this */, jstring input) {

    const char* cstr = env->GetStringUTFChars(input, nullptr);
    if (!cstr) return JNI_FALSE;
    std::string s(cstr);
    env->ReleaseStringUTFChars(input, cstr);

    // Only validate format: 10-50 chars, alphanumeric + dash
    if (s.length() < 10 || s.length() > 50) return JNI_FALSE;
    for (char c : s) {
        if (!isalnum((unsigned char)c) && c != '-') return JNI_FALSE;
    }
    return JNI_TRUE; // Format OK — backend must still verify the token
}
`;
}

function generateCMakeLists() {
  return `cmake_minimum_required(VERSION 3.22.1)
project("training")
add_library(training SHARED native-lib.cpp)
find_library(log-lib log)
target_link_libraries(training \${log-lib})
`;
}

function generateFridaHook() {
  return `// frida-hook-jni-demo.js
// SAFETY NOTICE: This script is ONLY for the generated local toy APK.
// Package: com.training.vulnapp — Do NOT use against real applications.
//
// Run (local lab only):
// frida -U -f com.training.vulnapp -l frida-hook-jni-demo.js

Java.perform(function() {
    console.log("[*] Frida hook loaded — toy lab demo only");
    console.log("[!] Target: com.training.vulnapp ONLY");

    var MainActivity = Java.use("com.training.vulnapp.MainActivity");

    // Hook the Java wrapper — bypasses native check entirely
    MainActivity.checkLicenseWrapper.implementation = function(input) {
        console.log("[*] checkLicenseWrapper called with: " + input);
        console.log("[*] Forcing return: true (local bypass demo)");
        return true;
    };

    console.log("[*] Hook installed. Enter any value — local check bypassed.");
    console.log("[!] A real backend check cannot be bypassed this way.");
});
`;
}

module.exports = {
  generateManifest,
  generateMainLayout,
  generateStrings,
  generateNetworkConfig,
  generateMainActivity,
  generateAdminActivity,
  generateNativeLibCpp,
  generateCMakeLists,
  generateFridaHook
};
