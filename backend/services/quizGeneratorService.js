// Quiz question banks per module. Types: multiple-choice, true-false, short-answer, code-reading, fix-identification
const QUESTION_BANKS = {

  'exported-component': [
    { id:'ec-mc-1', type:'multiple-choice', difficulty:'beginner',
      question:'What does android:exported="true" allow for an Activity?',
      choices:['A. Encrypts activity data','B. Allows other apps to start it via Intent','C. Makes it appear in launcher','D. Disables back button'],
      correctAnswer:'B', explanation:'android:exported="true" allows any external app to launch this component via Intent.',
      relatedFile:'AndroidManifest.xml', relatedFunction:'<activity>', relatedConcept:'Component visibility' },

    { id:'ec-mc-2', type:'multiple-choice', difficulty:'beginner',
      question:'What is the default value of android:exported when NO intent-filter is defined?',
      choices:['A. true','B. false','C. Depends on minSdkVersion','D. Compilation fails'],
      correctAnswer:'B', explanation:'Without an intent-filter, android:exported defaults to false.',
      relatedFile:'AndroidManifest.xml', relatedFunction:'android:exported', relatedConcept:'Default values' },

    { id:'ec-mc-3', type:'multiple-choice', difficulty:'intermediate',
      question:'Which adb command successfully launches AdminActivity of com.training.vulnapp?',
      choices:['A. adb shell pm start com.training.vulnapp/.AdminActivity','B. adb shell am start -n com.training.vulnapp/.AdminActivity','C. adb launch com.training.vulnapp.AdminActivity','D. adb shell intent com.training.vulnapp/.AdminActivity'],
      correctAnswer:'B', explanation:'am start -n uses component name format package/class to launch activities.',
      relatedFile:'adb shell', relatedFunction:'am start', relatedConcept:'ADB exploitation' },

    { id:'ec-mc-4', type:'multiple-choice', difficulty:'intermediate',
      question:'Which protectionLevel restricts component access to apps signed with the same certificate?',
      choices:['A. normal','B. dangerous','C. signature','D. privileged'],
      correctAnswer:'C', explanation:'signature protectionLevel grants permission only to apps signed with the same certificate.',
      relatedFile:'AndroidManifest.xml', relatedFunction:'android:permission', relatedConcept:'Permission protection levels' },

    { id:'ec-mc-5', type:'multiple-choice', difficulty:'advanced',
      question:'An exported ContentProvider without permission is vulnerable to:',
      choices:['A. Memory corruption','B. Unauthorized data read/write by any app','C. SSL stripping','D. Intent spoofing only'],
      correctAnswer:'B', explanation:'An exported ContentProvider lets any app query or modify its data without authentication.',
      relatedFile:'AndroidManifest.xml', relatedFunction:'<provider>', relatedConcept:'ContentProvider security' },

    { id:'ec-tf-1', type:'true-false', difficulty:'beginner',
      question:'An Activity with an intent-filter defaults to android:exported="true" on Android API 30 and below.',
      correctAnswer:'true', explanation:'Before API 31, activities with intent-filters were exported by default. API 31+ requires explicit declaration.',
      relatedFile:'AndroidManifest.xml', relatedFunction:'intent-filter', relatedConcept:'API level differences' },

    { id:'ec-tf-2', type:'true-false', difficulty:'beginner',
      question:'Setting android:exported="false" on MainActivity will prevent the app from launching from the home screen.',
      correctAnswer:'false', explanation:'MainActivity needs exported="true" with MAIN/LAUNCHER intent-filter to appear on home screen.',
      relatedFile:'AndroidManifest.xml', relatedFunction:'android:exported', relatedConcept:'Launcher activity' },

    { id:'ec-tf-3', type:'true-false', difficulty:'intermediate',
      question:'An exported Service allows any app to bind to it and potentially call its methods.',
      correctAnswer:'true', explanation:'Exported services can be bound by external apps, exposing all IBinder methods.',
      relatedFile:'AndroidManifest.xml', relatedFunction:'<service>', relatedConcept:'Service binding' },

    { id:'ec-sa-1', type:'short-answer', difficulty:'beginner',
      question:'Name the XML attribute in AndroidManifest.xml that controls whether a component is accessible to other apps.',
      correctAnswer:'android:exported', explanation:'android:exported controls inter-app component accessibility.',
      relatedFile:'AndroidManifest.xml', relatedFunction:'android:exported', relatedConcept:'Component exposure' },

    { id:'ec-sa-2', type:'short-answer', difficulty:'intermediate',
      question:'What Android permission attribute, combined with protectionLevel="signature", restricts an exported component to same-certificate apps?',
      correctAnswer:'android:permission', explanation:'android:permission with protectionLevel="signature" in uses-permission enforces certificate-based access.',
      relatedFile:'AndroidManifest.xml', relatedFunction:'android:permission', relatedConcept:'Permission declaration' },

    { id:'ec-cr-1', type:'code-reading', difficulty:'beginner',
      question:'Review this manifest snippet. What is the security risk?\n\n```xml\n<activity\n    android:name=".AdminActivity"\n    android:exported="true" />\n```',
      correctAnswer:'Any app on the device can start AdminActivity without authentication or permission check.',
      explanation:'No permission attribute means zero access control. Any app can call am start or send an Intent.',
      relatedFile:'AndroidManifest.xml', relatedFunction:'<activity>', relatedConcept:'Unprotected exported component' },

    { id:'ec-cr-2', type:'code-reading', difficulty:'intermediate',
      question:'What does this code do and what vulnerability does it exploit?\n\n```\nadb shell am start -n com.target.app/.AdminActivity --es "user" "admin"\n```',
      correctAnswer:'Launches AdminActivity directly from shell, bypassing the login flow, passing extra string "user"="admin".',
      explanation:'Exported activities can be launched with any Intent extras, potentially bypassing auth checks.',
      relatedFile:'adb', relatedFunction:'am start', relatedConcept:'ADB component hijack' },

    { id:'ec-fi-1', type:'fix-identification', difficulty:'beginner',
      question:'Identify the correct fix for this vulnerable manifest entry:\n\n```xml\n<activity android:name=".AdminActivity" android:exported="true" />\n```',
      choices:['A. android:exported="false"','B. android:exported="null"','C. Remove the activity tag','D. Add android:enabled="false"'],
      correctAnswer:'A', explanation:'Setting exported="false" prevents any external app from launching AdminActivity.',
      relatedFile:'AndroidManifest.xml', relatedFunction:'android:exported', relatedConcept:'Access control fix' },

    { id:'ec-fi-2', type:'fix-identification', difficulty:'intermediate',
      question:'Which combination best secures an exported activity that must remain accessible to partner apps?\n\nOriginal: android:exported="true" (no permission)',
      choices:['A. Remove exported attribute','B. android:exported="true" + android:permission with protectionLevel="signature"','C. android:exported="true" + android:enabled="false"','D. Add intent-filter with no action'],
      correctAnswer:'B', explanation:'signature-level permission restricts access to apps sharing the same signing certificate.',
      relatedFile:'AndroidManifest.xml', relatedFunction:'android:permission', relatedConcept:'Signature permission' },
  ],

  'secret-dummy': [
    { id:'sd-mc-1', type:'multiple-choice', difficulty:'beginner',
      question:'Where are hardcoded API keys most commonly found in Android APKs?',
      choices:['A. Only in assets/ folder','B. strings.xml, BuildConfig fields, Java/Kotlin source constants','C. Only in native .so libraries','D. Only in the manifest'],
      correctAnswer:'B', explanation:'Hardcoded secrets appear in strings.xml, BuildConfig, and source constants — all extractable from an APK.',
      relatedFile:'res/values/strings.xml', relatedFunction:'getString(R.string.*)', relatedConcept:'Secret exposure' },

    { id:'sd-mc-2', type:'multiple-choice', difficulty:'intermediate',
      question:'Which tool extracts strings.xml from a compiled APK without source code?',
      choices:['A. adb logcat','B. apktool d app.apk','C. objdump -d app.apk','D. dex2jar only'],
      correctAnswer:'B', explanation:'apktool decodes APK resources including strings.xml back to human-readable XML.',
      relatedFile:'strings.xml', relatedFunction:'apktool', relatedConcept:'Static analysis' },

    { id:'sd-mc-3', type:'multiple-choice', difficulty:'intermediate',
      question:'What is the recommended approach for storing sensitive API keys in Android apps?',
      choices:['A. Encode in Base64 in strings.xml','B. Store in BuildConfig.DEBUG field','C. Use Android Keystore System or remote config','D. Obfuscate with XOR in Java'],
      correctAnswer:'C', explanation:'Android Keystore protects cryptographic keys in hardware; remote config avoids shipping secrets at all.',
      relatedFile:'KeyStore', relatedFunction:'KeyStore.getInstance()', relatedConcept:'Secure key storage' },

    { id:'sd-mc-4', type:'multiple-choice', difficulty:'advanced',
      question:'An attacker uses `strings app.apk | grep -i "key\\|secret\\|token\\|pass"`. What are they doing?',
      choices:['A. Dynamic analysis via Frida','B. Static string extraction from binary','C. Network traffic interception','D. Memory dump analysis'],
      correctAnswer:'B', explanation:'The strings command extracts printable character sequences from binaries, often revealing hardcoded secrets.',
      relatedFile:'app.apk', relatedFunction:'strings', relatedConcept:'Binary string extraction' },

    { id:'sd-tf-1', type:'true-false', difficulty:'beginner',
      question:'Obfuscating a hardcoded API key with Base64 encoding effectively protects it from extraction.',
      correctAnswer:'false', explanation:'Base64 is trivially reversible. Obfuscation is not encryption and provides minimal protection.',
      relatedFile:'BuildConfig', relatedFunction:'Base64.decode()', relatedConcept:'Security through obscurity' },

    { id:'sd-tf-2', type:'true-false', difficulty:'intermediate',
      question:'ProGuard/R8 obfuscation prevents extraction of string literals from APKs.',
      correctAnswer:'false', explanation:'ProGuard renames symbols but string literals remain as-is in the DEX bytecode.',
      relatedFile:'proguard-rules.pro', relatedFunction:'ProGuard', relatedConcept:'Obfuscation limitations' },

    { id:'sd-sa-1', type:'short-answer', difficulty:'beginner',
      question:'Name the apktool command to decode an APK and extract its resources.',
      correctAnswer:'apktool d app.apk', explanation:'apktool d (decode) extracts resources, manifest, and smali code from an APK.',
      relatedFile:'app.apk', relatedFunction:'apktool', relatedConcept:'APK static analysis' },

    { id:'sd-cr-1', type:'code-reading', difficulty:'beginner',
      question:'What security problem exists in this code?\n\n```java\nprivate static final String API_KEY = "sk-TRAINING-DUMMY-KEY-2024-FAKE";\nString url = "https://api.example.com/data?key=" + API_KEY;\n```',
      correctAnswer:'The API key is hardcoded in source and will be embedded in the APK binary, extractable by anyone who decompiles the app.',
      explanation:'Static final String constants end up as string literals in DEX bytecode, visible via strings/apktool.',
      relatedFile:'MainActivity.java', relatedFunction:'API_KEY', relatedConcept:'Hardcoded secret' },

    { id:'sd-cr-2', type:'code-reading', difficulty:'intermediate',
      question:'Why is this approach insufficient?\n\n```java\nString key = new String(Base64.decode("c2stVFJBSU5JTkctRFVNTVk=", Base64.DEFAULT));\n```',
      correctAnswer:'Base64 is not encryption. The encoded string is in the binary and any attacker can decode it instantly with base64 -d.',
      explanation:'Security through obscurity with Base64 adds negligible protection — it is a trivially reversible encoding.',
      relatedFile:'MainActivity.java', relatedFunction:'Base64.decode()', relatedConcept:'Obfuscation vs encryption' },

    { id:'sd-fi-1', type:'fix-identification', difficulty:'beginner',
      question:'Best fix for removing a hardcoded API key from an Android app that must authenticate to a backend?',
      choices:['A. Move key to BuildConfig (gradle)','B. Encode key in Base64','C. Fetch key from your own server at runtime after user authentication','D. Store key in res/raw/ folder'],
      correctAnswer:'C', explanation:'A backend proxy authenticates users and calls third-party APIs server-side — no key ships in the APK.',
      relatedFile:'server-side proxy', relatedFunction:'fetch()', relatedConcept:'Backend proxy pattern' },
  ],

  'cleartext-config': [
    { id:'cc-mc-1', type:'multiple-choice', difficulty:'beginner',
      question:'What file controls cleartext HTTP traffic permissions in Android 9+?',
      choices:['A. res/values/strings.xml','B. res/xml/network_security_config.xml','C. AndroidManifest.xml activity block','D. build.gradle network block'],
      correctAnswer:'B', explanation:'network_security_config.xml defines per-domain cleartext and certificate pinning rules.',
      relatedFile:'network_security_config.xml', relatedFunction:'networkSecurityConfig', relatedConcept:'Network security config' },

    { id:'cc-mc-2', type:'multiple-choice', difficulty:'beginner',
      question:'What AndroidManifest attribute links to the network security config file?',
      choices:['A. android:networkConfig','B. android:networkSecurityConfig','C. android:cleartext','D. android:tlsConfig'],
      correctAnswer:'B', explanation:'android:networkSecurityConfig in the <application> tag points to the XML config file.',
      relatedFile:'AndroidManifest.xml', relatedFunction:'android:networkSecurityConfig', relatedConcept:'Manifest attributes' },

    { id:'cc-mc-3', type:'multiple-choice', difficulty:'intermediate',
      question:'Which tool captures cleartext HTTP traffic from an Android emulator?',
      choices:['A. Wireshark on host with ADB port forward','B. apktool','C. dex2jar','D. keytool'],
      correctAnswer:'A', explanation:'Wireshark on the host interface combined with ADB port forwarding or emulator bridge captures unencrypted traffic.',
      relatedFile:'network', relatedFunction:'Wireshark', relatedConcept:'Traffic interception' },

    { id:'cc-tf-1', type:'true-false', difficulty:'beginner',
      question:'Android 9 (API 28) and above block cleartext HTTP traffic by default for all apps.',
      correctAnswer:'true', explanation:'Since API 28, cleartext HTTP is blocked by default unless explicitly allowed in network_security_config.xml.',
      relatedFile:'AndroidManifest.xml', relatedFunction:'cleartextTrafficPermitted', relatedConcept:'Android network defaults' },

    { id:'cc-tf-2', type:'true-false', difficulty:'intermediate',
      question:'Setting cleartextTrafficPermitted="true" globally is acceptable for production apps targeting internal networks.',
      correctAnswer:'false', explanation:'Cleartext is vulnerable to MitM on any network. Use HTTPS even on internal networks.',
      relatedFile:'network_security_config.xml', relatedFunction:'cleartextTrafficPermitted', relatedConcept:'Production security standards' },

    { id:'cc-cr-1', type:'code-reading', difficulty:'beginner',
      question:'What is wrong with this network config?\n\n```xml\n<network-security-config>\n  <base-config cleartextTrafficPermitted="true">\n    <trust-anchors>\n      <certificates src="system" />\n    </trust-anchors>\n  </base-config>\n</network-security-config>\n```',
      correctAnswer:'cleartextTrafficPermitted="true" allows unencrypted HTTP to any domain, enabling man-in-the-middle attacks.',
      explanation:'The base-config applies globally. Cleartext exposes all traffic to interception on the network.',
      relatedFile:'network_security_config.xml', relatedFunction:'cleartextTrafficPermitted', relatedConcept:'MitM vulnerability' },

    { id:'cc-fi-1', type:'fix-identification', difficulty:'beginner',
      question:'Correct fix for this vulnerable config: cleartextTrafficPermitted="true" globally?',
      choices:['A. Change to cleartextTrafficPermitted="false"','B. Delete the network-security-config file','C. Add android:usesCleartextTraffic="true" in manifest','D. Change to cleartextTrafficPermitted="null"'],
      correctAnswer:'A', explanation:'Setting to "false" enforces HTTPS-only for all network connections.',
      relatedFile:'network_security_config.xml', relatedFunction:'cleartextTrafficPermitted', relatedConcept:'HTTPS enforcement' },

    { id:'cc-sa-1', type:'short-answer', difficulty:'intermediate',
      question:'Name the protocol that should replace HTTP in all production Android network communications.',
      correctAnswer:'HTTPS (HTTP over TLS/SSL)', explanation:'HTTPS encrypts traffic with TLS, preventing eavesdropping and man-in-the-middle attacks.',
      relatedFile:'network layer', relatedFunction:'HttpsURLConnection', relatedConcept:'Transport layer security' },

    { id:'cc-mc-4', type:'multiple-choice', difficulty:'advanced',
      question:'What attack does cleartext HTTP traffic enable on a local Wi-Fi network?',
      choices:['A. Replay attack only','B. Man-in-the-middle (MitM) — attacker reads and modifies traffic in transit','C. APK signature forgery','D. SQL injection only'],
      correctAnswer:'B', explanation:'Cleartext HTTP has no encryption or integrity protection, allowing any network attacker to read and modify traffic.',
      relatedFile:'network layer', relatedFunction:'OkHttpClient', relatedConcept:'Man-in-the-middle attack' },

    { id:'cc-fi-2', type:'fix-identification', difficulty:'intermediate',
      question:'App must fetch data from http://legacy.internal.corp — an HTTP-only internal server. Which fix best limits risk?',
      choices:['A. Set cleartextTrafficPermitted="true" globally','B. Use a domain-scoped cleartext exception only for that host in network_security_config.xml','C. Disable TLS validation entirely','D. Use android:usesCleartextTraffic="true" in manifest'],
      correctAnswer:'B', explanation:'A domain-specific <domain-config> allows cleartext only for the legacy host, not globally — limiting blast radius.',
      relatedFile:'network_security_config.xml', relatedFunction:'<domain-config>', relatedConcept:'Scoped cleartext exception' },
  ],

  'sensitive-logs': [
    { id:'sl-mc-1', type:'multiple-choice', difficulty:'beginner',
      question:'Which Android class is most commonly misused to log sensitive data?',
      choices:['A. System.out','B. android.util.Log','C. java.util.logging.Logger','D. android.os.Debug'],
      correctAnswer:'B', explanation:'android.util.Log (Log.d/i/w/e) writes to logcat which any app with READ_LOGS permission can read.',
      relatedFile:'MainActivity.java', relatedFunction:'Log.d()', relatedConcept:'Logcat exposure' },

    { id:'sl-mc-2', type:'multiple-choice', difficulty:'intermediate',
      question:'What adb command reads all logcat output from a device?',
      choices:['A. adb shell logread','B. adb logcat','C. adb shell log -d','D. adb shell dmesg'],
      correctAnswer:'B', explanation:'adb logcat streams all log entries from the device to the host.',
      relatedFile:'logcat', relatedFunction:'adb logcat', relatedConcept:'Log interception' },

    { id:'sl-mc-3', type:'multiple-choice', difficulty:'intermediate',
      question:'On rooted devices or apps sharing the same UID, sensitive logs can be read by:',
      choices:['A. Only the same app','B. No other app ever','C. Any app with READ_LOGS permission or root access','D. Only system apps'],
      correctAnswer:'C', explanation:'READ_LOGS is a system/root permission, but on rooted devices any app can access logcat.',
      relatedFile:'logcat', relatedFunction:'READ_LOGS permission', relatedConcept:'Multi-app log access' },

    { id:'sl-tf-1', type:'true-false', difficulty:'beginner',
      question:'Log.d() calls are automatically stripped from release builds in Android.',
      correctAnswer:'false', explanation:'Log.d() remains in release builds unless explicitly removed via ProGuard rules or BuildConfig.DEBUG checks.',
      relatedFile:'proguard-rules.pro', relatedFunction:'Log.d()', relatedConcept:'Log stripping' },

    { id:'sl-tf-2', type:'true-false', difficulty:'intermediate',
      question:'Wrapping Log calls with `if (BuildConfig.DEBUG)` prevents log output in release builds.',
      correctAnswer:'true', explanation:'BuildConfig.DEBUG is false in release builds, so wrapped Log calls are never executed or compiled out by R8.',
      relatedFile:'BuildConfig', relatedFunction:'BuildConfig.DEBUG', relatedConcept:'Conditional logging' },

    { id:'sl-cr-1', type:'code-reading', difficulty:'beginner',
      question:'Identify the vulnerability:\n\n```java\nString password = editText.getText().toString();\nLog.d("AUTH", "User login attempt: " + username + " / " + password);\n```',
      correctAnswer:'The plaintext password is logged to logcat, accessible to any app or attacker with adb access.',
      explanation:'Never log credentials, tokens, or PII. Log.d writes unencrypted to a shared system buffer.',
      relatedFile:'LoginActivity.java', relatedFunction:'Log.d()', relatedConcept:'Credential logging' },

    { id:'sl-fi-1', type:'fix-identification', difficulty:'beginner',
      question:'Best fix for: `Log.d("AUTH", "Token: " + authToken);`',
      choices:['A. Log.v("AUTH", "Token: " + authToken)','B. Remove the log statement entirely','C. if (BuildConfig.DEBUG) Log.d("AUTH", "Token: [REDACTED]")','D. System.out.println("Token: " + authToken)'],
      correctAnswer:'C', explanation:'In debug only, log a redacted placeholder. Never log actual secret values in any build.',
      relatedFile:'MainActivity.java', relatedFunction:'BuildConfig.DEBUG', relatedConcept:'Safe logging pattern' },

    { id:'sl-sa-1', type:'short-answer', difficulty:'intermediate',
      question:'Name the ProGuard rule that removes all Log.d() calls from release builds.',
      correctAnswer:'-assumenosideeffects class android.util.Log { public static int d(...); }',
      explanation:'assumenosideeffects tells R8/ProGuard the method has no side effects and can be removed when unused.',
      relatedFile:'proguard-rules.pro', relatedFunction:'-assumenosideeffects', relatedConcept:'ProGuard log removal' },

    { id:'sl-mc-4', type:'multiple-choice', difficulty:'advanced',
      question:'Which adb command filters logcat output to only show messages with a specific tag?',
      choices:['A. adb logcat -t VULNLAB','B. adb logcat VULNLAB:D *:S','C. adb logcat --filter=VULNLAB','D. adb shell log -s VULNLAB'],
      correctAnswer:'B', explanation:'The format TAG:PRIORITY *:S shows messages matching TAG at priority D (debug) and suppresses all others.',
      relatedFile:'logcat', relatedFunction:'adb logcat', relatedConcept:'Logcat tag filter' },

    { id:'sl-fi-2', type:'fix-identification', difficulty:'intermediate',
      question:'Code logs user data in debug builds. Best approach for release?',
      choices:['A. Replace Log.d with System.out.println','B. Add if (BuildConfig.DEBUG) guard and log [REDACTED] placeholder','C. Use a custom logger that writes to a file','D. Keep Log.d — release builds are private'],
      correctAnswer:'B', explanation:'BuildConfig.DEBUG is false in release builds. Guarding with it ensures logs never fire in production.',
      relatedFile:'BuildConfig', relatedFunction:'BuildConfig.DEBUG', relatedConcept:'Release build log suppression' },
  ],

  'insecure-file-permission': [
    { id:'fp-mc-1', type:'multiple-choice', difficulty:'beginner',
      question:'Which file creation mode stores a file readable by all apps on Android?',
      choices:['A. Context.MODE_PRIVATE','B. Context.MODE_WORLD_READABLE','C. Context.MODE_APPEND','D. Context.MODE_MULTI_PROCESS'],
      correctAnswer:'B', explanation:'MODE_WORLD_READABLE (deprecated since API 17) creates files readable by any app on the device.',
      relatedFile:'MainActivity.java', relatedFunction:'openFileOutput()', relatedConcept:'File mode flags' },

    { id:'fp-mc-2', type:'multiple-choice', difficulty:'beginner',
      question:'What is the recommended mode for storing private app files on Android?',
      choices:['A. MODE_WORLD_READABLE','B. MODE_WORLD_WRITEABLE','C. MODE_PRIVATE','D. MODE_PUBLIC'],
      correctAnswer:'C', explanation:'MODE_PRIVATE restricts file access to the owning app only.',
      relatedFile:'Context', relatedFunction:'MODE_PRIVATE', relatedConcept:'Private file storage' },

    { id:'fp-mc-3', type:'multiple-choice', difficulty:'intermediate',
      question:'Where should apps store files that should not be accessible to other apps?',
      choices:['A. External storage (Environment.EXTERNAL_STORAGE)','B. Internal storage (getFilesDir() or getCacheDir())','C. /sdcard/Android/data/ folder','D. /tmp/ folder'],
      correctAnswer:'B', explanation:'Internal storage (getFilesDir/getCacheDir) is sandboxed per app and not accessible by others.',
      relatedFile:'getFilesDir()', relatedFunction:'getFilesDir()', relatedConcept:'Storage isolation' },

    { id:'fp-tf-1', type:'true-false', difficulty:'beginner',
      question:'Files stored on external storage (SD card / /sdcard) are private to the creating app.',
      correctAnswer:'false', explanation:'External storage is world-readable. Any app with READ_EXTERNAL_STORAGE permission can read these files.',
      relatedFile:'/sdcard/', relatedFunction:'Environment.getExternalStorageDirectory()', relatedConcept:'External storage security' },

    { id:'fp-cr-1', type:'code-reading', difficulty:'beginner',
      question:'What is the security issue here?\n\n```java\nFileOutputStream fos = openFileOutput("user_data.txt", Context.MODE_WORLD_READABLE);\nfos.write(userData.getBytes());\n```',
      correctAnswer:'MODE_WORLD_READABLE allows any other app on the device to read user_data.txt, leaking private data.',
      explanation:'World-readable files bypass Android app sandbox isolation.',
      relatedFile:'MainActivity.java', relatedFunction:'openFileOutput()', relatedConcept:'File permission leak' },

    { id:'fp-fi-1', type:'fix-identification', difficulty:'beginner',
      question:'Fix for: `openFileOutput("creds.txt", Context.MODE_WORLD_READABLE)`',
      choices:['A. openFileOutput("creds.txt", Context.MODE_PRIVATE)','B. openFileOutput("creds.txt", 0777)','C. openFileOutput("creds.txt", Context.MODE_APPEND)','D. openFileOutput("creds.txt", Context.MODE_WORLD_WRITEABLE)'],
      correctAnswer:'A', explanation:'MODE_PRIVATE restricts the file to the app\'s own UID.',
      relatedFile:'MainActivity.java', relatedFunction:'MODE_PRIVATE', relatedConcept:'Private file access' },

    { id:'fp-sa-1', type:'short-answer', difficulty:'intermediate',
      question:'Name the Android API method that returns the private internal files directory for an app.',
      correctAnswer:'getFilesDir()', explanation:'getFilesDir() returns the app-private directory at /data/data/<package>/files/.',
      relatedFile:'Context', relatedFunction:'getFilesDir()', relatedConcept:'Internal storage path' },

    { id:'fp-mc-4', type:'multiple-choice', difficulty:'intermediate',
      question:'Which Android permission is required to read files from external storage on API 23+?',
      choices:['A. android.permission.READ_INTERNAL_STORAGE','B. android.permission.READ_EXTERNAL_STORAGE','C. android.permission.MANAGE_EXTERNAL_STORAGE','D. No permission needed — external storage is public'],
      correctAnswer:'B', explanation:'READ_EXTERNAL_STORAGE is required on API 23–32. On API 33+ media-specific permissions apply.',
      relatedFile:'AndroidManifest.xml', relatedFunction:'READ_EXTERNAL_STORAGE', relatedConcept:'Storage permissions' },

    { id:'fp-tf-2', type:'true-false', difficulty:'intermediate',
      question:'getExternalFilesDir() returns a path that requires READ_EXTERNAL_STORAGE permission for other apps to access.',
      correctAnswer:'false', explanation:'getExternalFilesDir() returns an app-scoped external path — no permission needed by the owning app, but other apps cannot access it without MANAGE_EXTERNAL_STORAGE.',
      relatedFile:'Context', relatedFunction:'getExternalFilesDir()', relatedConcept:'App-scoped external storage' },

    { id:'fp-cr-2', type:'code-reading', difficulty:'intermediate',
      question:'What is the risk?\n\n```java\nFile file = new File(Environment.getExternalStorageDirectory(), "backup.db");\nFileOutputStream fos = new FileOutputStream(file);\nfos.write(encryptedDbBytes);\n```',
      correctAnswer:'The file is written to /sdcard/backup.db — any app with READ_EXTERNAL_STORAGE permission can read it, even though the content is encrypted.',
      explanation:'Storing sensitive files on external storage risks exposure regardless of encryption — prefer internal storage for security-sensitive data.',
      relatedFile:'MainActivity.java', relatedFunction:'getExternalStorageDirectory()', relatedConcept:'External storage risk' },
  ],

  'weak-input-validation': [
    { id:'wv-mc-1', type:'multiple-choice', difficulty:'beginner',
      question:'What type of attack does missing input validation primarily enable in Android apps?',
      choices:['A. Stack overflow in native code','B. Intent injection, SQL injection, or logic bypass','C. APK signature forgery','D. Bluetooth hijacking'],
      correctAnswer:'B', explanation:'Unvalidated input fed into SQL queries, file paths, or logic conditions enables injection attacks.',
      relatedFile:'MainActivity.java', relatedFunction:'EditText.getText()', relatedConcept:'Input validation' },

    { id:'wv-mc-2', type:'multiple-choice', difficulty:'intermediate',
      question:'Which Java method prevents SQL injection in Android SQLite queries?',
      choices:['A. rawQuery("SELECT * FROM users WHERE name=" + input)','B. execSQL(query + input)','C. query() with selectionArgs parameter','D. DatabaseUtils.sqlEscapeString() only'],
      correctAnswer:'C', explanation:'SQLiteDatabase.query() with selectionArgs uses parameterized queries, preventing injection.',
      relatedFile:'DatabaseHelper.java', relatedFunction:'query()', relatedConcept:'Parameterized queries' },

    { id:'wv-tf-1', type:'true-false', difficulty:'beginner',
      question:'An Android app that passes user input directly to `rawQuery()` without sanitization is vulnerable to SQL injection.',
      correctAnswer:'true', explanation:'rawQuery concatenates strings directly into SQL, allowing injection of arbitrary SQL commands.',
      relatedFile:'DatabaseHelper.java', relatedFunction:'rawQuery()', relatedConcept:'SQL injection' },

    { id:'wv-cr-1', type:'code-reading', difficulty:'beginner',
      question:'Spot the vulnerability:\n\n```java\nString input = editText.getText().toString();\nif (input.equals("admin123")) {\n    grantAccess();\n} else if (input.length() > 0) {\n    grantLimitedAccess();\n}\n```',
      correctAnswer:'Any non-empty input grants limited access. No proper validation of input content or format.',
      explanation:'Logic that branches on length > 0 grants access to any non-empty string. Proper validation should check against expected values or patterns.',
      relatedFile:'LoginActivity.java', relatedFunction:'equals()', relatedConcept:'Logic bypass' },

    { id:'wv-fi-1', type:'fix-identification', difficulty:'beginner',
      question:'Fix for this SQL injection vulnerability:\n\n```java\ndb.rawQuery("SELECT * FROM users WHERE name=\'" + userInput + "\'", null);\n```',
      choices:['A. db.rawQuery("SELECT * FROM users WHERE name=\'" + userInput.trim() + "\'", null)','B. db.query("users", null, "name=?", new String[]{userInput}, null, null, null)','C. db.execSQL("SELECT * FROM users WHERE name=\'" + userInput + "\'")','D. db.rawQuery("SELECT * FROM users WHERE name=" + userInput, null)'],
      correctAnswer:'B', explanation:'Using query() with selectionArgs as a parameter binds the value safely, preventing injection.',
      relatedFile:'DatabaseHelper.java', relatedFunction:'query()', relatedConcept:'Parameterized query fix' },

    { id:'wv-sa-1', type:'short-answer', difficulty:'intermediate',
      question:'What does the Android `TextUtils.isEmpty()` method check, and why is it insufficient for security validation?',
      correctAnswer:'Checks if string is null or length 0. Insufficient because it does not validate content — a non-empty malicious string passes.',
      explanation:'isEmpty() only checks existence, not correctness. Security validation must verify format, range, and allowed characters.',
      relatedFile:'TextUtils', relatedFunction:'TextUtils.isEmpty()', relatedConcept:'Validation insufficiency' },

    { id:'wv-mc-3', type:'multiple-choice', difficulty:'intermediate',
      question:'Which Java class provides pattern-based input validation using regular expressions?',
      choices:['A. android.util.Validator','B. java.util.regex.Pattern','C. android.text.InputFilter','D. java.lang.String.validate()'],
      correctAnswer:'B', explanation:'Pattern.compile() compiles a regex; Matcher.matches() verifies the full string against the pattern.',
      relatedFile:'ValidationGate.java', relatedFunction:'Pattern.compile()', relatedConcept:'Regex validation' },

    { id:'wv-tf-2', type:'true-false', difficulty:'intermediate',
      question:'Using `matches()` with a permissive regex like `.*` on user input effectively prevents all injection attacks.',
      correctAnswer:'false', explanation:'`.*` matches any string including malicious input. A regex must be restrictive (whitelist) to provide security.',
      relatedFile:'ValidationGate.java', relatedFunction:'matches()', relatedConcept:'Permissive regex danger' },

    { id:'wv-cr-2', type:'code-reading', difficulty:'intermediate',
      question:'What bypass exists in this validation?\n\n```java\npublic boolean validate(String code) {\n    if (code.matches("[A-Z]{4}-[0-9]+")) return true;  // strict\n    if (code.endsWith("!")) return true;               // debug bypass\n    return false;\n}\n```',
      correctAnswer:'Any string ending in "!" bypasses the strict validation — e.g., "HACK!" passes. This debug path was never removed.',
      explanation:'Debug/backdoor conditions left in production code create unintended bypass paths exploitable by attackers.',
      relatedFile:'ValidationGate.java', relatedFunction:'endsWith()', relatedConcept:'Debug bypass left in production' },

    { id:'wv-fi-2', type:'fix-identification', difficulty:'intermediate',
      question:'Which is the safest fix for a token validation function that has a numeric-only fallback bypass?',
      choices:['A. Remove the fallback condition entirely and use strict whitelist regex only','B. Make the fallback require 20+ digit numbers','C. Move fallback check before the main check','D. Log a warning when fallback triggers'],
      correctAnswer:'A', explanation:'Removing the bypass eliminates the attack surface. Only one strict, whitelist-based path should exist.',
      relatedFile:'ValidationGate.java', relatedFunction:'validate()', relatedConcept:'Removing bypass conditions' },
  ],

  'insecure-debug-mode': [
    { id:'dm-mc-1', type:'multiple-choice', difficulty:'beginner',
      question:'What AndroidManifest.xml attribute enables debugging on a production app?',
      choices:['A. android:testMode="true"','B. android:debuggable="true"','C. android:debug="enabled"','D. android:inspectable="true"'],
      correctAnswer:'B', explanation:'android:debuggable="true" allows adb debugging, attaching debuggers, and accessing app sandbox data.',
      relatedFile:'AndroidManifest.xml', relatedFunction:'android:debuggable', relatedConcept:'Debuggable flag' },

    { id:'dm-mc-2', type:'multiple-choice', difficulty:'intermediate',
      question:'With android:debuggable="true", an attacker can:',
      choices:['A. Modify APK signature only','B. Attach a debugger, extract memory, dump shared preferences','C. Only read the manifest','D. Intercept SMS messages'],
      correctAnswer:'B', explanation:'Debuggable apps allow jdb/JDWP attachment, memory inspection, and run-as sandbox access.',
      relatedFile:'AndroidManifest.xml', relatedFunction:'android:debuggable', relatedConcept:'Debug attack surface' },

    { id:'dm-mc-3', type:'multiple-choice', difficulty:'intermediate',
      question:'Which adb command runs a shell as a specific app\'s UID on a debuggable app?',
      choices:['A. adb shell su package.name','B. adb shell run-as com.target.app','C. adb exec-out --uid com.target.app','D. adb shell am run com.target.app'],
      correctAnswer:'B', explanation:'`adb shell run-as com.package.name` only works on debuggable apps, giving filesystem access as that app\'s UID.',
      relatedFile:'adb', relatedFunction:'run-as', relatedConcept:'Sandbox escape via debug' },

    { id:'dm-tf-1', type:'true-false', difficulty:'beginner',
      question:'Android build tools automatically remove android:debuggable="true" from release builds when using gradle assembleRelease.',
      correctAnswer:'true', explanation:'Release builds set debuggable to false by default. Only explicitly setting it to true in release config is dangerous.',
      relatedFile:'build.gradle', relatedFunction:'assembleRelease', relatedConcept:'Build variants' },

    { id:'dm-cr-1', type:'code-reading', difficulty:'intermediate',
      question:'What is the security risk of this manifest entry in a production APK?\n\n```xml\n<application\n    android:debuggable="true"\n    android:label="MyApp">\n```',
      correctAnswer:'Allows any USB-connected attacker to attach a debugger, inspect memory, extract keys, and access the app\'s private data directory.',
      explanation:'debuggable="true" in production defeats the Android app sandbox. Attackers with physical or adb access can fully compromise the app.',
      relatedFile:'AndroidManifest.xml', relatedFunction:'android:debuggable', relatedConcept:'Production debuggable risk' },

    { id:'dm-fi-1', type:'fix-identification', difficulty:'beginner',
      question:'Correct fix for android:debuggable="true" in production manifest?',
      choices:['A. android:debuggable="false"','B. android:debuggable="null"','C. Remove android:debuggable attribute (defaults to false)','D. Both A and C are correct'],
      correctAnswer:'D', explanation:'Either explicitly setting false or removing the attribute (defaults to false in release) both fix the issue.',
      relatedFile:'AndroidManifest.xml', relatedFunction:'android:debuggable', relatedConcept:'Disable debugging' },

    { id:'dm-sa-1', type:'short-answer', difficulty:'intermediate',
      question:'What JDWP command or tool do security researchers use to attach a Java debugger to a debuggable Android app?',
      correctAnswer:'jdb (Java Debugger) via adb forward tcp:8700 jdwp:<pid>, or Android Studio debugger, or IntelliJ.',
      explanation:'JDWP (Java Debug Wire Protocol) is exposed by debuggable apps. adb forward connects a local port to the JDWP socket.',
      relatedFile:'jdb / JDWP', relatedFunction:'adb forward', relatedConcept:'JDWP debugging protocol' },

    { id:'dm-tf-2', type:'true-false', difficulty:'intermediate',
      question:'`adb shell run-as com.target.app` works on non-debuggable apps installed on a non-rooted device.',
      correctAnswer:'false', explanation:'run-as only grants sandbox access on apps with android:debuggable="true". Non-debuggable apps reject it.',
      relatedFile:'adb', relatedFunction:'run-as', relatedConcept:'run-as prerequisite' },

    { id:'dm-mc-4', type:'multiple-choice', difficulty:'advanced',
      question:'An attacker with adb access to a debuggable app can extract SharedPreferences data by:',
      choices:['A. adb pull /data/data/com.target.app/shared_prefs/ (requires run-as or root)','B. adb shell getprop com.target.app.prefs','C. adb backup --prefs com.target.app','D. It is impossible without root'],
      correctAnswer:'A', explanation:'`adb shell run-as com.target.app cat shared_prefs/prefs.xml` reads SharedPreferences directly on debuggable apps.',
      relatedFile:'shared_prefs/', relatedFunction:'run-as', relatedConcept:'SharedPreferences extraction' },

    { id:'dm-cr-2', type:'code-reading', difficulty:'intermediate',
      question:'What sensitive data is exposed here, and how?\n\n```java\nSharedPreferences prefs = getSharedPreferences("vulnlab_prefs", MODE_PRIVATE);\nprefs.edit().putString("auth_token", userToken).apply();\n```\nApp is android:debuggable="true".',
      correctAnswer:'The auth token stored in SharedPreferences is readable via `adb shell run-as` because the app is debuggable — the MODE_PRIVATE file is accessible to the attacker.',
      explanation:'MODE_PRIVATE only protects against other apps. debuggable=true + run-as bypasses this for any USB-connected attacker.',
      relatedFile:'MainActivity.java', relatedFunction:'SharedPreferences', relatedConcept:'SharedPreferences + debuggable risk' },
  ],

  'vulnerable-jni-native-check': [
    { id:'jni-mc-1', type:'multiple-choice', difficulty:'intermediate',
      question:'What does JNI stand for in Android development?',
      choices:['A. Java Native Infrastructure','B. Java Native Interface','C. Java Network Integration','D. Just-in-time Native Invocation'],
      correctAnswer:'B', explanation:'JNI (Java Native Interface) allows Java code to call native C/C++ functions and vice versa.',
      relatedFile:'native-lib.cpp', relatedFunction:'JNI_OnLoad', relatedConcept:'JNI fundamentals' },

    { id:'jni-mc-2', type:'multiple-choice', difficulty:'intermediate',
      question:'Which Frida method hooks a Java method at runtime on Android?',
      choices:['A. Frida.attach()','B. Java.use("class.name").method.implementation','C. Frida.inject("method")','D. Java.hook("method.name")'],
      correctAnswer:'B', explanation:'Java.use() loads a Java class into Frida, then .method.implementation replaces the method body at runtime.',
      relatedFile:'frida-hook.js', relatedFunction:'Java.use()', relatedConcept:'Frida method hooking' },

    { id:'jni-mc-3', type:'multiple-choice', difficulty:'advanced',
      question:'How can Frida bypass a native JNI check like `checkLicense(String input)`?',
      choices:['A. Patch the .so file binary directly','B. Use Java.use() to override the Java wrapper method to always return true','C. Modify the APK manifest','D. Use adb to skip the native call'],
      correctAnswer:'B', explanation:'By overriding the Java wrapper in Frida, the native .so is never called and the check is bypassed at the Java layer.',
      relatedFile:'frida-hook-jni-demo.js', relatedFunction:'Java.use()', relatedConcept:'Java wrapper bypass' },

    { id:'jni-mc-4', type:'multiple-choice', difficulty:'advanced',
      question:'What is the risk of hardcoding a secret in a native .so library?',
      choices:['A. No risk — native code is not readable','B. Secret extractable via strings, Ghidra, or IDA Pro static analysis','C. Only risk is performance','D. Risk only exists on rooted devices'],
      correctAnswer:'B', explanation:'Native .so files are ELF binaries. Tools like strings, Ghidra, and radare2 extract string literals trivially.',
      relatedFile:'native-lib.cpp', relatedFunction:'DUMMY_TOKEN', relatedConcept:'Native binary analysis' },

    { id:'jni-tf-1', type:'true-false', difficulty:'intermediate',
      question:'Compiling a secret into native C++ code (.so) makes it unextractable by attackers.',
      correctAnswer:'false', explanation:'String literals in .so files are visible via strings command, Ghidra, IDA, or radare2 disassembly.',
      relatedFile:'native-lib.cpp', relatedFunction:'DUMMY_TOKEN', relatedConcept:'Native secret extraction' },

    { id:'jni-tf-2', type:'true-false', difficulty:'advanced',
      question:'Frida can hook native C functions exported from .so libraries in addition to Java methods.',
      correctAnswer:'true', explanation:'Frida\'s Interceptor.attach() hooks native exports. Module.findExportByName() locates the function in the .so.',
      relatedFile:'frida-hook.js', relatedFunction:'Interceptor.attach()', relatedConcept:'Native function hooking' },

    { id:'jni-cr-1', type:'code-reading', difficulty:'intermediate',
      question:'What vulnerability exists in this Frida hook target?\n\n```java\npublic native boolean checkLicense(String input);\n\npublic void verifyButton(View v) {\n    boolean ok = checkLicense(editText.getText().toString());\n    if (ok) grantAccess();\n}\n```',
      correctAnswer:'The checkLicense() Java wrapper can be hooked by Frida to always return true, bypassing the native validation entirely.',
      explanation:'Frida operates at the Java layer. Overriding checkLicense implementation to return true skips the native .so check.',
      relatedFile:'MainActivity.java', relatedFunction:'checkLicense()', relatedConcept:'Frida Java layer bypass' },

    { id:'jni-cr-2', type:'code-reading', difficulty:'advanced',
      question:'What does this Frida script do?\n\n```javascript\nJava.perform(function() {\n  var Main = Java.use("com.training.vulnapp.MainActivity");\n  Main.checkLicense.implementation = function(input) {\n    console.log("[*] checkLicense called with: " + input);\n    return true;\n  };\n});\n```',
      correctAnswer:'Hooks MainActivity.checkLicense() to log the input and always return true, bypassing the license/token validation.',
      explanation:'Java.perform ensures Frida runs in the JVM context. The implementation override replaces the original method body.',
      relatedFile:'frida-hook-jni-demo.js', relatedFunction:'Java.use()', relatedConcept:'Frida bypass script' },

    { id:'jni-fi-1', type:'fix-identification', difficulty:'advanced',
      question:'Best mitigation against Frida-based bypass of a Java wrapper around native JNI checks?',
      choices:['A. Move all logic to native C++ and verify integrity from native side','B. Use longer variable names','C. Compile with -O2 optimization','D. Use Base64 encoding in Java'],
      correctAnswer:'A', explanation:'Moving validation entirely to native code and checking app integrity (certificate hash, Frida detection) from native makes hooking much harder.',
      relatedFile:'native-lib.cpp', relatedFunction:'checkLicense()', relatedConcept:'Native-side validation' },

    { id:'jni-sa-1', type:'short-answer', difficulty:'intermediate',
      question:'Name the Frida API used to hook a native exported function from a .so library.',
      correctAnswer:'Interceptor.attach(Module.findExportByName("libnative.so", "functionName"), {...})',
      explanation:'findExportByName locates the function address, Interceptor.attach installs on-enter/on-leave callbacks.',
      relatedFile:'frida-hook.js', relatedFunction:'Interceptor.attach()', relatedConcept:'Native Frida hooking' },
  ]
};

