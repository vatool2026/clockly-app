import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Clock, Calendar, MoreHorizontal, User } from 'lucide-react';
import './BottomNav.css';

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/app', icon: <Clock size={24} />, label: 'Tracker' },
    { path: '/app/calendar', icon: <Calendar size={24} />, label: 'Kalender' },
    { path: '/app/others', icon: <MoreHorizontal size={24} />, label: 'Sonstiges' },
    { path: '/app/profile', icon: <User size={24} />, label: 'Profile' },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path || (item.path === '/app/others' && (location.pathname === '/app/projects' || location.pathname === '/app/absences'));
        return (
          <button
            key={item.path}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            {item.icon}
            <span className="bottom-nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
