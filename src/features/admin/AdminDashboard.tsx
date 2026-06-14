import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { exportToCSV } from '../../utils/csvExport';
import { Download, ShieldAlert, BarChart, Users, Settings } from 'lucide-react';
import { useToastStore } from '../../stores/toastStore';

export const AdminDashboard = () => {
  const { profile } = useAuthStore();
  const { showToast } = useToastStore();
  const [activeTab, setActiveTab] = useState<'reports' | 'users' | 'settings'>('reports');
  
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [companyUsers, setCompanyUsers] = useState<any[]>([]);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [featureToggles, setFeatureToggles] = useState<any>({});
  
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('employee');
  const [inviteLink, setInviteLink] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  
  const isAdmin = profile?.role === 'superadmin' || profile?.role === 'company_admin';

  useEffect(() => {
    if (!profile?.company_id || !isAdmin) return;

    const fetchData = async () => {
      // 1. Audit Logs
      const { data: logs } = await supabase
        .from('audit_log')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (logs) setAuditLogs(logs);

      // 2. Monthly Data
      const { data: timeEntries } = await supabase
        .from('time_entries')
        .select('user_id, total_minutes, net_minutes, work_date')
        .eq('company_id', profile.company_id);
      if (timeEntries) setMonthlyData(timeEntries);

      // 3. Company Users
      const { data: users } = await supabase
        .from('profiles')
        .select('*')
        .eq('company_id', profile.company_id);
      if (users) setCompanyUsers(users);

      // 4. Pending Invitations
      const { data: invites } = await supabase
        .from('invitations')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('status', 'pending');
      if (invites) setPendingInvites(invites);

      // 5. Company Settings
      const { data: company } = await supabase
        .from('companies')
        .select('feature_toggles')
        .eq('id', profile.company_id)
        .single();
      if (company && company.feature_toggles) setFeatureToggles(company.feature_toggles);
    };

    fetchData();
  }, [profile, isAdmin]);

  if (!isAdmin) {
    return <div style={{ padding: '2rem' }}>Keine Berechtigung.</div>;
  }

  const handleExport = () => {
    exportToCSV(monthlyData, `Zeiterfassung_Report_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    if (!error) {
      setCompanyUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      showToast('Rolle erfolgreich aktualisiert', 'success');
    } else {
      showToast('Fehler beim Aktualisieren der Rolle', 'error');
    }
  };

  const toggleFeature = async (key: string) => {
    const newToggles = { ...featureToggles, [key]: !featureToggles[key] };
    const { error } = await supabase.from('companies').update({ feature_toggles: newToggles }).eq('id', profile!.company_id);
    if (!error) {
      setFeatureToggles(newToggles);
      showToast('Einstellungen gespeichert', 'success');
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id) return;
    setIsInviting(true);
    setInviteLink('');

    try {
      const { data, error } = await supabase
        .from('invitations')
        .insert({
          company_id: profile.company_id,
          email: inviteEmail,
          role: inviteRole,
          created_by: profile.id
        })
        .select('token')
        .single();

      if (error) throw error;
      if (data) {
        const link = `${window.location.origin}/invite/${data.token}`;
        setInviteLink(link);
        
        // Refresh pending invites
        setPendingInvites(prev => [...prev, { ...data, email: inviteEmail, role: inviteRole, status: 'pending', id: data.token }]); // Approximate for instant UI update
        
        showToast('Einladungslink generiert!', 'success');
        setInviteEmail('');
      }
    } catch (err: any) {
      showToast('Fehler beim Erstellen der Einladung.', 'error');
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="glass-card" style={{ maxWidth: '1000px', margin: '2rem auto', padding: '2rem' }}>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
        <button className={`btn ${activeTab === 'reports' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('reports')}>
          <BarChart size={18} /> Reports & Logs
        </button>
        <button className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('users')}>
          <Users size={18} /> Mitarbeiter
        </button>
        <button className={`btn ${activeTab === 'settings' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('settings')}>
          <Settings size={18} /> Firmen-Einstellungen
        </button>
      </div>

      {activeTab === 'reports' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2>Reports</h2>
            <button className="btn btn-primary" onClick={handleExport}>
              <Download size={18} /> CSV Export
            </button>
          </div>

          <div style={{ display: 'flex', gap: '2rem' }}>
            <div style={{ flex: 2 }}>
              <h3>Monatsübersicht (Rohdaten)</h3>
              <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                {monthlyData.length === 0 ? <p>Keine Daten vorhanden.</p> : (
                  <table style={{ width: '100%', textAlign: 'left' }}>
                    <thead><tr><th>User ID</th><th>Datum</th><th>Brutto</th><th>Netto</th></tr></thead>
                    <tbody>
                      {monthlyData.map((row, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '0.5rem 0', fontSize: '0.8em' }}>{row.user_id.substring(0,8)}</td>
                          <td>{row.work_date}</td>
                          <td>{row.total_minutes}m</td>
                          <td>{row.net_minutes}m</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <h3><ShieldAlert size={18} style={{ verticalAlign: 'middle' }}/> Audit Log</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {auditLogs.map(log => (
                  <div key={log.id} style={{ fontSize: '0.8em', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
                    <span style={{ color: 'var(--primary)' }}>{log.action}</span> auf <code>{log.table_name}</code>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
            <h2>Neuen Mitarbeiter einladen</h2>
            <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <form onSubmit={handleInviteUser} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                <div style={{ flex: 2 }}>
                  <label>E-Mail Adresse</label>
                  <input 
                    type="email" 
                    className="input-field" 
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    placeholder="mitarbeiter@firma.de"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Rolle</label>
                  <select 
                    className="input-field" 
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                  >
                    <option value="employee">Mitarbeiter</option>
                    <option value="company_admin">Admin</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" disabled={isInviting || !inviteEmail}>
                  {isInviting ? 'Erstelle...' : 'Link generieren'}
                </button>
              </form>
              
              {inviteLink && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--primary)', borderRadius: 'var(--radius-sm)' }}>
                  <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>Einladungslink generiert!</p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="text" className="input-field" value={inviteLink} readOnly />
                    <button className="btn btn-outline" onClick={() => { navigator.clipboard.writeText(inviteLink); showToast('Kopiert!', 'success'); }}>
                      Kopieren
                    </button>
                    <a 
                      href={`mailto:?subject=Einladung zu Clockly&body=Hallo!%0D%0A%0D%0ADu wurdest eingeladen.%0D%0ABitte klicke auf diesen Link, um dich zu registrieren:%0D%0A${inviteLink}`}
                      className="btn btn-primary"
                      style={{ textDecoration: 'none' }}
                    >
                      E-Mail öffnen
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {pendingInvites.length > 0 && (
            <div>
              <h2>Ausstehende Einladungen</h2>
              <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <table style={{ width: '100%', textAlign: 'left' }}>
                  <thead><tr><th>E-Mail</th><th>Geplante Rolle</th><th>Link</th></tr></thead>
                  <tbody>
                    {pendingInvites.map((inv, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.5rem 0' }}>{inv.email}</td>
                        <td>{inv.role === 'company_admin' ? 'Admin' : 'Mitarbeiter'}</td>
                        <td>
                          <button className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8em' }} onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/invite/${inv.token || inv.id}`); showToast('Kopiert!', 'success'); }}>
                            Link kopieren
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div>
            <h2>Mitarbeiter-Verwaltung</h2>
            <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <table style={{ width: '100%', textAlign: 'left' }}>
              <thead><tr><th>Name</th><th>E-Mail</th><th>Rolle</th></tr></thead>
              <tbody>
                {companyUsers.filter(u => profile?.role === 'superadmin' ? true : u.role !== 'superadmin').map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.5rem 0' }}>{u.first_name} {u.last_name}</td>
                    <td>{u.email}</td>
                    <td>
                      <select 
                        value={u.role} 
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="input-field"
                        style={{ padding: '0.3rem', height: 'auto' }}
                        disabled={u.id === profile.id || (u.role === 'superadmin' && profile.role !== 'superadmin')}
                      >
                        <option value="employee">Mitarbeiter</option>
                        <option value="company_admin">Admin</option>
                        {u.role === 'superadmin' && (
                          <option value="superadmin">Super Admin</option>
                        )}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}

      {activeTab === 'settings' && (
        <div>
          <h2>Firmen-Einstellungen</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
              <div>
                <strong>Automatische Pause</strong>
                <p style={{ fontSize: '0.85em', color: 'var(--text-muted)' }}>Nach 6h = 30 Min, nach 9h = 45 Min (ArbZG)</p>
              </div>
              <button 
                className={`btn ${featureToggles.auto_break ? 'btn-success' : 'btn-outline'}`}
                onClick={() => toggleFeature('auto_break')}
              >
                {featureToggles.auto_break ? 'Aktiv' : 'Inaktiv'}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
              <div>
                <strong>Zeit-Rundung (15-Minuten-Takt)</strong>
                <p style={{ fontSize: '0.85em', color: 'var(--text-muted)' }}>Zeiten werden automatisch auf die nächste Viertelstunde gerundet.</p>
              </div>
              <button 
                className={`btn ${featureToggles.rounding ? 'btn-success' : 'btn-outline'}`}
                onClick={() => toggleFeature('rounding')}
              >
                {featureToggles.rounding ? 'Aktiv' : 'Inaktiv'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
