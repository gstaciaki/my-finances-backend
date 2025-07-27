import { GetAccountUseCase } from './get-account.usecase';
import { IAccountRepository } from '@src/repositories/account/account.repository';
import { NotFoundError } from '@src/errors/generic.errors';
import { InputValidationError } from '@src/errors/input-validation.error';
import { expectRight } from 'test/helpers/expect-right';
import { expectWrong } from 'test/helpers/expect-wrong';
import { genAccount } from 'test/prefab/account';
import { genUser } from 'test/prefab/user';
import { AccountMapper } from '../mapper';

describe('GetAccountUseCase', () => {
  let accountRepo: jest.Mocked<IAccountRepository>;
  let useCase: GetAccountUseCase;

  beforeEach(() => {
    accountRepo = {
      create: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findWhere: jest.fn(),
      update: jest.fn(),
    };

    useCase = new GetAccountUseCase(accountRepo);
  });

  it('should return InputValidationError if id is invalid', async () => {
    const input = { id: 'not-a-uuid' };

    const result = await useCase.run(input);
    const error = expectWrong(result);

    expect(error).toBeInstanceOf(InputValidationError);
  });

  it('should return NotFoundError if account does not exist', async () => {
    const input = { id: '9e6b2b49-4b76-438b-8e1f-9a4eebd9bb44' };
    accountRepo.findById.mockResolvedValue(null);

    const result = await useCase.run(input);
    const error = expectWrong(result);

    expect(accountRepo.findById).toHaveBeenCalledWith(input.id);
    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('should return the account with users if found', async () => {
    const user1 = genUser();
    const user2 = genUser();
    const users = [user1, user2];
    const account = genAccount({
      users,
    });

    accountRepo.findById.mockResolvedValue(AccountMapper.toPrisma(account, users));

    const result = await useCase.run({ id: account.id });
    const returned = expectRight(result);

    expect(returned.id).toBe(account.id);
    expect(returned.users).toHaveLength(2);
    expect(returned.users.map(u => u.id)).toEqual([user1.id, user2.id]);
  });

  it('should return the account with an empty users array if found', async () => {
    const account = genAccount();

    accountRepo.findById.mockResolvedValue(AccountMapper.toPrisma(account));

    const result = await useCase.run({ id: account.id });
    const returned = expectRight(result);

    expect(returned.id).toBe(account.id);
    expect(returned.users).toHaveLength(0);
  });
});
