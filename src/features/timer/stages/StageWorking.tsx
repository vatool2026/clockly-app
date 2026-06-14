import React, { useEffect, useState } from 'react';
import { useTimerStore } from '../../../stores/timerStore';
import { useProjectStore } from '../../../stores/projectStore';
import { useTaskStore } from '../../../stores/taskStore';
import { Pause, Square, Play, Briefcase } from 'lucide-react';

export const StageWorking = () => {
  const { startTime, startPause, stopWork } = useTimerStore();
  const { projects, fetchProjects } = useProjectStore();
  const { activeTaskId, activeProjectId, taskStartTime, startTask, stopTask } = useTaskStore();
  
  const [elapsed, setElapsed] = useState('00:00:00');
  const [taskElapsed, setTaskElapsed] = useState('00:00:00');
  const [showProjectSelect, setShowProjectSelect] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Main Timer
  useEffect(() => {
    if (!startTime) return;
    const updateTimer = () => {
      const diffMs = new Date().getTime() - startTime.getTime();
      const hrs = Math.floor(diffMs / 3600000);
      const mins = Math.floor((diffMs % 3600000) / 60000);
      const secs = Math.floor((diffMs % 60000) / 1000);
      setElapsed(`${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    };
    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  // Task Sub-Timer
  useEffect(() => {
    if (!taskStartTime) {
      setTaskElapsed('00:00:00');
      return;
    }
    const updateTaskTimer = () => {
      const diffMs = new Date().getTime() - taskStartTime.getTime();
      const hrs = Math.floor(diffMs / 3600000);
      const mins = Math.floor((diffMs % 3600000) / 60000);
      const secs = Math.floor((diffMs % 60000) / 1000);
      setTaskElapsed(`${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    };
    updateTaskTimer();
    const timer = setInterval(updateTaskTimer, 1000);
    return () => clearInterval(timer);
  }, [taskStartTime]);

  const handleStop = async () => {
    if (window.confirm("Möchtest du den Arbeitstag wirklich beenden?")) {
      if (activeTaskId) await stopTask();
      stopWork();
    }
  };

  const activeProject = projects.find(p => p.id === activeProjectId);

  return (
    <div className="stage-container stage-working">
      <div className="status-badge status-active">
        <span className="dot pulse"></span> Arbeitet
      </div>
      
      <div className="timer-display">
        {elapsed}
      </div>

      {/* Project Tracking Area */}
      <div className="project-tracking-area" style={{ width: '100%', padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '1rem', border: '1px solid var(--border)' }}>
        {activeTaskId ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ color: 'var(--primary)', fontSize: '0.9em', fontWeight: 'bold' }}>
              Auf Projekt gebucht: {activeProject?.name}
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '1.5rem', color: 'var(--text-primary)' }}>
              {taskElapsed}
            </div>
            <button className="btn btn-outline" onClick={() => stopTask()} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>
              <Square size={16} /> Projekt-Timer stoppen
            </button>
          </div>
        ) : showProjectSelect ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <h4 style={{ marginBottom: '0.5rem' }}>Projekt auswählen</h4>
            {projects.length === 0 ? (
              <p style={{ fontSize: '0.9em', color: 'var(--text-muted)' }}>Keine Projekte vorhanden.</p>
            ) : (
              projects.map(p => (
                <button 
                  key={p.id} 
                  className="btn btn-outline" 
                  style={{ justifyContent: 'flex-start' }}
                  onClick={() => { startTask(p.id); setShowProjectSelect(false); }}
                >
                  <Play size={14} /> {p.name}
                </button>
              ))
            )}
            <button className="btn" style={{ marginTop: '0.5rem' }} onClick={() => setShowProjectSelect(false)}>Abbrechen</button>
          </div>
        ) : (
          <button className="btn btn-primary btn-full" onClick={() => setShowProjectSelect(true)}>
            <Briefcase size={18} /> Auf Projekt buchen
          </button>
        )}
      </div>
      
      <div className="action-buttons">
        <button className="btn-large btn-pause" onClick={async () => {
          if (activeTaskId) await stopTask();
          startPause();
        }}>
          <Pause size={24} /> Pause starten
        </button>
        
        <button className="btn-icon btn-stop" onClick={handleStop} title="Feierabend">
          <Square size={24} />
        </button>
      </div>
    </div>
  );
};
