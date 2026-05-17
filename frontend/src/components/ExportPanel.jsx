import { useState } from 'react';

export default function ExportPanel({ lab }) {
  const [markdown,   setMarkdown]   = useState('');
  const [mdLoading,  setMdLoading]  = useState(false);
  const [apkLoading, setApkLoading] = useState(false);
  const [copied,     setCopied]     = useState(false);
  const [error,      setError]      = useState(null);
  const [apkError,   setApkError]   = useState(null);

  async function fetchMarkdown() {
    if (markdown) return markdown;
    setMdLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/export/markdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lab })
      });
      if (!res.ok) throw new Error('Export failed');
      const data = await res.json();
      setMarkdown(data.markdown);
      return data.markdown;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setMdLoading(false);
    }
  }

  async function copyMarkdown() {
    const md = await fetchMarkdown();
    if (!md) return;
    await navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function downloadMarkdown() {
    const md = await fetchMarkdown();
    if (!md) return;
    triggerDownload(new Blob([md], { type: 'text/markdown' }),
      slug(lab.title) + '.md');
  }

  function downloadJSON() {
    triggerDownload(
      new Blob([JSON.stringify(lab, null, 2)], { type: 'application/json' }),
      slug(lab.title) + '.json'
    );
  }

  async function downloadApk() {
    setApkLoading(true);
    setApkError(null);
    try {
      const res = await fetch('/api/apk/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lab })
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({ error: 'Build failed' }));
        throw new Error(d.error || 'Build failed');
      }
      const blob = await res.blob();
      triggerDownload(blob, slug(lab.title) + '-debug.apk');
    } catch (err) {
      setApkError(err.message);
    } finally {
      setApkLoading(false);
    }
  }

  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  function slug(name) {
    return (name || 'lab').replace(/\s+/g, '-').toLowerCase().slice(0, 40);
  }

  return (
    <div className="space-y-6">
      {/* APK Build */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-1">Android APK</h2>
        <p className="text-sm text-gray-400 mb-4">
          Compiles a real signed debug APK from generated Java source.
          Build takes ~20–40 s inside Docker.
        </p>
        <button
          onClick={downloadApk}
          disabled={apkLoading}
          className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50"
        >
          {apkLoading
            ? <><span className="animate-spin">⏳</span> Building APK…</>
            : '🤖 Build & Download APK'}
        </button>
        {apkLoading && (
          <p className="text-xs text-gray-400 mt-2">
            Running: aapt2 → javac → d8 → apksigner inside Docker container…
          </p>
        )}
        {apkError && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700 font-medium">Build failed</p>
            <p className="text-xs text-red-500 mt-1 font-mono">{apkError}</p>
            <p className="text-xs text-gray-400 mt-2">
              Make sure the app is running via <code>docker compose up --build</code> so
              Android SDK is available in the backend container.
            </p>
          </div>
        )}
      </div>

      {/* Markdown / JSON */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Export Lab Report</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={copyMarkdown}
            disabled={mdLoading}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:border-indigo-300 transition disabled:opacity-50"
          >
            {copied ? '✓ Copied!' : '📋 Copy Markdown'}
          </button>
          <button
            onClick={downloadMarkdown}
            disabled={mdLoading}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {mdLoading ? 'Loading…' : '⬇ Download Markdown'}
          </button>
          <button
            onClick={downloadJSON}
            className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-900 transition"
          >
            ⬇ Download JSON
          </button>
        </div>
        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
      </div>

      {/* Markdown preview */}
      {markdown && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Markdown Preview</h2>
          <pre className="code-block max-h-96 overflow-auto text-xs">{markdown}</pre>
        </div>
      )}

      {/* JSON preview (summary only) */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">JSON Summary</h2>
        <pre className="code-block max-h-72 overflow-auto text-xs">
          {JSON.stringify({
            id: lab.id, title: lab.title, level: lab.level,
            labType: lab.labType, fixMode: lab.fixMode,
            generatedAt: lab.generatedAt,
            modules: lab.modules.map(m => m.id)
          }, null, 2)}
        </pre>
        <p className="text-xs text-gray-400 mt-2">Full JSON download includes all module content.</p>
      </div>
    </div>
  );
}
