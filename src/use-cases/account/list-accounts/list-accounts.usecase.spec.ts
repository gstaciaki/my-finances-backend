import { ListAccountsUseCase } from './list-accounts.usecase';
import { genAccount } from 'test/prefab/account';
import { genUser } from 'test/prefab/user';
import { expectRight } from 'test/helpers/expect-right';
import { expectWrong } from 'test/helpers/expect-wrong';
import { InputValidationError } from '@src/errors/input-validation.error';
import { ListAccountsWithUsersQuery } from '@src/queries/account/list-accounts-with-users.query';

describe('ListAccountsUseCase', () => {
  let listAccountsWithUsersQuery: jest.Mocked<ListAccountsWithUsersQuery>;
  let useCase: ListAccountsUseCase;

  beforeEach(() => {
    listAccountsWithUsersQuery = {
      execute: jest.fn(),
      // eslint-disable-next-line
    } as any;

    useCase = new ListAccountsUseCase(listAccountsWithUsersQuery);
  });

  it('should validate input and return error for invalid page', async () => {
    const input = { page: 'not-a-number' };

    // @ts-expect-error the intention here is to use a wrong type
    const result = await useCase.run(input);
    const error = expectWrong(result);

    expect(error).toBeInstanceOf(InputValidationError);
  });

  it('should return paginated accounts with their users', async () => {
    const user1 = genUser();
    const user2 = genUser();
    const users = [user1, user2];
    const account = genAccount({ users });

    listAccountsWithUsersQuery.execute.mockResolvedValueOnce({
      data: [account],
      total: 1,
    });

    const input = { page: 1, limit: 10 };
    const result = await useCase.run(input);
    const success = expectRight(result);

    expect(listAccountsWithUsersQuery.execute).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 10 }),
    );
    expect(success.data).toHaveLength(1);
    expect(success.data[0].users).toHaveLength(2);
    expect(success.pagination).toEqual({
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    });
  });

  it('should set default filters if not provided in input', async () => {
    const account = genAccount({ users: [] });

    listAccountsWithUsersQuery.execute.mockResolvedValueOnce({
      data: [account],
      total: 1,
    });

    const result = await useCase.run({
      page: 1,
      limit: 10,
    });
    const success = expectRight(result);

    expect(listAccountsWithUsersQuery.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        limit: 10,
      }),
    );
    expect(success.data).toHaveLength(1);
    expect(success.data[0].users).toHaveLength(0);
    expect(success.pagination).toEqual({
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    });
  });

  it('should return empty list if no accounts are found', async () => {
    listAccountsWithUsersQuery.execute.mockResolvedValueOnce({
      data: [],
      total: 0,
    });

    const input = { page: 1, limit: 10 };
    const result = await useCase.run(input);
    const success = expectRight(result);

    expect(success.data).toEqual([]);
    expect(success.pagination.total).toBe(0);
    expect(success.pagination.totalPages).toBe(0);
  });
});
