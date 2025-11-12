import { UpdateTransactionUseCase } from './update-transaction.usecase';
import { ITransacationRepository } from '@src/repositories/transaction/transaction.repository';
import { IAccountRepository } from '@src/repositories/account/account.repository';
import { NotFoundError } from '@src/errors/generic.errors';
import { InputValidationError } from '@src/errors/input-validation.error';
import { genTransaction } from 'test/prefab/transaction';
import { genAccount } from 'test/prefab/account';
import { expectWrong } from 'test/helpers/expect-wrong';
import { expectRight } from 'test/helpers/expect-right';
import { DECIMAL_PLACES_LIMIT } from '@src/util/zod/currency';

describe('UpdateTransactionUseCase', () => {
  let transactionRepo: jest.Mocked<ITransacationRepository>;
  let accountRepo: jest.Mocked<IAccountRepository>;
  let useCase: UpdateTransactionUseCase;

  beforeEach(() => {
    transactionRepo = {
      create: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findWhere: jest.fn(),
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

    useCase = new UpdateTransactionUseCase(transactionRepo, accountRepo);
  });

  describe('Validação de entrada', () => {
    it('deve retornar InputValidationError se ID é inválido', async () => {
      const account = genAccount();
      const input = {
        id: 'not-a-uuid',
        accountId: account.id,
        amount: 1000,
      };

      const result = await useCase.run(input);
      const error = expectWrong(result);

      expect(error).toBeInstanceOf(InputValidationError);
    });

    it('deve retornar InputValidationError se accountId é inválido', async () => {
      const transaction = genTransaction();
      const input = {
        id: transaction.id,
        accountId: 'not-a-uuid',
        amount: 1000,
      };

      const result = await useCase.run(input);
      const error = expectWrong(result);

      expect(error).toBeInstanceOf(InputValidationError);
    });

    it('deve retornar InputValidationError se ID não é fornecido', async () => {
      const account = genAccount();
      const input = {
        accountId: account.id,
        amount: 1000,
      } as any;

      const result = await useCase.run(input);
      const error = expectWrong(result);

      expect(error).toBeInstanceOf(InputValidationError);
    });
  });

  describe('Regras de negócio', () => {
    it('deve retornar NotFoundError se a conta não existe', async () => {
      const account = genAccount();
      const transaction = genTransaction({ account });
      const input = {
        id: transaction.id,
        accountId: account.id,
        amount: 2000,
      };

      accountRepo.findById.mockResolvedValue(null);

      const result = await useCase.run(input);
      const error = expectWrong(result);

      expect(accountRepo.findById).toHaveBeenCalledWith(account.id);
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toContain('conta');
    });

    it('deve retornar NotFoundError se a transação não existe', async () => {
      const account = genAccount();
      const transaction = genTransaction({ account });
      const input = {
        id: transaction.id,
        accountId: account.id,
        amount: 2000,
      };

      accountRepo.findById.mockResolvedValue(account);
      transactionRepo.findById.mockResolvedValue(null);

      const result = await useCase.run(input);
      const error = expectWrong(result);

      expect(transactionRepo.findById).toHaveBeenCalledWith(input.id);
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toContain('transação');
    });

    it('deve retornar NotFoundError se a transação não pertence à conta', async () => {
      const account = genAccount();
      const anotherAccount = genAccount();
      const transaction = genTransaction({ account: anotherAccount, amount: 1000 });

      const dbTransaction = {
        id: transaction.id,
        amount: 1000 * Math.pow(10, DECIMAL_PLACES_LIMIT),
        description: 'Original',
        accountId: anotherAccount.id,
        account: anotherAccount,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      };

      const input = {
        id: transaction.id,
        accountId: account.id,
        amount: 2000,
      };

      accountRepo.findById.mockResolvedValue(account);
      transactionRepo.findById.mockResolvedValue(dbTransaction as any);

      const result = await useCase.run(input);
      const error = expectWrong(result);

      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toContain('transação');
    });
  });

  describe('Atualização de transação com sucesso', () => {
    it('deve atualizar a transação se o input é válido e a transação existe', async () => {
      const account = genAccount();
      const transaction = genTransaction({ account, amount: 1000 });
      const input = {
        id: transaction.id,
        accountId: account.id,
        amount: 2000,
        description: 'Atualizado',
      };

      const dbTransaction = {
        id: transaction.id,
        amount: 1000 * Math.pow(10, DECIMAL_PLACES_LIMIT),
        description: 'Original',
        accountId: account.id,
        account: account,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      };

      accountRepo.findById.mockResolvedValue(account);
      transactionRepo.findById.mockResolvedValue(dbTransaction as any);
      transactionRepo.update.mockResolvedValue(dbTransaction as any);

      const result = await useCase.run(input);
      const updated = expectRight(result);

      expect(accountRepo.findById).toHaveBeenCalledWith(account.id);
      expect(transactionRepo.findById).toHaveBeenCalledWith(input.id);
      expect(transactionRepo.update).toHaveBeenCalledWith(
        input.id,
        expect.objectContaining({
          amount: input.amount * Math.pow(10, DECIMAL_PLACES_LIMIT),
          description: input.description,
          accountId: account.id,
        }),
      );

      expect(updated.amount).toBe('2000.0000');
      expect(updated.description).toBe(input.description);
      expect(updated.id).toBe(transaction.id);
    });

    it('deve atualizar apenas o amount da transação', async () => {
      const account = genAccount();
      const transaction = genTransaction({ account, amount: 1000 });
      const input = {
        id: transaction.id,
        accountId: account.id,
        amount: 3000,
      };

      const dbTransaction = {
        id: transaction.id,
        amount: 1000 * Math.pow(10, DECIMAL_PLACES_LIMIT),
        description: 'Descrição original',
        accountId: account.id,
        account: account,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      };

      accountRepo.findById.mockResolvedValue(account);
      transactionRepo.findById.mockResolvedValue(dbTransaction as any);
      transactionRepo.update.mockResolvedValue(dbTransaction as any);

      const result = await useCase.run(input);
      const updated = expectRight(result);

      expect(transactionRepo.update).toHaveBeenCalledWith(
        input.id,
        expect.objectContaining({
          amount: input.amount * Math.pow(10, DECIMAL_PLACES_LIMIT),
          accountId: account.id,
        }),
      );

      expect(updated.amount).toBe('3000.0000');
      expect(updated.id).toBe(transaction.id);
    });

    it('deve atualizar apenas a description da transação', async () => {
      const account = genAccount();
      const transaction = genTransaction({ account, amount: 1000 });
      const input = {
        id: transaction.id,
        accountId: account.id,
        description: 'Nova descrição',
      };

      const dbTransaction = {
        id: transaction.id,
        amount: 1000 * Math.pow(10, DECIMAL_PLACES_LIMIT),
        description: 'Original',
        accountId: account.id,
        account: account,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      };

      accountRepo.findById.mockResolvedValue(account);
      transactionRepo.findById.mockResolvedValue(dbTransaction as any);
      transactionRepo.update.mockResolvedValue(dbTransaction as any);

      const result = await useCase.run(input);
      const updated = expectRight(result);

      expect(transactionRepo.update).toHaveBeenCalledWith(
        input.id,
        expect.objectContaining({
          description: input.description,
          accountId: account.id,
        }),
      );

      expect(updated.description).toBe(input.description);
      expect(updated.id).toBe(transaction.id);
    });

    it('deve atualizar description para null', async () => {
      const account = genAccount();
      const transaction = genTransaction({ account, amount: 1000 });
      const input = {
        id: transaction.id,
        accountId: account.id,
        description: null,
      };

      const dbTransaction = {
        id: transaction.id,
        amount: 1000 * Math.pow(10, DECIMAL_PLACES_LIMIT),
        description: 'Descrição existente',
        accountId: account.id,
        account: account,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      };

      accountRepo.findById.mockResolvedValue(account);
      transactionRepo.findById.mockResolvedValue(dbTransaction as any);
      transactionRepo.update.mockResolvedValue(dbTransaction as any);

      const result = await useCase.run(input);
      const updated = expectRight(result);

      expect(transactionRepo.update).toHaveBeenCalledWith(
        input.id,
        expect.objectContaining({
          description: null,
          accountId: account.id,
        }),
      );

      expect(updated.description).toBeNull();
    });

    it('deve preservar o accountId ao atualizar', async () => {
      const account = genAccount();
      const transaction = genTransaction({ account, amount: 1000 });
      const input = {
        id: transaction.id,
        accountId: account.id,
        amount: 5000,
      };

      const dbTransaction = {
        id: transaction.id,
        amount: 1000 * Math.pow(10, DECIMAL_PLACES_LIMIT),
        description: 'Descrição',
        accountId: account.id,
        account: account,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      };

      accountRepo.findById.mockResolvedValue(account);
      transactionRepo.findById.mockResolvedValue(dbTransaction as any);
      transactionRepo.update.mockResolvedValue(dbTransaction as any);

      const result = await useCase.run(input);
      const updated = expectRight(result);

      expect(transactionRepo.update).toHaveBeenCalledWith(
        input.id,
        expect.objectContaining({
          accountId: account.id,
        }),
      );

      expect(updated.amount).toBe('5000.0000');
    });
  });
});
