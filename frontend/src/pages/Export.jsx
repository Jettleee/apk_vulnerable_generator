import { useNavigate } from 'react-router-dom';
import ExportPanel from '../components/ExportPanel';

export default function Export({ lab }) {
  const navigate = useNavigate();

  if (!lab) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">No lab generated yet.</p>
        <button
          onClick={() => navigate('/generator')}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          Go to Generator
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Export Lab</h1>
      <p className="text-gray-500 mb-6">
        Lab: <strong>{lab.title}</strong> · {lab.modules.length} module{lab.modules.length !== 1 ? 's' : ''}
      </p>
      <ExportPanel lab={lab} />
    </div>
  );
}
