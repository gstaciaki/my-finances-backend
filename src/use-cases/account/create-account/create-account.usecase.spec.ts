import { IUserRepository } from '@src/repositories/user/user.repository';
import { IAccountRepository } from '@src/repositories/account/account.repository';
import { IUserAccountRepository } from '@src/repositories/user-account/user-account.repository';
import { NotFoundError } from '@src/errors/generic.errors';
import { InputValidationError } from '@src/errors/input-validation.error';
import { Account } from '@src/entities/account.entity';
import { genUser } from 'test/prefab/user';
import { CreateAccountUseCase } from './create-account.usecase';
import { genAccount } from 'test/prefab/account';
import { expectWrong } from 'test/helpers/expect-wrong';
import { expectRight } from 'test/helpers/expect-right';

describe('CreateAccountUseCase', () => {
  let usersRepo: jest.Mocked<IUserRepository>;
  let accountRepo: jest.Mocked<IAccountRepository>;
  let userAccountRepo: jest.Mocked<IUserAccountRepository>;
  let useCase: CreateAccountUseCase;

  beforeEach(() => {
    usersRepo = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      findWhere: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    };

    accountRepo = {
      create: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findWhere: jest.fn(),
      update: jest.fn(),
    };

    userAccountRepo = {
      create: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      findWhere: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
    };

    useCase = new CreateAccountUseCase(accountRepo, usersRepo, userAccountRepo);
  });

  it('should return InputValidationError if name is empty', async () => {
    const input = {
      name: '',
      usersIds: [],
    };

    const result = await useCase.run(input);
    const error = expectWrong(result);

    expect(error).toBeInstanceOf(InputValidationError);
  });

  it('should return InputValidationError if userIds are invalid', async () => {
    const input = {
      name: 'Minha Conta',
      usersIds: ['invalid-uuid'],
    };

    const result = await useCase.run(input);
    const error = expectWrong(result);

    expect(error).toBeInstanceOf(InputValidationError);
  });

  it('should return NotFoundError if any user does not exist', async () => {
    const userId = '8fbc8d5b-e815-4f3e-b6c0-64ec6212a4fa';
    usersRepo.findById.mockResolvedValueOnce(null);

    const input = {
      name: 'Conta com usuário inválido',
      usersIds: [userId],
    };

    const result = await useCase.run(input);
    const error = expectWrong(result);

    expect(usersRepo.findById).toHaveBeenCalledWith(userId);
    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('should create account and link users if all are valid', async () => {
    const user1 = genUser();
    const user2 = genUser();

    const usersMap = {
      [user1.id]: user1,
      [user2.id]: user2,
    };

    usersRepo.findById.mockImplementation(async (id: string) => usersMap[id] || null);
    accountRepo.create.mockResolvedValue(genAccount());
    userAccountRepo.create.mockImplementation(async ({ userId, accountId }) => ({
      userId,
      accountId,
    }));

    const input = {
      name: 'Conta Teste',
      usersIds: [user1.id, user2.id],
    };

    const result = await useCase.run(input);
    const account = expectRight(result);

    expect(account).toBeInstanceOf(Account);
    expect(account.name).toBe(input.name);

    expect(accountRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: input.name,
      }),
    );

    expect(userAccountRepo.create).toHaveBeenCalledTimes(2);
    expect(userAccountRepo.create).toHaveBeenCalledWith({
      userId: user1.id,
      accountId: account.id,
    });
    expect(userAccountRepo.create).toHaveBeenCalledWith({
      userId: user2.id,
      accountId: account.id,
    });
  });
});
