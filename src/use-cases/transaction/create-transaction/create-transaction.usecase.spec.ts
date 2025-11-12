import { ITransacationRepository } from '@src/repositories/transaction/transaction.repository';
import { IAccountRepository } from '@src/repositories/account/account.repository';
import { NotFoundError } from '@src/errors/generic.errors';
import { InputValidationError } from '@src/errors/input-validation.error';
import { Transaction } from '@src/entities/transaction.entity';
import { genAccount } from 'test/prefab/account';
import { expectWrong } from 'test/helpers/expect-wrong';
import { expectRight } from 'test/helpers/expect-right';
import { CreateTransactionUseCase } from './create-transaction.usecase';
import { formatCurrencyToOutput } from '@src/util/currency';
import { DECIMAL_PLACES_LIMIT } from '@src/util/zod/currency';

describe('CreateTransactionUseCase', () => {
  let transactionRepo: jest.Mocked<ITransacationRepository>;
  let accountRepo: jest.Mocked<IAccountRepository>;
  let useCase: CreateTransactionUseCase;

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

    useCase = new CreateTransactionUseCase(transactionRepo, accountRepo);
  });

  describe('Validação de entrada', () => {
    it('deve retornar InputValidationError se amount não for fornecido', async () => {
      const input = {
        accountId: genAccount().id,
      } as any;

      const result = await useCase.run(input);
      const error = expectWrong(result);

      expect(error).toBeInstanceOf(InputValidationError);
    });

    it('deve retornar InputValidationError se accountId não for fornecido', async () => {
      const input = {
        amount: 1000,
      } as any;

      const result = await useCase.run(input);
      const error = expectWrong(result);

      expect(error).toBeInstanceOf(InputValidationError);
    });

    it('deve retornar InputValidationError se accountId não for um UUID válido', async () => {
      const input = {
        amount: 1000,
        accountId: 'invalid-uuid',
      };

      const result = await useCase.run(input);
      const error = expectWrong(result);

      expect(error).toBeInstanceOf(InputValidationError);
    });

    it('deve retornar InputValidationError se accountId for vazio', async () => {
      const input = {
        amount: 1000,
        accountId: '',
      };

      const result = await useCase.run(input);
      const error = expectWrong(result);

      expect(error).toBeInstanceOf(InputValidationError);
    });
  });

  describe('Regras de negócio', () => {
    it('deve retornar NotFoundError se a conta não existir', async () => {
      const accountId = genAccount().id;
      accountRepo.findById.mockResolvedValueOnce(null);

      const input = {
        amount: 1000,
        accountId,
        description: 'Compra no supermercado',
      };

      const result = await useCase.run(input);
      const error = expectWrong(result);

      expect(accountRepo.findById).toHaveBeenCalledWith(accountId);
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toContain('conta');
    });
  });

  describe('Criação de transação com sucesso', () => {
    it('deve criar uma transação com description', async () => {
      const account = genAccount();
      accountRepo.findById.mockResolvedValueOnce(account);

      const input = {
        amount: 5000,
        accountId: account.id,
        description: 'Pagamento de aluguel',
      };

      const result = await useCase.run(input);
      const transaction = expectRight(result);

      expect(transaction).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          amount: expect.any(String),
          description: expect.anything(),
          accountId: account.id,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        }),
      );
      expect(transaction.amount).toBe('5000.0000');
      expect(transaction.description).toBe(input.description);
      expect(transaction.accountId).toBe(account.id);

      expect(accountRepo.findById).toHaveBeenCalledWith(account.id);
      expect(transactionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: input.amount * Math.pow(10, DECIMAL_PLACES_LIMIT),
          description: input.description,
          accountId: account.id,
        }),
      );
    });

    it('deve criar uma transação sem description', async () => {
      const account = genAccount();
      accountRepo.findById.mockResolvedValueOnce(account);

      const input = {
        amount: 2500,
        accountId: account.id,
      };

      const result = await useCase.run(input);
      const transaction = expectRight(result);

      expect(transaction).toEqual({
        id: expect.any(String),
        amount: expect.any(String),
        description: null,
        accountId: account.id,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
      expect(transaction.amount).toBe('2500.0000');
      expect(transaction.description).toBeNull();
      expect(transaction.accountId).toBe(account.id);

      expect(accountRepo.findById).toHaveBeenCalledWith(account.id);
      expect(transactionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: input.amount * Math.pow(10, DECIMAL_PLACES_LIMIT),
          accountId: account.id,
        }),
      );
    });

    it('deve criar uma transação com description null explícito', async () => {
      const account = genAccount();
      accountRepo.findById.mockResolvedValueOnce(account);

      const input = {
        amount: 1500,
        accountId: account.id,
        description: null,
      };

      const result = await useCase.run(input);
      const transaction = expectRight(result);

      expect(transaction).toEqual({
        id: expect.any(String),
        amount: expect.any(String),
        description: null,
        accountId: account.id,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
      expect(transaction.amount).toBe('1500.0000');
      expect(transaction.description).toBeNull();
      expect(transaction.accountId).toBe(account.id);

      expect(accountRepo.findById).toHaveBeenCalledWith(account.id);
      expect(transactionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: input.amount * Math.pow(10, DECIMAL_PLACES_LIMIT),
          description: null,
          accountId: account.id,
        }),
      );
    });

    it('deve criar uma transação com amount mínimo válido (1)', async () => {
      const account = genAccount();
      accountRepo.findById.mockResolvedValueOnce(account);

      const input = {
        amount: 1,
        accountId: account.id,
        description: 'Transação mínima',
      };

      const result = await useCase.run(input);
      const transaction = expectRight(result);

      expect(transaction).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          amount: expect.any(String),
          description: expect.anything(),
          accountId: account.id,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        }),
      );
      expect(transaction.amount).toBe('1.0000');

      expect(transactionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 10000,
        }),
      );
    });

    it('deve criar uma transação com amount grande', async () => {
      const account = genAccount();
      accountRepo.findById.mockResolvedValueOnce(account);

      const largeAmount = 999999999;

      const input = {
        amount: largeAmount,
        accountId: account.id,
        description: 'Transação grande',
      };

      const result = await useCase.run(input);
      const transaction = expectRight(result);

      expect(transaction).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          amount: expect.any(String),
          description: expect.anything(),
          accountId: account.id,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        }),
      );
      expect(transaction.amount).toBe('999999999.0000');

      expect(transactionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: largeAmount * Math.pow(10, DECIMAL_PLACES_LIMIT),
        }),
      );
    });
  });
});
