import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LabPreview from '../components/LabPreview';

const LEVELS    = ['beginner', 'intermediate', 'advanced'];
const LAB_TYPES = ['android', 'web', 'general'];

export default function Generator({ lab, setLab }) {
  const navigate = useNavigate();
  const [modules, setModules]     = useState([]);
  const [selected, setSelected]   = useState([]);
  const [title, setTitle]         = useState('');
  const [desc, setDesc]           = useState('');
  const [level, setLevel]         = useState('beginner');
  const [labType, setLabType]     = useState('android');
  const [fixMode, setFixMode]     = useState(true);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  useEffect(() => {
    fetch('/api/modules')
      .then(r => r.json())
      .then(setModules)
      .catch(() => setError('Failed to load modules'));
  }, []);

  function toggleModule(id) {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  async function handleGenerate(e) {
    e.preventDefault();
    if (selected.length === 0) { setError('Select at least one module'); return; }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description: desc, level, labType, selectedModules: selected, fixMode })
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      const data = await res.json();
      setLab(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Lab Generator</h1>

      <div className="grid lg:grid-cols-[380px_1fr] gap-8">
        {/* Form */}
        <form onSubmit={handleGenerate} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lab Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Android Security Lab 01"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              rows={3}
              placeholder="Optional scenario description…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
              <select
                value={level}
                onChange={e => setLevel(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
              >
                {LEVELS.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lab Type</label>
              <select
                value={labType}
                onChange={e => setLabType(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
              >
                {LAB_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
          </div>

          {/* Fix Mode */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setFixMode(f => !f)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${fixMode ? 'bg-indigo-600' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${fixMode ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className="text-sm font-medium text-gray-700">
              Fix Mode {fixMode ? '(fixes shown)' : '(student finds fix)'}
            </span>
          </div>

          {/* Module Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Modules ({selected.length} selected)
            </label>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {modules.map(m => (
                <label
                  key={m.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                    selected.includes(m.id)
                      ? 'border-indigo-400 bg-indigo-50'
                      : 'border-gray-200 bg-white hover:border-indigo-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(m.id)}
                    onChange={() => toggleModule(m.id)}
                    className="mt-0.5 accent-indigo-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{m.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{m.category} · {m.difficulty}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? 'Generating…' : 'Generate Lab'}
          </button>
        </form>

        {/* Preview */}
        <div>
          {lab ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Generated Lab</h2>
                <button
                  onClick={() => navigate('/export')}
                  className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                >
                  Export →
                </button>
              </div>
              <LabPreview lab={lab} />
            </>
          ) : (
            <div className="flex items-center justify-center h-64 bg-white border border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
              Generated lab preview will appear here
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
