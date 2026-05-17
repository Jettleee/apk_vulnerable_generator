import { useState } from 'react';

function Section({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden mb-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-700 transition"
      >
        {title}
        <span className="text-gray-400">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-4 py-3 bg-white">{children}</div>}
    </div>
  );
}

function CodeBlock({ code }) {
  return <pre className="code-block max-h-72 overflow-auto text-xs">{code}</pre>;
}

function QCMList({ qcm }) {
  return (
    <div className="space-y-4">
      {qcm.map((q, i) => (
        <div key={i} className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm font-medium text-gray-700 mb-2">Q{i + 1}: {q.question}</p>
          <ul className="space-y-1 mb-2">
            {q.choices.map((c, ci) => (
              <li key={ci} className={`text-xs px-2 py-1 rounded ${c.startsWith(q.correct) ? 'bg-green-100 text-green-800 font-medium' : 'text-gray-600'}`}>
                {c}
              </li>
            ))}
          </ul>
          <p className="text-xs text-indigo-700 italic">{q.explanation}</p>
        </div>
      ))}
    </div>
  );
}

function Checklist({ items }) {
  return (
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
          <span className="text-gray-300 mt-0.5">☐</span>
          {item}
        </li>
      ))}
    </ul>
  );
}

function Rubric({ rubric }) {
  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="bg-gray-50">
          <th className="text-left px-3 py-2 text-gray-600 font-medium border border-gray-100">Criterion</th>
          <th className="text-left px-3 py-2 text-gray-600 font-medium border border-gray-100">Weight</th>
        </tr>
      </thead>
      <tbody>
        {rubric.map((r, i) => (
          <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
            <td className="px-3 py-2 text-gray-700 border border-gray-100">{r.criterion}</td>
            <td className="px-3 py-2 text-indigo-700 font-semibold border border-gray-100">{r.weight}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function LabPreview({ lab }) {
  return (
    <div className="space-y-4">
      {/* Lab header */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap gap-2 mb-2">
          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full capitalize">{lab.level}</span>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full capitalize">{lab.labType}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${lab.fixMode ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
            {lab.fixMode ? 'Fix Mode: ON' : 'Fix Mode: OFF'}
          </span>
        </div>
        <h2 className="text-lg font-bold text-gray-900">{lab.title}</h2>
        {lab.description && <p className="text-sm text-gray-500 mt-1">{lab.description}</p>}
        <p className="text-xs text-gray-400 mt-2">Generated {new Date(lab.generatedAt).toLocaleString()}</p>
      </div>

      {/* Scenario */}
      <Section title="Lab Scenario" defaultOpen>
        <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">{lab.scenario}</pre>
      </Section>

      {/* Modules */}
      {lab.modules.map(m => (
        <div key={m.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-base font-bold text-gray-800">{m.name}</h3>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{m.category}</span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{m.difficulty}</span>
          </div>

          <Section title="Description & Risk">
            <p className="text-sm text-gray-600 mb-3">{m.description}</p>
            <div className="bg-red-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-red-700 mb-1">Risk</p>
              <p className="text-xs text-red-600">{m.risk}</p>
            </div>
          </Section>

          <Section title="Vulnerable Example" defaultOpen>
            <CodeBlock code={m.vulnerableExample} />
          </Section>

          {lab.fixMode && (
            <Section title="Fixed Example" defaultOpen>
              <CodeBlock code={m.fixedExample} />
            </Section>
          )}

          <Section title="Student Task">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">{m.studentTask}</pre>
          </Section>

          {lab.fixMode && (
            <Section title="Teacher Correction">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">{m.teacherCorrection}</pre>
            </Section>
          )}

          <Section title="Test / Non-Regression Check">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">{m.testCheck}</pre>
          </Section>

          <Section title={`QCM (${m.qcm.length} questions)`}>
            <QCMList qcm={m.qcm} />
          </Section>

          <Section title="Student Checklist">
            <Checklist items={m.checklist} />
          </Section>

          <Section title="Teacher Evaluation Rubric">
            <Rubric rubric={m.rubric} />
          </Section>
        </div>
      ))}

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-700">
        <strong>Safety Disclaimer:</strong> {lab.safetyDisclaimer}
      </div>
    </div>
  );
}
