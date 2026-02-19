module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/src/tests/**/*.test.js',
    '**/src/tests/**/*.spec.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/src/utils/testSetup.js'],
  reporters: [
    'default',
    [
      'jest-html-reporter',
      {
        pageTitle: 'Bantr API Test Report',
        outputPath: './jest-html-report.html',
        includeFailureMsg: true,
        includeSuiteFailure: true,
        theme: 'lightTheme',
        logo: '',
        executionTimeWarningThreshold: 5,
        dateFormat: 'yyyy-mm-dd HH:MM:ss'
      }
    ]
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/tests/**',
    '!src/utils/testSetup.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 30000,
  verbose: true,
  detectOpenHandles: true,
  forceExit: true
};