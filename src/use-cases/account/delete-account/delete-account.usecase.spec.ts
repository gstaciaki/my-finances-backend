import { DeleteAccountUseCase } from './delete-account.usecase';
import { IAccountRepository } from '@src/repositories/account/account.repository';
import { NotFoundError } from '@src/errors/generic.errors';
import { InputValidationError } from '@src/errors/input-validation.error';
import { genAccount } from 'test/prefab/account';
import { expectWrong } from 'test/helpers/expect-wrong';
import { expectRight } from 'test/helpers/expect-right';
import { AccountMapper } from '../mapper';

describe('DeleteAccountUseCase', () => {
  let accountRepo: jest.Mocked<IAccountRepository>;
  let useCase: DeleteAccountUseCase;

  beforeEach(() => {
    accountRepo = {
      create: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findWhere: jest.fn(),
      update: jest.fn(),
    };

    useCase = new DeleteAccountUseCase(accountRepo);
  });

  it('should return InputValidationError if ID is invalid', async () => {
    const input = {
      id: 'invalid-id',
    };

    const result = await useCase.run(input);
    const error = expectWrong(result);

    expect(error).toBeInstanceOf(InputValidationError);
  });

  it('should return NotFoundError if account does not exist', async () => {
    const input = {
      id: 'f2e6b5ca-0c4d-4f9f-908f-f9f3b2a7d211',
    };

    accountRepo.findById.mockResolvedValue(null);

    const result = await useCase.run(input);
    const error = expectWrong(result);

    expect(accountRepo.findById).toHaveBeenCalledWith(input.id);
    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('should delete account if it exists', async () => {
    const account = genAccount();
    const input = {
      id: account.id,
    };

    accountRepo.findById.mockResolvedValue(AccountMapper.toPrisma(account));
    accountRepo.delete.mockResolvedValue(undefined);

    const result = await useCase.run(input);
    const deleted = expectRight(result);

    expect(accountRepo.findById).toHaveBeenCalledWith(account.id);
    expect(accountRepo.delete).toHaveBeenCalledWith(account.id);

    expect(deleted.id).toBe(account.id);
    expect(deleted.name).toBe(account.name);
  });
});
