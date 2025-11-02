import { TransactionRepository } from './transaction.repository';
import { prismaTest } from 'jest.setup';
import { setupDatabaseLifecycle } from 'test/helpers/base-test';
import { genTransaction } from 'test/prefab/transaction';
import { genAccount } from 'test/prefab/account';
import { AccountRepository } from '../account/account.repository';

setupDatabaseLifecycle();

describe('TransactionRepository', () => {
  const repository = new TransactionRepository(prismaTest);
  const accountRepository = new AccountRepository(prismaTest);

  it('should create a transaction', async () => {
    const account = genAccount();
    await accountRepository.create(account);

    const data = genTransaction({ account });
    const created = await repository.create({
      id: data.id,
      description: data.description ?? null,
      amount: data.amount,
      accountId: account.id,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });

    expect(created.id).toBe(data.id);
    expect(created.description).toBe(data.description);
    expect(created.amount).toBe(data.amount);
    expect(created.accountId).toBe(account.id);
  });

  it('should find a transaction by id', async () => {
    const account = genAccount();
    await accountRepository.create(account);

    const data = genTransaction({ account });
    await repository.create({
      id: data.id,
      description: data.description ?? null,
      amount: data.amount,
      accountId: account.id,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });

    const found = await repository.findById(data.id);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(data.id);
    expect(found?.description).toBe(data.description);
  });

  it('should update a transaction', async () => {
    const account = genAccount();
    await accountRepository.create(account);

    const data = genTransaction({ account });
    await repository.create({
      id: data.id,
      description: data.description ?? null,
      amount: data.amount,
      accountId: account.id,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });

    const newDescription = 'Updated Transaction Description';
    const updated = await repository.update(data.id, { description: newDescription });
    expect(updated.description).toBe(newDescription);
  });

  it('should delete a transaction', async () => {
    const account = genAccount();
    await accountRepository.create(account);

    const data = genTransaction({ account });
    await repository.create({
      id: data.id,
      description: data.description ?? null,
      amount: data.amount,
      accountId: account.id,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });

    await repository.delete(data.id);
    const found = await repository.findById(data.id);
    expect(found).toBeNull();
  });

  it('should return all transactions', async () => {
    const account = genAccount();
    await accountRepository.create(account);

    const transaction1 = genTransaction({ account });
    const transaction2 = genTransaction({ account });

    await repository.create({
      id: transaction1.id,
      description: transaction1.description ?? null,
      amount: transaction1.amount,
      accountId: account.id,
      createdAt: transaction1.createdAt,
      updatedAt: transaction1.updatedAt,
    });
    await repository.create({
      id: transaction2.id,
      description: transaction2.description ?? null,
      amount: transaction2.amount,
      accountId: account.id,
      createdAt: transaction2.createdAt,
      updatedAt: transaction2.updatedAt,
    });

    const transactions = await repository.findAll();
    expect(transactions.length).toEqual(2);
  });

  it('should create multiple transactions for different accounts', async () => {
    const account1 = genAccount();
    const account2 = genAccount();
    await accountRepository.create(account1);
    await accountRepository.create(account2);

    const transaction1 = genTransaction({ account: account1 });
    const transaction2 = genTransaction({ account: account2 });

    await repository.create({
      id: transaction1.id,
      description: transaction1.description ?? null,
      amount: transaction1.amount,
      accountId: account1.id,
      createdAt: transaction1.createdAt,
      updatedAt: transaction1.updatedAt,
    });
    await repository.create({
      id: transaction2.id,
      description: transaction2.description ?? null,
      amount: transaction2.amount,
      accountId: account2.id,
      createdAt: transaction2.createdAt,
      updatedAt: transaction2.updatedAt,
    });

    const transactions = await repository.findAll();
    expect(transactions.length).toEqual(2);

    const accountIds = transactions.map(t => t.accountId);
    expect(accountIds).toContain(account1.id);
    expect(accountIds).toContain(account2.id);
  });
});
