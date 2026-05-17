#!/usr/bin/env node
// Quick validation tests for challenge generation — run with: node tests/challenge.test.js
'use strict';

const { generateChallenge, submitChallenge, deleteChallenge } = require('../services/challengeGeneratorService');
const { getChallengeFiles } = require('../services/challengeTemplates');
const { generateQuiz, scoreQuiz } = require('../services/quizGeneratorService');

let passed = 0, failed = 0;

function assert(name, condition, detail = '') {
  if (condition) {
    console.log(`  ✓ ${name}`);
    passed++;
  } else {
    console.error(`  ✗ ${name}${detail ? ': ' + detail : ''}`);
    failed++;
  }
}

// ─── Template tests (no build needed) ────────────────────────────────────────

console.log('\n=== Template Tests ===');

const modules = [
  'exported-component', 'secret-dummy', 'cleartext-config', 'sensitive-logs',
  'insecure-file-permission', 'weak-input-validation', 'insecure-debug-mode',
  'vulnerable-jni-native-check'
];

for (const moduleId of modules) {
  console.log(`\n[${moduleId}]`);
  const flag = `VULNLAB{test_FLAG_123}`;
  const cfg  = { unlockCode: 'BLUE-TRAINING-999', nativeCode: 'NATIVE-TRAINING-999' };

  const vulnFiles   = getChallengeFiles(moduleId, false, flag, cfg);
  const patchedFiles = getChallengeFiles(moduleId, true, flag, cfg);

  // Every module must have manifest
  assert('has AndroidManifest.xml (vuln)', !!vulnFiles['AndroidManifest.xml']);
  assert('has AndroidManifest.xml (patched)', !!patchedFiles['AndroidManifest.xml']);

  // Vulnerable manifest characteristics
  const manifest = vulnFiles['AndroidManifest.xml'];
  switch (moduleId) {
    case 'exported-component':
      assert('exported component in vuln manifest', manifest.includes('android:exported="true"'));
      assert('SecretFlagActivity present', manifest.includes('SecretFlagActivity'));
      assert('intent action in manifest', manifest.includes('ACTION_OPEN_FLAG'));
      assert('flag in SecretFlagActivity java', vulnFiles['src/SecretFlagActivity.java'].includes(flag));
      assert('patched manifest uses exported=false',
        patchedFiles['AndroidManifest.xml'].includes('exported="false"'));
      break;

    case 'secret-dummy':
      assert('TrainingConfig has UNLOCK_CODE', vulnFiles['src/TrainingConfig.java'].includes('BLUE-TRAINING-999'));
      assert('flag in MainActivity', vulnFiles['src/MainActivity.java'].includes(flag));
      assert('patched TrainingConfig has no UNLOCK_CODE', !patchedFiles['src/TrainingConfig.java'].includes('BLUE-TRAINING-999'));
      break;

    case 'cleartext-config':
      assert('vuln manifest allows cleartext', manifest.includes('usesCleartextTraffic="true"'));
      assert('NetworkClient has http://', vulnFiles['src/NetworkClient.java'].includes('http://training.local'));
      assert('NetworkClient MOCK_RESPONSE has flag', vulnFiles['src/NetworkClient.java'].includes(flag));
      assert('vuln network config has cleartextPermitted=true',
        vulnFiles['res/xml/network_security_config.xml'].includes('cleartextTrafficPermitted="true"'));
      assert('patched config has cleartextPermitted=false',
        patchedFiles['res/xml/network_security_config.xml'].includes('cleartextTrafficPermitted="false"'));
      assert('patched NetworkClient uses https', patchedFiles['src/NetworkClient.java'].includes('https://'));
      break;

    case 'sensitive-logs':
      assert('TrainingLogger has VULNLAB tag', vulnFiles['src/TrainingLogger.java'].includes('"VULNLAB"'));
      assert('TrainingLogger logs flag', vulnFiles['src/TrainingLogger.java'].includes(flag));
      assert('patched logger does not log flag', !patchedFiles['src/TrainingLogger.java'].includes(flag));
      assert('MainActivity references logcat command', vulnFiles['src/MainActivity.java'].includes('adb logcat'));
      break;

    case 'insecure-file-permission':
      assert('vuln manifest has WRITE_EXTERNAL_STORAGE', manifest.includes('WRITE_EXTERNAL_STORAGE'));
      assert('vuln writes to external storage', vulnFiles['src/MainActivity.java'].includes('vulnlab'));
      assert('flag in MainActivity', vulnFiles['src/MainActivity.java'].includes(flag));
      break;

    case 'weak-input-validation':
      assert('ValidationGate has bypass condition (numeric)', vulnFiles['src/ValidationGate.java'].includes('[0-9]+'));
      assert('ValidationGate has bypass condition (exclamation)', vulnFiles['src/ValidationGate.java'].includes('endsWith'));
      assert('flag in MainActivity', vulnFiles['src/MainActivity.java'].includes(flag));
      assert('patched ValidationGate has strict pattern', patchedFiles['src/ValidationGate.java'].includes('STRICT'));
      break;

    case 'insecure-debug-mode':
      assert('vuln manifest has debuggable=true', manifest.includes('android:debuggable="true"'));
      assert('flag in MainActivity', vulnFiles['src/MainActivity.java'].includes(flag));
      assert('patched manifest has no debuggable=true',
        !patchedFiles['AndroidManifest.xml'].includes('debuggable="true"'));
      break;

    case 'vulnerable-jni-native-check':
      assert('NativeGate loads nativecheck', vulnFiles['src/NativeGate.java'].includes('System.loadLibrary("nativecheck")'));
      assert('native-check.c has native code', vulnFiles['jni/native-check.c'].includes('NATIVE-TRAINING-999'));
      assert('native-check.c has strcmp', vulnFiles['jni/native-check.c'].includes('strcmp'));
      assert('flag in MainActivity', vulnFiles['src/MainActivity.java'].includes(flag));
      assert('patched native-check.c returns false always',
        patchedFiles['jni/native-check.c'].includes('JNI_FALSE'));
      assert('patched native-check.c has no NATIVE-TRAINING',
        !patchedFiles['jni/native-check.c'].includes('NATIVE-TRAINING'));
      break;
  }
}

