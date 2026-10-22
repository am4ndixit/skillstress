import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { BookOpen, FlaskConical, FileClock, House, Settings as SettingsIcon, Sparkles } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: House, exact: true },
  { to: '/lab', label: 'Test', icon: FlaskConical },
  { to: '/library', label: 'Skills', icon: BookOpen },
  { to: '/history', label: 'History', icon: FileClock },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <div className="top-nav-wrap">
      <nav className="top-nav" aria-label="Main navigation">
        <NavLink to="/" className="brand-mark" aria-label="SkillStress home">
          <Sparkles size={18} strokeWidth={2.8} />
          <span>Skill<span className="brand-accent">Stress</span></span>
        </NavLink>
        <div className="top-nav-links">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = item.exact ? location.pathname === item.to : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`top-nav-link ${active ? 'active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={14} aria-hidden="true" />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
