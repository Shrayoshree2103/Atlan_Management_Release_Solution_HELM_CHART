/**
 * Flakiness Detection System
 * 
 * This script analyzes test results to identify flaky tests and manage them.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const FLAKINESS_THRESHOLD = 0.1; // 10% failure rate to be considered flaky
const QUARANTINE_THRESHOLD = 0.3; // 30% failure rate to be quarantined
const HISTORY_SIZE = 20; // Number of test runs to consider

// Test history database (simplified for demo)
let testHistory = {};
try {
  testHistory = JSON.parse(fs.readFileSync('./test-history.json', 'utf8'));
} catch (error) {
  console.log('No existing test history found, starting fresh');
  testHistory = {};
}

/**
 * Record test results for flakiness analysis
 */
function recordTestResults(testResults) {
  const timestamp = new Date().toISOString();
  
  testResults.forEach(result => {
    const testId = `${result.file}::${result.name}`;
    
    if (!testHistory[testId]) {
      testHistory[testId] = {
        runs: [],
        quarantined: false,
        lastUpdated: timestamp
      };
    }
    
    // Add the new result
    testHistory[testId].runs.push({
      timestamp,
      passed: result.status === 'passed',
      duration: result.duration,
      error: result.status === 'failed' ? result.errorMessage : null
    });
    
    // Limit history size
    if (testHistory[testId].runs.length > HISTORY_SIZE) {
      testHistory[testId].runs.shift();
    }
    
    testHistory[testId].lastUpdated = timestamp;
  });
  
  // Save updated history
  fs.writeFileSync('./test-history.json', JSON.stringify(testHistory, null, 2));
  
  // Analyze for flakiness
  analyzeFlakiness();
}

/**
 * Analyze test history for flakiness
 */
function analyzeFlakiness() {
  const flakyTests = [];
  const testsToQuarantine = [];
  const testsToReleaseFromQuarantine = [];
  
  Object.entries(testHistory).forEach(([testId, data]) => {
    if (data.runs.length < 5) {
      // Not enough data yet
      return;
    }
    
    // Calculate failure rate
    const failureRate = data.runs.filter(run => !run.passed).length / data.runs.length;
    
    // Check for flakiness
    const isFlaky = failureRate > 0 && failureRate < FLAKINESS_THRESHOLD;
    const shouldQuarantine = failureRate >= QUARANTINE_THRESHOLD;
    
    if (isFlaky) {
      flakyTests.push({ testId, failureRate });
    }
    
    // Manage quarantine status
    if (shouldQuarantine && !data.quarantined) {
      testsToQuarantine.push(testId);
      testHistory[testId].quarantined = true;
    } else if (!shouldQuarantine && data.quarantined) {
      testsToReleaseFromQuarantine.push(testId);
      testHistory[testId].quarantined = false;
    }
  });
  
  // Report findings
  console.log(`Found ${flakyTests.length} flaky tests.`);
  flakyTests.forEach(test => {
    console.log(`- ${test.testId}: ${(test.failureRate * 100).toFixed(1)}% failure rate`);
  });
  
  if (testsToQuarantine.length > 0) {
    console.log(`Quarantining ${testsToQuarantine.length} tests:`);
    testsToQuarantine.forEach(testId => console.log(`- ${testId}`));
    
    // Update quarantine list
    updateQuarantineList();
  }
  
  if (testsToReleaseFromQuarantine.length > 0) {
    console.log(`Releasing ${testsToReleaseFromQuarantine.length} tests from quarantine:`);
    testsToReleaseFromQuarantine.forEach(testId => console.log(`- ${testId}`));
    
    // Update quarantine list
    updateQuarantineList();
  }
}

/**
 * Update the quarantine list for the test runner
 */
function updateQuarantineList() {
  const quarantinedTests = Object.entries(testHistory)
    .filter(([_, data]) => data.quarantined)
    .map(([testId, _]) => testId);
  
  fs.writeFileSync('./quarantine-list.json', JSON.stringify(quarantinedTests, null, 2));
  console.log(`Updated quarantine list with ${quarantinedTests.length} tests`);
}

// Example usage
const sampleResults = [
  { file: 'api/user.test.js', name: 'should create user', status: 'passed', duration: 120 },
  { file: 'api/auth.test.js', name: 'should authenticate user', status: 'failed', errorMessage: 'Timeout' },
  { file: 'ui/dashboard.test.js', name: 'should render dashboard', status: 'passed', duration: 350 }
];

// Record these results
recordTestResults(sampleResults);

module.exports = { recordTestResults, analyzeFlakiness };