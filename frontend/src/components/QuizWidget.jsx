import { useState } from 'react';

function QuestionCard({ q, index, answer, onChange, showResult, result }) {
  const baseCard = 'bg-white border rounded-xl p-5 space-y-3';
  const cardColor = showResult
    ? result?.isCorrect ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
    : 'border-gray-100';

  return (
    <div className={`${baseCard} ${cardColor}`}>
      <div className="flex gap-2">
        <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full shrink-0">
          Q{index + 1}
        </span>
        <span className="text-xs text-gray-400 capitalize">{q.type}</span>
        <span className="text-xs text-gray-400 ml-auto">{q.difficulty}</span>
      </div>

      <p className="text-sm text-gray-800 font-medium whitespace-pre-wrap">{q.question}</p>

      {q.relatedFile && (
        <p className="text-xs text-gray-400 font-mono">
          {q.relatedFile}{q.relatedFunction ? ` · ${q.relatedFunction}` : ''}
        </p>
      )}

      {/* Multiple choice / fix-identification */}
      {(q.type === 'multiple-choice' || q.type === 'fix-identification') && q.choices && (
        <div className="space-y-2">
          {q.choices.map((choice, ci) => {
            const letter = choice[0];
            const selected = answer === letter;
            return (
              <label
                key={ci}
                className={`flex items-start gap-2 cursor-pointer rounded-lg p-2 text-sm transition
                  ${showResult
                    ? letter === q.correctAnswer ? 'bg-green-100 text-green-800 font-medium'
                      : selected ? 'bg-red-100 text-red-700' : 'text-gray-600'
                    : selected ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-gray-50 text-gray-700'}`}
              >
                <input
                  type="radio"
                  name={`q-${q.id}`}
                  value={letter}
                  checked={selected}
                  onChange={() => !showResult && onChange(letter)}
                  disabled={showResult}
                  className="mt-0.5 shrink-0"
                />
                {choice}
              </label>
            );
          })}
        </div>
      )}

      {/* True / False */}
      {q.type === 'true-false' && (
        <div className="flex gap-3">
          {['true','false'].map(v => {
            const selected = answer === v;
            return (
              <label
                key={v}
                className={`flex items-center gap-2 cursor-pointer rounded-lg px-4 py-2 text-sm border transition capitalize
                  ${showResult
                    ? v === q.correctAnswer ? 'border-green-400 bg-green-100 text-green-800 font-medium'
                      : selected ? 'border-red-300 bg-red-100 text-red-700' : 'border-gray-200 text-gray-500'
                    : selected ? 'border-indigo-400 bg-indigo-50 text-indigo-800' : 'border-gray-200 hover:bg-gray-50 text-gray-700'}`}
              >
                <input
                  type="radio"
                  name={`q-${q.id}`}
                  value={v}
                  checked={selected}
                  onChange={() => !showResult && onChange(v)}
                  disabled={showResult}
                  className="shrink-0"
                />
                {v}
              </label>
            );
          })}
        </div>
      )}

      {/* Short answer / code-reading */}
      {(q.type === 'short-answer' || q.type === 'code-reading') && (
        <textarea
          value={answer || ''}
          onChange={e => !showResult && onChange(e.target.value)}
          disabled={showResult}
          rows={3}
          placeholder="Your answer…"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-y disabled:bg-gray-50"
        />
      )}

      {/* Result feedback */}
      {showResult && result && (
        <div className={`rounded-lg p-3 text-sm ${result.isCorrect ? 'bg-green-100' : 'bg-red-50'}`}>
          <p className="font-medium mb-1">{result.isCorrect ? '✓ Correct' : '✗ Incorrect'}</p>
          {!result.isCorrect && (
            <p className="text-gray-700 mb-1">
              <span className="font-medium">Correct answer:</span> {q.correctAnswer}
            </p>
          )}
          <p className="text-gray-600 text-xs">{q.explanation}</p>
        </div>
      )}
    </div>
  );
}

export default function QuizWidget({ quiz, onSubmitAnswers, loading, submitted, quizResult }) {
  const [answers, setAnswers] = useState({});
  const [page, setPage]       = useState(0);
  const PER_PAGE = 5;

  if (!quiz || quiz.length === 0) return null;

  const totalPages = Math.ceil(quiz.length / PER_PAGE);
  const pageQuestions = quiz.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  function setAnswer(qId, value) {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  }

  function getResultForQ(q) {
    if (!quizResult) return null;
    return quizResult.results.find(r => r.questionId === q.id) || null;
  }

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">
          Interactive Quiz ({quiz.length} questions)
        </h3>
        {submitted && quizResult && (
          <div className={`text-sm font-bold px-3 py-1 rounded-full ${
            quizResult.score >= 70 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            Score: {quizResult.score}% ({quizResult.correct}/{quizResult.total})
          </div>
        )}
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {pageQuestions.map((q, i) => (
          <QuestionCard
            key={q.id}
            q={q}
            index={page * PER_PAGE + i}
            answer={answers[q.id] || ''}
            onChange={val => setAnswer(q.id, val)}
            showResult={submitted}
            result={getResultForQ(q)}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="text-sm text-indigo-600 hover:underline disabled:opacity-30"
          >
            ← Previous
          </button>
          <span className="text-xs text-gray-400">
            Page {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="text-sm text-indigo-600 hover:underline disabled:opacity-30"
          >
            Next →
          </button>
        </div>
      )}

      {/* Submit quiz button */}
      {!submitted && (
        <div className="pt-2 border-t border-gray-100 flex items-center gap-4">
          <button
            onClick={() => onSubmitAnswers(quiz.map(q => answers[q.id] || ''))}
            disabled={loading || answeredCount === 0}
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? 'Scoring…' : `Submit Quiz (${answeredCount}/${quiz.length} answered)`}
          </button>
          {answeredCount < quiz.length && (
            <p className="text-xs text-gray-400">
              {quiz.length - answeredCount} questions unanswered — you can still submit.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
