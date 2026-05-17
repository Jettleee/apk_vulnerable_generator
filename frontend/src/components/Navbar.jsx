import { NavLink } from 'react-router-dom';

const links = [
  { to: '/',          label: 'Home' },
  { to: '/generator', label: 'Generator' },
  { to: '/modules',   label: 'Modules' },
  { to: '/export',    label: 'Export' },
  { to: '/admin',     label: 'Admin' }
];

export default function Navbar() {
  return (
    <nav className="bg-indigo-700 text-white shadow">
      <div className="max-w-6xl mx-auto px-4 flex items-center gap-6 h-14">
        <span className="font-bold text-sm tracking-wide">🔐 VulnLab</span>
        <div className="flex gap-1 ml-2">
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded text-sm font-medium transition ${
                  isActive ? 'bg-white/20' : 'hover:bg-white/10'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
