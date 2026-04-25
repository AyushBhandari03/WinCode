require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const contestRoutes = require('./routes/contest');
const submissionRoutes = require('./routes/submission');
const { Contest, Problem } = require('./models');
const { syncProblemsToDatabase } = require('./middleware/problems');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});
submissionRoutes.setIO(io);

app.use(cors());
app.use(express.json());

app.use('/api/contest', contestRoutes);
app.use('/api/submit', submissionRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

const contestTimers = {};

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('join_room', ({ contestId, username }) => {
    socket.join(contestId);
    socket.data.username = username;
    socket.data.contestId = contestId;
    console.log(`${username} joined room ${contestId}`);
    io.to(contestId).emit('user_joined', { username, message: `${username} joined the contest` });
  });

  socket.on('start_contest', async ({ contestId, username }) => {
    try {
      const contest = await Contest.findOne({ contestId }).populate('problems');
      if (!contest) return socket.emit('error', { message: 'Contest not found' });
      if (contest.host !== username) return socket.emit('error', { message: 'Only the host can start the contest' });
      if (contest.status !== 'waiting') return socket.emit('error', { message: 'Contest already started' });
      if (contest.participants.length < 2) return socket.emit('error', { message: 'Need at least 2 players to start the contest.' });

      contest.status = 'active';
      contest.startTime = new Date();
      contest.endTime = new Date(Date.now() + contest.duration * 60 * 1000);
      await contest.save();

      io.to(contestId).emit('start_contest', {
        startTime: contest.startTime,
        endTime: contest.endTime,
        problems: contest.problems,
        duration: contest.duration
      });

      const timeoutMs = contest.duration * 60 * 1000;
      if (contestTimers[contestId]) clearTimeout(contestTimers[contestId]);
      contestTimers[contestId] = setTimeout(async () => {
        try {
          const fresh = await Contest.findOne({ contestId });
          if (fresh && fresh.status === 'ended') {
            // already ended elsewhere
            if (contestTimers[contestId]) { delete contestTimers[contestId]; }
            return;
          }
          await Contest.findOneAndUpdate({ contestId }, { status: 'ended' });
          const finalContest = await Contest.findOne({ contestId });
          const leaderboard = (finalContest?.participants || [])
            .map(p => ({ username: p.username, score: p.score || 0, problemsSolved: p.problemsSolved, totalTime: p.totalTime, finished: p.finished || false }))
            .sort((a, b) => b.problemsSolved - a.problemsSolved || a.totalTime - b.totalTime);
          io.to(contestId).emit('contest_end', { leaderboard, message: 'Contest has ended!' });
          if (contestTimers[contestId]) { delete contestTimers[contestId]; }
        } catch (e) { console.error('Timer end error:', e); }
      }, timeoutMs);

    } catch (err) {
      console.error('Start contest error:', err);
      socket.emit('error', { message: 'Failed to start contest' });
    }
  });

  socket.on('end_contest_early', async ({ contestId, username }) => {
    try {
      const contest = await Contest.findOne({ contestId });
      if (!contest) return;
      if (contest.status !== 'active') return;

      await Contest.findOneAndUpdate({ contestId }, { status: 'ended' });

      if (contestTimers[contestId]) {
        clearTimeout(contestTimers[contestId]);
        delete contestTimers[contestId];
      }

      const finalContest = await Contest.findOne({ contestId });
      const leaderboard = (finalContest?.participants || [])
        .map(p => ({ username: p.username, score: p.score || 0, problemsSolved: p.problemsSolved, totalTime: p.totalTime, finished: p.finished || false }))
        .sort((a, b) => b.problemsSolved - a.problemsSolved || a.totalTime - b.totalTime);

      io.to(contestId).emit('contest_end', {
        leaderboard,
        message: `Contest ended early by ${username}`
      });
    } catch (err) {
      console.error('End contest early error:', err);
    }
  });

  // Per-user finish: mark participant finished and send personal leaderboard
  socket.on('user_finish', async ({ contestId, username }) => {
    try {
      const contest = await Contest.findOne({ contestId });
      if (!contest) return;

      const timeTaken = contest.startTime ? Math.floor((Date.now() - contest.startTime.getTime()) / 1000) : 0;

      const participant = contest.participants.find(p => p.username === username);
      if (participant && !participant.finished) {
        participant.finished = true;
        participant.finishTime = timeTaken;
        await contest.save();
      }

      const snapshot = (contest.participants || [])
        .map(p => ({ username: p.username, score: p.score || 0, problemsSolved: p.problemsSolved, totalTime: p.totalTime, finished: p.finished || false }))
        .sort((a, b) => b.score - a.score || a.totalTime - b.totalTime);

      // Send only to this socket
      socket.emit('personal_end', { leaderboard: snapshot, message: 'You have ended your contest. Other contestants are still participating.' });

      // If everyone finished, end contest for all
      const refreshed = await Contest.findOne({ contestId });
      const allFinished = refreshed.participants.every(p => p.finished || p.problemsSolved >= (refreshed.problems?.length || 0));
      if (allFinished) {
        refreshed.status = 'ended';
        await refreshed.save();
        io.to(contestId).emit('contest_end', { leaderboard: snapshot, message: 'Contest ended — all participants finished.' });
        if (contestTimers[contestId]) { clearTimeout(contestTimers[contestId]); delete contestTimers[contestId]; }
      }
    } catch (err) {
      console.error('user_finish error:', err);
    }
  });

  socket.on('new_message', ({ contestId, username, message }) => {
    const timestamp = new Date().toISOString();
    io.to(contestId).emit('new_message', { username, message, timestamp });
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wincode';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected');
    const syncStats = await syncProblemsToDatabase(Problem);
    console.log(`Problems synced: ${syncStats.totalUpserted}`);
    server.listen(PORT, HOST, () => console.log(`WinCODE server running on ${HOST}:${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });

module.exports = { app, io };