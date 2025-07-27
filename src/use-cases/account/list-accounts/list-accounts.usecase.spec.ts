import { ListAccountsUseCase } from './list-accounts.usecase';
import { IAccountRepository } from '@src/repositories/account/account.repository';
import { genAccount } from 'test/prefab/account';
import { genUser } from 'test/prefab/user';
import { expectRight } from 'test/helpers/expect-right';
import { expectWrong } from 'test/helpers/expect-wrong';
import { InputValidationError } from '@src/errors/input-validation.error';
import { Account } from '@src/entities/account.entity';

describe('ListAccountsUseCase', () => {
  let accountRepo: jest.Mocked<IAccountRepository>;
  let useCase: ListAccountsUseCase;

  beforeEach(() => {
    accountRepo = {
      create: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findWhere: jest.fn(),
      update: jest.fn(),
    };

    useCase = new ListAccountsUseCase(accountRepo);
  });

  it('should validate input and return error for invalid page', async () => {
    const input = { page: 'not-a-number' as any };

    const result = await useCase.run(input);
    const error = expectWrong(result);

    expect(error).toBeInstanceOf(InputValidationError);
  });

  it('should return paginated accounts with their users', async () => {
    const user1 = genUser();
    const user2 = genUser();
    const account = genAccount({ users: [user1, user2] });

    accountRepo.findWhere.mockResolvedValueOnce([
      [
        {
          ...account,
          users: [
            { accountId: account.id, user: user1, userId: user1.id },
            { accountId: account.id, user: user2, userId: user2.id },
          ],
        },
      ],
      1,
    ]);

    const input = { page: 1, limit: 10 };
    const result = await useCase.run(input);
    const success = expectRight(result);

    expect(accountRepo.findWhere).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 10 }),
    );
    expect(success.data).toHaveLength(1);
    expect(success.data[0]).toBeInstanceOf(Account);
    expect(success.data[0].users).toHaveLength(2);
    expect(success.pagination).toEqual({
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    });
  });

  it('should set default filters if not seted on input', async () => {
    const account = genAccount();

    accountRepo.findWhere.mockResolvedValueOnce([[{ ...account, users: [] }], 1]);

    const result = await useCase.run({});
    const success = expectRight(result);

    expect(accountRepo.findWhere).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        limit: 10,
      }),
    );
    expect(success.data).toHaveLength(1);
    expect(success.data[0]).toBeInstanceOf(Account);
    expect(success.data[0].users).toHaveLength(0);
    expect(success.pagination).toEqual({
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    });
  });

  it('should return empty list if no accounts are found', async () => {
    accountRepo.findWhere.mockResolvedValueOnce([[], 0]);

    const input = { page: 1, limit: 10 };
    const result = await useCase.run(input);
    const success = expectRight(result);

    expect(success.data).toEqual([]);
    expect(success.pagination.total).toBe(0);
    expect(success.pagination.totalPages).toBe(0);
  });
});
