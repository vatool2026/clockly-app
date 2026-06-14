import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';

export const ProfilePage: React.FC = () => {
  const { user, profile, updatePassword } = useAuthStore();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const roleLabels: Record<string, string> = {
    superadmin: 'Super Admin',
    company_admin: 'Administrator',
    employee: 'Mitarbeiter',
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Die Passwörter stimmen nicht überein.' });
      return;
    }
    
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Das Passwort muss mindestens 6 Zeichen lang sein.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePassword(newPassword);
      setMessage({ type: 'success', text: 'Passwort erfolgreich geändert.' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error(error);
      setMessage({ type: 'error', text: error.message || 'Fehler beim Ändern des Passworts.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '2rem', color: 'var(--text)' }}>Mein Profil</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        
        {/* Profile Details */}
        <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--text)' }}>Profildetails</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Name</label>
              <div style={{ fontWeight: 500, color: 'var(--text)' }}>{profile?.first_name} {profile?.last_name}</div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>E-Mail Adresse</label>
              <div style={{ fontWeight: 500, color: 'var(--text)' }}>{user?.email}</div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Rolle</label>
              <div style={{ fontWeight: 500, display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '9999px', background: 'rgba(var(--primary-rgb, 59, 130, 246), 0.1)', color: 'var(--primary)', fontSize: '0.85rem' }}>
                {profile?.role ? roleLabels[profile.role] || profile.role : 'Unbekannt'}
              </div>
            </div>
          </div>
        </div>

        {/* Password Change */}
        <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--text)' }}>Passwort ändern</h2>
          
          {message && (
            <div style={{ 
              padding: '0.75rem', 
              borderRadius: '8px', 
              marginBottom: '1rem',
              background: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: message.type === 'success' ? '#166534' : '#991b1b',
              border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`
            }}>
              {message.text}
            </div>
          )}

          <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--text)' }}>Neues Passwort</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input"
                style={{ width: '100%' }}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--text)' }}>Passwort bestätigen</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input"
                style={{ width: '100%' }}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {isSubmitting ? 'Wird geändert...' : 'Passwort speichern'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
