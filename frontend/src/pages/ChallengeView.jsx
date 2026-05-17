import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import HintsPanel from '../components/HintsPanel';
import QuizWidget from '../components/QuizWidget';
import WriteupForm from '../components/WriteupForm';

function CodeBlock({ code, label }) {
  const [copied, setCopied] = useState(false);
  if (!code) return null;
  function copy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <button onClick={copy} className="text-xs text-indigo-600 hover:underline">{copied ? 'Copied!' : 'Copy'}</button>
      </div>
      <pre className="code-block max-h-80 overflow-auto text-xs whitespace-pre-wrap">{code}</pre>
    </div>
  );
}

function ApkDownloadButton({ challengeId, type, label, color }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  async function download() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/challenges/${challengeId}/apk/${type}`);
      if (!res.ok) {
        const d = await res.json().catch(() => ({ error: 'Build failed' }));
        throw new Error(d.error || 'Build failed');
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = `${type}-debug.apk`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const colors = {
    red:   'bg-red-600 hover:bg-red-700',
    green: 'bg-green-600 hover:bg-green-700',
  };

  return (
    <div>
      <button
        onClick={download}
        disabled={loading}
        className={`flex items-center gap-2 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-50 ${colors[color] || colors.red}`}
      >
        {loading ? <><span className="animate-spin inline-block">⏳</span> Building APK (~30s)…</> : `⬇ Download ${label} APK`}
      </button>
      {loading && (
        <p className="text-xs text-gray-400 mt-2">Running aapt2 → javac → d8 → apksigner inside Docker…</p>
      )}
      {error && (
        <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-xs text-red-700 font-mono">{error}</p>
          <p className="text-xs text-gray-400 mt-1">Ensure app is running via <code>docker compose up --build</code></p>
        </div>
      )}
    </div>
  );
}

export default function ChallengeView() {
  const { id } = useParams();
  const [challenge, setChallenge]     = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [activeTab, setActiveTab]     = useState('overview');
  const [quizAnswers, setQuizAnswers] = useState(null);
  const [quizResult, setQuizResult]   = useState(null);
  const [submitting, setSubmitting]   = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [quizOnly, setQuizOnly]       = useState(false);
  const [flagInput, setFlagInput]     = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/challenges/${id}`);
        if (!res.ok) throw new Error('Challenge not found');
        setChallenge(await res.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleQuizSubmit(answers) {
    setQuizAnswers(answers);
    // Score locally by submitting to backend
    if (quizOnly) {
      await handleFullSubmit({ studentName: 'Anonymous', writeup: '' }, answers);
    }
  }

  async function handleFullSubmit({ studentName, writeup }, answers) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/challenges/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName,
          quizAnswers: answers || quizAnswers || [],
          writeup,
          submittedFlag: flagInput.trim()
        })
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      const data = await res.json();
      setQuizResult(data.quizResult);
      setSubmitResult(data);
      setSubmitted(true);
      setActiveTab('results');
    } catch (err) {
      alert('Submit error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-center">
      <p className="text-gray-400">Loading challenge…</p>
    </div>
  );

  if (error) return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-center">
      <p className="text-red-500">{error}</p>
      <p className="text-sm text-gray-400 mt-2">Make sure this challenge ID is correct.</p>
    </div>
  );

  const tabs = [
    { id:'overview',  label:'Overview' },
    { id:'code',      label:'Vulnerable App' },
    { id:'hints',     label:`Hints (${challenge.hints?.length || 0})` },
    { id:'writeup',   label:'Writeup Guide' },
    { id:'quiz',      label:`Quiz (${challenge.quiz?.length || 0}Q)` },
    { id:'submit',    label:'Submit' },
    ...(submitted ? [{ id:'results', label:'Results' }] : []),
    ...(challenge.patchedApp ? [{ id:'patched', label:'Patched App' }] : [])
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-gray-900">{challenge.title}</h1>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            challenge.difficulty === 'advanced' ? 'bg-red-100 text-red-700' :
            challenge.difficulty === 'intermediate' ? 'bg-orange-100 text-orange-700' :
            'bg-green-100 text-green-700'
          }`}>{challenge.difficulty}</span>
        </div>
        <p className="text-sm text-gray-500">{challenge.module?.description}</p>
        <p className="text-xs text-amber-600 mt-1 bg-amber-50 inline-block px-2 py-0.5 rounded">
          Educational use only — toy app com.training.vulnapp with dummy data
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition -mb-px whitespace-nowrap ${
              activeTab === t.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {/* Overview tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-semibold text-gray-800 mb-3">Challenge Overview</h2>
              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div><span className="text-gray-400">Module:</span> <span className="font-medium">{challenge.module?.name}</span></div>
                <div><span className="text-gray-400">Category:</span> <span className="font-medium capitalize">{challenge.module?.category}</span></div>
                <div><span className="text-gray-400">App Type:</span> <span className="font-medium capitalize">{challenge.appType}</span></div>
                <div><span className="text-gray-400">Quiz:</span> <span className="font-medium">{challenge.quiz?.length} questions</span></div>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <p className="text-sm font-semibold text-blue-800 mb-1">Learning Objective</p>
                <p className="text-sm text-blue-700">{challenge.module?.learningObjective}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-semibold text-gray-800 mb-2">Risk Overview</h2>
              <p className="text-sm text-gray-700">{challenge.module?.risk}</p>
            </div>

            {challenge.solveGoal && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-semibold text-gray-800 mb-3">Challenge Goal</h2>
                <p className="text-sm text-gray-700 mb-4">{challenge.solveGoal}</p>
                {challenge.flagLocation && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                    <p className="text-xs font-semibold text-amber-800 mb-1">Flag Location Hint</p>
                    <p className="text-xs text-amber-700">{challenge.flagLocation}</p>
                  </div>
                )}
                {challenge.expectedTools && challenge.expectedTools.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-2">Recommended Tools</p>
                    <div className="flex flex-wrap gap-2">
                      {challenge.expectedTools.map(tool => (
                        <code key={tool} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-mono">{tool}</code>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-semibold text-gray-800 mb-3">CTF APKs — Download & Analyse</h2>
              <div className="flex flex-wrap gap-3 mb-4">
                <ApkDownloadButton challengeId={id} type="vuln" label="Vulnerable" color="red" />
                {challenge.patchedApp && (
                  <ApkDownloadButton challengeId={id} type="patched" label="Patched" color="green" />
                )}
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                <p><span className="font-medium text-red-600">Vulnerable APK:</span> Install, reverse-engineer, find and exploit the flaw.</p>
                {challenge.patchedApp && <p><span className="font-medium text-green-600">Patched APK:</span> Diff against vulnerable to verify your fix understanding.</p>}
                <p className="mt-2">Tools: <code className="bg-gray-100 px-1 rounded">apktool</code> <code className="bg-gray-100 px-1 rounded">jadx</code> <code className="bg-gray-100 px-1 rounded">Ghidra</code> <code className="bg-gray-100 px-1 rounded">frida</code> <code className="bg-gray-100 px-1 rounded">adb</code></p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-semibold text-gray-800 mb-3">How to Complete This Challenge</h2>
              <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                <li>Download the <strong>Vulnerable APK</strong> and install on emulator/device</li>
                <li>Reverse-engineer with apktool / jadx / Ghidra — find the vulnerability</li>
                <li>Use progressive hints if stuck (Hints tab)</li>
                <li>Follow the student guide in the <strong>Writeup Guide</strong> tab</li>
                <li>Answer all quiz questions in the <strong>Quiz</strong> tab</li>
                <li>Write your security analysis and <strong>Submit</strong></li>
                {challenge.patchedApp && <li>Compare with <strong>Patched APK</strong> to verify your fix understanding</li>}
              </ol>
            </div>
          </div>
        )}

        {/* Vulnerable code tab */}
        {activeTab === 'code' && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="font-semibold text-gray-800">Vulnerable App Code</h2>
                <p className="text-sm text-gray-500 mt-1">{challenge.vulnerableApp?.description}</p>
              </div>
              <ApkDownloadButton challengeId={id} type="vuln" label="Vulnerable" color="red" />
            </div>
            <div className="bg-red-50 border border-red-100 rounded-lg p-3">
              <p className="text-xs text-red-700 font-medium">CTF Target APK</p>
              <p className="text-xs text-red-600 mt-1">
                Install on emulator/device. Analyse with: apktool, jadx, Ghidra, Frida, adb. Find and exploit the vulnerability.
              </p>
            </div>
            <CodeBlock code={challenge.vulnerableApp?.code} label="Vulnerable implementation (source reference)" />
          </div>
        )}

        {/* Patched app tab (only if showPatched) */}
        {activeTab === 'patched' && challenge.patchedApp && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-gray-800">Patched App Code</h2>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Fixed</span>
              </div>
              <ApkDownloadButton challengeId={id} type="patched" label="Patched" color="green" />
            </div>
            <div className="bg-green-50 border border-green-100 rounded-lg p-3">
              <p className="text-xs text-green-700 font-medium">Reference APK — compare with vulnerable version</p>
              <p className="text-xs text-green-600 mt-1">
                Diff the decompiled smali/Java between both APKs to identify exactly what was changed to fix the vulnerability.
              </p>
            </div>
            <p className="text-sm text-gray-500">{challenge.patchedApp?.description}</p>
            <CodeBlock code={challenge.patchedApp?.code} label="Fixed implementation (source reference)" />
          </div>
        )}

        {/* Hints tab */}
        {activeTab === 'hints' && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Progressive Hints</h2>
            <p className="text-sm text-gray-500 mb-4">Reveal hints one at a time. Try to solve as much as possible before using hints.</p>
            <HintsPanel hints={challenge.hints || []} />
          </div>
        )}

        {/* Writeup guide tab */}
        {activeTab === 'writeup' && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Student Guide (8-Level Progression)</h2>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed max-h-[600px] overflow-auto">
              {challenge.studentWriteup}
            </pre>
          </div>
        )}

        {/* Quiz tab */}
        {activeTab === 'quiz' && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <QuizWidget
              quiz={challenge.quiz || []}
              onSubmitAnswers={answers => {
                setQuizOnly(true);
                handleQuizSubmit(answers);
              }}
              loading={submitting}
              submitted={submitted}
              quizResult={quizResult}
            />
          </div>
        )}

        {/* Submit tab */}
        {activeTab === 'submit' && !submitted && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
            <div>
              <h2 className="font-semibold text-gray-800 mb-1">Submit Your Analysis</h2>
              <p className="text-sm text-gray-500">
                Complete the quiz first (Quiz tab), then submit your flag and written analysis here.
                {quizAnswers && (
                  <span className="ml-1 text-green-600 font-medium">Quiz answers recorded ✓</span>
                )}
              </p>
            </div>

            {/* Flag submission */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <label className="block text-sm font-semibold text-gray-800 mb-1">
                Submit Flag <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Find the flag in the vulnerable APK (format: <code className="bg-gray-200 px-1 rounded">VULNLAB&#123;...&#125;</code>) and paste it here.
              </p>
              <input
                type="text"
                value={flagInput}
                onChange={e => setFlagInput(e.target.value)}
                placeholder="VULNLAB{your_found_flag_here}"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300"
                spellCheck={false}
                autoComplete="off"
              />
              {flagInput && !flagInput.trim().startsWith('VULNLAB{') && (
                <p className="text-xs text-red-600 mt-1">Flag must start with VULNLAB&#123;</p>
              )}
              {flagInput && flagInput.trim().startsWith('VULNLAB{') && flagInput.trim().endsWith('}') && (
                <p className="text-xs text-green-600 mt-1">Flag format looks correct — submit to verify!</p>
              )}
            </div>

            <WriteupForm
              onSubmit={({ studentName, writeup }) => handleFullSubmit({ studentName, writeup }, quizAnswers)}
              loading={submitting}
            />
          </div>
        )}

        {activeTab === 'submit' && submitted && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-center">
            <p className="text-2xl mb-2">✓</p>
            <p className="font-semibold text-gray-800">Submitted!</p>
            <p className="text-sm text-gray-500 mt-1">Check Results tab for your score.</p>
            <button onClick={() => setActiveTab('results')} className="mt-3 text-sm text-indigo-600 hover:underline">
              View Results →
            </button>
          </div>
        )}

        {/* Results tab */}
        {activeTab === 'results' && submitted && quizResult && (
          <div className="space-y-4">
            {/* Final score card */}
            <div className={`rounded-xl border p-6 text-center ${
              (submitResult?.finalScore ?? quizResult.score) >= 70 ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'
            }`}>
              {submitResult?.finalScore !== undefined ? (
                <>
                  <p className="text-5xl font-bold mb-1 text-gray-800">{submitResult.finalScore}%</p>
                  <p className="text-sm text-gray-500 mb-3">Final Score (flag 50% + quiz 30% + writeup 20%)</p>
                </>
              ) : (
                <p className="text-5xl font-bold mb-3 text-gray-800">{quizResult.score}%</p>
              )}

              {/* Flag result */}
              {submitResult?.flagCorrect !== undefined && (
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-3 ${
                  submitResult.flagCorrect ? 'bg-green-200 text-green-800' : 'bg-red-100 text-red-700'
                }`}>
                  {submitResult.flagCorrect ? '🚩 Flag Correct! (+50%)' : '✗ Flag Incorrect (0%)'}
                </div>
              )}

              <p className="text-lg font-semibold text-gray-700">
                Quiz: {quizResult.correct} / {quizResult.total} correct ({quizResult.score}%)
              </p>
              <p className={`text-sm mt-2 font-medium ${(submitResult?.finalScore ?? quizResult.score) >= 70 ? 'text-green-700' : 'text-orange-700'}`}>
                {(submitResult?.finalScore ?? quizResult.score) >= 90 ? 'Excellent work!' :
                 (submitResult?.finalScore ?? quizResult.score) >= 70 ? 'Good job — passed!' :
                 (submitResult?.finalScore ?? quizResult.score) >= 50 ? 'Keep practicing.' :
                 'Review the material and try again.'}
              </p>
              {!submitResult?.flagCorrect && (
                <p className="text-xs text-gray-500 mt-2">
                  Go back to the APK, keep digging — the flag is in there!
                </p>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Question Review</h3>
              <div className="space-y-3">
                {quizResult.results.map((r, i) => {
                  const q = challenge.quiz[i];
                  return (
                    <div key={r.questionId} className={`rounded-lg p-3 text-sm ${r.isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                      <div className="flex gap-2 items-start">
                        <span className={`font-bold shrink-0 ${r.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                          {r.isCorrect ? '✓' : '✗'}
                        </span>
                        <div>
                          <p className="font-medium text-gray-800 line-clamp-2">{q?.question}</p>
                          {!r.isCorrect && (
                            <p className="text-xs text-gray-600 mt-1">
                              <span className="font-medium">Correct:</span> {r.correctAnswer}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">{r.explanation}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
