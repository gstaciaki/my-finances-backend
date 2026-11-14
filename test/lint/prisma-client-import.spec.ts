import { ESLint } from 'eslint';

// Etapa 9: só src/database/**, test/** e jest.setup.ts podem importar o valor `PrismaClient`.
const RULE = '@typescript-eslint/no-restricted-imports';

const lint = async (filePath: string, code: string) => {
  const eslint = new ESLint({ cwd: process.cwd() });
  const [result] = await eslint.lintText(code, { filePath });
  return result.messages.filter(message => message.ruleId === RULE);
};

describe('lint: PrismaClient import restriction', () => {
  const useCase = 'src/use-cases/user/create-user/temp.ts';

  it.each([
    [
      '@src/generated/prisma/client',
      "import { PrismaClient } from '@src/generated/prisma/client';",
    ],
    ['@prisma/client', "import { PrismaClient } from '@prisma/client';"],
    ['a relative path', "import { PrismaClient } from '../../../generated/prisma/client';"],
  ])('forbids the PrismaClient value from %s in a use case', async (_, code) => {
    const messages = await lint(useCase, `${code}\nexport const client = PrismaClient;\n`);

    expect(messages.length).toBeGreaterThan(0);
  });

  it('allows import type', async () => {
    const code =
      "import type { PrismaClient } from '@src/generated/prisma/client';\nexport type T = PrismaClient;\n";

    expect(await lint(useCase, code)).toHaveLength(0);
  });

  it('allows other exports of the same module (Prisma, User, ...)', async () => {
    const code =
      "import { Prisma, User } from '@src/generated/prisma/client';\nexport type T = [Prisma.JsonObject, User];\n";

    expect(await lint(useCase, code)).toHaveLength(0);
  });

  it.each(['src/database/temp.ts', 'test/helpers/temp.ts', 'jest.setup.ts'])(
    'allows the PrismaClient value in %s',
    async filePath => {
      const code =
        "import { PrismaClient } from '@src/generated/prisma/client';\nexport const c = PrismaClient;\n";

      expect(await lint(filePath, code)).toHaveLength(0);
    },
  );
});
