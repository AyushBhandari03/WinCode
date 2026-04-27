import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getContest, checkCode, submitCode } from '../utils/api';
import { getSocket, disconnectSocket } from '../utils/socket';
import './ContestRoom.css';

export default function ContestRoom() {
  const { contestId } = useParams();
  const navigate = useNavigate();
  const username = localStorage.getItem('username');

  const [contest, setContest] = useState(null);
  const [problems, setProblems] = useState([]);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [codeMap, setCodeMap] = useState({});
  const [languageMap, setLanguageMap] = useState({});
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkResults, setCheckResults] = useState(null);
  const [submitResults, setSubmitResults] = useState(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(null);
  const [contestEnded, setContestEnded] = useState(false);
  const [personalEnd, setPersonalEnd] = useState(false);
  const [solvedProblems, setSolvedProblems] = useState([]);

  const chatEndRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!username) {
      navigate('/');
      return;
    }

    const storedContestId = localStorage.getItem('contestId');
    if (!storedContestId || storedContestId !== contestId) {
      navigate('/');
      return;
    }

    fetchContest();
    const socket = getSocket();
    socket.emit('join_room', { contestId, username });

    const onStartContest = (data) => {
      console.log('🚀 Contest started, problems received:', data.problems);
      if (data.problems && Array.isArray(data.problems) && data.problems.length > 0) {
        setProblems(data.problems);
        setSelectedProblem(data.problems[0]);
        console.log('✅ Problems set successfully:', data.problems.length, 'problems');
      } else {
        console.warn('⚠️ No problems in start_contest event, fetching from API...');
        // Fallback: fetch contest data which will have problems
        fetchContest();
      }
      startTimer(new Date(data.endTime));
    };
    const onLeaderboardUpdate = (data) => {
      setLeaderboard(data.leaderboard);
    };
    const onPersonalEnd = (data) => {
      setLeaderboard(data.leaderboard);
      setContestEnded(true);
      setPersonalEnd(true);
      if (timerRef.current) clearInterval(timerRef.current);
    };
    const onNewMessage = (data) => {
      setMessages(prev => [...prev, data]);
    };
    const onContestEnd = (data) => {
      setContestEnded(true);
      setLeaderboard(data.leaderboard);
      if (timerRef.current) clearInterval(timerRef.current);
    };

    socket.off('start_contest');
    socket.off('leaderboard_update');
    socket.off('new_message');
    socket.off('contest_end');

    socket.on('start_contest', onStartContest);
    socket.on('leaderboard_update', onLeaderboardUpdate);
    socket.on('new_message', onNewMessage);
    socket.on('contest_end', onContestEnd);
    socket.on('personal_end', onPersonalEnd);

    return () => {
      socket.off('start_contest', onStartContest);
      socket.off('leaderboard_update', onLeaderboardUpdate);
      socket.off('new_message', onNewMessage);
      socket.off('contest_end', onContestEnd);
      socket.off('personal_end', onPersonalEnd);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [contestId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchContest = async () => {
    try {
      const res = await getContest(contestId);
      const c = res.data;
      setContest(c);
      
      // Set problems if available
      if (c.problems && Array.isArray(c.problems) && c.problems.length > 0) {
        console.log('📥 Problems fetched from API:', c.problems.length, 'problems');
        setProblems(c.problems);
        if (c.problems.length > 0) setSelectedProblem(c.problems[0]);
      } else {
        console.warn('⚠️ No problems in API response:', c.problems);
      }
      
      setLeaderboard(
        c.participants
          .map(p => ({ username: p.username, problemsSolved: p.problemsSolved, totalTime: p.totalTime }))
          .sort((a, b) => b.problemsSolved - a.problemsSolved || a.totalTime - b.totalTime)
      );
      
      if (c.status === 'active' && c.endTime) {
        startTimer(new Date(c.endTime));
      }
      if (c.status === 'ended') {
        setContestEnded(true);
      }
    } catch (err) {
      console.error('❌ Failed to fetch contest', err);
    }
  };

  const startTimer = (endTime) => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const diff = Math.floor((endTime - Date.now()) / 1000);
      if (diff <= 0) {
        setTimeLeft(0);
        clearInterval(timerRef.current);
      } else {
        setTimeLeft(diff);
      }
    }, 1000);
  };

  const formatTime = (seconds) => {
    if (seconds === null) return '--:--';
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleCheck = async () => {
    const currentCode = codeMap[selectedProblem?._id] || '';
    if (!currentCode.trim()) return;
    setChecking(true);
    setCheckResults(null);
    setShowResultsModal(true);
    try {
      const currentLang = languageMap[selectedProblem?._id] || 'cpp';
      const res = await checkCode({
        username,
        contestId,
        problemId: selectedProblem._id,
        code: currentCode,
        language: currentLang
      });
      setCheckResults(res.data);
    } catch (err) {
      setCheckResults({
        error: err.response?.data?.error || 'Check failed',
        details: err.response?.data?.details || ''
      });
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async () => {
    const currentCode = codeMap[selectedProblem?._id] || '';
    if (!currentCode.trim()) return;
    setSubmitting(true);
    setSubmitResults(null);
    setShowResultsModal(true);
    try {
      const currentLang = languageMap[selectedProblem?._id] || 'cpp';
      const res = await submitCode({
        username,
        contestId,
        problemId: selectedProblem._id,
        code: currentCode,
        language: currentLang
      });
      setSubmitResults(res.data);
      if (res.data.allPassed) {
        setSolvedProblems(prev => [...prev, selectedProblem._id]);
      }
      const socket = getSocket();
      socket.emit('submission_update', {
        contestId,
        leaderboard: res.data.leaderboard
      });
      setLeaderboard(res.data.leaderboard);
    } catch (err) {
      setSubmitResults({
        error: err.response?.data?.error || 'Submission failed',
        details: err.response?.data?.details || ''
      });
    } finally {
      setSubmitting(false);
    }
  };

  const closeResultsModal = () => {
    setShowResultsModal(false);
    setCheckResults(null);
    setSubmitResults(null);
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const socket = getSocket();
    socket.emit('new_message', { contestId, username, message: chatInput });
    setChatInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSendMessage();
  };

  const formatChatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleCodeChange = (problemId, newCode) => {
    setCodeMap(prev => ({ ...prev, [problemId]: newCode }));
  };

  const handleLanguageChange = (problemId, newLang) => {
    setLanguageMap(prev => ({ ...prev, [problemId]: newLang }));
    if (!codeMap[problemId]) {
      setCodeMap(prev => ({ ...prev, [problemId]: getDefaultCode(newLang) }));
    }
  };

  const getCurrentCode = (problemId) => {
    return codeMap[problemId] !== undefined ? codeMap[problemId] : getDefaultCode(languageMap[problemId] || 'cpp');
  };

  const getCurrentLanguage = (problemId) => {
    return languageMap[problemId] || 'cpp';
  };

  const handleTabKey = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.target;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newCode = getCurrentCode(selectedProblem._id).substring(0, start) + '  ' + getCurrentCode(selectedProblem._id).substring(end);
      handleCodeChange(selectedProblem._id, newCode);
      setTimeout(() => {
        textarea.selectionStart = start + 2;
        textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  const getDefaultCode = (lang) => {
    const templates = {
      cpp: `#include<bits/stdc++.h>\nusing namespace std;\nint main(){\n    // your code here\n    return 0;\n}`,
      c: `#include<stdio.h>\nint main(){\n    // your code here\n    return 0;\n}`,
      java: `import java.util.*;\npublic class Main{\n    public static void main(String[] args){\n        // your code here\n    }\n}`,
      python: `# your code here`,
      javascript: `// your code here\nconst lines = require('fs').readFileSync('/dev/stdin','utf8').split('\\n');`
    };
    return templates[lang] || '';
  };

  if (!contest) return (
    <div className="room-loading">
      <div className="loader"></div>
      <p>Loading contest room...</p>
    </div>
  );

  const handleEndContest = () => {
    if (window.confirm('End contest for you? You will see the leaderboard but the contest will continue for others.')) {
      const socket = getSocket();
      socket.emit('user_finish', { contestId, username });
    }
  };
  const allSolved = problems.length > 0 && solvedProblems.length >= problems.length;

  if (contestEnded) return (
    <div className="contest-ended">
      <div className="ended-container fade-in">
        <div className="ended-badge mono">{ personalEnd ? 'YOU FINISHED' : 'CONTEST ENDED' }</div>
        <h1>{ personalEnd ? 'Your Leaderboard (Contest continues for others)' : 'Final Leaderboard' }</h1>
        <div className="final-leaderboard">
          {leaderboard.map((p, i) => (
            <div key={i} className={`final-row ${i === 0 ? 'first' : ''} ${p.username === username ? 'you' : ''}`}>
              <span className="final-rank">#{i + 1}</span>
              <span className="final-name">{p.username}</span>
              <span className="final-solved">{p.problemsSolved} solved</span>
              <span className="final-time">{Math.floor(p.totalTime / 60)}m {p.totalTime % 60}s</span>
              {personalEnd && !p.finished && <span className="still-giving"> — other contestant still giving</span>}
            </div>
          ))}
        </div>
        <button className="btn-primary" onClick={() => { disconnectSocket(); navigate('/'); }}>
          Back to Home
        </button>
      </div>
    </div>
  );

  return (
    <div className="contest-room">

      {/* TOP BAR */}
      <div className="room-topbar">
        <div className="room-title mono">WIN<span className="accent">CODE</span></div>
        <div className="room-contest-name">{contest.name}</div>
        <div className="topbar-right">
          {allSolved && (
            <div className="all-solved-badge">All Solved!</div>
          )}
          <div className={`room-timer mono ${timeLeft !== null && timeLeft < 300 ? 'timer-warning' : ''}`}>
            {formatTime(timeLeft)}
          </div>
          <button className="end-contest-btn" onClick={handleEndContest}>
            End Contest
          </button>
        </div>
      </div>

      <div className="room-body">

        {/* LEFT: Problem List */}
        <div className="room-left">
          <div className="panel-header">Problems</div>
          <div className="problem-list">
            {problems.map((p, i) => (
              <div
                key={p._id}
                className={`problem-item ${selectedProblem?._id === p._id ? 'active' : ''} ${solvedProblems.includes(p._id) ? 'solved' : ''}`}
                onClick={() => {
                  setSelectedProblem(p);
                  setCheckResults(null);
                  setSubmitResults(null);
                }}
              >
                <span className="problem-num">{i + 1}</span>
                <span className="problem-title">{p.title}</span>
                {solvedProblems.includes(p._id) && <span className="solved-check">✓</span>}
              </div>
            ))}
          </div>
        </div>

        {/* CENTER: Code Editor */}
        <div className="room-center">
          {selectedProblem && (
            <>
              <div className="problem-statement">
                <h2>{selectedProblem.title}</h2>
                <p className="problem-desc">{selectedProblem.description}</p>
                {selectedProblem.sampleInput && (
                  <div className="sample-io">
                    <div className="sample-block">
                      <div className="sample-label">Sample Input</div>
                      <pre className="sample-code mono">{selectedProblem.sampleInput}</pre>
                    </div>
                    <div className="sample-block">
                      <div className="sample-label">Sample Output</div>
                      <pre className="sample-code mono">{selectedProblem.sampleOutput}</pre>
                    </div>
                  </div>
                )}
                {selectedProblem.constraints && (
                  <div className="constraints">
                    <div className="sample-label">Constraints</div>
                    <pre className="mono">{selectedProblem.constraints}</pre>
                  </div>
                )}
              </div>

              <div className="editor-section">
                <div className="editor-toolbar">
                  <select
                    className="lang-select"
                    value={getCurrentLanguage(selectedProblem._id)}
                    onChange={(e) => handleLanguageChange(selectedProblem._id, e.target.value)}
                  >
                    <option value="cpp">C++</option>
                    <option value="c">C</option>
                    <option value="java">Java</option>
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                  </select>
                  <button className="clear-btn" onClick={() => handleCodeChange(selectedProblem._id, getDefaultCode(getCurrentLanguage(selectedProblem._id)))}>
                    Reset Template
                  </button>
                  <span className="problem-indicator mono">
                    Q{problems.indexOf(selectedProblem) + 1} — {selectedProblem.title}
                  </span>
                </div>

                <textarea
                  className="code-editor mono"
                  value={getCurrentCode(selectedProblem._id)}
                  onChange={(e) => handleCodeChange(selectedProblem._id, e.target.value)}
                  onKeyDown={handleTabKey}
                  placeholder={getDefaultCode(getCurrentLanguage(selectedProblem._id))}
                  spellCheck={false}
                />

                <div className="editor-bottom">
                  <div className="submission-buttons">
                    <button
                      className="btn-secondary check-btn"
                      onClick={handleCheck}
                      disabled={checking || submitting || contestEnded}
                      title="Check your code against visible test cases"
                    >
                      {checking ? 'Checking...' : '▶ Check'}
                    </button>
                    <button
                      className="btn-primary submit-code-btn"
                      onClick={handleSubmit}
                      disabled={submitting || checking || contestEnded}
                      title="Submit your code for final evaluation"
                    >
                      {submitting ? 'Submitting...' : '⬆ Submit'}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* RESULTS MODAL OVERLAY */}
        {showResultsModal && (
          <div className="modal-overlay" onClick={closeResultsModal}>
            <div className="results-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{checkResults ? 'Check Results' : 'Submission Results'}</h3>
                <button className="modal-close-btn" onClick={closeResultsModal} title="Close (ESC)">
                  ✕
                </button>
              </div>

              <div className="modal-content">
                {(checkResults || submitResults) && !(checkResults?.error || submitResults?.error) && (
                  <>
                    <div className="results-summary">
                        <div className={`verdict-badge ${(checkResults?.allPassed || submitResults?.allPassed) ? 'passed' : 'failed'}`}>
                          {(checkResults?.allPassed || submitResults?.allPassed) ? '✓ PASSED' : '✗ FAILED'}
                      </div>
                      <div className="stats">
                        <span className="stat-item">
                          {checkResults?.passedCount || submitResults?.passedCount}/
                          {checkResults?.totalTestCases || submitResults?.totalTestCases} Tests Passed
                        </span>
                        <span className="stat-item">
                          {checkResults?.executionTime || submitResults?.executionTime}ms
                        </span>
                      </div>
                    </div>

                    {(checkResults?.testResults || submitResults?.testResults) && (
                      <div className="test-results-section">
                        <h4>Test Cases</h4>
                        <div className="test-cases-list">
                          {(checkResults?.testResults || submitResults?.testResults)?.map((test) => (
                            <div key={test.testCaseNumber} className={`test-case-row ${test.passed ? 'passed' : 'failed'}`}>
                              <span className="test-status-icon">{test.passed ? '✓' : '✗'}</span>
                              <span className="test-case-num">Test {test.testCaseNumber}</span>
                              <span className="test-case-time">{test.executionTime}ms</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(checkResults?.firstFailure || submitResults?.firstFailure) && (
                      <div className="failure-section">
                        <h4>
                          First Failure - Test {checkResults?.firstFailure?.testCaseNumber || submitResults?.firstFailure?.testCaseNumber}
                        </h4>
                        <div className="failure-box">
                          {(checkResults?.firstFailure?.hidden || submitResults?.firstFailure?.hidden) && (
                            <div className="error-detail">
                              <strong className="error-label">Hidden Test Case:</strong>
                              <pre className="error-content">{checkResults?.firstFailure?.message || submitResults?.firstFailure?.message || 'Failed on hidden test case.'}</pre>
                            </div>
                          )}
                          {(checkResults?.firstFailure?.compilationError || submitResults?.firstFailure?.compilationError) && (
                            <div className="error-detail">
                              <strong className="error-label">❌ Compilation Error:</strong>
                              <pre className="error-content">{checkResults?.firstFailure?.compilationError || submitResults?.firstFailure?.compilationError}</pre>
                            </div>
                          )}
                          {(checkResults?.firstFailure?.stderr || submitResults?.firstFailure?.stderr) && (
                            <div className="error-detail">
                              <strong className="error-label">❌ Runtime Error:</strong>
                              <pre className="error-content">{checkResults?.firstFailure?.stderr || submitResults?.firstFailure?.stderr}</pre>
                            </div>
                          )}
                          {!(checkResults?.firstFailure?.hidden || submitResults?.firstFailure?.hidden) &&
                            !(checkResults?.firstFailure?.compilationError || submitResults?.firstFailure?.compilationError) &&
                            !(checkResults?.firstFailure?.stderr || submitResults?.firstFailure?.stderr) && (
                            <>
                              <div className="io-section">
                                <strong className="io-label">📥 Input:</strong>
                                <pre className="io-content">{checkResults?.firstFailure?.input || submitResults?.firstFailure?.input}</pre>
                              </div>
                              <div className="io-section">
                                <strong className="io-label expected-label">✓ Expected Output:</strong>
                                <pre className="io-content expected-output">{checkResults?.firstFailure?.expectedOutput || submitResults?.firstFailure?.expectedOutput}</pre>
                              </div>
                              <div className="io-section">
                                <strong className="io-label actual-label">✗ Your Output:</strong>
                                <pre className="io-content actual-output">{checkResults?.firstFailure?.actualOutput || submitResults?.firstFailure?.actualOutput || '(no output)'}</pre>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {(checkResults?.allPassed || submitResults?.allPassed) && (
                      <div className="success-section">
                        <div className="success-message">
                          🎉 All tests passed! Great job!
                        </div>
                      </div>
                    )}
                  </>
                )}

                {(checkResults?.error || submitResults?.error) && (
                  <div className="error-message-box">
                    <strong>⚠️ Error</strong>
                    <p>{checkResults?.error || submitResults?.error}</p>
                    {(checkResults?.details || submitResults?.details) && (
                      <pre>{checkResults?.details || submitResults?.details}</pre>
                    )}
                  </div>
                )}

                {checking || submitting ? (
                  <div className="loading-state">
                    <div className="spinner"></div>
                    <p>{checking ? 'Checking your code...' : 'Submitting your code...'}</p>
                  </div>
                ) : null}
              </div>

              <div className="modal-footer">
                <button className="btn-close" onClick={closeResultsModal}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* RIGHT: Leaderboard + Chat */}
        <div className="room-right">

          {/* Leaderboard */}
          <div className="leaderboard-panel">
            <div className="panel-header">Leaderboard</div>
            <div className="leaderboard-list">
              {leaderboard.map((p, i) => (
                <div key={i} className={`lb-row ${p.username === username ? 'lb-you' : ''}`}>
                  <span className="lb-rank">#{i + 1}</span>
                  <span className="lb-name">{p.username}</span>
                  <span className="lb-solved">{p.problemsSolved}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div className="chat-panel">
            <div className="panel-header">Live Chat</div>
            <div className="chat-messages">
              {messages.map((m, i) => (
                <div key={i} className={`chat-msg ${m.username === username ? 'chat-mine' : ''}`}>
                  <span className="chat-user">{m.username}</span>
                  <span className="chat-text">{m.message}</span>
                  <span className="chat-time mono">{formatChatTime(m.timestamp)}</span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="chat-input-row">
              <input
                className="chat-input"
                type="text"
                placeholder="Type a message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button className="chat-send-btn" onClick={handleSendMessage}>→</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}