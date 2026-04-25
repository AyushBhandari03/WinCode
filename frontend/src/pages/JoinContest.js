import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { joinContest } from '../utils/api';
import './FormPages.css';

export default function JoinContest() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ username: '', contestId: '' });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await joinContest({
        username: form.username,
        contestId: form.contestId.toUpperCase(),
      });
      localStorage.setItem('username', form.username);
      localStorage.setItem('contestId', res.data.contestId);
      navigate(`/lobby/${res.data.contestId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join contest');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <div className="form-container fade-in">

        <div className="form-header">
          <button className="back-btn" onClick={() => navigate('/')}>← Back</button>
          <h1>Join Contest</h1>
          <p>Enter your details to join an existing contest</p>
        </div>

        {error && <div className="error-box">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Your Username</label>
            <input className="input-field" type="text" name="username"
              placeholder="e.g. coder456" value={form.username}
              onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Contest ID</label>
            <input
              className="input-field"
              type="text"
              name="contestId"
              placeholder="e.g. AB12CD34"
              value={form.contestId}
              onChange={handleChange}
              required
              style={{ textTransform: 'uppercase', letterSpacing: '3px', fontFamily: 'var(--font-mono)' }}
            />
          </div>

          <button className="btn-primary submit-btn" type="submit" disabled={loading}>
            {loading ? 'Joining...' : 'Join Contest'}
          </button>
        </form>

      </div>
    </div>
  );
}