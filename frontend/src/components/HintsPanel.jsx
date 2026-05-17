import { useState } from 'react';

export default function HintsPanel({ hints = [] }) {
  const [revealed, setRevealed] = useState(0);

  if (!hints.length) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-amber-800">Progressive Hints</h3>
        <span className="text-xs text-amber-600">{revealed}/{hints.length} revealed</span>
      </div>

      <div className="space-y-2 mb-4">
        {hints.slice(0, revealed).map((hint, i) => (
          <div key={i} className="bg-white border border-amber-100 rounded-lg p-3">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{hint}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {revealed < hints.length && (
          <button
            onClick={() => setRevealed(r => r + 1)}
            className="text-sm bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition font-medium"
          >
            Reveal Hint {revealed + 1}
          </button>
        )}
        {revealed > 0 && (
          <button
            onClick={() => setRevealed(0)}
            className="text-sm border border-amber-300 text-amber-700 px-4 py-2 rounded-lg hover:bg-amber-100 transition"
          >
            Reset Hints
          </button>
        )}
        {revealed === hints.length && (
          <span className="text-sm text-amber-700 font-medium self-center">All hints revealed</span>
        )}
      </div>
    </div>
  );
}
