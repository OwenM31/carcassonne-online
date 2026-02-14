/**
 * @description Jest configuration for client unit tests.
 */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  collectCoverageFrom: ['<rootDir>/src/**/*.{ts,tsx}'],
  moduleNameMapper: {
    '^@carcassonne/shared(.*)$': '<rootDir>/../shared/src$1'
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.test.json' }]
  }
};
