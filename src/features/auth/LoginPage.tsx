import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Fingerprint, LogIn, Mail, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './Login.css';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // MFA Check would happen here
      // For now, redirect to app
      navigate('/app');
    } catch (err: any) {
      setError(err.message || 'Login fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    // Passkey logic will be implemented here using WebAuthn
    alert("Passkey Login wird in Kürze hinzugefügt!");
  };

  return (
    <div className="login-container">
      <div className="login-card glass-card">
        <div className="login-header">
          <div className="logo-container">
            <span className="logo-icon">⏱️</span>
          </div>
          <h1>{t('app_name')}</h1>
          <p className="login-subtitle">Melde dich an, um fortzufahren</p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleEmailLogin} className="login-form">
          <div className="input-group">
            <Mail className="input-icon" size={18} />
            <input
              type="email"
              placeholder="E-Mail Adresse"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <Lock className="input-icon" size={18} />
            <input
              type="password"
              placeholder="Passwort"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-massive btn-submit pulse-animation" disabled={loading} style={{ width: '100%', marginTop: '1rem' }}>
            {loading ? 'Lädt...' : 'Login'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Neue Firma? </span>
          <Link to="/register" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold' }}>Hier registrieren</Link>
        </div>

        <div className="divider">
          <span>Oder</span>
        </div>

        <button 
          onClick={handlePasskeyLogin} 
          className="btn btn-outline btn-full btn-passkey"
        >
          <Fingerprint size={18} /> Mit Passkey / PIN anmelden
        </button>
      </div>
      
      {/* Background decoration */}
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>
    </div>
  );
}