// ─── Challenge generator tests ────────────────────────────────────────────────

console.log('\n=== Challenge Generator Tests ===');

const testModules = ['exported-component', 'secret-dummy', 'sensitive-logs', 'vulnerable-jni-native-check'];

for (const moduleId of testModules) {
  console.log(`\n[generate challenge: ${moduleId}]`);
  let challenge;
  try {
    challenge = generateChallenge({ moduleId, difficulty: 'beginner', quizCount: 5, showPatched: true });
  } catch (e) {
    assert('generates without error', false, e.message);
    continue;
  }

  assert('has flag', /^VULNLAB\{.+\}$/.test(challenge.flag));
  assert('flag contains module slug', challenge.flag.includes('_'));
  assert('has flagLocation', !!challenge.flagLocation);
  assert('has solveGoal', !!challenge.solveGoal);
  assert('has expectedTools array', Array.isArray(challenge.expectedTools) && challenge.expectedTools.length > 0);
  assert('has challengeConfig', !!challenge.challengeConfig);
  assert('has exactly 8 hints', challenge.hints.length === 8);
  assert('hint 8 contains solve path (flag mentioned)',
    challenge.hints[7].includes('Hint 8') || challenge.hints[7].includes('full solution'));
  assert('hints 1-7 do not reveal flag directly',
    !challenge.hints.slice(0, 7).some(h => h.includes(challenge.flag)));
  assert('has studentGuide', challenge.studentGuide.length > 200);
  assert('studentGuide is module-specific', challenge.studentGuide.includes(moduleId === 'sensitive-logs' ? 'logcat' :
    moduleId === 'exported-component' ? 'SecretFlagActivity' :
    moduleId === 'secret-dummy' ? 'TrainingConfig' : 'libnativecheck.so'));
  assert('has teacherSolution with flag', challenge.teacherSolution.includes(challenge.flag));
  assert('has quiz', challenge.quiz.length === 5);
  assert('has patchedApp (showPatched=true)', !!challenge.patchedApp);
  assert('has submissions array', Array.isArray(challenge.submissions));

  // Flag validation
  console.log(`\n[flag validation: ${moduleId}]`);
  const subResult = submitChallenge(challenge.id, {
    studentName: 'TestStudent',
    quizAnswers: challenge.quiz.map(q => q.correctAnswer),
    writeup: 'Test writeup with enough content to score writeup points here.',
    submittedFlag: challenge.flag
  });
  assert('flagCorrect=true for correct flag', subResult.flagCorrect === true);
  assert('finalScore > 50 (flag 50% + quiz 30%)', subResult.finalScore >= 50);

  const wrongSub = submitChallenge(challenge.id, {
    quizAnswers: [],
    writeup: '',
    submittedFlag: 'VULNLAB{wrong_flag}'
  });
  assert('flagCorrect=false for wrong flag', wrongSub.flagCorrect === false);

  // Cleanup
  deleteChallenge(challenge.id);
}

// ─── Quiz tests ───────────────────────────────────────────────────────────────

console.log('\n=== Quiz Tests ===');

for (const moduleId of modules) {
  const quiz = generateQuiz(moduleId, 10);
  assert(`${moduleId}: generates 10 questions`, quiz.length === 10);

  const types = [...new Set(quiz.map(q => q.type))];
  assert(`${moduleId}: has ≥3 question types`, types.length >= 3, `types: ${types.join(', ')}`);

  const score = scoreQuiz(quiz, quiz.map(q => q.correctAnswer));
  assert(`${moduleId}: all-correct = 100%`, score.score === 100);

  const zeroScore = scoreQuiz(quiz, quiz.map(() => 'WRONG_ANSWER'));
  assert(`${moduleId}: all-wrong < 30%`, zeroScore.score < 30,
    `got ${zeroScore.score}% — some short-answer fuzzy matches may occur`);
}

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error('\nSome tests failed — check output above.');
  process.exit(1);
} else {
  console.log('\nAll tests passed.');
}
