import { ListTransactionsUseCase } from './list-transactions.usecase';
import { ITransacationRepository } from '@src/repositories/transaction/transaction.repository';
import { IAccountRepository } from '@src/repositories/account/account.repository';
import { NotFoundError } from '@src/errors/generic.errors';
import { InputValidationError } from '@src/errors/input-validation.error';
import { genTransaction } from 'test/prefab/transaction';
import { genAccount } from 'test/prefab/account';
import { expectWrong } from 'test/helpers/expect-wrong';
import { expectRight } from 'test/helpers/expect-right';
import { DECIMAL_PLACES_LIMIT } from '@src/util/zod/currency';
import { ListTransactionsInput } from '../dtos';

describe('ListTransactionsUseCase', () => {
  let transactionRepo: jest.Mocked<ITransacationRepository>;
  let accountRepo: jest.Mocked<IAccountRepository>;
  let useCase: ListTransactionsUseCase;

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

    useCase = new ListTransactionsUseCase(transactionRepo, accountRepo);
  });

  describe('Validação de entrada', () => {
    it('deve retornar InputValidationError se accountId não for fornecido', async () => {
      const input = {
        page: 1,
        limit: 10,
      } as ListTransactionsInput;

      const result = await useCase.run(input);
      const error = expectWrong(result);

      expect(error).toBeInstanceOf(InputValidationError);
    });

    it('deve retornar InputValidationError se accountId não for um UUID válido', async () => {
      const input = {
        accountId: 'invalid-uuid',
        page: 1,
        limit: 10,
      };

      const result = await useCase.run(input);
      const error = expectWrong(result);

      expect(error).toBeInstanceOf(InputValidationError);
    });

    it('deve retornar InputValidationError se page for inválido', async () => {
      const account = genAccount();
      const input = {
        accountId: account.id,
        page: 'not-a-number',
        limit: 10,
      };

      // @ts-expect-error the intention here is to use a wrong type
      const result = await useCase.run(input);
      const error = expectWrong(result);

      expect(error).toBeInstanceOf(InputValidationError);
    });

    it('deve retornar InputValidationError se limit for inválido', async () => {
      const account = genAccount();
      const input = {
        accountId: account.id,
        page: 1,
        limit: 'not-a-number',
      };

      // @ts-expect-error the intention here is to use a wrong type
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
        accountId,
        page: 1,
        limit: 10,
      };

      const result = await useCase.run(input);
      const error = expectWrong(result);

      expect(accountRepo.findById).toHaveBeenCalledWith(accountId);
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toContain('conta');
    });
  });

  describe('Listagem de transações com sucesso', () => {
    it('deve retornar transações paginadas se a conta existe', async () => {
      const account = genAccount();
      const transaction1 = genTransaction({ account, amount: 1000 });
      const transaction2 = genTransaction({ account, amount: 2000 });

      const dbTransactions = [
        {
          id: transaction1.id,
          amount: 1000 * Math.pow(10, DECIMAL_PLACES_LIMIT),
          description: transaction1.description,
          accountId: account.id,
          createdAt: transaction1.createdAt,
          updatedAt: transaction1.updatedAt,
        },
        {
          id: transaction2.id,
          amount: 2000 * Math.pow(10, DECIMAL_PLACES_LIMIT),
          description: transaction2.description,
          accountId: account.id,
          createdAt: transaction2.createdAt,
          updatedAt: transaction2.updatedAt,
        },
      ];

      accountRepo.findById.mockResolvedValueOnce(account);
      transactionRepo.findWhere.mockResolvedValueOnce([dbTransactions, 2]);

      const input = {
        accountId: account.id,
        page: 1,
        limit: 10,
      };

      const result = await useCase.run(input);
      const returned = expectRight(result);

      expect(accountRepo.findById).toHaveBeenCalledWith(account.id);
      expect(transactionRepo.findWhere).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        filters: {},
      });

      expect(returned.data).toHaveLength(2);
      expect(returned.data[0].amount).toBe('1000.0000');
      expect(returned.data[1].amount).toBe('2000.0000');
      expect(returned.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      });
    });

    it('deve usar valores padrão de paginação se não fornecidos', async () => {
      const account = genAccount();
      const transaction = genTransaction({ account, amount: 3000 });

      const dbTransactions = [
        {
          id: transaction.id,
          amount: 3000 * Math.pow(10, DECIMAL_PLACES_LIMIT),
          description: transaction.description,
          accountId: account.id,
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt,
        },
      ];

      accountRepo.findById.mockResolvedValueOnce(account);
      transactionRepo.findWhere.mockResolvedValueOnce([dbTransactions, 1]);

      const input = {
        accountId: account.id,
        page: 1,
        limit: 10,
      };

      const result = await useCase.run(input);
      const returned = expectRight(result);

      expect(transactionRepo.findWhere).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        filters: {},
      });

      expect(returned.data).toHaveLength(1);
      expect(returned.pagination.page).toBe(1);
      expect(returned.pagination.limit).toBe(10);
    });

    it('deve retornar lista vazia se não houver transações', async () => {
      const account = genAccount();

      accountRepo.findById.mockResolvedValueOnce(account);
      transactionRepo.findWhere.mockResolvedValueOnce([[], 0]);

      const input = {
        accountId: account.id,
        page: 1,
        limit: 10,
      };

      const result = await useCase.run(input);
      const returned = expectRight(result);

      expect(returned.data).toEqual([]);
      expect(returned.pagination.total).toBe(0);
      expect(returned.pagination.totalPages).toBe(0);
    });

    it('deve aplicar paginação corretamente para múltiplas páginas', async () => {
      const account = genAccount();
      const transactions = Array.from({ length: 5 }, (_, i) => {
        const t = genTransaction({ account, amount: (i + 1) * 1000 });
        return {
          id: t.id,
          amount: (i + 1) * 1000 * Math.pow(10, DECIMAL_PLACES_LIMIT),
          description: t.description,
          accountId: account.id,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        };
      });

      accountRepo.findById.mockResolvedValueOnce(account);
      transactionRepo.findWhere.mockResolvedValueOnce([transactions, 25]);

      const input = {
        accountId: account.id,
        page: 2,
        limit: 5,
      };

      const result = await useCase.run(input);
      const returned = expectRight(result);

      expect(transactionRepo.findWhere).toHaveBeenCalledWith({
        page: 2,
        limit: 5,
        filters: {},
      });

      expect(returned.data).toHaveLength(5);
      expect(returned.pagination).toEqual({
        page: 2,
        limit: 5,
        total: 25,
        totalPages: 5,
      });
    });

    it('deve retornar transações com description null', async () => {
      const account = genAccount();
      const transaction = genTransaction({ account, amount: 1500 });

      const dbTransactions = [
        {
          id: transaction.id,
          amount: 1500 * Math.pow(10, DECIMAL_PLACES_LIMIT),
          description: null,
          accountId: account.id,
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt,
        },
      ];

      accountRepo.findById.mockResolvedValueOnce(account);
      transactionRepo.findWhere.mockResolvedValueOnce([dbTransactions, 1]);

      const input = {
        accountId: account.id,
        page: 1,
        limit: 10,
      };

      const result = await useCase.run(input);
      const returned = expectRight(result);

      expect(returned.data).toHaveLength(1);
      expect(returned.data[0].description).toBeNull();
    });

    it('deve manter valores corretos de amount para todas as transações', async () => {
      const account = genAccount();
      const transactions = [
        {
          id: genTransaction().id,
          amount: 1000 * Math.pow(10, DECIMAL_PLACES_LIMIT),
          description: 'Trans 1',
          accountId: account.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: genTransaction().id,
          amount: 2500 * Math.pow(10, DECIMAL_PLACES_LIMIT),
          description: 'Trans 2',
          accountId: account.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: genTransaction().id,
          amount: 7500 * Math.pow(10, DECIMAL_PLACES_LIMIT),
          description: 'Trans 3',
          accountId: account.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      accountRepo.findById.mockResolvedValueOnce(account);
      transactionRepo.findWhere.mockResolvedValueOnce([transactions, 3]);

      const input = {
        accountId: account.id,
        page: 1,
        limit: 10,
      };

      const result = await useCase.run(input);
      const returned = expectRight(result);

      expect(returned.data).toHaveLength(3);
      expect(returned.data[0].amount).toBe('1000.0000');
      expect(returned.data[1].amount).toBe('2500.0000');
      expect(returned.data[2].amount).toBe('7500.0000');
    });
  });
});
