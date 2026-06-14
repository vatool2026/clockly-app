import React, { useEffect, useState } from 'react';
import { useTimerStore } from '../../../stores/timerStore';
import { Pause, Square } from 'lucide-react';

export const StagePostPause = () => {
  const { startTime, startPause, stopWork, totalPauseMinutes } = useTimerStore();
  const [elapsed, setElapsed] = useState('00:00:00');

  useEffect(() => {
    if (!startTime) return;
    
    const updateTimer = () => {
      const diffMs = new Date().getTime() - startTime.getTime();
      const hrs = Math.floor(diffMs / 3600000);
      const mins = Math.floor((diffMs % 3600000) / 60000);
      const secs = Math.floor((diffMs % 60000) / 1000);
      
      setElapsed(
        `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      );
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  return (
    <div className="stage-container stage-working">
      <div className="status-badge status-active">
        <span className="dot pulse"></span> Arbeitet
      </div>
      
      <div className="timer-display">
        {elapsed}
      </div>
      
      <div className="pause-info">
        Bisherige Pause: {totalPauseMinutes} Min
      </div>
      
      <div className="action-buttons">
        <button className="btn-large btn-pause" onClick={startPause}>
          <Pause size={24} /> Pause
        </button>
        
        <button className="btn-large btn-stop btn-danger" onClick={stopWork}>
          <Square size={24} /> Feierabend
        </button>
      </div>
    </div>
  );
};
