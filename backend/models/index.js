const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
  input: { type: String, required: true },
  expectedOutput: { type: String, required: true }
});

const problemSchema = new mongoose.Schema({
  sourceKey: { type: String, unique: true, sparse: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  topic: { type: String, required: true },
  visibleTestCases: [testCaseSchema],
  hiddenTestCases: [testCaseSchema],
  testCases: [testCaseSchema],
  sampleInput: String,
  sampleOutput: String,
  constraints: String
}, { timestamps: true });

const participantSchema = new mongoose.Schema({
  username: { type: String, required: true },
  score: { type: Number, default: 0 },
  problemsSolved: { type: Number, default: 0 },
  totalTime: { type: Number, default: 0 },
  joinedAt: { type: Date, default: Date.now }
  ,finished: { type: Boolean, default: false },
  finishTime: { type: Number }
});

const contestSchema = new mongoose.Schema({
  contestId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  host: { type: String, required: true },
  topic: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  maxPlayers: { type: Number, required: true, min: 2, max: 50 },
  duration: { type: Number, required: true },
  numQuestions: { type: Number, required: true, min: 1, max: 10 },
  participants: [participantSchema],
  problems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Problem' }],
  status: { type: String, enum: ['waiting', 'active', 'ended'], default: 'waiting' },
  startTime: { type: Date },
  endTime: { type: Date }
}, { timestamps: true });

const submissionSchema = new mongoose.Schema({
  username: { type: String, required: true },
  contestId: { type: String, required: true },
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
  code: { type: String, required: true },
  language: { type: String, required: true },
  verdict: { type: String, enum: ['Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Runtime Error', 'Compilation Error', 'Pending'], default: 'Pending' },
  executionTime: { type: Number },
  timeTaken: { type: Number },
  visibleTestsPassed: { type: Number, default: 0 },
  hiddenTestsPassed: { type: Number, default: 0 },
  questionScore: { type: Number, default: 0 },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Problem = mongoose.model('Problem', problemSchema);
const Contest = mongoose.model('Contest', contestSchema);
const Submission = mongoose.model('Submission', submissionSchema);

module.exports = { Problem, Contest, Submission };