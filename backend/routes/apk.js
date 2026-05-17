const express = require('express');
const router  = express.Router();
const { buildApk } = require('../services/apkBuilderService');

router.post('/build', async (req, res) => {
  const { lab } = req.body;
  if (!lab || !lab.modules || lab.modules.length === 0) {
    return res.status(400).json({ error: 'No lab data provided' });
  }

  try {
    const { buffer, filename } = await buildApk(lab);
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (err) {
    console.error('APK build error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
