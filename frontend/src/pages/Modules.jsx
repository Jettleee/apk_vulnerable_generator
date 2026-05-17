import { useEffect, useState } from 'react';
import ModuleCard from '../components/ModuleCard';

export default function Modules() {
  const [modules, setModules]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [filterCat, setFilterCat]   = useState('');
  const [filterDiff, setFilterDiff] = useState('');

  useEffect(() => {
    fetch('/api/modules')
      .then(r => r.json())
      .then(data => { setModules(data); setLoading(false); })
      .catch(() => { setError('Failed to load modules'); setLoading(false); });
  }, []);

  const filtered = modules.filter(m => {
    const catMatch  = filterCat  ? m.category   === filterCat  : true;
    const diffMatch = filterDiff ? m.difficulty  === filterDiff : true;
    return catMatch && diffMatch;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Vulnerability Modules</h1>
      <p className="text-gray-500 mb-6">Browse all available training modules.</p>

      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">All Categories</option>
          <option value="android">Android</option>
          <option value="web">Web</option>
          <option value="native">Native</option>
          <option value="secure-coding">Secure Coding</option>
        </select>
        <select
          value={filterDiff}
          onChange={e => setFilterDiff(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">All Difficulties</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        {(filterCat || filterDiff) && (
          <button
            onClick={() => { setFilterCat(''); setFilterDiff(''); }}
            className="text-sm text-indigo-600 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {loading && <p className="text-gray-400">Loading modules…</p>}
      {error   && <p className="text-red-500">{error}</p>}
      {!loading && !error && (
        <>
          <p className="text-sm text-gray-400 mb-4">{filtered.length} module{filtered.length !== 1 ? 's' : ''}</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(m => <ModuleCard key={m.id} module={m} />)}
          </div>
        </>
      )}
    </div>
  );
}
