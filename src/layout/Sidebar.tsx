import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Entry', icon: '◈' },
  { path: '/concept-space', label: 'Concept Space', icon: '◉' },
  { path: '/knowledge', label: 'Knowledge', icon: '◇' },
  { path: '/structures', label: 'Structures', icon: '◆' },
  { path: '/output', label: 'Output', icon: '□' },
];

export function Sidebar() {
  return (
    <aside className="flex h-full w-56 flex-col border-r border-slate-700/50 bg-slate-900/30 p-3">
      <div className="mb-8 mt-2 px-3">
        <h1 className="text-lg font-bold">
          <span className="text-indigo-400">Concept</span>
          <span className="text-slate-300">Voice</span>
        </h1>
        <p className="mt-0.5 text-xs text-slate-600">navigate ideas</p>
      </div>
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-500/12 text-indigo-300 shadow-sm'
                  : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`relative flex h-6 w-6 items-center justify-center rounded-md text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-500/20 text-indigo-300'
                    : 'text-slate-500 group-hover:text-slate-300'
                }`}>
                  {item.icon}
                </span>
                {item.label}
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse-soft" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom hint */}
      <div className="mt-auto px-3 pt-4">
        <div className="rounded-lg border border-slate-700/30 bg-slate-800/20 p-3">
          <p className="text-xs text-slate-600">
            Navigate the space<br />of ideas
          </p>
        </div>
      </div>
    </aside>
  );
}
