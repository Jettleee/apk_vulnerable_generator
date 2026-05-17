const express = require('express');
const router = express.Router();
const modules = require('../data/modules.json');

router.get('/', (req, res) => {
  const { category, difficulty } = req.query;
  let result = modules;
  if (category) result = result.filter(m => m.category === category);
  if (difficulty) result = result.filter(m => m.difficulty === difficulty);
  res.json(result);
});

router.get('/:id', (req, res) => {
  const mod = modules.find(m => m.id === req.params.id);
  if (!mod) return res.status(404).json({ error: 'Module not found' });
  res.json(mod);
});

module.exports = router;
