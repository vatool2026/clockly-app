import React, { useEffect, useState } from 'react';
import { useAbsenceStore } from '../../stores/absenceStore';
import { useAuthStore } from '../../stores/authStore';
import { Calendar, Thermometer, CheckCircle, XCircle } from 'lucide-react';

export const AbsencePage = () => {
  const { profile } = useAuthStore();
  const { leaveRequests, sickLeaves, isLoading, fetchAbsences, requestLeave, reportSick, updateLeaveStatus } = useAbsenceStore();
  
  const [activeTab, setActiveTab] = useState<'leave' | 'sick'>('leave');
  
  // Forms
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const isManager = profile?.role === 'superadmin' || profile?.role === 'manager';

  useEffect(() => {
    fetchAbsences();
  }, [fetchAbsences]);

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await requestLeave(startDate, endDate, reason);
    setStartDate(''); setEndDate(''); setReason('');
  };

  const handleSickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await reportSick(startDate, endDate);
    setStartDate(''); setEndDate('');
  };

  return (
    <div className="glass-card" style={{ maxWidth: '800px', margin: '2rem auto', padding: '2rem' }}>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
        <button 
          className={`btn ${activeTab === 'leave' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('leave')}
        >
          <Calendar size={18} /> Urlaubsantrag
        </button>
        <button 
          className={`btn ${activeTab === 'sick' ? 'btn-danger' : 'btn-outline'}`}
          style={activeTab === 'sick' ? { color: 'white' } : {}}
          onClick={() => setActiveTab('sick')}
        >
          <Thermometer size={18} /> Krankmeldung
        </button>
      </div>

      {activeTab === 'leave' && (
        <div>
          <h3>Neuen Urlaub beantragen</h3>
          <form onSubmit={handleLeaveSubmit} style={{ display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Von</label>
              <input type="date" className="input-field" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Bis</label>
              <input type="date" className="input-field" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Grund (Optional)</label>
              <input type="text" className="input-field" value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ height: '42px', marginBottom: '1rem' }}>Beantragen</button>
          </form>

          <h3 style={{ marginTop: '3rem', marginBottom: '1rem' }}>{isManager ? 'Alle Urlaubsanträge (Team)' : 'Meine Urlaubsanträge'}</h3>
          {isLoading ? <p>Lade Anträge...</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {leaveRequests.map(req => (
                <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div>
                    <strong>{req.start_date} bis {req.end_date}</strong>
                    <div style={{ fontSize: '0.85em', color: 'var(--text-secondary)' }}>Status: {req.status.toUpperCase()}</div>
                  </div>
                  
                  {isManager && req.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-icon" style={{ color: 'var(--success)' }} onClick={() => updateLeaveStatus(req.id, 'approved')}>
                        <CheckCircle size={20} />
                      </button>
                      <button className="btn btn-icon" onClick={() => updateLeaveStatus(req.id, 'rejected')}>
                        <XCircle size={20} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'sick' && (
        <div>
          <h3 style={{ color: 'var(--danger)' }}>Krankmeldung einreichen</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Wir wünschen dir gute Besserung! Bitte informiere uns, wie lange du voraussichtlich ausfällst.</p>
          <form onSubmit={handleSickSubmit} style={{ display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Von</label>
              <input type="date" className="input-field" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Voraussichtlich bis</label>
              <input type="date" className="input-field" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-danger" style={{ height: '42px', marginBottom: '1rem', color: 'white' }}>Melden</button>
          </form>

          <h3 style={{ marginTop: '3rem', marginBottom: '1rem' }}>Gemeldete Krankheitstage</h3>
          {isLoading ? <p>Lade...</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {sickLeaves.map(sick => (
                <div key={sick.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <strong>{sick.start_date} bis {sick.end_date}</strong>
                  <span style={{ color: 'var(--danger)', fontSize: '0.85em' }}>{sick.status.toUpperCase()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
