import { AccountMapper } from '@src/use-cases/account/mapper';
import { AccountRepository } from './account.repository';
import { prismaTest } from 'jest.setup';
import { setupDatabaseLifecycle } from 'test/helpers/base-test';
import { genAccount } from 'test/prefab/account';
import { genUser } from 'test/prefab/user';
import { autoParseFilters } from '@src/util/prisma/parse-filters';

setupDatabaseLifecycle();

describe('AccountRepository', () => {
  const repository = new AccountRepository(prismaTest);

  it('should create an account', async () => {
    const { users, ...accountData } = genAccount();
    const created = await repository.create(accountData);
    expect(created.id).toBe(accountData.id);
    expect(created.name).toBe(accountData.name);
  });

  it('should find account by id with users', async () => {
    const { users, ...accountData } = genAccount();
    const account = await repository.create(accountData);

    const userData = genUser();
    await prismaTest.user.create({ data: userData });
    await prismaTest.userAccount.create({
      data: {
        userId: userData.id,
        accountId: account.id,
      },
    });

    const found = await repository.findById(account.id);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(account.id);
    expect(found?.users.length).toBe(1);
    expect(found?.users[0].user.id).toBe(userData.id);
  });

  it('should find accounts using filters and pagination', async () => {
    const { users: usersA, ...accountAData } = genAccount({ name: 'Conta A' });
    const { users: usersB, ...accountBData } = genAccount({ name: 'Conta B' });
    const accountA = await repository.create(accountAData);
    const accountB = await repository.create(accountBData);

    const [results, total] = await repository.findWhere({
      page: 1,
      limit: 10,
      filters: autoParseFilters({ name: 'Conta' }),
    });

    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(total).toBeGreaterThanOrEqual(2);
    expect(results.map(a => a.name)).toEqual(
      expect.arrayContaining([accountA.name, accountB.name]),
    );
  });
});
