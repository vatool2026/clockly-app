import React, { useEffect, useState } from 'react';
import { useTimerStore } from '../../../stores/timerStore';
import { Play } from 'lucide-react';

export const StagePaused = () => {
  const { currentPauseStart, stopPause } = useTimerStore();
  const [pauseElapsed, setPauseElapsed] = useState('00:00:00');

  useEffect(() => {
    if (!currentPauseStart) return;
    
    const updateTimer = () => {
      const diffMs = new Date().getTime() - currentPauseStart.getTime();
      const hrs = Math.floor(diffMs / 3600000);
      const mins = Math.floor((diffMs % 3600000) / 60000);
      const secs = Math.floor((diffMs % 60000) / 1000);
      
      setPauseElapsed(
        `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      );
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [currentPauseStart]);

  return (
    <div className="stage-container stage-paused">
      <div className="status-badge status-paused">
        <span className="dot"></span> In Pause
      </div>
      
      <div className="timer-display muted">
        {pauseElapsed}
      </div>
      
      <div className="action-buttons">
        <button className="btn-large btn-resume pulse-animation" onClick={stopPause}>
          <Play size={24} /> Pause beenden
        </button>
      </div>
    </div>
  );
};
