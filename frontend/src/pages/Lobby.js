import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getContest } from '../utils/api';
import { getSocket } from '../utils/socket';
import './Lobby.css';

function ParticipantRow({ participant, host, currentUser }) {
  return (
    <div className="participant-item">
      <div className="participant-avatar">
        {participant.username.charAt(0).toUpperCase()}
      </div>
      <span className="participant-name">{participant.username}</span>
      {participant.username === host && <span className="host-badge">HOST</span>}
      {participant.username === currentUser && <span className="you-badge">YOU</span>}
    </div>
  );
}

export default function Lobby() {
  const { contestId } = useParams();
  const navigate = useNavigate();
  const username = localStorage.getItem('username');

  const [contest, setContest] = useState(null);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!username) { navigate('/'); return; }

    fetchContest();

    const socket = getSocket();
    socket.emit('join_room', { contestId, username });

    socket.off('user_joined');
    socket.off('start_contest');
    socket.on('user_joined', fetchContest);
    socket.on('start_contest', () => navigate(`/contest/${contestId}`));

    return () => {
      socket.off('user_joined', fetchContest);
      socket.off('start_contest');
    };
  }, [contestId]);

  const fetchContest = async () => {
    try {
      const res = await getContest(contestId);
      setContest(res.data);
    } catch {
      setError('Contest not found');
    }
  };

  const handleStart = () => {
    setStarting(true);
    getSocket().emit('start_contest', { contestId, username });
    setTimeout(() => setStarting(false), 3000);
  };

  const copyToClipboard = (text, message) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    } else {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    alert(message);
  };

  const copyContestId = () => {
    copyToClipboard(contest.contestId, 'Contest ID copied!');
  };

  const copyJoinLink = () => {
    const joinLink = `${window.location.protocol}//${window.location.hostname}:${window.location.port || (window.location.protocol === 'https:' ? 443 : 80)}`;
    copyToClipboard(joinLink, 'Join link copied!');
  };

  if (error) return (
    <div className="lobby-error">
      <p>{error}</p>
      <button className="btn-primary" onClick={() => navigate('/')}>Go Home</button>
    </div>
  );

  if (!contest) return (
    <div className="lobby-loading">
      <div className="loader" />
      <p>Loading contest...</p>
    </div>
  );

  const isHost = contest.host === username;

  return (
    <div className="lobby-page">
      <div className="lobby-container fade-in">

        <div className="lobby-header">
          <div className="lobby-badge mono">WAITING ROOM</div>
          <h1>{contest.name}</h1>
          <div className="lobby-meta">
            <span className="meta-item">Host: <strong>{contest.host}</strong></span>
            <span className="meta-item">Topic: <strong>{contest.topic}</strong></span>
            <span className={`tag tag-${contest.difficulty.toLowerCase()}`}>{contest.difficulty}</span>
          </div>
        </div>

        <div className="lobby-details">
          <div className="detail-card">
            <span className="detail-icon">⏱</span>
            <span className="detail-label">Duration</span>
            <span className="detail-value">{contest.duration} min</span>
          </div>
          <div className="detail-card">
            <span className="detail-icon">📋</span>
            <span className="detail-label">Questions</span>
            <span className="detail-value">{contest.numQuestions}</span>
          </div>
          <div className="detail-card">
            <span className="detail-icon">👥</span>
            <span className="detail-label">Players</span>
            <span className="detail-value">{contest.participants.length} / {contest.maxPlayers}</span>
          </div>
        </div>

        <div className="lobby-id-box">
          <p className="lobby-id-label">🔗 Share this Link with Others</p>
          <p>{window.location.href}</p>
          <button className="copy-btn" onClick={copyJoinLink}>📋 Copy Link</button>
        </div>
        
        <div className="lobby-id-box">
          <p className="lobby-id-label">📌 Or Share this Contest ID</p>
          <p className="lobby-id mono">{contest.contestId}</p>
          <button className="copy-btn" onClick={copyContestId}>📋 Copy ID</button>
        </div>

        <div className="participants-section">
          <h3>Participants ({contest.participants.length})</h3>
          <div className="participants-list">
            {contest.participants.map((p, i) => (
              <ParticipantRow key={i} participant={p} host={contest.host} currentUser={username} />
            ))}
          </div>
        </div>

        {isHost ? (
          <div className="start-section">
            <p className="start-hint">You are the host. Start when everyone is ready.</p>
            <button className="btn-primary start-btn" onClick={handleStart} disabled={starting}>
              {starting ? 'Starting...' : 'Start Contest'}
            </button>
          </div>
        ) : (
          <div className="waiting-section">
            <div className="waiting-dots">
              <span /><span /><span />
            </div>
            <p>Waiting for host to start the contest...</p>
          </div>
        )}

      </div>
    </div>
  );
}