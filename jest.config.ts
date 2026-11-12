/** @type {import('jest').Config} */
const { compilerOptions } = require('./tsconfig.json');
const { pathsToModuleNameMapper } = require('ts-jest');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths || {}, {
    prefix: '<rootDir>/',
  }),
  moduleFileExtensions: ['ts', 'js', 'json'],
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],
  // Módulos fora da compilação até as tabelas serem recriadas (ver tsconfig.json)
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/src/controllers/(account|transaction)/',
    '<rootDir>/src/use-cases/(account|transaction)/',
    '<rootDir>/src/repositories/(account|transaction)/',
  ],
};
