import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { Shield, Building, AlertCircle, Key, Ban, CheckCircle, Clock } from 'lucide-react';
import { useToastStore } from '../../stores/toastStore';

export const PlatformDashboard = () => {
  const { profile } = useAuthStore();
  const { showToast } = useToastStore();
  
  const [companies, setCompanies] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [systemMessage, setSystemMessage] = useState('');
  
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userTimes, setUserTimes] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isPlatformAdmin = profile?.role === 'superadmin';

  const fetchData = async () => {
    const { data: companiesData } = await supabase.from('companies').select('*').order('created_at', { ascending: false });
    if (companiesData) setCompanies(companiesData);

    const { data: usersData } = await supabase.from('profiles').select('*, companies(name)').order('created_at', { ascending: false });
    if (usersData) setAllUsers(usersData);
  };

  useEffect(() => {
    if (!isPlatformAdmin) return;
    fetchData();
  }, [isPlatformAdmin]);

  const handleSendNotification = () => {
    if (!systemMessage.trim()) return;
    // Hier würde man normalerweise in eine "system_notifications" Tabelle schreiben.
    // Für dieses MVP zeigen wir einfach einen Toast beim Platform Admin.
    showToast(`Systemnachricht gesendet: ${systemMessage}`, 'success');
    setSystemMessage('');
  };

  const handleResetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login?reset=true`,
    });
    if (error) {
      showToast('Fehler beim Senden der Reset-Mail', 'error');
    } else {
      showToast('Passwort-Reset E-Mail gesendet', 'success');
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
    const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', userId);
    if (error) {
      showToast('Fehler beim Ändern des Status', 'error');
    } else {
      showToast(`Nutzer erfolgreich ${newStatus === 'blocked' ? 'gesperrt' : 'entsperrt'}`, 'success');
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    if (!error) {
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      showToast('Rolle erfolgreich aktualisiert', 'success');
    } else {
      showToast('Fehler beim Aktualisieren der Rolle', 'error');
    }
  };

  const handleViewTimes = async (user: any) => {
    setSelectedUser(user);
    const { data, error } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('work_date', { ascending: false });
      
    if (!error && data) {
      setUserTimes(data);
    } else {
      setUserTimes([]);
    }
    setIsModalOpen(true);
  };

  if (!isPlatformAdmin) {
    return <div style={{ padding: '2rem' }}>Zutritt nur für Plattform-Betreiber.</div>;
  }

  return (
    <div className="glass-card" style={{ maxWidth: '1200px', margin: '2rem auto', padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Shield size={32} style={{ color: 'var(--primary)' }} />
        <h2>Platform Super-Admin</h2>
      </div>

      <div style={{ display: 'flex', gap: '2rem' }}>
        <div style={{ flex: 2 }}>
          <>
              <h3><Building size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Firmen</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {companies.map(c => (
                  <div key={c.id} style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h4 style={{ margin: 0, fontSize: '1.2rem' }}>{c.name} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({c.slug})</span></h4>
                    </div>
                    
                    <table style={{ width: '100%', textAlign: 'left', fontSize: '0.9em' }}>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>E-Mail</th>
                          <th>Rolle</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Aktionen</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allUsers.filter(u => u.company_id === c.id && u.role !== 'superadmin').map(u => (
                          <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '0.5rem 0' }}>{u.first_name} {u.last_name}</td>
                            <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                            <td>
                              <select 
                                value={u.role} 
                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                className="input-field"
                                style={{ padding: '0.2rem', height: 'auto', fontSize: '0.8em' }}
                              >
                                <option value="employee">Mitarbeiter</option>
                                <option value="company_admin">Admin</option>
                              </select>
                            </td>
                            <td>
                              <span style={{ 
                                padding: '0.2rem 0.5rem', 
                                borderRadius: '1rem', 
                                fontSize: '0.8em',
                                background: u.status === 'blocked' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                                color: u.status === 'blocked' ? '#ef4444' : '#22c55e'
                              }}>
                                {u.status || 'active'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                              <button className="btn btn-outline" style={{ padding: '0.2rem 0.5rem' }} title="Zeiten einsehen" onClick={() => handleViewTimes(u)}>
                                <Clock size={14} />
                              </button>
                              <button className="btn btn-outline" style={{ padding: '0.2rem 0.5rem' }} title="Passwort Reset senden" onClick={() => handleResetPassword(u.email)}>
                                <Key size={14} />
                              </button>
                              <button 
                                className={`btn ${u.status === 'blocked' ? 'btn-success' : 'btn-danger'}`} 
                                style={{ padding: '0.2rem 0.5rem' }} 
                                title={u.status === 'blocked' ? "Entsperren" : "Sperren"}
                                onClick={() => handleToggleStatus(u.id, u.status)}
                              >
                                {u.status === 'blocked' ? <CheckCircle size={14} /> : <Ban size={14} />}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </>
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

      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="glass-card" style={{ padding: '2rem', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2>Zeiten für {selectedUser?.first_name} {selectedUser?.last_name}</h2>
              <button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Schließen</button>
            </div>
            
            {userTimes.length === 0 ? (
              <p>Keine Zeiten erfasst.</p>
            ) : (
              <table style={{ width: '100%', textAlign: 'left' }}>
                <thead>
                  <tr>
                    <th>Datum</th>
                    <th>Beginn</th>
                    <th>Ende</th>
                    <th>Brutto (Min)</th>
                    <th>Netto (Min)</th>
                  </tr>
                </thead>
                <tbody>
                  {userTimes.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.5rem 0' }}>{t.work_date}</td>
                      <td>{t.start_time?.substring(0, 5)}</td>
                      <td>{t.end_time?.substring(0, 5) || '-'}</td>
                      <td>{t.total_minutes}</td>
                      <td>{t.net_minutes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