function generateQuiz(moduleId, count) {
  const bank = QUESTION_BANKS[moduleId];
  if (!bank || bank.length === 0) return [];

  // Shuffle and pick count questions
  const shuffled = [...bank].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, bank.length));

  // Ensure variety: try to include all 5 types if count allows
  if (count >= 5 && bank.length >= 5) {
    const types = ['multiple-choice','true-false','short-answer','code-reading','fix-identification'];
    const byType = {};
    for (const t of types) byType[t] = bank.filter(q => q.type === t);

    const result = [];
    const used = new Set();

    // Pick one of each type first
    for (const t of types) {
      if (byType[t].length > 0 && result.length < count) {
        const q = byType[t][Math.floor(Math.random() * byType[t].length)];
        result.push(q);
        used.add(q.id);
      }
    }

    // Fill remaining slots randomly
    const remaining = bank.filter(q => !used.has(q.id)).sort(() => Math.random() - 0.5);
    for (const q of remaining) {
      if (result.length >= count) break;
      result.push(q);
    }

    return result.slice(0, count);
  }

  return selected;
}

function scoreQuiz(quiz, answers) {
  let correct = 0;
  const results = quiz.map((q, i) => {
    const userAnswer = answers[i] || '';
    let isCorrect = false;

    if (q.type === 'short-answer') {
      // Fuzzy match: check if answer contains key terms
      const ans = userAnswer.toLowerCase().trim();
      const correct_kw = q.correctAnswer.toLowerCase();
      const keywords = correct_kw.split(/[\s,()]+/).filter(w => w.length > 3);
      const matchCount = keywords.filter(kw => ans.includes(kw)).length;
      isCorrect = matchCount >= Math.max(1, Math.floor(keywords.length * 0.4));
    } else {
      isCorrect = userAnswer.trim().toUpperCase() === q.correctAnswer.trim().toUpperCase();
    }

    if (isCorrect) correct++;
    return { questionId: q.id, userAnswer, isCorrect, correctAnswer: q.correctAnswer, explanation: q.explanation };
  });

  return {
    score: Math.round((correct / quiz.length) * 100),
    correct,
    total: quiz.length,
    results
  };
}

module.exports = { generateQuiz, scoreQuiz, QUESTION_BANKS };
