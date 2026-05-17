import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <div className="mb-4 inline-block bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
        Educational Use Only
      </div>
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Vulnerable-by-Design<br />
        <span className="text-indigo-600">Training Lab Generator</span>
      </h1>
      <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
        Generate controlled, fake-data cybersecurity labs for classroom and self-study.
        Each lab includes vulnerable examples, fixes, student tasks, QCM, and evaluation rubrics.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
        <Link
          to="/generator"
          className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
        >
          Create Training Lab
        </Link>
        <Link
          to="/modules"
          className="bg-white text-indigo-600 border border-indigo-300 px-8 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition"
        >
          Browse Modules
        </Link>
      </div>

      <div className="grid sm:grid-cols-3 gap-6 text-left">
        {[
          { icon: '🔍', title: '8 Vulnerability Modules', desc: 'Android, Web, Native JNI — beginner to advanced.' },
          { icon: '🛡️', title: 'Vulnerable + Fixed', desc: 'Side-by-side examples with explanations and test checks.' },
          { icon: '📋', title: 'Full Lab Package', desc: 'QCM, student checklist, teacher rubric, Markdown export.' }
        ].map(f => (
          <div key={f.title} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="text-2xl mb-2">{f.icon}</div>
            <h3 className="font-semibold text-gray-800 mb-1">{f.title}</h3>
            <p className="text-sm text-gray-500">{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800 text-left">
        <strong>Safety Disclaimer:</strong> All code examples use fake credentials and dummy data.
        Labs are designed for local, isolated environments. Do not use generated techniques against
        real applications or systems without explicit written authorization.
      </div>
    </div>
  );
}
