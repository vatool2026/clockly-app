import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { useTimerStore } from './stores/timerStore';
import { LoginPage } from './features/auth/LoginPage';
import './App.css';

import { TimerDashboard } from './features/timer/TimerDashboard';
import { ProjectAdmin } from './features/projects/ProjectAdmin';
import { AbsencePage } from './features/absences/AbsencePage';
import { AdminDashboard } from './features/admin/AdminDashboard';
import { PlatformDashboard } from './features/admin/PlatformDashboard';
import { RegisterPage } from './features/auth/RegisterPage';
import { ToastContainer } from './components/ToastContainer';

// Navigation layout wrapper
const AppLayout = () => {
  const { initializeTimer } = useTimerStore();
  const { user, profile, signOut } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    initializeTimer();
  }, [initializeTimer]);

  const isPlatformAdmin = user?.email === 'andre.reitz88@googlemail.com' || user?.email === 'vatool2026@gmail.com';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', background: 'var(--glass-bg)', backdropFilter: 'blur(10px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>⏱️ Clockly</h2>
          <nav style={{ display: 'flex', gap: '1rem' }}>
            <button 
              className={`btn ${location.pathname === '/app' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => navigate('/app')}
              style={{ padding: '0.4rem 1rem' }}
            >
              Timer
            </button>
            <button 
              className={`btn ${location.pathname === '/app/projects' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => navigate('/app/projects')}
              style={{ padding: '0.4rem 1rem' }}
            >
              Projekte
            </button>
            <button 
              className={`btn ${location.pathname === '/app/absences' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => navigate('/app/absences')}
              style={{ padding: '0.4rem 1rem' }}
            >
              Urlaub & Krankheit
            </button>
            {profile?.role === 'superadmin' && (
              <button 
                className={`btn ${location.pathname === '/app/admin' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => navigate('/app/admin')}
                style={{ padding: '0.4rem 1rem' }}
              >
                Admin & Reports
              </button>
            )}
            {isPlatformAdmin && (
              <button 
                className={`btn ${location.pathname === '/app/platform' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => navigate('/app/platform')}
                style={{ padding: '0.4rem 1rem', borderColor: 'var(--primary)', color: 'var(--primary)' }}
              >
                Platform
              </button>
            )}
          </nav>
        </div>
        <button className="btn btn-outline" style={{ padding: '0.4rem 1rem' }} onClick={() => signOut()}>
          Abmelden
        </button>
      </header>
      
      <Routes>
        <Route path="/" element={<TimerDashboard />} />
        <Route path="/projects" element={<ProjectAdmin />} />
        <Route path="/absences" element={<AbsencePage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/platform" element={<PlatformDashboard />} />
      </Routes>
      <ToastContainer />
    </div>
  );
};

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuthStore();
  if (isLoading) return <div>Lade Berechtigungen...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  return <>{children}</>;
};

function App() {
  const { initialize, isLoading } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Lädt Clockly...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route 
          path="/app/*" 
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </Router>
  );
}

export default App
