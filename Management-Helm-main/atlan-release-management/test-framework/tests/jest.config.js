module.exports = {
    projects: [
      {
        displayName: 'unit',
        testMatch: ['<rootDir>/unit/**/*.test.js'],
        setupFilesAfterEnv: ['<rootDir>/setup/unit-setup.js'],
      },
      {
        displayName: 'integration',
        testMatch: ['<rootDir>/integration/**/*.test.js'],
        setupFilesAfterEnv: ['<rootDir>/setup/integration-setup.js'],
      },
      {
        displayName: 'e2e',
        testMatch: ['<rootDir>/e2e/**/*.test.js'],
        setupFilesAfterEnv: ['<rootDir>/setup/e2e-setup.js'],
        testTimeout: 30000,
      },
    ],
    maxWorkers: '50%', // Parallelize test execution
    bail: 0,
    verbose: true,
  };