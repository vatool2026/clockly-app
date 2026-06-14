import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

export const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      <nav className="landing-nav">
        <div className="landing-nav-logo">
          ⏱️ Clockly
        </div>
        <div className="landing-nav-actions">
          <button className="btn btn-outline" onClick={() => navigate('/login')}>
            Anmelden
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/register')}>
            Firma registrieren
          </button>
        </div>
      </nav>

      <main className="landing-hero">
        <div className="landing-hero-content">
          <div className="landing-badge">✨ Jetzt 100% kostenlos nutzbar</div>
          <h1 className="landing-title">
            Zeiterfassung,<br />die einfach funktioniert.
          </h1>
          <p className="landing-subtitle">
            Verwalte Arbeitszeiten, Projekte und Urlaube deines Teams in einer modernen, rechtssicheren und vollständig kostenlosen Plattform.
          </p>
          <div className="landing-cta-group">
            <button className="btn btn-primary btn-large" onClick={() => navigate('/register')}>
              Kostenlos starten
            </button>
            <button className="btn btn-outline btn-large" onClick={() => {
              document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
            }}>
              Funktionen entdecken
            </button>
          </div>
        </div>
      </main>

      <section id="features" className="landing-features">
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">⏱️</div>
            <h3 className="feature-title">Einfacher Timer</h3>
            <p className="feature-desc">
              Ein-Klick-Zeiterfassung für dein Team. Unterstützt Pausen, automatische Rundung und Projektzuweisungen.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3 className="feature-title">Admin Dashboard</h3>
            <p className="feature-desc">
              Behalte den Überblick über alle Zeiten, exportiere Daten als CSV für die Lohnbuchhaltung und verwalte Rollen.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🌴</div>
            <h3 className="feature-title">Urlaub & Krankheit</h3>
            <p className="feature-desc">
              Integrierte Abwesenheitsverwaltung mit Genehmigungsprozess, damit du immer weißt, wer im Team verfügbar ist.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🛡️</div>
            <h3 className="feature-title">Höchste Sicherheit</h3>
            <p className="feature-desc">
              Strenge Datentrennung (Row Level Security). Deine Firmendaten sind isoliert und sicher vor fremden Zugriffen.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3 className="feature-title">Als App installierbar</h3>
            <p className="feature-desc">
              Clockly funktioniert als Progressive Web App (PWA). Installiere sie einfach auf deinem Smartphone oder Desktop.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💰</div>
            <h3 className="feature-title">Dauerhaft kostenlos</h3>
            <p className="feature-desc">
              Keine versteckten Gebühren, keine Limits. Clockly ist in der aktuellen Version zu 100% kostenfrei nutzbar.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
