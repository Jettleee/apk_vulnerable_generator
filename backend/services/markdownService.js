function labToMarkdown(lab) {
  const lines = [];

  lines.push('> **SAFETY DISCLAIMER:** This lab is for educational and defensive security training only.');
  lines.push('> All code examples use fake data and dummy credentials.');
  lines.push('> Do not apply these techniques to real systems without explicit written authorization.\n');
  lines.push('---\n');
  lines.push(`# ${lab.title}\n`);
  lines.push(`**Generated:** ${lab.generatedAt}`);
  lines.push(`**Level:** ${lab.level}`);
  lines.push(`**Lab Type:** ${lab.labType}`);
  lines.push(`**Fix Mode:** ${lab.fixMode ? 'Enabled' : 'Disabled'}\n`);

  if (lab.description) {
    lines.push(`## Description\n\n${lab.description}\n`);
  }

  lines.push(lab.scenario + '\n');
  lines.push('---\n');

  for (const mod of lab.modules) {
    lines.push(`# Module: ${mod.name}\n`);
    lines.push(`**Category:** ${mod.category} | **Difficulty:** ${mod.difficulty}\n`);
    lines.push(`## Description\n\n${mod.description}\n`);
    lines.push(`## Risk\n\n${mod.risk}\n`);
    lines.push(`## Learning Objective\n\n${mod.learningObjective}\n`);
    lines.push(`## Vulnerable Example\n\n\`\`\`\n${mod.vulnerableExample}\n\`\`\`\n`);

    if (lab.fixMode) {
      lines.push(`## Fixed Example\n\n\`\`\`\n${mod.fixedExample}\n\`\`\`\n`);
    }

    lines.push(`## Student Task\n\n${mod.studentTask}\n`);
    lines.push(`## Teacher Correction\n\n${mod.teacherCorrection}\n`);
    lines.push(`## Test / Non-Regression Check\n\n${mod.testCheck}\n`);

    lines.push(`## QCM\n`);
    mod.qcm.forEach((q, i) => {
      lines.push(`### Q${i + 1}: ${q.question}\n`);
      q.choices.forEach(c => lines.push(`- ${c}`));
      lines.push(`\n**Correct Answer:** ${q.correct}`);
      lines.push(`**Explanation:** ${q.explanation}\n`);
    });

    lines.push(`## Student Checklist\n`);
    mod.checklist.forEach(item => lines.push(`- [ ] ${item}`));
    lines.push('');

    lines.push(`## Teacher Evaluation Rubric\n`);
    lines.push('| Criterion | Weight |');
    lines.push('|-----------|--------|');
    mod.rubric.forEach(r => lines.push(`| ${r.criterion} | ${r.weight} |`));
    lines.push('');

    lines.push('---\n');
  }

  lines.push('\n> **END OF LAB** — This content is for authorized educational use only.\n');
  return lines.join('\n');
}

module.exports = { labToMarkdown };
