'use strict';

const { execSync }  = require('child_process');
const fs            = require('fs');
const path          = require('path');
const os            = require('os');
const templates     = require('./apkTemplates');
const { getChallengeFiles } = require('./challengeTemplates');

const SDK    = process.env.ANDROID_SDK_ROOT || '/opt/android-sdk';
const BT     = path.join(SDK, 'build-tools', '34.0.0');
const AAPT2  = path.join(BT, 'aapt2');
const D8     = path.join(BT, 'd8');
const SIGN   = path.join(BT, 'apksigner');
const ALIGN  = path.join(BT, 'zipalign');
const JAR    = path.join(SDK, 'platforms', 'android-33', 'android.jar');
const KS     = path.join(SDK, 'debug.jks');
const PKG_PATH = 'com/training/vulnapp';

// NDK — installed by Dockerfile
const NDK_ROOT = process.env.ANDROID_NDK_ROOT || path.join(SDK, 'ndk', '25.2.9519653');
const NDK_BIN  = path.join(NDK_ROOT, 'toolchains', 'llvm', 'prebuilt', 'linux-x86_64', 'bin');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function findFiles(dir, ext) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory())            results.push(...findFiles(full, ext));
    else if (entry.name.endsWith(ext))  results.push(full);
  }
  return results;
}

