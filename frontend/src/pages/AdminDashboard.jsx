import { useState, useEffect } from 'react';

const MODULES = [
  { id:'exported-component',       name:'Exported Component',           difficulty:'beginner' },
  { id:'secret-dummy',             name:'Hardcoded Secret',             difficulty:'beginner' },
  { id:'cleartext-config',         name:'Cleartext Network Config',     difficulty:'beginner' },
  { id:'sensitive-logs',           name:'Sensitive Data in Logs',       difficulty:'beginner' },
  { id:'insecure-file-permission', name:'Insecure File Permission',     difficulty:'intermediate' },
  { id:'weak-input-validation',    name:'Weak Input Validation',        difficulty:'intermediate' },
  { id:'insecure-debug-mode',      name:'Insecure Debug Mode',          difficulty:'intermediate' },
  { id:'vulnerable-jni-native-check', name:'Vulnerable JNI Native Check', difficulty:'advanced' }
];

function GenerateForm({ onGenerated }) {
  const [form, setForm] = useState({
    moduleId: MODULES[0].id, difficulty: 'beginner', appType: 'android',
    quizCount: 10, showPatched: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleGenerate(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/challenges/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      const challenge = await res.json();
      onGenerated(challenge);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const selectedModule = MODULES.find(m => m.id === form.moduleId);

  return (
    <form onSubmit={handleGenerate} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vulnerability Module</label>
          <select
            value={form.moduleId}
            onChange={e => { set('moduleId', e.target.value); set('difficulty', MODULES.find(m=>m.id===e.target.value)?.difficulty || 'beginner'); }}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            {MODULES.map(m => (
              <option key={m.id} value={m.id}>{m.name} ({m.difficulty})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty Override</label>
          <select
            value={form.difficulty}
            onChange={e => set('difficulty', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">App Type</label>
          <select
            value={form.appType}
            onChange={e => set('appType', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="android">Android</option>
            <option value="web">Web</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quiz Questions: <span className="font-bold text-indigo-600">{form.quizCount}</span>
          </label>
          <input
            type="range" min="5" max="30" step="1"
            value={form.quizCount}
            onChange={e => set('quizCount', parseInt(e.target.value))}
            className="w-full accent-indigo-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>5 (quick)</span><span>30 (comprehensive)</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="showPatched"
          checked={form.showPatched}
          onChange={e => set('showPatched', e.target.checked)}
          className="accent-indigo-600"
        />
        <label htmlFor="showPatched" className="text-sm text-gray-700">
          Show patched version to students after submission
        </label>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
      >
        {loading ? 'Generating…' : '+ Generate Challenge'}
      </button>
    </form>
  );
}

function StarRating({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`text-xl transition ${n <= value ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function SubmissionCard({ sub, challengeId, onRated }) {
  const [rating, setRating]   = useState(sub.rating || 0);
  const [feedback, setFeedback] = useState(sub.feedback || '');
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(!!sub.ratedAt);

  async function saveRating() {
    setSaving(true);
    try {
      const res = await fetch(`/api/challenges/${challengeId}/submissions/${sub.id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, feedback })
      });
      if (!res.ok) throw new Error('Rating failed');
      setSaved(true);
      onRated && onRated();
    } catch {}
    setSaving(false);
  }

  const finalScore = sub.finalScore ?? sub.score;

  return (
    <div className="border border-gray-100 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="font-medium text-gray-800">{sub.studentName || 'Anonymous'}</p>
          <p className="text-xs text-gray-400">{new Date(sub.submittedAt).toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {sub.flagCorrect !== undefined && (
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
              sub.flagCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {sub.flagCorrect ? '🚩 Flag ✓' : '✗ Flag wrong'}
            </span>
          )}
          <div className={`text-sm font-bold px-3 py-1 rounded-full ${
            finalScore >= 70 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {finalScore}% {sub.finalScore !== undefined ? '(final)' : `(${sub.quizResult?.correct}/${sub.quizResult?.total})`}
          </div>
        </div>
      </div>

      {sub.submittedFlag && (
        <div className={`text-xs rounded-lg px-3 py-2 font-mono border ${
          sub.flagCorrect ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          Submitted flag: {sub.submittedFlag}
        </div>
      )}


      {sub.writeup && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Writeup</p>
          <pre className="text-xs text-gray-700 bg-gray-50 rounded p-3 max-h-40 overflow-auto whitespace-pre-wrap font-sans">{sub.writeup}</pre>
        </div>
      )}

      <div className="space-y-2 pt-2 border-t border-gray-100">
        <p className="text-sm font-medium text-gray-700">Rate Submission</p>
        <StarRating value={rating} onChange={setRating} />
        <textarea
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          placeholder="Instructor feedback (optional)…"
          rows={2}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
        />
        <div className="flex items-center gap-2">
          <button
            onClick={saveRating}
            disabled={saving || rating === 0}
            className="text-sm bg-indigo-600 text-white px-4 py-1.5 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {saving ? 'Saving…' : saved ? 'Update Rating' : 'Save Rating'}
          </button>
          {saved && <span className="text-xs text-green-600">Saved</span>}
        </div>
      </div>
    </div>
  );
}

function ChallengeRow({ c, onView, onDelete }) {
  return (
    <div className="border border-gray-100 rounded-xl p-4 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 truncate">{c.title}</p>
        <p className="text-xs text-gray-400">
          {c.difficulty} · {c.quizCount} questions · {new Date(c.generatedAt).toLocaleDateString()}
          {c.showPatched ? ' · patched visible' : ''}
        </p>
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
        c.submissionCount > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
      }`}>
        {c.submissionCount} submission{c.submissionCount !== 1 ? 's' : ''}
      </span>
      <button onClick={() => onView(c.id)} className="text-sm text-indigo-600 hover:underline">View</button>
      <button onClick={() => onDelete(c.id)} className="text-sm text-red-500 hover:text-red-700">Delete</button>
    </div>
  );
}

export default function AdminDashboard() {
  const [tab, setTab]             = useState('generate');
  const [challenges, setChallenges] = useState([]);
  const [selected, setSelected]   = useState(null); // full challenge with submissions
  const [loadingList, setLoadingList] = useState(false);

  async function loadList() {
    setLoadingList(true);
    try {
      const res = await fetch('/api/challenges');
      setChallenges(await res.json());
    } catch {}
    setLoadingList(false);
  }

  async function viewChallenge(id) {
    const res = await fetch(`/api/challenges/${id}?admin=true`);
    if (res.ok) { setSelected(await res.json()); setTab('submissions'); }
  }

  async function deleteChallenge(id) {
    if (!confirm('Delete this challenge?')) return;
    await fetch(`/api/challenges/${id}`, { method: 'DELETE' });
    loadList();
    if (selected?.id === id) setSelected(null);
  }

  function copyStudentLink(id) {
    navigator.clipboard.writeText(`${window.location.origin}/challenge/${id}`);
  }

  useEffect(() => { loadList(); }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Manage challenges and review student submissions.</p>
        </div>
        <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full">ADMIN</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {[
          { id:'generate', label:'Generate Challenge' },
          { id:'challenges', label:`Challenges (${challenges.length})` },
          { id:'submissions', label:'Submissions' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); if (t.id === 'challenges') loadList(); }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition -mb-px ${
              tab === t.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Generate tab */}
      {tab === 'generate' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Generate New Challenge</h2>
          <GenerateForm onGenerated={c => {
            loadList();
            setSelected(c);
            setTab('submissions');
          }} />
        </div>
      )}

      {/* Challenges list tab */}
      {tab === 'challenges' && (
        <div className="space-y-3">
          {loadingList && <p className="text-sm text-gray-400">Loading…</p>}
          {!loadingList && challenges.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
              <p className="text-gray-500">No challenges yet.</p>
              <button onClick={() => setTab('generate')} className="mt-3 text-sm text-indigo-600 hover:underline">Generate one</button>
            </div>
          )}
          {challenges.map(c => (
            <ChallengeRow key={c.id} c={c} onView={viewChallenge} onDelete={deleteChallenge} />
          ))}
        </div>
      )}

      {/* Submissions / detail tab */}
      {tab === 'submissions' && (
        <div className="space-y-6">
          {!selected ? (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
              <p className="text-gray-500">Select a challenge from the list to view submissions.</p>
              <button onClick={() => setTab('challenges')} className="mt-3 text-sm text-indigo-600 hover:underline">View challenges</button>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">{selected.title}</h2>
                    <p className="text-sm text-gray-400">{selected.difficulty} · {selected.quizCount} questions · {selected.module?.description}</p>
                  </div>
                  <button
                    onClick={() => copyStudentLink(selected.id)}
                    className="text-sm bg-green-600 text-white px-4 py-1.5 rounded-lg hover:bg-green-700 transition"
                  >
                    Copy Student Link
                  </button>
                </div>

                {/* Flag (admin only) */}
                {selected.flag && (
                  <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-red-700 mb-1">Challenge Flag (Admin Only)</p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono text-red-800 flex-1">{selected.flag}</code>
                      <button
                        onClick={() => navigator.clipboard.writeText(selected.flag)}
                        className="text-xs text-red-600 hover:underline shrink-0"
                      >Copy</button>
                    </div>
                  </div>
                )}

                {/* Teacher solution */}
                <details className="mt-3">
                  <summary className="text-sm text-indigo-600 cursor-pointer hover:underline">View Teacher Solution</summary>
                  <pre className="mt-3 text-xs bg-gray-50 rounded-lg p-4 max-h-64 overflow-auto whitespace-pre-wrap font-sans">
                    {selected.teacherSolution}
                  </pre>
                </details>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-semibold text-gray-800 mb-4">
                  Submissions ({selected.submissions?.length || 0})
                </h3>
                {!selected.submissions?.length ? (
                  <p className="text-sm text-gray-400">No submissions yet. Share the student link above.</p>
                ) : (
                  <div className="space-y-4">
                    {selected.submissions.map(sub => (
                      <SubmissionCard
                        key={sub.id}
                        sub={sub}
                        challengeId={selected.id}
                        onRated={() => viewChallenge(selected.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
