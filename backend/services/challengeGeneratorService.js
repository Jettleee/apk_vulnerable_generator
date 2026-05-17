const path = require('path');
const fs   = require('fs');
const allModules = require('../data/modules.json');
const { generateQuiz } = require('./quizGeneratorService');

const CHALLENGES_FILE = path.join(__dirname, '../data/challenges.json');

function loadChallenges() {
  try { return JSON.parse(fs.readFileSync(CHALLENGES_FILE, 'utf8')); }
  catch { return []; }
}
function saveChallenges(c) {
  fs.writeFileSync(CHALLENGES_FILE, JSON.stringify(c, null, 2));
}

// ─── Flag + config generation ─────────────────────────────────────────────────

function generateFlag(moduleId) {
  const slugMap = {
    'exported-component':        'exported',
    'secret-dummy':              'hardcoded',
    'cleartext-config':          'cleartext',
    'sensitive-logs':            'logcat',
    'insecure-file-permission':  'fileperm',
    'weak-input-validation':     'inputval',
    'insecure-debug-mode':       'debugmode',
    'vulnerable-jni-native-check': 'jni'
  };
  const slug = slugMap[moduleId] || moduleId.replace(/-/g, '_');
  const rand = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `VULNLAB{${slug}_${rand}}`;
}

function generateChallengeConfig(moduleId) {
  const n = () => Math.floor(Math.random() * 900 + 100);
  switch (moduleId) {
    case 'secret-dummy':
      return { unlockCode: `BLUE-TRAINING-${n()}` };
    case 'vulnerable-jni-native-check':
      return { nativeCode: `NATIVE-TRAINING-${n()}` };
    case 'exported-component':
      return { intentAction: `com.training.vulnapp.ACTION_OPEN_FLAG`, unlockExtra: 'training' };
    case 'sensitive-logs':
      return { logTag: 'VULNLAB' };
    case 'insecure-debug-mode':
      return { prefFile: 'vulnlab_prefs', prefKey: 'training_flag' };
    default:
      return {};
  }
}

// ─── Solve goal + tools per module ───────────────────────────────────────────

const SOLVE_GOALS = {
  'exported-component':
    'Find the exported Activity in AndroidManifest.xml and trigger it with the correct adb Intent to display the flag.',
  'secret-dummy':
    'Decompile the APK with JADX, find TrainingConfig.java, recover the hardcoded UNLOCK_CODE, and enter it in the app to reveal the flag.',
  'cleartext-config':
    'Decompile the APK, inspect NetworkClient.java and AndroidManifest.xml, find the cleartext HTTP endpoint and the flag embedded in MOCK_RESPONSE.',
  'sensitive-logs':
    'Install the APK, run "adb logcat -s VULNLAB", press the Generate Training Token button, and capture the flag printed to logcat.',
  'insecure-file-permission':
    'Press the button to initialize storage, then use "adb shell cat /sdcard/vulnlab/training_flag.txt" to recover the flag from world-readable external storage.',
  'weak-input-validation':
    'Decompile the APK, find ValidationGate.isValidInput() in JADX, identify a bypass condition (numeric input or input ending with !), trigger it in the app to reveal the flag.',
  'insecure-debug-mode':
    'Find android:debuggable="true" in the manifest, use "adb shell run-as com.training.vulnapp" to access the app sandbox, and read the flag from SharedPreferences.',
  'vulnerable-jni-native-check':
    'Extract the APK, locate lib/arm64-v8a/libnativecheck.so, run "strings libnativecheck.so | grep NATIVE", enter the recovered native code in the app to reveal the flag.',
};

const EXPECTED_TOOLS = {
  'exported-component':        ['apktool', 'jadx', 'adb'],
  'secret-dummy':              ['jadx', 'apktool', 'MobSF'],
  'cleartext-config':          ['jadx', 'apktool', 'MobSF'],
  'sensitive-logs':            ['adb', 'logcat'],
  'insecure-file-permission':  ['adb', 'apktool'],
  'weak-input-validation':     ['jadx', 'apktool'],
  'insecure-debug-mode':       ['adb', 'apktool', 'jadx'],
  'vulnerable-jni-native-check': ['jadx', 'apktool', 'strings', 'Ghidra (optional)', 'radare2 (optional)'],
};

