import { UpdateAccountUseCase } from './update-account.usecase';
import { IAccountRepository } from '@src/repositories/account/account.repository';
import { NotFoundError } from '@src/errors/generic.errors';
import { InputValidationError } from '@src/errors/input-validation.error';
import { genAccount } from 'test/prefab/account';
import { expectWrong } from 'test/helpers/expect-wrong';
import { expectRight } from 'test/helpers/expect-right';
import { AccountMapper } from '../mapper';

describe('UpdateAccountUseCase', () => {
  let accountRepo: jest.Mocked<IAccountRepository>;
  let useCase: UpdateAccountUseCase;

  beforeEach(() => {
    accountRepo = {
      create: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findWhere: jest.fn(),
      update: jest.fn(),
    };

    useCase = new UpdateAccountUseCase(accountRepo);
  });

  it('should return InputValidationError if ID is invalid', async () => {
    const input = {
      id: 'not-a-uuid',
      name: 'Nova Conta',
    };

    const result = await useCase.run(input);
    const error = expectWrong(result);

    expect(error).toBeInstanceOf(InputValidationError);
  });

  it('should return NotFoundError if account does not exist', async () => {
    const input = {
      id: 'ea9be323-c6c9-47d5-8ec9-8fb122f20192',
      name: 'Conta Atualizada',
    };

    accountRepo.findById.mockResolvedValue(null);

    const result = await useCase.run(input);
    const error = expectWrong(result);

    expect(accountRepo.findById).toHaveBeenCalledWith(input.id);
    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('should update account if input is valid and account exists', async () => {
    const account = genAccount();
    const input = {
      id: account.id,
      name: 'Nome Atualizado',
    };

    accountRepo.findById.mockResolvedValue(AccountMapper.toPrisma(account));
    accountRepo.update.mockResolvedValue(AccountMapper.toPrisma({ ...account, ...input }));

    const result = await useCase.run(input);
    const updated = expectRight(result);

    expect(accountRepo.findById).toHaveBeenCalledWith(input.id);
    expect(accountRepo.update).toHaveBeenCalledWith(
      input.id,
      expect.objectContaining({
        name: input.name,
      }),
    );

    expect(updated.name).toBe(input.name);
    expect(updated.id).toBe(account.id);
  });
});
