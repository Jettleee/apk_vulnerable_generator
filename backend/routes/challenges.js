const express = require('express');
const router  = express.Router();
const svc = require('../services/challengeGeneratorService');
const { buildApk } = require('../services/apkBuilderService');
const allModules   = require('../data/modules.json');

// Admin: generate new challenge
router.post('/generate', (req, res) => {
  const { moduleId, difficulty, appType, quizCount, showPatched } = req.body;
  if (!moduleId) return res.status(400).json({ error: 'moduleId required' });
  try {
    const challenge = svc.generateChallenge({ moduleId, difficulty, appType, quizCount, showPatched });
    res.status(201).json(challenge);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin: list all challenges
router.get('/', (_req, res) => {
  res.json(svc.listChallenges());
});

// Get single challenge (student view by default, admin=true for full)
router.get('/:id', (req, res) => {
  const admin = req.query.admin === 'true';
  try {
    res.json(svc.getChallenge(req.params.id, admin));
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// Student: submit quiz + writeup + flag
router.post('/:id/submit', (req, res) => {
  const { studentName, quizAnswers, writeup, submittedFlag } = req.body;
  try {
    const result = svc.submitChallenge(req.params.id,
      { studentName, quizAnswers, writeup, submittedFlag });
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin: rate a submission
router.post('/:id/submissions/:subId/rate', (req, res) => {
  const { rating, feedback } = req.body;
  try {
    const sub = svc.rateSubmission(req.params.id, req.params.subId, { rating, feedback });
    res.json(sub);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// APK download — type: 'vuln' | 'patched'
router.get('/:id/apk/:type', async (req, res) => {
  const { id, type } = req.params;
  if (type !== 'vuln' && type !== 'patched') {
    return res.status(400).json({ error: 'type must be vuln or patched' });
  }

  let challenge;
  try {
    challenge = svc.getChallenge(id, true); // admin view to get flag + challengeConfig
  } catch (err) {
    return res.status(404).json({ error: err.message });
  }

  const fullModule = allModules.find(m => m.id === challenge.moduleId);
  if (!fullModule) return res.status(400).json({ error: 'Module not found in registry' });

  const fixMode = type === 'patched';
  const label   = fixMode ? 'patched' : 'vuln';

  // Pass flag and challengeConfig so challenge templates embed real solvable behavior
  const lab = {
    title: `${challenge.module.name}-${label}`,
    modules: [fullModule],
    fixMode,
    flag: challenge.flag,
    challengeConfig: challenge.challengeConfig || {}
  };

  try {
    const { buffer, filename, hasNativeLib } = await buildApk(lab);
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    if (hasNativeLib) res.setHeader('X-Has-Native-Lib', 'true');
    res.send(buffer);
  } catch (err) {
    console.error('Challenge APK build error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Admin: delete challenge
router.delete('/:id', (req, res) => {
  try {
    svc.deleteChallenge(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

module.exports = router;