const FLAG_LOCATIONS = {
  'exported-component':
    'Displayed by SecretFlagActivity when triggered via adb with correct action + extras.',
  'secret-dummy':
    'Displayed by MainActivity after entering the correct UNLOCK_CODE from TrainingConfig.java.',
  'cleartext-config':
    'Embedded in NetworkClient.MOCK_RESPONSE — visible via JADX static analysis.',
  'sensitive-logs':
    'Printed to logcat with tag VULNLAB when Generate Training Token button is pressed.',
  'insecure-file-permission':
    'Written to /sdcard/vulnlab/training_flag.txt and /data/data/com.training.vulnapp/files/training_flag.txt on first button press.',
  'weak-input-validation':
    'Displayed by MainActivity when ValidationGate.isValidInput() returns true via bypass condition.',
  'insecure-debug-mode':
    'Stored in SharedPreferences (vulnlab_prefs.xml) — accessible via adb shell run-as on debuggable app.',
  'vulnerable-jni-native-check':
    'Displayed by MainActivity after entering the native unlock code found in libnativecheck.so strings.',
};

// ─── Module-specific 8-level hints ───────────────────────────────────────────

function buildHints(moduleId, flag, cfg) {
  switch (moduleId) {

    case 'exported-component': return [
      'Hint 1: The vulnerability is in how Android components are declared. Think about inter-app communication.',
      'Hint 2: Use apktool or JADX to decompile the APK and open AndroidManifest.xml.',
      'Hint 3: Look for Activity declarations with android:exported="true" that have intent-filter blocks.',
      'Hint 4: Find an Activity named SecretFlagActivity — inspect its <intent-filter> for the action string.',
      'Hint 5: The intent requires a specific action AND a String extra. Look for the extra key in the manifest or source.',
      'Hint 6: Build your adb command: adb shell am start -n com.training.vulnapp/.SecretFlagActivity -a <action> --es <key> <value>',
      'Hint 7: The action is com.training.vulnapp.ACTION_OPEN_FLAG. The extra key is "unlock". Find the expected value.',
      `Hint 8 (full solution): adb shell am start -n com.training.vulnapp/.SecretFlagActivity -a com.training.vulnapp.ACTION_OPEN_FLAG --es unlock training\nExpected flag screen shows: ${flag}`,
    ];

    case 'secret-dummy': return [
      'Hint 1: The vulnerability involves a secret value baked into the compiled APK code.',
      'Hint 2: Use JADX-GUI to decompile the APK: jadx-gui vuln.apk',
      'Hint 3: In JADX, navigate to com.training.vulnapp package and browse all classes.',
      'Hint 4: Find a class named TrainingConfig — open it and look at its fields.',
      `Hint 5: Inside TrainingConfig, find a static final String field. The value is a BLUE-TRAINING-XXX style code.`,
      'Hint 6: Copy the exact value of the UNLOCK_CODE field.',
      'Hint 7: Open the app, find the "Enter unlock code" input field, paste the exact value, press Unlock.',
      `Hint 8 (full solution): Open TrainingConfig.java in JADX. The UNLOCK_CODE field value is the unlock code. Enter it in the app → flag displayed: ${flag}`,
    ];

    case 'cleartext-config': return [
      'Hint 1: The vulnerability is in how the app handles network communications — look at transport security.',
      'Hint 2: Decompile the APK with apktool: apktool d vuln.apk',
      'Hint 3: Inspect AndroidManifest.xml — look for usesCleartextTraffic and networkSecurityConfig attributes.',
      'Hint 4: Open res/xml/network_security_config.xml — look at cleartextTrafficPermitted values.',
      'Hint 5: In JADX, find a class named NetworkClient — inspect its static fields.',
      'Hint 6: Look for BASE_URL (HTTP endpoint) and MOCK_RESPONSE fields in NetworkClient.',
      'Hint 7: The MOCK_RESPONSE field contains a JSON string with a "flag" key.',
      `Hint 8 (full solution): jadx vuln.apk → NetworkClient.java → MOCK_RESPONSE field contains JSON with flag: ${flag}`,
    ];

    case 'sensitive-logs': return [
      'Hint 1: The vulnerability involves data the app writes to a shared system output that other apps can read.',
      'Hint 2: Connect your device/emulator and open a terminal. Have adb installed.',
      'Hint 3: Run adb logcat before interacting with the app to capture all output.',
      `Hint 4: Filter by the app's log tag: adb logcat -s VULNLAB`,
      'Hint 5: Launch the app and look for a button labeled "Generate Training Token".',
      'Hint 6: Keep logcat running and press the button.',
      'Hint 7: The flag appears in logcat output — it is NOT shown in the app UI.',
      `Hint 8 (full solution): adb logcat -s VULNLAB | grep flag → press Generate Training Token → flag appears: ${flag}`,
    ];

    case 'insecure-file-permission': return [
      'Hint 1: The vulnerability is about how the app writes data to device storage.',
      'Hint 2: Install the APK and press the "Initialize Storage" button.',
      'Hint 3: The app writes data to external storage — readable without root.',
      'Hint 4: Check external storage path with: adb shell ls /sdcard/vulnlab/',
      'Hint 5: Read the file: adb shell cat /sdcard/vulnlab/training_flag.txt',
      'Hint 6: Also check the internal path (requires debuggable=true): adb shell run-as com.training.vulnapp cat /data/data/com.training.vulnapp/files/training_flag.txt',
      'Hint 7: The app also writes to internal storage with MODE_WORLD_READABLE (deprecated). Combined with debuggable=true, use run-as.',
      `Hint 8 (full solution): Press Initialize Storage → adb shell cat /sdcard/vulnlab/training_flag.txt → flag: ${flag}`,
    ];

    case 'weak-input-validation': return [
      'Hint 1: The vulnerability is in client-side logic that validates user input.',
      'Hint 2: Decompile the APK with JADX: jadx-gui vuln.apk',
      'Hint 3: Navigate to com.training.vulnapp and find ValidationGate.java.',
      'Hint 4: Open isValidInput() — read every branch carefully.',
      'Hint 5: The method has multiple return-true conditions beyond the intended "admin" check.',
      'Hint 6: Find the bypass conditions: numeric-only input works, input ending with "!" works.',
      'Hint 7: Enter "123" or "bypass!" in the app input field and press Submit.',
      `Hint 8 (full solution): Enter any all-digit string (e.g., "42") or any string ending with "!" into the input → flag displayed: ${flag}`,
    ];

    case 'insecure-debug-mode': return [
      'Hint 1: The vulnerability involves a manifest attribute that enables developer access to the app sandbox.',
      'Hint 2: Decompile with apktool: apktool d vuln.apk → open AndroidManifest.xml.',
      'Hint 3: Look for android:debuggable="true" in the <application> tag.',
      'Hint 4: When an app is debuggable, you can use adb to access its private data directory.',
      `Hint 5: Run: adb shell run-as ${`com.training.vulnapp`}`,
      'Hint 6: List the app\'s private files: ls /data/data/com.training.vulnapp/shared_prefs/',
      'Hint 7: Read the SharedPreferences XML file that contains the flag.',
      `Hint 8 (full solution): Press Initialize button first → adb shell run-as com.training.vulnapp cat /data/data/com.training.vulnapp/shared_prefs/vulnlab_prefs.xml → flag: ${flag}`,
    ];

    case 'vulnerable-jni-native-check': return [
      'Hint 1: The app uses a native C library for its validation logic — not pure Java.',
      'Hint 2: Decompile with JADX: jadx-gui vuln.apk → find NativeGate.java → see System.loadLibrary("nativecheck").',
      'Hint 3: Extract the APK to find the native library: unzip vuln.apk -d extracted/',
      'Hint 4: Find the native library: find extracted/ -name "*.so" → lib/arm64-v8a/libnativecheck.so',
      'Hint 5: Run the strings tool on the .so file: strings extracted/lib/arm64-v8a/libnativecheck.so',
      `Hint 6: Filter for the native code pattern: strings extracted/lib/arm64-v8a/libnativecheck.so | grep NATIVE`,
      'Hint 7: The string you find is the exact unlock code. Enter it in the app\'s "Enter native unlock code" field.',
      `Hint 8 (full solution): strings extracted/lib/arm64-v8a/libnativecheck.so | grep NATIVE → copy the NATIVE-TRAINING-XXX value → paste into app → flag: ${flag}`,
    ];

    default: return [
      'Hint 1: Decompile the APK with apktool or jadx.',
      'Hint 2: Inspect AndroidManifest.xml for security misconfigurations.',
      'Hint 3: Look at the Java source for hardcoded values.',
      'Hint 4: Use adb to interact with the running app.',
      'Hint 5: Check logcat output while using the app.',
      'Hint 6: Look for flag-related strings in the source.',
      'Hint 7: Follow the challenge-specific student guide.',
      `Hint 8: The flag is: ${flag}`,
    ];
  }
}

