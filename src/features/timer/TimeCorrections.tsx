import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { logAudit } from '../../utils/auditLogger';
import { useToastStore } from '../../stores/toastStore';
import { Edit3, CheckCircle } from 'lucide-react';

export const TimeCorrections = () => {
  const { user, profile } = useAuthStore();
  const { showToast } = useToastStore();
  
  const [recentEntries, setRecentEntries] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [newTotalMins, setNewTotalMins] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!user) return;
    const fetchEntries = async () => {
      const { data } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('work_date', { ascending: false })
        .limit(5);
      if (data) setRecentEntries(data);
    };
    fetchEntries();
  }, [user]);

  const handleCorrect = async (e: React.FormEvent, entry: any) => {
    e.preventDefault();
    if (!reason.trim()) {
      showToast('Bitte einen Grund angeben', 'error');
      return;
    }

    const totalMinsInt = parseInt(newTotalMins);
    if (isNaN(totalMinsInt) || totalMinsInt < 0) return;

    const oldData = { total_minutes: entry.total_minutes };
    const newData = { total_minutes: totalMinsInt, is_corrected: true };

    const { error } = await supabase
      .from('time_entries')
      .update(newData)
      .eq('id', entry.id);

    if (!error && profile) {
      await logAudit(user!.id, profile.company_id, 'Korrektur (Manuell)', 'time_entries', entry.id, oldData, newData);
      
      showToast('Korrektur erfolgreich beantragt & geloggt', 'success');
      setEditingId(null);
      setRecentEntries(prev => prev.map(p => p.id === entry.id ? { ...p, ...newData } : p));
    } else {
      showToast('Fehler bei der Korrektur', 'error');
    }
  };

  if (recentEntries.length === 0) return null;

  return (
    <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginTop: '2rem' }}>
      <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Edit3 size={18} /> Vergangene Zeiten korrigieren
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {recentEntries.map(entry => (
          <div key={entry.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem', background: 'rgba(0,0,0,0.1)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{entry.work_date}</strong>
                <span style={{ marginLeft: '1rem', color: 'var(--text-secondary)' }}>Bisher: {entry.total_minutes} Minuten {entry.is_corrected ? '(Korrigiert)' : ''}</span>
              </div>
              <button className="btn btn-outline" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8em' }} onClick={() => {
                setEditingId(editingId === entry.id ? null : entry.id);
                setNewTotalMins(entry.total_minutes.toString());
              }}>
                Korrigieren
              </button>
            </div>

            {editingId === entry.id && (
              <form onSubmit={(e) => handleCorrect(e, entry)} style={{ display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'flex-end', padding: '1rem', background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Neue Gesamtzeit (Minuten)</label>
                  <input type="number" className="input-field" value={newTotalMins} onChange={e => setNewTotalMins(e.target.value)} required />
                </div>
                <div className="form-group" style={{ flex: 2 }}>
                  <label>Grund (z.B. Vergessen auszustempeln)</label>
                  <input type="text" className="input-field" value={reason} onChange={e => setReason(e.target.value)} required />
                </div>
                <button type="submit" className="btn btn-primary" style={{ height: '42px', marginBottom: '1rem' }}>
                  <CheckCircle size={16} style={{ marginRight: '0.5rem' }}/> Speichern
                </button>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
