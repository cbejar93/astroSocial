'use strict';

const path = require('path');

const G   = '\x1b[32m'; // green
const R   = '\x1b[31m'; // red
const Y   = '\x1b[33m'; // yellow
const X   = '\x1b[0m';  // reset
const B   = '\x1b[1m';  // bold
const DIM = '\x1b[2m';  // dim

class GreenReporter {
  constructor(globalConfig) {
    this._globalConfig = globalConfig;
    this._startTime = Date.now();
  }

  onRunStart() {
    this._startTime = Date.now();
  }

  onTestResult(_test, testResult) {
    const passing = testResult.numFailingTests === 0;
    const rel = path.relative(process.cwd(), testResult.testFilePath);
    const ms = testResult.perfStats
      ? testResult.perfStats.end - testResult.perfStats.start
      : 0;
    const duration = (ms / 1000).toFixed(3);

    const badge = passing ? `${G}${B}PASS${X}` : `${R}${B}FAIL${X}`;
    process.stdout.write(`${badge} ${rel} (${duration} s)\n`);

    const tests = testResult.testResults;
    let lastAncestors = [];

    for (const t of tests) {
      const ancestors = t.ancestorTitles;

      // Print new describe block headers as we enter each level
      for (let i = 0; i < ancestors.length; i++) {
        if (lastAncestors[i] !== ancestors[i]) {
          const indent = '  '.repeat(i + 1);
          process.stdout.write(`${indent}${ancestors[i]}\n`);
        }
      }
      lastAncestors = ancestors;

      const indent = '  '.repeat(ancestors.length + 1);
      const dur = t.duration != null ? `${DIM} (${t.duration} ms)${X}` : '';

      if (t.status === 'passed') {
        process.stdout.write(`${indent}${G}✓ ${t.title}${X}${dur}\n`);
      } else if (t.status === 'failed') {
        process.stdout.write(`${indent}${R}${B}✗ ${t.title}${X}${dur}\n`);
        for (const msg of t.failureMessages) {
          const lines = msg.split('\n');
          const atIdx = lines.findIndex(l => l.trim().startsWith('at '));
          const errorLines = (atIdx > 0 ? lines.slice(0, atIdx) : lines.slice(0, 3))
            .filter(l => l.trim())
            .slice(0, 3);
          for (const line of errorLines) {
            process.stdout.write(`${indent}  ${R}${line.trim()}${X}\n`);
          }
          // Show the first stack frame from user code (not node_modules)
          const userFrame = lines.find(
            l => l.trim().startsWith('at ') && !l.includes('node_modules'),
          );
          if (userFrame) {
            process.stdout.write(`${indent}  ${DIM}${userFrame.trim()}${X}\n`);
          }
        }
      } else {
        process.stdout.write(`${indent}${Y}○ ${t.title}${X}${dur}\n`);
      }
    }

    process.stdout.write('\n');
  }

  onRunComplete(_contexts, results) {
    const elapsed = ((Date.now() - this._startTime) / 1000).toFixed(3);
    const {
      numPassedTests,
      numFailedTests,
      numPendingTests,
      numTotalTests,
      numPassedTestSuites,
      numFailedTestSuites,
      numTotalTestSuites,
    } = results;

    const suiteFailed = numFailedTestSuites > 0
      ? `${R}${B}${numFailedTestSuites} failed${X}, ` : '';
    const testFailed = numFailedTests > 0
      ? `${R}${B}${numFailedTests} failed${X}, ` : '';
    const pending = numPendingTests > 0
      ? `, ${Y}${numPendingTests} skipped${X}` : '';

    process.stdout.write(`\nTest Suites: ${suiteFailed}${G}${numPassedTestSuites} passed${X}, ${numTotalTestSuites} total\n`);
    process.stdout.write(`Tests:       ${testFailed}${G}${numPassedTests} passed${X}${pending}, ${numTotalTests} total\n`);
    process.stdout.write(`Time:        ${elapsed} s\n\n`);
  }
}

module.exports = GreenReporter;
