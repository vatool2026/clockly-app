import React from 'react';
import { useTimerStore } from '../../stores/timerStore';
import { StageReady } from './stages/StageReady';
import { StageWorking } from './stages/StageWorking';
import { StagePaused } from './stages/StagePaused';
import { StagePostPause } from './stages/StagePostPause';
import { StageSummary } from './stages/StageSummary';
import { TimeCorrections } from './TimeCorrections';
import './Timer.css';

export const TimerDashboard = () => {
  const { stage } = useTimerStore();

  const renderStage = () => {
    switch (stage) {
      case 'ready':
        return <StageReady />;
      case 'working':
        return <StageWorking />;
      case 'paused':
        return <StagePaused />;
      case 'post-pause':
        return <StagePostPause />;
      case 'summary':
        return <StageSummary />;
      default:
        return <StageReady />;
    }
  };

  return (
    <div className="timer-dashboard-layout">
      {/* Dynamic Backgrounds based on stage */}
      <div className={`stage-bg bg-${stage}`}></div>
      
      <main className="dashboard-content">
        {renderStage()}
        {stage === 'ready' && <TimeCorrections />}
      </main>
    </div>
  );
};
