import { AccountRepository } from './account.repository';
import { prismaTest } from 'jest.setup';
import { setupDatabaseLifecycle } from 'test/helpers/base-test';
import { genAccount } from 'test/prefab/account';
import { Account } from '@src/entities/account.entity';

setupDatabaseLifecycle();

describe('AccountRepository', () => {
  const repository = new AccountRepository(prismaTest);

  it('should create an account', async () => {
    const data = genAccount();
    const created = await repository.create(data);
    expect(new Account(created)).toStrictEqual(data);
  });

  it('should find an account by id', async () => {
    const data = genAccount();
    await repository.create(data);

    const found = await repository.findById(data.id);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(data.id);
  });

  it('should update an account', async () => {
    const data = genAccount();
    await repository.create(data);

    const updated = await repository.update(data.id, { name: 'Updated Account' });
    expect(updated.name).toBe('Updated Account');
  });

  it('should delete an account', async () => {
    const data = genAccount();
    await repository.create(data);

    await repository.delete(data.id);
    const found = await repository.findById(data.id);
    expect(found).toBeNull();
  });

  it('should return all accounts', async () => {
    await repository.create(genAccount());
    await repository.create(genAccount());

    const accounts = await repository.findAll();
    expect(accounts.length).toEqual(2);
  });
});
