const express = require('express');
const router = express.Router();
const { generateLab } = require('../services/generatorService');

router.post('/', (req, res) => {
  const { title, description, level, labType, selectedModules, fixMode } = req.body;
  if (!selectedModules || selectedModules.length === 0) {
    return res.status(400).json({ error: 'Select at least one module' });
  }
  const lab = generateLab({ title, description, level, labType, selectedModules, fixMode });
  res.json(lab);
});

module.exports = router;
