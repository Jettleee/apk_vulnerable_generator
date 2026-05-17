const express = require('express');
const router = express.Router();
const { labToMarkdown } = require('../services/markdownService');

router.post('/markdown', (req, res) => {
  const { lab } = req.body;
  if (!lab) return res.status(400).json({ error: 'No lab data provided' });
  res.json({ markdown: labToMarkdown(lab) });
});

module.exports = router;
