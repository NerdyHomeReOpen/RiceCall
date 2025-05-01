module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.test.js'],
    collectCoverage: true,
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
      'socket/**/*.js',
      'utils/**/*.js',
      'index.js',
      '!**/node_modules/**',
      '!**/coverage/**',
      '!**/__tests__/**',
    ],
    coverageReporters: ['text', 'lcov', 'clover', 'html'],
    verbose: true,
  };
  