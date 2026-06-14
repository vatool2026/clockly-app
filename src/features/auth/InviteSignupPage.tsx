import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';

export const InviteSignupPage = () => {
  const { token } = useParams<{ token: string }>();
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);
  
  const { registerFromInvite } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('Kein Einladungs-Token gefunden.');
        setCheckingToken(false);
        return;
      }
      
      try {
        const { data: inviteData, error: inviteError } = await supabase
          .from('invitations')
          .select('*, companies(name)')
          .eq('token', token)
          .single();
          
        if (inviteError || !inviteData) {
          setError('Ungültiger oder abgelaufener Einladungslink.');
        } else if (inviteData.status !== 'pending') {
          setError('Diese Einladung wurde bereits verwendet.');
        } else {
          setEmail(inviteData.email);
          setCompanyName(inviteData.companies?.name || 'Unternehmen');
        }
      } catch (err: any) {
        setError('Fehler beim Prüfen der Einladung.');
      } finally {
        setCheckingToken(false);
      }
    };
    
    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (password !== confirmPassword) {
      setError('Die Passwörter stimmen nicht überein.');
      return;
    }
    
    setLoading(true);
    
    try {
      await registerFromInvite(token!, {
        firstName,
        lastName,
        password
      });
      // Registration successful! Redirect to login
      alert('Erfolgreich registriert! Bitte logge dich jetzt ein.');
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist aufgetreten.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingToken) {
    return (
      <div className="login-container">
        <div className="login-card glass-card">
          <p>Prüfe Einladung...</p>
        </div>
      </div>
    );
  }

  if (error && !email) {
    return (
      <div className="login-container">
        <div className="login-card glass-card">
          <h1 className="login-title">Einladung ungültig</h1>
          <p className="error-message" style={{ color: 'var(--danger)', marginBottom: '1rem', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)' }}>
            {error}
          </p>
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <Link to="/login" className="btn btn-primary" style={{ textDecoration: 'none' }}>Zum Login</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card glass-card">
        <h1 className="login-title">Willkommen!</h1>
        <p className="login-subtitle">Registrierung für <strong>{companyName}</strong></p>
        
        {error && <div className="error-message" style={{ color: 'var(--danger)', marginBottom: '1rem', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)' }}>{error}</div>}
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="auth-label">E-Mail</label>
            <input 
              type="email" 
              className="auth-input input-disabled"
              value={email}
              disabled
              style={{ opacity: 0.7, cursor: 'not-allowed' }}
            />
            <small style={{ color: 'var(--text-muted)' }}>Die E-Mail wurde durch die Einladung festgelegt.</small>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="auth-label">Vorname</label>
              <input 
                type="text" 
                className="auth-input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group" style={{ flex: 1 }}>
              <label className="auth-label">Nachname</label>
              <input 
                type="text" 
                className="auth-input"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label className="auth-label">Passwort</label>
            <input 
              type="password" 
              className="auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label className="auth-label">Passwort bestätigen</label>
            <input 
              type="password" 
              className="auth-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
          
          <button type="submit" className="btn-massive btn-submit pulse-animation" disabled={loading} style={{ width: '100%', marginTop: '1rem' }}>
            {loading ? 'Lädt...' : 'Konto erstellen'}
          </button>
        </form>
      </div>
    </div>
  );
};
