import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useTimerStore } from '../../../stores/timerStore';
import { useAuthStore } from '../../../stores/authStore';
import { useToastStore } from '../../../stores/toastStore';
import { calculateFinalTimes } from '../../../utils/timeCalculations';
import { CheckCircle, Clock, Edit2, Send } from 'lucide-react';

export const StageSummary = () => {
  const { startTime, totalPauseMinutes, resetTimer } = useTimerStore();
  const { showToast } = useToastStore();
  const [isEditing, setIsEditing] = useState(false);
  const [manualPause, setManualPause] = useState(totalPauseMinutes.toString());
  
  const endTime = new Date();
  
  // Very basic calculation for display
  const totalMs = startTime ? endTime.getTime() - startTime.getTime() : 0;
  const totalMins = Math.floor(totalMs / 60000);
  const netMins = Math.max(0, totalMins - parseInt(manualPause || '0'));
  
  const formatTime = (date: Date | null) => {
    if (!date) return '--:--';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const handleSubmit = async () => {
    const { timeEntryId, startTime } = useTimerStore.getState();
    const { profile } = useAuthStore.getState();
    
    if (timeEntryId && startTime && profile) {
      const parsedManual = parseInt(manualPause || '0');
      
      // We will assume default config for now, ideally fetched from context or profile.company_id
      const config = { rounding: true, auto_break: true }; 
      
      const { finalStart, finalEnd, finalPauseMinutes, netMinutes, grossMinutes } = calculateFinalTimes(
        startTime, 
        endTime, 
        parsedManual, 
        config
      );
      
      if (finalPauseMinutes > parsedManual) {
        showToast(`Gesetzliche Pflichtpause: Es wurden ${finalPauseMinutes} Minuten Pause berechnet.`, 'info');
      }
      
      await supabase
        .from('time_entries')
        .update({
          clock_out: finalEnd.toISOString(),
          pause_minutes: finalPauseMinutes,
          net_minutes: netMinutes,
          total_minutes: grossMinutes,
          status: 'completed'
        })
        .eq('id', timeEntryId);
    }
    
    alert('Zeiten wurden erfolgreich in der Datenbank gespeichert!');
    resetTimer();
  };

  return (
    <div className="stage-container stage-summary glass-card">
      <div className="summary-header">
        <CheckCircle size={48} className="success-icon" />
        <h2>Tageszusammenfassung</h2>
        <p>Gute Arbeit heute!</p>
      </div>
      
      <div className="summary-details">
        <div className="detail-row">
          <span><Clock size={16}/> Startzeit</span>
          <strong>{formatTime(startTime)}</strong>
        </div>
        <div className="detail-row">
          <span><Clock size={16}/> Endzeit</span>
          <strong>{formatTime(endTime)} <span className="rounding-arrow">↓</span></strong>
        </div>
        <div className="detail-row highlight">
          <span>Pausenzeit</span>
          {isEditing ? (
            <input 
              type="number" 
              value={manualPause} 
              onChange={(e) => setManualPause(e.target.value)}
              className="pause-input"
              min="0"
            />
          ) : (
            <strong>{manualPause} Min</strong>
          )}
        </div>
        <div className="divider"></div>
        <div className="detail-row total">
          <span>Netto Arbeitszeit</span>
          <strong>{formatDuration(netMins)}</strong>
        </div>
      </div>
      
      <div className="action-buttons-vertical">
        <button className="btn btn-outline btn-full" onClick={() => setIsEditing(!isEditing)}>
          <Edit2 size={18} /> {isEditing ? 'Speichern' : 'Pause bearbeiten'}
        </button>
        <button className="btn btn-primary btn-full" onClick={handleSubmit}>
          <Send size={18} /> Zeiten abschicken
        </button>
      </div>
    </div>
  );
};
