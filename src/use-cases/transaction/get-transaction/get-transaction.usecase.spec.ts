import { GetTransactionUseCase } from './get-transaction.usecase';
import { ITransacationRepository } from '@src/repositories/transaction/transaction.repository';
import { IAccountRepository } from '@src/repositories/account/account.repository';
import { NotFoundError } from '@src/errors/generic.errors';
import { InputValidationError } from '@src/errors/input-validation.error';
import { expectRight } from 'test/helpers/expect-right';
import { expectWrong } from 'test/helpers/expect-wrong';
import { genTransaction } from 'test/prefab/transaction';
import { genAccount } from 'test/prefab/account';
import { formatCurrencyToOutput } from '@src/util/currency';
import { DECIMAL_PLACES_LIMIT } from '@src/util/zod/currency';
import { GetTransactionInput } from '../dtos';

describe('GetTransactionUseCase', () => {
  let transactionRepo: jest.Mocked<ITransacationRepository>;
  let accountRepo: jest.Mocked<IAccountRepository>;
  let useCase: GetTransactionUseCase;

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

    useCase = new GetTransactionUseCase(transactionRepo, accountRepo);
  });

  describe('Validação de entrada', () => {
    it('deve retornar InputValidationError se id é inválido', async () => {
      const account = genAccount();
      const input = { id: 'not-a-uuid', accountId: account.id };

      const result = await useCase.run(input);
      const error = expectWrong(result);

      expect(error).toBeInstanceOf(InputValidationError);
    });

    it('deve retornar InputValidationError se accountId é inválido', async () => {
      const transaction = genTransaction();
      const input = { id: transaction.id, accountId: 'not-a-uuid' };

      const result = await useCase.run(input);
      const error = expectWrong(result);

      expect(error).toBeInstanceOf(InputValidationError);
    });

    it('deve retornar InputValidationError se id não é fornecido', async () => {
      const account = genAccount();
      const input = { accountId: account.id } as GetTransactionInput;

      const result = await useCase.run(input);
      const error = expectWrong(result);

      expect(error).toBeInstanceOf(InputValidationError);
    });

    it('deve retornar InputValidationError se accountId não é fornecido', async () => {
      const transaction = genTransaction();
      const input = { id: transaction.id } as GetTransactionInput;

      const result = await useCase.run(input);
      const error = expectWrong(result);

      expect(error).toBeInstanceOf(InputValidationError);
    });
  });

  describe('Regras de negócio', () => {
    it('deve retornar NotFoundError se a conta não existe', async () => {
      const account = genAccount();
      const transaction = genTransaction({ account });
      const input = { id: transaction.id, accountId: account.id };

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
      const input = { id: transaction.id, accountId: account.id };

      accountRepo.findById.mockResolvedValue(account);
      transactionRepo.findById.mockResolvedValue(null);

      const result = await useCase.run(input);
      const error = expectWrong(result);

      expect(transactionRepo.findById).toHaveBeenCalledWith(transaction.id);
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toContain('transação');
    });

    it('deve retornar NotFoundError se a transação não pertence à conta', async () => {
      const account = genAccount();
      const anotherAccount = genAccount();
      const transaction = genTransaction({ account: anotherAccount });

      const dbTransaction = {
        id: transaction.id,
        amount: transaction.amount * Math.pow(10, DECIMAL_PLACES_LIMIT),
        description: transaction.description,
        accountId: anotherAccount.id,
        account: anotherAccount,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      };

      const input = { id: transaction.id, accountId: account.id };

      accountRepo.findById.mockResolvedValue(account);
      transactionRepo.findById.mockResolvedValue(dbTransaction);

      const result = await useCase.run(input);
      const error = expectWrong(result);

      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toContain('transação');
    });
  });

  describe('Busca de transação com sucesso', () => {
    it('deve retornar a transação se ela existe', async () => {
      const account = genAccount();
      const transaction = genTransaction({ account, amount: 5000 });

      const dbTransaction = {
        id: transaction.id,
        amount: 5000 * Math.pow(10, DECIMAL_PLACES_LIMIT),
        description: transaction.description,
        accountId: account.id,
        account: account,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      };

      accountRepo.findById.mockResolvedValue(account);
      transactionRepo.findById.mockResolvedValue(dbTransaction);

      const result = await useCase.run({ id: transaction.id, accountId: account.id });
      const returned = expectRight(result);

      expect(transactionRepo.findById).toHaveBeenCalledWith(transaction.id);
      expect(returned.id).toBe(transaction.id);
      expect(returned.amount).toBe(formatCurrencyToOutput(dbTransaction.amount));
      expect(returned.description).toBe(transaction.description);
    });

    it('deve retornar a transação com description null', async () => {
      const account = genAccount();
      const transaction = genTransaction({ account, amount: 2500 });

      const dbTransaction = {
        id: transaction.id,
        amount: 2500 * Math.pow(10, DECIMAL_PLACES_LIMIT),
        description: null,
        accountId: account.id,
        account: account,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      };

      accountRepo.findById.mockResolvedValue(account);
      transactionRepo.findById.mockResolvedValue(dbTransaction);

      const result = await useCase.run({ id: transaction.id, accountId: account.id });
      const returned = expectRight(result);

      expect(returned.id).toBe(transaction.id);
      expect(returned.description).toBeNull();
    });

    it('deve retornar a transação com todos os campos preenchidos', async () => {
      const account = genAccount();
      const transaction = genTransaction({ account, amount: 7500 });

      const dbTransaction = {
        id: transaction.id,
        amount: 7500 * Math.pow(10, DECIMAL_PLACES_LIMIT),
        description: 'Pagamento de aluguel',
        accountId: account.id,
        account: account,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      };

      accountRepo.findById.mockResolvedValue(account);
      transactionRepo.findById.mockResolvedValue(dbTransaction);

      const result = await useCase.run({ id: transaction.id, accountId: account.id });
      const returned = expectRight(result);

      expect(returned.id).toBe(transaction.id);
      expect(returned.amount).toBe('7500.0000');
      expect(returned.description).toBe('Pagamento de aluguel');
    });
  });
});
