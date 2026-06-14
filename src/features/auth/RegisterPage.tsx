import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { registerCompany } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (password !== confirmPassword) {
      setError('Die Passwörter stimmen nicht überein.');
      return;
    }
    
    setLoading(true);
    
    try {
      await registerCompany({
        email,
        password,
        firstName,
        lastName,
        companyName
      });
      // Registration successful! Redirect to login or app
      alert('Erfolgreich registriert! Bitte logge dich jetzt ein.');
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist aufgetreten.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card glass-card">
        <h1 className="login-title">Firma registrieren</h1>
        <p className="login-subtitle">Starte mit Clockly für dein Team</p>
        
        {error && <div className="error-message" style={{ color: 'var(--danger)', marginBottom: '1rem', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)' }}>{error}</div>}
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="auth-label">Firmenname</label>
            <input 
              type="text" 
              className="auth-input"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="z.B. Muster GmbH"
              required
            />
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Vorname</label>
              <input 
                type="text" 
                className="input-field"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group" style={{ flex: 1 }}>
              <label>Nachname</label>
              <input 
                type="text" 
                className="input-field"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>E-Mail (Admin-Account)</label>
            <input 
              type="email" 
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="deine@email.de"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Passwort</label>
            <input 
              type="password" 
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label>Passwort bestätigen</label>
            <input 
              type="password" 
              className="input-field"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
          
          <button type="submit" className="btn-massive btn-submit pulse-animation" disabled={loading} style={{ width: '100%', marginTop: '1rem' }}>
            {loading ? 'Lädt...' : 'Jetzt loslegen'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Schon ein Konto? </span>
          <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold' }}>Hier einloggen</Link>
        </div>
      </div>
    </div>
  );
};