// ─── Module-specific student guide ───────────────────────────────────────────

function buildStudentGuide(moduleId, flag, cfg) {
  const guides = {
    'exported-component': `# Student Guide — Exported Component Challenge

## Objective
Find an exported Android Activity and trigger it with the correct Intent to recover the flag.

## Tools Required
- apktool / jadx — to decompile the APK
- adb — to send Intents from command line

## Step-by-Step

### Step 1: Install the APK
\`\`\`bash
adb install vuln-debug.apk
\`\`\`

### Step 2: Decompile with apktool
\`\`\`bash
apktool d vuln-debug.apk -o extracted/
\`\`\`

### Step 3: Inspect AndroidManifest.xml
\`\`\`bash
cat extracted/AndroidManifest.xml
\`\`\`
Look for Activity entries with \`android:exported="true"\` that have \`<intent-filter>\` blocks.

### Step 4: Find SecretFlagActivity
Locate the exported activity and its required Intent action:
- Activity name: **com.training.vulnapp.SecretFlagActivity**
- Intent action: look for \`<action android:name="..."\`
- Required extras: look in the Java source (jadx) for the \`REQUIRED_KEY\` and \`REQUIRED_VALUE\` constants

### Step 5: Launch the exported Activity via adb
\`\`\`bash
adb shell am start \\
  -n com.training.vulnapp/.SecretFlagActivity \\
  -a com.training.vulnapp.ACTION_OPEN_FLAG \\
  --es unlock training
\`\`\`

### Step 6: Read the flag
The app displays the flag on screen if the action and extras are correct.

## What to Submit
- The flag string (VULNLAB{...})
- Screenshot or description of the vulnerable manifest entry
- Explanation of why exported components are dangerous

> Safety: These techniques apply only to this generated toy app (com.training.vulnapp). Do not use adb am start against apps you do not own or have authorization to test.`,

    'secret-dummy': `# Student Guide — Hardcoded Secret Challenge

## Objective
Decompile the APK, find a hardcoded unlock code in Java source, enter it in the app to reveal the flag.

## Tools Required
- JADX-GUI — Java decompiler for Android APKs
- apktool — resource extraction (optional)

## Step-by-Step

### Step 1: Install the APK
\`\`\`bash
adb install vuln-debug.apk
\`\`\`

### Step 2: Open in JADX
\`\`\`bash
jadx-gui vuln-debug.apk
\`\`\`

### Step 3: Navigate to TrainingConfig
In JADX tree: Source code → com → training → vulnapp → TrainingConfig

### Step 4: Find the UNLOCK_CODE
Look for a \`private static final String UNLOCK_CODE = "...";\` field.
Copy the exact value.

### Step 5: Enter the code in the app
- Launch the app on your device/emulator
- Find the "Enter unlock code" input field
- Paste the exact UNLOCK_CODE value
- Press "Unlock"

### Step 6: Read the flag
The app displays the flag if the code matches.

## What to Submit
- The flag string (VULNLAB{...})
- Screenshot of TrainingConfig in JADX showing the UNLOCK_CODE field
- Explanation of why hardcoding secrets in APKs is dangerous

> Safety: All secrets in this challenge are dummy training values only.`,

    'cleartext-config': `# Student Guide — Cleartext Config Challenge

## Objective
Find a cleartext HTTP endpoint and an embedded flag through static analysis of the APK.

## Tools Required
- jadx or apktool — to decompile and inspect the APK
- MobSF (optional) — automated analysis

## Step-by-Step

### Step 1: Decompile with apktool
\`\`\`bash
apktool d vuln-debug.apk -o extracted/
\`\`\`

### Step 2: Check AndroidManifest.xml
\`\`\`bash
grep -i cleartext extracted/AndroidManifest.xml
grep -i networkSecurity extracted/AndroidManifest.xml
\`\`\`
Look for \`android:usesCleartextTraffic="true"\` and \`android:networkSecurityConfig\`.

### Step 3: Check network_security_config.xml
\`\`\`bash
cat extracted/res/xml/network_security_config.xml
\`\`\`
Look for \`cleartextTrafficPermitted="true"\`.

### Step 4: Find the HTTP endpoint with JADX
\`\`\`bash
jadx-gui vuln-debug.apk
\`\`\`
Navigate to: NetworkClient.java → look at BASE_URL and MOCK_RESPONSE fields.

### Step 5: Read the flag
The \`MOCK_RESPONSE\` field contains a JSON string with a "flag" key — that is your flag.

## What to Submit
- The flag string (VULNLAB{...})
- The vulnerable BASE_URL value
- Screenshot of MOCK_RESPONSE in JADX
- Explanation of why cleartext HTTP is dangerous`,

    'sensitive-logs': `# Student Guide — Sensitive Logs Challenge

## Objective
Use adb logcat to capture a flag that the app leaks to the Android log buffer.

## Tools Required
- adb — Android Debug Bridge (on host machine)
- Android device or emulator

## Step-by-Step

### Step 1: Install and launch the APK
\`\`\`bash
adb install vuln-debug.apk
adb shell am start -n com.training.vulnapp/.MainActivity
\`\`\`

### Step 2: Start logcat with tag filter (BEFORE pressing any buttons)
\`\`\`bash
adb logcat -s VULNLAB
\`\`\`
Keep this terminal open.

### Step 3: Press the button in the app
In the running app, press **"Generate Training Token"**.

### Step 4: Read the flag in logcat
The logcat terminal shows output like:
\`\`\`
D VULNLAB: === VulnLab Training Token Generation ===
D VULNLAB: user_id=student-001
D VULNLAB: training_token=TKN-TRAINING-...
D VULNLAB: flag=VULNLAB{...}
\`\`\`

The flag is the value after \`flag=\`.

## What to Submit
- The flag string (VULNLAB{...})
- Screenshot of logcat output
- Explanation of why logging sensitive data is dangerous`,

    'insecure-file-permission': `# Student Guide — Insecure File Permission Challenge

## Objective
Recover a flag written to world-readable external storage.

## Tools Required
- adb — Android Debug Bridge
- Android device or emulator with the app installed

## Step-by-Step

### Step 1: Install the APK
\`\`\`bash
adb install vuln-debug.apk
\`\`\`

### Step 2: Launch the app and press the button
Open the app. Press **"Initialize Storage"**. The app writes the flag to external storage.

### Step 3: Read from external storage (no root required)
\`\`\`bash
adb shell cat /sdcard/vulnlab/training_flag.txt
\`\`\`

### Step 4: (Alternative) Use run-as for internal storage
The app is also marked debuggable — access internal files:
\`\`\`bash
adb shell run-as com.training.vulnapp \\
  cat /data/data/com.training.vulnapp/files/training_flag.txt
\`\`\`

### Step 5: Read the flag
The file contains the flag.

## What to Submit
- The flag string (VULNLAB{...})
- Screenshot of adb shell output
- Explanation of why external storage and MODE_WORLD_READABLE are insecure`,

    'weak-input-validation': `# Student Guide — Weak Input Validation Challenge

## Objective
Find a bypass condition in the input validation logic and trigger it to reveal the flag.

## Tools Required
- JADX-GUI — to decompile and read Java source
- adb — to interact with the running app

## Step-by-Step

### Step 1: Install the APK
\`\`\`bash
adb install vuln-debug.apk
\`\`\`

### Step 2: Decompile with JADX
\`\`\`bash
jadx-gui vuln-debug.apk
\`\`\`

### Step 3: Find ValidationGate
Navigate: Source code → com → training → vulnapp → ValidationGate

### Step 4: Read isValidInput()
Study every \`if\` branch in \`isValidInput()\`. Look for conditions that return \`true\` beyond the intended "admin" check.

### Step 5: Test bypass conditions in the app
Open the app. In the "Enter admin code" input, try:
- Any all-digit string: \`42\`
- Any string ending with \`!\`: \`bypass!\`

### Step 6: Read the flag
The app displays the flag when isValidInput() returns true.

## What to Submit
- The flag string (VULNLAB{...})
- The bypass condition you found in JADX
- Explanation of why overly permissive validation is dangerous`,

    'insecure-debug-mode': `# Student Guide — Insecure Debug Mode Challenge

## Objective
Find android:debuggable="true" in the manifest, use adb sandbox access to read the flag from SharedPreferences.

## Tools Required
- apktool or jadx — for manifest inspection
- adb — to access the app sandbox

## Step-by-Step

### Step 1: Install the APK
\`\`\`bash
adb install vuln-debug.apk
\`\`\`

### Step 2: Verify the app is debuggable
\`\`\`bash
apktool d vuln-debug.apk -o extracted/
grep debuggable extracted/AndroidManifest.xml
\`\`\`
Expected: \`android:debuggable="true"\`

### Step 3: Launch the app and press the button
Open the app. Press **"Show Debug Info"** — this initializes the SharedPreferences storage.

### Step 4: Use adb run-as to access the app sandbox
\`\`\`bash
adb shell run-as com.training.vulnapp \\
  cat /data/data/com.training.vulnapp/shared_prefs/vulnlab_prefs.xml
\`\`\`

### Step 5: Read the flag
The XML file contains a key \`training_flag\` — its value is the flag.

## What to Submit
- The flag string (VULNLAB{...})
- Screenshot of the SharedPreferences XML content via adb
- Explanation of what android:debuggable="true" enables for attackers`,

    'vulnerable-jni-native-check': `# Student Guide — JNI Native Check Challenge

## Objective
Extract the APK, locate the native library, find the hardcoded unlock code using strings analysis, and enter it in the app to reveal the flag.

## Tools Required
- unzip — to extract APK contents
- strings — to extract printable strings from binary
- JADX-GUI — to inspect the Java wrapper class
- adb — to install and interact with the app

## Step-by-Step

### Step 1: Install the APK
\`\`\`bash
adb install vuln-debug.apk
\`\`\`

### Step 2: Inspect the Java wrapper in JADX
\`\`\`bash
jadx-gui vuln-debug.apk
\`\`\`
Find NativeGate.java:
- \`System.loadLibrary("nativecheck")\` — loads the native library
- \`public native boolean checkCode(String input)\` — calls native C code

### Step 3: Extract the APK
\`\`\`bash
unzip vuln-debug.apk -d extracted_apk/
\`\`\`

### Step 4: Find the native library
\`\`\`bash
find extracted_apk/ -name "*.so"
\`\`\`
Expected: \`extracted_apk/lib/arm64-v8a/libnativecheck.so\`

### Step 5: Extract strings from the native library
\`\`\`bash
strings extracted_apk/lib/arm64-v8a/libnativecheck.so | grep NATIVE
\`\`\`
Expected output: \`NATIVE-TRAINING-XXX\` (the exact unlock code)

### Step 6: Enter the unlock code in the app
- Open the app on your device/emulator
- Enter the exact NATIVE-TRAINING-XXX value in "Enter native unlock code"
- Press Submit

### Step 7: Read the flag
The app displays the flag if the code matches.

## Optional: Advanced Analysis
\`\`\`bash
# rabin2 (from radare2) — show all strings in binary
rabin2 -z extracted_apk/lib/arm64-v8a/libnativecheck.so

# Ghidra — open the .so, search Defined Strings, find NATIVE-TRAINING-XXX
# The JNI function name Java_com_training_vulnapp_NativeGate_checkCode shows the strcmp logic
\`\`\`

## What to Submit
- The flag string (VULNLAB{...})
- The output of the strings command
- Explanation of why native code does not hide secrets from analysis`,
  };

  return guides[moduleId] || `# Student Guide — ${moduleId}\n\nFollow the challenge hints and tools to recover the flag.`;
}

