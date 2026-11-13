/** @type {import('jest').Config} */
// O Jest carrega esta config como CommonJS: um `import` do JSON não expõe `compilerOptions`
// e exige `module` esnext/nodenext no tsconfig, então o `require` é intencional.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { compilerOptions } = require('./tsconfig.json');

// Converte os `paths` do tsconfig em moduleNameMapper (o swc não resolve aliases).
const moduleNameMapper = Object.fromEntries(
  Object.entries<string[]>(compilerOptions.paths ?? {}).map(([alias, [target]]) => [
    `^${alias.replace('.', '\\.').replace('*', '(.*)')}$`,
    `<rootDir>/${target.replace(/^\.\//, '').replace('*', '$1')}`,
  ]),
);

module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // swc só transpila; a checagem de tipos fica com o `tsc --noEmit`.
  transform: {
    '^.+\\.ts$': ['@swc/jest', { jsc: { parser: { syntax: 'typescript' }, target: 'es2022' } }],
  },
  moduleNameMapper,
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
