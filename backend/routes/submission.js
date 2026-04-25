const express = require('express');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { Contest, Submission, Problem } = require('../models');

const router = express.Router();

// Store socket.io instance for real-time updates
let ioInstance = null;
const setIO = (io) => { ioInstance = io; };

const LANGUAGE_CONFIG = {
  c: {
    fileName: 'main.c',
    compile: { cmd: 'gcc', args: ['main.c', '-O2', '-std=c11', '-o', 'main.exe'] },
    run: { cmd: 'main.exe', args: [] }
  },
  cpp: {
    fileName: 'main.cpp',
    compile: { cmd: 'g++', args: ['main.cpp', '-O2', '-std=c++17', '-o', 'main.exe'] },
    run: { cmd: 'main.exe', args: [] }
  },
  'c++': {
    fileName: 'main.cpp',
    compile: { cmd: 'g++', args: ['main.cpp', '-O2', '-std=c++17', '-o', 'main.exe'] },
    run: { cmd: 'main.exe', args: [] }
  },
  java: {
    fileName: 'Main.java',
    compile: { cmd: 'javac', args: ['Main.java'] },
    run: { cmd: 'java', args: ['Main'] }
  },
  python: {
    fileName: 'main.py',
    run: { cmd: 'python', args: ['main.py'], fallback: { cmd: 'py', args: ['-3', 'main.py'] } }
  },
  py: {
    fileName: 'main.py',
    run: { cmd: 'python', args: ['main.py'], fallback: { cmd: 'py', args: ['-3', 'main.py'] } }
  },
  python3: {
    fileName: 'main.py',
    run: { cmd: 'python', args: ['main.py'], fallback: { cmd: 'py', args: ['-3', 'main.py'] } }
  },
  javascript: {
    fileName: 'main.js',
    run: { cmd: 'node', args: ['main.js'] }
  },
  js: {
    fileName: 'main.js',
    run: { cmd: 'node', args: ['main.js'] }
  }
};

function runProcess(cmd, args, options = {}) {
  const {
    cwd,
    input = '',
    timeoutMs = 10000
  } = options;

  return new Promise((resolve) => {
    const start = Date.now();
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let settled = false;

    const child = spawn(cmd, args, { cwd, windowsHide: true });

    const finish = (payload) => {
      if (settled) return;
      settled = true;
      resolve({
        stdout,
        stderr,
        durationMs: Date.now() - start,
        timedOut,
        ...payload
      });
    };

    const timer = setTimeout(() => {
      timedOut = true;
      try {
        child.kill();
      } catch (e) {
        // Ignore kill failures.
      }
      finish({ code: null, signal: 'SIGKILL' });
    }, timeoutMs);

    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });

    child.on('error', (err) => {
      clearTimeout(timer);
      stderr += err.message;
      finish({ code: -1, signal: null });
    });

    child.on('close', (code, signal) => {
      clearTimeout(timer);
      finish({ code, signal: signal || null });
    });

    if (input) {
      child.stdin.write(input);
    }
    child.stdin.end();
  });
}

async function runWithOptionalFallback(runConfig, cwd, input, timeoutMs) {
  const primary = await runProcess(runConfig.cmd, runConfig.args || [], { cwd, input, timeoutMs });
  if (primary.code !== -1 || !runConfig.fallback) {
    return primary;
  }
  return runProcess(runConfig.fallback.cmd, runConfig.fallback.args || [], { cwd, input, timeoutMs });
}

