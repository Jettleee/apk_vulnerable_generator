export default function ModuleCard({ module: m }) {
  const diffClass = {
    beginner:     'badge-beginner',
    intermediate: 'badge-intermediate',
    advanced:     'badge-advanced'
  }[m.difficulty] || 'bg-gray-100 text-gray-600';

  const catClass = {
    android:        'badge-android',
    web:            'badge-web',
    native:         'badge-native',
    'secure-coding':'badge-secure-coding'
  }[m.category] || 'bg-gray-100 text-gray-600';

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-800 text-base leading-tight">{m.name}</h3>
        <div className="flex gap-1 flex-shrink-0">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${catClass}`}>{m.category}</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${diffClass}`}>{m.difficulty}</span>
        </div>
      </div>

      <p className="text-sm text-gray-500 leading-relaxed">{m.description}</p>

      <div className="bg-red-50 rounded-lg p-3">
        <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">Risk</p>
        <p className="text-xs text-red-600">{m.risk}</p>
      </div>

      <div className="bg-blue-50 rounded-lg p-3">
        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Learning Objective</p>
        <p className="text-xs text-blue-600">{m.learningObjective}</p>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400 pt-1 border-t border-gray-50">
        <span>{m.qcm?.length || 0} QCM questions</span>
        <span>{m.checklist?.length || 0} checklist items</span>
      </div>
    </div>
  );
}
