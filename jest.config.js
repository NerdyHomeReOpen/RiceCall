module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/index.ts',
    '!src/**/*.schema.ts',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/__tests__/**',
    '!src/types/**/*.ts',
  ],
  coverageReporters: ['text', 'lcov', 'clover', 'html'],
  verbose: true,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // 如果遇到 ESM 相關問題，可能需要解除下面這行的註解
  // extensionsToTreatAsEsm: ['.ts'],
  // globals: { // ts-jest < 29 (舊版)
  //   'ts-jest': {
  //     tsconfig: 'tsconfig.json', // 指定 tsconfig.json 路徑
  //   },
  // },
  // transform: { // ts-jest >= 29 (新版，preset 通常已處理)
  //   '^.+\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  // },
};