async function executeCode(code, language, input) {
  const normalizedLanguage = String(language || '').toLowerCase();
  const config = LANGUAGE_CONFIG[normalizedLanguage];

  if (!config) {
    return {
      verdict: 'Runtime Error',
      executionTime: 0,
      output: '',
      stderr: `Language '${language}' not supported. Available languages: c, cpp, java, python, javascript.`,
      compilationError: null
    };
  }

  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wincode-'));

  try {
    const sourcePath = path.join(workDir, config.fileName);
    fs.writeFileSync(sourcePath, code, 'utf8');

    if (config.compile) {
      const compileResult = await runProcess(config.compile.cmd, config.compile.args || [], {
        cwd: workDir,
        timeoutMs: 10000
      });

      if (compileResult.timedOut) {
        return {
          verdict: 'Compilation Error',
          executionTime: 0,
          output: '',
          stderr: 'Compilation timeout (10s)',
          compilationError: 'Compilation timeout (10s)'
        };
      }

      if (compileResult.code !== 0) {
        const compileErr = (compileResult.stderr || 'Compilation failed').trim();
        return {
          verdict: 'Compilation Error',
          executionTime: 0,
          output: '',
          stderr: compileErr,
          compilationError: compileErr
        };
      }
    }

    const runResult = await runWithOptionalFallback(config.run, workDir, input, 10000);

    const runtimeError = (runResult.stderr || '').trim();
    const executionTime = runResult.durationMs;

    if (runResult.timedOut || (runResult.signal || '').toUpperCase() === 'SIGKILL') {
      return {
        verdict: 'Time Limit Exceeded',
        executionTime: 10000,
        output: (runResult.stdout || '').trim(),
        stderr: runtimeError || 'Execution timeout (10s)',
        compilationError: null
      };
    }

    if (runResult.code !== 0) {
      return {
        verdict: 'Runtime Error',
        executionTime,
        output: (runResult.stdout || '').trim(),
        stderr: runtimeError || 'Execution failed',
        compilationError: null
      };
    }

    return {
      verdict: 'Accepted',
      executionTime,
      output: (runResult.stdout || '').trim(),
      stderr: '',
      compilationError: null
    };

  } catch (error) {
    console.error('Execution error:', error.message);
    return {
      verdict: 'Runtime Error',
      executionTime: 0,
      output: '',
      stderr: error.response?.data?.message || error.message || 'Code execution failed',
      compilationError: null
    };
  } finally {
    try {
      fs.rmSync(workDir, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors.
    }
  }
}

// ============================================
// FUNCTION 2: Test code against test cases
// ============================================
async function testCode(code, language, testCases) {
  const results = [];
  let totalTime = 0;
  let failedTestCase = null;

  for (let i = 0; i < testCases.length; i++) {
    const { input, expectedOutput } = testCases[i];
    const execResult = await executeCode(code, language, input);
    
    totalTime += execResult.executionTime;

    // Normalize output and compare
    const actual = execResult.output.trim().replace(/\s+/g, ' ');
    const expected = expectedOutput.trim().replace(/\s+/g, ' ');
    const passed = actual === expected && execResult.verdict === 'Accepted';

    const testResult = {
      testCaseNumber: i + 1,
      input,
      expectedOutput,
      actualOutput: execResult.output,
      executionTime: execResult.executionTime,
      verdict: execResult.verdict,
      compilationError: execResult.compilationError,
      stderr: execResult.stderr,
      passed
    };

    results.push(testResult);

    // Track first failure
    if (!passed && !failedTestCase) {
      failedTestCase = testResult;
    }
  }

  return {
    results,
    allPassed: results.every(r => r.passed),
    avgTime: Math.round(totalTime / testCases.length),
    failedTestCase
  };
}

function sanitizeSubmitTestResults(results, visibleCount) {
  return results.map((result, index) => {
    if (index < visibleCount) {
      return result;
    }
    return {
      testCaseNumber: result.testCaseNumber,
      executionTime: result.executionTime,
      verdict: result.verdict,
      passed: result.passed,
      hidden: true
    };
  });
}

function sanitizeSubmitFirstFailure(failedTestCase, visibleCount) {
  if (!failedTestCase) return null;
  if (failedTestCase.testCaseNumber <= visibleCount) {
    return failedTestCase;
  }
  return {
    testCaseNumber: failedTestCase.testCaseNumber,
    verdict: failedTestCase.verdict,
    passed: false,
    hidden: true,
    message: 'Failed on a hidden test case. Input/output details are hidden for evaluation integrity.'
  };
}


// ============================================
// ENDPOINT 1: Check code (visible test cases)
// ============================================
router.post('/check', async (req, res) => {
  try {
    const { username, contestId, problemId, code, language } = req.body;

    if (!username || !contestId || !problemId || !code || !language) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    // Get visible test cases (or fallback to old testCases field)
    const testCases = problem.visibleTestCases?.length > 0
      ? problem.visibleTestCases
      : problem.testCases || [];

    // Run tests
    const testResults = await testCode(code, language, testCases);

    res.json({
      type: 'check',
      allPassed: testResults.allPassed,
      totalTestCases: testResults.results.length,
      passedCount: testResults.results.filter(r => r.passed).length,
      executionTime: testResults.avgTime,
      testResults: testResults.results,
      firstFailure: testResults.failedTestCase || null
    });

  } catch (error) {
    console.error('Check error:', error);
    res.status(500).json({ error: 'Check failed', details: error.message });
  }
});

// ============================================
// ENDPOINT 2: Final submission (all test cases)
// ============================================
router.post('/submit', async (req, res) => {
  try {
    const { username, contestId, problemId, code, language } = req.body;

    if (!username || !contestId || !problemId || !code || !language) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find contest
    const contest = await Contest.findOne({ contestId }).populate('problems');
    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' });
    }
    if (contest.status !== 'active') {
      return res.status(400).json({ error: 'Contest is not active' });
    }

    // Find problem
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    // Calculate time taken
    const timeTaken = contest.startTime
      ? Math.floor((Date.now() - contest.startTime.getTime()) / 1000)
      : 0;

    // Get all test cases (visible + hidden)
    const visibleTestCases = problem.visibleTestCases?.length > 0
      ? problem.visibleTestCases
      : problem.testCases || [];
    const hiddenTestCases = problem.hiddenTestCases || [];
    const allTestCases = [...visibleTestCases, ...hiddenTestCases];

    // Run all tests
    const testResults = await testCode(code, language, allTestCases);
    const finalVerdict = testResults.allPassed ? 'Accepted' : 'Wrong Answer';

    // Calculate score based on test results
    let visiblePassed = 0;
    let hiddenPassed = 0;

    // Count passed visible tests
    for (let i = 0; i < visibleTestCases.length; i++) {
      if (testResults.results[i]?.passed) {
        visiblePassed++;
      }
    }

    // Count passed hidden tests
    for (let i = visibleTestCases.length; i < allTestCases.length; i++) {
      if (testResults.results[i]?.passed) {
        hiddenPassed++;
      }
    }

    // Score is based on total passed tests for the problem.
    const questionScore = visiblePassed + hiddenPassed;

    // Find if user has already submitted this problem before
    const previousSubmission = await Submission.findOne({
      username,
      contestId,
      problemId
    }).sort({ submittedAt: -1 });

    // Calculate previous score (if it exists)
    const previousScore = previousSubmission ? 
      (previousSubmission.visibleTestsPassed * 1) + (previousSubmission.hiddenTestsPassed * 2) : 0;

    // Keep only the latest submission for each user/problem.
    await Submission.findOneAndUpdate(
      { username, contestId, problemId },
      {
        username,
        contestId,
        problemId,
        code,
        language,
        verdict: finalVerdict,
        executionTime: testResults.avgTime,
        timeTaken,
        visibleTestsPassed: visiblePassed,
        hiddenTestsPassed: hiddenPassed,
        questionScore,
        submittedAt: new Date()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Update leaderboard: Replace previous score with new score
    const participant = contest.participants.find(p => p.username === username);
    if (participant) {
      // If this is the first submission for this problem
      if (!previousSubmission) {
        participant.problemsSolved += 1;
        participant.totalTime += timeTaken;
        participant.score = (participant.score || 0) + questionScore;
      } else {
        // If resubmitting: replace old score with new score
        const scoreDifference = questionScore - previousScore;
        participant.score = (participant.score || 0) + scoreDifference;
        participant.totalTime = (participant.totalTime - previousSubmission.timeTaken) + timeTaken;
      }
    }

    await contest.save();

    // Get updated leaderboard
    const updatedContest = await Contest.findOne({ contestId });
    const leaderboard = updatedContest.participants
      .map(p => ({
        username: p.username,
        score: p.score || 0,
        problemsSolved: p.problemsSolved,
        totalTime: p.totalTime,
        finished: p.finished || false
      }))
      .sort((a, b) => {
        // Primary: Higher score first
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        // Secondary: Lower time first (tie-breaker)
        return a.totalTime - b.totalTime;
      });

    // Check if all participants are finished or solved all problems
    const allDone = updatedContest.participants.every(
      p => p.problemsSolved >= (updatedContest.problems?.length || 0) || p.finished
    );

    if (allDone && ioInstance) {
      await Contest.findOneAndUpdate({ contestId }, { status: 'ended' });
      ioInstance.to(contestId).emit('contest_end', {
        leaderboard,
        message: `Contest ended! 🎉 Final scores - 1st: ${leaderboard[0]?.username} (${leaderboard[0]?.score} pts)`
      });
    }

    const sanitizedTestResults = sanitizeSubmitTestResults(testResults.results, visibleTestCases.length);
    const sanitizedFirstFailure = sanitizeSubmitFirstFailure(testResults.failedTestCase, visibleTestCases.length);

    // Send response
    res.json({
      type: 'submit',
      verdict: finalVerdict,
      passed: testResults.allPassed,
      allPassed: testResults.allPassed,
      visibleTestsPassed: visiblePassed,
      totalVisibleTests: visibleTestCases.length,
      hiddenTestsPassed: hiddenPassed,
      totalHiddenTests: hiddenTestCases.length,
      questionScore: questionScore,
      totalTestCases: testResults.results.length,
      passedCount: testResults.results.filter(r => r.passed).length,
      executionTime: testResults.avgTime,
      testResults: sanitizedTestResults,
      leaderboard,
      contestEnded: allDone,
      firstFailure: sanitizedFirstFailure
    });

  } catch (error) {
    console.error('Submit error:', error);
    res.status(500).json({ error: 'Submission failed', details: error.message });
  }
});

// ============================================
// ENDPOINT 3: Get leaderboard
// ============================================
router.get('/leaderboard/:contestId', async (req, res) => {
  try {
    const contest = await Contest.findOne({ contestId: req.params.contestId });
    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' });
    }

    const leaderboard = contest.participants
      .map(p => ({
        username: p.username,
        score: p.score || 0,
        problemsSolved: p.problemsSolved,
        totalTime: p.totalTime,
        finished: p.finished || false
      }))
      .sort((a, b) => {
        // Primary: Higher score first
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        // Secondary: Lower time first (tie-breaker)
        return a.totalTime - b.totalTime;
      });

    res.json(leaderboard);

  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// ============================================
// Export
// ============================================
module.exports = router;
module.exports.setIO = setIO;