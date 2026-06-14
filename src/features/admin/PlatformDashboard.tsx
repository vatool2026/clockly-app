import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { Shield, Building, AlertCircle } from 'lucide-react';
import { useToastStore } from '../../stores/toastStore';

export const PlatformDashboard = () => {
  const { user } = useAuthStore();
  const { showToast } = useToastStore();
  
  const [companies, setCompanies] = useState<any[]>([]);
  const [systemMessage, setSystemMessage] = useState('');

  // Hardcoded platform admin check for demonstration
  const isPlatformAdmin = user?.email === 'andre.reitz88@googlemail.com' || user?.email === 'vatool2026@gmail.com';

  useEffect(() => {
    if (!isPlatformAdmin) return;
    const fetchCompanies = async () => {
      const { data } = await supabase.from('companies').select('*').order('created_at', { ascending: false });
      if (data) setCompanies(data);
    };
    fetchCompanies();
  }, [isPlatformAdmin]);

  const handleSendNotification = () => {
    if (!systemMessage.trim()) return;
    // Hier würde man normalerweise in eine "system_notifications" Tabelle schreiben.
    // Für dieses MVP zeigen wir einfach einen Toast beim Platform Admin.
    showToast(`Systemnachricht gesendet: ${systemMessage}`, 'success');
    setSystemMessage('');
  };

  if (!isPlatformAdmin) {
    return <div style={{ padding: '2rem' }}>Zutritt nur für Plattform-Betreiber.</div>;
  }

  return (
    <div className="glass-card" style={{ maxWidth: '1000px', margin: '2rem auto', padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Shield size={32} style={{ color: 'var(--primary)' }} />
        <h2>Platform Super-Admin</h2>
      </div>

      <div style={{ display: 'flex', gap: '2rem' }}>
        <div style={{ flex: 2 }}>
          <h3><Building size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Registrierte Firmen</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Übersicht aller Mandanten auf deiner Plattform.</p>
          
          <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <table style={{ width: '100%', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th>Firma</th>
                  <th>Slug</th>
                  <th>Status</th>
                  <th>Erstellt am</th>
                </tr>
              </thead>
              <tbody>
                {companies.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.8rem 0' }}><strong>{c.name}</strong></td>
                    <td style={{ color: 'var(--text-muted)' }}>{c.slug}</td>
                    <td><span style={{ color: 'var(--success)' }}>{c.status || 'active'}</span></td>
                    <td>{new Date(c.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <h3><AlertCircle size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> System-Broadcast</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Nachricht an alle Firmen senden (z.B. bei Wartungsarbeiten).</p>
          
          <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <textarea 
              className="input-field" 
              style={{ minHeight: '100px', marginBottom: '1rem' }}
              placeholder="Achtung: Am Sonntag um 02:00 Uhr finden Wartungsarbeiten statt..."
              value={systemMessage}
              onChange={(e) => setSystemMessage(e.target.value)}
            />
            <button className="btn btn-primary btn-full" onClick={handleSendNotification}>
              Broadcast senden
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
