import { GetTransactionUseCase } from './get-transaction.usecase';
import { ITransacationRepository } from '@src/repositories/transaction/transaction.repository';
import { NotFoundError } from '@src/errors/generic.errors';
import { InputValidationError } from '@src/errors/input-validation.error';
import { expectRight } from 'test/helpers/expect-right';
import { expectWrong } from 'test/helpers/expect-wrong';
import { genTransaction } from 'test/prefab/transaction';
import { genAccount } from 'test/prefab/account';

describe('GetTransactionUseCase', () => {
  let transactionRepo: jest.Mocked<ITransacationRepository>;
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

    useCase = new GetTransactionUseCase(transactionRepo);
  });

  describe('Validação de entrada', () => {
    it('deve retornar InputValidationError se id é inválido', async () => {
      const input = { id: 'not-a-uuid' };

      const result = await useCase.run(input);
      const error = expectWrong(result);

      expect(error).toBeInstanceOf(InputValidationError);
    });

    it('deve retornar InputValidationError se id está vazio', async () => {
      const input = { id: '' };

      const result = await useCase.run(input);
      const error = expectWrong(result);

      expect(error).toBeInstanceOf(InputValidationError);
    });

    it('deve retornar InputValidationError se id não é fornecido', async () => {
      const input = {} as any;

      const result = await useCase.run(input);
      const error = expectWrong(result);

      expect(error).toBeInstanceOf(InputValidationError);
    });
  });

  describe('Regras de negócio', () => {
    it('deve retornar NotFoundError se a transação não existe', async () => {
      const input = { id: '9e6b2b49-4b76-438b-8e1f-9a4eebd9bb44' };

      transactionRepo.findById.mockResolvedValue(null);

      const result = await useCase.run(input);
      const error = expectWrong(result);

      expect(transactionRepo.findById).toHaveBeenCalledWith(input.id);
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toContain('transação');
    });
  });

  describe('Busca de transação com sucesso', () => {
    it('deve retornar a transação se ela existe', async () => {
      const account = genAccount();
      const transaction = genTransaction({ account });

      const dbTransaction = {
        id: transaction.id,
        amount: transaction.amount,
        description: transaction.description,
        accountId: account.id,
        account: account,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      };

      transactionRepo.findById.mockResolvedValue(dbTransaction);

      const result = await useCase.run({ id: transaction.id });
      const returned = expectRight(result);

      expect(transactionRepo.findById).toHaveBeenCalledWith(transaction.id);
      expect(returned.id).toBe(transaction.id);
      expect(returned.amount).toBe(transaction.amount);
      expect(returned.description).toBe(transaction.description);
      expect(returned.account.id).toBe(account.id);
    });

    it('deve retornar a transação com description null', async () => {
      const account = genAccount();
      const transaction = genTransaction({ account });

      const dbTransaction = {
        id: transaction.id,
        amount: transaction.amount,
        description: null,
        accountId: account.id,
        account: account,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      };

      transactionRepo.findById.mockResolvedValue(dbTransaction);

      const result = await useCase.run({ id: transaction.id });
      const returned = expectRight(result);

      expect(returned.id).toBe(transaction.id);
      expect(returned.description).toBeNull();
    });

    it('deve retornar a transação com todos os campos preenchidos', async () => {
      const account = genAccount();
      const transaction = genTransaction({ account, amount: 5000 });

      const dbTransaction = {
        id: transaction.id,
        amount: 5000,
        description: 'Pagamento de aluguel',
        accountId: account.id,
        account: account,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      };

      transactionRepo.findById.mockResolvedValue(dbTransaction);

      const result = await useCase.run({ id: transaction.id });
      const returned = expectRight(result);

      expect(returned.id).toBe(transaction.id);
      expect(returned.amount).toBe(5000);
      expect(returned.description).toBe('Pagamento de aluguel');
      expect(returned.account.id).toBe(account.id);
    });
  });
});

