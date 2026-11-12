import { PrismaClient } from '@src/generated/prisma/client';
import { cleanDatabase } from './base-test';

describe('cleanDatabase', () => {
  it('refuses to clean a database whose name does not end with _test', async () => {
    const client = {
      $queryRaw: jest.fn().mockResolvedValue([{ current_database: 'myfinances' }]),
      $executeRawUnsafe: jest.fn(),
    } as unknown as PrismaClient;

    await expect(cleanDatabase(client)).rejects.toThrow('Limpeza recusada');
    expect(client.$executeRawUnsafe).not.toHaveBeenCalled();
  });
});
