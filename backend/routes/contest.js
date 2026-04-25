const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { Contest, Problem } = require('../models');
const { syncProblemsToDatabase, getProblemsForContestFromDb } = require('../middleware/problems');

let problemsSynced = false;

async function ensureProblemsSynced() {
  if (problemsSynced) return;
  await syncProblemsToDatabase(Problem);
  problemsSynced = true;
}

// POST /api/contest/create
router.post('/create', async (req, res) => {
  try {
    await ensureProblemsSynced();

    const { username, name, topic, difficulty, numQuestions, maxPlayers, duration } = req.body;
    if (!username || !name || !topic || !difficulty || !numQuestions || !maxPlayers || !duration) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const contestId = uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase();

    const requestedQuestions = parseInt(numQuestions, 10);
    const selectedProblems = await getProblemsForContestFromDb(Problem, topic, difficulty, requestedQuestions);

    if (selectedProblems.length < requestedQuestions) {
      return res.status(400).json({
        error: `Not enough problems available for ${topic} / ${difficulty}. Requested ${requestedQuestions}, found ${selectedProblems.length}.`
      });
    }

    const problemIds = selectedProblems.map(p => p._id);

    const contest = new Contest({
      contestId,
      name,
      host: username,
      topic,
      difficulty,
      maxPlayers: parseInt(maxPlayers),
      duration: parseInt(duration),
      numQuestions: requestedQuestions,
      participants: [{ username, score: 0, problemsSolved: 0, totalTime: 0 }],
      problems: problemIds,
      status: 'waiting'
    });

    await contest.save();
    res.json({ contestId, message: 'Contest created successfully' });
  } catch (err) {
    console.error('Create contest error:', err);
    res.status(500).json({ error: 'Failed to create contest' });
  }
});

// POST /api/contest/join
router.post('/join', async (req, res) => {
  try {
    const { username, contestId } = req.body;
    if (!username || !contestId) {
      return res.status(400).json({ error: 'Username and Contest ID are required' });
    }

    const contest = await Contest.findOne({ contestId: contestId.toUpperCase() });
    if (!contest) return res.status(404).json({ error: 'Contest not found. Check the Contest ID.' });
    if (contest.status === 'ended') return res.status(400).json({ error: 'Contest has already ended.' });
    if (contest.status === 'active') return res.status(400).json({ error: 'Contest has already started. You cannot join now.' });
    if (contest.participants.length >= contest.maxPlayers) return res.status(400).json({ error: 'Contest is full.' });

    const alreadyJoined = contest.participants.find(p => p.username === username);
    if (alreadyJoined) {
      return res.status(400).json({ error: 'Username already taken in this contest. Please use a different username.' });
    }
    contest.participants.push({ username, score: 0, problemsSolved: 0, totalTime: 0 });
    await contest.save();

    res.json({ contestId: contest.contestId, message: 'Joined successfully' });
  } catch (err) {
    console.error('Join contest error:', err);
    res.status(500).json({ error: 'Failed to join contest' });
  }
});

// GET /api/contest/:contestId
router.get('/:contestId', async (req, res) => {
  try {
    const contest = await Contest.findOne({ contestId: req.params.contestId.toUpperCase() })
      .populate('problems');
    if (!contest) return res.status(404).json({ error: 'Contest not found' });
    res.json(contest);
  } catch (err) {
    console.error('Get contest error:', err);
    res.status(500).json({ error: 'Failed to fetch contest' });
  }
});

module.exports = router;