// ─── Module-specific teacher solution ────────────────────────────────────────

function buildTeacherSolution(moduleId, flag, cfg, module) {
  const solveGoal = SOLVE_GOALS[moduleId] || '';
  const flagLoc   = FLAG_LOCATIONS[moduleId] || 'In APK';

  let specifics = '';
  switch (moduleId) {
    case 'exported-component':
      specifics = `## Vulnerable Files
- AndroidManifest.xml — SecretFlagActivity with android:exported="true" and intent-filter

## Exact Exploit Command
\`\`\`bash
adb shell am start \\
  -n com.training.vulnapp/.SecretFlagActivity \\
  -a com.training.vulnapp.ACTION_OPEN_FLAG \\
  --es unlock training
\`\`\`

## Expected Result
SecretFlagActivity opens and displays: ${flag}

## Fix
Set android:exported="false" on SecretFlagActivity (or remove intent-filter and add signature-level permission).`;
      break;

    case 'secret-dummy':
      specifics = `## Vulnerable File
- src/TrainingConfig.java — UNLOCK_CODE = "${cfg.unlockCode}"

## JADX Path
jadx-gui vuln.apk → Source code → com.training.vulnapp → TrainingConfig → UNLOCK_CODE field

## Unlock Code
\`${cfg.unlockCode}\`

## Expected Result
Enter "${cfg.unlockCode}" in the app → flag displayed: ${flag}

## Fix
Remove UNLOCK_CODE from APK entirely. Authenticate via a backend API that validates credentials server-side.`;
      break;

    case 'cleartext-config':
      specifics = `## Vulnerable Files
- AndroidManifest.xml — usesCleartextTraffic="true"
- res/xml/network_security_config.xml — cleartextTrafficPermitted="true"
- src/NetworkClient.java — BASE_URL = "http://training.local/api" + MOCK_RESPONSE with flag

## JADX Path
jadx-gui vuln.apk → NetworkClient → MOCK_RESPONSE field value contains the flag JSON

## Flag Location
NetworkClient.MOCK_RESPONSE = {"status":"ok","flag":"${flag}","endpoint":"http://training.local/api/flag"}

## Fix
Change BASE_URL to https://. Set cleartextTrafficPermitted="false". Remove flag from client-side code.`;
      break;

    case 'sensitive-logs':
      specifics = `## Vulnerable File
- src/TrainingLogger.java — Log.d(TAG, "flag=" + FLAG)

## Exact Command
\`\`\`bash
adb logcat -s VULNLAB
# Then press "Generate Training Token" button
\`\`\`

## Expected Log Output
\`\`\`
D VULNLAB: flag=${flag}
\`\`\`

## Fix
Remove Log statements logging sensitive values. In release builds, use ProGuard rule: -assumenosideeffects class android.util.Log { ... }`;
      break;

    case 'insecure-file-permission':
      specifics = `## Vulnerable Paths
- /sdcard/vulnlab/training_flag.txt (external storage — no root needed)
- /data/data/com.training.vulnapp/files/training_flag.txt (MODE_WORLD_READABLE + debuggable)

## Exact Commands
\`\`\`bash
# External storage (no root needed)
adb shell cat /sdcard/vulnlab/training_flag.txt

# Internal (requires debuggable=true)
adb shell run-as com.training.vulnapp \\
  cat /data/data/com.training.vulnapp/files/training_flag.txt
\`\`\`

## Expected Output
flag=${flag}

## Fix
Never write sensitive data to external storage. Use MODE_PRIVATE for internal files. Set debuggable=false.`;
      break;

    case 'weak-input-validation':
      specifics = `## Vulnerable File
- src/ValidationGate.java — isValidInput() has multiple bypass conditions

## Bypass Conditions (all work)
1. Any all-numeric string: "42", "0", "999"
2. Any string ending with "!": "bypass!", "test!"
3. The intended "admin" code (case-insensitive)

## Exact Bypass
Enter "42" or "bypass!" in the app input field → flag displayed: ${flag}

## Fix
Replace all bypass conditions with a single strict check. Remove client-side gate entirely — validate server-side.`;
      break;

    case 'insecure-debug-mode':
      specifics = `## Vulnerable Manifest Entry
android:debuggable="true" in <application> tag

## Flag Location
SharedPreferences file: /data/data/com.training.vulnapp/shared_prefs/vulnlab_prefs.xml
Key: training_flag

## Exact Commands
\`\`\`bash
# Press button first to initialize storage, then:
adb shell run-as com.training.vulnapp \\
  cat /data/data/com.training.vulnapp/shared_prefs/vulnlab_prefs.xml
\`\`\`

## Expected Output
<string name="training_flag">${flag}</string>

## Fix
Remove android:debuggable="true". Gradle assembleRelease sets debuggable=false automatically. Never store flags/secrets in SharedPreferences.`;
      break;

    case 'vulnerable-jni-native-check':
      specifics = `## Native Library Path
lib/arm64-v8a/libnativecheck.so (also x86_64 and armeabi-v7a)

## Native Unlock Code
\`${cfg.nativeCode}\`

## Exact Commands
\`\`\`bash
unzip vuln-debug.apk -d extracted/
strings extracted/lib/arm64-v8a/libnativecheck.so | grep NATIVE
# Output: ${cfg.nativeCode}
\`\`\`

## Enter in App
"${cfg.nativeCode}" → app displays: ${flag}

## Fix
Remove hardcoded string from native code. Move validation server-side. The patched version always returns JNI_FALSE — real authorization happens on backend.`;
      break;
  }

  return `# Teacher Solution — ${module.name}

## Flag
\`${flag}\`

## Solve Goal
${solveGoal}

## Flag Location
${flagLoc}

## Challenge Config
${JSON.stringify(cfg, null, 2)}

${specifics}

## Vulnerability Overview
${module.description}

## Risk
${module.risk}

## Learning Objective
${module.learningObjective}

## Teacher Notes
- Do not reveal the flag or solve path to students before they attempt
- Use hints progressively — give one hint at a time
- Verify student submitted the correct flag (backend validates automatically)
- Review written writeup for quality and understanding depth

---
*Instructor-only content — do not share with students before challenge completion*`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

function generateChallenge({ moduleId, difficulty, appType, quizCount, showPatched }) {
  const module = allModules.find(m => m.id === moduleId);
  if (!module) throw new Error(`Module not found: ${moduleId}`);

  const flag   = generateFlag(moduleId);
  const cfg    = generateChallengeConfig(moduleId);
  const count  = Math.min(Math.max(parseInt(quizCount) || 10, 5), 30);
  const quiz   = generateQuiz(moduleId, count);

  const challenge = {
    id: `challenge-${Date.now()}`,
    moduleId,
    title: `Challenge: ${module.name}`,
    difficulty: difficulty || module.difficulty,
    appType: appType || 'android',
    quizCount: count,
    showPatched: !!showPatched,
    generatedAt: new Date().toISOString(),
    flag,
    flagLocation: FLAG_LOCATIONS[moduleId] || 'Inside the APK',
    solveGoal: SOLVE_GOALS[moduleId] || 'Analyze the APK and find the flag.',
    expectedTools: EXPECTED_TOOLS[moduleId] || ['apktool', 'jadx', 'adb'],
    challengeConfig: cfg,
    module: {
      id: module.id, name: module.name, category: module.category,
      description: module.description, risk: module.risk,
      learningObjective: module.learningObjective
    },
    vulnerableApp: {
      description: `Vulnerable ${module.name} — real solvable challenge APK with flag embedded`,
      language: moduleId === 'vulnerable-jni-native-check' ? 'c+java' : 'java'
    },
    patchedApp: showPatched ? {
      description: `Patched ${module.name} — vulnerability mitigated, flag no longer recoverable`,
      language: moduleId === 'vulnerable-jni-native-check' ? 'c+java' : 'java'
    } : null,
    studentGuide: buildStudentGuide(moduleId, flag, cfg),
    teacherSolution: buildTeacherSolution(moduleId, flag, cfg, module),
    hints: buildHints(moduleId, flag, cfg),
    quiz,
    submissions: []
  };

  const all = loadChallenges();
  all.push(challenge);
  saveChallenges(all);
  return challenge;
}

function listChallenges() {
  return loadChallenges().map(c => ({
    id: c.id, title: c.title, moduleId: c.moduleId,
    difficulty: c.difficulty, quizCount: c.quizCount,
    showPatched: c.showPatched, generatedAt: c.generatedAt,
    submissionCount: c.submissions.length
  }));
}

function getChallenge(id, adminView = false) {
  const c = loadChallenges().find(ch => ch.id === id);
  if (!c) throw new Error('Challenge not found');
  if (adminView) return c;
  // Student view: no flag, no teacher solution, hide patched if not allowed
  const { flag, teacherSolution, challengeConfig, ...safe } = c;
  if (!c.showPatched) safe.patchedApp = null;
  return safe;
}

function submitChallenge(id, { studentName, quizAnswers, writeup, submittedFlag }) {
  const { scoreQuiz } = require('./quizGeneratorService');
  const all = loadChallenges();
  const idx = all.findIndex(c => c.id === id);
  if (idx === -1) throw new Error('Challenge not found');

  const challenge  = all[idx];
  const quizResult = scoreQuiz(challenge.quiz, quizAnswers || []);
  const flagCorrect = typeof submittedFlag === 'string'
    && submittedFlag.trim() === challenge.flag;

  // Scoring: flag 50%, quiz 30%, writeup presence 20%
  const flagScore    = flagCorrect ? 50 : 0;
  const quizScore    = Math.round(quizResult.score * 0.3);
  const writeupScore = (writeup && writeup.trim().length > 50) ? 20 : (writeup && writeup.trim().length > 0 ? 10 : 0);
  const finalScore   = flagScore + quizScore + writeupScore;

  const submission = {
    id: `sub-${Date.now()}`,
    studentName: studentName || 'Anonymous',
    quizAnswers: quizAnswers || [],
    quizResult,
    writeup: writeup || '',
    submittedFlag: submittedFlag || '',
    flagCorrect,
    quizScore: quizResult.score,
    finalScore,
    feedback: '',
    rating: null,
    submittedAt: new Date().toISOString(),
    ratedAt: null
  };

  all[idx].submissions.push(submission);
  saveChallenges(all);
  return { submission, quizResult, flagCorrect, finalScore };
}

function rateSubmission(challengeId, submissionId, { rating, feedback }) {
  const all  = loadChallenges();
  const cidx = all.findIndex(c => c.id === challengeId);
  if (cidx === -1) throw new Error('Challenge not found');
  const sidx = all[cidx].submissions.findIndex(s => s.id === submissionId);
  if (sidx === -1) throw new Error('Submission not found');
  all[cidx].submissions[sidx].rating   = Math.min(5, Math.max(1, parseInt(rating) || 3));
  all[cidx].submissions[sidx].feedback = feedback || '';
  all[cidx].submissions[sidx].ratedAt  = new Date().toISOString();
  saveChallenges(all);
  return all[cidx].submissions[sidx];
}

function deleteChallenge(id) {
  const all = loadChallenges();
  const idx = all.findIndex(c => c.id === id);
  if (idx === -1) throw new Error('Challenge not found');
  all.splice(idx, 1);
  saveChallenges(all);
}

module.exports = {
  generateChallenge, listChallenges, getChallenge,
  submitChallenge, rateSubmission, deleteChallenge
};
