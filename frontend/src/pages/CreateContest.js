import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createContest } from '../utils/api';
import './FormPages.css';

export default function CreateContest() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const TOPICS = [
    'Arrays (1D, 2D/Matrices)',
    'Strings',
    'Hashing (HashMaps & HashSets)',
    'Two Pointers',
    'Sliding Window',
    'Recursion',
    'Linked Lists (Singly, Doubly, Circular)',
    'Stacks & Queues',
    'Trees (Binary Trees, BST)',
    'Greedy Algorithms',
    'Backtracking',
    'Dynamic Programming (1D, 2D, Grids, DP on Trees)',
    'Graphs (BFS, DFS, Shortest Path, MST)'
  ];

  const [form, setForm] = useState({
    username: '',
    name: '',
    topic: 'Arrays (1D, 2D/Matrices)',
    difficulty: 'Easy',
    numQuestions: 3,
    maxPlayers: 10,
    duration: 60,
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await createContest(form);
      const { contestId } = res.data;
      localStorage.setItem('username', form.username);
      localStorage.setItem('contestId', contestId);
      navigate(`/lobby/${contestId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create contest');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <div className="form-container fade-in">

        <div className="form-header">
          <button className="back-btn" onClick={() => navigate('/')}>← Back</button>
          <h1>Create Contest</h1>
          <p>Set up your private coding arena</p>
        </div>

        {error && <div className="error-box">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Your Username</label>
            <input className="input-field" type="text" name="username"
              placeholder="e.g. coder123" value={form.username}
              onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Contest Name</label>
            <input className="input-field" type="text" name="name"
              placeholder="e.g. Sunday Showdown" value={form.name}
              onChange={handleChange} required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Topic</label>
              <select className="input-field" name="topic" value={form.topic} onChange={handleChange}>
                {TOPICS.map((topic) => (
                  <option key={topic} value={topic}>{topic}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Difficulty</label>
              <select className="input-field" name="difficulty" value={form.difficulty} onChange={handleChange}>
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Number of Questions</label>
              <input className="input-field" type="number" name="numQuestions"
                min="1" max="10" value={form.numQuestions}
                onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Max Players</label>
              <input className="input-field" type="number" name="maxPlayers"
                min="2" max="50" value={form.maxPlayers}
                onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label>Duration (minutes)</label>
            <input className="input-field" type="number" name="duration"
              min="10" max="180" value={form.duration}
              onChange={handleChange} required />
          </div>

          <button className="btn-primary submit-btn" type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Contest'}
          </button>
        </form>

      </div>
    </div>
  );
}