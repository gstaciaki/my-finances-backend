import { ITransacationRepository } from '@src/repositories/transaction/transaction.repository';
import { IAccountRepository } from '@src/repositories/account/account.repository';
import { NotFoundError } from '@src/errors/generic.errors';
import { InputValidationError } from '@src/errors/input-validation.error';
import { Transaction } from '@src/entities/transaction.entity';
import { genAccount } from 'test/prefab/account';
import { genTransaction } from 'test/prefab/transaction';
import { expectWrong } from 'test/helpers/expect-wrong';
import { expectRight } from 'test/helpers/expect-right';
import { CreateTransactionUseCase } from './create-transaction.usecase';

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

      expect(transaction).toBeInstanceOf(Transaction);
      expect(transaction.amount).toBe(input.amount);
      expect(transaction.description).toBe(input.description);
      expect(transaction.account.id).toBe(account.id);

      expect(accountRepo.findById).toHaveBeenCalledWith(account.id);
      expect(transactionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: input.amount,
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

      expect(transaction).toBeInstanceOf(Transaction);
      expect(transaction.amount).toBe(input.amount);
      expect(transaction.description).toBeNull();
      expect(transaction.account.id).toBe(account.id);

      expect(accountRepo.findById).toHaveBeenCalledWith(account.id);
      expect(transactionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: input.amount,
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

      expect(transaction).toBeInstanceOf(Transaction);
      expect(transaction.amount).toBe(input.amount);
      expect(transaction.description).toBeNull();
      expect(transaction.account.id).toBe(account.id);

      expect(accountRepo.findById).toHaveBeenCalledWith(account.id);
      expect(transactionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: input.amount,
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

      expect(transaction).toBeInstanceOf(Transaction);
      expect(transaction.amount).toBe(1);

      expect(transactionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 1,
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

      expect(transaction).toBeInstanceOf(Transaction);
      expect(transaction.amount).toBe(largeAmount);

      expect(transactionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: largeAmount,
        }),
      );
    });
  });
});
