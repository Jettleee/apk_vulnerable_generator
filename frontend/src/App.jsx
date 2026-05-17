import { Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Generator from './pages/Generator';
import Modules from './pages/Modules';
import Export from './pages/Export';
import AdminDashboard from './pages/AdminDashboard';
import ChallengeView from './pages/ChallengeView';

export default function App() {
  const [lab, setLab] = useState(null);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/"              element={<Home />} />
          <Route path="/generator"     element={<Generator lab={lab} setLab={setLab} />} />
          <Route path="/modules"       element={<Modules />} />
          <Route path="/export"        element={<Export lab={lab} />} />
          <Route path="/admin"         element={<AdminDashboard />} />
          <Route path="/challenge/:id" element={<ChallengeView />} />
        </Routes>
      </main>
      <footer className="text-center text-xs text-gray-400 py-4 border-t border-gray-200">
        Vuln Training Lab Generator — For authorized educational use only
      </footer>
    </div>
  );
}
