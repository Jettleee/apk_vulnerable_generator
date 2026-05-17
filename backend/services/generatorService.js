const allModules = require('../data/modules.json');

function generateLab({ title, description, level, labType, selectedModules, fixMode }) {
  const modules = selectedModules
    .map(id => allModules.find(m => m.id === id))
    .filter(Boolean);

  return {
    id: `lab-${Date.now()}`,
    title: title || 'Security Training Lab',
    description: description || '',
    level: level || 'beginner',
    labType: labType || 'android',
    fixMode: !!fixMode,
    generatedAt: new Date().toISOString(),
    scenario: buildScenario(title, description, level, labType, modules, fixMode),
    modules,
    safetyDisclaimer:
      'This lab is for educational purposes only. All examples use fake/dummy data. ' +
      'Do not use these techniques against real applications or systems without authorization.'
  };
}

function buildScenario(title, description, level, labType, modules, fixMode) {
  const names = modules.map(m => m.name).join(', ');
  return (
    `## Lab Scenario\n\n` +
    `**Title:** ${title || 'Security Training Lab'}\n` +
    `**Level:** ${level}\n` +
    `**Type:** ${labType}\n` +
    `**Fix Mode:** ${fixMode ? 'Enabled — fixes are shown' : 'Disabled — student must find fixes'}\n` +
    `**Modules:** ${names}\n\n` +
    `${description || 'Complete the security analysis tasks for each vulnerability module below.'}\n\n` +
    `> **Safety Notice:** All examples use fake credentials and toy applications. ` +
    `Never apply these techniques to real systems without written authorization.`
  );
}

module.exports = { generateLab };
