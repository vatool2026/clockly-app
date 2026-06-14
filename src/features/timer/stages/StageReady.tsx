import React, { useEffect, useState } from 'react';
import { useTimerStore } from '../../../stores/timerStore';
import { Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const StageReady = () => {
  const { startWork } = useTimerStore();
  const { t } = useTranslation();
  
  const [time, setTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="stage-container stage-ready">
      <div className="current-time">
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
      <p className="greeting">Bereit für den Arbeitstag?</p>
      
      <button className="btn-massive btn-start-work pulse-animation" onClick={startWork}>
        <Play size={32} />
        Arbeit starten
      </button>
    </div>
  );
};