function run(cmd, cwd) {
  execSync(cmd, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
}

function sanitize(name) {
  return (name || 'VulnLab').replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').slice(0, 40);
}

function ndkClang(abi) {
  const clangMap = {
    'arm64-v8a':   'aarch64-linux-android21-clang',
    'armeabi-v7a': 'armv7a-linux-androideabi21-clang',
    'x86_64':      'x86_64-linux-android21-clang',
    'x86':         'i686-linux-android21-clang',
  };
  const bin = clangMap[abi];
  if (!bin) throw new Error(`Unknown ABI: ${abi}`);
  return path.join(NDK_BIN, bin);
}

function hasNdk() {
  const clang = ndkClang('arm64-v8a');
  return fs.existsSync(clang);
}

// ─── Challenge-mode file writer ───────────────────────────────────────────────

function writeChallengeFiles(lab, tmpDir) {
  const { modules, fixMode, flag, challengeConfig } = lab;
  const moduleId = modules[0].id;

  const files = getChallengeFiles(moduleId, fixMode, flag, challengeConfig);

  for (const [relPath, content] of Object.entries(files)) {
    // Map file keys to actual paths in tmpDir
    let absPath;
    if (relPath === 'AndroidManifest.xml') {
      absPath = path.join(tmpDir, 'AndroidManifest.xml');
    } else if (relPath.startsWith('src/')) {
      absPath = path.join(tmpDir, 'src', PKG_PATH, relPath.slice(4));
    } else if (relPath.startsWith('res/')) {
      absPath = path.join(tmpDir, relPath);
    } else if (relPath.startsWith('jni/')) {
      absPath = path.join(tmpDir, relPath);
    } else {
      absPath = path.join(tmpDir, relPath);
    }
    fs.mkdirSync(path.dirname(absPath), { recursive: true });
    fs.writeFileSync(absPath, content, 'utf8');
  }
}

// ─── Lab-mode file writer (existing behavior) ─────────────────────────────────

function writeProjectFiles(lab, tmpDir) {
  const { modules, fixMode, title } = lab;
  const ids = new Set(modules.map(m => m.id));

  const src  = path.join(tmpDir, 'src', PKG_PATH);
  const res  = path.join(tmpDir, 'res');
  const jni  = path.join(tmpDir, 'jni');

  [src, path.join(res, 'layout'), path.join(res, 'values'), path.join(res, 'xml'), jni]
    .forEach(d => fs.mkdirSync(d, { recursive: true }));

  const w = (p, content) => fs.writeFileSync(p, content, 'utf8');

  w(path.join(tmpDir, 'AndroidManifest.xml'), templates.generateManifest(modules, fixMode));
  w(path.join(res, 'layout', 'activity_main.xml'), templates.generateMainLayout());
  w(path.join(res, 'values', 'strings.xml'), templates.generateStrings(title));
  if (ids.has('cleartext-config')) {
    w(path.join(res, 'xml', 'network_security_config.xml'), templates.generateNetworkConfig(fixMode));
  }
  w(path.join(src, 'MainActivity.java'), templates.generateMainActivity(modules, fixMode));
  if (ids.has('exported-component')) {
    w(path.join(src, 'AdminActivity.java'), templates.generateAdminActivity(fixMode));
  }
  if (ids.has('vulnerable-jni-native-check')) {
    w(path.join(jni, 'native-lib.cpp'), templates.generateNativeLibCpp(fixMode));
    w(path.join(jni, 'CMakeLists.txt'), templates.generateCMakeLists());
    if (!fixMode) {
      w(path.join(tmpDir, 'frida-hook-jni-demo.js'), templates.generateFridaHook());
    }
  }
}

// ─── NDK compilation ──────────────────────────────────────────────────────────

function compileNativeLib(cSrcPath, tmpDir) {
  if (!hasNdk()) {
    console.warn('[APK] NDK not found — skipping native .so compilation');
    return false;
  }

  const abis = ['arm64-v8a', 'x86_64', 'armeabi-v7a'];
  let compiled = false;

  for (const abi of abis) {
    const clang  = ndkClang(abi);
    const libDir = path.join(tmpDir, 'lib', abi);
    fs.mkdirSync(libDir, { recursive: true });
    const soOut  = path.join(libDir, 'libnativecheck.so');

    try {
      run(
        `"${clang}" -shared -fPIC -O2 -o "${soOut}" "${cSrcPath}"`,
        tmpDir
      );
      console.log(`[APK] Compiled libnativecheck.so for ${abi}`);
      compiled = true;
    } catch (err) {
      console.warn(`[APK] NDK compile failed for ${abi}: ${err.message.slice(0, 120)}`);
    }
  }

  return compiled;
}

// ─── APK build pipeline ───────────────────────────────────────────────────────

async function buildApk(lab) {
  if (!fs.existsSync(AAPT2)) {
    throw new Error(
      'Android SDK not found. Run the app via Docker (docker compose up --build) ' +
      'so the backend container has the Android build tools installed.'
    );
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vulnlab-'));
  const isChallenge = !!lab.flag;

  try {
    // Write source files
    if (isChallenge) {
      writeChallengeFiles(lab, tmpDir);
    } else {
      writeProjectFiles(lab, tmpDir);
    }

    // Compile NDK native library if present
    const cSrc = path.join(tmpDir, 'jni', 'native-check.c');
    let hasNativeLib = false;
    if (fs.existsSync(cSrc)) {
      hasNativeLib = compileNativeLib(cSrc, tmpDir);
      if (!hasNativeLib) {
        console.warn('[APK] No native .so compiled — JNI challenge will be incomplete');
      }
    }

    const compiledRes = path.join(tmpDir, 'compiled_res');
    const genDir      = path.join(tmpDir, 'gen', PKG_PATH);
    const classesDir  = path.join(tmpDir, 'classes');
    const outDir      = path.join(tmpDir, 'out');
    [compiledRes, genDir, classesDir, outDir].forEach(d => fs.mkdirSync(d, { recursive: true }));

    const resDir  = path.join(tmpDir, 'res');
    const manifest = path.join(tmpDir, 'AndroidManifest.xml');
    const srcDir   = path.join(tmpDir, 'src');
    const genRoot  = path.join(tmpDir, 'gen');

    // Step 1: compile resources
    if (!fs.existsSync(resDir) || fs.readdirSync(resDir).length === 0) {
      throw new Error('No resource directory found in project files');
    }
    run(`"${AAPT2}" compile --dir "${resDir}" -o "${compiledRes}"`, tmpDir);

    const flatFiles = findFiles(compiledRes, '.flat').map(f => `"${f}"`).join(' ');
    if (!flatFiles) throw new Error('No compiled resource files found');

    // Step 2: link resources + generate R.java
    const linkedApk = path.join(outDir, 'linked.apk');
    run(
      `"${AAPT2}" link ${flatFiles} -I "${JAR}" ` +
      `--manifest "${manifest}" --java "${genRoot}" ` +
      `--min-sdk-version 21 --target-sdk-version 33 ` +
      `--version-code 1 --version-name "1.0" -o "${linkedApk}"`,
      tmpDir
    );

    // Step 3: compile Java
    const javaFiles = [
      ...findFiles(srcDir, '.java'),
      ...findFiles(genRoot, '.java')
    ].map(f => `"${f}"`).join(' ');

    run(
      `javac -classpath "${JAR}" -source 1.8 -target 1.8 ` +
      `-d "${classesDir}" ${javaFiles}`,
      tmpDir
    );

    // Step 4: jar class files for d8
    const classesJar = path.join(tmpDir, 'classes.jar');
    run(`jar cf "${classesJar}" -C "${classesDir}" .`, tmpDir);

    // Step 5: DEX
    run(`"${D8}" --release --output "${outDir}" "${classesJar}"`, tmpDir);

    const dexFile = path.join(outDir, 'classes.dex');
    if (!fs.existsSync(dexFile)) throw new Error('DEX compilation produced no output');

    // Step 6: add DEX into linked APK
    run(`zip -j "${linkedApk}" "${dexFile}"`, outDir);

    // Step 7: add native .so files into APK (preserve lib/<abi>/ paths)
    const libDir = path.join(tmpDir, 'lib');
    if (hasNativeLib && fs.existsSync(libDir)) {
      // zip from tmpDir to preserve lib/ directory structure
      const soFiles = findFiles(libDir, '.so').map(f => {
        const rel = path.relative(tmpDir, f);
        return `"${rel}"`;
      }).join(' ');
      if (soFiles) {
        run(`zip "${linkedApk}" ${soFiles}`, tmpDir);
        console.log('[APK] Native libraries added to APK');
      }
    }

    // Step 8: zipalign
    const alignedApk = path.join(outDir, 'aligned.apk');
    run(`"${ALIGN}" -f 4 "${linkedApk}" "${alignedApk}"`, outDir);

    // Step 9: sign
    const apkName  = sanitize(lab.title) + '-debug.apk';
    const signedApk = path.join(outDir, apkName);
    run(
      `"${SIGN}" sign --ks "${KS}" ` +
      `--ks-pass pass:android --key-pass pass:android ` +
      `--ks-key-alias debugkey --out "${signedApk}" "${alignedApk}"`,
      outDir
    );

    const apkBuffer = fs.readFileSync(signedApk);
    return { buffer: apkBuffer, filename: apkName, hasNativeLib };

  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
  }
}

module.exports = { buildApk };
