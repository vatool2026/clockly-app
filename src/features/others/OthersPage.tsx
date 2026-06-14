import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, HeartPulse } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export const OthersPage = () => {
  const navigate = useNavigate();
  const { profile } = useAuthStore();

  const isSuperAdmin = profile?.role === 'superadmin';
  const isCompanyAdmin = profile?.role === 'company_admin' || profile?.role === 'company_coadmin';
  const isEmployee = !isSuperAdmin && !isCompanyAdmin;

  if (!isEmployee) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h3>Diese Ansicht ist für Mitarbeiter vorgesehen.</h3>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Sonstiges</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
        
        <button 
          className="glass-card" 
          onClick={() => navigate('/app/absences')}
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '2rem',
            gap: '1rem',
            cursor: 'pointer',
            textAlign: 'center'
          }}
        >
          <HeartPulse size={48} color="var(--primary)" />
          <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Krankheit & Urlaub</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            Fehlzeiten eintragen und verwalten.
          </p>
        </button>

        <button 
          className="glass-card" 
          onClick={() => navigate('/app/projects')}
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '2rem',
            gap: '1rem',
            cursor: 'pointer',
            textAlign: 'center'
          }}
        >
          <Briefcase size={48} color="var(--primary)" />
          <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Projekte</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            Projekte einsehen und Aufgaben verwalten.
          </p>
        </button>

      </div>
    </div>
  );
};
