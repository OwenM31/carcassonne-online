/**
 * @description Jest configuration for server unit tests.
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  moduleFileExtensions: ['ts', 'js'],
  collectCoverageFrom: ['<rootDir>/src/**/*.ts'],
  moduleNameMapper: {
    '^@carcassonne/shared(.*)$': '<rootDir>/../shared/src$1'
  }
};
