import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing">
      <div className="landing-content fade-in">
        <div className="landing-badge mono">COMPETITIVE CODING ARENA</div>
        <h1 className="landing-title">
          Win<span className="accent">CODE</span>
        </h1>
        <p className="landing-subtitle">
          Create private contests. Compete live.<br />Rise on the leaderboard.
        </p>
        <div className="landing-actions">
          <button className="btn-primary landing-btn" onClick={() => navigate('/create')}>
            Create Contest
          </button>
          <button className="btn-secondary landing-btn" onClick={() => navigate('/join')}>
            Join Contest
          </button>
        </div>
        <div className="landing-stats">
          <div className="stat">
            <span className="stat-num accent">Real-Time</span>
            <span className="stat-label">Leaderboard</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-num accent">Live</span>
            <span className="stat-label">Chat</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-num accent">System Compiler</span>
            <span className="stat-label">Code Execution</span>
          </div>
        </div>
      </div>
    </div>
  );
}