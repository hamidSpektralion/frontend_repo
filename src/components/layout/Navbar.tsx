import { NavLink } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { usePipelineStore } from '../../store/pipelineStore';

interface NavbarProps {
  transparent?: boolean;
}

const navLinks = [
  { to: '/', label: 'Home', exact: true },
  { to: '/viewer', label: 'Viewer' },
  { to: '/pipeline', label: 'Pipeline' },
  { to: '/settings', label: 'Settings' },
];

const statusColors = {
  idle: 'bg-sp-text-muted',
  running: 'bg-sp-accent animate-pulse',
  complete: 'bg-sp-success',
  error: 'bg-sp-error',
};

export function Navbar({ transparent = false }: NavbarProps) {
  const status = usePipelineStore((s) => s.status);

  return (
    <nav
      className={`
        fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-6 gap-8
        border-b border-sp-border
        ${transparent ? 'bg-transparent' : 'bg-sp-bg/95 backdrop-blur-sm'}
      `}
    >
      {/* Logo */}
      <NavLink to="/" className="flex items-center gap-2 shrink-0">
        <Activity className="w-5 h-5 text-sp-accent" strokeWidth={1.5} />
        <span className="font-semibold text-sp-text tracking-tight">
          Spektral<span className="text-sp-accent">ion</span>
        </span>
      </NavLink>

      {/* Nav links */}
      <div className="flex items-center gap-1">
        {navLinks.map(({ to, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `px-3 py-1.5 text-sm rounded-md transition-colors duration-150 ${
                isActive
                  ? 'text-sp-accent bg-sp-accent/10'
                  : 'text-sp-text-dim hover:text-sp-text hover:bg-sp-surface-2'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-sp-text-muted">
          <span
            className={`w-2 h-2 rounded-full ${statusColors[status]}`}
            title={`Pipeline: ${status}`}
          />
          <span className="capitalize">{status}</span>
        </div>
      </div>
    </nav>
  );
}
