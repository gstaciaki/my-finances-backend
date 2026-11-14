import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';

// Fora de src/database/, o valor `PrismaClient` não pode ser importado: o cliente puro
// ignora actor, auditoria e bloqueios. Código da aplicação usa o `DbClient` (ou o `prisma`
// estendido) de `@src/database`. `import type` continua liberado.
const prismaClientRestriction = {
  paths: [
    { name: '@prisma/client', importNames: ['PrismaClient'], allowTypeImports: true },
    {
      name: '@src/generated/prisma/client',
      importNames: ['PrismaClient'],
      allowTypeImports: true,
    },
  ],
  patterns: [
    {
      group: ['**/generated/prisma/client'],
      importNames: ['PrismaClient'],
      allowTypeImports: true,
      message: 'Use o DbClient de @src/database. O PrismaClient puro só vale em src/database/.',
    },
  ],
};

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      prettier,
    },
    rules: {
      'prettier/prettier': 'error',
    },
  },
  {
    files: ['**/*.ts'],
    ignores: ['src/database/**', 'test/**', 'jest.setup.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': ['error', prismaClientRestriction],
    },
  },
];
