import { DeleteTransactionUseCase } from './delete-transaction.usecase';
import { ITransacationRepository } from '@src/repositories/transaction/transaction.repository';
import { NotFoundError } from '@src/errors/generic.errors';
import { InputValidationError } from '@src/errors/input-validation.error';
import { genTransaction } from 'test/prefab/transaction';
import { genAccount } from 'test/prefab/account';
import { expectWrong } from 'test/helpers/expect-wrong';
import { expectRight } from 'test/helpers/expect-right';

describe('DeleteTransactionUseCase', () => {
  let transactionRepo: jest.Mocked<ITransacationRepository>;
  let useCase: DeleteTransactionUseCase;

  beforeEach(() => {
    transactionRepo = {
      create: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findWhere: jest.fn(),
      update: jest.fn(),
    };

    useCase = new DeleteTransactionUseCase(transactionRepo);
  });

  describe('Validação de entrada', () => {
    it('deve retornar InputValidationError se ID é inválido', async () => {
      const input = {
        id: 'invalid-id',
      };

      const result = await useCase.run(input);
      const error = expectWrong(result);

      expect(error).toBeInstanceOf(InputValidationError);
    });

    it('deve retornar InputValidationError se ID está vazio', async () => {
      const input = {
        id: '',
      };

      const result = await useCase.run(input);
      const error = expectWrong(result);

      expect(error).toBeInstanceOf(InputValidationError);
    });

    it('deve retornar InputValidationError se ID não é fornecido', async () => {
      const input = {} as any;

      const result = await useCase.run(input);
      const error = expectWrong(result);

      expect(error).toBeInstanceOf(InputValidationError);
    });
  });

  describe('Regras de negócio', () => {
    it('deve retornar NotFoundError se a transação não existe', async () => {
      const input = {
        id: 'f2e6b5ca-0c4d-4f9f-908f-f9f3b2a7d211',
      };

      transactionRepo.findById.mockResolvedValue(null);

      const result = await useCase.run(input);
      const error = expectWrong(result);

      expect(transactionRepo.findById).toHaveBeenCalledWith(input.id);
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toContain('transação');
    });
  });

  describe('Deleção de transação com sucesso', () => {
    it('deve deletar a transação se ela existe', async () => {
      const account = genAccount();
      const transaction = genTransaction({ account });
      const input = {
        id: transaction.id,
      };

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
      transactionRepo.delete.mockResolvedValue(undefined);

      const result = await useCase.run(input);
      const deleted = expectRight(result);

      expect(transactionRepo.findById).toHaveBeenCalledWith(transaction.id);
      expect(transactionRepo.delete).toHaveBeenCalledWith(transaction.id);

      expect(deleted.id).toBe(transaction.id);
      expect(deleted.amount).toBe(transaction.amount);
      expect(deleted.description).toBe(transaction.description);
    });

    it('deve retornar a transação deletada com todos os dados', async () => {
      const account = genAccount();
      const transaction = genTransaction({ account, amount: 5000 });
      const input = {
        id: transaction.id,
      };

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
      transactionRepo.delete.mockResolvedValue(undefined);

      const result = await useCase.run(input);
      const deleted = expectRight(result);

      expect(deleted.id).toBe(transaction.id);
      expect(deleted.amount).toBe(5000);
      expect(deleted.description).toBe('Pagamento de aluguel');
      expect(deleted.account.id).toBe(account.id);
    });

    it('deve deletar transação com description null', async () => {
      const account = genAccount();
      const transaction = genTransaction({ account });
      const input = {
        id: transaction.id,
      };

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
      transactionRepo.delete.mockResolvedValue(undefined);

      const result = await useCase.run(input);
      const deleted = expectRight(result);

      expect(transactionRepo.delete).toHaveBeenCalledWith(transaction.id);
      expect(deleted.description).toBeNull();
    });

    it('deve chamar delete apenas uma vez', async () => {
      const account = genAccount();
      const transaction = genTransaction({ account });
      const input = {
        id: transaction.id,
      };

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
      transactionRepo.delete.mockResolvedValue(undefined);

      await useCase.run(input);

      expect(transactionRepo.delete).toHaveBeenCalledTimes(1);
      expect(transactionRepo.delete).toHaveBeenCalledWith(transaction.id);
    });
  });
});

