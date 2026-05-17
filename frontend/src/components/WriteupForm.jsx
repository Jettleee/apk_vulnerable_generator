import { useState } from 'react';

export default function WriteupForm({ onSubmit, loading, disabled }) {
  const [name, setName]       = useState('');
  const [writeup, setWriteup] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!writeup.trim()) return;
    onSubmit({ studentName: name.trim() || 'Anonymous', writeup: writeup.trim() });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Your Name (optional)</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Anonymous"
          maxLength={80}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Security Analysis Writeup <span className="text-red-400">*</span>
        </label>
        <p className="text-xs text-gray-400 mb-2">
          Describe: vulnerability found, reproduction steps, impact, and your proposed fix.
        </p>
        <textarea
          value={writeup}
          onChange={e => setWriteup(e.target.value)}
          placeholder="## Vulnerability Found&#10;&#10;## Reproduction Steps&#10;&#10;## Impact Assessment&#10;&#10;## Proposed Fix"
          rows={12}
          required
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-y"
        />
        <p className="text-xs text-gray-400 mt-1">{writeup.length} characters</p>
      </div>

      <button
        type="submit"
        disabled={loading || disabled || !writeup.trim()}
        className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
      >
        {loading ? 'Submitting…' : 'Submit Challenge'}
      </button>
    </form>
  );
}
